// Simpele intentieherkenning
const INTENTS = [
  { intent: "handleiding", keywords: ["handleiding","manual","uitleg","stappenplan"] },
  { intent: "voorbeeld", keywords: ["voorbeeld","voorbeeldcode","voorbeeldscript","example"] },
  { intent: "download", keywords: ["download","installer","setup"] },
  { intent: "faq", keywords: ["faq","veelgestelde vragen"] },
];

export function detectIntent(query: string): string {
  for (const i of INTENTS) {
    if (i.keywords.some(k => query.includes(k))) return i.intent;
  }
  return "default";
}
