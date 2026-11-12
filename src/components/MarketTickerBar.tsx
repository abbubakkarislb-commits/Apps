import React from 'react';
import { useMarket } from '../context/MarketContext';
import { TrendingUp, TrendingDown, Lock, Radio } from 'lucide-react';

interface MarketTickerBarProps {
  onSelectStock?: (ticker: string) => void;
}

export const MarketTickerBar: React.FC<MarketTickerBarProps> = ({ onSelectStock }) => {
  const { stocks, isCircuitBreakerActive } = useMarket();

  return (
    <div className="bg-slate-900/95 border-b border-slate-800/80 px-3 py-1 overflow-hidden flex items-center select-none backdrop-blur-sm z-30 h-8">
      <div className="flex items-center gap-1.5 pr-2.5 border-r border-slate-800 shrink-0 text-xs font-mono">
        <span className={`w-1.5 h-1.5 rounded-full ${isCircuitBreakerActive ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'}`} />
        <span className="font-bold text-[10px] text-slate-300">
          {isCircuitBreakerActive ? 'HALTED' : 'MANUAL'}
        </span>
      </div>

      <div className="overflow-x-auto no-scrollbar flex items-center gap-4 px-2.5 whitespace-nowrap text-xs font-mono w-full">
        {stocks.length === 0 ? (
          <span className="text-[11px] text-slate-400 font-mono tracking-tight flex items-center gap-2">
            <span className="text-amber-400 font-bold">[EMPTY MARKET]</span>
            <span>No equities listed yet. Open the Admin Desk to create your custom roleplay companies.</span>
          </span>
        ) : (
          stocks.map((stock) => {
            const isUp = stock.change24h >= 0;
            return (
              <button
                key={stock.ticker}
                onClick={() => onSelectStock && onSelectStock(stock.ticker)}
                className="inline-flex items-center gap-1.5 hover:bg-slate-800/80 px-2 py-0.5 rounded transition-all cursor-pointer group text-[11px]"
              >
                <span className="font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">
                  ${stock.ticker}
                </span>
                <span className="text-slate-300 font-semibold">
                  ${stock.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                {stock.isFrozen ? (
                  <span className="inline-flex items-center gap-0.5 text-[9px] text-amber-400 bg-amber-500/10 px-1 rounded border border-amber-500/30">
                    <Lock className="w-2 h-2" /> FROZEN
                  </span>
                ) : (
                  <span
                    className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${
                      isUp ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isUp ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                    {isUp ? '+' : ''}
                    {stock.change24h.toFixed(2)}%
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
