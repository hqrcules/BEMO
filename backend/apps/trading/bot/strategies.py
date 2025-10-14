import random
from decimal import Decimal


class TradingStrategy:
    """Base class for trading strategies"""

    @staticmethod
    def calculate_entry_exit(base_price, profit_percent, side='buy'):
        """
        Calculate entry and exit points

        Args:
            base_price: Base price for the asset
            profit_percent: Target profit percentage
            side: Trade side ('buy' or 'sell')

        Returns:
            Tuple of (entry_price, exit_price)
        """
        # Add small variation to base price
        price_variation = Decimal(str(random.uniform(-0.02, 0.02)))
        entry_price = base_price * (1 + price_variation)

        if side == 'buy':
            exit_price = entry_price * (1 + profit_percent / 100)
        else:
            exit_price = entry_price * (1 - profit_percent / 100)

        return entry_price, exit_price


class ScalpingStrategy(TradingStrategy):
    """
    Scalping - quick short trades with small profit
    Suitable for Basic Bot
    """

    NAME = 'Scalping'
    PROFIT_RANGE = (0.3, 1.5)
    DURATION_RANGE = (10, 60)


class SwingStrategy(TradingStrategy):
    """
    Swing trading - medium-term trades
    Suitable for Premium Bot
    """

    NAME = 'Swing Trading'
    PROFIT_RANGE = (1.0, 3.5)
    DURATION_RANGE = (60, 300)


class TrendFollowingStrategy(TradingStrategy):
    """
    Trend following - long-term trades with high profit
    Suitable for Specialist Bot
    """

    NAME = 'Trend Following'
    PROFIT_RANGE = (2.0, 6.0)
    DURATION_RANGE = (120, 600)


class ArbitrageStrategy(TradingStrategy):
    """
    Arbitrage - exploit price differences
    Suitable for all bot types
    """

    NAME = 'Arbitrage'
    PROFIT_RANGE = (0.5, 2.0)
    DURATION_RANGE = (5, 30)
