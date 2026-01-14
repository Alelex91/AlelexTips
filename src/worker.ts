
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

    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    if (url.pathname === "/api/oracle/sync" && request.method === "POST") {
      try {
        const body = await request.json() as any;
        const { prompt } = body;
        
        if (!env.GEMINI_API_KEY) {
          return new Response(JSON.stringify({ ok: false, error: "API KEY MISSING" }), { status: 503, headers: corsHeaders });
        }

        const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
        
        // Configurazione Oracle v5.2 - Massima precisione e ricerca web
        const response = await ai.models.generateContent({
          model: "gemini-3-pro-preview",
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            temperature: 0.1, // Riduce drasticamente le allucinazioni
            systemInstruction: `SEI NEOTIP_ORACLE V5.2. IL TUO OBIETTIVO È L'ECCELLENZA ANALITICA.
            REGOLE IMPERATIVE:
            1. USA GOOGLE SEARCH PER TROVARE MATCH REALI DI OGGI E DOMANI. 
            2. NON INVENTARE SQUADRE O RISULTATI. Se un match non è confermato, ignoralo.
            3. ANALISI TATTICA: Per ogni match, calcola xG, stato infortuni e trend storici.
            4. RISULTATO ESATTO: Giustifica ogni punteggio con almeno 40 parole di analisi tecnica.
            5. JSON STRICT: Restituisci SOLO un oggetto JSON valido. Non aggiungere commenti prima o dopo.
            6. SCHEMA: { "predictions": [{ "match": { "homeTeam", "awayTeam", "league", "time", "date", "sport" }, "bet", "odds", "confidence", "statistics": { "winProbability", "recommendedScore", "scoreReasoning", "avgGoals", "tacticalInsight" } }], "totalOdds" }`
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
        return new Response(JSON.stringify({ ok: false, error: "Node Error: " + error.message }), { 
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        });
      }
    }

    return env.ASSETS.fetch(request);
  },
};
