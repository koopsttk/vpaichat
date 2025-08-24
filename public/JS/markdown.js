// Lightweight Markdown renderer + minimal syntax highlighter
// Supports: headings, paragraphs, links, bold/italic, inline code, fenced code blocks
// and a tiny regex-based highlighter for common languages (js, py, bash).

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function highlightCode(code, lang) {
  // Very small keyword-based highlighter using placeholders to avoid
  // accidental replacements inside generated HTML attributes.
  if (!lang) {
    if (/^\s*(function|const|let|var|class)\b/.test(code)) lang = 'js';
    else if (/^\s*(def|class|import)\b/.test(code)) lang = 'py';
    else lang = '';
  }

  const placeholders = [];
  function addPlaceholder(html) {
    const id = `__PH_${placeholders.length}__`;
    placeholders.push(html);
    return id;
  }

  let temp = code;

  // Capture strings and comments first, replace with placeholders (store escaped HTML)
  // If highlight.js is available in the page, prefer it for more accurate highlighting
  try {
    if (typeof window !== 'undefined' && window.hljs) {
      if (lang) {
        const got = window.hljs.highlight(code, { language: lang, ignoreIllegals: true });
        return got.value;
      }
      const auto = window.hljs.highlightAuto(code);
      return auto.value;
    }
  } catch (e) {
    // fallthrough to builtin
  }

  if (lang === 'js' || lang === 'javascript' || lang === 'ts') {
    // strings
    temp = temp.replace(/("[^"\n]*"|'[^'\n]*'|`[^`]*`)/g, (m) => addPlaceholder(`<span class="token string">${escapeHtml(m)}</span>`));
    // comments
    temp = temp.replace(/(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g, (m) => addPlaceholder(`<span class="token comment">${escapeHtml(m)}</span>`));
    // Now replace keywords/numbers on non-placeholder chunks
    const parts = temp.split(/(__PH_\d+__)/);
    for (let i = 0; i < parts.length; i++) {
      if (/^__PH_\d+__$/.test(parts[i])) continue;
      parts[i] = escapeHtml(parts[i])
        .replace(/\b(const|let|var|function|return|if|else|for|while|class|new|import|from|export|async|await|try|catch)\b/g, '<span class="token keyword">$1</span>')
        .replace(/\b(0x[0-9a-fA-F]+|\d+(?:\.\d+)?)\b/g, '<span class="token number">$1</span>');
    }
    temp = parts.map(p => {
      const m = p.match(/^__PH_(\d+)__$/);
      if (m) return placeholders[parseInt(m[1], 10)];
      return p;
    }).join('');
    return temp;
  } else if (lang === 'py' || lang === 'python') {
    // strings
    temp = temp.replace(/("""[\s\S]*?"""|'''[\s\S]*?'''|"[^"\n]*"|'[^'\n]*')/g, (m) => addPlaceholder(`<span class="token string">${escapeHtml(m)}</span>`));
    // comments
    temp = temp.replace(/(#.*$)/gm, (m) => addPlaceholder(`<span class="token comment">${escapeHtml(m)}</span>`));
    const parts = temp.split(/(__PH_\d+__)/);
    for (let i = 0; i < parts.length; i++) {
      if (/^__PH_\d+__$/.test(parts[i])) continue;
      parts[i] = escapeHtml(parts[i])
        .replace(/\b(def|class|import|from|as|if|elif|else|for|while|return|with|try|except|async|await|pass|yield|in|is|and|or|not)\b/g, '<span class="token keyword">$1</span>')
        .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="token number">$1</span>');
    }
    temp = parts.map(p => {
      const m = p.match(/^__PH_(\d+)__$/);
      if (m) return placeholders[parseInt(m[1], 10)];
      return p;
    }).join('');
    return temp;
  } else if (lang === 'sh' || lang === 'bash') {
    // comments
    temp = temp.replace(/(^|\s)(#.*$)/gm, (m, p1, p2) => p1 + addPlaceholder(`<span class="token comment">${escapeHtml(p2)}</span>`));
    const parts = temp.split(/(__PH_\d+__)/);
    for (let i = 0; i < parts.length; i++) {
      if (/^__PH_\d+__$/.test(parts[i])) continue;
      parts[i] = escapeHtml(parts[i])
        .replace(/\b(echo|cd|ls|mv|cp|rm|cat|grep|sed|awk|chmod|chown|if|then|fi|for|in|do|done)\b/g, '<span class="token keyword">$1</span>');
    }
    temp = parts.map(p => {
      const m = p.match(/^__PH_(\d+)__$/);
      if (m) return placeholders[parseInt(m[1], 10)];
      return p;
    }).join('');
    return temp;
  } else {
    // fallback: highlight backticks and basic tokens
    temp = temp.replace(/(`[^`]*`)/g, (m) => `<span class="token string">${escapeHtml(m)}</span>`);
    return escapeHtml(temp);
  }
}

export function renderMarkdown(text) {
  if (text == null) return '';
  // Normalize newlines
  const src = String(text).replace(/\r\n/g, '\n');

  // Handle fenced code blocks ```lang\n...```
  let out = '';
  const lines = src.split('\n');
  let inCode = false;
  let codeLang = '';
  let codeBuf = [];

  function flushCode() {
    if (!inCode) return '';
    const code = codeBuf.join('\n');
  const highlighted = highlightCode(code, codeLang);
  codeBuf = [];
  inCode = false;
  codeLang = '';
  // wrap the code block in a container so we can add a per-block copy button
  return `<div class="codewrap"><div class="codebar"><button class="copy-code" data-lang="${escapeHtml(codeLang)}" title="Kopieer code">📋</button></div><pre class="codeblock"><code class="hljs" data-lang="${escapeHtml(codeLang)}">${highlighted}</code></pre></div>`;
  }

  let openFence = '';
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const fenceMatch = l.match(/^(`{1,3})\s*(\S+)?\s*$/);
    if (fenceMatch) {
      const fence = fenceMatch[1];
      const lang = fenceMatch[2] || '';
      if (!inCode) {
        inCode = true;
        openFence = fence;
        codeLang = lang;
        codeBuf = [];
      } else if (fence === openFence) {
        // closing fence
        out += flushCode() + '\n';
        openFence = '';
      } else {
        // inside code: treat as regular line
        codeBuf.push(l);
      }
      continue;
    }
    if (inCode) {
      codeBuf.push(l);
      continue;
    }
    // headings
    const h = l.match(/^\s{0,3}(#{1,6})\s+(.*)$/);
    if (h) {
      const level = Math.min(6, h[1].length);
      out += `<h${level}>${escapeHtml(h[2])}</h${level}>` + '\n';
      continue;
    }
    // horizontal rule
    if (/^\s*([-*_]){3,}\s*$/.test(l)) { out += '<hr/>' + '\n'; continue; }
    // empty line -> paragraph break
    if (/^\s*$/.test(l)) { out += '<p></p>' + '\n'; continue; }

    // inline formatting: bold, italic, inline code, links
    let processed = escapeHtml(l)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="inline">$1</code>')
      .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer noopener">$1</a>');

    out += `<p>${processed}</p>` + '\n';
  }

  if (inCode) {
    out += flushCode();
  }

  return out;
}

export default { renderMarkdown };
