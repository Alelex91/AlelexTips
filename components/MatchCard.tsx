
import React, { useState, useEffect } from 'react';
import { Prediction } from '../types';

interface Props {
  prediction: Prediction;
  onPlay?: (prediction: Prediction) => void;
}

const MatchCard: React.FC<Props> = ({ prediction, onPlay }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [animatedProb, setAnimatedProb] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProb(prediction.statistics?.winProbability || prediction.confidence);
    }, 600);
    return () => clearTimeout(timer);
  }, [prediction]);

  const getDefaultImage = (sport: string) => {
    const s = sport.toLowerCase();
    if (s.includes('foot') || s.includes('calc') || s.includes('socc') || s.includes('serie')) 
      return 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800';
    if (s.includes('bask') || s.includes('nba') || s.includes('pallaca')) 
      return 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=800';
    if (s.includes('tenn') || s.includes('atp') || s.includes('wta')) 
      return 'https://images.unsplash.com/photo-1560012057-4372e14c5095?q=80&w=800';
    if (s.includes('voll') || s.includes('pallav'))
      return 'https://images.unsplash.com/photo-1592656094267-764a45160876?q=80&w=800';
    return 'https://images.unsplash.com/photo-1546768292-fb12f6c92568?q=80&w=800';
  };

  return (
    <div className={`glass-morphism rounded-[2.5rem] border-white/5 hover:border-[#00FF66]/40 transition-all duration-500 overflow-hidden relative group h-full flex flex-col ${isExpanded ? 'ring-2 ring-[#00FF66]/30' : ''}`}>
      
      <div className="h-44 sm:h-48 relative overflow-hidden bg-[#0a0c0e] flex-shrink-0">
        <img 
          src={prediction.match.imageUrl || getDefaultImage(prediction.match.sport)} 
          className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110 opacity-70" 
          alt={`${prediction.match.homeTeam} vs ${prediction.match.awayTeam}`}
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050607] via-transparent to-transparent"></div>
        
        <div className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center">
            <svg className="absolute w-full h-full -rotate-90">
                <circle cx="22" cy="22" r="19" fill="rgba(0,0,0,0.6)" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                <circle cx="22" cy="22" r="19" fill="transparent" stroke="#00FF66" strokeWidth="3" strokeDasharray="119.3" strokeDashoffset={119.3 - (119.3 * animatedProb / 100)} className="transition-all duration-[1500ms] ease-out" />
            </svg>
            <span className="text-[10px] font-black text-white font-mono">{Math.round(animatedProb)}%</span>
        </div>

        <div className="absolute bottom-4 left-6 flex flex-col gap-1 pr-4">
            <span className="bg-[#00FF66]/20 backdrop-blur-md text-[#00FF66] text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-[#00FF66]/30 w-fit truncate max-w-full">
                {prediction.match.league}
            </span>
            <p className="text-[8px] text-white/40 font-mono uppercase tracking-widest">@{prediction.match.time} • {prediction.match.date}</p>
        </div>
      </div>

      <div className="p-6 sm:p-7 flex flex-col flex-1">
        <div className="flex justify-between items-center mb-6 gap-3 text-center">
            <div className="flex-1 min-w-0"><p className="text-[13px] sm:text-[14px] font-black text-white uppercase italic tracking-tighter truncate leading-tight">{prediction.match.homeTeam}</p></div>
            <div className="px-2 text-[8px] font-black text-[#00FF66] italic opacity-40">vs</div>
            <div className="flex-1 min-w-0"><p className="text-[13px] sm:text-[14px] font-black text-white uppercase italic tracking-tighter truncate leading-tight">{prediction.match.awayTeam}</p></div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
            <div className="bg-white/5 p-3 sm:p-4 rounded-2xl text-center border border-white/5 hover:bg-[#00FF66]/5 transition-colors group/stat">
                <p className="text-[7px] text-slate-500 font-black uppercase mb-1 tracking-widest group-hover/stat:text-[#00FF66]/50">Neural Tip</p>
                <p className="text-base sm:text-lg font-black text-[#00FF66] tracking-tighter">{prediction.bet}</p>
            </div>
            <div className="bg-white/5 p-3 sm:p-4 rounded-2xl text-center border border-white/5 hover:bg-white/10 transition-colors group/stat">
                <p className="text-[7px] text-slate-500 font-black uppercase mb-1 tracking-widest group-hover/stat:text-white/50">Live Odds</p>
                <p className="text-base sm:text-lg font-black text-white tracking-tighter font-mono">@{prediction.odds.toFixed(2)}</p>
            </div>
        </div>

        {prediction.statistics?.recommendedScore && (
            <div className="mb-6 p-4 sm:p-5 bg-[#00FF66]/5 border border-[#00FF66]/20 rounded-3xl flex items-center justify-between shadow-inner group-hover:bg-[#00FF66]/10 transition-all">
                <div>
                    <p className="text-[7px] text-[#00FF66] font-black uppercase mb-1 tracking-widest">Oracle Target</p>
                    <p className="text-xl sm:text-2xl font-black text-white font-mono tracking-[0.2em]">{prediction.statistics.recommendedScore}</p>
                </div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#00FF66]/20 flex items-center justify-center border border-[#00FF66]/30">
                  <span className="text-lg sm:text-xl">🎯</span>
                </div>
            </div>
        )}

        <div className="mt-auto space-y-4">
            <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full py-4 bg-[#0a0c0e] rounded-2xl text-[9px] font-black uppercase text-slate-400 border border-white/5 hover:text-[#00FF66] hover:border-[#00FF66]/20 transition-all flex items-center justify-center gap-2 tracking-[0.2em]"
            >
                {isExpanded ? 'Close Node' : 'Matrix Logic'}
                <svg className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m6 9 6 6 6-6"/></svg>
            </button>

            {isExpanded && (
                <div className="animate-slideUp p-5 bg-emerald-500/5 rounded-3xl border-l-4 border-[#00FF66] space-y-4 mb-4">
                    <p className="text-[11px] text-slate-300 leading-relaxed italic font-medium">
                        {prediction.statistics?.tacticalInsight || prediction.reasoning}
                    </p>
                    <div className="flex gap-3">
                        <div className="flex-1 bg-black/40 p-3 rounded-2xl text-center border border-white/5">
                            <p className="text-[6px] text-slate-500 uppercase font-black tracking-widest mb-1">xG Flow</p>
                            <p className="text-[10px] text-white font-bold font-mono">{prediction.statistics?.avgGoals || '2.4'}</p>
                        </div>
                        <div className="flex-1 bg-black/40 p-3 rounded-2xl text-center border border-white/5">
                            <p className="text-[6px] text-slate-500 uppercase font-black tracking-widest mb-1">Stability</p>
                            <p className="text-[10px] text-[#00FF66] font-bold font-mono">{prediction.statistics?.recentForm || 'Optimum'}</p>
                        </div>
                    </div>
                </div>
            )}

            <button 
                onClick={() => onPlay?.(prediction)}
                className="w-full py-5 bg-[#00FF66] text-black rounded-[2rem] font-black uppercase text-[11px] tracking-[0.3em] shadow-[0_0_20px_rgba(0,255,102,0.2)] hover:shadow-[0_0_35px_rgba(0,255,102,0.4)] transition-all active:scale-95"
            >
                Add To Node
            </button>
        </div>
      </div>
    </div>
  );
};

export default MatchCard;
