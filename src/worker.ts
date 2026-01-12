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

    // 1. Gestione API (Punto di accesso sicuro per il frontend)
    if (url.pathname.startsWith("/api/")) {
      
      if (url.pathname === "/api/health") {
        return new Response(JSON.stringify({ ok: true, status: "Oracle Online" }), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }

      if (url.pathname === "/api/oracle/sync" && request.method === "POST") {
        try {
          const body = await request.json() as any;
          const { prompt, model = "gemini-3-flash-preview", config = {} } = body;

          // La chiave viene letta dall'ambiente protetto di Cloudflare
          if (!env.GEMINI_API_KEY) {
            return new Response(JSON.stringify({ error: "Configurazione Server Incompleta (API Key mancante)." }), { 
              status: 500,
              headers: { "Content-Type": "application/json" }
            });
          }

          const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
          const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: config
          });

          return new Response(JSON.stringify({ 
            ok: true, 
            text: response.text,
            groundingMetadata: response.candidates?.[0]?.groundingMetadata 
          }), {
            headers: { 
              "Content-Type": "application/json", 
              "Access-Control-Allow-Origin": "*" // Abilita CORS se necessario per lo sviluppo
            }
          });
        } catch (error: any) {
          return new Response(JSON.stringify({ error: error.message }), { 
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    }

    // 2. Servizio Asset Statici (Frontend)
    try {
      return await env.ASSETS.fetch(request);
    } catch (e) {
      return new Response("Errore nel caricamento degli asset di NeoTip.", { status: 500 });
    }
  },
};
