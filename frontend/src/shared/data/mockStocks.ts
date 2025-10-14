// frontend/src/shared/data/mockStocks.ts

export interface Stock {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  icon?: string | null;
  isFavorite: boolean;
  category: 'stocks' | 'commodities' | 'currencies' | 'crypto';
}

// ============= HELPER FUNCTIONS =============

/**
 * Get crypto logo from Logo.dev API (supports 20,000+ cryptocurrencies)
 */
const getCryptoIcon = (symbol: string): string => {
  const symbolLower = symbol.toLowerCase();
  return `https://logo.dev/crypto/${symbolLower}?format=png&size=128`;
};

/**
 * Get stock company logo from Clearbit
 */
const getStockIcon = (symbol: string): string | null => {
  const domainMap: Record<string, string> = {
    'AAPL': 'apple.com', 'MSFT': 'microsoft.com', 'TSLA': 'tesla.com',
    'NFLX': 'netflix.com', 'META': 'meta.com', 'AMD': 'amd.com',
    'INTC': 'intel.com', 'BABA': 'alibaba.com', 'ORCL': 'oracle.com',
    'CRM': 'salesforce.com', 'CSCO': 'cisco.com', 'ADBE': 'adobe.com',
    'IBM': 'ibm.com', 'UBER': 'uber.com', 'PYPL': 'paypal.com',
    'DIS': 'disney.com', 'NKE': 'nike.com', 'SBUX': 'starbucks.com',
    'MCD': 'mcdonalds.com', 'BA': 'boeing.com', 'JPM': 'jpmorganchase.com',
    'BAC': 'bankofamerica.com', 'V': 'visa.com', 'MA': 'mastercard.com',
    'WMT': 'walmart.com', 'HD': 'homedepot.com', 'PG': 'pg.com',
  };
  const domain = domainMap[symbol];
  return domain ? `https://logo.clearbit.com/${domain}` : null;
};

/**
 * Generate country flag emoji from ISO code
 */
const getFlagEmoji = (countryCode: string): string => {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

/**
 * Get currency pair flags (e.g., EUR/USD -> 🇪🇺🇺🇸)
 */
const getCurrencyIcon = (pair: string): string => {
  const cleaned = pair.replace('/', '').toUpperCase();
  const currencyFlagMap: Record<string, string> = {
    'USD': 'US', 'EUR': 'EU', 'GBP': 'GB', 'JPY': 'JP',
    'AUD': 'AU', 'CAD': 'CA', 'CHF': 'CH', 'CNY': 'CN',
    'NZD': 'NZ', 'SEK': 'SE', 'NOK': 'NO', 'SGD': 'SG',
    'KRW': 'KR', 'INR': 'IN', 'BRL': 'BR', 'MXN': 'MX',
    'TRY': 'TR', 'ZAR': 'ZA', 'RUB': 'RU', 'PLN': 'PL',
    'THB': 'TH', 'IDR': 'ID', 'MYR': 'MY', 'HKD': 'HK',
  };
  const baseCurrency = cleaned.substring(0, 3);
  const quoteCurrency = cleaned.substring(3, 6);
  const baseFlag = currencyFlagMap[baseCurrency] ? getFlagEmoji(currencyFlagMap[baseCurrency]) : '';
  const quoteFlag = currencyFlagMap[quoteCurrency] ? getFlagEmoji(currencyFlagMap[quoteCurrency]) : '';
  return `${baseFlag}${quoteFlag}`;
};

// ============= STOCKS (30 популярних компаній) =============
export const mockStocks: Stock[] = [
  // Tech Giants
  { id: 's1', symbol: 'AAPL', name: 'Apple Inc', price: 178.45, change: -1.23, changePercent: -0.68, isFavorite: true, category: 'stocks', icon: getStockIcon('AAPL') },
  { id: 's2', symbol: 'MSFT', name: 'Microsoft', price: 412.33, change: 3.45, changePercent: 0.84, isFavorite: false, category: 'stocks', icon: getStockIcon('MSFT') },
  { id: 's3', symbol: 'GOOGL', name: 'Alphabet (Google)', price: 142.50, change: 2.10, changePercent: 1.50, isFavorite: true, category: 'stocks', icon: getStockIcon('GOOGL') },
  { id: 's4', symbol: 'AMZN', name: 'Amazon', price: 178.25, change: -3.12, changePercent: -1.72, isFavorite: false, category: 'stocks', icon: getStockIcon('AMZN') },
  { id: 's5', symbol: 'NVDA', name: 'NVIDIA', price: 875.90, change: 12.45, changePercent: 1.44, isFavorite: true, category: 'stocks', icon: getStockIcon('NVDA') },
  { id: 's6', symbol: 'META', name: 'Meta Platforms', price: 512.78, change: 8.45, changePercent: 1.68, isFavorite: false, category: 'stocks', icon: getStockIcon('META') },
  { id: 's7', symbol: 'TSLA', name: 'Tesla Inc', price: 245.67, change: 5.23, changePercent: 2.18, isFavorite: false, category: 'stocks', icon: getStockIcon('TSLA') },
  { id: 's8', symbol: 'NFLX', name: 'Netflix', price: 567.23, change: 23.45, changePercent: 4.31, isFavorite: false, category: 'stocks', icon: getStockIcon('NFLX') },
  { id: 's9', symbol: 'AMD', name: 'AMD', price: 165.34, change: -2.45, changePercent: -1.46, isFavorite: false, category: 'stocks', icon: getStockIcon('AMD') },
  { id: 's10', symbol: 'INTC', name: 'Intel', price: 45.67, change: 0.89, changePercent: 1.99, isFavorite: false, category: 'stocks', icon: getStockIcon('INTC') },

  // Software & Cloud
  { id: 's11', symbol: 'ORCL', name: 'Oracle', price: 112.45, change: 1.34, changePercent: 1.21, isFavorite: false, category: 'stocks', icon: getStockIcon('ORCL') },
  { id: 's12', symbol: 'CRM', name: 'Salesforce', price: 267.89, change: -3.45, changePercent: -1.27, isFavorite: false, category: 'stocks', icon: getStockIcon('CRM') },

  // E-commerce & Services
  { id: 's15', symbol: 'BABA', name: 'Alibaba', price: 89.45, change: -1.23, changePercent: -1.36, isFavorite: false, category: 'stocks', icon: getStockIcon('BABA') },
  { id: 's16', symbol: 'UBER', name: 'Uber', price: 67.23, change: 2.34, changePercent: 3.60, isFavorite: false, category: 'stocks', icon: getStockIcon('UBER') },
  { id: 's17', symbol: 'PYPL', name: 'PayPal', price: 78.45, change: -0.98, changePercent: -1.23, isFavorite: false, category: 'stocks', icon: getStockIcon('PYPL') },

  // Consumer Brands
  { id: 's18', symbol: 'DIS', name: 'Disney', price: 98.76, change: 1.45, changePercent: 1.49, isFavorite: false, category: 'stocks', icon: getStockIcon('DIS') },
  { id: 's19', symbol: 'NKE', name: 'Nike', price: 112.34, change: 0.87, changePercent: 0.78, isFavorite: false, category: 'stocks', icon: getStockIcon('NKE') },
  { id: 's20', symbol: 'SBUX', name: 'Starbucks', price: 96.23, change: -1.12, changePercent: -1.15, isFavorite: false, category: 'stocks', icon: getStockIcon('SBUX') },
  { id: 's21', symbol: 'MCD', name: 'McDonald\'s', price: 287.45, change: 2.34, changePercent: 0.82, isFavorite: false, category: 'stocks', icon: getStockIcon('MCD') },

  // Industrial
  { id: 's22', symbol: 'BA', name: 'Boeing', price: 234.56, change: 3.45, changePercent: 1.49, isFavorite: false, category: 'stocks', icon: getStockIcon('BA') },

  // Finance
  { id: 's23', symbol: 'JPM', name: 'JPMorgan Chase', price: 187.45, change: 1.23, changePercent: 0.66, isFavorite: false, category: 'stocks', icon: getStockIcon('JPM') },
  { id: 's25', symbol: 'V', name: 'Visa', price: 267.89, change: 2.34, changePercent: 0.88, isFavorite: false, category: 'stocks', icon: getStockIcon('V') },
  { id: 's26', symbol: 'MA', name: 'Mastercard', price: 421.34, change: 3.56, changePercent: 0.85, isFavorite: false, category: 'stocks', icon: getStockIcon('MA') },

  // Retail
  { id: 's27', symbol: 'WMT', name: 'Walmart', price: 167.23, change: 1.12, changePercent: 0.67, isFavorite: false, category: 'stocks', icon: getStockIcon('WMT') },
  { id: 's28', symbol: 'HD', name: 'Home Depot', price: 345.12, change: 2.78, changePercent: 0.81, isFavorite: false, category: 'stocks', icon: getStockIcon('HD') },
  { id: 's29', symbol: 'PG', name: 'Procter & Gamble', price: 145.67, change: 0.89, changePercent: 0.61, isFavorite: false, category: 'stocks', icon: getStockIcon('PG') },
];

// ============= COMMODITIES (10 товарів) =============
export const mockCommodities: Stock[] = [
  { id: 'c1', symbol: 'GOLD', name: 'Gold', price: 2045.50, change: 12.30, changePercent: 0.61, isFavorite: true, category: 'commodities', icon: '🪙' },
  { id: 'c2', symbol: 'SILVER', name: 'Silver', price: 24.35, change: -0.23, changePercent: -0.94, isFavorite: true, category: 'commodities', icon: '⚪' },
  { id: 'c3', symbol: 'OIL', name: 'Oil WTI', price: 82.45, change: 1.89, changePercent: 2.34, isFavorite: true, category: 'commodities', icon: '🛢️' },
  { id: 'c4', symbol: 'BRENT', name: 'Oil Brent', price: 86.30, change: 2.10, changePercent: 2.49, isFavorite: false, category: 'commodities', icon: '🛢️' },
  { id: 'c5', symbol: 'GAS', name: 'Natural Gas', price: 3.15, change: 0.08, changePercent: 2.60, isFavorite: false, category: 'commodities', icon: '🔥' },
  { id: 'c6', symbol: 'COPPER', name: 'Copper', price: 8.95, change: 0.12, changePercent: 1.36, isFavorite: false, category: 'commodities', icon: '🟤' },
  { id: 'c7', symbol: 'PLATINUM', name: 'Platinum', price: 945.20, change: -5.40, changePercent: -0.57, isFavorite: false, category: 'commodities', icon: '⚪' },
  { id: 'c8', symbol: 'PALLADIUM', name: 'Palladium', price: 1234.56, change: 15.23, changePercent: 1.25, isFavorite: false, category: 'commodities', icon: '⚪' },
  { id: 'c9', symbol: 'WHEAT', name: 'Wheat', price: 234.50, change: -3.45, changePercent: -1.45, isFavorite: false, category: 'commodities', icon: '🌾' },
  { id: 'c10', symbol: 'CORN', name: 'Corn', price: 187.25, change: 2.15, changePercent: 1.16, isFavorite: false, category: 'commodities', icon: '🌽' },
];

// ============= FOREX (35 пар) =============
export const mockCurrencies: Stock[] = [
  // Major Pairs
  { id: 'cur1', symbol: 'EUR/USD', name: 'Euro / US Dollar', price: 1.0856, change: 0.0012, changePercent: 0.11, isFavorite: true, category: 'currencies', icon: getCurrencyIcon('EURUSD') },
  { id: 'cur2', symbol: 'GBP/USD', name: 'British Pound / US Dollar', price: 1.2634, change: -0.0023, changePercent: -0.18, isFavorite: true, category: 'currencies', icon: getCurrencyIcon('GBPUSD') },
  { id: 'cur3', symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', price: 149.87, change: 0.45, changePercent: 0.30, isFavorite: true, category: 'currencies', icon: getCurrencyIcon('USDJPY') },
  { id: 'cur4', symbol: 'USD/CHF', name: 'US Dollar / Swiss Franc', price: 0.8890, change: 0.0015, changePercent: 0.17, isFavorite: false, category: 'currencies', icon: getCurrencyIcon('USDCHF') },
  { id: 'cur5', symbol: 'AUD/USD', name: 'Australian Dollar / USD', price: 0.6450, change: 0.00123, changePercent: 0.19, isFavorite: false, category: 'currencies', icon: getCurrencyIcon('AUDUSD') },
  { id: 'cur6', symbol: 'USD/CAD', name: 'US Dollar / Canadian Dollar', price: 1.3620, change: -0.0034, changePercent: -0.25, isFavorite: false, category: 'currencies', icon: getCurrencyIcon('USDCAD') },
  { id: 'cur7', symbol: 'NZD/USD', name: 'New Zealand Dollar / USD', price: 0.5950, change: 0.0018, changePercent: 0.30, isFavorite: false, category: 'currencies', icon: getCurrencyIcon('NZDUSD') },

  // Minor Pairs
  { id: 'cur8', symbol: 'EUR/GBP', name: 'Euro / British Pound', price: 0.8575, change: 0.0021, changePercent: 0.25, isFavorite: false, category: 'currencies', icon: getCurrencyIcon('EURGBP') },
  { id: 'cur9', symbol: 'EUR/JPY', name: 'Euro / Japanese Yen', price: 162.25, change: 0.67, changePercent: 0.41, isFavorite: false, category: 'currencies', icon: getCurrencyIcon('EURJPY') },
  { id: 'cur10', symbol: 'GBP/JPY', name: 'British Pound / Japanese Yen', price: 189.15, change: -0.89, changePercent: -0.47, isFavorite: false, category: 'currencies', icon: getCurrencyIcon('GBPJPY') },
  { id: 'cur11', symbol: 'EUR/CHF', name: 'Euro / Swiss Franc', price: 0.9645, change: 0.0012, changePercent: 0.12, isFavorite: false, category: 'currencies', icon: getCurrencyIcon('EURCHF') },
  { id: 'cur12', symbol: 'EUR/AUD', name: 'Euro / Australian Dollar', price: 1.6825, change: -0.0045, changePercent: -0.27, isFavorite: false, category: 'currencies', icon: getCurrencyIcon('EURAUD') },
  { id: 'cur13', symbol: 'EUR/CAD', name: 'Euro / Canadian Dollar', price: 1.4775, change: 0.0023, changePercent: 0.16, isFavorite: false, category: 'currencies', icon: getCurrencyIcon('EURCAD') },
  { id: 'cur14', symbol: 'GBP/CHF', name: 'British Pound / Swiss Franc', price: 1.1245, change: 0.0034, changePercent: 0.30, isFavorite: false, category: 'currencies', icon: getCurrencyIcon('GBPCHF') },
  { id: 'cur15', symbol: 'GBP/AUD', name: 'British Pound / Australian Dollar', price: 1.9615, change: -0.0078, changePercent: -0.40, isFavorite: false, category: 'currencies', icon: getCurrencyIcon('GBPAUD') },

  // Exotic Pairs
  { id: 'cur16', symbol: 'USD/CNY', name: 'US Dollar / Chinese Yuan', price: 7.2450, change: 0.0125, changePercent: 0.17, isFavorite: false, category: 'currencies', icon: getCurrencyIcon('USDCNY') },
  { id: 'cur17', symbol: 'USD/HKD', name: 'US Dollar / Hong Kong Dollar', price: 7.8100, change: 0.0015, changePercent: 0.02, isFavorite: false, category: 'currencies', icon: getCurrencyIcon('USDHKD') },
  { id: 'cur18', symbol: 'USD/SGD', name: 'US Dollar / Singapore Dollar', price: 1.3450, change: -0.0023, changePercent: -0.17, isFavorite: false, category: 'currencies', icon: getCurrencyIcon('USDSGD') },
  { id: 'cur19', symbol: 'USD/INR', name: 'US Dollar / Indian Rupee', price: 83.25, change: 0.15, changePercent: 0.18, isFavorite: false, category: 'currencies', icon: getCurrencyIcon('USDINR') },
  { id: 'cur20', symbol: 'USD/MXN', name: 'US Dollar / Mexican Peso', price: 17.15, change: -0.12, changePercent: -0.70, isFavorite: false, category: 'currencies', icon: getCurrencyIcon('USDMXN') },
  { id: 'cur21', symbol: 'USD/BRL', name: 'US Dollar / Brazilian Real', price: 5.02, change: 0.03, changePercent: 0.60, isFavorite: false, category: 'currencies', icon: getCurrencyIcon('USDBRL') },
  { id: 'cur22', symbol: 'USD/ZAR', name: 'US Dollar / South African Rand', price: 18.75, change: -0.23, changePercent: -1.21, isFavorite: false, category: 'currencies', icon: getCurrencyIcon('USDZAR') },
  { id: 'cur23', symbol: 'USD/TRY', name: 'US Dollar / Turkish Lira', price: 32.45, change: 0.67, changePercent: 2.10, isFavorite: false, category: 'currencies', icon: getCurrencyIcon('USDTRY') },
  { id: 'cur24', symbol: 'USD/RUB', name: 'US Dollar / Russian Ruble', price: 92.50, change: 1.25, changePercent: 1.37, isFavorite: false, category: 'currencies', icon: getCurrencyIcon('USDRUB') },
  { id: 'cur25', symbol: 'USD/THB', name: 'US Dollar / Thai Baht', price: 35.75, change: 0.12, changePercent: 0.34, isFavorite: false, category: 'currencies', icon: getCurrencyIcon('USDTHB') },
  { id: 'cur26', symbol: 'USD/IDR', name: 'US Dollar / Indonesian Rupiah', price: 15750, change: 25, changePercent: 0.16, isFavorite: false, category: 'currencies', icon: getCurrencyIcon('USDIDR') },
  { id: 'cur27', symbol: 'USD/MYR', name: 'US Dollar / Malaysian Ringgit', price: 4.72, change: -0.02, changePercent: -0.42, isFavorite: false, category: 'currencies', icon: getCurrencyIcon('USDMYR') },
  { id: 'cur28', symbol: 'EUR/TRY', name: 'Euro / Turkish Lira', price: 35.20, change: 0.45, changePercent: 1.29, isFavorite: false, category: 'currencies', icon: getCurrencyIcon('EURTRY') },
  { id: 'cur29', symbol: 'EUR/PLN', name: 'Euro / Polish Zloty', price: 4.35, change: 0.02, changePercent: 0.46, isFavorite: false, category: 'currencies', icon: getCurrencyIcon('EURPLN') },
  { id: 'cur30', symbol: 'GBP/ZAR', name: 'British Pound / South African Rand', price: 23.70, change: -0.15, changePercent: -0.63, isFavorite: false, category: 'currencies', icon: getCurrencyIcon('GBPZAR') },
];

// ============= CRYPTOCURRENCIES (100 монет з логотипами) =============
export const mockCrypto: Stock[] = [
  // Top 20
  { id: 'cry1', symbol: 'BTC', name: 'Bitcoin', price: 43250.50, change: 1234.50, changePercent: 2.94, isFavorite: true, category: 'crypto', icon: getCryptoIcon('btc') },
  { id: 'cry2', symbol: 'ETH', name: 'Ethereum', price: 2245.30, change: -45.20, changePercent: -1.97, isFavorite: true, category: 'crypto', icon: getCryptoIcon('eth') },
  { id: 'cry3', symbol: 'USDT', name: 'Tether', price: 1.0001, change: 0.0001, changePercent: 0.01, isFavorite: false, category: 'crypto', icon: getCryptoIcon('usdt') },
  { id: 'cry4', symbol: 'BNB', name: 'Binance Coin', price: 312.45, change: 8.90, changePercent: 2.93, isFavorite: true, category: 'crypto', icon: getCryptoIcon('bnb') },
  { id: 'cry5', symbol: 'SOL', name: 'Solana', price: 98.67, change: -2.34, changePercent: -2.32, isFavorite: true, category: 'crypto', icon: getCryptoIcon('sol') },
  { id: 'cry6', symbol: 'XRP', name: 'Ripple', price: 0.6234, change: 0.0123, changePercent: 2.01, isFavorite: false, category: 'crypto', icon: getCryptoIcon('xrp') },
  { id: 'cry7', symbol: 'ADA', name: 'Cardano', price: 0.5812, change: -0.0091, changePercent: -1.54, isFavorite: false, category: 'crypto', icon: getCryptoIcon('ada') },
  { id: 'cry8', symbol: 'DOGE', name: 'Dogecoin', price: 0.0823, change: 0.0012, changePercent: 1.48, isFavorite: false, category: 'crypto', icon: getCryptoIcon('doge') },
  { id: 'cry9', symbol: 'TRX', name: 'TRON', price: 0.1156, change: 0.0034, changePercent: 3.03, isFavorite: false, category: 'crypto', icon: getCryptoIcon('trx') },
  { id: 'cry10', symbol: 'DOT', name: 'Polkadot', price: 6.78, change: 0.34, changePercent: 5.28, isFavorite: false, category: 'crypto', icon: getCryptoIcon('dot') },
  { id: 'cry11', symbol: 'MATIC', name: 'Polygon', price: 0.8945, change: -0.0234, changePercent: -2.55, isFavorite: false, category: 'crypto', icon: getCryptoIcon('matic') },
  { id: 'cry12', symbol: 'LTC', name: 'Litecoin', price: 89.34, change: 2.14, changePercent: 2.46, isFavorite: false, category: 'crypto', icon: getCryptoIcon('ltc') },
  { id: 'cry13', symbol: 'SHIB', name: 'Shiba Inu', price: 0.00001234, change: 0.00000012, changePercent: 0.98, isFavorite: false, category: 'crypto', icon: getCryptoIcon('shib') },
  { id: 'cry14', symbol: 'AVAX', name: 'Avalanche', price: 34.56, change: 1.23, changePercent: 3.69, isFavorite: false, category: 'crypto', icon: getCryptoIcon('avax') },
  { id: 'cry15', symbol: 'UNI', name: 'Uniswap', price: 9.12, change: 0.45, changePercent: 5.19, isFavorite: false, category: 'crypto', icon: getCryptoIcon('uni') },
  { id: 'cry16', symbol: 'LINK', name: 'Chainlink', price: 14.56, change: -0.67, changePercent: -4.40, isFavorite: false, category: 'crypto', icon: getCryptoIcon('link') },
  { id: 'cry17', symbol: 'ATOM', name: 'Cosmos', price: 10.45, change: -0.56, changePercent: -5.08, isFavorite: false, category: 'crypto', icon: getCryptoIcon('atom') },
  { id: 'cry18', symbol: 'ETC', name: 'Ethereum Classic', price: 23.45, change: 0.89, changePercent: 3.94, isFavorite: false, category: 'crypto', icon: getCryptoIcon('etc') },
  { id: 'cry19', symbol: 'XLM', name: 'Stellar', price: 0.1234, change: 0.0023, changePercent: 1.90, isFavorite: false, category: 'crypto', icon: getCryptoIcon('xlm') },
  { id: 'cry20', symbol: 'NEAR', name: 'NEAR Protocol', price: 3.45, change: -0.12, changePercent: -3.36, isFavorite: false, category: 'crypto', icon: getCryptoIcon('near') },

  // 21-50
  { id: 'cry21', symbol: 'FIL', name: 'Filecoin', price: 5.67, change: 0.23, changePercent: 4.23, isFavorite: false, category: 'crypto', icon: getCryptoIcon('fil') },
  { id: 'cry22', symbol: 'APT', name: 'Aptos', price: 8.67, change: 0.45, changePercent: 5.48, isFavorite: false, category: 'crypto', icon: getCryptoIcon('apt') },
  { id: 'cry23', symbol: 'VET', name: 'VeChain', price: 0.0345, change: -0.0012, changePercent: -3.36, isFavorite: false, category: 'crypto', icon: getCryptoIcon('vet') },
  { id: 'cry24', symbol: 'ICP', name: 'Internet Computer', price: 12.34, change: 0.67, changePercent: 5.74, isFavorite: false, category: 'crypto', icon: getCryptoIcon('icp') },
  { id: 'cry25', symbol: 'ALGO', name: 'Algorand', price: 0.2345, change: -0.0089, changePercent: -3.66, isFavorite: false, category: 'crypto', icon: getCryptoIcon('algo') },
  { id: 'cry26', symbol: 'QNT', name: 'Quant', price: 123.45, change: 5.67, changePercent: 4.81, isFavorite: false, category: 'crypto', icon: getCryptoIcon('qnt') },
  { id: 'cry27', symbol: 'HBAR', name: 'Hedera', price: 0.0789, change: 0.0023, changePercent: 3.00, isFavorite: false, category: 'crypto', icon: getCryptoIcon('hbar') },
  { id: 'cry28', symbol: 'OP', name: 'Optimism', price: 2.34, change: 0.12, changePercent: 5.41, isFavorite: false, category: 'crypto', icon: getCryptoIcon('op') },
  { id: 'cry29', symbol: 'INJ', name: 'Injective', price: 34.56, change: -1.23, changePercent: -3.44, isFavorite: false, category: 'crypto', icon: getCryptoIcon('inj') },
  { id: 'cry30', symbol: 'LDO', name: 'Lido DAO', price: 2.89, change: 0.15, changePercent: 5.47, isFavorite: false, category: 'crypto', icon: getCryptoIcon('ldo') },
  { id: 'cry31', symbol: 'ARB', name: 'Arbitrum', price: 1.23, change: -0.08, changePercent: -6.11, isFavorite: false, category: 'crypto', icon: getCryptoIcon('arb') },
  { id: 'cry32', symbol: 'PEPE', name: 'Pepe', price: 0.00000123, change: 0.00000012, changePercent: 10.81, isFavorite: false, category: 'crypto', icon: getCryptoIcon('pepe') },
  { id: 'cry33', symbol: 'MKR', name: 'Maker', price: 1567.89, change: 23.45, changePercent: 1.52, isFavorite: false, category: 'crypto', icon: getCryptoIcon('mkr') },
  { id: 'cry34', symbol: 'RNDR', name: 'Render', price: 7.89, change: 0.34, changePercent: 4.51, isFavorite: false, category: 'crypto', icon: getCryptoIcon('rndr') },
  { id: 'cry35', symbol: 'STX', name: 'Stacks', price: 1.45, change: -0.08, changePercent: -5.23, isFavorite: false, category: 'crypto', icon: getCryptoIcon('stx') },
  { id: 'cry36', symbol: 'AAVE', name: 'Aave', price: 98.45, change: 3.23, changePercent: 3.39, isFavorite: false, category: 'crypto', icon: getCryptoIcon('aave') },
  { id: 'cry37', symbol: 'SAND', name: 'The Sandbox', price: 0.5678, change: -0.0234, changePercent: -3.96, isFavorite: false, category: 'crypto', icon: getCryptoIcon('sand') },
  { id: 'cry38', symbol: 'MANA', name: 'Decentraland', price: 0.6789, change: 0.0123, changePercent: 1.85, isFavorite: false, category: 'crypto', icon: getCryptoIcon('mana') },
  { id: 'cry39', symbol: 'GRT', name: 'The Graph', price: 0.1789, change: -0.0089, changePercent: -4.74, isFavorite: false, category: 'crypto', icon: getCryptoIcon('grt') },
  { id: 'cry40', symbol: 'FTM', name: 'Fantom', price: 0.4567, change: 0.0234, changePercent: 5.40, isFavorite: false, category: 'crypto', icon: getCryptoIcon('ftm') },
  { id: 'cry41', symbol: 'AXS', name: 'Axie Infinity', price: 7.89, change: -0.45, changePercent: -5.40, isFavorite: false, category: 'crypto', icon: getCryptoIcon('axs') },
  { id: 'cry42', symbol: 'EOS', name: 'EOS', price: 0.8901, change: 0.0234, changePercent: 2.70, isFavorite: false, category: 'crypto', icon: getCryptoIcon('eos') },
  { id: 'cry43', symbol: 'XTZ', name: 'Tezos', price: 1.12, change: -0.05, changePercent: -4.27, isFavorite: false, category: 'crypto', icon: getCryptoIcon('xtz') },
  { id: 'cry44', symbol: 'RUNE', name: 'THORChain', price: 5.67, change: 0.23, changePercent: 4.23, isFavorite: false, category: 'crypto', icon: getCryptoIcon('rune') },
  { id: 'cry45', symbol: 'FLOW', name: 'Flow', price: 0.9012, change: -0.0456, changePercent: -4.81, isFavorite: false, category: 'crypto', icon: getCryptoIcon('flow') },
  { id: 'cry46', symbol: 'KSM', name: 'Kusama', price: 34.56, change: 1.23, changePercent: 3.69, isFavorite: false, category: 'crypto', icon: getCryptoIcon('ksm') },
  { id: 'cry47', symbol: 'ZEC', name: 'Zcash', price: 34.23, change: -1.12, changePercent: -3.17, isFavorite: false, category: 'crypto', icon: getCryptoIcon('zec') },
  { id: 'cry48', symbol: 'COMP', name: 'Compound', price: 56.78, change: 2.34, changePercent: 4.30, isFavorite: false, category: 'crypto', icon: getCryptoIcon('comp') },
  { id: 'cry49', symbol: 'SNX', name: 'Synthetix', price: 3.45, change: -0.12, changePercent: -3.36, isFavorite: false, category: 'crypto', icon: getCryptoIcon('snx') },
  { id: 'cry50', symbol: 'DASH', name: 'Dash', price: 45.67, change: 1.89, changePercent: 4.32, isFavorite: false, category: 'crypto', icon: getCryptoIcon('dash') },

  // 51-100
  { id: 'cry51', symbol: 'WAVES', name: 'Waves', price: 2.34, change: -0.08, changePercent: -3.30, isFavorite: false, category: 'crypto', icon: getCryptoIcon('waves') },
  { id: 'cry52', symbol: 'XMR', name: 'Monero', price: 167.89, change: 3.45, changePercent: 2.10, isFavorite: false, category: 'crypto', icon: getCryptoIcon('xmr') },
  { id: 'cry53', symbol: 'BCH', name: 'Bitcoin Cash', price: 234.56, change: -5.67, changePercent: -2.36, isFavorite: false, category: 'crypto', icon: getCryptoIcon('bch') },
  { id: 'cry54', symbol: 'THETA', name: 'Theta', price: 1.23, change: 0.05, changePercent: 4.23, isFavorite: false, category: 'crypto', icon: getCryptoIcon('theta') },
  { id: 'cry55', symbol: 'APE', name: 'ApeCoin', price: 1.89, change: -0.08, changePercent: -4.06, isFavorite: false, category: 'crypto', icon: getCryptoIcon('ape') },
  { id: 'cry56', symbol: 'GMX', name: 'GMX', price: 45.67, change: 2.34, changePercent: 5.40, isFavorite: false, category: 'crypto', icon: getCryptoIcon('gmx') },
  { id: 'cry57', symbol: 'CRV', name: 'Curve DAO', price: 0.8901, change: -0.0345, changePercent: -3.73, isFavorite: false, category: 'crypto', icon: getCryptoIcon('crv') },
  { id: 'cry58', symbol: 'ENJ', name: 'Enjin Coin', price: 0.3456, change: 0.0123, changePercent: 3.69, isFavorite: false, category: 'crypto', icon: getCryptoIcon('enj') },
  { id: 'cry59', symbol: 'AR', name: 'Arweave', price: 8.90, change: 0.34, changePercent: 3.97, isFavorite: false, category: 'crypto', icon: getCryptoIcon('ar') },
  { id: 'cry60', symbol: 'ZIL', name: 'Zilliqa', price: 0.0234, change: -0.0012, changePercent: -4.88, isFavorite: false, category: 'crypto', icon: getCryptoIcon('zil') },
  { id: 'cry61', symbol: 'CHZ', name: 'Chiliz', price: 0.1012, change: 0.0045, changePercent: 4.65, isFavorite: false, category: 'crypto', icon: getCryptoIcon('chz') },
  { id: 'cry62', symbol: 'BAT', name: 'Basic Attention', price: 0.2345, change: -0.0089, changePercent: -3.66, isFavorite: false, category: 'crypto', icon: getCryptoIcon('bat') },
  { id: 'cry63', symbol: 'ZRX', name: '0x Protocol', price: 0.4567, change: 0.0123, changePercent: 2.77, isFavorite: false, category: 'crypto', icon: getCryptoIcon('zrx') },
  { id: 'cry64', symbol: 'OMG', name: 'OMG Network', price: 1.23, change: -0.06, changePercent: -4.65, isFavorite: false, category: 'crypto', icon: getCryptoIcon('omg') },
  { id: 'cry65', symbol: '1INCH', name: '1inch', price: 0.4567, change: 0.0234, changePercent: 5.40, isFavorite: false, category: 'crypto', icon: getCryptoIcon('1inch') },
  { id: 'cry66', symbol: 'SUSHI', name: 'SushiSwap', price: 1.12, change: -0.05, changePercent: -4.27, isFavorite: false, category: 'crypto', icon: getCryptoIcon('sushi') },
  { id: 'cry67', symbol: 'CELR', name: 'Celer Network', price: 0.0234, change: 0.0012, changePercent: 5.40, isFavorite: false, category: 'crypto', icon: getCryptoIcon('celr') },
  { id: 'cry68', symbol: 'RVN', name: 'Ravencoin', price: 0.0345, change: -0.0012, changePercent: -3.36, isFavorite: false, category: 'crypto', icon: getCryptoIcon('rvn') },
  { id: 'cry69', symbol: 'COTI', name: 'COTI', price: 0.0789, change: 0.0034, changePercent: 4.51, isFavorite: false, category: 'crypto', icon: getCryptoIcon('coti') },
  { id: 'cry70', symbol: 'IOTX', name: 'IoTeX', price: 0.0456, change: -0.0023, changePercent: -4.80, isFavorite: false, category: 'crypto', icon: getCryptoIcon('iotx') },
  { id: 'cry71', symbol: 'ANKR', name: 'Ankr', price: 0.0345, change: 0.0012, changePercent: 3.60, isFavorite: false, category: 'crypto', icon: getCryptoIcon('ankr') },
  { id: 'cry72', symbol: 'ONT', name: 'Ontology', price: 0.2345, change: -0.0089, changePercent: -3.66, isFavorite: false, category: 'crypto', icon: getCryptoIcon('ont') },
  { id: 'cry73', symbol: 'OCEAN', name: 'Ocean Protocol', price: 0.5678, change: 0.0234, changePercent: 4.30, isFavorite: false, category: 'crypto', icon: getCryptoIcon('ocean') },
  { id: 'cry74', symbol: 'RSR', name: 'Reserve Rights', price: 0.0056, change: -0.0002, changePercent: -3.45, isFavorite: false, category: 'crypto', icon: getCryptoIcon('rsr') },
  { id: 'cry75', symbol: 'BAND', name: 'Band Protocol', price: 1.45, change: 0.07, changePercent: 5.07, isFavorite: false, category: 'crypto', icon: getCryptoIcon('band') },
  { id: 'cry76', symbol: 'SFP', name: 'SafePal', price: 0.6789, change: -0.0234, changePercent: -3.33, isFavorite: false, category: 'crypto', icon: getCryptoIcon('sfp') },
  { id: 'cry77', symbol: 'REN', name: 'Ren', price: 0.0789, change: 0.0034, changePercent: 4.50, isFavorite: false, category: 'crypto', icon: getCryptoIcon('ren') },
  { id: 'cry78', symbol: 'LRC', name: 'Loopring', price: 0.2345, change: -0.0089, changePercent: -3.66, isFavorite: false, category: 'crypto', icon: getCryptoIcon('lrc') },
  { id: 'cry79', symbol: 'BAL', name: 'Balancer', price: 5.67, change: 0.23, changePercent: 4.23, isFavorite: false, category: 'crypto', icon: getCryptoIcon('bal') },
  { id: 'cry80', symbol: 'SKL', name: 'SKALE', price: 0.0456, change: -0.0023, changePercent: -4.80, isFavorite: false, category: 'crypto', icon: getCryptoIcon('skl') },
  { id: 'cry81', symbol: 'STORJ', name: 'Storj', price: 0.5678, change: 0.0234, changePercent: 4.30, isFavorite: false, category: 'crypto', icon: getCryptoIcon('storj') },
  { id: 'cry82', symbol: 'CVC', name: 'Civic', price: 0.1234, change: -0.0056, changePercent: -4.34, isFavorite: false, category: 'crypto', icon: getCryptoIcon('cvc') },
  { id: 'cry83', symbol: 'OGN', name: 'Origin Protocol', price: 0.0989, change: 0.0045, changePercent: 4.77, isFavorite: false, category: 'crypto', icon: getCryptoIcon('ogn') },
  { id: 'cry84', symbol: 'NMR', name: 'Numeraire', price: 16.78, change: 0.89, changePercent: 5.60, isFavorite: false, category: 'crypto', icon: getCryptoIcon('nmr') },
  { id: 'cry85', symbol: 'KAVA', name: 'Kava', price: 0.9012, change: -0.0456, changePercent: -4.81, isFavorite: false, category: 'crypto', icon: getCryptoIcon('kava') },
  { id: 'cry86', symbol: 'NEO', name: 'NEO', price: 12.34, change: 0.56, changePercent: 4.76, isFavorite: false, category: 'crypto', icon: getCryptoIcon('neo') },
  { id: 'cry87', symbol: 'QTUM', name: 'Qtum', price: 3.45, change: -0.12, changePercent: -3.36, isFavorite: false, category: 'crypto', icon: getCryptoIcon('qtum') },
  { id: 'cry88', symbol: 'HNT', name: 'Helium', price: 5.67, change: 0.23, changePercent: 4.23, isFavorite: false, category: 'crypto', icon: getCryptoIcon('hnt') },
  { id: 'cry89', symbol: 'ZEN', name: 'Horizen', price: 10.12, change: -0.45, changePercent: -4.26, isFavorite: false, category: 'crypto', icon: getCryptoIcon('zen') },
  { id: 'cry90', symbol: 'SPELL', name: 'Spell Token', price: 0.00089, change: 0.00004, changePercent: 4.71, isFavorite: false, category: 'crypto', icon: getCryptoIcon('spell') },
  { id: 'cry91', symbol: 'ILV', name: 'Illuvium', price: 78.90, change: 3.45, changePercent: 4.57, isFavorite: false, category: 'crypto', icon: getCryptoIcon('ilv') },
  { id: 'cry92', symbol: 'IMX', name: 'Immutable X', price: 1.89, change: -0.08, changePercent: -4.06, isFavorite: false, category: 'crypto', icon: getCryptoIcon('imx') },
  { id: 'cry93', symbol: 'GAL', name: 'Galxe', price: 2.34, change: 0.10, changePercent: 4.46, isFavorite: false, category: 'crypto', icon: getCryptoIcon('gal') },
  { id: 'cry94', symbol: 'JASMY', name: 'JasmyCoin', price: 0.0067, change: -0.0003, changePercent: -4.29, isFavorite: false, category: 'crypto', icon: getCryptoIcon('jasmy') },
  { id: 'cry95', symbol: 'BLUR', name: 'Blur', price: 0.4567, change: 0.0234, changePercent: 5.40, isFavorite: false, category: 'crypto', icon: getCryptoIcon('blur') },
  { id: 'cry96', symbol: 'MAGIC', name: 'Magic', price: 0.8901, change: -0.0345, changePercent: -3.73, isFavorite: false, category: 'crypto', icon: getCryptoIcon('magic') },
  { id: 'cry97', symbol: 'HIGH', name: 'Highstreet', price: 2.34, change: 0.10, changePercent: 4.46, isFavorite: false, category: 'crypto', icon: getCryptoIcon('high') },
  { id: 'cry98', symbol: 'ACH', name: 'Alchemy Pay', price: 0.0234, change: 0.0012, changePercent: 5.40, isFavorite: false, category: 'crypto', icon: getCryptoIcon('ach') },
  { id: 'cry99', symbol: 'ALICE', name: 'My Neighbor Alice', price: 1.45, change: -0.06, changePercent: -3.97, isFavorite: false, category: 'crypto', icon: getCryptoIcon('alice') },
  { id: 'cry100', symbol: 'PERP', name: 'Perpetual Protocol', price: 0.8901, change: 0.0345, changePercent: 4.03, isFavorite: false, category: 'crypto', icon: getCryptoIcon('perp') },
];

export const allMarketData = [...mockStocks, ...mockCommodities, ...mockCurrencies, ...mockCrypto];
