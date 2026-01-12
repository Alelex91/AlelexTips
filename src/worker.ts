export interface Env {
  ASSETS: Fetcher;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    // qui in futuro puoi aggiungere /api/...
    return env.ASSETS.fetch(req);
  }
};
