import { getEvents, getCommitmentData } from '../utils';
import { RegisteredAccount, Round, RoundPhase, ActiveRound, ActiveRoundOptions } from '../types';

export const selectRound = (
    accounts: RegisteredAccount[],
    rounds: Round[],
    activeRounds: ActiveRound[],
    { coordinatorName, log }: ActiveRoundOptions,
): ActiveRound | void => {
    log('Looking for new rounds');
    const now = Date.now();
    const roundCandidates = rounds.filter(
        round =>
            round.phase === RoundPhase.InputRegistration &&
            !activeRounds.find(r => r.id === round.id) &&
            new Date(round.inputRegistrationEnd).getTime() - now > 30000, // TODO: do not register in last minute
    ); // TODO: registration end, suggested amounts etc.
    if (roundCandidates.length < 1) {
        log('No suitable rounds');
        return;
    }

    // TODO: group by accounts from the begining
    // - calc. potential vsize and predict how many addresses do i have, if not enough, then generate some more?
    // - primarly try to mix multiple accounts
    const registeredOutpoints = activeRounds.flatMap(active =>
        Object.values(active.accounts).flatMap(account => account.utxos.map(u => u.outpoint)),
    );
    // const availableUtxos = accounts.flatMap(
    //     a => a.utxos.filter(utxo => !registeredUtxos.includes(utxo.outpoint)), // TODO: confirmations, randomizer, limit inputs in one round
    // );
    // if (!availableUtxos.length) return;

    log('Looking for accounts');
    const availableAccounts = accounts.reduce((response, account) => {
        // // TODO: confirmations, randomizer, limit inputs in one round etc.
        const isAccountAlreadyRegistered = activeRounds.find(
            round =>
                round.phase !== RoundPhase.Ended &&
                Object.keys(round.accounts).includes(account.descriptor),
        );

        if (isAccountAlreadyRegistered) {
            log(
                `Account is already registered to round ${isAccountAlreadyRegistered.id} (phase: ${isAccountAlreadyRegistered.phase})`,
            );
        }

        // const accountRoundLimit = account.maxRounds - account.currentRound;
        // console.warn('ACC ROUND LIMIT', accountRoundLimit, account.maxRounds, account.currentRound);
        // if (accountRoundLimit < 1) return result;

        // TODO: tmp try max 10 per round
        const utxo = account.utxos
            .filter(utxo => !registeredOutpoints.includes(utxo.outpoint) && utxo.amount > 10000)
            .slice(0, 10);
        if (!isAccountAlreadyRegistered && utxo.length > 0) {
            // init ActiveRoundAccount
            if (!response[account.descriptor]) {
                response[account.descriptor] = {
                    type: account.type,
                    addresses: account.addresses, // TODO filter usedAddresses from Clinet
                    utxos: [], // filled with data below
                    // amounts: [], // outputDecomposition
                    // amountCredentials: [], // outputDecomposition
                    // vsizeCredentials: [], // outputDecomposition
                };
            }
            response[account.descriptor].utxos.push(...utxo);
        }
        return response;
    }, {} as ActiveRound['accounts']);

    // no available accounts
    if (Object.keys(availableAccounts).length < 1) {
        log('No available accounts');
        return;
    }

    const [round] = roundCandidates; // TODO: if there is more than 1 candidate pick one randomly?

    // TODO: availableUtxo of only one type in round!!!

    const [event] = getEvents('RoundCreated', round.coinjoinState.events);
    if (!event) {
        return;
    }

    log(`Trying to register to round ${round.id}`);

    return {
        id: round.id,
        phase: round.phase,
        accounts: availableAccounts,
        commitmentData: getCommitmentData(coordinatorName, round.id),
        amountCredentialIssuerParameters: round.amountCredentialIssuerParameters,
        vsizeCredentialIssuerParameters: round.vsizeCredentialIssuerParameters,
        roundParameters: {
            ...event.roundParameters,
            inputRegistrationEnd: round.inputRegistrationEnd,
        },
        coinjoinState: round.coinjoinState,
    };
};
