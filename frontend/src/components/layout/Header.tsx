import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { logoutUser } from '@/store/slices/authSlice';
import { TrendingUp, Menu, Bell, Wifi, WifiOff, LogOut, Globe, Wallet } from 'lucide-react';
import { useState, memo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from './Sidebar';
import CurrencySelector from '@/components/CurrencySelector';
import { fetchCurrencyRates } from '@/store/slices/currencySlice';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import { RootState } from '@/store/store';

const Header = memo(() => {
    const { t, i18n } = useTranslation();
    const { user } = useAppSelector((state: RootState) => state.auth);
    const { connected } = useAppSelector((state: RootState) => state.websocket);
    const currencyState = useAppSelector((state: RootState) => state.currency);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [langDropdown, setLangDropdown] = useState(false);

    useEffect(() => {
        dispatch(fetchCurrencyRates());
    }, [dispatch]);

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

            <header className="bg-dark-card border-b border-dark-border sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        {/* Left Side: Logo & Burger Menu */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden text-dark-text-secondary hover:text-dark-text-primary p-2 -ml-2" // Added padding
                                aria-label="Open menu"
                            >
                                <Menu className="w-6 h-6" />
                            </button>

                            <div
                                className="flex items-center gap-2 cursor-pointer group" // Added group for potential hover effects
                                onClick={() => navigate('/')}
                            >
                                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-glow-primary transition-shadow duration-300"> {/* Styled logo icon */}
                                    <TrendingUp className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-dark-text-primary font-bold text-xl hidden sm:inline"> {/* Hid text on very small screens */}
                                    Bemo Investment
                                </span>
                            </div>
                        </div>

                        {/* Center: Navigation */}
                        <nav className="hidden md:flex items-center gap-1">
                            {dashboardNavItems.map((item) => (
                                <button
                                    key={item.path}
                                    onClick={() => navigate(item.path)}
                                    className={`px-4 py-2 rounded-lg transition text-sm font-medium relative group ${location.pathname === item.path
                                        ? 'text-dark-text-primary' // Active text color slightly brighter
                                        : 'text-dark-text-secondary hover:text-dark-text-primary hover:bg-dark-hover'
                                        }`}
                                >
                                    {item.name}
                                    {/* Underline animation for active/hover */}
                                    <span className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-primary-500 transition-all duration-300 group-hover:w-4/5 ${location.pathname === item.path ? 'w-4/5' : 'w-0'}`}></span>
                                </button>
                            ))}
                        </nav>

                        {/* Right Side: Controls & User Menu */}
                        <div className="flex items-center gap-4">
                            {/* Connection Status */}
                            <span title={connected ? "WebSocket Connected" : "WebSocket Disconnected"}>
                                {connected ? (
                                    <Wifi className="w-5 h-5 text-success-500" />
                                ) : (
                                    <WifiOff className="w-5 h-5 text-danger-500" />
                                )}
                            </span>

                            {/* Currency Selector */}
                            <CurrencySelector />

                            {/* Language Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setLangDropdown(!langDropdown)}
                                    className="text-dark-text-secondary hover:text-dark-text-primary p-2 rounded-lg hover:bg-dark-hover transition-colors" // Added padding and hover bg
                                    aria-label="Change language"
                                >
                                    <Globe className="w-5 h-5" />
                                </button>
                                {langDropdown && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40 bg-transparent"
                                            onClick={() => setLangDropdown(false)}
                                        />
                                        <div className="absolute right-0 mt-2 w-48 bg-dark-card rounded-lg shadow-xl border border-dark-border overflow-hidden z-50 animate-fade-in max-h-60 overflow-y-auto"> {/* Added max-height and scroll */}
                                            {languages.map((lang) => (
                                                <button
                                                    key={lang.code}
                                                    onClick={() => changeLanguage(lang.code)}
                                                    className={`w-full px-4 py-3 text-left hover:bg-dark-hover transition flex items-center gap-3 text-sm ${i18n.language === lang.code ? 'bg-dark-hover text-dark-text-primary' : 'text-dark-text-secondary'
                                                        }`}
                                                >
                                                    <span className="text-lg">{lang.flag}</span>
                                                    <span>{lang.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Notifications */}
                            <button className="relative text-dark-text-secondary hover:text-dark-text-primary p-2 rounded-lg hover:bg-dark-hover transition-colors" aria-label="Notifications"> {/* Added padding and hover bg */}
                                <Bell className="w-5 h-5" />
                                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-danger-500 rounded-full border-2 border-dark-card" /> {/* Slightly adjusted indicator */}
                            </button>

                            {/* User Menu */}
                            <div className="relative">
                                <button
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className="flex items-center gap-3 pl-2 pr-3 py-1.5 rounded-lg hover:bg-dark-hover transition" // Adjusted padding
                                    aria-label="User menu"
                                >
                                    {/* Avatar */}
                                    <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0"> {/* Fixed size */}
                                        {user?.email?.[0].toUpperCase()}
                                    </div>
                                    {/* User Info (Email & Balance) - Hidden on small screens */}
                                    <div className="text-left hidden sm:block">
                                        <p className="text-dark-text-primary text-sm font-medium leading-tight truncate max-w-[120px]">{user?.email}</p> {/* Added truncate */}
                                        <p className="text-xs text-dark-text-secondary leading-tight flex items-center gap-1">
                                            <Wallet size={12} className="opacity-70" />
                                            {formatCurrency(user?.balance, currencyState)} {/* Display formatted balance */}
                                        </p>
                                    </div>
                                </button>

                                {/* User Dropdown */}
                                {dropdownOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40 bg-transparent"
                                            onClick={() => setDropdownOpen(false)}
                                        />
                                        <div className="absolute right-0 mt-2 w-48 bg-dark-card rounded-lg shadow-xl border border-dark-border overflow-hidden z-50 animate-fade-in">
                                            <button
                                                onClick={() => { navigate('/profile'); setDropdownOpen(false); }}
                                                className="w-full px-4 py-3 text-left text-sm text-dark-text-secondary hover:bg-dark-hover hover:text-dark-text-primary transition"
                                            >
                                                {t('nav.profile')}
                                            </button>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full px-4 py-3 text-left text-sm text-danger-400 hover:bg-danger-500/10 hover:text-danger-300 transition flex items-center gap-2"
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