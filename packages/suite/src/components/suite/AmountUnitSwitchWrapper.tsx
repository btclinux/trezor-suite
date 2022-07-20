import React from 'react';
import styled, { css } from 'styled-components';
import { Tooltip, variables } from '@trezor/components';
import { useBitcoinAmountUnit } from '@wallet-hooks/useBitcoinAmountUnit';
import { NetworkSymbol } from '@wallet-types';
import { Translation } from './Translation';

const Container = styled.div<{ isHoverable?: boolean }>`
    position: relative;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    margin: -2px 0 0 -12px;
    padding: 2px 12px;
    border-radius: 6px;
    transition: background 0.1s ease-in;

    ${({ isHoverable }) =>
        isHoverable &&
        css`
            cursor: pointer;

            ${variables.MEDIA_QUERY.HOVER} {
                :hover {
                    background: ${({ theme }) => theme.BG_GREY};
                }
            }
        `}
`;

interface AmountUnitSwitchWrapperProps {
    symbol?: NetworkSymbol;
    isActive?: boolean;
    children: React.ReactNode;
}

export const AmountUnitSwitchWrapper = ({
    symbol,
    isActive,
    children,
}: AmountUnitSwitchWrapperProps) => {
    const { areSatsDisplayed, toggleBitcoinAmountUnits, areUnitsSupportedByNetwork } =
        useBitcoinAmountUnit();

    const isEnabled = isActive || areUnitsSupportedByNetwork;

    return (
        <Tooltip
            disabled={!isEnabled}
            cursor="default"
            maxWidth={200}
            delay={[1200, 0]}
            placement="bottom"
            interactive={false}
            hideOnClick={false}
            content={<Translation id={areSatsDisplayed ? 'TR_TO_BTC' : 'TR_TO_SATOSHIS'} />}
        >
            <Container
                isHoverable={isEnabled}
                onClick={() => isEnabled && toggleBitcoinAmountUnits()}
                data-test={symbol ? `amount-unit-switch/${symbol}` : 'amount-unit-switch'}
            >
                {children}
            </Container>
        </Tooltip>
    );
};
