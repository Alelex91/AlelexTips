
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

  // Libreria immagini sportiva ottimizzata per lazy loading
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
    <div className={`glass-morphism rounded-[2.5rem] border-white/5 hover:border-[#00FF66]/40 transition-all duration-500 overflow-hidden relative group ${isExpanded ? 'ring-2 ring-[#00FF66]/30' : ''}`}>
      
      <div className="h-48 relative overflow-hidden bg-[#0a0c0e]">
        <img 
          src={prediction.match.imageUrl || getDefaultImage(prediction.match.sport)} 
          className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110 opacity-70" 
          alt={`${prediction.match.homeTeam} vs ${prediction.match.awayTeam}`}
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050607] via-transparent to-transparent"></div>
        
        {/* Win Probability Matrix */}
        <div className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center">
            <svg className="absolute w-full h-full -rotate-90">
                <circle cx="24" cy="24" r="20" fill="rgba(0,0,0,0.6)" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                <circle cx="24" cy="24" r="20" fill="transparent" stroke="#00FF66" strokeWidth="3" strokeDasharray="125.6" strokeDashoffset={125.6 - (125.6 * animatedProb / 100)} className="transition-all duration-[1500ms] ease-out" />
            </svg>
            <span className="text-[10px] font-black text-white font-mono">{Math.round(animatedProb)}%</span>
        </div>

        <div className="absolute bottom-4 left-6 flex flex-col gap-1">
            <span className="bg-[#00FF66]/20 backdrop-blur-md text-[#00FF66] text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-[#00FF66]/30 w-fit">
                {prediction.match.league}
            </span>
            <p className="text-[8px] text-white/40 font-mono uppercase tracking-widest">@{prediction.match.time} • {prediction.match.date}</p>
        </div>
      </div>

      <div className="p-7">
        <div className="flex justify-between items-center mb-8 gap-3 text-center">
            <div className="flex-1"><p className="text-[14px] font-black text-white uppercase italic tracking-tighter truncate leading-tight">{prediction.match.homeTeam}</p></div>
            <div className="px-2 text-[8px] font-black text-[#00FF66] italic opacity-40">vs</div>
            <div className="flex-1"><p className="text-[14px] font-black text-white uppercase italic tracking-tighter truncate leading-tight">{prediction.match.awayTeam}</p></div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white/5 p-4 rounded-2xl text-center border border-white/5 hover:bg-[#00FF66]/5 transition-colors">
                <p className="text-[7px] text-slate-500 font-black uppercase mb-1 tracking-widest">Neural Tip</p>
                <p className="text-lg font-black text-[#00FF66] tracking-tighter">{prediction.bet}</p>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl text-center border border-white/5 hover:bg-white/10 transition-colors">
                <p className="text-[7px] text-slate-500 font-black uppercase mb-1 tracking-widest">Live Odds</p>
                <p className="text-lg font-black text-white tracking-tighter font-mono">@{prediction.odds.toFixed(2)}</p>
            </div>
        </div>

        {prediction.statistics?.recommendedScore && (
            <div className="mb-8 p-5 bg-[#00FF66]/5 border border-[#00FF66]/20 rounded-3xl flex items-center justify-between shadow-inner group-hover:bg-[#00FF66]/10 transition-all">
                <div>
                    <p className="text-[7px] text-[#00FF66] font-black uppercase mb-1 tracking-widest">Oracle Core Score</p>
                    <p className="text-2xl font-black text-white font-mono tracking-[0.2em]">{prediction.statistics.recommendedScore}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#00FF66]/20 flex items-center justify-center border border-[#00FF66]/30">
                  <span className="text-xl">🎯</span>
                </div>
            </div>
        )}

        <div className="space-y-4">
            <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full py-4 bg-[#0a0c0e] rounded-2xl text-[9px] font-black uppercase text-slate-400 border border-white/5 hover:text-[#00FF66] hover:border-[#00FF66]/20 transition-all flex items-center justify-center gap-2 tracking-widest"
            >
                {isExpanded ? 'Compress Analysis' : 'Deep Neural Insight'}
                <svg className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m6 9 6 6 6-6"/></svg>
            </button>

            {isExpanded && (
                <div className="animate-slideUp p-5 bg-emerald-500/5 rounded-3xl border-l-4 border-[#00FF66] space-y-4">
                    <p className="text-[11px] text-slate-300 leading-relaxed italic font-medium">
                        {prediction.statistics?.tacticalInsight || prediction.reasoning}
                    </p>
                    <div className="flex gap-3">
                        <div className="flex-1 bg-black/40 p-3 rounded-2xl text-center border border-white/5">
                            <p className="text-[6px] text-slate-500 uppercase font-black tracking-widest mb-1">xG Matrix</p>
                            <p className="text-[10px] text-white font-bold font-mono">{prediction.statistics?.avgGoals || '2.6'}</p>
                        </div>
                        <div className="flex-1 bg-black/40 p-3 rounded-2xl text-center border border-white/5">
                            <p className="text-[6px] text-slate-500 uppercase font-black tracking-widest mb-1">Neural Form</p>
                            <p className="text-[10px] text-[#00FF66] font-bold font-mono">{prediction.statistics?.recentForm || 'High'}</p>
                        </div>
                    </div>
                </div>
            )}

            <button 
                onClick={() => onPlay?.(prediction)}
                className="w-full py-5 bg-[#00FF66] text-black rounded-[2rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-[0_0_25px_rgba(0,255,102,0.2)] hover:shadow-[0_0_40px_rgba(0,255,102,0.4)] transition-all active:scale-95"
            >
                Add to Matrix
            </button>
        </div>
      </div>
    </div>
  );
};

export default MatchCard;
