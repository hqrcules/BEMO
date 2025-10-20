import aiohttp
import asyncio
import requests
from typing import List, Dict
from decimal import Decimal


class CryptoDataFetcher:
    """
    Utility class to fetch cryptocurrency data from CoinGecko API
    Provides list of coins, prices, and logo URLs
    """

    COINGECKO_API_BASE = "https://api.coingecko.com/api/v3"

    @staticmethod
    def get_base_prices_sync(limit: int = 20) -> Dict[str, Decimal]:
        """
        Fetch top cryptocurrencies from CoinGecko synchronously and return a dictionary
        of symbol -> price, formatted for the simulator.
        """
        url = f"{CryptoDataFetcher.COINGECKO_API_BASE}/coins/markets"
        params = {
            'vs_currency': 'usd',
            'order': 'market_cap_desc',
            'per_page': limit,
            'page': 1,
            'sparkline': 'false',
        }
        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()  # Raise an exception for bad status codes
            data = response.json()

            prices = {
                f"{coin.get('symbol', '').upper()}/USDT": Decimal(str(coin.get('current_price', 0)))
                for coin in data
            }
            # Filter out any coins that didn't have a symbol or price
            return {k: v for k, v in prices.items() if k and v > 0}
        except requests.exceptions.RequestException as e:
            print(f"❌ Error fetching sync prices from CoinGecko: {e}")
            return {}  # Return empty dict on failure

    @staticmethod
    async def get_top_coins(limit: int = 100) -> List[Dict]:
        """
        Fetch top cryptocurrencies by market cap with logos

        Args:
            limit: Number of coins to fetch (max 250 per request)

        Returns:
            List of coin dictionaries with id, symbol, name, image, price
        """

        async with aiohttp.ClientSession() as session:
            url = f"{CryptoDataFetcher.COINGECKO_API_BASE}/coins/markets"
            params = {
                'vs_currency': 'usd',
                'order': 'market_cap_desc',
                'per_page': str(limit),  # Convert to string
                'page': '1',  # Convert to string
                'sparkline': 'false',  # Convert to string (not boolean!)
                'locale': 'en',
            }

            try:
                async with session.get(url, params=params, timeout=10) as response:
                    if response.status == 200:
                        data = await response.json()

                        # Transform to our format
                        coins = []
                        for coin in data:
                            # Handle None values safely
                            coins.append({
                                'id': coin.get('id', ''),
                                'symbol': coin.get('symbol', '').upper(),
                                'name': coin.get('name', ''),
                                'image': coin.get('image', ''),  # URL to logo
                                'price': coin.get('current_price', 0),
                                'change_24h': coin.get('price_change_24h', 0),
                                'change_percent_24h': coin.get('price_change_percentage_24h', 0),
                                'market_cap': coin.get('market_cap', 0),
                                'volume': coin.get('total_volume', 0),
                            })

                        return coins
                    else:
                        print(f"❌ CoinGecko API error: {response.status}")
                        return []

            except Exception as e:
                print(f"❌ Error fetching coins from CoinGecko: {e}")
                return []

    @staticmethod
    async def get_binance_supported_coins() -> List[str]:
        """
        Get list of all cryptocurrencies supported on Binance
        Returns list of symbols (e.g., ['BTC', 'ETH', 'BNB'])
        """

        async with aiohttp.ClientSession() as session:
            url = "https://api.binance.com/api/v3/exchangeInfo"

            try:
                async with session.get(url, timeout=10) as response:
                    if response.status == 200:
                        data = await response.json()

                        # Extract unique base assets (coins) from USDT pairs
                        coins = set()
                        for symbol in data['symbols']:
                            if symbol['quoteAsset'] == 'USDT' and symbol['status'] == 'TRADING':
                                coins.add(symbol['baseAsset'])

                        return sorted(list(coins))
                    else:
                        return []

            except Exception as e:
                print(f"❌ Error fetching Binance pairs: {e}")
                return []