
import React, { useState } from 'react';
import { Prediction } from '../types';

interface Props {
  prediction: Prediction;
}

const MatchCard: React.FC<Props> = ({ prediction }) => {
  const [showStats, setShowStats] = useState(false);

  const getMarketBadgeColor = (type: string) => {
    switch (type) {
      case 'Combo': return 'bg-[#00FF66]/10 text-[#00FF66] border-[#00FF66]/20';
      case 'Corners': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Cards': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      default: return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
  };

  return (
    <div className="glass-morphism rounded-3xl p-6 border-slate-800 hover:border-[#00FF66]/40 transition-all duration-500 group relative overflow-hidden shadow-lg shadow-black/20">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#00FF66]/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none"></div>
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="max-w-[70%]">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono truncate block">{prediction.match.league}</span>
          <p className="text-xs text-[#00FF66] font-mono mt-0.5">{prediction.match.time} | LIVE SYNC</p>
        </div>
        <span className={`text-[9px] px-3 py-1 rounded-lg font-black uppercase border tracking-tighter ${getMarketBadgeColor(prediction.marketType)}`}>
          {prediction.marketType}
        </span>
      </div>
      
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex-1 text-center pr-2 overflow-hidden">
          <p className="font-black text-lg text-white font-poppins leading-tight truncate uppercase tracking-tighter">{prediction.match.homeTeam}</p>
        </div>
        <div className="px-3 py-1 bg-[#0a0c0e] border border-slate-800 rounded-lg text-[9px] font-black text-slate-500 font-mono flex-shrink-0">VS</div>
        <div className="flex-1 text-center pl-2 overflow-hidden">
          <p className="font-black text-lg text-white font-poppins leading-tight truncate uppercase tracking-tighter">{prediction.match.awayTeam}</p>
        </div>
      </div>

      <div className="bg-[#00FF66]/5 border border-[#00FF66]/20 rounded-2xl p-4 mb-4 relative z-10">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest font-mono mb-1">AI_PRONOSTICO</p>
            <p className="text-xl font-black text-[#00FF66] font-poppins tracking-tighter">{prediction.bet}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest font-mono mb-1">QUOTA</p>
            <p className="text-2xl font-black text-white font-mono">@{prediction.odds.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="mb-4 relative z-10">
        <button 
          onClick={() => setShowStats(!showStats)}
          className="text-[10px] text-[#00FF66] font-black uppercase flex items-center gap-1.5 hover:opacity-80 transition-all font-mono"
        >
          {showStats ? '[ CHIUDI STATS ]' : '[ APRI STATS ]'}
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-500 ${showStats ? 'rotate-180' : ''}`}>
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </button>

        {showStats && (
          <div className="mt-4 space-y-2 animate-fadeIn font-mono">
            <div className="bg-[#050607]/60 p-3 rounded-xl border border-slate-800">
              <p className="text-[8px] text-slate-500 uppercase font-black mb-1">Dati Gol</p>
              <p className="text-xs text-slate-300">{prediction.statistics?.avgGoals || "N/A"}</p>
            </div>
            <div className="bg-[#050607]/60 p-3 rounded-xl border border-slate-800">
              <p className="text-[8px] text-slate-500 uppercase font-black mb-1">Vettore Forma</p>
              <p className="text-xs text-slate-300">{prediction.statistics?.recentForm || "N/A"}</p>
            </div>
          </div>
        )}
      </div>

      <div className="text-xs text-slate-400 leading-relaxed font-light mb-4 italic relative z-10">
        <span className="text-[#00FF66] font-black mr-2 font-mono">INSIGHT:</span>
        {prediction.reasoning}
      </div>
      
      <div className="mt-4 flex items-center gap-3 relative z-10">
        <div className="h-1.5 flex-1 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div 
            className="h-full bg-gradient-to-r from-emerald-600 to-[#00FF66] shadow-[0_0_10px_#00FF66]" 
            style={{ width: `${prediction.confidence}%` }}
          />
        </div>
        <span className="text-[9px] font-black text-slate-500 font-mono">{prediction.confidence}% ACCURACY</span>
      </div>
    </div>
  );
};

export default MatchCard;
