import React, { useState, useEffect, useMemo } from 'react';
import { BettingService } from './services/geminiService';
import { Schedina, PlayedSchedina, BetStatus, SportType, ComboTip, Prediction } from './types';
import MatchCard from './components/MatchCard';
import ChatBot from './components/ChatBot';
import HistorySection from './components/HistorySection';
import AccessPage from './components/AccessPage';
import IOSInstallGuide from './components/IOSInstallGuide';

type View = 'home' | 'combos' | 'history' | 'profile';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('home');
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [schedina, setSchedina] = useState<Schedina | null>(null);
  const [history, setHistory] = useState<PlayedSchedina[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedSport, setSelectedSport] = useState<SportType>('All');
  const [selectedDay, setSelectedDay] = useState<'Today' | 'Tomorrow'>('Today');

  const [randomCombo, setRandomCombo] = useState<ComboTip | null>(null);
  const [loadingRandom, setLoadingRandom] = useState<boolean>(false);

  const bettingService = useMemo(() => new BettingService(), []);

  const dates = useMemo(() => {
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 86400000);
    return {
      today: today.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }).toUpperCase(),
      tomorrow: tomorrow.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }).toUpperCase(),
      todayISO: today.toLocaleDateString('en-CA'),
      tomorrowISO: tomorrow.toLocaleDateString('en-CA')
    };
  }, []);

  useEffect(() => {
    const authorized = localStorage.getItem('neotip_authorized') === 'true';
    setIsAuthorized(authorized);
    const saved = localStorage.getItem('neotip_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        setHistory([]);
      }
    }
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      localStorage.setItem('neotip_history', JSON.stringify(history));
    }
  }, [history, isAuthorized]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    setRandomCombo(null);
    try {
      const data = await bettingService.generateDailySchedina();
      setSchedina(data);
    } catch (err: any) {
      console.error("App.tsx Error:", err);
      // Forniamo un messaggio di errore più descrittivo per il debug dell'utente
      if (err.message?.includes("API_KEY_MISSING")) {
        setError("CHIAVE API MANCANTE: Configurala nel pannello Cloudflare.");
      } else {
        setError(err.message || "Errore sincronizzazione Oracle. Verifica la connessione.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePlayBet = (prediction: Prediction) => {
    const stakeInput = prompt(`Importo da puntare per: ${prediction.match.homeTeam} vs ${prediction.match.awayTeam}`, "10");
    const stake = parseFloat(stakeInput || "0");
    if (isNaN(stake) || stake <= 0) return;

    const newBet: PlayedSchedina = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      predictions: [prediction],
      totalOdds: prediction.odds,
      stake: stake,
      status: 'Pending',
      dailyCombos: []
    };

    setHistory(prev => [newBet, ...prev]);
    alert("Scommessa salvata!");
  };

  const handlePlayCombo = (combo: ComboTip) => {
    const stakeInput = prompt(`Importo da puntare per la combo: ${combo.title}`, "10");
    const stake = parseFloat(stakeInput || "0");
    if (isNaN(stake) || stake <= 0) return;

    const newBet: PlayedSchedina = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      predictions: combo.predictions,
      totalOdds: combo.totalOdds,
      stake: stake,
      status: 'Pending',
      dailyCombos: [combo]
    };

    setHistory(prev => [newBet, ...prev]);
    alert("Combo salvata!");
  };

  const handleGenerateLuckyTip = async () => {
    if (!schedina || !schedina.predictions || schedina.predictions.length < 3) return;
    setLoadingRandom(true);
    try {
      const lucky = await bettingService.generateOracleSurprise(schedina.predictions);
      setRandomCombo(lucky);
    } catch (err) {
      alert("L'Oracolo è instabile. Riprova.");
    } finally {
      setLoadingRandom(false);
    }
  };

  useEffect(() => { 
    if (isAuthorized) loadData(); 
  }, [isAuthorized]);

  const filteredPredictions = useMemo(() => {
    if (!schedina || !schedina.predictions) return [];
    const targetISO = selectedDay === 'Today' ? dates.todayISO : dates.tomorrowISO;

    return schedina.predictions.filter(p => {
      const sportMatch = selectedSport === 'All' || p.match.sport === selectedSport;
      const matchDate = p.match.date;
      const dayMatch = matchDate === targetISO || matchDate.includes(targetISO);
      return sportMatch && dayMatch;
    });
  }, [schedina, selectedSport, selectedDay, dates]);

  if (!isAuthorized) return <AccessPage onAccessGranted={() => setIsAuthorized(true)} />;

  return (
    <div className="min-h-screen max-w-lg mx-auto bg-[#050607] pb-32 relative animate-fadeIn">
      <IOSInstallGuide />
      
      <header className="sticky top-0 z-50 glass-morphism p-6 flex justify-between items-center border-b border-[#00FF66]/10 pt-[calc(env(safe-area-inset-top)+1rem)]">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tighter neon-text italic">NEOTIP</h1>
          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest font-mono">Neural multi-sport hub</p>
        </div>
        <button onClick={loadData} className="p-2.5 bg-[#00FF66]/10 border border-[#00FF66]/20 rounded-xl text-[#00FF66]">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={loading ? 'animate-spin' : ''}><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
        </button>
      </header>

      {activeView === 'home' && (
        <div className="px-4 pt-4 pb-2 space-y-5 sticky top-[95px] z-40 bg-[#050607]/90 backdrop-blur-xl">
          <div className="flex bg-[#0a0c0e] p-1.5 rounded-2xl border border-white/5">
            {[
              { id: 'Today', label: `OGGI • ${dates.today}` },
              { id: 'Tomorrow', label: `DOMANI • ${dates.tomorrow}` }
            ].map((day) => (
              <button 
                key={day.id}
                onClick={() => setSelectedDay(day.id as any)}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedDay === day.id ? 'bg-[#00FF66] text-[#050607]' : 'text-slate-500'}`}
              >
                {day.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {['All', 'Football', 'Basketball', 'Tennis', 'Volley'].map((sport) => (
              <button 
                key={sport}
                onClick={() => setSelectedSport(sport as any)}
                className={`px-5 py-3 rounded-2xl text-[9px] font-black uppercase border transition-all flex-shrink-0 ${selectedSport === sport ? 'border-[#00FF66] text-[#00FF66] bg-[#00FF66]/15' : 'border-white/10 text-slate-500 bg-white/5'}`}
              >
                {sport}
              </button>
            ))}
          </div>

          <button 
            onClick={handleGenerateLuckyTip}
            disabled={loading || loadingRandom}
            className="w-full bg-[#00FF66]/5 border border-[#00FF66]/40 rounded-2xl py-3 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-30"
          >
            <span className="text-[10px] font-black text-[#00FF66] uppercase tracking-widest">Genera Combo Oracolo</span>
          </button>
        </div>
      )}

      <main className="p-4 pt-6 space-y-6">
        {activeView === 'home' ? (
          loading ? (
             <div className="flex flex-col items-center justify-center py-40">
                <div className="w-10 h-10 border-2 border-[#00FF66]/10 border-t-[#00FF66] rounded-full animate-spin mb-4"></div>
                <p className="text-[#00FF66] font-mono text-[10px] uppercase tracking-widest animate-pulse">Syncing Matrix...</p>
             </div>
          ) : (
            <div className="space-y-4">
              {error && (
                <div className="p-8 glass-morphism rounded-3xl border border-red-500/30 text-center">
                  <p className="text-red-400 font-mono text-[10px] uppercase mb-4 leading-relaxed">{error}</p>
                  <button onClick={loadData} className="px-6 py-2 bg-red-500/20 text-red-400 rounded-xl border border-red-500/40 text-[10px] font-black uppercase">Riprova Sync</button>
                </div>
              )}

              {filteredPredictions.map((p, idx) => (
                <MatchCard key={idx} prediction={p} onPlay={handlePlayBet} />
              ))}
            </div>
          )
        ) : activeView === 'combos' ? (
          <div className="space-y-6">
             <h2 className="text-white font-black uppercase text-2xl italic px-2">Neural Combos</h2>
             {schedina?.dailyCombos.map((combo, idx) => (
               <div key={idx} className="glass-morphism p-8 rounded-[2.5rem] border border-[#00FF66]/20">
                 <h3 className="text-xl font-black text-white mb-4 italic">{combo.title}</h3>
                 <div className="space-y-3 mb-6">
                   {combo.predictions.map((p, i) => (
                     <div key={i} className="flex justify-between text-[11px] text-slate-400 border-b border-white/5 pb-2">
                       <span>{p.event}</span>
                       <span className="text-[#00FF66] font-bold">@{p.odds.toFixed(2)}</span>
                     </div>
                   ))}
                 </div>
                 <div className="flex justify-between items-center">
                   <p className="text-2xl font-black text-[#00FF66]">@{combo.totalOdds.toFixed(2)}</p>
                   <button onClick={() => handlePlayCombo(combo)} className="px-6 py-3 bg-[#00FF66] text-[#050607] rounded-xl text-[10px] font-black uppercase">Gioca</button>
                 </div>
               </div>
             ))}
          </div>
        ) : activeView === 'history' ? (
          <HistorySection 
            history={history} 
            onDelete={(id) => setHistory(h => h.filter(x => x.id !== id))} 
            onUpdateStatus={(id, s) => setHistory(h => h.map(x => x.id === id ? {...x, status: s} : x))} 
          />
        ) : (
          <div className="p-8 text-center">
             <p className="text-slate-500 font-mono text-[10px] tracking-widest uppercase">Premium Access Enabled</p>
          </div>
        )}
      </main>

      <ChatBot />

      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto glass-morphism border-t border-[#00FF66]/15 p-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] flex justify-around items-center z-50 rounded-t-[2.5rem]">
        <button onClick={() => setActiveView('home')} className={`flex flex-col items-center gap-1 ${activeView === 'home' ? 'text-[#00FF66]' : 'text-slate-600'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
          <span className="text-[8px] font-black uppercase">Events</span>
        </button>
        <button onClick={() => setActiveView('combos')} className={`flex flex-col items-center gap-1 ${activeView === 'combos' ? 'text-[#00FF66]' : 'text-slate-600'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M2 12h20"/><path d="m17 7 5 5-5 5M7 17l-5-5 5-5"/></svg>
          <span className="text-[8px] font-black uppercase">Combos</span>
        </button>
        <button onClick={() => setActiveView('history')} className={`flex flex-col items-center gap-1 ${activeView === 'history' ? 'text-[#00FF66]' : 'text-slate-600'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"/><path d="m9 12 2 2 4-4"/></svg>
          <span className="text-[8px] font-black uppercase">History</span>
        </button>
      </nav>
    </div>
  );
};

export default App;