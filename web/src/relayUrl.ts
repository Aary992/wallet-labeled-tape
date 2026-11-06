// Where the relay lives. Dev (Vite on 5181): the local relay on 8787. Production build: the relay
// serves this page itself, so connect back to the same host (wss on https). VITE_RELAY_URL overrides both.

const sameHost = () => `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`;

export const RELAY_URL: string =
  import.meta.env.VITE_RELAY_URL ?? (import.meta.env.DEV ? "ws://localhost:8787/ws" : sameHost());
