import React from 'react';
import styled from 'styled-components';
import { Card, P } from '@trezor/components';
import { CoinjoinRegistration } from '@wallet-types/coinjoin';

const HistoryCard = styled(Card)`
    width: 100%;
    flex: 1;
    margin-top: 12px;
`;

const Row = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
`;

const LogWrapper = styled.div`
    margin: 10px 0px;
    max-height: 250px;
    overflow: auto;
`;

const LogRow = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    padding-bottom: 6px;
`;

interface Props {
    history: CoinjoinRegistration[];
    log: { time: string; value: string }[];
}

export const CoinjoinHistory = ({ history, log }: Props) => {
    const signedRounds = history.flatMap(r => r.signedRounds);
    return (
        <HistoryCard>
            {signedRounds.length > 0 && <P>Signed rounds:</P> &&
                signedRounds.map(signed => <Row key={signed}>Signed rounds: {signed}</Row>)}

            <P>Log:</P>
            <LogWrapper>
                {log.map(l => {
                    return (
                        <LogRow key={l.time + l.value}>
                            {l.time} {l.value}
                        </LogRow>
                    );
                })}
            </LogWrapper>
        </HistoryCard>
    );
};
