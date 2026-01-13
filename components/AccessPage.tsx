
import React, { useState } from 'react';

interface Props {
  onAccessGranted: () => void;
}

type AccessView = 'main' | 'stripe' | 'admin';

const AccessPage: React.FC<Props> = ({ onAccessGranted }) => {
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<AccessView>('main');
  
  // Stati per il login riservato
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);

  const handleStripePayment = () => {
    setLoading(true);
    // Simula transazione sicura Stripe
    setTimeout(() => {
      setLoading(false);
      localStorage.setItem('neotip_authorized', 'true');
      onAccessGranted();
    }, 2000);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError(false);

    // Pulizia input
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Validazione credenziali richieste
    setTimeout(() => {
      if (cleanEmail === 'alelex91@gmail.com' && cleanPassword === 'alessandro91') {
        localStorage.setItem('neotip_authorized', 'true');
        onAccessGranted();
      } else {
        setLoginError(true);
        setLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#050607] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Effect */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,102,0.1)_0%,rgba(0,0,0,0)_70%)] pointer-events-none"></div>

      <div className="text-center mb-10 relative z-10 animate-fadeIn">
        <div className="w-24 h-24 border-2 border-[#00FF66] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_50px_rgba(0,255,102,0.2)] bg-black">
          <span className="text-[#00FF66] font-black text-5xl italic">N</span>
        </div>
        <h1 className="text-5xl font-black text-white italic tracking-tighter mb-2">NEOTIP</h1>
        <p className="text-[#00FF66] font-mono text-[8px] uppercase tracking-[0.4em] font-bold opacity-60">Neural Node Access</p>
      </div>

      {view === 'main' && (
        <div className="w-full max-w-sm relative z-10 animate-slideUp">
          <div className="glass-morphism p-8 rounded-[2.5rem] border border-[#00FF66]/20 shadow-2xl space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-black text-white uppercase italic">Sblocca l'Oracolo</h2>
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest leading-relaxed">Ottieni l'accesso completo ai pronostici IA e alle combo neurali.</p>
            </div>
            
            <div className="bg-[#00FF66]/5 p-6 rounded-2xl border border-[#00FF66]/10 text-center">
              <p className="text-[9px] text-slate-400 font-black uppercase mb-1">Pass 24h</p>
              <p className="text-5xl font-black text-[#00FF66] font-mono tracking-tighter">€5<span className="text-xl">.00</span></p>
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => setView('stripe')}
                className="w-full py-5 bg-[#00FF66] text-[#050607] rounded-xl text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(0,255,102,0.2)] hover:scale-[1.02] active:scale-95 transition-all"
              >
                Paga con Stripe
              </button>

              <button 
                onClick={() => setView('admin')}
                className="w-full py-4 bg-white/5 border border-white/10 text-white/40 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Area Riservata (Credenziali)
              </button>
            </div>
          </div>
        </div>
      )}

      {view === 'stripe' && (
        <div className="w-full max-w-sm relative z-10 animate-slideUp">
          <div className="glass-morphism p-8 rounded-[2.5rem] border border-[#00FF66]/20 shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <button onClick={() => setView('main')} className="p-2 text-slate-500 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <h3 className="text-white font-black text-[9px] uppercase tracking-widest font-mono">Checkout Sicuro</h3>
              <div className="w-10"></div>
            </div>

            <div className="space-y-4">
              <input type="email" placeholder="Email" className="w-full bg-[#0a0c0e] border border-white/10 rounded-xl px-4 py-3 text-white text-[12px] font-mono outline-none focus:border-[#00FF66]" />
              <div className="bg-[#0a0c0e] border border-white/10 rounded-xl p-4 space-y-4">
                 <input type="text" placeholder="Numero Carta" className="w-full bg-transparent text-white text-[12px] font-mono outline-none" />
                 <div className="flex gap-4 border-t border-white/5 pt-3">
                    <input type="text" placeholder="MM/YY" className="w-20 bg-transparent text-white text-[12px] font-mono outline-none" />
                    <input type="text" placeholder="CVC" className="w-12 bg-transparent text-white text-[12px] font-mono outline-none ml-auto" />
                 </div>
              </div>
            </div>

            <button 
              onClick={handleStripePayment}
              disabled={loading}
              className="w-full py-5 bg-[#00FF66] text-[#050607] rounded-xl text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(0,255,102,0.2)]"
            >
              {loading ? 'ELABORAZIONE...' : 'PAGA €5.00'}
            </button>
          </div>
        </div>
      )}

      {view === 'admin' && (
        <div className="w-full max-w-sm relative z-10 animate-slideUp">
          <form onSubmit={handleAdminLogin} className="glass-morphism p-8 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <button type="button" onClick={() => setView('main')} className="p-2 text-slate-500 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <h3 className="text-[#00FF66] font-black text-[9px] uppercase tracking-widest font-mono">Login Riservato</h3>
              <div className="w-10"></div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[8px] text-slate-500 font-black uppercase tracking-widest ml-1">Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@neotip.node" 
                  className="w-full bg-[#0a0c0e] border border-white/10 rounded-xl px-4 py-3 text-white text-[12px] font-mono outline-none focus:border-[#00FF66]" 
                  required
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[8px] text-slate-500 font-black uppercase tracking-widest ml-1">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full bg-[#0a0c0e] border border-white/10 rounded-xl px-4 py-3 text-white text-[12px] font-mono outline-none focus:border-[#00FF66]" 
                  required
                />
              </div>

              {loginError && (
                <p className="text-red-500 font-mono text-[8px] uppercase tracking-widest text-center animate-pulse">
                  Errore: Dati non corretti.
                </p>
              )}
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-white/5 border border-white/20 text-white rounded-xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-[#00FF66] hover:text-black hover:border-[#00FF66] transition-all"
            >
              {loading ? 'ACCESSO...' : 'ACCEDI'}
            </button>
          </form>
        </div>
      )}

      <p className="mt-12 text-[8px] text-slate-700 font-mono uppercase tracking-[0.3em] font-black opacity-50">Secured by Stripe & Neural Node</p>

      {loading && view !== 'admin' && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex flex-col items-center justify-center backdrop-blur-md">
           <div className="w-12 h-12 border-2 border-[#00FF66]/20 border-t-[#00FF66] rounded-full animate-spin mb-6"></div>
           <p className="text-[#00FF66] font-mono text-[10px] font-black tracking-[0.4em] animate-pulse">SYNCING DATA...</p>
        </div>
      )}
    </div>
  );
};

export default AccessPage;
