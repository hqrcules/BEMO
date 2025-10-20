import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { fetchUserProfile } from '@/store/slices/authSlice';
import { transactionService, Transaction, TransactionStats } from '@/services/transactionService';
import { adminService, PaymentDetails } from '@/services/adminService';
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
    RefreshCw,
    Bot,
    Crown,
    Users,
    Calculator,
    Copy,
    CheckCheck,
} from 'lucide-react';

type DepositOption = {
    id: string;
    title: string;
    description: string;
    amount: number;
    icon: React.ReactNode;
    color: string;
};

export default function BalancePage() {
    const { t, i18n } = useTranslation();
    const dispatch = useAppDispatch();
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useAppSelector((state) => state.auth);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [stats, setStats] = useState<TransactionStats | null>(null);
    const [paymentDetails, setPaymentDetails] = useState<PaymentDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [selectedOption, setSelectedOption] = useState<DepositOption | null>(null);
    const [customAmount, setCustomAmount] = useState('');
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [loading2, setLoading2] = useState(false);
    const [error, setError] = useState('');
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const DEPOSIT_OPTIONS: DepositOption[] = useMemo(() => [
        {
            id: 'basic',
            title: t('balance.depositOptions.basic.title'),
            description: t('balance.depositOptions.basic.description'),
            amount: 250,
            icon: <Bot className="w-6 h-6" />,
            color: 'text-blue-400',
        },
        {
            id: 'premium',
            title: t('balance.depositOptions.premium.title'),
            description: t('balance.depositOptions.premium.description'),
            amount: 500,
            icon: <Crown className="w-6 h-6" />,
            color: 'text-purple-400',
        },
        {
            id: 'trader',
            title: t('balance.depositOptions.trader.title'),
            description: t('balance.depositOptions.trader.description'),
            amount: 1000,
            icon: <Users className="w-6 h-6" />,
            color: 'text-yellow-400',
        },
        {
            id: 'custom',
            title: t('balance.depositOptions.custom.title'),
            description: t('balance.depositOptions.custom.description'),
            amount: 0,
            icon: <Calculator className="w-6 h-6" />,
            color: 'text-green-400',
        },
    ], [t]);

    useEffect(() => {
        loadData();
        if (searchParams.get('deposit') === 'true') {
            setShowDepositModal(true);
            setSearchParams({});
        }
    }, [searchParams, setSearchParams]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [transactionsData, statsData, paymentDetailsData] = await Promise.all([
                transactionService.getTransactions(),
                transactionService.getStats(),
                adminService.getActivePaymentDetails(),
            ]);
            setTransactions(transactionsData.results || []);
            setStats(statsData);
            setPaymentDetails(paymentDetailsData.filter(d => d.currency === 'BANK_TRANSFER') || []);
        } catch (error) {
            console.error('Error loading balance data:', error);
        } finally {
            setLoading(false);
        }
    };

    const refreshBalance = async () => {
        try {
            setRefreshing(true);
            await dispatch(fetchUserProfile()).unwrap();
            await loadData();
        } catch (error) {
            console.error('Error refreshing balance:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const handleTransactionSuccess = async () => {
        await refreshBalance();
    };

    const handleOptionSelect = (option: DepositOption) => {
        setSelectedOption(option);
        setError('');
        if (option.id === 'custom') setCustomAmount('');
        setShowDepositModal(false);
        setShowPaymentModal(true);
    };

    const getDepositAmount = () => selectedOption?.id === 'custom' ? parseFloat(customAmount) || 0 : selectedOption?.amount || 0;

    const handleDepositSubmit = async () => {
        const amount = getDepositAmount();
        if (amount < 250) {
            setError(t('balance.modals.errorMinAmount', { amount: 250 }));
            return;
        }
        if (!receiptFile) {
            setError(t('balance.modals.errorReceipt'));
            return;
        }
        try {
            setLoading2(true);
            await transactionService.createDeposit({
                amount: amount,
                payment_method: 'card',
                payment_receipt: receiptFile
            });
            setShowPaymentModal(false);
            setSelectedOption(null);
            setCustomAmount('');
            setReceiptFile(null);
            await handleTransactionSuccess();
            alert(t('balance.modals.depositSuccess'));
        } catch (err: any) {
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading2(false);
        }
    };

    const copyToClipboard = async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
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
        return <span className={`badge ${styles[status]}`}>{t(`balance.status.${status}`)}</span>;
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-dark-text-primary mb-2 flex items-center gap-3">
                        <Wallet className="w-8 h-8 text-primary-500" />
                        {t('balance.title')}
                    </h1>
                    <p className="text-dark-text-secondary">{t('balance.subtitle')}</p>
                </div>
                <button
                    onClick={refreshBalance}
                    disabled={refreshing}
                    className="btn-secondary py-2 px-4 flex items-center gap-2"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? t('balance.refreshing') : t('balance.refresh')}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                            €{user?.balance ? parseFloat(user.balance).toFixed(2) : '0.00'}
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setShowDepositModal(true)} className="btn-success py-3 text-sm">
                                <ArrowDownCircle className="w-4 h-4" />
                                {t('balance.deposit')}
                            </button>
                            <button
                                onClick={() => setShowWithdrawModal(true)}
                                disabled={!user?.balance || parseFloat(user.balance) <= 0}
                                className="btn-secondary py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ArrowUpCircle className="w-4 h-4" />
                                {t('balance.withdraw')}
                            </button>
                        </div>
                    </div>
                </div>

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
                                    €{stats.total_deposit_amount ? parseFloat(stats.total_deposit_amount).toFixed(2) : '0.00'}
                                </p>
                                <p className="text-xs text-dark-text-tertiary mt-2">
                                    {t('balance.operations')}: {stats.total_deposits || 0}
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
                                    €{stats.total_withdrawal_amount ? parseFloat(stats.total_withdrawal_amount).toFixed(2) : '0.00'}
                                </p>
                                <p className="text-xs text-dark-text-tertiary mt-2">
                                    {t('balance.operations')}: {stats.total_withdrawals || 0}
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="glass-card overflow-hidden">
                <div className="p-6 border-b border-dark-border flex items-center justify-between">
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
                                            <span className="font-medium text-dark-text-primary capitalize">{t(`balance.types.${tx.transaction_type}`)}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <span className={`text-lg font-bold ${tx.transaction_type === 'deposit' ? 'text-success-500' : 'text-primary-500'}`}>
                                            {tx.transaction_type === 'deposit' ? '+' : '-'}€{parseFloat(tx.amount).toFixed(2)}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6"><div className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-dark-text-tertiary" /><span className="text-sm text-dark-text-primary">{t(`balance.methods.${tx.payment_method}`)}</span></div></td>
                                    <td className="py-4 px-6 text-center"><div className="flex items-center justify-center gap-2">{getStatusIcon(tx.status)}{getStatusBadge(tx.status)}</div></td>
                                    <td className="py-4 px-6 text-sm text-dark-text-tertiary">{new Date(tx.created_at).toLocaleString(i18n.language, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                                    <td className="py-4 px-6 text-center">{tx.payment_receipt ? (<a href={tx.payment_receipt} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary-500 hover:text-primary-400 text-sm"><FileText className="w-4 h-4" />{t('balance.viewReceipt')}</a>) : (<span className="text-xs text-dark-text-tertiary">—</span>)}</td>
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
                        <button onClick={() => setShowDepositModal(true)} className="btn-primary"><ArrowDownCircle className="w-5 h-5" />{t('balance.noTransactions.button')}</button>
                    </div>
                )}
            </div>

            {showDepositModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-card max-w-2xl w-full p-6">
                        <div className="flex items-center justify-between mb-6"><h3 className="text-2xl font-bold text-dark-text-primary">{t('balance.modals.selectPackage')}</h3><button onClick={() => setShowDepositModal(false)} className="p-2 hover:bg-dark-hover rounded-lg transition-colors"><X className="w-5 h-5 text-dark-text-secondary" /></button></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {DEPOSIT_OPTIONS.map((option) => (
                                <button key={option.id} onClick={() => handleOptionSelect(option)} className="glass-card p-4 border-2 border-dark-border hover:border-primary-500/50 transition-all text-left group">
                                    <div className="flex items-center gap-3 mb-3"><div className={`w-10 h-10 rounded-lg bg-dark-hover flex items-center justify-center ${option.color} group-hover:scale-110 transition-transform`}>{option.icon}</div><div><h4 className="font-semibold text-dark-text-primary">{option.title}</h4><p className="text-sm text-dark-text-secondary">{option.description}</p></div></div>
                                    <div className="text-right"><span className="text-xl font-bold text-dark-text-primary">{option.amount > 0 ? `€${option.amount}` : t('balance.modals.fromAmount')}</span></div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {showPaymentModal && selectedOption && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-card max-w-lg w-full p-6">
                        <div className="flex items-center justify-between mb-6"><h3 className="text-xl font-bold text-dark-text-primary">{t('balance.modals.depositTitle')}</h3><button onClick={() => { setShowPaymentModal(false); setSelectedOption(null); setError(''); }} className="p-2 hover:bg-dark-hover rounded-lg transition-colors"><X className="w-5 h-5 text-dark-text-secondary" /></button></div>
                        {error && (<div className="p-3 bg-danger-500/10 border border-danger-500/20 rounded-lg flex items-start gap-3 mb-4"><AlertCircle className="w-4 h-4 text-danger-500 flex-shrink-0 mt-0.5" /><p className="text-sm text-danger-500">{error}</p></div>)}

                        {selectedOption.id === 'custom' && (
                            <div className="mb-4"><label className="block text-sm font-medium text-dark-text-primary mb-2">{t('balance.modals.amountLabel')} (€)</label><input type="number" min="250" step="0.01" value={customAmount} onChange={(e) => setCustomAmount(e.target.value)} className="input-field" placeholder="250.00" /><p className="text-xs text-dark-text-tertiary mt-1">{t('balance.modals.minAmount')}: €250</p></div>
                        )}

                        <div className="mb-4 p-3 bg-primary-500/10 border border-primary-500/20 rounded-lg"><p className="text-sm text-primary-400 font-medium">{t('balance.modals.transferAmount')}: €{getDepositAmount()}</p></div>

                        <div className="space-y-3 mb-4">
                            <label className="block text-sm font-medium text-dark-text-primary">{t('balance.payment.cardNumberLabel')}</label>
                            {paymentDetails.length > 0 ? paymentDetails.map((detail) => (
                                <div key={detail.id} className="p-3 bg-dark-hover rounded-lg">
                                    <div className="flex items-center justify-between mt-1">
                                        <p className="text-lg text-dark-text-primary font-mono break-all">{detail.bank_details}</p>
                                        <button onClick={() => copyToClipboard(detail.bank_details, detail.id)} className="p-2 hover:bg-dark-border rounded-lg">
                                            {copiedField === detail.id ? <CheckCheck className="w-4 h-4 text-success-500" /> : <Copy className="w-4 h-4 text-dark-text-secondary" />}
                                        </button>
                                    </div>
                                </div>
                            )) : <p className="text-sm text-dark-text-secondary">{t('balance.payment.noCardNumber')}</p>}
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-dark-text-primary mb-2">{t('balance.modals.receiptLabel')}</label>
                            <div className="border-2 border-dashed border-dark-border rounded-lg p-4 hover:border-primary-500/50 transition-colors cursor-pointer">
                                <input type="file" accept="image/*,.pdf" onChange={(e) => setReceiptFile(e.target.files?.[0] || null)} className="hidden" id="receipt-upload" />
                                <label htmlFor="receipt-upload" className="cursor-pointer block text-center">
                                    <Upload className="w-6 h-6 text-dark-text-tertiary mx-auto mb-2" />
                                    {receiptFile ? (<p className="text-sm text-primary-500 font-medium">{receiptFile.name}</p>) : (<><p className="text-sm text-dark-text-primary mb-1">{t('balance.modals.uploadClick')}</p><p className="text-xs text-dark-text-tertiary">{t('balance.modals.uploadHint')}</p></>)}
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={handleDepositSubmit} disabled={loading2 || getDepositAmount() < 250 || !receiptFile} className="btn-success flex-1 py-3 disabled:opacity-50 disabled:cursor-not-allowed">{loading2 ? t('balance.modals.processing') : t('balance.modals.confirmDeposit')}</button>
                            <button onClick={() => { setShowPaymentModal(false); setShowDepositModal(true); }} className="btn-secondary py-3" disabled={loading2}>{t('balance.modals.back')}</button>
                        </div>
                    </div>
                </div>
            )}

            {showWithdrawModal && (
                <WithdrawModal
                    onClose={() => setShowWithdrawModal(false)}
                    onSuccess={handleTransactionSuccess}
                    currentBalance={parseFloat(user?.balance || '0')}
                    paymentDetails={paymentDetails}
                    copyToClipboard={copyToClipboard}
                    copiedField={copiedField}
                />
            )}
        </div>
    );
}

function WithdrawModal({
    onClose,
    onSuccess,
    currentBalance,
    paymentDetails,
    copyToClipboard,
    copiedField,
}: {
    onClose: () => void;
    onSuccess: () => void;
    currentBalance: number;
    paymentDetails: PaymentDetails[];
    copyToClipboard: (text: string, field: string) => Promise<void>;
    copiedField: string | null;
}) {
    const { t } = useTranslation();
    const [amount, setAmount] = useState('');
    const [userRequisites, setUserRequisites] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const amountNum = parseFloat(amount) || 0;
    const commissionAmount = useMemo(() => amountNum * 0.25, [amountNum]);
    const amountToReceive = useMemo(() => amountNum - commissionAmount, [amountNum, commissionAmount]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (amountNum > currentBalance) {
            setError(t('balance.modals.errorInsufficientFunds', 'Недостатньо коштів на балансі'));
            return;
        }

        if (amountNum < 50) {
             setError(t('balance.modals.errorMinAmountWithdraw', 'Мінімальна сума для виведення: €50', { amount: 50 }));
             return;
        }

        if (!userRequisites.trim()) {
             setError(t('balance.modals.errorRequisites', 'Будь ласка, вкажіть ваші реквізити для виведення'));
             return;
        }

        try {
            setLoading(true);
            await transactionService.requestWithdrawal({
                amount: amountNum,
                payment_details: userRequisites
            });
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || t('balance.modals.errorWithdraw', 'Сталася помилка. Спробуйте пізніше.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="glass-card max-w-md w-full p-6 my-auto">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-dark-text-primary flex items-center gap-2">
                        <ArrowUpCircle className="w-5 h-5 text-primary-500" />
                        {t('balance.modals.withdrawTitle', 'Запит на виведення коштів')}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-dark-hover rounded-lg transition-colors">
                        <X className="w-5 h-5 text-dark-text-secondary" />
                    </button>
                </div>

                <div className="mb-4 p-4 bg-primary-500/10 border border-primary-500/20 rounded-lg">
                    <p className="text-sm text-dark-text-secondary mb-1">
                        {t('balance.modals.availableToWithdraw', 'Доступно до виведення')}
                    </p>
                    <p className="text-2xl font-bold text-dark-text-primary">
                        €{currentBalance.toFixed(2)}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 bg-danger-500/10 border border-danger-500/20 rounded-lg flex items-start gap-3">
                            <AlertCircle className="w-4 h-4 text-danger-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-danger-500">{error}</p>
                        </div>
                    )}

                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-dark-text-primary">
                            {t('balance.payment.methodsTitle', 'Доступні методи (інформаційно)')}
                        </label>
                        {paymentDetails.length > 0 ? paymentDetails.map((detail) => (
                            <div key={detail.id} className="p-3 bg-dark-hover rounded-lg">
                                <p className="text-xs text-dark-text-tertiary">{detail.currency}</p>
                                <div className="flex items-center justify-between mt-1">
                                    <p className="text-lg text-dark-text-primary font-mono break-all">{detail.bank_details}</p>
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(detail.bank_details, detail.id)}
                                        className="p-2 hover:bg-dark-border rounded-lg"
                                    >
                                        {copiedField === detail.id ? <CheckCheck className="w-4 h-4 text-success-500" /> : <Copy className="w-4 h-4 text-dark-text-secondary" />}
                                    </button>
                                </div>
                            </div>
                        )) : <p className="text-sm text-dark-text-secondary">{t('balance.payment.noMethods')}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-dark-text-primary mb-2">
                            {t('balance.modals.yourRequisites', 'Ваші реквізити (IBAN / Картка)')}
                        </label>
                        <textarea
                            rows={3}
                            required
                            value={userRequisites}
                            onChange={(e) => setUserRequisites(e.target.value)}
                            className="input-field"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-dark-text-primary mb-2">
                            {t('balance.modals.withdrawAmountLabel', 'Сума для виведення')} (€)
                        </label>
                        <input
                            type="number"
                            required
                            min="50"
                            max={currentBalance}
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="input-field"
                            placeholder="100.00"
                        />
                        <p className="text-xs text-dark-text-tertiary mt-1">
                            {t('balance.modals.withdrawMinimum', 'Мінімум')}: €50
                        </p>
                    </div>

                    <div className="space-y-2 p-4 bg-dark-hover rounded-lg border border-dark-border">
                        <div className="flex justify-between items-center text-sm">
                            <p className="text-dark-text-secondary">
                                {t('balance.modals.calc.amount', 'Сума запиту')}:
                            </p>
                            <p className="font-medium text-dark-text-primary">
                                €{amountNum.toFixed(2)}
                            </p>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <p className="text-dark-text-secondary">
                                {t('balance.modals.calc.commission', 'Комісія (25%)')}:
                            </p>
                            <p className="font-medium text-danger-500">
                                -€{commissionAmount.toFixed(2)}
                            </p>
                        </div>
                        <div className="flex justify-between items-center border-t border-dark-border pt-2 mt-2">
                            <p className="text-sm font-bold text-dark-text-primary">
                                {t('balance.modals.calc.youReceive', 'Ви отримаєте')}:
                            </p>
                            <p className="text-lg font-bold text-success-500">
                                €{amountToReceive.toFixed(2)}
                            </p>
                        </div>
                    </div>

                    <button type="submit" disabled={loading || amountNum < 50 || !userRequisites} className="w-full btn-primary py-3 disabled:opacity-50">
                        {loading ? t('balance.modals.requesting', 'Обробка...') : t('balance.modals.requestButton', 'Створити запит')}
                    </button>
                </form>
            </div>
        </div>
    );
}