import aiohttp
import asyncio
import time
from datetime import datetime
from django.conf import settings
from typing import List, Dict, Literal, Optional
from .crypto_loader import CryptoSymbolLoader

Interval = Literal['1h', '4h', '1d', '1w']
SymbolType = Literal['crypto', 'stock', 'forex', 'commodity']


class MarketDataFetcher:
    BINANCE_API_URL = "https://api.binance.com/api/v3/klines"

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

        if symbol.upper() in crypto_symbols:
            return 'crypto'
        if symbol in MarketDataFetcher.FOREX_SYMBOLS:
            return 'forex'
        if symbol in MarketDataFetcher.COMMODITY_SYMBOLS:
            return 'commodity'
        if symbol in MarketDataFetcher.STOCK_SYMBOLS:
            return 'stock'
        return 'crypto'

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
