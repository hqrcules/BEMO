import { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { marketService, ChartDataPoint, ChartInterval } from '@/services/marketService';
import { AssetItem } from '@/store/slices/websocketSlice';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hooks';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import { RootState } from '@/store/store';

interface AssetChartModalProps {
  asset: AssetItem;
  onClose: () => void;
}

const CustomTooltip = ({ active, payload, label, currencyState, i18nInstance }: any) => {
    if (active && payload && payload.length && typeof label === 'number') {
        const dateLabel = new Date(label).toLocaleString(i18nInstance.language || 'en-US', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        return (
            <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-lg backdrop-blur-sm bg-opacity-80">
                <p className="text-xs text-zinc-400 mb-1">{dateLabel}</p>
                <p className="text-sm font-bold text-white">
                    {formatCurrency(payload[0].value, currencyState, { maximumFractionDigits: 5 })}
                </p>
            </div>
        );
    }
    return null;
};

export default function AssetChartModal({ asset, onClose }: AssetChartModalProps) {
  const { i18n } = useTranslation();
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interval, setInterval] = useState<ChartInterval>('1d');
  const currencyState = useAppSelector((state: RootState) => state.currency);

  const isPositive = asset.change_percent_24h >= 0;
  const intervals: ChartInterval[] = ['1h', '4h', '1d', '1w'];

  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await marketService.getHistory(asset.symbol, interval);

        if (data.length === 0) {
            setError('Не вдалося завантажити дані графіка. Можливо, API не підтримує цей актив.');
        } else {
            setChartData(data);
        }

      } catch (err) {
        console.error("Chart data fetch error:", err);
        setError('Помилка завантаження даних. Спробуйте інший інтервал або актив.');
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [asset.symbol, interval]);

  const yDomain = chartData.length > 0 ? [Math.min(...chartData.map(d => d.value)) * 0.95, Math.max(...chartData.map(d => d.value)) * 1.05] : [0, 100];
  const chartColor = isPositive ? '#22c55e' : '#ef4444';
  const chartGradient = isPositive ? 'url(#colorPositive)' : 'url(#colorNegative)';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-3xl w-full p-6 my-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            {asset.image.startsWith('http') ? (
              <img src={asset.image} alt={asset.name} className="w-12 h-12 rounded-full" />
            ) : (
              <span className="text-4xl">{asset.image}</span>
            )}
            <div>
              <h3 className="text-2xl font-bold text-white">{asset.name} ({asset.symbol})</h3>
              <p className="text-lg font-mono text-zinc-400">
                {formatCurrency(asset.price, currencyState, { maximumFractionDigits: 5 })}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-900 rounded-lg transition-colors">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <div className="flex items-center justify-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1 mb-6 w-fit mx-auto">
          {intervals.map(int => (
            <button
              key={int}
              onClick={() => setInterval(int)}
              className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${
                interval === int 
                  ? 'bg-zinc-700 text-white' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {int.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="h-80 w-full">
          {loading && (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
            </div>
          )}
          {error && !loading && (
            <div className="flex justify-center items-center h-full text-center text-red-400">
                <AlertCircle className="w-5 h-5 mr-2" />
                {error}
            </div>
          )}
          {!loading && !error && chartData.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.7}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.7}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="time"
                  type="number"
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={(unixTime) => new Date(unixTime).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' })}
                  stroke="#7A7A7A"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={yDomain}
                  hide={true}
                />
                <Tooltip
                  content={<CustomTooltip currencyState={currencyState} i18nInstance={i18n}/>}
                  cursor={{ stroke: '#3A3A3A', strokeWidth: 1, strokeDasharray: "5 5" }}
                />
                <ReferenceLine
                  y={chartData[0].value}
                  stroke="#7A7A7A"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={chartColor}
                  strokeWidth={1.5}
                  fillOpacity={1}
                  fill={chartGradient}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}