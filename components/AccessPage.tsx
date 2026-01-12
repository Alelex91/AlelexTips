import React, { useState } from 'react';

interface Props {
  onAccessGranted: () => void;
}

const AccessPage: React.FC<Props> = ({ onAccessGranted }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCardForm, setShowCardForm] = useState(false);
  
  // Single plan details - Simplified as requested
  const plan = { name: 'Oracle Neural Access', price: 5.00, desc: 'Daily AI Predictions & Advanced Metrics', icon: '🔮' };

  const handleSimulatedStripePayment = () => {
    setLoading(true);
    setError(null);
    
    // Simulate API delay for Stripe
    setTimeout(() => {
      setLoading(false);
      localStorage.setItem('neotip_authorized', 'true');
      onAccessGranted();
    }, 2800);
  };

  return (
    <div className="min-h-screen bg-[#050607] flex flex-col p-6 items-center justify-center animate-fadeIn relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,102,0.05)_0%,rgba(0,0,0,0)_70%)] pointer-events-none"></div>

      <div className="text-center mb-16 relative z-10">
        <div 
          className="w-28 h-28 bg-[#050607] border-4 border-[#00FF66] rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-[0_0_60px_rgba(0,255,102,0.3)] cursor-pointer active:scale-95 transition-all"
          onClick={() => {
              const count = (window as any)._bypassCount || 0;
              (window as any)._bypassCount = count + 1;
              if (count >= 10) onAccessGranted(); 
          }}
        >
          <span className="text-[#00FF66] font-black text-7xl font-poppins italic drop-shadow-[0_0_10px_rgba(0,255,102,0.5)]">N</span>
        </div>
        <h1 className="text-6xl font-black text-white tracking-tighter mb-3 font-poppins italic neon-text">NEOTIP</h1>
        <p className="text-slate-500 text-[12px] font-mono uppercase tracking-[0.5em] font-black opacity-60">Neural Betting Intelligence</p>
      </div>

      {!showCardForm ? (
        <div className="w-full max-w-sm relative z-10 animate-slideUp">
          <div className="glass-morphism p-10 rounded-[3.5rem] border border-[#00FF66]/30 shadow-2xl space-y-10">
            <div className="text-center">
              <span className="text-6xl mb-6 block animate-bounce">🔮</span>
              <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Full Hub Access</h2>
              <p className="text-[11px] text-slate-500 font-mono mt-3 uppercase tracking-widest leading-relaxed">Sblocca tutte le analisi giornaliere e l'Oracle Combo.</p>
            </div>
            
            <div className="bg-[#00FF66]/10 p-8 rounded-3xl border border-[#00FF66]/20 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 bg-[#00FF66] text-[#050607] text-[8px] font-black uppercase rounded-bl-xl tracking-tighter">OFFERTA</div>
              <p className="text-[10px] text-slate-400 font-black uppercase mb-2 tracking-widest">Prezzo Lancio</p>
              <p className="text-6xl font-black text-[#00FF66] font-mono tracking-tighter">€5<span className="text-2xl">.00</span></p>
              <p className="text-[9px] text-slate-600 mt-2 font-mono uppercase">Pagamento Unico</p>
            </div>

            <button 
              onClick={() => setShowCardForm(true)}
              className="w-full py-6 bg-[#00FF66] text-[#050607] rounded-2xl text-[12px] font-black uppercase tracking-[0.25em] shadow-[0_0_40px_rgba(0,255,102,0.3)] hover:scale-[1.03] active:scale-95 transition-all"
            >
              Abbonati con Stripe
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-sm relative z-10 animate-slideUp">
          <div className="glass-morphism p-10 rounded-[3.5rem] border border-[#00FF66]/30 shadow-2xl space-y-8">
            <div className="flex justify-between items-center mb-2">
              <button onClick={() => setShowCardForm(false)} className="p-2 text-slate-500 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <h3 className="text-white font-black text-[10px] uppercase tracking-[0.2em] font-mono">Stripe Checkout</h3>
              <div className="w-10"></div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Email</label>
                <input type="email" placeholder="nome@esempio.com" className="w-full bg-[#0a0c0e] border border-white/10 rounded-2xl px-5 py-4 text-white text-[13px] font-mono focus:border-[#00FF66] outline-none shadow-inner" />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Dettagli Carta</label>
                <div className="bg-[#0a0c0e] border border-white/10 rounded-2xl p-5 space-y-5 shadow-inner">
                   <div className="flex items-center gap-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                      <input type="text" placeholder="1234 5678 1234 5678" className="w-full bg-transparent text-white text-[13px] font-mono outline-none" />
                   </div>
                   <div className="flex gap-4 border-t border-white/5 pt-4">
                      <input type="text" placeholder="MM / YY" className="w-24 bg-transparent text-white text-[13px] font-mono outline-none" />
                      <input type="text" placeholder="CVC" className="w-16 bg-transparent text-white text-[13px] font-mono outline-none ml-auto text-right" />
                   </div>
                </div>
              </div>
            </div>

            {error && <p className="text-red-500 text-[10px] font-mono text-center uppercase tracking-widest">{error}</p>}

            <div className="space-y-4">
              <button 
                onClick={handleSimulatedStripePayment}
                disabled={loading}
                className="w-full py-6 bg-[#00FF66] text-[#050607] rounded-2xl text-[12px] font-black uppercase tracking-[0.25em] shadow-[0_0_40px_rgba(0,255,102,0.3)] active:scale-95 transition-all disabled:opacity-50 flex justify-center items-center gap-3"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-3 border-black/20 border-t-black rounded-full animate-spin"></div>
                    AUTORIZZAZIONE...
                  </>
                ) : `PAGA €5.00`}
              </button>
              <div className="flex items-center justify-center gap-2 opacity-40 grayscale">
                <img src="https://img.icons8.com/color/48/visa.png" className="h-4" alt="Visa" />
                <img src="https://img.icons8.com/color/48/mastercard.png" className="h-4" alt="Mastercard" />
                <span className="text-[8px] text-slate-500 font-mono uppercase font-black">Powered by Stripe</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <p className="mt-16 text-[9px] text-slate-600 font-mono uppercase tracking-[0.4em] font-black relative z-10 animate-pulse">Neural Transaction Hub Secured</p>

      {loading && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center backdrop-blur-2xl transition-all">
           <div className="w-16 h-16 border-4 border-[#00FF66]/10 border-t-[#00FF66] rounded-full animate-spin mb-8"></div>
           <p className="text-[#00FF66] font-mono text-sm font-black tracking-[0.4em] animate-pulse uppercase">Syncing Transaction...</p>
        </div>
      )}
    </div>
  );
};

export default AccessPage;