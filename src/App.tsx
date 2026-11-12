import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MarketProvider, useMarket } from './context/MarketContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar, ActiveTab } from './components/Navbar';
import { MarketTickerBar } from './components/MarketTickerBar';
import { TradingModal } from './components/TradingModal';
import { TransferModal } from './components/TransferModal';
import { SettingsModal } from './components/SettingsModal';
import { LoginPortal } from './views/LoginPortal';
import { MarketView } from './views/MarketView';
import { StockDetailView } from './views/StockDetailView';
import { PortfolioView } from './views/PortfolioView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { NewsFeedView } from './views/NewsFeedView';
import { StockAsset } from './types';
import { AlertTriangle, X } from 'lucide-react';

function AppContent() {
  const { currentUser, kickedNotice, clearKickedNotice } = useAuth();

  const [activeTab, setActiveTab] = useState<ActiveTab>('markets');
  const [selectedStockTicker, setSelectedStockTicker] = useState<string | null>(null);

  // Modal states
  const [tradingStock, setTradingStock] = useState<StockAsset | null>(null);
  const [tradingType, setTradingType] = useState<'BUY' | 'SELL'>('BUY');
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // If user is not logged in, show full-screen login / create account screen first
  if (!currentUser) {
    return <LoginPortal />;
  }

  const handleSelectStock = (ticker: string) => {
    setSelectedStockTicker(ticker);
    setActiveTab('stock_detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenTrade = (stock: StockAsset, type: 'BUY' | 'SELL' = 'BUY') => {
    setTradingStock(stock);
    setTradingType(type);
  };

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans selection:bg-emerald-500/25 selection:text-emerald-300">
      {/* Main Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'stock_detail') {
            setSelectedStockTicker(null);
          }
        }}
        onOpenAuthModal={() => {}}
        onOpenTransferModal={() => setIsTransferOpen(true)}
        onOpenSettingsModal={() => setIsSettingsOpen(true)}
      />

      {/* Live Market Ticker Tape */}
      <MarketTickerBar onSelectStock={handleSelectStock} />

      {/* Kicked Alert Notice if session was severed */}
      {kickedNotice && (
        <div className="bg-rose-950/90 border-b border-rose-500/40 text-rose-200 px-4 py-2.5 flex items-center justify-between text-xs font-mono animate-in fade-in">
          <div className="flex items-center gap-2 max-w-5xl mx-auto">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{kickedNotice}</span>
          </div>
          <button
            onClick={clearKickedNotice}
            className="text-slate-400 hover:text-slate-200 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Container Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-5 lg:px-6 py-5">
        {activeTab === 'markets' && (
          <MarketView
            onSelectStock={handleSelectStock}
            onOpenTrade={handleOpenTrade}
            onNavigateToAdmin={() => setActiveTab('admin')}
          />
        )}

        {activeTab === 'stock_detail' && selectedStockTicker && (
          <StockDetailView
            ticker={selectedStockTicker}
            onBack={() => {
              setActiveTab('markets');
              setSelectedStockTicker(null);
            }}
            onOpenTrade={handleOpenTrade}
          />
        )}

        {activeTab === 'portfolio' && (
          <PortfolioView
            onSelectStock={handleSelectStock}
            onOpenTrade={handleOpenTrade}
            onOpenTransfer={() => setIsTransferOpen(true)}
            onOpenAuth={() => {}}
          />
        )}

        {activeTab === 'news' && <NewsFeedView onSelectStock={handleSelectStock} />}

        {activeTab === 'admin' && <AdminDashboardView />}
      </main>

      {/* Modals */}
      {tradingStock && (
        <TradingModal
          stock={tradingStock}
          initialType={tradingType}
          onClose={() => setTradingStock(null)}
        />
      )}

      {isTransferOpen && (
        <TransferModal onClose={() => setIsTransferOpen(false)} />
      )}

      {isSettingsOpen && (
        <SettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MarketProvider>
          <AppContent />
        </MarketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
