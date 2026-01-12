
import { Schedina, GroundingSource, Prediction, ComboTip } from "../types";

export class BettingService {
  private async callOracleApi(payload: any): Promise<any> {
    // Chiamata relativa che punta al Worker sullo stesso dominio
    const response = await fetch("/api/oracle/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ error: "Errore di rete." }));
      throw new Error(errData.error || "L'Oracolo non risponde correttamente.");
    }

    return await response.json();
  }

  private cleanJsonString(text: string | undefined): string {
    if (!text) return "{}";
    // Rimuove markdown code blocks e spazi superflui
    let cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      cleaned = cleaned.substring(start, end + 1);
    }
    return cleaned;
  }

  async generateDailySchedina(): Promise<Schedina> {
    try {
      const now = new Date();
      const todayStr = now.toLocaleDateString('en-CA');
      
      const prompt = `DATA: ${todayStr}. Analizza i match sportivi principali di oggi. 
      Ritorna SOLO un oggetto JSON con questa struttura: 
      { "predictions": [...], "dailyCombos": [...], "totalOdds": 10.5 }. 
      Includi match di Calcio, Basket e Tennis.`;

      const result = await this.callOracleApi({
        prompt: prompt,
        config: {
          responseMimeType: "application/json"
          // La schema definition è opzionale se il prompt è forte, ma la teniamo per sicurezza se serve
        }
      });

      const data = JSON.parse(this.cleanJsonString(result.text)) as Schedina;
      
      const chunks = result.groundingMetadata?.groundingChunks || [];
      const sources: GroundingSource[] = chunks.map((chunk: any) => ({
        title: chunk.web?.title || "Fonte Analisi",
        uri: chunk.web?.uri || ""
      })).filter((s: GroundingSource) => s.uri !== "");
      
      return { 
        ...data, 
        sources: sources.slice(0, 5), 
        lastUpdated: new Date().toLocaleTimeString('it-IT') 
      };
    } catch (error: any) {
      console.error("BettingService Error:", error);
      throw error;
    }
  }

  // Aggiunto supporto per coordinate e grounding nel bot di chat per risolvere l'errore di firma
  async sendMessageToChat(message: string, lat?: number, lng?: number): Promise<any> {
    const isLocationAvailable = lat !== undefined && lng !== undefined;
    
    return this.callOracleApi({
      prompt: message,
      // Il grounding di Maps richiede modelli serie 2.5. Per chat generica usiamo Gemini 3 Flash.
      model: isLocationAvailable ? 'gemini-2.5-flash-lite-latest' : 'gemini-3-flash-preview',
      config: {
        systemInstruction: "Sei NeoTip Oracle, un esperto di analisi sportiva futuristica. Utilizza le informazioni in tempo reale per fornire consigli accurati.",
        // Abilita Search e Maps grounding se la posizione è disponibile per migliorare le risposte
        tools: isLocationAvailable ? [{ googleMaps: {} }, { googleSearch: {} }] : [{ googleSearch: {} }],
        ...(isLocationAvailable && {
          toolConfig: {
            retrievalConfig: {
              latLng: {
                latitude: lat,
                longitude: lng
              }
            }
          }
        })
      }
    });
  }
}
