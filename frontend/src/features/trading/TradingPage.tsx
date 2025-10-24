import { useState, useMemo } from 'react';
import { useAppSelector } from '@/store/hooks';
import { useWebSocket } from '@/shared/hooks/useWebSocket';
import {
    Search,
    Star,
    TrendingUp,
    TrendingDown,
    ArrowUpDown,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
    mockStocks,
    mockCommodities,
    mockCurrencies,
    type Stock
} from '@/shared/data/mockStocks';
import { RootState } from '@/store/store';

type Category = 'stocks' | 'commodities' | 'currencies' | 'crypto';
type SortField = 'symbol' | 'price' | 'change' | 'volume';
type SortDirection = 'asc' | 'desc';

const WEBSOCKET_URL = 'ws://localhost:8000/ws/market/';

export default function TradingPage() {
    const { t } = useTranslation();
    const { user } = useAppSelector((state: RootState) => state.auth);
    const { prices, cryptoList, connected } = useAppSelector((state: RootState) => state.websocket);
    const currencyState = useAppSelector((state: RootState) => state.currency);

    useWebSocket({ url: WEBSOCKET_URL, autoConnect: true });

    const [activeTab, setActiveTab] = useState<Category>('crypto');
    const [searchQuery, setSearchQuery] = useState('');
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [sortField, setSortField] = useState<SortField>('volume');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

    const isCryptoLoading = !cryptoList || cryptoList.length === 0;

    const tabs = useMemo(() => [
        { key: 'crypto' as Category, label: t('market.tabs.crypto') },
        { key: 'stocks' as Category, label: t('market.tabs.stocks') },
        { key: 'currencies' as Category, label: t('market.tabs.forex') },
        { key: 'commodities' as Category, label: t('market.tabs.commodities') },
    ], [t]);

    const cryptoStocks: Stock[] = useMemo(() => {
        return cryptoList.map((crypto, index) => ({
            id: `crypto-${crypto.id}`,
            symbol: crypto.symbol,
            name: crypto.name,
            price: crypto.price,
            change: crypto.change_24h,
            changePercent: crypto.change_percent_24h,
            icon: crypto.image,
            isFavorite: index < 5,
            category: 'crypto' as const,
        }));
    }, [cryptoList]);

    const getDataSource = (): Stock[] => {
        switch (activeTab) {
            case 'stocks': return mockStocks;
            case 'commodities': return mockCommodities;
            case 'currencies': return mockCurrencies;
            case 'crypto': return cryptoStocks;
            default: return [];
        }
    };

    const mergedStocks = useMemo(() => {
        const dataSource = getDataSource();
        return dataSource.map(stock => {
            const livePrice = prices[stock.symbol];
            if (livePrice) {
                return {
                    ...stock,
                    price: livePrice.price,
                    change: livePrice.change,
                    changePercent: livePrice.changePercent,
                    icon: livePrice.image || stock.icon,
                };
            }
            return stock;
        });
    }, [activeTab, prices, cryptoStocks]);

    const processedStocks = useMemo(() => {
        let filtered = mergedStocks.filter(stock => {
            const matchesSearch =
                stock.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                stock.symbol.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFavorites = !showFavoritesOnly || stock.isFavorite;
            return matchesSearch && matchesFavorites;
        });

        filtered.sort((a, b) => {
            let aVal: number, bVal: number;
            switch (sortField) {
                case 'symbol':
                    return sortDirection === 'asc'
                        ? a.symbol.localeCompare(b.symbol)
                        : b.symbol.localeCompare(a.symbol);
                case 'price':
                    aVal = a.price;
                    bVal = b.price;
                    break;
                case 'change':
                    aVal = a.changePercent;
                    bVal = b.changePercent;
                    break;
                case 'volume':
                    aVal = Math.abs(a.changePercent);
                    bVal = Math.abs(b.changePercent);
                    break;
                default: return 0;
            }
            return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        });

        return filtered;
    }, [mergedStocks, searchQuery, showFavoritesOnly, sortField, sortDirection]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-black text-white [background-size:200%_200%] animate-background-pan">
            <div className="max-w-8xl mx-auto">

                <div className="w-full border-b border-zinc-900 bg-zinc-950/30 backdrop-blur-sm">
                    <div className="w-full px-6 py-6">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="flex items-baseline gap-6">
                                <h1 className="text-3xl sm:text-4xl font-extralight text-white tracking-tight">
                                    {t('market.title')}
                                </h1>
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800">
                                    {connected ? (
                                        <>
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            <span className="text-xs text-zinc-400">{t('market.status.realtime')}</span>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-2 h-2 rounded-full bg-red-500" />
                                            <span className="text-xs text-zinc-400">{t('market.status.disconnected')}</span>
                                        </>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                    <div className="w-full px-6">
                        <div className="flex items-center gap-1 border-b border-zinc-800">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`px-5 py-3.5 font-medium text-sm transition-colors duration-200 relative -mb-px ${
                                        activeTab === tab.key
                                            ? 'text-white'
                                            : 'text-zinc-500 hover:text-zinc-300'
                                    }`}
                                >
                                    {tab.label}
                                    <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-white transition-all duration-300 ease-out ${
                                        activeTab === tab.key ? 'scale-x-100' : 'scale-x-0'
                                    }`} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="w-full px-6 py-8">

                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex-1 max-w-md relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-500 w-4 h-4" />
                            <input
                                type="text"
                                placeholder={t('market.searchPlaceholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
                            />
                        </div>
                        <button
                            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                                showFavoritesOnly
                                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                    : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:border-zinc-700'
                            }`}
                        >
                            <Star className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
                            {t('market.favorites')}
                        </button>
                        <div className="flex items-center gap-1 bg-zinc-900 rounded-xl p-1">
                            <button
                                onClick={() => setViewMode('table')}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                    viewMode === 'table'
                                        ? 'bg-zinc-800 text-white'
                                        : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                            >
                                {t('market.view.table')}
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                    viewMode === 'grid'
                                        ? 'bg-zinc-800 text-white'
                                        : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                            >
                                {t('market.view.grid')}
                            </button>
                        </div>
                        <div className="text-sm text-zinc-500 ml-auto">
                            {t('market.assetsCount', { count: processedStocks.length })}
                        </div>
                    </div>

                    {isCryptoLoading ? (
                        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 flex justify-center items-center h-[60vh]">
                            <p className="text-zinc-500">Loading assets...</p>
                        </div>
                    ) : processedStocks.length === 0 ? (
                        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 flex justify-center items-center h-[60vh]">
                            <p className="text-zinc-500">{t('market.noAssetsFound')}</p>
                        </div>
                    ) : viewMode === 'table' ? (
                        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-zinc-800">
                                        <th className="text-left px-5 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                            {t('market.table.asset')}
                                        </th>
                                        <th
                                            className="text-right px-5 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-zinc-300 transition-colors"
                                            onClick={() => handleSort('price')}
                                        >
                                            <div className="flex items-center justify-end gap-1">
                                                {t('market.table.price')}
                                                <ArrowUpDown className="w-3 h-3" />
                                            </div>
                                        </th>
                                        <th
                                            className="text-right px-5 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-zinc-300 transition-colors"
                                            onClick={() => handleSort('change')}
                                        >
                                            <div className="flex items-center justify-end gap-1">
                                                {t('market.table.change24h')}
                                                <ArrowUpDown className="w-3 h-3" />
                                            </div>
                                        </th>
                                        <th className="text-right px-5 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                            {t('market.table.chart')}
                                        </th>
                                        <th className="text-right px-5 py-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                            {t('market.table.action')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {processedStocks.map((stock) => (
                                        <tr
                                            key={stock.id}
                                            className="border-b border-zinc-800/50 hover:bg-zinc-900 transition-colors cursor-pointer"
                                        >
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    {stock.isFavorite && (
                                                        <Star className="w-4 h-4 text-yellow-400 fill-current flex-shrink-0" />
                                                    )}
                                                    {stock.icon && typeof stock.icon === 'string' && stock.icon.startsWith('http') ? (
                                                        <img
                                                            src={stock.icon}
                                                            alt={stock.symbol}
                                                            className="w-8 h-8 rounded-full flex-shrink-0"
                                                        />
                                                    ) : stock.icon ? (
                                                        <span className="text-2xl flex-shrink-0">{stock.icon}</span>
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                                                            {stock.symbol[0]}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="font-medium text-white">{stock.symbol}</div>
                                                        <div className="text-xs text-zinc-500">{stock.name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <div className="font-mono font-medium text-white">
                                                    ${stock.price < 1
                                                        ? stock.price.toFixed(5)
                                                        : stock.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                                    }
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-sm font-medium ${
                                                    stock.changePercent >= 0
                                                        ? 'bg-green-950 text-green-400'
                                                        : 'bg-red-950 text-red-400'
                                                }`}>
                                                    {stock.changePercent >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                                                    {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <div className="inline-flex items-center justify-end w-20 h-8">
                                                    <svg className="w-full h-full" viewBox="0 0 80 32">
                                                        <polyline
                                                            points={`0,${16 - stock.changePercent} 20,${16 - stock.changePercent * 0.8} 40,${16 + stock.changePercent * 0.5} 60,${16 - stock.changePercent * 1.2} 80,${16 + stock.changePercent * 0.7}`}
                                                            fill="none"
                                                            stroke={stock.changePercent >= 0 ? '#10B981' : '#EF4444'}
                                                            strokeWidth="2"
                                                        />
                                                    </svg>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <button className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors">
                                                    {t('market.buy')}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                            {processedStocks.map((stock) => (
                                <div
                                    key={stock.id}
                                    className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 hover:border-zinc-700 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        {stock.icon && typeof stock.icon === 'string' && stock.icon.startsWith('http') ? (
                                            <img src={stock.icon} alt={stock.symbol} className="w-10 h-10 rounded-full" />
                                        ) : stock.icon ? (
                                            <span className="text-3xl">{stock.icon}</span>
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-lg font-bold">
                                                {stock.symbol[0]}
                                            </div>
                                        )}
                                        {stock.isFavorite && <Star className="w-4 h-4 text-yellow-400 fill-current" />}
                                    </div>
                                    <div className="mb-3">
                                        <h3 className="text-lg font-medium text-white">{stock.symbol}</h3>
                                        <p className="text-xs text-zinc-500 truncate">{stock.name}</p>

                                    </div>
                                    <div className="mb-3">
                                        <p className="text-2xl font-light font-mono text-white tracking-tight">
                                            ${stock.price < 1 ? stock.price.toFixed(5) : stock.price.toFixed(2)}
                                        </p>
                                    </div>
                                    <div className={`flex items-center gap-1 ${
                                        stock.changePercent >= 0 ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                        {stock.changePercent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                        <span className="font-medium text-sm">
                                            {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}