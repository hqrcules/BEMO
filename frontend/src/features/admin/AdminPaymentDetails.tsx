import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X, Eye, EyeOff } from 'lucide-react';
import { adminService, PaymentDetails } from '@/services/adminService';

const AdminPaymentDetails: React.FC = () => {
    const [paymentDetails, setPaymentDetails] = useState<PaymentDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);

    const [newCard, setNewCard] = useState({
        cardNumber: '',
    });

    useEffect(() => {
        loadPaymentDetails();
    }, []);

    const loadPaymentDetails = async () => {
        try {
            setLoading(true);
            const data = await adminService.getPaymentDetails();
            setPaymentDetails(data.filter(d => d.currency === 'BANK_TRANSFER'));
            setError(null);
        } catch (err: any) {
            console.error('Error loading payment details:', err);
            setError('Не удалось загрузить платежные реквизиты');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newCard.cardNumber.trim()) {
            setError('Номер карты не может быть пустым.');
            return;
        }
        try {
            setError(null);
            const dataToCreate = {
                currency: 'BANK_TRANSFER',
                bank_details: newCard.cardNumber,
                wallet_address: '',
                network: 'Card',
                is_active: true,
            };
            const created = await adminService.createPaymentDetails(dataToCreate);
            setPaymentDetails([...paymentDetails, created]);
            setNewCard({ cardNumber: '' });
            setShowAddForm(false);
        } catch (err: any) {
            console.error('Error saving payment details:', err);
            setError('Не удалось сохранить карту.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Вы уверены, что хотите удалить эту карту?')) {
            return;
        }
        try {
            await adminService.deletePaymentDetails(id);
            setPaymentDetails(paymentDetails.filter(item => item.id !== id));
        } catch (err: any) {
            console.error('Error deleting payment details:', err);
            setError('Не удалось удалить карту.');
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
                <h1 className="text-2xl font-bold text-white">Банковские карты для пополнения</h1>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="btn-primary py-2 px-4 flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    <span>Добавить карту</span>
                </button>
            </div>

            {error && <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg">{error}</div>}

            {showAddForm && (
                <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Добавить новую карту</h3>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Номер карты</label>
                        <input
                            type="text"
                            value={newCard.cardNumber}
                            onChange={(e) => setNewCard({ cardNumber: e.target.value })}
                            className="input-field"
                            placeholder="Введите номер банковской карты"
                        />
                    </div>
                    <div className="flex items-center space-x-4 mt-4">
                        <button onClick={handleCreate} className="btn-success py-2 px-4"><Save className="w-4 h-4" /><span>Сохранить</span></button>
                        <button onClick={() => setShowAddForm(false)} className="btn-secondary py-2 px-4"><X className="w-4 h-4" /><span>Отменить</span></button>
                    </div>
                </div>
            )}

            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-dark-card">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">Номер карты</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">Статус</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-dark-text-secondary uppercase tracking-wider">Действия</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-border">
                            {paymentDetails.map((payment) => (
                                <tr key={payment.id} className="hover:bg-dark-hover">
                                    <td className="px-6 py-4 text-sm text-white font-mono">{payment.bank_details}</td>
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
                    Не добавлено ни одной карты для пополнения.
                </div>
            )}
        </div>
    );
};

export default AdminPaymentDetails;