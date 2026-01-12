import { GoogleGenAI } from "@google/genai";

/**
 * Utilizziamo interfacce strutturali per evitare dipendenze dai tipi di Cloudflare
 * che potrebbero entrare in conflitto con il compilatore TypeScript del frontend.
 */
interface Env {
  GEMINI_API_KEY: string;
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // 1. API - Health Check
    if (url.pathname === "/api/health") {
      return new Response(JSON.stringify({ ok: true, status: "NeoTip Oracle Online" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. API - Oracle Sync Proxy
    if (url.pathname === "/api/oracle/sync" && request.method === "POST") {
      try {
        const { prompt, model = "gemini-3-flash-preview", config = {} } = await request.json() as any;

        if (!env.GEMINI_API_KEY) {
          return new Response(JSON.stringify({ 
            ok: false, 
            error: "Configurazione Server incompleta: GEMINI_API_KEY mancante." 
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
          headers: { "Content-Type": "application/json" },
        });

      } catch (error: any) {
        return new Response(JSON.stringify({ ok: false, error: error.message }), { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    // 3. Static Assets & SPA Fallback
    // wrangler.toml run_worker_first = ["/api/*"] assicura che arriviamo qui 
    // solo per rotte non gestite sopra.
    try {
      const assetResponse = await env.ASSETS.fetch(request);
      
      // Se l'asset non esiste (404), il binding ASSETS con 
      // not_found_handling = "single-page-application" restituirà comunque la index.html
      // se configurato correttamente, ma aggiungiamo un controllo esplicito per sicurezza.
      if (assetResponse.status === 404) {
        return await env.ASSETS.fetch(new Request(new URL("/", request.url)));
      }
      
      return assetResponse;
    } catch (e) {
      return new Response("Internal Server Error during asset fetch", { status: 500 });
    }
  },
};
