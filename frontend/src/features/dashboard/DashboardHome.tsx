import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { useWebSocket } from '@/shared/hooks/useWebSocket';
import { useTranslation } from 'react-i18next';
import {
    TrendingUp,
    TrendingDown,
    Wallet,
    Activity,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
    Zap,
    BarChart3,
    Users,
    Globe,
    Sparkles,
    ChevronRight,
} from 'lucide-react';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import { RootState } from '@/store/store';

// Припустимо, що у вас є або ви створите такий компонент
// src/components/Spinner.tsx
function Spinner({ size = 'h-8 w-8' }: { size?: string }) {
  return (
    <div className={`animate-spin rounded-full ${size} border-b-2 border-primary-500`}></div>
  );
}


const WEBSOCKET_URL = 'ws://localhost:8000/ws/market/';

export default function DashboardHome() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { user } = useAppSelector((state: RootState) => state.auth);
    const { cryptoList, connected } = useAppSelector((state: RootState) => state.websocket);
    const currencyState = useAppSelector((state: RootState) => state.currency);

    useWebSocket({ url: WEBSOCKET_URL, autoConnect: true });

    const [currentTime, setCurrentTime] = useState(new Date());

    // Стан завантаження для крипто списку
    const isCryptoLoading = !cryptoList || cryptoList.length === 0;

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const marketStats = useMemo(() => {
        if (isCryptoLoading) {
            // Повертаємо нульові значення під час завантаження
            return { totalVolume: 0, avgChange: 0, gainers: 0, losers: 0 };
        }

        const totalVolume = cryptoList.reduce((sum, crypto) => sum + (crypto.volume || 0), 0);
        // Запобігаємо діленню на нуль
        const avgChange = cryptoList.length > 0 ? cryptoList.reduce((sum, crypto) => sum + crypto.change_percent_24h, 0) / cryptoList.length : 0;
        const gainers = cryptoList.filter(c => c.change_percent_24h > 0).length;
        const losers = cryptoList.filter(c => c.change_percent_24h < 0).length;

        return { totalVolume, avgChange, gainers, losers };
    }, [cryptoList, isCryptoLoading]); // Додаємо isCryptoLoading у залежності

    const topGainers = useMemo(() => {
        if (isCryptoLoading) return []; // Повертаємо пустий масив під час завантаження
        return [...cryptoList]
            .sort((a, b) => b.change_percent_24h - a.change_percent_24h)
            .slice(0, 5);
    }, [cryptoList, isCryptoLoading]); // Додаємо isCryptoLoading

    const topLosers = useMemo(() => {
        if (isCryptoLoading) return []; // Повертаємо пустий масив під час завантаження
        return [...cryptoList]
            .sort((a, b) => a.change_percent_24h - b.change_percent_24h)
            .slice(0, 5);
    }, [cryptoList, isCryptoLoading]); // Додаємо isCryptoLoading

    const recentActivities = useMemo(() => [
        { type: 'buy', asset: 'BTC', amount: 0.0245, price: 43250, time: t('dashboard.mockTime1') },
        { type: 'sell', asset: 'ETH', amount: 1.5, price: 2245, time: t('dashboard.mockTime2') },
        { type: 'buy', asset: 'SOL', amount: 12, price: 98.67, time: t('dashboard.mockTime3') },
    ], [t]);

    if (!user) return null;

    return (
        <div className="min-h-screen bg-dark-bg text-dark-text-primary">
            {/* Hero Section */}
            <div className="relative overflow-hidden border-b border-dark-border">
                {/* ... (Animated Background) ... */}
                <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-primary-900 via-transparent to-success-900 animate-pulse-slow"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.03)_1px,transparent_0)] bg-[size:40px_40px]"></div>

                <div className="relative max-w-7xl mx-auto px-6 py-12">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Left Side (Balance etc.) */}
                        <div className="lg:col-span-7">
                            <div className="mb-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="w-5 h-5 text-yellow-400" />
                                    <span className="text-sm text-dark-text-secondary">
                                        {currentTime.toLocaleTimeString('uk-UA')}
                                    </span>
                                </div>
                                <h1 className="text-4xl lg:text-5xl font-bold mb-2 text-dark-text-primary">
                                    {t('dashboard.greetingName', { name: user.email.split('@')[0] })}
                                </h1>
                                <p className="text-dark-text-secondary text-lg">
                                    {t('dashboard.portfolioGrowth')}{' '}
                                    <span className={`font-semibold ${marketStats.avgChange >= 0 ? 'text-success-400' : 'text-danger-400'}`}>
                                        {/* Показуємо 0.00% під час завантаження */}
                                        {isCryptoLoading ? '+0.00%' : `${marketStats.avgChange >= 0 ? '+' : ''}${marketStats.avgChange.toFixed(2)}%`}
                                    </span>{' '}
                                    {t('dashboard.last24h')}
                                </p>
                            </div>

                            <div className="bg-gradient-to-br from-primary-600/20 to-success-600/10 glass-card p-8 shadow-2xl transform hover:scale-[1.01] transition-all duration-300 border-primary-500/30">
                                {/* ... (Balance info, buttons) ... */}
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <p className="text-dark-text-secondary text-sm mb-1">{t('dashboard.totalBalance')}</p>
                                        <h2 className="text-4xl lg:text-5xl font-bold text-dark-text-primary">
                                            {formatCurrency(user.balance, currencyState)}
                                        </h2>
                                    </div>
                                    <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                                        <Wallet className="w-8 h-8 text-white" />
                                    </div>
                                </div>
                                {/* ... (PNL, Assets, Income) ... */}
                                <div className="mt-6 flex gap-3">
                                    <button
                                        onClick={() => navigate('/balance?deposit=true')}
                                        className="flex-1 btn-success py-3 text-sm"
                                    >
                                        {t('dashboard.deposit')}
                                    </button>
                                    <button
                                        onClick={() => navigate('/trading')}
                                        className="flex-1 btn-secondary py-3 text-sm"
                                    >
                                        {t('dashboard.trade')}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right Side (Market Stats) */}
                        <div className="lg:col-span-5 space-y-4">
                             <div className="grid grid-cols-2 gap-4">
                                {/* Gainer/Loser counts */}
                                <div className="stat-card">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 bg-success-500/10 rounded-xl flex items-center justify-center">
                                            <TrendingUp className="w-5 h-5 text-success-400" />
                                        </div>
                                        <div>
                                            <p className="text-dark-text-tertiary text-xs">{t('dashboard.gainers')}</p>
                                            {isCryptoLoading ? (
                                                <div className="h-6 bg-dark-hover rounded w-12 mt-1 animate-pulse"></div>
                                            ) : (
                                                <p className="text-2xl font-bold text-success-400">{marketStats.gainers}</p>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-xs text-dark-text-tertiary">{t('dashboard.assetsLast24h')}</p>
                                </div>

                                <div className="stat-card">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 bg-danger-500/10 rounded-xl flex items-center justify-center">
                                            <TrendingDown className="w-5 h-5 text-danger-400" />
                                        </div>
                                        <div>
                                            <p className="text-dark-text-tertiary text-xs">{t('dashboard.losers')}</p>
                                             {isCryptoLoading ? (
                                                <div className="h-6 bg-dark-hover rounded w-12 mt-1 animate-pulse"></div>
                                            ) : (
                                                <p className="text-2xl font-bold text-danger-400">{marketStats.losers}</p>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-xs text-dark-text-tertiary">{t('dashboard.assetsLast24h')}</p>
                                </div>
                             </div>

                             {/* Market Stats Card */}
                             <div className="glass-card p-6 min-h-[250px]"> {/* Додано min-h */}
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-dark-text-primary">{t('dashboard.marketStats')}</h3>
                                    <div className={`flex items-center gap-1 text-xs ${connected ? 'text-success-400' : 'text-danger-400'}`}>
                                        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-success-400 animate-pulse' : 'bg-danger-400'}`} />
                                        {connected ? t('dashboard.live') : t('dashboard.offline')}
                                    </div>
                                </div>
                                {isCryptoLoading ? (
                                     <div className="flex justify-center items-center h-32">
                                         <Spinner size="h-10 w-10" />
                                     </div>
                                 ) : (
                                     <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2"><Globe className="w-4 h-4 text-primary-400" /><span className="text-sm text-dark-text-secondary">{t('dashboard.volume24h')}</span></div>
                                            <span className="text-sm font-semibold">{formatCurrency(marketStats.totalVolume, currencyState, { notation: 'compact', maximumFractionDigits: 1 })}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2"><Activity className="w-4 h-4 text-purple-400" /><span className="text-sm text-dark-text-secondary">{t('dashboard.avgChange')}</span></div>
                                            <span className={`text-sm font-semibold ${marketStats.avgChange >= 0 ? 'text-success-400' : 'text-danger-400'}`}>{marketStats.avgChange >= 0 ? '+' : ''}{marketStats.avgChange.toFixed(2)}%</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-400" /><span className="text-sm text-dark-text-secondary">{t('dashboard.activeTraders')}</span></div>
                                            <span className="text-sm font-semibold">12,483</span> {/* Mock data */}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2"><BarChart3 className="w-4 h-4 text-cyan-400" /><span className="text-sm text-dark-text-secondary">{t('dashboard.fearGreedIndex')}</span></div>
                                            <span className="text-sm font-semibold text-success-400">73 ({t('dashboard.greed')})</span> {/* Mock data */}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

             {/* Main Content Area */}
             <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column (Gainers/Losers) */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Top Gainers */}
                        <div className="glass-card p-6 min-h-[400px]"> {/* Додано min-h */}
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold flex items-center gap-2"><TrendingUp className="w-5 h-5 text-success-400" />{t('dashboard.topGainers')}</h2>
                                <button onClick={() => navigate('/trading')} className="text-sm text-dark-text-secondary hover:text-dark-text-primary transition-colors flex items-center gap-1">{t('dashboard.viewAll')}<ChevronRight className="w-4 h-4" /></button>
                            </div>
                            {isCryptoLoading ? (
                                <div className="flex justify-center items-center h-64"> {/* Центрування спінера */}
                                    <Spinner size="h-12 w-12" />
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {topGainers.map((crypto, index) => (
                                        <div key={crypto.id} className="flex items-center justify-between p-4 bg-dark-card/50 rounded-xl hover:bg-dark-hover/50 transition-colors cursor-pointer border border-dark-border/50" onClick={() => navigate('/trading')}>
                                            <div className="flex items-center gap-4">
                                                <span className="text-dark-text-tertiary font-mono text-sm w-6">{index + 1}</span>
                                                <img src={crypto.image} alt={crypto.symbol} className="w-10 h-10 rounded-full" />
                                                <div>
                                                    <p className="font-semibold">{crypto.symbol.toUpperCase()}</p>
                                                    <p className="text-xs text-dark-text-tertiary">{crypto.name}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-mono font-semibold">{formatCurrency(crypto.price, currencyState)}</p>
                                                <div className="flex items-center justify-end gap-1 text-success-400 text-sm">
                                                    <ArrowUpRight className="w-4 h-4" />+{crypto.change_percent_24h.toFixed(2)}%
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Top Losers */}
                        <div className="glass-card p-6 min-h-[400px]"> {/* Додано min-h */}
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold flex items-center gap-2"><TrendingDown className="w-5 h-5 text-danger-400" />{t('dashboard.topLosers')}</h2>
                                <button onClick={() => navigate('/trading')} className="text-sm text-dark-text-secondary hover:text-dark-text-primary transition-colors flex items-center gap-1">{t('dashboard.viewAll')}<ChevronRight className="w-4 h-4" /></button>
                            </div>
                            {isCryptoLoading ? (
                                <div className="flex justify-center items-center h-64"> {/* Центрування спінера */}
                                    <Spinner size="h-12 w-12" />
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {topLosers.map((crypto, index) => (
                                        <div key={crypto.id} className="flex items-center justify-between p-4 bg-dark-card/50 rounded-xl hover:bg-dark-hover/50 transition-colors cursor-pointer border border-dark-border/50" onClick={() => navigate('/trading')}>
                                            <div className="flex items-center gap-4">
                                                <span className="text-dark-text-tertiary font-mono text-sm w-6">{index + 1}</span>
                                                <img src={crypto.image} alt={crypto.symbol} className="w-10 h-10 rounded-full" />
                                                <div>
                                                    <p className="font-semibold">{crypto.symbol.toUpperCase()}</p>
                                                    <p className="text-xs text-dark-text-tertiary">{crypto.name}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-mono font-semibold">{formatCurrency(crypto.price, currencyState)}</p>
                                                <div className="flex items-center justify-end gap-1 text-danger-400 text-sm">
                                                    <ArrowDownRight className="w-4 h-4" />{crypto.change_percent_24h.toFixed(2)}%
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column (Quick Actions, Recent Activity, Promo) */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="glass-card p-6">
                            <h3 className="text-lg font-semibold mb-4 text-dark-text-primary">{t('dashboard.quickActions')}</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => navigate('/balance')} className="p-4 bg-success-500/10 border border-success-500/30 rounded-xl hover:bg-success-500/20 transition-colors text-center group"><DollarSign className="w-6 h-6 text-success-400 mx-auto mb-2 group-hover:scale-110 transition-transform" /><p className="text-sm font-medium text-success-400">{t('dashboard.deposit')}</p></button>
                                <button onClick={() => navigate('/balance')} className="p-4 bg-primary-500/10 border border-primary-500/30 rounded-xl hover:bg-primary-500/20 transition-colors text-center group"><ArrowUpRight className="w-6 h-6 text-primary-400 mx-auto mb-2 group-hover:scale-110 transition-transform" /><p className="text-sm font-medium text-primary-400">{t('dashboard.withdraw')}</p></button>
                                <button onClick={() => navigate('/trading')} className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl hover:bg-purple-500/20 transition-colors text-center group"><Activity className="w-6 h-6 text-purple-400 mx-auto mb-2 group-hover:scale-110 transition-transform" /><p className="text-sm font-medium text-purple-400">{t('dashboard.trade')}</p></button>
                                <button onClick={() => navigate('/support')} className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl hover:bg-orange-500/20 transition-colors text-center group"><Users className="w-6 h-6 text-orange-400 mx-auto mb-2 group-hover:scale-110 transition-transform" /><p className="text-sm font-medium text-orange-400">{t('nav.support')}</p></button>
                            </div>
                        </div>

                         <div className="glass-card p-6">
                            <h3 className="text-lg font-semibold mb-4 text-dark-text-primary">{t('dashboard.recentActivity')}</h3>
                            <div className="space-y-4">
                                {recentActivities.map((activity, index) => (
                                    <div key={index} className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activity.type === 'buy' ? 'bg-success-500/10' : 'bg-danger-500/10'}`}>{activity.type === 'buy' ? (<ArrowUpRight className="w-5 h-5 text-success-400" />) : (<ArrowDownRight className="w-5 h-5 text-danger-400" />)}</div>
                                        <div className="flex-1"><p className="text-sm font-semibold">{activity.type === 'buy' ? t('trading.buy') : t('trading.sell')} {activity.asset}</p><p className="text-xs text-dark-text-tertiary">{activity.time}</p></div>
                                        <div className="text-right"><p className="text-sm font-mono">{activity.amount}</p><p className="text-xs text-dark-text-tertiary">{formatCurrency(activity.price, currencyState)}</p></div>
                                    </div>
                                ))}
                            </div>
                        </div>

                         <div className="bg-gradient-to-br from-orange-600 to-pink-600 rounded-2xl p-6 text-center shadow-lg">
                            <Sparkles className="w-12 h-12 text-white mx-auto mb-3 opacity-80" />
                            <h3 className="text-xl font-bold mb-2 text-white">{t('dashboard.promoTitle')}</h3>
                            <p className="text-sm text-white/80 mb-4">{t('dashboard.promoSubtitle')}</p>
                            <button className="w-full bg-white text-orange-600 py-2.5 rounded-xl font-semibold hover:bg-gray-100 transition-colors shadow-md">{t('dashboard.promoButton')}</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}