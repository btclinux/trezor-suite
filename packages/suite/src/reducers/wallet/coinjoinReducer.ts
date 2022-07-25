import produce from 'immer';
import { Round } from '@trezor/coinjoin';
import * as COINJOIN from '@wallet-actions/constants/coinjoinConstants';
import type { CoinJoinAction } from '@wallet-actions/coinjoinActions';
import type { CoinjoinAccount, CoinjoinRegistration } from '@wallet-types/coinjoin';

interface CoinJoinInstance {
    symbol: string;
    enabled: boolean;
    loading?: boolean;
    state?: any; // TODO: cached state used in coinjoin restoring
    bestKnownHash?: string;
}

type CoinJoinState = {
    instances: CoinJoinInstance[];
    accounts: CoinjoinAccount[];
    registrations: CoinjoinRegistration[];
    status: Round[];
    log: {
        time: string;
        value: string;
    }[];
};

// export type CoinJoinState = Record<string, CoinjoinInstance>;

const initialState: CoinJoinState = {
    instances: [],
    accounts: [],
    registrations: [],
    status: [],
    log: [],
};

const coinjoinReducer = (
    state: CoinJoinState = initialState,
    action: CoinJoinAction,
): CoinJoinState =>
    produce(state, draft => {
        switch (action.type) {
            case COINJOIN.CLIENT_LOG: {
                const now = new Date();
                draft.log.unshift({
                    time: `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`,
                    value: action.payload,
                });
                if (draft.log.length > 200) {
                    draft.log = draft.log.slice(0, 200);
                }
                break;
            }

            case COINJOIN.CLIENT_ENABLE:
                draft.instances.push({
                    symbol: action.payload.symbol,
                    enabled: false,
                    loading: true,
                });
                break;

            case COINJOIN.CLIENT_SUCCESS:
                draft.instances = draft.instances.map(cj => {
                    if (cj.symbol === action.payload.symbol) {
                        return {
                            ...cj,
                            enabled: true,
                            loading: false,
                        };
                    }
                    return cj;
                });
                break;

            case COINJOIN.CLIENT_FAILED:
                draft.instances = draft.instances.filter(cj => cj.symbol !== action.payload.symbol);
                break;

            case COINJOIN.CLIENT_DISABLE:
                draft.instances = draft.instances.map(cj => {
                    if (cj.symbol === action.payload.symbol) {
                        return {
                            ...cj,
                            enabled: false,
                            loading: false,
                        };
                    }
                    return cj;
                });
                break;

            case COINJOIN.ACCOUNT_AUTHORIZE_SUCCESS:
                draft.accounts.push({
                    accountKey: action.account.key,
                    symbol: action.account.symbol,
                    descriptor: action.account.descriptor,
                    deviceState: action.account.deviceState,
                });
                draft.registrations.push({
                    accountKey: action.account.key,
                    phase: -1,
                    anonymityLevel: action.params.anonymityLevel,
                    maxRounds: action.params.maxRounds,
                    maxFeePerKvbyte: action.params.maxFeePerKvbyte,
                    maxCoordinatorFeeRate: action.params.maxCoordinatorFeeRate,
                    signedRounds: [],
                });
                break;

            case COINJOIN.CLIENT_STATUS:
                draft.status = action.payload;
                break;

            case COINJOIN.ROUND_PHASE_CHANGED:
                draft.registrations = draft.registrations.map(r =>
                    r.accountKey === action.accountKey
                        ? {
                              ...r,
                              phase: action.phase,
                          }
                        : r,
                );
                break;

            case COINJOIN.ROUND_TX_SIGNED:
                draft.registrations = draft.registrations.map(r =>
                    r.accountKey === action.accountKey && !r.completed
                        ? {
                              ...r,
                              signedRounds: r.signedRounds.concat(action.roundId),
                          }
                        : r,
                );
                break;
            case COINJOIN.ROUND_COMPLETED:
                draft.registrations = draft.registrations.map(r =>
                    r.accountKey === action.accountKey &&
                    r.signedRounds.find(id => id === action.roundId)
                        ? {
                              ...r,
                              completed: true,
                          }
                        : r,
                );
                break;
            case COINJOIN.ACCOUNT_DISABLE:
                draft.accounts = draft.accounts.filter(
                    account => account.accountKey !== action.payload.key,
                );
                draft.registrations = draft.registrations.map(r =>
                    r.accountKey === action.payload.key
                        ? {
                              ...r,
                              completed: true,
                          }
                        : r,
                );
                break;

            // no default
        }
    });

export default coinjoinReducer;
