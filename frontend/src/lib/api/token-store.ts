type TokenListener = (token: string | null) => void;

let accessToken: string | null = null;
const listeners = new Set<TokenListener>();

export const tokenStore = {
  get(): string | null {
    return accessToken;
  },

  set(token: string | null): void {
    accessToken = token;
    for (const listener of listeners) {
      listener(token);
    }
  },

  subscribe(listener: TokenListener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};