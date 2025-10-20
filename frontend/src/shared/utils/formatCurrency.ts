import { CurrencyState } from '@/store/slices/currencySlice';

export const formatCurrency = (
    amount: number | string | undefined | null,
    currencyState: CurrencyState | undefined | null,
    options: Intl.NumberFormatOptions = {}
): string => {
    const fallbackSymbol = '€';
    const fallbackLocale = navigator.language || 'en-US';

    const formatWithFallback = (value: number | string | undefined | null, opts: Intl.NumberFormatOptions = {}): string => {
        const numericValue = Number(value);
        if (isNaN(numericValue)) {
            return `${fallbackSymbol} ---`;
        }
        const mergedOptions: Intl.NumberFormatOptions = {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
            ...opts,
        };
        if (typeof mergedOptions.maximumFractionDigits !== 'undefined' && (mergedOptions.maximumFractionDigits < 0 || mergedOptions.maximumFractionDigits > 20)) {
            console.warn(`Invalid maximumFractionDigits: ${mergedOptions.maximumFractionDigits}. Using default 2.`);
            mergedOptions.maximumFractionDigits = 2;
        }

        try {
            const formatted = new Intl.NumberFormat(fallbackLocale, mergedOptions).format(numericValue);
            return `${fallbackSymbol}${formatted}`;
        } catch (e) {
             console.error("Error formatting currency:", e, "Value:", value, "Options:", mergedOptions);
             return `${fallbackSymbol}${numericValue.toFixed(2)}`;
        }
    };


    if (!currencyState || !currencyState.rates || !currencyState.symbols) {
         return formatWithFallback(amount, options);
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

    const convertedAmount = baseRate !== 0 ? (numericAmount / baseRate) * rate : 0;

    const defaultMaximumFractionDigits = displayCurrency === 'BTC' ? 8 : (displayCurrency === 'ETH' ? 6 : 2);

    const defaultOptions: Intl.NumberFormatOptions = {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: defaultMaximumFractionDigits,
    };

    const finalOptions = { ...defaultOptions, ...options };

    if (typeof finalOptions.maximumFractionDigits !== 'undefined') {
        finalOptions.maximumFractionDigits = Math.max(0, Math.min(20, finalOptions.maximumFractionDigits));
         if (typeof finalOptions.minimumFractionDigits !== 'undefined') {
             finalOptions.maximumFractionDigits = Math.max(finalOptions.minimumFractionDigits, finalOptions.maximumFractionDigits);
         }
    }


    try {
        const formattedAmount = new Intl.NumberFormat(
            fallbackLocale,
            finalOptions
        ).format(convertedAmount);
         return `${displaySymbol}${formattedAmount}`;
    } catch (e) {
         console.error("Error formatting currency with state:", e, "Amount:", amount, "Options:", finalOptions, "Converted:", convertedAmount);
         return `${displaySymbol}${convertedAmount.toFixed(finalOptions.maximumFractionDigits ?? 2)}`;
    }
};

export const convertToSelectedCurrency = (
    amountInEur: number | string | undefined | null,
    currencyState: CurrencyState | undefined | null
): number => {
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

    return baseRate !== 0 ? (numericAmount / baseRate) * rate : 0;
};