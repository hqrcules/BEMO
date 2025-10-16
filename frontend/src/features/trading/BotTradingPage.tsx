import { useEffect, useState } from 'react';
import { tradingService, BotTrade, TradingStats } from '@/services/tradingService';
import BotActivity from './BotActivity';
import { useAppSelector } from '@/store/hooks';
import BotInfo from './BotInfo'; // Import the new component

export default function BotTradingPage() {
  const [trades, setTrades] = useState<BotTrade[]>([]);
  const [stats, setStats] = useState<TradingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAppSelector((state) => state.auth);

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

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user || user.bot_type === 'none') {
    return <BotInfo />; // Show BotInfo if no active bot
  }

  return (
    <div className="space-y-6">
      <BotActivity stats={stats} />

      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-dark-border">
          <h3 className="text-xl font-bold text-dark-text-primary">
            История сделок
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-card">
              <tr>
                <th className="text-left py-4 px-6 text-xs font-semibold text-dark-text-secondary uppercase">
                  Символ
                </th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-dark-text-secondary uppercase">
                  Сторона
                </th>
                <th className="text-right py-4 px-6 text-xs font-semibold text-dark-text-secondary uppercase">
                  Цена входа
                </th>
                <th className="text-right py-4 px-6 text-xs font-semibold text-dark-text-secondary uppercase">
                  Цена выхода
                </th>
                <th className="text-right py-4 px-6 text-xs font-semibold text-dark-text-secondary uppercase">
                  Прибыль/Убыток
                </th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-dark-text-secondary uppercase">
                  Дата
                </th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade) => (
                <tr key={trade.id} className="table-row">
                  <td className="py-4 px-6 font-medium">{trade.symbol}</td>
                  <td className="py-4 px-6">
                    <span
                      className={`font-semibold ${
                        trade.side === 'buy'
                          ? 'text-success-500'
                          : 'text-danger-500'
                      }`}
                    >
                      {trade.side.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right font-mono">
                    ${parseFloat(trade.entry_price).toFixed(2)}
                  </td>
                  <td className="py-4 px-6 text-right font-mono">
                    ${parseFloat(trade.exit_price).toFixed(2)}
                  </td>
                  <td
                    className={`py-4 px-6 text-right font-mono font-semibold ${
                      parseFloat(trade.profit_loss) >= 0
                        ? 'text-success-500'
                        : 'text-danger-500'
                    }`}
                  >
                    {parseFloat(trade.profit_loss) >= 0 ? '+' : ''}$
                    {parseFloat(trade.profit_loss).toFixed(2)}
                  </td>
                  <td className="py-4 px-6 text-sm text-dark-text-tertiary">
                    {new Date(trade.opened_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}