
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
      return new Response(JSON.stringify({ ok: true, status: "NeoTip Oracle Online" }), {
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*" 
        },
      });
    }

    // 2. Oracle Sync Proxy (Post per Gemini)
    if (url.pathname === "/api/oracle/sync" && request.method === "POST") {
      try {
        const { prompt, model = "gemini-3-flash-preview", config = {} } = await request.json() as any;

        if (!env.GEMINI_API_KEY) {
          return new Response(JSON.stringify({ 
            ok: false, 
            error: "Configurazione Server Errata: Chiave API mancante nei Secret di Cloudflare." 
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
        return new Response(JSON.stringify({ ok: false, error: error.message }), { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    // 3. Servizio Asset Statici (Vite)
    // Se non è una rotta API, prova a servire il file statico o la index.html
    try {
      const assetResponse = await env.ASSETS.fetch(request);
      if (assetResponse.status === 404) {
        // Fallback SPA per rotte React tipo /history o /combos
        return await env.ASSETS.fetch(new Request(new URL("/", request.url)));
      }
      return assetResponse;
    } catch (e) {
      return new Response("Asset fetch error", { status: 500 });
    }
  },
};
