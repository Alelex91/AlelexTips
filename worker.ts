
import { GoogleGenAI } from "@google/genai";

export interface Env {
  GEMINI_API_KEY: string;
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Gestione Preflight CORS
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Routing API
    if (url.pathname.startsWith("/api/")) {
      if (url.pathname === "/api/health") {
        return new Response(JSON.stringify({ ok: true, status: "Matrix Online" }), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      if (url.pathname === "/api/oracle/sync" && request.method === "POST") {
        try {
          const body = await request.json() as any;
          const { prompt, config = {} } = body;
          
          if (!env.GEMINI_API_KEY) {
            console.error("ERRORE: GEMINI_API_KEY non configurata nei segreti del Worker.");
            return new Response(JSON.stringify({ 
              ok: false, 
              error: "Configurazione Server Incompleta: Chiave API Oracle mancante." 
            }), { 
              status: 500,
              headers: { "Content-Type": "application/json", ...corsHeaders }
            });
          }

          const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
          const response = await ai.models.generateContent({
            model: config.model || "gemini-3-flash-preview",
            contents: prompt,
            config: config
          });

          return new Response(JSON.stringify({ 
            ok: true, 
            text: response.text,
            groundingMetadata: response.candidates?.[0]?.groundingMetadata 
          }), {
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        } catch (error: any) {
          console.error("Errore Sincronizzazione Oracle:", error.message);
          return new Response(JSON.stringify({ ok: false, error: "Errore Oracle: " + error.message }), { 
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
      }

      return new Response(JSON.stringify({ ok: false, error: "Endpoint API non trovato." }), { 
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // Gestione Asset Statici con Fallback per SPA
    try {
      let response = await env.ASSETS.fetch(request);
      
      // Se l'asset non esiste e non è una richiesta di file (es. .js, .css), servi index.html
      if (response.status === 404 && !url.pathname.includes('.')) {
        const indexRequest = new Request(new URL("/index.html", request.url));
        return await env.ASSETS.fetch(indexRequest);
      }
      
      return response;
    } catch (e) {
      return new Response("Asset Not Found", { status: 404 });
    }
  },
};
