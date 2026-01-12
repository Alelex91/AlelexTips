import { GoogleGenAI, Type, Chat, GenerateContentResponse } from "@google/genai";
import { Schedina, GroundingSource, Prediction, ComboTip } from "../types";

export class BettingService {
  private getAiInstance(): GoogleGenAI {
    // In un'app Vite, process.env.API_KEY viene sostituito durante il BUILD.
    // Se vedi "undefined" o il nome della variabile, significa che Cloudflare non l'ha trovata durante il build.
    const apiKey = process.env.API_KEY;
    
    if (!apiKey || apiKey === "undefined" || apiKey === "" || apiKey.includes("process.env")) {
      console.error("ERRORE: API_KEY mancante nel bundle.");
      throw new Error("CHIAVE_MANCANTE: Vai su Cloudflare Pages -> Settings -> Environment Variables, aggiungi API_KEY (nelle variabili di BUILD) e rifai il Deploy.");
    }
    
    return new GoogleGenAI({ apiKey });
  }

  private cleanJsonString(text: string | undefined): string {
    if (!text) return "{}";
    let cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      cleaned = cleaned.substring(start, end + 1);
    }
    return cleaned;
  }

  async generateDailySchedina(): Promise<Schedina> {
    try {
      const ai = this.getAiInstance();
      const modelName = 'gemini-3-flash-preview';
      const now = new Date();
      
      const todayStr = now.toLocaleDateString('en-CA');
      const timeStr = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

      const prompt = `DATA ATTUALE: ${todayStr} - ORE: ${timeStr}.
      Sei NeoTip Oracle. Genera 5 analisi scommesse per oggi o domani.
      Usa Google Search per dati reali e quote. Ritorna JSON puro.`;

      const response: GenerateContentResponse = await ai.models.generateContent({
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
                        date: { type: Type.STRING },
                        sport: { type: Type.STRING }
                      },
                      required: ["homeTeam", "awayTeam", "league", "time", "date", "sport"],
                    },
                    bet: { type: Type.STRING },
                    odds: { type: Type.NUMBER },
                    confidence: { type: Type.NUMBER },
                    reasoning: { type: Type.STRING },
                    marketType: { type: Type.STRING },
                    statistics: {
                      type: Type.OBJECT,
                      properties: {
                        recentForm: { type: Type.STRING }
                      },
                      required: ["recentForm"],
                    },
                  },
                },
              },
              dailyCombos: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    type: { type: Type.STRING },
                    predictions: { 
                      type: Type.ARRAY, 
                      items: { 
                        type: Type.OBJECT, 
                        properties: { 
                          event: { type: Type.STRING },
                          bet: { type: Type.STRING }, 
                          odds: { type: Type.NUMBER } 
                        } 
                      } 
                    },
                    totalOdds: { type: Type.NUMBER },
                  },
                },
              },
              totalOdds: { type: Type.NUMBER },
            },
          },
        },
      });

      if (!response.text) throw new Error("Risposta IA vuota.");
      
      const responseText = this.cleanJsonString(response.text);
      const data = JSON.parse(responseText) as Schedina;
      
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources: GroundingSource[] = chunks.map((chunk: any) => ({
        title: chunk.web?.title || "Fonte Oracle",
        uri: chunk.web?.uri || ""
      })).filter((s: GroundingSource) => s.uri !== "");
      
      return { 
        ...data, 
        sources: sources.slice(0, 5), 
        lastUpdated: new Date().toLocaleTimeString('it-IT') 
      };
    } catch (error: any) {
      console.error("BettingService Error:", error);
      throw error;
    }
  }

  async generateOracleSurprise(availablePredictions: Prediction[]): Promise<ComboTip> {
    const ai = this.getAiInstance();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Genera combo sorpresa da: ${JSON.stringify(availablePredictions.slice(0, 5))}`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(this.cleanJsonString(response.text)) as ComboTip;
  }

  createChatSession(lat?: number, lng?: number): Chat {
    const ai = this.getAiInstance();
    return ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: "Sei NeoTip Oracle. Rispondi in italiano con precisione tecnica.",
        tools: [{ googleSearch: {} }]
      },
    });
  }
}