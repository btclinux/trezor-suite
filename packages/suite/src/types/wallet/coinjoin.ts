import { Network } from './index';

export interface CoinjoinParameters {
    anonymityLevel: number;
    maxRounds: number;
    maxFeePerKvbyte: number;
    maxCoordinatorFeeRate: number;
}

export interface CoinjoinRegistration extends CoinjoinParameters {
    accountKey: string;
    phase: number;
    signedRounds: string[];
    completed?: boolean;
}

export interface CoinjoinAccount {
    accountKey: string;
    symbol: Network['symbol'];
    descriptor: string;
    deviceState: string;
}

export interface CoinjoinState {
    rounds: any[];
    activeRounds: any;
    bannedUtxo: any;
    bannedAddresses: any;
}
