"""
Advanced Trading Strategies with Technical Analysis
Implements realistic strategy patterns with market-aware logic
"""

from decimal import Decimal
from typing import Tuple, Optional
from dataclasses import dataclass
import random
import math


@dataclass
class StrategyConfig:
    """Configuration for a trading strategy"""
    name: str
    profit_range: Tuple[Decimal, Decimal]
    duration_range: Tuple[int, int]
    win_rate: Decimal
    volatility_factor: Decimal
    risk_reward_ratio: Decimal


class TradingStrategy:
    """Base class for trading strategies with technical analysis"""

    NAME = "Base Strategy"
    CONFIG = StrategyConfig(
        name="Base",
        profit_range=(Decimal('0.5'), Decimal('2.0')),
        duration_range=(60, 300),
        win_rate=Decimal('70'),
        volatility_factor=Decimal('1.0'),
        risk_reward_ratio=Decimal('2.0')
    )

    @classmethod
    def calculate_entry_exit(
            cls,
            base_price: Decimal,
            side: str = 'buy',
            market_volatility: Optional[Decimal] = None
    ) -> Tuple[Decimal, Decimal, Decimal]:
        """
        Calculate entry and exit points with strategy-specific logic

        Args:
            base_price: Current market price
            side: Trade direction ('buy' or 'sell')
            market_volatility: Current market volatility (optional)

        Returns:
            Tuple of (entry_price, exit_price, stop_loss)
        """
        if market_volatility is None:
            market_volatility = Decimal('0.01')

        # Adjust volatility by strategy factor
        adjusted_volatility = market_volatility * cls.CONFIG.volatility_factor

        # Calculate entry with market noise
        entry_variation = Decimal(str(random.gauss(0, float(adjusted_volatility))))
        entry_price = base_price * (Decimal('1') + entry_variation)

        # Generate profit target
        profit_target = Decimal(str(random.uniform(
            float(cls.CONFIG.profit_range[0]),
            float(cls.CONFIG.profit_range[1])
        )))

        # Calculate exit based on side
        if side == 'buy':
            exit_price = entry_price * (Decimal('1') + profit_target / Decimal('100'))
            stop_loss = entry_price * (Decimal('1') - profit_target / (Decimal('100') * cls.CONFIG.risk_reward_ratio))
        else:
            exit_price = entry_price * (Decimal('1') - profit_target / Decimal('100'))
            stop_loss = entry_price * (Decimal('1') + profit_target / (Decimal('100') * cls.CONFIG.risk_reward_ratio))

        return entry_price, exit_price, stop_loss

    @classmethod
    def should_enter_trade(cls, market_conditions: dict) -> bool:
        """
        Determine if strategy conditions favor trade entry

        Args:
            market_conditions: Dict with market data (volatility, trend, etc.)

        Returns:
            Boolean indicating whether to enter trade
        """
        # Base implementation: random with win rate bias
        return random.uniform(0, 100) < float(cls.CONFIG.win_rate)


class ScalpingStrategy(TradingStrategy):
    """
    Scalping: Ultra-short term trades with small profits
    High frequency, low profit per trade
    Suitable for: Basic Bot
    """

    NAME = "Scalping"
    CONFIG = StrategyConfig(
        name="Scalping",
        profit_range=(Decimal('0.3'), Decimal('1.2')),
        duration_range=(10, 60),
        win_rate=Decimal('75'),
        volatility_factor=Decimal('0.8'),
        risk_reward_ratio=Decimal('2.5')
    )

    @classmethod
    def should_enter_trade(cls, market_conditions: dict) -> bool:
        """Scalping favors high volatility and tight spreads"""
        volatility = market_conditions.get('volatility', Decimal('0.01'))
        spread = market_conditions.get('spread', Decimal('0.001'))

        # Favor high volatility, low spread
        score = (float(volatility) * 100) - (float(spread) * 1000)

        return score > 0.5 and random.uniform(0, 100) < float(cls.CONFIG.win_rate)


class SwingStrategy(TradingStrategy):
    """
    Swing Trading: Medium-term trades capturing price swings
    Holds positions for hours to days
    Suitable for: Premium Bot
    """

    NAME = "Swing Trading"
    CONFIG = StrategyConfig(
        name="Swing",
        profit_range=(Decimal('1.0'), Decimal('4.0')),
        duration_range=(60, 360),
        win_rate=Decimal('80'),
        volatility_factor=Decimal('1.2'),
        risk_reward_ratio=Decimal('3.0')
    )

    @classmethod
    def calculate_entry_exit(
            cls,
            base_price: Decimal,
            side: str = 'buy',
            market_volatility: Optional[Decimal] = None
    ) -> Tuple[Decimal, Decimal, Decimal]:
        """Swing strategy with trend-following adjustments"""
        entry, exit, stop = super().calculate_entry_exit(
            base_price, side, market_volatility
        )

        # Add trend component (simulated)
        trend_strength = Decimal(str(random.uniform(-0.005, 0.005)))

        if side == 'buy':
            exit = exit * (Decimal('1') + trend_strength)
        else:
            exit = exit * (Decimal('1') - trend_strength)

        return entry, exit, stop


class TrendFollowingStrategy(TradingStrategy):
    """
    Trend Following: Long-term trades riding strong trends
    High profit targets, wider stops
    Suitable for: Specialist Bot
    """

    NAME = "Trend Following"
    CONFIG = StrategyConfig(
        name="Trend",
        profit_range=(Decimal('2.0'), Decimal('7.0')),
        duration_range=(120, 720),
        win_rate=Decimal('85'),
        volatility_factor=Decimal('1.5'),
        risk_reward_ratio=Decimal('3.5')
    )

    @classmethod
    def should_enter_trade(cls, market_conditions: dict) -> bool:
        """Trend following requires clear directional movement"""
        trend_strength = market_conditions.get('trend', Decimal('0'))

        # Only enter on strong trends
        return abs(float(trend_strength)) > 0.3 and random.uniform(0, 100) < float(cls.CONFIG.win_rate)


class MeanReversionStrategy(TradingStrategy):
    """
    Mean Reversion: Trade against extreme price movements
    Expects price to return to average
    Suitable for: All bot types
    """

    NAME = "Mean Reversion"
    CONFIG = StrategyConfig(
        name="MeanReversion",
        profit_range=(Decimal('0.8'), Decimal('3.0')),
        duration_range=(30, 180),
        win_rate=Decimal('78'),
        volatility_factor=Decimal('1.0'),
        risk_reward_ratio=Decimal('2.5')
    )

    @classmethod
    def calculate_entry_exit(
            cls,
            base_price: Decimal,
            side: str = 'buy',
            market_volatility: Optional[Decimal] = None
    ) -> Tuple[Decimal, Decimal, Decimal]:
        """Mean reversion assumes price returns to average"""
        # Simulated deviation from mean
        deviation = Decimal(str(random.gauss(0, 0.02)))
        entry_price = base_price * (Decimal('1') + deviation)

        # Exit target is return to mean (base price)
        reversion_factor = Decimal(str(random.uniform(0.7, 0.95)))

        if deviation > 0:  # Price above mean, sell
            exit_price = entry_price * (Decimal('1') - abs(deviation) * reversion_factor)
        else:  # Price below mean, buy
            exit_price = entry_price * (Decimal('1') + abs(deviation) * reversion_factor)

        # Stop loss beyond extremes
        stop_loss = entry_price * (Decimal('1') + deviation * Decimal('1.5'))

        return entry_price, exit_price, stop_loss


class ArbitrageStrategy(TradingStrategy):
    """
    Arbitrage: Exploit price differences between markets
    Very short duration, low risk
    Suitable for: All bot types
    """

    NAME = "Arbitrage"
    CONFIG = StrategyConfig(
        name="Arbitrage",
        profit_range=(Decimal('0.2'), Decimal('1.5')),
        duration_range=(5, 30),
        win_rate=Decimal('90'),
        volatility_factor=Decimal('0.5'),
        risk_reward_ratio=Decimal('5.0')
    )

    @classmethod
    def calculate_entry_exit(
            cls,
            base_price: Decimal,
            side: str = 'buy',
            market_volatility: Optional[Decimal] = None
    ) -> Tuple[Decimal, Decimal, Decimal]:
        """Arbitrage with minimal price difference"""
        # Small price discrepancy
        price_diff = Decimal(str(random.uniform(0.001, 0.008)))

        entry_price = base_price
        exit_price = base_price * (Decimal('1') + price_diff)
        stop_loss = base_price * (Decimal('1') - price_diff / Decimal('5'))

        return entry_price, exit_price, stop_loss


class BreakoutStrategy(TradingStrategy):
    """
    Breakout: Trade price movements through key levels
    Captures momentum after consolidation
    Suitable for: Premium & Specialist Bots
    """

    NAME = "Breakout"
    CONFIG = StrategyConfig(
        name="Breakout",
        profit_range=(Decimal('1.5'), Decimal('5.5')),
        duration_range=(60, 420),
        win_rate=Decimal('82'),
        volatility_factor=Decimal('1.8'),
        risk_reward_ratio=Decimal('3.0')
    )

    @classmethod
    def should_enter_trade(cls, market_conditions: dict) -> bool:
        """Breakouts need volatility spike"""
        volatility = market_conditions.get('volatility', Decimal('0.01'))
        volume = market_conditions.get('volume', Decimal('1.0'))

        # High volatility + high volume = breakout
        score = float(volatility) * float(volume) * 1000

        return score > 10 and random.uniform(0, 100) < float(cls.CONFIG.win_rate)


# Strategy registry for dynamic selection
STRATEGY_REGISTRY = {
    'scalping': ScalpingStrategy,
    'swing': SwingStrategy,
    'trend': TrendFollowingStrategy,
    'mean_reversion': MeanReversionStrategy,
    'arbitrage': ArbitrageStrategy,
    'breakout': BreakoutStrategy
}


def get_strategy(strategy_name: str) -> TradingStrategy:
    """Get strategy class by name"""
    return STRATEGY_REGISTRY.get(strategy_name.lower(), TradingStrategy)
