import TrezorConnect from '@trezor/connect';
import { CoinjoinClient, RequestEvent, CoinjoinEvent, Round } from '@trezor/coinjoin';
import * as COINJOIN from './constants/coinjoinConstants';
import { goto } from '../suite/routerActions';
import { addToast } from '../suite/notificationActions';
import { add as addTransaction } from './transactionActions';
import {
    create as createAccount,
    update as updateAccountInfo,
    updateAccount,
} from './accountActions';
// import { getPendingAccount } from '@wallet-utils/accountUtils';
import { sanitizeAccount, getCoinjoinUrl } from '@wallet-utils/coinjoinUtils';
import type { Dispatch, GetState } from '@suite-types';
import type { Account, Network } from '@wallet-types';
import type { CoinjoinParameters } from '@wallet-types/coinjoin';

export type CoinJoinAction =
    | {
          type: typeof COINJOIN.ACCOUNT_LOAD;
          payload: {
              key: string;
              proof: string;
          };
      }
    | {
          type: typeof COINJOIN.ACCOUNT_AUTHORIZE_SUCCESS;
          account: Account;
          params: CoinjoinParameters;
      }
    | {
          type: typeof COINJOIN.ROUND_TX_SIGNED;
          accountKey: string;
          roundId: string;
      }
    | {
          type: typeof COINJOIN.ROUND_PHASE_CHANGED;
          accountKey: string;
          phase: number;
      }
    | {
          type: typeof COINJOIN.ROUND_COMPLETED;
          accountKey: string;
          roundId: string;
      }
    | {
          type: typeof COINJOIN.CLIENT_STATUS;
          payload: Round[];
      }
    | {
          type: typeof COINJOIN.CLIENT_LOG;
          payload: string;
      }
    | {
          type:
              | typeof COINJOIN.CLIENT_ENABLE
              | typeof COINJOIN.CLIENT_SUCCESS
              | typeof COINJOIN.CLIENT_FAILED
              | typeof COINJOIN.CLIENT_DISABLE
              | typeof COINJOIN.ACCOUNT_AUTHORIZE
              | typeof COINJOIN.ACCOUNT_AUTHORIZE_FAILED
              | typeof COINJOIN.ACCOUNT_DISABLE;
          payload: Account;
      };

const coinjoinClients: CoinjoinClient[] = [];

export const createCoinJoinAccount =
    (network: Network) => async (dispatch: Dispatch, getState: GetState) => {
        if (network.accountType !== 'coinjoin') return;

        // const client = await dispatch(intiCoinjoinClient(account));

        const { device } = getState().suite;

        // Disable safety_checks until Trezor FW will implement slip-0025
        // const safety =
        //     device?.features?.safety_checks !== 'PromptTemporarily'
        //         ? 'PromptTemporarily'
        //         : undefined;
        const exp = await TrezorConnect.applySettings({
            device,
            experimental_features: true,
            // safety_checks: safety,
        });
        if (!exp.success) {
            dispatch(addToast({ type: 'error', error: 'Experimental features not enabled' }));
            return;
        }

        const PATH = `m/86'/1'/25'`; // `m/10025'/1'/0'`  network.bip43Path

        // Get coinjoin account xpub
        const pk = await TrezorConnect.getPublicKey({
            device,
            useEmptyPassphrase: device?.useEmptyPassphrase,
            path: PATH,
            coin: network.symbol,
        });
        if (!pk.success) {
            dispatch(addToast({ type: 'error', error: 'Public key not given' }));
            return;
        }

        let account: Account;

        // Create empty account
        account = dispatch(
            createAccount(
                device!.state!,
                {
                    index: 0,
                    path: PATH,
                    accountType: network.accountType,
                    networkType: network.networkType,
                    coin: network.symbol,
                    derivationType: 0,
                },
                {
                    addresses: { change: [], used: [], unused: [] } as any,
                    availableBalance: '0',
                    balance: '0',
                    descriptor: pk.payload.xpubSegwit || pk.payload.xpub,
                    empty: true,
                    history: { total: 0, tokens: undefined, unconfirmed: 0 },
                    legacyXpub: pk.payload.xpub,
                    page: { index: 1, size: 25, total: 1 },
                    utxo: [],
                },
            ),
        ).payload as Account;

        // Make account visible and set "loading" flag
        account = dispatch(updateAccount({ ...account, visible: true, loading: 0 }))
            .payload as Account;

        // Switch to account
        dispatch(
            goto('wallet-index', {
                params: {
                    symbol: network.symbol,
                    accountType: network.accountType,
                    accountIndex: 0,
                },
            }),
        );

        const accountInfo = await TrezorConnect.getAccountInfo({
            descriptor: pk.payload.xpubSegwit || pk.payload.xpub,
            coin: network.symbol,
            details: 'txs',
        });

        if (!accountInfo.success) {
            console.log('No accountInfo');
            return;
        }

        // Temporary simulate account discovery by block filters
        let i = 0;
        const tick = () => {
            i += 10;
            if (i < 100) {
                account = dispatch(updateAccount({ ...account, loading: i })).payload as Account;
                setTimeout(tick, 1000);
            } else {
                // Finish loading
                dispatch(
                    updateAccountInfo({ ...account, loading: undefined }, accountInfo.payload),
                );
                if (accountInfo.payload.history.transactions) {
                    dispatch(addTransaction(accountInfo.payload.history.transactions, account));
                }
            }
        };
        setTimeout(tick, 1000);
    };

export const authorizeCoinJoin =
    (account: Account, client: CoinjoinClient, params: CoinjoinParameters) =>
    async (dispatch: Dispatch, getState: GetState) => {
        const device = getState().devices.find(d => d.state === account.deviceState);

        const { maxRounds, maxCoordinatorFeeRate, maxFeePerKvbyte } = params;

        const auth = await TrezorConnect.authorizeCoinJoin({
            device,
            useEmptyPassphrase: device?.useEmptyPassphrase,
            path: account.path,
            maxRounds, // desired anonim calc, from UI
            maxCoordinatorFeeRate, // constant, from coordinator status
            maxFeePerKvbyte, // from UI
            coordinator: 'CoinJoinCoordinatorIdentifier',
            coin: account.symbol,
        });
        if (!auth.success) {
            dispatch({
                type: COINJOIN.ACCOUNT_AUTHORIZE_FAILED,
                payload: account,
                error: auth.payload.error,
            });
            dispatch(
                addToast({
                    type: 'error',
                    error: `Coinjoin not authorized: ${auth.payload.error}`,
                }),
            );
            // TODO: stop client if not used (no accounts registered)
        } else {
            client.registerAccount(sanitizeAccount(account, params));

            dispatch({
                type: COINJOIN.ACCOUNT_AUTHORIZE_SUCCESS,
                account,
                params,
            });
        }
    };

const clientLog = (payload: any) => ({
    type: COINJOIN.CLIENT_LOG,
    payload,
});

const onCoinjoinClientEvent =
    (_network: Account['symbol'], event: CoinjoinEvent) =>
    (dispatch: Dispatch, getState: GetState) => {
        if (event.type === 'round-change') {
            const round = event.payload;
            const { registrations } = getState().wallet.coinjoin;
            const accountsInRound = Object.keys(round.accounts);

            const registrationsToUpdate = accountsInRound.flatMap(
                accountKey =>
                    registrations.find(r => r.accountKey === accountKey && !r.completed) || [],
            );

            // const client = coinjoinClients.find(c => c.settings.network === network);
            registrationsToUpdate.forEach(reg => {
                if (reg.phase !== round.phase) {
                    dispatch({
                        type: COINJOIN.ROUND_PHASE_CHANGED,
                        accountKey: reg.accountKey,
                        phase: round.phase,
                    });
                    if (round.phase === 4) {
                        if (reg.signedRounds.length === reg.maxRounds) {
                            // const account = getState().wallet.accounts.find(a => a.key === accountKey);
                            // client.unregisterAccount(reg.accountKey);
                            dispatch({
                                type: COINJOIN.ROUND_COMPLETED,
                                accountKey: reg.accountKey,
                                roundId: round.id,
                            });

                            dispatch(
                                addToast({
                                    type: 'coinjoin-complete',
                                }),
                            );
                        } else if (round.coinjoinState.isFullySigned) {
                            dispatch(
                                addToast({
                                    type: 'coinjoin-round-complete',
                                }),
                            );
                        }
                    }
                }
            });
        }
    };

const intiCoinjoinClient = (account: Account) => async (dispatch: Dispatch) => {
    const existingClient = coinjoinClients.find(c => c.settings.network === account.symbol);
    if (existingClient) {
        return existingClient;
    }

    dispatch({ type: COINJOIN.CLIENT_ENABLE, payload: account });

    const url = getCoinjoinUrl();
    const client = new CoinjoinClient({
        network: account.symbol as any, // TODO
        coordinatorName: 'CoinJoinCoordinatorIdentifier',
        coordinatorUrl: `${url}WabiSabi/`,
        middlewareUrl: `${url}Cryptography/`,
    });
    client.on('status', (_network, event) => console.log('Coinjoin on status', event));
    client.on('event', (network, event) => {
        dispatch(onCoinjoinClientEvent(network, event));
    });
    client.on('request', async (network, data) => {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        const response = await dispatch(onCoinjoinClientRequest(network, data));
        client.resolveRequest(response);
    });
    client.on('log', (_network, ...args: any[]) => {
        dispatch(clientLog(args.join(' ')));
    });

    const status = await client.enable();
    if (status) {
        coinjoinClients.push(client);
        dispatch({
            type: COINJOIN.CLIENT_SUCCESS,
            payload: account,
        });
        return client;
        // await dispatch(authorizeCoinJoin(account, client));
    }
    dispatch({
        type: COINJOIN.CLIENT_FAILED,
        payload: account,
    });
    dispatch(
        addToast({
            type: 'error',
            error: 'Coinjoin client not enabled',
        }),
    );
};

export const enableCoinJoin =
    (account: Account, params: CoinjoinParameters) => async (dispatch: Dispatch) => {
        const client = await dispatch(intiCoinjoinClient(account));
        if (client) {
            await dispatch(authorizeCoinJoin(account, client, params));
        }
    };

export const disableCoinJoin = (account: Account) => (dispatch: Dispatch, getState: GetState) => {
    const client = coinjoinClients.find(c => c.settings.network === account.symbol);
    const cjAccount = getState().wallet.coinjoin.accounts.find(a => a.accountKey === account.key);
    if (client && cjAccount) {
        client.unregisterAccount(account.key);

        dispatch({
            type: COINJOIN.ACCOUNT_DISABLE,
            payload: account,
        });

        // const registerAccounts = getState().wallet.coinjoin.accounts.filter(
        //     a => a.accountKey !== account.key,
        // );

        // if (registerAccounts.length < 1) {
        //     client.disable();
        //     const rest = coinjoinClients.filter(cli => cli !== client);
        //     coinjoinClients.splice(0);
        //     coinjoinClients.push(...rest);
        //     dispatch({
        //         type: COINJOIN.CLIENT_DISABLE,
        //         payload: account,
        //     });
        // }
    } else {
        // client not found? but present in reducer?
    }
};

export const restoreCoinJoin = () => (dispatch: Dispatch, getState: GetState) => {
    // TODO:
    // - find stored coinjoins
    // - check if device is connected and not locked
    // - check if online
    // - check if account exists
    const accounts = getState().wallet.accounts.filter(a => a.symbol === 'regtest' && a.visible);
    if (accounts.length > 0 || !accounts.length) return; // TEMP: skip restoring for now
    // async actions in sequence
    // TODO: handle client init error and do not proceed after first failure
    accounts.reduce(
        (p, account) => p.then(() => dispatch(enableCoinJoin(account, {} as any))),
        Promise.resolve(),
    );
};

export const updateCoinjoinAccount = (account: Account) => (_: Dispatch, getState: GetState) => {
    const params = getState().wallet.coinjoin.registrations.find(r => r.accountKey === account.key);
    const client = coinjoinClients.find(c => c.settings.network === account.symbol);
    if (client && params) {
        // client.updateAccount(sanitizeAccount(account, params));
        if (params.signedRounds.length === params.maxRounds) {
            client.unregisterAccount(account.key);
        } else {
            client.updateAccount(sanitizeAccount(account, params));
        }
    }
};

const getOwnershipProof =
    (network: Account['symbol'], request: Extract<RequestEvent, { type: 'ownership' }>) =>
    async (dispatch: Dispatch, getState: GetState) => {
        const {
            devices,
            wallet: { coinjoin, accounts },
        } = getState();

        console.warn('getOwnershipProof');

        const params = Object.keys(request.accounts).flatMap(key => {
            const registredAccount = coinjoin.registrations.find(
                r => r.accountKey === key && !r.completed,
            );
            const realAccount = accounts.find(a => a.key === key);
            if (!registredAccount || !realAccount) return []; // TODO not registered?
            const device = devices.find(d => d.state === realAccount.deviceState);
            const bundle = request.accounts[key].utxos.map(utxo => ({
                path: utxo.path,
                coin: network,
                commitmentData: request.commitmentData,
                userConfirmation: true,
                preauthorized: true,
            }));
            return { key, device, bundle };
        });

        if (params.length < 1) {
            Object.keys(request.accounts).forEach(key => {
                const { utxos } = request.accounts[key];
                request.accounts[key].utxos = utxos.map(utxo => ({
                    ...utxo,
                    error: 'no registered account to get proof', // TODO handle in lib
                }));
            });
        }

        // async actions in sequence
        await params.reduce(
            (p, { key, device, bundle }) =>
                p.then(async () => {
                    const proof = await TrezorConnect.getOwnershipProof({
                        device,
                        bundle,
                    });
                    const { utxos } = request.accounts[key];
                    if (proof.success) {
                        request.accounts[key].utxos = utxos.map((utxo, index) => ({
                            ...utxo,
                            ownershipProof: proof.payload[index].ownership_proof,
                        }));
                    } else {
                        request.accounts[key].utxos = utxos.map(utxo => ({
                            ...utxo,
                            error: 'no proof', // TODO handle in lib
                        }));
                        dispatch(
                            addToast({
                                type: 'error',
                                error: `Coinjoin sign getOwnershipProof: ${proof.payload.error}`,
                            }),
                        );
                    }
                }),
            Promise.resolve(),
        );

        return request;
    };

const signCoinjoinTx =
    (network: Account['symbol'], request: Extract<RequestEvent, { type: 'witness' }>) =>
    async (dispatch: Dispatch, getState: GetState) => {
        const {
            devices,
            wallet: { coinjoin, accounts },
        } = getState();

        const { transaction } = request;

        console.warn('signCoinjoinTx');

        const params = Object.keys(request.accounts).flatMap(key => {
            const registredAccount = coinjoin.registrations.find(
                r => r.accountKey === key && !r.completed,
            );
            const realAccount = accounts.find(a => a.key === key);
            if (!registredAccount || !realAccount) return []; // TODO not registered?
            const device = devices.find(d => d.state === realAccount.deviceState);
            const inputScriptType =
                realAccount.accountType === 'normal' ? 'SPENDWITNESS' : 'SPENDTAPROOT';
            const outputScriptType =
                realAccount.accountType === 'normal' ? 'PAYTOWITNESS' : 'PAYTOTAPROOT';
            // construct protobuf transaction for each participating account
            const tx = {
                inputs: transaction.inputs.map(input => {
                    if (input.path) {
                        return {
                            script_type: inputScriptType,
                            address_n: input.path!,
                            prev_hash: input.hash,
                            prev_index: input.index,
                            amount: input.amount,
                        };
                    }

                    return {
                        address_n: undefined,
                        script_type: 'EXTERNAL' as const,
                        prev_hash: input.hash,
                        prev_index: input.index,
                        amount: input.amount,
                        script_pubkey: input.scriptPubKey,
                        ownership_proof: input.ownershipProof,
                        commitment_data: input.commitmentData,
                    };
                }),
                outputs: transaction.outputs.map(output => {
                    if (output.path) {
                        return {
                            address_n: output.path! as any,
                            amount: output.amount,
                            script_type: outputScriptType,
                            payment_req_index: 0,
                        };
                    }
                    return {
                        address: output.address,
                        amount: output.amount,
                        script_type: 'PAYTOADDRESS' as const,
                        payment_req_index: 0,
                    };
                }),
            };
            const paymentRequest = {
                ...transaction.paymentRequest,
                amount: tx.outputs.reduce(
                    (sum, output) =>
                        typeof output.address === 'string' ? sum + output.amount : sum,
                    0,
                ),
            };
            return {
                key,
                roundId: request.round,
                device,
                tx,
                paymentRequest,
            };
        });

        if (params.length < 1) {
            Object.keys(request.accounts).forEach(key => {
                const { utxos } = request.accounts[key];
                request.accounts[key].utxos = utxos.map(utxo => ({
                    ...utxo,
                    error: 'no registered account to get witness', // TODO handle in lib
                }));
            });
        }

        // async actions in sequence
        await params.reduce(
            (p, { device, tx, paymentRequest, roundId, key }) =>
                p.then(async () => {
                    console.warn('SIGN PARAMS', tx);
                    // @ts-expect-error TODO: tx.inputs/outputs path is a string
                    const signTx = await TrezorConnect.signTransaction({
                        device,
                        useEmptyPassphrase: device?.useEmptyPassphrase,
                        paymentRequests: [paymentRequest],
                        coin: network,
                        preauthorized: true,
                        ...tx,
                    });
                    const { utxos } = request.accounts[key];
                    if (signTx.success) {
                        console.warn('WITTNESSES!', signTx.payload.witnesses);
                        let utxoIndex = 0;
                        tx.inputs.forEach((input, index) => {
                            if (input.script_type !== 'EXTERNAL') {
                                request.accounts[key].utxos[utxoIndex].witness =
                                    signTx.payload.witnesses![index];
                                request.accounts[key].utxos[utxoIndex].witnessIndex = index;
                                utxoIndex++;
                            }
                        });
                        // request.accounts[key].utxos = utxos.map((utxo, index) => ({
                        //     ...utxo,
                        //     witness: signTx.payload.witnesses![index],
                        //     witnessIndex: index,
                        // }));

                        dispatch({
                            type: COINJOIN.ROUND_TX_SIGNED,
                            accountKey: key,
                            roundId,
                        });
                        // const pendingAccount = getPendingAccount(account, precomposedTx, 'txid');
                        // if (pendingAccount) {
                        //     // update account
                        //     dispatch(accountActions.updateAccount(pendingAccount));
                        //     if (account.networkType === 'cardano') {
                        //         // manually add fake pending tx as we don't have the data about mempool txs
                        //         dispatch(transactionActions.addFakePendingTx(precomposedTx, txid, pendingAccount));
                        //     }
                        // }
                    } else {
                        request.accounts[key].utxos = utxos.map(utxo => ({
                            ...utxo,
                            error: 'no witness', // TODO handle in lib
                        }));
                        dispatch(
                            addToast({
                                type: 'error',
                                error: `Coinjoin signTransaction: ${signTx.payload.error}`,
                            }),
                        );
                    }
                }),
            Promise.resolve(),
        );

        return request;
    };

const onCoinjoinClientRequest =
    (network: Account['symbol'], data: RequestEvent[]) => (dispatch: Dispatch) => {
        console.log('Coinjoin on request', network, data);
        return Promise.all(
            data.map(request => {
                if (request.type === 'ownership') {
                    return dispatch(getOwnershipProof(network, request));
                }
                if (request.type === 'witness') {
                    return dispatch(signCoinjoinTx(network, request));
                }
                return request;
            }),
        );
    };
