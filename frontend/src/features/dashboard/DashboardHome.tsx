import React, { useEffect, useState, useMemo, useRef } from 'react';
import { ArrowUpRight, ArrowDownRight, Activity, Wallet, Zap, TrendingUp, TrendingDown, Bot, Settings, Globe, Plus, Minus, ChevronRight } from 'lucide-react';
import { AreaChart, Area, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppSelector } from '@/store/hooks';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import { transactionService, BalanceHistoryEntry } from '@/services/transactionService';
import { tradingService, TradingSession } from '@/services/tradingService';
import { useWebSocket } from '@/shared/hooks/useWebSocket';
import { useTheme } from '@/contexts/ThemeContext';

const CoinCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { theme } = useTheme();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let width: number, height: number;
        let renderX: number, renderY: number, renderRadius: number;

        const coin = { rotation: 0, tiltX: 0, tiltY: 0 };
        const isLight = theme === 'light';

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            const dpr = window.devicePixelRatio || 1;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);

            if (width >= 1024) {
                renderX = width * 0.75;
                renderY = height * 0.45;
                renderRadius = Math.min(width, height) * 0.3;
            } else {
                renderX = width * 0.5;
                renderY = height * 0.3;
                renderRadius = width * 0.35;
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            const normX = (e.clientX - width / 2) / (width / 2);
            const normY = (e.clientY - height / 2) / (height / 2);
            coin.tiltY = normX * 0.4;
            coin.tiltX = normY * 0.4;
        };

        const draw = () => {
            ctx.clearRect(0, 0, width, height);
            coin.rotation += 0.008;

            ctx.save();
            ctx.translate(renderX, renderY);
            const scaleY = 1 - Math.abs(coin.tiltX) * 0.2;
            ctx.scale(1, scaleY);
            ctx.rotate(coin.tiltY * 0.3);

            const layers = 20;
            for(let i = 0; i < layers; i++) {
                ctx.beginPath();
                const depthOffset = i * (coin.tiltX * 2);
                ctx.ellipse(0, depthOffset, renderRadius, renderRadius, 0, 0, Math.PI * 2);

                const grad = ctx.createLinearGradient(-renderRadius, 0, renderRadius, 0);
                if (isLight) {
                    grad.addColorStop(0, '#C0C0C0');
                    grad.addColorStop(0.2, '#E8E8E8');
                    grad.addColorStop(0.5, '#B0B0B0');
                    grad.addColorStop(0.8, '#E8E8E8');
                    grad.addColorStop(1, '#C0C0C0');
                } else {
                    grad.addColorStop(0, '#333');
                    grad.addColorStop(0.2, '#DDD');
                    grad.addColorStop(0.5, '#666');
                    grad.addColorStop(0.8, '#DDD');
                    grad.addColorStop(1, '#333');
                }
                ctx.fillStyle = grad;
                ctx.fill();
            }

            const faceOffset = layers * (coin.tiltX * 2);
            ctx.beginPath();
            ctx.ellipse(0, faceOffset, renderRadius, renderRadius, 0, 0, Math.PI * 2);

            const faceGrad = ctx.createRadialGradient(0, faceOffset, 10, 0, faceOffset, renderRadius);
            if (isLight) {
                faceGrad.addColorStop(0, '#F5F5F5');
                faceGrad.addColorStop(0.7, '#E0E0E0');
                faceGrad.addColorStop(0.95, '#666');
                faceGrad.addColorStop(1, '#E0E0E0');
            } else {
                faceGrad.addColorStop(0, '#222');
                faceGrad.addColorStop(0.7, '#111');
                faceGrad.addColorStop(0.95, '#FFF');
                faceGrad.addColorStop(1, '#111');
            }
            ctx.fillStyle = faceGrad;
            ctx.fill();

            ctx.save();
            ctx.clip();
            ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)';
            ctx.lineWidth = 1.5;

            const time = Date.now() * 0.0005;
            for(let i = 0; i < 20; i++) {
                ctx.beginPath();
                const angle = (i / 20) * Math.PI * 2 + time + coin.rotation;
                ctx.moveTo(0, faceOffset);
                ctx.lineTo(Math.cos(angle) * renderRadius, Math.sin(angle) * renderRadius + faceOffset);
                ctx.stroke();
            }

            ctx.fillStyle = isLight ? '#1F2937' : '#E5E5E5';
            const fontSize = Math.round(renderRadius * 0.5);
            ctx.font = `bold ${fontSize}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.6)';
            ctx.shadowBlur = 20;

            ctx.save();
            ctx.translate(0, faceOffset);
            ctx.rotate(Math.sin(time * 0.5) * 0.1);
            ctx.fillText('B', 0, fontSize * 0.05);
            ctx.restore();

            ctx.restore();
            ctx.restore();

            animationFrameId = requestAnimationFrame(draw);
        };

        window.addEventListener('resize', resize);
        document.addEventListener('mousemove', handleMouseMove);
        resize();
        draw();

        return () => {
            window.removeEventListener('resize', resize);
            document.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, [theme]);

    return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none" />;
};

const WEBSOCKET_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/market/';

export default function DashboardHome() {
    const navigate = useNavigate();
    const assets = useAppSelector((state) => state.websocket.assets);
    const connected = useAppSelector((state) => state.websocket.connected);
    const user = useAppSelector((state) => state.auth.user);
    const currencyState = useAppSelector((state) => state.currency);
    const { t } = useTranslation();
    const { theme } = useTheme();
    const [greeting, setGreeting] = useState('');
    const [balanceHistory, setBalanceHistory] = useState<BalanceHistoryEntry[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [timeRange, setTimeRange] = useState<'1H' | '1D' | '7D' | '1M'>('7D');
    const [activeSession, setActiveSession] = useState<TradingSession | null>(null);
    const [loadingBotStatus, setLoadingBotStatus] = useState(true);

    const isLight = theme === 'light';

    useWebSocket({
        url: WEBSOCKET_URL,
        autoConnect: true,
        maxReconnectAttempts: 2,
        reconnectInterval: 5000
    });

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting(t('dashboard.greeting.morning', 'Good morning'));
        else if (hour < 18) setGreeting(t('dashboard.greeting.afternoon', 'Good afternoon'));
        else setGreeting(t('dashboard.greeting.evening', 'Good evening'));
    }, [t]);

    useEffect(() => {
        const loadBalanceHistory = async () => {
            try {
                setIsLoadingHistory(true);
                const history = await transactionService.getBalanceHistory();
                setBalanceHistory(history);
            } catch (error) {
                console.error('Failed to load balance history:', error);
            } finally {
                setIsLoadingHistory(false);
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
                console.error('No active trading session found:', error);
                setActiveSession(null);
            } finally {
                setLoadingBotStatus(false);
            }
        };

        loadBalanceHistory();
        fetchActiveSession();
    }, [user?.bot_type]);

    const cryptoList = useMemo(() =>
        Object.values(assets).filter(asset => asset.category === 'crypto'),
        [assets]
    );

    const marketStats = useMemo(() => {
        if (cryptoList.length === 0) {
            return { totalVolume: 0, avgChange: 0, gainers: 0, losers: 0 };
        }
        const totalVolume = cryptoList.reduce((sum, crypto) => sum + (crypto.volume || 0), 0);
        const avgChange = cryptoList.reduce((sum, crypto) => sum + crypto.change_percent_24h, 0) / cryptoList.length;
        const gainers = cryptoList.filter(c => c.change_percent_24h > 0).length;
        const losers = cryptoList.filter(c => c.change_percent_24h < 0).length;
        return { totalVolume, avgChange, gainers, losers };
    }, [cryptoList]);

    const topGainers = useMemo(() =>
        [...cryptoList].sort((a, b) => b.change_percent_24h - a.change_percent_24h).slice(0, 20),
        [cryptoList]
    );

    const topLosers = useMemo(() =>
        [...cryptoList].sort((a, b) => a.change_percent_24h - b.change_percent_24h).slice(0, 20),
        [cryptoList]
    );

    const portfolioValue = parseFloat(user?.balance || '0');

    const portfolioChange = useMemo(() => {
        if (balanceHistory.length < 2) return 0;
        const firstBalance = balanceHistory[0].balance;
        const lastBalance = balanceHistory[balanceHistory.length - 1].balance;
        if (firstBalance === 0) return 0;
        return ((lastBalance - firstBalance) / Math.abs(firstBalance)) * 100;
    }, [balanceHistory]);

    const filteredHistory = useMemo(() => {
        if (balanceHistory.length === 0) return [];

        const now = new Date();
        const cutoffTime = new Date();

        switch (timeRange) {
            case '1H':
                cutoffTime.setHours(now.getHours() - 1);
                break;
            case '1D':
                cutoffTime.setDate(now.getDate() - 1);
                break;
            case '7D':
                cutoffTime.setDate(now.getDate() - 7);
                break;
            case '1M':
                cutoffTime.setMonth(now.getMonth() - 1);
                break;
        }

        return balanceHistory.filter(entry =>
            new Date(entry.timestamp) >= cutoffTime
        );
    }, [balanceHistory, timeRange]);

    const chartData = useMemo(() => {
        if (filteredHistory.length === 0) {
            return [
                { name: 'Mon', value: portfolioValue * 0.9 },
                { name: 'Tue', value: portfolioValue * 0.92 },
                { name: 'Wed', value: portfolioValue * 0.95 },
                { name: 'Thu', value: portfolioValue * 0.94 },
                { name: 'Fri', value: portfolioValue * 0.98 },
                { name: 'Sat', value: portfolioValue * 1.02 },
                { name: 'Sun', value: portfolioValue },
            ];
        }

        return filteredHistory.map(entry => {
            const date = new Date(entry.timestamp);
            let name: string;

            if (timeRange === '1H') {
                name = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            } else if (timeRange === '1D') {
                name = date.toLocaleTimeString('en-US', { hour: '2-digit' });
            } else {
                name = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }

            return {
                name,
                value: entry.balance,
                timestamp: new Date(entry.timestamp).getTime(),
            };
        });
    }, [filteredHistory, portfolioValue, timeRange]);

    return (
        <div className={`relative w-full pb-20 font-sans ${isLight ? 'bg-light-bg text-light-text-primary' : 'bg-[#050505] text-[#E0E0E0]'}`}>

            <div className="absolute inset-0 pointer-events-none z-0">
                <div className={`absolute inset-0 ${isLight
                    ? 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gray-200/40 via-light-bg to-light-bg'
                    : 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gray-900/40 via-[#050505] to-[#050505]'}`}
                />
                <div className={`absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full animate-pulse border ${
                    isLight ? 'border-gray-300/60 opacity-40' : 'border-white/5 opacity-20'
                }`} style={{ animationDuration: '10s' }} />
                <div className={`absolute top-[20%] left-[-10%] w-[120%] h-[1px] -rotate-12 ${
                    isLight ? 'bg-gradient-to-r from-transparent via-gray-400/30 to-transparent' : 'bg-gradient-to-r from-transparent via-white/10 to-transparent'
                }`} />
                <div className={`absolute bottom-[-10%] left-[10%] w-[300px] h-[300px] rotate-45 border ${
                    isLight ? 'border-gray-300/60 opacity-30' : 'border-white/5 opacity-10'
                }`} />
                <div className={`absolute bottom-[-5%] right-[15%] w-[400px] h-[400px] rounded-full blur-3xl ${
                    isLight ? 'bg-gray-300/20' : 'bg-gray-800/10'
                }`} />
                <div className={`absolute top-[50%] left-[-5%] w-[250px] h-[250px] rounded-full blur-2xl ${
                    isLight ? 'bg-slate-200/20' : 'bg-slate-800/10'
                }`} />
            </div>

            <div className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none">
                <CoinCanvas />
            </div>

            <div className="relative z-10 w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 pt-16 sm:pt-20 lg:pt-24 flex flex-col gap-8 sm:gap-10 lg:gap-12 xl:gap-16">

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12 items-center">
                    <div className="lg:col-span-2 flex flex-col justify-center">
                        <div className={`inline-flex items-center gap-3 px-3 py-1 mb-6 lg:mb-8 rounded-sm w-fit backdrop-blur-sm border ${
                            isLight ? 'border-gray-200 bg-gray-100/50' : 'border-white/10 bg-white/5'
                        }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                            <span className={`text-[10px] font-mono font-bold uppercase tracking-[0.2em] ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                                {connected ? 'System Operational' : 'Reconnecting...'}
                            </span>
                        </div>

                        <h1 className={`font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-[0.9] mb-3 sm:mb-4 lg:mb-6 tracking-tight ${
                            isLight ? 'text-gray-900' : 'text-white'
                        }`}>
                            {greeting}, <br />
                            <span className={`italic font-serif ${isLight ? 'text-gray-500' : 'text-gray-500'}`}>{user?.first_name || 'Trader'}.</span>
                        </h1>

                        <p className={`text-sm sm:text-base lg:text-lg font-mono max-w-xl leading-relaxed pl-3 sm:pl-4 lg:pl-6 border-l ${
                            isLight ? 'text-gray-600 border-gray-300' : 'text-gray-500 border-white/10'
                        }`}>
                            Silver Ledger Active. Liquidity is optimal. <br />
                            Your assets are synchronized with the mesh.
                        </p>
                    </div>

                    <div className="hidden lg:block" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">

                    <div className={`lg:col-span-3 backdrop-blur-xl p-4 sm:p-6 lg:p-8 rounded-sm relative overflow-hidden group transition-colors border ${
                        isLight
                            ? 'bg-white/80 border-gray-200 hover:border-gray-300 shadow-lg'
                            : 'bg-[#0A0A0A]/60 border-white/10 hover:border-white/20'
                    }`}>
                        <div className={`absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none ${
                            isLight ? 'text-gray-400' : 'text-white'
                        }`}>
                            <Wallet size={140} strokeWidth={0.5} />
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className={`text-xs font-mono uppercase tracking-widest ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>
                                    {t('dashboard.totalBalance', 'Total Balance')}
                                </h3>

                                <div className={`flex gap-1 rounded-sm p-1 border ${
                                    isLight ? 'bg-gray-100 border-gray-200' : 'bg-white/5 border-white/10'
                                }`}>
                                    {(['1H', '1D', '7D', '1M'] as const).map((range) => (
                                        <button
                                            key={range}
                                            onClick={() => setTimeRange(range)}
                                            className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-mono uppercase tracking-wider transition-all ${
                                                timeRange === range
                                                    ? isLight
                                                        ? 'bg-gray-900 text-white font-bold'
                                                        : 'bg-white text-black font-bold'
                                                    : isLight
                                                        ? 'text-gray-600 hover:text-gray-900'
                                                        : 'text-gray-500 hover:text-white'
                                            }`}
                                        >
                                            {range}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4 mb-6 sm:mb-8">
                                <span className={`text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold font-mono tracking-tighter ${
                                    isLight ? 'text-gray-900' : 'text-white'
                                }`}>
                                    {formatCurrency(portfolioValue, currencyState)}
                                </span>
                                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold font-mono ${portfolioChange >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                    {portfolioChange >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                    {Math.abs(portfolioChange).toFixed(2)}%
                                </div>
                            </div>

                            <div className="h-[160px] sm:h-[180px] lg:h-[220px] w-full relative">
                                {isLoadingHistory ? (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className={`text-xs font-mono uppercase tracking-widest animate-pulse ${
                                            isLight ? 'text-gray-600' : 'text-gray-500'
                                        }`}>
                                            Loading Chart Data...
                                        </div>
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id={`chartGradient-${theme}`} x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={isLight ? '#111827' : '#E5E5E5'} stopOpacity={0.15} />
                                                    <stop offset="95%" stopColor={isLight ? '#111827' : '#E5E5E5'} stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <YAxis domain={['auto', 'auto']} hide />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: isLight ? '#FFFFFF' : '#050505',
                                                    borderColor: isLight ? '#E5E7EB' : '#333',
                                                    borderRadius: '0px'
                                                }}
                                                itemStyle={{ color: isLight ? '#111827' : '#fff', fontFamily: 'monospace' }}
                                                cursor={{ stroke: isLight ? '#E5E7EB' : '#333', strokeWidth: 1 }}
                                                formatter={(value: any) => [formatCurrency(Number(value), currencyState), 'Balance']}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="value"
                                                stroke={isLight ? '#111827' : '#E5E5E5'}
                                                strokeWidth={2.5}
                                                fill={`url(#chartGradient-${theme})`}
                                                animationDuration={1000}
                                                animationEasing="ease-in-out"
                                                dot={false}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-3 sm:space-y-4 lg:space-y-6">
                        <div className={`backdrop-blur-xl p-4 sm:p-6 lg:p-8 rounded-sm transition-colors border ${
                            isLight
                                ? 'bg-white/80 border-gray-200 hover:border-gray-300 shadow-lg'
                                : 'bg-[#0A0A0A]/60 border-white/10 hover:border-white/20'
                        }`}>
                             <h3 className={`text-sm font-mono uppercase tracking-widest mb-6 ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>
                                {t('dashboard.quickActions', 'Quick Actions')}
                             </h3>
                             <div className="grid grid-cols-1 gap-4">
                                <button
                                    onClick={() => navigate('/balance', { state: { openModal: 'deposit' } })}
                                    className={`flex items-center gap-3 sm:gap-4 p-4 sm:p-5 lg:p-6 rounded-sm transition-all group border ${
                                        isLight
                                            ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300'
                                            : 'bg-emerald-950/10 border-emerald-500/10 hover:bg-emerald-950/30 hover:border-emerald-500/30'
                                    }`}
                                >
                                    <div className="p-2.5 sm:p-3 bg-emerald-500/10 rounded-sm text-emerald-500 group-hover:text-emerald-600 transition-colors">
                                        <Plus size={20} className="sm:w-6 sm:h-6" />
                                    </div>
                                    <div className="text-left">
                                        <p className={`text-sm sm:text-base lg:text-lg font-bold transition-colors ${
                                            isLight ? 'text-gray-900 group-hover:text-emerald-700' : 'text-white group-hover:text-emerald-400'
                                        }`}>
                                            {t('dashboard.deposit', 'Deposit')}
                                        </p>
                                        <p className={`text-xs font-mono ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>Add funds</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => navigate('/balance', { state: { openModal: 'withdraw' } })}
                                    className={`flex items-center gap-3 sm:gap-4 p-4 sm:p-5 lg:p-6 rounded-sm transition-all group border ${
                                        isLight
                                            ? 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                                            : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                                    }`}
                                >
                                    <div className={`p-2.5 sm:p-3 rounded-sm transition-colors ${
                                        isLight
                                            ? 'bg-gray-200 text-gray-600 group-hover:text-gray-900'
                                            : 'bg-white/5 text-gray-400 group-hover:text-white'
                                    }`}>
                                        <Minus size={20} className="sm:w-6 sm:h-6" />
                                    </div>
                                    <div className="text-left">
                                        <p className={`text-sm sm:text-base lg:text-lg font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                                            {t('dashboard.withdraw', 'Withdraw')}
                                        </p>
                                        <p className={`text-xs font-mono ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>Transfer out</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => navigate('/bot-trading')}
                                    className={`flex items-center gap-3 sm:gap-4 p-4 sm:p-5 lg:p-6 rounded-sm transition-all group border ${
                                        isLight
                                            ? 'bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300'
                                            : 'bg-blue-950/10 border-blue-500/10 hover:bg-blue-950/30 hover:border-blue-500/30'
                                    }`}
                                >
                                    <div className="p-2.5 sm:p-3 bg-blue-500/10 rounded-sm text-blue-400 group-hover:text-blue-600 transition-colors">
                                        <Activity size={20} className="sm:w-6 sm:h-6" />
                                    </div>
                                    <div className="text-left">
                                        <p className={`text-sm sm:text-base lg:text-lg font-bold transition-colors ${
                                            isLight ? 'text-gray-900 group-hover:text-blue-700' : 'text-white group-hover:text-blue-400'
                                        }`}>
                                            {t('dashboard.trade', 'Trade')}
                                        </p>
                                        <p className={`text-xs font-mono ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>Bot trading</p>
                                    </div>
                                </button>
                             </div>
                        </div>

                        <div className={`backdrop-blur-xl p-4 sm:p-6 lg:p-8 rounded-sm border ${
                            isLight
                                ? 'bg-white/80 border-gray-200 shadow-lg'
                                : 'bg-[#0A0A0A]/60 border-white/10'
                        }`}>
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                                    <span className={`font-serif text-lg sm:text-xl lg:text-2xl ${isLight ? 'text-gray-900' : 'text-white'}`}>Trading Bot</span>
                                </div>
                                {user?.bot_type !== 'none' && (
                                    <span className={`flex items-center gap-2 text-xs ${activeSession?.is_active ? 'text-emerald-500' : isLight ? 'text-gray-600' : 'text-gray-500'}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${activeSession?.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-gray-500'}`}></div>
                                        {activeSession?.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                )}
                            </div>
                            {loadingBotStatus ? (
                                <div className="flex justify-center py-8">
                                    <div className={`w-5 h-5 border-2 rounded-full animate-spin ${
                                        isLight ? 'border-gray-200 border-t-gray-900' : 'border-white/20 border-t-white'
                                    }`}></div>
                                </div>
                            ) : user?.bot_type === 'none' ? (
                                <div className="text-center py-4">
                                    <p className={`text-xs mb-4 ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>No active bot</p>
                                    <button
                                        onClick={() => navigate('/bot-trading')}
                                        className={`text-xs font-mono px-4 py-2 rounded-sm transition-all uppercase tracking-wider border ${
                                            isLight
                                                ? 'bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-900'
                                                : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                                        }`}
                                    >
                                        Activate Bot
                                    </button>
                                </div>
                            ) : activeSession ? (
                                <div className="space-y-4 lg:space-y-5">
                                    <div>
                                        <p className={`text-xs uppercase tracking-wider mb-2 ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>Type</p>
                                        <p className={`text-base lg:text-lg font-mono capitalize ${isLight ? 'text-gray-900' : 'text-white'}`}>
                                            {activeSession.bot_type}
                                        </p>
                                    </div>
                                    <div>
                                        <p className={`text-xs uppercase tracking-wider mb-2 ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>P/L</p>
                                        <p className={`text-base lg:text-lg font-mono ${parseFloat(activeSession.total_profit) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                            {parseFloat(activeSession.total_profit) >= 0 ? '+' : ''}
                                            {formatCurrency(activeSession.total_profit, currencyState)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => navigate('/bot-trading')}
                                        className={`w-full text-sm font-mono px-5 py-3 lg:py-4 rounded-sm transition-all uppercase tracking-wider mt-4 flex items-center justify-center gap-2 border ${
                                            isLight
                                                ? 'bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-900'
                                                : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                                        }`}
                                    >
                                        <Settings className="w-4 h-4" />
                                        Manage
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <p className={`text-xs mb-4 ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>No active session</p>
                                    <button
                                        onClick={() => navigate('/bot-trading')}
                                        className={`text-xs font-mono px-4 py-2 rounded-sm transition-all uppercase tracking-wider border ${
                                            isLight
                                                ? 'bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-900'
                                                : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                                        }`}
                                    >
                                        Start Session
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-12 sm:mb-16 lg:mb-20">
                    <div className={`backdrop-blur-xl rounded-sm overflow-hidden border ${
                        isLight
                            ? 'bg-white/80 border-gray-200 shadow-lg'
                            : 'bg-[#0A0A0A]/60 border-white/10'
                    }`}>
                        <div className={`flex items-center justify-between p-5 border-b ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
                            <h3 className={`font-serif text-xl flex items-center gap-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                                <TrendingUp className="w-5 h-5 text-emerald-500" />
                                Top Gainers
                            </h3>
                            <button
                                onClick={() => navigate('/trading')}
                                className={`text-xs font-mono uppercase tracking-wider transition-colors flex items-center gap-1 ${
                                    isLight ? 'text-gray-600 hover:text-gray-900' : 'text-gray-500 hover:text-white'
                                }`}
                            >
                                View All <ChevronRight className="w-3 h-3" />
                            </button>
                        </div>
                        <div className={`p-4 max-h-[400px] lg:max-h-[500px] overflow-y-auto scrollbar-thin ${
                            isLight ? 'scrollbar-thumb-gray-300 scrollbar-track-gray-100' : 'scrollbar-thumb-white/10 scrollbar-track-transparent'
                        }`}>
                            {cryptoList.length === 0 ? (
                                <div className="flex justify-center py-12">
                                    <div className={`w-6 h-6 border-2 rounded-full animate-spin ${
                                        isLight ? 'border-gray-200 border-t-gray-900' : 'border-white/20 border-t-white'
                                    }`}></div>
                                </div>
                            ) : topGainers.length === 0 ? (
                                <div className={`text-center py-10 text-sm ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>No gainers found</div>
                            ) : (
                                <div className="space-y-2">
                                    {topGainers.map((crypto, index) => (
                                        <div
                                            key={crypto.id}
                                            className={`flex items-center justify-between p-3 rounded-sm transition-colors cursor-pointer group ${
                                                isLight ? 'hover:bg-gray-100' : 'hover:bg-white/5'
                                            }`}
                                            onClick={() => navigate('/trading')}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={`font-mono text-xs w-4 ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>{index + 1}</span>
                                                <img src={crypto.image} alt={crypto.symbol} className="w-8 h-8 rounded-full" />
                                                <div>
                                                    <p className={`text-sm font-bold transition-colors ${
                                                        isLight ? 'text-gray-900 group-hover:text-emerald-600' : 'text-white group-hover:text-emerald-500'
                                                    }`}>
                                                        {crypto.symbol.toUpperCase()}
                                                    </p>
                                                    <p className={`text-[10px] font-mono ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>
                                                        {crypto.name}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-sm font-mono mb-1 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                                                     {formatCurrency(crypto.price, currencyState)}
                                                </p>
                                                <div className="text-emerald-500 text-xs font-mono flex items-center justify-end gap-1">
                                                    <ArrowUpRight className="w-3 h-3" />
                                                    +{crypto.change_percent_24h.toFixed(2)}%
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={`backdrop-blur-xl rounded-sm overflow-hidden border ${
                        isLight
                            ? 'bg-white/80 border-gray-200 shadow-lg'
                            : 'bg-[#0A0A0A]/60 border-white/10'
                    }`}>
                        <div className={`flex items-center justify-between p-5 border-b ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
                            <h3 className={`font-serif text-xl flex items-center gap-2 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                                <TrendingDown className="w-5 h-5 text-red-500" />
                                Top Losers
                            </h3>
                            <button
                                onClick={() => navigate('/trading')}
                                className={`text-xs font-mono uppercase tracking-wider transition-colors flex items-center gap-1 ${
                                    isLight ? 'text-gray-600 hover:text-gray-900' : 'text-gray-500 hover:text-white'
                                }`}
                            >
                                View All <ChevronRight className="w-3 h-3" />
                            </button>
                        </div>
                        <div className={`p-4 max-h-[400px] lg:max-h-[500px] overflow-y-auto scrollbar-thin ${
                            isLight ? 'scrollbar-thumb-gray-300 scrollbar-track-gray-100' : 'scrollbar-thumb-white/10 scrollbar-track-transparent'
                        }`}>
                            {cryptoList.length === 0 ? (
                                <div className="flex justify-center py-12">
                                    <div className={`w-6 h-6 border-2 rounded-full animate-spin ${
                                        isLight ? 'border-gray-200 border-t-gray-900' : 'border-white/20 border-t-white'
                                    }`}></div>
                                </div>
                            ) : topLosers.length === 0 ? (
                                <div className={`text-center py-10 text-sm ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>No losers found</div>
                            ) : (
                                <div className="space-y-2">
                                    {topLosers.map((crypto, index) => (
                                        <div
                                            key={crypto.id}
                                            className={`flex items-center justify-between p-3 rounded-sm transition-colors cursor-pointer group ${
                                                isLight ? 'hover:bg-gray-100' : 'hover:bg-white/5'
                                            }`}
                                            onClick={() => navigate('/trading')}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={`font-mono text-xs w-4 ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>{index + 1}</span>
                                                <img src={crypto.image} alt={crypto.symbol} className="w-8 h-8 rounded-full" />
                                                <div>
                                                    <p className={`text-sm font-bold transition-colors ${
                                                        isLight ? 'text-gray-900 group-hover:text-red-600' : 'text-white group-hover:text-red-500'
                                                    }`}>
                                                        {crypto.symbol.toUpperCase()}
                                                    </p>
                                                    <p className={`text-[10px] font-mono ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>
                                                        {crypto.name}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-sm font-mono mb-1 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                                                     {formatCurrency(crypto.price, currencyState)}
                                                </p>
                                                <div className="text-red-500 text-xs font-mono flex items-center justify-end gap-1">
                                                    <ArrowDownRight className="w-3 h-3" />
                                                    {crypto.change_percent_24h.toFixed(2)}%
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}