import React, { useState } from 'react';

interface Props {
  onAccessGranted: () => void;
}

const AccessPage: React.FC<Props> = ({ onAccessGranted }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCardForm, setShowCardForm] = useState(false);
  
  // Single plan details
  const plan = { name: 'Neural Oracle Access', price: 5.00, desc: 'Full Access to Daily AI Betting Insights', icon: '🔮' };

  const handleSimulatedStripePayment = () => {
    setLoading(true);
    setError(null);
    
    // Simulate API delay for Stripe
    setTimeout(() => {
      setLoading(false);
      localStorage.setItem('neotip_authorized', 'true');
      onAccessGranted();
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-[#050607] flex flex-col p-6 items-center justify-center animate-fadeIn relative overflow-hidden">
      {/* Matrix Background Blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#00FF66]/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="text-center mb-12 relative z-10">
        <div 
          className="w-24 h-24 bg-[#050607] border-2 border-[#00FF66] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_50px_rgba(0,255,102,0.2)] cursor-pointer active:scale-95 transition-transform"
          onClick={() => {
              const count = (window as any)._bypassCount || 0;
              (window as any)._bypassCount = count + 1;
              if (count >= 7) onAccessGranted(); 
          }}
        >
          <span className="text-[#00FF66] font-black text-6xl font-poppins italic">N</span>
        </div>
        <h1 className="text-5xl font-black text-white tracking-tighter mb-2 font-poppins italic neon-text">NEOTIP</h1>
        <p className="text-slate-500 text-[11px] font-mono uppercase tracking-[0.4em] font-black">Neural Betting Oracle</p>
      </div>

      {!showCardForm ? (
        <div className="w-full max-w-sm relative z-10 animate-slideUp">
          <div className="glass-morphism p-8 rounded-[3rem] border border-[#00FF66]/30 shadow-2xl space-y-8">
            <div className="text-center">
              <span className="text-5xl mb-4 block">{plan.icon}</span>
              <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">{plan.name}</h2>
              <p className="text-[11px] text-slate-500 font-mono mt-2 uppercase tracking-widest">{plan.desc}</p>
            </div>
            
            <div className="bg-white/5 p-6 rounded-2xl border border-white/5 text-center">
              <p className="text-[10px] text-slate-500 font-black uppercase mb-1">One-Time Activation</p>
              <p className="text-5xl font-black text-[#00FF66] font-mono">€5<span className="text-xl">.00</span></p>
            </div>

            <button 
              onClick={() => setShowCardForm(true)}
              className="w-full py-5 bg-[#00FF66] text-[#050607] rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(0,255,102,0.3)] hover:scale-[1.02] active:scale-95 transition-all"
            >
              Abbonati Ora con Stripe
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-sm relative z-10 animate-slideUp">
          <div className="glass-morphism p-8 rounded-[3rem] border border-[#00FF66]/30 shadow-2xl space-y-6">
            <div className="flex justify-between items-center mb-4">
              <button onClick={() => setShowCardForm(false)} className="text-slate-500 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <h3 className="text-white font-black text-xs uppercase tracking-widest">Stripe Checkout</h3>
              <div className="w-5"></div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] text-slate-500 font-black uppercase tracking-widest ml-1">Email</label>
                <input type="email" placeholder="email@esempio.com" className="w-full bg-[#0a0c0e] border border-white/10 rounded-xl px-4 py-3 text-white text-[12px] font-mono focus:border-[#00FF66] outline-none" />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[9px] text-slate-500 font-black uppercase tracking-widest ml-1">Card Details</label>
                <div className="bg-[#0a0c0e] border border-white/10 rounded-xl p-4 space-y-4">
                   <input type="text" placeholder="Card number" className="w-full bg-transparent text-white text-[12px] font-mono outline-none" />
                   <div className="flex gap-4 border-t border-white/5 pt-3">
                      <input type="text" placeholder="MM/YY" className="w-20 bg-transparent text-white text-[12px] font-mono outline-none" />
                      <input type="text" placeholder="CVC" className="w-16 bg-transparent text-white text-[12px] font-mono outline-none ml-auto" />
                   </div>
                </div>
              </div>
            </div>

            {error && <p className="text-red-500 text-[10px] font-mono text-center uppercase">{error}</p>}

            <button 
              onClick={handleSimulatedStripePayment}
              disabled={loading}
              className="w-full py-5 bg-[#00FF66] text-[#050607] rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(0,255,102,0.3)] active:scale-95 transition-all disabled:opacity-50 flex justify-center items-center gap-3"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : `Paga €5.00`}
            </button>
            <p className="text-[8px] text-slate-600 text-center font-mono uppercase tracking-widest">Powered by Stripe Connect</p>
          </div>
        </div>
      )}

      <p className="mt-12 text-[9px] text-slate-600 font-mono uppercase tracking-[0.3em] relative z-10">Secure Neural Transaction Hub</p>

      {loading && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex flex-col items-center justify-center backdrop-blur-xl">
           <div className="w-14 h-14 border-4 border-[#00FF66]/10 border-t-[#00FF66] rounded-full animate-spin mb-6"></div>
           <p className="text-[#00FF66] font-mono text-xs font-black tracking-widest animate-pulse uppercase">Syncing Matrix Access...</p>
        </div>
      )}
    </div>
  );
};

export default AccessPage;