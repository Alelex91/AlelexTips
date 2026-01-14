
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

  async generateDailySchedina(): Promise<Schedina> {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const todayISO = today.toISOString().split('T')[0];
    const tomorrowISO = tomorrow.toISOString().split('T')[0];
    
    const prompt = `USA GOOGLE SEARCH per trovare i match sportivi REALI che si giocano OGGI (${todayISO}) e DOMANI (${tomorrowISO}).
    Focus su: Serie A, Premier League, Liga, Bundesliga, NBA, Tennis ATP/WTA.
    REGOLE MANDATORIE: Ritorna un JSON con predictions e dailyCombos. Usa formati YYYY-MM-DD.`;

    const config = {
      responseMimeType: "application/json",
      tools: [{ googleSearch: {} }],
      // Il worker non supporta responseSchema complesso via fetch facilmente senza Types pesanti,
      // ma Gemini 3 Flash capisce bene il JSON richiesto dal prompt.
    };

    const data = await this.callOracle(prompt, config);
    
    try {
      const parsedData = JSON.parse(data.text);
      return { 
        ...parsedData, 
        lastUpdated: new Date().toLocaleTimeString('it-IT') 
      };
    } catch (e) {
      throw new Error("L'Oracolo ha inviato dati non validi. Riprova.");
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
