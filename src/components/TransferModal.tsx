import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMarket } from '../context/MarketContext';
import { X, Send, Coins, AlertCircle, ShieldCheck, User } from 'lucide-react';

interface TransferModalProps {
  onClose: () => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({ onClose }) => {
  const { currentUser, users } = useAuth();
  const { transferFunds } = useMarket();

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [memo, setMemo] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const availableCash = currentUser ? currentUser.balance : 0;
  const eligibleRecipients = users.filter((u) => u.id !== currentUser?.id && u.status === 'active');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!recipient) {
      setErrorMsg('Select or enter a recipient username.');
      return;
    }

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setErrorMsg('Enter a valid transfer amount.');
      return;
    }

    if (numAmount > availableCash) {
      setErrorMsg(`Insufficient funds. You have ${availableCash.toLocaleString()} FRD available.`);
      return;
    }

    const res = transferFunds(recipient, numAmount, memo);
    if (res.success) {
      setSuccessMsg(`Successfully wired ${numAmount.toLocaleString()} FRD to @${recipient}!`);
      setTimeout(() => onClose(), 1400);
    } else {
      setErrorMsg(res.error || 'Failed to complete wire transfer.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Wire Transfer FRD</h3>
              <p className="text-[11px] text-slate-400 font-mono">Fox Republic Dot (FRD) Direct Wire</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sender Balance */}
        <div className="px-5 py-3 bg-slate-800/40 border-b border-slate-800 flex items-center justify-between font-mono text-xs">
          <span className="text-slate-400">Available Liquid Funds:</span>
          <span className="text-emerald-400 font-bold">${availableCash.toLocaleString()} FRD</span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Recipient Trader (@username)
            </label>
            <div className="relative">
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="e.g. alexander, marcus"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 font-mono text-sm focus:outline-none focus:border-cyan-500"
              />
              <User className="absolute right-3.5 top-3 w-4 h-4 text-slate-500" />
            </div>

            {/* Quick recipient pills */}
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-500 font-mono">Quick Pick:</span>
              {eligibleRecipients.slice(0, 4).map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setRecipient(u.username)}
                  className={`text-[11px] px-2 py-0.5 rounded-md border font-mono transition-colors ${
                    recipient === u.username
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  @{u.username}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <label className="font-semibold text-slate-300">Amount (FRD)</label>
              <button
                type="button"
                onClick={() => setAmount(availableCash)}
                className="text-cyan-400 hover:underline font-mono text-[11px]"
              >
                Send All (${availableCash.toLocaleString()})
              </button>
            </div>
            <div className="relative">
              <input
                type="number"
                min="1"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 0))}
                placeholder="0"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 font-mono text-sm focus:outline-none focus:border-cyan-500"
              />
              <span className="absolute right-3.5 top-3 text-xs font-mono text-slate-500">FRD</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Roleplay Wire Memo / Reason
            </label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="e.g. Weapon consignment, syndicate dividend, bounty..."
              maxLength={60}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 placeholder:text-slate-600"
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-cyan-600/20 transition-all cursor-pointer"
          >
            CONFIRM WIRE TRANSFER
          </button>
        </form>
      </div>
    </div>
  );
};
