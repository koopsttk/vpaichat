// Quick manual test for googleWebSearch
(async () => {
  try {
    const { googleWebSearch } = require('../src/infra/websearch-client');
    const q = process.argv.slice(2).join(' ') || 'villa proctrl';
    console.log('Query:', q);
    const results = await googleWebSearch(q);
    console.log('Results:', results);
  } catch (e) {
    console.error('Test failed:', e.message);
    process.exit(1);
  }
})();
