import React from 'react';
import styled from 'styled-components';
import { HiddenPlaceholder, Sign } from '@suite-components';
import { formatCurrencyAmount } from '@trezor/utils';
import { networkAmountToSatoshi } from '@wallet-utils/accountUtils';
import { isValuePositive, SignValue } from '@suite-components/Sign';
import { useBitcoinAmountUnit } from '@wallet-hooks/useBitcoinAmountUnit';
import { NETWORKS } from '@wallet-config';
import { NetworkSymbol } from '@wallet-types';

const Value = styled.span`
    font-variant-numeric: tabular-nums;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const Symbol = styled.span`
    word-break: initial;
`;

interface FormattedCryptoAmountProps {
    value: string | number | undefined;
    symbol: string | undefined;
    signValue?: SignValue;
    disableHiddenPlaceholder?: boolean;
    isRawString?: boolean;
    'data-test'?: string;
    className?: string;
}

export const FormattedCryptoAmount = ({
    value,
    symbol,
    signValue,
    disableHiddenPlaceholder,
    isRawString,
    'data-test': dataTest,
    className,
}: FormattedCryptoAmountProps) => {
    const { areSatsDisplayed } = useBitcoinAmountUnit();

    if (!value) {
        return null;
    }

    const symbolFeatures = NETWORKS.find(network => network.symbol === symbol)?.features;
    const areSatsSupported = !!symbolFeatures?.includes('amount-unit');

    let formattedValue = value;
    let formattedSymbol = symbol?.toUpperCase();

    const isSatoshis = areSatsSupported && areSatsDisplayed;

    if (isSatoshis) {
        formattedValue = formatCurrencyAmount(
            Number(networkAmountToSatoshi(String(value), symbol as NetworkSymbol)),
        ) as string;

        formattedSymbol = symbol === 'btc' ? 'sat' : `sat ${symbol?.toUpperCase()}`;
    }

    if (isRawString) {
        return (
            <>
                {`${signValue ? `${isValuePositive(signValue) ? '+' : '-'}` : ''} ${formattedValue}
                ${formattedSymbol}`}
            </>
        );
    }

    const content = (
        <span className={className}>
            {signValue && <Sign value={signValue} />}

            <Value data-test={dataTest}>{formattedValue}</Value>

            {symbol && <Symbol>&nbsp;{formattedSymbol}</Symbol>}
        </span>
    );

    if (disableHiddenPlaceholder) {
        return content;
    }

    return <HiddenPlaceholder className={className}>{content}</HiddenPlaceholder>;
};
