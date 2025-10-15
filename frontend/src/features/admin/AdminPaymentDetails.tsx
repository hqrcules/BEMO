import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Save, X, Eye, EyeOff } from 'lucide-react';
import { adminService, PaymentDetails } from '@/services/adminService';

const AdminPaymentDetails: React.FC = () => {
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPayment, setNewPayment] = useState<Omit<PaymentDetails, 'id' | 'created_at' | 'updated_at' | 'updated_by' | 'updated_by_email'>>({
    currency: '',
    wallet_address: '',
    bank_details: '',
    network: '',
    is_active: true
  });

  useEffect(() => {
    loadPaymentDetails();
  }, []);

  const loadPaymentDetails = async () => {
    try {
      setLoading(true);
      const data = await adminService.getPaymentDetails();
      setPaymentDetails(data);
      setError(null);
    } catch (err: any) {
      console.error('Error loading payment details:', err);
      setError('Failed to load payment details');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const created = await adminService.createPaymentDetails(newPayment);
      setPaymentDetails([...paymentDetails, created]);
      setNewPayment({
        currency: '',
        wallet_address: '',
        bank_details: '',
        network: '',
        is_active: true
      });
      setShowAddForm(false);
    } catch (err: any) {
      console.error('Error creating payment details:', err);
      setError('Failed to create payment details');
    }
  };

  const handleUpdate = async (id: string, updatedData: Partial<PaymentDetails>) => {
    try {
      const updated = await adminService.updatePaymentDetails(id, updatedData);
      setPaymentDetails(paymentDetails.map(item => item.id === id ? updated : item));
      setEditingId(null);
    } catch (err: any) {
      console.error('Error updating payment details:', err);
      setError('Failed to update payment details');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) {
      return;
    }

    try {
      await adminService.deletePaymentDetails(id);
      setPaymentDetails(paymentDetails.filter(item => item.id !== id));
    } catch (err: any) {
      console.error('Error deleting payment details:', err);
      setError('Failed to delete payment details');
    }
  };

  const toggleActive = async (payment: PaymentDetails) => {
    await handleUpdate(payment.id, { is_active: !payment.is_active });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Payment Details</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Payment Method</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Add New Payment Method</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Currency</label>
              <input
                type="text"
                value={newPayment.currency}
                onChange={(e) => setNewPayment({ ...newPayment, currency: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., EUR, USD, BTC"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Network</label>
              <input
                type="text"
                value={newPayment.network}
                onChange={(e) => setNewPayment({ ...newPayment, network: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Ethereum, Bitcoin, SEPA"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Wallet Address</label>
              <input
                type="text"
                value={newPayment.wallet_address}
                onChange={(e) => setNewPayment({ ...newPayment, wallet_address: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Wallet address or account number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Bank Details</label>
              <input
                type="text"
                value={newPayment.bank_details}
                onChange={(e) => setNewPayment({ ...newPayment, bank_details: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Bank name, SWIFT, etc."
              />
            </div>
          </div>
          <div className="flex items-center space-x-4 mt-4">
            <button
              onClick={handleCreate}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save</span>
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      )}

      {/* Payment Details List */}
      <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Currency</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Network</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Wallet Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Bank Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {paymentDetails.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {payment.currency}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {payment.network}
                  </td>
                  <td className="px-6 py-4 text-sm text-white max-w-xs truncate">
                    {payment.wallet_address}
                  </td>
                  <td className="px-6 py-4 text-sm text-white max-w-xs truncate">
                    {payment.bank_details}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleActive(payment)}
                      className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${
                        payment.is_active
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {payment.is_active ? (
                        <>
                          <Eye className="w-3 h-3" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3" />
                          <span>Inactive</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingId(payment.id)}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(payment.id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {paymentDetails.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-400">
          No payment methods configured yet.
        </div>
      )}
    </div>
  );
};

export default AdminPaymentDetails;
