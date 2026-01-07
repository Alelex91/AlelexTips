
import { GoogleGenAI, Type, Chat } from "@google/genai";
import { Schedina, Prediction, GroundingSource } from "../types";

export class BettingService {
  private getAiInstance() {
    // Netlify inietta le variabili d'ambiente durante la build.
    // Se non la trovi, significa che il deploy non è stato aggiornato dopo l'inserimento.
    const apiKey = process.env.API_KEY;
    
    if (!apiKey || apiKey === "undefined" || apiKey === "") {
      throw new Error("CONFIGURAZIONE_MANCANTE: La API_KEY non è stata iniettata nel sistema.");
    }
    
    try {
      return new GoogleGenAI({ apiKey });
    } catch (e) {
      throw new Error("ERRORE_CHIAVE: La chiave inserita non è valida o è scaduta.");
    }
  }

  async generateDailySchedina(): Promise<Schedina> {
    try {
      const ai = this.getAiInstance();
      const modelName = 'gemini-3-flash-preview';
      
      const prompt = `
        Agisci come NeoTip Expert AI. Analizza i match di calcio di oggi.
        Trova i 5 match più sicuri e genera una schedina.
        Fornisci dati realistici e ragionamenti tecnici in italiano.
        Rispondi ESCLUSIVAMENTE in formato JSON.
      `;

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
            sources.push({ title: chunk.web.title || "Fonte", uri: chunk.web.uri });
          }
        });
      }
      
      return { ...data, sources: sources.slice(0, 5) };
    } catch (error: any) {
      console.error("BettingService Error:", error);
      throw new Error(error.message || "Errore di connessione al database neurale.");
    }
  }

  createChatSession(): Chat {
    const ai = this.getAiInstance();
    return ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: "Sei NeoTip Expert AI. Rispondi in italiano con stile Matrix. Fornisci consigli basati sui dati.",
        tools: [{ googleSearch: {} }]
      },
    });
  }
}
