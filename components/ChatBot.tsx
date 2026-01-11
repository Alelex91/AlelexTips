
import React, { useState, useRef, useEffect } from 'react';
import { BettingService } from '../services/geminiService';
import { GenerateContentResponse } from '@google/genai';

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string, sources?: any[]}[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const chatRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bettingService = new BettingService();

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn("Geolocation denied", err)
      );
    }
  }, []);

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);

    try {
      if (!chatRef.current) {
        chatRef.current = bettingService.createChatSession(location?.lat, location?.lng);
      }

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
            newMessages[newMessages.length - 1] = { 
              role: 'ai', 
              text: fullText,
              sources: chunkResponse.candidates?.[0]?.groundingMetadata?.groundingChunks
            };
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
      <button onClick={() => setIsOpen(!isOpen)} className="fixed bottom-24 right-6 z-[60] w-14 h-14 bg-[#00FF66] text-[#050607] rounded-2xl shadow-[0_0_20px_rgba(0,255,102,0.4)] flex items-center justify-center hover:scale-110 active:scale-90 transition-all duration-300">
        {isOpen ? <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
      </button>

      {isOpen && (
        <div className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-4 left-4 z-[60] max-w-[400px] ml-auto h-[500px] glass-morphism rounded-[2.5rem] shadow-2xl border-[#00FF66]/30 flex flex-col overflow-hidden animate-slideUp">
          <div className="bg-[#00FF66]/10 p-5 border-b border-[#00FF66]/20 flex justify-between items-center">
            <div>
              <h3 className="text-white font-black flex items-center gap-2 font-poppins uppercase tracking-tight text-xs">
                <span className="w-2 h-2 bg-[#00FF66] rounded-full animate-pulse"></span>
                NEOTIP_ORACLE
              </h3>
              <p className="text-[8px] text-slate-500 font-mono mt-0.5 uppercase tracking-widest">Neural Support Enabled</p>
            </div>
            {location && <span className="text-[8px] bg-[#00FF66]/20 text-[#00FF66] px-2 py-1 rounded-full font-mono uppercase">GPS_ACTIVE</span>}
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <p className="text-[#00FF66] font-mono text-[10px] uppercase tracking-widest opacity-60">Sincronizzazione completata.<br/>Chiedimi analisi o centri vicini.</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-[1.5rem] text-[11px] font-medium leading-relaxed ${msg.role === 'user' ? 'bg-[#00FF66] text-[#050607] rounded-tr-none shadow-lg' : 'bg-[#0a0c0e]/80 text-[#E8FFF2] border border-white/5 rounded-tl-none font-mono'}`}>
                  {msg.text}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10 space-y-1">
                      <p className="text-[8px] text-[#00FF66] uppercase font-black">Link Suggeriti:</p>
                      {msg.sources.map((chunk: any, si: number) => {
                        const uri = chunk.web?.uri || chunk.maps?.uri;
                        const title = chunk.web?.title || chunk.maps?.title;
                        if (!uri) return null;
                        return (
                          <a key={si} href={uri} target="_blank" rel="noopener noreferrer" className="block text-[9px] text-blue-400 underline truncate hover:text-blue-300">
                            {title || 'Apri Link'}
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-[#0a0c0e] p-3 rounded-2xl flex gap-1 border border-white/5">
                  <div className="w-1 h-1 bg-[#00FF66] rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-[#00FF66] rounded-full animate-bounce delay-100"></div>
                  <div className="w-1 h-1 bg-[#00FF66] rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-white/5 bg-[#050607]/50">
            <div className="flex gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Scrivi all'Oracolo..." className="flex-1 bg-[#0a0c0e] border border-white/10 rounded-2xl px-5 py-3 text-white text-[11px] focus:outline-none focus:border-[#00FF66] font-mono shadow-inner" />
              <button onClick={handleSendMessage} className="bg-[#00FF66] text-[#050607] p-3 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(0,255,102,0.2)]">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
