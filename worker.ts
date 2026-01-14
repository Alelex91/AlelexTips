
import { GoogleGenAI } from "@google/genai";

interface Env {
  GEMINI_API_KEY: string;
  ASSETS: { fetch(request: Request): Promise<Response> };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname === "/api/health") {
      return new Response(JSON.stringify({ ok: true, status: "Matrix Online" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (url.pathname === "/api/oracle/sync" && request.method === "POST") {
      try {
        const body = await request.json() as any;
        const { prompt, config = {} } = body;
        const modelToUse = config.model || "gemini-3-flash-preview";

        if (!env.GEMINI_API_KEY) {
          return new Response(JSON.stringify({ ok: false, error: "GEMINI_API_KEY non configurata." }), { 
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

        if (!response.text) throw new Error("Risposta vuota dall'IA.");

        return new Response(JSON.stringify({ 
          ok: true, 
          text: response.text,
          groundingMetadata: response.candidates?.[0]?.groundingMetadata 
        }), {
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });

      } catch (error: any) {
        return new Response(JSON.stringify({ ok: false, error: error.message }), { 
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }

    try {
      let response = await env.ASSETS.fetch(request);
      if (response.status === 404) {
        return await env.ASSETS.fetch(new Request(new URL("/index.html", request.url)));
      }
      return response;
    } catch (e) {
      return new Response("Asset Not Found", { status: 404 });
    }
  },
};
