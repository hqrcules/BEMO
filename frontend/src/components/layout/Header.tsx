import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { logoutUser } from '@/store/slices/authSlice';
import { TrendingUp, Menu, Bell, Wifi, WifiOff, LogOut, Globe } from 'lucide-react';
import { useState, memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from './Sidebar';

const Header = memo(() => {
  const { t, i18n } = useTranslation();
  const { user } = useAppSelector((state) => state.auth);
  const { connected } = useAppSelector((state) => state.websocket);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [langDropdown, setLangDropdown] = useState(false);

  const handleLogout = useCallback(async () => {
    await dispatch(logoutUser());
    navigate('/login');
  }, [dispatch, navigate]);

  const changeLanguage = useCallback((lng: string) => {
    i18n.changeLanguage(lng);
    setLangDropdown(false);
  }, [i18n]);

  const dashboardNavItems = [
    { name: t('nav.home'), path: '/' },
    { name: t('nav.market'), path: '/trading' },
    { name: 'Торговля Ботом', path: '/bot-trading' },
    { name: t('nav.balance'), path: '/balance' },
    { name: t('nav.support'), path: '/support' },
    { name: t('nav.profile'), path: '/profile' },
  ];

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'kk', name: 'Қазақша', flag: '🇰🇿' },
    { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
    { code: 'cs', name: 'Čeština', flag: '🇨🇿' },
  ];




  return (
    <>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-30">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-400 hover:text-white"
              >
                <Menu className="w-6 h-6" />
              </button>

              <div className="flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-blue-500" />
                <span className="text-white font-bold text-xl">Bemo Investment</span>
              </div>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              {dashboardNavItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`px-4 py-2 rounded-lg transition ${
                    location.pathname === item.path
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-4">
              {connected ? (
                <Wifi className="w-5 h-5 text-green-500" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-500" />
              )}

              {/* Language Switcher */}
              <div className="relative">
                <button
                  onClick={() => setLangDropdown(!langDropdown)}
                  className="text-gray-400 hover:text-white flex items-center gap-2"
                >
                  <Globe className="w-5 h-5" />
                </button>

                {langDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setLangDropdown(false)}
                    />
                    <div className="absolute right-0 mt-2 w-40 bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden z-50">
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => changeLanguage(lang.code)}
                          className={`w-full px-4 py-3 text-left hover:bg-gray-700 transition flex items-center gap-2 ${
                            i18n.language === lang.code ? 'bg-gray-700 text-white' : 'text-gray-300'
                          }`}
                        >
                          <span>{lang.flag}</span>
                          <span>{lang.name}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <button className="relative text-gray-400 hover:text-white">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 transition"
                >
                  <div className="text-right">
                    <p className="text-white text-sm font-medium">{user?.email}</p>
                    <p className="text-gray-400 text-xs">${user?.balance}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    {user?.email?.[0].toUpperCase()}
                  </div>
                </button>

                {dropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden z-50">
                      <button
                        onClick={() => {
                          navigate('/profile');
                          setDropdownOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left text-gray-300 hover:bg-gray-700 transition"
                      >
                        {t('nav.profile')}
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-3 text-left text-red-400 hover:bg-red-500/10 transition flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        {t('auth.logout')}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
});

Header.displayName = 'Header';

export default Header;