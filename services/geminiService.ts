
import { GoogleGenAI, Type } from "@google/genai";
import { Schedina, Prediction, ComboTip } from "../types";

export class BettingService {
  private ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  async generateDailySchedina(): Promise<Schedina> {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const todayISO = today.toISOString().split('T')[0];
    const tomorrowISO = tomorrow.toISOString().split('T')[0];
    
    // Prompt ultra-direttivo per dati reali e formati coerenti
    const prompt = `USA GOOGLE SEARCH per trovare i match sportivi REALI che si giocano OGGI (${todayISO}) e DOMANI (${tomorrowISO}).
    Focus su: Serie A, Premier League, Liga, Bundesliga, NBA, Tennis ATP/WTA.
    
    REGOLE MANDATORIE PER IL JSON:
    1. CAMPO 'date': Deve essere ESATTAMENTE 'YYYY-MM-DD'. Se il match è oggi scrivi '${todayISO}', se è domani '${tomorrowISO}'.
    2. EVENTI REALI: Cerca match reali su Snai, Eurobet o Bet365. Non inventare dati.
    3. QUOTE: Estrai quote reali aggiornate (es. 1.85, 2.10).
    4. DISTRIBUZIONE: Includi match sia per oggi che per domani.
    5. DETTAGLIO: Fornisci un 'recommendedScore' realistico basato sulla forma attuale delle squadre.`;

    const responseSchema = {
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
                  date: { type: Type.STRING, description: "Formato rigoroso YYYY-MM-DD" },
                  sport: { type: Type.STRING, description: "Football, Basketball, Tennis, o Volley" }
                },
                required: ["homeTeam", "awayTeam", "league", "time", "date", "sport"]
              },
              bet: { type: Type.STRING },
              odds: { type: Type.NUMBER },
              confidence: { type: Type.NUMBER },
              reasoning: { type: Type.STRING },
              marketType: { type: Type.STRING },
              statistics: {
                type: Type.OBJECT,
                properties: {
                  recentForm: { type: Type.STRING },
                  tacticalInsight: { type: Type.STRING },
                  winProbability: { type: Type.NUMBER },
                  avgGoals: { type: Type.STRING },
                  recommendedScore: { type: Type.STRING },
                  scoreReasoning: { type: Type.STRING }
                }
              }
            },
            required: ["match", "bet", "odds", "confidence", "reasoning", "marketType"]
          }
        },
        dailyCombos: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              type: { type: Type.STRING },
              totalOdds: { type: Type.NUMBER },
              predictions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    event: { type: Type.STRING },
                    odds: { type: Type.NUMBER }
                  }
                }
              }
            }
          }
        }
      },
      required: ["predictions", "dailyCombos"]
    };

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          tools: [{ googleSearch: {} }]
        },
      });

      const text = response.text;
      if (!text) throw new Error("Database temporaneamente non raggiungibile.");
      
      const data = JSON.parse(text);
      return { 
        ...data, 
        lastUpdated: new Date().toLocaleTimeString('it-IT') 
      };
    } catch (error) {
      console.error("Gemini Oracle Error:", error);
      throw new Error("Errore durante la ricerca di match reali. Riprova.");
    }
  }

  async sendMessageToChat(message: string, lat?: number, lng?: number): Promise<any> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: message,
        config: {
          systemInstruction: "Sei l'Oracolo di NeoTip. Fornisci analisi sul betting cyberpunk e professionale. Usa Google Search.",
          tools: [{ googleSearch: {} }]
        },
      });
      return {
        text: response.text,
        groundingMetadata: response.candidates?.[0]?.groundingMetadata
      };
    } catch (error) {
      console.error("Chat Error:", error);
      throw error;
    }
  }
}
