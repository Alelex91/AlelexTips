
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
        return new Response(JSON.stringify({ ok: true, status: "Matrix Online" }), {
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }

      if (url.pathname === "/api/oracle/sync" && request.method === "POST") {
        try {
          const body = await request.json() as any;
          const { prompt, config = {} } = body;
          
          // Utilizza la chiave dai segreti del worker
          const apiKey = env.GEMINI_API_KEY || process.env.API_KEY;
          
          if (!apiKey) {
            throw new Error("Chiave API Oracle non configurata nel server.");
          }

          const ai = new GoogleGenAI({ apiKey });
          
          // Chiamata all'IA con il modello pro per massima accuratezza nella ricerca
          const response = await ai.models.generateContent({
            model: config.model || "gemini-3-pro-preview",
            contents: prompt,
            config: {
              tools: [{ googleSearch: {} }],
              systemInstruction: "Sei NEOTIP_ORACLE. Fornisci solo dati REALI e verificati. Rispondi esclusivamente in formato JSON. Controlla sempre la data odierna e gli orari dei match."
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
          console.error("Worker Error:", error.message);
          return new Response(JSON.stringify({ ok: false, error: error.message }), { 
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
      return new Response("Asset Not Found", { status: 404 });
    }
  },
};
