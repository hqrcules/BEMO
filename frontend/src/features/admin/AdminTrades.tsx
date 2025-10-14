import { useEffect, useState } from 'react';
import { adminService, AdminUser } from '@/services/adminService';
import { Plus, Users, Search } from 'lucide-react';

export default function AdminTrades() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const [tradeData, setTradeData] = useState({
    symbol: 'BTC/USD',
    side: 'buy' as 'buy' | 'sell',
    entry_price: '',
    exit_price: '',
    quantity: '',
  });

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

  const handleCreateTrade = async () => {
    if (!selectedUser) {
      alert('Выберите пользователя');
      return;
    }

    if (!tradeData.entry_price || !tradeData.exit_price || !tradeData.quantity) {
      alert('Заполните все поля');
      return;
    }

    try {
      await adminService.createFakeTrade(selectedUser.id, {
        symbol: tradeData.symbol,
        side: tradeData.side,
        entry_price: parseFloat(tradeData.entry_price),
        exit_price: parseFloat(tradeData.exit_price),
        quantity: parseFloat(tradeData.quantity),
      });

      alert('Фейковая сделка успешно создана!');
      setTradeData({
        symbol: 'BTC/USD',
        side: 'buy',
        entry_price: '',
        exit_price: '',
        quantity: '',
      });
      setSelectedUser(null);
    } catch (error) {
      console.error('Error creating fake trade:', error);
      alert('Ошибка создания сделки');
    }
  };

  const calculateProfit = () => {
    if (!tradeData.entry_price || !tradeData.exit_price || !tradeData.quantity) {
      return 0;
    }
    const entry = parseFloat(tradeData.entry_price);
    const exit = parseFloat(tradeData.exit_price);
    const qty = parseFloat(tradeData.quantity);

    if (tradeData.side === 'buy') {
      return (exit - entry) * qty;
    } else {
      return (entry - exit) * qty;
    }
  };

  const profit = calculateProfit();
  const profitPercent = tradeData.entry_price
    ? (profit / (parseFloat(tradeData.entry_price) * parseFloat(tradeData.quantity || '1'))) * 100
    : 0;

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-dark-text-secondary">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-dark-text-primary mb-2 flex items-center gap-3">
          <Plus className="w-8 h-8 text-success-500" />
          Создание фейковых сделок
        </h1>
        <p className="text-dark-text-secondary">
          Создавайте прибыльные или убыточные сделки для пользователей
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Selection */}
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold text-dark-text-primary mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-500" />
            Выбор пользователя
          </h3>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-text-tertiary" />
            <input
              type="text"
              placeholder="Поиск пользователя"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-dark-text-primary placeholder:text-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Selected User */}
          {selectedUser && (
            <div className="mb-4 p-4 bg-primary-500/10 border border-primary-500/20 rounded-xl">
              <p className="text-xs text-dark-text-tertiary mb-1">Выбран:</p>
              <p className="font-bold text-dark-text-primary">{selectedUser.email}</p>
              <p className="text-sm text-dark-text-secondary mt-1">
                Баланс: €{parseFloat(selectedUser.balance).toFixed(2)}
              </p>
            </div>
          )}

          {/* Users List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className={`w-full text-left p-3 rounded-lg transition-all ${
                  selectedUser?.id === user.id
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-hover text-dark-text-primary hover:bg-dark-border'
                }`}
              >
                <p className="font-medium">{user.email}</p>
                <p className="text-xs opacity-80">
                  {user.full_name || 'Без имени'} • €{parseFloat(user.balance).toFixed(2)}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Trade Form */}
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold text-dark-text-primary mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-success-500" />
            Параметры сделки
          </h3>

          <div className="space-y-4">
            {/* Symbol */}
            <div>
              <label className="block text-sm font-medium text-dark-text-primary mb-2">
                Торговая пара
              </label>
              <input
                type="text"
                value={tradeData.symbol}
                onChange={(e) => setTradeData({ ...tradeData, symbol: e.target.value })}
                className="input-field"
                placeholder="BTC/USD"
              />
            </div>

            {/* Side */}
            <div>
              <label className="block text-sm font-medium text-dark-text-primary mb-2">
                Тип сделки
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setTradeData({ ...tradeData, side: 'buy' })}
                  className={`py-3 rounded-xl font-semibold transition-all ${
                    tradeData.side === 'buy'
                      ? 'bg-gradient-to-r from-success-500 to-success-600 text-white shadow-lg'
                      : 'bg-dark-hover text-dark-text-secondary'
                  }`}
                >
                  BUY
                </button>
                <button
                  onClick={() => setTradeData({ ...tradeData, side: 'sell' })}
                  className={`py-3 rounded-xl font-semibold transition-all ${
                    tradeData.side === 'sell'
                      ? 'bg-gradient-to-r from-danger-500 to-danger-600 text-white shadow-lg'
                      : 'bg-dark-hover text-dark-text-secondary'
                  }`}
                >
                  SELL
                </button>
              </div>
            </div>

            {/* Entry Price */}
            <div>
              <label className="block text-sm font-medium text-dark-text-primary mb-2">
                Цена входа (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={tradeData.entry_price}
                onChange={(e) => setTradeData({ ...tradeData, entry_price: e.target.value })}
                className="input-field"
                placeholder="50000.00"
              />
            </div>

            {/* Exit Price */}
            <div>
              <label className="block text-sm font-medium text-dark-text-primary mb-2">
                Цена выхода (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={tradeData.exit_price}
                onChange={(e) => setTradeData({ ...tradeData, exit_price: e.target.value })}
                className="input-field"
                placeholder="51000.00"
              />
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-dark-text-primary mb-2">
                Количество
              </label>
              <input
                type="number"
                step="0.01"
                value={tradeData.quantity}
                onChange={(e) => setTradeData({ ...tradeData, quantity: e.target.value })}
                className="input-field"
                placeholder="0.1"
              />
            </div>

            {/* Profit Preview */}
            {profit !== 0 && (
              <div className={`p-4 rounded-xl ${
                profit >= 0 
                  ? 'bg-success-500/10 border border-success-500/20' 
                  : 'bg-danger-500/10 border border-danger-500/20'
              }`}>
                <p className="text-xs text-dark-text-tertiary mb-1">Расчетная прибыль:</p>
                <p className={`text-2xl font-bold ${profit >= 0 ? 'text-success-500' : 'text-danger-500'}`}>
                  {profit >= 0 ? '+' : ''}€{profit.toFixed(2)}
                </p>
                <p className={`text-sm ${profit >= 0 ? 'text-success-500' : 'text-danger-500'}`}>
                  {profit >= 0 ? '+' : ''}{profitPercent.toFixed(2)}%
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleCreateTrade}
              disabled={!selectedUser}
              className="w-full btn-success py-4 text-lg"
            >
              <Plus className="w-5 h-5" />
              Создать фейковую сделку
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
