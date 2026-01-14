
import { Schedina, Prediction } from "../types";

export class BettingService {
  private cleanJsonResponse(text: string | undefined): string {
    if (!text) return "";
    // Regex potenziata per estrarre solo il contenuto tra le graffe, ignorando markdown o testo extra
    let cleaned = text.trim();
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) return "";
    return cleaned.substring(firstBrace, lastBrace + 1);
  }

  async generateDailySchedina(): Promise<Schedina> {
    const today = new Date().toLocaleDateString('en-CA'); 
    const time = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

    const prompt = `SINCRONIZZAZIONE PALINSESTO: ${today} ORE ${time}. 
    Esegui scansione globale per Serie A, Premier League, La Liga, Bundesliga, NBA e Tennis ATP.
    Fornisci 6-8 pronostici di alta qualità con analisi del risultato esatto.`;

    try {
      const response = await fetch('/api/oracle/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) throw new Error(`[CODE-${response.status}] Nodo Oracle Temporaneamente Offline.`);

      const result = await response.json();
      const cleanedJson = this.cleanJsonResponse(result.text);
      
      if (!cleanedJson) throw new Error("Risposta Corrotta dall'IA. Riprova tra 10 secondi.");
      
      const data = JSON.parse(cleanedJson) as Schedina;
      
      // Grounding Source Integration
      if (result.groundingMetadata?.groundingChunks) {
        data.sources = result.groundingMetadata.groundingChunks
          .map((c: any) => ({ title: c.web?.title || 'Data Source', uri: c.web?.uri || '' }))
          .filter((s: any) => s.uri);
      }

      data.lastUpdated = time;
      return this.validateData(data);
    } catch (error) {
      console.error("BettingService Error:", error);
      throw error;
    }
  }

  private validateData(data: any): Schedina {
    const validPredictions = (data.predictions || []).map((p: any) => ({
      ...p,
      match: {
        id: p.match?.id || Math.random().toString(36).substr(2, 9),
        homeTeam: p.match?.homeTeam || "Unknown Team",
        awayTeam: p.match?.awayTeam || "Unknown Team",
        league: p.match?.league || "Major League",
        time: p.match?.time || "TBD",
        date: p.match?.date || new Date().toISOString().split('T')[0],
        sport: p.match?.sport || "Football"
      },
      bet: p.bet || "1X2",
      odds: Number(p.odds) || 1.5,
      confidence: Number(p.confidence) || 70,
      statistics: {
        winProbability: Number(p.statistics?.winProbability) || 50,
        recommendedScore: p.statistics?.recommendedScore || "1-1",
        scoreReasoning: p.statistics?.scoreReasoning || "Analisi basata su trend storici e xG attuali.",
        avgGoals: p.statistics?.avgGoals || "2.5",
        tacticalInsight: p.statistics?.tacticalInsight || "Assetto tattico bilanciato."
      }
    }));

    return {
      predictions: validPredictions,
      dailyCombos: [],
      totalOdds: Number(data.totalOdds) || 0,
      sources: data.sources || [],
      lastUpdated: data.lastUpdated
    };
  }

  async sendMessageToChat(message: string, lat?: number, lng?: number) {
    try {
      const response = await fetch('/api/oracle/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: message })
      });
      const result = await response.json();
      return { text: result.text, groundingMetadata: result.groundingMetadata };
    } catch (e) {
      return { text: "Errore di rete. Impossibile contattare l'Oracolo.", groundingMetadata: null };
    }
  }
}
