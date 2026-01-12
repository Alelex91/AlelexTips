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

    // 1. Gestione rotte API
    if (url.pathname.startsWith("/api/")) {
      
      // Health Check
      if (url.pathname === "/api/health") {
        return new Response(JSON.stringify({ ok: true, status: "NeoTip Online" }), {
          headers: { "Content-Type": "application/json" }
        });
      }

      // Oracle Sync (Proxy per Gemini)
      if (url.pathname === "/api/oracle/sync" && request.method === "POST") {
        try {
          const body = await request.json() as any;
          const { prompt, model = "gemini-3-flash-preview", config = {} } = body;

          if (!env.GEMINI_API_KEY) {
            return new Response(JSON.stringify({ error: "Chiave API mancante nei Secret." }), { status: 500 });
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
            headers: { "Content-Type": "application/json" }
          });
        } catch (error: any) {
          return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }
      }
    }

    // 2. Fallback sugli asset statici (Frontend React)
    // Se la rotta non è API, viene gestita dal binding ASSETS configurato in wrangler.toml
    return env.ASSETS.fetch(request);
  },
};
