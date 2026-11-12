import React, { useState } from 'react';
import { useMarket } from '../context/MarketContext';
import { useAuth } from '../context/AuthContext';
import { StockChart } from '../components/StockChart';
import { StockAsset } from '../types';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Lock,
  Unlock,
  ShieldAlert,
  Flame,
  Building2,
  FileText,
  Clock,
  Coins,
  History,
  AlertTriangle,
  Zap,
} from 'lucide-react';

interface StockDetailViewProps {
  ticker: string;
  onBack: () => void;
  onOpenTrade: (stock: StockAsset, type?: 'BUY' | 'SELL') => void;
}

export const StockDetailView: React.FC<StockDetailViewProps> = ({
  ticker,
  onBack,
  onOpenTrade,
}) => {
  const { stocks, orders, isCircuitBreakerActive, setStockPrice, adjustStockPricePercent, toggleStockFreeze } = useMarket();
  const { currentUser, isAdmin } = useAuth();

  const [adminPriceInput, setAdminPriceInput] = useState<string>('');
  const [adminFeedback, setAdminFeedback] = useState<string | null>(null);

  const stock = stocks.find((s) => s.ticker === ticker);

  if (!stock) {
    return (
      <div className="text-center py-20 bg-slate-900/40 rounded-2xl border border-slate-800">
        <p className="text-lg font-bold text-slate-300">Asset ${ticker} not found</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs text-slate-200"
        >
          Return to Markets
        </button>
      </div>
    );
  }

  const isUp = stock.change24h >= 0;
  const userHolding = currentUser?.holdings[stock.ticker];
  const stockOrders = orders.filter((o) => o.ticker === stock.ticker).slice(0, 8);

  const handleAdminSetPrice = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(adminPriceInput);
    if (isNaN(val) || val <= 0) return;
    setStockPrice(stock.ticker, val);
    setAdminFeedback(`Price forced to ${val.toFixed(2)} FRD`);
    setAdminPriceInput('');
    setTimeout(() => setAdminFeedback(null), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Bar with Back and Admin Tools */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-slate-100 bg-slate-900 hover:bg-slate-800 px-3 py-2 rounded-xl border border-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Equities Market
        </button>

        <div className="flex items-center gap-2">
          {stock.isFrozen && (
            <span className="flex items-center gap-1.5 text-xs font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-xl font-bold">
              <Lock className="w-3.5 h-3.5" />
              Trading Paused by Regulators
            </span>
          )}
          <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400">
            Sector: <strong className="text-slate-200">{stock.sector}</strong>
          </span>
          <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400">
            Volatility: <strong className="text-cyan-400 uppercase">{stock.volatility}</strong>
          </span>
        </div>
      </div>

      {/* Main Stock Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold font-mono tracking-tight text-slate-100">
              ${stock.ticker}
            </h1>
            <span className="text-sm font-semibold text-slate-300 bg-slate-800 px-3 py-1 rounded-xl border border-slate-700">
              {stock.name}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2 max-w-2xl">{stock.description}</p>
        </div>

        <div className="flex items-end md:items-center gap-6">
          <div className="text-right">
            <span className="text-xs text-slate-500 font-mono block">Real-time Valuation</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-100">
                ${stock.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-sm font-mono text-slate-400">FRD</span>
            </div>
            <div
              className={`text-sm font-bold font-mono inline-flex items-center gap-1 mt-1 ${
                isUp ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {isUp ? '+' : ''}
              {stock.change24h.toFixed(2)}% ({isUp ? '+' : ''}
              {(stock.changeFRD ?? stock.changeRP ?? 0).toFixed(2)} FRD)
            </div>
          </div>

          {/* Quick Trade Buttons */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => onOpenTrade(stock, 'BUY')}
              disabled={stock.isFrozen || isCircuitBreakerActive}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 disabled:opacity-40 transition-all cursor-pointer"
            >
              BUY ${stock.ticker}
            </button>
            <button
              onClick={() => onOpenTrade(stock, 'SELL')}
              disabled={stock.isFrozen || isCircuitBreakerActive || !userHolding || userHolding.shares <= 0}
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-rose-300 disabled:opacity-40 transition-all cursor-pointer"
            >
              SELL SHARES ({userHolding ? userHolding.shares : 0})
            </button>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <StockChart
        history={stock.history}
        currentPrice={stock.currentPrice}
        ticker={stock.ticker}
        isPositive={isUp}
        height={380}
      />

      {/* ADMIN CONTROLLER STRIP (Exclusive for Admin) */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/40 border border-amber-500/40 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-amber-300 font-mono uppercase tracking-wider">
                Admin Asset Market Controller (${stock.ticker})
              </h3>
            </div>
            {adminFeedback && (
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-md border border-emerald-500/30">
                {adminFeedback}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Quick Price Shift */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-mono block">Instant Percentage Shift:</label>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => adjustStockPricePercent(stock.ticker, 10)}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold"
                >
                  +10%
                </button>
                <button
                  onClick={() => adjustStockPricePercent(stock.ticker, 25)}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold"
                >
                  +25%
                </button>
                <button
                  onClick={() => adjustStockPricePercent(stock.ticker, 50)}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-500/30 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-500/50 text-xs font-mono font-bold"
                >
                  +50% (Pump)
                </button>
                <button
                  onClick={() => adjustStockPricePercent(stock.ticker, -15)}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-mono font-bold"
                >
                  -15%
                </button>
                <button
                  onClick={() => adjustStockPricePercent(stock.ticker, -35)}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-500/30 hover:bg-rose-500/40 text-rose-300 border border-rose-500/50 text-xs font-mono font-bold"
                >
                  -35% (Crash)
                </button>
              </div>
            </div>

            {/* Direct Price Input */}
            <form onSubmit={handleAdminSetPrice} className="space-y-1.5">
              <label className="text-xs text-slate-400 font-mono block">Force Specific Valuation:</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 250.00"
                  value={adminPriceInput}
                  onChange={(e) => setAdminPriceInput(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-100 flex-1 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold font-mono"
                >
                  Set Price
                </button>
              </div>
            </form>

            {/* Freeze Toggle */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-mono block">Trading Suspension Status:</label>
              <button
                onClick={() => toggleStockFreeze(stock.ticker)}
                className={`w-full py-1.5 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 border transition-colors ${
                  stock.isFrozen
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                }`}
              >
                {stock.isFrozen ? (
                  <>
                    <Unlock className="w-3.5 h-3.5" /> UNFREEZE TRADING
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" /> FREEZE ASSET TRADING
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Two Column Grid: Financial Fundamentals & Roleplay Lore */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Financial Fundamentals */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center gap-2 text-slate-200 font-bold text-sm border-b border-slate-800 pb-2">
            <Coins className="w-4 h-4 text-emerald-400" />
            Market Fundamentals & Statistics
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">24h High:</span>
              <span className="text-emerald-400 font-bold">${stock.high24h.toFixed(2)} FRD</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">24h Low:</span>
              <span className="text-rose-400 font-bold">${stock.low24h.toFixed(2)} FRD</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">24h Volume:</span>
              <span className="text-slate-200">{stock.volume24h.toLocaleString()} shares</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Market Capitalization:</span>
              <span className="text-slate-200">${stock.marketCap.toLocaleString()} FRD</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Circulating Shares:</span>
              <span className="text-slate-200">{stock.circulatingShares.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Fictional Dividend Yield:</span>
              <span className="text-cyan-400 font-bold">{stock.dividendYield}% / yr</span>
            </div>
          </div>

          {/* User Holding Status on this Asset */}
          {userHolding && userHolding.shares > 0 && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5 space-y-2 mt-4 text-xs font-mono">
              <div className="flex items-center justify-between text-emerald-400 font-bold">
                <span>Your Holdings</span>
                <span>{userHolding.shares.toLocaleString()} shares</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Avg Buy Price:</span>
                <span>${userHolding.avgBuyPrice.toFixed(2)} FRD</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Total Value:</span>
                <span className="font-bold">
                  ${(userHolding.shares * stock.currentPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })} FRD
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-emerald-500/20">
                <span>Unrealized P&L:</span>
                {(() => {
                  const currentValue = userHolding.shares * stock.currentPrice;
                  const profit = currentValue - userHolding.totalCost;
                  const profitPct = (profit / userHolding.totalCost) * 100;
                  const isGain = profit >= 0;
                  return (
                    <span className={isGain ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {isGain ? '+' : ''}${profit.toFixed(2)} ({isGain ? '+' : ''}{profitPct.toFixed(1)}%)
                    </span>
                  );
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Center/Right: Roleplay Dossier & Lore */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex items-center gap-2 text-slate-200 font-bold text-sm border-b border-slate-800 pb-2">
              <Building2 className="w-4 h-4 text-cyan-400" />
              Corporate Intelligence & Roleplay Dossier
            </div>

            <div className="text-sm text-slate-300 leading-relaxed space-y-3">
              <p>{stock.lore}</p>
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-400 font-mono">
                <span className="text-cyan-400 font-bold uppercase block mb-1">Exchange Intelligence Note:</span>
                Trading activities in ${stock.ticker} are monitored under the Metropolitan Financial Crimes Division. Large block orders may trigger syndicate inquiries or federal audits.
              </div>
            </div>
          </div>

          {/* Recent Trades for this Stock */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
                <History className="w-4 h-4 text-emerald-400" />
                Recent Orders Book (${stock.ticker})
              </div>
              <span className="text-xs font-mono text-slate-400">Live Trade Stream</span>
            </div>

            {stockOrders.length > 0 ? (
              <div className="divide-y divide-slate-800/60 font-mono text-xs">
                {stockOrders.map((ord) => (
                  <div key={ord.id} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ord.type === 'BUY'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {ord.type}
                      </span>
                      <span className="text-slate-300">{ord.shares.toLocaleString()} shares</span>
                      <span className="text-slate-500">by @{ord.username}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-200 font-bold">
                        ${(ord.totalFRD ?? ord.totalRP ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FRD
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {new Date(ord.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-mono text-slate-500 py-4 text-center">
                No recent transactions recorded on this asset today.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
