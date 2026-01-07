
import React, { useState, useEffect, useRef } from 'react';

interface Props {
  onAccessGranted: () => void;
}

declare global {
  interface Window {
    paypal: any;
  }
}

const AccessPage: React.FC<Props> = ({ onAccessGranted }) => {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const paypalButtonRef = useRef<HTMLDivElement>(null);

  const plans = [
    { id: 0, name: 'Neural Pass', price: 2.99, desc: 'Accesso 24h al database', icon: '⚡' },
    { id: 1, name: 'Oracle Weekly', price: 9.99, desc: 'Analisi Pro per 7 giorni', icon: '💎', popular: true },
    { id: 2, name: 'Cyber Monthly', price: 29.99, desc: '30 giorni di Full Access', icon: '🏆' },
  ];

  const currentPlan = plans.find(p => p.id === selectedPlan) || plans[1];

  // Controllo periodico per l'SDK se non caricato immediatamente
  useEffect(() => {
    const checkSdk = () => {
      if (window.paypal) {
        setSdkReady(true);
      } else {
        setTimeout(checkSdk, 500);
      }
    };
    checkSdk();
  }, []);

  useEffect(() => {
    let paypalButtons: any = null;

    if (sdkReady && paypalButtonRef.current) {
      paypalButtonRef.current.innerHTML = ''; // Reset contenitore
      
      try {
        paypalButtons = window.paypal.Buttons({
          style: {
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'pay'
          },
          createOrder: (data: any, actions: any) => {
            return actions.order.create({
              purchase_units: [{
                amount: {
                  currency_code: 'EUR',
                  value: currentPlan.price.toString()
                },
                description: `Sottoscrizione NeoTip: ${currentPlan.name}`
                // Rimosso payee email specifico in sandbox per evitare errori di validazione account
              }]
            });
          },
          onApprove: async (data: any, actions: any) => {
            setLoading(true);
            try {
              await actions.order.capture();
              onAccessGranted();
            } catch (err) {
              setError("Errore durante la cattura del pagamento. Riprova.");
            } finally {
              setLoading(false);
            }
          },
          onCancel: () => {
            setError("Pagamento annullato dall'utente.");
          },
          onError: (err: any) => {
            console.error('PayPal Error:', err);
            setError("Errore critico PayPal. Assicurati che il tuo account sia abilitato per pagamenti EUR.");
          }
        });

        if (paypalButtons.isEligible()) {
          paypalButtons.render(paypalButtonRef.current);
        } else {
          setError("Il tuo dispositivo o account non è idoneo per questo metodo di pagamento.");
        }
      } catch (e) {
        console.error("Button Render Error:", e);
        setError("Impossibile inizializzare i pulsanti di pagamento.");
      }
    }

    return () => {
      if (paypalButtons && paypalButtons.close) {
        paypalButtons.close();
      }
    };
  }, [selectedPlan, sdkReady]);

  return (
    <div className="min-h-screen bg-[#050607] flex flex-col p-6 items-center justify-center animate-fadeIn relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#00FF66]/10 blur-[100px] rounded-full"></div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-[#00FF66]/10 blur-[100px] rounded-full"></div>
      </div>

      <div className="text-center mb-6 relative z-10">
        <div className="w-20 h-20 bg-[#050607] border-2 border-[#00FF66] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_40px_rgba(0,255,102,0.3)] rotate-3">
          <span className="text-[#00FF66] font-black text-5xl font-poppins -rotate-3">N</span>
        </div>
        <h1 className="text-4xl font-black text-white tracking-tighter mb-1 font-poppins italic neon-text uppercase">NEOTIP</h1>
        <p className="text-slate-500 text-[10px] max-w-[280px] mx-auto font-mono uppercase tracking-[0.3em] font-bold">
          Neural Betting Oracle
        </p>
      </div>

      <div className="w-full max-w-sm space-y-3 mb-6 relative z-10">
        {plans.map((plan) => (
          <button
            key={plan.id}
            onClick={() => { setError(null); setSelectedPlan(plan.id); }}
            className={`w-full relative glass-morphism p-4 rounded-2xl border-2 transition-all duration-300 flex items-center gap-4 text-left ${
              selectedPlan === plan.id 
                ? 'border-[#00FF66] bg-[#00FF66]/10 shadow-[0_0_15px_rgba(0,255,102,0.15)] scale-[1.02]' 
                : 'border-slate-800/50 opacity-70'
            }`}
          >
            {plan.popular && (
              <span className="absolute -top-2.5 right-4 bg-[#00FF66] text-[#050607] text-[8px] font-black px-3 py-0.5 rounded-full font-mono uppercase">
                Best Value
              </span>
            )}
            <span className="text-2xl">{plan.icon}</span>
            <div className="flex-1">
              <h3 className="font-bold text-white font-poppins text-sm uppercase">{plan.name}</h3>
              <p className="text-[9px] text-slate-500 font-mono tracking-tighter">{plan.desc}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-black text-white font-mono">€{plan.price}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="w-full max-w-sm relative z-10 bg-[#0a0c0e]/90 border border-[#00FF66]/20 p-5 rounded-[2rem] backdrop-blur-xl shadow-2xl">
        <div className="flex items-center justify-between mb-5 px-1">
          <div className="flex items-center gap-2">
            <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-4" />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] font-mono">Secure Gateway</span>
          </div>
          <div className="flex gap-1">
             <div className="w-1.5 h-1.5 bg-[#00FF66] rounded-full animate-pulse"></div>
             <div className="w-1.5 h-1.5 bg-[#00FF66] rounded-full animate-pulse delay-75"></div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-[9px] p-3 rounded-xl mb-4 font-mono font-bold text-center uppercase">
            {error}
          </div>
        )}

        <div ref={paypalButtonRef} className="min-h-[150px] overflow-hidden rounded-xl">
          {!sdkReady && (
            <div className="h-[150px] flex flex-col items-center justify-center bg-slate-900/50 rounded-xl border border-slate-800 space-y-3">
              <div className="w-6 h-6 border-2 border-[#00FF66]/20 border-t-[#00FF66] rounded-full animate-spin"></div>
              <p className="text-[10px] text-slate-500 font-mono uppercase">Sincronizzazione SDK...</p>
            </div>
          )}
        </div>
      </div>

      {/* Bypass per test se necessario - premere il logo N 5 volte */}
      <div 
        className="mt-8 text-center px-10 cursor-pointer select-none"
        onClick={() => {
            const count = (window as any)._clickCount || 0;
            (window as any)._clickCount = count + 1;
            if (count + 1 >= 5) onAccessGranted();
        }}
      >
        <p className="text-[8px] text-slate-600 uppercase font-bold tracking-[0.4em] font-mono leading-loose">
          NeoTip Neural Network<br/>
          Encrypted Session v4.0.1
        </p>
      </div>
      
      {loading && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex flex-col items-center justify-center backdrop-blur-md">
           <div className="w-12 h-12 border-4 border-[#00FF66]/10 border-t-[#00FF66] rounded-full animate-spin mb-6"></div>
           <p className="text-[#00FF66] font-mono text-xs font-black tracking-widest animate-pulse uppercase">Verifica Transazione...</p>
        </div>
      )}
    </div>
  );
};

export default AccessPage;
