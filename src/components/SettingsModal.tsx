import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Settings, User, Key, Shield, CheckCircle2, AlertCircle } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { currentUser, updateAccountDetails } = useAuth();

  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [rpAlias, setRpAlias] = useState(currentUser?.rpAlias || '');
  const [newUsername, setNewUsername] = useState(currentUser?.username || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!currentUser) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // If changing password, verify matching
    if (newPassword) {
      if (newPassword !== confirmPassword) {
        setErrorMsg('New passwords do not match.');
        return;
      }
      if (newPassword.length < 4) {
        setErrorMsg('New passcode must be at least 4 characters.');
        return;
      }
      if (!currentPassword) {
        setErrorMsg('Please enter your current passcode to authorize changes.');
        return;
      }
    }

    if (newUsername.trim().toLowerCase() !== currentUser.username && !currentPassword) {
      setErrorMsg('Please enter your current passcode to authorize changing username.');
      return;
    }

    const res = updateAccountDetails(currentUser.id, {
      displayName: displayName.trim(),
      rpAlias: rpAlias.trim(),
      newUsername: newUsername.trim() !== currentUser.username ? newUsername.trim() : undefined,
      newPassword: newPassword.trim() || undefined,
      currentPassword: currentPassword || undefined,
    });

    if (res.success) {
      setSuccessMsg('Account information successfully updated!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setSuccessMsg(null);
      }, 2500);
    } else {
      setErrorMsg(res.error || 'Failed to update account.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-100 font-mono">ACCOUNT SETTINGS</h3>
              <p className="text-[10px] text-slate-400 font-mono">Modify Profile & Security</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current profile pill */}
        <div className="px-4 py-2 bg-slate-800/40 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400">
            Role: <strong className="text-slate-200 uppercase">{currentUser.role}</strong>
          </span>
          <span className="text-slate-400">
            Status: <strong className="text-emerald-400 uppercase">{currentUser.status}</strong>
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3 overflow-y-auto font-mono text-xs">
          <div>
            <label className="block text-slate-300 mb-1">Character Name</label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-100 font-sans focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-1">Title / Alias</label>
            <input
              type="text"
              value={rpAlias}
              onChange={(e) => setRpAlias(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-100 font-sans focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-1">Username (@handle)</label>
            <input
              type="text"
              required
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-2 border-t border-slate-800/80">
            <span className="text-[11px] font-bold text-amber-300 block mb-2">
              Change Security Passcode (Optional)
            </span>

            <div className="space-y-2">
              <div>
                <label className="block text-slate-400 mb-0.5 text-[10px]">
                  Current Passcode (Required to authorize changes)
                </label>
                <input
                  type="password"
                  placeholder="Enter current passcode..."
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-0.5 text-[10px]">New Passcode</label>
                <input
                  type="password"
                  placeholder="Enter new passcode..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-0.5 text-[10px]">Confirm New Passcode</label>
                <input
                  type="password"
                  placeholder="Confirm new passcode..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs tracking-wider shadow-md transition-all cursor-pointer"
          >
            SAVE CHANGES
          </button>
        </form>
      </div>
    </div>
  );
};
