import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { useWebSocket } from '@/shared/hooks/useWebSocket';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import {
    TrendingUp,
    TrendingDown,
    Wallet,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    Globe,
    ChevronRight,
    Plus,
    Minus,
    Eye,
    EyeOff,
    Settings,
    Bell,
    Target,
    Bot,
} from 'lucide-react';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import { RootState } from '@/store/store';
import { transactionService, BalanceHistoryEntry } from '@/services/transactionService';
import { tradingService, TradingSession } from '@/services/tradingService';
import { AssetItem } from '@/store/slices/websocketSlice';
import BalanceChart from '@/components/charts/BalanceChart';


function Spinner({ size = 'h-8 w-8' }: { size?: string }) {
    return (
        <div className={`animate-spin rounded-full ${size} border-2 border-theme-border border-t-primary-500`}></div>
    );
}

const WEBSOCKET_URL = 'ws://localhost:8000/ws/market/';

function TickerItem({ crypto, currencyState }: { crypto: AssetItem, currencyState: any }) {
    const isUp = crypto.change_percent_24h >= 0;
    return (
        <div className="flex items-center gap-2 mx-4 flex-none py-2.5">
            <img src={crypto.image} alt={crypto.symbol} className="w-5 h-5 rounded-full" />
            <span className="font-medium text-sm text-theme-text">{crypto.symbol.toUpperCase()}</span>
            <span className="font-mono text-sm text-theme-text-secondary">
                {formatCurrency(crypto.price, currencyState)}
            </span>
            <span className={`flex items-center text-xs font-medium ${isUp ? 'text-green-500' : 'text-red-500'}`}>
                {isUp ? <ArrowUpRight size={14} className="mr-0.5" /> : <ArrowDownRight size={14} className="mr-0.5" />}
                {crypto.change_percent_24h.toFixed(2)}%
            </span>
        </div>
    );
}

function PriceTicker({ cryptoList, currencyState }: { cryptoList: AssetItem[], currencyState: any }) {
    if (!cryptoList || cryptoList.length === 0) {
        return (
            <div className="w-full bg-theme-bg-secondary border-b border-theme-border py-3 text-center text-sm text-theme-text-tertiary">
                Loading price ticker...
            </div>
        );
    }

    const tickerList = cryptoList.slice(0, 20);

    return (
        <div className="w-full bg-theme-bg-secondary border-b border-theme-border overflow-hidden whitespace-nowrap relative group">
            <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused]">
                {tickerList.map((crypto) => (
                    <TickerItem key={`${crypto.id}-a`} crypto={crypto} currencyState={currencyState} />
                ))}
                {tickerList.map((crypto) => (
                    <TickerItem key={`${crypto.id}-b`} crypto={crypto} currencyState={currencyState} />
                ))}
            </div>
        </div>
    );
}

function usePrevious(value: any) {
  const ref = useRef<any>(null);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}



const CHART_TIME_RANGES = {
    '1D': 1,
    '7D': 7,
    '1M': 30,
    '3M': 90,
    'ALL': Infinity,
};

type ChartTimeRange = keyof typeof CHART_TIME_RANGES;

export default function DashboardHome() {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const { theme } = useTheme();
    const { user } = useAppSelector((state: RootState) => state.auth);

    const { assets, connected, loading: isWebsocketLoading } = useAppSelector((state: RootState) => state.websocket);
    const cryptoList = useMemo(() => Object.values(assets).filter(asset => asset.category === 'crypto'), [assets]);

    const currencyState = useAppSelector((state: RootState) => state.currency);

    useWebSocket({ url: WEBSOCKET_URL, autoConnect: true });

    const [currentTime, setCurrentTime] = useState(new Date());
    const [balanceVisible, setBalanceVisible] = useState(true);
    const [flashState, setFlashState] = useState<{[key: string]: 'up' | 'down'}>({});

    const [balanceHistory, setBalanceHistory] = useState<BalanceHistoryEntry[]>([]);
    const [activeSession, setActiveSession] = useState<TradingSession | null>(null);
    const [loadingChart, setLoadingChart] = useState(true);
    const [loadingBotStatus, setLoadingBotStatus] = useState(true);
    const [activeTimeRange, setActiveTimeRange] = useState<ChartTimeRange>('1M');

    const isCryptoLoading = isWebsocketLoading && cryptoList.length === 0;
    const prevCryptoList = usePrevious(cryptoList);

    useEffect(() => {
        const fetchBalanceHistory = async () => {
            try {
                setLoadingChart(true);
                const history = await transactionService.getBalanceHistory();
                setBalanceHistory(history);
            } catch (error) {
                console.error("Error fetching balance history:", error);
            } finally {
                setLoadingChart(false);
            }
        };

        const fetchActiveSession = async () => {
             if (user?.bot_type === 'none') {
                 setLoadingBotStatus(false);
                 return;
             }
            try {
                setLoadingBotStatus(true);
                const session = await tradingService.getActiveSession();
                setActiveSession(session);
            } catch (error) {
                console.error("No active trading session found:", error);
                setActiveSession(null);
            } finally {
                setLoadingBotStatus(false);
            }
        };

        fetchBalanceHistory();
        fetchActiveSession();
    }, [user?.bot_type]);

    useEffect(() => {
        if (!prevCryptoList || (prevCryptoList as any[]).length === 0 || !cryptoList || cryptoList.length === 0) {
            return;
        }

        const newFlashState: {[key: string]: 'up' | 'down'} = {};

        cryptoList.forEach(currentCrypto => {
            const oldCrypto = (prevCryptoList as any[]).find(c => c.id === currentCrypto.id);

            if (oldCrypto) {
                if (currentCrypto.price > oldCrypto.price) {
                    newFlashState[currentCrypto.id] = 'up';
                } else if (currentCrypto.price < oldCrypto.price) {
                    newFlashState[currentCrypto.id] = 'down';
                }
            }
        });

        if (Object.keys(newFlashState).length > 0) {
            setFlashState(newFlashState);
            const timer = setTimeout(() => {
                setFlashState({});
            }, 1200);
            return () => clearTimeout(timer);
        }
    }, [cryptoList, prevCryptoList]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const marketStats = useMemo(() => {
        if (isCryptoLoading) {
            return { totalVolume: 0, avgChange: 0, gainers: 0, losers: 0 };
        }
        const totalVolume = cryptoList.reduce((sum, crypto) => sum + (crypto.volume || 0), 0);
        const avgChange = cryptoList.length > 0
            ? cryptoList.reduce((sum, crypto) => sum + crypto.change_percent_24h, 0) / cryptoList.length
            : 0;
        const gainers = cryptoList.filter(c => c.change_percent_24h > 0).length;
        const losers = cryptoList.filter(c => c.change_percent_24h < 0).length;
        return { totalVolume, avgChange, gainers, losers };
    }, [cryptoList, isCryptoLoading]);

    const topGainers = useMemo(() => {
        if (isCryptoLoading) return [];
        return [...cryptoList]
            .sort((a, b) => b.change_percent_24h - a.change_percent_24h)
            .slice(0, 5);
    }, [cryptoList, isCryptoLoading]);

    const topLosers = useMemo(() => {
        if (isCryptoLoading) return [];
        return [...cryptoList]
            .sort((a, b) => a.change_percent_24h - b.change_percent_24h)
            .slice(0, 5);
    }, [cryptoList, isCryptoLoading]);

    const { filteredBalanceData, timeRangeChange } = useMemo(() => {
        const now = Date.now();
        const daysToShow = CHART_TIME_RANGES[activeTimeRange];
        const rangeStartTs = (daysToShow === Infinity) ? 0 : now - daysToShow * 24 * 60 * 60 * 1000;

        let processedData = balanceHistory.map(entry => ({
            date: entry.timestamp,
            balance: entry.balance,
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        if (processedData.length === 0) {
             return {
                 filteredBalanceData: [],
                 timeRangeChange: { value: 0, percent: 0 }
             };
        }

        const filteredData = processedData.filter(d => new Date(d.date).getTime() >= rangeStartTs);

        if (filteredData.length === 0) {
            const lastAvailable = processedData[processedData.length - 1];
            return {
                 filteredBalanceData: [lastAvailable],
                 timeRangeChange: { value: 0, percent: 0 }
            }
        }

        const firstDataPointInRange = filteredData[0];
        const lastDataPointInRange = filteredData[filteredData.length - 1];

        const changeValue = lastDataPointInRange.balance - firstDataPointInRange.balance;
        const changePercent = Math.abs(firstDataPointInRange.balance) > 0
            ? (changeValue / Math.abs(firstDataPointInRange.balance)) * 100
            : 0;

        return {
          filteredBalanceData: filteredData,
          timeRangeChange: { value: changeValue, percent: changePercent }
        };
    }, [balanceHistory, activeTimeRange]);

    const isChartPositive = timeRangeChange.value >= 0;

    const balanceBorderAnimation = marketStats.avgChange >= 0
        ? 'animate-pulse-border-green'
        : 'animate-pulse-border-red';

    if (!user) return null;


    return (
        <div className="min-h-screen bg-theme-bg text-theme-text">
            <div className="max-w-8xl mx-auto">

                <PriceTicker cryptoList={cryptoList} currencyState={currencyState} />

                <div className="w-full border-b border-theme-border bg-theme-bg-secondary backdrop-blur-sm">
                    <div className="w-full px-6 py-6">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                    <span className="text-sm text-theme-text-secondary font-mono tracking-widest">
                                        {currentTime.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <h1 className="text-3xl sm:text-4xl font-extralight text-theme-text tracking-tight mb-1">
                                    {t('dashboard.greetingName', { name: user.full_name || user.email.split('@')[0] })}
                                </h1>
                                <p className="text-base text-theme-text-tertiary font-light">
                                    Welcome back to your investment dashboard
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button className="p-2.5 hover:bg-theme-bg-hover rounded-xl transition-all duration-300">
                                    <Bell className="w-5 h-5 text-theme-text-secondary" />
                                </button>
                                <button className="p-2.5 hover:bg-theme-bg-hover rounded-xl transition-all duration-300">
                                    <Settings className="w-5 h-5 text-theme-text-secondary" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6">

                    <div className="lg:col-span-8 flex flex-col gap-6">

                        <div className={`bg-theme-bg-secondary border rounded-3xl p-6 relative overflow-hidden transition-all duration-1000 ${
                            isCryptoLoading ? 'border-theme-border' : balanceBorderAnimation
                        }`}>
                            <div className="relative">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary-500/30">
                                            <Wallet className="w-8 h-8 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-theme-text-secondary text-sm font-medium mb-1.5">{t('dashboard.totalBalance')}</p>
                                            <div className="flex items-center gap-3">
                                                <h2 className="text-4xl font-extralight text-theme-text tracking-tight">
                                                    {balanceVisible
                                                        ? formatCurrency(user.balance, currencyState)
                                                        : '••••••••'
                                                    }
                                                </h2>
                                                <button
                                                    onClick={() => setBalanceVisible(!balanceVisible)}
                                                    className="p-2 hover:bg-theme-bg-hover rounded-lg transition-all duration-300"
                                                >
                                                    {balanceVisible ?
                                                        <Eye className="w-5 h-5 text-theme-text-tertiary" /> :
                                                        <EyeOff className="w-5 h-5 text-theme-text-tertiary" />
                                                    }
                                                </button>
                                            </div>
                                            <div className={`mt-3 flex items-center gap-1.5 text-sm ${
                                                marketStats.avgChange >= 0 ? 'text-green-400' : 'text-red-400'
                                            }`}>
                                                {marketStats.avgChange >= 0 ?
                                                    <ArrowUpRight className="w-4 h-4" /> :
                                                    <ArrowDownRight className="w-4 h-4" />
                                                }
                                                <span className="font-medium">
                                                    {isCryptoLoading ? '+0.00%' : `${marketStats.avgChange >= 0 ? '+' : ''}${marketStats.avgChange.toFixed(2)}%`}
                                                </span>
                                                <span className="text-theme-text-tertiary text-xs">last 24h</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row justify-start lg:justify-end gap-3">
                                        <button
                                            onClick={() => navigate('/balance', { state: { openModal: 'deposit' } })}
                                            className="btn-primary w-full sm:w-auto px-6 py-3 text-sm"
                                        >
                                            <Plus className="w-4 h-4" />
                                            {t('dashboard.deposit')}
                                        </button>
                                        <button
                                            onClick={() => navigate('/balance')}
                                            className="btn-secondary w-full sm:w-auto px-6 py-3 text-sm"
                                        >
                                            <Minus className="w-4 h-4" />
                                            {t('dashboard.withdraw')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-theme-bg-secondary border border-theme-border rounded-3xl p-6 shadow-lg">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                                <div>
                                    <p className="text-theme-text-tertiary text-xs uppercase tracking-wider mb-2">Balance Overview</p>
                                    <div className="flex items-end gap-3">
                                        <h3 className="text-3xl font-semibold text-theme-text">
                                            {formatCurrency(user.balance, currencyState)}
                                        </h3>
                                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-semibold ${
                                            isChartPositive
                                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                        }`}>
                                            {isChartPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                                            {formatCurrency(timeRangeChange.value, currencyState)}
                                            <span className="text-xs opacity-80">({timeRangeChange.percent.toFixed(2)}%)</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 bg-theme-bg-tertiary/60 border border-theme-border/50 rounded-xl p-1 shadow-inner">
                                    {(Object.keys(CHART_TIME_RANGES) as ChartTimeRange[]).map(range => (
                                        <button
                                            key={range}
                                            onClick={() => setActiveTimeRange(range)}
                                            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                                                activeTimeRange === range
                                                    ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30'
                                                    : 'text-theme-text-secondary hover:text-theme-text hover:bg-theme-bg-hover'
                                            }`}
                                        >
                                            {range}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {loadingChart ? (
                                <div className="flex justify-center items-center h-96">
                                    <Spinner size="h-10 w-10" />
                                </div>
                            ) : filteredBalanceData.length > 0 ? (
                                <BalanceChart
                                    data={filteredBalanceData}
                                    currency={currencyState.symbol}
                                    theme={theme}
                                    range={activeTimeRange}
                                    height={400}
                                />
                            ) : (
                                <div className="flex flex-col justify-center items-center h-96 text-theme-text-tertiary">
                                    <Activity className="w-16 h-16 opacity-20 mb-4" />
                                    <p className="text-sm">Not enough data for chart</p>
                                    <p className="text-xs mt-2 opacity-60">Data will appear as you make transactions</p>
                                </div>
                            )}

                        </div>

                        <div className="bg-theme-bg-secondary border border-theme-border rounded-3xl overflow-hidden">
                            <div className="flex items-center justify-between p-5 border-b border-theme-border">
                                <h3 className="text-lg font-light text-theme-text flex items-center gap-2.5">
                                    <TrendingUp className="w-5 h-5 text-green-400" />
                                    {t('dashboard.topGainers')}
                                </h3>
                                <button
                                    onClick={() => navigate('/trading')}
                                    className="text-sm text-theme-text-tertiary hover:text-theme-text flex items-center gap-1.5 transition-colors duration-300"
                                >
                                    {t('dashboard.viewAll')}
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="p-4">
                                {isCryptoLoading ? (
                                    <div className="flex justify-center items-center h-48">
                                        <Spinner size="h-10 w-10" />
                                    </div>
                                ) : topGainers.length === 0 ? (
                                    <div className="text-center py-10 text-theme-text-tertiary text-sm">No gainers found.</div>
                                ) : (
                                    <div className="space-y-2.5">
                                        {topGainers.map((crypto, index) => {
                                            const flashClass = flashState[crypto.id] === 'up'
                                                ? 'animate-flash-green'
                                                : flashState[crypto.id] === 'down'
                                                    ? 'animate-flash-red'
                                                    : '';

                                            return (
                                                <div
                                                    key={crypto.id}
                                                    className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 cursor-pointer group ${flashClass} hover:bg-theme-bg-hover`}
                                                    onClick={() => navigate('/trading')}
                                                >
                                                    <div className="flex items-center gap-3.5">
                                                        <span className="text-theme-text-tertiary font-mono text-sm w-5 group-hover:text-theme-text-secondary transition-colors">
                                                            {index + 1}
                                                        </span>
                                                        <img
                                                            src={crypto.image}
                                                            alt={crypto.symbol}
                                                            className="w-10 h-10 rounded-full"
                                                        />
                                                        <div>
                                                            <p className="text-sm font-medium text-theme-text group-hover:text-green-400 transition-colors">
                                                                {crypto.symbol.toUpperCase()}
                                                            </p>
                                                            <p className="text-xs text-theme-text-tertiary mt-0.5 truncate max-w-[100px] md:max-w-[150px]">
                                                                {crypto.name}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-mono text-theme-text text-sm mb-0.5">
                                                            {formatCurrency(crypto.price, currencyState)}
                                                        </p>
                                                        <p className="text-sm text-green-400 flex items-center gap-1 justify-end">
                                                            <ArrowUpRight className="w-3.5 h-3.5" />
                                                            +{crypto.change_percent_24h.toFixed(2)}%
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                         <div className="bg-theme-bg-secondary border border-theme-border rounded-3xl overflow-hidden">
                            <div className="flex items-center justify-between p-5 border-b border-theme-border">
                                <h3 className="text-lg font-light text-theme-text flex items-center gap-2.5">
                                    <TrendingDown className="w-5 h-5 text-red-400" />
                                    {t('dashboard.topLosers')}
                                </h3>
                                <button
                                    onClick={() => navigate('/trading')}
                                    className="text-sm text-theme-text-tertiary hover:text-theme-text flex items-center gap-1.5 transition-colors duration-300"
                                >
                                    {t('dashboard.viewAll')}
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="p-4">
                                {isCryptoLoading ? (
                                    <div className="flex justify-center items-center h-48">
                                        <Spinner size="h-10 w-10" />
                                    </div>
                                ) : topLosers.length === 0 ? (
                                    <div className="text-center py-10 text-theme-text-tertiary text-sm">No losers found.</div>
                                ) : (
                                    <div className="space-y-2.5">
                                        {topLosers.map((crypto, index) => {
                                            const flashClass = flashState[crypto.id] === 'up'
                                                ? 'animate-flash-green'
                                                : flashState[crypto.id] === 'down'
                                                    ? 'animate-flash-red'
                                                    : '';

                                            return (
                                                <div
                                                    key={crypto.id}
                                                    className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 cursor-pointer group ${flashClass} hover:bg-theme-bg-hover`}
                                                    onClick={() => navigate('/trading')}
                                                >
                                                    <div className="flex items-center gap-3.5">
                                                        <span className="text-theme-text-tertiary font-mono text-sm w-5 group-hover:text-theme-text-secondary transition-colors">
                                                            {index + 1}
                                                        </span>
                                                        <img
                                                            src={crypto.image}
                                                            alt={crypto.symbol}
                                                            className="w-10 h-10 rounded-full"
                                                        />
                                                        <div>
                                                            <p className="text-sm font-medium text-theme-text group-hover:text-red-400 transition-colors">
                                                                {crypto.symbol.toUpperCase()}
                                                            </p>
                                                            <p className="text-xs text-theme-text-tertiary mt-0.5 truncate max-w-[100px] md:max-w-[150px]">
                                                                {crypto.name}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-mono text-theme-text text-sm mb-0.5">
                                                            {formatCurrency(crypto.price, currencyState)}
                                                        </p>
                                                        <p className="text-sm text-red-400 flex items-center gap-1 justify-end">
                                                            <ArrowDownRight className="w-3.5 h-3.5" />
                                                            {crypto.change_percent_24h.toFixed(2)}%
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    <div className="lg:col-span-4 flex flex-col gap-6">

                        <div className="bg-theme-bg-secondary border border-theme-border rounded-3xl p-6">
                            <h3 className="text-lg font-light mb-6 text-theme-text text-center">
                                {t('dashboard.quickActions')}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 max-w-4xl mx-auto">
                                <button
                                    onClick={() => navigate('/balance', { state: { openModal: 'deposit' } })}
                                    className="flex flex-col items-center gap-3 p-4 bg-green-950/20 border border-green-800/50 rounded-2xl hover:bg-green-950/40 transition-all duration-300 group"
                                >
                                    <Plus className="w-9 h-9 text-green-400 group-hover:scale-110 transition-transform animate-pulse" />
                                    <span className="text-green-400 font-medium text-base">{t('dashboard.deposit')}</span>
                                    <p className="text-theme-text-tertiary text-center text-xs">Add funds to your account</p>
                                </button>
                                <button
                                    onClick={() => navigate('/balance')}
                                    className="flex flex-col items-center gap-3 p-4 border border-theme-border rounded-2xl hover:bg-theme-bg-hover transition-all duration-300 group"
                                >
                                    <Minus className="w-9 h-9 text-theme-text-secondary group-hover:scale-110 transition-transform" />
                                    <span className="text-theme-text-secondary font-medium text-base">{t('dashboard.withdraw')}</span>
                                    <p className="text-theme-text-tertiary text-center text-xs">Withdraw your earnings</p>
                                </button>
                                <button
                                    onClick={() => navigate('/trading')}
                                    className="flex flex-col items-center gap-3 p-4 border border-theme-border rounded-2xl hover:bg-theme-bg-hover transition-all duration-300 group"
                                >
                                    <Activity className="w-9 h-9 text-purple-400 group-hover:scale-110 transition-transform" />
                                    <span className="text-theme-text-secondary font-medium text-base">{t('dashboard.trade')}</span>
                                    <p className="text-theme-text-tertiary text-center text-xs">Start trading cryptocurrencies</p>
                                </button>
                            </div>
                        </div>

                        <div className="bg-theme-bg-secondary border border-theme-border rounded-3xl p-6">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-lg font-light text-theme-text flex items-center gap-2.5">
                                    <Bot className="w-5 h-5 text-purple-400" />
                                    Trading Bot Status
                                </h3>
                                {user.bot_type !== 'none' && (
                                    <span className={`flex items-center gap-2 text-xs font-medium ${activeSession?.is_active ? 'text-green-400' : 'text-theme-text-tertiary'}`}>
                                        <div className={`w-2 h-2 rounded-full ${activeSession?.is_active ? 'bg-green-500 animate-pulse' : 'border-theme-border'}`}></div>
                                        {activeSession?.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                )}
                            </div>
                            {loadingBotStatus ? (
                                <div className="flex justify-center items-center h-32">
                                    <Spinner size="h-6 w-6" />
                                </div>
                            ) : user.bot_type === 'none' ? (
                                <div className="text-center py-4">
                                    <p className="text-theme-text-tertiary text-sm mb-4">You don't have an active bot.</p>
                                    <button
                                         onClick={() => navigate('/bot-trading')}
                                         className="btn-primary text-sm"
                                    >
                                        Activate Bot
                                    </button>
                                </div>
                            ) : activeSession ? (
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-theme-text-tertiary text-sm mb-1">Bot Type</p>
                                        <p className="text-base font-medium text-theme-text capitalize">{activeSession.bot_type}</p>
                                    </div>
                                    <div>
                                        <p className="text-theme-text-tertiary text-sm mb-1">Session Start</p>
                                        <p className="text-base font-mono text-theme-text">
                                            {new Date(activeSession.started_at).toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-theme-text-tertiary text-sm mb-1">Session P/L</p>
                                        <p className={`text-base font-mono ${parseFloat(activeSession.total_profit) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {parseFloat(activeSession.total_profit) >= 0 ? '+' : ''}
                                            {formatCurrency(activeSession.total_profit, currencyState)}
                                        </p>
                                    </div>
                                    <button
                                         onClick={() => navigate('/bot-trading')}
                                         className="btn-secondary w-full text-sm mt-2"
                                    >
                                        <Settings className="w-4 h-4" />
                                        Manage Bot
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-theme-text-tertiary text-sm mb-4">No active trading session found.</p>
                                     <button
                                         onClick={() => navigate('/bot-trading')}
                                         className="btn-primary text-sm"
                                    >
                                        Start Bot Session
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="bg-theme-bg-secondary border border-theme-border rounded-3xl p-6 hover:bg-theme-bg-hover transition-all duration-300 transform hover:-translate-y-1">
                            <div className="flex items-center justify-between mb-5">
                                <div className="p-2.5 bg-theme-bg-tertiary rounded-xl">
                                    <Globe className="w-7 h-7 text-blue-400" />
                                </div>
                                <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${
                                    marketStats.avgChange >= 0
                                        ? 'bg-green-950 text-green-400'
                                        : 'bg-red-950 text-red-400'
                                }`}>
                                    {isCryptoLoading ? '0.00%' : `${marketStats.avgChange >= 0 ? '+' : ''}${marketStats.avgChange.toFixed(2)}%`}
                                </span>
                            </div>
                            <p className="text-theme-text-tertiary text-sm mb-2">{t('dashboard.volume24h')}</p>
                            <p className="text-3xl font-light text-theme-text">
                                {isCryptoLoading ? <span className="text-theme-text-tertiary">Loading...</span> : formatCurrency(marketStats.totalVolume, currencyState, { notation: 'compact', maximumFractionDigits: 1 })}
                            </p>
                        </div>

                        <div className="bg-theme-bg-secondary border border-theme-border rounded-3xl p-6 hover:bg-theme-bg-hover transition-all duration-300 transform hover:-translate-y-1">
                            <div className="flex items-center justify-between mb-5">
                                <div className="p-2.5 bg-theme-bg-tertiary rounded-xl">
                                    <TrendingUp className="w-7 h-7 text-green-400" />
                                </div>
                                <Target className="w-5 h-5 text-theme-text-tertiary" />
                            </div>
                            <p className="text-theme-text-tertiary text-sm mb-2">Top Gainers (24h)</p>
                            <p className="text-3xl font-light text-green-400">
                                {isCryptoLoading ? <span className="text-theme-text-tertiary">Loading...</span> : marketStats.gainers}
                            </p>
                        </div>

                        <div className="bg-theme-bg-secondary border border-theme-border rounded-3xl p-6 hover:bg-theme-bg-hover transition-all duration-300 transform hover:-translate-y-1">
                            <div className="flex items-center justify-between mb-5">
                                <div className="p-2.5 bg-theme-bg-tertiary rounded-xl">
                                    <TrendingDown className="w-7 h-7 text-red-400" />
                                </div>
                                <Target className="w-5 h-5 text-theme-text-tertiary" />
                            </div>
                            <p className="text-theme-text-tertiary text-sm mb-2">Top Losers (24h)</p>
                            <p className="text-3xl font-light text-red-400">
                                {isCryptoLoading ? <span className="text-theme-text-tertiary">Loading...</span> : marketStats.losers}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}