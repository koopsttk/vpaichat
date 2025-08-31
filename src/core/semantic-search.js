// src/core/semantic-search.js
// Semantische zoekpipeline voor websearch (NL/EN, zonder LLM)

// Stopwoordenlijst NL
const STOPWORDS = ["de","het","een","en","of","voor","in","op","met","van","te"];
// Simpele intent mapping
const INTENTS = [
  { intent: "handleiding", keywords: ["handleiding","manual","uitleg","stappenplan"] },
  { intent: "voorbeeld", keywords: ["voorbeeld","voorbeeldcode","voorbeeldscript","example"] },
  { intent: "download", keywords: ["download","installer","setup"] },
  { intent: "faq", keywords: ["faq","veelgestelde vragen"] },
];
// Synoniemen NL/EN
const SYNONYMS = {
  "handleiding": ["manual","uitleg"],
  "voorbeeld": ["example","voorbeeldcode"],
  "download": ["installer","setup"],
};
// Whitelist/blacklist domeinen
// WHITELIST: configureerbaar via config/ini.json key `search.whitelist` (comma-separated)
// of environment variable `WEBSEARCH_WHITELIST`. If not set, no whitelist is applied.
const BLACKLIST = ["marktplaats.nl","bol.com"];

function loadWhitelist() {
  // env var takes precedence
  const fromEnv = process.env.WEBSEARCH_WHITELIST;
  if (fromEnv && fromEnv.trim()) return fromEnv.split(',').map(s => s.trim()).filter(Boolean);
  try {
    const { getConfig } = require('./config-service');
    const cfg = getConfig();
    const raw = cfg.kv['search.whitelist'] || cfg.kv['websearch.whitelist'] || cfg.kv['whitelist'] || '';
    if (raw && typeof raw === 'string') {
      return raw.split(',').map(s => s.trim()).filter(Boolean);
    }
  } catch (e) {
    // ignore: config may not be available in some test contexts
  }
  return [];
}

const WHITELIST = loadWhitelist();

function normalizeQuery(input) {
  let q = input.toLowerCase().trim();
  q = q.replace(/[^\w\s]/gi, " ");
  q = q.replace(/\s+/g, " ");
  q = q.split(" ").filter(w => w && !STOPWORDS.includes(w)).join(" ");
  return q;
}

function detectIntent(query) {
  for (const i of INTENTS) {
    if (i.keywords.some(k => query.includes(k))) return i.intent;
  }
  return "default";
}

function expandSynonyms(query) {
  let terms = query.split(" ");
  let expanded = [...terms];
  for (const t of terms) {
    if (SYNONYMS[t]) expanded.push(...SYNONYMS[t]);
  }
  return Array.from(new Set(expanded)).join(" ");
}

function filterDomains(results) {
  const out = [];
  for (const r of results) {
    const url = r.link || r.url || "";
    let rejectedReason = null;
    if (BLACKLIST.some(b => url.includes(b))) rejectedReason = 'blacklist';
    else if (WHITELIST.length && !WHITELIST.some(w => url.includes(w))) rejectedReason = 'not-in-whitelist';
    if (rejectedReason) {
      try { console.debug('[semantic-search] filter-drop', { url, reason: rejectedReason }); } catch (e) {}
      continue;
    }
    out.push(r);
  }
  return out;
}

function applyMustHaveLogic(query, intent) {
  // Voeg verplichte termen toe op basis van intent
  // Voorbeeld: intent 'handleiding' => voeg 'manual' toe
  if (intent === "handleiding" && !query.includes("manual")) {
    query += " manual";
  }
  return query;
}

async function semanticWebsearch(rawInput, backendSearchFn) {
  const normalized = normalizeQuery(rawInput);
  const intent = detectIntent(normalized);
  const expanded = expandSynonyms(normalized);
  const mustHave = applyMustHaveLogic(expanded, intent);
  // Korte queries aanvullen met extra contextwoorden voor betere SERP-variatie
  let finalQuery = mustHave;
  if (finalQuery.split(/\s+/).filter(Boolean).length < 3) {
    finalQuery = (finalQuery + ' informatie prijs overzicht').trim();
  }

  // Debug: log pipeline state (zichtbaar in main process console)
  try { console.debug('[semantic-search] pipeline', { rawInput, normalized, intent, mustHave, finalQuery }); } catch (e) {}
  const results = await backendSearchFn(finalQuery);
  const filtered = filterDomains(results);
  try { console.debug(`[semantic-search] results: incoming=${results.length} filtered=${filtered.length}`); } catch (e) {}
  return filtered;
}

module.exports = { semanticWebsearch };
