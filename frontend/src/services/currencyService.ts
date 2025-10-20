import axios from 'axios';

export interface CurrencyRates {
  [key: string]: number;
}

const API_BASE_URL = 'https://api.frankfurter.app';

const PREFERRED_CURRENCIES = ['EUR', 'USD', 'RUB', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'CNY', 'PLN', 'TRY'];
const CURRENCY_SYMBOLS: Record<string, string> = {
    EUR: '€', USD: '$', RUB: '₽', GBP: '£', JPY: '¥', CHF: '€',
    CAD: '$', AUD: '$', CNY: '¥', PLN: 'zł', TRY: '₺'
};

export const currencyService = {
  async getLatestRates(base: string = 'EUR'): Promise<{ rates: CurrencyRates; symbols: Record<string, string> }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/latest?from=${base}`);
      const rates = response.data.rates || {};
      rates[base] = 1;

      const filteredRates: CurrencyRates = { [base]: 1 };
      const symbols: Record<string, string> = { [base]: CURRENCY_SYMBOLS[base] || base };

      PREFERRED_CURRENCIES.forEach(currency => {
        if (rates[currency]) {
          filteredRates[currency] = rates[currency];
          symbols[currency] = CURRENCY_SYMBOLS[currency] || currency;
        }
      });

      return { rates: filteredRates, symbols };
    } catch (error) {
      console.error('Error fetching currency rates:', error);
      throw new Error('Could not fetch currency rates');
    }
  },

  getAvailableCurrencies(): string[] {
    return PREFERRED_CURRENCIES;
  },

  getCurrencySymbol(currencyCode: string): string {
    return CURRENCY_SYMBOLS[currencyCode] || currencyCode;
  }
};