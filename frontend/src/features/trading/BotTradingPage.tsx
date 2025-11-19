import { useEffect, useState } from 'react';
import { tradingService, BotTrade, TradingStats } from '@/services/tradingService';
import { botService } from '@/services/botService';
import BotActivity from './BotActivity';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setUser } from '@/store/slices/authSlice';
import BotInfo from './BotInfo';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Play, Pause, Square, Zap, Settings, BarChart, X as CloseIcon, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import { RootState } from '@/store/store';
import { useTranslation } from 'react-i18next';
import { useThemeClasses } from '@/shared/hooks/useThemeClasses';

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

const CustomTooltip = ({ active, payload, label, currencyState, tc }: any) => {
  if (active && payload && payload.length) {
    const timeLabel = label;
    return (
      <div className={`${tc.cardBg} border ${tc.border} rounded-lg p-3 shadow-lg`}>
        <p className={`text-xs ${tc.textSecondary} mb-1`}>{timeLabel}</p>
        <p className={`text-sm font-bold ${tc.textPrimary}`}>
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
  const dispatch = useAppDispatch();

  useEffect(() => {
    console.log('BotTradingPage render - user:', user);
    console.log('User bot_type:', user?.bot_type);
    console.log('User is_bot_enabled:', user?.is_bot_enabled);
  }, [user]);

  const initialPair = 'BTC/USDT';
  const initialSymbol = getBaseSymbol(initialPair);
  const initialPrice = prices?.[initialSymbol]?.price || 45230.50;

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
    const currentSymbol = getBaseSymbol(botState.currentPair);
    const livePriceData = prices?.[currentSymbol];
    const currentBasePrice = livePriceData?.price || botState.lastPrice || 0;

    const generateInitialChartData = (basePrice: number) => {
      const data: SimpleChartData[] = [];
      let price = basePrice;
      if (price <= 0) return [];
      for (let i = 0; i < 20; i++) {
        const time = new Date(Date.now() - (20 - i) * 300000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        price += (Math.random() - 0.5) * (basePrice * 0.005);
        data.push({ time, price: Math.max(0, price) });
      }
      return data;
    };

    if (currentBasePrice > 0 && chartData.length === 0) {
      setChartData(generateInitialChartData(currentBasePrice));
    }

    const interval = setInterval(() => {
      if (!prices) return;

      const symbol = getBaseSymbol(botState.currentPair);
      const latestPriceData = prices?.[symbol];
      let newPrice: number;
      const lastKnownPrice = chartData[chartData.length - 1]?.price || currentBasePrice || 0;

      if (latestPriceData && latestPriceData.price > 0) {
        newPrice = latestPriceData.price;
      } else {
        if (lastKnownPrice > 0) {
          newPrice = lastKnownPrice + (Math.random() - 0.5) * (lastKnownPrice * 0.001);
          newPrice = Math.max(0, newPrice);
        } else {
          newPrice = 0;
        }
      }

      if (newPrice !== lastKnownPrice || chartData.length < 20 || newPrice === 0) {
        setChartData(prev => {
          if (prev.length === 0 && newPrice > 0) {
            return generateInitialChartData(newPrice);
          }
          if (newPrice === 0 && prev.length === 0) {
            return [];
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
          lastPrice: newPrice > 0 ? newPrice : prev.lastPrice
        }));
      }
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
    const newSymbol = getBaseSymbol(pair);
    const newPrice = prices?.[newSymbol]?.price || 0;
    setChartData([]);
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
    <div className={`min-h-screen ${tc.bg} ${tc.textPrimary}`}>
      <div className="max-w-8xl mx-auto">
        <div className={`w-full border-b ${tc.border} ${tc.cardBg} backdrop-blur-sm`}>
          <div className="w-full px-6 py-6">
            <h1 className={`text-3xl sm:text-4xl font-extralight ${tc.textPrimary} tracking-tight flex items-center gap-3`}>
              <Zap className="w-8 h-8 text-primary-500" />
              {t('bot.title')}
            </h1>
            <p className={`${tc.textTertiary} font-light mt-1`}>
              {botState.currentPair} • {t('bot.lastPrice')}: {formatPrice(botState.lastPrice, 5)}
            </p>
          </div>
        </div>

        <div className="w-full px-6 py-8 space-y-6">
          <BotActivity stats={stats} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-6">
              <div className={`${tc.cardBg} border ${tc.cardBorder} rounded-3xl p-6`}>
                <div className="flex justify-between items-center mb-6">
                  <h3 className={`text-xl font-bold ${tc.textPrimary} flex items-center gap-2`}>
                    <Settings className="w-5 h-5 text-primary-500" />
                    {t('bot.controls.title')}
                  </h3>
                  <div className={`flex items-center gap-2 ${botState.isActive ? 'text-green-400' : 'text-red-400'}`}>
                    <div className={`w-2.5 h-2.5 rounded-full ${botState.isActive ? 'bg-green-500' : 'bg-red-500'} ${botState.isActive ? 'animate-pulse' : ''}`}></div>
                    <span className="text-sm font-medium">{botState.isActive ? t('bot.activity.active') : t('bot.activity.stopped')}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <label className={`block text-sm font-medium ${tc.textPrimary} mb-2`}>{t('bot.controls.tradingPair')}</label>
                  <select
                    value={botState.currentPair}
                    onChange={(e) => changePair(e.target.value)}
                    className={`w-full px-4 py-2.5 ${tc.hover} border ${tc.cardBorder} rounded-xl text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors appearance-none`}
                  >
                    <option value="BTC/USDT">BTC/USDT</option>
                    <option value="ETH/USDT">ETH/USDT</option>
                    <option value="BNB/USDT">BNB/USDT</option>
                    <option value="SOL/USDT">SOL/USDT</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={toggleBot}
                    disabled={toggling || user?.bot_type === 'none'}
                    className={`btn py-3 text-sm ${
                      botState.isActive
                        ? 'btn-danger'
                        : 'btn-success'
                    } ${toggling ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {toggling ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : botState.isActive ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
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

              <div className={`${tc.cardBg} border ${tc.cardBorder} rounded-3xl p-6`}>
                <h3 className={`text-lg font-bold ${tc.textPrimary} mb-4`}>{t('bot.stats.today')}</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${tc.textSecondary}`}>{t('bot.stats.profit')}</span>
                    <span className={`font-semibold text-lg ${botState.profitToday >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatValueWithSign(botState.profitToday)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${tc.textSecondary}`}>{t('bot.stats.closedTrades')}</span>
                    <span className={`font-medium ${tc.textPrimary}`}>{stats?.closed_trades || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${tc.textSecondary}`}>{t('bot.stats.openPositions')}</span>
                    <span className={`font-medium ${tc.textPrimary}`}>{openPositions.length}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={`${tc.cardBg} border ${tc.cardBorder} rounded-3xl p-6`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-xl font-bold ${tc.textPrimary} flex items-center gap-2`}>
                  <BarChart className="w-5 h-5 text-primary-500" />
                  {t('bot.chart.title', { pair: botState.currentPair })}
                </h3>
              </div>

              <div className="h-80">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                      <XAxis dataKey="time" stroke="#7A7A7A" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis
                        stroke="#7A7A7A"
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
                        content={<CustomTooltip currencyState={currencyState} tc={tc} />}
                        cursor={{ stroke: '#3A3A3A', strokeWidth: 1, strokeDasharray: "5 5" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="price"
                        stroke="#0ea5e9"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 5, fill: '#0ea5e9', stroke: '#0A0A0A', strokeWidth: 2 }}
                        isAnimationActive={true}
                        animationDuration={500}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className={`flex items-center justify-center h-full ${tc.textTertiary}`}>
                    {t('bot.chart.loading')}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className={`${tc.cardBg} border ${tc.cardBorder} rounded-3xl overflow-hidden`}>
                <div className={`p-4 border-b ${tc.cardBorder}`}>
                  <h3 className={`text-lg font-semibold ${tc.textPrimary}`}>
                    {t('bot.positions.title')} ({openPositions.length})
                  </h3>
                </div>
                <div className={`divide-y ${tc.cardBorder} max-h-96 overflow-y-auto custom-scroll`}>
                  {loadingPositions ? (
                    <div className={`p-6 text-center ${tc.textTertiary}`}>
                      <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-primary-500" />
                      <p className="text-sm">{t('bot.loadingPositions')}</p>
                    </div>
                  ) : openPositions.length > 0 ? (
                    openPositions.map((position) => (
                      <div key={position.id} className={`p-4 ${tc.hoverBg} transition-colors`}>
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <div className={`font-semibold ${tc.textPrimary}`}>{position.symbol}</div>
                            <div className={`text-sm font-medium ${position.side === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                              {position.side.toUpperCase()}
                            </div>
                          </div>
                          <button
                            onClick={() => closePosition(position.id)}
                            className={`${tc.textTertiary} hover:text-red-400 text-sm p-2 hover:bg-red-950/50 rounded-lg transition-colors`}
                          >
                            <CloseIcon size={16} />
                          </button>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className={`text-sm ${tc.textTertiary}`}>
                            {t('bot.positions.entry')} {formatPrice(position.entry_price, 5)}
                          </span>
                          <span className={`text-sm font-semibold ${parseFloat(position.profit_loss) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {formatValueWithSign(position.profit_loss)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={`p-6 text-center ${tc.textTertiary}`}>
                      <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p>{t('bot.positions.noPositions')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className={`${tc.cardBg} border ${tc.cardBorder} rounded-3xl overflow-hidden`}>
            <div className={`p-6 border-b ${tc.cardBorder}`}>
              <h3 className={`text-xl font-bold ${tc.textPrimary}`}>
                {t('bot.history.title')} ({trades.length})
              </h3>
            </div>
            <div className="max-h-[500px] overflow-y-auto custom-scroll">
              <table className="w-full">
                <thead className={`${tc.hover} sticky top-0 z-10`}>
                  <tr className={`border-b ${tc.cardBorder}`}>
                    <th className={`text-left py-4 px-6 text-xs font-semibold ${tc.textTertiary} uppercase`}>{t('bot.history.headers.symbol')}</th>
                    <th className={`text-left py-4 px-6 text-xs font-semibold ${tc.textTertiary} uppercase`}>{t('bot.history.headers.type')}</th>
                    <th className={`text-right py-4 px-6 text-xs font-semibold ${tc.textTertiary} uppercase`}>{t('bot.history.headers.profitLoss')}</th>
                    <th className={`text-left py-4 px-6 text-xs font-semibold ${tc.textTertiary} uppercase`}>{t('bot.history.headers.closeDate')}</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${tc.cardBorder}`}>
                  {loadingTrades ? (
                    <tr>
                      <td colSpan={4} className={`p-8 text-center ${tc.textTertiary}`}>
                        <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-primary-500" />
                        <p className="text-sm">{t('bot.loadingTradeHistory')}</p>
                      </td>
                    </tr>
                  ) : trades.length > 0 ? (
                    trades.map((trade) => (
                      <tr key={trade.id} className={`${tc.hoverBg} transition-colors`}>
                        <td className="py-4 px-6">
                          <div className={`font-medium ${tc.textPrimary}`}>{trade.symbol}</div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`font-semibold ${trade.side === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                            {trade.side.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className={`font-semibold ${parseFloat(trade.profit_loss) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {formatValueWithSign(trade.profit_loss)}
                          </span>
                        </td>
                        <td className={`py-4 px-6 text-sm ${tc.textTertiary}`}>
                          {trade.closed_at ? new Date(trade.closed_at).toLocaleString(i18n.language) : '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className={`p-8 text-center ${tc.textTertiary}`}>
                        <p>{t('bot.history.noTrades')}</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}