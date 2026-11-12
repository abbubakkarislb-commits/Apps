import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { StockAsset, TradeOrder, AuditLog, MarketNews, PricePoint, SectorType } from '../types';
import { storage } from '../services/storage';
import { useAuth } from './AuthContext';
import { soundEffects } from '../services/audio';

interface MarketContextType {
  stocks: StockAsset[];
  orders: TradeOrder[];
  logs: AuditLog[];
  news: MarketNews[];
  isCircuitBreakerActive: boolean;
  // Trading methods
  buyStock: (ticker: string, shares: number) => { success: boolean; error?: string };
  sellStock: (ticker: string, shares: number) => { success: boolean; error?: string };
  transferFunds: (toUsername: string, amountRP: number, memo: string) => { success: boolean; error?: string };
  // Admin stock & market controls
  setStockPrice: (ticker: string, newPrice: number) => void;
  adjustStockPricePercent: (ticker: string, percentDelta: number) => void;
  toggleStockFreeze: (ticker: string) => void;
  toggleCircuitBreaker: () => void;
  setStockVolatility: (ticker: string, volatility: StockAsset['volatility']) => void;
  createStock: (newStock: Omit<StockAsset, 'history' | 'change24h' | 'changeRP' | 'changeFRD' | 'high24h' | 'low24h' | 'volume24h' | 'marketCap'>) => { success: boolean; error?: string };
  deleteStock: (ticker: string) => { success: boolean; error?: string };
  updateStock: (ticker: string, updates: Partial<StockAsset>) => void;
  broadcastNews: (headline: string, content: string, sectorTag: SectorType | 'GENERAL', impact: 'bullish' | 'bearish' | 'neutral', affectedTicker?: string) => void;
  deleteNews: (newsId: string) => void;
  resetAllMarketData: () => void;
}

const MarketContext = createContext<MarketContextType | undefined>(undefined);

export const MarketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, refreshUsers } = useAuth();

  const [stocks, setStocks] = useState<StockAsset[]>(() => storage.getStocks());
  const [orders, setOrders] = useState<TradeOrder[]>(() => storage.getOrders());
  const [logs, setLogs] = useState<AuditLog[]>(() => storage.getLogs());
  const [news, setNews] = useState<MarketNews[]>(() => storage.getNews());
  const [isCircuitBreakerActive, setIsCircuitBreakerActive] = useState<boolean>(() => storage.getCircuitBreaker());

  // Add audit log helper
  const addAuditLog = useCallback((logItem: Omit<AuditLog, 'id' | 'timestamp'>) => {
    const fullLog: AuditLog = {
      ...logItem,
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
    };
    setLogs((prev) => {
      const next = [fullLog, ...prev.slice(0, 250)];
      storage.saveLogs(next);
      return next;
    });
  }, []);

  // NOTE: Random price fluctuations are DISABLED per user request.
  // Prices and volume are 100% strictly controlled manually by the Admin.

  // Trading: BUY Stock
  const buyStock = (ticker: string, shares: number) => {
    if (!currentUser) return { success: false, error: 'Sign in to execute trade.' };
    if (currentUser.status === 'suspended') return { success: false, error: 'Account suspended.' };
    if (isCircuitBreakerActive) return { success: false, error: 'Exchange circuit breaker is ACTIVE. Trading halted.' };

    const stock = stocks.find((s) => s.ticker === ticker);
    if (!stock) return { success: false, error: 'Asset not found.' };
    if (stock.isFrozen) return { success: false, error: `${stock.name} (${stock.ticker}) is currently frozen by regulators.` };
    if (shares <= 0 || !Number.isInteger(shares)) return { success: false, error: 'Invalid share quantity.' };

    const totalCost = Number((shares * stock.currentPrice).toFixed(2));
    const fee = Number((totalCost * 0.005).toFixed(2)); // 0.5% exchange fee
    const grandTotal = Number((totalCost + fee).toFixed(2));

    if (currentUser.balance < grandTotal) {
      soundEffects.playError();
      return {
        success: false,
        error: `Insufficient FRD funds. Required: ${grandTotal.toLocaleString()} FRD, Available: ${currentUser.balance.toLocaleString()} FRD`,
      };
    }

    // Execute balance deduction & holding update
    const updatedUsers = storage.getUsers();
    const targetUserIndex = updatedUsers.findIndex((u) => u.id === currentUser.id);
    if (targetUserIndex === -1) return { success: false, error: 'User record missing.' };

    const existingHolding = currentUser.holdings[ticker] || {
      ticker,
      shares: 0,
      avgBuyPrice: 0,
      totalCost: 0,
    };

    const newShares = existingHolding.shares + shares;
    const newTotalCost = existingHolding.totalCost + totalCost;
    const newAvgBuyPrice = Number((newTotalCost / newShares).toFixed(2));

    updatedUsers[targetUserIndex] = {
      ...currentUser,
      balance: Number((currentUser.balance - grandTotal).toFixed(2)),
      holdings: {
        ...currentUser.holdings,
        [ticker]: {
          ticker,
          shares: newShares,
          avgBuyPrice: newAvgBuyPrice,
          totalCost: newTotalCost,
        },
      },
    };

    storage.saveUsers(updatedUsers);
    refreshUsers();

    // Create Order Record
    const order: TradeOrder = {
      id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: currentUser.id,
      username: currentUser.username,
      displayName: currentUser.displayName,
      ticker,
      stockName: stock.name,
      type: 'BUY',
      shares,
      pricePerShare: stock.currentPrice,
      totalRP: grandTotal,
      totalFRD: grandTotal,
      fee,
      timestamp: Date.now(),
    };

    const updatedOrders = [order, ...orders.slice(0, 150)];
    setOrders(updatedOrders);
    storage.saveOrders(updatedOrders);

    // Add Audit Log
    addAuditLog({
      category: 'TRADE',
      actorId: currentUser.id,
      actorUsername: currentUser.username,
      action: 'BUY Order',
      details: `${currentUser.displayName} bought ${shares} shares of ${ticker} @ ${stock.currentPrice.toLocaleString()} FRD (Total: ${grandTotal.toLocaleString()} FRD)`,
      amountRP: grandTotal,
      amountFRD: grandTotal,
      targetTicker: ticker,
      severity: 'info',
    });

    soundEffects.playTradeSuccess();
    return { success: true };
  };

  // Trading: SELL Stock
  const sellStock = (ticker: string, shares: number) => {
    if (!currentUser) return { success: false, error: 'Sign in to execute trade.' };
    if (currentUser.status === 'suspended') return { success: false, error: 'Account suspended.' };
    if (isCircuitBreakerActive) return { success: false, error: 'Exchange circuit breaker is ACTIVE. Trading halted.' };

    const stock = stocks.find((s) => s.ticker === ticker);
    if (!stock) return { success: false, error: 'Asset not found.' };
    if (stock.isFrozen) return { success: false, error: `${stock.name} is currently frozen.` };
    if (shares <= 0 || !Number.isInteger(shares)) return { success: false, error: 'Invalid share quantity.' };

    const existingHolding = currentUser.holdings[ticker];
    if (!existingHolding || existingHolding.shares < shares) {
      soundEffects.playError();
      return {
        success: false,
        error: `Insufficient shares. You own ${existingHolding ? existingHolding.shares : 0} of ${ticker}.`,
      };
    }

    const grossRevenue = Number((shares * stock.currentPrice).toFixed(2));
    const fee = Number((grossRevenue * 0.005).toFixed(2)); // 0.5% exchange fee
    const netPayout = Number((grossRevenue - fee).toFixed(2));

    const updatedUsers = storage.getUsers();
    const targetUserIndex = updatedUsers.findIndex((u) => u.id === currentUser.id);
    if (targetUserIndex === -1) return { success: false, error: 'User record missing.' };

    const remainingShares = existingHolding.shares - shares;
    const newHoldings = { ...currentUser.holdings };

    if (remainingShares === 0) {
      delete newHoldings[ticker];
    } else {
      const remainingCost = Number((existingHolding.avgBuyPrice * remainingShares).toFixed(2));
      newHoldings[ticker] = {
        ...existingHolding,
        shares: remainingShares,
        totalCost: remainingCost,
      };
    }

    updatedUsers[targetUserIndex] = {
      ...currentUser,
      balance: Number((currentUser.balance + netPayout).toFixed(2)),
      holdings: newHoldings,
    };

    storage.saveUsers(updatedUsers);
    refreshUsers();

    // Create Order Record
    const order: TradeOrder = {
      id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: currentUser.id,
      username: currentUser.username,
      displayName: currentUser.displayName,
      ticker,
      stockName: stock.name,
      type: 'SELL',
      shares,
      pricePerShare: stock.currentPrice,
      totalRP: netPayout,
      totalFRD: netPayout,
      fee,
      timestamp: Date.now(),
    };

    const updatedOrders = [order, ...orders.slice(0, 150)];
    setOrders(updatedOrders);
    storage.saveOrders(updatedOrders);

    // Audit log
    addAuditLog({
      category: 'TRADE',
      actorId: currentUser.id,
      actorUsername: currentUser.username,
      action: 'SELL Order',
      details: `${currentUser.displayName} liquidated ${shares} shares of ${ticker} @ ${stock.currentPrice.toLocaleString()} FRD (Net: +${netPayout.toLocaleString()} FRD)`,
      amountRP: netPayout,
      amountFRD: netPayout,
      targetTicker: ticker,
      severity: 'success',
    });

    soundEffects.playTradeSuccess();
    return { success: true };
  };

  // RP Wire Transfer
  const transferFunds = (toUsername: string, amountRP: number, memo: string) => {
    if (!currentUser) return { success: false, error: 'Must be logged in.' };
    if (amountRP <= 0) return { success: false, error: 'Invalid transfer amount.' };
    if (currentUser.balance < amountRP) return { success: false, error: 'Insufficient funds.' };

    const cleanUsername = toUsername.trim().toLowerCase();
    if (cleanUsername === currentUser.username.toLowerCase()) {
      return { success: false, error: 'Cannot wire transfer funds to yourself.' };
    }

    const allUsers = storage.getUsers();
    const recipientIndex = allUsers.findIndex((u) => u.username.toLowerCase() === cleanUsername);
    if (recipientIndex === -1) return { success: false, error: `Citizen @${toUsername} does not exist.` };

    const recipient = allUsers[recipientIndex];
    const senderIndex = allUsers.findIndex((u) => u.id === currentUser.id);

    allUsers[senderIndex].balance = Number((allUsers[senderIndex].balance - amountRP).toFixed(2));
    allUsers[recipientIndex].balance = Number((allUsers[recipientIndex].balance + amountRP).toFixed(2));

    storage.saveUsers(allUsers);
    refreshUsers();

    addAuditLog({
      category: 'TRANSFER',
      actorId: currentUser.id,
      actorUsername: currentUser.username,
      action: 'Wire Transfer Sent',
      details: `@${currentUser.username} transferred ${amountRP.toLocaleString()} FRD to @${recipient.username}. Note: "${memo || 'No memo'}"`,
      amountRP,
      amountFRD: amountRP,
      targetUser: recipient.username,
      severity: 'info',
    });

    soundEffects.playTradeSuccess();
    return { success: true };
  };

  // ADMIN ACTION: Force Pump / Dump direct price
  const setStockPrice = (ticker: string, newPrice: number) => {
    if (!currentUser || currentUser.role !== 'admin') return;
    const clampedPrice = Math.max(0.1, Number(newPrice.toFixed(2)));

    setStocks((prev) => {
      const updated = prev.map((s) => {
        if (s.ticker !== ticker) return s;
        const oldPrice = s.currentPrice;
        const diff = clampedPrice - oldPrice;
        const pct = Number(((diff / oldPrice) * 100).toFixed(2));
        const high24h = Math.max(s.high24h, clampedPrice);
        const low24h = Math.min(s.low24h, clampedPrice);
        const marketCap = Math.round(clampedPrice * s.circulatingShares);

        return {
          ...s,
          currentPrice: clampedPrice,
          changeRP: Number(((s.changeRP || 0) + diff).toFixed(2)),
          changeFRD: Number(((s.changeFRD || 0) + diff).toFixed(2)),
          change24h: pct,
          high24h,
          low24h,
          marketCap,
        };
      });
      storage.saveStocks(updated);
      return updated;
    });

    addAuditLog({
      category: 'ADMIN',
      actorId: currentUser.id,
      actorUsername: currentUser.username,
      action: 'Admin Price Override',
      details: `Admin ${currentUser.username} manually adjusted ${ticker} price to ${clampedPrice.toLocaleString()} FRD.`,
      targetTicker: ticker,
      severity: 'warning',
    });
    soundEffects.playMarketAlert();
  };

  // ADMIN ACTION: Percentage jump (+20%, -30%, etc)
  const adjustStockPricePercent = (ticker: string, percentDelta: number) => {
    const stock = stocks.find((s) => s.ticker === ticker);
    if (!stock) return;
    const targetPrice = stock.currentPrice * (1 + percentDelta / 100);
    setStockPrice(ticker, targetPrice);
  };

  // ADMIN ACTION: Freeze / Unfreeze stock
  const toggleStockFreeze = (ticker: string) => {
    if (!currentUser || currentUser.role !== 'admin') return;

    setStocks((prev) => {
      const updated = prev.map((s) => (s.ticker === ticker ? { ...s, isFrozen: !s.isFrozen } : s));
      storage.saveStocks(updated);
      return updated;
    });

    const targetStock = stocks.find((s) => s.ticker === ticker);
    const newStatus = targetStock?.isFrozen ? 'UNFROZEN' : 'FROZEN';

    addAuditLog({
      category: 'ADMIN',
      actorId: currentUser.id,
      actorUsername: currentUser.username,
      action: `Stock Trading ${newStatus}`,
      details: `Admin ${currentUser.username} set asset status for ${ticker} to ${newStatus}.`,
      targetTicker: ticker,
      severity: newStatus === 'FROZEN' ? 'critical' : 'success',
    });
    soundEffects.playMarketAlert();
  };

  // ADMIN ACTION: Emergency Circuit Breaker (halts entire exchange)
  const toggleCircuitBreaker = () => {
    if (!currentUser || currentUser.role !== 'admin') return;

    const nextState = !isCircuitBreakerActive;
    setIsCircuitBreakerActive(nextState);
    storage.setCircuitBreaker(nextState);

    addAuditLog({
      category: 'ADMIN',
      actorId: currentUser.id,
      actorUsername: currentUser.username,
      action: nextState ? 'CIRCUIT BREAKER TRIGGERED' : 'CIRCUIT BREAKER LIFTED',
      details: nextState
        ? `Exchange trading halted across all assets by Admin ${currentUser.username}.`
        : `Exchange trading resumed by Admin ${currentUser.username}.`,
      severity: nextState ? 'critical' : 'success',
    });

    soundEffects.playMarketAlert();
  };

  // ADMIN ACTION: Adjust Stock Volatility
  const setStockVolatility = (ticker: string, volatility: StockAsset['volatility']) => {
    if (!currentUser || currentUser.role !== 'admin') return;

    setStocks((prev) => {
      const updated = prev.map((s) => (s.ticker === ticker ? { ...s, volatility } : s));
      storage.saveStocks(updated);
      return updated;
    });

    addAuditLog({
      category: 'ADMIN',
      actorId: currentUser.id,
      actorUsername: currentUser.username,
      action: 'Volatility Matrix Updated',
      details: `Volatility rating for ${ticker} changed to ${volatility.toUpperCase()} by Admin ${currentUser.username}.`,
      targetTicker: ticker,
      severity: 'info',
    });
  };

  // ADMIN ACTION: Create new Stock / Company Asset
  const createStock = (newStockData: Omit<StockAsset, 'history' | 'change24h' | 'changeRP' | 'changeFRD' | 'high24h' | 'low24h' | 'volume24h' | 'marketCap'>) => {
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'Unauthorized.' };
    }

    const cleanTicker = newStockData.ticker.trim().toUpperCase();
    if (!cleanTicker) return { success: false, error: 'Ticker symbol required.' };
    if (stocks.some((s) => s.ticker === cleanTicker)) {
      return { success: false, error: `Ticker ${cleanTicker} already exists on the exchange.` };
    }

    const basePrice = Math.max(1, Number(newStockData.currentPrice.toFixed(2)));
    const history = [
      {
        time: Date.now() - 3600000,
        open: basePrice,
        high: basePrice * 1.02,
        low: basePrice * 0.98,
        close: basePrice,
        volume: 500,
      },
      {
        time: Date.now(),
        open: basePrice,
        high: basePrice,
        low: basePrice,
        close: basePrice,
        volume: 0,
      },
    ];

    const stockAsset: StockAsset = {
      ...newStockData,
      ticker: cleanTicker,
      currentPrice: basePrice,
      change24h: 0,
      changeRP: 0,
      changeFRD: 0,
      high24h: basePrice,
      low24h: basePrice,
      volume24h: 0,
      marketCap: Math.round(basePrice * newStockData.circulatingShares),
      history,
      createdByAdmin: true,
    };

    const nextStocks = [stockAsset, ...stocks];
    setStocks(nextStocks);
    storage.saveStocks(nextStocks);

    addAuditLog({
      category: 'ADMIN',
      actorId: currentUser.id,
      actorUsername: currentUser.username,
      action: 'New Asset Listed (IPO)',
      details: `Listed new company: ${stockAsset.name} ($${stockAsset.ticker}) in sector ${stockAsset.sector} at ${basePrice.toLocaleString()} FRD.`,
      targetTicker: cleanTicker,
      severity: 'success',
    });

    // Automatically generate breaking news for the IPO
    const ipoNews: MarketNews = {
      id: `news_${Date.now()}`,
      headline: `INITIAL PUBLIC OFFERING: ${stockAsset.name} ($${stockAsset.ticker}) Lists on Stock Market FT`,
      content: stockAsset.lore || `The exchange welcomes ${stockAsset.name} to trading at starting price of ${basePrice} FRD.`,
      source: 'Stock Market FT Wire',
      sectorTag: stockAsset.sector,
      impact: 'bullish',
      affectedTicker: cleanTicker,
      timestamp: Date.now(),
      isBreaking: true,
    };
    const nextNews = [ipoNews, ...news];
    setNews(nextNews);
    storage.saveNews(nextNews);

    soundEffects.playMarketAlert();
    return { success: true };
  };

  // ADMIN ACTION: Delete Stock Asset & Reimburse Citizens
  const deleteStock = (ticker: string) => {
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'Unauthorized.' };
    }

    const targetStock = stocks.find((s) => s.ticker === ticker);
    if (!targetStock) return { success: false, error: 'Stock asset not found.' };

    // Reimburse all citizens who own this stock at its current price
    const allUsers = storage.getUsers();
    let totalReimbursedRP = 0;
    let affectedShareholders = 0;

    const updatedUsers = allUsers.map((u) => {
      const holding = u.holdings[ticker];
      if (holding && holding.shares > 0) {
        const refundAmount = Number((holding.shares * targetStock.currentPrice).toFixed(2));
        totalReimbursedRP += refundAmount;
        affectedShareholders++;
        const newHoldings = { ...u.holdings };
        delete newHoldings[ticker];
        return {
          ...u,
          balance: Number((u.balance + refundAmount).toFixed(2)),
          holdings: newHoldings,
        };
      }
      return u;
    });

    storage.saveUsers(updatedUsers);
    refreshUsers();

    const remainingStocks = stocks.filter((s) => s.ticker !== ticker);
    setStocks(remainingStocks);
    storage.saveStocks(remainingStocks);

    addAuditLog({
      category: 'ADMIN',
      actorId: currentUser.id,
      actorUsername: currentUser.username,
      action: 'Asset Delisted & Liquidated',
      details: `Delisted ${targetStock.name} ($${ticker}). Liquidated and reimbursed ${affectedShareholders} shareholders for ${totalReimbursedRP.toLocaleString()} FRD.`,
      targetTicker: ticker,
      amountRP: totalReimbursedRP,
      amountFRD: totalReimbursedRP,
      severity: 'critical',
    });

    soundEffects.playError();
    return { success: true };
  };

  // ADMIN ACTION: Update Stock info
  const updateStock = (ticker: string, updates: Partial<StockAsset>) => {
    if (!currentUser || currentUser.role !== 'admin') return;

    setStocks((prev) => {
      const updated = prev.map((s) => (s.ticker === ticker ? { ...s, ...updates } : s));
      storage.saveStocks(updated);
      return updated;
    });

    addAuditLog({
      category: 'ADMIN',
      actorId: currentUser.id,
      actorUsername: currentUser.username,
      action: 'Asset Metadata Modified',
      details: `Admin ${currentUser.username} updated profile for ${ticker}.`,
      targetTicker: ticker,
      severity: 'info',
    });
  };

  // ADMIN ACTION: Broadcast Breaking RP News
  const broadcastNews = (
    headline: string,
    content: string,
    sectorTag: SectorType | 'GENERAL',
    impact: 'bullish' | 'bearish' | 'neutral',
    affectedTicker?: string
  ) => {
    if (!currentUser || currentUser.role !== 'admin') return;

    const newNewsItem: MarketNews = {
      id: `news_${Date.now()}`,
      headline: headline.trim(),
      content: content.trim(),
      source: 'Apex Federal Broadcast Bureau',
      sectorTag,
      impact,
      affectedTicker: affectedTicker ? affectedTicker.toUpperCase() : undefined,
      timestamp: Date.now(),
      isBreaking: true,
    };

    const nextNews = [newNewsItem, ...news];
    setNews(nextNews);
    storage.saveNews(nextNews);

    // If an affected stock is specified, apply market sentiment jump
    if (affectedTicker) {
      const target = stocks.find((s) => s.ticker === affectedTicker.toUpperCase());
      if (target) {
        const delta = impact === 'bullish' ? 12 : impact === 'bearish' ? -15 : 0;
        if (delta !== 0) {
          adjustStockPricePercent(target.ticker, delta);
        }
      }
    }

    addAuditLog({
      category: 'MARKET_EVENT',
      actorId: currentUser.id,
      actorUsername: currentUser.username,
      action: 'Breaking News Broadcast',
      details: `Admin published: "${headline.trim()}" (Impact: ${impact.toUpperCase()})`,
      targetTicker: affectedTicker,
      severity: impact === 'bearish' ? 'warning' : 'info',
    });

    soundEffects.playMarketAlert();
  };

  // ADMIN ACTION: Delete a news broadcast item
  const deleteNews = (newsId: string) => {
    if (!currentUser || currentUser.role !== 'admin') return;

    setNews((prev) => {
      const remaining = prev.filter((n) => n.id !== newsId);
      storage.saveNews(remaining);
      return remaining;
    });

    addAuditLog({
      category: 'ADMIN',
      actorId: currentUser.id,
      actorUsername: currentUser.username,
      action: 'News Broadcast Deleted',
      details: `Admin ${currentUser.username} removed news story (ID: ${newsId}) from the terminal feed.`,
      severity: 'info',
    });
  };

  // ADMIN ACTION: Full Reset
  const resetAllMarketData = () => {
    if (!currentUser || currentUser.role !== 'admin') return;
    storage.resetAllData();
    window.location.reload();
  };

  return (
    <MarketContext.Provider
      value={{
        stocks,
        orders,
        logs,
        news,
        isCircuitBreakerActive,
        buyStock,
        sellStock,
        transferFunds,
        setStockPrice,
        adjustStockPricePercent,
        toggleStockFreeze,
        toggleCircuitBreaker,
        setStockVolatility,
        createStock,
        deleteStock,
        updateStock,
        broadcastNews,
        deleteNews,
        resetAllMarketData,
      }}
    >
      {children}
    </MarketContext.Provider>
  );
};

export const useMarket = () => {
  const ctx = useContext(MarketContext);
  if (!ctx) throw new Error('useMarket must be used within a MarketProvider');
  return ctx;
};
