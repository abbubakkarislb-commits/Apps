import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme, THEME_OPTIONS, AppTheme } from '../context/ThemeContext';
import { TrendingUp, User, Key, Eye, EyeOff, AlertCircle, Palette, Check } from 'lucide-react';

export const LoginPortal: React.FC = () => {
  const { login, register } = useAuth();
  const { theme, setTheme } = useTheme();
  const [tab, setTab] = useState<'login' | 'register'>('login');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register extra fields
  const [displayName, setDisplayName] = useState('');
  const [alias, setAlias] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    if (tab === 'login') {
      const res = login(username, password);
      setIsLoading(false);
      if (!res.success) {
        setErrorMsg(res.error || 'Authentication rejected. Verify credentials.');
      }
    } else {
      if (password !== confirmPassword) {
        setIsLoading(false);
        setErrorMsg('Passwords do not match.');
        return;
      }
      if (password.length < 4) {
        setIsLoading(false);
        setErrorMsg('Passcode must be at least 4 characters.');
        return;
      }
      const res = register(username, password, displayName, alias);
      setIsLoading(false);
      if (!res.success) {
        setErrorMsg(res.error || 'Registration failed.');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 relative font-sans selection:bg-emerald-500/25 selection:text-emerald-300">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Card */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-7 backdrop-blur-xl relative z-10 space-y-4">
        {/* Brand Header */}
        <div className="text-center space-y-1">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-0.5 mx-auto shadow-md shadow-emerald-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[9px] flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-100">
            Stock Market <span className="text-emerald-400">FT</span>
          </h1>
          <p className="text-[11px] text-slate-400 font-mono tracking-tight">
            FOX REPUBLIC DOT (FRD) EXCHANGE TERMINAL
          </p>
        </div>

        {/* Theme Selector Section */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
              <Palette className="w-3.5 h-3.5 text-cyan-400" />
              Theme Selector
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold uppercase">
              {THEME_OPTIONS.find((t) => t.id === theme)?.name}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {THEME_OPTIONS.map((opt) => {
              const isSelected = theme === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTheme(opt.id)}
                  title={`${opt.name}: ${opt.description}`}
                  className={`p-1.5 rounded-lg border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-sm shadow-emerald-500/20'
                      : 'border-slate-800 hover:border-slate-700 bg-slate-900/60'
                  }`}
                >
                  <div className="w-5 h-5 rounded-md flex items-center justify-center border border-slate-700 overflow-hidden relative">
                    <span className={`absolute inset-0 ${opt.bgPreview}`} />
                    <span className={`w-2 h-2 rounded-full ${opt.accentPreview} relative z-10`} />
                  </div>
                  <span className="text-[9px] font-mono text-slate-300 truncate w-full text-center block">
                    {opt.name.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setErrorMsg(null);
            }}
            className={`py-1.5 rounded-lg font-bold transition-all ${
              tab === 'login'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setErrorMsg(null);
            }}
            className={`py-1.5 rounded-lg font-bold transition-all ${
              tab === 'register'
                ? 'bg-slate-800 text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {tab === 'register' && (
            <>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-0.5">
                  Full Name / Member Name
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alexander Vance"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-0.5">
                  Title / Trader Alias (Optional)
                </label>
                <input
                  type="text"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  placeholder="e.g. Senior Portfolio Manager"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-0.5 font-mono">
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
              <User className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-0.5 font-mono">
              Passcode
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-8 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
              <Key className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {tab === 'register' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-0.5 font-mono">
                Confirm Passcode
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          {tab === 'register' && (
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center justify-between">
              <span>Starting Cash Balance:</span>
              <span className="font-bold">+35,000 FRD</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-1.5 animate-in fade-in">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
              <span className="font-mono text-[11px]">{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs tracking-wider font-mono shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            {isLoading
              ? 'VERIFYING...'
              : tab === 'login'
              ? 'ACCESS TRADING TERMINAL'
              : 'REGISTER & RECEIVE 35,000 FRD'}
          </button>
        </form>

        <div className="border-t border-slate-800/80 pt-2 text-center">
          <p className="text-[11px] text-slate-500 font-mono">
            {tab === 'login' ? "Need an account? " : 'Already registered? '}
            <button
              type="button"
              onClick={() => {
                setTab(tab === 'login' ? 'register' : 'login');
                setErrorMsg(null);
              }}
              className="text-emerald-400 hover:underline font-semibold"
            >
              {tab === 'login' ? 'Create New Account' : 'Sign In Here'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
