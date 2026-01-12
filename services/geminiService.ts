
import { Schedina, GroundingSource, Prediction, ComboTip } from "../types";

export class BettingService {
  private async callOracleApi(payload: any): Promise<any> {
    const response = await fetch("/api/oracle/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (!result.ok) {
      throw new Error(result.error || "Errore di comunicazione con l'Oracolo.");
    }
    return result;
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
      const now = new Date();
      const todayStr = now.toLocaleDateString('en-CA');
      const timeStr = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

      const prompt = `DATA ATTUALE: ${todayStr} - ORE: ${timeStr}.
      Sei NeoTip Oracle, una IA esperta di betting. 
      Analizza i match di calcio, basket, tennis e volley più importanti di oggi o domani.
      Trova almeno 5 pronostici con quote reali cercandole sul web.
      Ritorna i dati strutturati in JSON puro come da schema richiesto.`;

      const result = await this.callOracleApi({
        prompt: prompt,
        model: 'gemini-3-flash-preview',
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
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
                        homeTeam: { type: "STRING" },
                        awayTeam: { type: "STRING" },
                        league: { type: "STRING" },
                        time: { type: "STRING" },
                        date: { type: "STRING" },
                        sport: { type: "STRING" }
                      },
                      required: ["homeTeam", "awayTeam", "league", "time", "date", "sport"],
                    },
                    bet: { type: "STRING" },
                    odds: { type: "NUMBER" },
                    confidence: { type: "NUMBER" },
                    reasoning: { type: "STRING" },
                    marketType: { type: "STRING" },
                    statistics: {
                      type: "OBJECT",
                      properties: {
                        recentForm: { type: "STRING" }
                      },
                      required: ["recentForm"],
                    },
                  },
                },
              },
              dailyCombos: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    title: { type: "STRING" },
                    type: { type: "STRING" },
                    predictions: { 
                      type: "ARRAY", 
                      items: { 
                        type: "OBJECT", 
                        properties: { 
                          event: { type: "STRING" },
                          bet: { type: "STRING" }, 
                          odds: { type: "NUMBER" } 
                        } 
                      } 
                    },
                    totalOdds: { type: "NUMBER" },
                  },
                },
              },
              totalOdds: { type: "NUMBER" },
            },
          },
        }
      });

      const responseText = this.cleanJsonString(result.text);
      const data = JSON.parse(responseText) as Schedina;
      
      const chunks = result.groundingMetadata?.groundingChunks || [];
      const sources: GroundingSource[] = chunks.map((chunk: any) => ({
        title: chunk.web?.title || "Database Oracle",
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

  // ChatBot and other methods should be updated to use callOracleApi
  async sendMessageToChat(message: string, lat?: number, lng?: number): Promise<any> {
    return this.callOracleApi({
      prompt: message,
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: "Sei NeoTip Oracle. Rispondi in italiano con un tono tecnico, futuristico e preciso. Sei un esperto di analisi sportiva statistica.",
        tools: [{ googleSearch: {} }]
      }
    });
  }
}
