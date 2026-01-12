
import React, { useState, useEffect, useMemo } from 'react';
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
  const [error, setError] = useState<string | null>(null);
  
  const [selectedSport, setSelectedSport] = useState<SportType>('All');
  const [selectedDay, setSelectedDay] = useState<'Today' | 'Tomorrow' | 'All'>('Today');

  const bettingService = useMemo(() => new BettingService(), []);

  const dates = useMemo(() => {
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 86400000);
    return {
      todayISO: today.toISOString().split('T')[0],
      tomorrowISO: tomorrow.toISOString().split('T')[0]
    };
  }, []);

  useEffect(() => {
    const authorized = localStorage.getItem('neotip_authorized') === 'true';
    setIsAuthorized(authorized);
    const saved = localStorage.getItem('neotip_history');
    if (saved) {
      try { setHistory(JSON.parse(saved)); } catch (e) { setHistory([]); }
    }
  }, []);

  useEffect(() => {
    if (isAuthorized) localStorage.setItem('neotip_history', JSON.stringify(history));
  }, [history, isAuthorized]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await bettingService.generateDailySchedina();
      setSchedina(data);
    } catch (err: any) {
      setError(err.message || "Errore sconosciuto nella matrice.");
    } finally { setLoading(false); }
  };

  useEffect(() => { if (isAuthorized) loadData(); }, [isAuthorized]);

  const filteredPredictions = useMemo(() => {
    if (!schedina || !schedina.predictions) return [];
    
    const targetISO = selectedDay === 'Today' ? dates.todayISO : dates.tomorrowISO;
    
    let filtered = schedina.predictions.filter(p => {
      const sportMatch = selectedSport === 'All' || p.match.sport === selectedSport;
      // Se selezionato 'All' giorni, non filtriamo per data
      if (selectedDay === 'All') return sportMatch;
      
      // Controllo flessibile della data
      const dayMatch = p.match.date.includes(targetISO) || targetISO.includes(p.match.date);
      return sportMatch && dayMatch;
    });

    // Fallback: se il filtro non produce nulla, mostriamo i primi disponibili per non lasciare l'app vuota
    if (filtered.length === 0 && selectedSport === 'All' && schedina.predictions.length > 0) {
      return schedina.predictions.slice(0, 10);
    }

    return filtered;
  }, [schedina, selectedSport, selectedDay, dates]);

  const handlePlayBet = (prediction: Prediction) => {
    const stakeInput = prompt(`Importo da puntare per: ${prediction.match.homeTeam} vs ${prediction.match.awayTeam}`, "10");
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
    <div className="min-h-screen bg-[#050607] pb-24 md:pb-8 animate-fadeIn w-full overflow-x-hidden">
      <IOSInstallGuide />
      
      <header className="sticky top-0 z-50 glass-morphism border-b border-[#00FF66]/10 py-5 px-6 md:px-10 flex justify-between items-center w-full">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#00FF66]/10 border border-[#00FF66]/30 rounded-xl flex items-center justify-center">
            <span className="text-[#00FF66] font-black text-xl italic">N</span>
          </div>
          <h1 className="text-xl font-black text-white italic tracking-tighter">NEOTIP</h1>
        </div>

        <button onClick={loadData} disabled={loading} className="p-3 bg-[#00FF66]/10 border border-[#00FF66]/20 rounded-xl text-[#00FF66]">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={loading ? 'animate-spin' : ''}><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
        </button>
      </header>

      <main className="w-full px-6 md:px-10 py-6">
        {activeView === 'home' && (
          <div className="space-y-6">
            {/* Filtri Rapidi */}
            <div className="flex flex-col gap-4">
              <div className="flex bg-[#0a0c0e] p-1 rounded-xl border border-white/5 w-full">
                <button onClick={() => setSelectedDay('Today')} className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase transition-all ${selectedDay === 'Today' ? 'bg-[#00FF66] text-black' : 'text-slate-500'}`}>OGGI</button>
                <button onClick={() => setSelectedDay('Tomorrow')} className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase transition-all ${selectedDay === 'Tomorrow' ? 'bg-[#00FF66] text-black' : 'text-slate-500'}`}>DOMANI</button>
                <button onClick={() => setSelectedDay('All')} className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase transition-all ${selectedDay === 'All' ? 'bg-[#00FF66] text-black' : 'text-slate-500'}`}>TUTTI</button>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-40 text-center">
                <div className="w-12 h-12 border-4 border-[#00FF66]/10 border-t-[#00FF66] rounded-full animate-spin mb-6"></div>
                <p className="text-[#00FF66] font-mono text-[10px] uppercase tracking-[0.3em] animate-pulse">Analisi Web in Corso...</p>
              </div>
            ) : error ? (
              <div className="py-20 text-center glass-morphism rounded-3xl border-red-500/20 p-10">
                <p className="text-red-400 font-mono text-xs uppercase mb-6">{error}</p>
                <button onClick={loadData} className="px-8 py-4 bg-red-500/10 text-red-400 rounded-xl border border-red-500/30 font-black uppercase text-[10px]">Riprova Connessione</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredPredictions.map((p, i) => (
                  <MatchCard key={i} prediction={p} onPlay={handlePlayBet} />
                ))}
                
                {filteredPredictions.length === 0 && (
                  <div className="col-span-full py-40 text-center opacity-30">
                    <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Nessun match trovato per i filtri selezionati.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeView === 'combos' && (
           <div className="space-y-8">
            <h2 className="text-3xl font-black text-white italic">Neural Combos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {schedina?.dailyCombos.map((c, i) => (
                <div key={i} className="glass-morphism p-8 rounded-[2.5rem] border-[#00FF66]/20">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">{c.title}</h3>
                    <span className="px-3 py-1 bg-[#00FF66]/20 text-[#00FF66] rounded-full text-[8px] font-black uppercase">{c.type}</span>
                  </div>
                  <div className="space-y-3 mb-8">
                    {c.predictions.map((p, pi) => (
                      <div key={pi} className="flex justify-between text-[11px] text-slate-400 border-b border-white/5 pb-2">
                        <span>{p.event}</span>
                        <span className="text-[#00FF66] font-black">@{p.odds.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[9px] text-slate-500 font-black uppercase mb-1">Quota Totale</p>
                      <p className="text-3xl font-black text-[#00FF66]">@{c.totalOdds.toFixed(2)}</p>
                    </div>
                    <button className="px-8 py-3 bg-[#00FF66] text-black rounded-xl font-black uppercase text-[10px]">Gioca Combo</button>
                  </div>
                </div>
              ))}
            </div>
           </div>
        )}

        {activeView === 'history' && (
          <HistorySection history={history} onDelete={(id)=>setHistory(h=>h.filter(x=>x.id!==id))} onUpdateStatus={(id,s)=>setHistory(h=>h.map(x=>x.id===id?{...x,status:s}:x))} />
        )}
      </main>

      {/* Navigazione Inferiore Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden glass-morphism border-t border-[#00FF66]/10 px-6 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] flex justify-around items-center z-50">
        {(['home', 'combos', 'history'] as View[]).map((v) => (
          <button key={v} onClick={() => setActiveView(v)} className={`flex flex-col items-center gap-1 transition-all ${activeView === v ? 'text-[#00FF66] scale-110' : 'text-slate-600'}`}>
            <div className={`p-2 rounded-lg ${activeView === v ? 'bg-[#00FF66]/10' : ''}`}>
              {v === 'home' ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
              ) : v === 'combos' ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2v20M2 12h20"/><path d="m17 7 5 5-5 5M7 17l-5-5 5-5"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"/><path d="m9 12 2 2 4-4"/></svg>
              )}
            </div>
            <span className="text-[8px] font-black uppercase">{v}</span>
          </button>
        ))}
      </nav>

      <ChatBot />
    </div>
  );
};

export default App;
