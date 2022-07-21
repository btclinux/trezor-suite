import { formatCurrencyAmount } from '../src';

describe('formatCurrencyAmount', () => {
    it('formats with default locale', () => {
        const formattedValue = formatCurrencyAmount(123456789);

        expect(formattedValue).toStrictEqual('123,456,789');
    });

    it('formats with cs locale', () => {
        const formattedValue = formatCurrencyAmount(123456789, 'cs');

        expect(formattedValue).toStrictEqual('123 456 789');
    });

    it('fails with wrong values', () => {
        expect(formatCurrencyAmount(NaN)).toStrictEqual('');
        expect(formatCurrencyAmount(Infinity)).toStrictEqual('');
        expect(formatCurrencyAmount(Number.MIN_SAFE_INTEGER + 1)).toStrictEqual('');
        // @ts-expect-error invalid arg
        expect(formatCurrencyAmount('asadff')).toStrictEqual('');
    });
});
