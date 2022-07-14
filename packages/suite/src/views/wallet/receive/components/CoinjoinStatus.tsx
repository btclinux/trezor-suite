import React from 'react';
import styled from 'styled-components';
import { Switch, Button } from '@trezor/components';
import { Card } from '@suite-components';
import { Row } from '@suite-components/Settings';
import { useActions, useSelector } from '@suite-hooks';
import * as coinjoinActions from '@wallet-actions/coinjoinActions';

const StyledCard = styled(Card)`
    flex-direction: column;
    margin-bottom: 12px;
`;

const StyledRow = styled(Row)`
    display: flex;
    padding-top: 0;
    flex-direction: row;
`;

export const Status = () => {
    const actions = useActions({
        enable: coinjoinActions.enableCoinJoin,
        disable: coinjoinActions.disableCoinJoin,
    });
    const { coinjoin, selectedAccount } = useSelector(s => ({
        selectedAccount: s.wallet.selectedAccount,
        coinjoin: s.wallet.coinjoin,
    }));
    const { account } = selectedAccount;
    if (!account) return null;

    const instance = coinjoin.instances.find(cj => cj.symbol === account.symbol);
    const isRegisteredAnotherAccount = coinjoin.accounts.find(
        a => a.descriptor !== account.descriptor && a.deviceState === account.deviceState,
    );

    const toggleCoinJoin = () => {
        if (!instance?.enabled) {
            actions.enable(account, {
                maxRounds: 3,
                maxFeePerKvbyte: 200000,
                anonymityLevel: 1,
                maxCoordinatorFeeRate: 3000000,
            });
        } else {
            actions.disable(account);
        }
    };

    if (isRegisteredAnotherAccount || !isRegisteredAnotherAccount) return null;

    return (
        <StyledCard largePadding>
            <StyledRow>
                CoinJoin status
                {isRegisteredAnotherAccount ? (
                    <Button>Is already running on different account</Button>
                ) : (
                    <Switch
                        onChange={toggleCoinJoin}
                        isDisabled={!!instance?.loading}
                        isChecked={!!instance?.enabled}
                        data-test="@wallet/coinjoin/enable"
                    />
                )}
            </StyledRow>
        </StyledCard>
    );
};

export default Status;
