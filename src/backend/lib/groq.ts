import Groq from "groq-sdk";

const globalForGroq = globalThis as unknown as { groq: Groq };

export function getGroq(): Groq {
  if (!globalForGroq.groq) {
    globalForGroq.groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? "placeholder" });
  }
  return globalForGroq.groq;
}

// Keep named export for backwards compat — resolved lazily via getter
export const groq = new Proxy({} as Groq, {
  get(_target, prop) {
    return (getGroq() as any)[prop];
  },
});
