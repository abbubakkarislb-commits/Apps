import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMarket } from '../context/MarketContext';
import { soundEffects } from '../services/audio';
import {
  TrendingUp,
  Briefcase,
  Newspaper,
  ShieldAlert,
  Volume2,
  VolumeX,
  ChevronDown,
  LogOut,
  LogIn,
  UserPlus,
  Coins,
  Send,
  Settings,
} from 'lucide-react';

export type ActiveTab = 'markets' | 'stock_detail' | 'portfolio' | 'news' | 'admin';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAuthModal: (mode: 'login' | 'register') => void;
  onOpenTransferModal: () => void;
  onOpenSettingsModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAuthModal,
  onOpenTransferModal,
  onOpenSettingsModal,
}) => {
  const { currentUser, users, isAdmin, logout, switchAccount } = useAuth();
  const { isCircuitBreakerActive } = useMarket();
  const [isMuted, setIsMuted] = useState<boolean>(() => soundEffects.getMuted());
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  const handleToggleAudio = () => {
    const muted = soundEffects.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      soundEffects.playTradeSuccess();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 border-b border-slate-800/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Brand & Market Status */}
          <div className="flex items-center gap-4 lg:gap-6 min-w-0">
            <button
              onClick={() => setActiveTab('markets')}
              className="flex items-center gap-2.5 text-left focus:outline-none group cursor-pointer shrink-0"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 p-0.5 shadow-md shadow-emerald-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold tracking-tight text-slate-100 text-sm group-hover:text-emerald-400 transition-colors">
                    Stock Market <span className="text-emerald-400">FT</span>
                  </span>
                  <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    EXCHANGE
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono tracking-tight hidden sm:block">
                  FOX REPUBLIC EXCHANGE
                </p>
              </div>
            </button>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 font-mono">
              <button
                onClick={() => setActiveTab('markets')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'markets' || activeTab === 'stock_detail'
                    ? 'bg-slate-800 text-emerald-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Markets
              </button>

              <button
                onClick={() => setActiveTab('portfolio')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'portfolio'
                    ? 'bg-slate-800 text-emerald-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                Portfolio
              </button>

              <button
                onClick={() => setActiveTab('news')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'news'
                    ? 'bg-slate-800 text-emerald-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Newspaper className="w-3.5 h-3.5" />
                Intel & News
              </button>

              {isAdmin && (
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    activeTab === 'admin'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                      : 'text-amber-400/90 border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-300'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  Admin Desk
                </button>
              )}
            </nav>
          </div>

          {/* Right actions: Balance, Audio, Account Switcher & Auth */}
          <div className="flex items-center gap-3">
            {/* Audio Toggle */}
            <button
              onClick={handleToggleAudio}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors border border-slate-800"
              title={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            {currentUser ? (
              <>
                {/* Balance Pill */}
                <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl shadow-inner font-mono text-sm">
                  <Coins className="w-4 h-4 text-amber-400 shrink-0" />
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block leading-none">
                      Cash Balance
                    </span>
                    <span className="font-bold text-emerald-400">
                      ${currentUser.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                      <span className="text-xs text-slate-400 font-normal">FRD</span>
                    </span>
                  </div>
                </div>

                {/* Transfer FRD wire button */}
                <button
                  onClick={onOpenTransferModal}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 transition-colors"
                  title="Wire Transfer FRD (Fox Republic Dot) to another trader"
                >
                  <Send className="w-3.5 h-3.5 text-cyan-400" />
                  Wire FRD
                </button>

                {/* Settings Button */}
                <button
                  onClick={onOpenSettingsModal}
                  className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                  title="Account Settings"
                >
                  <Settings className="w-4 h-4 text-slate-300" />
                </button>

                {/* User Dropdown / Quick Account Switcher */}
                <div className="relative">
                  <button
                    onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
                    className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 px-2.5 py-1 rounded-xl transition-all"
                  >
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0">
                      {currentUser.displayName.charAt(0)}
                    </div>
                    <div className="text-left hidden sm:block min-w-0">
                      <div className="flex items-center gap-1 min-w-0">
                        <span className="text-xs font-semibold text-slate-200 truncate max-w-[100px]">
                          {currentUser.displayName}
                        </span>
                        {currentUser.role === 'admin' ? (
                          <span className="text-[8px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1 py-0.2 rounded font-bold shrink-0">
                            ADMIN
                          </span>
                        ) : (
                          <span className="text-[8px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-1 py-0.2 rounded shrink-0">
                            CITIZEN
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                  </button>

                  {/* Switcher Dropdown Menu */}
                  {isSwitcherOpen && (
                    <div
                      className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                      onClick={() => setIsSwitcherOpen(false)}
                    >
                      <div className="px-3 py-2 border-b border-slate-800 mb-1">
                        <p className="text-xs font-bold text-slate-200 truncate">{currentUser.displayName}</p>
                        <p className="text-[10px] text-cyan-400 font-mono truncate">{currentUser.rpAlias || 'Roleplay Trader'}</p>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={onOpenSettingsModal}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded-lg transition-colors font-mono"
                        >
                          <Settings className="w-3.5 h-3.5 text-slate-400" />
                          Account Settings
                        </button>
                      </div>

                      <div className="border-t border-slate-800 mt-1 pt-1">
                        <button
                          onClick={logout}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors font-medium font-mono"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Log Out Terminal
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuthModal('login')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Sign In
                </button>
                <button
                  onClick={() => onOpenAuthModal('register')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Register
                </button>
              </div>
            )}
          </div>
        </div>

          {/* Mobile Navigation Row */}
        <div className="flex md:hidden items-center justify-around py-1.5 border-t border-slate-800/60 overflow-x-auto text-xs font-mono">
          <button
            onClick={() => setActiveTab('markets')}
            className={`px-2.5 py-1 rounded-md flex items-center gap-1 ${
              activeTab === 'markets' || activeTab === 'stock_detail'
                ? 'bg-slate-800 text-emerald-400 font-bold'
                : 'text-slate-400'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Markets
          </button>
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`px-2.5 py-1 rounded-md flex items-center gap-1 ${
              activeTab === 'portfolio' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            Portfolio
          </button>
          <button
            onClick={() => setActiveTab('news')}
            className={`px-2.5 py-1 rounded-md flex items-center gap-1 ${
              activeTab === 'news' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400'
            }`}
          >
            <Newspaper className="w-3.5 h-3.5" />
            Intel
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-2.5 py-1 rounded-md flex items-center gap-1 text-amber-300 font-bold ${
                activeTab === 'admin' ? 'bg-amber-500/20 border border-amber-500/40' : ''
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Admin
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
