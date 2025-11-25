import { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
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
import { formatCurrency } from '@/shared/utils/formatCurrency';
import { RootState } from '@/store/store';
import { useThemeClasses } from '@/shared/hooks/useThemeClasses';
import { useTheme } from '@/contexts/ThemeContext';

type DepositOption = {
    id: string;
    title: string;
    description: string;
    amount: number;
    icon: React.ReactNode;
    color: string;
};

// WithdrawModal Component
function WithdrawModal({
    onClose,
    onSuccess,
    currentBalance,
    allPaymentDetails,
    copyToClipboard,
    copiedField,
    userName,
    siteSettings,
}: {
    onClose: () => void;
    onSuccess: () => void;
    currentBalance: number;
    allPaymentDetails: PaymentDetails[];
    copyToClipboard: (text: string, field: string) => Promise<void>;
    copiedField: string | null;
    userName: string;
    siteSettings: Record<string, string>;
}) {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const [amount, setAmount] = useState('');
    const [userRequisites, setUserRequisites] = useState('');
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [paymentMethodType, setPaymentMethodType] = useState<'card' | 'crypto'>('card');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const amountNum = parseFloat(amount) || 0;
    const commissionAmount = useMemo(() => amountNum * 0.25, [amountNum]);
    const totalDeducted = useMemo(() => amountNum + commissionAmount, [amountNum, commissionAmount]);

    const paymentDetails = useMemo(() => {
        return allPaymentDetails.filter(d =>
            paymentMethodType === 'card'
                ? d.currency === 'BANK_TRANSFER'
                : d.currency !== 'BANK_TRANSFER'
        );
    }, [allPaymentDetails, paymentMethodType]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (totalDeducted > currentBalance) {
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

        if (!receiptFile) {
            setError(t('balance.modals.errorReceipt', 'Будь ласка, завантажте підтвердження платежу'));
            return;
        }

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('amount', amountNum.toString());
            formData.append('payment_method', paymentMethodType);
            formData.append('payment_receipt', receiptFile);
            // @ts-ignore // TODO: Fix this type issue if needed
            formData.append('payment_details', userRequisites);

            await transactionService.requestWithdrawal(formData);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || t('balance.modals.errorWithdraw', 'Сталася помилка. Спробуйте пізніше.'));
        } finally {
            setLoading(false);
        }
    };

    const isLight = theme === 'light';

    return (
        <div className={`fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto ${isLight ? 'bg-gray-900/20' : 'bg-black/80'}`}>
            <div className={`backdrop-blur-xl rounded-sm max-w-md w-full p-6 my-auto border ${
                isLight
                    ? 'bg-white/95 border-gray-200 shadow-2xl'
                    : 'bg-[#0A0A0A]/95 border-white/10'
            }`}>
                <div className="flex items-center justify-between mb-6">
                    <h3 className={`font-serif text-xl flex items-center gap-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                        <ArrowUpCircle className={`w-5 h-5 ${isLight ? 'text-yellow-600' : 'text-yellow-400'}`} />
                        {t('balance.modals.withdrawTitle', 'Запит на виведення коштів')}
                    </h3>
                    <button onClick={onClose} className={`p-2 rounded-sm transition-colors ${
                        isLight ? 'hover:bg-gray-100' : 'hover:bg-white/10'
                    }`}>
                        <X className={`w-5 h-5 ${isLight ? 'text-gray-600' : 'text-gray-400'}`} />
                    </button>
                </div>

                <div className={`mb-4 p-4 rounded-sm border ${
                    isLight ? 'bg-yellow-50 border-yellow-200' : 'bg-yellow-500/10 border-yellow-500/20'
                }`}>
                    <p className={`text-xs font-mono uppercase tracking-wider mb-1 ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>
                        {t('balance.modals.availableToWithdraw', 'Доступно до виведення')}
                    </p>
                    <p className={`text-2xl font-bold font-mono ${isLight ? 'text-gray-900' : 'text-white'}`}>
                        €{currentBalance.toFixed(2)}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className={`p-3 rounded-sm flex items-start gap-3 border ${
                            isLight ? 'bg-red-50 border-red-200' : 'bg-red-950/20 border-red-800'
                        }`}>
                            <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isLight ? 'text-red-600' : 'text-red-400'}`} />
                            <p className={`text-sm font-mono ${isLight ? 'text-red-700' : 'text-red-400'}`}>{error}</p>
                        </div>
                    )}

                    {/* 2. Сумма выводу */}
                    <div>
                        <label className="block text-sm font-medium text-theme-text mb-2">
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
                            className="w-full bg-theme-bg-tertiary border border-theme-border rounded-xl text-sm px-4 py-2.5 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
                            placeholder="100.00"
                        />
                        <p className="text-xs text-theme-text-tertiary mt-1">
                            {t('balance.modals.withdrawMinimum', 'Мінімум')}: €50
                        </p>
                    </div>

                    {/* 3. Реквізити для отримання средств (від користувача) */}
                    <div>
                        <label className="block text-sm font-medium text-theme-text mb-2">
                            {t('balance.modals.userReceivingDetails', 'Ваші реквізити для отримання коштів')}
                        </label>
                        <div className="mb-2">
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethodType('card')}
                                    className={`p-3 rounded-lg border-2 transition-all ${
                                        paymentMethodType === 'card'
                                            ? 'border-primary-500 bg-primary-500/10'
                                            : 'border-theme-border hover:border-theme-border'
                                    }`}
                                >
                                    <CreditCard className="w-5 h-5 mx-auto mb-1 text-theme-text" />
                                    <span className="text-sm text-theme-text">{t('balance.modals.bankCard', 'Банківська карта')}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethodType('crypto')}
                                    className={`p-3 rounded-lg border-2 transition-all ${
                                        paymentMethodType === 'crypto'
                                            ? 'border-primary-500 bg-primary-500/10'
                                            : 'border-theme-border hover:border-theme-border'
                                    }`}
                                >
                                    <Wallet className="w-5 h-5 mx-auto mb-1 text-theme-text" />
                                    <span className="text-sm text-theme-text">{t('balance.modals.cryptoWallet', 'Crypto гаманець')}</span>
                                </button>
                            </div>
                        </div>
                        <textarea
                            rows={3}
                            required
                            value={userRequisites}
                            onChange={(e) => setUserRequisites(e.target.value)}
                            className="w-full bg-theme-bg-tertiary border border-theme-border rounded-xl text-sm px-4 py-2.5 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors font-mono"
                            placeholder={paymentMethodType === 'card' ? 'UA123456789012345678901234567' : '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5'}
                        />
                    </div>

                    {/* 4. Текст (редагований через адмінку) */}
                    {(siteSettings.withdrawal_info || t('balance.modals.withdrawalInfo')) && (
                        <div className={`p-4 rounded-lg border ${isLight ? 'bg-blue-50 border-blue-200' : 'bg-blue-950/20 border-blue-800'}`}>
                            <p className="text-sm text-theme-text leading-relaxed whitespace-pre-line">
                                {siteSettings.withdrawal_info
                                    ? siteSettings.withdrawal_info.replace('{{name}}', userName)
                                    : t('balance.modals.withdrawalInfo', {
                                        name: userName,
                                        defaultValue: 'Здравствуйте, {{name}}.\nСпасибо за доверие и сотрудничество. Мы вышли на этап вывода заработанных средств. Согласно договорённостям, необходимо оплатить 25% за услуги торгового робота.\nПосле внесения оплаты по указанным реквизитам, пожалуйста, отправьте чек.'
                                    })
                                }
                            </p>
                        </div>
                    )}

                    {/* 5. Калькулятор */}
                    <div className="space-y-2 p-4 bg-theme-bg-tertiary rounded-lg border border-theme-border">
                        <div className="flex justify-between items-center text-sm">
                            <p className="text-theme-text-secondary">
                                {t('balance.modals.calc.withdrawAmount', 'Сума виведення')}:
                            </p>
                            <p className="font-medium text-theme-text">
                                €{amountNum.toFixed(2)}
                            </p>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <p className="text-theme-text-secondary">
                                {t('balance.modals.calc.commission', 'Комісія (25%)')}:
                            </p>
                            <p className={`font-medium ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`}>
                                +€{commissionAmount.toFixed(2)}
                            </p>
                        </div>
                        <div className="flex justify-between items-center border-t border-theme-border pt-2 mt-2">
                            <p className="text-sm font-bold text-theme-text">
                                {t('balance.modals.calc.totalDeducted', 'Всього знято з балансу')}:
                            </p>
                            <p className={`text-lg font-bold ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
                                €{totalDeducted.toFixed(2)}
                            </p>
                        </div>
                        <div className="text-xs text-theme-text-tertiary mt-2 text-center">
                            {t('balance.modals.calc.note', 'Ви отримаєте €{amount}, але з вашого балансу буде знято €{total}', {
                                amount: amountNum.toFixed(2),
                                total: totalDeducted.toFixed(2)
                            })}
                        </div>
                    </div>

                    {/* 6. Реквізити для оплати (від платформи) */}
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-theme-text">
                            {paymentMethodType === 'card'
                                ? t('balance.modals.platformPaymentDetails', 'Реквізити для оплати')
                                : t('balance.modals.platformWalletAddress', 'Crypto адреса для оплати')}
                        </label>
                        {paymentDetails.length > 0 ? paymentDetails.map((detail) => (
                            <div key={detail.id} className="p-3 bg-theme-bg-tertiary rounded-lg">
                                <p className="text-xs text-theme-text-tertiary">{detail.currency.replace('_', ' ')} - {detail.network}</p>
                                <div className="flex items-center justify-between mt-1">
                                    <p className="text-sm text-theme-text font-mono break-all">
                                        {detail.bank_details || detail.wallet_address}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(detail.bank_details || detail.wallet_address, detail.id)}
                                        className="p-2 hover:bg-theme-bg-hover rounded-lg flex-shrink-0"
                                    >
                                        {copiedField === detail.id ? <CheckCheck className={`w-4 h-4 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} /> : <Copy className="w-4 h-4 text-theme-text-secondary" />}
                                    </button>
                                </div>
                            </div>
                        )) : <p className="text-sm text-theme-text-secondary">{t('balance.payment.noMethods')}</p>}
                    </div>

                    {/* 7. Чек об оплаті */}
                    <div>
                        <label className="block text-sm font-medium text-theme-text mb-2">
                            {t('balance.modals.receiptLabel', 'Чек об оплаті')}
                        </label>
                        <div className={`border-2 border-dashed border-theme-border rounded-lg p-4 hover:border-primary-500/50 transition-colors cursor-pointer ${receiptFile ? 'bg-primary-500/5' : ''}`}>
                            <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                                className="hidden"
                                id="withdraw-receipt-upload"
                            />
                            <label htmlFor="withdraw-receipt-upload" className="cursor-pointer block text-center">
                                <Upload className="w-6 h-6 text-theme-text-tertiary mx-auto mb-2" />
                                {receiptFile ? (
                                    <p className="text-sm text-primary-500 font-medium">{receiptFile.name}</p>
                                ) : (
                                    <>
                                        <p className="text-sm text-theme-text mb-1">{t('balance.modals.uploadClick', 'Натисніть для завантаження')}</p>
                                        <p className="text-xs text-theme-text-tertiary">{t('balance.modals.uploadHint', 'PNG, JPG або PDF (макс. 10MB)')}</p>
                                    </>
                                )}
                            </label>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || amountNum < 50 || !userRequisites || !receiptFile || totalDeducted > currentBalance}
                        className="w-full bg-primary-500 hover:bg-primary-600 rounded-xl text-white font-medium flex items-center justify-center gap-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? t('balance.modals.requesting', 'Обробка...') : t('balance.modals.requestButton', 'Створити запит')}
                    </button>
                </form>
            </div>
        </div>
    );
}


export default function BalancePage() {
    const { t, i18n } = useTranslation();
    const dispatch = useAppDispatch();
    const location = useLocation(); // ДОДАНО отримання location
    const { user } = useAppSelector((state: RootState) => state.auth);
    const currencyState = useAppSelector((state: RootState) => state.currency);
    const tc = useThemeClasses(); // FIX: Initialize theme classes
    const { theme } = useTheme();
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
    const [depositPaymentType, setDepositPaymentType] = useState<'card' | 'crypto'>('card');
    const [loading2, setLoading2] = useState(false);
    const [error, setError] = useState('');
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [siteSettings, setSiteSettings] = useState<Record<string, string>>({});

    const DEPOSIT_OPTIONS: DepositOption[] = useMemo(() => [
        {
            id: 'basic',
            title: t('balance.depositOptions.basic.title'),
            description: t('balance.depositOptions.basic.description'),
            amount: 250,
            icon: <Bot className="w-6 h-6" />,
            color: 'text-yellow-400',
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
            color: theme === 'dark' ? 'text-green-400' : 'text-green-600',
        },
    ], [t]);

    useEffect(() => {
        loadData();
        // ДОДАНО: Перевірка стану, переданого через navigate
        const locationState = location.state as { openModal?: 'deposit' | 'withdraw' };
        if (locationState?.openModal === 'deposit') {
            setShowDepositModal(true);
            // Очистити стан, щоб модальне вікно не відкривалося при оновленні сторінки
            window.history.replaceState({}, document.title);
        } else if (locationState?.openModal === 'withdraw') {
            setShowWithdrawModal(true);
            // Очистити стан
            window.history.replaceState({}, document.title);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.state]); // ДОДАНО location.state як залежність

    const loadData = async () => {
        try {
            setLoading(true);
            const [transactionsData, statsData, paymentDetailsData, settingsData] = await Promise.all([
                transactionService.getTransactions(),
                transactionService.getStats(),
                adminService.getActivePaymentDetails(),
                adminService.getPublicSettings().catch(() => ({})),
            ]);
            // Only show deposits and withdrawals on balance page
            setTransactions(transactionsData.results?.filter(tx =>
                tx.transaction_type === 'deposit' || tx.transaction_type === 'withdrawal'
            ) || []);
            setStats(statsData);
            setPaymentDetails(paymentDetailsData || []); // Don't filter, show all payment methods
            setSiteSettings(settingsData || {});
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

    const handleModalSuccess = async () => {
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
                payment_method: depositPaymentType,
                payment_receipt: receiptFile
            });
            setShowPaymentModal(false);
            setSelectedOption(null);
            setCustomAmount('');
            setReceiptFile(null);
            setDepositPaymentType('card');
            await handleModalSuccess();
            alert(t('balance.modals.depositSuccess'));
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || t('balance.modals.errorDeposit', 'Сталася помилка'));
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
        const iconColor = (color: string) => theme === 'dark' ? `text-${color}-400` : `text-${color}-600`;
        switch (status) {
            case 'completed': return <CheckCircle className={`w-5 h-5 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />;
            case 'pending': return <Clock className={`w-5 h-5 ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`} />;
            case 'rejected': return <XCircle className={`w-5 h-5 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`} />;
            default: return null;
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: { [key: string]: string } = theme === 'dark' ? {
            completed: 'bg-green-950 text-green-400 border-green-800',
            pending: 'bg-yellow-950 text-yellow-400 border-yellow-800',
            rejected: 'bg-red-950 text-red-400 border-red-800',
        } : {
            completed: 'bg-green-50 text-green-700 border-green-300',
            pending: 'bg-yellow-50 text-yellow-700 border-yellow-300',
            rejected: 'bg-red-50 text-red-700 border-red-300',
        };
        const statusText = t(`balance.status.${status}`, status.charAt(0).toUpperCase() + status.slice(1));
        return <span className={`px-2.5 py-0.5 rounded-md text-xs font-medium border ${styles[status] || styles['pending']}`}>{statusText}</span>;
    };


    if (loading) {
        return (
            <div className="min-h-screen bg-theme-bg text-theme-text">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <Wallet className="w-12 h-12 text-primary-500 animate-pulse mx-auto mb-4" />
                        <p className="text-theme-text-secondary">{t('balance.loading')}</p>
                    </div>
                </div>
            </div>
        );
    }

    const isLight = theme === 'light';

    return (
        <div className={`relative w-full pb-20 font-sans ${isLight ? 'bg-light-bg text-light-text-primary' : 'bg-[#050505] text-[#E0E0E0]'}`}>
            {/* Background decorations */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className={`absolute inset-0 ${isLight
                    ? 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-yellow-200/40 via-light-bg to-light-bg'
                    : 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-yellow-900/20 via-[#050505] to-[#050505]'}`}
                />
                <div className={`absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full animate-pulse border ${
                    isLight ? 'border-yellow-300/60 opacity-40' : 'border-yellow-500/20 opacity-20'
                }`} style={{ animationDuration: '10s' }} />
                <div className={`absolute top-[20%] left-[-10%] w-[120%] h-[1px] -rotate-12 ${
                    isLight ? 'bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent' : 'bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent'
                }`} />
                <div className={`absolute bottom-[-5%] right-[20%] w-[300px] h-[300px] rounded-full blur-3xl ${
                    isLight ? 'bg-yellow-300/20' : 'bg-yellow-900/10'
                }`} />
                <div className={`absolute top-[40%] left-[-5%] w-[200px] h-[200px] rounded-full blur-2xl ${
                    isLight ? 'bg-amber-200/20' : 'bg-amber-900/10'
                }`} />
            </div>

            <div className="relative z-10 w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 pt-16 sm:pt-20 lg:pt-24 flex flex-col gap-8 sm:gap-10 lg:gap-12 xl:gap-16">
                {/* Hero Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12 items-center">
                    <div className="lg:col-span-2 flex flex-col justify-center">
                        <div className={`inline-flex items-center gap-3 px-3 py-1 mb-6 lg:mb-8 rounded-sm w-fit backdrop-blur-sm border ${
                            isLight ? 'border-yellow-200 bg-yellow-100/50' : 'border-yellow-500/20 bg-yellow-500/10'
                        }`}>
                            <Wallet className={`w-3.5 h-3.5 ${isLight ? 'text-yellow-600' : 'text-yellow-400'}`} />
                            <span className={`text-[10px] font-mono font-bold uppercase tracking-[0.2em] ${isLight ? 'text-yellow-700' : 'text-yellow-400'}`}>
                                {t('balance.wallet.title', 'Financial Hub')}
                            </span>
                        </div>

                        <h1 className={`font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-[0.9] mb-3 sm:mb-4 lg:mb-6 tracking-tight ${
                            isLight ? 'text-gray-900' : 'text-white'
                        }`}>
                            {t('balance.title', 'Wallet')}<br />
                            <span className={`italic font-serif ${isLight ? 'text-yellow-600' : 'text-yellow-400'}`}>Management.</span>
                        </h1>

                        <p className={`text-sm sm:text-base lg:text-lg font-mono max-w-xl leading-relaxed pl-3 sm:pl-4 lg:pl-6 border-l ${
                            isLight ? 'text-gray-600 border-yellow-300' : 'text-gray-400 border-yellow-500/20'
                        }`}>
                            {t('balance.subtitle', 'Manage deposits, withdrawals and transaction history.')}<br />
                            {t('balance.subtitle2', 'Your balance is secured and encrypted.')}
                        </p>
                    </div>

                    <div className="hidden lg:flex justify-end items-center">
                        <button
                            onClick={refreshBalance}
                            disabled={refreshing}
                            className={`px-4 sm:px-6 py-2 sm:py-3 font-mono uppercase tracking-wider text-xs sm:text-sm font-bold rounded-sm transition-all flex items-center gap-2 border whitespace-nowrap ${
                                isLight
                                    ? 'bg-gray-100 text-gray-900 border-gray-200 hover:bg-gray-200'
                                    : 'bg-white/5 text-white border-white/10 hover:bg-white/10'
                            } disabled:opacity-50`}
                        >
                            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${refreshing ? 'animate-spin' : ''}`} />
                            {refreshing ? t('balance.refreshing') : t('balance.refresh')}
                        </button>
                    </div>
                </div>

                {/* Mobile Refresh Button */}
                <div className="lg:hidden flex justify-end">
                    <button
                        onClick={refreshBalance}
                        disabled={refreshing}
                        className={`px-4 py-2 font-mono uppercase tracking-wider text-xs font-bold rounded-sm transition-all flex items-center gap-2 border ${
                            isLight
                                ? 'bg-gray-100 text-gray-900 border-gray-200 hover:bg-gray-200'
                                : 'bg-white/5 text-white border-white/10 hover:bg-white/10'
                        } disabled:opacity-50`}
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                        {refreshing ? t('balance.refreshing') : t('balance.refresh')}
                    </button>
                </div>

                {/* Main Content */}
                <div className="space-y-6 sm:space-y-8 lg:space-y-10">
                    {/* Balance and Stats Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                        {/* Balance Card */}
                        <div className={`backdrop-blur-xl p-4 sm:p-6 lg:p-8 rounded-sm relative overflow-hidden group transition-colors border ${
                            isLight
                                ? 'bg-white/80 border-gray-200 hover:border-gray-300 shadow-lg'
                                : 'bg-[#0A0A0A]/60 border-white/10 hover:border-white/20'
                        }`}>
                            <div className={`absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none ${
                                isLight ? 'text-gray-400' : 'text-white'
                            }`}>
                                <Wallet size={120} strokeWidth={0.5} />
                            </div>

                            <div className="relative z-10">
                                <h3 className={`text-xs font-mono uppercase tracking-widest mb-4 ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>
                                    {t('balance.availableBalance')}
                                </h3>
                                <p className={`text-3xl sm:text-4xl lg:text-5xl font-bold font-mono tracking-tighter mb-6 ${
                                    isLight ? 'text-gray-900' : 'text-white'
                                }`}>
                                    {formatCurrency(user?.balance, currencyState)}
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setShowDepositModal(true)}
                                        className={`px-4 py-3 font-mono uppercase tracking-wider text-xs font-bold rounded-sm transition-all flex items-center justify-center gap-2 border ${
                                            isLight
                                                ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
                                                : 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
                                        }`}
                                    >
                                        <ArrowDownCircle className="w-4 h-4" />
                                        {t('balance.deposit')}
                                    </button>
                                    <button
                                        onClick={() => setShowWithdrawModal(true)}
                                        disabled={!user?.balance || parseFloat(user.balance) <= 0}
                                        className={`px-4 py-3 font-mono uppercase tracking-wider text-xs font-bold rounded-sm transition-all flex items-center justify-center gap-2 border ${
                                            isLight
                                                ? 'bg-gray-100 text-gray-900 border-gray-200 hover:bg-gray-200'
                                                : 'bg-white/5 text-white border-white/10 hover:bg-white/10'
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        <ArrowUpCircle className="w-4 h-4" />
                                        {t('balance.withdraw')}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            {stats && (
                                <>
                                    {/* Total Deposits */}
                                    <div className={`backdrop-blur-xl p-4 sm:p-6 rounded-sm transition-colors border ${
                                        isLight
                                            ? 'bg-white/80 border-gray-200 hover:border-gray-300 shadow-lg'
                                            : 'bg-[#0A0A0A]/60 border-white/10 hover:border-white/20'
                                    }`}>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className={`p-2 rounded-sm ${
                                                isLight ? 'bg-emerald-100' : 'bg-emerald-950/30'
                                            }`}>
                                                <ArrowDownCircle className={`w-5 h-5 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                                            </div>
                                            <TrendingUp className={`w-4 h-4 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                                        </div>
                                        <p className={`text-xs font-mono uppercase tracking-wider mb-2 ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>
                                            {t('balance.totalDeposits')}
                                        </p>
                                        <p className={`text-2xl font-bold font-mono ${isLight ? 'text-gray-900' : 'text-white'}`}>
                                            {formatCurrency(stats.total_deposit_amount, currencyState)}
                                        </p>
                                        <p className={`text-xs mt-2 font-mono ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>
                                            {t('balance.operations')}: {stats.total_deposits || 0}
                                        </p>
                                    </div>

                                    {/* Total Withdrawals */}
                                    <div className={`backdrop-blur-xl p-4 sm:p-6 rounded-sm transition-colors border ${
                                        isLight
                                            ? 'bg-white/80 border-gray-200 hover:border-gray-300 shadow-lg'
                                            : 'bg-[#0A0A0A]/60 border-white/10 hover:border-white/20'
                                    }`}>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className={`p-2 rounded-sm ${
                                                isLight ? 'bg-yellow-100' : 'bg-yellow-950/30'
                                            }`}>
                                                <ArrowUpCircle className={`w-5 h-5 ${isLight ? 'text-yellow-600' : 'text-yellow-400'}`} />
                                            </div>
                                            <TrendingUp className={`w-4 h-4 ${isLight ? 'text-yellow-600' : 'text-yellow-400'}`} />
                                        </div>
                                        <p className={`text-xs font-mono uppercase tracking-wider mb-2 ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>
                                            {t('balance.totalWithdrawals')}
                                        </p>
                                        <p className={`text-2xl font-bold font-mono ${isLight ? 'text-gray-900' : 'text-white'}`}>
                                            {formatCurrency(stats.total_withdrawal_amount, currencyState)}
                                        </p>
                                        <p className={`text-xs mt-2 font-mono ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>
                                            {t('balance.operations')}: {stats.total_withdrawals || 0}
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Transaction History */}
                    <div className={`backdrop-blur-xl rounded-sm overflow-hidden border ${
                        isLight
                            ? 'bg-white/80 border-gray-200 shadow-lg'
                            : 'bg-[#0A0A0A]/60 border-white/10'
                    }`}>
                        <div className={`p-5 border-b flex items-center justify-between ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
                            <h3 className={`font-serif text-xl flex items-center gap-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                                <FileText className={`w-5 h-5 ${isLight ? 'text-yellow-600' : 'text-yellow-400'}`} />
                                {t('balance.transactionHistory')}
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className={`border-b ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
                                        <th className={`text-left py-4 px-6 text-xs font-mono uppercase tracking-wider ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>{t('balance.table.type')}</th>
                                        <th className={`text-right py-4 px-6 text-xs font-mono uppercase tracking-wider ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>{t('balance.table.amount')}</th>
                                        <th className={`text-left py-4 px-6 text-xs font-mono uppercase tracking-wider ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>{t('balance.table.method')}</th>
                                        <th className={`text-center py-4 px-6 text-xs font-mono uppercase tracking-wider ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>{t('balance.table.status')}</th>
                                        <th className={`text-left py-4 px-6 text-xs font-mono uppercase tracking-wider ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>{t('balance.table.date')}</th>
                                        <th className={`text-center py-4 px-6 text-xs font-mono uppercase tracking-wider ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>{t('balance.table.receipt')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((tx) => (
                                        <tr key={tx.id} className={`border-b transition-colors cursor-pointer ${
                                            isLight
                                                ? 'border-gray-100 hover:bg-gray-50'
                                                : 'border-white/5 hover:bg-white/5'
                                        }`}>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    {tx.transaction_type === 'deposit' ? (
                                                        <div className={`w-8 h-8 rounded-sm flex items-center justify-center ${
                                                            isLight ? 'bg-emerald-100' : 'bg-emerald-950/30'
                                                        }`}>
                                                            <ArrowDownCircle className={`w-4 h-4 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                                                        </div>
                                                    ) : (
                                                        <div className={`w-8 h-8 rounded-sm flex items-center justify-center ${
                                                            isLight ? 'bg-yellow-100' : 'bg-yellow-950/30'
                                                        }`}>
                                                            <ArrowUpCircle className={`w-4 h-4 ${isLight ? 'text-yellow-600' : 'text-yellow-400'}`} />
                                                        </div>
                                                    )}
                                                    <span className={`font-medium font-mono capitalize ${isLight ? 'text-gray-900' : 'text-white'}`}>
                                                        {t(`balance.types.${tx.transaction_type}`, tx.transaction_type.replace('_', ' '))}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <span className={`text-lg font-bold font-mono ${
                                                    tx.transaction_type === 'deposit'
                                                        ? isLight ? 'text-emerald-600' : 'text-emerald-400'
                                                        : isLight ? 'text-yellow-600' : 'text-yellow-400'
                                                }`}>
                                                    {tx.transaction_type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount, currencyState)}
                                                </span>
                                                {tx.transaction_type === 'withdrawal' && tx.commission && parseFloat(tx.commission) > 0 && (
                                                    <div className={`text-xs font-mono ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>
                                                    {t('balance.commission', 'Комісія')}: {formatCurrency(tx.commission, currencyState)}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    <CreditCard className={`w-4 h-4 ${isLight ? 'text-gray-400' : 'text-gray-600'}`} />
                                                    <span className={`text-sm font-mono capitalize ${isLight ? 'text-gray-900' : 'text-white'}`}>
                                                        {t(`balance.methods.${tx.payment_method}`, tx.payment_method)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {getStatusIcon(tx.status)}
                                                    {getStatusBadge(tx.status)}
                                                </div>
                                            </td>
                                            <td className={`py-4 px-6 text-sm font-mono ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>
                                                {new Date(tx.created_at).toLocaleString(i18n.language, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                {tx.payment_receipt ? (
                                                    <a href={tx.payment_receipt} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1 text-sm font-mono transition-colors ${
                                                        isLight ? 'text-yellow-600 hover:text-yellow-700' : 'text-yellow-400 hover:text-blue-300'
                                                    }`}>
                                                        <FileText className="w-4 h-4" />{t('balance.viewReceipt', 'Просмотр')}
                                                    </a>
                                                ) : (
                                                    <span className={`text-xs font-mono ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {transactions.length === 0 && (
                            <div className="text-center py-16">
                                <div className={`w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full ${
                                    isLight ? 'bg-gray-100' : 'bg-white/5'
                                }`}>
                                    <Wallet className={`w-8 h-8 ${isLight ? 'text-gray-400' : 'text-gray-600'}`} />
                                </div>
                                <p className={`text-lg font-bold mb-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                                    {t('balance.noTransactions.title')}
                                </p>
                                <p className={`text-sm font-mono mb-6 ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>
                                    {t('balance.noTransactions.subtitle')}
                                </p>
                                <button
                                    onClick={() => setShowDepositModal(true)}
                                    className={`px-6 py-3 font-mono uppercase tracking-wider text-xs font-bold rounded-sm transition-all flex items-center justify-center gap-2 mx-auto border ${
                                        isLight
                                            ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
                                            : 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
                                    }`}
                                >
                                    <ArrowDownCircle className="w-4 h-4" />
                                    {t('balance.noTransactions.button')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Deposit Modal Step 1: Package Selection */}
            {showDepositModal && (
                <div className={`fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4 ${theme === 'dark' ? 'bg-black/80' : 'bg-gray-900/20'}`}>
                    <div className={`${tc.cardBg} border ${tc.cardBorder} rounded-3xl max-w-2xl w-full p-6`}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className={`text-2xl font-bold ${tc.textPrimary}`}>{t('balance.modals.selectPackage')}</h3>
                            <button onClick={() => setShowDepositModal(false)} className={`p-2 ${tc.hoverBg} rounded-lg transition-colors`}>
                                <X className={`w-5 h-5 ${tc.textSecondary}`} />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {DEPOSIT_OPTIONS.map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => handleOptionSelect(option)}
                                    className={`${tc.hover} p-4 border-2 ${tc.cardBorder} hover:border-primary-500/50 transition-all text-left group rounded-2xl`}
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={`w-10 h-10 rounded-lg ${tc.hover} flex items-center justify-center ${option.color} group-hover:scale-110 transition-transform`}>{option.icon}</div>
                                        <div>
                                            <h4 className={`font-semibold ${tc.textPrimary}`}>{option.title}</h4>
                                            <p className={`text-sm ${tc.textSecondary}`}>{option.description}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-xl font-bold ${tc.textPrimary}`}>
                                            {option.amount > 0 ? formatCurrency(option.amount, currencyState) : t('balance.modals.fromAmount')}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Deposit Modal Step 2: Payment Details & Upload */}
            {showPaymentModal && selectedOption && (
                <div className={`fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4 ${theme === 'dark' ? 'bg-black/80' : 'bg-gray-900/20'}`}>
                    <div className={`${tc.cardBg} border ${tc.cardBorder} rounded-3xl max-w-lg w-full p-6`}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className={`text-xl font-bold ${tc.textPrimary}`}>{t('balance.modals.depositTitle')}</h3>
                            <button onClick={() => { setShowPaymentModal(false); setSelectedOption(null); setError(''); }} className={`p-2 ${tc.hoverBg} rounded-lg transition-colors`}>
                                <X className={`w-5 h-5 ${tc.textSecondary}`} />
                            </button>
                        </div>
                        {error && (
                            <div className={`p-3 rounded-lg flex items-start gap-3 mb-4 ${theme === 'dark' ? 'bg-red-950 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
                                <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`} />
                                <p className={`text-sm ${theme === 'dark' ? 'text-red-400' : 'text-red-700'}`}>{error}</p>
                            </div>
                        )}

                        {selectedOption.id === 'custom' && (
                            <div className="mb-4">
                                <label className={`block text-sm font-medium ${tc.textPrimary} mb-2`}>{t('balance.modals.amountLabel')} (€)</label>
                                <input
                                    type="number"
                                    min="250"
                                    step="0.01"
                                    value={customAmount}
                                    onChange={(e) => setCustomAmount(e.target.value)}
                                    className={`w-full ${tc.hover} border ${tc.cardBorder} rounded-xl text-sm px-4 py-2.5 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors`}
                                    placeholder="250.00"
                                />
                                <p className={`text-xs ${tc.textTertiary} mt-1`}>{t('balance.modals.minAmount')}: €250</p>
                            </div>
                        )}

                        <div className="mb-4 p-3 bg-primary-500/10 border border-primary-500/20 rounded-lg">
                            <p className="text-sm text-primary-400 font-medium">
                                {t('balance.modals.transferAmount')}: {formatCurrency(getDepositAmount(), currencyState)}
                            </p>
                        </div>

                        {/* Payment Method Type Selector */}
                        <div className="mb-4">
                            <label className={`block text-sm font-medium ${tc.textPrimary} mb-2`}>
                                {t('balance.modals.paymentMethodType', 'Тип способу оплати')}
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setDepositPaymentType('card')}
                                    className={`p-3 rounded-lg border-2 transition-all ${
                                        depositPaymentType === 'card'
                                            ? 'border-primary-500 bg-primary-500/10'
                                            : `border-${tc.cardBorder} hover:border-${tc.cardBorder}`
                                    }`}
                                >
                                    <CreditCard className={`w-5 h-5 mx-auto mb-1 ${tc.textPrimary}`} />
                                    <span className={`text-sm ${tc.textPrimary}`}>{t('balance.modals.bankCard', 'Банківська карта')}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDepositPaymentType('crypto')}
                                    className={`p-3 rounded-lg border-2 transition-all ${
                                        depositPaymentType === 'crypto'
                                            ? 'border-primary-500 bg-primary-500/10'
                                            : `border-${tc.cardBorder} hover:border-${tc.cardBorder}`
                                    }`}
                                >
                                    <Wallet className={`w-5 h-5 mx-auto mb-1 ${tc.textPrimary}`} />
                                    <span className={`text-sm ${tc.textPrimary}`}>{t('balance.modals.cryptoWallet', 'Crypto гаманець')}</span>
                                </button>
                            </div>
                        </div>

                         <div className="space-y-3 mb-4">
                            <label className={`block text-sm font-medium ${tc.textPrimary}`}>
                                {depositPaymentType === 'card'
                                    ? t('balance.payment.cardNumberLabel', 'Номер картки для переказу')
                                    : t('balance.payment.walletAddressLabel', 'Криpto адреса для переказу')}
                            </label>
                            {paymentDetails.filter(d =>
                                depositPaymentType === 'card'
                                    ? d.currency === 'BANK_TRANSFER'
                                    : d.currency !== 'BANK_TRANSFER'
                            ).length > 0 ? paymentDetails.filter(d =>
                                depositPaymentType === 'card'
                                    ? d.currency === 'BANK_TRANSFER'
                                    : d.currency !== 'BANK_TRANSFER'
                            ).map((detail) => (
                                <div key={detail.id} className={`p-3 ${tc.hover} rounded-lg`}>
                                    <p className={`text-xs ${tc.textTertiary}`}>{detail.currency.replace('_', ' ')} - {detail.network}</p>
                                    <div className="flex items-center justify-between mt-1">
                                        <p className={`text-sm ${tc.textPrimary} font-mono break-all`}>
                                            {detail.bank_details || detail.wallet_address}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => copyToClipboard(detail.bank_details || detail.wallet_address, detail.id)}
                                            className={`p-2 ${tc.hoverBg} rounded-lg flex-shrink-0`}
                                        >
                                            {copiedField === detail.id ? <CheckCheck className="w-4 h-4 text-green-400" /> : <Copy className={`w-4 h-4 ${tc.textSecondary}`} />}
                                        </button>
                                    </div>
                                </div>
                            )) : <p className={`text-sm ${tc.textSecondary}`}>{t('balance.payment.noMethods')}</p>}
                        </div>

                        <div className="mb-6">
                            <label className={`block text-sm font-medium ${tc.textPrimary} mb-2`}>{t('balance.modals.receiptLabel')}</label>
                            <div className={`border-2 border-dashed ${tc.cardBorder} rounded-lg p-4 hover:border-primary-500/50 transition-colors cursor-pointer`}>
                                <input type="file" accept="image/*,.pdf" onChange={(e) => setReceiptFile(e.target.files?.[0] || null)} className="hidden" id="receipt-upload" />
                                <label htmlFor="receipt-upload" className="cursor-pointer block text-center">
                                    <Upload className={`w-6 h-6 ${tc.textTertiary} mx-auto mb-2`} />
                                    {receiptFile ? (
                                        <p className="text-sm text-primary-500 font-medium">{receiptFile.name}</p>
                                    ) : (
                                        <>
                                            <p className={`text-sm ${tc.textPrimary} mb-1`}>{t('balance.modals.uploadClick')}</p>
                                            <p className={`text-xs ${tc.textTertiary}`}>{t('balance.modals.uploadHint')}</p>
                                        </>
                                    )}
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleDepositSubmit}
                                disabled={loading2 || getDepositAmount() < 250 || !receiptFile}
                                className="bg-green-600 hover:bg-green-700 rounded-xl text-white font-medium flex items-center justify-center gap-2 flex-1 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading2 ? t('balance.modals.processing') : t('balance.modals.confirmDeposit')}
                            </button>
                            <button
                                onClick={() => { setShowPaymentModal(false); setShowDepositModal(true); }}
                                className={`${tc.hover} border ${tc.border} ${tc.hoverBg} rounded-xl ${tc.textPrimary} font-medium flex items-center justify-center gap-2 py-3 px-4`}
                                disabled={loading2}
                            >
                                {t('balance.modals.back')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showWithdrawModal && (
                <WithdrawModal
                    onClose={() => setShowWithdrawModal(false)}
                    onSuccess={handleModalSuccess}
                    currentBalance={parseFloat(user?.balance || '0')}
                    allPaymentDetails={paymentDetails}
                    copyToClipboard={copyToClipboard}
                    copiedField={copiedField}
                    userName={user?.first_name || user?.email || 'User'}
                    siteSettings={siteSettings}
                />
            )}
        </div>
    );
}