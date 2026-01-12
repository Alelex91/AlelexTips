// src/worker.ts

export interface Env {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    // Serve la tua app buildata (dist/) come sito statico
    return env.ASSETS.fetch(req);
  },
};
