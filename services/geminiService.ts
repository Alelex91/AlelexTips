
import { Schedina } from "../types";

export class BettingService {
  private async callOracle(prompt: string, config: any = {}): Promise<any> {
    const response = await fetch("/api/oracle/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, config })
    });

    const data = await response.json();
    if (!data.ok) throw new Error(data.error || "Sincronizzazione fallita.");
    return data;
  }

  /**
   * Pulisce la risposta dell'IA in modo ultra-aggressivo.
   * Rimuove markdown, citazioni di ricerca [1][2], e caratteri di controllo invisibili.
   */
  private cleanJsonResponse(text: string): string {
    if (!text) return "";
    
    // 1. Rimuove blocchi di codice markdown
    let cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    // 2. Rimuove citazioni di Google Search (es: [1], [2], [1, 2], [1][2])
    // Queste sono la causa principale del fallimento del parsing
    cleaned = cleaned.replace(/\[\d+(?:,\s*\d+)*\]/g, "");
    cleaned = cleaned.replace(/\[\d+\]/g, "");

    // 3. Estrae solo il contenuto tra la prima { e l'ultima }
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
      console.error("No JSON braces found in response:", text);
      return "";
    }

    cleaned = cleaned.substring(firstBrace, lastBrace + 1);

    // 4. Rimuove caratteri di controllo non stampabili che potrebbero corrompere il JSON
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
    
    // Prompt ancora più autoritario e specifico sul formato
    const prompt = `SEARCH FOR REAL UPCOMING MATCHES FOR ${todayISO} AND ${tomorrowISO}.
    STRICTLY RETURN A JSON OBJECT ONLY. NO CITATIONS. NO MARKDOWN. NO COMMENTS.
    
    TARGET JSON STRUCTURE:
    {
      "predictions": [
        {
          "match": {
            "homeTeam": "Full Team Name",
            "awayTeam": "Full Team Name",
            "league": "Leauge Name",
            "time": "HH:MM",
            "date": "YYYY-MM-DD",
            "sport": "Football"
          },
          "bet": "Esito",
          "odds": 1.95,
          "confidence": 85,
          "reasoning": "Analysis without citations",
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
          "reasoning": "Short summary"
        }
      ],
      "totalOdds": 2.25
    }`;

    const config = {
      model: "gemini-3-flash-preview",
      // Istruzione di sistema cruciale: vieta le citazioni che rompono il JSON
      systemInstruction: "You are the NeoTip Oracle. Output ONLY pure raw JSON. NEVER include citations like [1] or [2]. NEVER include text explanations outside the JSON structure. If you find no matches, return an empty predictions array.",
      tools: [{ googleSearch: {} }]
    };

    const data = await this.callOracle(prompt, config);
    
    try {
      const cleanedText = this.cleanJsonResponse(data.text);
      if (!cleanedText) throw new Error("Risposta vuota o non valida dall'Oracolo.");
      
      const parsedData = JSON.parse(cleanedText);
      
      // Assicuriamo l'integrità dei dati minimi richiesti dall'interfaccia
      return { 
        predictions: Array.isArray(parsedData.predictions) ? parsedData.predictions : [],
        dailyCombos: Array.isArray(parsedData.dailyCombos) ? parsedData.dailyCombos : [],
        totalOdds: parsedData.totalOdds || 0,
        lastUpdated: new Date().toLocaleTimeString('it-IT') 
      };
    } catch (e) {
      console.error("CRITICAL PARSE ERROR:", e);
      console.debug("RAW OUTPUT FROM GEMINI:", data.text);
      throw new Error("L'Oracolo è temporaneamente instabile (errore di formato). Riprova tra pochi istanti premendo il tasto Sync.");
    }
  }

  async sendMessageToChat(message: string, lat?: number, lng?: number): Promise<any> {
    const config = {
      systemInstruction: "Sei l'Oracolo di NeoTip, un analista di scommesse cyberpunk. Usa Google Search per dati reali. Fornisci risposte concise e professionali.",
      tools: [{ googleSearch: {} }]
    };

    const data = await this.callOracle(message, config);
    return {
      text: data.text,
      groundingMetadata: data.groundingMetadata
    };
  }
}
