
import { Schedina } from "../types";

interface OracleResponse {
  ok: boolean;
  text?: string;
  error?: string;
  groundingMetadata?: any;
}

export class BettingService {
  private async callOracle(prompt: string, config: any = {}): Promise<OracleResponse> {
    try {
      const response = await fetch("/api/oracle/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, config })
      });

      if (!response.ok) {
        const errData = await response.json() as OracleResponse;
        throw new Error(errData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json() as OracleResponse;
      if (!data.ok) throw new Error(data.error || "Sincronizzazione fallita.");
      return data;
    } catch (error: any) {
      console.error("Oracle Call Error:", error);
      return { ok: false, error: error.message };
    }
  }

  /**
   * Pulisce la risposta dell'IA rimuovendo markdown, citazioni di ricerca [1][2], e caratteri sporchi.
   * Restituisce sempre una stringa, gestendo i casi di undefined.
   */
  private cleanJsonResponse(text: string | undefined): string {
    if (!text || typeof text !== 'string') return "";
    
    // 1. Rimuove blocchi di codice markdown
    let cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    // 2. Rimuove citazioni di Google Search (es: [1], [2], [1, 2], [1][2])
    cleaned = cleaned.replace(/\[\d+(?:,\s*\d+)*\]/g, "");
    cleaned = cleaned.replace(/\[\d+\]/g, "");

    // 3. Estrae solo il contenuto tra la prima { e l'ultima }
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
      // Se non c'è un oggetto JSON valido, prova a restituire il testo pulito o stringa vuota
      return cleaned.startsWith('{') ? cleaned : "";
    }

    cleaned = cleaned.substring(firstBrace, lastBrace + 1);

    // 4. Rimuove caratteri di controllo non stampabili
    // eslint-disable-next-line no-control-regex
    cleaned = cleaned.replace(/[\x00-\x1F\x7F-\x9F]/g, "");

    return cleaned;
  }

  async generateDailySchedina(): Promise<Schedina> {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const todayISO = today.toISOString().split('T')[0];
    const tomorrowISO = tomorrow.toISOString().split('T')[0];
    
    const prompt = `SEARCH FOR REAL UPCOMING MATCHES FOR ${todayISO} AND ${tomorrowISO}.
    STRICTLY RETURN A JSON OBJECT ONLY. NO CITATIONS. NO MARKDOWN.
    
    TARGET JSON:
    {
      "predictions": [
        {
          "match": {
            "homeTeam": "Team Name",
            "awayTeam": "Team Name",
            "league": "League",
            "time": "HH:MM",
            "date": "YYYY-MM-DD",
            "sport": "Football"
          },
          "bet": "Esito",
          "odds": 1.95,
          "confidence": 85,
          "reasoning": "Analysis",
          "statistics": {
            "winProbability": 70,
            "recentForm": "W-W-D",
            "recommendedScore": "2-1"
          }
        }
      ],
      "dailyCombos": [
        {
          "title": "NEURAL ACCUMULATOR",
          "type": "Safe",
          "predictions": [],
          "totalOdds": 2.25,
          "reasoning": "Summary"
        }
      ],
      "totalOdds": 2.25
    }`;

    const config = {
      model: "gemini-3-flash-preview",
      systemInstruction: "You are the NeoTip Oracle. Output ONLY raw JSON. NEVER include citations like [1] or [2].",
      tools: [{ googleSearch: {} }]
    };

    try {
      const data = await this.callOracle(prompt, config);
      if (!data.ok) throw new Error(data.error);
      
      const cleanedText = this.cleanJsonResponse(data.text);
      if (!cleanedText) throw new Error("Format error: Cleaned response is empty");
      
      const parsedData = JSON.parse(cleanedText);
      return this.validateData(parsedData);
    } catch (e) {
      console.warn("Primary Oracle Sync failed, attempting Recovery Matrix...", e);
      return this.recoveryMatrix(todayISO, tomorrowISO);
    }
  }

  private async recoveryMatrix(today: string, tomorrow: string): Promise<Schedina> {
    const prompt = `Provide 5 generic upcoming matches for ${today} or ${tomorrow} for Serie A, Premier League, NBA. Return JSON ONLY.`;
    const config = {
      model: "gemini-3-flash-preview",
      systemInstruction: "Output ONLY valid JSON. No citations."
    };

    try {
      const data = await this.callOracle(prompt, config);
      const cleanedText = this.cleanJsonResponse(data.text);
      if (!cleanedText) return this.validateData({});
      const parsedData = JSON.parse(cleanedText);
      return this.validateData(parsedData);
    } catch (e) {
      console.error("Recovery Matrix failed:", e);
      return this.validateData({});
    }
  }

  private validateData(data: any): Schedina {
    return { 
      predictions: Array.isArray(data?.predictions) ? data.predictions : [],
      dailyCombos: Array.isArray(data?.dailyCombos) ? data.dailyCombos : [],
      totalOdds: typeof data?.totalOdds === 'number' ? data.totalOdds : 0,
      lastUpdated: new Date().toLocaleTimeString('it-IT') 
    };
  }

  async sendMessageToChat(message: string, lat?: number, lng?: number): Promise<{ text: string; groundingMetadata?: any }> {
    const config: any = {
      systemInstruction: "Sei l'Oracolo di NeoTip. Usa Google Search.",
      tools: [{ googleSearch: {} }]
    };

    // Aggiungi supporto per Maps grounding se le coordinate sono presenti
    if (lat !== undefined && lng !== undefined) {
      config.tools.push({ googleMaps: {} });
      config.toolConfig = {
        retrievalConfig: {
          latLng: { latitude: lat, longitude: lng }
        }
      };
      config.model = "gemini-2.5-flash-preview"; // Maps richiede 2.5
    }

    try {
      const data = await this.callOracle(message, config);
      const outputText: string = data.text || data.error || "L'Oracolo non ha risposto.";
      
      return {
        text: outputText,
        groundingMetadata: data.groundingMetadata || null
      };
    } catch (e: any) {
      return {
        text: `Errore Matrix: ${e.message}`,
        groundingMetadata: null
      };
    }
  }
}
