
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

    // 1. Gestione API
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

          if (!env.GEMINI_API_KEY) {
            console.error("ERRORE: GEMINI_API_KEY non trovata.");
            return new Response(JSON.stringify({ error: "Configurazione Server Incompleta: Manca la GEMINI_API_KEY nei Secret di Cloudflare." }), { 
              status: 500,
              headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
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
              "Access-Control-Allow-Origin": "*"
            }
          });
        } catch (error: any) {
          console.error("Worker API Error:", error.message);
          return new Response(JSON.stringify({ error: "L'IA ha riscontrato un problema: " + error.message }), { 
            status: 500,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
          });
        }
      }
    }

    // 2. Servizio Asset Statici
    try {
      const response = await env.ASSETS.fetch(request);
      if (response.status === 404) {
        // Supporto SPA (Single Page Application)
        return await env.ASSETS.fetch(new Request(new URL("/index.html", request.url)));
      }
      return response;
    } catch (e) {
      return new Response("Errore nel caricamento degli asset di NeoTip.", { status: 500 });
    }
  },
};
