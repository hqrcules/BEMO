import React from 'react';
import { useAppSelector } from '@/store/hooks';
import { useTheme } from '@/contexts/ThemeContext';

const FALLBACK_ASSETS = [
    { symbol: 'BTC', price: 67120.50, change_percent_24h: 2.4 },
    { symbol: 'ETH', price: 3540.10, change_percent_24h: 0.8 },
    { symbol: 'SOL', price: 148.50, change_percent_24h: 5.2 },
    { symbol: 'XRP', price: 0.62, change_percent_24h: -1.2 },
    { symbol: 'BNB', price: 590.15, change_percent_24h: -0.5 },
    { symbol: 'ADA', price: 0.45, change_percent_24h: 1.1 },
    { symbol: 'DOGE', price: 0.16, change_percent_24h: 8.4 },
    { symbol: 'DOT', price: 7.20, change_percent_24h: -2.1 },
    { symbol: 'AVAX', price: 35.40, change_percent_24h: 3.5 },
    { symbol: 'LINK', price: 14.50, change_percent_24h: 0.9 },
    { symbol: 'MATIC', price: 0.72, change_percent_24h: -0.8 },
    { symbol: 'UNI', price: 7.80, change_percent_24h: 1.5 },
    { symbol: 'LTC', price: 85.20, change_percent_24h: 0.4 },
    { symbol: 'BCH', price: 450.10, change_percent_24h: -1.5 },
    { symbol: 'ATOM', price: 8.90, change_percent_24h: 2.2 },
];

const Ticker: React.FC = () => {
    const assets = useAppSelector((state) => state.websocket.assets);
    const { theme } = useTheme();
    const isLight = theme === 'light';

    const tickerItems = React.useMemo(() => {
        const assetList = Object.values(assets);
        if (assetList.length > 0) {
            return assetList.map(asset => ({
                symbol: asset.symbol.toUpperCase(),
                price: asset.price,
                change_percent_24h: asset.change_percent_24h
            }));
        }
        return FALLBACK_ASSETS;
    }, [assets]);

    const TickerContent = () => (
        <>
            {tickerItems.map((item, index) => (
                <span key={index} className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${item.change_percent_24h >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                    <span className={`font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>{item.symbol}</span>
                    <span className={item.change_percent_24h >= 0 ? 'text-emerald-500' : 'text-red-500'}>
                        {item.change_percent_24h > 0 ? '+' : ''}{item.change_percent_24h.toFixed(2)}%
                    </span>
                </span>
            ))}
        </>
    );

    return (
        <div className={`w-full backdrop-blur-md border-b h-10 flex items-center overflow-hidden z-50 relative ${
            isLight
                ? 'bg-white/90 border-gray-200'
                : 'bg-[#0A0A0A]/90 border-white/10'
        }`}>
            <div className={`flex gap-12 animate-marquee-slow whitespace-nowrap text-xs font-mono ${
                isLight ? 'text-gray-600' : 'text-gray-400'
            }`}>
                <div className="flex gap-12">
                    <TickerContent />
                </div>
                <div className="flex gap-12">
                    <TickerContent />
                </div>
            </div>
        </div>
    );
};

export default Ticker;
