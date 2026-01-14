import { GoogleGenAI } from "@google/genai";

export interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  GEMINI_API_KEY: string;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    // ✅ test
    if (url.pathname === "/api/health") {
      return json({ ok: true });
    }

    // ✅ sync oracle
    if (url.pathname === "/api/oracle/sync") {
      if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

      const body = await req.json().catch(() => ({} as any));
      const prompt = body?.prompt ?? "";

      if (!prompt) return json({ ok: false, error: "Missing prompt" }, 400);

      try {
        const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
        const resp = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });

        return json({ ok: true, text: resp.text });
      } catch (e: any) {
        return json({ ok: false, error: e?.message ?? String(e) }, 500);
      }
    }

    // ✅ tutto il resto: sito
    return env.ASSETS.fetch(req);
  },
};
