import { getOutpoint, getScriptPubKey } from './utils';
import { Account, RegisteredAccount, AllowedScriptTypes } from './types';

const enhanceUtxo = (utxos: Account['utxos']): RegisteredAccount['utxos'] =>
    utxos.flatMap(utxo => {
        if (!utxo.blockHeight) return []; // NOTE: skip unconfirmed utxos
        return {
            ...utxo, // TODO: no not spread input objects
            outpoint: getOutpoint(utxo),
        };
    });

const enhanceAddresses = (
    addresses: Account['addresses'],
    type: AllowedScriptTypes,
): RegisteredAccount['addresses'] =>
    addresses.flatMap(address => {
        if (address.transfers) return []; // NOTE: skip used addresses
        return {
            ...address, // TODO: no not spread input objects
            scriptPubKey: getScriptPubKey(address.address, type),
        };
    });

export const registerAccount = (account: Account): RegisteredAccount => ({
    ...account, // TODO: no not spread input objects
    completedRounds: 0,
    utxos: enhanceUtxo(account.utxos),
    addresses: enhanceAddresses(account.addresses, account.type),
});

export const updateAccount = (_account: Account) => {
    // TODO
};
