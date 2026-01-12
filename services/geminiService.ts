
import { Schedina, GroundingSource, Prediction, ComboTip } from "../types";

export class BettingService {
  private async callOracleApi(payload: any): Promise<any> {
    console.log("NEOTIP_LOG: Invio richiesta all'Oracle...", payload);
    const response = await fetch("/api/oracle/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ error: "Errore di rete." }));
      console.error("NEOTIP_LOG: Errore API Oracle:", errData);
      throw new Error(errData.error || "L'Oracolo non risponde correttamente.");
    }

    const data = await response.json();
    console.log("NEOTIP_LOG: Risposta ricevuta dall'Oracle:", data);
    return data;
  }

  private cleanJsonString(text: string | undefined): string {
    if (!text) return "{}";
    let cleaned = text.trim();
    // Rimuove blocchi di codice markdown se presenti
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim();
    }
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      cleaned = cleaned.substring(start, end + 1);
    }
    return cleaned;
  }

  async generateDailySchedina(): Promise<Schedina> {
    try {
      const now = new Date();
      const todayStr = now.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
      
      const prompt = `DATA ATTUALE: ${todayStr}. 
      Sei NeoTip, un'intelligenza artificiale esperta in scommesse sportive. 
      CERCA MATCH REALI per OGGI e DOMANI (Calcio Serie A, Premier League, La Liga, Champions League, NBA, Tennis ATP).
      Recupera quote aggiornate (es. 1.85, 2.10).
      Genera analisi per almeno 8 match diversi.
      FORMATO: JSON puro.`;

      // Definizione dello schema per obbligare l'IA a rispettare i tipi di dati
      const responseSchema = {
        type: "OBJECT",
        properties: {
          predictions: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                match: {
                  type: "OBJECT",
                  properties: {
                    id: { type: "STRING" },
                    homeTeam: { type: "STRING" },
                    awayTeam: { type: "STRING" },
                    league: { type: "STRING" },
                    time: { type: "STRING" },
                    date: { type: "STRING" },
                    sport: { type: "STRING" }
                  },
                  required: ["homeTeam", "awayTeam", "league", "time", "date", "sport"]
                },
                bet: { type: "STRING" },
                odds: { type: "NUMBER" },
                confidence: { type: "NUMBER" },
                reasoning: { type: "STRING" },
                marketType: { type: "STRING" },
                statistics: {
                  type: "OBJECT",
                  properties: {
                    recentForm: { type: "STRING" },
                    avgGoals: { type: "STRING" },
                    h2h: { type: "STRING" }
                  }
                }
              },
              required: ["match", "bet", "odds", "confidence", "reasoning", "marketType"]
            }
          },
          dailyCombos: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                title: { type: "STRING" },
                type: { type: "STRING" },
                totalOdds: { type: "NUMBER" },
                reasoning: { type: "STRING" },
                predictions: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      event: { type: "STRING" },
                      odds: { type: "NUMBER" }
                    }
                  }
                }
              }
            }
          },
          totalOdds: { type: "NUMBER" }
        },
        required: ["predictions", "dailyCombos"]
      };

      const result = await this.callOracleApi({
        prompt: prompt,
        model: 'gemini-3-flash-preview',
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema, // Forza il formato JSON strutturato
          tools: [{ googleSearch: {} }]
        }
      });

      const jsonContent = this.cleanJsonString(result.text);
      const data = JSON.parse(jsonContent) as Schedina;
      
      const chunks = result.groundingMetadata?.groundingChunks || [];
      const sources: GroundingSource[] = chunks.map((chunk: any) => ({
        title: chunk.web?.title || "Database Sportivo",
        uri: chunk.web?.uri || ""
      })).filter((s: GroundingSource) => s.uri !== "");
      
      return { 
        ...data, 
        sources: sources.slice(0, 5), 
        lastUpdated: new Date().toLocaleTimeString('it-IT') 
      };
    } catch (error: any) {
      console.error("BettingService Fatal Error:", error);
      throw error;
    }
  }

  async sendMessageToChat(message: string, lat?: number, lng?: number): Promise<any> {
    return this.callOracleApi({
      prompt: message,
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: "Sei NeoTip Oracle. Rispondi in modo cyberpunk. Fornisci consigli reali usando Google Search.",
        tools: [{ googleSearch: {} }]
      }
    });
  }
}
