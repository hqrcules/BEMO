import { TradingStats, TradingSession } from '@/services/tradingService';
import { useAppSelector } from '@/store/hooks';
import { TrendingUp, TrendingDown, Zap, Shield } from 'lucide-react';
import { tradingService } from '@/services/tradingService';
import { useState, useEffect } from 'react';

interface BotActivityProps {
  stats: TradingStats | null;
}

export default function BotActivity({ stats }: BotActivityProps) {
  const { user } = useAppSelector((state) => state.auth);
  const [activeSession, setActiveSession] = useState<TradingSession | null>(null);

  useEffect(() => {
    async function fetchActiveSession() {
      try {
        const session = await tradingService.getActiveSession();
        setActiveSession(session);
      } catch (error) {
        console.error('No active session found:', error);
      }
    }

    if (user?.bot_type !== 'none') {
      fetchActiveSession();
    }
  }, [user]);

  if (!user || user.bot_type === 'none') {
    return null;
  }

  const botColor =
    user.bot_type === 'premium'
      ? 'text-purple-400'
      : user.bot_type === 'specialist'
      ? 'text-yellow-400'
      : 'text-blue-400';

  return (
    <div className="glass-card p-6 bg-gradient-to-br from-blue-500/10 via-transparent to-green-500/10">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-dark-text-primary mb-2 flex items-center gap-3">
            <Zap className={`w-7 h-7 ${botColor}`} />
            Bot Activity
          </h2>
          <p className="text-dark-text-secondary">
            Your <span className={`font-bold ${botColor}`}>{user.bot_type}</span> bot is active and trading.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-semibold text-green-500">Active</span>
        </div>
      </div>

      {activeSession && stats && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="stat-card">
            <TrendingUp className="w-8 h-8 text-green-500 mb-3" />
            <p className="text-sm text-dark-text-secondary mb-1">Session Profit</p>
            <p className="text-2xl font-bold text-green-500">
              +€{parseFloat(activeSession.total_profit).toFixed(2)}
            </p>
            <p className="text-xs text-dark-text-tertiary mt-1">today</p>
          </div>
          <div className="stat-card">
            <Shield className="w-8 h-8 text-blue-500 mb-3" />
            <p className="text-sm text-dark-text-secondary mb-1">Win Rate</p>
            <p className="text-2xl font-bold text-dark-text-primary">
              {stats.win_rate.toFixed(2)}%
            </p>
            <div className="w-full bg-dark-border rounded-full h-1 mt-2">
              <div
                className="bg-blue-500 h-1 rounded-full transition-all duration-500"
                style={{ width: `${stats.win_rate}%` }}
              ></div>
            </div>
          </div>
          <div className="stat-card">
            <TrendingUp className="w-8 h-8 text-dark-text-secondary mb-3" />
            <p className="text-sm text-dark-text-secondary mb-1">Total Trades</p>
            <p className="text-2xl font-bold text-dark-text-primary">
              {stats.total_trades}
            </p>
          </div>
          <div className="stat-card">
            <TrendingDown className="w-8 h-8 text-red-500 mb-3" />
            <p className="text-sm text-dark-text-secondary mb-1">Losing Trades</p>
            <p className="text-2xl font-bold text-dark-text-primary">
              {stats.losing_trades}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
