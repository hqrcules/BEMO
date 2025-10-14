import { useEffect, useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { transactionService, Transaction, TransactionStats } from '@/services/transactionService';
import { useTranslation } from 'react-i18next';
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  CheckCircle,
  XCircle,
  Upload,
  DollarSign,
  CreditCard,
  TrendingUp,
  FileText,
  AlertCircle,
  X,
} from 'lucide-react';

export default function BalancePage() {
  const { t } = useTranslation();
  const { user } = useAppSelector((state) => state.auth);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [transactionsData, statsData] = await Promise.all([
        transactionService.getTransactions(),
        transactionService.getStats(),
      ]);
      setTransactions(transactionsData.results || []);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading balance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-success-500" />;
      case 'pending': return <Clock className="w-5 h-5 text-warning-500" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-danger-500" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: { [key: string]: string } = {
      completed: 'bg-success-500/10 text-success-500 border-success-500/20',
      pending: 'bg-warning-500/10 text-warning-500 border-warning-500/20',
      rejected: 'bg-danger-500/10 text-danger-500 border-danger-500/20',
    };
    const labels: { [key: string]: string } = {
      completed: t('balance.status.completed'),
      pending: t('balance.status.pending'),
      rejected: t('balance.status.rejected'),
    };
    return <span className={`badge ${styles[status]}`}>{labels[status]}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Wallet className="w-12 h-12 text-primary-500 animate-pulse mx-auto mb-4" />
          <p className="text-dark-text-secondary">{t('balance.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-dark-text-primary mb-2 flex items-center gap-3">
          <Wallet className="w-8 h-8 text-primary-500" />
          {t('balance.title')}
        </h1>
        <p className="text-dark-text-secondary">{t('balance.subtitle')}</p>
      </div>

      {/* Balance Card + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Balance */}
        <div className="lg:col-span-1">
          <div className="glass-card p-6 bg-gradient-to-br from-primary-500/10 via-transparent to-success-500/10 border-primary-500/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/50">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-dark-text-secondary">{t('balance.availableBalance')}</p>
                <p className="text-xs text-dark-text-tertiary">Bemo Investment</p>
              </div>
            </div>
            <p className="text-5xl font-bold text-dark-text-primary mb-6">
              €{user?.balance || '0.00'}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowDepositModal(true)} className="btn-success py-3 text-sm">
                <ArrowDownCircle className="w-4 h-4" />
                {t('balance.deposit')}
              </button>
              <button onClick={() => setShowWithdrawModal(true)} className="btn-secondary py-3 text-sm">
                <ArrowUpCircle className="w-4 h-4" />
                {t('balance.withdraw')}
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {stats && (
            <>
              <div className="stat-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-success-500/10 rounded-lg flex items-center justify-center">
                    <ArrowDownCircle className="w-5 h-5 text-success-500" />
                  </div>
                  <TrendingUp className="w-4 h-4 text-success-500" />
                </div>
                <p className="text-sm text-dark-text-secondary mb-1">{t('balance.totalDeposits')}</p>
                <p className="text-2xl font-bold text-dark-text-primary">
                  €{parseFloat(stats.total_deposit_amount).toFixed(2)}
                </p>
                <p className="text-xs text-dark-text-tertiary mt-2">
                  {t('balance.operations')}: {stats.total_deposits}
                </p>
              </div>
              <div className="stat-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-primary-500/10 rounded-lg flex items-center justify-center">
                    <ArrowUpCircle className="w-5 h-5 text-primary-500" />
                  </div>
                  <TrendingUp className="w-4 h-4 text-primary-500" />
                </div>
                <p className="text-sm text-dark-text-secondary mb-1">{t('balance.totalWithdrawals')}</p>
                <p className="text-2xl font-bold text-dark-text-primary">
                  €{parseFloat(stats.total_withdrawal_amount).toFixed(2)}
                </p>
                <p className="text-xs text-dark-text-tertiary mt-2">
                  {t('balance.operations')}: {stats.total_withdrawals}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-dark-border">
          <h3 className="text-xl font-bold text-dark-text-primary flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary-500" />
            {t('balance.transactionHistory')}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-card">
              <tr className="border-b border-dark-border">
                <th className="text-left py-4 px-6 text-xs font-semibold text-dark-text-secondary uppercase">{t('balance.table.type')}</th>
                <th className="text-right py-4 px-6 text-xs font-semibold text-dark-text-secondary uppercase">{t('balance.table.amount')}</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-dark-text-secondary uppercase">{t('balance.table.method')}</th>
                <th className="text-center py-4 px-6 text-xs font-semibold text-dark-text-secondary uppercase">{t('balance.table.status')}</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-dark-text-secondary uppercase">{t('balance.table.date')}</th>
                <th className="text-center py-4 px-6 text-xs font-semibold text-dark-text-secondary uppercase">{t('balance.table.receipt')}</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="table-row">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      {tx.transaction_type === 'deposit' ? (
                        <div className="w-8 h-8 bg-success-500/10 rounded-lg flex items-center justify-center"><ArrowDownCircle className="w-4 h-4 text-success-500" /></div>
                      ) : (
                        <div className="w-8 h-8 bg-primary-500/10 rounded-lg flex items-center justify-center"><ArrowUpCircle className="w-4 h-4 text-primary-500" /></div>
                      )}
                      <span className="font-medium text-dark-text-primary capitalize">
                        {tx.transaction_type === 'deposit' ? t('balance.types.deposit') : t('balance.types.withdrawal')}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className={`text-lg font-bold ${tx.transaction_type === 'deposit' ? 'text-success-500' : 'text-primary-500'}`}>
                      {tx.transaction_type === 'deposit' ? '+' : '-'}€{parseFloat(tx.amount).toFixed(2)}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-dark-text-tertiary" />
                      <span className="text-sm text-dark-text-primary">{tx.payment_method}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {getStatusIcon(tx.status)}
                      {getStatusBadge(tx.status)}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-dark-text-tertiary">
                    {new Date(tx.created_at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-4 px-6 text-center">
                    {tx.receipt_file ? (
                      <a href={tx.receipt_file} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary-500 hover:text-primary-400 text-sm">
                        <FileText className="w-4 h-4" />
                        {t('balance.viewReceipt')}
                      </a>
                    ) : (
                      <span className="text-xs text-dark-text-tertiary">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {transactions.length === 0 && (
          <div className="text-center py-16">
            <Wallet className="w-16 h-16 text-dark-text-tertiary mx-auto mb-4 opacity-50" />
            <p className="text-dark-text-secondary text-lg font-medium mb-2">{t('balance.noTransactions.title')}</p>
            <p className="text-sm text-dark-text-tertiary mb-6">{t('balance.noTransactions.subtitle')}</p>
            <button onClick={() => setShowDepositModal(true)} className="btn-primary">
              <ArrowDownCircle className="w-5 h-5" />
              {t('balance.noTransactions.button')}
            </button>
          </div>
        )}
      </div>

      {showDepositModal && <DepositModal onClose={() => setShowDepositModal(false)} onSuccess={loadData} />}
      {showWithdrawModal && <WithdrawModal onClose={() => setShowWithdrawModal(false)} onSuccess={loadData} currentBalance={parseFloat(user?.balance || '0')} />}
    </div>
  );
}

// Deposit Modal Component
function DepositModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!receiptFile) {
      setError(t('balance.modals.errorReceipt'));
      return;
    }
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('amount', amount);
      formData.append('payment_method', paymentMethod);
      formData.append('receipt_file', receiptFile);
      await transactionService.createDeposit(formData);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || t('balance.modals.errorDeposit'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="glass-card max-w-md w-full p-6 animate-slide-in">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-dark-text-primary flex items-center gap-2">
            <ArrowDownCircle className="w-6 h-6 text-success-500" />
            {t('balance.modals.depositTitle')}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-dark-hover rounded-lg transition-colors">
            <X className="w-5 h-5 text-dark-text-secondary" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-4 bg-danger-500/10 border border-danger-500/20 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-danger-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-danger-500">{error}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-dark-text-primary mb-2">{t('balance.modals.amountLabel')} (€)</label>
            <input type="number" required min="10" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="input-field" placeholder="100.00" />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-text-primary mb-2">{t('balance.modals.methodLabel')}</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="input-field">
              <option value="card">{t('balance.methods.card')}</option>
              <option value="crypto">{t('balance.methods.crypto')}</option>
              <option value="bank_transfer">{t('balance.methods.transfer')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-text-primary mb-2">{t('balance.modals.receiptLabel')}</label>
            <div className="border-2 border-dashed border-dark-border rounded-xl p-6 hover:border-primary-500/50 transition-colors cursor-pointer">
              <input type="file" accept="image/*,.pdf" onChange={(e) => setReceiptFile(e.target.files?.[0] || null)} className="hidden" id="receipt-upload" />
              <label htmlFor="receipt-upload" className="cursor-pointer block text-center">
                <Upload className="w-8 h-8 text-dark-text-tertiary mx-auto mb-2" />
                {receiptFile ? (
                  <p className="text-sm text-primary-500 font-medium">{receiptFile.name}</p>
                ) : (
                  <>
                    <p className="text-sm text-dark-text-primary mb-1">{t('balance.modals.uploadClick')}</p>
                    <p className="text-xs text-dark-text-tertiary">{t('balance.modals.uploadHint')}</p>
                  </>
                )}
              </label>
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full btn-success py-4">
            {loading ? t('balance.modals.sending') : t('balance.modals.sendButton')}
          </button>
        </form>
      </div>
    </div>
  );
}

// Withdraw Modal Component
function WithdrawModal({ onClose, onSuccess, currentBalance }: { onClose: () => void; onSuccess: () => void; currentBalance: number; }) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [walletAddress, setWalletAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const amountNum = parseFloat(amount);
    if (amountNum > currentBalance) {
      setError(t('balance.modals.errorInsufficientFunds'));
      return;
    }
    try {
      setLoading(true);
      await transactionService.requestWithdrawal({
        amount: amountNum,
        payment_method: paymentMethod,
        wallet_address: walletAddress || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || t('balance.modals.errorWithdraw'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="glass-card max-w-md w-full p-6 animate-slide-in">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-dark-text-primary flex items-center gap-2">
            <ArrowUpCircle className="w-6 h-6 text-primary-500" />
            {t('balance.modals.withdrawTitle')}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-dark-hover rounded-lg transition-colors">
            <X className="w-5 h-5 text-dark-text-secondary" />
          </button>
        </div>
        <div className="mb-6 p-4 bg-primary-500/10 border border-primary-500/20 rounded-xl">
          <p className="text-sm text-dark-text-secondary mb-1">{t('balance.modals.availableToWithdraw')}</p>
          <p className="text-2xl font-bold text-dark-text-primary">€{currentBalance.toFixed(2)}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-4 bg-danger-500/10 border border-danger-500/20 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-danger-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-danger-500">{error}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-dark-text-primary mb-2">{t('balance.modals.withdrawAmountLabel')} (€)</label>
            <input type="number" required min="10" max={currentBalance} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="input-field" placeholder="100.00" />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-text-primary mb-2">{t('balance.modals.withdrawMethodLabel')}</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="input-field">
              <option value="card">{t('balance.methods.card')}</option>
              <option value="crypto">{t('balance.methods.crypto')}</option>
              <option value="bank_transfer">{t('balance.methods.transfer')}</option>
            </select>
          </div>
          {paymentMethod === 'crypto' && (
            <div>
              <label className="block text-sm font-medium text-dark-text-primary mb-2">{t('balance.modals.walletAddressLabel')}</label>
              <input type="text" value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} className="input-field font-mono text-sm" placeholder="0x..." />
            </div>
          )}
          <button type="submit" disabled={loading} className="w-full btn-primary py-4">
            {loading ? t('balance.modals.requesting') : t('balance.modals.requestButton')}
          </button>
        </form>
      </div>
    </div>
  );
}