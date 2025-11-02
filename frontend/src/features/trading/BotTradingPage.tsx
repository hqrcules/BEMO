import { useEffect, useState,} from 'react';
import { tradingService, BotTrade, TradingStats,} from '@/services/tradingService';
import BotActivity from './BotActivity';
import { useAppSelector } from '@/store/hooks';
import BotInfo from './BotInfo';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Play, Pause, Square, Zap, Settings, BarChart, X as CloseIcon, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import { RootState } from '@/store/store';
import { useTranslation } from 'react-i18next';

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

const CustomTooltip = ({ active, payload, label, currencyState, }: any) => {
    if (active && payload && payload.length) {
        const timeLabel = label;
        return (
            <div className="bg-zinc-950 border border-zinc-700 rounded-lg p-3 shadow-lg">
                <p className="text-xs text-zinc-400 mb-1">{timeLabel}</p>
                <p className="text-sm font-bold text-white">
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
  const [loading, setLoading] = useState(true);
  const { user } = useAppSelector((state: RootState) => state.auth);
  const currencyState = useAppSelector((state: RootState) => state.currency);
  const { prices } = useAppSelector((state: RootState) => state.websocket);
  const { i18n } = useTranslation();

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
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Loading...</p>
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
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-8xl mx-auto">
        <div className="w-full border-b border-zinc-900 bg-zinc-950/30 backdrop-blur-sm">
          <div className="w-full px-6 py-6">
            <h1 className="text-3xl sm:text-4xl font-extralight text-white tracking-tight flex items-center gap-3">
              <Zap className="w-8 h-8 text-primary-500" />
              Bot Trading
            </h1>
            <p className="text-zinc-500 font-light mt-1">
              {botState.currentPair} • Last Price: {formatPrice(botState.lastPrice, 5)}
            </p>
          </div>
        </div>

        <div className="w-full px-6 py-8 space-y-6">
          <BotActivity stats={stats} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-6">
              <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary-500" />
                    Controls
                  </h3>
                  <div className={`flex items-center gap-2 ${botState.isActive ? 'text-green-400' : 'text-red-400'}`}>
                    <div className={`w-2.5 h-2.5 rounded-full ${botState.isActive ? 'bg-green-500' : 'bg-red-500'} ${botState.isActive ? 'animate-pulse' : ''}`}></div>
                    <span className="text-sm font-medium">{botState.isActive ? 'Active' : 'Stopped'}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-white mb-2">Trading Pair</label>
                  <select
                    value={botState.currentPair}
                    onChange={(e) => changePair(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors appearance-none"
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
                    className={`btn py-3 text-sm ${
                      botState.isActive
                        ? 'btn-danger'
                        : 'btn-success'
                    }`}
                  >
                    {botState.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{botState.isActive ? 'Pause' : 'Start'}</span>
                  </button>
                  <button className="btn btn-secondary py-3 text-sm">
                    <Square className="w-4 h-4" />
                    <span>Stop</span>
                  </button>
                </div>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Today</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-400">Profit:</span>
                    <span className={`font-semibold text-lg ${botState.profitToday >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatValueWithSign(botState.profitToday)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-400">Closed Trades:</span>
                    <span className="font-medium text-white">{stats?.closed_trades || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-400">Open Positions:</span>
                    <span className="font-medium text-white">{openPositions.length}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <BarChart className="w-5 h-5 text-primary-500" />
                  {botState.currentPair} Chart
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
                        content={<CustomTooltip currencyState={currencyState} i18nInstance={i18n}/>}
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
                  <div className="flex items-center justify-center h-full text-zinc-500">
                    Loading chart data...
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden">
                <div className="p-4 border-b border-zinc-800">
                  <h3 className="text-lg font-semibold text-white">
                    Open Positions ({openPositions.length})
                  </h3>
                </div>
                <div className="divide-y divide-zinc-800/50 max-h-96 overflow-y-auto custom-scroll">
                  {openPositions.length > 0 ? (
                    openPositions.map((position) => (
                      <div key={position.id} className="p-4 hover:bg-zinc-900 transition-colors">
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <div className="font-semibold text-white">{position.symbol}</div>
                            <div className={`text-sm font-medium ${position.side === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                              {position.side.toUpperCase()}
                            </div>
                          </div>
                          <button
                            onClick={() => closePosition(position.id)}
                            className="text-zinc-500 hover:text-red-400 text-sm p-2 hover:bg-red-950/50 rounded-lg transition-colors"
                          >
                           <CloseIcon size={16} />
                          </button>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-zinc-500">
                            Entry: {formatPrice(position.entry_price, 5)}
                          </span>
                          <span className={`text-sm font-semibold ${parseFloat(position.profit_loss) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {formatValueWithSign(position.profit_loss)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-zinc-500">
                      <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p>No open positions</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-zinc-800">
              <h3 className="text-xl font-bold text-white">
                Trade History ({trades.length})
              </h3>
            </div>
            <div className="max-h-[500px] overflow-y-auto custom-scroll">
              <table className="w-full">
                <thead className="bg-zinc-900 sticky top-0 z-10">
                  <tr className="border-b border-zinc-800">
                    <th className="text-left py-4 px-6 text-xs font-semibold text-zinc-500 uppercase">Symbol</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-zinc-500 uppercase">Type</th>
                    <th className="text-right py-4 px-6 text-xs font-semibold text-zinc-500 uppercase">Profit/Loss</th>
                    <th className="text-left py-4 px-6 text-xs font-semibold text-zinc-500 uppercase">Close Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {trades.length > 0 ? (
                    trades.map((trade) => (
                      <tr key={trade.id} className="hover:bg-zinc-900 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-medium text-white">{trade.symbol}</div>
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
                        <td className="py-4 px-6 text-sm text-zinc-500">
                          {trade.closed_at ? new Date(trade.closed_at).toLocaleString('en-US') : '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-zinc-500">
                        <p>Trade history is empty.</p>
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