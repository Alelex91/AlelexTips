
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
   * Pulisce la risposta dell'IA rimuovendo blocchi markdown e citazioni di Google Search.
   * La pulizia è ora molto più aggressiva per garantire che JSON.parse non fallisca.
   */
  private cleanJsonResponse(text: string): string {
    if (!text) return "";
    
    // 1. Rimuove i blocchi di codice Markdown (```json ... ``` o ``` ... ```)
    let cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    // 2. Rimuove le citazioni di Google Search che spesso appaiono come [1], [2], [1,2]
    // Queste citazioni spesso finiscono dentro le stringhe JSON o subito dopo, rompendo il formato.
    cleaned = cleaned.replace(/\[\d+\]/g, "");
    cleaned = cleaned.replace(/\[\d+,\s*\d+\]/g, "");

    // 3. Estrae solo la porzione di testo compresa tra la prima '{' e l'ultima '}'
    // Questo elimina eventuale testo discorsivo che Gemini potrebbe aggiungere per errore.
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
    
    // Prompt rinforzato con istruzioni di non-conversazione
    const prompt = `SEARCH FOR REAL UPCOMING MATCHES FOR ${todayISO} AND ${tomorrowISO}.
    Focus on major leagues (Serie A, Premier, NBA, Tennis ATP).
    
    RULES:
    - ONLY output valid JSON.
    - NO text before or after the JSON.
    - DO NOT use citations like [1] or [2].
    - Use the following exact JSON structure:
    {
      "predictions": [
        {
          "match": {
            "homeTeam": "Team A",
            "awayTeam": "Team B",
            "league": "League",
            "time": "HH:MM",
            "date": "YYYY-MM-DD",
            "sport": "Football"
          },
          "bet": "1X2 or Over/Under",
          "odds": 1.85,
          "confidence": 85,
          "reasoning": "Brief technical analysis",
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
          "totalOdds": 2.20,
          "reasoning": "Summary of safety"
        }
      ]
    }`;

    const config = {
      // Usiamo gemini-3-flash-preview che è il più aggiornato
      model: "gemini-3-flash-preview",
      systemInstruction: "You are the NeoTip Oracle. You are a data-driven sports betting analyst. You MUST ONLY respond with raw JSON data. NO citations, NO chat, NO explanations outside the JSON.",
      tools: [{ googleSearch: {} }]
    };

    const data = await this.callOracle(prompt, config);
    
    try {
      const cleanedText = this.cleanJsonResponse(data.text);
      const parsedData = JSON.parse(cleanedText);
      
      // Validazione base dei dati ricevuti
      return { 
        predictions: Array.isArray(parsedData.predictions) ? parsedData.predictions : [],
        dailyCombos: Array.isArray(parsedData.dailyCombos) ? parsedData.dailyCombos : [],
        totalOdds: parsedData.totalOdds || 0,
        lastUpdated: new Date().toLocaleTimeString('it-IT') 
      };
    } catch (e) {
      console.error("JSON PARSE ERROR:", e);
      console.error("RAW DATA FROM ORACLE:", data.text);
      throw new Error("L'Oracolo ha restituito dati in un formato non leggibile. Clicca 'Sincronizza' in alto a destra per riprovare.");
    }
  }

  async sendMessageToChat(message: string, lat?: number, lng?: number): Promise<any> {
    const config = {
      systemInstruction: "Sei l'Oracolo di NeoTip, un esperto di scommesse cyberpunk. Usa Google Search per dati aggiornati. Sii conciso e professionale.",
      tools: [{ googleSearch: {} }]
    };

    const data = await this.callOracle(message, config);
    return {
      text: data.text,
      groundingMetadata: data.groundingMetadata
    };
  }
}
