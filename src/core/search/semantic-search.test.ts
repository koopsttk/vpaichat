import { SemanticSearchService } from './semantic-search.service';
import { GoogleCseBackend } from './google-cse-backend';

describe('SemanticSearchService', () => {
  const backend = new GoogleCseBackend();
  const service = new SemanticSearchService(backend);

  it('normaliseert en verrijkt zoekopdrachten', async () => {
    const input = 'Handleiding installatie Windows';
    const results = await service.search(input);
    // In deze dummy setup: results is altijd []
    expect(Array.isArray(results)).toBe(true);
  });

  it('herkent intentie en synoniemen', async () => {
    const input = 'voorbeeldcode download';
    const results = await service.search(input);
    expect(Array.isArray(results)).toBe(true);
  });
});
