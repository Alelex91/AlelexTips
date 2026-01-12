import { GoogleGenAI } from "@google/genai";

interface Env {
  GEMINI_API_KEY: string;
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // 1. API Health Check
    if (url.pathname === "/api/health") {
      return new Response(JSON.stringify({ 
        ok: true, 
        status: "NeoTip Oracle Online",
        timestamp: new Date().toISOString()
      }), {
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*" 
        },
      });
    }

    // 2. Oracle Sync Proxy (Backend per Gemini)
    if (url.pathname === "/api/oracle/sync" && request.method === "POST") {
      try {
        const body = await request.json() as any;
        const { prompt, model = "gemini-3-flash-preview", config = {} } = body;

        if (!env.GEMINI_API_KEY) {
          return new Response(JSON.stringify({ 
            ok: false, 
            error: "Chiave API mancante. Configura GEMINI_API_KEY nei Secret di Cloudflare." 
          }), { 
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
            "Access-Control-Allow-Origin": "*"
          },
        });

      } catch (error: any) {
        return new Response(JSON.stringify({ 
          ok: false, 
          error: error.message || "Errore interno del server Oracle" 
        }), { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    // 3. Servizio Asset Statici (Frontend React)
    // Grazie a run_worker_first = ["/api/*"], questo codice viene eseguito
    // per tutte le rotte che non iniziano con /api/
    try {
      return await env.ASSETS.fetch(request);
    } catch (e) {
      return new Response("Asset fetch error", { status: 500 });
    }
  },
};
