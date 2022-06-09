import { outputRegistration } from '../round/outputRegistration';
import { createServer, Server } from '../../tests/server';

let server: Server | undefined;

describe('outputRegistration', () => {
    beforeAll(async () => {
        server = await createServer();
    });

    beforeEach(() => {
        server?.removeAllListeners('test-request');
    });

    afterAll(() => {
        if (server) server.close();
    });

    it('fails on joining credentails (missing data in utxo)', async () => {
        const response = await outputRegistration(
            {
                id: '00',
                phase: 3,
                accounts: {
                    account1: {
                        utxos: [{ outpoint: 'AA' }],
                    },
                },
            } as any,
            [],
            server?.requestOptions,
        );
        expect(response).toMatchObject({
            id: '00',
            accounts: {
                account1: {
                    utxos: [{ outpoint: 'AA', error: expect.any(Error) }],
                },
            },
        });
    });
});
