import React from 'react';
import { findAccountsByAddress } from '@wallet-utils/accountUtils';
import { useSelector } from '@suite-hooks';
import { AccountLabeling } from './AccountLabeling';

interface AddressLabelingProps {
    address?: string | null;
    knownOnly?: boolean;
}

export const AddressLabeling = ({ address, knownOnly }: AddressLabelingProps) => {
    const accounts = useSelector(state => state.wallet.accounts);

    if (!address) {
        return null;
    }

    const relevantAccounts = findAccountsByAddress(address, accounts);

    if (relevantAccounts.length < 1) {
        return !knownOnly ? <span>{address}</span> : null;
    }

    return <AccountLabeling account={relevantAccounts[0]} />;
};
