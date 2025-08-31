// src/infra/websearch-client.js
// Google Custom Search (CSE) client + simpele NL parser

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { decrypt } = require('./api-key-store');

let googleApiKey = null;
function loadGoogleKey() {
  if (googleApiKey) return googleApiKey;
  try {
    const file = path.resolve(__dirname, '../../config/googlekey.enc');
    if (!fs.existsSync(file)) return null;
    const enc = fs.readFileSync(file, 'utf-8');
    googleApiKey = decrypt(enc);
    return googleApiKey;
  } catch (e) {
    console.warn('[websearch] Kon googlekey.enc niet laden/decrypten:', e.message);
    return null;
  }
}

async function googleWebSearch(query) {
  const key = loadGoogleKey();
  if (!key) throw new Error('Google API key ontbreekt (sla deze eerst op in Key wizard)');
  if (!query || !query.trim()) throw new Error('Lege zoekquery');
  const endpoint = 'https://www.googleapis.com/customsearch/v1';
  const cx = process.env.GOOGLE_CSE_ID || 'c22ac0c1f92584efa'; // TODO: configurabel maken
  const url = `${endpoint}?key=${encodeURIComponent(key)}&cx=${encodeURIComponent(cx)}&q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text().catch(()=>res.statusText);
      throw new Error(`Google Websearch API error: ${res.status} ${res.statusText} ${text}`);
    }
    const data = await res.json();
    return (data.items || []).map(r => ({
      title: r.title,
      link: r.link,
      snippet: r.snippet
    }));
  } catch (err) {
    throw err;
  }
}

function parseNaturalLanguage(input) {
  if (!input) return '';
  let cleaned = input.trim();
  // Verwijder NL zoek-intent woorden aan begin
  cleaned = cleaned.replace(/^(ik\s+)?(wil\s+)?(graag\s+)?(opnieuw\s+)?(zoek|zoeken|vind|zoeken naar|zoek op het internet naar)\s+/i, '');
  cleaned = cleaned.replace(/^(een|het|de)\s+/i, '').trim();

  // Synoniemen / normalisatie
  const synonyms = [
    { pattern: /\bspreekgestoelte(n)?\b/gi, expand: 'spreekgestoelte lectern spreekgestoelte katheder spreekgestoelte lessenaar' },
    { pattern: /\bkatheder(s)?\b/gi, expand: 'katheder lectern spreekgestoelte lessenaar' },
    { pattern: /\blessenaar(en)?\b/gi, expand: 'lessenaar lectern spreekgestoelte' }
  ];
  let augmented = cleaned;
  for (const s of synonyms) {
    if (s.pattern.test(cleaned)) {
      augmented += ' ' + s.expand;
    }
  }
  return augmented.trim();
}

async function searchWithNaturalLanguage(input) {
  const query = parseNaturalLanguage(input);
  // Korte queries aanvullen met extra context woorden voor betere SERP variatie
  let finalQuery = query;
  if (finalQuery.split(/\s+/).length < 3) {
    finalQuery += ' informatie prijs overzicht';
  }
  return googleWebSearch(finalQuery);
}

module.exports = { searchWithNaturalLanguage, googleWebSearch };
