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

    // 1. Gestione rotte API prioritizzate (configurate in wrangler.toml)
    if (url.pathname.startsWith("/api/")) {
      
      // Health Check per monitoraggio CI/CD
      if (url.pathname === "/api/health") {
        return new Response(JSON.stringify({ ok: true, status: "Oracle Online" }), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }

      // Proxy per l'Oracolo AI (Sincronizzazione Scommesse)
      if (url.pathname === "/api/oracle/sync" && request.method === "POST") {
        try {
          const body = await request.json() as any;
          const { prompt, model = "gemini-3-flash-preview", config = {} } = body;

          if (!env.GEMINI_API_KEY) {
            return new Response(JSON.stringify({ error: "Configurazione Server Incompleta (API Key)." }), { 
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
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
          });
        } catch (error: any) {
          return new Response(JSON.stringify({ error: error.message }), { 
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      }
    }

    // 2. Fallback sugli asset statici (Frontend React)
    // Grazie a run_worker_first = ["/api/*"], tutte le altre rotte
    // vengono servite dal binding ASSETS (che include la gestione SPA)
    try {
      return await env.ASSETS.fetch(request);
    } catch (e) {
      return new Response("Errore caricamento asset", { status: 500 });
    }
  },
};
