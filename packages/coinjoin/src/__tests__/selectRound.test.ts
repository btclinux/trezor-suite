import { selectRound } from '../round/selectRound';

const OPTIONS: any = {
    coordinatorName: 'coordinatorName',
    log: () => {},
};

const INPUT_REGISTRATION_END = new Date().getTime() + 60000;

describe('selectRound', () => {
    it('no available accounts', () => {
        const result = selectRound([], [], [], OPTIONS);
        expect(result).toBeUndefined();
    });

    it('no available utxos', () => {
        const result = selectRound([{ utxos: [] }] as any, [], [], OPTIONS);
        expect(result).toBeUndefined();
    });

    it('no available rounds', () => {
        const result = selectRound(
            [{ utxos: [{ outpoint: 'aa' }] }] as any,
            [{ phase: 1 }, { phase: 0, inputRegistrationEnd: new Date() }] as any,
            [],
            OPTIONS,
        );
        expect(result).toBeUndefined();
    });

    it('utxo already registered', () => {
        const result = selectRound(
            [{ utxos: [{ outpoint: 'aa' }] }] as any,
            [{ id: '00', phase: 0, inputRegistrationEnd: INPUT_REGISTRATION_END }] as any,
            [
                {
                    id: '00',
                    inputRegistrationEnd: INPUT_REGISTRATION_END,
                    utxos: [{ outpoint: 'aa' }],
                },
            ] as any,
            OPTIONS,
        );
        expect(result).toBeUndefined();
    });

    it('round with missing RoundCreated event', () => {
        const result = selectRound(
            [{ utxos: [{ outpoint: 'aa' }] }] as any,
            [
                {
                    id: '00',
                    phase: 0,
                    coinjoinState: {
                        events: [] as any[],
                    },
                    inputRegistrationEnd: INPUT_REGISTRATION_END,
                },
            ] as any,
            [],
            OPTIONS,
        );
        expect(result).toBeUndefined();
    });

    it('utxo added to new round', () => {
        const result = selectRound(
            [{ descriptor: 'account1', utxos: [{ outpoint: 'aa', amount: 20000 }] }] as any,
            [
                {
                    id: '00',
                    phase: 0,
                    coinjoinState: {
                        events: [{ Type: 'RoundCreated', roundParameters: { miningFeeRate: 1 } }],
                    },
                    inputRegistrationEnd: INPUT_REGISTRATION_END,
                },
            ] as any,
            [],
            OPTIONS,
        );
        expect(result).toMatchObject({
            id: '00',
            phase: 0,
            roundParameters: { miningFeeRate: 1 },
            commitmentData: expect.any(String),
            accounts: {
                account1: {
                    utxos: [{ outpoint: 'aa' }],
                },
            },
        });
    });

    it('utxo not added, account is already registered in other round', () => {
        const result = selectRound(
            [{ descriptor: 'account1', utxos: [{ outpoint: 'aa' }, { outpoint: 'ab' }] }] as any,
            [
                {
                    id: '00',
                    phase: 0,
                    coinjoinState: {
                        events: [{ Type: 'RoundCreated', roundParameters: { miningFeeRate: 1 } }],
                    },
                    inputRegistrationEnd: INPUT_REGISTRATION_END,
                },
                {
                    id: '01',
                    phase: 1,
                    inputRegistrationEnd: INPUT_REGISTRATION_END,
                },
            ] as any,
            [
                {
                    id: '01',
                    accounts: {
                        account1: {
                            utxos: [{ outpoint: 'aa' }],
                        },
                    },
                },
            ] as any,
            OPTIONS,
        );
        expect(result).toBeUndefined();
    });
});
