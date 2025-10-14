import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, AlertCircle, TrendingUp } from 'lucide-react';
import api from '@/shared/config/axios';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: 'admin@exchange.com',
    password: 'admin123',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/api/auth/login/', {
        email: formData.email,
        password: formData.password,
      });

      // Перевірка прав адміністратора
      if (!response.data.user?.is_staff && !response.data.user?.is_superuser) {
        setError('У вас нет прав администратора. Обратитесь к владельцу платформы.');
        setLoading(false);
        return;
      }

      // Зберігаємо токени
      localStorage.setItem('admin_token', response.data.access);
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);

      // Перенаправляємо в адмінку
      navigate('/admin');
    } catch (err: any) {
      console.error('Login error:', err.response?.data);
      setError(err.response?.data?.detail || err.response?.data?.message || 'Ошибка входа. Проверьте email и пароль.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 -left-40 w-80 h-80 bg-danger-500/30 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-0 -right-40 w-80 h-80 bg-danger-600/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(239,68,68,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(239,68,68,0.05)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo & Title */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="w-16 h-16 bg-gradient-to-br from-danger-500 to-danger-600 rounded-2xl flex items-center justify-center shadow-lg shadow-danger-500/50 mx-auto mb-4">
              <Shield className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-dark-text-primary mb-2">
              Admin Panel
            </h1>
            <p className="text-dark-text-secondary">
              Bemo Investment Firm LTD
            </p>
          </div>

          {/* Login Card */}
          <div className="glass-card p-8 animate-slide-in">
            <h2 className="text-2xl font-bold text-dark-text-primary mb-6 text-center">
              Вход для администраторов
            </h2>

            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-4 bg-danger-500/10 border border-danger-500/20 rounded-xl flex items-start gap-3 animate-fade-in">
                <AlertCircle className="w-5 h-5 text-danger-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-danger-500 font-medium">Ошибка входа</p>
                  <p className="text-sm text-danger-500/80 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-dark-text-primary mb-2">
                  Email администратора
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-text-tertiary group-focus-within:text-danger-500 transition-colors" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-field pl-12 focus:ring-danger-500"
                    placeholder="admin@exchange.com"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-dark-text-primary mb-2">
                  Пароль
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-text-tertiary group-focus-within:text-danger-500 transition-colors" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="input-field pl-12 focus:ring-danger-500"
                    placeholder="••••••••"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full btn bg-gradient-to-r from-danger-500 to-danger-600 text-white py-4 text-base font-semibold hover:from-danger-600 hover:to-danger-700 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Вход...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    Войти как администратор
                  </>
                )}
              </button>
            </form>

            {/* Info */}
            <div className="mt-6 p-4 bg-warning-500/10 border border-warning-500/20 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-warning-500" />
                <p className="text-sm font-semibold text-dark-text-primary">
                  Только для администраторов
                </p>
              </div>
              <p className="text-xs text-dark-text-secondary mb-3">
                Доступ только для пользователей с правами is_staff или is_superuser
              </p>
              <div className="bg-dark-bg rounded-lg p-3 border border-dark-border">
                <p className="text-xs text-dark-text-tertiary mb-2">
                  Тестовый админ:
                </p>
                <p className="text-xs text-primary-500 font-mono">
                </p>
              </div>
            </div>

            {/* Back to Site */}
            <div className="mt-6 text-center">
              <button
                onClick={() => navigate('/')}
                className="text-sm text-dark-text-secondary hover:text-dark-text-primary transition-colors inline-flex items-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                Вернуться на сайт
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
