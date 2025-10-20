import json
import asyncio
import aiohttp
import random
from datetime import datetime
from channels.generic.websocket import AsyncWebsocketConsumer
from .utils.crypto_fetcher import CryptoDataFetcher


class MarketConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer with dynamic crypto loading"""

    # Cache for crypto data (refreshed every 5 minutes)
    crypto_cache = []
    last_cache_update = 0
    CACHE_LIFETIME = 300  # 5 minutes

    async def connect(self):
        await self.accept()
        self.running = True

        # Load crypto data on first connection
        if not MarketConsumer.crypto_cache:
            await self.refresh_crypto_cache()

        # Start price updates
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

    async def refresh_crypto_cache(self):
        """Refresh the list of cryptocurrencies from CoinGecko"""

        current_time = asyncio.get_event_loop().time()

        # Check if cache is still valid
        if (current_time - MarketConsumer.last_cache_update) < MarketConsumer.CACHE_LIFETIME:
            return

        print("🔄 Refreshing crypto data from CoinGecko...")

        # Fetch top 50 coins by market cap
        coins = await CryptoDataFetcher.get_top_coins(limit=103)

        if coins:
            MarketConsumer.crypto_cache = coins
            MarketConsumer.last_cache_update = current_time
            print(f"✅ Loaded {len(coins)} cryptocurrencies with logos")
        else:
            print("⚠️ Failed to load crypto data, using cached data")

    async def fetch_real_prices(self):
        """Fetch real-time prices from Binance + dynamic crypto list"""

        try:
            async with aiohttp.ClientSession() as session:
                while self.running:
                    # Refresh cache if needed (every 5 minutes)
                    await self.refresh_crypto_cache()

                    updated_prices = {}

                    # ===== CRYPTO: Fetch from Binance API =====
                    try:
                        url = 'https://api.binance.com/api/v3/ticker/24hr'

                        async with session.get(url, timeout=5) as response:
                            if response.status == 200:
                                binance_data = await response.json()

                                # Create lookup dictionary
                                binance_prices = {
                                    ticker['symbol']: ticker
                                    for ticker in binance_data
                                }

                                # Match with our cached crypto list
                                for coin in MarketConsumer.crypto_cache:
                                    symbol = coin['symbol']
                                    binance_symbol = f"{symbol}USDT"

                                    if binance_symbol in binance_prices:
                                        ticker = binance_prices[binance_symbol]

                                        current_price = float(ticker['lastPrice'])
                                        price_change = float(ticker['priceChange'])
                                        price_change_percent = float(ticker['priceChangePercent'])

                                        # Dynamic precision
                                        if current_price < 0.0001:
                                            precision = 8
                                        elif current_price < 0.01:
                                            precision = 6
                                        elif current_price < 1:
                                            precision = 5
                                        elif current_price < 10:
                                            precision = 4
                                        elif current_price < 100:
                                            precision = 3
                                        else:
                                            precision = 2

                                        updated_prices[symbol] = {
                                            'price': round(current_price, precision),
                                            'change': round(price_change, precision),
                                            'changePercent': round(price_change_percent, 3),
                                            'image': coin['image'],  # Logo URL from CoinGecko
                                            'name': coin['name'],
                                        }

                    except Exception as e:
                        print(f"❌ Error fetching Binance data: {e}")

                    # ===== STOCKS: Mock data =====
                    stock_prices = {
                        'AAPL': 178.45, 'MSFT': 412.33, 'TSLA': 245.67,
                        'GOOGL': 142.50, 'NVDA': 185.05, 'NFLX': 1191.06,
                    }

                    for symbol, base_price in stock_prices.items():
                        fluctuation = base_price * random.uniform(-0.0015, 0.0015)
                        new_price = base_price + fluctuation
                        change_percent = (fluctuation / base_price) * 100

                        updated_prices[symbol] = {
                            'price': round(new_price, 2),
                            'change': round(fluctuation, 2),
                            'changePercent': round(change_percent, 3)
                        }

                    # ===== COMMODITIES: Mock data =====
                    commodity_prices = {
                        'GOLD': 2034.50, 'SILVER': 24.15, 'OIL': 78.45,
                    }

                    for symbol, base_price in commodity_prices.items():
                        fluctuation = base_price * random.uniform(-0.002, 0.002)
                        new_price = base_price + fluctuation
                        change_percent = (fluctuation / base_price) * 100

                        updated_prices[symbol] = {
                            'price': round(new_price, 2),
                            'change': round(fluctuation, 2),
                            'changePercent': round(change_percent, 3)
                        }

                    # ===== FOREX: Mock data =====
                    forex_prices = {
                        'EURUSD': 1.0856, 'GBPUSD': 1.2634, 'USDJPY': 149.87,
                    }

                    for symbol, base_price in forex_prices.items():
                        fluctuation = base_price * random.uniform(-0.0002, 0.0002)
                        new_price = base_price + fluctuation
                        change_percent = (fluctuation / base_price) * 100

                        updated_prices[symbol] = {
                            'price': round(new_price, 5),
                            'change': round(fluctuation, 5),
                            'changePercent': round(change_percent, 3)
                        }

                    # Send to WebSocket
                    await self.send(text_data=json.dumps({
                        'type': 'price_update',
                        'data': updated_prices,
                        'timestamp': datetime.now().isoformat()
                    }))

                    crypto_count = len(
                        [k for k in updated_prices if k in [c['symbol'] for c in MarketConsumer.crypto_cache]])
                    print(f"📊 Sent prices: {len(updated_prices)} total ({crypto_count} crypto from Binance)")

                    await asyncio.sleep(2)

        except asyncio.CancelledError:
            print("🛑 Price update task cancelled")
            raise
        except Exception as e:
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()

    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')

            if message_type == 'get_crypto_list':
                # Send full crypto list with logos
                await self.send(text_data=json.dumps({
                    'type': 'crypto_list',
                    'data': MarketConsumer.crypto_cache,
                    'timestamp': datetime.now().isoformat()
                }))

            elif message_type == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': datetime.now().isoformat()
                }))

        except json.JSONDecodeError:
            print("⚠️ Invalid JSON received")
        except Exception as e:
            print(f"❌ Error in receive: {e}")


class BalanceConsumer(AsyncWebsocketConsumer):
    """Balance WebSocket consumer"""

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
        """Handle balance requests"""
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
        """Handler for balance_update messages from channel layer"""
        await self.send(text_data=json.dumps({
            'type': 'balance_update',
            'balance': event['balance'],
            'timestamp': datetime.now().isoformat()
        }))