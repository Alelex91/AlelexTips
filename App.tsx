
import React, { useState, useEffect, useMemo } from 'react';
import { BettingService } from './services/geminiService';
import { Schedina, PlayedSchedina, Prediction } from './types';
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
  const [selectedLeague, setSelectedLeague] = useState<string>('Tutti');

  const bettingService = useMemo(() => new BettingService(), []);

  useEffect(() => {
    const authorized = localStorage.getItem('neotip_authorized') === 'true';
    setIsAuthorized(authorized);

    const savedHistory = localStorage.getItem('neotip_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) { console.error(e); }
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

  const handlePlayBet = () => {
    if (!schedina) return;
    setIsPlaying(true);
    const newBet: PlayedSchedina = { 
      ...schedina, 
      id: Date.now().toString(), 
      date: new Date().toISOString(), 
      stake: stake, 
      status: 'Pending' 
    };
    setHistory(prev => [newBet, ...prev]);
    localStorage.setItem('neotip_history', JSON.stringify([newBet, ...history]));
    
    setTimeout(() => {
      setIsPlaying(false);
      setShowSuccess(true);
      setTimeout(() => { 
        setShowSuccess(false); 
        setActiveView('history'); 
      }, 1500);
    }, 1200);
  };

  const filteredPredictions = useMemo(() => {
    if (!schedina) return [];
    if (selectedLeague === 'Tutti') return schedina.predictions;
    return schedina.predictions.filter(p => p.match.league === selectedLeague);
  }, [schedina, selectedLeague]);

  const apiStatus = useMemo(() => {
    const key = process.env.API_KEY;
    if (!key || key === "undefined") return "OFFLINE ❌";
    return "ATTIVO ✅";
  }, []);

  if (!isAuthorized) return <AccessPage onAccessGranted={handleAccessGranted} />;

  return (
    <div className="min-h-screen max-w-lg mx-auto bg-[#050607]/90 pb-28 relative shadow-2xl animate-fadeIn">
      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl">
          <div className="flex flex-col items-center glass-morphism p-12 rounded-[2.5rem] border-[#00FF66]/30">
            <div className="w-20 h-20 bg-[#00FF66] rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_#00FF66]">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#050607" strokeWidth="4"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <h2 className="text-2xl font-black text-white italic">SCHEDINA PIAZZATA</h2>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-50 glass-morphism p-6 flex justify-between items-center border-b border-[#00FF66]/10">
        <div className="flex flex-col">
          <h1 className="text-2xl font-black text-white tracking-tighter font-poppins neon-text italic">NEOTIP</h1>
          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest font-mono">Status: {apiStatus}</p>
        </div>
        <button onClick={loadData} className="p-2.5 bg-[#00FF66]/10 border border-[#00FF66]/20 rounded-xl text-[#00FF66]">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={loading ? 'animate-spin' : ''}><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
        </button>
      </header>

      <main className="p-4 space-y-6">
        {activeView === 'home' ? (
          loading ? (
            <div className="flex flex-col items-center justify-center py-40">
              <div className="w-16 h-16 border-4 border-[#00FF66]/10 border-t-[#00FF66] rounded-full animate-spin mb-6"></div>
              <p className="text-[#00FF66] font-mono text-xs uppercase animate-pulse">Analisi in corso...</p>
            </div>
          ) : error ? (
            <div className="glass-morphism border-red-500/30 p-8 rounded-3xl text-center space-y-4">
              <div className="text-red-500 text-5xl">⚠️</div>
              <h3 className="text-white font-black uppercase text-sm">Errore Critico</h3>
              <p className="text-slate-400 text-xs font-mono leading-relaxed">{error}</p>
              
              {error.includes("CHIAVE_NON_RILEVATA") && (
                <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/30 text-left">
                  <p className="text-[10px] text-blue-300 font-mono">
                    💡 **Soluzione**: <br/>
                    1. Carica il codice su **GitHub**.<br/>
                    2. Collega il repo a **Netlify**.<br/>
                    3. Aggiungi `API_KEY` nelle variabili di Netlify.<br/>
                    4. Il Drag & Drop non supporta le chiavi API!
                  </p>
                </div>
              )}
              
              <button onClick={loadData} className="w-full py-4 bg-red-500/20 text-red-500 rounded-xl font-black text-xs uppercase">Riprova</button>
            </div>
          ) : (
            <>
              <div className="space-y-6">
                {filteredPredictions.map((p, idx) => (
                  <MatchCard key={idx} prediction={p} />
                ))}
              </div>

              {schedina && (
                <div className="glass-morphism p-8 rounded-[2.5rem] border-[#00FF66]/20 mt-8">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-xs text-slate-500 font-bold uppercase">Quota Totale</span>
                    <span className="text-2xl font-black text-[#00FF66]">@{schedina.totalOdds.toFixed(2)}</span>
                  </div>
                  <button 
                    onClick={handlePlayBet} 
                    className="w-full py-5 bg-[#00FF66] text-[#050607] rounded-2xl font-black text-lg shadow-[0_0_20px_#00FF6633]"
                  >
                    GIOCA €{stake}
                  </button>
                </div>
              )}
            </>
          )
        ) : activeView === 'history' ? (
          <HistorySection history={history} onDelete={(id) => setHistory(h => h.filter(x => x.id !== id))} onUpdateStatus={(id, status) => setHistory(h => h.map(x => x.id === id ? {...x, status} : x))} />
        ) : (
          <div className="text-center py-20">
            <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="px-8 py-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl font-black text-xs uppercase">Reset Totale App</button>
          </div>
        )}
      </main>

      <ChatBot />

      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto glass-morphism border-t border-[#00FF66]/10 p-5 flex justify-around items-center z-50 rounded-t-[2.5rem]">
        <button onClick={() => setActiveView('home')} className={`flex flex-col items-center ${activeView === 'home' ? 'text-[#00FF66]' : 'text-slate-600'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
          <span className="text-[8px] font-black uppercase mt-1">Home</span>
        </button>
        <button onClick={() => setActiveView('history')} className={`flex flex-col items-center ${activeView === 'history' ? 'text-[#00FF66]' : 'text-slate-600'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"/><path d="m9 12 2 2 4-4"/></svg>
          <span className="text-[8px] font-black uppercase mt-1">Bet</span>
        </button>
        <button onClick={() => setActiveView('profile')} className={`flex flex-col items-center ${activeView === 'profile' ? 'text-[#00FF66]' : 'text-slate-600'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <span className="text-[8px] font-black uppercase mt-1">Profile</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
