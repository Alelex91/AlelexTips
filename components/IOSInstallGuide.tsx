
import React, { useState, useEffect } from 'react';

const IOSInstallGuide: React.FC = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Rileva se è iOS Safari e non è già in modalità standalone (installato)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone = (window.navigator as any).standalone === true;
    
    if (isIOS && !isStandalone) {
      const lastPrompt = localStorage.getItem('ios_prompt_date');
      const now = new Date().getTime();
      
      // Mostra solo una volta ogni 24 ore per non essere invasivo
      if (!lastPrompt || now - parseInt(lastPrompt) > 86400000) {
        setShow(true);
      }
    }
  }, []);

  const closePrompt = () => {
    setShow(false);
    localStorage.setItem('ios_prompt_date', new Date().getTime().toString());
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-sm glass-morphism rounded-[2.5rem] p-8 border-[#00FF66]/40 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative animate-slideUp">
        <button onClick={closePrompt} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-[#00FF66]/10 rounded-2xl border border-[#00FF66]/30 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(0,255,102,0.1)]">
             <img src="https://img.icons8.com/neon/512/matrix.png" alt="NeoTip" className="w-14 h-14" />
          </div>
          
          <h3 className="text-xl font-black text-white italic uppercase tracking-tighter mb-2">Installa NeoTip su iOS</h3>
          <p className="text-xs text-slate-400 font-mono uppercase tracking-widest leading-relaxed mb-8 px-4">
            Per un'esperienza Matrix completa, aggiungi NeoTip alla tua Home Screen.
          </p>

          <div className="w-full space-y-4 text-left">
            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
              </div>
              <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">1. Clicca il tasto "Condividi" in basso</p>
            </div>

            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
              <div className="w-10 h-10 bg-[#00FF66]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00FF66" strokeWidth="2.5"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
              </div>
              <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">2. Seleziona "Aggiungi a Home"</p>
            </div>
          </div>

          <button 
            onClick={closePrompt}
            className="mt-8 w-full py-4 bg-[#00FF66] text-[#050607] rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(0,255,102,0.3)] active:scale-95 transition-all"
          >
            Capito, procedo
          </button>
        </div>
      </div>
    </div>
  );
};

export default IOSInstallGuide;
