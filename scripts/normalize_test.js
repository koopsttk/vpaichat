const api = require('../public/JS/api.js');
const samples = [
  `1. Melk  \n\n\n\n2. Brood  \n\n\n\n3. Eieren  `,
  `Eén regel  \n\n\n\nTweede regel  \n\nDerde regel`,
  `Line with NBSP\u00A0\u00A0 \n\nNext line  `
];
for (const s of samples) {
  console.log('--- RAW ---');
  console.log(s);
  console.log('--- NORMALIZED ---');
  console.log(api.normalizePlainText(s));
  console.log('\n');
}
