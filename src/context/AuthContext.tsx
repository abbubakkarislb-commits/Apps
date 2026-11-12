import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole, AccountStatus } from '../types';
import { storage } from '../services/storage';
import { soundEffects } from '../services/audio';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  isAdmin: boolean;
  login: (username: string, password: string) => { success: boolean; error?: string };
  register: (username: string, password: string, displayName: string, rpAlias?: string) => { success: boolean; error?: string };
  logout: () => void;
  switchAccount: (userId: string) => void;
  adjustBalance: (userId: string, amountRP: number, memo: string) => { success: boolean; error?: string };
  banUser: (userId: string, reason: string) => void;
  unbanUser: (userId: string) => void;
  kickUser: (userId: string) => void;
  deleteUser: (userId: string) => { success: boolean; error?: string };
  updateUserRole: (userId: string, role: UserRole) => void;
  updateAccountDetails: (
    userId: string,
    updates: { displayName?: string; rpAlias?: string; newPassword?: string; newUsername?: string; currentPassword?: string }
  ) => { success: boolean; error?: string };
  refreshUsers: () => void;
  kickedNotice: string | null;
  clearKickedNotice: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => storage.getUsers());
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => storage.getActiveUserId());
  const [kickedNotice, setKickedNotice] = useState<string | null>(null);

  // Sync users to storage whenever updated
  const updateUsersState = useCallback((newUsers: User[]) => {
    setUsers(newUsers);
    storage.saveUsers(newUsers);
  }, []);

  const refreshUsers = useCallback(() => {
    const fresh = storage.getUsers();
    setUsers(fresh);
  }, []);

  const currentUser = users.find((u) => u.id === currentUserId) || null;
  const isAdmin = currentUser?.role === 'admin';

  // Monitor if currentUser was kicked or banned
  useEffect(() => {
    if (currentUser) {
      if (currentUser.status === 'kicked') {
        soundEffects.playError();
        setKickedNotice('You were kicked from Stock Market FT by an administrator.');
        // reset status back to active so they can re-login later
        const updated = users.map((u) => (u.id === currentUser.id ? { ...u, status: 'active' as AccountStatus } : u));
        updateUsersState(updated);
        setCurrentUserId(null);
        storage.setActiveUserId(null);
      }
    }
  }, [currentUser, users, updateUsersState]);

  const login = (username: string, password: string) => {
    const trimmed = username.trim().toLowerCase();
    const found = users.find((u) => u.username.toLowerCase() === trimmed);

    if (!found) {
      soundEffects.playError();
      return { success: false, error: 'User not registered in the Stock Market FT database.' };
    }

    if (found.password !== password) {
      soundEffects.playError();
      return { success: false, error: 'Invalid security passcode.' };
    }

    if (found.status === 'suspended') {
      soundEffects.playError();
      return {
        success: false,
        error: `Account suspended by Admin Order. Reason: ${found.banReason || 'Violation of market regulations'}`,
      };
    }

    // Update last active
    const updatedUsers = users.map((u) => (u.id === found.id ? { ...u, lastActive: Date.now() } : u));
    updateUsersState(updatedUsers);

    setCurrentUserId(found.id);
    storage.setActiveUserId(found.id);
    soundEffects.playTradeSuccess();
    return { success: true };
  };

  const register = (username: string, password: string, displayName: string, rpAlias?: string) => {
    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername || !password || !displayName) {
      return { success: false, error: 'All fields are required.' };
    }

    if (users.some((u) => u.username.toLowerCase() === cleanUsername)) {
      soundEffects.playError();
      return { success: false, error: 'Username already in use.' };
    }

    const newUser: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      username: cleanUsername,
      password,
      displayName: displayName.trim(),
      rpAlias: rpAlias?.trim() || 'Independent Trader',
      alias: rpAlias?.trim() || 'Independent Trader',
      role: 'trader',
      status: 'active',
      balance: 35000, // 35,000 FRD starting grant
      holdings: {},
      createdAt: Date.now(),
      lastActive: Date.now(),
    };

    const nextUsers = [...users, newUser];
    updateUsersState(nextUsers);
    setCurrentUserId(newUser.id);
    storage.setActiveUserId(newUser.id);

    // Log registration
    const logs = storage.getLogs();
    logs.unshift({
      id: `log_${Date.now()}`,
      category: 'SECURITY',
      actorId: newUser.id,
      actorUsername: newUser.username,
      action: 'Account Created',
      details: `New account registered: ${newUser.displayName} (@${newUser.username}). Granted 35,000 FRD starting bonus.`,
      amountRP: 35000,
      amountFRD: 35000,
      timestamp: Date.now(),
      severity: 'info',
    });
    storage.saveLogs(logs);

    soundEffects.playTradeSuccess();
    return { success: true };
  };

  const logout = () => {
    setCurrentUserId(null);
    storage.setActiveUserId(null);
  };

  const switchAccount = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;

    if (target.status === 'suspended') {
      soundEffects.playError();
      alert(`Cannot switch to suspended user: ${target.displayName} (Reason: ${target.banReason || 'Banned'})`);
      return;
    }

    setCurrentUserId(userId);
    storage.setActiveUserId(userId);
    soundEffects.playTradeSuccess();
  };

  // ADMIN ACTION: Add or remove money from a user
  const adjustBalance = (userId: string, amountRP: number, memo: string) => {
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Admin clearance required.' };
    }

    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return { success: false, error: 'Citizen not found.' };

    const newBalance = Math.max(0, targetUser.balance + amountRP);
    const updated = users.map((u) => (u.id === userId ? { ...u, balance: newBalance } : u));
    updateUsersState(updated);

    // Audit log
    const logs = storage.getLogs();
    const actionLabel = amountRP >= 0 ? 'Admin Credit Added' : 'Admin Debit Seized';
    logs.unshift({
      id: `log_${Date.now()}`,
      category: 'ADMIN',
      actorId: currentUser.id,
      actorUsername: currentUser.username,
      action: actionLabel,
      details: `Admin ${currentUser.username} adjusted ${targetUser.username}'s balance by ${amountRP >= 0 ? '+' : ''}${amountRP.toLocaleString()} FRD. Memo: "${memo || 'Treasury Adjustment'}"`,
      amountRP: Math.abs(amountRP),
      amountFRD: Math.abs(amountRP),
      targetUser: targetUser.username,
      timestamp: Date.now(),
      severity: amountRP >= 0 ? 'success' : 'warning',
    });
    storage.saveLogs(logs);

    soundEffects.playMarketAlert();
    return { success: true };
  };

  // ADMIN ACTION: Ban user
  const banUser = (userId: string, reason: string) => {
    if (!currentUser || currentUser.role !== 'admin') return;

    const target = users.find((u) => u.id === userId);
    if (!target) return;

    const updated = users.map((u) =>
      u.id === userId ? { ...u, status: 'suspended' as AccountStatus, banReason: reason || 'Banned by Exchange Admin' } : u
    );
    updateUsersState(updated);

    // If banned user was currently active
    if (currentUserId === userId) {
      setCurrentUserId(null);
      storage.setActiveUserId(null);
    }

    const logs = storage.getLogs();
    logs.unshift({
      id: `log_${Date.now()}`,
      category: 'SECURITY',
      actorId: currentUser.id,
      actorUsername: currentUser.username,
      action: 'Citizen Banned',
      details: `User @${target.username} (${target.displayName}) was banned. Reason: ${reason || 'Exchange misconduct'}`,
      targetUser: target.username,
      timestamp: Date.now(),
      severity: 'critical',
    });
    storage.saveLogs(logs);
    soundEffects.playError();
  };

  // ADMIN ACTION: Unban user
  const unbanUser = (userId: string) => {
    if (!currentUser || currentUser.role !== 'admin') return;

    const target = users.find((u) => u.id === userId);
    if (!target) return;

    const updated = users.map((u) =>
      u.id === userId ? { ...u, status: 'active' as AccountStatus, banReason: undefined } : u
    );
    updateUsersState(updated);

    const logs = storage.getLogs();
    logs.unshift({
      id: `log_${Date.now()}`,
      category: 'SECURITY',
      actorId: currentUser.id,
      actorUsername: currentUser.username,
      action: 'Citizen Unbanned',
      details: `Ban lifted for @${target.username} (${target.displayName}) by Admin ${currentUser.username}.`,
      targetUser: target.username,
      timestamp: Date.now(),
      severity: 'success',
    });
    storage.saveLogs(logs);
    soundEffects.playTradeSuccess();
  };

  // ADMIN ACTION: Kick user (force session termination)
  const kickUser = (userId: string) => {
    if (!currentUser || currentUser.role !== 'admin') return;

    const target = users.find((u) => u.id === userId);
    if (!target) return;

    const updated = users.map((u) => (u.id === userId ? { ...u, status: 'kicked' as AccountStatus } : u));
    updateUsersState(updated);

    const logs = storage.getLogs();
    logs.unshift({
      id: `log_${Date.now()}`,
      category: 'SECURITY',
      actorId: currentUser.id,
      actorUsername: currentUser.username,
      action: 'Session Terminated (Kicked)',
      details: `Admin ${currentUser.username} forcibly terminated active terminal session of @${target.username}.`,
      targetUser: target.username,
      timestamp: Date.now(),
      severity: 'warning',
    });
    storage.saveLogs(logs);
    soundEffects.playError();
  };

  // ADMIN ACTION: Delete user
  const deleteUser = (userId: string) => {
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'Unauthorized.' };
    }

    if (userId === currentUser.id) {
      return { success: false, error: 'Cannot delete your own active admin account.' };
    }

    const target = users.find((u) => u.id === userId);
    if (!target) return { success: false, error: 'User not found.' };

    const remaining = users.filter((u) => u.id !== userId);
    updateUsersState(remaining);

    const logs = storage.getLogs();
    logs.unshift({
      id: `log_${Date.now()}`,
      category: 'SECURITY',
      actorId: currentUser.id,
      actorUsername: currentUser.username,
      action: 'Citizen Record Deleted',
      details: `Permanent deletion of @${target.username} (${target.displayName}) portfolio and credentials by ${currentUser.username}.`,
      targetUser: target.username,
      timestamp: Date.now(),
      severity: 'critical',
    });
    storage.saveLogs(logs);
    soundEffects.playError();
    return { success: true };
  };

  // ADMIN ACTION: Promote/Demote
  const updateUserRole = (userId: string, role: UserRole) => {
    if (!currentUser || currentUser.role !== 'admin') return;

    const updated = users.map((u) => (u.id === userId ? { ...u, role } : u));
    updateUsersState(updated);

    const logs = storage.getLogs();
    logs.unshift({
      id: `log_${Date.now()}`,
      category: 'SECURITY',
      actorId: currentUser.id,
      actorUsername: currentUser.username,
      action: 'Role Clearance Updated',
      details: `Clearance level for user id ${userId} updated to ${role.toUpperCase()}.`,
      timestamp: Date.now(),
      severity: 'warning',
    });
    storage.saveLogs(logs);
  };

  // USER ACTION: Update own account details and information
  const updateAccountDetails = (
    userId: string,
    updates: { displayName?: string; rpAlias?: string; newPassword?: string; newUsername?: string; currentPassword?: string }
  ) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return { success: false, error: 'User record not found.' };

    // Verify current password if changing credentials
    if (updates.newPassword || updates.newUsername) {
      if (!updates.currentPassword || updates.currentPassword !== targetUser.password) {
        soundEffects.playError();
        return { success: false, error: 'Current security passcode is incorrect.' };
      }
    }

    // Check unique username if changing username
    let updatedUsername = targetUser.username;
    if (updates.newUsername && updates.newUsername.trim()) {
      const cleanNew = updates.newUsername.trim().toLowerCase();
      if (cleanNew !== targetUser.username) {
        if (users.some((u) => u.id !== userId && u.username.toLowerCase() === cleanNew)) {
          soundEffects.playError();
          return { success: false, error: 'That username is already taken by another citizen.' };
        }
        updatedUsername = cleanNew;
      }
    }

    const updated = users.map((u) => {
      if (u.id !== userId) return u;
      return {
        ...u,
        username: updatedUsername,
        displayName: updates.displayName?.trim() || u.displayName,
        rpAlias: updates.rpAlias !== undefined ? updates.rpAlias.trim() : u.rpAlias,
        password: updates.newPassword?.trim() || u.password,
      };
    });

    updateUsersState(updated);

    const logs = storage.getLogs();
    logs.unshift({
      id: `log_${Date.now()}`,
      category: 'SECURITY',
      actorId: targetUser.id,
      actorUsername: updatedUsername,
      action: 'Account Details Updated',
      details: `@${updatedUsername} modified personal profile information and credentials.`,
      timestamp: Date.now(),
      severity: 'info',
    });
    storage.saveLogs(logs);

    soundEffects.playTradeSuccess();
    return { success: true };
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        isAdmin,
        login,
        register,
        logout,
        switchAccount,
        adjustBalance,
        banUser,
        unbanUser,
        kickUser,
        deleteUser,
        updateUserRole,
        updateAccountDetails,
        refreshUsers,
        kickedNotice,
        clearKickedNotice: () => setKickedNotice(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
