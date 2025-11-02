import aiohttp
import asyncio
import time
from datetime import datetime
from django.conf import settings
from typing import List, Dict, Literal, Optional

Interval = Literal['1h', '4h', '1d', '1w']
SymbolType = Literal['crypto', 'stock', 'forex', 'commodity']


class MarketDataFetcher:
    BINANCE_API_URL = "https://api.binance.com/api/v3/klines"

    CRYPTO_SYMBOLS = [
        'BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX', 'LINK',
        'DOT', 'UNI', 'LTC', 'BCH', 'XLM', 'ETC', 'XMR', 'AAVE', 'ATOM',
        'FIL', 'MATIC', 'SHIB', 'TRX', 'NEAR', 'ALGO', 'FTM', 'HBAR', 'ICP',
        'XTZ', 'SAND', 'MANA', 'EOS', 'IOTA', 'NEO', 'MKR', 'ZEC', 'DASH',
        'BTT', 'COMP', 'SUSHI', 'YFI', 'PEPE', 'WLD', 'ARB', 'OP', 'GRT',
        'RNDR', 'VET', 'RUNE', 'INJ', 'QNT', 'GALA', 'KAVA', 'XEC', 'FLOW',
        'CHZ', 'AXS', 'KCS', 'KLAY', 'TAO', 'FET', 'AGIX', 'ROSE', 'AR',
        'MINA', '1INCH', 'LRC', 'ENJ', 'BAT', 'ZIL', 'GNO', 'CRV', 'QTUM',
        'THETA', 'ONT', 'WAVES', 'XAUT', 'CAKE', 'CVX', 'CELO', 'TWT',
        'BICO', 'DYDX', 'ANKR', 'ZRX', 'AUDIO', 'GLM', 'ILV', 'IOTX',
        'LPT', 'MASK', 'OCEAN', 'STORJ', 'SUI', 'SEI', 'APT', 'BLUR',
        'BONK', 'CSPR', 'FXS', 'IMX', 'LDO', 'RPL', 'RETH', 'LUNC', 'USTC'
    ]
    STOCK_SYMBOLS = [
        'AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA', 'META', 'AMZN', 'NFLX',
        'JPM', 'JNJ', 'WMT', 'PG', 'KO'
    ]
    FOREX_SYMBOLS = [
        'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'USD/CHF',
        'EUR/GBP', 'EUR/JPY'
    ]
    COMMODITY_SYMBOLS = {
        'XAU': 'XAUUSDT',
        'XAG': 'XAGUSDT',
        'BRENT': 'mock',
        'WTI': 'mock',
        'NG': 'mock',
        'HG': 'mock'
    }

    @staticmethod
    def _get_symbol_type(symbol: str) -> SymbolType:
        if symbol.upper() in MarketDataFetcher.CRYPTO_SYMBOLS:
            return 'crypto'
        if symbol in MarketDataFetcher.FOREX_SYMBOLS:
            return 'forex'
        if symbol in MarketDataFetcher.COMMODITY_SYMBOLS:
            return 'commodity'
        if symbol in MarketDataFetcher.STOCK_SYMBOLS:
            return 'stock'

        return 'crypto'

    @staticmethod
    def _get_binance_interval(interval: Interval) -> str:
        mapping = {
            '1h': '1h',
            '4h': '4h',
            '1d': '1d',
            '1w': '1w'
        }
        return mapping.get(interval, '1d')

    async def fetch_history(self, symbol: str, interval: Interval) -> List[Dict]:
        symbol_type = self._get_symbol_type(symbol)

        try:
            if symbol_type == 'crypto':
                binance_symbol = f"{symbol.upper()}USDT"
                return await self._fetch_binance_klines(binance_symbol, interval)

            elif symbol_type == 'commodity':
                com_symbol_lookup = self.COMMODITY_SYMBOLS.get(symbol)
                if com_symbol_lookup and com_symbol_lookup.endswith('USDT'):
                    return await self._fetch_binance_klines(com_symbol_lookup, interval)
                else:
                    print(f"History fetch is disabled for mock commodity: {symbol}")
                    return []

            elif symbol_type == 'stock' or symbol_type == 'forex':
                print(f"History fetch is disabled for mock asset: {symbol}")
                return []

        except Exception as e:
            print(f"Error fetching history for {symbol}: {e}")
            return []

        return []

    async def _fetch_binance_klines(self, symbol: str, interval: Interval) -> List[Dict]:
        params = {
            'symbol': symbol,
            'interval': self._get_binance_interval(interval),
            'limit': 200
        }

        async with aiohttp.ClientSession() as session:
            async with session.get(self.BINANCE_API_URL, params=params) as response:
                response.raise_for_status()
                data = await response.json()

                return [{
                    "time": int(k[0]),
                    "value": float(k[4])
                } for k in data]