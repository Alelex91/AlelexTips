
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
        return new Response(JSON.stringify({ ok: true, status: "Matrix Online", node: "CF-Worker-V8" }), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      if (url.pathname === "/api/oracle/sync" && request.method === "POST") {
        try {
          const body = await request.json() as any;
          const { prompt, config = {} } = body;
          
          // La chiave deve essere impostata tramite 'wrangler secret put GEMINI_API_KEY'
          const apiKey = env.GEMINI_API_KEY;
          
          if (!apiKey) {
            return new Response(JSON.stringify({ 
              ok: false, 
              error: "Il server richiede una chiave API valida. Configura GEMINI_API_KEY nei segreti di Cloudflare." 
            }), { 
              status: 503,
              headers: { "Content-Type": "application/json", ...corsHeaders }
            });
          }

          const ai = new GoogleGenAI({ apiKey });
          
          const response = await ai.models.generateContent({
            model: config.model || "gemini-3-pro-preview",
            contents: prompt,
            config: {
              tools: [{ googleSearch: {} }],
              systemInstruction: "Sei NEOTIP_ORACLE. Usa Google Search per trovare match sportivi REALI che iniziano dopo l'orario attuale fornito. Fornisci quote aggiornate. Rispondi solo in JSON."
            }
          });

          return new Response(JSON.stringify({ 
            ok: true, 
            text: response.text,
            groundingMetadata: response.candidates?.[0]?.groundingMetadata 
          }), {
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        } catch (error: any) {
          console.error("Critical Oracle Failure:", error.message);
          return new Response(JSON.stringify({ ok: false, error: "Errore Sincronizzazione: " + error.message }), { 
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          });
        }
      }
    }

    try {
      const response = await env.ASSETS.fetch(request);
      if (response.status === 404 && !url.pathname.includes('.')) {
        return await env.ASSETS.fetch(new Request(new URL("/index.html", request.url)));
      }
      return response;
    } catch (e) {
      return new Response("Matrix Asset Not Found", { status: 404 });
    }
  },
};
