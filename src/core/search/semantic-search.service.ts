import { normalizeQuery } from './query-normalizer';
import { detectIntent } from './intent-detector';
import { expandSynonyms } from './synonym-expander';
import { filterDomains } from './domain-filter';
import { SearchBackend } from './search-backend.interface';

export class SemanticSearchService {
  constructor(private backend: SearchBackend) {}

  async search(rawInput: string) {
    const normalized = normalizeQuery(rawInput);
    const intent = detectIntent(normalized);
    const expanded = expandSynonyms(normalized);
    const filtered = filterDomains(expanded);
    const mustHave = this.applyMustHaveLogic(filtered, intent);
    const results = await this.backend.search(mustHave);
    return this.formatResults(results);
  }

  private applyMustHaveLogic(query: string, intent: string): string {
    // Voeg verplichte termen toe op basis van intent
    return query;
  }

  private formatResults(results: any[]): any[] {
    // Sorteer, highlight, groepeer, etc.
    return results;
  }
}
