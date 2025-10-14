import { useState, useMemo } from 'react';
import { useAppSelector } from '@/store/hooks';
import { useWebSocket } from '@/shared/hooks/useWebSocket';
import { Search, Star, TrendingUp, TrendingDown, ArrowUpDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  mockStocks,
  mockCommodities,
  mockCurrencies,
  type Stock
} from '@/shared/data/mockStocks';

type Category = 'stocks' | 'commodities' | 'currencies' | 'crypto';
type SortField = 'symbol' | 'price' | 'change' | 'volume';
type SortDirection = 'asc' | 'desc';

const WEBSOCKET_URL = 'ws://localhost:8000/ws/market/';

export default function TradingPage() {
  const { t } = useTranslation();
  const { user } = useAppSelector((state) => state.auth);
  const { prices, cryptoList, connected } = useAppSelector((state) => state.websocket);

  useWebSocket({ url: WEBSOCKET_URL, autoConnect: true });

  const [activeTab, setActiveTab] = useState<Category>('crypto');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sortField, setSortField] = useState<SortField>('volume');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const tabs = useMemo(() => [
    { key: 'crypto' as Category, label: t('market.tabs.crypto'), color: 'from-orange-500 to-yellow-500' },
    { key: 'stocks' as Category, label: t('market.tabs.stocks'), color: 'from-blue-500 to-cyan-500' },
    { key: 'currencies' as Category, label: t('market.tabs.forex'), color: 'from-green-500 to-emerald-500' },
    { key: 'commodities' as Category, label: t('market.tabs.commodities'), color: 'from-purple-500 to-pink-500' },
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
    <div className="min-h-screen bg-[#0B0E11] text-white">
      {/* Top Bar */}
      <div className="border-b border-gray-800 bg-[#161A1E]">
        <div className="max-w-[1920px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h1 className="text-2xl font-bold">{t('market.title')}</h1>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800/50">
                {connected ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-xs text-gray-400">{t('market.status.realtime')}</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <span className="text-xs text-gray-400">{t('market.status.disconnected')}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs text-gray-500">{t('market.availableBalance')}</p>
                <p className="text-xl font-bold text-green-400">
                  ${parseFloat(user?.balance || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="border-b border-gray-800 bg-[#161A1E]">
        <div className="max-w-[1920px] mx-auto px-6">
          <div className="flex items-center gap-1 -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-4 font-medium text-sm transition-all relative ${
                  activeTab === tab.key
                    ? 'text-white'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${tab.color}`} />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="border-b border-gray-800 bg-[#161A1E]">
        <div className="max-w-[1920px] mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input
                type="text"
                placeholder={t('market.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#0B0E11] border border-gray-800 rounded-lg text-sm focus:outline-none focus:border-gray-700 transition-colors"
              />
            </div>
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                showFavoritesOnly
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  : 'bg-gray-800/50 text-gray-400 border border-gray-800 hover:border-gray-700'
              }`}
            >
              <Star className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
              {t('market.favorites')}
            </button>
            <div className="flex items-center gap-1 bg-gray-800/50 rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  viewMode === 'table'
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {t('market.view.table')}
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {t('market.view.grid')}
              </button>
            </div>
            <div className="text-sm text-gray-500">
              {t('market.assetsCount', { count: processedStocks.length })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1920px] mx-auto px-6 py-6">
        {processedStocks.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500">{t('market.noAssetsFound')}</p>
          </div>
        ) : viewMode === 'table' ? (
          <div className="bg-[#161A1E] rounded-xl border border-gray-800 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('market.table.asset')}
                  </th>
                  <th
                    className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-300 transition-colors"
                    onClick={() => handleSort('price')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      {t('market.table.price')}
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-300 transition-colors"
                    onClick={() => handleSort('change')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      {t('market.table.change24h')}
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('market.table.chart')}
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('market.table.action')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {processedStocks.map((stock) => (
                  <tr
                    key={stock.id}
                    className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-4">
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
                          <div className="font-semibold text-white">{stock.symbol}</div>
                          <div className="text-xs text-gray-500">{stock.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="font-mono font-semibold text-white">
                        ${stock.price < 1
                          ? stock.price.toFixed(5)
                          : stock.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        }
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-semibold ${
                        stock.changePercent >= 0
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-red-500/10 text-red-400'
                      }`}>
                        {stock.changePercent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
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
                    <td className="px-4 py-4 text-right">
                      <button className="px-4 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded transition-colors">
                        {t('market.buy')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {processedStocks.map((stock) => (
              <div
                key={stock.id}
                className="bg-[#161A1E] border border-gray-800 rounded-xl p-4 hover:border-gray-700 hover:shadow-xl transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
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
                  <h3 className="text-lg font-bold">{stock.symbol}</h3>
                  <p className="text-xs text-gray-500 truncate">{stock.name}</p>
                </div>
                <div className="mb-3">
                  <p className="text-2xl font-bold font-mono">
                    ${stock.price < 1 ? stock.price.toFixed(5) : stock.price.toFixed(2)}
                  </p>
                </div>
                <div className={`flex items-center gap-1 ${
                  stock.changePercent >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {stock.changePercent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span className="font-semibold text-sm">
                    {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}