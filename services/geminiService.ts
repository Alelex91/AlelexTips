
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
   * Pulisce la risposta dell'IA rimuovendo blocchi markdown ```json ... ``` 
   * o testo discorsivo prima/dopo il JSON.
   */
  private cleanJsonResponse(text: string): string {
    // Rimuove blocchi ```json o ``` 
    let cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    // Cerca la prima parentesi graffa e l'ultima per estrarre solo l'oggetto JSON
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
    
    // Prompt ultra-specifico per forzare il formato corretto
    const prompt = `AGISCI COME UN ESPERTO DI BETTING E DATA ANALYST.
    USA GOOGLE SEARCH per trovare i match REALI del ${todayISO} e ${tomorrowISO}.
    Concentrati su: Serie A, Premier League, Liga, Bundesliga, NBA, Tennis ATP.

    RISPONDI ESCLUSIVAMENTE IN FORMATO JSON (NIENTE TESTO PRIMA O DOPO).
    SCHEMA RICHIESTO:
    {
      "predictions": [
        {
          "match": {
            "homeTeam": "Nome Casa",
            "awayTeam": "Nome Trasferta",
            "league": "Campionato",
            "time": "HH:MM",
            "date": "YYYY-MM-DD",
            "sport": "Football" (o "Basketball", "Tennis")
          },
          "bet": "Esito (es. 1, X2, Over 2.5)",
          "odds": 1.85,
          "confidence": 85,
          "reasoning": "Breve analisi tattica",
          "statistics": {
            "winProbability": 70,
            "recentForm": "W-D-W",
            "recommendedScore": "2-1"
          }
        }
      ],
      "dailyCombos": [
        {
          "title": "RADDOPPIO NEURALE",
          "type": "Safe",
          "predictions": [],
          "totalOdds": 2.10,
          "reasoning": "Perché questa combo è sicura"
        }
      ]
    }`;

    const config = {
      // Nota: non usiamo responseMimeType: "application/json" qui perché con googleSearch
      // a volte causa conflitti su alcune versioni del modello. Puliamo il testo manualmente.
      tools: [{ googleSearch: {} }]
    };

    const data = await this.callOracle(prompt, config);
    
    try {
      const cleanedText = this.cleanJsonResponse(data.text);
      const parsedData = JSON.parse(cleanedText);
      
      return { 
        predictions: parsedData.predictions || [],
        dailyCombos: parsedData.dailyCombos || [],
        totalOdds: parsedData.totalOdds || 0,
        lastUpdated: new Date().toLocaleTimeString('it-IT') 
      };
    } catch (e) {
      console.error("Errore Parsing Oracolo:", e, "Testo ricevuto:", data.text);
      throw new Error("L'Oracolo ha inviato dati sporchi. Prova a cliccare di nuovo il tasto Sync.");
    }
  }

  async sendMessageToChat(message: string, lat?: number, lng?: number): Promise<any> {
    const config = {
      systemInstruction: "Sei l'Oracolo di NeoTip. Fornisci analisi sul betting cyberpunk e professionale. Usa Google Search.",
      tools: [{ googleSearch: {} }]
    };

    const data = await this.callOracle(message, config);
    return {
      text: data.text,
      groundingMetadata: data.groundingMetadata
    };
  }
}
