const assert = require('assert');
const { renderMarkdown } = require('../public/JS/markdown.js');

function run() {
  // basic inline code
  const out1 = renderMarkdown('This is `inline` code');
  assert(out1.includes('<code class="inline">inline</code>'), 'inline code not rendered');

  // fenced code block
  const md = ['Here is code:', '```js', 'const x = 1;', '// comment', '```'].join('\n');
  const out2 = renderMarkdown(md);
  assert(out2.includes('class="codeblock"'), 'codeblock not present');
  // highlighter should wrap keywords/numbers/comments
  assert(out2.includes('class="token keyword">const</span>') || out2.includes('<span class="token keyword">const</span>'), 'keyword not highlighted');
  assert(out2.includes('class="token number">1</span>') || out2.includes('<span class="token number">1</span>'), 'number not highlighted');

  console.log('OK');
}

try { run(); } catch (e) { console.error(e); process.exit(2); }
