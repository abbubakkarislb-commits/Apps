import React, { useState } from 'react';
import { useMarket } from '../context/MarketContext';
import { useAuth } from '../context/AuthContext';
import { MarketNews, SectorType } from '../types';
import {
  Newspaper,
  Radio,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ArrowRight,
  Clock,
  Building,
  Filter,
  Trash2,
} from 'lucide-react';

interface NewsFeedViewProps {
  onSelectStock: (ticker: string) => void;
}

export const NewsFeedView: React.FC<NewsFeedViewProps> = ({ onSelectStock }) => {
  const { news, deleteNews } = useMarket();
  const { isAdmin } = useAuth();
  const [filterImpact, setFilterImpact] = useState<string>('ALL');

  const filteredNews = news.filter((item) => {
    if (filterImpact === 'ALL') return true;
    return item.impact === filterImpact;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
            <h2 className="text-xl font-bold font-mono text-slate-100">
              METROPOLITAN FINANCIAL WIRE & INTELLIGENCE
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Real-time roleplay press dispatches, police blotters, and syndicate leaks that sway asset valuations across the exchange.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setFilterImpact('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterImpact === 'ALL'
                ? 'bg-slate-800 text-emerald-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All News
          </button>
          <button
            onClick={() => setFilterImpact('bullish')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterImpact === 'bullish'
                ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Bullish Signals
          </button>
          <button
            onClick={() => setFilterImpact('bearish')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              filterImpact === 'bearish'
                ? 'bg-rose-500/20 text-rose-300 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Bearish Alerts
          </button>
        </div>
      </div>

      {/* News List */}
      <div className="space-y-4">
        {filteredNews.map((item) => {
          const isBullish = item.impact === 'bullish';
          const isBearish = item.impact === 'bearish';

          return (
            <div
              key={item.id}
              className={`bg-slate-900/80 border rounded-2xl p-5 shadow-lg transition-all hover:border-slate-700 ${
                item.isBreaking ? 'border-amber-500/40 bg-slate-900/90' : 'border-slate-800'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  {item.isBreaking && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
                      BREAKING WIRE
                    </span>
                  )}
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    {item.source}
                  </span>
                  <span className="text-[11px] font-mono text-cyan-400">
                    {item.sectorTag}
                  </span>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs">
                  <span
                    className={`inline-flex items-center gap-1 font-bold text-[10px] uppercase px-2 py-0.5 rounded ${
                      isBullish
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : isBearish
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isBullish ? <TrendingUp className="w-3 h-3" /> : isBearish ? <TrendingDown className="w-3 h-3" /> : null}
                    {item.impact}
                  </span>
                  <span className="text-slate-500 flex items-center gap-1 text-[11px]">
                    <Clock className="w-3 h-3" />
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <h3 className="text-base font-bold text-slate-100 mt-1 mb-2">
                {item.headline}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">{item.content}</p>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
                {item.affectedTicker ? (
                  <button
                    onClick={() => onSelectStock(item.affectedTicker!)}
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 hover:text-emerald-300 font-bold transition-colors"
                  >
                    Inspect ${item.affectedTicker} Chart <ArrowRight className="w-3 h-3" />
                  </button>
                ) : (
                  <span className="text-[11px] font-mono text-slate-500">General Market Wire</span>
                )}

                {isAdmin && (
                  <button
                    onClick={() => {
                      if (confirm(`Delete headline: "${item.headline}" from the news stream?`)) {
                        deleteNews(item.id);
                      }
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2 py-1 rounded transition-colors"
                    title="Delete News Broadcast"
                  >
                    <Trash2 className="w-3 h-3" /> Delete Story
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
