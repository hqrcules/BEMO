import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { logoutUser } from '@/store/slices/authSlice';
import { TrendingUp, Menu, Wifi, WifiOff, LogOut, Globe, Wallet } from 'lucide-react';
import { useState, memo, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from './Sidebar';
import { fetchCurrencyRates, setCurrency } from '@/store/slices/currencySlice';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import { RootState } from '@/store/store';

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

const Header = memo(() => {
    const { t, i18n } = useTranslation();
    const { user } = useAppSelector((state: RootState) => state.auth);
    const { connected } = useAppSelector((state: RootState) => state.websocket);
    const currencyState = useAppSelector((state: RootState) => state.currency);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [activeDropdown, setActiveDropdown] = useState<null | 'user' | 'settings'>(null);

    const availableCurrencies = useMemo(() => {
        return Object.keys(currencyState.rates).map(code => ({
            code: code,
            symbol: currencyState.symbols[code] || code
        })).sort((a, b) => a.code.localeCompare(b.code));
    }, [currencyState.rates, currencyState.symbols]);

    useEffect(() => {
        dispatch(fetchCurrencyRates());
    }, [dispatch]);

    useEffect(() => {
        if (activeDropdown || sidebarOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [activeDropdown, sidebarOpen]);

    const handleLogout = useCallback(async () => {
        await dispatch(logoutUser());
        navigate('/login');
    }, [dispatch, navigate]);

    const changeLanguage = useCallback((lng: string) => {
        i18n.changeLanguage(lng);
    }, [i18n]);

    const handleCurrencyChange = useCallback((currencyCode: string) => {
        dispatch(setCurrency(currencyCode));
    }, [dispatch]);

    const dashboardNavItems = useMemo(() => ([
        { name: t('nav.home'), path: '/' },
        { name: t('nav.market'), path: '/trading' },
        { name: 'Торговля Ботом', path: '/bot-trading' },
        { name: t('nav.balance'), path: '/balance' },
        { name: t('nav.support'), path: '/support' },
        { name: t('nav.profile'), path: '/profile' },
    ]), [t]);

    const handleDropdownToggle = (dropdown: 'user' | 'settings') => {
        setActiveDropdown(prev => (prev === dropdown ? null : dropdown));
    };

    return (
        <>
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <header className="bg-dark-card border-b border-dark-border sticky top-0 z-30">
                <div className="w-full px-6 py-4">
                    <div className="flex items-center justify-between">

                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setSidebarOpen(true)}
                                    className="lg:hidden text-dark-text-secondary hover:text-dark-text-primary p-2 -ml-2"
                                    aria-label="Open menu"
                                >
                                    <Menu className="w-6 h-6" />
                                </button>

                                <div
                                    className="flex items-center gap-2 cursor-pointer group"
                                    onClick={() => navigate('/')}
                                >
                                    <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-glow-primary transition-shadow duration-300">
                                        <TrendingUp className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="text-dark-text-primary font-bold text-xl hidden sm:inline">
                                        Bemo Investment
                                    </span>
                                </div>
                            </div>

                            <nav className="hidden md:flex items-center gap-2">
                                {dashboardNavItems.map((item) => (
                                    <button
                                        key={item.path}
                                        onClick={() => navigate(item.path)}
                                        className={`px-4 py-2 rounded-lg transition text-base font-medium ${location.pathname === item.path
                                            ? 'text-dark-text-primary bg-dark-hover'
                                            : 'text-dark-text-secondary hover:text-dark-text-primary hover:bg-dark-hover'
                                            }`}
                                    >
                                        {item.name}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        <div className="flex items-center gap-3">
                            <span title={connected ? "WebSocket Connected" : "WebSocket Disconnected"}>
                                {connected ? (
                                    <Wifi className="w-5 h-5 text-success-500" />
                                ) : (
                                    <WifiOff className="w-5 h-5 text-danger-500" />
                                )}
                            </span>

                            <div className="relative">
                                <button
                                    onClick={() => handleDropdownToggle('settings')}
                                    className="text-dark-text-secondary hover:text-dark-text-primary p-2 rounded-lg hover:bg-dark-hover transition-colors"
                                    aria-label="Change language or currency"
                                >
                                    <Globe className="w-5 h-5" />
                                </button>
                                {activeDropdown === 'settings' && (
                                    <div className="absolute right-0 mt-2 w-96 bg-dark-card rounded-lg shadow-xl border border-dark-border z-50 animate-fade-in">
                                        <div className="grid grid-cols-2 divide-x divide-zinc-800">

                                            <div className="p-4">
                                                <h4 className="pb-2 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">{t('nav.currency')}</h4>
                                                <div
                                                    className="max-h-60 overflow-y-auto"
                                                >
                                                    {availableCurrencies.map((curr) => (
                                                        <button
                                                            key={curr.code}
                                                            onClick={() => handleCurrencyChange(curr.code)}
                                                            className={`w-full px-3 py-2 text-left rounded-md hover:bg-dark-hover transition flex items-center justify-between text-sm ${currencyState.selectedCurrency === curr.code ? 'bg-dark-hover text-dark-text-primary' : 'text-dark-text-secondary'}`}
                                                        >
                                                            <span>{curr.code}</span>
                                                            <span className="font-medium text-dark-text-tertiary">{curr.symbol}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="p-4">
                                                <h4 className="pb-2 text-xs font-medium text-dark-text-tertiary uppercase tracking-wider">{t('nav.language')}</h4>
                                                <div
                                                    className="max-h-60 overflow-y-auto"
                                                >
                                                    {languages.map((lang) => (
                                                        <button
                                                            key={lang.code}
                                                            onClick={() => changeLanguage(lang.code)}
                                                            className={`w-full px-3 py-2 text-left rounded-md hover:bg-dark-hover transition flex items-center gap-3 text-sm ${i18n.language === lang.code ? 'bg-dark-hover text-dark-text-primary' : 'text-dark-text-secondary'}`}
                                                        >
                                                            <span className="text-lg">{lang.flag}</span>
                                                            <span>{lang.name}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="relative">
                                <button
                                    onClick={() => handleDropdownToggle('user')}
                                    className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-dark-hover transition"
                                    aria-label="User menu"
                                >
                                    <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0">
                                        {user?.email?.[0].toUpperCase()}
                                    </div>
                                    <div className="text-left hidden sm:block">
                                        <p className="text-dark-text-primary text-sm font-medium leading-tight truncate max-w-[120px]">{user?.email}</p>
                                        <p className="text-xs text-dark-text-secondary leading-tight flex items-center gap-1">
                                            <Wallet size={12} className="opacity-70" />
                                            {formatCurrency(user?.balance, currencyState)}
                                        </p>
                                    </div>
                                </button>

                                {activeDropdown === 'user' && (
                                    <div className="absolute right-0 mt-2 w-48 bg-dark-card rounded-lg shadow-xl border border-dark-border overflow-hidden z-50 animate-fade-in">
                                        <button
                                            onClick={() => { navigate('/profile'); setActiveDropdown(null); }}
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
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {activeDropdown && (
                    <div
                        className="fixed inset-0 z-40 bg-transparent"
                        onClick={() => setActiveDropdown(null)}
                    />
                )}
            </header>
        </>
    );
});

export default Header;