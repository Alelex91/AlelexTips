
import React, { useState, useEffect } from 'react';
import { Prediction, SportType } from '../types';

interface Props {
  prediction: Prediction;
  onPlay?: (prediction: Prediction) => void;
}

const MatchCard: React.FC<Props> = ({ prediction, onPlay }) => {
  const [showStats, setShowStats] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [animatedWidth, setAnimatedWidth] = useState(0);

  // Animazione progressiva della barra di confidenza al caricamento o al cambio dati
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedWidth(prediction.confidence);
    }, 300); // Piccolo ritardo per far percepire l'animazione dopo il caricamento della card
    return () => clearTimeout(timer);
  }, [prediction.confidence]);

  const getSportIcon = (sport: SportType) => {
    switch (sport) {
      case 'Football': return '⚽';
      case 'Basketball': return '🏀';
      case 'Tennis': return '🎾';
      case 'Volley': return '🏐';
      default: return '🏆';
    }
  };

  const getDefaultImage = (sport: SportType) => {
    switch (sport) {
      case 'Football': return 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800';
      case 'Basketball': return 'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=800';
      case 'Tennis': return 'https://images.unsplash.com/photo-1595435064212-362637873601?q=80&w=800';
      case 'Volley': return 'https://images.unsplash.com/photo-1592656670497-3c365ef49a39?q=80&w=800';
      default: return 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=800';
    }
  };

  const getMarketBadgeColor = (type: string) => {
    if (type.toLowerCase().includes('combo')) return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    if (type.toLowerCase().includes('corner') || type.toLowerCase().includes('angoli')) return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    return 'bg-[#00FF66]/10 text-[#00FF66] border-[#00FF66]/20';
  };

  const handlePlayClick = () => {
    if (isConfirming || !onPlay) return;
    
    setIsConfirming(true);
    
    // Simula un'onda di processamento neurale prima di aprire il prompt
    setTimeout(() => {
      onPlay(prediction);
      setIsConfirming(false);
    }, 600);
  };

  return (
    <div className="glass-morphism rounded-[2.5rem] border-slate-800 hover:border-[#00FF66]/40 transition-all duration-500 group relative overflow-hidden shadow-2xl shadow-black/60 mb-6">
      {/* Sport Image Header */}
      <div className="h-32 w-full relative overflow-hidden">
        <img 
          src={prediction.match.imageUrl || getDefaultImage(prediction.match.sport)} 
          alt={prediction.match.sport}
          className="w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050607] via-transparent to-transparent"></div>
        <div className="absolute top-4 left-6 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
          <span className="text-sm">{getSportIcon(prediction.match.sport)}</span>
          <span className="text-[10px] font-black text-white uppercase tracking-widest font-mono">{prediction.match.league}</span>
        </div>
      </div>

      <div className="p-7 pt-0 relative z-10 -mt-8">
        <div className="flex justify-between items-end mb-6">
          <div className="max-w-[70%]">
            <p className="text-[10px] text-[#00FF66] font-mono opacity-90 uppercase tracking-widest font-black">
              {new Date(prediction.match.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })} • {prediction.match.time}
            </p>
          </div>
          <span className={`text-[9px] px-3 py-1.5 rounded-xl font-black uppercase border tracking-tighter shadow-sm ${getMarketBadgeColor(prediction.marketType)}`}>
            {prediction.marketType}
          </span>
        </div>
        
        <div className="flex items-center justify-between mb-7 px-1">
          <div className="flex-1 text-center pr-3">
            <p className="font-black text-lg text-white font-poppins leading-tight truncate uppercase tracking-tighter drop-shadow-lg">{prediction.match.homeTeam}</p>
          </div>
          <div className="px-3 py-1.5 bg-[#0a0c0e]/80 backdrop-blur-sm border border-slate-800 rounded-xl text-[9px] font-black text-slate-500 font-mono flex-shrink-0 shadow-inner">VS</div>
          <div className="flex-1 text-center pl-3">
            <p className="font-black text-lg text-white font-poppins leading-tight truncate uppercase tracking-tighter drop-shadow-lg">{prediction.match.awayTeam}</p>
          </div>
        </div>

        <div className="bg-[#00FF66]/5 border border-[#00FF66]/10 rounded-[1.5rem] p-5 mb-5 relative z-10 shadow-inner">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest font-mono mb-1">PREDICT_NODE</p>
              <p className="text-2xl font-black text-[#00FF66] font-poppins tracking-tighter">{prediction.bet}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest font-mono mb-1">MARKET_ODDS</p>
              <p className="text-3xl font-black text-white font-mono tracking-tighter">@{prediction.odds.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="mb-5 flex justify-between items-center">
          <button 
            onClick={() => setShowStats(!showStats)}
            className="text-[10px] text-slate-400 font-black uppercase flex items-center gap-2 hover:text-[#00FF66] transition-all font-mono py-1"
          >
            {showStats ? '[ CHIUDI_ANALISI ]' : '[ VEDI_STATISTICHE ]'}
          </button>
          
          {onPlay && (
            <button 
              onClick={handlePlayClick}
              disabled={isConfirming}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 relative overflow-hidden flex items-center justify-center min-w-[120px]
                ${isConfirming 
                  ? 'bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.6)] scale-110' 
                  : 'bg-[#00FF66] text-[#050607] shadow-[0_0_15px_rgba(0,255,102,0.3)] active:scale-95'
                }`}
            >
              <span className={`transition-opacity duration-200 ${isConfirming ? 'opacity-0' : 'opacity-100'}`}>
                Gioca Ora
              </span>
              {isConfirming && (
                <div className="absolute inset-0 flex items-center justify-center animate-pulse tracking-tighter text-[8px]">
                  SYNCING...
                </div>
              )}
            </button>
          )}
        </div>

        {showStats && (
          <div className="mt-2 mb-6 space-y-4 animate-fadeIn font-mono">
            <div className="bg-[#050607]/80 p-4 rounded-2xl border border-slate-800/50 shadow-inner">
              <div className="flex items-center gap-2 mb-2">
                 <div className="w-1.5 h-1.5 bg-[#00FF66] rounded-full"></div>
                 <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Forma Recente</p>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed italic">
                {prediction.statistics?.recentForm || "Sincronizzazione database..."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {prediction.statistics?.h2h && (
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                   <p className="text-[7px] text-slate-500 uppercase font-black mb-1">Ultimi Scontri (H2H)</p>
                   <p className="text-[10px] text-slate-200 font-bold leading-tight">{prediction.statistics.h2h}</p>
                </div>
              )}
              {prediction.statistics?.avgGoals && (
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                   <p className="text-[7px] text-slate-500 uppercase font-black mb-1">Media Segnati</p>
                   <p className="text-[10px] text-[#00FF66] font-black">{prediction.statistics.avgGoals}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="text-xs text-slate-400 leading-relaxed font-light mb-5 italic border-l-2 border-[#00FF66]/20 pl-4 py-1">
          <span className="text-[#00FF66] font-black mr-2 font-mono text-[10px] uppercase">AI_LOG:</span>
          {prediction.reasoning}
        </div>
        
        {/* PROGRESS BAR ANIMATA */}
        <div className="mt-4 flex items-center gap-4 px-1">
          <div className="h-2 flex-1 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-[1px] relative">
            <div 
              className="h-full bg-gradient-to-r from-emerald-600 to-[#00FF66] rounded-full transition-all duration-[1500ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] relative overflow-hidden neural-bar-pulse" 
              style={{ width: `${animatedWidth}%` }}
            >
              {/* Overlay Scanner Animato */}
              <div className="absolute inset-0 neural-bar-shimmer h-full w-1/2"></div>
            </div>
          </div>
          <div className="text-right min-w-[40px]">
            <span className="text-[10px] font-black text-[#00FF66] font-mono tracking-tighter">
              {Math.round(animatedWidth)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchCard;
