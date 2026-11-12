import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMarket } from '../context/MarketContext';
import { StockAsset, SectorType, User, UserRole } from '../types';
import {
  ShieldAlert,
  Sliders,
  Users,
  Activity,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  Lock,
  Unlock,
  Trash2,
  UserX,
  UserCheck,
  Coins,
  Send,
  Radio,
  FileText,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  DollarSign,
  Zap,
} from 'lucide-react';

type AdminTab = 'stocks' | 'users' | 'audit' | 'news';

const SECTOR_OPTIONS: SectorType[] = [
  'Defense & Arms',
  'Cybertech & AI',
  'Petro & Smuggling',
  'Entertainment & Gaming',
  'Pharma & Stims',
  'Logistics & Cargo',
  'Mining & Heavy Ops',
  'Media & Syndicate',
];

export const AdminDashboardView: React.FC = () => {
  const {
    currentUser,
    users,
    adjustBalance,
    banUser,
    unbanUser,
    kickUser,
    deleteUser,
    updateUserRole,
  } = useAuth();

  const {
    stocks,
    logs,
    news,
    isCircuitBreakerActive,
    toggleCircuitBreaker,
    setStockPrice,
    adjustStockPricePercent,
    toggleStockFreeze,
    setStockVolatility,
    createStock,
    deleteStock,
    broadcastNews,
    deleteNews,
    resetAllMarketData,
  } = useMarket();

  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('stocks');

  // Modals / subforms
  const [isCreateStockOpen, setIsCreateStockOpen] = useState(false);
  const [selectedUserForMoney, setSelectedUserForMoney] = useState<User | null>(null);
  const [moneyAdjustmentAmount, setMoneyAdjustmentAmount] = useState<string>('');
  const [moneyAdjustmentMemo, setMoneyAdjustmentMemo] = useState<string>('');
  const [selectedUserForBan, setSelectedUserForBan] = useState<User | null>(null);
  const [banReasonInput, setBanReasonInput] = useState<string>('');

  // New stock form state
  const [newTicker, setNewTicker] = useState('');
  const [newName, setNewName] = useState('');
  const [newSector, setNewSector] = useState<SectorType>('Cybertech & AI');
  const [newPrice, setNewPrice] = useState('100');
  const [newShares, setNewShares] = useState('1000000');
  const [newDividend, setNewDividend] = useState('2.5');
  const [newVolatility, setNewVolatility] = useState<StockAsset['volatility']>('medium');
  const [newDesc, setNewDesc] = useState('');
  const [newLore, setNewLore] = useState('');
  const [stockError, setStockError] = useState<string | null>(null);

  // News Broadcast state
  const [newsHeadline, setNewsHeadline] = useState('');
  const [newsContent, setNewContent] = useState('');
  const [newsSector, setNewsSector] = useState<SectorType | 'GENERAL'>('GENERAL');
  const [newsImpact, setNewsImpact] = useState<'bullish' | 'bearish' | 'neutral'>('bullish');
  const [newsTicker, setNewsTicker] = useState('');
  const [newsSuccess, setNewsSuccess] = useState(false);

  // Filter logs
  const [logFilterCategory, setLogFilterCategory] = useState<string>('ALL');
  const [logSearch, setLogSearch] = useState('');

  // User search
  const [userSearch, setUserSearch] = useState('');

  // Handle stock creation
  const handleCreateStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStockError(null);

    const price = parseFloat(newPrice);
    const shares = parseInt(newShares);
    const dividend = parseFloat(newDividend);

    if (!newTicker || !newName || isNaN(price) || isNaN(shares)) {
      setStockError('Please provide all required fields with valid numbers.');
      return;
    }

    const res = createStock({
      ticker: newTicker.trim().toUpperCase(),
      name: newName.trim(),
      sector: newSector,
      currentPrice: price,
      circulatingShares: shares,
      dividendYield: dividend || 0,
      volatility: newVolatility,
      description: newDesc.trim() || 'Roleplay corporate enterprise listed on Apex.',
      lore: newLore.trim() || 'No classified dossier available.',
      isFrozen: false,
    });

    if (res.success) {
      setIsCreateStockOpen(false);
      setNewTicker('');
      setNewName('');
      setNewDesc('');
      setNewLore('');
    } else {
      setStockError(res.error || 'Failed to list asset.');
    }
  };

  // Handle add/remove money
  const handleExecuteMoneyAdjustment = (isAdd: boolean) => {
    if (!selectedUserForMoney) return;
    const rawVal = parseFloat(moneyAdjustmentAmount);
    if (isNaN(rawVal) || rawVal <= 0) return;

    const finalAmount = isAdd ? rawVal : -rawVal;
    adjustBalance(selectedUserForMoney.id, finalAmount, moneyAdjustmentMemo);
    setSelectedUserForMoney(null);
    setMoneyAdjustmentAmount('');
    setMoneyAdjustmentMemo('');
  };

  // Handle ban user
  const handleExecuteBan = () => {
    if (!selectedUserForBan) return;
    banUser(selectedUserForBan.id, banReasonInput);
    setSelectedUserForBan(null);
    setBanReasonInput('');
  };

  // Handle News Broadcast
  const handleBroadcastNewsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsHeadline || !newsContent) return;

    broadcastNews(
      newsHeadline,
      newsContent,
      newsSector,
      newsImpact,
      newsTicker ? newsTicker.trim().toUpperCase() : undefined
    );

    setNewsHeadline('');
    setNewContent('');
    setNewsTicker('');
    setNewsSuccess(true);
    setTimeout(() => setNewsSuccess(false), 2500);
  };

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchCat = logFilterCategory === 'ALL' || log.category === logFilterCategory;
      const matchSearch =
        !logSearch ||
        log.details.toLowerCase().includes(logSearch.toLowerCase()) ||
        log.action.toLowerCase().includes(logSearch.toLowerCase()) ||
        log.actorUsername.toLowerCase().includes(logSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [logs, logFilterCategory, logSearch]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      return (
        u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.displayName.toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.rpAlias && u.rpAlias.toLowerCase().includes(userSearch.toLowerCase()))
      );
    });
  }, [users, userSearch]);

  // System Macro Stats
  const systemTotalCash = useMemo(() => users.reduce((acc, u) => acc + u.balance, 0), [users]);
  const systemEquitiesCap = useMemo(() => stocks.reduce((acc, s) => acc + s.marketCap, 0), [stocks]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner / Clearance status */}
      <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/60 border border-amber-500/40 rounded-2xl p-5 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-slate-100 font-mono tracking-tight">
                FEDERAL EXCHANGE COMMAND & REGULATORY DESK
              </h2>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono font-bold px-2 py-0.5 rounded border border-amber-500/40">
                CLEARANCE LEVEL 5
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Welcome, <strong className="text-slate-200">{currentUser?.displayName}</strong>. You have full sovereign control over securities, liquid balances, user bans, and audit registries.
            </p>
          </div>
        </div>

        {/* Emergency Circuit Breaker Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleCircuitBreaker}
            className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
              isCircuitBreakerActive
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 animate-pulse'
            }`}
          >
            {isCircuitBreakerActive ? (
              <>
                <Unlock className="w-4 h-4" /> RESUME ALL TRADING (HALT OFF)
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" /> EMERGENCY CIRCUIT BREAKER (HALT ALL)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Admin Macro Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Total System Cash</span>
          <span className="text-lg font-bold font-mono text-emerald-400">
            ${systemTotalCash.toLocaleString()} FRD
          </span>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Total Market Cap</span>
          <span className="text-lg font-bold font-mono text-cyan-400">
            ${(systemEquitiesCap / 1000000).toFixed(1)}M FRD
          </span>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Registered Citizens</span>
          <span className="text-lg font-bold font-mono text-slate-100">{users.length} Traders</span>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <span className="text-[10px] font-mono uppercase text-slate-400 block">Active Equities</span>
          <span className="text-lg font-bold font-mono text-slate-100">{stocks.length} Companies</span>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveAdminTab('stocks')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
            activeAdminTab === 'stocks'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Market Assets & Price Controls
        </button>

        <button
          onClick={() => setActiveAdminTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
            activeAdminTab === 'users'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          Citizen Management & Cash Controls ({users.length})
        </button>

        <button
          onClick={() => setActiveAdminTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
            activeAdminTab === 'audit'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          Live Audit Logs & Security Monitor ({logs.length})
        </button>

        <button
          onClick={() => setActiveAdminTab('news')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
            activeAdminTab === 'news'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Radio className="w-4 h-4" />
          Broadcast Breaking News
        </button>
      </div>

      {/* TAB 1: STOCK ASSETS & PRICE CONTROLLER */}
      {activeAdminTab === 'stocks' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Equities & Corporate Assets Roster</h3>
              <p className="text-[11px] text-slate-400">
                Create custom companies, override prices, trigger market shifts, or freeze trades.
              </p>
            </div>
            <button
              onClick={() => setIsCreateStockOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white shadow-md shadow-emerald-600/20 cursor-pointer shrink-0"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              List New Company (IPO)
            </button>
          </div>

          {/* Empty state when no stocks exist yet */}
          {stocks.length === 0 ? (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center max-w-md mx-auto space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center">
                <PlusCircle className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-200">No Equities Currently Listed</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                You can now create your own custom roleplay companies and stocks. Fill out the ticker, name, sector, and initial price to list your first asset.
              </p>
              <button
                onClick={() => setIsCreateStockOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl text-xs font-bold text-white shadow-sm inline-flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Add First Company Asset
              </button>
            </div>
          ) : (
            /* Stocks Management Cards - Compact */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {stocks.map((s) => (
                <div
                  key={s.ticker}
                  className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-sm space-y-2.5 min-w-0"
                >
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono text-sm font-bold text-slate-100 truncate">${s.ticker}</span>
                        <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-mono shrink-0 truncate max-w-[100px]">
                          {s.sector}
                        </span>
                        {s.isFrozen && (
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded font-mono font-bold shrink-0">
                            FROZEN
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs text-slate-300 font-semibold truncate mt-0.5">{s.name}</h4>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold font-mono text-slate-100">
                        ${s.currentPrice.toFixed(2)} FRD
                      </span>
                      <span
                        className={`text-[10px] font-mono block ${
                          s.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {s.change24h >= 0 ? '+' : ''}
                        {s.change24h.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Instant percentage adjustments */}
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block mb-1">
                      Quick Price Shifts:
                    </span>
                    <div className="flex items-center gap-1 flex-wrap">
                      <button
                        onClick={() => adjustStockPricePercent(s.ticker, 10)}
                        className="px-1.5 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold"
                      >
                        +10%
                      </button>
                      <button
                        onClick={() => adjustStockPricePercent(s.ticker, 25)}
                        className="px-1.5 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-bold"
                      >
                        +25%
                      </button>
                      <button
                        onClick={() => adjustStockPricePercent(s.ticker, 50)}
                        className="px-1.5 py-0.5 rounded bg-emerald-500/30 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-500/50 text-[10px] font-mono font-bold"
                      >
                        +50%
                      </button>
                      <button
                        onClick={() => adjustStockPricePercent(s.ticker, -15)}
                        className="px-1.5 py-0.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-mono font-bold"
                      >
                        -15%
                      </button>
                      <button
                        onClick={() => adjustStockPricePercent(s.ticker, -35)}
                        className="px-1.5 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[10px] font-mono font-bold"
                      >
                        -35%
                      </button>
                    </div>
                  </div>

                  {/* Direct price setter & freeze */}
                  <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-800/80">
                    <button
                      onClick={() => toggleStockFreeze(s.ticker)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1 border transition-colors ${
                        s.isFrozen
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {s.isFrozen ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                      {s.isFrozen ? 'Unfreeze' : 'Freeze'}
                    </button>

                    {/* Volatility dropdown */}
                    <select
                      value={s.volatility}
                      onChange={(e) => setStockVolatility(s.ticker, e.target.value as any)}
                      className="bg-slate-950 border border-slate-700 text-slate-300 text-[10px] font-mono rounded-lg px-2 py-1"
                    >
                      <option value="low">Vol: Low</option>
                      <option value="medium">Vol: Med</option>
                      <option value="high">Vol: High</option>
                      <option value="extreme">Vol: Extreme</option>
                    </select>

                    {/* Delist Stock Button */}
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            `Delist and delete ${s.name} ($${s.ticker})? Any shareholders will be reimbursed at current price of $${s.currentPrice.toFixed(2)} FRD.`
                          )
                        ) {
                          deleteStock(s.ticker);
                        }
                      }}
                      className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 ml-auto transition-colors"
                      title="Delist Stock Asset"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CITIZEN MANAGEMENT & CASH CONTROLS */}
      {activeAdminTab === 'users' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-100">Roleplay Citizens & Liquidity Ledger</h3>
              <p className="text-xs text-slate-400">
                Grant or seize FRD cash, ban users, terminate live terminal sessions (kick), or delete accounts.
              </p>
            </div>
            <div className="relative max-w-xs">
              <input
                type="text"
                placeholder="Search citizens..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase text-[10px]">
                    <th className="p-3.5">Citizen Profile</th>
                    <th className="p-3.5">Title / Alias</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Liquid Cash</th>
                    <th className="p-3.5">Equities Count</th>
                    <th className="p-3.5 text-right">Administrative Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {filteredUsers.map((u) => {
                    const holdingsCount = Object.keys(u.holdings || {}).filter(
                      (t) => u.holdings[t].shares > 0
                    ).length;
                    const isSelf = u.id === currentUser?.id;

                    return (
                      <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5">
                          <div>
                            <span className="font-bold text-slate-100 block">{u.displayName}</span>
                            <span className="text-[11px] text-slate-400">@{u.username}</span>
                          </div>
                        </td>
                        <td className="p-3.5 text-slate-300">{u.rpAlias || 'General Citizen'}</td>
                        <td className="p-3.5">
                          {u.role === 'admin' ? (
                            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] px-2 py-0.5 rounded font-bold">
                              ADMIN
                            </span>
                          ) : (
                            <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] px-2 py-0.5 rounded">
                              TRADER
                            </span>
                          )}
                        </td>
                        <td className="p-3.5">
                          {u.status === 'suspended' ? (
                            <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] px-2 py-0.5 rounded font-bold">
                              BANNED
                            </span>
                          ) : (
                            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] px-2 py-0.5 rounded">
                              ACTIVE
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 font-bold text-emerald-400">
                          ${u.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} FRD
                        </td>
                        <td className="p-3.5 text-slate-400">{holdingsCount} stocks</td>
                        <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                          {/* Add / Remove Money Button */}
                          <button
                            onClick={() => setSelectedUserForMoney(u)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors inline-flex items-center gap-1"
                            title="Add or Remove Money"
                          >
                            <Coins className="w-3 h-3" />
                            Cash +/-
                          </button>

                          {/* Kick User (force logout) */}
                          {!isSelf && (
                            <button
                              onClick={() => {
                                if (confirm(`Kick @${u.username} and forcibly terminate their terminal session?`)) {
                                  kickUser(u.id);
                                }
                              }}
                              className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors"
                              title="Kick Citizen (Terminate Active Session)"
                            >
                              Kick
                            </button>
                          )}

                          {/* Ban / Unban */}
                          {!isSelf &&
                            (u.status === 'suspended' ? (
                              <button
                                onClick={() => unbanUser(u.id)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-colors inline-flex items-center gap-1"
                              >
                                <UserCheck className="w-3 h-3" /> Unban
                              </button>
                            ) : (
                              <button
                                onClick={() => setSelectedUserForBan(u)}
                                className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                                title="Ban Citizen"
                              >
                                Ban
                              </button>
                            ))}

                          {/* Delete Account */}
                          {!isSelf && (
                            <button
                              onClick={() => {
                                if (
                                  confirm(
                                    `Permanently delete @${u.username} (${u.displayName}) and purge portfolio records?`
                                  )
                                ) {
                                  deleteUser(u.id);
                                }
                              }}
                              className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/20 transition-colors"
                              title="Delete Citizen Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT LOGS & SECURITY MONITOR */}
      {activeAdminTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-100">Real-Time Security & Transaction Audit Log</h3>
              <p className="text-xs text-slate-400">
                Immutable ledger of all buy/sell orders, wire transfers, administrative interventions, and market events.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Category Filter */}
              <select
                value={logFilterCategory}
                onChange={(e) => setLogFilterCategory(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none"
              >
                <option value="ALL">All Event Types</option>
                <option value="TRADE">Trades Only</option>
                <option value="ADMIN">Admin Interventions</option>
                <option value="TRANSFER">Wire Transfers</option>
                <option value="SECURITY">Security & Access</option>
                <option value="MARKET_EVENT">Market Events</option>
              </select>

              {/* Search Log */}
              <input
                type="text"
                placeholder="Search logs..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none"
              />
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="divide-y divide-slate-800/60 font-mono text-xs">
              {filteredLogs.map((log) => {
                const isHighValue = log.amountRP && log.amountRP >= 100000;
                return (
                  <div
                    key={log.id}
                    className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-800/40 transition-colors ${
                      isHighValue ? 'bg-amber-500/5 border-l-2 border-amber-500' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase mt-0.5 ${
                          log.category === 'TRADE'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : log.category === 'ADMIN'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : log.category === 'SECURITY'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : log.category === 'TRANSFER'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {log.category}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-100">{log.action}</span>
                          {isHighValue && (
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-bold border border-amber-500/40">
                              HIGH VALUE
                            </span>
                          )}
                        </div>
                        <p className="text-slate-300 text-xs font-sans mt-0.5">{log.details}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 text-slate-400 text-[11px]">
                      <div>{new Date(log.timestamp).toLocaleTimeString()}</div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(log.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BROADCAST BREAKING NEWS */}
      {activeAdminTab === 'news' && (
        <div className="space-y-6 max-w-2xl">
          <div>
            <h3 className="text-base font-bold text-slate-100">Broadcast Breaking Roleplay Intel</h3>
            <p className="text-xs text-slate-400">
              Publish breaking news flashes, regulatory notices, and corporate rumors that shift market sentiments.
            </p>
          </div>

          <form
            onSubmit={handleBroadcastNewsSubmit}
            className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Headline (Breaking News Title)
              </label>
              <input
                type="text"
                required
                value={newsHeadline}
                onChange={(e) => setNewsHeadline(e.target.value)}
                placeholder="e.g. Federal Police Raid Docks; Heavy Shipments Intercepted"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Story Body & Roleplay Lore
              </label>
              <textarea
                rows={3}
                required
                value={newsContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Describe the unfolding roleplay events, syndicate involvement, or economic consequences..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Sector Tag</label>
                <select
                  value={newsSector}
                  onChange={(e) => setNewsSector(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none"
                >
                  <option value="GENERAL">General Economy</option>
                  {SECTOR_OPTIONS.map((sec) => (
                    <option key={sec} value={sec}>
                      {sec}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Market Sentiment</label>
                <select
                  value={newsImpact}
                  onChange={(e) => setNewsImpact(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none"
                >
                  <option value="bullish">Bullish (+12% Auto Shift)</option>
                  <option value="bearish">Bearish (-15% Auto Shift)</option>
                  <option value="neutral">Neutral (Information Only)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Ticker (Optional)
                </label>
                <input
                  type="text"
                  value={newsTicker}
                  onChange={(e) => setNewsTicker(e.target.value)}
                  placeholder="e.g. HYDRA, NEXUS"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 uppercase focus:outline-none"
                />
              </div>
            </div>

            {newsSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Breaking news dispatched to all terminal tickers and news readers!
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-600/20 cursor-pointer"
            >
              BROADCAST BREAKING WIRE HEADLINE
            </button>
          </form>

          {/* Existing News Stories & Delete Controller */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-xs font-bold text-slate-200 font-mono uppercase">
                Active News Items ({news.length})
              </h4>
              <span className="text-[11px] text-slate-500 font-mono">Delete or Prune Headlines</span>
            </div>

            {news.length === 0 ? (
              <p className="text-xs text-slate-500 font-mono py-2 text-center">No broadcasted news items.</p>
            ) : (
              <div className="divide-y divide-slate-800/60 font-mono text-xs">
                {news.map((n) => (
                  <div key={n.id} className="py-2.5 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-200 truncate block">{n.headline}</span>
                        <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded">
                          {n.sectorTag}
                        </span>
                        {n.affectedTicker && (
                          <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1 py-0.2 rounded font-bold">
                            ${n.affectedTicker}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-sans line-clamp-1 mt-0.5">{n.content}</p>
                    </div>

                    <button
                      onClick={() => {
                        if (confirm(`Delete headline: "${n.headline}"?`)) {
                          deleteNews(n.id);
                        }
                      }}
                      className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 p-1.5 rounded-lg transition-colors shrink-0"
                      title="Delete News Headline"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reset System Safeguard */}
          <div className="pt-6 border-t border-slate-800">
            <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-rose-300 font-mono">DANGER ZONE: FACTORY RESET</h4>
                <p className="text-[11px] text-slate-400">
                  Restore default initial roleplay stocks, seed accounts, and audit records.
                </p>
              </div>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to completely reset the exchange data to defaults?')) {
                    resetAllMarketData();
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-mono font-bold"
              >
                Reset Everything
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE NEW COMPANY ASSET (IPO) */}
      {isCreateStockOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 font-mono">
                LIST NEW COMPANY ASSET (IPO REGISTRATION)
              </h3>
              <button
                onClick={() => setIsCreateStockOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStockSubmit} className="space-y-3 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Ticker Symbol (e.g. CYBR)</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={newTicker}
                    onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
                    placeholder="CYBR"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Company Full Name</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="CyberShield Solutions"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100 font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Sector Classification</label>
                  <select
                    value={newSector}
                    onChange={(e) => setNewSector(e.target.value as SectorType)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-200"
                  >
                    {SECTOR_OPTIONS.map((sec) => (
                      <option key={sec} value={sec}>
                        {sec}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Starting Price (FRD)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="100.00"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Circulating Shares</label>
                  <input
                    type="number"
                    required
                    value={newShares}
                    onChange={(e) => setNewShares(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Volatility</label>
                  <select
                    value={newVolatility}
                    onChange={(e) => setNewVolatility(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-200"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="extreme">Extreme</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Dividend (%/yr)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newDividend}
                    onChange={(e) => setNewDividend(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Brief Description</label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Primary business, products, operations..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100 font-sans"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Roleplay Dossier / Lore</label>
                <textarea
                  rows={2}
                  value={newLore}
                  onChange={(e) => setNewLore(e.target.value)}
                  placeholder="Underground rumors, district power struggles, criminal ties..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100 font-sans"
                />
              </div>

              {stockError && <div className="text-rose-400 text-xs">{stockError}</div>}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs"
              >
                CONFIRM ASSET IPO LISTING
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD / REMOVE MONEY */}
      {selectedUserForMoney && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-slate-100">
                Adjust Funds: @{selectedUserForMoney.username}
              </h3>
              <button
                onClick={() => setSelectedUserForMoney(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="text-xs font-mono text-slate-400 bg-slate-950 p-2.5 rounded-xl flex justify-between">
              <span>Current Balance:</span>
              <span className="text-emerald-400 font-bold">
                ${selectedUserForMoney.balance.toLocaleString()} FRD
              </span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Adjustment Amount (FRD)</label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 50000"
                  value={moneyAdjustmentAmount}
                  onChange={(e) => setMoneyAdjustmentAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Reason / Memo (Logged to Audit)</label>
                <input
                  type="text"
                  placeholder="e.g. Syndicate reward, Asset forfeiture..."
                  value={moneyAdjustmentMemo}
                  onChange={(e) => setMoneyAdjustmentMemo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleExecuteMoneyAdjustment(true)}
                  className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                >
                  + Add Funds
                </button>
                <button
                  type="button"
                  onClick={() => handleExecuteMoneyAdjustment(false)}
                  className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                >
                  - Seize Funds
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: BAN CITIZEN */}
      {selectedUserForBan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-rose-300">
                Suspend Citizen: @{selectedUserForBan.username}
              </h3>
              <button
                onClick={() => setSelectedUserForBan(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Suspended users will be immediately locked out and cannot log in or trade on the exchange.
            </p>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Violation Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Market manipulation, Insider trading violation..."
                  value={banReasonInput}
                  onChange={(e) => setBanReasonInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100 font-sans"
                />
              </div>

              <button
                type="button"
                onClick={handleExecuteBan}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                CONFIRM ACCOUNT BAN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
