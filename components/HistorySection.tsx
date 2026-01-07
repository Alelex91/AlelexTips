
import React, { useState, useMemo } from 'react';
import { PlayedSchedina, BetStatus } from '../types';

interface Props {
  history: PlayedSchedina[];
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: 'Won' | 'Lost') => void;
}

type FilterStatus = 'All' | BetStatus;

const HistorySection: React.FC<Props> = ({ history, onDelete, onUpdateStatus }) => {
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('All');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filteredHistory = useMemo(() => {
    return history.filter(bet => {
      // Filtro Stato
      const matchStatus = statusFilter === 'All' || bet.status === statusFilter;
      
      // Filtro Date
      const betDate = new Date(bet.date).getTime();
      const start = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null;
      const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : null;
      
      const matchStart = !start || betDate >= start;
      const matchEnd = !end || betDate <= end;

      return matchStatus && matchStart && matchEnd;
    });
  }, [history, statusFilter, startDate, endDate]);

  const resetFilters = () => {
    setStatusFilter('All');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="space-y-4 pb-10 animate-fadeIn">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
          <h2 className="text-xl font-bold text-white">Cronologia Scommesse</h2>
        </div>
        <button 
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className={`p-2 rounded-lg border transition-all ${isFilterOpen ? 'bg-emerald-500 text-slate-900 border-emerald-500' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
        </button>
      </div>

      {/* Pannello Filtri */}
      {isFilterOpen && (
        <div className="glass-morphism p-4 rounded-2xl border border-emerald-500/20 space-y-4 animate-slideDown">
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase mb-2">Stato Scommessa</p>
            <div className="flex flex-wrap gap-2">
              {(['All', 'Pending', 'Won', 'Lost'] as FilterStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${
                    statusFilter === status 
                      ? 'bg-emerald-500 text-slate-900 border-emerald-500' 
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {status === 'All' ? 'TUTTE' : status === 'Pending' ? 'IN CORSO' : status === 'Won' ? 'VINTE' : 'PERSE'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase mb-2">Dal</p>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase mb-2">Al</p>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button 
            onClick={resetFilters}
            className="w-full py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-white transition-colors"
          >
            Reset Filtri
          </button>
        </div>
      )}

      {filteredHistory.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-6 glass-morphism rounded-2xl border border-dashed border-slate-700">
          <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600">
              <path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/>
            </svg>
          </div>
          <h3 className="text-lg font-bold text-white">Nessun risultato</h3>
          <p className="text-slate-500 text-xs mt-2">Nessuna scommessa trovata con i filtri selezionati.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((bet) => (
            <div key={bet.id} className="glass-morphism rounded-2xl p-4 border border-slate-700/50 hover:border-slate-600 transition-all group animate-fadeIn">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">
                    {new Date(bet.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-sm font-bold text-white">{bet.predictions.length} Eventi • Quota @{bet.totalOdds.toFixed(2)}</p>
                </div>
                <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase border ${
                  bet.status === 'Won' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                  bet.status === 'Lost' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                  'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                }`}>
                  {bet.status === 'Pending' ? 'In Corso' : bet.status === 'Won' ? 'Vinta' : 'Persa'}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                {bet.predictions.map((p, i) => (
                  <div key={i} className="text-xs text-slate-400 flex justify-between group-hover:text-slate-300 transition-colors">
                    <span>{p.match.homeTeam} - {p.match.awayTeam}</span>
                    <span className="text-emerald-500 font-bold">{p.bet}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-end pt-3 border-t border-slate-800">
                <div>
                  <p className="text-[9px] text-slate-500 uppercase font-bold">Puntata: €{bet.stake}</p>
                  <p className={`text-lg font-black ${bet.status === 'Won' ? 'text-emerald-400' : bet.status === 'Lost' ? 'text-red-400' : 'text-white'}`}>
                    {bet.status === 'Won' ? `+€${(bet.totalOdds * bet.stake).toFixed(2)}` : 
                     bet.status === 'Lost' ? `-€${bet.stake.toFixed(2)}` : 
                     `Pot: €${(bet.totalOdds * bet.stake).toFixed(2)}`}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  {bet.status === 'Pending' && (
                    <>
                      <button 
                        onClick={() => onUpdateStatus(bet.id, 'Won')}
                        className="p-2 bg-emerald-500/20 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-slate-900 transition-all active:scale-90"
                        title="Segna come vinta"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                      </button>
                      <button 
                        onClick={() => onUpdateStatus(bet.id, 'Lost')}
                        className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all active:scale-90"
                        title="Segna come persa"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                      </button>
                    </>
                  )}
                  <button 
                    onClick={() => onDelete(bet.id)}
                    className="p-2 bg-slate-800 text-slate-400 rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-all active:scale-90"
                    title="Elimina"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default HistorySection;
