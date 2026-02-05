import fetch from 'node-fetch';

const API_URL: string = 'http://localhost:3000/static/suggestions';
const QUERIES: string[] = ['lon', 'dub', 'par', 'new', 'tok'];
type SuggestionType = 'flight' | 'hotel';
const TYPES: SuggestionType[] = ['flight', 'hotel'];

async function benchmark(): Promise<void> {
  console.log('--- Search Suggestion Benchmark ---');

  for (const type of TYPES) {
    console.log(`\nTesting type: ${type}`);
    for (const q of QUERIES) {
      const start = Date.now();
      try {
        const res = await fetch(`${API_URL}?q=${encodeURIComponent(q)}&type=${type}`);
        const data = (await res.json()) as unknown[];
        const duration = Date.now() - start;
        const count = Array.isArray(data) ? data.length : 0;
        console.log(`Query: "${q}" | Response Time: ${duration}ms | Results: ${count}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Query: "${q}" failed:`, message);
      }
    }
  }

  console.log('\n--- Testing Cache (Hit) ---');
  const qHit: string = 'lon';
  const startHit: number = Date.now();
  try {
    const resHit = await fetch(`${API_URL}?q=${encodeURIComponent(qHit)}&type=hotel`);
    await resHit.json();
    const durationHit = Date.now() - startHit;
    console.log(`Query: "${qHit}" (Second time) | Response Time: ${durationHit}ms (Should be < 50ms)`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Cache test for "${qHit}" failed:`, message);
  }
}

benchmark();