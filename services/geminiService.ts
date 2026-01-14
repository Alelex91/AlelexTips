
import { Schedina, Prediction } from "../types";

export class BettingService {
  /**
   * Pulisce la risposta dell'IA rimuovendo blocchi markdown e testo superfluo.
   */
  private cleanJsonResponse(text: string | undefined): string {
    if (!text) return "";
    let cleaned = text.replace(/<thought>[\s\S]*?<\/thought>/g, "");
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) return cleaned;
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    cleaned = cleaned.replace(/\[\d+(?:,\s*\d+)*\]/g, "");
    return cleaned;
  }

  /**
   * Richiede la generazione della schedina giornaliera tramite il proxy API.
   */
  async generateDailySchedina(): Promise<Schedina> {
    const now = new Date();
    const today = now.toLocaleDateString('en-CA'); 
    const currentTime = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

    const prompt = `DATA ODIERNA: ${today}. ORA ATTUALE: ${currentTime} (fuso orario Italia).
    
    USA GOOGLE SEARCH PER TROVARE I MATCH REALI DI OGGI E DOMANI.
    Focus: Serie A, Premier League, La Liga, Bundesliga, Champions League, NBA, Tennis ATP.
    
    REGOLE STRINGENTI:
    1. NON inventare match. Se non trovi eventi, lascia l'array vuoto.
    2. Includi solo match che iniziano DOPO le ${currentTime} di oggi o domani.
    3. Verifica le quote attuali su siti come Eurobet, Snai o Bet365 tramite ricerca.
    4. Restituisci SOLO un oggetto JSON valido.
    
    SCHEMA JSON:
    {
      "predictions": [
        {
          "match": {
            "id": "string_univoca",
            "homeTeam": "Nome Squadra Casa",
            "awayTeam": "Nome Squadra Trasferta",
            "league": "Nome Lega",
            "time": "HH:MM",
            "date": "YYYY-MM-DD",
            "sport": "Football"
          },
          "bet": "Pronostico (es. 1, Over 2.5, Goal)",
          "odds": 1.85,
          "confidence": 85,
          "reasoning": "Breve analisi tecnica in italiano",
          "marketType": "1X2",
          "statistics": {
            "recentForm": "W-D-L",
            "winProbability": 70,
            "recommendedScore": "2-1"
          }
        }
      ],
      "dailyCombos": [],
      "totalOdds": 5.40
    }`;

    try {
      const response = await fetch('/api/oracle/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          config: { model: 'gemini-3-pro-preview' }
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Errore di rete");
      }

      const result = await response.json();
      const cleanedJson = this.cleanJsonResponse(result.text);
      
      if (!cleanedJson) throw new Error("Risposta vuota dall'Oracolo.");
      
      const data = JSON.parse(cleanedJson) as Schedina;
      
      // Aggiunta sorgenti di grounding
      const groundingChunks = result.groundingMetadata?.groundingChunks;
      if (groundingChunks) {
        data.sources = groundingChunks
          .map((chunk: any) => ({
            title: chunk.web?.title || 'Fonte Verificata',
            uri: chunk.web?.uri || ''
          }))
          .filter((s: any) => s.uri !== '');
      }

      data.lastUpdated = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
      return this.validateData(data);
    } catch (error) {
      console.error("Oracle Sync Error:", error);
      throw new Error(error instanceof Error ? error.message : "Connessione Oracle interrotta.");
    }
  }

  private validateData(data: any): Schedina {
    if (!data.predictions) data.predictions = [];
    data.predictions = data.predictions.map((p: any) => ({
      ...p,
      match: {
        id: p.match?.id || Math.random().toString(36).substr(2, 9),
        homeTeam: p.match?.homeTeam || "Team A",
        awayTeam: p.match?.awayTeam || "Team B",
        league: p.match?.league || "Lega",
        time: p.match?.time || "--:--",
        date: p.match?.date || new Date().toISOString().split('T')[0],
        sport: p.match?.sport || "Football"
      },
      bet: p.bet || "TBD",
      odds: p.odds || 1.0,
      confidence: p.confidence || 50,
      statistics: p.statistics || { recentForm: "N/A", winProbability: 50 }
    }));
    return data;
  }

  async sendMessageToChat(message: string, lat?: number, lng?: number) {
    try {
      const response = await fetch('/api/oracle/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: message,
          config: { model: 'gemini-3-pro-preview' }
        })
      });

      const result = await response.json();
      return {
        text: result.text || "Database non raggiungibile.",
        groundingMetadata: result.groundingMetadata
      };
    } catch (e) {
      return { text: "Errore di connessione.", groundingMetadata: null };
    }
  }
}
