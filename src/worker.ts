
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

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname.startsWith("/api/")) {
      if (url.pathname === "/api/health") {
        return new Response(JSON.stringify({ ok: true, status: "NeoTip Oracle Matrix Online" }), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      if (url.pathname === "/api/oracle/sync" && request.method === "POST") {
        try {
          const body = await request.json() as any;
          const { prompt, config = {} } = body;
          const modelToUse = config.model || "gemini-3-flash-preview";

          if (!env.GEMINI_API_KEY) {
            console.error("Worker Error: GEMINI_API_KEY is missing in Cloudflare secrets.");
            return new Response(JSON.stringify({ ok: false, error: "Chiave API Oracle mancante. Configura GEMINI_API_KEY nei segreti di Cloudflare." }), { 
              status: 500,
              headers: { "Content-Type": "application/json", ...corsHeaders }
            });
          }

          const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
          const response = await ai.models.generateContent({
            model: modelToUse,
            contents: prompt,
            config: config
          });

          if (!response.text) {
            throw new Error("L'Oracolo non ha prodotto alcuna risposta testuale.");
          }

          return new Response(JSON.stringify({ 
            ok: true, 
            text: response.text,
            groundingMetadata: response.candidates?.[0]?.groundingMetadata 
          }), {
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        } catch (error: any) {
          console.error("Worker API Oracle Error:", error.message);
          return new Response(JSON.stringify({ ok: false, error: "Connessione Matrix instabile: " + error.message }), { 
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
      }
    }

    try {
      const response = await env.ASSETS.fetch(request);
      if (response.status === 404) {
        return await env.ASSETS.fetch(new Request(new URL("/index.html", request.url)));
      }
      return response;
    } catch (e) {
      return new Response("Errore caricamento asset statici.", { status: 500 });
    }
  },
};
