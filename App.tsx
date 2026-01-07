
import React, { useState, useEffect, useMemo } from 'react';
import { BettingService } from './services/geminiService';
import { Schedina, PlayedSchedina, BetStatus } from './types';
import MatchCard from './components/MatchCard';
import ChatBot from './components/ChatBot';
import HistorySection from './components/HistorySection';
import AccessPage from './components/AccessPage';

type View = 'home' | 'history' | 'profile';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('home');
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [schedina, setSchedina] = useState<Schedina | null>(null);
  const [history, setHistory] = useState<PlayedSchedina[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stake, setStake] = useState<number>(10);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);

  const bettingService = useMemo(() => new BettingService(), []);

  // 1. Carica dati all'avvio
  useEffect(() => {
    const authorized = localStorage.getItem('neotip_authorized') === 'true';
    setIsAuthorized(authorized);
    
    const savedHistory = localStorage.getItem('neotip_history');
    if (savedHistory) {
      try { 
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed)) setHistory(parsed);
      } catch (e) { 
        console.error("Errore recupero cronologia", e); 
      }
    }
    setHistoryLoaded(true);
  }, []);

  // 2. Salva dati quando cambiano (solo dopo il caricamento iniziale)
  useEffect(() => {
    if (historyLoaded) {
      localStorage.setItem('neotip_history', JSON.stringify(history));
    }
  }, [history, historyLoaded]);

  const handleAccessGranted = () => {
    localStorage.setItem('neotip_authorized', 'true');
    setIsAuthorized(true);
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await bettingService.generateDailySchedina();
      setSchedina(data);
    } catch (err: any) {
      setError(err.message.includes("CONFIG_ERROR") 
        ? "Accesso negato: Chiave API non configurata." 
        : "Errore di rete: Impossibile contattare l'oracolo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (isAuthorized) loadData(); 
  }, [isAuthorized]);

  const handlePlaceBet = () => {
    if (!schedina) return;
    
    const newPlayedBet: PlayedSchedina = {
      ...schedina,
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      stake: stake,
      status: 'Pending' as BetStatus
    };

    setHistory(prev => [newPlayedBet, ...prev]);
    setShowSuccess(true);
    
    setTimeout(() => {
      setShowSuccess(false);
      setActiveView('history');
    }, 1500);
  };

  const deleteFromHistory = (id: string) => {
    setHistory(prev => prev.filter(bet => bet.id !== id));
  };

  const updateBetStatus = (id: string, status: 'Won' | 'Lost') => {
    setHistory(prev => prev.map(bet => 
      bet.id === id ? { ...bet, status } : bet
    ));
  };

  const apiStatus = useMemo(() => {
    let hasKey = false;
    try {
      hasKey = !!((import.meta as any).env?.VITE_API_KEY || (window as any).API_KEY);
    } catch(e) {}
    return hasKey ? "ATTIVO" : "DISCONNESSO";
  }, []);

  if (!isAuthorized) return <AccessPage onAccessGranted={handleAccessGranted} />;

  return (
    <div className="min-h-screen max-w-lg mx-auto bg-[#050607] pb-28 relative animate-fadeIn overflow-x-hidden">
      {showSuccess && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md">
          <div className="glass-morphism p-10 rounded-[3rem] text-center border-[#00FF66]/40 shadow-[0_0_50px_rgba(0,255,102,0.2)]">
            <div className="w-16 h-16 bg-[#00FF66] rounded-full flex items-center justify-center mb-4 mx-auto animate-bounce">
              <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#050607" strokeWidth="4"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Schedina Salvata</h2>
            <p className="text-[10px] text-[#00FF66] font-mono mt-2 uppercase tracking-widest">Database Record Updated</p>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-50 glass-morphism p-6 flex justify-between items-center border-b border-[#00FF66]/10">
        <div onClick={() => setActiveView('home')} className="cursor-pointer">
          <h1 className="text-2xl font-black text-white tracking-tighter neon-text italic">NEOTIP</h1>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${apiStatus === 'ATTIVO' ? 'bg-[#00FF66] shadow-[0_0_5px_#00FF66]' : 'bg-red-500 shadow-[0_0_5px_red]'}`}></div>
            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest font-mono">Neural Link: {apiStatus}</p>
          </div>
        </div>
        <button onClick={loadData} className="p-2.5 bg-[#00FF66]/10 border border-[#00FF66]/20 rounded-xl text-[#00FF66] active:scale-90 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={loading ? 'animate-spin' : ''}><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
        </button>
      </header>

      <main className="p-4 space-y-6">
        {activeView === 'home' ? (
          loading ? (
            <div className="flex flex-col items-center justify-center py-40">
              <div className="w-12 h-12 border-4 border-[#00FF66]/10 border-t-[#00FF66] rounded-full animate-spin mb-4"></div>
              <p className="text-[#00FF66] font-mono text-[10px] uppercase tracking-widest animate-pulse">Analisi in corso...</p>
            </div>
          ) : error ? (
            <div className="glass-morphism border-red-500/30 p-8 rounded-[2.5rem] space-y-6 text-center">
              <div className="text-red-500 text-5xl">📡</div>
              <h3 className="text-white font-black uppercase text-sm">{error}</h3>
              <button onClick={loadData} className="w-full py-4 bg-white/5 text-white border border-white/10 rounded-xl font-black text-[10px] uppercase tracking-widest">Ricarica Sistema</button>
            </div>
          ) : (
            <div className="space-y-6 animate-fadeIn">
              {schedina?.predictions.map((p, idx) => <MatchCard key={idx} prediction={p} />)}
              
              {schedina && (
                <div className="glass-morphism p-8 rounded-[3rem] border-[#00FF66]/20 shadow-2xl space-y-6 mt-6">
                  <div className="flex justify-between items-center text-white">
                    <div className="flex flex-col"><span className="text-[9px] uppercase font-mono text-slate-500 tracking-widest">Quota Totale</span><span className="text-3xl font-black italic">@{schedina.totalOdds.toFixed(2)}</span></div>
                    <div className="flex flex-col items-end"><span className="text-[9px] uppercase font-mono text-slate-500 tracking-widest">Pot. Vincita</span><span className="text-3xl font-black text-[#00FF66] italic">€{(schedina.totalOdds * stake).toFixed(2)}</span></div>
                  </div>
                  <button onClick={handlePlaceBet} className="w-full py-5 bg-[#00FF66] text-[#050607] rounded-3xl font-black text-lg shadow-[0_10px_30px_rgba(0,255,102,0.3)] uppercase tracking-tighter active:scale-95 transition-transform">Piazza Scommessa €{stake}</button>
                </div>
              )}
            </div>
          )
        ) : activeView === 'history' ? (
          <HistorySection history={history} onDelete={deleteFromHistory} onUpdateStatus={updateBetStatus} />
        ) : (
          <div className="flex flex-col items-center py-20 px-6 space-y-10 animate-fadeIn">
            <div className="w-24 h-24 glass-morphism rounded-[2.5rem] flex items-center justify-center border-2 border-[#00FF66]/20 text-[#00FF66] shadow-[0_0_30px_rgba(0,255,102,0.1)]">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div className="w-full space-y-3">
              <button onClick={() => { localStorage.removeItem('neotip_history'); setHistory([]); alert('Cronologia resettata'); }} className="w-full py-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-black text-[10px] uppercase tracking-widest">Svuota Cronologia</button>
              <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="w-full py-4 bg-white/5 text-white border border-white/10 rounded-xl font-black text-[10px] uppercase tracking-widest">Reset Totale Account</button>
            </div>
          </div>
        )}
      </main>

      <ChatBot />

      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto glass-morphism border-t border-[#00FF66]/10 p-5 pb-8 flex justify-around items-center z-50 rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <button onClick={() => setActiveView('home')} className={`flex flex-col items-center gap-1 transition-all ${activeView === 'home' ? 'text-[#00FF66] scale-110' : 'text-slate-600 hover:text-slate-400'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
          <span className="text-[8px] font-black uppercase">Oracle</span>
        </button>
        <button onClick={() => setActiveView('history')} className={`flex flex-col items-center gap-1 transition-all ${activeView === 'history' ? 'text-[#00FF66] scale-110' : 'text-slate-600 hover:text-slate-400'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"/><path d="m9 12 2 2 4-4"/></svg>
          <span className="text-[8px] font-black uppercase">Records</span>
        </button>
        <button onClick={() => setActiveView('profile')} className={`flex flex-col items-center gap-1 transition-all ${activeView === 'profile' ? 'text-[#00FF66] scale-110' : 'text-slate-600 hover:text-slate-400'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span className="text-[8px] font-black uppercase">Node</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
