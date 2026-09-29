// Grounding guard: an LLM-phrased message may only contain numbers that already exist in the
// deterministic facts/cards. Anything else is treated as a hallucination and discarded.

const NUM = /\d[\d,]*(?:\.\d+)?/g;

const normalise = (s: string) => s.replace(/,/g, "").replace(/\.0+$/, "");

export function numbersIn(text: string): string[] {
  return (text.match(NUM) ?? []).map(normalise);
}

export function isGrounded(message: string, grounding: string): boolean {
  const allowed = new Set(numbersIn(grounding));
  // Allow tiny structural numbers (e.g. "2 sentences", "7 days", "14 days") only if present in grounding too.
  return numbersIn(message).every((n) => allowed.has(n));
}
