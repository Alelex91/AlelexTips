
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BettingService } from './services/geminiService';
import { Schedina, PlayedSchedina, SportType, Prediction } from './types';
import MatchCard from './components/MatchCard';
import ChatBot from './components/ChatBot';
import HistorySection from './components/HistorySection';
import AccessPage from './components/AccessPage';
import IOSInstallGuide from './components/IOSInstallGuide';

const SPORTS_FILTERS = [
  { id: 'All', label: 'Tutti', icon: 'https://img.icons8.com/neon/96/matrix.png' },
  { id: 'Football', label: 'Calcio', icon: 'https://img.icons8.com/neon/96/football.png' },
  { id: 'Basketball', label: 'Basket', icon: 'https://img.icons8.com/neon/96/basketball.png' },
  { id: 'Tennis', label: 'Tennis', icon: 'https://img.icons8.com/neon/96/tennis-ball.png' },
  { id: 'F1', label: 'Motori', icon: 'https://img.icons8.com/neon/96/race-car.png' }
];

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'home' | 'history'>('home');
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [schedina, setSchedina] = useState<Schedina | null>(null);
  const [history, setHistory] = useState<PlayedSchedina[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSport, setSelectedSport] = useState<SportType>('All');

  const bettingService = useMemo(() => new BettingService(), []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await bettingService.generateDailySchedina();
      setSchedina(data);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }, [bettingService]);

  useEffect(() => {
    const authorized = localStorage.getItem('neotip_authorized') === 'true';
    setIsAuthorized(authorized);
    const saved = localStorage.getItem('neotip_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  useEffect(() => { if (isAuthorized) loadData(); }, [isAuthorized, loadData]);

  const filteredPredictions = useMemo(() => {
    if (!schedina) return [];
    if (selectedSport === 'All') return schedina.predictions;
    return schedina.predictions.filter(p => p.match.sport.toLowerCase().includes(selectedSport.toLowerCase()));
  }, [schedina, selectedSport]);

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
    alert("Scommessa salvata nel nodo History!");
  };

  if (!isAuthorized) return <AccessPage onAccessGranted={() => setIsAuthorized(true)} />;

  return (
    <div className="flex flex-col min-h-screen w-full animate-fadeIn bg-[#050607]">
      <IOSInstallGuide />
      
      <header className="sticky top-0 z-50 glass-morphism border-b border-[#00FF66]/10 safe-top">
        <div className="w-full px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#00FF66]/10 border border-[#00FF66]/30 rounded-xl flex items-center justify-center">
              <span className="text-[#00FF66] font-black text-lg italic">N</span>
            </div>
            <h1 className="text-lg font-black text-white italic tracking-tighter">NEOTIP v5.2</h1>
          </div>
          <button onClick={loadData} disabled={loading} className="p-2.5 bg-[#00FF66]/10 rounded-xl text-[#00FF66]">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={loading ? 'animate-spin' : ''}><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
          </button>
        </div>
      </header>

      <main className="flex-1 w-full px-6 py-6 space-y-8 pb-32">
        {activeView === 'home' ? (
          <>
            {/* Sport Filters - Lazy Loaded Icons */}
            <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
              {SPORTS_FILTERS.map((sport) => (
                <button 
                  key={sport.id} 
                  onClick={() => setSelectedSport(sport.id as SportType)} 
                  className={`flex flex-col items-center gap-2 min-w-[70px] p-3 rounded-3xl border transition-all ${selectedSport === sport.id ? 'bg-[#00FF66]/10 border-[#00FF66]' : 'bg-white/5 border-transparent opacity-40'}`}
                >
                  <img src={sport.icon} alt={sport.label} className="w-8 h-8" loading="lazy" />
                  <span className="text-[8px] font-black uppercase text-white">{sport.label}</span>
                </button>
              ))}
            </div>

            {loading ? (
              <div className="py-32 text-center space-y-6">
                <div className="w-16 h-16 border-4 border-[#00FF66]/20 border-t-[#00FF66] rounded-full animate-spin mx-auto"></div>
                <p className="text-[#00FF66] font-mono text-[9px] font-black uppercase tracking-[0.5em] animate-pulse">Sincronizzazione Deep Node...</p>
              </div>
            ) : error ? (
              <div className="py-20 text-center glass-morphism rounded-[2rem] p-8 border-red-500/20">
                <p className="text-red-400 font-mono text-[10px] uppercase mb-6">{error}</p>
                <button onClick={loadData} className="px-6 py-3 bg-red-500/10 text-red-500 rounded-xl text-[9px] font-black uppercase">Retry Connection</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPredictions.map((p, i) => <MatchCard key={p.match.id || i} prediction={p} onPlay={handlePlayBet} />)}
              </div>
            )}
          </>
        ) : (
          <HistorySection history={history} onDelete={(id) => setHistory(history.filter(h => h.id !== id))} onUpdateStatus={(id, s) => setHistory(history.map(h => h.id === id ? {...h, status: s} : h))} />
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 glass-morphism border-t border-[#00FF66]/10 px-10 py-5 flex justify-around items-center z-50 rounded-t-[2rem] safe-bottom">
        <button onClick={() => setActiveView('home')} className={`flex flex-col items-center gap-1 ${activeView === 'home' ? 'text-[#00FF66]' : 'text-slate-600'}`}>
          <span className="text-xl">🏠</span>
          <span className="text-[8px] font-black uppercase">Oracle</span>
        </button>
        <button onClick={() => setActiveView('history')} className={`flex flex-col items-center gap-1 ${activeView === 'history' ? 'text-[#00FF66]' : 'text-slate-600'}`}>
          <span className="text-xl">📊</span>
          <span className="text-[8px] font-black uppercase">History</span>
        </button>
      </nav>
      <ChatBot />
    </div>
  );
};

export default App;
