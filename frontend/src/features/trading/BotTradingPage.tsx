import { useEffect, useState } from 'react';
import { tradingService, BotTrade, TradingStats } from '@/services/tradingService';
import BotActivity from './BotActivity';
import { useAppSelector } from '@/store/hooks';
import BotInfo from './BotInfo';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Play, Pause, Square } from 'lucide-react';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import { RootState } from '@/store/store';

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

export default function BotTradingPage() {
  const [trades, setTrades] = useState<BotTrade[]>([]);
  const [openPositions, setOpenPositions] = useState<BotTrade[]>([]);
  const [stats, setStats] = useState<TradingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAppSelector((state: RootState) => state.auth);
  const currencyState = useAppSelector((state: RootState) => state.currency);
  const { prices } = useAppSelector((state: RootState) => state.websocket);

  const initialPair = 'BTC/USDT';
  const initialSymbol = getBaseSymbol(initialPair);
  const initialPrice = prices[initialSymbol]?.price || 45230.50;

  const [botState, setBotState] = useState<BotState>({
    isActive: true,
    currentPair: initialPair,
    lastPrice: initialPrice,
    profitToday: 127.85
  });

  const [chartData, setChartData] = useState<SimpleChartData[]>([]);

  useEffect(() => {
    async function fetchData() {
      if (user?.bot_type !== 'none') {
        try {
          setLoading(true);
          const [tradesData, statsData, openPositionsData] = await Promise.all([
            tradingService.getTrades(),
            tradingService.getStats(),
            tradingService.getOpenTrades(),
          ]);
          setTrades(tradesData.results.filter(t => !t.is_open) || []);
          setStats(statsData);
          setOpenPositions(openPositionsData || []);
        } catch (error) {
          console.error('Error fetching trading data:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  useEffect(() => {
    const pollPositions = async () => {
      if (user?.bot_type !== 'none') {
        try {
          setOpenPositions(prevPositions => prevPositions.map(pos => {
            const currentSymbol = getBaseSymbol(pos.symbol);
            const livePriceData = prices[currentSymbol];
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
    const livePriceData = prices[currentSymbol];
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
        const symbol = getBaseSymbol(botState.currentPair);
        const latestPriceData = prices[symbol];
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
                lastPrice: newPrice > 0 ? newPrice : prev.lastPrice,
                profitToday: prev.profitToday + (Math.random() - 0.45) * 5
            }));
        }

    }, 5000);

    return () => clearInterval(interval);
  }, [botState.currentPair, prices, botState.lastPrice, chartData.length]);


  const toggleBot = () => {
    setBotState(prev => ({ ...prev, isActive: !prev.isActive }));
  };

  const changePair = (pair: string) => {
    const newSymbol = getBaseSymbol(pair);
    const newPrice = prices[newSymbol]?.price || 0;
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


  if (loading && user?.bot_type !== 'none') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="text-dark-text-secondary mt-4">Завантаження...</p>
        </div>
      </div>
    );
  }

  if (!user || user.bot_type === 'none') {
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
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-dark-bg to-dark-card/20 p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark-text-primary mb-2">
          Торгівля з ботом
        </h1>
        <p className="text-dark-text-secondary">
          {botState.currentPair} • Остання ціна: {formatPrice(botState.lastPrice, 5)}
        </p>
      </div>

      <div className="mb-6">
        <BotActivity stats={stats} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="space-y-6">
          <div className="glass-card p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-dark-text-primary">Управління</h3>
              <div className={`flex items-center space-x-2 ${botState.isActive ? 'text-green-500' : 'text-red-500'}`}>
                <div className={`w-2 h-2 rounded-full ${botState.isActive ? 'bg-green-500' : 'bg-red-500'} ${botState.isActive ? 'animate-pulse' : ''}`}></div>
                <span className="text-sm">{botState.isActive ? 'Активний' : 'Зупинений'}</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-dark-text-secondary mb-2">Торгова пара</label>
              <select
                value={botState.currentPair}
                onChange={(e) => changePair(e.target.value)}
                className="w-full px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-dark-text-primary"
              >
                <option value="BTC/USDT">BTC/USDT</option>
                <option value="ETH/USDT">ETH/USDT</option>
                <option value="BNB/USDT">BNB/USDT</option>
                <option value="SOL/USDT">SOL/USDT</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={toggleBot}
                className={`py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                  botState.isActive
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {botState.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{botState.isActive ? 'Пауза' : 'Старт'}</span>
              </button>
              <button className="py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2">
                <Square className="w-4 h-4" />
                <span>Стоп</span>
              </button>
            </div>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-dark-text-primary mb-4">Сьогодні</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-dark-text-secondary">Прибуток:</span>
                <span className={`font-semibold ${botState.profitToday >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                   {formatValueWithSign(botState.profitToday)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-dark-text-secondary">Закрито угод:</span>
                <span className="text-dark-text-primary">{stats?.closed_trades || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-dark-text-secondary">Відкрито позицій:</span>
                <span className="text-dark-text-primary">{openPositions.length}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-dark-text-primary">
              Графік {botState.currentPair}
            </h3>
            <div className="text-sm text-dark-text-secondary">
              Оновлюється кожні 5 сек
            </div>
          </div>

          <div className="h-80">
            {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                    dataKey="time"
                    stroke="#9CA3AF"
                    fontSize={12}
                    />
                    <YAxis
                    stroke="#9CA3AF"
                    fontSize={12}
                    domain={['dataMin * 0.995', 'dataMax * 1.005']}
                    tickFormatter={(value) => formatPrice(value, 5)}
                    scale="linear"
                    allowDataOverflow={true}
                    />
                    <Tooltip
                    contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB'
                    }}
                    formatter={(value: any) => [formatPrice(value, 5), 'Ціна']}
                    />
                    <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: '#10B981' }}
                    isAnimationActive={true}
                    animationDuration={500}
                    />
                </LineChart>
                </ResponsiveContainer>
             ) : (
                <div className="flex items-center justify-center h-full text-dark-text-secondary">
                   Завантаження даних графіка...
                </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card">
            <div className="p-4 border-b border-dark-border">
              <h3 className="text-lg font-semibold text-dark-text-primary">
                Позиції ({openPositions.length})
              </h3>
            </div>
            <div className="divide-y divide-dark-border max-h-96 overflow-y-auto">
              {openPositions.length > 0 ? (
                openPositions.map((position) => (
                  <div key={position.id} className="p-4 hover:bg-dark-card/50 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <div className="font-semibold text-dark-text-primary">{position.symbol}</div>
                        <div className={`text-sm ${position.side === 'buy' ? 'text-green-500' : 'text-red-500'}`}>
                          {position.side.toUpperCase()}
                        </div>
                      </div>
                      <button
                        onClick={() => closePosition(position.id)}
                        className="text-dark-text-secondary hover:text-red-500 text-sm"
                      >
                        Закрити
                      </button>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-dark-text-secondary">
                        Вхід: {formatPrice(position.entry_price, 5)}
                      </span>
                      <span className={`text-sm font-semibold ${parseFloat(position.profit_loss) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {formatValueWithSign(position.profit_loss)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-dark-text-secondary">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Немає відкритих позицій</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 glass-card overflow-hidden">
        <div className="p-4 border-b border-dark-border">
          <h3 className="text-lg font-semibold text-dark-text-primary">
            Історія угод ({trades.length})
          </h3>
        </div>
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-dark-card sticky top-0">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-dark-text-secondary uppercase">Символ</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-dark-text-secondary uppercase">Тип</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-dark-text-secondary uppercase">Прибуток/Збиток</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-dark-text-secondary uppercase">Дата закриття</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border">
              {trades.length > 0 ? (
                trades.map((trade) => (
                  <tr key={trade.id} className="hover:bg-dark-hover/30 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-dark-text-primary">{trade.symbol}</div>
                    </td>
                    <td className="p-4">
                      <span className={`font-semibold ${trade.side === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                        {trade.side.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                       <span className={`font-semibold ${parseFloat(trade.profit_loss) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                         {formatValueWithSign(trade.profit_loss)}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-dark-text-secondary">
                      {trade.closed_at ? new Date(trade.closed_at).toLocaleString() : '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-dark-text-secondary">
                    <p>Історія угод порожня.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}