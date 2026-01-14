
// BettingService using @google/genai to provide betting predictions and real-time support.
import { GoogleGenAI } from "@google/genai";
import { Schedina, Prediction } from "../types";

export class BettingService {
  // Use environment variable directly as required.
  private getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  /**
   * Pulisce la risposta dell'IA rimuovendo blocchi markdown e testo superfluo
   * per estrarre solo l'oggetto JSON valido.
   */
  private cleanJsonResponse(text: string | undefined): string {
    if (!text) return "";
    
    // Rimuove blocchi di pensiero <thought>...</thought> se presenti
    let cleaned = text.replace(/<thought>[\s\S]*?<\/thought>/g, "");
    
    // Cerca il primo { e l'ultimo }
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) return cleaned;
    
    // Estrae solo la parte JSON
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    
    // Rimuove eventuali citazioni di grounding [1], [2], ecc. che rompono il JSON
    cleaned = cleaned.replace(/\[\d+(?:,\s*\d+)*\]/g, "");
    
    return cleaned;
  }

  // Implementation of generateDailySchedina
  // This function fetches real-time sports data using Google Search and returns it as a structured Schedina object.
  async generateDailySchedina(): Promise<Schedina> {
    const ai = this.getAI();
    const now = new Date();
    const today = now.toLocaleDateString('en-CA'); 
    
    const prompt = `SEARCH GOOGLE FOR REAL SPORTS MATCHES HAPPENING TODAY (${today}) AND TOMORROW.
    Focus on: Serie A, Premier League, La Liga, Bundesliga, NBA, ATP/WTA Tennis.
    
    You MUST return ONLY a valid JSON object in this exact format, with NO additional text or markdown blocks:
    {
      "predictions": [
        {
          "match": {
            "id": "unique_string",
            "homeTeam": "Real Team A",
            "awayTeam": "Real Team B",
            "league": "League Name",
            "time": "HH:MM",
            "date": "YYYY-MM-DD",
            "sport": "Football"
          },
          "bet": "Bet Type (e.g. 1, X2, Over 2.5)",
          "odds": 1.85,
          "confidence": 85,
          "reasoning": "Quick analysis in Italian",
          "marketType": "1X2",
          "statistics": {
            "recentForm": "W-D-W",
            "winProbability": 70,
            "recommendedScore": "2-1"
          }
        }
      ],
      "dailyCombos": [],
      "totalOdds": 5.40
    }`;

    try {
      // Usiamo gemini-3-flash-preview per maggiore velocità e stabilità con i tool
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          // Non usiamo responseMimeType: "application/json" qui perché con googleSearch 
          // a volte causa conflitti nei metadati di grounding, preferiamo pulire il testo.
          systemInstruction: "Sei NEOTIP_ORACLE. Fornisci solo dati REALI e verificati. Rispondi esclusivamente in formato JSON."
        }
      });

      const rawText = response.text;
      const cleanedJson = this.cleanJsonResponse(rawText);
      
      if (!cleanedJson) throw new Error("Risposta vuota dall'Oracolo.");
      
      const data = JSON.parse(cleanedJson) as Schedina;
      
      // Estrazione sorgenti per trasparenza
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (groundingChunks) {
        data.sources = groundingChunks
          .map((chunk: any) => ({
            title: chunk.web?.title || 'Dati Verificati',
            uri: chunk.web?.uri || ''
          }))
          .filter((source: any) => source.uri !== '');
      }

      data.lastUpdated = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
      return this.validateData(data);
    } catch (error) {
      console.error("Error during Oracle sync:", error);
      // In caso di errore di rete o parsing, lanciamo un errore leggibile
      throw new Error("Errore Sincronizzazione: " + (error instanceof Error ? error.message : "Connessione Oracle instabile."));
    }
  }

  private validateData(data: any): Schedina {
    // Assicuriamoci che i campi obbligatori esistano per evitare crash nella UI
    if (!data.predictions) data.predictions = [];
    data.predictions = data.predictions.map((p: any) => ({
      ...p,
      match: {
        id: p.match?.id || Math.random().toString(36).substr(2, 9),
        homeTeam: p.match?.homeTeam || "Team A",
        awayTeam: p.match?.awayTeam || "Team B",
        league: p.match?.league || "Unknown League",
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

  // Implementation of sendMessageToChat for real-time user queries.
  async sendMessageToChat(message: string, lat?: number, lng?: number) {
    const ai = this.getAI();
    const tools: any[] = [{ googleSearch: {} }];
    let toolConfig: any = undefined;

    if (lat !== undefined && lng !== undefined) {
      tools.push({ googleMaps: {} });
      toolConfig = {
        retrievalConfig: {
          latLng: { latitude: lat, longitude: lng }
        }
      };
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: message,
        config: {
          tools: tools,
          toolConfig: toolConfig,
          systemInstruction: "Sei NEOTIP_ORACLE, esperto di sport e scommesse. Rispondi in italiano, sii preciso, usa dati reali da Google Search."
        }
      });

      return {
        text: response.text || "Database momentaneamente non raggiungibile.",
        groundingMetadata: response.candidates?.[0]?.groundingMetadata
      };
    } catch (e) {
      return {
        text: "Errore di connessione al nodo centrale. Riprova tra poco.",
        groundingMetadata: null
      };
    }
  }
}
