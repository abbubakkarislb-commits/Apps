import React, { useRef, useEffect, useState, useMemo } from 'react';
import { PricePoint } from '../types';
import { BarChart3, LineChart as LineChartIcon, Maximize2 } from 'lucide-react';

interface StockChartProps {
  history: PricePoint[];
  currentPrice: number;
  ticker: string;
  isPositive: boolean;
  height?: number;
}

type ChartType = 'line' | 'candle';
type TimeRange = '1D' | '1W' | '1M' | 'ALL';

export const StockChart: React.FC<StockChartProps> = ({
  history,
  currentPrice,
  ticker,
  isPositive,
  height = 360,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [chartType, setChartType] = useState<ChartType>('line');
  const [timeRange, setTimeRange] = useState<TimeRange>('1D');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // Filter history based on timeRange
  const displayData = useMemo(() => {
    if (!history || history.length === 0) {
      return [
        {
          time: Date.now(),
          open: currentPrice,
          high: currentPrice,
          low: currentPrice,
          close: currentPrice,
          volume: 100,
        },
      ];
    }
    const count =
      timeRange === '1D' ? 20 : timeRange === '1W' ? 30 : timeRange === '1M' ? 40 : history.length;
    return history.slice(-count);
  }, [history, timeRange, currentPrice]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI display
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const chartHeight = rect.height;

    // Clear
    ctx.clearRect(0, 0, width, chartHeight);

    const data = displayData;
    if (data.length === 0) return;

    // Compute min / max
    const prices = data.flatMap((d) => [d.open, d.high, d.low, d.close]);
    let minPrice = Math.min(...prices);
    let maxPrice = Math.max(...prices);

    // Add padding to range
    const range = maxPrice - minPrice || 1;
    minPrice -= range * 0.08;
    maxPrice += range * 0.08;
    const finalRange = maxPrice - minPrice;

    const paddingLeft = 10;
    const paddingRight = 65; // for price axis
    const paddingTop = 20;
    const paddingBottom = 28;

    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = chartHeight - paddingTop - paddingBottom;

    const getY = (val: number) => {
      return paddingTop + plotHeight - ((val - minPrice) / finalRange) * plotHeight;
    };

    const getX = (idx: number) => {
      if (data.length <= 1) return paddingLeft + plotWidth / 2;
      return paddingLeft + (idx / (data.length - 1)) * plotWidth;
    };

    // 1. Draw horizontal grid lines & price labels
    const gridLines = 4;
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.fillStyle = '#64748b';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';

    for (let i = 0; i <= gridLines; i++) {
      const priceVal = minPrice + (finalRange / gridLines) * i;
      const y = getY(priceVal);

      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(width - paddingRight, y);
      ctx.stroke();

      // Right axis price label
      ctx.fillText(`$${priceVal.toFixed(2)}`, width - paddingRight + 8, y + 3);
    }
    ctx.setLineDash([]); // reset dash

    // 2. Render Line or Candlesticks
    const strokeColor = isPositive ? '#10b981' : '#f43f5e';
    const areaGradientStart = isPositive ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)';
    const areaGradientStop = isPositive ? 'rgba(16, 185, 129, 0.0)' : 'rgba(244, 63, 94, 0.0)';

    if (chartType === 'line') {
      // Area fill
      const grad = ctx.createLinearGradient(0, paddingTop, 0, paddingTop + plotHeight);
      grad.addColorStop(0, areaGradientStart);
      grad.addColorStop(1, areaGradientStop);

      ctx.beginPath();
      ctx.moveTo(getX(0), paddingTop + plotHeight);
      for (let i = 0; i < data.length; i++) {
        const x = getX(i);
        const y = getY(data[i].close);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(getX(data.length - 1), paddingTop + plotHeight);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Stroke line
      ctx.beginPath();
      for (let i = 0; i < data.length; i++) {
        const x = getX(i);
        const y = getY(data[i].close);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Pulsing current price point dot at the latest point
      const lastX = getX(data.length - 1);
      const lastY = getY(data[data.length - 1].close);

      ctx.beginPath();
      ctx.arc(lastX, lastY, 5, 0, Math.PI * 2);
      ctx.fillStyle = strokeColor;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      // Candlestick rendering
      const candleWidth = Math.max(3, Math.min(18, (plotWidth / data.length) * 0.65));

      data.forEach((d, i) => {
        const x = getX(i);
        const openY = getY(d.open);
        const closeY = getY(d.close);
        const highY = getY(d.high);
        const lowY = getY(d.low);

        const isCandleGreen = d.close >= d.open;
        const candleColor = isCandleGreen ? '#10b981' : '#f43f5e';

        // Draw Wick
        ctx.strokeStyle = candleColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, highY);
        ctx.lineTo(x, lowY);
        ctx.stroke();

        // Draw Body
        ctx.fillStyle = candleColor;
        const top = Math.min(openY, closeY);
        const candleH = Math.max(2, Math.abs(openY - closeY));
        ctx.fillRect(x - candleWidth / 2, top, candleWidth, candleH);
      });
    }

    // 3. Hover Crosshair & Tooltip
    if (hoverIndex !== null && hoverIndex >= 0 && hoverIndex < data.length && mousePos) {
      const activeData = data[hoverIndex];
      const hX = getX(hoverIndex);
      const hY = getY(activeData.close);

      // Vertical crosshair
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(hX, paddingTop);
      ctx.lineTo(hX, paddingTop + plotHeight);
      ctx.stroke();

      // Horizontal crosshair
      ctx.beginPath();
      ctx.moveTo(paddingLeft, hY);
      ctx.lineTo(width - paddingRight, hY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Point circle
      ctx.beginPath();
      ctx.arc(hX, hY, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [displayData, chartType, isPositive, hoverIndex, mousePos]);

  // Handle Mouse movement for interactive hover tooltips
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const paddingLeft = 10;
    const paddingRight = 65;
    const plotWidth = rect.width - paddingLeft - paddingRight;

    if (x < paddingLeft || x > rect.width - paddingRight) {
      setHoverIndex(null);
      setMousePos(null);
      return;
    }

    const relX = (x - paddingLeft) / plotWidth;
    const idx = Math.round(relX * (displayData.length - 1));
    const clamped = Math.max(0, Math.min(displayData.length - 1, idx));

    setHoverIndex(clamped);
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
    setMousePos(null);
  };

  const activePoint = hoverIndex !== null ? displayData[hoverIndex] : displayData[displayData.length - 1];

  return (
    <div ref={containerRef} className="w-full bg-slate-900/80 rounded-2xl border border-slate-800 p-4 shadow-xl">
      {/* Chart Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold border border-slate-700">
              ${ticker}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold font-mono text-slate-100">
                ${activePoint?.close.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs font-mono text-slate-400">FRD</span>
            </div>
          </div>
          {activePoint && (
            <div className="flex items-center gap-3 text-xs font-mono text-slate-400 mt-1">
              <span>O: <strong className="text-slate-300">${activePoint.open.toFixed(2)}</strong></span>
              <span>H: <strong className="text-emerald-400">${activePoint.high.toFixed(2)}</strong></span>
              <span>L: <strong className="text-rose-400">${activePoint.low.toFixed(2)}</strong></span>
              <span>Vol: <strong className="text-slate-300">{activePoint.volume.toLocaleString()}</strong></span>
            </div>
          )}
        </div>

        {/* View toggles */}
        <div className="flex items-center gap-2">
          {/* Candle vs Line */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setChartType('line')}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                chartType === 'line' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Line Chart"
            >
              <LineChartIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartType('candle')}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                chartType === 'candle' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Candlestick Chart"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>

          {/* Timeframe Selectors */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            {(['1D', '1W', '1M', 'ALL'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  timeRange === range
                    ? 'bg-emerald-500/20 text-emerald-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Canvas container */}
      <div className="relative w-full" style={{ height: `${height}px` }}>
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full h-full cursor-crosshair block"
        />
      </div>
    </div>
  );
};
