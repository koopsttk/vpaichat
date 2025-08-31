export interface SearchBackend {
  search(query: string): Promise<any[]>;
}
