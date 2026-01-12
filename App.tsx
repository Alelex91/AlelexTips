
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
  const [selectedDay, setSelectedDay] = useState<'Today' | 'Tomorrow'>('Today');

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
      setError(err.message || "Errore sincronizzazione.");
    } finally { setLoading(false); }
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
      stake,
      status: 'Pending',
      dailyCombos: []
    };
    setHistory(prev => [newBet, ...prev]);
  };

  useEffect(() => { if (isAuthorized) loadData(); }, [isAuthorized]);

  const filteredPredictions = useMemo(() => {
    if (!schedina || !schedina.predictions) return [];
    const targetISO = selectedDay === 'Today' ? dates.todayISO : dates.tomorrowISO;
    return schedina.predictions.filter(p => {
      const sportMatch = selectedSport === 'All' || p.match.sport === selectedSport;
      const dayMatch = p.match.date === targetISO || p.match.date.includes(targetISO);
      return sportMatch && dayMatch;
    });
  }, [schedina, selectedSport, selectedDay, dates]);

  if (!isAuthorized) return <AccessPage onAccessGranted={() => setIsAuthorized(true)} />;

  return (
    <div className="min-h-screen bg-[#050607] pb-24 md:pb-8 animate-fadeIn w-full overflow-x-hidden">
      <IOSInstallGuide />
      
      {/* HEADER FULL WIDTH */}
      <header className="sticky top-0 z-50 glass-morphism border-b border-[#00FF66]/10 py-5 px-6 md:px-10 flex justify-between items-center w-full">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#00FF66]/10 border border-[#00FF66]/30 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(0,255,102,0.1)]">
            <span className="text-[#00FF66] font-black text-2xl italic">N</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-3xl font-black text-white italic tracking-tighter">NEOTIP <span className="text-[#00FF66] text-xs font-mono not-italic ml-2 uppercase opacity-60">Neural Node</span></h1>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex bg-white/5 p-1.5 rounded-[1.5rem] border border-white/5 w-[500px]">
          {(['home', 'combos', 'history'] as View[]).map((v) => (
            <button 
              key={v} 
              onClick={() => setActiveView(v)} 
              className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeView === v ? 'bg-[#00FF66] text-black shadow-[0_0_20px_rgba(0,255,102,0.2)]' : 'text-slate-500 hover:text-white'}`}
            >
              {v === 'home' ? 'Oracle Hub' : v === 'combos' ? 'Neural Combo' : 'History'}
            </button>
          ))}
        </nav>

        <button onClick={loadData} className="p-4 bg-[#00FF66]/10 border border-[#00FF66]/20 rounded-2xl text-[#00FF66] hover:bg-[#00FF66]/20 active:scale-90 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={loading ? 'animate-spin' : ''}><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
        </button>
      </header>

      {/* MAIN CONTENT - NO MAX WIDTH CONSTRAINTS */}
      <main className="w-full px-6 md:px-10 py-10">
        {activeView === 'home' && (
          <div className="space-y-10">
            <div className="flex flex-col xl:flex-row gap-8 items-center justify-between border-b border-white/5 pb-10">
              <div className="flex bg-[#0a0c0e] p-1.5 rounded-2xl border border-white/5 w-full xl:w-96 shadow-xl">
                <button onClick={() => setSelectedDay('Today')} className={`flex-1 py-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${selectedDay === 'Today' ? 'bg-[#00FF66] text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}>OGGI</button>
                <button onClick={() => setSelectedDay('Tomorrow')} className={`flex-1 py-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${selectedDay === 'Tomorrow' ? 'bg-[#00FF66] text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}>DOMANI</button>
              </div>
              
              <div className="flex gap-3 overflow-x-auto no-scrollbar w-full xl:w-auto pb-2 xl:pb-0">
                {['All', 'Football', 'Basketball', 'Tennis', 'Volley'].map((s) => (
                  <button 
                    key={s} 
                    onClick={() => setSelectedSport(s as any)} 
                    className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase border tracking-widest transition-all flex-shrink-0 ${selectedSport === s ? 'border-[#00FF66] text-[#00FF66] bg-[#00FF66]/10 shadow-[0_0_15px_rgba(0,255,102,0.1)]' : 'border-white/10 text-slate-500 bg-white/5 hover:border-white/20'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-60">
                <div className="w-20 h-20 border-4 border-[#00FF66]/10 border-t-[#00FF66] rounded-full animate-spin mb-8 shadow-[0_0_40px_rgba(0,255,102,0.1)]"></div>
                <p className="text-[#00FF66] font-mono text-sm uppercase tracking-[0.6em] animate-pulse font-black">Syncing Global Matrix...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-8">
                {error ? (
                   <div className="col-span-full p-24 glass-morphism rounded-[4rem] border-red-500/20 text-center shadow-2xl">
                    <p className="text-red-400 font-mono text-xs uppercase mb-8 tracking-widest opacity-80">{error}</p>
                    <button onClick={loadData} className="px-12 py-5 bg-red-500/10 text-red-400 rounded-2xl border border-red-500/30 font-black uppercase text-[10px] tracking-widest hover:bg-red-500/20 transition-all">Retry Synchronization</button>
                  </div>
                ) : filteredPredictions.map((p, i) => (
                  <MatchCard key={i} prediction={p} onPlay={handlePlayBet} />
                ))}
                
                {filteredPredictions.length === 0 && !error && (
                  <div className="col-span-full py-80 text-center opacity-20">
                    <p className="text-slate-500 font-mono text-sm uppercase tracking-[1em] font-black">NO_NEURAL_DATA_FOUND</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeView === 'combos' && (
           <div className="space-y-16">
            <h2 className="text-6xl font-black text-white italic tracking-tighter">Neural Combos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-10">
              {schedina?.dailyCombos.map((c, i) => (
                <div key={i} className="glass-morphism p-14 rounded-[4.5rem] border-[#00FF66]/20 flex flex-col justify-between hover:border-[#00FF66]/50 transition-all shadow-2xl group">
                  <div>
                    <div className="flex justify-between items-center mb-10">
                      <h3 className="text-4xl font-black text-white italic group-hover:text-[#00FF66] transition-colors tracking-tighter">{c.title}</h3>
                      <span className="px-5 py-2.5 bg-[#00FF66]/20 text-[#00FF66] rounded-full text-[10px] font-black uppercase tracking-widest">{c.type}</span>
                    </div>
                    <div className="space-y-5 mb-14">
                      {c.predictions.map((p, pi) => (
                        <div key={pi} className="flex justify-between text-sm text-slate-400 border-b border-white/5 pb-5">
                          <span className="font-mono tracking-tight">{p.event}</span>
                          <span className="text-[#00FF66] font-black ml-4">@{p.odds.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[11px] text-slate-500 font-black uppercase mb-2 tracking-widest">Total Hub Odds</p>
                      <p className="text-6xl font-black text-[#00FF66] tracking-tighter">@{c.totalOdds.toFixed(2)}</p>
                    </div>
                    <button className="px-14 py-6 bg-[#00FF66] text-black rounded-3xl font-black uppercase text-xs tracking-widest shadow-[0_0_40px_rgba(0,255,102,0.4)] active:scale-95 transition-all">Play Combo</button>
                  </div>
                </div>
              ))}
            </div>
           </div>
        )}

        {activeView === 'history' && (
          <div className="w-full max-w-7xl mx-auto">
            <HistorySection history={history} onDelete={(id)=>setHistory(h=>h.filter(x=>x.id!==id))} onUpdateStatus={(id,s)=>setHistory(h=>h.map(x=>x.id===id?{...x,status:s}:x))} />
          </div>
        )}
      </main>

      <ChatBot />

      {/* MOBILE NAV - IMPROVED */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden glass-morphism border-t border-[#00FF66]/10 px-8 py-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] flex justify-around items-center z-50 rounded-t-[3.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
        {(['home', 'combos', 'history'] as View[]).map((v) => (
          <button key={v} onClick={() => setActiveView(v)} className={`flex flex-col items-center gap-2.5 transition-all ${activeView === v ? 'text-[#00FF66] scale-110' : 'text-slate-600'}`}>
            <div className={`p-2 rounded-xl ${activeView === v ? 'bg-[#00FF66]/10' : ''}`}>
              {v === 'home' ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
              ) : v === 'combos' ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2v20M2 12h20"/><path d="m17 7 5 5-5 5M7 17l-5-5 5-5"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"/><path d="m9 12 2 2 4-4"/></svg>
              )}
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{v}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
