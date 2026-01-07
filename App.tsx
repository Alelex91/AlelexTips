
import React, { useState, useEffect, useMemo } from 'react';
import { BettingService } from './services/geminiService';
import { Schedina, PlayedSchedina } from './types';
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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stake, setStake] = useState<number>(10);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);

  const bettingService = useMemo(() => new BettingService(), []);

  useEffect(() => {
    const authorized = localStorage.getItem('neotip_authorized') === 'true';
    setIsAuthorized(authorized);
    const savedHistory = localStorage.getItem('neotip_history');
    if (savedHistory) {
      try { setHistory(JSON.parse(savedHistory)); } catch (e) { console.error(e); }
    }
  }, []);

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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (isAuthorized) loadData(); 
  }, [isAuthorized]);

  const apiStatus = useMemo(() => {
    const key = process.env.API_KEY;
    return (!key || key === "undefined" || key === "") ? "SCOLLEGATO ❌" : "ATTIVO ✅";
  }, []);

  if (!isAuthorized) return <AccessPage onAccessGranted={handleAccessGranted} />;

  return (
    <div className="min-h-screen max-w-lg mx-auto bg-[#050607] pb-28 relative animate-fadeIn">
      {showSuccess && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-xl">
          <div className="glass-morphism p-10 rounded-[3rem] text-center border-[#00FF66]/30">
            <div className="w-20 h-20 bg-[#00FF66] rounded-full flex items-center justify-center mb-6 mx-auto shadow-[0_0_20px_#00FF66]">
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#050607" strokeWidth="4"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <h2 className="text-2xl font-black text-white italic">SCHEDINA SALVATA</h2>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-50 glass-morphism p-6 flex justify-between items-center border-b border-[#00FF66]/10">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tighter neon-text italic">NEOTIP</h1>
          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest font-mono">AI Status: {apiStatus}</p>
        </div>
        <button onClick={loadData} className="p-2.5 bg-[#00FF66]/10 border border-[#00FF66]/20 rounded-xl text-[#00FF66]">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={loading ? 'animate-spin' : ''}><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
        </button>
      </header>

      <main className="p-4 space-y-6">
        {activeView === 'home' ? (
          loading ? (
            <div className="flex flex-col items-center justify-center py-40">
              <div className="w-12 h-12 border-4 border-[#00FF66]/10 border-t-[#00FF66] rounded-full animate-spin mb-4"></div>
              <p className="text-[#00FF66] font-mono text-[10px] uppercase tracking-widest animate-pulse">Sincronizzazione...</p>
            </div>
          ) : error ? (
            <div className="glass-morphism border-red-500/20 p-8 rounded-[2.5rem] space-y-6">
              <div className="text-center">
                <div className="text-red-500 text-5xl mb-4">⚠️</div>
                <h3 className="text-white font-black uppercase text-sm">Problema di Configurazione</h3>
                <p className="text-slate-400 text-[10px] font-mono leading-relaxed mt-2">{error}</p>
              </div>

              {error.includes("CONFIGURAZIONE_MANCANTE") && (
                <div className="bg-[#00FF66]/5 p-5 rounded-2xl border border-[#00FF66]/20 space-y-4 text-left">
                  <p className="text-[10px] text-[#00FF66] font-black uppercase tracking-widest text-center">Come risolvere su Netlify:</p>
                  <ol className="space-y-3 text-[10px] text-slate-300 font-mono">
                    <li className="flex gap-2"><span>1.</span> Vai in <strong>Site Configuration</strong> > <strong>Environment variables</strong></li>
                    <li className="flex gap-2"><span>2.</span> Aggiungi la variabile <strong>API_KEY</strong> con il tuo valore</li>
                    <li className="flex gap-2"><span>3.</span> <strong>IMPORTANTE:</strong> Vai nel menu <strong>Deploys</strong> (Distribuzioni)</li>
                    <li className="flex gap-2"><span>4.</span> Clicca il tasto grigio <strong>Trigger deploy</strong> e poi <strong>Deploy site</strong></li>
                  </ol>
                  <p className="text-[9px] text-slate-500 italic text-center">Senza il punto 4, il sito non vedrà mai la chiave!</p>
                </div>
              )}
              
              <button onClick={loadData} className="w-full py-4 bg-red-500/20 text-red-500 rounded-xl font-black text-xs uppercase tracking-widest">Ricarica Sistema</button>
            </div>
          ) : (
            <div className="space-y-6">
              {schedina?.predictions.map((p, idx) => <MatchCard key={idx} prediction={p} />)}
              {schedina && (
                <div className="glass-morphism p-8 rounded-[3rem] border-[#00FF66]/20 shadow-2xl space-y-6 mt-10">
                  <div className="flex justify-between items-center text-white">
                    <div className="flex flex-col"><span className="text-[9px] uppercase font-mono text-slate-500">Quota</span><span className="text-2xl font-black">@{schedina.totalOdds.toFixed(2)}</span></div>
                    <div className="flex flex-col items-end"><span className="text-[9px] uppercase font-mono text-slate-500">Vincita</span><span className="text-2xl font-black text-[#00FF66]">€{(schedina.totalOdds * stake).toFixed(2)}</span></div>
                  </div>
                  <button onClick={() => { setIsPlaying(true); setTimeout(() => { setShowSuccess(true); setIsPlaying(false); setTimeout(() => { setShowSuccess(false); setActiveView('history'); }, 1500); }, 1000); }} className="w-full py-5 bg-[#00FF66] text-[#050607] rounded-3xl font-black text-lg shadow-[0_10px_30px_rgba(0,255,102,0.3)] uppercase">Piazza Scommessa €{stake}</button>
                </div>
              )}
            </div>
          )
        ) : activeView === 'history' ? (
          <HistorySection history={history} onDelete={() => {}} onUpdateStatus={() => {}} />
        ) : (
          <div className="flex flex-col items-center py-20 px-6 space-y-10">
            <div className="w-20 h-20 glass-morphism rounded-3xl flex items-center justify-center border-2 border-[#00FF66]/20"><svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#00FF66" strokeWidth="1.5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
            <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="w-full py-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-black text-[10px] uppercase tracking-widest">Resetta sessione</button>
          </div>
        )}
      </main>

      <ChatBot />

      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto glass-morphism border-t border-[#00FF66]/10 p-5 flex justify-around items-center z-50 rounded-t-[2.5rem]">
        <button onClick={() => setActiveView('home')} className={`flex flex-col items-center ${activeView === 'home' ? 'text-[#00FF66]' : 'text-slate-600'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
          <span className="text-[8px] font-black uppercase mt-1">Home</span>
        </button>
        <button onClick={() => setActiveView('history')} className={`flex flex-col items-center ${activeView === 'history' ? 'text-[#00FF66]' : 'text-slate-600'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"/><path d="m9 12 2 2 4-4"/></svg>
          <span className="text-[8px] font-black uppercase mt-1">Bet</span>
        </button>
        <button onClick={() => setActiveView('profile')} className={`flex flex-col items-center ${activeView === 'profile' ? 'text-[#00FF66]' : 'text-slate-600'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span className="text-[8px] font-black uppercase mt-1">Node</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
