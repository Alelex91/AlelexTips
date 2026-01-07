
import { GoogleGenAI, Type, Chat } from "@google/genai";
import { Schedina, GroundingSource } from "../types";

export class BettingService {
  private getSafeApiKey(): string | undefined {
    // 1. Prova variabili Vite (standard per build Vercel)
    const viteKey = (import.meta as any).env?.VITE_API_KEY;
    if (viteKey && viteKey !== "undefined") return viteKey;

    // 2. Prova variabili iniettate globalmente (fallback Netlify/Static)
    const windowKey = (window as any).API_KEY;
    if (windowKey && windowKey !== "undefined") return windowKey;

    // 3. Fallback per development locale
    try {
      if (typeof process !== 'undefined' && process.env?.API_KEY) {
        return process.env.API_KEY;
      }
    } catch (e) {}

    return undefined;
  }

  private getAiInstance() {
    const apiKey = this.getSafeApiKey();
    if (!apiKey || apiKey.length < 10) {
      throw new Error("CONFIG_ERROR: Chiave API non trovata. Assicurati di aver impostato VITE_API_KEY su Vercel.");
    }
    return new GoogleGenAI({ apiKey });
  }

  async generateDailySchedina(): Promise<Schedina> {
    try {
      const ai = this.getAiInstance();
      const modelName = 'gemini-3-flash-preview';
      
      const prompt = "Analizza i match di calcio di oggi e genera una schedina JSON con 5 eventi (match, bet, odds, confidence, reasoning, statistics). Rispondi in italiano.";

      const result = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              predictions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    match: {
                      type: Type.OBJECT,
                      properties: {
                        homeTeam: { type: Type.STRING },
                        awayTeam: { type: Type.STRING },
                        league: { type: Type.STRING },
                        time: { type: Type.STRING },
                      },
                      required: ["homeTeam", "awayTeam", "league", "time"],
                    },
                    bet: { type: Type.STRING },
                    odds: { type: Type.NUMBER },
                    confidence: { type: Type.NUMBER },
                    reasoning: { type: Type.STRING },
                    marketType: { type: Type.STRING },
                    statistics: {
                      type: Type.OBJECT,
                      properties: {
                        avgGoals: { type: Type.STRING },
                        recentForm: { type: Type.STRING },
                      },
                    },
                  },
                },
              },
              totalOdds: { type: Type.NUMBER },
            },
          },
        },
      });

      let text = result.text || "";
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();
      
      const data = JSON.parse(text) as Schedina;
      const sources: GroundingSource[] = [];
      const chunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        chunks.forEach((chunk: any) => {
          if (chunk.web && chunk.web.uri) sources.push({ title: chunk.web.title || "Fonte", uri: chunk.web.uri });
        });
      }
      
      return { ...data, sources: sources.slice(0, 5) };
    } catch (error: any) {
      console.error("BettingService Error:", error);
      throw error;
    }
  }

  createChatSession(): Chat {
    const ai = this.getAiInstance();
    return ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: "Sei NeoTip AI, un esperto di scommesse in stile Matrix. Rispondi in italiano.",
        tools: [{ googleSearch: {} }]
      },
    });
  }
}
