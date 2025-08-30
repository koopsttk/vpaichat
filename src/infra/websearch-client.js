// src/infra/websearch-client.js
// Simpele Bing Web Search client (modulair, optioneel)
// Zet BING_API_KEY in config of .env

const fetch = require('node-fetch');

async function bingWebSearch(query) {
  const apiKey = process.env.BING_API_KEY || '';
  if (!apiKey) throw new Error('Bing API key ontbreekt');
  const endpoint = 'https://api.bing.microsoft.com/v7.0/search';
  const url = `${endpoint}?q=${encodeURIComponent(query)}&count=5`;
  const res = await fetch(url, {
    headers: { 'Ocp-Apim-Subscription-Key': apiKey }
  });
  if (!res.ok) throw new Error('Websearch API error');
  const data = await res.json();
  // Return alleen de essentials
  return (data.webPages?.value || []).map(r => ({
    name: r.name,
    url: r.url,
    snippet: r.snippet
  }));
}

module.exports = { bingWebSearch };
