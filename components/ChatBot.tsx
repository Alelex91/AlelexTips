
import React, { useState, useRef, useEffect } from 'react';
import { BettingService } from '../services/geminiService';
import { GenerateContentResponse } from '@google/genai';

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bettingService = new BettingService();

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);
    try {
      if (!chatRef.current) chatRef.current = bettingService.createChatSession();
      const stream = await chatRef.current.sendMessageStream({ message: userMessage });
      let fullText = '';
      setMessages(prev => [...prev, { role: 'ai', text: '' }]);
      for await (const chunk of stream) {
        const chunkResponse = chunk as GenerateContentResponse;
        const text = chunkResponse.text;
        if (text) {
          fullText += text;
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = { role: 'ai', text: fullText };
            return newMessages;
          });
        }
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Sincronizzazione fallita. Database offline.' }]);
    } finally { setIsTyping(false); }
  };

  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)} className="fixed bottom-24 right-6 z-[60] w-15 h-15 bg-[#00FF66] text-[#050607] rounded-2xl shadow-[0_0_20px_rgba(0,255,102,0.4)] flex items-center justify-center hover:scale-110 transition-all duration-300">
        {isOpen ? <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
      </button>

      {isOpen && (
        <div className="fixed bottom-44 right-6 z-[60] w-[calc(100vw-3rem)] max-w-[380px] h-[550px] glass-morphism rounded-3xl shadow-2xl border-[#00FF66]/30 flex flex-col overflow-hidden animate-slideUp">
          <div className="bg-[#00FF66]/10 p-5 border-b border-[#00FF66]/20">
            <h3 className="text-white font-black flex items-center gap-2 font-poppins uppercase tracking-tight">
              <span className="w-2.5 h-2.5 bg-[#00FF66] rounded-full animate-pulse shadow-[0_0_8px_#00FF66]"></span>
              NeoTip Expert AI
            </h3>
            <p className="text-[9px] text-slate-500 font-mono mt-0.5">NEURAL INTERFACE v4.0.1</p>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-5 scroll-smooth no-scrollbar">
            {messages.length === 0 && (
              <div className="text-center py-16 px-6">
                <div className="w-14 h-14 bg-[#00FF66]/10 rounded-2xl border border-[#00FF66]/20 flex items-center justify-center mx-auto mb-5">
                   <div className="text-[#00FF66] font-mono text-xl animate-pulse">&gt;_</div>
                </div>
                <p className="text-[#E8FFF2] font-black font-poppins text-lg">In attesa di input...</p>
                <p className="text-slate-500 text-[10px] mt-2 font-mono uppercase tracking-widest">Sblocca il codice dello sport</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] p-4 rounded-2xl text-sm font-medium ${msg.role === 'user' ? 'bg-[#00FF66] text-[#050607]' : 'bg-[#0a0c0e] text-[#E8FFF2] border border-slate-800 shadow-md font-mono'}`}>
                  {msg.text || (isTyping && i === messages.length - 1 ? 'DECIPHERING...' : '')}
                </div>
              </div>
            ))}
            {isTyping && messages[messages.length-1].role === 'user' && (
              <div className="flex justify-start">
                <div className="bg-[#0a0c0e] p-3 rounded-xl flex gap-1.5 border border-slate-800">
                  <div className="w-1.5 h-1.5 bg-[#00FF66] rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-[#00FF66] rounded-full animate-bounce delay-100"></div>
                  <div className="w-1.5 h-1.5 bg-[#00FF66] rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            )}
          </div>

          <div className="p-5 border-t border-[#00FF66]/10">
            <div className="flex gap-3">
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Comando AI..." className="flex-1 bg-[#050607] border border-slate-800 rounded-xl px-5 py-3 text-white text-sm focus:outline-none focus:border-[#00FF66] font-mono" />
              <button onClick={handleSendMessage} disabled={isTyping} className="bg-[#00FF66] text-[#050607] p-3 rounded-xl disabled:opacity-50 hover:scale-105 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
