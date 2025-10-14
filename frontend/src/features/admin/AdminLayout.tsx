import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Clock,
  TrendingUp,
  LogOut,
  Shield,
  MessageSquare
} from 'lucide-react';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Пользователи', path: '/admin/users', icon: Users },
    { name: 'Транзакции', path: '/admin/transactions', icon: Clock },
    { name: 'Создать сделки', path: '/admin/trades', icon: TrendingUp },
    { name: 'Поддержка', path: '/admin/support', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Admin Header */}
      <header className="glass-card sticky top-0 z-50 border-b border-dark-border backdrop-blur-xl">
        <div className="w-full px-4">
          <div className="flex items-center justify-between py-3">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-danger-500 to-danger-600 rounded-xl flex items-center justify-center shadow-lg shadow-danger-500/30">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gradient-danger leading-tight">Admin Panel</h1>
                <p className="text-xs text-dark-text-tertiary">Bemo Investment</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <button
                    key={item.name}
                    onClick={() => navigate(item.path)}
                    className={`px-4 py-2 rounded-xl font-medium transition-all text-sm flex items-center gap-2 ${
                      isActive
                        ? 'bg-gradient-to-r from-danger-500 to-danger-600 text-white shadow-lg'
                        : 'text-dark-text-secondary hover:text-dark-text-primary hover:bg-dark-hover'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </button>
                );
              })}
            </nav>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="btn bg-gradient-to-r from-danger-500 to-danger-600 text-white py-2"
            >
              <LogOut className="w-4 h-4" />
              Выход
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </div>
    </div>
  );
}