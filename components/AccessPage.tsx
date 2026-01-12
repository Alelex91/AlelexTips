
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
    }, 2500);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError(false);

    // Pulizia input: rimuove spazi e trasforma email in minuscolo
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Simulazione controllo credenziali richieste
    setTimeout(() => {
      if (cleanEmail === 'alelex91@gmail.com' && cleanPassword === 'Delpiero10') {
        localStorage.setItem('neotip_authorized', 'true');
        onAccessGranted();
      } else {
        setLoginError(true);
        setLoading(false);
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#050607] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Effetto luce soffusa sullo sfondo */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,102,0.08)_0%,rgba(0,0,0,0)_70%)] pointer-events-none"></div>

      <div className="text-center mb-12 relative z-10">
        <div className="w-32 h-32 border-4 border-[#00FF66] rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-[0_0_80px_rgba(0,255,102,0.3)] bg-black transition-all select-none">
          <span className="text-[#00FF66] font-black text-7xl italic">N</span>
        </div>
        <h1 className="text-6xl font-black text-white italic tracking-tighter mb-4 neon-text">NEOTIP</h1>
        <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.5em] font-black opacity-60">Neural Betting Oracle</p>
      </div>

      {view === 'main' && (
        <div className="w-full max-w-sm relative z-10 animate-slideUp">
          <div className="glass-morphism p-10 rounded-[3.5rem] border border-[#00FF66]/30 shadow-2xl space-y-10">
            <div className="text-center">
              <span className="text-6xl mb-6 block">🔮</span>
              <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Accesso Illimitato</h2>
              <p className="text-[11px] text-slate-500 font-mono mt-3 uppercase tracking-widest leading-relaxed">Sblocca analisi giornaliere e l'Oracle Combo esclusivo.</p>
            </div>
            
            <div className="bg-[#00FF66]/10 p-8 rounded-3xl border border-[#00FF66]/20 text-center relative overflow-hidden">
              <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Prezzo Lancio</p>
              <p className="text-6xl font-black text-[#00FF66] font-mono tracking-tighter">€5<span className="text-2xl">.00</span></p>
              <p className="text-[9px] text-slate-600 mt-2 font-mono uppercase">Pagamento Singolo</p>
            </div>

            <div className="space-y-4">
              <button 
                onClick={() => setView('stripe')}
                className="w-full py-6 bg-[#00FF66] text-[#050607] rounded-2xl text-[12px] font-black uppercase tracking-[0.25em] shadow-[0_0_40px_rgba(0,255,102,0.3)] hover:scale-[1.03] active:scale-95 transition-all"
              >
                Sblocca con Stripe
              </button>

              <button 
                onClick={() => setView('admin')}
                className="w-full py-4 bg-white/5 border border-white/10 text-white/50 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-3"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Accesso Riservato
              </button>
            </div>
          </div>
        </div>
      )}

      {view === 'stripe' && (
        <div className="w-full max-w-sm relative z-10 animate-slideUp">
          <div className="glass-morphism p-10 rounded-[3.5rem] border border-[#00FF66]/30 shadow-2xl space-y-8">
            <div className="flex justify-between items-center mb-2">
              <button onClick={() => setView('main')} className="p-2 text-slate-500 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <h3 className="text-white font-black text-[10px] uppercase tracking-[0.2em] font-mono">Secure Checkout</h3>
              <div className="w-10"></div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Email</label>
                <input type="email" placeholder="email@esempio.it" className="w-full bg-[#0a0c0e] border border-white/10 rounded-2xl px-5 py-4 text-white text-[13px] font-mono focus:border-[#00FF66] outline-none" />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Carta di Credito</label>
                <div className="bg-[#0a0c0e] border border-white/10 rounded-2xl p-5 space-y-5 shadow-inner">
                   <input type="text" placeholder="1234 5678 1234 5678" className="w-full bg-transparent text-white text-[13px] font-mono outline-none" />
                   <div className="flex gap-4 border-t border-white/5 pt-4">
                      <input type="text" placeholder="MM/YY" className="w-24 bg-transparent text-white text-[13px] font-mono outline-none" />
                      <input type="text" placeholder="CVC" className="w-16 bg-transparent text-white text-[13px] font-mono outline-none ml-auto text-right" />
                   </div>
                </div>
              </div>
            </div>

            <button 
              onClick={handleStripePayment}
              disabled={loading}
              className="w-full py-6 bg-[#00FF66] text-[#050607] rounded-2xl text-[12px] font-black uppercase tracking-[0.25em] shadow-[0_0_40px_rgba(0,255,102,0.3)] active:scale-95 transition-all disabled:opacity-50 flex justify-center items-center gap-3"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-3 border-black/20 border-t-black rounded-full animate-spin"></div>
                  ELABORAZIONE...
                </>
              ) : `PAGA €5.00`}
            </button>
            <div className="flex justify-center gap-3 opacity-30 grayscale pt-2">
               <img src="https://img.icons8.com/color/48/visa.png" className="h-4" alt="Visa" />
               <img src="https://img.icons8.com/color/48/mastercard.png" className="h-4" alt="MC" />
            </div>
          </div>
        </div>
      )}

      {view === 'admin' && (
        <div className="w-full max-w-sm relative z-10 animate-slideUp">
          <form onSubmit={handleAdminLogin} className="glass-morphism p-10 rounded-[3.5rem] border border-white/10 shadow-2xl space-y-8">
            <div className="flex justify-between items-center mb-2">
              <button type="button" onClick={() => setView('main')} className="p-2 text-slate-500 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <h3 className="text-[#00FF66] font-black text-[10px] uppercase tracking-[0.2em] font-mono">Terminal Riservato</h3>
              <div className="w-10"></div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Email Personale</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@neotip.node" 
                  className="w-full bg-[#0a0c0e] border border-white/10 rounded-2xl px-5 py-4 text-white text-[13px] font-mono focus:border-[#00FF66] outline-none" 
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Chiave Decriptazione</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full bg-[#0a0c0e] border border-white/10 rounded-2xl px-5 py-4 text-white text-[13px] font-mono focus:border-[#00FF66] outline-none" 
                  required
                />
              </div>

              {loginError && (
                <p className="text-red-500 font-mono text-[9px] uppercase tracking-widest text-center animate-pulse">
                  Errore: Credenziali non riconosciute. Riprova.
                </p>
              )}
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-6 bg-white/10 text-white rounded-2xl text-[12px] font-black uppercase tracking-[0.25em] border border-white/20 hover:bg-[#00FF66] hover:text-[#050607] hover:border-[#00FF66] active:scale-95 transition-all disabled:opacity-50 flex justify-center items-center gap-3"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
                  SINCRONIZZAZIONE...
                </>
              ) : `ACCEDI`}
            </button>
          </form>
        </div>
      )}

      <p className="mt-16 text-[9px] text-slate-600 font-mono uppercase tracking-[0.4em] font-black opacity-40">Secured by Stripe & Neural Node</p>

      {loading && view !== 'admin' && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center backdrop-blur-3xl transition-all">
           <div className="w-16 h-16 border-4 border-[#00FF66]/10 border-t-[#00FF66] rounded-full animate-spin mb-8"></div>
           <p className="text-[#00FF66] font-mono text-xs font-black tracking-[0.5em] animate-pulse uppercase">Syncing Transaction...</p>
        </div>
      )}
    </div>
  );
};

export default AccessPage;
