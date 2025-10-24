import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { useWebSocket } from '@/shared/hooks/useWebSocket';
import { useTranslation } from 'react-i18next';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
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

function Spinner({ size = 'h-8 w-8' }: { size?: string }) {
    return (
        <div className={`animate-spin rounded-full ${size} border-2 border-zinc-800 border-t-white`}></div>
    );
}

const WEBSOCKET_URL = 'ws://localhost:8000/ws/market/';

function TickerItem({ crypto, currencyState }: { crypto: any, currencyState: any }) {
    const isUp = crypto.change_percent_24h >= 0;
    return (
        <div className="flex items-center gap-2 mx-4 flex-none py-2.5">
            <img src={crypto.image} alt={crypto.symbol} className="w-5 h-5 rounded-full" />
            <span className="font-medium text-sm text-zinc-300">{crypto.symbol.toUpperCase()}</span>
            <span className="font-mono text-sm text-zinc-400">
                {formatCurrency(crypto.price, currencyState)}
            </span>
            <span className={`flex items-center text-xs font-medium ${isUp ? 'text-green-500' : 'text-red-500'}`}>
                {isUp ? <ArrowUpRight size={14} className="mr-0.5" /> : <ArrowDownRight size={14} className="mr-0.5" />}
                {crypto.change_percent_24h.toFixed(2)}%
            </span>
        </div>
    );
}

function PriceTicker({ cryptoList, currencyState }: { cryptoList: any[], currencyState: any }) {
    const tickerList = cryptoList.slice(0, 20);
    if (!tickerList || tickerList.length === 0) {
        return (
            <div className="w-full bg-zinc-950 border-b border-zinc-800 py-3 text-center text-sm text-zinc-500">
                Loading price ticker...
            </div>
        );
    }
    return (
        <div className="w-full bg-zinc-950 border-b border-zinc-800 overflow-hidden whitespace-nowrap relative group">
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

interface BalanceHistoryEntry {
    timestamp: string;
    balance: number;
}

const MOCK_DATA: BalanceHistoryEntry[] = [
    { timestamp: '2023-10-01T00:00:00Z', balance: 10000 },
    { timestamp: '2023-10-02T00:00:00Z', balance: 10150 },
    { timestamp: '2023-10-03T00:00:00Z', balance: 9900 },
    { timestamp: '2023-10-04T00:00:00Z', balance: 10300 },
    { timestamp: '2023-10-05T00:00:00Z', balance: 10500 },
    { timestamp: '2023-10-06T00:00:00Z', balance: 10450 },
    { timestamp: '2023-10-07T00:00:00Z', balance: 10700 },
    { timestamp: '2023-10-08T00:00:00Z', balance: 11000 },
    { timestamp: '2023-10-09T00:00:00Z', balance: 10950 },
    { timestamp: '2023-10-10T00:00:00Z', balance: 11200 },
    { timestamp: '2023-10-11T00:00:00Z', balance: 11500 },
    { timestamp: '2023-10-12T00:00:00Z', balance: 11350 },
];

const CustomTooltip = ({ active, payload, label, currencyState }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-lg">
                <p className="text-xs text-zinc-400 mb-1">{new Date(label).toLocaleDateString()}</p>
                <p className="text-sm font-bold text-white">
                    {formatCurrency(payload[0].value, currencyState)}
                </p>
            </div>
        );
    }
    return null;
};

export default function DashboardHome() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { user } = useAppSelector((state: RootState) => state.auth);
    const { cryptoList, connected } = useAppSelector((state: RootState) => state.websocket);
    const currencyState = useAppSelector((state: RootState) => state.currency);

    useWebSocket({ url: WEBSOCKET_URL, autoConnect: true });

    const [currentTime, setCurrentTime] = useState(new Date());
    const [balanceVisible, setBalanceVisible] = useState(true);

    const [flashState, setFlashState] = useState<{[key: string]: 'up' | 'down'}>({});

    const isCryptoLoading = !cryptoList || cryptoList.length === 0;

    const prevCryptoList = usePrevious(cryptoList);

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

    const balanceHistory = MOCK_DATA;
    const chartData = useMemo(() => {
        return balanceHistory.map(entry => ({
            date: entry.timestamp,
            balance: entry.balance,
        }));
    }, [balanceHistory]);

    const balanceBorderAnimation = marketStats.avgChange >= 0
        ? 'animate-pulse-border-green'
        : 'animate-pulse-border-red';

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-black text-white [background-size:200%_200%] animate-background-pan">
            <div className="max-w-8xl mx-auto">

                <PriceTicker cryptoList={cryptoList} currencyState={currencyState} />

                <div className="w-full border-b border-zinc-900 bg-zinc-950/30 backdrop-blur-sm">
                    <div className="w-full px-6 py-6">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                    <span className="text-sm text-zinc-400 font-mono tracking-widest">
                                        {currentTime.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <h1 className="text-3xl sm:text-4xl font-extralight text-white tracking-tight mb-1">
                                    {t('dashboard.greetingName', { name: user.full_name || user.email.split('@')[0] })}
                                </h1>
                                <p className="text-base text-zinc-500 font-light">
                                    Welcome back to your investment dashboard
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button className="p-2.5 hover:bg-zinc-900 rounded-xl transition-all duration-300">
                                    <Bell className="w-5 h-5 text-zinc-400" />
                                </button>
                                <button className="p-2.5 hover:bg-zinc-900 rounded-xl transition-all duration-300">
                                    <Settings className="w-5 h-5 text-zinc-400" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6">

                    <div className="lg:col-span-8 flex flex-col gap-6">

                        <div className={`bg-zinc-950 border rounded-3xl p-6 relative overflow-hidden transition-all duration-1000 ${
                            isCryptoLoading ? 'border-zinc-800' : balanceBorderAnimation
                        }`}>
                            <div className="relative">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary-500/30">
                                            <Wallet className="w-8 h-8 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-zinc-400 text-sm font-medium mb-1.5">{t('dashboard.totalBalance')}</p>
                                            <div className="flex items-center gap-3">
                                                <h2 className="text-4xl font-extralight text-white tracking-tight">
                                                    {balanceVisible
                                                        ? formatCurrency(user.balance, currencyState)
                                                        : '••••••••'
                                                    }
                                                </h2>
                                                <button
                                                    onClick={() => setBalanceVisible(!balanceVisible)}
                                                    className="p-2 hover:bg-zinc-800 rounded-lg transition-all duration-300"
                                                >
                                                    {balanceVisible ?
                                                        <Eye className="w-5 h-5 text-zinc-500" /> :
                                                        <EyeOff className="w-5 h-5 text-zinc-500" />
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
                                                <span className="text-zinc-500 text-xs">last 24h</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row justify-start lg:justify-end gap-3">
                                        <button
                                            onClick={() => navigate('/dashboard/balance', { state: { openDeposit: true } })}
                                            className="btn-primary w-full sm:w-auto px-6 py-3 text-sm"
                                        >
                                            <Plus className="w-4 h-4" />
                                            {t('dashboard.deposit')}
                                        </button>
                                        <button
                                            onClick={() => navigate('/dashboard/balance')}
                                            className="btn-secondary w-full sm:w-auto px-6 py-3 text-sm"
                                        >
                                            <Minus className="w-4 h-4" />
                                            {t('dashboard.withdraw')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 h-[21.6rem]">
                            <h3 className="text-lg font-light text-white mb-4">Balance Overview</h3>
                            <ResponsiveContainer width="100%" height="90%">
                                <AreaChart
                                    data={chartData}
                                    margin={{
                                        top: 5,
                                        right: 0,
                                        left: 0,
                                        bottom: 0,
                                    }}
                                >
                                    <defs>
                                        <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.7}/>
                                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                                        stroke="#7A7A7A"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        domain={['dataMin - 100', 'dataMax + 100']}
                                        hide={true}
                                    />
                                    <Tooltip
                                        content={<CustomTooltip currencyState={currencyState} />}
                                        cursor={{ stroke: '#3A3A3A', strokeWidth: 1, strokeDasharray: "5 5" }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="balance"
                                        stroke="#0ea5e9"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorBalance)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden">
                            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
                                <h3 className="text-lg font-light text-white flex items-center gap-2.5">
                                    <TrendingUp className="w-5 h-5 text-green-400" />
                                    {t('dashboard.topGainers')}
                                </h3>
                                <button
                                    onClick={() => navigate('/dashboard/trading')}
                                    className="text-sm text-zinc-500 hover:text-zinc-300 flex items-center gap-1.5 transition-colors duration-300"
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
                                    <div className="text-center py-10 text-zinc-500 text-sm">No gainers found.</div>
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
                                                    className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 cursor-pointer group ${flashClass} hover:bg-zinc-900`}
                                                    onClick={() => navigate('/dashboard/trading')}
                                                >
                                                    <div className="flex items-center gap-3.5">
                                                        <span className="text-zinc-600 font-mono text-sm w-5 group-hover:text-zinc-400 transition-colors">
                                                            {index + 1}
                                                        </span>
                                                        <img
                                                            src={crypto.image}
                                                            alt={crypto.symbol}
                                                            className="w-10 h-10 rounded-full"
                                                        />
                                                        <div>
                                                            <p className="text-sm font-medium text-white group-hover:text-green-400 transition-colors">
                                                                {crypto.symbol.toUpperCase()}
                                                            </p>
                                                            <p className="text-xs text-zinc-600 mt-0.5 truncate max-w-[100px] md:max-w-[150px]">
                                                                {crypto.name}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-mono text-white text-sm mb-0.5">
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

                        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden">
                            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
                                <h3 className="text-lg font-light text-white flex items-center gap-2.5">
                                    <TrendingDown className="w-5 h-5 text-red-400" />
                                    {t('dashboard.topLosers')}
                                </h3>
                                <button
                                    onClick={() => navigate('/dashboard/trading')}
                                    className="text-sm text-zinc-500 hover:text-zinc-300 flex items-center gap-1.5 transition-colors duration-300"
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
                                    <div className="text-center py-10 text-zinc-500 text-sm">No losers found.</div>
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
                                                    className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 cursor-pointer group ${flashClass} hover:bg-zinc-900`}
                                                    onClick={() => navigate('/dashboard/trading')}
                                                >
                                                    <div className="flex items-center gap-3.5">
                                                        <span className="text-zinc-600 font-mono text-sm w-5 group-hover:text-zinc-400 transition-colors">
                                                            {index + 1}
                                                        </span>
                                                        <img
                                                            src={crypto.image}
                                                            alt={crypto.symbol}
                                                            className="w-10 h-10 rounded-full"
                                                        />
                                                        <div>
                                                            <p className="text-sm font-medium text-white group-hover:text-red-400 transition-colors">
                                                                {crypto.symbol.toUpperCase()}
                                                            </p>
                                                            <p className="text-xs text-zinc-600 mt-0.5 truncate max-w-[100px] md:max-w-[150px]">
                                                                {crypto.name}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-mono text-white text-sm mb-0.5">
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

                        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
                            <h3 className="text-lg font-light mb-6 text-white text-center">
                                {t('dashboard.quickActions')}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 max-w-4xl mx-auto">
                                <button
                                    onClick={() => navigate('/dashboard/balance', { state: { openDeposit: true } })}
                                    className="flex flex-col items-center gap-3 p-4 bg-green-950/20 border border-green-800/50 rounded-2xl hover:bg-green-950/40 transition-all duration-300 group"
                                >
                                    <Plus className="w-9 h-9 text-green-400 group-hover:scale-110 transition-transform animate-pulse" />
                                    <span className="text-green-400 font-medium text-base">{t('dashboard.deposit')}</span>
                                    <p className="text-zinc-500 text-center text-xs">Add funds to your account</p>
                                </button>
                                <button
                                    onClick={() => navigate('/dashboard/balance')}
                                    className="flex flex-col items-center gap-3 p-4 border border-zinc-700 rounded-2xl hover:bg-zinc-900 transition-all duration-300 group"
                                >
                                    <Minus className="w-9 h-9 text-zinc-400 group-hover:scale-110 transition-transform" />
                                    <span className="text-zinc-300 font-medium text-base">{t('dashboard.withdraw')}</span>
                                    <p className="text-zinc-500 text-center text-xs">Withdraw your earnings</p>
                                </button>
                                <button
                                    onClick={() => navigate('/dashboard/trading')}
                                    className="flex flex-col items-center gap-3 p-4 border border-zinc-700 rounded-2xl hover:bg-zinc-900 transition-all duration-300 group"
                                >
                                    <Activity className="w-9 h-9 text-purple-400 group-hover:scale-110 transition-transform" />
                                    <span className="text-zinc-300 font-medium text-base">{t('dashboard.trade')}</span>
                                    <p className="text-zinc-500 text-center text-xs">Start trading cryptocurrencies</p>
                                </button>
                            </div>
                        </div>

                        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-lg font-light text-white flex items-center gap-2.5">
                                    <Bot className="w-5 h-5 text-purple-400" />
                                    Trading Bot Status
                                </h3>
                                <span className="flex items-center gap-2 text-xs font-medium text-green-400">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    Active
                                </span>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-zinc-500 text-sm mb-1">Bot Name</p>
                                    <p className="text-base font-medium text-white">GridMaster v1.2</p>
                                </div>
                                <div>
                                    <p className="text-zinc-500 text-sm mb-1">Uptime</p>
                                    <p className="text-base font-mono text-white">7d 4h 15m</p>
                                </div>
                                <div>
                                    <p className="text-zinc-500 text-sm mb-1">Current P/L</p>
                                    <p className="text-base font-mono text-green-400">
                                        + {formatCurrency(120.50, currencyState)}
                                    </p>
                                </div>
                                <button className="btn-secondary w-full text-sm mt-2">
                                    <Settings className="w-4 h-4" />
                                    Manage Bot
                                </button>
                            </div>
                        </div>

                        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 hover:border-zinc-700 transition-all duration-300 transform hover:-translate-y-1">
                            <div className="flex items-center justify-between mb-5">
                                <div className="p-2.5 bg-blue-950 rounded-xl">
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
                            <p className="text-zinc-500 text-sm mb-2">{t('dashboard.volume24h')}</p>
                            <p className="text-3xl font-light text-white">
                                {isCryptoLoading ? <span className="text-zinc-700">Loading...</span> : formatCurrency(marketStats.totalVolume, currencyState, { notation: 'compact', maximumFractionDigits: 1 })}
                            </p>
                        </div>

                        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 hover:border-zinc-700 transition-all duration-300 transform hover:-translate-y-1">
                            <div className="flex items-center justify-between mb-5">
                                <div className="p-2.5 bg-green-950 rounded-xl">
                                    <TrendingUp className="w-7 h-7 text-green-400" />
                                </div>
                                <Target className="w-5 h-5 text-zinc-600" />
                            </div>
                            <p className="text-zinc-500 text-sm mb-2">Top Gainers (24h)</p>
                            <p className="text-3xl font-light text-green-400">
                                {isCryptoLoading ? <span className="text-zinc-700">Loading...</span> : marketStats.gainers}
                            </p>
                        </div>

                        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 hover:border-zinc-700 transition-all duration-300 transform hover:-translate-y-1">
                            <div className="flex items-center justify-between mb-5">
                                <div className="p-2.5 bg-red-950 rounded-xl">
                                    <TrendingDown className="w-7 h-7 text-red-400" />
                                </div>
                                <Target className="w-5 h-5 text-zinc-600" />
                            </div>
                            <p className="text-zinc-500 text-sm mb-2">Top Losers (24h)</p>
                            <p className="text-3xl font-light text-red-400">
                                {isCryptoLoading ? <span className="text-zinc-700">Loading...</span> : marketStats.losers}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}