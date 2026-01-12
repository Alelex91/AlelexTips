
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

  // Gestione progresso dinamica per evitare blocchi al 98%
  useEffect(() => {
    let interval: number;
    if (loading) {
      setProgress(0);
      interval = window.setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) return prev; // Rallenta invece di bloccarsi
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
      // Forza il progresso al 100% prima di sbloccare
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
      // Normalizzazione sport
      const sportMatch = selectedSport === 'All' || 
        p.match.sport.toLowerCase().includes(selectedSport.toLowerCase());
      
      // Filtro Data Rigoroso
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
  };

  if (!isAuthorized) return <AccessPage onAccessGranted={() => setIsAuthorized(true)} />;

  return (
    <div className="min-h-screen bg-[#050607] pb-24 animate-fadeIn w-full overflow-x-hidden">
      <IOSInstallGuide />
      
      <header className="sticky top-0 z-50 glass-morphism border-b border-[#00FF66]/10 py-5 px-6 flex justify-between items-center w-full">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#00FF66]/10 border border-[#00FF66]/30 rounded-xl flex items-center justify-center">
            <span className="text-[#00FF66] font-black text-xl italic">N</span>
          </div>
          <div>
            <h1 className="text-xl font-black text-white italic tracking-tighter">NEOTIP</h1>
            <p className="text-[7px] text-[#00FF66] font-mono uppercase tracking-[0.2em] opacity-40">Live Matrix</p>
          </div>
        </div>
        <button onClick={loadData} disabled={loading} className="p-3 bg-[#00FF66]/10 border border-[#00FF66]/20 rounded-xl text-[#00FF66]">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={loading ? 'animate-spin' : ''}><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
        </button>
      </header>

      <main className="w-full px-6 py-6 max-w-7xl mx-auto">
        {activeView === 'home' && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex bg-[#0a0c0e] p-1 rounded-xl border border-white/5 w-full">
                {(['Today', 'Tomorrow', 'All'] as const).map(day => (
                  <button key={day} onClick={() => setSelectedDay(day)} className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase transition-all ${selectedDay === day ? 'bg-[#00FF66] text-black' : 'text-slate-500'}`}>{day === 'Today' ? 'OGGI' : day === 'Tomorrow' ? 'DOMANI' : 'TUTTI'}</button>
                ))}
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {[
                  { id: 'All', label: 'Tutti', icon: '🏆' },
                  { id: 'Football', label: 'Calcio', icon: '⚽' },
                  { id: 'Basketball', label: 'Basket', icon: '🏀' },
                  { id: 'Tennis', label: 'Tennis', icon: '🎾' }
                ].map((sport) => (
                  <button key={sport.id} onClick={() => setSelectedSport(sport.id as SportType)} className={`flex items-center gap-2 px-5 py-3 rounded-xl border whitespace-nowrap transition-all ${selectedSport === sport.id ? 'bg-[#00FF66]/20 border-[#00FF66] text-[#00FF66]' : 'bg-[#0a0c0e] border-white/10 text-slate-400'}`}>
                    <span className="text-sm">{sport.icon}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">{sport.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="relative w-40 h-40 mb-12 flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle cx="80" cy="80" r="74" fill="transparent" stroke="rgba(0,255,102,0.05)" strokeWidth="4" />
                        <circle cx="80" cy="80" r="74" fill="transparent" stroke="#00FF66" strokeWidth="4" strokeDasharray="465" strokeDashoffset={465 - (465 * progress / 100)} className="transition-all duration-300" style={{ filter: 'drop-shadow(0 0 10px #00FF66)' }} />
                    </svg>
                    <span className="text-4xl font-black text-white font-mono">{Math.round(progress)}%</span>
                </div>
                <p className="text-[#00FF66] font-mono text-[9px] font-black uppercase tracking-[0.4em] animate-pulse">Scanning Global Markets...</p>
              </div>
            ) : error ? (
              <div className="py-20 text-center glass-morphism rounded-[2.5rem] border-red-500/20 p-10">
                <p className="text-red-400 font-mono text-[11px] font-black uppercase mb-8 leading-relaxed">{error}</p>
                <button onClick={loadData} className="px-8 py-4 bg-red-500/10 text-red-500 border border-red-500/30 rounded-xl font-black uppercase text-[10px]">Riavvia Scansione</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredPredictions.map((p, i) => <MatchCard key={i} prediction={p} onPlay={handlePlayBet} />)}
                {filteredPredictions.length === 0 && (
                  <div className="col-span-full py-40 text-center flex flex-col items-center gap-4 opacity-30">
                    <span className="text-4xl">📡</span>
                    <p className="text-slate-500 font-mono text-[10px] uppercase tracking-widest italic">Nessun match trovato per questa selezione.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeView === 'combos' && (
           <div className="space-y-8 animate-fadeIn">
            <h2 className="text-3xl font-black text-white italic tracking-tighter">Neural Combos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {schedina?.dailyCombos.map((c, i) => (
                <div key={i} className="glass-morphism p-8 rounded-[3rem] border-[#00FF66]/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                    <span className="text-8xl italic font-black text-[#00FF66]">{c.type[0]}</span>
                  </div>
                  <div className="flex justify-between items-center mb-8 relative z-10">
                    <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">{c.title}</h3>
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${c.type === 'Safe' ? 'bg-[#00FF66]/20 text-[#00FF66]' : 'bg-red-500/20 text-red-500'}`}>{c.type}</span>
                  </div>
                  <div className="space-y-4 mb-10 relative z-10">
                    {c.predictions.map((p, pi) => (
                      <div key={pi} className="flex justify-between text-[11px] text-slate-400 border-b border-white/5 pb-2">
                        <span className="font-bold uppercase italic">{p.event}</span>
                        <span className="text-[#00FF66] font-black font-mono">@{p.odds.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-end relative z-10">
                    <div>
                      <p className="text-[9px] text-slate-500 font-black uppercase mb-1 tracking-widest">Neural Multiplier</p>
                      <p className="text-4xl font-black text-[#00FF66] tracking-tighter font-mono">@{c.totalOdds.toFixed(2)}</p>
                    </div>
                    <button className="px-8 py-3 bg-[#00FF66] text-black rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all">Gioca Combo</button>
                  </div>
                </div>
              ))}
            </div>
           </div>
        )}

        {activeView === 'history' && <HistorySection history={history} onDelete={(id)=>setHistory(h=>h.filter(x=>x.id!==id))} onUpdateStatus={(id,s)=>setHistory(h=>h.map(x=>x.id===id?{...x,status:s}:x))} />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 md:hidden glass-morphism border-t border-[#00FF66]/10 px-8 py-5 flex justify-between items-center z-50 rounded-t-[2.5rem] safe-bottom">
        {[
          { id: 'home', label: 'Matrix', icon: '🏠' },
          { id: 'combos', label: 'Combo', icon: '🚀' },
          { id: 'history', label: 'History', icon: '📊' }
        ].map((v) => (
          <button key={v.id} onClick={() => setActiveView(v.id as View)} className={`flex flex-col items-center gap-1.5 transition-all ${activeView === v.id ? 'text-[#00FF66] scale-110' : 'text-slate-600'}`}>
            <span className="text-xl opacity-80">{v.icon}</span>
            <span className="text-[9px] font-black uppercase tracking-widest">{v.label}</span>
          </button>
        ))}
      </nav>
      <ChatBot />
    </div>
  );
};

export default App;
