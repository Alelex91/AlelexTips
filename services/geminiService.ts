
import { Schedina, GroundingSource, Prediction, ComboTip } from "../types";

export class BettingService {
  private async callOracleApi(payload: any): Promise<any> {
    console.log("NEOTIP_ORACLE: Richiesta dati...", payload);
    try {
      const response = await fetch("/api/oracle/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("NEOTIP_ORACLE: Errore API:", errorText);
        throw new Error(`Errore Server: ${response.status}. Controlla i Secret di Cloudflare.`);
      }

      const result = await response.json();
      if (!result.ok) throw new Error(result.error || "Errore sconosciuto dall'Oracolo.");
      return result;
    } catch (e: any) {
      console.error("NEOTIP_ORACLE: Fallimento fetch:", e);
      throw e;
    }
  }

  private cleanJsonString(text: string | undefined): string {
    if (!text) return "{}";
    let cleaned = text.trim();
    // Pulisce blocchi markdown
    cleaned = cleaned.replace(/^```json/g, "").replace(/```$/g, "").trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      cleaned = cleaned.substring(start, end + 1);
    }
    return cleaned;
  }

  async generateDailySchedina(): Promise<Schedina> {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Prompt ultra-dettagliato per evitare fallimenti di ricerca
    const prompt = `DATA DI RIFERIMENTO: ${todayStr}.
    ISTRUZIONI:
    1. Usa Google Search per trovare i match di CALCIO, BASKET e TENNIS di OGGI (${todayStr}) e DOMANI.
    2. Cerca nei siti: Diretta.it, Flashscore, Gazzetta, Snai per quote reali.
    3. Genera ALMENO 10 pronostici dettagliati.
    4. Per ogni match, la data DEVE essere nel formato ISO YYYY-MM-DD.
    5. Inserisci quote reali (es: 1.65, 2.10, 3.40).
    
    RISPONDI SOLO IN JSON PURO seguendo lo schema richiesto. Non aggiungere testo prima o dopo.`;

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
                  date: { type: "STRING" }, // Formato YYYY-MM-DD
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
                  avgGoals: { type: "STRING" }
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

    try {
      const result = await this.callOracleApi({
        prompt: prompt,
        model: 'gemini-3-flash-preview',
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          tools: [{ googleSearch: {} }]
        }
      });

      const jsonContent = this.cleanJsonString(result.text);
      const data = JSON.parse(jsonContent) as Schedina;
      
      if (!data.predictions || data.predictions.length === 0) {
        throw new Error("L'Oracolo non ha trovato match per le date selezionate.");
      }

      const chunks = result.groundingMetadata?.groundingChunks || [];
      const sources: GroundingSource[] = chunks.map((chunk: any) => ({
        title: chunk.web?.title || "Fonte Live",
        uri: chunk.web?.uri || ""
      })).filter((s: GroundingSource) => s.uri !== "");
      
      return { 
        ...data, 
        sources: sources, 
        lastUpdated: new Date().toLocaleTimeString('it-IT') 
      };
    } catch (error: any) {
      console.error("BettingService Crash:", error);
      throw error;
    }
  }

  async sendMessageToChat(message: string, lat?: number, lng?: number): Promise<any> {
    return this.callOracleApi({
      prompt: message,
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: "Sei NeoTip Oracle. Rispondi in stile Cyberpunk 2077. Usa dati reali da Google Search.",
        tools: [{ googleSearch: {} }]
      }
    });
  }
}
