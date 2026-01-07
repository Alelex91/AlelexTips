
import { GoogleGenAI, Type, Chat } from "@google/genai";
import { Schedina, Prediction, GroundingSource } from "../types";

export class BettingService {
  private getAiInstance() {
    const apiKey = process.env.API_KEY;
    
    // Se la chiave è mancante o è la stringa letterale "undefined" (comune in build fallite)
    if (!apiKey || apiKey === "undefined" || apiKey === "") {
      throw new Error("CHIAVE_NON_RILEVATA: Netlify non ha iniettato la chiave. Assicurati di aver collegato GitHub e fatto il Deploy del sito.");
    }
    
    try {
      return new GoogleGenAI({ apiKey });
    } catch (e) {
      throw new Error("ERRORE_SDK: Impossibile inizializzare Gemini. Verifica la validità della chiave.");
    }
  }

  async generateDailySchedina(): Promise<Schedina> {
    try {
      const ai = this.getAiInstance();
      const prompt = `
        Agisci come NeoTip Expert AI. 
        Analizza i match di calcio odierni e genera una schedina da 5 eventi.
        Usa quote realistiche tra 1.50 e 2.50.
        Rispondi ESCLUSIVAMENTE in JSON.
      `;

      const result = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
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
                        id: { type: Type.STRING },
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
                        h2h: { type: Type.STRING },
                      },
                    },
                  },
                },
              },
              totalOdds: { type: Type.NUMBER },
              potentialWinnings: { type: Type.NUMBER },
            },
          },
        },
      });

      const data = JSON.parse(result.text || "{}") as Schedina;
      
      const sources: GroundingSource[] = [];
      const chunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        chunks.forEach((chunk: any) => {
          if (chunk.web && chunk.web.uri) {
            sources.push({
              title: chunk.web.title || "Fonte Analisi",
              uri: chunk.web.uri
            });
          }
        });
      }
      
      return { ...data, sources: sources.slice(0, 5) };
    } catch (error: any) {
      console.error("Gemini Error:", error);
      throw new Error(error.message || "Errore durante la scansione neurale.");
    }
  }

  async refreshMatchStats(currentPredictions: Prediction[]): Promise<Prediction[]> {
    try {
      const ai = this.getAiInstance();
      const matches = currentPredictions.map(p => `${p.match.homeTeam}-${p.match.awayTeam}`).join(", ");
      const prompt = `Aggiorna quote e infortuni per: ${matches}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json"
        },
      });
      return JSON.parse(response.text || "[]") as Prediction[];
    } catch (e) { 
      return currentPredictions; 
    }
  }

  createChatSession(): Chat {
    const ai = this.getAiInstance();
    return ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction: "Sei NeoTip Expert AI. Analizzi il codice dello sport. Rispondi in italiano con stile Matrix.",
        tools: [{ googleSearch: {} }]
      },
    });
  }
}
