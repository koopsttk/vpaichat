import { SearchBackend } from './search-backend.interface';

export class GoogleCseBackend implements SearchBackend {
  async search(query: string): Promise<any[]> {
    // Hier zou je de Google CSE API call doen
    // return fetchGoogleCse(query);
    return [];
  }
}
