import { useState, useEffect, useRef } from 'react';
import { X, Loader2, AlertCircle, TrendingUp, TrendingDown, BarChart3, Calendar, Activity } from 'lucide-react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickSeries,
  HistogramSeries,
  CandlestickData,
  HistogramData,
  Time
} from 'lightweight-charts';
import { marketService, ChartInterval } from '@/services/marketService';
import { AssetItem } from '@/store/slices/websocketSlice';
import { useAppSelector } from '@/store/hooks';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import { RootState } from '@/store/store';
import { useThemeClasses } from '@/shared/hooks/useThemeClasses';
import { useTheme } from '@/contexts/ThemeContext';

interface AssetChartModalProps {
  asset: AssetItem;
  onClose: () => void;
}

export default function AssetChartModal({ asset, onClose }: AssetChartModalProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interval, setInterval] = useState<ChartInterval>('1d');
  const [chartStats, setChartStats] = useState({
    high: 0,
    low: 0,
    volume: 0,
    change: 0,
    candleCount: 0
  });
  const currencyState = useAppSelector((state: RootState) => state.currency);
  const tc = useThemeClasses();
  const { theme } = useTheme();

  const intervals: { value: ChartInterval; label: string }[] = [
    { value: '1h', label: '1H' },
    { value: '4h', label: '4H' },
    { value: '1d', label: '1D' },
    { value: '1w', label: '1W' }
  ];

  const isPositive = asset.change_percent_24h >= 0;

  const getDecimalPlaces = (price: number): number => {
    if (price >= 1) return 2;
    if (price >= 0.01) return 4;
    if (price >= 0.0001) return 6;
    return 8;
  };

  const formatPrice = (price: number): string => {
    const decimals = getDecimalPlaces(price);
    return formatCurrency(price, currencyState, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 480,
      layout: {
        background: { color: 'transparent' },
        textColor: '#71717a',
        attributionLogo: false,
      },
      grid: {
        vertLines: {
          color: '#27272a',
          style: 1,
        },
        horzLines: {
          color: '#27272a',
          style: 1,
        },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#71717a',
          width: 1,
          style: 3,
          labelBackgroundColor: '#18181b',
        },
        horzLine: {
          color: '#71717a',
          width: 1,
          style: 3,
          labelBackgroundColor: '#18181b',
        },
      },
      timeScale: {
        borderColor: '#27272a',
        timeVisible: true,
        secondsVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      rightPriceScale: {
        borderColor: '#27272a',
        scaleMargins: {
          top: 0.1,
          bottom: 0.2,
        },
      },
    });

    chartRef.current = chart;

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.85,
        bottom: 0,
      },
    });

    candlestickSeriesRef.current = candlestickSeries;
    volumeSeriesRef.current = volumeSeries;

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    const fetchChartData = async () => {
      if (!candlestickSeriesRef.current || !volumeSeriesRef.current) return;

      setLoading(true);
      setError(null);

      try {
        const response = await marketService.getHistoryOHLC(asset.symbol, interval);

        if (!response.ohlc || response.ohlc.length === 0) {
          setError(`No data available for ${interval.toUpperCase()} interval. Try another interval.`);
          setLoading(false);
          return;
        }

        if (response.ohlc.length < 5) {
          setError(`Insufficient data for ${interval.toUpperCase()} (only ${response.ohlc.length} candles). Try a shorter interval.`);
          setLoading(false);
          return;
        }

        const candleData: CandlestickData<Time>[] = response.ohlc.map(candle => ({
          time: (candle.time / 1000) as Time,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
        }));

        const volumeData: HistogramData<Time>[] = response.volume.map(vol => ({
          time: (vol.time / 1000) as Time,
          value: vol.value,
          color: vol.color === '#22c55e' ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)',
        }));

        candlestickSeriesRef.current.setData(candleData);
        volumeSeriesRef.current.setData(volumeData);

        const high = Math.max(...response.ohlc.map(c => c.high));
        const low = Math.min(...response.ohlc.map(c => c.low));
        const totalVolume = response.volume.reduce((sum, v) => sum + v.value, 0);
        const firstPrice = response.ohlc[0].close;
        const lastPrice = response.ohlc[response.ohlc.length - 1].close;
        const change = ((lastPrice - firstPrice) / firstPrice) * 100;

        setChartStats({
          high,
          low,
          volume: totalVolume,
          change,
          candleCount: response.ohlc.length
        });

        if (chartRef.current) {
          chartRef.current.timeScale().fitContent();
        }

        setLoading(false);
      } catch (err: any) {
        console.error("Chart data fetch error:", err);

        // Extract detailed error information
        const errorData = err?.response?.data;
        let errorMessage = 'Failed to load chart data. Please try another interval or asset.';

        if (errorData) {
          // If backend provided detailed error
          if (errorData.error && errorData.details) {
            errorMessage = `${errorData.error}\n\n${errorData.details}`;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } else if (err?.message) {
          // Network or client-side error
          errorMessage = `Network Error: ${err.message}`;
        }

        // Log comprehensive error details for debugging
        console.group('🔍 Chart Data Error Details');
        console.log('Symbol:', asset.symbol);
        console.log('Interval:', interval);
        console.log('Error Status:', err?.response?.status);
        console.log('Error Message:', errorMessage);
        console.log('Full Error:', err);
        console.groupEnd();

        setError(errorMessage);
        setLoading(false);
      }
    };

    fetchChartData();
  }, [asset.symbol, interval]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const formatVolume = (vol: number): string => {
    if (vol >= 1_000_000_000) return `${(vol / 1_000_000_000).toFixed(2)}B`;
    if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(2)}M`;
    if (vol >= 1_000) return `${(vol / 1_000).toFixed(2)}K`;
    return vol.toFixed(2);
  };

  return (
    <div
      className={`fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in ${theme === 'dark' ? 'bg-black/90' : 'bg-gray-900/20'}`}
      onClick={onClose}
    >
      <div
        className={`${tc.cardBg} border ${tc.cardBorder} rounded-2xl max-w-6xl w-full shadow-2xl overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`p-6 border-b ${tc.cardBorder} ${tc.cardBg}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-5">
              {asset.image.startsWith('http') ? (
                <div className="relative">
                  <img
                    src={asset.image}
                    alt={asset.name}
                    className={`w-16 h-16 rounded-full ring-2 ${tc.cardBorder}`}
                  />
                  <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${
                    isPositive ? 'bg-green-500' : 'bg-red-500'
                  } ring-2 ${tc.cardBg} flex items-center justify-center`}>
                    {isPositive ? (
                      <TrendingUp className="w-3 h-3 text-white" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-white" />
                    )}
                  </div>
                </div>
              ) : (
                <span className="text-5xl">{asset.image}</span>
              )}

              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className={`text-2xl font-bold ${tc.textPrimary}`}>{asset.name}</h3>
                  <span className={`text-xs font-mono font-semibold ${tc.textTertiary} ${tc.hover} px-2.5 py-1 rounded border ${tc.cardBorder}`}>
                    {asset.symbol}
                  </span>
                </div>

                <div className="flex items-baseline gap-4">
                  <p className={`text-2xl font-mono font-bold ${tc.textPrimary}`}>
                    {formatPrice(asset.price)}
                  </p>

                  <div className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded border ${
                    isPositive
                      ? 'bg-green-500/10 text-green-400 border-green-500/30'
                      : 'bg-red-500/10 text-red-400 border-red-500/30'
                  }`}>
                    {isPositive ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span>{isPositive ? '+' : ''}{asset.change_percent_24h.toFixed(2)}%</span>
                  </div>

                  <div className={`flex items-center gap-1.5 text-xs ${tc.textTertiary} ${tc.hover} px-2.5 py-1.5 rounded border ${tc.cardBorder}`}>
                    <Calendar className="w-3.5 h-3.5" />
                    <span>24h</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className={`p-2.5 ${tc.hoverBg} rounded-xl transition-all duration-200 group border ${tc.cardBorder}`}
            >
              <X className={`w-5 h-5 ${tc.textSecondary} ${tc.hoverText} transition-colors`} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Activity className={`w-4 h-4 ${tc.textTertiary}`} />
              <span className={`text-sm font-medium ${tc.textSecondary}`}>Chart Interval</span>
            </div>

            <div className={`flex items-center gap-1.5 ${tc.hover} border ${tc.cardBorder} rounded-xl p-1.5`}>
              {intervals.map(int => (
                <button
                  key={int.value}
                  onClick={() => setInterval(int.value)}
                  className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 ${
                    interval === int.value
                      ? `${tc.hover} ${tc.textPrimary} border ${tc.cardBorder}`
                      : `${tc.textTertiary} ${tc.hoverText} ${tc.hoverBg}`
                  }`}
                >
                  {int.label}
                </button>
              ))}
            </div>
          </div>

          {!loading && !error && (
            <div className="grid grid-cols-4 gap-3">
              <div className={`flex flex-col gap-1.5 px-4 py-3 ${tc.hover} border ${tc.cardBorder} rounded-lg`}>
                <span className={`text-xs font-medium ${tc.textTertiary} uppercase tracking-wide`}>24H High</span>
                <span className="text-base font-mono font-semibold text-green-400">
                  {formatPrice(chartStats.high)}
                </span>
              </div>

              <div className={`flex flex-col gap-1.5 px-4 py-3 ${tc.hover} border ${tc.cardBorder} rounded-lg`}>
                <span className={`text-xs font-medium ${tc.textTertiary} uppercase tracking-wide`}>24H Low</span>
                <span className="text-base font-mono font-semibold text-red-400">
                  {formatPrice(chartStats.low)}
                </span>
              </div>

              <div className={`flex flex-col gap-1.5 px-4 py-3 ${tc.hover} border ${tc.cardBorder} rounded-lg`}>
                <div className="flex items-center gap-1.5">
                  <BarChart3 className={`w-3.5 h-3.5 ${tc.textTertiary}`} />
                  <span className={`text-xs font-medium ${tc.textTertiary} uppercase tracking-wide`}>Volume</span>
                </div>
                <span className={`text-base font-mono font-semibold ${tc.textPrimary}`}>
                  {formatVolume(chartStats.volume)}
                </span>
              </div>

              <div className={`flex flex-col gap-1.5 px-4 py-3 ${tc.hover} border ${tc.cardBorder} rounded-lg`}>
                <span className={`text-xs font-medium ${tc.textTertiary} uppercase tracking-wide`}>Change</span>
                <span className={`text-base font-mono font-semibold ${
                  chartStats.change >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {chartStats.change >= 0 ? '+' : ''}{chartStats.change.toFixed(2)}%
                </span>
              </div>
            </div>
          )}

          <div className={`relative w-full ${tc.cardBg} rounded-xl border ${tc.cardBorder} overflow-hidden`} style={{ height: '480px' }}>
            {loading && (
              <div className={`absolute inset-0 flex flex-col justify-center items-center ${tc.cardBg} backdrop-blur-sm z-10`}>
                <Loader2 className={`w-14 h-14 ${tc.textTertiary} animate-spin mb-4`} />
                <p className={`${tc.textTertiary} text-sm font-medium`}>Loading chart data...</p>
              </div>
            )}

            {error && !loading && (
              <div className="absolute inset-0 flex flex-col justify-center items-center text-center z-10 p-8">
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-8 max-w-md">
                  <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                  <h4 className="text-red-400 font-semibold text-base mb-2">Chart Error</h4>
                  <p className="text-red-400/70 text-sm whitespace-pre-line">{error}</p>
                </div>
              </div>
            )}

            <div ref={chartContainerRef} className="w-full h-full" />
          </div>

          {!loading && !error && (
            <div className={`flex items-center justify-between text-xs ${tc.textTertiary} px-2`}>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-sm" />
                  <span>Bullish</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-sm" />
                  <span>Bearish</span>
                </div>
              </div>
              <span>
                {chartStats.candleCount} candles
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
