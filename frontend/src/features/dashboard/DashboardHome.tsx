// frontend/src/features/dashboard/DashboardHome.tsx
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

const WEBSOCKET_URL = 'ws://localhost:8000/ws/market/';

export default function DashboardHome() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAppSelector((state) => state.auth);
  const { cryptoList, connected } = useAppSelector((state) => state.websocket);

  useWebSocket({ url: WEBSOCKET_URL, autoConnect: true });

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const marketStats = useMemo(() => {
    if (!cryptoList || cryptoList.length === 0) {
      return { totalVolume: 0, avgChange: 0, gainers: 0, losers: 0 };
    }

    const totalVolume = cryptoList.reduce((sum, crypto) => sum + (crypto.volume || 0), 0);
    const avgChange = cryptoList.reduce((sum, crypto) => sum + crypto.change_percent_24h, 0) / cryptoList.length;
    const gainers = cryptoList.filter(c => c.change_percent_24h > 0).length;
    const losers = cryptoList.filter(c => c.change_percent_24h < 0).length;

    return { totalVolume, avgChange, gainers, losers };
  }, [cryptoList]);

  const topGainers = useMemo(() => {
    if (!cryptoList || cryptoList.length === 0) return [];
    return [...cryptoList]
      .sort((a, b) => b.change_percent_24h - a.change_percent_24h)
      .slice(0, 5);
  }, [cryptoList]);

  const topLosers = useMemo(() => {
    if (!cryptoList || cryptoList.length === 0) return [];
    return [...cryptoList]
      .sort((a, b) => a.change_percent_24h - b.change_percent_24h)
      .slice(0, 5);
  }, [cryptoList]);

  const recentActivities = useMemo(() => [
    { type: 'buy', asset: 'BTC', amount: 0.0245, price: 43250, time: t('dashboard.mockTime1') },
    { type: 'sell', asset: 'ETH', amount: 1.5, price: 2245, time: t('dashboard.mockTime2') },
    { type: 'buy', asset: 'SOL', amount: 12, price: 98.67, time: t('dashboard.mockTime3') },
  ], [t]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0B0E11] text-white">
      {/* Hero Section with Animated Background */}
      <div className="relative overflow-hidden border-b border-gray-800">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 animate-gradient-xy" />
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="relative max-w-[1920px] mx-auto px-6 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Welcome & Balance */}
            <div className="lg:col-span-7">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                  <span className="text-sm text-gray-400">
                    {currentTime.toLocaleTimeString('ru-RU')}
                  </span>
                </div>
                <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {t('dashboard.greetingName', { name: user.email.split('@')[0] })}
                </h1>
                <p className="text-gray-400 text-lg">
                  {t('dashboard.portfolioGrowth')}{' '}
                  <span className="text-green-400 font-semibold">+{marketStats.avgChange.toFixed(2)}%</span>{' '}
                  {t('dashboard.last24h')}
                </p>
              </div>

              {/* Main Balance Card */}
              <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-3xl p-8 shadow-2xl transform hover:scale-[1.02] transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-blue-100 text-sm mb-1">{t('dashboard.totalBalance')}</p>
                    <h2 className="text-5xl font-bold text-white">
                      ${parseFloat(user.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h2>
                  </div>
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Wallet className="w-8 h-8 text-white" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                    <p className="text-blue-100 text-xs mb-1">{t('dashboard.pnl24h')}</p>
                    <p className="text-white text-xl font-bold">+$247.83</p>
                    <p className="text-green-300 text-sm">+2.3%</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                    <p className="text-blue-100 text-xs mb-1">{t('dashboard.assets')}</p>
                    <p className="text-white text-xl font-bold">{cryptoList?.length || 0}</p>
                    <p className="text-blue-200 text-sm">{t('dashboard.cryptocurrencies')}</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                    <p className="text-blue-100 text-xs mb-1">{t('dashboard.income')}</p>
                    <p className="text-white text-xl font-bold">$1,834</p>
                    <p className="text-purple-200 text-sm">{t('dashboard.monthly')}</p>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                <button
                  onClick={() => navigate('/balance', { state: { openDepositModal: true } })}
                  className="flex-1 bg-white text-blue-600 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
                >
                  {t('dashboard.deposit')}
                </button>
                  <button
                    onClick={() => navigate('/trading')}
                    className="flex-1 bg-white/20 text-white py-3 rounded-xl font-semibold hover:bg-white/30 transition-colors backdrop-blur-sm"
                  >
                    {t('dashboard.trade')}
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Market Stats */}
            <div className="lg:col-span-5">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-[#161A1E] border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">{t('dashboard.gainers')}</p>
                      <p className="text-2xl font-bold text-green-400">{marketStats.gainers}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">{t('dashboard.assetsLast24h')}</p>
                </div>

                <div className="bg-[#161A1E] border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                      <TrendingDown className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">{t('dashboard.losers')}</p>
                      <p className="text-2xl font-bold text-red-400">{marketStats.losers}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">{t('dashboard.assetsLast24h')}</p>
                </div>
              </div>

              <div className="bg-[#161A1E] border border-gray-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{t('dashboard.marketStats')}</h3>
                  <div className={`flex items-center gap-1 text-xs ${connected ? 'text-green-400' : 'text-red-400'}`}>
                    <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                    {connected ? t('dashboard.live') : t('dashboard.offline')}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-400" />
                      <span className="text-sm text-gray-400">{t('dashboard.volume24h')}</span>
                    </div>
                    <span className="text-sm font-semibold">
                      ${(marketStats.totalVolume / 1e9).toFixed(2)}B
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-purple-400" />
                      <span className="text-sm text-gray-400">{t('dashboard.avgChange')}</span>
                    </div>
                    <span className={`text-sm font-semibold ${marketStats.avgChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {marketStats.avgChange >= 0 ? '+' : ''}{marketStats.avgChange.toFixed(2)}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm text-gray-400">{t('dashboard.activeTraders')}</span>
                    </div>
                    <span className="text-sm font-semibold">12,483</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm text-gray-400">{t('dashboard.fearGreedIndex')}</span>
                    </div>
                    <span className="text-sm font-semibold text-green-400">73 ({t('dashboard.greed')})</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <div className="bg-[#161A1E] border border-gray-800 rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  {t('dashboard.topGainers')}
                </h2>
                <button
                  onClick={() => navigate('/trading')}
                  className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                >
                  {t('dashboard.viewAll')}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {topGainers.map((crypto, index) => (
                  <div
                    key={crypto.id}
                    className="flex items-center justify-between p-4 bg-[#0B0E11] rounded-xl hover:bg-gray-800/50 transition-colors cursor-pointer"
                    onClick={() => navigate('/trading')}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-gray-600 font-mono text-sm w-6">{index + 1}</span>
                      <img src={crypto.image} alt={crypto.symbol} className="w-10 h-10 rounded-full" />
                      <div>
                        <p className="font-semibold">{crypto.symbol.toUpperCase()}</p>
                        <p className="text-xs text-gray-500">{crypto.name}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-mono font-semibold">
                        ${crypto.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <div className="flex items-center gap-1 text-green-400 text-sm">
                        <ArrowUpRight className="w-4 h-4" />
                        +{crypto.change_percent_24h.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#161A1E] border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-red-400" />
                  {t('dashboard.topLosers')}
                </h2>
                <button
                  onClick={() => navigate('/trading')}
                  className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                >
                  {t('dashboard.viewAll')}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {topLosers.map((crypto, index) => (
                  <div
                    key={crypto.id}
                    className="flex items-center justify-between p-4 bg-[#0B0E11] rounded-xl hover:bg-gray-800/50 transition-colors cursor-pointer"
                    onClick={() => navigate('/trading')}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-gray-600 font-mono text-sm w-6">{index + 1}</span>
                      <img src={crypto.image} alt={crypto.symbol} className="w-10 h-10 rounded-full" />
                      <div>
                        <p className="font-semibold">{crypto.symbol.toUpperCase()}</p>
                        <p className="text-xs text-gray-500">{crypto.name}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-mono font-semibold">
                        ${crypto.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <div className="flex items-center gap-1 text-red-400 text-sm">
                        <ArrowDownRight className="w-4 h-4" />
                        {crypto.change_percent_24h.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#161A1E] border border-gray-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">{t('dashboard.quickActions')}</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => navigate('/balance')}
                  className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl hover:bg-green-500/20 transition-colors text-center"
                >
                  <DollarSign className="w-6 h-6 text-green-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-green-400">{t('dashboard.deposit')}</p>
                </button>

                <button
                  onClick={() => navigate('/balance')}
                  className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl hover:bg-blue-500/20 transition-colors text-center"
                >
                  <ArrowUpRight className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-blue-400">{t('dashboard.withdraw')}</p>
                </button>

                <button
                  onClick={() => navigate('/trading')}
                  className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl hover:bg-purple-500/20 transition-colors text-center"
                >
                  <Activity className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-purple-400">{t('dashboard.trade')}</p>
                </button>

                <button
                  onClick={() => navigate('/support')}
                  className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl hover:bg-orange-500/20 transition-colors text-center"
                >
                  <Users className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-orange-400">{t('nav.support')}</p>
                </button>
              </div>
            </div>

            <div className="bg-[#161A1E] border border-gray-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">{t('dashboard.recentActivity')}</h3>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      activity.type === 'buy'
                        ? 'bg-green-500/20'
                        : 'bg-red-500/20'
                    }`}>
                      {activity.type === 'buy' ? (
                        <ArrowUpRight className="w-5 h-5 text-green-400" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">
                        {activity.type === 'buy' ? t('trading.buy') : t('trading.sell')} {activity.asset}
                      </p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono">{activity.amount}</p>
                      <p className="text-xs text-gray-500">${activity.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-600 to-pink-600 rounded-2xl p-6 text-center">
              <Sparkles className="w-12 h-12 text-white mx-auto mb-3" />
              <h3 className="text-xl font-bold mb-2">{t('dashboard.promoTitle')}</h3>
              <p className="text-sm text-white/80 mb-4">
                {t('dashboard.promoSubtitle')}
              </p>
              <button className="w-full bg-white text-orange-600 py-2 rounded-xl font-semibold hover:bg-gray-100 transition-colors">
                {t('dashboard.promoButton')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}