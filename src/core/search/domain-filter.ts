// Whitelist/blacklist logica
const WHITELIST = ["tweedekamer.nl","rijksoverheid.nl"];
const BLACKLIST = ["marktplaats.nl","bol.com"];

export function filterDomains(query: string): string {
  // In deze fase: dummy, want filtering gebeurt op resultaatniveau
  return query;
}

export function isDomainAllowed(domain: string): boolean {
  if (BLACKLIST.some(b => domain.includes(b))) return false;
  if (WHITELIST.length && !WHITELIST.some(w => domain.includes(w))) return false;
  return true;
}
