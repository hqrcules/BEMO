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
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { RootState } from '@/store/store';
import { AssetCategory, AssetItem, toggleFavorite } from '@/store/slices/websocketSlice';
import AssetChartModal from './AssetChartModal';

type SortField = 'symbol' | 'price' | 'change' | 'volume';
type SortDirection = 'asc';

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
        { key: 'crypto' as AssetCategory, label: t('market.tabs.crypto') },
        { key: 'stocks' as AssetCategory, label: t('market.tabs.stocks') },
        { key: 'forex' as AssetCategory, label: t('market.tabs.forex') },
        { key: 'commodities' as AssetCategory, label: t('market.tabs.commodities') },
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

    return (
        <div className="min-h-screen bg-theme-bg text-theme-text">
            <div className="max-w-8xl mx-auto">

                <div className="w-full border-b border-theme-border bg-theme-bg-secondary backdrop-blur-sm">
                    <div className="w-full px-6 py-6">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="flex items-baseline gap-6">
                                <h1 className="text-3xl sm:text-4xl font-extralight text-theme-text tracking-tight">
                                    {t('market.title')}
                                </h1>
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-theme-bg-tertiary border border-theme-border">
                                    {connected ? (
                                        <>
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            <span className="text-xs text-theme-text-secondary">{t('market.status.realtime')}</span>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-2 h-2 rounded-full bg-red-500" />
                                            <span className="text-xs text-theme-text-secondary">{t('market.status.disconnected')}</span>
                                        </>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                    <div className="w-full px-6">
                        <div className="flex items-center gap-1 border-b border-theme-border">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`px-5 py-3.5 font-medium text-sm transition-colors duration-200 relative -mb-px ${
                                        activeTab === tab.key
                                            ? 'text-theme-text'
                                            : 'text-theme-text-tertiary hover:text-theme-text'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="w-full px-6 py-8">

                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex-1 max-w-md relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-theme-text-tertiary w-4 h-4" />
                            <input
                                type="text"
                                placeholder={t('market.searchPlaceholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 bg-theme-bg-secondary border border-theme-border rounded-xl text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
                            />
                        </div>
                        <button
                            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                                showFavoritesOnly
                                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                    : 'bg-theme-bg-secondary text-theme-text-secondary border border-theme-border hover:border-zinc-400 dark:hover:border-zinc-700'
                            }`}
                        >
                            <Star className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
                            {t('market.favorites')}
                        </button>
                        <div className="flex items-center gap-1 bg-theme-bg-tertiary rounded-xl p-1">
                            <button
                                onClick={() => setViewMode('table')}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                    viewMode === 'table'
                                        ? 'bg-theme-bg text-theme-text'
                                        : 'text-theme-text-tertiary hover:text-theme-text'
                                }`}
                            >
                                {t('market.view.table')}
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                    viewMode === 'grid'
                                        ? 'bg-theme-bg text-theme-text'
                                        : 'text-theme-text-tertiary hover:text-theme-text'
                                }`}
                            >
                                {t('market.view.grid')}
                            </button>
                        </div>
                        <div className="text-sm text-theme-text-tertiary ml-auto">
                            {t('market.assetsCount', { count: processedAssets.length })}
                        </div>
                    </div>

                    {error && !connected ? (
                        <div className="bg-theme-bg-secondary border border-red-500/30 rounded-3xl p-12 flex flex-col justify-center items-center h-[60vh] space-y-6">
                            <div className="bg-red-500/10 p-6 rounded-full">
                                <AlertCircle className="w-16 h-16 text-red-500" />
                            </div>
                            <div className="text-center space-y-2 max-w-md">
                                <h3 className="text-xl font-semibold text-theme-text">{t('market.error.title')}</h3>
                                <p className="text-theme-text-secondary">{error}</p>
                                <p className="text-sm text-theme-text-tertiary mt-4">
                                    {t('market.error.websocketUrl')} <code className="bg-theme-bg-tertiary px-2 py-1 rounded">{WEBSOCKET_URL}</code>
                                </p>
                                <p className="text-sm text-theme-text-tertiary">
                                    {t('market.error.backendInfo')}
                                </p>
                            </div>
                            <button
                                onClick={handleRetry}
                                className="flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors"
                            >
                                <RefreshCw className="w-5 h-5" />
                                {t('market.error.retry')}
                            </button>
                        </div>
                    ) : isAssetsLoading ? (
                        <div className="bg-theme-bg-secondary border border-theme-border rounded-3xl p-6 flex flex-col justify-center items-center h-[60vh] space-y-4">
                            <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
                            <p className="text-theme-text-secondary">{t('market.loading.connecting')}</p>
                        </div>
                    ) : processedAssets.length === 0 ? (
                        <div className="bg-theme-bg-secondary border border-theme-border rounded-3xl p-6 flex justify-center items-center h-[60vh]">
                            <p className="text-theme-text-tertiary">{t('market.noAssetsFound')}</p>
                        </div>
                    ) : viewMode === 'table' ? (
                        <div className="bg-theme-bg-secondary border border-theme-border rounded-3xl overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-theme-border">
                                        <th className="text-left px-5 py-4 text-xs font-medium text-theme-text-tertiary uppercase tracking-wider">
                                            {t('market.table.asset')}
                                        </th>
                                        <th
                                            className="text-right px-5 py-4 text-xs font-medium text-theme-text-tertiary uppercase tracking-wider cursor-pointer hover:text-theme-text transition-colors"
                                            onClick={() => handleSort('price')}
                                        >
                                            <div className="flex items-center justify-end gap-1">
                                                {t('market.table.price')}
                                                <ArrowUpDown className="w-3 h-3" />
                                            </div>
                                        </th>
                                        <th
                                            className="text-right px-5 py-4 text-xs font-medium text-theme-text-tertiary uppercase tracking-wider cursor-pointer hover:text-theme-text transition-colors"
                                            onClick={() => handleSort('change')}
                                        >
                                            <div className="flex items-center justify-end gap-1">
                                                {t('market.table.change24h')}
                                                <ArrowUpDown className="w-3 h-3" />
                                            </div>
                                        </th>
                                        <th
                                            className="text-right px-5 py-4 text-xs font-medium text-theme-text-tertiary uppercase tracking-wider cursor-pointer hover:text-theme-text transition-colors"
                                            onClick={() => handleSort('volume')}
                                        >
                                            <div className="flex items-center justify-end gap-1">
                                                {t('market.table.volume')}
                                                <ArrowUpDown className="w-3 h-3" />
                                            </div>
                                        </th>
                                        {/* REMOVED: Action column header */}
                                    </tr>
                                </thead>
                                <tbody>
                                    {processedAssets.map((asset) => (
                                        <tr
                                            key={asset.id}
                                            className="border-b border-theme-border/50 hover:bg-theme-bg-hover transition-colors cursor-pointer"
                                            onClick={() => handleAssetClick(asset)}
                                        >
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <button onClick={(e) => handleToggleFavorite(e, asset.symbol)} className="p-1 -ml-1 text-theme-text-tertiary hover:text-yellow-400">
                                                        <Star className={`w-4 h-4 ${asset.isFavorite ? 'text-yellow-400 fill-current' : ''}`} />
                                                    </button>

                                                    {asset.image && asset.image.startsWith('http') ? (
                                                        <img
                                                            src={asset.image}
                                                            alt={asset.symbol}
                                                            className="w-8 h-8 rounded-full flex-shrink-0"
                                                        />
                                                    ) : asset.image ? (
                                                        <span className="text-2xl flex-shrink-0">{asset.image}</span>
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                                                            {asset.symbol[0]}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="font-medium text-theme-text">{asset.symbol}</div>
                                                        <div className="text-xs text-theme-text-tertiary">{asset.name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <div className="font-mono font-medium text-theme-text">
                                                    ${asset.price < 1
                                                        ? asset.price.toFixed(5)
                                                        : asset.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                                    }
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                {/* UPDATED: Styles for 24h change for better visibility in light theme */}
                                                <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-sm font-medium ${
                                                    asset.change_percent_24h >= 0
                                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-green-950 dark:text-green-400' // Darker green for light theme
                                                        : 'bg-rose-100 text-rose-800 dark:bg-red-950 dark:text-red-400'     // Darker red for light theme
                                                }`}>
                                                    {asset.change_percent_24h >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                                                    {asset.change_percent_24h >= 0 ? '+' : ''}{asset.change_percent_24h.toFixed(2)}%
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <div className="font-mono text-sm text-theme-text-secondary">
                                                     ${asset.volume > 1000000 ? (asset.volume / 1000000).toFixed(2) + 'M' : asset.volume.toFixed(0)}
                                                </div>
                                            </td>
                                            {/* REMOVED: Buy button column */}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                            {processedAssets.map((asset) => (
                                <div
                                    key={asset.id}
                                    className="bg-theme-bg-secondary border border-theme-border rounded-3xl p-6 hover:border-zinc-400 dark:hover:border-zinc-700 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                                    onClick={() => handleAssetClick(asset)}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        {asset.image && asset.image.startsWith('http') ? (
                                            <img src={asset.image} alt={asset.symbol} className="w-10 h-10 rounded-full" />
                                        ) : asset.image ? (
                                            <span className="text-3xl">{asset.image}</span>
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-lg font-bold">
                                                {asset.symbol[0]}
                                            </div>
                                        )}
                                        <button onClick={(e) => handleToggleFavorite(e, asset.symbol)} className="p-1 -mr-1 text-theme-text-tertiary hover:text-yellow-400">
                                            <Star className={`w-5 h-5 ${asset.isFavorite ? 'text-yellow-400 fill-current' : ''}`} />
                                        </button>
                                    </div>
                                    <div className="mb-3">
                                        <h3 className="text-lg font-medium text-theme-text">{asset.symbol}</h3>
                                        <p className="text-xs text-theme-text-tertiary truncate">{asset.name}</p>

                                    </div>
                                    <div className="mb-3">
                                        <p className="text-2xl font-light font-mono text-theme-text tracking-tight">
                                            ${asset.price < 1 ? asset.price.toFixed(5) : asset.price.toFixed(2)}
                                        </p>
                                    </div>
                                    {/* UPDATED: Styles for 24h change for better visibility in light theme (grid view) */}
                                    <div className={`flex items-center gap-1 ${
                                        asset.change_percent_24h >= 0 ? 'text-emerald-700 dark:text-green-400' : 'text-rose-700 dark:text-red-400'
                                    }`}>
                                        {asset.change_percent_24h >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                        <span className="font-medium text-sm">
                                            {asset.change_percent_24h >= 0 ? '+' : ''}{asset.change_percent_24h.toFixed(2)}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

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