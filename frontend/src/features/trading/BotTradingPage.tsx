import { useEffect, useState } from 'react';
import { tradingService, BotTrade, TradingStats } from '@/services/tradingService';
import { botService } from '@/services/botService';
import BotActivity from './BotActivity';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setUser } from '@/store/slices/authSlice';
import BotInfo from './BotInfo';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Play, Pause, TrendingUp, TrendingDown, Bot, Zap, DollarSign, Target, Clock, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import { RootState } from '@/store/store';
import { useTranslation } from 'react-i18next';
import { useThemeClasses } from '@/shared/hooks/useThemeClasses';
import { useTheme } from '@/contexts/ThemeContext';

interface SimpleChartData {
  time: string;
  price: number;
}

interface BotState {
  isActive: boolean;
  currentPair: string;
  lastPrice: number;
  profitToday: number;
}

const getBaseSymbol = (pair: string): string => pair.split('/')[0];

// Fallback prices for trading pairs when WebSocket data is not available
const FALLBACK_PRICES: Record<string, number> = {
  'BTC': 45230.50,
  'ETH': 2890.75,
  'BNB': 315.20,
  'SOL': 98.45,
  'XRP': 0.62,
  'ADA': 0.58,
  'DOGE': 0.082,
  'AVAX': 38.50,
  'DOT': 7.85,
  'MATIC': 0.92,
  'LINK': 15.30,
  'UNI': 6.75,
  'ATOM': 10.25,
  'LTC': 73.80,
  'BCH': 245.60,
  'NEAR': 3.45,
  'APT': 9.20,
  'ARB': 1.35,
  'OP': 2.15,
  'SUI': 1.80,
};

const getPairPrice = (pair: string, prices: any): number => {
  const symbol = getBaseSymbol(pair);
  const livePrice = prices?.[symbol]?.price;
  if (livePrice && livePrice > 0) return livePrice;
  return FALLBACK_PRICES[symbol] || 100; // Default fallback if pair not in list
};

const CustomTooltip = ({ active, payload, label, currencyState, isLight }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className={`backdrop-blur-xl p-3 rounded-sm border ${
        isLight
          ? 'bg-white/90 border-gray-200 shadow-lg'
          : 'bg-[#0A0A0A]/90 border-white/10'
      }`}>
        <p className={`text-xs mb-1 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>{label}</p>
        <p className={`text-sm font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
          {formatCurrency(payload[0].value, currencyState, { maximumFractionDigits: 5 })}
        </p>
      </div>
    );
  }
  return null;
};

export default function BotTradingPage() {
  const [trades, setTrades] = useState<BotTrade[]>([]);
  const [openPositions, setOpenPositions] = useState<BotTrade[]>([]);
  const [stats, setStats] = useState<TradingStats | null>(null);
  const [loadingTrades, setLoadingTrades] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingPositions, setLoadingPositions] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const { user } = useAppSelector((state: RootState) => state.auth);
  const currencyState = useAppSelector((state: RootState) => state.currency);
  const { prices } = useAppSelector((state: RootState) => state.websocket);
  const { latestTrade } = useAppSelector((state: RootState) => state.trading);
  const { t, i18n } = useTranslation();
  const tc = useThemeClasses();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const dispatch = useAppDispatch();

  useEffect(() => {
    console.log('BotTradingPage render - user:', user);
    console.log('User bot_type:', user?.bot_type);
    console.log('User is_bot_enabled:', user?.is_bot_enabled);
  }, [user]);

  const initialPair = 'BTC/USDT';
  const initialPrice = getPairPrice(initialPair, prices);

  const [botState, setBotState] = useState<BotState>({
    isActive: user?.is_bot_enabled || false,
    currentPair: initialPair,
    lastPrice: initialPrice,
    profitToday: 0
  });

  const [chartData, setChartData] = useState<SimpleChartData[]>([]);

  useEffect(() => {
    if (user) {
      setBotState(prev => ({
        ...prev,
        isActive: user.is_bot_enabled
      }));
    }
  }, [user?.is_bot_enabled]);

  useEffect(() => {
    if (user?.bot_type !== 'none') {
      setLoadingStats(true);
      tradingService.getTradingStats()
        .then(statsData => {
          setStats(statsData);
          setBotState(prev => ({
            ...prev,
            profitToday: parseFloat(statsData.total_profit) || 0
          }));
        })
        .catch(error => console.error('Error fetching stats:', error))
        .finally(() => setLoadingStats(false));

      setLoadingPositions(true);
      tradingService.getOpenPositions()
        .then(openPositionsData => {
          const openArray = Array.isArray(openPositionsData) ? openPositionsData : (openPositionsData.results || []);
          setOpenPositions(openArray || []);
        })
        .catch(error => console.error('Error fetching positions:', error))
        .finally(() => setLoadingPositions(false));

      setLoadingTrades(true);
      tradingService.getTrades()
        .then(tradesData => {
          const tradesArray = Array.isArray(tradesData) ? tradesData : (tradesData.results || []);
          setTrades(tradesArray.filter(t => !t.is_open) || []);
        })
        .catch(error => console.error('Error fetching trades:', error))
        .finally(() => setLoadingTrades(false));
    }
  }, [user?.id, user?.bot_type]);

  useEffect(() => {
    if (latestTrade) {
      if (latestTrade.is_open) {
        setOpenPositions(prevPositions => {
          if (prevPositions.some(p => p.id === latestTrade.id)) {
            return prevPositions;
          }
          return [latestTrade as any, ...prevPositions];
        });
      } else {
        setOpenPositions(prevPositions => prevPositions.filter(p => p.id !== latestTrade.id));

        setTrades(prevTrades => {
          if (prevTrades.some(t => t.id === latestTrade.id)) {
            return prevTrades;
          }
          return [latestTrade as any, ...prevTrades];
        });
      }

      if (!latestTrade.is_open) {
        setStats(prevStats => {
          if (!prevStats) return prevStats;
          const profitLoss = parseFloat(latestTrade.profit_loss);
          return {
            ...prevStats,
            closed_trades: prevStats.closed_trades + 1,
            total_profit: (parseFloat(prevStats.total_profit) + profitLoss).toFixed(2),
            winning_trades: profitLoss > 0 ? prevStats.winning_trades + 1 : prevStats.winning_trades,
          };
        });

        setBotState(prev => ({
          ...prev,
          profitToday: prev.profitToday + parseFloat(latestTrade.profit_loss)
        }));
      }

      if (!latestTrade.is_open && latestTrade.symbol === botState.currentPair && latestTrade.exit_price) {
        const exitPrice = parseFloat(latestTrade.exit_price);
        const tradeTime = new Date(latestTrade.closed_at!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        setChartData(prevData => {
          const newData = [...prevData.slice(1)];
          newData.push({
            time: tradeTime,
            price: exitPrice
          });
          return newData;
        });

        setBotState(prev => ({
          ...prev,
          lastPrice: exitPrice
        }));
      }
    }
  }, [latestTrade, botState.currentPair]);

  useEffect(() => {
    const pollPositions = async () => {
      if (user?.bot_type !== 'none' && prices) {
        try {
          setOpenPositions(prevPositions => prevPositions.map(pos => {
            const currentSymbol = getBaseSymbol(pos.symbol);
            const livePriceData = prices?.[currentSymbol];
            let currentProfit = parseFloat(pos.profit_loss) || 0;

            if (livePriceData) {
              const livePrice = livePriceData.price;
              const entryPrice = parseFloat(pos.entry_price);
              const quantity = parseFloat(pos.quantity);

              if (!isNaN(livePrice) && !isNaN(entryPrice) && !isNaN(quantity)) {
                if (pos.side === 'buy') {
                  currentProfit = (livePrice - entryPrice) * quantity;
                } else {
                  currentProfit = (entryPrice - livePrice) * quantity;
                }
              }
            } else {
              const simulatedChange = (Math.random() - 0.5) * (parseFloat(pos.entry_price) * 0.0001);
              currentProfit += simulatedChange;
            }

            return {
              ...pos,
              profit_loss: currentProfit.toString(),
            };
          }));
        } catch (error) {
          console.error('Error polling open positions:', error);
        }
      }
    };

    const interval = setInterval(pollPositions, 5000);
    return () => clearInterval(interval);
  }, [user, prices]);

  useEffect(() => {
    const currentBasePrice = getPairPrice(botState.currentPair, prices);

    const generateInitialChartData = (basePrice: number) => {
      const data: SimpleChartData[] = [];
      let price = basePrice;
      for (let i = 0; i < 20; i++) {
        const time = new Date(Date.now() - (20 - i) * 300000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        price += (Math.random() - 0.5) * (basePrice * 0.005);
        data.push({ time, price: Math.max(0.01, price) });
      }
      return data;
    };

    // Always generate chart data when pair changes or chartData is empty
    if (chartData.length === 0) {
      setChartData(generateInitialChartData(currentBasePrice));
      setBotState(prev => ({ ...prev, lastPrice: currentBasePrice }));
    }

    const interval = setInterval(() => {
      const currentPrice = getPairPrice(botState.currentPair, prices);
      const lastKnownPrice = chartData[chartData.length - 1]?.price || currentPrice;

      // Use live price if available, otherwise simulate price movement
      const symbol = getBaseSymbol(botState.currentPair);
      const latestPriceData = prices?.[symbol];
      let newPrice: number;

      if (latestPriceData && latestPriceData.price > 0) {
        // Use real WebSocket price
        newPrice = latestPriceData.price;
      } else {
        // Simulate realistic price movement based on last known price
        newPrice = lastKnownPrice + (Math.random() - 0.5) * (lastKnownPrice * 0.001);
        newPrice = Math.max(0.01, newPrice);
      }

      setChartData(prev => {
        if (prev.length === 0) {
          return generateInitialChartData(currentPrice);
        }
        const newData = [...prev.slice(1)];
        newData.push({
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          price: newPrice
        });
        return newData;
      });

      setBotState(prev => ({
        ...prev,
        lastPrice: newPrice
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [botState.currentPair, prices, botState.lastPrice, chartData.length]);

  const toggleBot = async () => {
    if (!user) return;

    try {
      setToggling(true);
      const response = await botService.toggleBot();
      if (response.success) {
        const updatedUser = {
          ...user,
          is_bot_enabled: response.is_bot_enabled
        };
        console.log('Updating user with is_bot_enabled:', response.is_bot_enabled);
        dispatch(setUser(updatedUser));
      }
    } catch (error: any) {
      console.error('Failed to toggle bot:', error);
      alert(error.response?.data?.message || 'Failed to toggle bot');
      setBotState(prev => ({ ...prev, isActive: user.is_bot_enabled }));
    } finally {
      setToggling(false);
    }
  };

  const changePair = (pair: string) => {
    const newPrice = getPairPrice(pair, prices);
    setChartData([]); // Clear chart data to trigger regeneration
    setBotState(prev => ({
      ...prev,
      currentPair: pair,
      lastPrice: newPrice,
    }));
  };

  const closePosition = (id: string) => {
    setOpenPositions(prev => prev.filter(p => p.id !== id));
  };

  if (renderError) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${tc.bg}`}>
        <div className="text-center">
          <p className="text-red-500 mb-4">Error: {renderError}</p>
          <button
            onClick={() => {
              setRenderError(null);
              window.location.reload();
            }}
            className="btn btn-primary"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${tc.bg}`}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
          <p className={tc.textSecondary}>{t('common.loadingUserData')}</p>
        </div>
      </div>
    );
  }

  if (user.bot_type === 'none') {
    return <BotInfo />;
  }

  const formatValue = (value: number | string | undefined | null) => formatCurrency(value, currencyState);
  const formatValueWithSign = (value: number | string | undefined | null) => {
    const num = Number(value);
    if (isNaN(num)) return formatValue(value);
    const prefix = num >= 0 ? '+' : '';
    return prefix + formatValue(num);
  }
  const formatPrice = (value: number | string | undefined | null, maximumFractionDigits: number = 2) => formatCurrency(value, currencyState, { maximumFractionDigits });

  return (
    <div className={`relative w-full pb-20 font-sans ${isLight ? 'bg-light-bg text-light-text-primary' : 'bg-[#050505] text-[#E0E0E0]'}`}>

      {/* Background decorations - same as dashboard */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className={`absolute inset-0 ${isLight
          ? 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-200/40 via-light-bg to-light-bg'
          : 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-[#050505] to-[#050505]'}`}
        />
        <div className={`absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full animate-pulse border ${
          isLight ? 'border-blue-300/60 opacity-40' : 'border-blue-500/20 opacity-20'
        }`} style={{ animationDuration: '10s' }} />
        <div className={`absolute top-[20%] left-[-10%] w-[120%] h-[1px] -rotate-12 ${
          isLight ? 'bg-gradient-to-r from-transparent via-blue-400/30 to-transparent' : 'bg-gradient-to-r from-transparent via-blue-500/10 to-transparent'
        }`} />
        <div className={`absolute bottom-[-5%] right-[20%] w-[300px] h-[300px] rounded-full blur-3xl ${
          isLight ? 'bg-blue-300/20' : 'bg-blue-900/10'
        }`} />
        <div className={`absolute top-[40%] left-[-5%] w-[200px] h-[200px] rounded-full blur-2xl ${
          isLight ? 'bg-blue-200/20' : 'bg-blue-900/10'
        }`} />
      </div>

      <div className="relative z-10 w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 pt-16 sm:pt-20 lg:pt-24 flex flex-col gap-8 sm:gap-10 lg:gap-12 xl:gap-16">

        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-2 flex flex-col justify-center">
            <div className={`inline-flex items-center gap-3 px-3 py-1 mb-6 lg:mb-8 rounded-sm w-fit backdrop-blur-sm border ${
              isLight ? 'border-blue-200 bg-blue-100/50' : 'border-blue-500/20 bg-blue-500/10'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${botState.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              <span className={`text-[10px] font-mono font-bold uppercase tracking-[0.2em] ${isLight ? 'text-blue-700' : 'text-blue-400'}`}>
                {botState.isActive ? t('bot.activity.active') : t('bot.activity.stopped')}
              </span>
            </div>

            <h1 className={`font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-[0.9] mb-3 sm:mb-4 lg:mb-6 tracking-tight ${
              isLight ? 'text-gray-900' : 'text-white'
            }`}>
              {t('bot.title')}<br />
              <span className={`italic font-serif ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>Trading.</span>
            </h1>

            <p className={`text-sm sm:text-base lg:text-lg font-mono max-w-xl leading-relaxed pl-3 sm:pl-4 lg:pl-6 border-l ${
              isLight ? 'text-gray-600 border-blue-300' : 'text-gray-400 border-blue-500/20'
            }`}>
              {botState.currentPair} • {t('bot.lastPrice')}: {formatPrice(botState.lastPrice, 5)}<br />
              Automated trading powered by AI algorithms.
            </p>
          </div>

          <div className="hidden lg:block" />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">

          {/* Left Column - Controls & Stats */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4 lg:space-y-6">

            {/* Bot Controls Card */}
            <div className={`backdrop-blur-xl p-4 sm:p-6 lg:p-8 rounded-sm relative overflow-hidden group transition-colors border ${
              isLight
                ? 'bg-white/80 border-gray-200 hover:border-gray-300 shadow-lg'
                : 'bg-[#0A0A0A]/60 border-white/10 hover:border-white/20'
            }`}>
              <div className={`absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none ${
                isLight ? 'text-blue-400' : 'text-blue-500'
              }`}>
                <Bot size={140} strokeWidth={0.5} />
              </div>

              <div className="relative z-10">
                <h3 className={`text-lg font-mono uppercase tracking-widest mb-6 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                  {t('bot.controls.title')}
                </h3>

                <div className="mb-6">
                  <label className={`block text-xs font-mono uppercase mb-2 ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>
                    {t('bot.controls.tradingPair')}
                  </label>
                  <select
                    value={botState.currentPair}
                    onChange={(e) => changePair(e.target.value)}
                    className={`w-full px-4 py-3 rounded-sm font-mono transition-all border ${
                      isLight
                        ? 'bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-900 focus:border-blue-500 [&>option]:bg-gray-50 [&>option]:text-gray-900'
                        : 'bg-[#0A0A0A] border-white/10 hover:border-white/20 text-white focus:border-blue-500 [&>option]:bg-[#0A0A0A] [&>option]:text-white'
                    } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                  >
                    <option value="BTC/USDT">BTC/USDT</option>
                    <option value="ETH/USDT">ETH/USDT</option>
                    <option value="BNB/USDT">BNB/USDT</option>
                    <option value="SOL/USDT">SOL/USDT</option>
                    <option value="XRP/USDT">XRP/USDT</option>
                    <option value="ADA/USDT">ADA/USDT</option>
                    <option value="DOGE/USDT">DOGE/USDT</option>
                    <option value="AVAX/USDT">AVAX/USDT</option>
                    <option value="DOT/USDT">DOT/USDT</option>
                    <option value="MATIC/USDT">MATIC/USDT</option>
                    <option value="LINK/USDT">LINK/USDT</option>
                    <option value="UNI/USDT">UNI/USDT</option>
                    <option value="ATOM/USDT">ATOM/USDT</option>
                    <option value="LTC/USDT">LTC/USDT</option>
                    <option value="BCH/USDT">BCH/USDT</option>
                    <option value="NEAR/USDT">NEAR/USDT</option>
                    <option value="APT/USDT">APT/USDT</option>
                    <option value="ARB/USDT">ARB/USDT</option>
                    <option value="OP/USDT">OP/USDT</option>
                    <option value="SUI/USDT">SUI/USDT</option>
                  </select>
                </div>

                <button
                  onClick={toggleBot}
                  disabled={toggling || user?.bot_type === 'none'}
                  className={`w-full py-4 px-6 font-mono uppercase tracking-wider text-sm font-bold rounded-sm transition-all flex items-center justify-center gap-3 ${
                    botState.isActive
                      ? isLight
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-red-500/10 border-2 border-red-500 text-red-500 hover:bg-red-500/20'
                      : isLight
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                        : 'bg-emerald-500/10 border-2 border-emerald-500 text-emerald-500 hover:bg-emerald-500/20'
                  } ${toggling ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {toggling ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : botState.isActive ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5" />
                  )}
                  <span>
                    {toggling
                      ? t('common.processing')
                      : botState.isActive
                        ? t('bot.controls.pause')
                        : t('bot.controls.start')}
                  </span>
                </button>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {/* Profit Card */}
              <div className={`backdrop-blur-xl p-4 sm:p-6 rounded-sm border ${
                isLight
                  ? 'bg-emerald-50 border-emerald-200 shadow-lg'
                  : 'bg-emerald-950/10 border-emerald-500/10'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  <span className={`text-xs font-mono uppercase ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                    {t('bot.stats.profit')}
                  </span>
                </div>
                <p className={`text-xl sm:text-2xl font-bold font-mono ${botState.profitToday >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {formatValueWithSign(botState.profitToday)}
                </p>
              </div>

              {/* Win Rate Card */}
              <div className={`backdrop-blur-xl p-4 sm:p-6 rounded-sm border ${
                isLight
                  ? 'bg-blue-50 border-blue-200 shadow-lg'
                  : 'bg-blue-950/10 border-blue-500/10'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-blue-500" />
                  <span className={`text-xs font-mono uppercase ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                    {t('bot.activity.winRate')}
                  </span>
                </div>
                <p className={`text-xl sm:text-2xl font-bold font-mono ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  {stats?.win_rate.toFixed(1) || '0.0'}%
                </p>
              </div>

              {/* Trades Card */}
              <div className={`backdrop-blur-xl p-4 sm:p-6 rounded-sm border ${
                isLight
                  ? 'bg-blue-50 border-blue-200 shadow-lg'
                  : 'bg-blue-950/10 border-blue-500/10'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-blue-500" />
                  <span className={`text-xs font-mono uppercase ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                    {t('bot.stats.totalTrades')}
                  </span>
                </div>
                <p className={`text-xl sm:text-2xl font-bold font-mono ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  {stats?.total_trades || 0}
                </p>
              </div>

              {/* Positions Card */}
              <div className={`backdrop-blur-xl p-4 sm:p-6 rounded-sm border ${
                isLight
                  ? 'bg-orange-50 border-orange-200 shadow-lg'
                  : 'bg-orange-950/10 border-orange-500/10'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span className={`text-xs font-mono uppercase ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                    {t('bot.stats.openPositions')}
                  </span>
                </div>
                <p className={`text-xl sm:text-2xl font-bold font-mono ${isLight ? 'text-gray-900' : 'text-white'}`}>
                  {openPositions.length}
                </p>
              </div>
            </div>
          </div>

          {/* Chart Card */}
          <div className={`lg:col-span-3 backdrop-blur-xl p-4 sm:p-6 lg:p-8 rounded-sm relative overflow-hidden group transition-colors border ${
            isLight
              ? 'bg-white/80 border-gray-200 hover:border-gray-300 shadow-lg'
              : 'bg-[#0A0A0A]/60 border-white/10 hover:border-white/20'
          }`}>
            <h3 className={`text-xs font-mono uppercase tracking-widest mb-6 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
              {t('bot.chart.title', { pair: botState.currentPair })}
            </h3>

            <div className="h-[300px] sm:h-[350px] lg:h-[400px] w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isLight ? '#E5E7EB' : '#2A2A2A'}
                    />
                    <XAxis
                      dataKey="time"
                      stroke={isLight ? '#6B7280' : '#7A7A7A'}
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke={isLight ? '#6B7280' : '#7A7A7A'}
                      fontSize={12}
                      domain={['dataMin * 0.995', 'dataMax * 1.005']}
                      tickFormatter={(value) => formatPrice(value, 5)}
                      scale="linear"
                      allowDataOverflow={true}
                      tickLine={false}
                      axisLine={false}
                      width={80}
                      orientation="right"
                    />
                    <Tooltip
                      content={<CustomTooltip currencyState={currencyState} isLight={isLight} />}
                      cursor={{
                        stroke: isLight ? '#D1D5DB' : '#3A3A3A',
                        strokeWidth: 1,
                        strokeDasharray: "5 5"
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke={isLight ? '#111827' : '#E5E5E5'}
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{
                        r: 5,
                        fill: isLight ? '#111827' : '#E5E5E5',
                        stroke: isLight ? '#FFFFFF' : '#0A0A0A',
                        strokeWidth: 2
                      }}
                      isAnimationActive={true}
                      animationDuration={500}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className={`flex items-center justify-center h-full ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>
                  {t('bot.chart.loading')}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Open Positions & Trade History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-12 sm:mb-16 lg:mb-20">

          {/* Open Positions */}
          <div className={`backdrop-blur-xl rounded-sm overflow-hidden border ${
            isLight
              ? 'bg-white/80 border-gray-200 shadow-lg'
              : 'bg-[#0A0A0A]/60 border-white/10'
          }`}>
            <div className={`flex items-center justify-between p-5 border-b ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
              <h3 className={`font-serif text-xl flex items-center gap-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                <TrendingUp className="w-5 h-5 text-blue-500" />
                {t('bot.positions.title')} ({openPositions.length})
              </h3>
            </div>
            <div className={`p-4 max-h-[500px] overflow-y-auto scrollbar-thin ${
              isLight ? 'scrollbar-thumb-gray-300 scrollbar-track-gray-100' : 'scrollbar-thumb-white/10 scrollbar-track-transparent'
            }`}>
              {loadingPositions ? (
                <div className="flex justify-center py-12">
                  <Loader2 className={`w-6 h-6 animate-spin ${isLight ? 'text-gray-600' : 'text-gray-400'}`} />
                </div>
              ) : openPositions.length > 0 ? (
                <div className="space-y-2">
                  {openPositions.map((position) => (
                    <div
                      key={position.id}
                      className={`p-4 rounded-sm transition-colors border ${
                        isLight
                          ? 'hover:bg-gray-100 border-gray-100'
                          : 'hover:bg-white/5 border-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className={`font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{position.symbol}</p>
                          <span className={`text-xs font-mono uppercase ${
                            position.side === 'buy' ? 'text-emerald-500' : 'text-red-500'
                          }`}>
                            {position.side}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-mono ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                            {formatPrice(position.entry_price, 5)}
                          </p>
                          <p className={`font-bold font-mono ${parseFloat(position.profit_loss) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {formatValueWithSign(position.profit_loss)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`text-center py-10 ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>
                  <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">{t('bot.positions.noPositions')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Trade History */}
          <div className={`backdrop-blur-xl rounded-sm overflow-hidden border ${
            isLight
              ? 'bg-white/80 border-gray-200 shadow-lg'
              : 'bg-[#0A0A0A]/60 border-white/10'
          }`}>
            <div className={`flex items-center justify-between p-5 border-b ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
              <h3 className={`font-serif text-xl flex items-center gap-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                <TrendingDown className="w-5 h-5 text-blue-500" />
                {t('bot.history.title')} ({trades.length})
              </h3>
            </div>
            <div className={`p-4 max-h-[500px] overflow-y-auto scrollbar-thin ${
              isLight ? 'scrollbar-thumb-gray-300 scrollbar-track-gray-100' : 'scrollbar-thumb-white/10 scrollbar-track-transparent'
            }`}>
              {loadingTrades ? (
                <div className="flex justify-center py-12">
                  <Loader2 className={`w-6 h-6 animate-spin ${isLight ? 'text-gray-600' : 'text-gray-400'}`} />
                </div>
              ) : trades.length > 0 ? (
                <div className="space-y-2">
                  {trades.slice(0, 10).map((trade) => (
                    <div
                      key={trade.id}
                      className={`p-4 rounded-sm transition-colors border ${
                        isLight
                          ? 'hover:bg-gray-100 border-gray-100'
                          : 'hover:bg-white/5 border-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className={`font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{trade.symbol}</p>
                          <span className={`text-xs font-mono uppercase ${
                            trade.side === 'buy' ? 'text-emerald-500' : 'text-red-500'
                          }`}>
                            {trade.side}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className={`text-xs font-mono ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                            {trade.closed_at ? new Date(trade.closed_at).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' }) : '-'}
                          </p>
                          <p className={`font-bold font-mono ${parseFloat(trade.profit_loss) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {formatValueWithSign(trade.profit_loss)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`text-center py-10 ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>
                  <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">{t('bot.history.noTrades')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
