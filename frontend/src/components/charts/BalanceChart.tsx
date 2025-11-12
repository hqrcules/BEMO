import { useMemo, useState } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    ReferenceDot,
    TooltipProps,
    Brush,
} from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

type BalancePoint = { date: string; balance: number };

type BalanceChartProps = {
    data: BalancePoint[];
    height?: number;
    currency?: string;
    theme: 'light' | 'dark';
    range?: '1D' | '7D' | '1M' | '3M' | 'ALL';
    enableBrush?: boolean;
};

interface ProcessedPoint {
    timestamp: number;
    balance: number;
    delta: number | null;
    deltaPercent: number | null;
    formattedDate: string;
}

interface ChartMetrics {
    processedData: ProcessedPoint[];
    minBalance: number;
    maxBalance: number;
    currentBalance: number;
    firstBalance: number;
    overallChange: number;
    overallChangePercent: number;
    minPoint: ProcessedPoint | null;
    maxPoint: ProcessedPoint | null;
    yMin: number;
    yMax: number;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const formatCurrency = (value: number, currency: string = '€'): string => {
    const sign = value < 0 ? '-' : '';
    return `${sign}${currency}${Math.abs(value).toFixed(2)}`;
};

const formatCompactCurrency = (value: number, currency: string = '€'): string => {
    const absValue = Math.abs(value);
    const sign = value < 0 ? '-' : '';

    if (absValue >= 1_000_000) {
        return `${sign}${currency}${(absValue / 1_000_000).toFixed(1)}M`;
    }
    if (absValue >= 1_000) {
        return `${sign}${currency}${(absValue / 1_000).toFixed(1)}K`;
    }
    return `${sign}${currency}${absValue.toFixed(0)}`;
};

/**
 * Dynamic date formatting based on range
 * - 1D: HH:mm
 * - 7D: ddd, HH:mm
 * - 1M: MMM D
 * - Longer: MMM 'YY
 */
const formatDateAxis = (timestamp: number, range?: string): string => {
    const date = new Date(timestamp);

    if (range === '1D') {
        // 1D: "14:30"
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });
    } else if (range === '7D') {
        // 7D: "Mon 14:30"
        const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
        const time = date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });
        return `${weekday} ${time}`;
    } else if (range === '1M' || range === '3M') {
        // 1M-3M: "Jan 15"
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
    } else {
        // Longer: "Jan '24"
        return date.toLocaleDateString('en-US', {
            month: 'short',
            year: '2-digit',
        });
    }
};

const formatDateTooltip = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

// ============================================================================
// CUSTOM TOOLTIP
// ============================================================================

interface CustomTooltipProps extends TooltipProps<number, string> {
    currency: string;
    theme: 'light' | 'dark';
}

const CustomTooltip = ({ active, payload, currency, theme }: CustomTooltipProps) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload as ProcessedPoint;
    const hasDelta = data.delta !== null;
    const isPositive = (data.delta ?? 0) >= 0;

    const isDark = theme === 'dark';
    const bgColor = isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)';
    const borderColor = isDark
        ? 'rgba(255, 255, 255, 0.15)'
        : 'rgba(0, 0, 0, 0.15)';
    const textPrimary = isDark ? '#ffffff' : '#1f2937';
    const textSecondary = isDark ? '#a0a0a0' : '#6b7280';

    return (
        <div
            style={{
                background: bgColor,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${borderColor}`,
                borderRadius: '6px',
                padding: '12px 16px',
                boxShadow: '0 0 6px rgba(0, 0, 0, 0.5)',
                minWidth: '200px',
            }}
        >
            {/* Date */}
            <div
                style={{
                    fontSize: '10px',
                    color: textSecondary,
                    marginBottom: '8px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.8px',
                }}
            >
                {data.formattedDate}
            </div>

            {/* Balance */}
            <div
                style={{
                    fontSize: '22px',
                    fontWeight: 700,
                    color: textPrimary,
                    marginBottom: hasDelta ? '10px' : '0',
                    fontFamily: 'monospace',
                    letterSpacing: '0.3px',
                }}
            >
                {formatCurrency(data.balance, currency)}
            </div>

            {/* Delta with percentage */}
            {hasDelta && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        background: isPositive
                            ? 'rgba(16, 185, 129, 0.12)'
                            : 'rgba(239, 68, 68, 0.12)',
                        border: `1px solid ${
                            isPositive
                                ? 'rgba(16, 185, 129, 0.25)'
                                : 'rgba(239, 68, 68, 0.25)'
                        }`,
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {isPositive ? (
                            <TrendingUp size={13} color="#10b981" strokeWidth={2.5} />
                        ) : (
                            <TrendingDown size={13} color="#ef4444" strokeWidth={2.5} />
                        )}
                        <span
                            style={{
                                fontSize: '13px',
                                fontWeight: 700,
                                color: isPositive ? '#10b981' : '#ef4444',
                                fontFamily: 'monospace',
                            }}
                        >
                            {isPositive ? '+' : ''}
                            {formatCurrency(data.delta!, currency)}
                        </span>
                    </div>
                    <span
                        style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            color: isPositive ? '#10b981' : '#ef4444',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: isPositive
                                ? 'rgba(16, 185, 129, 0.15)'
                                : 'rgba(239, 68, 68, 0.15)',
                        }}
                    >
                        {isPositive ? '+' : ''}
                        {data.deltaPercent!.toFixed(1)}%
                    </span>
                </div>
            )}
        </div>
    );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const BalanceChart = ({
    data,
    height = 400,
    currency = '€',
    theme,
    range,
    enableBrush = false,
}: BalanceChartProps) => {
    const [brushDomain, setBrushDomain] = useState<[number, number] | null>(null);

    // Process data and calculate metrics with ADAPTIVE DOMAIN
    const metrics = useMemo((): ChartMetrics => {
        if (!data || data.length === 0) {
            return {
                processedData: [],
                minBalance: 0,
                maxBalance: 0,
                currentBalance: 0,
                firstBalance: 0,
                overallChange: 0,
                overallChangePercent: 0,
                minPoint: null,
                maxPoint: null,
                yMin: 0,
                yMax: 100,
            };
        }

        // Sort and process data
        const sortedData = [...data].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        const processedData: ProcessedPoint[] = sortedData.map((point, index) => {
            const timestamp = new Date(point.date).getTime();
            const prevBalance = index > 0 ? sortedData[index - 1].balance : null;

            let delta: number | null = null;
            let deltaPercent: number | null = null;

            if (prevBalance !== null && Math.abs(prevBalance) > 0) {
                delta = point.balance - prevBalance;
                deltaPercent = (delta / Math.abs(prevBalance)) * 100;
            }

            return {
                timestamp,
                balance: point.balance,
                delta,
                deltaPercent,
                formattedDate: formatDateTooltip(timestamp),
            };
        });

        // Calculate metrics
        const balances = processedData.map((p) => p.balance);
        const minBalance = Math.min(...balances);
        const maxBalance = Math.max(...balances);
        const currentBalance = processedData[processedData.length - 1].balance;
        const firstBalance = processedData[0].balance;

        // Overall change: (last - first) / |first| * 100 (skip if first <= 0)
        const overallChange = currentBalance - firstBalance;
        const overallChangePercent =
            Math.abs(firstBalance) > 0
                ? (overallChange / Math.abs(firstBalance)) * 100
                : 0;

        // Find min/max points
        const minPoint = processedData.find((p) => p.balance === minBalance) || null;
        const maxPoint = processedData.find((p) => p.balance === maxBalance) || null;

        // ADAPTIVE Y-AXIS DOMAIN - Handle extreme negative spikes
        let dataMin = minBalance;
        let dataMax = maxBalance;
        const dataRange = dataMax - dataMin;

        // If large negative spike exists (more than 2x the range below zero)
        if (dataMin < -dataRange * 2) {
            // Clamp the minimum to 25% of its value to prevent flattening
            dataMin = dataMin * 0.25;
        }

        // Add 10% margin
        const yMin = dataMin - dataRange * 0.1;
        const yMax = dataMax + dataRange * 0.1;

        return {
            processedData,
            minBalance,
            maxBalance,
            currentBalance,
            firstBalance,
            overallChange,
            overallChangePercent,
            minPoint,
            maxPoint,
            yMin: Math.max(0, yMin), // Don't go below 0 unless data requires it
            yMax,
        };
    }, [data]);

    // Theme colors
    const colors = useMemo(() => {
        const isDark = theme === 'dark';
        return {
            line: isDark ? '#00e0a0' : '#00775c',
            grid: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            axis: isDark ? 'rgba(156, 163, 175, 0.5)' : 'rgba(107, 114, 128, 0.5)',
            text: isDark ? '#9ca3af' : '#6b7280',
            refLine: isDark ? 'rgba(156, 163, 175, 0.15)' : 'rgba(107, 114, 128, 0.15)',
        };
    }, [theme]);

    // Empty state
    if (metrics.processedData.length === 0) {
        return (
            <div
                style={{
                    height,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: colors.text,
                    fontSize: '14px',
                }}
            >
                No data available
            </div>
        );
    }

    const {
        processedData,
        minPoint,
        maxPoint,
        yMin,
        yMax,
        currentBalance,
    } = metrics;

    // X-axis domain
    const xMin = processedData[0].timestamp;
    const xMax = processedData[processedData.length - 1].timestamp;

    // Smart marker positioning with dx/dy offsets
    const getMarkerConfig = (
        value: number,
        type: 'min' | 'max' | 'current'
    ): { position: any; dx?: number; dy?: number } => {
        const range = yMax - yMin;
        const relativePos = (value - yMin) / range;

        if (type === 'min') {
            return { position: 'insideTopLeft', dx: 5, dy: -5 };
        } else if (type === 'max') {
            return { position: 'insideBottomLeft', dx: 5, dy: 5 };
        } else {
            // current
            return relativePos > 0.5
                ? { position: 'insideTopRight', dx: -5, dy: -5 }
                : { position: 'insideBottomRight', dx: -5, dy: 5 };
        }
    };

    return (
        <div style={{ width: '100%', height }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={processedData}
                    margin={{ top: 25, right: 30, left: 15, bottom: enableBrush ? 45 : 15 }}
                >
                    {/* 3-STEP GRADIENT for depth */}
                    <defs>
                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop
                                offset="0%"
                                stopColor={colors.line}
                                stopOpacity={0.25}
                            />
                            <stop
                                offset="70%"
                                stopColor={colors.line}
                                stopOpacity={0.1}
                            />
                            <stop
                                offset="100%"
                                stopColor={colors.line}
                                stopOpacity={0}
                            />
                        </linearGradient>
                    </defs>

                    {/* Grid */}
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={colors.grid}
                        vertical={false}
                    />

                    {/* Axes with dynamic formatting */}
                    <XAxis
                        dataKey="timestamp"
                        type="number"
                        domain={brushDomain || [xMin, xMax]}
                        tickFormatter={(val) => formatDateAxis(val, range)}
                        stroke={colors.axis}
                        tick={{ fontSize: 11, fill: colors.text }}
                        tickLine={false}
                        axisLine={{ stroke: colors.axis, strokeWidth: 1 }}
                        minTickGap={50}
                    />
                    <YAxis
                        domain={[yMin, yMax]}
                        tickFormatter={(val) => formatCompactCurrency(val, currency)}
                        stroke={colors.axis}
                        tick={{ fontSize: 11, fill: colors.text }}
                        tickLine={false}
                        axisLine={false}
                        width={70}
                    />

                    {/* Enhanced Tooltip */}
                    <Tooltip
                        content={<CustomTooltip currency={currency} theme={theme} />}
                        cursor={{
                            stroke: colors.line,
                            strokeWidth: 1.5,
                            strokeDasharray: '4 4',
                            opacity: 0.4,
                        }}
                    />

                    {/* Reference lines with text shadows for contrast */}

                    {/* Min marker (red) */}
                    {minPoint && minPoint.balance !== maxPoint?.balance && (
                        <>
                            <ReferenceLine
                                y={minPoint.balance}
                                stroke={colors.refLine}
                                strokeDasharray="3 3"
                                strokeWidth={1.2}
                                label={{
                                    value: `Min: ${formatCompactCurrency(
                                        minPoint.balance,
                                        currency
                                    )}`,
                                    ...getMarkerConfig(minPoint.balance, 'min'),
                                    fill: '#ef4444',
                                    fontSize: 11,
                                    fontWeight: 700,
                                    style: {
                                        textShadow: '0 0 3px #000',
                                    },
                                }}
                            />
                            <ReferenceDot
                                x={minPoint.timestamp}
                                y={minPoint.balance}
                                r={5}
                                fill="#ef4444"
                                stroke="#fff"
                                strokeWidth={2.5}
                                style={{
                                    filter: 'drop-shadow(0 2px 4px rgba(239, 68, 68, 0.5))',
                                }}
                            />
                        </>
                    )}

                    {/* Max marker (blue) */}
                    {maxPoint && minPoint?.balance !== maxPoint.balance && (
                        <>
                            <ReferenceLine
                                y={maxPoint.balance}
                                stroke={colors.refLine}
                                strokeDasharray="3 3"
                                strokeWidth={1.2}
                                label={{
                                    value: `Max: ${formatCompactCurrency(
                                        maxPoint.balance,
                                        currency
                                    )}`,
                                    ...getMarkerConfig(maxPoint.balance, 'max'),
                                    fill: '#3b82f6',
                                    fontSize: 11,
                                    fontWeight: 700,
                                    style: {
                                        textShadow: '0 0 3px #000',
                                    },
                                }}
                            />
                            <ReferenceDot
                                x={maxPoint.timestamp}
                                y={maxPoint.balance}
                                r={5}
                                fill="#3b82f6"
                                stroke="#fff"
                                strokeWidth={2.5}
                                style={{
                                    filter: 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.5))',
                                }}
                            />
                        </>
                    )}

                    {/* Current marker (green) */}
                    <ReferenceLine
                        y={currentBalance}
                        stroke={colors.refLine}
                        strokeDasharray="5 5"
                        strokeWidth={1.2}
                        label={{
                            value: `Now: ${formatCompactCurrency(currentBalance, currency)}`,
                            ...getMarkerConfig(currentBalance, 'current'),
                            fill: '#10b981',
                            fontSize: 11,
                            fontWeight: 700,
                            style: {
                                textShadow: '0 0 3px #000',
                            },
                        }}
                    />
                    <ReferenceDot
                        x={processedData[processedData.length - 1].timestamp}
                        y={currentBalance}
                        r={5}
                        fill="#10b981"
                        stroke="#fff"
                        strokeWidth={2.5}
                        style={{
                            filter: 'drop-shadow(0 2px 4px rgba(16, 185, 129, 0.5))',
                        }}
                    />

                    {/* Area with smooth 500ms animation */}
                    <Area
                        type="monotone"
                        dataKey="balance"
                        stroke={colors.line}
                        strokeWidth={2.5}
                        fill="url(#areaGradient)"
                        isAnimationActive={true}
                        animationDuration={500}
                        animationEasing="ease-in-out"
                        connectNulls
                        dot={false}
                        activeDot={{
                            r: 7,
                            strokeWidth: 3,
                            stroke: colors.line,
                            fill: theme === 'dark' ? '#1a1a1a' : '#ffffff',
                            style: {
                                filter: `drop-shadow(0 0 6px ${colors.line})`,
                            },
                        }}
                    />

                    {/* Optional Brush for zoom */}
                    {enableBrush && processedData.length > 20 && (
                        <Brush
                            dataKey="timestamp"
                            height={30}
                            stroke={colors.line}
                            fill={theme === 'dark' ? '#1a1a1a' : '#f3f4f6'}
                            onChange={(range: any) => {
                                if (
                                    range?.startIndex !== undefined &&
                                    range?.endIndex !== undefined
                                ) {
                                    const start = processedData[range.startIndex].timestamp;
                                    const end = processedData[range.endIndex].timestamp;
                                    setBrushDomain([start, end]);
                                }
                            }}
                        />
                    )}
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default BalanceChart;
