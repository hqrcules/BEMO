import json
import asyncio
import aiohttp
import random
from datetime import datetime
from decimal import Decimal
from django.conf import settings
from channels.generic.websocket import AsyncWebsocketConsumer
from .services import MarketDataService


class MarketConsumer(AsyncWebsocketConsumer):
    running = False
    TICKER_CACHE = {}
    CACHE_LIFETIME = 20
    last_cache_update = 0
    BINANCE_URL = "https://api.binance.com/api/v3/ticker/24hr"

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
        {'id': 'dogecoin', 'symbol': 'DOGE', 'binance_id': 'DOGEUSDT', 'name': 'Dogecoin',
         'image': 'https://assets.coincap.io/assets/icons/doge@2x.png'},
        {'id': 'cardano', 'symbol': 'ADA', 'binance_id': 'ADAUSDT', 'name': 'Cardano',
         'image': 'https://assets.coincap.io/assets/icons/ada@2x.png'},
        {'id': 'avalanche', 'symbol': 'AVAX', 'binance_id': 'AVAXUSDT', 'name': 'Avalanche',
         'image': 'https://assets.coincap.io/assets/icons/avax@2x.png'},
        {'id': 'tron', 'symbol': 'TRX', 'binance_id': 'TRXUSDT', 'name': 'TRON',
         'image': 'https://assets.coincap.io/assets/icons/trx@2x.png'},
        {'id': 'chainlink', 'symbol': 'LINK', 'binance_id': 'LINKUSDT', 'name': 'Chainlink',
         'image': 'https://assets.coincap.io/assets/icons/link@2x.png'},
        {'id': 'polkadot', 'symbol': 'DOT', 'binance_id': 'DOTUSDT', 'name': 'Polkadot',
         'image': 'https://assets.coincap.io/assets/icons/dot@2x.png'},
        {'id': 'polygon', 'symbol': 'MATIC', 'binance_id': 'MATICUSDT', 'name': 'Polygon',
         'image': 'https://assets.coincap.io/assets/icons/matic@2x.png'},
        {'id': 'shiba-inu', 'symbol': 'SHIB', 'binance_id': 'SHIBUSDT', 'name': 'Shiba Inu',
         'image': 'https://assets.coincap.io/assets/icons/shib@2x.png'},
        {'id': 'uniswap', 'symbol': 'UNI', 'binance_id': 'UNIUSDT', 'name': 'Uniswap',
         'image': 'https://assets.coincap.io/assets/icons/uni@2x.png'},
        {'id': 'litecoin', 'symbol': 'LTC', 'binance_id': 'LTCUSDT', 'name': 'Litecoin',
         'image': 'https://assets.coincap.io/assets/icons/ltc@2x.png'},
        {'id': 'cosmos', 'symbol': 'ATOM', 'binance_id': 'ATOMUSDT', 'name': 'Cosmos',
         'image': 'https://assets.coincap.io/assets/icons/atom@2x.png'},
        {'id': 'ethereum-classic', 'symbol': 'ETC', 'binance_id': 'ETCUSDT', 'name': 'Ethereum Classic',
         'image': 'https://assets.coincap.io/assets/icons/etc@2x.png'},
        {'id': 'stellar', 'symbol': 'XLM', 'binance_id': 'XLMUSDT', 'name': 'Stellar',
         'image': 'https://assets.coincap.io/assets/icons/xlm@2x.png'},
        {'id': 'bitcoin-cash', 'symbol': 'BCH', 'binance_id': 'BCHUSDT', 'name': 'Bitcoin Cash',
         'image': 'https://assets.coincap.io/assets/icons/bch@2x.png'},
        {'id': 'near', 'symbol': 'NEAR', 'binance_id': 'NEARUSDT', 'name': 'NEAR Protocol',
         'image': 'https://assets.coincap.io/assets/icons/near@2x.png'},
        {'id': 'algorand', 'symbol': 'ALGO', 'binance_id': 'ALGOUSDT', 'name': 'Algorand',
         'image': 'https://assets.coincap.io/assets/icons/algo@2x.png'},
        {'id': 'vechain', 'symbol': 'VET', 'binance_id': 'VETUSDT', 'name': 'VeChain',
         'image': 'https://assets.coincap.io/assets/icons/vet@2x.png'},
        {'id': 'filecoin', 'symbol': 'FIL', 'binance_id': 'FILUSDT', 'name': 'Filecoin',
         'image': 'https://assets.coincap.io/assets/icons/fil@2x.png'},
        {'id': 'hedera', 'symbol': 'HBAR', 'binance_id': 'HBARUSDT', 'name': 'Hedera',
         'image': 'https://assets.coincap.io/assets/icons/hbar@2x.png'},
        {'id': 'apecoin', 'symbol': 'APE', 'binance_id': 'APEUSDT', 'name': 'ApeCoin',
         'image': 'https://assets.coincap.io/assets/icons/ape@2x.png'},
        {'id': 'quant', 'symbol': 'QNT', 'binance_id': 'QNTUSDT', 'name': 'Quant',
         'image': 'https://assets.coincap.io/assets/icons/qnt@2x.png'},
        {'id': 'internet-computer', 'symbol': 'ICP', 'binance_id': 'ICPUSDT', 'name': 'Internet Computer',
         'image': 'https://assets.coincap.io/assets/icons/icp@2x.png'},
        {'id': 'aptos', 'symbol': 'APT', 'binance_id': 'APTUSDT', 'name': 'Aptos',
         'image': 'https://assets.coincap.io/assets/icons/apt@2x.png'},
        {'id': 'decentraland', 'symbol': 'MANA', 'binance_id': 'MANAUSDT', 'name': 'Decentraland',
         'image': 'https://assets.coincap.io/assets/icons/mana@2x.png'},
        {'id': 'sandbox', 'symbol': 'SAND', 'binance_id': 'SANDUSDT', 'name': 'The Sandbox',
         'image': 'https://assets.coincap.io/assets/icons/sand@2x.png'},
        {'id': 'cronos', 'symbol': 'CRO', 'binance_id': 'CROUSDT', 'name': 'Cronos',
         'image': 'https://assets.coincap.io/assets/icons/cro@2x.png'},
        {'id': 'aave', 'symbol': 'AAVE', 'binance_id': 'AAVEUSDT', 'name': 'Aave',
         'image': 'https://assets.coincap.io/assets/icons/aave@2x.png'},
        {'id': 'the-graph', 'symbol': 'GRT', 'binance_id': 'GRTUSDT', 'name': 'The Graph',
         'image': 'https://assets.coincap.io/assets/icons/grt@2x.png'},
        {'id': 'eos', 'symbol': 'EOS', 'binance_id': 'EOSUSDT', 'name': 'EOS',
         'image': 'https://assets.coincap.io/assets/icons/eos@2x.png'},
        {'id': 'tezos', 'symbol': 'XTZ', 'binance_id': 'XTZUSDT', 'name': 'Tezos',
         'image': 'https://assets.coincap.io/assets/icons/xtz@2x.png'},
        {'id': 'axie-infinity', 'symbol': 'AXS', 'binance_id': 'AXSUSDT', 'name': 'Axie Infinity',
         'image': 'https://assets.coincap.io/assets/icons/axs@2x.png'},
        {'id': 'theta', 'symbol': 'THETA', 'binance_id': 'THETAUSDT', 'name': 'Theta Network',
         'image': 'https://assets.coincap.io/assets/icons/theta@2x.png'},
        {'id': 'fantom', 'symbol': 'FTM', 'binance_id': 'FTMUSDT', 'name': 'Fantom',
         'image': 'https://assets.coincap.io/assets/icons/ftm@2x.png'},
        {'id': 'elrond', 'symbol': 'EGLD', 'binance_id': 'EGLDUSDT', 'name': 'MultiversX',
         'image': 'https://assets.coincap.io/assets/icons/egld@2x.png'},
        {'id': 'thorchain', 'symbol': 'RUNE', 'binance_id': 'RUNEUSDT', 'name': 'THORChain',
         'image': 'https://assets.coincap.io/assets/icons/rune@2x.png'},
        {'id': 'monero', 'symbol': 'XMR', 'binance_id': 'XMRUSDT', 'name': 'Monero',
         'image': 'https://assets.coincap.io/assets/icons/xmr@2x.png'},
        {'id': 'klaytn', 'symbol': 'KLAY', 'binance_id': 'KLAYUSDT', 'name': 'Klaytn',
         'image': 'https://assets.coincap.io/assets/icons/klay@2x.png'},
        {'id': 'flow', 'symbol': 'FLOW', 'binance_id': 'FLOWUSDT', 'name': 'Flow',
         'image': 'https://assets.coincap.io/assets/icons/flow@2x.png'},
        {'id': 'chiliz', 'symbol': 'CHZ', 'binance_id': 'CHZUSDT', 'name': 'Chiliz',
         'image': 'https://assets.coincap.io/assets/icons/chz@2x.png'},
        {'id': 'enjin', 'symbol': 'ENJ', 'binance_id': 'ENJUSDT', 'name': 'Enjin Coin',
         'image': 'https://assets.coincap.io/assets/icons/enj@2x.png'},
        {'id': 'gala', 'symbol': 'GALA', 'binance_id': 'GALAUSDT', 'name': 'Gala',
         'image': 'https://assets.coincap.io/assets/icons/gala@2x.png'},
        {'id': 'lido-dao', 'symbol': 'LDO', 'binance_id': 'LDOUSDT', 'name': 'Lido DAO',
         'image': 'https://assets.coincap.io/assets/icons/ldo@2x.png'},
        {'id': 'pancakeswap', 'symbol': 'CAKE', 'binance_id': 'CAKEUSDT', 'name': 'PancakeSwap',
         'image': 'https://assets.coincap.io/assets/icons/cake@2x.png'},
        {'id': 'maker', 'symbol': 'MKR', 'binance_id': 'MKRUSDT', 'name': 'Maker',
         'image': 'https://assets.coincap.io/assets/icons/mkr@2x.png'},
        {'id': 'synthetix', 'symbol': 'SNX', 'binance_id': 'SNXUSDT', 'name': 'Synthetix',
         'image': 'https://assets.coincap.io/assets/icons/snx@2x.png'},
        {'id': 'neo', 'symbol': 'NEO', 'binance_id': 'NEOUSDT', 'name': 'NEO',
         'image': 'https://assets.coincap.io/assets/icons/neo@2x.png'},
        {'id': 'stacks', 'symbol': 'STX', 'binance_id': 'STXUSDT', 'name': 'Stacks',
         'image': 'https://assets.coincap.io/assets/icons/stx@2x.png'},
        {'id': 'kava', 'symbol': 'KAVA', 'binance_id': 'KAVAUSDT', 'name': 'Kava',
         'image': 'https://assets.coincap.io/assets/icons/kava@2x.png'},
        {'id': 'injective', 'symbol': 'INJ', 'binance_id': 'INJUSDT', 'name': 'Injective',
         'image': 'https://assets.coincap.io/assets/icons/inj@2x.png'},
        {'id': 'compound', 'symbol': 'COMP', 'binance_id': 'COMPUSDT', 'name': 'Compound',
         'image': 'https://assets.coincap.io/assets/icons/comp@2x.png'},
        {'id': 'zilliqa', 'symbol': 'ZIL', 'binance_id': 'ZILUSDT', 'name': 'Zilliqa',
         'image': 'https://assets.coincap.io/assets/icons/zil@2x.png'},
        {'id': 'basic-attention-token', 'symbol': 'BAT', 'binance_id': 'BATUSDT', 'name': 'Basic Attention Token',
         'image': 'https://assets.coincap.io/assets/icons/bat@2x.png'},
        {'id': 'ontology', 'symbol': 'ONT', 'binance_id': 'ONTUSDT', 'name': 'Ontology',
         'image': 'https://assets.coincap.io/assets/icons/ont@2x.png'},
        {'id': 'dash', 'symbol': 'DASH', 'binance_id': 'DASHUSDT', 'name': 'Dash',
         'image': 'https://assets.coincap.io/assets/icons/dash@2x.png'},
        {'id': 'zcash', 'symbol': 'ZEC', 'binance_id': 'ZECUSDT', 'name': 'Zcash',
         'image': 'https://assets.coincap.io/assets/icons/zec@2x.png'},
        {'id': 'iotex', 'symbol': 'IOTX', 'binance_id': 'IOTXUSDT', 'name': 'IoTeX',
         'image': 'https://assets.coincap.io/assets/icons/iotx@2x.png'},
        {'id': 'omisego', 'symbol': 'OMG', 'binance_id': 'OMGUSDT', 'name': 'OMG Network',
         'image': 'https://assets.coincap.io/assets/icons/omg@2x.png'},
        {'id': 'celo', 'symbol': 'CELO', 'binance_id': 'CELOUSDT', 'name': 'Celo',
         'image': 'https://assets.coincap.io/assets/icons/celo@2x.png'},
        {'id': 'arweave', 'symbol': 'AR', 'binance_id': 'ARUSDT', 'name': 'Arweave',
         'image': 'https://assets.coincap.io/assets/icons/ar@2x.png'},
        {'id': 'waves', 'symbol': 'WAVES', 'binance_id': 'WAVESUSDT', 'name': 'Waves',
         'image': 'https://assets.coincap.io/assets/icons/waves@2x.png'},
        {'id': 'qtum', 'symbol': 'QTUM', 'binance_id': 'QTUMUSDT', 'name': 'Qtum',
         'image': 'https://assets.coincap.io/assets/icons/qtum@2x.png'},
        {'id': '0x', 'symbol': 'ZRX', 'binance_id': 'ZRXUSDT', 'name': '0x',
         'image': 'https://assets.coincap.io/assets/icons/zrx@2x.png'},
        {'id': 'skale', 'symbol': 'SKL', 'binance_id': 'SKLUSDT', 'name': 'SKALE',
         'image': 'https://assets.coincap.io/assets/icons/skl@2x.png'},
        {'id': 'immutable-x', 'symbol': 'IMX', 'binance_id': 'IMXUSDT', 'name': 'Immutable X',
         'image': 'https://assets.coincap.io/assets/icons/imx@2x.png'},
        {'id': 'dydx', 'symbol': 'DYDX', 'binance_id': 'DYDXUSDT', 'name': 'dYdX',
         'image': 'https://assets.coincap.io/assets/icons/dydx@2x.png'},
        {'id': 'optimism', 'symbol': 'OP', 'binance_id': 'OPUSDT', 'name': 'Optimism',
         'image': 'https://assets.coincap.io/assets/icons/op@2x.png'},
        {'id': 'arbitrum', 'symbol': 'ARB', 'binance_id': 'ARBUSDT', 'name': 'Arbitrum',
         'image': 'https://assets.coincap.io/assets/icons/arb@2x.png'},
        {'id': 'sui', 'symbol': 'SUI', 'binance_id': 'SUIUSDT', 'name': 'Sui',
         'image': 'https://assets.coincap.io/assets/icons/sui@2x.png'},
        {'id': 'pepe', 'symbol': 'PEPE', 'binance_id': 'PEPEUSDT', 'name': 'Pepe',
         'image': 'https://assets.coincap.io/assets/icons/pepe@2x.png'},
        {'id': 'worldcoin', 'symbol': 'WLD', 'binance_id': 'WLDUSDT', 'name': 'Worldcoin',
         'image': 'https://assets.coincap.io/assets/icons/wld@2x.png'},
        {'id': 'render', 'symbol': 'RNDR', 'binance_id': 'RNDRUSDT', 'name': 'Render',
         'image': 'https://assets.coincap.io/assets/icons/rndr@2x.png'},
        {'id': 'fetch-ai', 'symbol': 'FET', 'binance_id': 'FETUSDT', 'name': 'Fetch.ai',
         'image': 'https://assets.coincap.io/assets/icons/fet@2x.png'},
        {'id': 'singularitynet', 'symbol': 'AGIX', 'binance_id': 'AGIXUSDT', 'name': 'SingularityNET',
         'image': 'https://assets.coincap.io/assets/icons/agix@2x.png'},
        {'id': 'oasis', 'symbol': 'ROSE', 'binance_id': 'ROSEUSDT', 'name': 'Oasis Network',
         'image': 'https://assets.coincap.io/assets/icons/rose@2x.png'},
        {'id': 'kusama', 'symbol': 'KSM', 'binance_id': 'KSMUSDT', 'name': 'Kusama',
         'image': 'https://assets.coincap.io/assets/icons/ksm@2x.png'},
        {'id': 'curve', 'symbol': 'CRV', 'binance_id': 'CRVUSDT', 'name': 'Curve DAO',
         'image': 'https://assets.coincap.io/assets/icons/crv@2x.png'},
        {'id': 'sushi', 'symbol': 'SUSHI', 'binance_id': 'SUSHIUSDT', 'name': 'SushiSwap',
         'image': 'https://assets.coincap.io/assets/icons/sushi@2x.png'},
        {'id': 'balancer', 'symbol': 'BAL', 'binance_id': 'BALUSDT', 'name': 'Balancer',
         'image': 'https://assets.coincap.io/assets/icons/bal@2x.png'},
        {'id': '1inch', 'symbol': '1INCH', 'binance_id': '1INCHUSDT', 'name': '1inch',
         'image': 'https://assets.coincap.io/assets/icons/1inch@2x.png'},
        {'id': 'loopring', 'symbol': 'LRC', 'binance_id': 'LRCUSDT', 'name': 'Loopring',
         'image': 'https://assets.coincap.io/assets/icons/lrc@2x.png'},
        {'id': 'kyber', 'symbol': 'KNC', 'binance_id': 'KNCUSDT', 'name': 'Kyber Network',
         'image': 'https://assets.coincap.io/assets/icons/knc@2x.png'},
        {'id': 'storj', 'symbol': 'STORJ', 'binance_id': 'STORJUSDT', 'name': 'Storj',
         'image': 'https://assets.coincap.io/assets/icons/storj@2x.png'},
        {'id': 'ankr', 'symbol': 'ANKR', 'binance_id': 'ANKRUSDT', 'name': 'Ankr',
         'image': 'https://assets.coincap.io/assets/icons/ankr@2x.png'},
        {'id': 'bancor', 'symbol': 'BNT', 'binance_id': 'BNTUSDT', 'name': 'Bancor',
         'image': 'https://assets.coincap.io/assets/icons/bnt@2x.png'},
        {'id': 'mina', 'symbol': 'MINA', 'binance_id': 'MINAUSDT', 'name': 'Mina Protocol',
         'image': 'https://assets.coincap.io/assets/icons/mina@2x.png'},
        {'id': 'jasmy', 'symbol': 'JASMY', 'binance_id': 'JASMYUSDT', 'name': 'JasmyCoin',
         'image': 'https://assets.coincap.io/assets/icons/jasmy@2x.png'},
        {'id': 'pendle', 'symbol': 'PENDLE', 'binance_id': 'PENDLEUSDT', 'name': 'Pendle',
         'image': 'https://assets.coincap.io/assets/icons/pendle@2x.png'},
        {'id': 'woo', 'symbol': 'WOO', 'binance_id': 'WOOUSDT', 'name': 'WOO Network',
         'image': 'https://assets.coincap.io/assets/icons/woo@2x.png'},
    ]

    STOCKS_MAP = [
        {'id': 'apple', 'symbol': 'AAPL', 'name': 'Apple Inc.', 'image': 'https://logo.clearbit.com/apple.com'},
        {'id': 'microsoft', 'symbol': 'MSFT', 'name': 'Microsoft Corp.', 'image': 'https://logo.clearbit.com/microsoft.com'},
        {'id': 'nvidia', 'symbol': 'NVDA', 'name': 'NVIDIA Corp.', 'image': 'https://logo.clearbit.com/nvidia.com'},
        {'id': 'google', 'symbol': 'GOOGL', 'name': 'Alphabet Inc.', 'image': 'https://logo.clearbit.com/google.com'},
        {'id': 'amazon', 'symbol': 'AMZN', 'name': 'Amazon.com Inc.', 'image': 'https://logo.clearbit.com/amazon.com'},
        {'id': 'meta', 'symbol': 'META', 'name': 'Meta Platforms', 'image': 'https://logo.clearbit.com/meta.com'},
        {'id': 'tesla', 'symbol': 'TSLA', 'name': 'Tesla Inc.', 'image': 'https://logo.clearbit.com/tesla.com'},
        {'id': 'berkshire', 'symbol': 'BRK.B', 'name': 'Berkshire Hathaway', 'image': 'https://logo.clearbit.com/berkshirehathaway.com'},
        {'id': 'broadcom', 'symbol': 'AVGO', 'name': 'Broadcom Inc.', 'image': 'https://logo.clearbit.com/broadcom.com'},
        {'id': 'walmart', 'symbol': 'WMT', 'name': 'Walmart Inc.', 'image': 'https://logo.clearbit.com/walmart.com'},
        {'id': 'jpmorgan', 'symbol': 'JPM', 'name': 'JPMorgan Chase', 'image': 'https://logo.clearbit.com/jpmorganchase.com'},
        {'id': 'visa', 'symbol': 'V', 'name': 'Visa Inc.', 'image': 'https://logo.clearbit.com/visa.com'},
        {'id': 'unitedhealth', 'symbol': 'UNH', 'name': 'UnitedHealth Group', 'image': 'https://logo.clearbit.com/unitedhealthgroup.com'},
        {'id': 'exxon', 'symbol': 'XOM', 'name': 'Exxon Mobil', 'image': 'https://logo.clearbit.com/exxonmobil.com'},
        {'id': 'johnson', 'symbol': 'JNJ', 'name': 'Johnson & Johnson', 'image': 'https://logo.clearbit.com/jnj.com'},
        {'id': 'mastercard', 'symbol': 'MA', 'name': 'Mastercard Inc.', 'image': 'https://logo.clearbit.com/mastercard.com'},
        {'id': 'procter', 'symbol': 'PG', 'name': 'Procter & Gamble', 'image': 'https://logo.clearbit.com/pg.com'},
        {'id': 'netflix', 'symbol': 'NFLX', 'name': 'Netflix Inc.', 'image': 'https://logo.clearbit.com/netflix.com'},
        {'id': 'home-depot', 'symbol': 'HD', 'name': 'Home Depot Inc.', 'image': 'https://logo.clearbit.com/homedepot.com'},
        {'id': 'costco', 'symbol': 'COST', 'name': 'Costco Wholesale', 'image': 'https://logo.clearbit.com/costco.com'},
        {'id': 'coca-cola', 'symbol': 'KO', 'name': 'Coca-Cola Co.', 'image': 'https://logo.clearbit.com/coca-cola.com'},
        {'id': 'pepsi', 'symbol': 'PEP', 'name': 'PepsiCo Inc.', 'image': 'https://logo.clearbit.com/pepsico.com'},
        {'id': 'adobe', 'symbol': 'ADBE', 'name': 'Adobe Inc.', 'image': 'https://logo.clearbit.com/adobe.com'},
        {'id': 'salesforce', 'symbol': 'CRM', 'name': 'Salesforce Inc.', 'image': 'https://logo.clearbit.com/salesforce.com'},
        {'id': 'cisco', 'symbol': 'CSCO', 'name': 'Cisco Systems', 'image': 'https://logo.clearbit.com/cisco.com'},
        {'id': 'intel', 'symbol': 'INTC', 'name': 'Intel Corp.', 'image': 'https://logo.clearbit.com/intel.com'},
        {'id': 'amd', 'symbol': 'AMD', 'name': 'AMD Inc.', 'image': 'https://logo.clearbit.com/amd.com'},
        {'id': 'oracle', 'symbol': 'ORCL', 'name': 'Oracle Corp.', 'image': 'https://logo.clearbit.com/oracle.com'},
        {'id': 'disney', 'symbol': 'DIS', 'name': 'Walt Disney Co.', 'image': 'https://logo.clearbit.com/disney.com'},
        {'id': 'mcdonalds', 'symbol': 'MCD', 'name': "McDonald's Corp.", 'image': 'https://logo.clearbit.com/mcdonalds.com'},
        {'id': 'boeing', 'symbol': 'BA', 'name': 'Boeing Co.', 'image': 'https://logo.clearbit.com/boeing.com'},
        {'id': 'nike', 'symbol': 'NKE', 'name': 'Nike Inc.', 'image': 'https://logo.clearbit.com/nike.com'},
        {'id': 'pfizer', 'symbol': 'PFE', 'name': 'Pfizer Inc.', 'image': 'https://logo.clearbit.com/pfizer.com'},
        {'id': 'merck', 'symbol': 'MRK', 'name': 'Merck & Co.', 'image': 'https://logo.clearbit.com/merck.com'},
        {'id': 'abbott', 'symbol': 'ABT', 'name': 'Abbott Labs', 'image': 'https://logo.clearbit.com/abbott.com'},
        {'id': 'verizon', 'symbol': 'VZ', 'name': 'Verizon Communications', 'image': 'https://logo.clearbit.com/verizon.com'},
        {'id': 'att', 'symbol': 'T', 'name': 'AT&T Inc.', 'image': 'https://logo.clearbit.com/att.com'},
        {'id': 'comcast', 'symbol': 'CMCSA', 'name': 'Comcast Corp.', 'image': 'https://logo.clearbit.com/comcast.com'},
        {'id': 'chevron', 'symbol': 'CVX', 'name': 'Chevron Corp.', 'image': 'https://logo.clearbit.com/chevron.com'},
        {'id': 'bank-america', 'symbol': 'BAC', 'name': 'Bank of America', 'image': 'https://logo.clearbit.com/bankofamerica.com'},
        {'id': 'wells-fargo', 'symbol': 'WFC', 'name': 'Wells Fargo', 'image': 'https://logo.clearbit.com/wellsfargo.com'},
        {'id': 'morgan-stanley', 'symbol': 'MS', 'name': 'Morgan Stanley', 'image': 'https://logo.clearbit.com/morganstanley.com'},
        {'id': 'goldman', 'symbol': 'GS', 'name': 'Goldman Sachs', 'image': 'https://logo.clearbit.com/goldmansachs.com'},
        {'id': 'ibm', 'symbol': 'IBM', 'name': 'IBM Corp.', 'image': 'https://logo.clearbit.com/ibm.com'},
        {'id': 'qualcomm', 'symbol': 'QCOM', 'name': 'Qualcomm Inc.', 'image': 'https://logo.clearbit.com/qualcomm.com'},
        {'id': 'texas-instruments', 'symbol': 'TXN', 'name': 'Texas Instruments', 'image': 'https://logo.clearbit.com/ti.com'},
        {'id': 'starbucks', 'symbol': 'SBUX', 'name': 'Starbucks Corp.', 'image': 'https://logo.clearbit.com/starbucks.com'},
        {'id': 'amex', 'symbol': 'AXP', 'name': 'American Express', 'image': 'https://logo.clearbit.com/americanexpress.com'},
        {'id': 'fedex', 'symbol': 'FDX', 'name': 'FedEx Corp.', 'image': 'https://logo.clearbit.com/fedex.com'},
        {'id': 'ups', 'symbol': 'UPS', 'name': 'UPS Inc.', 'image': 'https://logo.clearbit.com/ups.com'},
    ]

    FOREX_MAP = [
        {'id': 'eur-usd', 'symbol': 'EUR/USD', 'base': 'EUR', 'quote': 'USD', 'name': 'EUR to USD', 'image': ''},
        {'id': 'gbp-usd', 'symbol': 'GBP/USD', 'base': 'GBP', 'quote': 'USD', 'name': 'GBP to USD', 'image': ''},
        {'id': 'usd-jpy', 'symbol': 'USD/JPY', 'base': 'USD', 'quote': 'JPY', 'name': 'USD to JPY', 'image': ''},
        {'id': 'eur-jpy', 'symbol': 'EUR/JPY', 'base': 'EUR', 'quote': 'JPY', 'name': 'EUR to JPY', 'image': ''},
        {'id': 'eur-gbp', 'symbol': 'EUR/GBP', 'base': 'EUR', 'quote': 'GBP', 'name': 'EUR to GBP', 'image': ''},
        {'id': 'aud-usd', 'symbol': 'AUD/USD', 'base': 'AUD', 'quote': 'USD', 'name': 'AUD to USD', 'image': ''},
        {'id': 'usd-cad', 'symbol': 'USD/CAD', 'base': 'USD', 'quote': 'CAD', 'name': 'USD to CAD', 'image': ''},
        {'id': 'usd-chf', 'symbol': 'USD/CHF', 'base': 'USD', 'quote': 'CHF', 'name': 'USD to CHF', 'image': ''},
        {'id': 'nzd-usd', 'symbol': 'NZD/USD', 'base': 'NZD', 'quote': 'USD', 'name': 'NZD to USD', 'image': ''},
        {'id': 'gbp-jpy', 'symbol': 'GBP/JPY', 'base': 'GBP', 'quote': 'JPY', 'name': 'GBP to JPY', 'image': ''},
        {'id': 'aud-jpy', 'symbol': 'AUD/JPY', 'base': 'AUD', 'quote': 'JPY', 'name': 'AUD to JPY', 'image': ''},
        {'id': 'usd-cny', 'symbol': 'USD/CNY', 'base': 'USD', 'quote': 'CNY', 'name': 'USD to CNY', 'image': ''},
        {'id': 'usd-rub', 'symbol': 'USD/RUB', 'base': 'USD', 'quote': 'RUB', 'name': 'USD to RUB', 'image': ''},
        {'id': 'usd-try', 'symbol': 'USD/TRY', 'base': 'USD', 'quote': 'TRY', 'name': 'USD to TRY', 'image': ''},
        {'id': 'eur-chf', 'symbol': 'EUR/CHF', 'base': 'EUR', 'quote': 'CHF', 'name': 'EUR to CHF', 'image': ''},
    ]

    COMMODITIES_MAP = [
        {'id': 'gold', 'symbol': 'XAU', 'binance_id': 'XAUUSDT', 'name': 'Gold', 'image': ''},
        {'id': 'silver', 'symbol': 'XAG', 'binance_id': 'XAGUSDT', 'name': 'Silver', 'image': ''},
        {'id': 'platinum', 'symbol': 'XPT', 'binance_id': 'XPTUSDT', 'name': 'Platinum', 'image': ''},
        {'id': 'palladium', 'symbol': 'XPD', 'binance_id': 'XPDUSDT', 'name': 'Palladium', 'image': ''},
    ]

    async def connect(self):
        await self.accept()
        self.running = True

        # Track authenticated vs anonymous users
        user = self.scope.get('user')
        if user and user.is_authenticated:
            self.is_authenticated = True
            print(f"[Market WS] Authenticated user connected: {user.email}")
        else:
            self.is_authenticated = False
            print(f"[Market WS] Anonymous user connected")

        # Changed: Use cached data instead of fetching directly
        self.broadcast_task = asyncio.create_task(self.broadcast_cached_data())
        print(f"[WS] WebSocket connected ({self.channel_name})")

    async def disconnect(self, close_code):
        self.running = False
        if hasattr(self, 'broadcast_task') and not self.broadcast_task.done():
            self.broadcast_task.cancel()
            try:
                await self.broadcast_task
            except asyncio.CancelledError:
                pass
        print(f"[WS] WebSocket disconnected (code={close_code})")

    async def fetch_binance_tickers(self, session):
        binance_symbols_we_want = [asset['binance_id'] for asset in self.CRYPTO_ASSETS]
        binance_symbols_we_want += [asset['binance_id'] for asset in self.COMMODITIES_MAP if 'binance_id' in asset]

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
            print(f"Error fetching Binance tickers: {e}")
            return {}

    async def fetch_forex_rates(self, session):
        try:
            url = "https://api.exchangerate-api.com/v4/latest/USD"
            async with session.get(url, timeout=10) as response:
                response.raise_for_status()
                data = await response.json()
                return data.get('rates', {})
        except Exception as e:
            print(f"Error fetching forex rates: {e}")
            return {}

    def calculate_forex_price(self, base_currency: str, quote_currency: str, rates: dict) -> float:
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

    def get_mock_ticker(self, asset, category):
        symbol = asset['symbol']
        last_price_data = self.TICKER_CACHE.get(symbol, {})
        last_price_str = last_price_data.get('price')

        if last_price_str:
            last_price = Decimal(last_price_str)
        else:
            if category == 'stocks':
                last_price = Decimal(random.uniform(100.0, 500.0))
            else:
                last_price = Decimal(random.uniform(50.0, 150.0))

        change_percent = Decimal(random.uniform(-3.5, 3.5))
        new_price = last_price * (1 + change_percent / 100)
        change_24h = new_price - last_price
        volume = Decimal(random.uniform(1_000_000, 50_000_000))

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
            'volume': float(volume)
        }

    async def fetch_real_prices(self):
        async with aiohttp.ClientSession() as session:
            while self.running:
                current_time = asyncio.get_event_loop().time()

                if (current_time - self.last_cache_update) < self.CACHE_LIFETIME:
                    await asyncio.sleep(5)
                    continue

                print("Updating all tickers (Binance + Forex + Mock)...")

                binance_tickers = await self.fetch_binance_tickers(session)
                forex_rates = await self.fetch_forex_rates(session)

                all_assets = []

                # ===== CRYPTO =====
                for asset in self.CRYPTO_ASSETS:
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
                        'binance_id': asset.get('binance_id')
                    })

                # ===== COMMODITIES (з Binance або mock) =====
                for asset in self.COMMODITIES_MAP:
                    ticker = binance_tickers.get(asset['binance_id'])

                    if ticker:
                        # Є дані від Binance
                        all_assets.append({
                            'id': asset['id'],
                            'symbol': asset['symbol'],
                            'name': asset['name'],
                            'image': asset['image'],
                            'category': 'commodities',
                            'price': float(ticker.get('lastPrice', 0)),
                            'change_percent_24h': float(ticker.get('priceChangePercent', 0)),
                            'change_24h': float(ticker.get('priceChange', 0)),
                            'volume': float(ticker.get('volume', 0)),
                            'binance_id': asset.get('binance_id')
                        })
                    else:
                        # Немає від Binance, використовуємо mock
                        mock_ticker = self.get_mock_ticker(asset, 'commodities')
                        all_assets.append(mock_ticker)

                # ===== FOREX =====
                for asset in self.FOREX_MAP:
                    price = self.calculate_forex_price(asset['base'], asset['quote'], forex_rates)

                    if price == 0.0:
                        continue

                    last_price_data = self.TICKER_CACHE.get(asset['symbol'], {})
                    last_price = Decimal(last_price_data.get('price', str(price)))

                    change_24h = Decimal(str(price)) - last_price
                    change_percent = (change_24h / last_price * 100) if last_price != 0 else Decimal('0')

                    self.TICKER_CACHE[asset['symbol']] = {'price': str(price)}

                    all_assets.append({
                        'id': asset['id'],
                        'symbol': asset['symbol'],
                        'name': asset['name'],
                        'image': asset['image'],
                        'category': 'forex',
                        'price': float(price),
                        'change_percent_24h': float(change_percent),
                        'change_24h': float(change_24h),
                        'volume': 0
                    })

                # ===== STOCKS =====
                for asset in self.STOCKS_MAP:
                    all_assets.append(self.get_mock_ticker(asset, 'stocks'))

                # Відправка на клієнт
                await self.send(text_data=json.dumps({
                    'type': 'market_update',
                    'data': all_assets,
                    'timestamp': datetime.now().isoformat()
                }))

                print(f"[WS] Sent {len(all_assets)} asset updates.")
                self.last_cache_update = current_time
                await asyncio.sleep(self.CACHE_LIFETIME)

        print("Price update task stopped")

    async def broadcast_cached_data(self):
        """
        New optimized method: Send cached data to client every 5 seconds
        Data is fetched by Celery task, reducing duplicate API calls
        """
        while self.running:
            try:
                # Read data from Redis cache (populated by Celery task)
                cached_data = MarketDataService.get_cached_websocket_data()

                if cached_data:
                    await self.send(text_data=json.dumps({
                        'type': 'market_update',
                        'data': cached_data,
                        'timestamp': datetime.now().isoformat(),
                        'source': 'cache'  # Indicates data came from cache
                    }))
                    print(f"[WS] Sent {len(cached_data)} assets from cache")
                else:
                    # If cache is empty, fallback to direct fetch (first run)
                    print("[WS] Cache empty, waiting for Celery task to populate...")

                await asyncio.sleep(5)

            except Exception as e:
                print(f"[WS] Error broadcasting cached data: {e}")
                await asyncio.sleep(5)

        print("Cached data broadcast task stopped")

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
            print("Invalid JSON received")
        except Exception as e:
            print(f"Error in receive: {e}")


class BalanceConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        """
        Connect to balance WebSocket - REQUIRES AUTHENTICATION
        Closes connection immediately if user is not authenticated
        """
        user = self.scope.get('user')

        # CRITICAL: Balance data requires authentication
        if not user or not user.is_authenticated:
            print("[Balance WS] Rejected: User not authenticated")
            await self.close(code=4001)  # Custom close code for auth failure
            return

        self.user = user
        self.group_name = f'user_{self.user.id}'

        # Add to user-specific channel group
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        print(f"[Balance WS] Authenticated connection: {self.user.email}")

        # Send initial balance
        await self.send(text_data=json.dumps({
            'type': 'balance_update',
            'balance': str(self.user.balance),
            'timestamp': datetime.now().isoformat()
        }))

    async def disconnect(self, close_code):
        if hasattr(self, 'user') and self.user.is_authenticated:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
            print(f"[Balance WS] Disconnected for user {self.user.email}")

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
            print("Invalid JSON")
        except Exception as e:
            print(f"Error: {e}")

    async def balance_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'balance_update',
            'balance': event['balance'],
            'timestamp': datetime.now().isoformat()
        }))

    async def bot_trade_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'bot_trade_update',
            'balance': event['balance'],
            'trade': event['trade'],
            'timestamp': datetime.now().isoformat()
        }))
