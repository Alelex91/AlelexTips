
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
   * Pulisce la risposta dell'IA rimuovendo blocchi markdown e soprattutto
   * le citazioni di Google Search (es. [1], [2]) che rompono il JSON.
   */
  private cleanJsonResponse(text: string): string {
    // 1. Rimuove blocchi ```json o ``` 
    let cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    // 2. Rimuove citazioni tipo [1], [2], [12] che Gemini inserisce con Google Search
    // Queste sono la causa principale del fallimento del parsing JSON
    cleaned = cleaned.replace(/\[\d+\]/g, "");
    cleaned = cleaned.replace(/\[\d+,\s*\d+\]/g, "");

    // 3. Estrae solo l'oggetto JSON principale {}
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
      return cleaned.substring(firstBrace, lastBrace + 1);
    }
    return cleaned;
  }

  async generateDailySchedina(): Promise<Schedina> {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const todayISO = today.toISOString().split('T')[0];
    const tomorrowISO = tomorrow.toISOString().split('T')[0];
    
    const prompt = `SEARCH FOR REAL UPCOMING MATCHES for ${todayISO} and ${tomorrowISO}.
    Leagues: Serie A, Premier League, La Liga, Bundesliga, NBA, Tennis ATP.
    
    REQUIRED JSON STRUCTURE:
    {
      "predictions": [
        {
          "match": {
            "homeTeam": "Home",
            "awayTeam": "Away",
            "league": "League Name",
            "time": "HH:MM",
            "date": "YYYY-MM-DD",
            "sport": "Football"
          },
          "bet": "Esito (1, X, 2, Over 2.5)",
          "odds": 1.90,
          "confidence": 80,
          "reasoning": "Quick analysis",
          "statistics": {
            "winProbability": 70,
            "recentForm": "W-D-L",
            "recommendedScore": "2-1"
          }
        }
      ],
      "dailyCombos": [
        {
          "title": "NEURAL COMBO",
          "type": "Safe",
          "predictions": [],
          "totalOdds": 2.50,
          "reasoning": "Explanation"
        }
      ]
    }`;

    const config = {
      systemInstruction: "You are a Betting JSON Generator. ONLY output the JSON object. NEVER include citations like [1] or [2] inside JSON strings. NO conversational text.",
      tools: [{ googleSearch: {} }]
    };

    const data = await this.callOracle(prompt, config);
    
    try {
      const cleanedText = this.cleanJsonResponse(data.text);
      const parsedData = JSON.parse(cleanedText);
      
      // Assicura che predictions e dailyCombos siano array validi
      return { 
        predictions: Array.isArray(parsedData.predictions) ? parsedData.predictions : [],
        dailyCombos: Array.isArray(parsedData.dailyCombos) ? parsedData.dailyCombos : [],
        totalOdds: parsedData.totalOdds || 0,
        lastUpdated: new Date().toLocaleTimeString('it-IT') 
      };
    } catch (e) {
      console.error("DEBUG ORACLE ERROR:", e);
      console.error("RAW TEXT RECEIVED:", data.text);
      throw new Error("L'Oracolo ha inviato dati sporchi. Riprova tra 5 secondi.");
    }
  }

  async sendMessageToChat(message: string, lat?: number, lng?: number): Promise<any> {
    const config = {
      systemInstruction: "Sei l'Oracolo di NeoTip. Fornisci analisi sul betting cyberpunk. Usa Google Search.",
      tools: [{ googleSearch: {} }]
    };

    const data = await this.callOracle(message, config);
    return {
      text: data.text,
      groundingMetadata: data.groundingMetadata
    };
  }
}
