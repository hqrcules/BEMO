import { RootState } from '@/store/store';

export const formatCurrency = (
    amount: number | string | undefined | null,
    state: RootState | undefined | null,
    options: Intl.NumberFormatOptions = {}
): string => {
    const currencyState = state?.currency;
    const fallbackSymbol = '€';

    if (!currencyState || !currencyState.rates || !currencyState.symbols) {
         const numericAmountFallback = Number(amount);
         if (isNaN(numericAmountFallback)) {
            return `${fallbackSymbol} ---`;
         }
         const formattedAmountFallback = new Intl.NumberFormat(
            navigator.language || 'en-US',
             { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }
         ).format(numericAmountFallback);
         return `${fallbackSymbol}${formattedAmountFallback}`;
    }

    const { selectedCurrency, baseCurrency, rates, symbols } = currencyState;

    const numericAmount = Number(amount);

    const displayCurrency = rates[selectedCurrency] ? selectedCurrency : baseCurrency;
    const displaySymbol = symbols[displayCurrency] || displayCurrency;


    if (isNaN(numericAmount)) {
        return `${displaySymbol} ---`;
    }

    const rate = rates[displayCurrency] || 1;
    const baseRate = rates[baseCurrency] || 1;

    const convertedAmount = (numericAmount / baseRate) * rate;

    const defaultOptions: Intl.NumberFormatOptions = {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: displayCurrency === 'BTC' ? 8 : 2,
    };

    const finalOptions = { ...defaultOptions, ...options };

    const formattedAmount = new Intl.NumberFormat(
        navigator.language || 'en-US',
        finalOptions
    ).format(convertedAmount);

    return `${displaySymbol}${formattedAmount}`;
};

export const convertToSelectedCurrency = (
    amountInEur: number | string | undefined | null,
    state: RootState | undefined | null
): number => {
    const currencyState = state?.currency;
    if (!currencyState || !currencyState.rates) {
        return Number(amountInEur) || 0;
    }

    const { selectedCurrency, baseCurrency, rates } = currencyState;
    const numericAmount = Number(amountInEur);
    if (isNaN(numericAmount)) {
        return 0;
    }

    const displayCurrency = rates[selectedCurrency] ? selectedCurrency : baseCurrency;
    const rate = rates[displayCurrency] || 1;
    const baseRate = rates[baseCurrency] || 1;

    return (numericAmount / baseRate) * rate;
};