/** Simulated network latency so Phase 1 UI behaves like a real network from day one. */
export function delay(ms = 350 + Math.random() * 250): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function uuid(): string {
  return crypto.randomUUID();
}
