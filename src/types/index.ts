export type UserRole = 'admin' | 'trader';
export type AccountStatus = 'active' | 'suspended' | 'kicked';

export interface UserHolding {
  ticker: string;
  shares: number;
  avgBuyPrice: number;
  totalCost: number;
}

export interface User {
  id: string;
  username: string;
  password: string;
  displayName: string;
  rpAlias?: string;
  alias?: string;
  role: UserRole;
  status: AccountStatus;
  banReason?: string;
  balance: number; // FRD cash (Fox Republic Dot)
  holdings: Record<string, UserHolding>; // keyed by ticker
  avatarUrl?: string;
  createdAt: number;
  lastActive: number;
}

export interface PricePoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type SectorType =
  | 'Defense & Arms'
  | 'Cybertech & AI'
  | 'Petro & Energy'
  | 'Petro & Smuggling'
  | 'Entertainment & Gaming'
  | 'Pharma & Biotech'
  | 'Pharma & Stims'
  | 'Logistics & Cargo'
  | 'Mining & Heavy Ops'
  | 'Media & Communications'
  | 'Media & Syndicate';

export interface StockAsset {
  ticker: string;
  name: string;
  sector: SectorType;
  description: string;
  lore: string;
  currentPrice: number;
  change24h: number; // percentage
  changeRP?: number; // FRD change
  changeFRD: number; // FRD change
  high24h: number;
  low24h: number;
  volume24h: number;
  circulatingShares: number;
  marketCap: number;
  isFrozen: boolean;
  volatility: 'low' | 'medium' | 'high' | 'extreme';
  dividendYield: number; // % annual dividend
  history: PricePoint[];
  createdByAdmin?: boolean;
}

export interface TradeOrder {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  ticker: string;
  stockName: string;
  type: 'BUY' | 'SELL';
  shares: number;
  pricePerShare: number;
  totalRP?: number;
  totalFRD: number;
  fee: number;
  timestamp: number;
}

export interface WireTransfer {
  id: string;
  fromUserId: string;
  fromUsername: string;
  toUserId: string;
  toUsername: string;
  amount: number;
  memo: string;
  timestamp: number;
}

export type AuditLogCategory = 'TRADE' | 'ADMIN' | 'TRANSFER' | 'SECURITY' | 'MARKET_EVENT';

export interface AuditLog {
  id: string;
  category: AuditLogCategory;
  actorId: string;
  actorUsername: string;
  action: string;
  details: string;
  amountRP?: number;
  amountFRD?: number;
  targetUser?: string;
  targetTicker?: string;
  timestamp: number;
  severity: 'info' | 'warning' | 'critical' | 'success';
}

export interface MarketNews {
  id: string;
  headline: string;
  content: string;
  source: string;
  sectorTag: SectorType | 'GENERAL';
  impact: 'bullish' | 'bearish' | 'neutral';
  affectedTicker?: string;
  timestamp: number;
  isBreaking?: boolean;
}
