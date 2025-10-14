import { useEffect, useState } from 'react';
import { adminService, AdminUser } from '@/services/adminService';
import { Users, Edit, CheckCircle, XCircle, Search } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [newBalance, setNewBalance] = useState('');
  const [newBotType, setNewBotType] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getUsers();
      setUsers(data.results || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBalance = async (userId: string) => {
    try {
      await adminService.updateUserBalance(userId, { balance: parseFloat(newBalance) });
      await loadUsers();
      setEditingUser(null);
      setNewBalance('');
    } catch (error) {
      console.error('Error updating balance:', error);
      alert('Ошибка обновления баланса');
    }
  };

  const handleUpdateBotType = async (userId: string) => {
    try {
      await adminService.updateUserBotType(userId, { bot_type: newBotType });
      await loadUsers();
      setEditingUser(null);
      setNewBotType('');
    } catch (error) {
      console.error('Error updating bot type:', error);
      alert('Ошибка обновления типа бота');
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-dark-text-secondary">Загрузка пользователей...</p>
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
            <Users className="w-8 h-8 text-primary-500" />
            Управление пользователями
          </h1>
          <p className="text-dark-text-secondary">
            Всего пользователей: {users.length}
          </p>
        </div>
        <button
          onClick={loadUsers}
          className="btn-secondary"
        >
          Обновить
        </button>
      </div>

      {/* Search */}
      <div className="glass-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-text-tertiary" />
          <input
            type="text"
            placeholder="Поиск по email или имени"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text-primary placeholder:text-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-card">
              <tr className="border-b border-dark-border">
                <th className="text-left py-4 px-6 text-xs font-semibold text-dark-text-secondary uppercase">Email</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-dark-text-secondary uppercase">Имя</th>
                <th className="text-right py-4 px-6 text-xs font-semibold text-dark-text-secondary uppercase">Баланс</th>
                <th className="text-center py-4 px-6 text-xs font-semibold text-dark-text-secondary uppercase">Бот</th>
                <th className="text-center py-4 px-6 text-xs font-semibold text-dark-text-secondary uppercase">Статус</th>
                <th className="text-center py-4 px-6 text-xs font-semibold text-dark-text-secondary uppercase">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="table-row">
                  <td className="py-4 px-6">
                    <span className="font-medium text-dark-text-primary">{user.email}</span>
                  </td>
                  <td className="py-4 px-6 text-dark-text-primary">
                    {user.full_name || '—'}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className="text-lg font-bold text-success-500">
                      €{parseFloat(user.balance).toFixed(2)}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`badge ${
                      user.bot_type === 'premium' ? 'badge-success' :
                      user.bot_type === 'basic' ? 'bg-primary-500/10 text-primary-500 border-primary-500/20' :
                      'bg-dark-hover text-dark-text-tertiary border-dark-border'
                    }`}>
                      {user.bot_type === 'none' ? 'Нет' : user.bot_type}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    {user.is_verified ? (
                      <CheckCircle className="w-5 h-5 text-success-500 mx-auto" />
                    ) : (
                      <XCircle className="w-5 h-5 text-danger-500 mx-auto" />
                    )}
                  </td>
                  <td className="py-4 px-6 text-center">
                    <button
                      onClick={() => {
                        setEditingUser(user);
                        setNewBalance(user.balance);
                        setNewBotType(user.bot_type);
                      }}
                      className="btn-secondary py-2 text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      Редактировать
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-dark-text-primary mb-6">
              Редактировать: {editingUser.email}
            </h3>

            <div className="space-y-4">
              {/* Balance */}
              <div>
                <label className="block text-sm font-medium text-dark-text-primary mb-2">
                  Баланс (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newBalance}
                  onChange={(e) => setNewBalance(e.target.value)}
                  className="input-field"
                />
                <button
                  onClick={() => handleUpdateBalance(editingUser.id)}
                  className="btn-success w-full mt-2"
                >
                  Обновить баланс
                </button>
              </div>

              {/* Bot Type */}
              <div>
                <label className="block text-sm font-medium text-dark-text-primary mb-2">
                  Тип бота
                </label>
                <select
                  value={newBotType}
                  onChange={(e) => setNewBotType(e.target.value)}
                  className="input-field"
                >
                  <option value="none">Нет</option>
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                  <option value="specialist">Specialist</option>
                </select>
                <button
                  onClick={() => handleUpdateBotType(editingUser.id)}
                  className="btn-primary w-full mt-2"
                >
                  Обновить тип бота
                </button>
              </div>
            </div>

            <button
              onClick={() => setEditingUser(null)}
              className="btn-secondary w-full mt-6"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
