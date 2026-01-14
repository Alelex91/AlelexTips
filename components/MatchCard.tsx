
import React, { useState, useEffect } from 'react';
import { Prediction } from '../types';

interface Props {
  prediction: Prediction;
  onPlay?: (prediction: Prediction) => void;
}

const MatchCard: React.FC<Props> = ({ prediction, onPlay }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [animatedProb, setAnimatedProb] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProb(prediction.statistics?.winProbability || prediction.confidence);
    }, 600);
    return () => clearTimeout(timer);
  }, [prediction]);

  const getDefaultImage = (sport: string) => {
    const s = sport.toLowerCase();
    const baseUrl = "https://images.unsplash.com/";
    const params = "?auto=format&fit=crop&w=800&q=80"; // Ottimizzato per performance
    
    if (s.includes('foot') || s.includes('calc') || s.includes('socc')) 
      return `${baseUrl}photo-1510279770292-4b34de9f5c23${params}`;
    if (s.includes('bask') || s.includes('nba')) 
      return `${baseUrl}photo-1546519638-68e109498ffc${params}`;
    if (s.includes('tenn') || s.includes('atp')) 
      return `${baseUrl}photo-1595435064212-c4817fb39968${params}`;
    if (s.includes('f1') || s.includes('moto'))
      return `${baseUrl}photo-1533130061792-64b345e4a833${params}`;
    return `${baseUrl}photo-1518091043644-c1d445bcc97a${params}`;
  };

  return (
    <div className={`glass-morphism rounded-[3rem] border-white/5 hover:border-[#00FF66]/40 transition-all duration-700 overflow-hidden relative group h-full flex flex-col ${isExpanded ? 'ring-2 ring-[#00FF66]/20 bg-[#0a0c0e]' : ''}`}>
      
      {/* Immagine Header con Effetto Scanner */}
      <div className="h-48 sm:h-52 relative overflow-hidden bg-[#050607] flex-shrink-0">
        {/* Neon Scanner Overlay */}
        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
          <div className="w-full h-[2px] bg-[#00FF66] shadow-[0_0_15px_#00FF66] absolute top-0 left-0 animate-[scanner_3s_infinite] opacity-40"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00FF66]/5 to-transparent animate-[scanner_3s_infinite] opacity-20"></div>
        </div>

        {!imgLoaded && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00FF66]/5 to-transparent animate-[shimmer_2s_infinite] bg-[length:200%_100%]"></div>
        )}
        
        <img 
          src={prediction.match.imageUrl || getDefaultImage(prediction.match.sport)} 
          className={`w-full h-full object-cover transition-all duration-[1.5s] group-hover:scale-110 group-hover:rotate-1 ${imgLoaded ? 'opacity-60 grayscale-[20%]' : 'opacity-0'}`} 
          alt="Sports Match"
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c0e] via-transparent to-black/40"></div>
        
        {/* Confidence Ring */}
        <div className="absolute top-5 right-5 w-12 h-12 flex items-center justify-center backdrop-blur-md bg-black/40 rounded-full border border-white/10">
            <svg className="absolute w-full h-full -rotate-90 p-1">
                <circle cx="22" cy="22" r="18" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="2.5" />
                <circle cx="22" cy="22" r="18" fill="transparent" stroke="#00FF66" strokeWidth="2.5" strokeDasharray="113" strokeDashoffset={113 - (113 * animatedProb / 100)} className="transition-all duration-[2000ms] ease-out" />
            </svg>
            <span className="text-[10px] font-black text-white font-mono">{Math.round(animatedProb)}%</span>
        </div>
        
        <div className="absolute bottom-5 left-7 flex flex-col gap-1.5 pr-4">
            <span className="bg-[#00FF66]/20 backdrop-blur-xl text-[#00FF66] text-[7px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] border border-[#00FF66]/30 w-fit">
                {prediction.match.league}
            </span>
            <p className="text-[8px] text-white/60 font-mono uppercase tracking-[0.3em] font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
              LIVE SYNC • {prediction.match.time}
            </p>
        </div>
      </div>

      <div className="p-7 sm:p-8 flex flex-col flex-1 relative">
        {/* Teams Section */}
        <div className="flex justify-between items-center mb-8 gap-4 text-center">
            <div className="flex-1 group/team">
              <p className="text-[14px] sm:text-[16px] font-black text-white uppercase italic tracking-tighter leading-tight group-hover/team:text-[#00FF66] transition-colors">{prediction.match.homeTeam}</p>
              <div className="h-0.5 w-0 group-hover/team:w-full bg-[#00FF66]/40 transition-all duration-500 mx-auto mt-1"></div>
            </div>
            <div className="text-[10px] font-black text-[#00FF66] italic opacity-30 select-none">VS</div>
            <div className="flex-1 group/team">
              <p className="text-[14px] sm:text-[16px] font-black text-white uppercase italic tracking-tighter leading-tight group-hover/team:text-[#00FF66] transition-colors">{prediction.match.awayTeam}</p>
              <div className="h-0.5 w-0 group-hover/team:w-full bg-[#00FF66]/40 transition-all duration-500 mx-auto mt-1"></div>
            </div>
        </div>

        {/* Main Bets */}
        <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white/5 p-4 rounded-3xl text-center border border-white/5 hover:bg-[#00FF66]/10 transition-all duration-300 cursor-default group/bet">
                <p className="text-[7px] text-slate-500 font-black uppercase mb-1.5 tracking-widest group-hover/bet:text-[#00FF66]/60">Algorithmic Tip</p>
                <p className="text-lg font-black text-[#00FF66] tracking-tighter">{prediction.bet}</p>
            </div>
            <div className="bg-white/5 p-4 rounded-3xl text-center border border-white/5 hover:bg-white/10 transition-all duration-300 cursor-default group/bet">
                <p className="text-[7px] text-slate-500 font-black uppercase mb-1.5 tracking-widest group-hover/bet:text-white/60">Global Odds</p>
                <p className="text-lg font-black text-white tracking-tighter font-mono">@{prediction.odds.toFixed(2)}</p>
            </div>
        </div>

        {/* Recommended Score - Focus Area */}
        <div className="mb-8 p-6 bg-[#00FF66]/5 border border-[#00FF66]/20 rounded-[2rem] flex flex-col gap-3 group-hover:bg-[#00FF66]/10 transition-all relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                  <p className="text-[8px] text-[#00FF66] font-black uppercase mb-1 tracking-[0.3em]">Oracle Score Target</p>
                  <p className="text-3xl font-black text-white font-mono tracking-[0.3em]">{prediction.statistics?.recommendedScore || 'N/A'}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[#00FF66]/20 flex items-center justify-center border border-[#00FF66]/30 animate-pulse">
                <span className="text-2xl">⚡</span>
              </div>
            </div>
        </div>

        {/* Matrix Logic Expansion */}
        <div className="mt-auto space-y-4">
            <button 
              onClick={() => setIsExpanded(!isExpanded)} 
              className={`w-full py-4 rounded-2xl text-[9px] font-black uppercase transition-all duration-500 flex items-center justify-center gap-3 tracking-[0.3em] border ${isExpanded ? 'bg-[#00FF66] text-black border-transparent' : 'bg-[#0a0c0e] text-slate-400 border-white/5 hover:text-[#00FF66] hover:border-[#00FF66]/20'}`}
            >
                {isExpanded ? 'DISCONNECT NODE' : 'OPEN TACTICAL FLOW'}
                <svg className={`transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m6 9 6 6 6-6"/></svg>
            </button>

            {isExpanded && (
                <div className="animate-slideUp p-6 bg-white/5 rounded-[2rem] border border-white/10 space-y-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-[#00FF66] rounded-full"></span>
                          <p className="text-[9px] text-[#00FF66] font-black uppercase tracking-widest">Neural Score Rationale</p>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed italic font-medium bg-black/30 p-4 rounded-2xl border border-white/5">
                            {prediction.statistics?.scoreReasoning || "Sincronizzazione dei flussi tattici in corso..."}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                            <p className="text-[7px] text-slate-500 uppercase font-black tracking-widest mb-1">Sporting Insight</p>
                            <p className="text-[10px] text-white font-bold leading-tight">{prediction.statistics?.tacticalInsight || 'Analisi fluida'}</p>
                        </div>
                        <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                            <p className="text-[7px] text-slate-500 uppercase font-black tracking-widest mb-1">xG Flow / 90'</p>
                            <p className="text-[10px] text-[#00FF66] font-bold font-mono">{prediction.statistics?.avgGoals || '2.50'}</p>
                        </div>
                    </div>
                </div>
            )}

            <button 
              onClick={() => onPlay?.(prediction)} 
              className="w-full py-5 bg-[#00FF66] text-black rounded-[2rem] font-black uppercase text-[11px] tracking-[0.4em] shadow-[0_10px_30px_rgba(0,255,102,0.2)] hover:shadow-[0_15px_40px_rgba(0,255,102,0.4)] transition-all active:scale-95 transform-gpu"
            >
                INITIALIZE BET
            </button>
        </div>
      </div>

      <style>{`
        @keyframes scanner {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
};

export default MatchCard;
