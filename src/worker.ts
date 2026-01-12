
import { GoogleGenAI } from "@google/genai";

interface Env {
  GEMINI_API_KEY: string;
  ASSETS: { fetch(request: Request): Promise<Response> };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // 1. Health Check
    if (url.pathname === "/api/health") {
      return new Response(JSON.stringify({ ok: true, status: "Oracle Online" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. API Proxy per Gemini (Oracle Sync)
    if (url.pathname === "/api/oracle/sync" && request.method === "POST") {
      try {
        const { prompt, model = "gemini-3-flash-preview", config = {} } = await request.json() as any;

        if (!env.GEMINI_API_KEY) {
          return new Response(JSON.stringify({ 
            ok: false, 
            error: "GEMINI_API_KEY non configurata nel dashboard Cloudflare." 
          }), { 
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }

        // Inizializzazione AI lato server
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
          headers: { "Content-Type": "application/json" },
        });

      } catch (error: any) {
        return new Response(JSON.stringify({ ok: false, error: error.message }), { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    // 3. Routing Static Assets (React App)
    // Se la richiesta non è per /api/*, prova a servire i file dalla cartella dist
    try {
      const response = await env.ASSETS.fetch(request);
      
      // Se il file non esiste (404), la config not_found_handling: "single-page-application"
      // nel wrangler.toml gestirà automaticamente il ritorno di index.html
      return response;
    } catch (e) {
      return new Response("Asset Not Found", { status: 404 });
    }
  },
};
