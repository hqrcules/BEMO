import json
import asyncio
import aiohttp
import random
from datetime import datetime
from decimal import Decimal
from django.conf import settings
from channels.generic.websocket import AsyncWebsocketConsumer
from .utils.crypto_fetcher import CryptoDataFetcher


class MarketConsumer(AsyncWebsocketConsumer):
    running = False

    TICKER_CACHE = {}
    CACHE_LIFETIME = 20
    last_cache_update = 0

    BINANCE_URL = "https://api.binance.com/api/v3/ticker/24hr"

    ASSET_MAP = {
        'crypto': [
            {'id': 'bitcoin', 'symbol': 'BTC', 'binance_id': 'BTCUSDT', 'name': 'Bitcoin',
             'image': 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png'},
            {'id': 'ethereum', 'symbol': 'ETH', 'binance_id': 'ETHUSDT', 'name': 'Ethereum',
             'image': 'https://assets.coingecko.com/coins/images/279/large/ethereum.png'},
            {'id': 'binancecoin', 'symbol': 'BNB', 'binance_id': 'BNBUSDT', 'name': 'BNB',
             'image': 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png'},
            {'id': 'solana', 'symbol': 'SOL', 'binance_id': 'SOLUSDT', 'name': 'Solana',
             'image': 'https://assets.coingecko.com/coins/images/4128/large/solana.png'},
            {'id': 'ripple', 'symbol': 'XRP', 'binance_id': 'XRPUSDT', 'name': 'XRP',
             'image': 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png'},
            {'id': 'dogecoin', 'symbol': 'DOGE', 'binance_id': 'DOGEUSDT', 'name': 'Dogecoin',
             'image': 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png'},
            {'id': 'cardano', 'symbol': 'ADA', 'binance_id': 'ADAUSDT', 'name': 'Cardano',
             'image': 'https://assets.coingecko.com/coins/images/975/large/cardano.png'},
            {'id': 'chainlink', 'symbol': 'LINK', 'binance_id': 'LINKUSDT', 'name': 'Chainlink',
             'image': 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png'},
            {'id': 'polkadot', 'symbol': 'DOT', 'binance_id': 'DOTUSDT', 'name': 'Polkadot',
             'image': 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png'},
            {'id': 'uniswap', 'symbol': 'UNI', 'binance_id': 'UNIUSDT', 'name': 'Uniswap',
             'image': 'https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png'},
            {'id': 'litecoin', 'symbol': 'LTC', 'binance_id': 'LTCUSDT', 'name': 'Litecoin',
             'image': 'https://assets.coingecko.com/coins/images/2/large/litecoin.png'},
            {'id': 'bitcoin-cash', 'symbol': 'BCH', 'binance_id': 'BCHUSDT', 'name': 'Bitcoin Cash',
             'image': 'https://assets.coingecko.com/coins/images/780/large/bitcoin-cash-circle.png'},
            {'id': 'stellar', 'symbol': 'XLM', 'binance_id': 'XLMUSDT', 'name': 'Stellar',
             'image': 'https://assets.coingecko.com/coins/images/100/large/Stellar_symbol_black_RGB.png'},
            {'id': 'ethereum-classic', 'symbol': 'ETC', 'binance_id': 'ETCUSDT', 'name': 'Ethereum Classic',
             'image': 'https://assets.coingecko.com/coins/images/453/large/ethereum-classic-logo.png'},
            {'id': 'monero', 'symbol': 'XMR', 'binance_id': 'XMRUSDT', 'name': 'Monero',
             'image': 'https://assets.coingecko.com/coins/images/69/large/monero_logo.png'},
            {'id': 'aave', 'symbol': 'AAVE', 'binance_id': 'AAVEUSDT', 'name': 'Aave',
             'image': 'https://assets.coingecko.com/coins/images/12645/large/AAVE.png'},
            {'id': 'cosmos', 'symbol': 'ATOM', 'binance_id': 'ATOMUSDT', 'name': 'Cosmos',
             'image': 'https://assets.coingecko.com/coins/images/1481/large/atom.png'},
            {'id': 'filecoin', 'symbol': 'FIL', 'binance_id': 'FILUSDT', 'name': 'Filecoin',
             'image': 'https://assets.coingecko.com/coins/images/12817/large/filecoin.png'},
            {'id': 'matic-network', 'symbol': 'MATIC', 'binance_id': 'MATICUSDT', 'name': 'Polygon',
             'image': 'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png'},
            {'id': 'shiba-inu', 'symbol': 'SHIB', 'binance_id': 'SHIBUSDT', 'name': 'Shiba Inu',
             'image': 'https://assets.coingecko.com/coins/images/11939/large/shiba.png'},
            {'id': 'tron', 'symbol': 'TRX', 'binance_id': 'TRXUSDT', 'name': 'TRON',
             'image': 'https://assets.coingecko.com/coins/images/1094/large/tron-logo.png'},
            {'id': 'near', 'symbol': 'NEAR', 'binance_id': 'NEARUSDT', 'name': 'NEAR Protocol',
             'image': 'https://assets.coingecko.com/coins/images/10365/large/near.png'},
            {'id': 'algorand', 'symbol': 'ALGO', 'binance_id': 'ALGOUSDT', 'name': 'Algorand',
             'image': 'https://assets.coingecko.com/coins/images/4380/large/download.png'},
            {'id': 'fantom', 'symbol': 'FTM', 'binance_id': 'FTMUSDT', 'name': 'Fantom',
             'image': 'https://assets.coingecko.com/coins/images/4001/large/Fantom_round.png'},
            {'id': 'hedera-hashgraph', 'symbol': 'HBAR', 'binance_id': 'HBARUSDT', 'name': 'Hedera',
             'image': 'https://assets.coingecko.com/coins/images/3688/large/hbar.png'},
            {'id': 'the-sandbox', 'symbol': 'SAND', 'binance_id': 'SANDUSDT', 'name': 'The Sandbox',
             'image': 'https://assets.coingecko.com/coins/images/12129/large/sandbox_logo.jpg'},
            {'id': 'decentraland', 'symbol': 'MANA', 'binance_id': 'MANAUSDT', 'name': 'Decentraland',
             'image': 'https://assets.coingecko.com/coins/images/878/large/decentraland-mana.png'},
            {'id': 'eos', 'symbol': 'EOS', 'binance_id': 'EOSUSDT', 'name': 'EOS',
             'image': 'https://assets.coingecko.com/coins/images/738/large/eos-eos-logo.png'},
            {'id': 'iota', 'symbol': 'IOTA', 'binance_id': 'IOTAUSDT', 'name': 'IOTA',
             'image': 'https://assets.coingecko.com/coins/images/692/large/IOTA_Swirl.png'},
            {'id': 'maker', 'symbol': 'MKR', 'binance_id': 'MKRUSDT', 'name': 'Maker',
             'image': 'https://assets.coingecko.com/coins/images/1364/large/Mark_Maker.png'},
            {'id': 'zcash', 'symbol': 'ZEC', 'binance_id': 'ZECUSDT', 'name': 'Zcash',
             'image': 'https://assets.coingecko.com/coins/images/486/large/circle-zcash-color.png'},
            {'id': 'dash', 'symbol': 'DASH', 'binance_id': 'DASHUSDT', 'name': 'Dash',
             'image': 'https://assets.coingecko.com/coins/images/19/large/dash-logo.png'},
            {'id': 'bittorrent', 'symbol': 'BTT', 'binance_id': 'BTTUSDT', 'name': 'BitTorrent',
             'image': 'https://assets.coingecko.com/coins/images/7595/large/BTT_Token_Graphic.png'},
            {'id': 'compound', 'symbol': 'COMP', 'binance_id': 'COMPUSDT', 'name': 'Compound',
             'image': 'https://assets.coingecko.com/coins/images/10775/large/COMP.png'},
            {'id': 'yearn-finance', 'symbol': 'YFI', 'binance_id': 'YFIUSDT', 'name': 'yearn.finance',
             'image': 'https://assets.coingecko.com/coins/images/11849/large/yfi-192x192.png'},
            {'id': 'worldcoin-wld', 'symbol': 'WLD', 'binance_id': 'WLDUSDT', 'name': 'Worldcoin',
             'image': 'https://assets.coingecko.com/coins/images/31069/large/worldcoin.jpeg'},
            {'id': 'arbitrum', 'symbol': 'ARB', 'binance_id': 'ARBUSDT', 'name': 'Arbitrum',
             'image': 'https://assets.coingecko.com/coins/images/16547/large/photo_2023-03-29_21.47.00.jpeg'},
            {'id': 'optimism', 'symbol': 'OP', 'binance_id': 'OPUSDT', 'name': 'Optimism',
             'image': 'https://assets.coingecko.com/coins/images/25244/large/Optimism.png'},
            {'id': 'render-token', 'symbol': 'RNDR', 'binance_id': 'RNDRUSDT', 'name': 'Render Token',
             'image': 'https://assets.coingecko.com/coins/images/11636/large/rndr.png'},
            {'id': 'vechain', 'symbol': 'VET', 'binance_id': 'VETUSDT', 'name': 'VeChain',
             'image': 'https://assets.coingecko.com/coins/images/1167/large/VET_Token_Icon.png'},
            {'id': 'thorchain', 'symbol': 'RUNE', 'binance_id': 'RUNEUSDT', 'name': 'THORChain',
             'image': 'https://assets.coingecko.com/coins/images/6595/large/RUNE.png'},
            {'id': 'kava', 'symbol': 'KAVA', 'binance_id': 'KAVAUSDT', 'name': 'Kava',
             'image': 'https://assets.coingecko.com/coins/images/9761/large/kava.png'},
            {'id': 'ecash', 'symbol': 'XEC', 'binance_id': 'XECUSDT', 'name': 'eCash',
             'image': 'https://assets.coingecko.com/coins/images/16646/large/Logo_final-22.png'},
            {'id': 'chiliz', 'symbol': 'CHZ', 'binance_id': 'CHZUSDT', 'name': 'Chiliz',
             'image': 'https://assets.coingecko.com/coins/images/8834/large/Chiliz.png'},
            {'id': 'axie-infinity', 'symbol': 'AXS', 'binance_id': 'AXSUSDT', 'name': 'Axie Infinity',
             'image': 'https://assets.coingecko.com/coins/images/13029/large/axie_infinity_logo.png'},
            {'id': 'kucoin-token', 'symbol': 'KCS', 'binance_id': 'KCSUSDT', 'name': 'KuCoin Token',
             'image': 'https://assets.coingecko.com/coins/images/1042/large/KCS.png'},
            {'id': 'oasis-network', 'symbol': 'ROSE', 'binance_id': 'ROSEUSDT', 'name': 'Oasis Network',
             'image': 'https://assets.coingecko.com/coins/images/13162/large/rose.png'},
            {'id': '1inch', 'symbol': '1INCH', 'binance_id': '1INCHUSDT', 'name': '1inch',
             'image': 'https://assets.coingecko.com/coins/images/13469/large/1inch-token.png'},
            {'id': 'enjincoin', 'symbol': 'ENJ', 'binance_id': 'ENJUSDT', 'name': 'Enjin Coin',
             'image': 'https://assets.coingecko.com/coins/images/1102/large/enjin-coin-logo.png'},
            {'id': 'zilliqa', 'symbol': 'ZIL', 'binance_id': 'ZILUSDT', 'name': 'Zilliqa',
             'image': 'https://assets.coingecko.com/coins/images/2687/large/Zilliqa-logo.png'},
            {'id': 'curve-dao-token', 'symbol': 'CRV', 'binance_id': 'CRVUSDT', 'name': 'Curve DAO Token',
             'image': 'https://assets.coingecko.com/coins/images/12124/large/Curve.png'},
            {'id': 'qtum', 'symbol': 'QTUM', 'binance_id': 'QTUMUSDT', 'name': 'Qtum',
             'image': 'https://assets.coingecko.com/coins/images/684/large/qtum.png'},
            {'id': 'theta-token', 'symbol': 'THETA', 'binance_id': 'THETAUSDT', 'name': 'Theta Network',
             'image': 'https://assets.coingecko.com/coins/images/2538/large/theta-token-logo.png'},
            {'id': 'ontology', 'symbol': 'ONT', 'binance_id': 'ONTUSDT', 'name': 'Ontology',
             'image': 'https://assets.coingecko.com/coins/images/3447/large/ONT.png'},
            {'id': 'waves', 'symbol': 'WAVES', 'binance_id': 'WAVESUSDT', 'name': 'Waves',
             'image': 'https://assets.coingecko.com/coins/images/425/large/waves.png'},
            {'id': 'tether-gold', 'symbol': 'XAUT', 'binance_id': 'XAUTUSDT', 'name': 'Tether Gold',
             'image': 'https://assets.coingecko.com/coins/images/10481/large/Tether_Gold.png'},
            {'id': 'convex-finance', 'symbol': 'CVX', 'binance_id': 'CVXUSDT', 'name': 'Convex Finance',
             'image': 'https://assets.coingecko.com/coins/images/15585/large/convex.png'},
            {'id': '0x', 'symbol': 'ZRX', 'binance_id': 'ZRXUSDT', 'name': '0x',
             'image': 'https://assets.coingecko.com/coins/images/863/large/0x.png'},
            {'id': 'iotex', 'symbol': 'IOTX', 'binance_id': 'IOTXUSDT', 'name': 'IoTeX',
             'image': 'https://assets.coingecko.com/coins/images/3334/large/iotex-logo.png'},
            {'id': 'storj', 'symbol': 'STORJ', 'binance_id': 'STORJUSDT', 'name': 'Storj',
             'image': 'https://assets.coingecko.com/coins/images/949/large/storj.png'},
            {'id': 'aptos', 'symbol': 'APT', 'binance_id': 'APTUSDT', 'name': 'Aptos',
             'image': 'https://assets.coingecko.com/coins/images/26455/large/aptos_round.png'},
            {'id': 'casper-network', 'symbol': 'CSPR', 'binance_id': 'CSPRUSDT', 'name': 'Casper Network',
             'image': 'https://assets.coingecko.com/coins/images/15286/large/casper-logo.png'},
            {'id': 'immutable-x', 'symbol': 'IMX', 'binance_id': 'IMXUSDT', 'name': 'Immutable X',
             'image': 'https://assets.coingecko.com/coins/images/17233/large/imx.png'},
            {'id': 'lido-dao', 'symbol': 'LDO', 'binance_id': 'LDOUSDT', 'name': 'Lido DAO',
             'image': 'https://assets.coingecko.com/coins/images/13573/large/Lido_DAO.png'},
            {'id': 'rocket-pool-eth', 'symbol': 'RETH', 'binance_id': 'RETHUSDT', 'name': 'Rocket Pool ETH',
             'image': 'https://assets.coingecko.com/coins/images/20764/large/reth.png'},
            {'id': 'terra-luna', 'symbol': 'LUNC', 'binance_id': 'LUNCUSDT', 'name': 'Terra Luna Classic',
             'image': 'https://assets.coingecko.com/coins/images/8284/large/01_LunaClassic_color.png'},
        ],
        'stocks': [
            {'id': 'apple', 'symbol': 'AAPL', 'name': 'Apple Inc.', 'image': 'https://logo.clearbit.com/apple.com'},
            {'id': 'microsoft', 'symbol': 'MSFT', 'name': 'Microsoft Corp.',
             'image': 'https://logo.clearbit.com/microsoft.com'},
            {'id': 'google', 'symbol': 'GOOGL', 'name': 'Alphabet Inc.',
             'image': 'https://logo.clearbit.com/google.com'},
            {'id': 'tesla', 'symbol': 'TSLA', 'name': 'Tesla, Inc.', 'image': 'https://logo.clearbit.com/tesla.com'},
            {'id': 'nvidia', 'symbol': 'NVDA', 'name': 'NVIDIA Corp.', 'image': 'https://logo.clearbit.com/nvidia.com'},
            {'id': 'meta', 'symbol': 'META', 'name': 'Meta Platforms', 'image': 'https://logo.clearbit.com/meta.com'},
            {'id': 'amazon', 'symbol': 'AMZN', 'name': 'Amazon.com, Inc.',
             'image': 'https://logo.clearbit.com/amazon.com'},
            {'id': 'netflix', 'symbol': 'NFLX', 'name': 'Netflix, Inc.',
             'image': 'https://logo.clearbit.com/netflix.com'},
            {'id': 'jpmorgan', 'symbol': 'JPM', 'name': 'JPMorgan Chase & Co.',
             'image': 'https://logo.clearbit.com/jpmorgan.com'},
            {'id': 'johnsonjohnson', 'symbol': 'JNJ', 'name': 'Johnson & Johnson',
             'image': 'https://logo.clearbit.com/jnj.com'},
            {'id': 'walmart', 'symbol': 'WMT', 'name': 'Walmart Inc.',
             'image': 'https://logo.clearbit.com/walmart.com'},
            {'id': 'proctergamble', 'symbol': 'PG', 'name': 'Procter & Gamble',
             'image': 'https://logo.clearbit.com/pg.com'},
            {'id': 'cocacola', 'symbol': 'KO', 'name': 'Coca-Cola Co.',
             'image': 'https://logo.clearbit.com/coca-cola.com'},
        ],
        'forex': [
            {'id': 'eurusd', 'symbol': 'EUR/USD', 'name': 'EUR to USD', 'image': '🇪🇺🇺🇸'},
            {'id': 'gbpusd', 'symbol': 'GBP/USD', 'name': 'GBP to USD', 'image': '🇬🇧🇺🇸'},
            {'id': 'usdjpy', 'symbol': 'USD/JPY', 'name': 'USD to JPY', 'image': '🇺🇸🇯🇵'},
            {'id': 'audusd', 'symbol': 'AUD/USD', 'name': 'AUD to USD', 'image': '🇦🇺🇺🇸'},
            {'id': 'usdcad', 'symbol': 'USD/CAD', 'name': 'USD to CAD', 'image': '🇺🇸🇨🇦'},
            {'id': 'usdchf', 'symbol': 'USD/CHF', 'name': 'USD to CHF', 'image': '🇺🇸🇨🇭'},
            {'id': 'eurgbp', 'symbol': 'EUR/GBP', 'name': 'EUR to GBP', 'image': '🇪🇺🇬🇧'},
            {'id': 'eurjpy', 'symbol': 'EUR/JPY', 'name': 'EUR to JPY', 'image': '🇪🇺🇯🇵'},
        ],
        'commodities': [
            {'id': 'gold', 'symbol': 'XAU', 'binance_id': 'XAUUSDT', 'name': 'Gold (Ounce)', 'image': '🪙'},
            {'id': 'silver', 'symbol': 'XAG', 'binance_id': 'XAGUSDT', 'name': 'Silver (Ounce)', 'image': '🥈'},
            {'id': 'brent', 'symbol': 'BRENT', 'name': 'Brent Crude Oil', 'image': '🛢️'},
            {'id': 'wti', 'symbol': 'WTI', 'name': 'WTI Crude Oil', 'image': '🛢️'},
            {'id': 'natgas', 'symbol': 'NG', 'name': 'Natural Gas', 'image': '🔥'},
            {'id': 'copper', 'symbol': 'HG', 'name': 'Copper', 'image': '🟤'},
        ]
    }

    async def connect(self):
        await self.accept()
        self.running = True
        self.price_task = asyncio.create_task(self.fetch_real_prices())
        print(f"✅ WebSocket connected: {self.channel_name}")

    async def disconnect(self, close_code):
        self.running = False
        if hasattr(self, 'price_task') and not self.price_task.done():
            self.price_task.cancel()
            try:
                await self.price_task
            except asyncio.CancelledError:
                pass
        print(f"❌ WebSocket disconnected (code: {close_code})")

    async def _fetch_binance_tickers(self, session):
        binance_symbols_we_want = {
            asset['binance_id']
            for category in self.ASSET_MAP.values()
            for asset in category
            if 'binance_id' in asset
        }

        try:
            async with session.get(self.BINANCE_URL, timeout=10) as response:
                response.raise_for_status()
                data = await response.json()

                filtered_tickers = {
                    ticker['symbol']: ticker
                    for ticker in data
                    if ticker['symbol'] in binance_symbols_we_want
                }
                return filtered_tickers
        except Exception as e:
            print(f"❌ Error fetching Binance tickers: {e}")
            return {}

    def _get_mock_ticker(self, asset, category):
        symbol = asset['symbol']

        last_price_data = self.TICKER_CACHE.get(symbol, {})
        last_price_str = last_price_data.get('price')

        if last_price_str:
            last_price = Decimal(last_price_str)
        else:
            if category == 'forex':
                last_price = Decimal(random.uniform(0.9, 1.2))
            elif category == 'stocks':
                last_price = Decimal(random.uniform(100.0, 500.0))
            else:
                last_price = Decimal(random.uniform(50.0, 150.0))

        change_percent = Decimal(random.uniform(-3.5, 3.5))
        new_price = last_price * (1 + change_percent / 100)
        change_24h = new_price - last_price
        volume = Decimal(random.uniform(1000000, 50000000))

        self.TICKER_CACHE[symbol] = {'price': str(new_price)}

        return {
            'id': asset['id'],
            'symbol': asset['symbol'],
            'name': asset['name'],
            'image': asset['image'],
            'category': category,
            'price': float(new_price),
            'change_percent_24h': float(change_percent),
            'change_24h': float(change_24h),
            'volume': float(volume),
        }

    async def fetch_real_prices(self):
        async with aiohttp.ClientSession() as session:
            while self.running:
                current_time = asyncio.get_event_loop().time()

                if (current_time - self.last_cache_update) < self.CACHE_LIFETIME:
                    await asyncio.sleep(5)
                    continue

                print("Updating all tickers (Binance + Mock)...")

                binance_tickers = await self._fetch_binance_tickers(session)

                all_assets = []

                for asset in self.ASSET_MAP['crypto']:
                    ticker = binance_tickers.get(asset['binance_id'])
                    if not ticker:
                        continue

                    all_assets.append({
                        'id': asset['id'],
                        'symbol': asset['symbol'],
                        'name': asset['name'],
                        'image': asset['image'],
                        'category': 'crypto',
                        'price': float(ticker.get('lastPrice', 0)),
                        'change_percent_24h': float(ticker.get('priceChangePercent', 0)),
                        'change_24h': float(ticker.get('priceChange', 0)),
                        'volume': float(ticker.get('volume', 0)),
                        'binance_id': asset.get('binance_id'),
                    })

                for asset in self.ASSET_MAP['commodities']:
                    if 'binance_id' in asset:
                        ticker = binance_tickers.get(asset['binance_id'])
                        if not ticker:
                            continue
                        all_assets.append({
                            'id': asset['id'],
                            'symbol': asset['symbol'],
                            'name': asset['name'],
                            'image': asset['image'],
                            'category': 'commodometries',
                            'price': float(ticker.get('lastPrice', 0)),
                            'change_percent_24h': float(ticker.get('priceChangePercent', 0)),
                            'change_24h': float(ticker.get('priceChange', 0)),
                            'volume': float(ticker.get('volume', 0)),
                            'binance_id': asset.get('binance_id'),
                        })
                    else:
                        all_assets.append(self._get_mock_ticker(asset, 'commodities'))

                for asset in self.ASSET_MAP['stocks']:
                    all_assets.append(self._get_mock_ticker(asset, 'stocks'))

                for asset in self.ASSET_MAP['forex']:
                    all_assets.append(self._get_mock_ticker(asset, 'forex'))

                await self.send(text_data=json.dumps({
                    'type': 'market_update',
                    'data': all_assets,
                    'timestamp': datetime.now().isoformat()
                }))

                print(f"📊 Sent {len(all_assets)} asset updates.")
                self.last_cache_update = current_time
                await asyncio.sleep(self.CACHE_LIFETIME)

        print("🛑 Price update task stopped")

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get('type')

            if message_type == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': datetime.now().isoformat()
                }))

        except json.JSONDecodeError:
            print("⚠️ Invalid JSON received")
        except Exception as e:
            print(f"❌ Error in receive: {e}")


class BalanceConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']

        if self.user.is_authenticated:
            self.group_name = f"user_{self.user.id}"
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            await self.accept()
            print(f"✅ Balance WebSocket connected for user: {self.user.email}")

            await self.send(text_data=json.dumps({
                'type': 'balance_update',
                'balance': str(self.user.balance),
                'timestamp': datetime.now().isoformat()
            }))
        else:
            await self.close()

    async def disconnect(self, close_code):
        if hasattr(self, 'user') and self.user.is_authenticated:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
            print(f"❌ Balance WebSocket disconnected for user: {self.user.email}")

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get('type')

            if message_type == 'get_balance':
                await self.send(text_data=json.dumps({
                    'type': 'balance_update',
                    'balance': str(self.user.balance),
                    'timestamp': datetime.now().isoformat()
                }))

        except json.JSONDecodeError:
            print("⚠️ Invalid JSON")
        except Exception as e:
            print(f"❌ Error: {e}")

    async def balance_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'balance_update',
            'balance': event['balance'],
            'timestamp': datetime.now().isoformat()
        }))