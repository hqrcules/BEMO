import { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { fetchUserProfile } from '@/store/slices/authSlice';
import { transactionService, Transaction, TransactionStats } from '@/services/transactionService';
import { adminService, PaymentDetails } from '@/services/adminService';
import { profileService, UserProfileData } from '@/services/profileService';
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
    Save,
    Edit,
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
}: {
    onClose: () => void;
    onSuccess: () => void;
    currentBalance: number;
    allPaymentDetails: PaymentDetails[];
    copyToClipboard: (text: string, field: string) => Promise<void>;
    copiedField: string | null;
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

    return (
        <div className={`fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto ${theme === 'dark' ? 'bg-black/80' : 'bg-gray-900/20'}`}>
            <div className="bg-theme-bg-secondary border border-theme-border rounded-3xl max-w-md w-full p-6 my-auto">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-theme-text flex items-center gap-2">
                        <ArrowUpCircle className="w-5 h-5 text-primary-500" />
                        {t('balance.modals.withdrawTitle', 'Запит на виведення коштів')}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-theme-bg-hover rounded-lg transition-colors">
                        <X className="w-5 h-5 text-theme-text-secondary" />
                    </button>
                </div>

                <div className="mb-4 p-4 bg-primary-500/10 border border-primary-500/20 rounded-lg">
                    <p className="text-sm text-theme-text-secondary mb-1">
                        {t('balance.modals.availableToWithdraw', 'Доступно до виведення')}
                    </p>
                    <p className="text-2xl font-bold text-theme-text">
                        €{currentBalance.toFixed(2)}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className={`p-3 rounded-lg flex items-start gap-3 ${theme === 'dark' ? 'bg-red-950 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
                            <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`} />
                            <p className={`text-sm ${theme === 'dark' ? 'text-red-400' : 'text-red-700'}`}>{error}</p>
                        </div>
                    )}

                    {/* Payment Method Type Selector */}
                    <div>
                        <label className="block text-sm font-medium text-theme-text mb-2">
                            {t('balance.modals.paymentMethodType', 'Тип способу оплати')}
                        </label>
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

                     <div className="space-y-3">
                        <label className="block text-sm font-medium text-theme-text">
                            {paymentMethodType === 'card'
                                ? t('balance.payment.cardNumberLabel', 'Номер картки для переказу')
                                : t('balance.payment.walletAddressLabel', 'Криpto адреса для переказу')}
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

                    <div>
                        <label className="block text-sm font-medium text-theme-text mb-2">
                            {paymentMethodType === 'card'
                                ? t('balance.modals.yourRequisites', 'Ваші реквізити (IBAN / Карта)')
                                : t('balance.modals.yourWalletAddress', 'Ваша криpto адреса')}
                        </label>
                        <textarea
                            rows={3}
                            required
                            value={userRequisites}
                            onChange={(e) => setUserRequisites(e.target.value)}
                            className="w-full bg-theme-bg-tertiary border border-theme-border rounded-xl text-sm px-4 py-2.5 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors font-mono"
                            placeholder={paymentMethodType === 'card' ? 'UA123456789012345678901234567' : '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5'}
                        />
                    </div>

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

                    {/* Photo Upload */}
                    <div>
                        <label className="block text-sm font-medium text-theme-text mb-2">
                            {t('balance.modals.receiptLabel', 'Підтвердження оплати')}
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

    // Wallet states
    const [profileData, setProfileData] = useState<UserProfileData | null>(null);
    const [walletAddress, setWalletAddress] = useState('');
    const [isEditingWallet, setIsEditingWallet] = useState(false);
    const [walletLoading, setWalletLoading] = useState(false);
    const [walletError, setWalletError] = useState('');
    const [walletSuccess, setWalletSuccess] = useState('');

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
            const [transactionsData, statsData, paymentDetailsData, profileDetailsData] = await Promise.all([
                transactionService.getTransactions(),
                transactionService.getStats(),
                adminService.getActivePaymentDetails(),
                profileService.getProfileDetails(),
            ]);
            // Only show deposits and withdrawals on balance page
            setTransactions(transactionsData.results?.filter(tx =>
                tx.transaction_type === 'deposit' || tx.transaction_type === 'withdrawal'
            ) || []);
            setStats(statsData);
            setPaymentDetails(paymentDetailsData || []); // Don't filter, show all payment methods
            setProfileData(profileDetailsData);
            setWalletAddress(profileDetailsData.wallet_address || '');
        } catch (error) {
            console.error('Error loading balance data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveWallet = async () => {
        try {
            setWalletLoading(true);
            setWalletError('');
            setWalletSuccess('');

            const response = await profileService.updateWalletAddress({
                wallet_address: walletAddress,
            });

            setProfileData(response.data);
            setWalletSuccess(t('balance.wallet.successSaved', 'Wallet address saved successfully!'));
            setIsEditingWallet(false);

            // Clear success message after 3 seconds
            setTimeout(() => {
                setWalletSuccess('');
            }, 3000);
        } catch (err: any) {
            setWalletError(err.response?.data?.error?.wallet_address?.[0] || err.message || t('balance.wallet.errorSaving', 'Error saving wallet address'));
        } finally {
            setWalletLoading(false);
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

    return (
        <div className="min-h-screen bg-theme-bg text-theme-text">
            <div className="max-w-8xl mx-auto">

                {/* --- Header --- */}
                <div className="w-full border-b border-theme-border bg-theme-bg-secondary backdrop-blur-sm">
                    <div className="w-full px-6 py-6">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl sm:text-4xl font-extralight text-theme-text tracking-tight mb-1 flex items-center gap-3">
                                    <Wallet className="w-8 h-8 text-primary-500" />
                                    {t('balance.title')}
                                </h1>
                                <p className="text-base text-theme-text-tertiary font-light">{t('balance.subtitle')}</p>
                            </div>
                            <button
                                onClick={refreshBalance}
                                disabled={refreshing}
                                className="bg-theme-bg-tertiary border border-theme-border hover:bg-theme-bg-hover rounded-xl text-theme-text font-medium flex items-center justify-center gap-2 py-2 px-4 transition-all duration-300"
                            >
                                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                                {refreshing ? t('balance.refreshing') : t('balance.refresh')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- Main Content --- */}
                <div className="w-full px-6 py-8 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1">
                            {/* Картка балансу зі стилями, що відповідають DashboardHome, але без градієнта */}
                            <div className="bg-theme-bg-secondary border border-theme-border rounded-3xl p-6 border-primary-500/30">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/50">
                                        <DollarSign className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-theme-text-secondary">{t('balance.availableBalance')}</p>
                                        <p className="text-xs text-theme-text-tertiary">Bemo Investment</p>
                                    </div>
                                </div>
                                <p className="text-5xl font-extralight text-theme-text tracking-tight mb-6">
                                    {formatCurrency(user?.balance, currencyState)}
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setShowDepositModal(true)}
                                        className="bg-green-600 hover:bg-green-700 rounded-xl text-white font-medium flex items-center justify-center gap-2 py-3 text-sm transition-all duration-300"
                                    >
                                        <ArrowDownCircle className="w-4 h-4" />
                                        {t('balance.deposit')}
                                    </button>
                                    <button
                                        onClick={() => setShowWithdrawModal(true)}
                                        disabled={!user?.balance || parseFloat(user.balance) <= 0}
                                        className="bg-theme-bg-tertiary border border-theme-border hover:bg-theme-bg-hover rounded-xl text-theme-text font-medium flex items-center justify-center gap-2 py-3 text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                    <div className="bg-theme-bg-secondary border border-theme-border rounded-3xl p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${theme === 'dark' ? 'bg-green-950' : 'bg-green-100'}`}>
                                                <ArrowDownCircle className={`w-5 h-5 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
                                            </div>
                                            <TrendingUp className={`w-4 h-4 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
                                        </div>
                                        <p className="text-sm text-theme-text-secondary mb-1">{t('balance.totalDeposits')}</p>
                                        <p className="text-2xl font-bold text-theme-text">
                                            {formatCurrency(stats.total_deposit_amount, currencyState)}
                                        </p>
                                        <p className="text-xs text-theme-text-tertiary mt-2">
                                            {t('balance.operations')}: {stats.total_deposits || 0}
                                        </p>
                                    </div>
                                    <div className="bg-theme-bg-secondary border border-theme-border rounded-3xl p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="w-10 h-10 bg-primary-500/10 rounded-lg flex items-center justify-center">
                                                <ArrowUpCircle className="w-5 h-5 text-primary-500" />
                                            </div>
                                            <TrendingUp className="w-4 h-4 text-primary-500" />
                                        </div>
                                        <p className="text-sm text-theme-text-secondary mb-1">{t('balance.totalWithdrawals')}</p>
                                        <p className="text-2xl font-bold text-theme-text">
                                            {formatCurrency(stats.total_withdrawal_amount, currencyState)}
                                        </p>
                                        <p className="text-xs text-theme-text-tertiary mt-2">
                                            {t('balance.operations')}: {stats.total_withdrawals || 0}
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Wallet Section */}
                    <div className="bg-theme-bg-secondary border border-theme-border rounded-3xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-theme-text flex items-center gap-2">
                                <Wallet className="w-5 h-5 text-primary-500" />
                                {t('balance.wallet.title', 'Withdrawal Details')}
                            </h3>
                        </div>

                        <p className="text-sm text-theme-text-secondary mb-4">
                            {t('balance.wallet.description', 'Add your cryptocurrency wallet address to receive withdrawals.')}
                        </p>

                        {walletSuccess && (
                            <div className={`p-3 rounded-lg flex items-start gap-3 mb-4 ${theme === 'dark' ? 'bg-green-950 border border-green-800' : 'bg-green-50 border border-green-200'}`}>
                                <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
                                <p className={`text-sm ${theme === 'dark' ? 'text-green-400' : 'text-green-700'}`}>{walletSuccess}</p>
                            </div>
                        )}

                        {walletError && (
                            <div className={`p-3 rounded-lg flex items-start gap-3 mb-4 ${theme === 'dark' ? 'bg-red-950 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
                                <AlertCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`} />
                                <p className={`text-sm ${theme === 'dark' ? 'text-red-400' : 'text-red-700'}`}>{walletError}</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            {!isEditingWallet && profileData?.wallet_address ? (
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 bg-theme-bg-tertiary border border-theme-border rounded-xl p-4">
                                        <p className="text-xs text-theme-text-tertiary mb-1">
                                            {t('balance.wallet.currentAddress', 'Current Wallet Address')}
                                        </p>
                                        <p className="text-theme-text font-mono break-all">
                                            {profileData.wallet_address}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(profileData.wallet_address, 'wallet')}
                                        className="bg-theme-bg-tertiary border border-theme-border hover:bg-theme-bg-hover rounded-xl p-4 transition-colors"
                                        title={t('balance.wallet.copy', 'Copy address')}
                                    >
                                        {copiedField === 'wallet' ? (
                                            <CheckCheck className="w-5 h-5 text-green-400" />
                                        ) : (
                                            <Copy className="w-5 h-5 text-theme-text-secondary" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setIsEditingWallet(true)}
                                        className="bg-primary-500 hover:bg-primary-600 rounded-xl p-4 transition-colors"
                                        title={t('balance.wallet.edit', 'Edit address')}
                                    >
                                        <Edit className="w-5 h-5 text-white" />
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-theme-text">
                                        {t('balance.wallet.addressLabel', 'Cryptocurrency Wallet Address')}
                                    </label>
                                    <input
                                        type="text"
                                        value={walletAddress}
                                        onChange={(e) => setWalletAddress(e.target.value)}
                                        placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5"
                                        className="w-full bg-theme-bg-tertiary border border-theme-border rounded-xl text-sm px-4 py-3 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors font-mono"
                                    />
                                    <p className="text-xs text-theme-text-tertiary">
                                        {t('balance.wallet.hint', 'Enter a valid cryptocurrency wallet address for withdrawals')}
                                    </p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleSaveWallet}
                                            disabled={walletLoading || !walletAddress.trim()}
                                            className="bg-primary-500 hover:bg-primary-600 rounded-xl text-white font-medium flex items-center justify-center gap-2 px-6 py-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Save className="w-4 h-4" />
                                            {walletLoading ? t('balance.wallet.saving', 'Saving...') : t('balance.wallet.save', 'Save Address')}
                                        </button>
                                        {isEditingWallet && (
                                            <button
                                                onClick={() => {
                                                    setIsEditingWallet(false);
                                                    setWalletAddress(profileData?.wallet_address || '');
                                                    setWalletError('');
                                                }}
                                                className="bg-theme-bg-tertiary border border-theme-border hover:bg-theme-bg-hover rounded-xl text-theme-text font-medium px-6 py-3 transition-colors"
                                            >
                                                {t('balance.wallet.cancel', 'Cancel')}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-theme-bg-secondary border border-theme-border rounded-3xl overflow-hidden">
                        <div className="p-6 border-b border-theme-border flex items-center justify-between">
                            <h3 className="text-xl font-bold text-theme-text flex items-center gap-2">
                                <FileText className="w-5 h-5 text-primary-500" />
                                {t('balance.transactionHistory')}
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-theme-bg-tertiary">
                                    <tr className="border-b border-theme-border">
                                        <th className="text-left py-4 px-6 text-xs font-semibold text-theme-text-tertiary uppercase">{t('balance.table.type')}</th>
                                        <th className="text-right py-4 px-6 text-xs font-semibold text-theme-text-tertiary uppercase">{t('balance.table.amount')}</th>
                                        <th className="text-left py-4 px-6 text-xs font-semibold text-theme-text-tertiary uppercase">{t('balance.table.method')}</th>
                                        <th className="text-center py-4 px-6 text-xs font-semibold text-theme-text-tertiary uppercase">{t('balance.table.status')}</th>
                                        <th className="text-left py-4 px-6 text-xs font-semibold text-theme-text-tertiary uppercase">{t('balance.table.date')}</th>
                                        <th className="text-center py-4 px-6 text-xs font-semibold text-theme-text-tertiary uppercase">{t('balance.table.receipt')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((tx) => (
                                        <tr key={tx.id} className="border-b border-theme-border hover:bg-theme-bg-hover transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    {tx.transaction_type === 'deposit' ? (
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${theme === 'dark' ? 'bg-green-950' : 'bg-green-100'}`}>
                                                            <ArrowDownCircle className={`w-4 h-4 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
                                                        </div>
                                                    ) : (
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${theme === 'dark' ? 'bg-primary-500/10' : 'bg-primary-100'}`}>
                                                            <ArrowUpCircle className={`w-4 h-4 ${theme === 'dark' ? 'text-primary-500' : 'text-primary-600'}`} />
                                                        </div>
                                                    )}
                                                    <span className="font-medium text-theme-text capitalize">{t(`balance.types.${tx.transaction_type}`, tx.transaction_type.replace('_', ' '))}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <span className={`text-lg font-bold ${tx.transaction_type === 'deposit' ? 'text-green-400' : 'text-primary-500'}`}>
                                                    {tx.transaction_type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount, currencyState)}
                                                </span>
                                                {tx.transaction_type === 'withdrawal' && tx.commission && parseFloat(tx.commission) > 0 && (
                                                    <div className="text-xs text-theme-text-tertiary">
                                                    {t('balance.commission', 'Комісія')}: {formatCurrency(tx.commission, currencyState)}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    <CreditCard className="w-4 h-4 text-theme-text-tertiary" />
                                                    <span className="text-sm text-theme-text capitalize">
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
                                            <td className="py-4 px-6 text-sm text-theme-text-tertiary">
                                                {new Date(tx.created_at).toLocaleString(i18n.language, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                {tx.payment_receipt ? (
                                                    <a href={tx.payment_receipt} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary-500 hover:text-primary-400 text-sm">
                                                        <FileText className="w-4 h-4" />{t('balance.viewReceipt', 'Просмотр')}
                                                    </a>
                                                ) : (
                                                    <span className="text-xs text-theme-text-tertiary">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {transactions.length === 0 && (
                            <div className="text-center py-16">
                                <Wallet className="w-16 h-16 text-theme-text-tertiary mx-auto mb-4 opacity-50" />
                                <p className="text-theme-text-secondary text-lg font-medium mb-2">{t('balance.noTransactions.title')}</p>
                                <p className="text-sm text-theme-text-tertiary mb-6">{t('balance.noTransactions.subtitle')}</p>
                                <button
                                    onClick={() => setShowDepositModal(true)}
                                    className="bg-primary-500 hover:bg-primary-600 rounded-xl text-white font-medium flex items-center justify-center gap-2 px-6 py-3"
                                >
                                    <ArrowDownCircle className="w-5 h-5" />{t('balance.noTransactions.button')}
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
                />
            )}
        </div>
    );
}