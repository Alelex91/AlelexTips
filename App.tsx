
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BettingService } from './services/geminiService';
import { Schedina, PlayedSchedina, BetStatus, SportType, ComboTip, Prediction } from './types';
import MatchCard from './components/MatchCard';
import ChatBot from './components/ChatBot';
import HistorySection from './components/HistorySection';
import AccessPage from './components/AccessPage';
import IOSInstallGuide from './components/IOSInstallGuide';

type View = 'home' | 'combos' | 'history';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('home');
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [schedina, setSchedina] = useState<Schedina | null>(null);
  const [history, setHistory] = useState<PlayedSchedina[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedSport, setSelectedSport] = useState<SportType>('All');
  const [selectedDay, setSelectedDay] = useState<'Today' | 'Tomorrow' | 'All'>('Today');

  const bettingService = useMemo(() => new BettingService(), []);

  const dates = useMemo(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return {
      todayISO: today.toISOString().split('T')[0],
      tomorrowISO: tomorrow.toISOString().split('T')[0]
    };
  }, []);

  useEffect(() => {
    let interval: number;
    if (loading) {
      setProgress(0);
      interval = window.setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) return prev; 
          const increment = prev < 50 ? 5 : (95 - prev) * 0.1;
          return prev + increment;
        });
      }, 100);
    } else {
      setProgress(100);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await bettingService.generateDailySchedina();
      setSchedina(data);
      setProgress(100);
      setTimeout(() => setLoading(false), 200);
    } catch (err: any) {
      setError(err.message || "Errore di sincronizzazione.");
      setLoading(false);
    }
  }, [bettingService]);

  useEffect(() => {
    const authorized = localStorage.getItem('neotip_authorized') === 'true';
    setIsAuthorized(authorized);
    const saved = localStorage.getItem('neotip_history');
    if (saved) {
      try { setHistory(JSON.parse(saved)); } catch (e) { setHistory([]); }
    }
  }, []);

  useEffect(() => { if (isAuthorized) loadData(); }, [isAuthorized, loadData]);

  const filteredPredictions = useMemo(() => {
    if (!schedina || !schedina.predictions) return [];
    const targetISO = selectedDay === 'Today' ? dates.todayISO : dates.tomorrowISO;
    
    return schedina.predictions.filter(p => {
      const sportMatch = selectedSport === 'All' || 
        p.match.sport.toLowerCase().includes(selectedSport.toLowerCase());
      
      if (selectedDay === 'All') return sportMatch;
      const matchDateStr = p.match.date.trim().split('T')[0];
      return sportMatch && (matchDateStr === targetISO);
    });
  }, [schedina, selectedSport, selectedDay, dates]);

  const handlePlayBet = (prediction: Prediction) => {
    const stakeInput = prompt(`Stake per ${prediction.match.homeTeam} - ${prediction.match.awayTeam}:`, "10");
    const stake = parseFloat(stakeInput || "0");
    if (isNaN(stake) || stake <= 0) return;
    const newBet: PlayedSchedina = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      predictions: [prediction],
      totalOdds: prediction.odds,
      stake,
      status: 'Pending',
      dailyCombos: []
    };
    setHistory(prev => [newBet, ...prev]);
    localStorage.setItem('neotip_history', JSON.stringify([newBet, ...history]));
  };

  if (!isAuthorized) return <AccessPage onAccessGranted={() => setIsAuthorized(true)} />;

  return (
    <div className="flex flex-col min-h-screen animate-fadeIn w-full">
      <IOSInstallGuide />
      
      <header className="sticky top-0 z-50 glass-morphism border-b border-[#00FF66]/10 safe-top">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#00FF66]/10 border border-[#00FF66]/30 rounded-xl flex items-center justify-center">
              <span className="text-[#00FF66] font-black text-lg sm:text-xl italic">N</span>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-white italic tracking-tighter leading-none">NEOTIP</h1>
              <p className="text-[7px] text-[#00FF66] font-mono uppercase tracking-[0.2em] opacity-40 mt-1">Matrix Interface</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Network Status</span>
              <span className="text-[10px] text-[#00FF66] font-mono font-bold">STABLE_CONNECTED</span>
            </div>
            <button onClick={loadData} disabled={loading} className="p-2.5 sm:p-3 bg-[#00FF66]/10 border border-[#00FF66]/20 rounded-xl text-[#00FF66] hover:bg-[#00FF66]/20 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={loading ? 'animate-spin' : ''}><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {activeView === 'home' && (
          <div className="space-y-6 sm:space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
              <div className="lg:col-span-4 space-y-3">
                <label className="text-[9px] text-slate-500 font-black uppercase tracking-[0.3em] ml-1">Temporal Filter</label>
                <div className="flex bg-[#0a0c0e] p-1 rounded-2xl border border-white/5 w-full">
                  {(['Today', 'Tomorrow', 'All'] as const).map(day => (
                    <button key={day} onClick={() => setSelectedDay(day)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${selectedDay === day ? 'bg-[#00FF66] text-black shadow-[0_0_15px_rgba(0,255,102,0.2)]' : 'text-slate-500 hover:text-white'}`}>{day === 'Today' ? 'OGGI' : day === 'Tomorrow' ? 'DOMANI' : 'TUTTI'}</button>
                  ))}
                </div>
              </div>
              
              <div className="lg:col-span-8 space-y-3 overflow-hidden">
                <label className="text-[9px] text-slate-500 font-black uppercase tracking-[0.3em] ml-1">Modal Modality</label>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {[
                    { id: 'All', label: 'Tutti', icon: '🏆' },
                    { id: 'Football', label: 'Calcio', icon: '⚽' },
                    { id: 'Basketball', label: 'Basket', icon: '🏀' },
                    { id: 'Tennis', label: 'Tennis', icon: '🎾' },
                    { id: 'Volley', label: 'Volley', icon: '🏐' }
                  ].map((sport) => (
                    <button key={sport.id} onClick={() => setSelectedSport(sport.id as SportType)} className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl border whitespace-nowrap transition-all ${selectedSport === sport.id ? 'bg-[#00FF66]/20 border-[#00FF66] text-[#00FF66] shadow-[0_0_15px_rgba(0,255,102,0.1)]' : 'bg-[#0a0c0e] border-white/10 text-slate-400 hover:border-white/20'}`}>
                      <span className="text-sm">{sport.icon}</span>
                      <span className="text-[10px] font-black uppercase tracking-[0.15em]">{sport.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 sm:py-32 text-center bg-[#0a0c0e]/40 rounded-[3rem] border border-white/5 animate-pulse w-full">
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 mb-10 flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle cx="50%" cy="50%" r="46%" fill="transparent" stroke="rgba(0,255,102,0.05)" strokeWidth="4" />
                        <circle cx="50%" cy="50%" r="46%" fill="transparent" stroke="#00FF66" strokeWidth="4" strokeDasharray="100% 100%" strokeDashoffset={`${100 - progress}%`} className="transition-all duration-300" style={{ filter: 'drop-shadow(0 0 10px #00FF66)' }} />
                    </svg>
                    <span className="text-3xl sm:text-4xl font-black text-white font-mono">{Math.round(progress)}%</span>
                </div>
                <p className="text-[#00FF66] font-mono text-[9px] font-black uppercase tracking-[0.4em]">Optimizing Prediction Matrix...</p>
              </div>
            ) : error ? (
              <div className="py-20 text-center glass-morphism rounded-[3rem] border-red-500/20 p-10 w-full max-w-2xl mx-auto">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                  <span className="text-2xl">⚠️</span>
                </div>
                <h3 className="text-white font-black uppercase tracking-widest text-lg mb-4">Sincronizzazione Interrotta</h3>
                <p className="text-red-400 font-mono text-[11px] font-black uppercase mb-8 leading-relaxed tracking-wider px-4">
                  {error.includes("API_KEY") ? "ERRORE: La chiave API Oracle non è configurata correttamente. Contatta l'amministratore o controlla i segreti di Cloudflare." : error}
                </p>
                <button onClick={loadData} className="px-10 py-4 bg-red-500/10 text-red-500 border border-red-500/30 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-500 hover:text-white transition-all">Retry Synchronization</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-6 sm:gap-8 w-full">
                {filteredPredictions.map((p, i) => <MatchCard key={i} prediction={p} onPlay={handlePlayBet} />)}
                {filteredPredictions.length === 0 && (
                  <div className="col-span-full py-40 text-center flex flex-col items-center gap-6 glass-morphism rounded-[3rem] opacity-50 w-full">
                    <span className="text-5xl">🔭</span>
                    <div>
                      <h3 className="text-white font-black uppercase tracking-widest text-sm mb-2">No Active Nodes</h3>
                      <p className="text-slate-500 font-mono text-[9px] uppercase tracking-widest italic">Try adjusting your filters or sync again.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeView === 'combos' && (
           <div className="space-y-8 animate-fadeIn w-full">
            <div className="flex items-center gap-4">
              <div className="h-8 w-2 bg-[#00FF66] rounded-full"></div>
              <h2 className="text-3xl sm:text-4xl font-black text-white italic tracking-tighter">Neural Combos</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {schedina?.dailyCombos.map((c, i) => (
                <div key={i} className="glass-morphism p-8 sm:p-10 rounded-[3rem] border-[#00FF66]/20 relative overflow-hidden group hover:border-[#00FF66]/40 transition-all duration-500">
                  <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                    <span className="text-9xl italic font-black text-[#00FF66]">{c.type[0]}</span>
                  </div>
                  <div className="flex justify-between items-center mb-8 relative z-10">
                    <h3 className="text-2xl sm:text-3xl font-black text-white italic tracking-tighter uppercase">{c.title}</h3>
                    <span className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border ${c.type === 'Safe' ? 'bg-[#00FF66]/10 text-[#00FF66] border-[#00FF66]/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>{c.type}</span>
                  </div>
                  <div className="space-y-5 mb-10 relative z-10">
                    {c.predictions.map((p, pi) => (
                      <div key={pi} className="flex justify-between items-center text-[11px] sm:text-xs text-slate-400 border-b border-white/5 pb-3">
                        <span className="font-bold uppercase italic tracking-tight">{p.event || `${p.match.homeTeam} vs ${p.match.awayTeam}`}</span>
                        <span className="text-[#00FF66] font-black font-mono">@{p.odds.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-end relative z-10">
                    <div>
                      <p className="text-[9px] text-slate-500 font-black uppercase mb-1 tracking-widest">Composite Odds</p>
                      <p className="text-4xl sm:text-5xl font-black text-[#00FF66] tracking-tighter font-mono">@{c.totalOdds.toFixed(2)}</p>
                    </div>
                    <button onClick={() => alert('Combo Matrix initialized.')} className="px-8 py-4 bg-[#00FF66] text-black rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all">Initialize Combo</button>
                  </div>
                </div>
              ))}
            </div>
           </div>
        )}

        {activeView === 'history' && <div className="w-full mx-auto"><HistorySection history={history} onDelete={(id)=>{
          const newH = history.filter(x=>x.id!==id);
          setHistory(newH);
          localStorage.setItem('neotip_history', JSON.stringify(newH));
        }} onUpdateStatus={(id,s)=>{
          const newH = history.map(x=>x.id===id?{...x,status:s}:x);
          setHistory(newH);
          localStorage.setItem('neotip_history', JSON.stringify(newH));
        }} /></div>}
      </main>

      <div className="h-24 sm:hidden"></div> {/* Spacer for fixed nav */}

      <nav className="fixed bottom-0 left-0 right-0 sm:hidden glass-morphism border-t border-[#00FF66]/10 px-10 py-5 flex justify-between items-center z-[50] rounded-t-[2.5rem] safe-bottom">
        {[
          { id: 'home', label: 'Matrix', icon: '🏠' },
          { id: 'combos', label: 'Combo', icon: '🚀' },
          { id: 'history', label: 'History', icon: '📊' }
        ].map((v) => (
          <button key={v.id} onClick={() => setActiveView(v.id as View)} className={`flex flex-col items-center gap-1.5 transition-all ${activeView === v.id ? 'text-[#00FF66] scale-110' : 'text-slate-600'}`}>
            <span className="text-xl sm:text-2xl">{v.icon}</span>
            <span className="text-[9px] font-black uppercase tracking-widest">{v.label}</span>
          </button>
        ))}
      </nav>

      {/* Desktop Navigation Link on header or floating? Let's add it to Desktop Header */}
      <div className="hidden sm:flex fixed left-6 top-1/2 -translate-y-1/2 flex-col gap-6 z-50">
        {[
          { id: 'home', label: 'Matrix', icon: '🏠' },
          { id: 'combos', label: 'Combo', icon: '🚀' },
          { id: 'history', label: 'History', icon: '📊' }
        ].map((v) => (
          <button key={v.id} onClick={() => setActiveView(v.id as View)} className={`group relative w-14 h-14 flex items-center justify-center rounded-2xl transition-all duration-300 border ${activeView === v.id ? 'bg-[#00FF66] text-black border-[#00FF66] shadow-[0_0_20px_rgba(0,255,102,0.3)]' : 'bg-[#0a0c0e] text-slate-600 border-white/5 hover:border-[#00FF66]/40 hover:text-[#00FF66]'}`}>
            <span className="text-xl">{v.icon}</span>
            <div className="absolute left-full ml-4 px-4 py-2 bg-[#00FF66] text-black text-[10px] font-black uppercase rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-all whitespace-nowrap tracking-widest">
              {v.label}
            </div>
          </button>
        ))}
      </div>

      <ChatBot />
    </div>
  );
};

export default App;
