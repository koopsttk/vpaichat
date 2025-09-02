const md = require('../public/JS/markdown.js');
const src = `1. Melk  



2. Brood  



3. Eieren  



4. Kaas  



5. Tomaten  



6. Appels  



7. Kipfilet  



8. Pasta  



9. Groenten  



10. Yoghurt  `;
console.log(md.renderMarkdown(src));
