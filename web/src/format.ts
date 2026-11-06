// Number and time formatting shared by the tape, drawer and side panels.

export const usd = (n: number) => {
  const a = Math.abs(n);
  const s = a >= 1_000_000 ? `$${(a / 1_000_000).toFixed(2)}M` : a >= 1_000 ? `$${(a / 1_000).toFixed(1)}k` : `$${a.toFixed(0)}`;
  return n < 0 ? `-${s}` : s;
};

/** "+$12.4k" / "-$3.1k": for PnL, where the sign matters. */
export const signedUsd = (n: number) => (n > 0 ? `+${usd(n)}` : usd(n));

export const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

export const clock = (t: number) => new Date(t).toLocaleTimeString([], { hour12: false });

export const dayClock = (t: number) =>
  new Date(t).toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false });

export const price = (p: number) =>
  p >= 1_000 ? p.toLocaleString(undefined, { maximumFractionDigits: 1 }) : p.toFixed(p >= 10 ? 2 : 4);

/** 0.0123 -> "1.23%" */
export const pctOfOne = (x: number, digits = 1) => `${(x * 100).toFixed(digits)}%`;

/** 12.3 -> "12.3%" */
export const pct = (x: number, digits = 0) => `${x.toFixed(digits)}%`;

export const bps = (x: number) => `${x > 0 ? "+" : ""}${x.toFixed(1)} bps`;

export const duration = (seconds: number) => {
  if (seconds < 90) return `${Math.round(seconds)}s`;
  if (seconds < 90 * 60) return `${Math.round(seconds / 60)}m`;
  if (seconds < 48 * 3600) return `${(seconds / 3600).toFixed(1)}h`;
  return `${(seconds / 86400).toFixed(1)}d`;
};

export const hours = (ms: number) => `${(ms / 3_600_000).toFixed(1)} h`;
