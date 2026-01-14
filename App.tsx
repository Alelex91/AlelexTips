
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BettingService } from './services/geminiService';
import { Schedina, PlayedSchedina, BetStatus, SportType, Prediction } from './types';
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
    const now = new Date();
    const today = now.toLocaleDateString('en-CA'); 
    const tomorrowDate = new Date(now);
    tomorrowDate.setDate(now.getDate() + 1);
    const tomorrow = tomorrowDate.toLocaleDateString('en-CA');
    return { today, tomorrow };
  }, []);

  useEffect(() => {
    let interval: number;
    if (loading) {
      setProgress(0);
      interval = window.setInterval(() => {
        setProgress(prev => (prev >= 98 ? prev : prev + (prev < 50 ? 5 : 1)));
      }, 50);
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
      
      // Controllo intelligente: se oggi non c'è nulla, passa a domani o a tutti
      if (data.predictions && data.predictions.length > 0) {
        const hasToday = data.predictions.some(p => p.match.date === dates.today);
        if (!hasToday) {
          const hasTomorrow = data.predictions.some(p => p.match.date === dates.tomorrow);
          setSelectedDay(hasTomorrow ? 'Tomorrow' : 'All');
        } else {
          setSelectedDay('Today');
        }
      }
      
      setLoading(false);
    } catch (err: any) {
      console.error("Load Data Error:", err);
      setError(err.message || "Errore Critico Oracle: Connessione fallita.");
      setLoading(false);
    }
  }, [bettingService, dates]);

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
    
    return schedina.predictions.filter(p => {
      const pSport = (p.match.sport || '').toLowerCase();
      const sSport = selectedSport.toLowerCase();
      const sportMatch = selectedSport === 'All' || pSport.includes(sSport);
      
      let dateMatch = true;
      const mDate = p.match.date;
      if (selectedDay === 'Today') dateMatch = mDate === dates.today;
      else if (selectedDay === 'Tomorrow') dateMatch = mDate === dates.tomorrow;
      
      return sportMatch && dateMatch;
    });
  }, [schedina, selectedSport, selectedDay, dates]);

  const handlePlayBet = (prediction: Prediction) => {
    const stakeInput = prompt(`Puntata (€) per ${prediction.match.homeTeam}:`, "10");
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
    const newHistory = [newBet, ...history];
    setHistory(newHistory);
    localStorage.setItem('neotip_history', JSON.stringify(newHistory));
  };

  if (!isAuthorized) return <AccessPage onAccessGranted={() => setIsAuthorized(true)} />;

  return (
    <div className="flex flex-col min-h-screen animate-fadeIn w-full">
      <IOSInstallGuide />
      
      <header className="sticky top-0 z-50 glass-morphism border-b border-[#00FF66]/10 safe-top">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 bg-[#00FF66]/10 border border-[#00FF66]/30 rounded-xl flex items-center justify-center">
              <span className="text-[#00FF66] font-black text-xl italic">N</span>
            </div>
            <div>
              <h1 className="text-xl font-black text-white italic tracking-tighter">NEOTIP</h1>
              <div className="flex items-center gap-2">
                <p className="text-[7px] text-[#00FF66] font-mono uppercase tracking-widest opacity-60">Oracle v8.0</p>
                {schedina?.lastUpdated && (
                  <span className="text-[6px] bg-[#00FF66]/10 text-[#00FF66] px-1 py-0.5 rounded border border-[#00FF66]/20 font-black uppercase">{schedina.lastUpdated}</span>
                )}
              </div>
            </div>
          </div>
          <button onClick={loadData} disabled={loading} className="p-3 bg-[#00FF66]/10 border border-[#00FF66]/20 rounded-xl text-[#00FF66] hover:bg-[#00FF66]/20 transition-all shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={loading ? 'animate-spin' : ''}><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
          </button>
        </div>
      </header>

      <main className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {activeView === 'home' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
              <div className="w-full md:w-64 space-y-3">
                <label className="text-[9px] text-slate-500 font-black uppercase tracking-[0.3em]">Timeline</label>
                <div className="flex bg-[#0a0c0e] p-1 rounded-2xl border border-white/5 shadow-inner">
                  {(['Today', 'Tomorrow', 'All'] as const).map(day => (
                    <button key={day} onClick={() => setSelectedDay(day)} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${selectedDay === day ? 'bg-[#00FF66] text-black shadow-lg' : 'text-slate-500'}`}>
                      {day === 'Today' ? 'OGGI' : day === 'Tomorrow' ? 'DOMANI' : 'TUTTI'}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex-1 w-full space-y-3">
                <label className="text-[9px] text-slate-500 font-black uppercase tracking-[0.3em]">Sport Module</label>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {['All', 'Football', 'Basketball', 'Tennis', 'Volley', 'Rugby', 'F1'].map((sport) => (
                    <button key={sport} onClick={() => setSelectedSport(sport as SportType)} className={`px-6 py-3 rounded-2xl border whitespace-nowrap transition-all ${selectedSport === sport ? 'bg-[#00FF66]/20 border-[#00FF66] text-[#00FF66]' : 'bg-[#0a0c0e] border-white/10 text-slate-400'}`}>
                      <span className="text-[10px] font-black uppercase tracking-widest">{sport === 'All' ? 'TUTTI' : sport}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="py-40 text-center space-y-6 bg-[#0a0c0e]/40 rounded-[3rem] border border-white/5">
                <div className="w-20 h-20 border-4 border-[#00FF66]/10 border-t-[#00FF66] rounded-full animate-spin mx-auto shadow-[0_0_20px_rgba(0,255,102,0.2)]"></div>
                <p className="text-[#00FF66] font-mono text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">Sincronizzazione Matrix...</p>
                <div className="w-48 h-1 bg-white/5 mx-auto rounded-full overflow-hidden">
                  <div className="h-full bg-[#00FF66] transition-all duration-300" style={{width: `${progress}%`}}></div>
                </div>
              </div>
            ) : error ? (
              <div className="py-20 text-center glass-morphism rounded-[3rem] p-10 border-red-500/20">
                <p className="text-red-400 font-mono text-xs uppercase mb-8 leading-relaxed">{error}</p>
                <button onClick={loadData} className="px-8 py-4 bg-red-500/10 text-red-500 border border-red-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest">Riconnetti Nodo</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-10">
                {filteredPredictions.map((p, i) => <MatchCard key={p.match.id || i} prediction={p} onPlay={handlePlayBet} />)}
                {filteredPredictions.length === 0 && (
                  <div className="col-span-full py-40 text-center glass-morphism rounded-[3rem] border-dashed border-[#00FF66]/20">
                    <h3 className="text-white font-black uppercase tracking-widest text-sm mb-4">Nessun Match per questo filtro</h3>
                    <p className="text-slate-500 font-mono text-[9px] uppercase tracking-widest mb-8">
                      {schedina?.predictions.length === 0 
                        ? "L'Oracolo non ha trovato eventi per oggi. Riprova più tardi." 
                        : `Abbiamo trovato ${schedina?.predictions.length} match in altre date/sport.`}
                    </p>
                    <button onClick={() => {setSelectedDay('All'); setSelectedSport('All');}} className="px-8 py-4 bg-[#00FF66] text-black rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl">Mostra Tutti gli Eventi</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeView === 'combos' && (
           <div className="py-20 text-center glass-morphism rounded-[3rem] border-white/5">
             <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.5em]">Modulo Combo in Aggiornamento...</p>
           </div>
        )}

        {activeView === 'history' && <HistorySection history={history} onDelete={(id)=>{
          const newH = history.filter(x=>x.id!==id);
          setHistory(newH);
          localStorage.setItem('neotip_history', JSON.stringify(newH));
        }} onUpdateStatus={(id,s)=>{
          const newH = history.map(x=>x.id===id?{...x,status:s}:x);
          setHistory(newH);
          localStorage.setItem('neotip_history', JSON.stringify(newH));
        }} />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 sm:hidden glass-morphism border-t border-[#00FF66]/10 px-8 py-5 flex justify-between items-center z-[50] rounded-t-[2.5rem] safe-bottom">
        {[
          { id: 'home', label: 'Matrix', icon: '🏠' },
          { id: 'combos', label: 'Combo', icon: '🚀' },
          { id: 'history', label: 'History', icon: '📊' }
        ].map((v) => (
          <button key={v.id} onClick={() => setActiveView(v.id as View)} className={`flex flex-col items-center gap-1 transition-all ${activeView === v.id ? 'text-[#00FF66] scale-110' : 'text-slate-600'}`}>
            <span className="text-xl">{v.icon}</span>
            <span className="text-[9px] font-black uppercase tracking-widest">{v.label}</span>
          </button>
        ))}
      </nav>
      <ChatBot />
    </div>
  );
};

export default App;
