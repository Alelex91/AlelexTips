
import { GoogleGenAI } from "@google/genai";

interface Env {
  GEMINI_API_KEY: string;
  ASSETS: { fetch(request: Request): Promise<Response> };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // 1. Endpoint di Health Check
    if (url.pathname === "/api/health") {
      return new Response(JSON.stringify({ ok: true, status: "Matrix Online" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Endpoint Oracle Sync (Proxy AI)
    if (url.pathname === "/api/oracle/sync" && request.method === "POST") {
      try {
        const { prompt, model = "gemini-3-flash-preview", config = {} } = await request.json() as any;

        if (!env.GEMINI_API_KEY) {
          return new Response(JSON.stringify({ ok: false, error: "GEMINI_API_KEY non configurata sul server." }), { 
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

    // 3. Serve gli asset statici (React App)
    try {
      let response = await env.ASSETS.fetch(request);
      
      // Gestione SPA: se il file non esiste (404), serve index.html
      if (response.status === 404) {
        const indexRequest = new Request(new URL("/index.html", request.url));
        return await env.ASSETS.fetch(indexRequest);
      }
      
      return response;
    } catch (e) {
      return new Response("Asset Not Found", { status: 404 });
    }
  },
};
