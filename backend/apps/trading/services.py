import requests
import json
import aiohttp
import random
from decimal import Decimal
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
            'KO', 'PEP', 'CRM', 'CSCO', 'INTC', 'AMD', 'ORCL', 'DIS', 'MCD',
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

    # ========== WebSocket Market Data Caching Methods ==========

    # Asset definitions for WebSocket market data
    CRYPTO_ASSETS = [
        {'id': 'bitcoin', 'symbol': 'BTC', 'binance_id': 'BTCUSDT', 'name': 'Bitcoin',
         'image': 'https://assets.coincap.io/assets/icons/btc@2x.png'},
        {'id': 'ethereum', 'symbol': 'ETH', 'binance_id': 'ETHUSDT', 'name': 'Ethereum',
         'image': 'https://assets.coincap.io/assets/icons/eth@2x.png'},
        {'id': 'binancecoin', 'symbol': 'BNB', 'binance_id': 'BNBUSDT', 'name': 'BNB',
         'image': 'https://assets.coincap.io/assets/icons/bnb@2x.png'},
        {'id': 'solana', 'symbol': 'SOL', 'binance_id': 'SOLUSDT', 'name': 'Solana',
         'image': 'https://assets.coincap.io/assets/icons/sol@2x.png'},
        {'id': 'ripple', 'symbol': 'XRP', 'binance_id': 'XRPUSDT', 'name': 'XRP',
         'image': 'https://assets.coincap.io/assets/icons/xrp@2x.png'},
        {'id': 'cardano', 'symbol': 'ADA', 'binance_id': 'ADAUSDT', 'name': 'Cardano',
         'image': 'https://assets.coincap.io/assets/icons/ada@2x.png'},
        {'id': 'avalanche', 'symbol': 'AVAX', 'binance_id': 'AVAXUSDT', 'name': 'Avalanche',
         'image': 'https://assets.coincap.io/assets/icons/avax@2x.png'},
        {'id': 'dogecoin', 'symbol': 'DOGE', 'binance_id': 'DOGEUSDT', 'name': 'Dogecoin',
         'image': 'https://assets.coincap.io/assets/icons/doge@2x.png'},
        {'id': 'polkadot', 'symbol': 'DOT', 'binance_id': 'DOTUSDT', 'name': 'Polkadot',
         'image': 'https://assets.coincap.io/assets/icons/dot@2x.png'},
        {'id': 'polygon', 'symbol': 'MATIC', 'binance_id': 'MATICUSDT', 'name': 'Polygon',
         'image': 'https://assets.coincap.io/assets/icons/matic@2x.png'},
        {'id': 'chainlink', 'symbol': 'LINK', 'binance_id': 'LINKUSDT', 'name': 'Chainlink',
         'image': 'https://assets.coincap.io/assets/icons/link@2x.png'},
        {'id': 'litecoin', 'symbol': 'LTC', 'binance_id': 'LTCUSDT', 'name': 'Litecoin',
         'image': 'https://assets.coincap.io/assets/icons/ltc@2x.png'},
        {'id': 'uniswap', 'symbol': 'UNI', 'binance_id': 'UNIUSDT', 'name': 'Uniswap',
         'image': 'https://assets.coincap.io/assets/icons/uni@2x.png'},
        {'id': 'atom', 'symbol': 'ATOM', 'binance_id': 'ATOMUSDT', 'name': 'Cosmos',
         'image': 'https://assets.coincap.io/assets/icons/atom@2x.png'},
        {'id': 'stellar', 'symbol': 'XLM', 'binance_id': 'XLMUSDT', 'name': 'Stellar',
         'image': 'https://assets.coincap.io/assets/icons/xlm@2x.png'},
        {'id': 'tron', 'symbol': 'TRX', 'binance_id': 'TRXUSDT', 'name': 'TRON',
         'image': 'https://assets.coincap.io/assets/icons/trx@2x.png'},
        {'id': 'algorand', 'symbol': 'ALGO', 'binance_id': 'ALGOUSDT', 'name': 'Algorand',
         'image': 'https://assets.coincap.io/assets/icons/algo@2x.png'},
        {'id': 'vechain', 'symbol': 'VET', 'binance_id': 'VETUSDT', 'name': 'VeChain',
         'image': 'https://assets.coincap.io/assets/icons/vet@2x.png'},
        {'id': 'filecoin', 'symbol': 'FIL', 'binance_id': 'FILUSDT', 'name': 'Filecoin',
         'image': 'https://assets.coincap.io/assets/icons/fil@2x.png'},
        {'id': 'hedera', 'symbol': 'HBAR', 'binance_id': 'HBARUSDT', 'name': 'Hedera',
         'image': 'https://assets.coincap.io/assets/icons/hbar@2x.png'},
        {'id': 'shiba', 'symbol': 'SHIB', 'binance_id': 'SHIBUSDT', 'name': 'Shiba Inu',
         'image': 'https://assets.coincap.io/assets/icons/shib@2x.png'},
        {'id': 'near', 'symbol': 'NEAR', 'binance_id': 'NEARUSDT', 'name': 'NEAR Protocol',
         'image': 'https://assets.coincap.io/assets/icons/near@2x.png'},
        {'id': 'aptos', 'symbol': 'APT', 'binance_id': 'APTUSDT', 'name': 'Aptos',
         'image': 'https://assets.coincap.io/assets/icons/apt@2x.png'},
        {'id': 'arbitrum', 'symbol': 'ARB', 'binance_id': 'ARBUSDT', 'name': 'Arbitrum',
         'image': 'https://assets.coincap.io/assets/icons/arb@2x.png'},
        {'id': 'optimism', 'symbol': 'OP', 'binance_id': 'OPUSDT', 'name': 'Optimism',
         'image': 'https://assets.coincap.io/assets/icons/op@2x.png'},
        {'id': 'injective', 'symbol': 'INJ', 'binance_id': 'INJUSDT', 'name': 'Injective',
         'image': 'https://assets.coincap.io/assets/icons/inj@2x.png'},
        {'id': 'sui', 'symbol': 'SUI', 'binance_id': 'SUIUSDT', 'name': 'Sui',
         'image': 'https://assets.coincap.io/assets/icons/sui@2x.png'},
        {'id': 'ton', 'symbol': 'TON', 'binance_id': 'TONUSDT', 'name': 'Toncoin',
         'image': 'https://assets.coincap.io/assets/icons/ton@2x.png'},
        {'id': 'pepe', 'symbol': 'PEPE', 'binance_id': 'PEPEUSDT', 'name': 'Pepe',
         'image': '🐸'},
        {'id': 'render', 'symbol': 'RNDR', 'binance_id': 'RNDRUSDT', 'name': 'Render',
         'image': 'https://assets.coincap.io/assets/icons/rndr@2x.png'},
        {'id': 'immutablex', 'symbol': 'IMX', 'binance_id': 'IMXUSDT', 'name': 'Immutable X',
         'image': 'https://assets.coincap.io/assets/icons/imx@2x.png'},
        {'id': 'ftm', 'symbol': 'FTM', 'binance_id': 'FTMUSDT', 'name': 'Fantom',
         'image': 'https://assets.coincap.io/assets/icons/ftm@2x.png'},
        {'id': 'aave', 'symbol': 'AAVE', 'binance_id': 'AAVEUSDT', 'name': 'Aave',
         'image': 'https://assets.coincap.io/assets/icons/aave@2x.png'},
        {'id': 'maker', 'symbol': 'MKR', 'binance_id': 'MKRUSDT', 'name': 'Maker',
         'image': 'https://assets.coincap.io/assets/icons/mkr@2x.png'},
        {'id': 'theta', 'symbol': 'THETA', 'binance_id': 'THETAUSDT', 'name': 'Theta Network',
         'image': 'https://assets.coincap.io/assets/icons/theta@2x.png'},
        {'id': 'sandbox', 'symbol': 'SAND', 'binance_id': 'SANDUSDT', 'name': 'The Sandbox',
         'image': 'https://assets.coincap.io/assets/icons/sand@2x.png'},
        {'id': 'mana', 'symbol': 'MANA', 'binance_id': 'MANAUSDT', 'name': 'Decentraland',
         'image': 'https://assets.coincap.io/assets/icons/mana@2x.png'},
        {'id': 'axs', 'symbol': 'AXS', 'binance_id': 'AXSUSDT', 'name': 'Axie Infinity',
         'image': 'https://assets.coincap.io/assets/icons/axs@2x.png'},
        {'id': 'grt', 'symbol': 'GRT', 'binance_id': 'GRTUSDT', 'name': 'The Graph',
         'image': 'https://assets.coincap.io/assets/icons/grt@2x.png'},
        {'id': 'eos', 'symbol': 'EOS', 'binance_id': 'EOSUSDT', 'name': 'EOS',
         'image': 'https://assets.coincap.io/assets/icons/eos@2x.png'},
        {'id': 'iota', 'symbol': 'IOTA', 'binance_id': 'IOTAUSDT', 'name': 'IOTA',
         'image': 'https://assets.coincap.io/assets/icons/miota@2x.png'},
        {'id': 'ape', 'symbol': 'APE', 'binance_id': 'APEUSDT', 'name': 'ApeCoin',
         'image': 'https://assets.coincap.io/assets/icons/ape@2x.png'},
        {'id': 'ldo', 'symbol': 'LDO', 'binance_id': 'LDOUSDT', 'name': 'Lido DAO',
         'image': 'https://assets.coincap.io/assets/icons/ldo@2x.png'},
        {'id': 'woo', 'symbol': 'WOO', 'binance_id': 'WOOUSDT', 'name': 'WOO Network',
         'image': 'https://assets.coincap.io/assets/icons/woo@2x.png'},
        {'id': 'flow', 'symbol': 'FLOW', 'binance_id': 'FLOWUSDT', 'name': 'Flow',
         'image': 'https://assets.coincap.io/assets/icons/flow@2x.png'},
        {'id': 'chz', 'symbol': 'CHZ', 'binance_id': 'CHZUSDT', 'name': 'Chiliz',
         'image': 'https://assets.coincap.io/assets/icons/chz@2x.png'},
        {'id': 'xtz', 'symbol': 'XTZ', 'binance_id': 'XTZUSDT', 'name': 'Tezos',
         'image': 'https://assets.coincap.io/assets/icons/xtz@2x.png'},
        {'id': 'egld', 'symbol': 'EGLD', 'binance_id': 'EGLDUSDT', 'name': 'MultiversX',
         'image': 'https://assets.coincap.io/assets/icons/egld@2x.png'},
        {'id': 'bch', 'symbol': 'BCH', 'binance_id': 'BCHUSDT', 'name': 'Bitcoin Cash',
         'image': 'https://assets.coincap.io/assets/icons/bch@2x.png'},
        {'id': 'etc', 'symbol': 'ETC', 'binance_id': 'ETCUSDT', 'name': 'Ethereum Classic',
         'image': 'https://assets.coincap.io/assets/icons/etc@2x.png'},
    ]

    STOCKS_MAP = [
        # Tech Giants
        {'id': 'apple', 'symbol': 'AAPL', 'name': 'Apple Inc.', 'image': 'https://logo.clearbit.com/apple.com'},
        {'id': 'microsoft', 'symbol': 'MSFT', 'name': 'Microsoft Corp.', 'image': 'https://logo.clearbit.com/microsoft.com'},
        {'id': 'google', 'symbol': 'GOOGL', 'name': 'Alphabet Inc.', 'image': 'https://logo.clearbit.com/google.com'},
        {'id': 'amazon', 'symbol': 'AMZN', 'name': 'Amazon.com Inc.', 'image': 'https://logo.clearbit.com/amazon.com'},
        {'id': 'meta', 'symbol': 'META', 'name': 'Meta Platforms Inc.', 'image': 'https://logo.clearbit.com/meta.com'},

        # Semiconductors & Hardware
        {'id': 'nvidia', 'symbol': 'NVDA', 'name': 'NVIDIA Corp.', 'image': 'https://logo.clearbit.com/nvidia.com'},
        {'id': 'amd', 'symbol': 'AMD', 'name': 'Advanced Micro Devices', 'image': 'https://logo.clearbit.com/amd.com'},
        {'id': 'intel', 'symbol': 'INTC', 'name': 'Intel Corp.', 'image': 'https://logo.clearbit.com/intel.com'},
        {'id': 'tsmc', 'symbol': 'TSM', 'name': 'Taiwan Semiconductor', 'image': '🔬'},
        {'id': 'qualcomm', 'symbol': 'QCOM', 'name': 'Qualcomm Inc.', 'image': 'https://logo.clearbit.com/qualcomm.com'},
        {'id': 'broadcom', 'symbol': 'AVGO', 'name': 'Broadcom Inc.', 'image': 'https://logo.clearbit.com/broadcom.com'},

        # Electric Vehicles & Auto
        {'id': 'tesla', 'symbol': 'TSLA', 'name': 'Tesla Inc.', 'image': 'https://logo.clearbit.com/tesla.com'},
        {'id': 'ford', 'symbol': 'F', 'name': 'Ford Motor Co.', 'image': 'https://logo.clearbit.com/ford.com'},
        {'id': 'gm', 'symbol': 'GM', 'name': 'General Motors', 'image': 'https://logo.clearbit.com/gm.com'},

        # Software & Cloud
        {'id': 'salesforce', 'symbol': 'CRM', 'name': 'Salesforce Inc.', 'image': 'https://logo.clearbit.com/salesforce.com'},
        {'id': 'oracle', 'symbol': 'ORCL', 'name': 'Oracle Corp.', 'image': 'https://logo.clearbit.com/oracle.com'},
        {'id': 'sap', 'symbol': 'SAP', 'name': 'SAP SE', 'image': 'https://logo.clearbit.com/sap.com'},
        {'id': 'servicenow', 'symbol': 'NOW', 'name': 'ServiceNow Inc.', 'image': 'https://logo.clearbit.com/servicenow.com'},
        {'id': 'snowflake', 'symbol': 'SNOW', 'name': 'Snowflake Inc.', 'image': 'https://logo.clearbit.com/snowflake.com'},

        # Streaming & Entertainment
        {'id': 'netflix', 'symbol': 'NFLX', 'name': 'Netflix Inc.', 'image': 'https://logo.clearbit.com/netflix.com'},
        {'id': 'disney', 'symbol': 'DIS', 'name': 'Walt Disney Co.', 'image': 'https://logo.clearbit.com/disney.com'},
        {'id': 'spotify', 'symbol': 'SPOT', 'name': 'Spotify Technology', 'image': 'https://logo.clearbit.com/spotify.com'},

        # E-commerce & Retail
        {'id': 'shopify', 'symbol': 'SHOP', 'name': 'Shopify Inc.', 'image': 'https://logo.clearbit.com/shopify.com'},
        {'id': 'walmart', 'symbol': 'WMT', 'name': 'Walmart Inc.', 'image': 'https://logo.clearbit.com/walmart.com'},
        {'id': 'costco', 'symbol': 'COST', 'name': 'Costco Wholesale', 'image': 'https://logo.clearbit.com/costco.com'},
        {'id': 'target', 'symbol': 'TGT', 'name': 'Target Corp.', 'image': 'https://logo.clearbit.com/target.com'},

        # Fintech & Payments
        {'id': 'visa', 'symbol': 'V', 'name': 'Visa Inc.', 'image': '💳'},
        {'id': 'mastercard', 'symbol': 'MA', 'name': 'Mastercard Inc.', 'image': 'https://logo.clearbit.com/mastercard.com'},
        {'id': 'paypal', 'symbol': 'PYPL', 'name': 'PayPal Holdings', 'image': 'https://logo.clearbit.com/paypal.com'},
        {'id': 'square', 'symbol': 'SQ', 'name': 'Block Inc.', 'image': 'https://logo.clearbit.com/squareup.com'},
        {'id': 'coinbase', 'symbol': 'COIN', 'name': 'Coinbase Global', 'image': 'https://logo.clearbit.com/coinbase.com'},

        # Banks & Financial Services
        {'id': 'jpmorgan', 'symbol': 'JPM', 'name': 'JPMorgan Chase', 'image': 'https://logo.clearbit.com/jpmorganchase.com'},
        {'id': 'wellsfargo', 'symbol': 'WFC', 'name': 'Wells Fargo', 'image': 'https://logo.clearbit.com/wellsfargo.com'},
        {'id': 'goldmansachs', 'symbol': 'GS', 'name': 'Goldman Sachs', 'image': 'https://logo.clearbit.com/goldmansachs.com'},

        # Energy
        {'id': 'exxon', 'symbol': 'XOM', 'name': 'Exxon Mobil', 'image': 'https://logo.clearbit.com/exxonmobil.com'},
        {'id': 'chevron', 'symbol': 'CVX', 'name': 'Chevron Corp.', 'image': 'https://logo.clearbit.com/chevron.com'},

        # Healthcare & Pharma
        {'id': 'jnj', 'symbol': 'JNJ', 'name': 'Johnson & Johnson', 'image': 'https://logo.clearbit.com/jnj.com'},
        {'id': 'pfizer', 'symbol': 'PFE', 'name': 'Pfizer Inc.', 'image': 'https://logo.clearbit.com/pfizer.com'},
        {'id': 'abbvie', 'symbol': 'ABBV', 'name': 'AbbVie Inc.', 'image': 'https://logo.clearbit.com/abbvie.com'},
        {'id': 'moderna', 'symbol': 'MRNA', 'name': 'Moderna Inc.', 'image': 'https://logo.clearbit.com/modernatx.com'},

        # Food & Beverage
        {'id': 'cocacola', 'symbol': 'KO', 'name': 'Coca-Cola Co.', 'image': 'https://logo.clearbit.com/coca-cola.com'},
        {'id': 'pepsi', 'symbol': 'PEP', 'name': 'PepsiCo Inc.', 'image': 'https://logo.clearbit.com/pepsi.com'},
        {'id': 'starbucks', 'symbol': 'SBUX', 'name': 'Starbucks Corp.', 'image': 'https://logo.clearbit.com/starbucks.com'},
        {'id': 'mcdonalds', 'symbol': 'MCD', 'name': "McDonald's Corp.", 'image': 'https://logo.clearbit.com/mcdonalds.com'},

        # Social Media & Communication
        {'id': 'twitter', 'symbol': 'TWTR', 'name': 'Twitter/X Corp.', 'image': '🐦'},
        {'id': 'snap', 'symbol': 'SNAP', 'name': 'Snap Inc.', 'image': 'https://logo.clearbit.com/snap.com'},
        {'id': 'pinterest', 'symbol': 'PINS', 'name': 'Pinterest Inc.', 'image': 'https://logo.clearbit.com/pinterest.com'},

        # Other Tech
        {'id': 'uber', 'symbol': 'UBER', 'name': 'Uber Technologies', 'image': 'https://logo.clearbit.com/uber.com'},
        {'id': 'airbnb', 'symbol': 'ABNB', 'name': 'Airbnb Inc.', 'image': 'https://logo.clearbit.com/airbnb.com'},
        {'id': 'zoom', 'symbol': 'ZM', 'name': 'Zoom Video', 'image': 'https://logo.clearbit.com/zoom.us'},
        {'id': 'datadog', 'symbol': 'DDOG', 'name': 'Datadog Inc.', 'image': 'https://logo.clearbit.com/datadoghq.com'},
    ]

    FOREX_MAP = [
        {'id': 'eur-usd', 'symbol': 'EUR/USD', 'base': 'EUR', 'quote': 'USD', 'name': 'Euro to US Dollar', 'image': '💶'},
        {'id': 'gbp-usd', 'symbol': 'GBP/USD', 'base': 'GBP', 'quote': 'USD', 'name': 'British Pound to US Dollar', 'image': '💷'},
        {'id': 'jpy-usd', 'symbol': 'USD/JPY', 'base': 'USD', 'quote': 'JPY', 'name': 'US Dollar to Japanese Yen', 'image': '💴'},
        {'id': 'aud-usd', 'symbol': 'AUD/USD', 'base': 'AUD', 'quote': 'USD', 'name': 'Australian Dollar to US Dollar', 'image': '🇦🇺'},
        {'id': 'cad-usd', 'symbol': 'USD/CAD', 'base': 'USD', 'quote': 'CAD', 'name': 'US Dollar to Canadian Dollar', 'image': '🇨🇦'},
        {'id': 'chf-usd', 'symbol': 'USD/CHF', 'base': 'USD', 'quote': 'CHF', 'name': 'US Dollar to Swiss Franc', 'image': '🇨🇭'},
        {'id': 'nzd-usd', 'symbol': 'NZD/USD', 'base': 'NZD', 'quote': 'USD', 'name': 'New Zealand Dollar to US Dollar', 'image': '🇳🇿'},
        {'id': 'eur-gbp', 'symbol': 'EUR/GBP', 'base': 'EUR', 'quote': 'GBP', 'name': 'Euro to British Pound', 'image': '💶'},
    ]

    COMMODITIES_MAP = [
        {'id': 'gold', 'symbol': 'XAU', 'binance_id': 'XAUUSDT', 'name': 'Gold', 'image': '🥇'},
        {'id': 'silver', 'symbol': 'XAG', 'binance_id': 'XAGUSDT', 'name': 'Silver', 'image': '🥈'},
        {'id': 'oil', 'symbol': 'WTI', 'name': 'Crude Oil WTI', 'image': '🛢️'},
        {'id': 'natgas', 'symbol': 'NG', 'name': 'Natural Gas', 'image': '🔥'},
        {'id': 'copper', 'symbol': 'HG', 'name': 'Copper', 'image': '🟫'},
    ]

    WS_CACHE_KEY = 'market_data:websocket:all'
    WS_CACHE_TTL = 20  # seconds
    _ticker_cache = {}  # For mock data generation

    @staticmethod
    async def fetch_and_cache_all_markets():
        """Fetch data from all sources and store in Redis for WebSocket consumption"""
        try:
            async with aiohttp.ClientSession() as session:
                # Fetch from various sources in parallel
                crypto_data = await MarketDataService._fetch_binance_for_ws(session)
                forex_data = await MarketDataService._fetch_forex_for_ws(session)
                commodities_data = await MarketDataService._fetch_commodities_for_ws(session)
                stocks_data = MarketDataService._generate_mock_stocks_for_ws()

                # Combine all data
                all_assets = crypto_data + forex_data + commodities_data + stocks_data

                # Cache the combined data
                cache.set(
                    MarketDataService.WS_CACHE_KEY,
                    all_assets,
                    MarketDataService.WS_CACHE_TTL
                )

                logger.info(f"[MarketDataService] Cached {len(all_assets)} WebSocket market assets")
                return all_assets

        except Exception as e:
            logger.error(f"[MarketDataService] Error fetching market data: {e}")
            # Return stale cache on error
            return cache.get(MarketDataService.WS_CACHE_KEY, [])

    @staticmethod
    async def _fetch_binance_for_ws(session):
        """Fetch cryptocurrency data from Binance API for WebSocket"""
        binance_url = "https://api.binance.com/api/v3/ticker/24hr"

        try:
            async with session.get(binance_url, timeout=10) as response:
                response.raise_for_status()
                data = await response.json()

                # Create lookup dict for crypto assets
                crypto_lookup = {asset['binance_id']: asset for asset in MarketDataService.CRYPTO_ASSETS}

                # Filter and format crypto data - fetch all configured assets
                crypto_assets = []
                crypto_symbols = [asset['binance_id'] for asset in MarketDataService.CRYPTO_ASSETS]

                for symbol in crypto_symbols:
                    ticker = next((t for t in data if t['symbol'] == symbol), None)
                    if ticker:
                        # Get asset config for name and image
                        asset_config = crypto_lookup.get(symbol, {})
                        crypto_assets.append({
                            'symbol': symbol.replace('USDT', ''),
                            'name': asset_config.get('name', symbol.replace('USDT', '')),
                            'category': 'crypto',
                            'price': float(ticker.get('lastPrice', 0)),
                            'change_percent_24h': float(ticker.get('priceChangePercent', 0)),
                            'change_24h': float(ticker.get('priceChange', 0)),
                            'volume': float(ticker.get('volume', 0)),
                            'image': asset_config.get('image', ''),
                        })

                return crypto_assets

        except Exception as e:
            logger.error(f"[MarketDataService] Error fetching Binance data: {e}")
            return []

    @staticmethod
    async def _fetch_forex_for_ws(session):
        """Fetch forex data from exchange rate API for WebSocket"""
        forex_url = "https://api.exchangerate-api.com/v4/latest/USD"

        try:
            async with session.get(forex_url, timeout=10) as response:
                response.raise_for_status()
                data = await response.json()
                rates = data.get('rates', {})

                # Process all configured forex pairs
                forex_assets = []

                for forex_config in MarketDataService.FOREX_MAP:
                    price = MarketDataService._calculate_forex_price_ws(
                        forex_config['base'],
                        forex_config['quote'],
                        rates
                    )

                    if price > 0:
                        forex_assets.append({
                            'symbol': forex_config['symbol'],
                            'name': forex_config.get('name', forex_config['symbol']),
                            'category': 'forex',
                            'price': float(price),
                            'change_percent_24h': float(random.uniform(-1.0, 1.0)),
                            'change_24h': 0,
                            'volume': 0,
                            'image': forex_config.get('image', '🌐'),
                        })

                return forex_assets

        except Exception as e:
            logger.error(f"[MarketDataService] Error fetching forex data: {e}")
            return []

    @staticmethod
    def _calculate_forex_price_ws(base_currency: str, quote_currency: str, rates: dict) -> float:
        """Calculate forex pair price from exchange rates"""
        if not rates:
            return 0.0

        if base_currency == 'USD':
            return rates.get(quote_currency, 0.0)
        elif quote_currency == 'USD':
            base_rate = rates.get(base_currency, 1.0)
            return 1.0 / base_rate if base_rate != 0 else 0.0
        else:
            base_rate = rates.get(base_currency, 1.0)
            quote_rate = rates.get(quote_currency, 1.0)
            if base_rate != 0:
                return quote_rate / base_rate
            return 0.0

    @staticmethod
    async def _fetch_commodities_for_ws(session):
        """Fetch commodities data - mix of real data from Binance and mock data"""
        commodities_data = []
        binance_url = "https://api.binance.com/api/v3/ticker/24hr"

        try:
            # Fetch Binance data for gold and silver
            async with session.get(binance_url, timeout=10) as response:
                response.raise_for_status()
                binance_data = await response.json()

                # Process each commodity
                for commodity in MarketDataService.COMMODITIES_MAP:
                    if 'binance_id' in commodity:
                        # Try to get from binance_data
                        ticker = next((t for t in binance_data if t.get('symbol') == commodity['binance_id']), None)
                        if ticker:
                            commodities_data.append({
                                'symbol': commodity['symbol'],
                                'name': commodity['name'],
                                'category': 'commodities',
                                'price': float(ticker.get('lastPrice', 0)),
                                'change_percent_24h': float(ticker.get('priceChangePercent', 0)),
                                'change_24h': float(ticker.get('priceChange', 0)),
                                'volume': float(ticker.get('volume', 0)),
                                'image': commodity.get('image', '📊'),
                            })
                        else:
                            # Fallback to mock if not found
                            commodities_data.append(MarketDataService._generate_mock_commodity(commodity))
                    else:
                        # Generate mock data for other commodities
                        commodities_data.append(MarketDataService._generate_mock_commodity(commodity))

        except Exception as e:
            logger.error(f"[MarketDataService] Error fetching commodities: {e}")
            # Return mock data for all commodities on error
            for commodity in MarketDataService.COMMODITIES_MAP:
                commodities_data.append(MarketDataService._generate_mock_commodity(commodity))

        return commodities_data

    @staticmethod
    def _generate_mock_commodity(commodity):
        """Generate mock data for a single commodity"""
        last_price = MarketDataService._ticker_cache.get(commodity['symbol'], random.uniform(50, 100))
        change_percent = random.uniform(-2.5, 2.5)
        new_price = last_price * (1 + change_percent / 100)
        MarketDataService._ticker_cache[commodity['symbol']] = new_price

        return {
            'symbol': commodity['symbol'],
            'name': commodity['name'],
            'category': 'commodities',
            'price': float(new_price),
            'change_percent_24h': float(change_percent),
            'change_24h': 0,
            'volume': float(random.uniform(500_000, 10_000_000)),
            'image': commodity.get('image', '📊'),
        }

    @staticmethod
    def _generate_mock_stocks_for_ws():
        """Generate mock stock data for WebSocket"""
        stock_data = []

        # Create lookup dict for stocks
        stock_lookup = {stock['symbol']: stock for stock in MarketDataService.STOCKS_MAP}

        for symbol in stock_lookup.keys():
            last_price = MarketDataService._ticker_cache.get(symbol, random.uniform(100, 500))
            change_percent = random.uniform(-3.5, 3.5)
            new_price = last_price * (1 + change_percent / 100)

            MarketDataService._ticker_cache[symbol] = new_price

            # Get stock config for name and image
            stock_config = stock_lookup.get(symbol, {})

            stock_data.append({
                'symbol': symbol,
                'name': stock_config.get('name', symbol),
                'category': 'stocks',
                'price': float(new_price),
                'change_percent_24h': float(change_percent),
                'change_24h': 0,
                'volume': float(random.uniform(1_000_000, 50_000_000)),
                'image': stock_config.get('image', '📈'),
            })

        return stock_data

    @staticmethod
    def get_cached_websocket_data():
        """Read cached market data from Redis for WebSocket"""
        cached_data = cache.get(MarketDataService.WS_CACHE_KEY, [])
        return cached_data
