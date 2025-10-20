import React from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setCurrency } from '@/store/slices/currencySlice';
import { Globe } from 'lucide-react';
import { currencyService } from '@/services/currencyService';

const CurrencySelector: React.FC = () => {
    const dispatch = useAppDispatch();
    const { selectedCurrency, rates, symbols } = useAppSelector((state) => state.currency);
    const availableCurrencies = currencyService.getAvailableCurrencies();

    const handleCurrencyChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        dispatch(setCurrency(event.target.value));
    };

    return (
        <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-text-tertiary pointer-events-none" />
            <select
                value={selectedCurrency}
                onChange={handleCurrencyChange}
                className="pl-9 pr-4 py-2 bg-dark-card border border-dark-border rounded-lg text-sm text-dark-text-secondary focus:outline-none focus:border-primary-500/50 appearance-none transition-colors cursor-pointer"
                aria-label="Select currency"
            >
                {availableCurrencies.map((currencyCode) => (
                    rates[currencyCode] && (
                        <option key={currencyCode} value={currencyCode}>
                            {symbols[currencyCode] || currencyCode} ({currencyCode})
                        </option>
                    )
                ))}
            </select>
        </div>
    );
};

export default CurrencySelector;