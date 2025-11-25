import { useState, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { useWebSocket } from '@/shared/hooks/useWebSocket';
import {
    Search,
    Star,
    TrendingUp,
    TrendingDown,
    ArrowUpDown,
    Loader2,
    AlertCircle,
    RefreshCw,
    BarChart3,
    Sparkles,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { RootState } from '@/store/store';
import { AssetCategory, AssetItem, toggleFavorite } from '@/store/slices/websocketSlice';
import AssetChartModal from './AssetChartModal';
import { useTheme } from '@/contexts/ThemeContext';
import { formatCurrency } from '@/shared/utils/formatCurrency';

type SortField = 'symbol' | 'price' | 'change' | 'volume';
type SortDirection = 'asc' | 'desc';

// Determine WebSocket URL based on current location
const getWebSocketURL = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    // Use environment variable or default to localhost:8000
    const port = import.meta.env.VITE_WS_PORT || '8000';
    const wsHost = host === 'localhost' || host === '127.0.0.1' ? `${host}:${port}` : host;
    return `${protocol}//${wsHost}/ws/market/`;
};

export default function TradingPage() {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const { assets, connected, loading: isAssetsLoading, error } = useAppSelector((state: RootState) => state.websocket);
    const currencyState = useAppSelector((state: RootState) => state.currency);
    const { theme } = useTheme();
    const isLight = theme === 'light';

    const WEBSOCKET_URL = getWebSocketURL();
    console.log('📡 Using WebSocket URL:', WEBSOCKET_URL);

    const { connect } = useWebSocket({ url: WEBSOCKET_URL, autoConnect: true });

    const handleRetry = () => {
        console.log('🔄 Manually retrying WebSocket connection...');
        window.location.reload();
    };

    const [activeTab, setActiveTab] = useState<AssetCategory>('crypto');
    const [searchQuery, setSearchQuery] = useState('');
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [sortField, setSortField] = useState<SortField>('volume');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
    const [selectedAsset, setSelectedAsset] = useState<AssetItem | null>(null);

    const tabs = useMemo(() => [
        { key: 'crypto' as AssetCategory, label: t('market.tabs.crypto'), icon: '₿' },
        { key: 'stocks' as AssetCategory, label: t('market.tabs.stocks'), icon: '📈' },
        { key: 'forex' as AssetCategory, label: t('market.tabs.forex'), icon: '💱' },
        { key: 'commodities' as AssetCategory, label: t('market.tabs.commodities'), icon: '🪙' },
    ], [t]);

    const allAssets = useMemo(() => Object.values(assets), [assets]);

    const processedAssets = useMemo(() => {
        let filtered = allAssets.filter(asset => {
            if (asset.category !== activeTab) return false;

            const matchesSearch =
                asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                asset.symbol.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesFavorites = !showFavoritesOnly || asset.isFavorite;

            return matchesSearch && matchesFavorites;
        });

        filtered.sort((a, b) => {
            let aVal: number | string, bVal: number | string;
            switch (sortField) {
                case 'symbol':
                    aVal = a.symbol;
                    bVal = b.symbol;
                    return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
                case 'price':
                    aVal = a.price;
                    bVal = b.price;
                    break;
                case 'change':
                    aVal = a.change_percent_24h;
                    bVal = b.change_percent_24h;
                    break;
                case 'volume':
                    aVal = a.volume;
                    bVal = b.volume;
                    break;
                default: return 0;
            }
            return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
        });

        return filtered;
    }, [allAssets, activeTab, searchQuery, showFavoritesOnly, sortField, sortDirection]);

    // Top 3 assets for hero section
    const topAssets = useMemo(() => {
        return processedAssets.slice(0, 3);
    }, [processedAssets]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const handleToggleFavorite = (e: React.MouseEvent, symbol: string) => {
        e.stopPropagation();
        dispatch(toggleFavorite(symbol));
    };

    const handleAssetClick = (asset: AssetItem) => {
        setSelectedAsset(asset);
    };

    const formatPrice = (price: number) => {
        return formatCurrency(price, currencyState, {
            maximumFractionDigits: price < 1 ? 5 : 2
        });
    };

    return (
        <div className={`relative w-full pb-20 font-sans ${isLight ? 'bg-light-bg text-light-text-primary' : 'bg-[#050505] text-[#E0E0E0]'}`}>

            {/* Background decorations */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className={`absolute inset-0 ${isLight
                    ? 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-200/40 via-light-bg to-light-bg'
                    : 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/20 via-[#050505] to-[#050505]'}`}
                />
                <div className={`absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full animate-pulse border ${
                    isLight ? 'border-emerald-300/60 opacity-40' : 'border-emerald-500/20 opacity-20'
                }`} style={{ animationDuration: '10s' }} />
                <div className={`absolute top-[20%] left-[-10%] w-[120%] h-[1px] -rotate-12 ${
                    isLight ? 'bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent' : 'bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent'
                }`} />
                <div className={`absolute bottom-[-5%] right-[20%] w-[300px] h-[300px] rounded-full blur-3xl ${
                    isLight ? 'bg-emerald-300/20' : 'bg-emerald-900/10'
                }`} />
                <div className={`absolute top-[40%] left-[-5%] w-[200px] h-[200px] rounded-full blur-2xl ${
                    isLight ? 'bg-blue-200/20' : 'bg-blue-900/10'
                }`} />
            </div>

            <div className="relative z-10 w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 pt-16 sm:pt-20 lg:pt-24 flex flex-col gap-8 sm:gap-10 lg:gap-12 xl:gap-16">

                {/* Hero Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12 items-center">
                    <div className="lg:col-span-2 flex flex-col justify-center">
                        <div className={`inline-flex items-center gap-3 px-3 py-1 mb-6 lg:mb-8 rounded-sm w-fit backdrop-blur-sm border ${
                            isLight ? 'border-emerald-200 bg-emerald-100/50' : 'border-emerald-500/20 bg-emerald-500/10'
                        }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                            <span className={`text-[10px] font-mono font-bold uppercase tracking-[0.2em] ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                                {connected ? t('market.status.realtime') : t('market.status.disconnected')}
                            </span>
                        </div>

                        <h1 className={`font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-[0.9] mb-3 sm:mb-4 lg:mb-6 tracking-tight ${
                            isLight ? 'text-gray-900' : 'text-white'
                        }`}>
                            {t('market.title')}<br />
                            <span className={`italic font-serif ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>Watch.</span>
                        </h1>

                        <p className={`text-sm sm:text-base lg:text-lg font-mono max-w-xl leading-relaxed pl-3 sm:pl-4 lg:pl-6 border-l ${
                            isLight ? 'text-gray-600 border-emerald-300' : 'text-gray-400 border-emerald-500/20'
                        }`}>
                            Live market data • {processedAssets.length} assets tracked<br />
                            Real-time price updates and advanced analytics.
                        </p>
                    </div>

                    <div className="hidden lg:block" />
                </div>

                {/* Top 3 Featured Assets - Mobile Horizontal Scroll */}
                {topAssets.length >= 3 && (
                    <div className="md:hidden relative">
                        {/* Scroll hint - right gradient */}
                        <div className={`absolute right-0 top-0 bottom-4 w-12 pointer-events-none z-10 ${
                            isLight
                                ? 'bg-gradient-to-l from-light-bg to-transparent'
                                : 'bg-gradient-to-l from-[#050505] to-transparent'
                        }`} />

                        <div className="overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-12 2xl:-mx-16 px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 pb-4 scrollbar-hide snap-x snap-mandatory" style={{ WebkitOverflowScrolling: 'touch' }}>
                            <div className="flex gap-4" style={{ width: 'fit-content', minWidth: '100%' }}>
                            {topAssets.map((asset, index) => (
                                <div
                                    key={asset.id}
                                    onClick={() => handleAssetClick(asset)}
                                    className={`backdrop-blur-xl p-4 sm:p-6 rounded-sm cursor-pointer transition-all border group w-[280px] flex-shrink-0 snap-start ${
                                        isLight
                                            ? 'bg-white/80 border-gray-200 hover:border-emerald-400 shadow-lg active:scale-95'
                                            : 'bg-[#0A0A0A]/60 border-white/10 hover:border-emerald-500/40 active:scale-95'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            {asset.image && asset.image.startsWith('http') ? (
                                                <img src={asset.image} alt={asset.symbol} className="w-10 h-10 rounded-full" />
                                            ) : asset.image ? (
                                                <span className="text-3xl">{asset.image}</span>
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-lg font-bold text-white">
                                                    {asset.symbol[0]}
                                                </div>
                                            )}
                                            <div>
                                                <p className={`font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{asset.symbol}</p>
                                                <p className={`text-xs ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>{asset.name}</p>
                                            </div>
                                        </div>
                                        <button onClick={(e) => handleToggleFavorite(e, asset.symbol)} className="p-1">
                                            <Star className={`w-5 h-5 ${asset.isFavorite ? 'text-yellow-400 fill-current' : isLight ? 'text-gray-400' : 'text-gray-600'}`} />
                                        </button>
                                    </div>
                                    <div className="mb-2">
                                        <p className={`text-3xl font-bold font-mono ${isLight ? 'text-gray-900' : 'text-white'}`}>
                                            {formatPrice(asset.price)}
                                        </p>
                                    </div>
                                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
                                        asset.change_percent_24h >= 0
                                            ? 'bg-emerald-500/10 text-emerald-500'
                                            : 'bg-red-500/10 text-red-500'
                                    }`}>
                                        {asset.change_percent_24h >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                        {asset.change_percent_24h >= 0 ? '+' : ''}{asset.change_percent_24h.toFixed(2)}%
                                    </div>
                                </div>
                            ))}
                        </div>
                        </div>
                    </div>
                )}
                {topAssets.length >= 3 && (
                    <div className="hidden md:grid md:grid-cols-3 gap-4 sm:gap-6">
                        {topAssets.map((asset, index) => (
                            <div
                                key={asset.id}
                                onClick={() => handleAssetClick(asset)}
                                className={`backdrop-blur-xl p-4 sm:p-6 rounded-sm cursor-pointer transition-all border group ${
                                    isLight
                                        ? 'bg-white/80 border-gray-200 hover:border-emerald-400 shadow-lg'
                                        : 'bg-[#0A0A0A]/60 border-white/10 hover:border-emerald-500/40'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        {asset.image && asset.image.startsWith('http') ? (
                                            <img src={asset.image} alt={asset.symbol} className="w-10 h-10 rounded-full" />
                                        ) : asset.image ? (
                                            <span className="text-3xl">{asset.image}</span>
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-lg font-bold text-white">
                                                {asset.symbol[0]}
                                            </div>
                                        )}
                                        <div>
                                            <p className={`font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{asset.symbol}</p>
                                            <p className={`text-xs ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>{asset.name}</p>
                                        </div>
                                    </div>
                                    <button onClick={(e) => handleToggleFavorite(e, asset.symbol)} className="p-1">
                                        <Star className={`w-5 h-5 ${asset.isFavorite ? 'text-yellow-400 fill-current' : isLight ? 'text-gray-400' : 'text-gray-600'}`} />
                                    </button>
                                </div>
                                <div className="mb-2">
                                    <p className={`text-3xl font-bold font-mono ${isLight ? 'text-gray-900' : 'text-white'}`}>
                                        {formatPrice(asset.price)}
                                    </p>
                                </div>
                                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
                                    asset.change_percent_24h >= 0
                                        ? 'bg-emerald-500/10 text-emerald-500'
                                        : 'bg-red-500/10 text-red-500'
                                }`}>
                                    {asset.change_percent_24h >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                    {asset.change_percent_24h >= 0 ? '+' : ''}{asset.change_percent_24h.toFixed(2)}%
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-4 sm:px-6 py-2 sm:py-3 font-mono uppercase tracking-wider text-xs sm:text-sm font-bold rounded-sm transition-all flex items-center gap-1.5 sm:gap-2 border whitespace-nowrap ${
                                activeTab === tab.key
                                    ? isLight
                                        ? 'bg-gray-900 text-white border-gray-900'
                                        : 'bg-white text-black border-white'
                                    : isLight
                                        ? 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                                        : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                            }`}
                        >
                            <span>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Search & Filters */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
                    <div className="flex-1 relative">
                        <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${isLight ? 'text-gray-400' : 'text-gray-600'}`} />
                        <input
                            type="text"
                            placeholder={t('market.searchPlaceholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-sm font-mono transition-all border ${
                                isLight
                                    ? 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-500 focus:border-emerald-500'
                                    : 'bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-emerald-500'
                            } focus:outline-none focus:ring-1 focus:ring-emerald-500`}
                        />
                    </div>
                    <button
                        onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                        className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-sm font-mono uppercase tracking-wider text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 border whitespace-nowrap ${
                            showFavoritesOnly
                                ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30'
                                : isLight
                                    ? 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                                    : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                        }`}
                    >
                        <Star className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
                        <span className="hidden sm:inline">Favorites</span>
                        <span className="sm:hidden">Fav</span>
                    </button>
                    <div className={`flex items-center gap-1 p-1 rounded-sm border ${
                        isLight ? 'bg-gray-100 border-gray-200' : 'bg-white/5 border-white/10'
                    }`}>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-sm font-mono text-xs sm:text-sm font-bold uppercase tracking-wider transition-all ${
                                viewMode === 'table'
                                    ? isLight
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-white text-black'
                                    : isLight
                                        ? 'text-gray-600 hover:text-gray-900'
                                        : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Table
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-sm font-mono text-xs sm:text-sm font-bold uppercase tracking-wider transition-all ${
                                viewMode === 'grid'
                                    ? isLight
                                        ? 'bg-gray-900 text-white'
                                        : 'bg-white text-black'
                                    : isLight
                                        ? 'text-gray-600 hover:text-gray-900'
                                        : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            Grid
                        </button>
                    </div>
                </div>

                {/* Content */}
                {error && !connected ? (
                    <div className={`backdrop-blur-xl p-12 rounded-sm flex flex-col justify-center items-center min-h-[60vh] space-y-6 border ${
                        isLight
                            ? 'bg-white/80 border-red-200 shadow-lg'
                            : 'bg-[#0A0A0A]/60 border-red-500/30'
                    }`}>
                        <div className="bg-red-500/10 p-6 rounded-full">
                            <AlertCircle className="w-16 h-16 text-red-500" />
                        </div>
                        <div className="text-center space-y-2 max-w-md">
                            <h3 className={`text-xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{t('market.error.title')}</h3>
                            <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'}`}>{error}</p>
                        </div>
                        <button
                            onClick={handleRetry}
                            className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-sm font-mono uppercase tracking-wider font-bold transition-all"
                        >
                            <RefreshCw className="w-5 h-5" />
                            {t('market.error.retry')}
                        </button>
                    </div>
                ) : isAssetsLoading ? (
                    <div className={`backdrop-blur-xl p-12 rounded-sm flex flex-col justify-center items-center min-h-[60vh] space-y-4 border ${
                        isLight
                            ? 'bg-white/80 border-gray-200 shadow-lg'
                            : 'bg-[#0A0A0A]/60 border-white/10'
                    }`}>
                        <Loader2 className={`w-12 h-12 animate-spin ${isLight ? 'text-emerald-600' : 'text-emerald-500'}`} />
                        <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'}`}>{t('market.loading.connecting')}</p>
                    </div>
                ) : processedAssets.length === 0 ? (
                    <div className={`backdrop-blur-xl p-12 rounded-sm flex justify-center items-center min-h-[60vh] border ${
                        isLight
                            ? 'bg-white/80 border-gray-200 shadow-lg'
                            : 'bg-[#0A0A0A]/60 border-white/10'
                    }`}>
                        <p className={`${isLight ? 'text-gray-600' : 'text-gray-400'}`}>{t('market.noAssetsFound')}</p>
                    </div>
                ) : viewMode === 'table' ? (
                    <div className={`backdrop-blur-xl rounded-sm overflow-hidden border ${
                        isLight
                            ? 'bg-white/80 border-gray-200 shadow-lg'
                            : 'bg-[#0A0A0A]/60 border-white/10'
                    }`}>
                        <table className="w-full">
                            <thead>
                                <tr className={`border-b ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
                                    <th className={`text-left px-6 py-4 text-xs font-mono uppercase tracking-wider ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                                        Asset
                                    </th>
                                    <th
                                        className={`text-right px-6 py-4 text-xs font-mono uppercase tracking-wider cursor-pointer transition-colors ${
                                            isLight ? 'text-gray-600 hover:text-gray-900' : 'text-gray-400 hover:text-white'
                                        }`}
                                        onClick={() => handleSort('price')}
                                    >
                                        <div className="flex items-center justify-end gap-1">
                                            Price
                                            <ArrowUpDown className="w-3 h-3" />
                                        </div>
                                    </th>
                                    <th
                                        className={`text-right px-6 py-4 text-xs font-mono uppercase tracking-wider cursor-pointer transition-colors ${
                                            isLight ? 'text-gray-600 hover:text-gray-900' : 'text-gray-400 hover:text-white'
                                        }`}
                                        onClick={() => handleSort('change')}
                                    >
                                        <div className="flex items-center justify-end gap-1">
                                            24h Change
                                            <ArrowUpDown className="w-3 h-3" />
                                        </div>
                                    </th>
                                    <th
                                        className={`text-right px-6 py-4 text-xs font-mono uppercase tracking-wider cursor-pointer transition-colors ${
                                            isLight ? 'text-gray-600 hover:text-gray-900' : 'text-gray-400 hover:text-white'
                                        }`}
                                        onClick={() => handleSort('volume')}
                                    >
                                        <div className="flex items-center justify-end gap-1">
                                            Volume
                                            <ArrowUpDown className="w-3 h-3" />
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {processedAssets.map((asset) => (
                                    <tr
                                        key={asset.id}
                                        className={`border-b cursor-pointer transition-colors ${
                                            isLight
                                                ? 'border-gray-100 hover:bg-gray-50'
                                                : 'border-white/5 hover:bg-white/5'
                                        }`}
                                        onClick={() => handleAssetClick(asset)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <button onClick={(e) => handleToggleFavorite(e, asset.symbol)} className="p-1">
                                                    <Star className={`w-4 h-4 ${asset.isFavorite ? 'text-yellow-400 fill-current' : isLight ? 'text-gray-400' : 'text-gray-600'}`} />
                                                </button>
                                                {asset.image && asset.image.startsWith('http') ? (
                                                    <img src={asset.image} alt={asset.symbol} className="w-8 h-8 rounded-full" />
                                                ) : asset.image ? (
                                                    <span className="text-2xl">{asset.image}</span>
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-sm font-bold text-white">
                                                        {asset.symbol[0]}
                                                    </div>
                                                )}
                                                <div>
                                                    <div className={`font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{asset.symbol}</div>
                                                    <div className={`text-xs ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>{asset.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className={`font-mono font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                                                {formatPrice(asset.price)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${
                                                asset.change_percent_24h >= 0
                                                    ? 'bg-emerald-500/10 text-emerald-500'
                                                    : 'bg-red-500/10 text-red-500'
                                            }`}>
                                                {asset.change_percent_24h >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                                                {asset.change_percent_24h >= 0 ? '+' : ''}{asset.change_percent_24h.toFixed(2)}%
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className={`font-mono text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                                                {formatCurrency(asset.volume, currencyState, { maximumFractionDigits: 0, notation: 'compact' })}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-16 lg:mb-20">
                        {processedAssets.map((asset) => (
                            <div
                                key={asset.id}
                                onClick={() => handleAssetClick(asset)}
                                className={`backdrop-blur-xl p-4 sm:p-6 rounded-sm cursor-pointer transition-all border ${
                                    isLight
                                        ? 'bg-white/80 border-gray-200 hover:border-emerald-400 shadow-lg hover:shadow-xl'
                                        : 'bg-[#0A0A0A]/60 border-white/10 hover:border-emerald-500/40'
                                }`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    {asset.image && asset.image.startsWith('http') ? (
                                        <img src={asset.image} alt={asset.symbol} className="w-10 h-10 rounded-full" />
                                    ) : asset.image ? (
                                        <span className="text-3xl">{asset.image}</span>
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-lg font-bold text-white">
                                            {asset.symbol[0]}
                                        </div>
                                    )}
                                    <button onClick={(e) => handleToggleFavorite(e, asset.symbol)} className="p-1">
                                        <Star className={`w-5 h-5 ${asset.isFavorite ? 'text-yellow-400 fill-current' : isLight ? 'text-gray-400' : 'text-gray-600'}`} />
                                    </button>
                                </div>
                                <div className="mb-3">
                                    <h3 className={`text-lg font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{asset.symbol}</h3>
                                    <p className={`text-xs ${isLight ? 'text-gray-600' : 'text-gray-400'} truncate`}>{asset.name}</p>
                                </div>
                                <div className="mb-3">
                                    <p className={`text-2xl font-bold font-mono ${isLight ? 'text-gray-900' : 'text-white'}`}>
                                        {formatPrice(asset.price)}
                                    </p>
                                </div>
                                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-bold ${
                                    asset.change_percent_24h >= 0
                                        ? 'bg-emerald-500/10 text-emerald-500'
                                        : 'bg-red-500/10 text-red-500'
                                }`}>
                                    {asset.change_percent_24h >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                    {asset.change_percent_24h >= 0 ? '+' : ''}{asset.change_percent_24h.toFixed(2)}%
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {selectedAsset && (
                <AssetChartModal
                    asset={selectedAsset}
                    onClose={() => setSelectedAsset(null)}
                />
            )}
        </div>
    );
}
