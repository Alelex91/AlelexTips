
import React, { useState, useEffect } from 'react';
import { Prediction } from '../types';

interface Props {
  prediction: Prediction;
  onPlay?: (prediction: Prediction) => void;
}

const MatchCard: React.FC<Props> = ({ prediction, onPlay }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const getSportImage = (sport: string) => {
    const s = sport.toLowerCase();
    const params = "?auto=format&fit=crop&w=600&q=75"; // Low size for mobile loading
    if (s.includes('foot')) return `https://images.unsplash.com/photo-1574629810360-7efbbe195018${params}`;
    if (s.includes('bask')) return `https://images.unsplash.com/photo-1546519638-68e109498ffc${params}`;
    if (s.includes('tenn')) return `https://images.unsplash.com/photo-1595435064212-c4817fb39968${params}`;
    return `https://images.unsplash.com/photo-1504450758481-7338eba7524a${params}`;
  };

  return (
    <div className={`glass-morphism rounded-[2.5rem] border-white/5 transition-all duration-500 overflow-hidden relative group flex flex-col ${isExpanded ? 'ring-2 ring-[#00FF66]/20' : ''}`}>
      
      <div className="h-44 relative overflow-hidden bg-black/40">
        {/* Scanner Effect */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          <div className="w-full h-[1px] bg-[#00FF66] shadow-[0_0_10px_#00FF66] absolute top-0 animate-[scan_4s_linear_infinite] opacity-30"></div>
        </div>

        <img 
          src={getSportImage(prediction.match.sport)} 
          className={`w-full h-full object-cover transition-all duration-[2s] ${imgLoaded ? 'opacity-40 grayscale-[40%] scale-100' : 'opacity-0 scale-110'}`} 
          alt="Event Background"
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c0e] to-transparent"></div>
        
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/10">
          <span className="text-[9px] font-black text-[#00FF66] font-mono">{prediction.confidence}% CONFIDENCE</span>
        </div>

        <div className="absolute bottom-4 left-6">
            <span className="bg-[#00FF66]/20 text-[#00FF66] text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-[#00FF66]/30">
                {prediction.match.league}
            </span>
        </div>
      </div>

      <div className="p-6 flex flex-col flex-1">
        <div className="flex justify-between items-center mb-6 gap-2">
            <p className="flex-1 text-[13px] font-black text-white uppercase italic truncate">{prediction.match.homeTeam}</p>
            <span className="text-[10px] font-black text-[#00FF66]/30">VS</span>
            <p className="flex-1 text-[13px] font-black text-white uppercase italic text-right truncate">{prediction.match.awayTeam}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white/5 p-3 rounded-2xl border border-white/5 text-center">
                <p className="text-[7px] text-slate-500 font-bold uppercase mb-1">Pick</p>
                <p className="text-sm font-black text-[#00FF66]">{prediction.bet}</p>
            </div>
            <div className="bg-white/5 p-3 rounded-2xl border border-white/5 text-center">
                <p className="text-[7px] text-slate-500 font-bold uppercase mb-1">Odds</p>
                <p className="text-sm font-black text-white font-mono">@{prediction.odds.toFixed(2)}</p>
            </div>
        </div>

        <div className="mb-6 p-4 bg-[#00FF66]/5 border border-[#00FF66]/10 rounded-2xl flex items-center justify-between">
            <div>
                <p className="text-[7px] text-[#00FF66] font-black uppercase mb-1">Recommended Score</p>
                <p className="text-2xl font-black text-white tracking-[0.2em] font-mono">{prediction.statistics?.recommendedScore}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#00FF66]/10 flex items-center justify-center border border-[#00FF66]/20">
              <span className="text-xl">🎯</span>
            </div>
        </div>

        <div className="mt-auto space-y-3">
            <button 
              onClick={() => setIsExpanded(!isExpanded)} 
              className="w-full py-3 rounded-xl text-[8px] font-black uppercase transition-all bg-white/5 text-slate-400 border border-white/5 hover:text-[#00FF66] flex items-center justify-center gap-2"
            >
                {isExpanded ? 'Hide Analysis' : 'Show Neural Insight'}
                <svg className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m6 9 6 6 6-6"/></svg>
            </button>

            {isExpanded && (
                <div className="animate-slideUp p-4 bg-black/40 rounded-2xl border border-white/5">
                    <p className="text-[10px] text-slate-300 leading-relaxed italic">
                        {prediction.statistics?.scoreReasoning}
                    </p>
                </div>
            )}

            <button 
              onClick={() => onPlay?.(prediction)} 
              className="w-full py-4 bg-[#00FF66] text-black rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all"
            >
                Initial Bet
            </button>
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 0.3; }
          90% { opacity: 0.3; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default MatchCard;
