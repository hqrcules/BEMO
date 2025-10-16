import { useEffect, useState } from 'react';
import { tradingService, BotTrade, TradingStats } from '@/services/tradingService';
import BotActivity from './BotActivity';
import { useAppSelector } from '@/store/hooks';
import BotInfo from './BotInfo';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Activity, Play, Pause, Square } from 'lucide-react';

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

interface ActivePosition {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  pnl: number;
  entryPrice: number;
}

export default function BotTradingPage() {
  const [trades, setTrades] = useState<BotTrade[]>([]);
  const [stats, setStats] = useState<TradingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAppSelector((state) => state.auth);

  const [botState, setBotState] = useState<BotState>({
    isActive: true,
    currentPair: 'BTC/USDT',
    lastPrice: 45230.50,
    profitToday: 127.85
  });

  const [chartData, setChartData] = useState<SimpleChartData[]>([]);

  const [positions, setPositions] = useState<ActivePosition[]>([
    { id: '1', symbol: 'BTC/USDT', side: 'buy', pnl: 45.20, entryPrice: 44800 },
    { id: '2', symbol: 'ETH/USDT', side: 'sell', pnl: -12.50, entryPrice: 2850 }
  ]);

  useEffect(() => {
    async function fetchData() {
      if (user?.bot_type !== 'none') {
        try {
          setLoading(true);
          const [tradesData, statsData] = await Promise.all([
            tradingService.getTrades(),
            tradingService.getStats(),
          ]);
          setTrades(tradesData.results || []);
          setStats(statsData);
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
    const generateChartData = () => {
      const data: SimpleChartData[] = [];
      let basePrice = 45000;

      for (let i = 0; i < 20; i++) {
        const time = new Date(Date.now() - (20 - i) * 300000).toLocaleTimeString();
        basePrice += (Math.random() - 0.5) * 500;
        data.push({ time, price: basePrice });
      }

      return data;
    };

    setChartData(generateChartData());

    const interval = setInterval(() => {
      setChartData(prev => {
        const newData = [...prev.slice(1)]; // Видаляємо перший елемент
        const lastPrice = prev[prev.length - 1]?.price || 45000;
        const newPrice = lastPrice + (Math.random() - 0.5) * 200;

        newData.push({
          time: new Date().toLocaleTimeString(),
          price: newPrice
        });

        setBotState(prev => ({
          ...prev,
          lastPrice: newPrice,
          profitToday: prev.profitToday + (Math.random() - 0.45) * 5
        }));

        return newData;
      });

      setPositions(prev => prev.map(pos => ({
        ...pos,
        pnl: pos.pnl + (Math.random() - 0.5) * 2
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const toggleBot = () => {
    setBotState(prev => ({ ...prev, isActive: !prev.isActive }));
  };

  const changePair = (pair: string) => {
    setBotState(prev => ({ ...prev, currentPair: pair }));
  };

  const closePosition = (id: string) => {
    setPositions(prev => prev.filter(p => p.id !== id));
  };

  if (loading) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-bg via-dark-bg to-dark-card/20 p-4">
      {/* Заголовок */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-dark-text-primary mb-2">
          Торгівля з ботом
        </h1>
        <p className="text-dark-text-secondary">
          {botState.currentPair} • Остання ціна: ${botState.lastPrice.toFixed(2)}
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
                  {botState.profitToday >= 0 ? '+' : ''}${botState.profitToday.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-dark-text-secondary">Угод:</span>
                <span className="text-dark-text-primary">{trades.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-dark-text-secondary">Позицій:</span>
                <span className="text-dark-text-primary">{positions.length}</span>
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
                  domain={['dataMin - 100', 'dataMax + 100']}
                  tickFormatter={(value) => `$${value.toFixed(0)}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                  formatter={(value: any) => [`$${value.toFixed(2)}`, 'Ціна']}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#10B981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card">
            <div className="p-4 border-b border-dark-border">
              <h3 className="text-lg font-semibold text-dark-text-primary">
                Позиції ({positions.length})
              </h3>
            </div>
            <div className="divide-y divide-dark-border">
              {positions.length > 0 ? (
                positions.map((position) => (
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
                        Вхід: ${position.entryPrice}
                      </span>
                      <span className={`text-sm font-semibold ${position.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-dark-text-secondary">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Немає позицій</p>
                </div>
              )}
            </div>
          </div>

          <div className="glass-card">
            <div className="p-4 border-b border-dark-border">
              <h3 className="text-lg font-semibold text-dark-text-primary">
                Останні угоди
              </h3>
            </div>
            <div className="divide-y divide-dark-border max-h-64 overflow-y-auto">
              {trades.slice(0, 5).map((trade) => (
                <div key={trade.id} className="p-4 hover:bg-dark-card/50 transition-colors">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-dark-text-primary">{trade.symbol}</div>
                      <div className="text-sm text-dark-text-secondary">
                        {new Date(trade.opened_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${
                        parseFloat(trade.profit_loss) >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {parseFloat(trade.profit_loss) >= 0 ? '+' : ''}$
                        {parseFloat(trade.profit_loss).toFixed(2)}
                      </div>
                      <div className={`text-sm ${trade.side === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                        {trade.side.toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {trades.length === 0 && (
                <div className="p-6 text-center text-dark-text-secondary">
                  <p>Поки немає історії</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
