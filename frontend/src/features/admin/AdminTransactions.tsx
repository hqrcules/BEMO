import { useEffect, useState } from 'react';
import { adminService, AdminTransaction } from '@/services/adminService';
import {
  Clock,
  CheckCircle,
  XCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  FileText,
  Search
} from 'lucide-react';

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'rejected'>('pending');
  const [editingTransaction, setEditingTransaction] = useState<AdminTransaction | null>(null);
  const [adminComment, setAdminComment] = useState('');

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await adminService.getTransactions();
      setTransactions(data.results || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (transactionId: string) => {
    try {
      await adminService.updateTransactionStatus(transactionId, {
        status: 'completed',
        admin_comment: adminComment || 'Одобрено администратором'
      });
      await loadTransactions();
      setEditingTransaction(null);
      setAdminComment('');
      alert('Транзакция одобрена!');
    } catch (error) {
      console.error('Error approving transaction:', error);
      alert('Ошибка одобрения транзакции');
    }
  };

  const handleReject = async (transactionId: string) => {
    if (!adminComment) {
      alert('Укажите причину отклонения');
      return;
    }
    try {
      await adminService.updateTransactionStatus(transactionId, {
        status: 'rejected',
        admin_comment: adminComment
      });
      await loadTransactions();
      setEditingTransaction(null);
      setAdminComment('');
      alert('Транзакция отклонена!');
    } catch (error) {
      console.error('Error rejecting transaction:', error);
      alert('Ошибка отклонения транзакции');
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.user_email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || tx.status === filter;
    return matchesSearch && matchesFilter;
  });

  const pendingCount = transactions.filter(tx => tx.status === 'pending').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-dark-text-secondary">Загрузка транзакций...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark-text-primary mb-2 flex items-center gap-3">
            <Clock className="w-8 h-8 text-warning-500" />
            Управление транзакциями
          </h1>
          <p className="text-dark-text-secondary">
            Ожидают проверки: <span className="font-bold text-warning-500">{pendingCount}</span>
          </p>
        </div>
        <button onClick={loadTransactions} className="btn-secondary">
          Обновить
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-text-tertiary" />
            <input
              type="text"
              placeholder="Поиск по email"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text-primary placeholder:text-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'all'
                  ? 'bg-primary-500 text-white'
                  : 'bg-dark-hover text-dark-text-secondary hover:text-dark-text-primary'
              }`}
            >
              Все ({transactions.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'pending'
                  ? 'bg-warning-500 text-white'
                  : 'bg-dark-hover text-dark-text-secondary hover:text-dark-text-primary'
              }`}
            >
              Ожидают ({pendingCount})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'completed'
                  ? 'bg-success-500 text-white'
                  : 'bg-dark-hover text-dark-text-secondary hover:text-dark-text-primary'
              }`}
            >
              Одобрено
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'rejected'
                  ? 'bg-danger-500 text-white'
                  : 'bg-dark-hover text-dark-text-secondary hover:text-dark-text-primary'
              }`}
            >
              Отклонено
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-card">
              <tr className="border-b border-dark-border">
                <th className="text-left py-4 px-6 text-xs font-semibold text-dark-text-secondary uppercase">Тип</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-dark-text-secondary uppercase">Email</th>
                <th className="text-right py-4 px-6 text-xs font-semibold text-dark-text-secondary uppercase">Сумма</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-dark-text-secondary uppercase">Метод</th>
                <th className="text-center py-4 px-6 text-xs font-semibold text-dark-text-secondary uppercase">Статус</th>
                <th className="text-center py-4 px-6 text-xs font-semibold text-dark-text-secondary uppercase">Чек</th>
                <th className="text-center py-4 px-6 text-xs font-semibold text-dark-text-secondary uppercase">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="table-row">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      {tx.transaction_type === 'deposit' ? (
                        <div className="w-8 h-8 bg-success-500/10 rounded-lg flex items-center justify-center">
                          <ArrowDownCircle className="w-4 h-4 text-success-500" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-primary-500/10 rounded-lg flex items-center justify-center">
                          <ArrowUpCircle className="w-4 h-4 text-primary-500" />
                        </div>
                      )}
                      <span className="font-medium text-dark-text-primary capitalize">
                        {tx.transaction_type === 'deposit' ? 'Пополнение' : 'Вывод'}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm text-dark-text-primary">{tx.user_email}</span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className={`text-lg font-bold ${
                      tx.transaction_type === 'deposit' ? 'text-success-500' : 'text-primary-500'
                    }`}>
                      {tx.transaction_type === 'deposit' ? '+' : '-'}€{parseFloat(tx.amount).toFixed(2)}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm text-dark-text-primary">{tx.payment_method}</span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    {tx.status === 'completed' && (
                      <span className="badge-success flex items-center gap-1 justify-center">
                        <CheckCircle className="w-3 h-3" />
                        Одобрено
                      </span>
                    )}
                    {tx.status === 'pending' && (
                      <span className="badge bg-warning-500/10 text-warning-500 border-warning-500/20 flex items-center gap-1 justify-center">
                        <Clock className="w-3 h-3" />
                        Ожидание
                      </span>
                    )}
                    {tx.status === 'rejected' && (
                      <span className="badge-danger flex items-center gap-1 justify-center">
                        <XCircle className="w-3 h-3" />
                        Отклонено
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-center">
                    {tx.receipt_file ? (
                      <a
                        href={tx.receipt_file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary-500 hover:text-primary-400 text-sm"
                      >
                        <FileText className="w-4 h-4" />
                        Просмотр
                      </a>
                    ) : (
                      <span className="text-xs text-dark-text-tertiary">—</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-center">
                    {tx.status === 'pending' && (
                      <button
                        onClick={() => {
                          setEditingTransaction(tx);
                          setAdminComment('');
                        }}
                        className="btn-secondary py-2 text-sm"
                      >
                        Проверить
                      </button>
                    )}
                    {tx.status !== 'pending' && (
                      <span className="text-xs text-dark-text-tertiary">Обработано</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-16">
            <Clock className="w-16 h-16 text-dark-text-tertiary mx-auto mb-4 opacity-50" />
            <p className="text-dark-text-secondary text-lg font-medium">
              Транзакций не найдено
            </p>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {editingTransaction && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card max-w-2xl w-full p-6">
            <h3 className="text-2xl font-bold text-dark-text-primary mb-6">
              Проверка транзакции
            </h3>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="glass-card p-4">
                  <p className="text-xs text-dark-text-tertiary mb-1">Тип</p>
                  <p className="font-semibold text-dark-text-primary capitalize">
                    {editingTransaction.transaction_type === 'deposit' ? 'Пополнение' : 'Вывод'}
                  </p>
                </div>
                <div className="glass-card p-4">
                  <p className="text-xs text-dark-text-tertiary mb-1">Сумма</p>
                  <p className="font-semibold text-dark-text-primary">
                    €{parseFloat(editingTransaction.amount).toFixed(2)}
                  </p>
                </div>
                <div className="glass-card p-4">
                  <p className="text-xs text-dark-text-tertiary mb-1">Email</p>
                  <p className="font-semibold text-dark-text-primary">{editingTransaction.user_email}</p>
                </div>
                <div className="glass-card p-4">
                  <p className="text-xs text-dark-text-tertiary mb-1">Метод</p>
                  <p className="font-semibold text-dark-text-primary">{editingTransaction.payment_method}</p>
                </div>
              </div>

              {editingTransaction.receipt_file && (
                <div className="glass-card p-4">
                  <p className="text-sm text-dark-text-tertiary mb-2">Чек об оплате:</p>
                  <a
                    href={editingTransaction.receipt_file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Открыть чек в новой вкладке
                  </a>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-dark-text-primary mb-2">
                  Комментарий администратора
                </label>
                <textarea
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  className="input-field resize-none h-24"
                  placeholder="Укажите причину (обязательно для отклонения)"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleApprove(editingTransaction.id)}
                className="btn-success flex-1"
              >
                <CheckCircle className="w-5 h-5" />
                Одобрить
              </button>
              <button
                onClick={() => handleReject(editingTransaction.id)}
                className="btn bg-gradient-to-r from-danger-500 to-danger-600 text-white flex-1"
              >
                <XCircle className="w-5 h-5" />
                Отклонить
              </button>
              <button
                onClick={() => setEditingTransaction(null)}
                className="btn-secondary"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
