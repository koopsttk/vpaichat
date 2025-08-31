// Synoniemen (NL/EN)
const SYNONYMS: Record<string, string[]> = {
  "handleiding": ["manual","uitleg"],
  "voorbeeld": ["example","voorbeeldcode"],
  "download": ["installer","setup"],
};

export function expandSynonyms(query: string): string {
  let terms = query.split(" ");
  let expanded = [...terms];
  for (const t of terms) {
    if (SYNONYMS[t]) expanded.push(...SYNONYMS[t]);
  }
  return Array.from(new Set(expanded)).join(" ");
}
