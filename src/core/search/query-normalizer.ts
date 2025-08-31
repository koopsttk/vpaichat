// Query normalisatie: lowercase, trim, stopwoorden, speciale tekens
const STOPWORDS = ["de","het","een","en","of","voor","in","op","met","van","te"];

export function normalizeQuery(input: string): string {
  let q = input.toLowerCase().trim();
  q = q.replace(/[^\w\s]/gi, " "); // verwijder speciale tekens
  q = q.replace(/\s+/g, " "); // dubbele spaties
  q = q.split(" ").filter(w => w && !STOPWORDS.includes(w)).join(" ");
  return q;
}
