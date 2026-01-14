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
          
          // Recupero della chiave API dai segreti di ambiente del Worker (env)
          const apiKey = env.GEMINI_API_KEY;
          
          if (!apiKey) {
            console.error("ERRORE: GEMINI_API_KEY non configurata nei segreti del Worker.");
            return new Response(JSON.stringify({ 
              ok: false, 
              error: "Configurazione Server Incompleta: Chiave API Oracle (GEMINI_API_KEY) mancante." 
            }), { 
              status: 500,
              headers: { "Content-Type": "application/json", ...corsHeaders }
            });
          }

          // Inizializzazione del client GoogleGenAI con la chiave dai segreti
          const ai = new GoogleGenAI({ apiKey });
          
          // Esecuzione della richiesta a Gemini utilizzando il modello specificato o un default sicuro
          const response = await ai.models.generateContent({
            model: config.model || "gemini-3-flash-preview",
            contents: prompt,
            config: config
          });

          // Estrazione del testo generato e dei metadati di grounding (per Google Search/Maps)
          const generatedText = response.text;
          const groundingMetadata = response.candidates?.[0]?.groundingMetadata;

          return new Response(JSON.stringify({ 
            ok: true, 
            text: generatedText || "",
            groundingMetadata: groundingMetadata || null
          }), {
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        } catch (error: any) {
          console.error("Errore durante la sincronizzazione Oracle:", error.message);
          return new Response(JSON.stringify({ 
            ok: false, 
            error: "Errore durante l'elaborazione della richiesta: " + error.message 
          }), { 
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

    // Gestione Asset Statici con Fallback per Single Page Application (SPA)
    try {
      const response = await env.ASSETS.fetch(request);
      
      // Se l'asset non è stato trovato (404) e non sembra essere una risorsa statica (non ha estensione),
      // facciamo il fallback su index.html per permettere al router React di gestire il percorso.
      if (response.status === 404 && !url.pathname.includes('.')) {
        return await env.ASSETS.fetch(new Request(new URL("/index.html", request.url)));
      }
      return response;
    } catch (e) {
      return new Response("Asset Not Found", { status: 404 });
    }
  },
};
