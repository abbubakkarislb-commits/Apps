import React, { useState, useEffect } from 'react';
import { StockAsset } from '../types';
import { useAuth } from '../context/AuthContext';
import { useMarket } from '../context/MarketContext';
import { X, ArrowUpRight, ArrowDownRight, ShieldCheck, AlertCircle, Coins, Lock } from 'lucide-react';

interface TradingModalProps {
  stock: StockAsset | null;
  initialType?: 'BUY' | 'SELL';
  onClose: () => void;
}

export const TradingModal: React.FC<TradingModalProps> = ({
  stock,
  initialType = 'BUY',
  onClose,
}) => {
  const { currentUser } = useAuth();
  const { buyStock, sellStock, isCircuitBreakerActive } = useMarket();

  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>(initialType);
  const [quantity, setQuantity] = useState<number>(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setTradeType(initialType);
    setQuantity(1);
    setErrorMsg(null);
    setSuccessMsg(null);
  }, [stock, initialType]);

  if (!stock) return null;

  const currentHolding = currentUser?.holdings[stock.ticker];
  const userShares = currentHolding ? currentHolding.shares : 0;
  const userCash = currentUser ? currentUser.balance : 0;

  const price = stock.currentPrice;
  const feeRate = 0.005; // 0.5%
  const subtotal = quantity * price;
  const fee = subtotal * feeRate;
  const grandTotal = tradeType === 'BUY' ? subtotal + fee : subtotal - fee;

  // Max calculations
  const maxBuyShares = Math.floor(userCash / (price * (1 + feeRate)));
  const maxSellShares = userShares;

  const handleSetMax = () => {
    if (tradeType === 'BUY') {
      setQuantity(Math.max(1, maxBuyShares));
    } else {
      setQuantity(Math.max(1, maxSellShares));
    }
  };

  const handleQuickPercent = (pct: number) => {
    if (tradeType === 'BUY') {
      const q = Math.floor(maxBuyShares * pct);
      setQuantity(Math.max(1, q));
    } else {
      const q = Math.floor(maxSellShares * pct);
      setQuantity(Math.max(1, q));
    }
  };

  const handleExecuteTrade = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (quantity <= 0) {
      setErrorMsg('Quantity must be greater than zero.');
      return;
    }

    if (tradeType === 'BUY') {
      const res = buyStock(stock.ticker, quantity);
      if (res.success) {
        setSuccessMsg(`Acquired ${quantity.toLocaleString()} shares of $${stock.ticker}!`);
        setTimeout(() => onClose(), 1200);
      } else {
        setErrorMsg(res.error || 'Failed to execute buy order.');
      }
    } else {
      const res = sellStock(stock.ticker, quantity);
      if (res.success) {
        setSuccessMsg(`Successfully sold ${quantity.toLocaleString()} shares of $${stock.ticker}!`);
        setTimeout(() => onClose(), 1200);
      } else {
        setErrorMsg(res.error || 'Failed to execute sell order.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm uppercase px-2.5 py-1 rounded bg-slate-800 text-emerald-400 font-bold border border-slate-700">
              ${stock.ticker}
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-100">{stock.name}</h3>
              <p className="text-[11px] text-slate-400 font-mono">{stock.sector}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Price & Status Banner */}
        <div className="px-5 py-3 bg-slate-800/40 border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-mono block">Current Price</span>
            <span className="text-xl font-bold font-mono text-slate-100">
              ${stock.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
              <span className="text-xs text-slate-400">FRD</span>
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-mono block">24h Fluctuation</span>
            <span
              className={`text-sm font-bold font-mono inline-flex items-center gap-1 ${
                stock.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {stock.change24h >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {stock.change24h >= 0 ? '+' : ''}
              {stock.change24h.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* User Balance & Holding info */}
        <div className="px-5 py-2.5 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400">
            Cash: <strong className="text-emerald-400">${userCash.toLocaleString()} FRD</strong>
          </span>
          <span className="text-slate-400">
            Owned: <strong className="text-cyan-400">{userShares.toLocaleString()} shares</strong>
          </span>
        </div>

        {/* Frozen Alert */}
        {(stock.isFrozen || isCircuitBreakerActive) && (
          <div className="m-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
            <Lock className="w-4 h-4 shrink-0" />
            <span>Trading on this asset is halted by Federal Exchange Regulators.</span>
          </div>
        )}

        {/* Buy / Sell Tabs */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setTradeType('BUY');
                setErrorMsg(null);
              }}
              className={`py-2 rounded-lg text-xs font-bold transition-all ${
                tradeType === 'BUY'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              BUY ${stock.ticker}
            </button>
            <button
              type="button"
              onClick={() => {
                setTradeType('SELL');
                setErrorMsg(null);
              }}
              className={`py-2 rounded-lg text-xs font-bold transition-all ${
                tradeType === 'SELL'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              SELL ${stock.ticker}
            </button>
          </div>

          <form onSubmit={handleExecuteTrade} className="space-y-4">
            {/* Quantity Input */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <label className="font-semibold text-slate-300">Quantity of Shares</label>
                <button
                  type="button"
                  onClick={handleSetMax}
                  className="text-cyan-400 hover:underline font-mono text-[11px]"
                >
                  MAX ({tradeType === 'BUY' ? maxBuyShares : maxSellShares})
                </button>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={quantity || ''}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 font-mono text-base focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                  placeholder="Enter share amount..."
                />
                <span className="absolute right-3.5 top-3 text-xs font-mono text-slate-500">SHARES</span>
              </div>
            </div>

            {/* Quick quantity buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[1, 10, 50, 100].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setQuantity(amt)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
                >
                  +{amt}
                </button>
              ))}
              <div className="h-4 w-px bg-slate-800 mx-1" />
              {[0.25, 0.5, 1.0].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handleQuickPercent(pct)}
                  className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-cyan-300 text-xs font-mono transition-colors"
                >
                  {pct * 100}%
                </button>
              ))}
            </div>

            {/* Order Summary Receipt */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal ({quantity} × ${price.toFixed(2)})</span>
                <span>${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FRD</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Brokerage Exchange Fee (0.5%)</span>
                <span>${fee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FRD</span>
              </div>
              <div className="border-t border-slate-800 pt-1.5 flex justify-between font-bold text-slate-100 text-sm">
                <span>{tradeType === 'BUY' ? 'Total Required' : 'Net Liquidation Payout'}</span>
                <span className={tradeType === 'BUY' ? 'text-emerald-400' : 'text-cyan-400'}>
                  ${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FRD
                </span>
              </div>
              {tradeType === 'BUY' && (
                <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                  <span>Remaining Cash After:</span>
                  <span className={userCash - grandTotal < 0 ? 'text-rose-400' : 'text-slate-300'}>
                    ${Math.max(0, userCash - grandTotal).toLocaleString()} FRD
                  </span>
                </div>
              )}
            </div>

            {/* Error or Success notification */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Action Button */}
            <button
              type="submit"
              disabled={stock.isFrozen || isCircuitBreakerActive || (tradeType === 'BUY' && userCash < grandTotal) || (tradeType === 'SELL' && userShares < quantity)}
              className={`w-full py-3 rounded-xl font-bold text-sm tracking-wide shadow-lg transition-all cursor-pointer ${
                tradeType === 'BUY'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed'
                  : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-600/20 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {tradeType === 'BUY' ? `CONFIRM BUY ORDER (${quantity} SHARES)` : `CONFIRM SELL ORDER (${quantity} SHARES)`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
