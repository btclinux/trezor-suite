import React, { useState } from 'react';
import styled from 'styled-components';
import { Card, Button, Icon } from '@trezor/components';
import { enableCoinJoin } from '@wallet-actions/coinjoinActions';
import { useActions } from '@suite-hooks';
import { AnonymityGraph } from './AnonymityGraph';
import { CoinJoinStart } from './CoinJoinStart';
import { CoinJoinStatusDetail } from './CoinJoinStatusDetail';
import type { Account } from '@wallet-types';

const Wrapper = styled(Card)`
    width: 100%;
    flex-direction: column;
`;

const WrapperStart = styled.div`
    width: 100%;
    display: flex;
    flex-direction: row;
`;

const Content = styled.div`
    display: flex;
    flex-direction: row;
    padding-bottom: 24px;
`;

const Section = styled.div`
    padding: 10px;
`;

const SelectButton = styled(Button)<{ isActive?: boolean }>`
    width: 200px;
    height: 100px;
    background: transparent;
    border: 1px solid
        ${props => (!props.isActive ? props.theme.BG_SECONDARY : props.theme.TYPE_GREEN)};
`;

interface Props {
    account: Account;
}

export const CoinJoinSetup = ({ account }: Props) => {
    const [step, setStep] = useState(0);
    const [anonLevel, setAnonLevel] = useState(0);
    const action = useActions({
        enableCoinJoin,
    });
    if (step === 0) {
        return (
            <WrapperStart>
                <AnonymityGraph account={account} />
                <CoinJoinStart account={account} onContinue={() => setStep(1)} />
            </WrapperStart>
        );
    }

    const selectedLevel =
        anonLevel === 0
            ? {
                  maxRounds: 10,
                  anonymityLevel: 80,
                  maxFeePerKvbyte: 129000,
                  maxCoordinatorFeeRate: 0.003 * 10 ** 10, // 0.003 from coordinator
              }
            : {
                  maxRounds: 3,
                  anonymityLevel: 40,
                  maxFeePerKvbyte: 129000,
                  maxCoordinatorFeeRate: 0.003 * 10 ** 10, // 0.003 from coordinator
              };
    return (
        <Wrapper>
            <Content>
                <Section style={{ flex: 1 }}>
                    <SelectButton
                        isActive={anonLevel === 0}
                        variant="tertiary"
                        onClick={() => setAnonLevel(0)}
                    >
                        Default
                        {anonLevel === 0 && <Icon icon="CHECK_ACTIVE" />}
                    </SelectButton>
                    <SelectButton
                        isActive={anonLevel === 1}
                        variant="tertiary"
                        onClick={() => setAnonLevel(1)}
                    >
                        Speed
                        {anonLevel === 1 && <Icon icon="CHECK_ACTIVE" />}
                    </SelectButton>
                </Section>
                <Section>
                    <CoinJoinStatusDetail
                        account={account}
                        anonLevel={selectedLevel.anonymityLevel}
                        rounds={selectedLevel.maxRounds}
                        fee={selectedLevel.maxFeePerKvbyte}
                        coordinatorFee={selectedLevel.maxCoordinatorFeeRate}
                    />
                </Section>
            </Content>
            <Button
                onClick={() => action.enableCoinJoin(account, selectedLevel)}
                icon="ARROW_RIGHT_LONG"
                alignIcon="right"
            >
                Start coin join
            </Button>
        </Wrapper>
    );
};
