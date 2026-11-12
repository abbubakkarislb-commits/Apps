import { User, StockAsset, TradeOrder, AuditLog, MarketNews, PricePoint, SectorType } from '../types';

const STORAGE_KEYS = {
  USERS: 'apex_rp_users',
  STOCKS: 'apex_rp_stocks',
  ORDERS: 'apex_rp_orders',
  LOGS: 'apex_rp_logs',
  NEWS: 'apex_rp_news',
  CURRENT_USER_ID: 'apex_rp_active_uid',
  MARKET_CIRCUIT_BREAKER: 'apex_rp_circuit_breaker',
};

// Generate realistic 30-period historical candle data
function generateHistoricalCandles(basePrice: number, volatility: number, count = 35): PricePoint[] {
  const points: PricePoint[] = [];
  const now = Date.now();
  const intervalMs = 60 * 1000 * 5; // 5 min candles
  let current = basePrice * (0.85 + Math.random() * 0.15);

  for (let i = count; i >= 0; i--) {
    const time = now - i * intervalMs;
    const changePercent = (Math.random() - 0.48) * volatility;
    const open = current;
    const close = Math.max(1, open * (1 + changePercent));
    const high = Math.max(open, close) * (1 + Math.random() * (volatility * 0.6));
    const low = Math.max(0.5, Math.min(open, close) * (1 - Math.random() * (volatility * 0.6)));
    const volume = Math.floor(100 + Math.random() * 4500);

    points.push({
      time,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
    });
    current = close;
  }
  return points;
}

const DEFAULT_USERS: User[] = [
  {
    id: 'user_admin_01',
    username: 'admin',
    password: 'ApexAdmin#2026!',
    displayName: 'Exchange Governor',
    rpAlias: 'Supreme Administrator',
    alias: 'Supreme Administrator',
    role: 'admin',
    status: 'active',
    balance: 1000000,
    holdings: {},
    createdAt: Date.now() - 86400000 * 14,
    lastActive: Date.now(),
  },
];

const DEFAULT_STOCKS: StockAsset[] = [];

const DEFAULT_NEWS: MarketNews[] = [
  {
    id: 'news_01',
    headline: 'City Council Approves Cyberware Subsidies for Metro Security',
    content: 'A landmark $40M FRD appropriation was finalized this morning, signaling massive orders for Nexus Cybernetics military-grade neural hardware.',
    source: 'The Daily Chronicle',
    sectorTag: 'Cybertech & AI',
    impact: 'bullish',
    affectedTicker: 'NEXUS',
    timestamp: Date.now() - 3600000 * 2,
    isBreaking: true,
  },
  {
    id: 'news_02',
    headline: 'High Seas Coast Guard Impounds Unregistered Tanker off Deep Port',
    content: 'Customs officials intercepted a vessel linked to Hydra Petrochemicals suspected of bypassing state fuel duties and embargo protocols.',
    source: 'Port Authority Dispatch',
    sectorTag: 'Petro & Smuggling',
    impact: 'bearish',
    affectedTicker: 'HYDRA',
    timestamp: Date.now() - 3600000 * 5,
  },
  {
    id: 'news_03',
    headline: 'Diamond Lust Hosts Record-Breaking Underground Poker Invitational',
    content: 'Over $50M FRD in fictional table stakes changed hands as international high-rollers flooded into the penthouse suite lounges.',
    source: 'Neon Strip Insider',
    sectorTag: 'Entertainment & Gaming',
    impact: 'bullish',
    affectedTicker: 'LUST',
    timestamp: Date.now() - 3600000 * 9,
  },
  {
    id: 'news_04',
    headline: 'Titan Mining Unearths High-Grade Lithium Reservoir in Sector 9',
    content: 'Geological surveys confirm an estimated 800,000 metric tons of battery-grade deposits, securing supply lines for next-generation tech.',
    source: 'Industrial Geology Weekly',
    sectorTag: 'Mining & Heavy Ops',
    impact: 'bullish',
    affectedTicker: 'TITAN',
    timestamp: Date.now() - 3600000 * 16,
  },
];

const DEFAULT_LOGS: AuditLog[] = [
  {
    id: 'log_01',
    category: 'MARKET_EVENT',
    actorId: 'system',
    actorUsername: 'SYSTEM',
    action: 'Market Session Initialized',
    details: 'Stock Market FT Fox Republic Exchange session initialized. All markets ready for administrator management.',
    timestamp: Date.now() - 86400000,
    severity: 'info',
  },
  {
    id: 'log_02',
    category: 'TRADE',
    actorId: 'user_trader_01',
    actorUsername: 'viktor',
    action: 'BUY Order Executed',
    details: 'Acquired 800 shares of VANCE at 175.00 FRD each.',
    amountRP: 140000,
    targetTicker: 'VANCE',
    timestamp: Date.now() - 3600000 * 12,
    severity: 'info',
  },
  {
    id: 'log_03',
    category: 'ADMIN',
    actorId: 'user_admin_01',
    actorUsername: 'admin',
    action: 'Liquidity Injection',
    details: 'Federal treasury injected 50,000 FRD into city exchange reserve.',
    amountRP: 50000,
    timestamp: Date.now() - 3600000 * 6,
    severity: 'warning',
  },
];

export const storage = {
  getUsers(): User[] {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    try {
      const parsed: User[] = JSON.parse(raw);
      // Ensure admin account exists with updated master password
      const adminIdx = parsed.findIndex((u) => u.username === 'admin');
      if (adminIdx !== -1) {
        if (!parsed[adminIdx].password || parsed[adminIdx].password === 'admin123') {
          parsed[adminIdx].password = 'ApexAdmin#2026!';
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(parsed));
        }
      } else {
        parsed.unshift(DEFAULT_USERS[0]);
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(parsed));
      }
      return parsed;
    } catch {
      return DEFAULT_USERS;
    }
  },

  saveUsers(users: User[]) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  getStocks(): StockAsset[] {
    const isCustomMode = localStorage.getItem('apex_rp_custom_markets_v2');
    if (!isCustomMode) {
      // Migrate: clear out previous demo stocks and reset holdings so user has a clean slate
      localStorage.setItem('apex_rp_custom_markets_v2', 'true');
      localStorage.setItem(STORAGE_KEYS.STOCKS, JSON.stringify([]));
      const currentUsers = this.getUsers().map((u) => ({ ...u, holdings: {} }));
      this.saveUsers(currentUsers);
      return [];
    }

    const raw = localStorage.getItem(STORAGE_KEYS.STOCKS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.STOCKS, JSON.stringify([]));
      return [];
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveStocks(stocks: StockAsset[]) {
    localStorage.setItem(STORAGE_KEYS.STOCKS, JSON.stringify(stocks));
  },

  getOrders(): TradeOrder[] {
    const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveOrders(orders: TradeOrder[]) {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders.slice(-200)));
  },

  getLogs(): AuditLog[] {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(DEFAULT_LOGS));
      return DEFAULT_LOGS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_LOGS;
    }
  },

  saveLogs(logs: AuditLog[]) {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs.slice(-300)));
  },

  getNews(): MarketNews[] {
    const raw = localStorage.getItem(STORAGE_KEYS.NEWS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.NEWS, JSON.stringify(DEFAULT_NEWS));
      return DEFAULT_NEWS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_NEWS;
    }
  },

  saveNews(news: MarketNews[]) {
    localStorage.setItem(STORAGE_KEYS.NEWS, JSON.stringify(news.slice(-50)));
  },

  getActiveUserId(): string | null {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || null;
  },

  setActiveUserId(id: string | null) {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    }
  },

  getCircuitBreaker(): boolean {
    return localStorage.getItem(STORAGE_KEYS.MARKET_CIRCUIT_BREAKER) === 'true';
  },

  setCircuitBreaker(frozen: boolean) {
    localStorage.setItem(STORAGE_KEYS.MARKET_CIRCUIT_BREAKER, String(frozen));
  },

  resetAllData() {
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.STOCKS);
    localStorage.removeItem(STORAGE_KEYS.ORDERS);
    localStorage.removeItem(STORAGE_KEYS.LOGS);
    localStorage.removeItem(STORAGE_KEYS.NEWS);
    localStorage.removeItem(STORAGE_KEYS.MARKET_CIRCUIT_BREAKER);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, 'user_admin_01');
  },
};
