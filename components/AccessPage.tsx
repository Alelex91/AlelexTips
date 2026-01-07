
import React, { useState, useEffect, useRef } from 'react';

interface Props {
  onAccessGranted: () => void;
}

const AccessPage: React.FC<Props> = ({ onAccessGranted }) => {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const paypalButtonRef = useRef<HTMLDivElement>(null);

  const plans = [
    { id: 0, name: 'Neural Pass', price: 2.99, desc: 'Accesso 24h al database', icon: '⚡' },
    { id: 1, name: 'Oracle Weekly', price: 9.99, desc: 'Analisi Pro per 7 giorni', icon: '💎', popular: true },
    { id: 2, name: 'Cyber Monthly', price: 29.99, desc: '30 giorni di Full Access', icon: '🏆' },
  ];

  const currentPlan = plans.find(p => p.id === selectedPlan) || plans[1];

  useEffect(() => {
    let paypalButtons: any = null;
    let isMounted = true;

    const renderButtons = () => {
      if (!isMounted) return;
      if ((window as any).paypal && paypalButtonRef.current) {
        // Pulisci il container prima di renderizzare
        paypalButtonRef.current.innerHTML = '';
        
        try {
          paypalButtons = (window as any).paypal.Buttons({
            style: {
              layout: 'vertical',
              color: 'gold',
              shape: 'rect',
              label: 'pay',
              height: 45
            },
            createOrder: (data: any, actions: any) => {
              return actions.order.create({
                purchase_units: [{
                  amount: {
                    currency_code: 'EUR',
                    value: currentPlan.price.toString()
                  },
                  description: `NEOTIP PLAN: ${currentPlan.name}`
                }]
              });
            },
            onApprove: async (data: any, actions: any) => {
              setLoading(true);
              try {
                await actions.order.capture();
                onAccessGranted();
              } catch (err) {
                setError("Errore cattura pagamento. Riprova.");
              } finally {
                setLoading(false);
              }
            },
            onError: (err: any) => {
              console.error('PayPal Error:', err);
              setError("Servizio PayPal momentaneamente non disponibile.");
            }
          });

          if (paypalButtons.isEligible()) {
            paypalButtons.render(paypalButtonRef.current).catch((err: any) => {
                console.error("Render catch:", err);
            });
          }
        } catch (e) {
          console.error("Initialization Error:", e);
        }
      }
    };

    // Polling per l'oggetto PayPal se lo script non è ancora pronto
    const timer = setInterval(() => {
      if ((window as any).paypal) {
        renderButtons();
        clearInterval(timer);
      }
    }, 500);

    // Se è già disponibile, renderizza subito
    if ((window as any).paypal) {
      renderButtons();
      clearInterval(timer);
    }

    return () => {
      isMounted = false;
      clearInterval(timer);
      if (paypalButtons && paypalButtons.close) {
        paypalButtons.close();
      }
    };
  }, [selectedPlan]);

  return (
    <div className="min-h-screen bg-[#050607] flex flex-col p-6 items-center justify-center animate-fadeIn relative overflow-hidden">
      <div className="text-center mb-8 relative z-10">
        <div 
          className="w-20 h-20 bg-[#050607] border-2 border-[#00FF66] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_40px_rgba(0,255,102,0.3)] cursor-pointer active:scale-95 transition-transform"
          onClick={() => {
              const count = (window as any)._bypassCount || 0;
              (window as any)._bypassCount = count + 1;
              if (count >= 7) onAccessGranted(); // Easter Egg: 7 click per bypassare in fase di test
          }}
        >
          <span className="text-[#00FF66] font-black text-5xl font-poppins">N</span>
        </div>
        <h1 className="text-4xl font-black text-white tracking-tighter mb-1 font-poppins italic neon-text">NEOTIP</h1>
        <p className="text-slate-500 text-[10px] font-mono uppercase tracking-[0.3em] font-bold">Neural Betting Oracle</p>
      </div>

      <div className="w-full max-w-sm space-y-3 mb-8 relative z-10">
        {plans.map((plan) => (
          <button
            key={plan.id}
            onClick={() => { setError(null); setSelectedPlan(plan.id); }}
            className={`w-full relative glass-morphism p-4 rounded-2xl border-2 transition-all flex items-center gap-4 text-left ${
              selectedPlan === plan.id ? 'border-[#00FF66] bg-[#00FF66]/10 shadow-[0_0_20px_rgba(0,255,102,0.1)]' : 'border-slate-800/50'
            }`}
          >
            <span className="text-2xl">{plan.icon}</span>
            <div className="flex-1">
              <h3 className="font-bold text-white text-sm uppercase">{plan.name}</h3>
              <p className="text-[9px] text-slate-500 font-mono tracking-tighter">{plan.desc}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-black text-white font-mono">€{plan.price}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="w-full max-w-sm relative z-10 bg-[#0a0c0e]/95 border border-[#00FF66]/20 p-6 rounded-[2.5rem] backdrop-blur-2xl shadow-2xl min-h-[150px] flex flex-col justify-center">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-[9px] p-3 rounded-xl mb-4 font-mono font-bold text-center uppercase animate-pulse">
            {error}
          </div>
        )}
        
        <div ref={paypalButtonRef} className="rounded-xl overflow-hidden transition-all duration-500">
           {!error && !(window as any).paypal && (
             <div className="flex flex-col items-center gap-2 py-4">
                <div className="w-5 h-5 border-2 border-[#00FF66]/20 border-t-[#00FF66] rounded-full animate-spin"></div>
                <span className="text-[8px] text-slate-500 font-mono uppercase">Caricamento PayPal...</span>
             </div>
           )}
        </div>
      </div>

      <p className="mt-8 text-[8px] text-slate-600 font-mono uppercase tracking-widest relative z-10">Secure Neural Transaction System</p>

      {loading && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center backdrop-blur-xl">
           <div className="w-14 h-14 border-4 border-[#00FF66]/10 border-t-[#00FF66] rounded-full animate-spin mb-6 shadow-[0_0_20px_rgba(0,255,102,0.2)]"></div>
           <p className="text-[#00FF66] font-mono text-xs font-black tracking-widest animate-pulse uppercase">Sincronizzazione Oracle...</p>
        </div>
      )}
    </div>
  );
};

export default AccessPage;
