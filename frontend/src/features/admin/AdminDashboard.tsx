import { useEffect, useState } from 'react';
import { adminService, AdminStats } from '@/services/adminService';
import { Users, DollarSign, TrendingUp, Clock, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await adminService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Ошибка загрузки статистики администратора:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-dark-text-secondary">Загрузка статистики...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-dark-text-primary mb-2">
          Панель администратора
        </h1>
        <p className="text-dark-text-secondary">
          Обзор платформы и статистика
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="stat-card group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-glow-primary transition-all">
                <Users className="w-6 h-6 text-white" />
              </div>
              <TrendingUp className="w-5 h-5 text-success-500" />
            </div>
            <p className="text-sm text-dark-text-secondary mb-1">Всего пользователей</p>
            <p className="text-3xl font-bold text-dark-text-primary mb-2">
              {stats.total_users}
            </p>
            <p className="text-xs text-dark-text-tertiary">
              Активных: {stats.active_users}
            </p>
          </div>

          <div className="stat-card group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-success-500 to-success-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-glow-success transition-all">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <TrendingUp className="w-5 h-5 text-success-500" />
            </div>
            <p className="text-sm text-dark-text-secondary mb-1">Общий баланс платформы</p>
            <p className="text-3xl font-bold text-success-500 mb-2">
              €{parseFloat(stats.total_balance).toFixed(2)}
            </p>
            <p className="text-xs text-dark-text-tertiary">
              Все пользователи
            </p>
          </div>

          <div className="stat-card group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-warning-500 to-warning-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-warning-500/30 transition-all">
                <Clock className="w-6 h-6 text-white" />
              </div>
              {stats.pending_transactions > 0 && (
                <span className="px-2 py-1 bg-danger-500 text-white text-xs font-bold rounded-full">
                  {stats.pending_transactions}
                </span>
              )}
            </div>
            <p className="text-sm text-dark-text-secondary mb-1">Ожидают проверки</p>
            <p className="text-3xl font-bold text-warning-500 mb-2">
              {stats.pending_transactions}
            </p>
            <p className="text-xs text-dark-text-tertiary">
              Транзакций
            </p>
          </div>

          <div className="stat-card group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-success-500 to-success-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-glow-success transition-all">
                <ArrowDownCircle className="w-6 h-6 text-white" />
              </div>
              <TrendingUp className="w-5 h-5 text-success-500" />
            </div>
            <p className="text-sm text-dark-text-secondary mb-1">Всего пополнений</p>
            <p className="text-3xl font-bold text-success-500 mb-2">
              €{parseFloat(stats.total_deposits).toFixed(2)}
            </p>
            <p className="text-xs text-dark-text-tertiary">
              Подтвержденных
            </p>
          </div>

          <div className="stat-card group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-glow-primary transition-all">
                <ArrowUpCircle className="w-6 h-6 text-white" />
              </div>
              <TrendingUp className="w-5 h-5 text-primary-500" />
            </div>
            <p className="text-sm text-dark-text-secondary mb-1">Всего выведено</p>
            <p className="text-3xl font-bold text-primary-500 mb-2">
              €{parseFloat(stats.total_withdrawals).toFixed(2)}
            </p>
            <p className="text-xs text-dark-text-tertiary">
              Подтвержденных
            </p>
          </div>

          <div className="stat-card group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 via-success-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-glow-success transition-all">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <TrendingUp className="w-5 h-5 text-success-500" />
            </div>
            <p className="text-sm text-dark-text-secondary mb-1">Чистая прибыль</p>
            <p className="text-3xl font-bold text-success-500 mb-2">
              €{(parseFloat(stats.total_deposits) - parseFloat(stats.total_withdrawals)).toFixed(2)}
            </p>
            <p className="text-xs text-dark-text-tertiary">
              Депозиты - Выводы
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => window.location.href = '/admin/users'}
          className="glass-card p-6 hover:border-primary-500/50 transition-all group text-left"
        >
          <Users className="w-8 h-8 text-primary-500 mb-3 group-hover:scale-110 transition-transform" />
          <h4 className="font-semibold text-dark-text-primary mb-2">Управление пользователями</h4>
          <p className="text-sm text-dark-text-secondary">
            Редактирование балансов и ботов
          </p>
        </button>

        <button
          onClick={() => window.location.href = '/admin/transactions'}
          className="glass-card p-6 hover:border-warning-500/50 transition-all group text-left"
        >
          <Clock className="w-8 h-8 text-warning-500 mb-3 group-hover:scale-110 transition-transform" />
          <h4 className="font-semibold text-dark-text-primary mb-2">Проверка транзакций</h4>
          <p className="text-sm text-dark-text-secondary">
            Подтверждение депозитов и выводов
          </p>
        </button>

        <button
          onClick={() => window.location.href = '/admin/trades'}
          className="glass-card p-6 hover:border-success-500/50 transition-all group text-left"
        >
          <TrendingUp className="w-8 h-8 text-success-500 mb-3 group-hover:scale-110 transition-transform" />
          <h4 className="font-semibold text-dark-text-primary mb-2">Создание сделок</h4>
          <p className="text-sm text-dark-text-secondary">
            Фейковые трейды для пользователей
          </p>
        </button>
      </div>
    </div>
  );
}