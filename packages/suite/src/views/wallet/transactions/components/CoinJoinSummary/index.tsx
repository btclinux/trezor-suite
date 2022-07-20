import React from 'react';
import styled from 'styled-components';
import { useSelector } from '@suite-hooks';
import { CoinJoinStatus } from './CoinJoinStatus';
import { CoinJoinSetup } from './CoinJoinSetup';
import { CoinjoinHistory } from './CoinjoinHistory';
import type { Account } from '@wallet-types';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    margin-bottom: 24px;
`;

interface Props {
    account: Account;
}

export const CoinJoinSummary = ({ account }: Props) => {
    const coinjoin = useSelector(state => state.wallet.coinjoin);
    const registration = coinjoin.registrations.find(
        a => a.accountKey === account.key && !a.completed,
    );
    const previousRegistrations = coinjoin.registrations.filter(a => a.accountKey === account.key);

    return (
        <Wrapper>
            {registration ? (
                <CoinJoinStatus account={account} registration={registration} />
            ) : (
                <CoinJoinSetup account={account} />
            )}
            <CoinjoinHistory history={previousRegistrations} log={coinjoin.log} />
        </Wrapper>
    );
};
