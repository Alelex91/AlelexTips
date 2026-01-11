
import { GoogleGenAI, Type, Chat } from "@google/genai";
import { Schedina, GroundingSource, SportType, ComboTip, Prediction } from "../types";

export class BettingService {
  private getAiInstance() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  }

  async generateDailySchedina(): Promise<Schedina> {
    try {
      const ai = this.getAiInstance();
      const modelName = 'gemini-3-flash-preview';
      const now = new Date();
      
      const todayStr = now.toLocaleDateString('en-CA');
      const timeStr = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

      const prompt = `DATA ATTUALE: ${todayStr} - ORE: ${timeStr} (Fuso Orario: Europe/Rome).
      Sei un oracolo sportivo. Genera analisi per match che iniziano DOPO le ${timeStr} di oggi o domani.
      Discipline: Football, Basketball, Tennis, Volley.
      Includi statistiche avanzate: H2H, Forma, Media Gol/Punti.
      Usa quote reali tramite Google Search.`;

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
                        date: { type: Type.STRING },
                        sport: { type: Type.STRING, enum: ["Football", "Basketball", "Tennis", "Volley"] },
                        imageUrl: { type: Type.STRING }
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
                        recentForm: { type: Type.STRING },
                        h2h: { type: Type.STRING },
                        avgGoals: { type: Type.STRING },
                        pointsPerGame: { type: Type.STRING }
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
                    type: { type: Type.STRING, enum: ["Safe", "HighRisk"] },
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
                    reasoning: { type: Type.STRING },
                  },
                },
              },
              totalOdds: { type: Type.NUMBER },
            },
          },
        },
      });

      const data = JSON.parse(result.text.trim()) as Schedina;
      const chunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const sources: GroundingSource[] = chunks?.map((chunk: any) => ({
        title: chunk.web?.title || chunk.maps?.title || "Fonte",
        uri: chunk.web?.uri || chunk.maps?.uri || ""
      })).filter((s: any) => s.uri) || [];
      
      return { ...data, sources: sources.slice(0, 5), lastUpdated: new Date().toLocaleTimeString('it-IT') };
    } catch (error: any) {
      console.error("BettingService Error:", error);
      throw error;
    }
  }

  async generateOracleSurprise(availablePredictions: Prediction[]): Promise<ComboTip> {
    const ai = this.getAiInstance();
    const modelName = 'gemini-3-flash-preview';
    const matchData = availablePredictions.map(p => ({
      event: `${p.match.homeTeam} vs ${p.match.awayTeam}`,
      sport: p.match.sport,
      odds: p.odds,
      bet: p.bet
    }));

    const prompt = `Crea una combo "SORPRESA" da 3 eventi basata su questi dati: ${JSON.stringify(matchData.slice(0, 15))}. Stile Matrix.`;

    const result = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
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
            reasoning: { type: Type.STRING }
          }
        }
      }
    });

    return JSON.parse(result.text.trim()) as ComboTip;
  }

  async getNearbyBettingShops(lat: number, lng: number): Promise<{text: string, sources: GroundingSource[]}> {
    const ai = this.getAiInstance();
    const model = "gemini-2.5-flash-lite-latest";
    
    const response = await ai.models.generateContent({
      model: model,
      contents: "Trova i centri scommesse (SNAI, Goldbet, Planetwin365, etc.) più vicini alla mia posizione e dimmi gli orari se disponibili.",
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: { latitude: lat, longitude: lng }
          }
        }
      },
    });

    const sources: GroundingSource[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.maps?.title || "Centro Scommesse",
      uri: chunk.maps?.uri || ""
    })).filter((s: any) => s.uri) || [];

    return { text: response.text, sources };
  }

  createChatSession(lat?: number, lng?: number): Chat {
    const ai = this.getAiInstance();
    return ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: "Sei NeoTip AI Oracle. Aiuti gli utenti con analisi sportive e a trovare centri scommesse fisici se richiesto.",
        tools: [{ googleSearch: {} }, { googleMaps: {} }],
        ...(lat && lng ? {
          toolConfig: {
            retrievalConfig: {
              latLng: { latitude: lat, longitude: lng }
            }
          }
        } : {})
      },
    });
  }
}
