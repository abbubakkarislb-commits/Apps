import React, { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMarket } from '../context/MarketContext';
import { StockAsset } from '../types';
import {
  Briefcase,
  Coins,
  TrendingUp,
  TrendingDown,
  PieChart,
  History,
  ArrowUpRight,
  ArrowDownRight,
  Send,
  DollarSign,
  AlertCircle,
} from 'lucide-react';

interface PortfolioViewProps {
  onSelectStock: (ticker: string) => void;
  onOpenTrade: (stock: StockAsset, type?: 'BUY' | 'SELL') => void;
  onOpenTransfer: () => void;
  onOpenAuth: () => void;
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({
  onSelectStock,
  onOpenTrade,
  onOpenTransfer,
  onOpenAuth,
}) => {
  const { currentUser } = useAuth();
  const { stocks, orders } = useMarket();

  // If user is not logged in
  if (!currentUser) {
    return (
      <div className="text-center py-20 bg-slate-900/60 rounded-2xl border border-slate-800 p-8 max-w-md mx-auto">
        <Briefcase className="w-12 h-12 text-slate-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-200">Terminal Authentication Required</h2>
        <p className="text-xs text-slate-400 mt-1 mb-6">
          Sign in or register an account to track your holdings, portfolio equity, and trade execution logs.
        </p>
        <button
          onClick={onOpenAuth}
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl text-xs font-bold text-white shadow-lg shadow-emerald-600/20"
        >
          Access Trading Terminal
        </button>
      </div>
    );
  }

  // Calculate portfolio totals
  const portfolioSummary = useMemo(() => {
    let stockEquity = 0;
    let totalCostBasis = 0;

    const holdingsList = Object.values(currentUser.holdings || {})
      .filter((h) => h.shares > 0)
      .map((h) => {
        const stock = stocks.find((s) => s.ticker === h.ticker);
        const currentPrice = stock ? stock.currentPrice : h.avgBuyPrice;
        const currentTotal = h.shares * currentPrice;
        const pnl = currentTotal - h.totalCost;
        const pnlPct = h.totalCost > 0 ? (pnl / h.totalCost) * 100 : 0;

        stockEquity += currentTotal;
        totalCostBasis += h.totalCost;

        return {
          ...h,
          stock,
          currentPrice,
          currentTotal,
          pnl,
          pnlPct,
        };
      });

    const netWorth = currentUser.balance + stockEquity;
    const totalPnl = stockEquity - totalCostBasis;
    const totalPnlPct = totalCostBasis > 0 ? (totalPnl / totalCostBasis) * 100 : 0;
    const cashRatio = netWorth > 0 ? (currentUser.balance / netWorth) * 100 : 100;
    const stockRatio = netWorth > 0 ? (stockEquity / netWorth) * 100 : 0;

    return {
      holdingsList,
      stockEquity,
      totalCostBasis,
      netWorth,
      totalPnl,
      totalPnlPct,
      cashRatio,
      stockRatio,
    };
  }, [currentUser, stocks]);

  const userOrders = useMemo(() => {
    return orders.filter((o) => o.userId === currentUser.id);
  }, [orders, currentUser.id]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Portfolio Top KPI Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Net Worth */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-mono uppercase tracking-wider">Estimated Net Worth</span>
            <Briefcase className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-100">
            ${portfolioSummary.netWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
            <span className="text-xs text-slate-400 font-normal">FRD</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400">Total Holdings P&L:</span>
            <span
              className={`font-bold inline-flex items-center gap-0.5 ${
                portfolioSummary.totalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {portfolioSummary.totalPnl >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {portfolioSummary.totalPnl >= 0 ? '+' : ''}
              ${portfolioSummary.totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (
              {portfolioSummary.totalPnl >= 0 ? '+' : ''}
              {portfolioSummary.totalPnlPct.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Liquid Cash */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-mono uppercase tracking-wider">Liquid Cash Balance</span>
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400">
            ${currentUser.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
            <span className="text-xs text-slate-400 font-normal">FRD</span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">
              {portfolioSummary.cashRatio.toFixed(1)}% of Portfolio
            </span>
            <button
              onClick={onOpenTransfer}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 font-semibold"
            >
              <Send className="w-3 h-3" /> Wire Funds
            </button>
          </div>
        </div>

        {/* Equities Value */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-mono uppercase tracking-wider">Invested Securities</span>
            <PieChart className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-100">
            ${portfolioSummary.stockEquity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
            <span className="text-xs text-slate-400 font-normal">FRD</span>
          </div>
          <div className="mt-3 text-xs text-slate-400 font-mono">
            {portfolioSummary.stockRatio.toFixed(1)}% in {portfolioSummary.holdingsList.length} corporate assets
          </div>
        </div>
      </div>

      {/* Allocation Ratio Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400">Capital Asset Allocation:</span>
          <span className="text-slate-300">
            Cash: <strong className="text-emerald-400">{portfolioSummary.cashRatio.toFixed(1)}%</strong> | Equities:{' '}
            <strong className="text-cyan-400">{portfolioSummary.stockRatio.toFixed(1)}%</strong>
          </span>
        </div>
        <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
          <div
            style={{ width: `${portfolioSummary.cashRatio}%` }}
            className="bg-emerald-500 h-full transition-all duration-500"
            title={`Cash: ${portfolioSummary.cashRatio.toFixed(1)}%`}
          />
          <div
            style={{ width: `${portfolioSummary.stockRatio}%` }}
            className="bg-cyan-500 h-full transition-all duration-500"
            title={`Equities: ${portfolioSummary.stockRatio.toFixed(1)}%`}
          />
        </div>
      </div>

      {/* Active Holdings Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm text-slate-200">Active Stock Holdings</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {portfolioSummary.holdingsList.length} Positions Open
          </span>
        </div>

        {portfolioSummary.holdingsList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th className="pb-2.5">Asset</th>
                  <th className="pb-2.5">Shares</th>
                  <th className="pb-2.5">Avg Buy Price</th>
                  <th className="pb-2.5">Current Price</th>
                  <th className="pb-2.5">Current Value</th>
                  <th className="pb-2.5">Unrealized P&L</th>
                  <th className="pb-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {portfolioSummary.holdingsList.map((item) => {
                  const isGain = item.pnl >= 0;
                  return (
                    <tr key={item.ticker} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3">
                        <button
                          onClick={() => onSelectStock(item.ticker)}
                          className="text-left group cursor-pointer"
                        >
                          <span className="font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                            ${item.ticker}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-sans truncate max-w-[140px]">
                            {item.stock ? item.stock.name : item.ticker}
                          </span>
                        </button>
                      </td>
                      <td className="py-3 font-bold">{item.shares.toLocaleString()}</td>
                      <td className="py-3 text-slate-400">${item.avgBuyPrice.toFixed(2)}</td>
                      <td className="py-3 font-semibold">${item.currentPrice.toFixed(2)}</td>
                      <td className="py-3 font-bold">
                        ${item.currentTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center gap-1 font-bold ${
                            isGain ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isGain ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {isGain ? '+' : ''}${item.pnl.toFixed(2)} ({isGain ? '+' : ''}
                          {item.pnlPct.toFixed(1)}%)
                        </span>
                      </td>
                      <td className="py-3 text-right space-x-1.5">
                        {item.stock && (
                          <>
                            <button
                              onClick={() => onOpenTrade(item.stock!, 'BUY')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors"
                            >
                              Buy More
                            </button>
                            <button
                              onClick={() => onOpenTrade(item.stock!, 'SELL')}
                              className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors font-bold"
                            >
                              Sell
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 font-mono text-xs">
            <p>You do not currently hold any equities in your portfolio.</p>
            <p className="text-slate-500 mt-1">Browse the Markets to purchase fictional company shares.</p>
          </div>
        )}
      </div>

      {/* Trade Execution History */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-sm text-slate-200">Personal Trade History</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">{userOrders.length} Executed Orders</span>
        </div>

        {userOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th className="pb-2.5">Date / Time</th>
                  <th className="pb-2.5">Type</th>
                  <th className="pb-2.5">Asset</th>
                  <th className="pb-2.5">Shares</th>
                  <th className="pb-2.5">Execution Price</th>
                  <th className="pb-2.5">Fee</th>
                  <th className="pb-2.5 text-right">Total Net FRD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {userOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 text-slate-400 text-[11px]">
                      {new Date(ord.timestamp).toLocaleDateString()}{' '}
                      {new Date(ord.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ord.type === 'BUY'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {ord.type}
                      </span>
                    </td>
                    <td className="py-2.5 font-bold text-slate-100">${ord.ticker}</td>
                    <td className="py-2.5">{ord.shares.toLocaleString()}</td>
                    <td className="py-2.5">${ord.pricePerShare.toFixed(2)}</td>
                    <td className="py-2.5 text-slate-500">${ord.fee.toFixed(2)}</td>
                    <td className="py-2.5 text-right font-bold text-slate-100">
                      ${(ord.totalFRD ?? ord.totalRP ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FRD
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 font-mono text-xs">
            No executed orders recorded on this account yet.
          </div>
        )}
      </div>
    </div>
  );
};
