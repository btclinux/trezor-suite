import React from 'react';
import styled from 'styled-components';
import { Controller } from 'react-hook-form';
import {
    withCoinmarket,
    WithSelectedAccountLoadedProps,
    KYCInProgress,
    KYCFailed,
    KYCError,
} from '@wallet-components';
import { Button, SelectBar, variables } from '@trezor/components';
import { useSavingsSetupContinue } from '@wallet-hooks/useCoinmarketSavingsSetupContinue';
import { Translation } from '@suite-components';
import { AddressOptions } from '@wallet-views/coinmarket/common/AddressOptions';
import FiatAmount from '../components/FiatAmount';
import Summary from '../components/Summary';

const Header = styled.div`
    font-weight: 500;
    font-size: 24px;
    line-height: 30px;
    margin-bottom: 16px;
`;

const Label = styled.div`
    padding-right: 20px;
    display: flex;
    align-items: center;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    text-transform: capitalize;
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${props => props.theme.TYPE_DARK_GREY};
    margin-bottom: 11px;
`;

const StyledSelectBar = styled(SelectBar)`
    width: 100%;
    & div div {
        justify-content: center;
    }
`;

const FrequencyStyledSelectBar = styled(StyledSelectBar)`
    margin-bottom: 26px;
`;

const AddressOptionsWrapper = styled.div`
    margin-bottom: 16px;
`;

const ReceivingAddressChangesPaymentInfoLabel = styled.div`
    margin-top: 8px;
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${props => props.theme.TYPE_DARK_GREY};
`;

const CoinmarketSavingsSetupContinue = (props: WithSelectedAccountLoadedProps) => {
    const {
        control,
        annualSavingsCryptoAmount,
        annualSavingsFiatAmount,
        fiatAmount,
        fiatCurrency,
        register,
        errors,
        isWatchingKYCStatus,
        canConfirmSetup,
        account,
        setValue,
        address,
        handleSubmit,
        onSubmit,
        isSubmitting,
        paymentAmounts,
        paymentFrequencyOptions,
        minimumPaymentAmountLimit,
        maximumPaymentAmountLimit,
        isSavingsTradeLoading,
        savingsTrade,
        kycFinalStatus,
        selectedProviderName,
        showReceivingAddressChangePaymentInfoLabel,
    } = useSavingsSetupContinue(props);

    if (isSavingsTradeLoading || !savingsTrade) {
        return <Translation id="TR_LOADING" />;
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            {isWatchingKYCStatus && <KYCInProgress />}
            {!isWatchingKYCStatus && kycFinalStatus === 'Failed' && (
                <KYCFailed providerName={selectedProviderName} />
            )}
            {!isWatchingKYCStatus && kycFinalStatus === 'Error' && <KYCError />}
            <Header>
                <Translation id="TR_SAVINGS_SETUP_HEADER" />
            </Header>
            <Label>
                <Translation id="TR_SAVINGS_SETUP_PAYMENT_FREQUENCY_LABEL" />
            </Label>
            <Controller
                control={control}
                name="paymentFrequency"
                defaultValue={savingsTrade?.paymentFrequency}
                render={({ onChange, value }) => (
                    <FrequencyStyledSelectBar
                        onChange={onChange}
                        selectedOption={value}
                        options={paymentFrequencyOptions}
                    />
                )}
            />
            <FiatAmount
                control={control}
                customFiatAmountError={errors.customFiatAmount}
                defaultFiatAmount={savingsTrade?.fiatStringAmount}
                maximumPaymentAmountLimit={maximumPaymentAmountLimit}
                minimumPaymentAmountLimit={minimumPaymentAmountLimit}
                paymentAmounts={paymentAmounts}
                register={register}
                fiatAmount={fiatAmount}
                fiatCurrency={fiatCurrency}
            />
            <Summary
                accountSymbol={account.symbol}
                annualSavingsCryptoAmount={annualSavingsCryptoAmount}
                annualSavingsFiatAmount={annualSavingsFiatAmount}
                fiatCurrency={fiatCurrency}
            />
            <Label>
                <Translation id="TR_SAVINGS_SETUP_RECEIVING_ADDRESS" />
            </Label>
            <AddressOptionsWrapper>
                <AddressOptions
                    account={account}
                    control={control}
                    receiveSymbol={account.symbol}
                    setValue={setValue}
                    address={address}
                    menuPlacement="auto"
                />
                {showReceivingAddressChangePaymentInfoLabel && (
                    <ReceivingAddressChangesPaymentInfoLabel>
                        <Translation id="TR_SAVINGS_SETUP_RECEIVING_ADDRESS_CHANGES_PAYMENT_INFO" />
                    </ReceivingAddressChangesPaymentInfoLabel>
                )}
            </AddressOptionsWrapper>
            <Button isDisabled={!canConfirmSetup} isLoading={isSubmitting}>
                <Translation id="TR_SAVINGS_SETUP_CONFIRM_BUTTON" />
            </Button>
        </form>
    );
};

export default withCoinmarket(CoinmarketSavingsSetupContinue, {
    title: 'TR_NAV_INVITY',
});
