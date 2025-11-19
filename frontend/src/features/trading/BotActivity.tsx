import { TradingStats, TradingSession } from '@/services/tradingService';
import { useAppSelector } from '@/store/hooks';
import { TrendingUp, TrendingDown, Zap, Shield } from 'lucide-react';
import { tradingService } from '@/services/tradingService';
import { useState, useEffect } from 'react';
import { useThemeClasses } from '@/shared/hooks/useThemeClasses';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { RootState } from '@/store/store';
import { formatCurrency } from '@/shared/utils/formatCurrency';

interface BotActivityProps {
  stats: TradingStats | null;
}

export default function BotActivity({ stats }: BotActivityProps) {
  const { user } = useAppSelector((state) => state.auth);
  const { latestTrade, flashBalance } = useAppSelector((state: RootState) => state.trading);
  const currencyState = useAppSelector((state: RootState) => state.currency);
  const [activeSession, setActiveSession] = useState<TradingSession | null>(null);
  const [flashProfit, setFlashProfit] = useState(false);
  const tc = useThemeClasses();
  const { theme } = useTheme();
  const { t } = useTranslation();

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

  useEffect(() => {
    if (latestTrade) {
      setFlashProfit(true);

      setActiveSession(prevSession => {
        if (prevSession) {
          const newProfit = parseFloat(prevSession.total_profit) + parseFloat(latestTrade.profit_loss);
          return {
            ...prevSession,
            total_profit: newProfit.toFixed(2),
          };
        }
        return prevSession;
      });

      const timer = setTimeout(() => {
        setFlashProfit(false);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [latestTrade]);

  if (!user || user.bot_type === 'none') {
    return null;
  }

  const botColor =
    user.bot_type === 'premium'
      ? (theme === 'dark' ? 'text-purple-400' : 'text-purple-600')
      : user.bot_type === 'specialist'
      ? (theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600')
      : (theme === 'dark' ? 'text-blue-400' : 'text-blue-600');

  const formatValue = (value: number | string | undefined | null) => formatCurrency(value, currencyState);
  const formatValueWithSign = (value: number | string | undefined | null) => {
    const num = Number(value);
    if (isNaN(num)) return formatValue(value);
    const prefix = num >= 0 ? '+' : '';
    return prefix + formatValue(num);
  }

  return (
    <div className="glass-card p-6 bg-gradient-to-br from-blue-500/10 via-transparent to-green-500/10">
      <div className="flex justify-between items-start">
        <div>
          <h2 className={`text-2xl font-bold ${tc.textPrimary} mb-2 flex items-center gap-3`}>
            <Zap className={`w-7 h-7 ${botColor}`} />
            {t('bot.activity.title')}
          </h2>
          <p className={tc.textSecondary}>
            {t('bot.activity.description', { botType: user.bot_type })}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-semibold text-green-500">{t('bot.activity.active')}</span>
        </div>
      </div>

      {activeSession && stats && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className={`stat-card transition-all duration-300 ${flashProfit ? 'scale-105 ring-2 ring-green-500/50 shadow-lg shadow-green-500/20' : ''}`}>
            <TrendingUp className={`w-8 h-8 mb-3 transition-all duration-300 ${flashProfit ? (theme === 'dark' ? 'text-green-400' : 'text-green-600') + ' scale-110' : 'text-green-500'}`} />
            <p className={`text-sm ${tc.textSecondary} mb-1`}>{t('bot.activity.sessionProfit')}</p>
            <p className={`text-2xl font-bold transition-all duration-300 ${flashProfit ? (theme === 'dark' ? 'text-green-400' : 'text-green-600') + ' scale-110' : parseFloat(activeSession.total_profit) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatValueWithSign(activeSession.total_profit)}
            </p>
            <p className={`text-xs ${tc.textTertiary} mt-1`}>{t('bot.activity.today')}</p>
          </div>
          <div className={`stat-card transition-all duration-300 ${flashProfit ? 'ring-1 ring-blue-500/30' : ''}`}>
            <Shield className={`w-8 h-8 text-blue-500 mb-3 transition-transform duration-300 ${flashProfit ? 'scale-105' : ''}`} />
            <p className={`text-sm ${tc.textSecondary} mb-1`}>{t('bot.activity.winRate')}</p>
            <p className={`text-2xl font-bold ${tc.textPrimary} transition-all duration-300 ${flashProfit ? 'scale-105' : ''}`}>
              {stats.win_rate.toFixed(2)}%
            </p>
            <div className={`w-full ${tc.border} rounded-full h-1 mt-2`}>
              <div
                className="bg-blue-500 h-1 rounded-full transition-all duration-500"
                style={{ width: `${stats.win_rate}%` }}
              ></div>
            </div>
          </div>
          <div className={`stat-card transition-all duration-300 ${flashProfit ? 'ring-1 ring-primary-500/30' : ''}`}>
            <TrendingUp className={`w-8 h-8 ${tc.textSecondary} mb-3 transition-transform duration-300 ${flashProfit ? 'scale-105' : ''}`} />
            <p className={`text-sm ${tc.textSecondary} mb-1`}>{t('bot.activity.totalTrades')}</p>
            <p className={`text-2xl font-bold ${tc.textPrimary} transition-all duration-300 ${flashProfit ? 'scale-105' : ''}`}>
              {stats.total_trades}
            </p>
          </div>
          <div className={`stat-card transition-all duration-300 ${flashProfit ? 'ring-1 ring-red-500/30' : ''}`}>
            <TrendingDown className={`w-8 h-8 text-red-500 mb-3 transition-transform duration-300 ${flashProfit ? 'scale-105' : ''}`} />
            <p className={`text-sm ${tc.textSecondary} mb-1`}>{t('bot.activity.losingTrades')}</p>
            <p className={`text-2xl font-bold ${tc.textPrimary} transition-all duration-300 ${flashProfit ? 'scale-105' : ''}`}>
              {stats.losing_trades}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}