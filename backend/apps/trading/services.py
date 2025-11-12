import requests
import json
from django.core.cache import cache
import hashlib
from django.conf import settings
import logging

logger = logging.getLogger('apps.trading')


class MarketDataService:
    BINANCE_BASE_URL = "https://api.binance.com/api/v3"
    TWELVE_DATA_BASE_URL = "https://api.twelvedata.com"

    def __init__(self):
        self.twelve_data_key = getattr(settings, 'TWELVE_DATA_API_KEY', None)
        self.cache_ttl = getattr(settings, 'MARKET_DATA_CACHE_TTL', {
            'crypto': 60,
            'forex': 300,
            'stocks': 300,
            'commodities': 300,
        })

    def _generate_cache_key(self, symbol: str, interval: str, asset_type: str) -> str:
        key_string = f"market_data:{asset_type}:{symbol}:{interval}"
        return hashlib.md5(key_string.encode()).hexdigest()

    def get_asset_type(self, symbol: str) -> str:
        symbol_upper = symbol.upper()

        crypto_symbols = {
            'BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX', 'TRX', 'LINK',
            'DOT', 'MATIC', 'SHIB', 'UNI', 'LTC', 'ATOM', 'ETC', 'XLM', 'BCH', 'NEAR',
            'ALGO', 'VET', 'FIL', 'HBAR', 'APE', 'QNT', 'ICP', 'APT', 'MANA', 'SAND',
            'CRO', 'AAVE', 'GRT', 'EOS', 'XTZ', 'AXS', 'THETA', 'FTM', 'EGLD', 'RUNE',
            'XMR', 'KLAY', 'FLOW', 'CHZ', 'ENJ', 'GALA', 'LDO', 'CAKE', 'MKR', 'SNX',
            'NEO', 'STX', 'KAVA', 'INJ', 'COMP', 'ZIL', 'BAT', 'ONT', 'DASH', 'ZEC',
            'IOTX', 'OMG', 'CELO', 'AR', 'WAVES', 'QTUM', 'ZRX', 'SKL', 'IMX', 'GMT',
            'DYDX', 'OP', 'ARB', 'SUI', 'PEPE', 'WLD', 'RNDR', 'FET', 'AGIX', 'ROSE',
            'KSM', 'CRV', 'SUSHI', 'YFI', 'BAL', '1INCH', 'LRC', 'KNC', 'STORJ', 'ANKR',
            'BNT', 'MINA', 'JASMY', 'BLUR', 'PENDLE', 'WOO'
        }

        stock_symbols = {
            'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA', 'BRK.B', 'AVGO',
            'WMT', 'JPM', 'V', 'UNH', 'XOM', 'JNJ', 'MA', 'PG', 'NFLX', 'HD', 'COST',
            'KO', 'PEP', 'ADBE', 'CRM', 'CSCO', 'INTC', 'AMD', 'ORCL', 'DIS', 'MCD',
            'BA', 'NKE', 'PFE', 'MRK', 'ABT', 'VZ', 'T', 'CMCSA', 'CVX',
            'WFC', 'MS', 'GS', 'IBM', 'QCOM', 'TXN', 'SBUX', 'AXP', 'FDX', 'UPS'
        }

        clean_symbol = symbol_upper.replace('/', '').replace('-', '').replace(' ', '')
        for suffix in ['USDT', 'BUSD', 'USDC', 'FDUSD']:
            if clean_symbol.endswith(suffix):
                clean_symbol = clean_symbol[:-len(suffix)]
                break

        if clean_symbol in crypto_symbols:
            return 'crypto'

        if symbol_upper in stock_symbols:
            return 'stocks'

        forex_pairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'USD/CHF',
                       'NZD/USD', 'EUR/JPY', 'GBP/JPY', 'EUR/GBP', 'AUD/JPY', 'USD/CNY']

        if any(pair in symbol_upper.replace('%2F', '/') for pair in forex_pairs):
            return 'forex'

        commodities = ['XAU', 'XAG', 'XPT', 'XPD', 'CL', 'NG', 'HG', 'GOLD', 'SILVER', 'OIL']
        if any(comm in symbol_upper for comm in commodities):
            return 'commodities'

        return 'stocks'

    def fetch_crypto_klines(self, symbol: str, interval: str, limit: int):
        try:
            binance_symbol = symbol.upper().replace('/', '').replace('-', '').replace(' ', '')

            if not binance_symbol.endswith('USDT') and not binance_symbol.endswith('BUSD'):
                binance_symbol = f"{binance_symbol}USDT"

            url = f"{self.BINANCE_BASE_URL}/klines"
            params = {
                'symbol': binance_symbol,
                'interval': interval,
                'limit': limit
            }

            logger.info(f"🔄 Binance API Request - Symbol: {binance_symbol}, Interval: {interval}, Limit: {limit}")
            logger.debug(f"Full URL: {url} | Params: {params}")

            response = requests.get(url, params=params, timeout=15)

            logger.info(f"📡 Binance API Response - Status: {response.status_code}, Symbol: {binance_symbol}")
            logger.debug(f"Response Headers: {dict(response.headers)}")

            if response.status_code == 400:
                error_msg = response.json() if response.text else "Unknown error"
                logger.error(f"❌ Invalid symbol or parameters: {binance_symbol} | Error: {error_msg}")
                return None

            response.raise_for_status()
            klines = response.json()
            logger.info(f"✅ Binance API Success - Received {len(klines)} candles for {binance_symbol}")

            if not klines:
                return None

            ohlc_data = []
            volume_data = []

            for kline in klines:
                open_time = kline[0]
                open_price = float(kline[1])
                high_price = float(kline[2])
                low_price = float(kline[3])
                close_price = float(kline[4])
                volume = float(kline[5])

                ohlc_data.append({
                    'time': open_time,
                    'open': open_price,
                    'high': high_price,
                    'low': low_price,
                    'close': close_price
                })

                volume_data.append({
                    'time': open_time,
                    'value': volume,
                    'color': '#22c55e' if close_price >= open_price else '#ef4444'
                })

            return {'ohlc': ohlc_data, 'volume': volume_data}

        except requests.exceptions.Timeout:
            logger.error(f"⏱️ Binance API Timeout for {symbol} - Request took longer than 15 seconds")
            return None
        except requests.exceptions.ConnectionError as e:
            logger.error(f"🌐 Binance API Connection Error for {symbol} - Network issue: {str(e)}")
            return None
        except requests.exceptions.HTTPError as e:
            logger.error(f"🚫 Binance API HTTP Error for {symbol} - Status {e.response.status_code}: {str(e)}")
            return None
        except Exception as e:
            logger.exception(f"💥 Unexpected Binance API error for {symbol}: {str(e)}")
            return None

    def fetch_twelve_data_klines(self, symbol: str, interval: str, outputsize: int):
        if not self.twelve_data_key:
            print("Twelve Data API key not configured")
            return None

        try:
            interval_map = {
                '1h': '1h',
                '4h': '4h',
                '1d': '1day',
                '1w': '1week'
            }

            twelve_interval = interval_map.get(interval, '1day')

            url = f"{self.TWELVE_DATA_BASE_URL}/time_series"
            params = {
                'symbol': symbol,
                'interval': twelve_interval,
                'outputsize': outputsize,
                'apikey': self.twelve_data_key,
                'format': 'JSON'
            }

            response = requests.get(url, params=params, timeout=15)
            response.raise_for_status()
            data = response.json()

            if 'values' not in data or not data['values']:
                print(f"No values in Twelve Data response for {symbol}")
                return None

            ohlc_data = []
            volume_data = []

            for item in reversed(data['values']):
                import dateutil.parser
                dt = dateutil.parser.parse(item['datetime'])
                timestamp = int(dt.timestamp() * 1000)

                open_price = float(item['open'])
                high_price = float(item['high'])
                low_price = float(item['low'])
                close_price = float(item['close'])
                volume = float(item.get('volume', 0))

                ohlc_data.append({
                    'time': timestamp,
                    'open': open_price,
                    'high': high_price,
                    'low': low_price,
                    'close': close_price
                })

                volume_data.append({
                    'time': timestamp,
                    'value': volume,
                    'color': '#22c55e' if close_price >= open_price else '#ef4444'
                })

            return {'ohlc': ohlc_data, 'volume': volume_data}

        except Exception as e:
            print(f"Twelve Data API error: {e}")
            return None

    def fetch_market_data(self, symbol: str, interval: str = '1d', limit: int = 90):
        asset_type = self.get_asset_type(symbol)
        cache_key = self._generate_cache_key(symbol, interval, asset_type)

        logger.info(f"📊 Market Data Request - Symbol: {symbol}, Type: {asset_type}, Interval: {interval}")

        cached_data = cache.get(cache_key)
        if cached_data:
            logger.info(f"💾 Cache HIT for {symbol} {interval}")
            return json.loads(cached_data)

        logger.info(f"🔍 Cache MISS for {symbol} {interval} - fetching from API")

        data = None

        if asset_type == 'crypto':
            data = self.fetch_crypto_klines(symbol, interval, limit)
        else:
            data = self.fetch_twelve_data_klines(symbol, interval, limit)

            if not data:
                logger.warning(f"⚠️ Twelve Data failed for {symbol}, trying Binance as fallback")
                data = self.fetch_crypto_klines(symbol, interval, limit)

        if data:
            ttl = self.cache_ttl.get(asset_type, 300)
            cache.set(cache_key, json.dumps(data), ttl)
            logger.info(f"✅ Cached {symbol} for {ttl} seconds")
        else:
            logger.error(f"❌ Failed to fetch market data for {symbol} from all sources")

        return data
