import React, { useState, useMemo } from 'react';
import { useMarket } from '../context/MarketContext';
import { useAuth } from '../context/AuthContext';
import { StockAsset, SectorType } from '../types';
import {
  Search,
  TrendingUp,
  TrendingDown,
  Lock,
  ArrowRight,
  PlusCircle,
  Activity,
  Layers,
  Building2,
} from 'lucide-react';

interface MarketViewProps {
  onSelectStock: (ticker: string) => void;
  onOpenTrade: (stock: StockAsset, type?: 'BUY' | 'SELL') => void;
  onNavigateToAdmin?: () => void;
}

const ALL_SECTORS: (SectorType | 'ALL')[] = [
  'ALL',
  'Defense & Arms',
  'Cybertech & AI',
  'Petro & Smuggling',
  'Entertainment & Gaming',
  'Pharma & Stims',
  'Logistics & Cargo',
  'Mining & Heavy Ops',
  'Media & Syndicate',
];

export const MarketView: React.FC<MarketViewProps> = ({
  onSelectStock,
  onOpenTrade,
  onNavigateToAdmin,
}) => {
  const { stocks, isCircuitBreakerActive } = useMarket();
  const { isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState<SectorType | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'marketCap' | 'change24h' | 'price' | 'volume'>('marketCap');

  // Filtered and sorted stocks
  const filteredStocks = useMemo(() => {
    return stocks
      .filter((s) => {
        const matchesSearch =
          s.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSector = selectedSector === 'ALL' || s.sector === selectedSector;
        return matchesSearch && matchesSector;
      })
      .sort((a, b) => {
        if (sortBy === 'marketCap') return b.marketCap - a.marketCap;
        if (sortBy === 'change24h') return b.change24h - a.change24h;
        if (sortBy === 'price') return b.currentPrice - a.currentPrice;
        if (sortBy === 'volume') return b.volume24h - a.volume24h;
        return 0;
      });
  }, [stocks, searchQuery, selectedSector, sortBy]);

  // Overall market calculations
  const totalMarketCap = useMemo(() => stocks.reduce((acc, s) => acc + s.marketCap, 0), [stocks]);
  const totalVolume24h = useMemo(() => stocks.reduce((acc, s) => acc + s.volume24h, 0), [stocks]);
  const topGainer = useMemo(() => {
    if (stocks.length === 0) return null;
    return [...stocks].sort((a, b) => b.change24h - a.change24h)[0];
  }, [stocks]);
  const topLoser = useMemo(() => {
    if (stocks.length === 0) return null;
    return [...stocks].sort((a, b) => a.change24h - b.change24h)[0];
  }, [stocks]);

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Circuit Breaker Emergency Banner */}
      {isCircuitBreakerActive && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <Lock className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
            <div className="min-w-0">
              <h4 className="font-bold text-xs text-rose-200">EXCHANGE CIRCUIT BREAKER ACTIVE</h4>
              <p className="text-[11px] text-rose-400 font-mono truncate">
                Trading across all equities is temporarily halted by Federal Order.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Market Macro KPI Cards - Compact */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Total Market Cap */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 shadow-sm min-w-0">
          <div className="flex items-center justify-between text-slate-400 mb-0.5">
            <span className="text-[10px] font-mono uppercase tracking-wider truncate">Total Market Cap</span>
            <Layers className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-slate-100 truncate">
            ${(totalMarketCap / 1000000).toFixed(2)}M <span className="text-[10px] text-slate-400">FRD</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono truncate">
            {stocks.length} listed {stocks.length === 1 ? 'company' : 'companies'}
          </div>
        </div>

        {/* 24h Volume */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 shadow-sm min-w-0">
          <div className="flex items-center justify-between text-slate-400 mb-0.5">
            <span className="text-[10px] font-mono uppercase tracking-wider truncate">Trade Volume</span>
            <Activity className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-slate-100 truncate">
            {totalVolume24h.toLocaleString()} <span className="text-[10px] text-slate-400">shares</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono truncate">Live automated desk</div>
        </div>

        {/* Top Gainer */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 shadow-sm min-w-0">
          <div className="flex items-center justify-between text-emerald-400 mb-0.5">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold truncate">Top Gainer</span>
            <TrendingUp className="w-3.5 h-3.5 shrink-0" />
          </div>
          {topGainer ? (
            <button
              onClick={() => onSelectStock(topGainer.ticker)}
              className="text-left w-full group cursor-pointer"
            >
              <div className="flex items-baseline justify-between gap-1 min-w-0">
                <span className="text-sm font-bold font-mono text-slate-100 group-hover:text-emerald-400 truncate">
                  ${topGainer.ticker}
                </span>
                <span className="text-xs font-bold font-mono text-emerald-400 shrink-0">
                  +{topGainer.change24h.toFixed(1)}%
                </span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono truncate">
                ${topGainer.currentPrice.toFixed(2)} FRD
              </div>
            </button>
          ) : (
            <div className="text-xs text-slate-500 font-mono py-1">No data</div>
          )}
        </div>

        {/* Top Loser */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 shadow-sm min-w-0">
          <div className="flex items-center justify-between text-rose-400 mb-0.5">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold truncate">Top Decliner</span>
            <TrendingDown className="w-3.5 h-3.5 shrink-0" />
          </div>
          {topLoser ? (
            <button
              onClick={() => onSelectStock(topLoser.ticker)}
              className="text-left w-full group cursor-pointer"
            >
              <div className="flex items-baseline justify-between gap-1 min-w-0">
                <span className="text-sm font-bold font-mono text-slate-100 group-hover:text-rose-400 truncate">
                  ${topLoser.ticker}
                </span>
                <span className="text-xs font-bold font-mono text-rose-400 shrink-0">
                  {topLoser.change24h.toFixed(1)}%
                </span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono truncate">
                ${topLoser.currentPrice.toFixed(2)} FRD
              </div>
            </button>
          ) : (
            <div className="text-xs text-slate-500 font-mono py-1">No data</div>
          )}
        </div>
      </div>

      {/* Search, Filter & Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search equities..."
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
        </div>

        <div className="flex items-center gap-2">
          {/* Sort dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-mono text-slate-300 focus:outline-none"
          >
            <option value="marketCap">Sort: Mkt Cap</option>
            <option value="change24h">Sort: Gainers %</option>
            <option value="price">Sort: Price</option>
            <option value="volume">Sort: Volume</option>
          </select>

          {/* Quick Create Link for Admins */}
          {isAdmin && onNavigateToAdmin && (
            <button
              onClick={onNavigateToAdmin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold transition-colors shrink-0"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Add Custom Stock
            </button>
          )}
        </div>
      </div>

      {/* Sector filter tabs */}
      {stocks.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {ALL_SECTORS.map((sector) => (
            <button
              key={sector}
              onClick={() => setSelectedSector(sector)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono whitespace-nowrap transition-colors ${
                selectedSector === sector
                  ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {sector}
            </button>
          ))}
        </div>
      )}

      {/* Empty State when user wants to add custom ones */}
      {stocks.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 sm:p-12 text-center max-w-lg mx-auto shadow-xl space-y-4">
          <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 mx-auto flex items-center justify-center text-slate-400">
            <Building2 className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 font-mono">No Markets Listed Yet</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
              Default markets have been cleared. You can now build your own roleplay economy from scratch by creating custom companies and assets in the Admin Desk.
            </p>
          </div>
          {isAdmin && onNavigateToAdmin && (
            <button
              onClick={onNavigateToAdmin}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs font-mono shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Open Admin Desk to Create First Asset
            </button>
          )}
        </div>
      ) : (
        /* Equities Grid - Compact */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredStocks.map((stock) => {
            const isUp = stock.change24h >= 0;
            return (
              <div
                key={stock.ticker}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl p-4 shadow-sm flex flex-col justify-between transition-all group min-w-0"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5 min-w-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono text-sm font-extrabold text-slate-100 group-hover:text-emerald-400 transition-colors truncate">
                          ${stock.ticker}
                        </span>
                        {stock.isFrozen && (
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1 py-0.2 rounded font-mono font-bold shrink-0">
                            FROZEN
                          </span>
                        )}
                      </div>
                      <h3 className="text-xs font-semibold text-slate-300 truncate mt-0.5">
                        {stock.name}
                      </h3>
                    </div>
                    <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60 shrink-0 truncate max-w-[110px]">
                      {stock.sector}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2 my-2 leading-tight">
                    {stock.description}
                  </p>
                </div>

                <div>
                  <div className="flex items-baseline justify-between py-1.5 border-t border-slate-800/80 min-w-0">
                    <div className="min-w-0">
                      <span className="text-[9px] text-slate-500 font-mono block leading-none">Price</span>
                      <span className="text-base font-extrabold font-mono text-slate-100 truncate block">
                        ${stock.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                        <span className="text-[10px] text-slate-400 font-normal">FRD</span>
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[9px] text-slate-500 font-mono block leading-none">24h</span>
                      <span
                        className={`text-xs font-bold font-mono inline-flex items-center gap-0.5 ${
                          isUp ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {isUp ? '+' : ''}
                        {stock.change24h.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Compact Stats */}
                  <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono text-slate-400 bg-slate-950/60 p-2 rounded-lg my-2">
                    <div className="truncate">
                      <span className="text-slate-500">Vol:</span>{' '}
                      <span className="text-slate-200">{stock.volume24h.toLocaleString()}</span>
                    </div>
                    <div className="text-right truncate">
                      <span className="text-slate-500">Cap:</span>{' '}
                      <span className="text-slate-200">${(stock.marketCap / 1000000).toFixed(1)}M</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <button
                      onClick={() => onSelectStock(stock.ticker)}
                      className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
                    >
                      Chart
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                    </button>
                    <button
                      onClick={() => onOpenTrade(stock, 'BUY')}
                      disabled={stock.isFrozen || isCircuitBreakerActive}
                      className="flex items-center justify-center py-1.5 px-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white disabled:opacity-40 transition-all cursor-pointer"
                    >
                      Trade
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
