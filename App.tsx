
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
        console.error("History parse error", e);
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
      setError("Errore sincronizzazione Oracle. Verifica la connessione.");
    } finally {
      setLoading(false);
    }
  };

  const handlePlayBet = (prediction: Prediction) => {
    const stakeInput = prompt(`Inserisci l'importo da puntare per: ${prediction.match.homeTeam} vs ${prediction.match.awayTeam}`, "10");
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
    alert("Scommessa salvata in Cronologia!");
  };

  const handlePlayCombo = (combo: ComboTip) => {
    const stakeInput = prompt(`Inserisci l'importo da puntare per la combo: ${combo.title}`, "10");
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
    alert("Combo salvata in Cronologia!");
  };

  const handleGenerateLuckyTip = async () => {
    if (!schedina || !schedina.predictions || schedina.predictions.length < 3) return;
    setLoadingRandom(true);
    try {
      const lucky = await bettingService.generateOracleSurprise(schedina.predictions);
      setRandomCombo(lucky);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error("Errore Lucky Tip", err);
      alert("L'Oracolo è temporaneamente instabile. Riprova tra poco.");
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
    <div className="min-h-screen max-w-lg mx-auto bg-[#050607] pb-32 relative animate-fadeIn overflow-x-hidden">
      <IOSInstallGuide />
      
      <header className="sticky top-0 z-50 glass-morphism p-6 flex justify-between items-center border-b border-[#00FF66]/10 pt-[calc(env(safe-area-inset-top)+1rem)]">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tighter neon-text italic">NEOTIP</h1>
          <div className="flex items-center gap-2">
            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest font-mono">Neural multi-sport hub</p>
            {schedina?.lastUpdated && !loading && (
              <span className="text-[7px] text-[#00FF66]/70 font-mono animate-pulse uppercase tracking-tighter">LIVE_SYNC: {schedina.lastUpdated}</span>
            )}
          </div>
        </div>
        <button onClick={loadData} className="p-2.5 bg-[#00FF66]/10 border border-[#00FF66]/20 rounded-xl text-[#00FF66] active:scale-95 transition-all shadow-[0_0_15px_rgba(0,255,102,0.1)]">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={loading ? 'animate-spin' : ''}><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
        </button>
      </header>

      {activeView === 'home' && (
        <div className="px-4 pt-4 pb-2 space-y-5 sticky top-[95px] z-40 bg-[#050607]/90 backdrop-blur-xl border-b border-white/5">
          <div className="flex bg-[#0a0c0e] p-1.5 rounded-2xl border border-white/5 shadow-inner">
            {[
              { id: 'Today', label: `OGGI • ${dates.today}` },
              { id: 'Tomorrow', label: `DOMANI • ${dates.tomorrow}` }
            ].map((day) => (
              <button 
                key={day.id}
                onClick={() => setSelectedDay(day.id as any)}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${selectedDay === day.id ? 'bg-[#00FF66] text-[#050607] shadow-[0_0_20px_rgba(0,255,102,0.4)]' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {day.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1 px-1">
            {[
              { id: 'All', label: 'Tutti', icon: '🌐' },
              { id: 'Football', label: 'Calcio', icon: '⚽' },
              { id: 'Basketball', label: 'Basket', icon: '🏀' },
              { id: 'Tennis', label: 'Tennis', icon: '🎾' },
              { id: 'Volley', label: 'Volley', icon: '🏐' }
            ].map((sport) => (
              <button 
                key={sport.id}
                onClick={() => setSelectedSport(sport.id as any)}
                className={`px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-[0.15em] border transition-all flex items-center gap-2.5 flex-shrink-0 active:scale-95 ${selectedSport === sport.id ? 'border-[#00FF66] text-[#00FF66] bg-[#00FF66]/15 shadow-[0_0_15px_rgba(0,255,102,0.05)]' : 'border-white/10 text-slate-500 bg-white/5 hover:border-white/20'}`}
              >
                <span className="text-sm drop-shadow-md">{sport.icon}</span>
                <span>{sport.label}</span>
              </button>
            ))}
          </div>

          <button 
            onClick={handleGenerateLuckyTip}
            disabled={loading || loadingRandom || (schedina?.predictions?.length || 0) < 3}
            className="w-full bg-[#00FF66]/5 border border-[#00FF66]/40 hover:bg-[#00FF66]/10 rounded-2xl py-3 flex items-center justify-center gap-3 transition-all active:scale-95 group disabled:opacity-30"
          >
            <span className={`text-xl group-hover:rotate-12 transition-transform ${loadingRandom ? 'animate-bounce' : ''}`}>🎲</span>
            <span className="text-[10px] font-black text-[#00FF66] uppercase tracking-[0.2em]">Genera Combo Oracolo</span>
          </button>
        </div>
      )}

      <main className="p-4 pt-6 space-y-6">
        {activeView === 'home' ? (
          loading ? (
             <div className="flex flex-col items-center justify-center py-40">
                <div className="w-14 h-14 border-4 border-[#00FF66]/10 border-t-[#00FF66] rounded-full animate-spin mb-6 shadow-[0_0_20px_rgba(0,255,102,0.1)]"></div>
                <p className="text-[#00FF66] font-mono text-[10px] uppercase tracking-[0.2em] animate-pulse">Scanning Neural Network...</p>
             </div>
          ) : (
            <div className="space-y-4 animate-fadeIn">
              {randomCombo && !loadingRandom && (
                <div className="relative p-6 rounded-[2.5rem] border-2 border-emerald-400/50 bg-emerald-500/5 shadow-[0_0_40px_rgba(16,185,129,0.1)] mb-8 animate-slideDown overflow-hidden group">
                  <div className="absolute -top-4 -left-4 w-20 h-20 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all"></div>
                  <div className="flex justify-between items-center mb-4 relative z-10">
                    <h3 className="text-lg font-black text-white italic uppercase tracking-tighter leading-none">{randomCombo.title}</h3>
                    <button onClick={() => setRandomCombo(null)} className="text-slate-500 hover:text-white transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  </div>
                  <div className="space-y-3 mb-5 relative z-10">
                    {randomCombo.predictions.map((p, i) => (
                      <div key={i} className="flex justify-between text-[10px] font-mono text-slate-300 border-b border-white/5 pb-2">
                        <span className="truncate max-w-[75%]">{p.event} <span className="text-emerald-400 font-bold ml-1">[{p.bet}]</span></span>
                        <span className="font-black text-white">@{p.odds.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-end relative z-10">
                    <div>
                      <p className="text-[8px] text-slate-500 uppercase font-mono tracking-widest mb-1">Total Odds Surprise</p>
                      <p className="text-3xl font-black text-emerald-400 tracking-tighter">@{randomCombo.totalOdds.toFixed(2)}</p>
                    </div>
                    <button 
                      onClick={() => handlePlayCombo(randomCombo)}
                      className="px-6 py-3 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                    >
                      Salva
                    </button>
                  </div>
                </div>
              )}

              {loadingRandom && (
                <div className="p-8 rounded-[2.5rem] border-2 border-emerald-400/20 bg-emerald-500/5 flex flex-col items-center justify-center mb-8 animate-pulse">
                   <div className="text-2xl mb-2 animate-spin">🔮</div>
                   <p className="text-[10px] text-emerald-400 font-mono uppercase tracking-widest font-black">Interrogando l'Oracolo...</p>
                </div>
              )}

              {error && (
                <div className="p-8 glass-morphism rounded-3xl border border-red-500/30 text-center">
                  <p className="text-red-400 font-mono text-xs uppercase mb-4">{error}</p>
                  <button onClick={loadData} className="px-6 py-2 bg-red-500/20 text-red-400 rounded-xl border border-red-500/40 text-[10px] font-black uppercase">Riprova Sync</button>
                </div>
              )}

              {filteredPredictions.length > 0 ? (
                filteredPredictions.map((p, idx) => (
                  <MatchCard key={idx} prediction={p} onPlay={handlePlayBet} />
                ))
              ) : !loading && !error && (
                <div className="flex flex-col items-center justify-center py-32 text-center">
                  <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center mb-6 border border-white/10 shadow-xl">
                    <span className="text-3xl grayscale opacity-30">📡</span>
                  </div>
                  <h3 className="text-white font-black text-sm uppercase italic tracking-widest">Nessun Segnale</h3>
                  <p className="text-slate-500 font-mono text-[9px] uppercase tracking-[0.25em] mt-2 max-w-[200px] leading-relaxed">Nessun match rilevato per i parametri selezionati</p>
                </div>
              )}
            </div>
          )
        ) : activeView === 'combos' ? (
          <div className="space-y-8 animate-fadeIn">
            <div className="px-2">
              <h2 className="text-white font-black uppercase tracking-tighter text-3xl italic">Neural Combos</h2>
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.3em] mt-1">Sistemi multi-sport sincronizzati</p>
            </div>
            {schedina?.dailyCombos.map((combo, idx) => (
              <div key={idx} className={`glass-morphism p-9 rounded-[3.5rem] border-2 relative overflow-hidden transition-all hover:scale-[1.01] active:scale-[0.99] ${combo.type === 'Safe' ? 'border-[#00FF66]/30 shadow-[0_0_40px_rgba(0,255,102,0.08)]' : 'border-purple-500/30 shadow-[0_0_40px_rgba(168,85,247,0.08)]'}`}>
                {combo.type === 'HighRisk' && <div className="absolute top-0 right-0 bg-purple-600 text-white px-6 py-2 rounded-bl-[2rem] text-[9px] font-black uppercase tracking-widest shadow-lg">PROTOCOL_X</div>}
                <h3 className="text-2xl font-black text-white italic mb-6 pr-12 leading-tight">{combo.title}</h3>
                <div className="space-y-5 mb-8">
                  {combo.predictions.map((p, i) => (
                    <div key={i} className="flex justify-between items-center border-b border-white/5 pb-3">
                      <div className="flex flex-col max-w-[70%]">
                        <span className="text-[9px] text-slate-500 font-mono uppercase font-black tracking-tighter truncate">{p.event || 'Evento Ignoto'}</span>
                        <span className="text-[11px] text-slate-300 font-mono font-medium truncate">{p.bet}</span>
                      </div>
                      <span className="text-[#00FF66] font-black bg-[#00FF66]/5 px-2 py-1 rounded-lg text-[11px] font-mono">@{p.odds.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-end border-t border-white/10 pt-6">
                  <div>
                    <p className="text-[9px] text-slate-500 uppercase font-mono tracking-[0.2em] mb-1.5">Quota Totale</p>
                    <p className={`text-4xl font-black font-poppins tracking-tighter ${combo.type === 'Safe' ? 'text-[#00FF66]' : 'text-purple-400'}`}>@{combo.totalOdds.toFixed(2)}</p>
                  </div>
                  <button 
                    onClick={() => handlePlayCombo(combo)}
                    className="px-7 py-4 bg-[#00FF66] text-[#050607] rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-90 shadow-sm"
                  >
                    Gioca Combo
                  </button>
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
          <div className="p-8 text-center animate-fadeIn pb-32">
             <div className="w-24 h-24 bg-[#00FF66]/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-[#00FF66]/20 shadow-[0_0_30px_rgba(0,255,102,0.1)]">
                <span className="text-4xl grayscale">👤</span>
             </div>
             <p className="text-slate-500 uppercase font-mono text-[10px] tracking-[0.3em]">Neural Identity Profile</p>
             <p className="text-white font-black mt-3 text-lg italic uppercase tracking-tighter">Premium Access Enabled</p>
             <p className="text-[9px] text-slate-600 font-mono mt-1 uppercase tracking-widest">v4.2.5 Mobile Native Build</p>
          </div>
        )}
      </main>

      <ChatBot />

      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto glass-morphism border-t border-[#00FF66]/15 p-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] flex justify-around items-center z-50 rounded-t-[3rem] shadow-[0_-15px_40px_rgba(0,0,0,0.9)]">
        <button onClick={() => setActiveView('home')} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeView === 'home' ? 'text-[#00FF66] scale-110 drop-shadow-[0_0_10px_#00FF66]' : 'text-slate-600 opacity-60 hover:opacity-100'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
          <span className="text-[9px] font-black uppercase tracking-tighter">Events</span>
        </button>
        <button onClick={() => setActiveView('combos')} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeView === 'combos' ? 'text-[#00FF66] scale-110 drop-shadow-[0_0_10px_#00FF66]' : 'text-slate-600 opacity-60 hover:opacity-100'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M2 12h20"/><path d="m17 7 5 5-5 5M7 17l-5-5 5-5"/></svg>
          <span className="text-[9px] font-black uppercase tracking-tighter">Combos</span>
        </button>
        <button onClick={() => setActiveView('history')} className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeView === 'history' ? 'text-[#00FF66] scale-110 drop-shadow-[0_0_10px_#00FF66]' : 'text-slate-600 opacity-60 hover:opacity-100'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"/><path d="m9 12 2 2 4-4"/></svg>
          <span className="text-[9px] font-black uppercase tracking-tighter">History</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
