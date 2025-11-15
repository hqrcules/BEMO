import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X, Eye, EyeOff, CreditCard, Wallet } from 'lucide-react';
import { adminService, PaymentDetails } from '@/services/adminService';

type PaymentType = 'card' | 'crypto';

const AdminPaymentDetails: React.FC = () => {
    const [paymentDetails, setPaymentDetails] = useState<PaymentDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [paymentType, setPaymentType] = useState<PaymentType>('card');

    const [newPayment, setNewPayment] = useState({
        cardNumber: '',
        walletAddress: '',
        currency: 'USDT_TRC20',
        network: 'TRC20',
    });

    useEffect(() => {
        loadPaymentDetails();
    }, []);

    const loadPaymentDetails = async () => {
        try {
            setLoading(true);
            const data = await adminService.getPaymentDetails();
            setPaymentDetails(data); // Show all payment details (cards and crypto)
            setError(null);
        } catch (err: any) {
            console.error('Error loading payment details:', err);
            setError('Не удалось загрузить платежные реквизиты');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (paymentType === 'card' && !newPayment.cardNumber.trim()) {
            setError('Номер карты не может быть пустым.');
            return;
        }
        if (paymentType === 'crypto' && !newPayment.walletAddress.trim()) {
            setError('Адрес кошелька не может быть пустым.');
            return;
        }
        try {
            setError(null);
            const dataToCreate = paymentType === 'card' ? {
                currency: 'BANK_TRANSFER',
                bank_details: newPayment.cardNumber,
                wallet_address: '',
                network: 'Card',
                is_active: true,
            } : {
                currency: newPayment.currency,
                bank_details: '',
                wallet_address: newPayment.walletAddress,
                network: newPayment.network,
                is_active: true,
            };
            const created = await adminService.createPaymentDetails(dataToCreate);
            setPaymentDetails([...paymentDetails, created]);
            setNewPayment({ cardNumber: '', walletAddress: '', currency: 'USDT_TRC20', network: 'TRC20' });
            setShowAddForm(false);
            setPaymentType('card');
        } catch (err: any) {
            console.error('Error saving payment details:', err);
            setError('Не удалось сохранить данные.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Вы уверены, что хотите удалить этот платежный метод?')) {
            return;
        }
        try {
            await adminService.deletePaymentDetails(id);
            setPaymentDetails(paymentDetails.filter(item => item.id !== id));
        } catch (err: any) {
            console.error('Error deleting payment details:', err);
            setError('Не удалось удалить платежный метод.');
        }
    };

    const toggleActive = async (payment: PaymentDetails) => {
        try {
             const updated = await adminService.updatePaymentDetails(payment.id, { is_active: !payment.is_active });
             setPaymentDetails(paymentDetails.map(item => item.id === payment.id ? updated : item));
        } catch (err) {
            console.error('Error updating status:', err);
            setError('Не удалось обновить статус.');
        }
    };

    if (loading) {
        return <div className="text-center p-8 text-gray-400">Загрузка...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">Платежные реквизиты</h1>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="btn-primary py-2 px-4 flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    <span>Добавить метод оплаты</span>
                </button>
            </div>

            {error && <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg">{error}</div>}

            {showAddForm && (
                <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Добавить новый метод оплаты</h3>

                    {/* Payment Type Selector */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Тип платежа</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setPaymentType('card')}
                                className={`p-3 rounded-lg border-2 transition-all ${
                                    paymentType === 'card'
                                        ? 'border-primary-500 bg-primary-500/10'
                                        : 'border-gray-600 hover:border-gray-500'
                                }`}
                            >
                                <CreditCard className="w-5 h-5 mx-auto mb-1 text-white" />
                                <span className="text-sm text-white">Банковская карта</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setPaymentType('crypto')}
                                className={`p-3 rounded-lg border-2 transition-all ${
                                    paymentType === 'crypto'
                                        ? 'border-primary-500 bg-primary-500/10'
                                        : 'border-gray-600 hover:border-gray-500'
                                }`}
                            >
                                <Wallet className="w-5 h-5 mx-auto mb-1 text-white" />
                                <span className="text-sm text-white">Криpto кошелек</span>
                            </button>
                        </div>
                    </div>

                    {paymentType === 'card' ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Номер карты</label>
                            <input
                                type="text"
                                value={newPayment.cardNumber}
                                onChange={(e) => setNewPayment({ ...newPayment, cardNumber: e.target.value })}
                                className="input-field"
                                placeholder="Введите номер банковской карты или IBAN"
                            />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Криптовалюта</label>
                                <select
                                    value={newPayment.currency}
                                    onChange={(e) => {
                                        const currency = e.target.value;
                                        let network = 'TRC20';
                                        if (currency === 'USDT_TRC20') network = 'TRC20';
                                        else if (currency === 'USDT_ERC20') network = 'ERC20';
                                        else if (currency === 'BTC') network = 'Bitcoin';
                                        else if (currency === 'ETH') network = 'Ethereum';
                                        setNewPayment({ ...newPayment, currency, network });
                                    }}
                                    className="input-field"
                                >
                                    <option value="USDT_TRC20">USDT (TRC20)</option>
                                    <option value="USDT_ERC20">USDT (ERC20)</option>
                                    <option value="BTC">Bitcoin</option>
                                    <option value="ETH">Ethereum</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Адрес кошелька</label>
                                <input
                                    type="text"
                                    value={newPayment.walletAddress}
                                    onChange={(e) => setNewPayment({ ...newPayment, walletAddress: e.target.value })}
                                    className="input-field font-mono"
                                    placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5"
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex items-center space-x-4 mt-4">
                        <button onClick={handleCreate} className="btn-success py-2 px-4 flex items-center gap-2">
                            <Save className="w-4 h-4" />
                            <span>Сохранить</span>
                        </button>
                        <button
                            onClick={() => {
                                setShowAddForm(false);
                                setPaymentType('card');
                                setNewPayment({ cardNumber: '', walletAddress: '', currency: 'USDT_TRC20', network: 'TRC20' });
                            }}
                            className="btn-secondary py-2 px-4 flex items-center gap-2"
                        >
                            <X className="w-4 h-4" />
                            <span>Отменить</span>
                        </button>
                    </div>
                </div>
            )}

            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-dark-card">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">Тип</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">Валюта/Сеть</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">Реквизиты</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">Статус</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">Действия</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-border">
                            {paymentDetails.map((payment) => (
                                <tr key={payment.id} className="hover:bg-dark-hover">
                                    <td className="px-6 py-4">
                                        {payment.currency === 'BANK_TRANSFER' ? (
                                            <div className="flex items-center gap-2">
                                                <CreditCard className="w-4 h-4 text-primary-400" />
                                                <span className="text-sm text-white">Карта</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <Wallet className="w-4 h-4 text-success-400" />
                                                <span className="text-sm text-white">Crypto</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-300">{payment.currency.replace('_', ' ')}</div>
                                        <div className="text-xs text-gray-500">{payment.network}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-white font-mono break-all max-w-xs">
                                        {payment.bank_details || payment.wallet_address}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button onClick={() => toggleActive(payment)} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${payment.is_active ? 'bg-success-500/10 text-success-400' : 'bg-red-500/10 text-red-400'}`}>
                                            {payment.is_active ? <><Eye className="w-3 h-3" /><span>Активна</span></> : <><EyeOff className="w-3 h-3" /><span>Неактивна</span></>}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button onClick={() => handleDelete(payment.id)} className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {paymentDetails.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-400">
                    Не добавлено ни одного платежного метода.
                </div>
            )}
        </div>
    );
};

export default AdminPaymentDetails;