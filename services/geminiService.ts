
import { Schedina, Prediction } from "../types";

export class BettingService {
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

  async generateDailySchedina(): Promise<Schedina> {
    const now = new Date();
    const today = now.toLocaleDateString('en-CA'); 
    const currentTime = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

    const prompt = `DATA ODIERNA: ${today}. ORA ATTUALE: ${currentTime} (fuso orario Italia).
    
    USA GOOGLE SEARCH PER IDENTIFICARE MATCH REALI DI OGGI E DOMANI.
    Focus: Serie A, Premier League, La Liga, Bundesliga, Champions League, NBA, Tennis ATP.
    
    REGOLE DI ANALISI PROFONDA:
    1. Per ogni match, analizza xG (Expected Goals), statistiche d'attacco/difesa e formazioni.
    2. GIUSTIFICA IL RISULTATO ESATTO: Spiega dettagliatamente perché consigli quel punteggio specifico (es. '2-1 scelto perché la squadra di casa segna il 60% dei gol nel secondo tempo e gli ospiti hanno la difesa titolare infortunata').
    3. Restituisci SOLO un oggetto JSON valido.
    
    SCHEMA JSON:
    {
      "predictions": [
        {
          "match": {
            "id": "string",
            "homeTeam": "Nome",
            "awayTeam": "Nome",
            "league": "Lega",
            "time": "HH:MM",
            "date": "YYYY-MM-DD",
            "sport": "Football"
          },
          "bet": "1X2/Over/Goal",
          "odds": 1.85,
          "confidence": 85,
          "reasoning": "Analisi generale del match",
          "marketType": "1X2",
          "statistics": {
            "recentForm": "W-D-L",
            "winProbability": 70,
            "recommendedScore": "2-1",
            "scoreReasoning": "SPIEGAZIONE DETTAGLIATA E TATTICA DEL RISULTATO ESATTO",
            "avgGoals": "2.8",
            "tacticalInsight": "Analisi tattica avanzata (es. pressing alto, contropiede)"
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
        let errorMessage = "Errore di connessione al nodo Oracle.";
        
        try {
          const errData = await response.json();
          errorMessage = errData.error || errorMessage;
        } catch (e) {
          // Fallback se la risposta non è JSON
          if (response.status === 503) {
            errorMessage = "[ORC-503] Sistema in Manutenzione: Chiave API Oracle mancante o scaduta.";
          } else if (response.status === 500) {
            errorMessage = "[ORC-500] Errore Interno Oracle: Il server ha riscontrato un problema tecnico.";
          } else if (response.status === 404) {
            errorMessage = "[ORC-404] Nodo non trovato: L'endpoint Oracle è irraggiungibile.";
          } else {
            errorMessage = `[ORC-${response.status}] Errore Sincronizzazione non documentato.`;
          }
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      const cleanedJson = this.cleanJsonResponse(result.text);
      
      if (!cleanedJson) throw new Error("L'Oracolo ha restituito dati vuoti. Riprova tra pochi istanti.");
      
      let data: Schedina;
      try {
        data = JSON.parse(cleanedJson) as Schedina;
      } catch (e) {
        throw new Error("Errore Formattazione: I dati ricevuti dall'Oracolo sono corrotti.");
      }
      
      const groundingChunks = result.groundingMetadata?.groundingChunks;
      if (groundingChunks) {
        data.sources = groundingChunks
          .map((chunk: any) => ({
            title: chunk.web?.title || 'Dati Analitici',
            uri: chunk.web?.uri || ''
          }))
          .filter((s: any) => s.uri !== '');
      }

      data.lastUpdated = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
      return this.validateData(data);
    } catch (error) {
      console.error("Critical Oracle Sync Error:", error);
      // Se è già un errore con messaggio specifico lo rilanciamo, altrimenti mettiamo un messaggio di rete
      const msg = error instanceof Error ? error.message : "Connessione Oracle interrotta. Controlla la tua rete.";
      throw new Error(msg);
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
      statistics: {
        recentForm: p.statistics?.recentForm || "N/A",
        winProbability: p.statistics?.winProbability || 50,
        recommendedScore: p.statistics?.recommendedScore || "0-0",
        scoreReasoning: p.statistics?.scoreReasoning || "Analisi tattica in corso di sincronizzazione...",
        avgGoals: p.statistics?.avgGoals || "2.5",
        tacticalInsight: p.statistics?.tacticalInsight || "Bilanciamento tattico neutro rilevato."
      }
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

      if (!response.ok) {
        throw new Error("Chat Node Offline.");
      }

      const result = await response.json();
      return {
        text: result.text || "Modulo di risposta non inizializzato.",
        groundingMetadata: result.groundingMetadata
      };
    } catch (e) {
      return { text: "Errore di connessione al nodo di comunicazione Oracle.", groundingMetadata: null };
    }
  }
}
