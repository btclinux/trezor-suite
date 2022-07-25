import { CoinjoinClient } from '../Client';
import { createServer, Server } from '../../tests/server';

let server: Server | undefined;

const ROUND = {
    id: '00',
    phase: 0,
    coinjoinState: {
        events: [{ Type: 'RoundCreated', roundParameters: { coordinationFeeRate: {} } }],
    },
};

// jest.mock('../coordinator', () => {
//     let tick = 0;
//     let phase = 0;
//     let status = [ROUND];
//     return {
//         getStatus: () => {
//             tick++;
//             if (tick % 2 === 0) {
//                 phase = tick / 2;
//                 status = status.map(r => ({ ...r, phase: r.phase + 1 }));
//                 status.push({ ...ROUND, id: tick.toString() });
//             }
//             return status;
//         },
//         inputRegistration: (roundId: any, outpoint: any) => {
//             console.warn('----> input Registration!', outpoint);
//             const round = status.find(r => r.id === roundId);
//             round?.coinjoinState.events.push({
//                 Type: 'InputAdded',
//                 coin: {
//                     outpoint,
//                     txOut: {
//                         scriptPubKey: 'string',
//                         value: 1,
//                     },
//                 },
//             });
//             round?.coinjoinState.events.push({
//                 Type: 'InputAdded',
//                 coin: {
//                     outpoint:
//                         '0007000000000000b8876504000000007c000000010000003c00000000000000b08c6504',
//                     txOut: {
//                         scriptPubKey:
//                             '0 95e2d98fa921d2a14057a41a09eb112613f95cb17905d2cd7e5322f6d9c7dfd9',
//                         value: 4,
//                     },
//                     ownershipProof: 'externalproof',
//                 },
//             });
//             return {};
//         },
//         connectionConfirmation: () => ({}),
//         credentialIssuance: () => ({
//             realAmountCredentials: 'credentialIssuance',
//             realVsizeCredentials: 'credentialIssuance',
//         }),
//         outputRegistration: (alice: any, output: any) => {
//             console.log('===>outputRegistration', alice, output);
//             const round = status.find(r => r.id === alice.roundId);
//             round?.coinjoinState.events.push({
//                 Type: 'OutputAdded',
//                 output: {
//                     scriptPubKey: output.scriptPubKey,
//                     value: 1,
//                 },
//             });
//             round?.coinjoinState.events.push({
//                 Type: 'OutputAdded',
//                 output: {
//                     scriptPubKey:
//                         '0 95e2d98fa921d2a14057a41a09eb112613f95cb17905d2cd7e5322f6d9c7dfd9',
//                     value: 2,
//                 },
//             });
//             return {};
//         },
//         readyToSign: () => ({}),
//         transactionSignature: () => Promise.resolve(),
//     };
// });

// jest.mock('../middleware', () => {
//     const tick = 0;
//     const phase = 0;
//     const status = [{ id: '00', phase: 0, coordinationFeeRate: {} }];
//     return {
//         getCredentials: (_b, data) => {
//             console.log('====> getCredentials', _b, data);
//             if (data === 'credentialIssuance') {
//                 return [{ value: 0 }, { value: 0 }];
//             }
//             return [];
//         },
//         getZeroCredentials: () => ({}),
//         getRealCredentials: () => ({}),
//         getPaymentRequest: () => ({}),
//     };
// });

// mock random delay function
jest.mock('../utils', () => {
    const originalModule = jest.requireActual('../utils');
    return {
        __esModule: true,
        ...originalModule,
        getRandomDelay: () => 0,
    };
});

describe('CoinjoinClient', () => {
    beforeAll(async () => {
        server = await createServer();
    });

    beforeEach(() => {
        server?.removeAllListeners('test-request');
    });

    afterAll(() => {
        jest.clearAllMocks();
        if (server) server.close();
    });
    // it('enable/disable', async () => {
    //     const cli = await CoinjoinClient.enable();

    //     expect(cli.status.enabled).toBe(true);
    //     expect(cli.status.rounds).toMatchObject([{ id: '00' }, { id: '01' }]);

    //     CoinjoinClient.disable();
    //     expect(cli.status.enabled).toBe(false);
    //     expect(cli.status.rounds).toEqual([]);
    // });

    // it('status change', async () => {
    //     const listener = jest.fn();
    //     // api.downloadUpdate();
    //     // expect(spy).toBeCalledWith('update/download');

    //     const cli = await CoinjoinClient.enable();
    //     cli.on('status', listener);
    //     expect(listener).toBeCalledTimes(0); // it should not be emitted yet
    //     // wait few iterations
    //     await new Promise<void>(resolve => {
    //         setTimeout(() => {
    //             resolve();
    //         }, 5000);
    //     });

    //     expect(listener).toHaveBeenCalled();

    //     // expect(cli.status.enabled).toBe(true);
    //     // expect(cli.status.rounds).toMatchObject([{ id: '00' }, { id: '01' }]);

    //     // CoinjoinClient.disable();
    //     // expect(cli.status.enabled).toBe(false);
    //     // expect(cli.status.rounds).toEqual([]);
    // }, 100000);

    it('status change', async () => {
        // const listener = jest.fn();
        // api.downloadUpdate();
        // expect(spy).toBeCalledWith('update/download');

        let statusTick = 0;
        let status = [ROUND];
        server?.addListener('test-request', (_data, req, _res) => {
            const requestedUrl = req.url || '';
            let response: any;
            console.warn('SERVER REQUST!', requestedUrl);
            if (requestedUrl.endsWith('/status')) {
                // first utxos from each account is a remix
                console.warn('STATUS CHECK!', statusTick);
                statusTick++;
                if (statusTick % 3 === 0) {
                    // nextPhase = statusTick / 2;
                    status = status.map(r => ({ ...r, phase: r.phase + 1 }));
                    // status.push({ ...ROUND, id: tick.toString() });
                }
                response = {
                    roundStates: status,
                };
            }
            req.emit('test-response', response);
        });

        const cli = new CoinjoinClient({
            network: 'regtest',
            coordinatorName: server!.requestOptions.coordinatorName,
            coordinatorUrl: server!.requestOptions.coordinatorUrl,
            middlewareUrl: server!.requestOptions.middlewareUrl,
        });
        const initialStatus = await cli.enable();
        console.warn('STATUS!', initialStatus, server?.requestOptions);
        // cli.on('status', (_, status) => {});
        // cli.on('event', e => console.log('debug event', e));
        cli.on('request', (_network, data) => {
            console.warn('handle request in suite', data);
            const responses = data.map(request => {
                if (request.type === 'ownership') {
                    console.warn(request.type, request.accounts);
                    return {
                        ...request,
                        accounts: Object.keys(request.accounts).reduce((r, key) => {
                            r[key] = {
                                ...request.accounts[key],
                                utxos: request.accounts[key].utxos.map(utxo => ({
                                    ...utxo,
                                    ownershipProof: 'abcd',
                                })),
                            };
                            return r;
                        }, {} as any),
                    };
                }
                if (request.type === 'witness') {
                    console.warn(request.type, request.accounts);
                    return {
                        ...request,
                        // inputs: request.inputs.map(i => ({
                        //     ...i,
                        //     witness: 'abcd',
                        //     witnessIndex: 1,
                        // })),
                        accounts: Object.keys(request.accounts).reduce((r, key) => {
                            r[key] = {
                                ...request.accounts[key],
                                utxos: request.accounts[key].utxos.map(utxo => ({
                                    ...utxo,
                                    witness: 'abcd',
                                    witnessIndex: 1,
                                })),
                            };
                            return r;
                        }, {} as any),
                    };
                }

                return request;
            });

            cli.resolveRequest(responses);

            // CoinjoinClient.addOwnershipProof(responses);
        });

        cli.registerAccount({
            type: 'taproot',
            symbol: 'regtest',
            descriptor: 'xpub',
            maxRounds: 1,
            maxFeePerKvbyte: 1000,
            maxCoordinatorFeeRate: 1000,
            utxos: [{ path: 'm44', txid: '55', vout: 7, amount: 1, blockHeight: 1 }],
            addresses: [
                {
                    path: 'm44',
                    address: 'bcrt1p0wxg3r4ddwhdsze3ket8egal8caf4u5rflnlnun9tm2ekafgzc7se7tuts',
                },
                {
                    path: 'm44',
                    address: 'bcrt1p0wxg3r4ddwhdsze3ket8egal8caf4u5rflnlnun9tm2ekafgzc7se7tuts',
                },
            ],
        });
        // CoinjoinClient.addInput({
        //     vin: { path: 'm44', type: 'taproot', txid: '55', vout: 7, amount: 1 },
        //     addresses: [
        //         { address: 'bcrt1p0wxg3r4ddwhdsze3ket8egal8caf4u5rflnlnun9tm2ekafgzc7se7tuts' },
        //         { address: 'bcrt1p0wxg3r4ddwhdsze3ket8egal8caf4u5rflnlnun9tm2ekafgzc7se7tuts' },
        //     ],
        // });
        // cli.inputs.push({ round: '00', outpoint: 'AB' } as any);
        // wait few iterations
        await new Promise<void>(resolve => {
            setTimeout(() => {
                resolve();
            }, 8000);
        });

        // expect(listener).toHaveBeenCalled();

        // expect(cli.status.enabled).toBe(true);
        // expect(cli.status.rounds).toMatchObject([{ id: '00' }, { id: '01' }]);

        // CoinjoinClient.disable();
        // expect(cli.status.enabled).toBe(false);
        // expect(cli.status.rounds).toEqual([]);
    }, 100000);
});
