/**
 * VPAICore – public/JS/api.js
 * Rol: Renderer helper: DOM + veilige toegang tot preload API
 * Koppelingen: renderer-modules, preload window.api.*
 * Belangrijk: —
 *
 * Conventies:
 * - Houd main.js dun (alleen IPC doorverwijzers).
 * - Startobject is SSOT-regiekamer; pad hard uit init/ini.cfg of config/ini.cfg.
 * - AI seed: compacte index + startobject in system prompt (renderer of service).
 */

// public/js/api.js
/** API(): functionele rol en contract. Zie Blauwdruk/ARCHITECTURE.md. */
export function API() {
  return window.api ?? window.vpaicore ?? {};
}
/** onSafe(): functionele rol en contract. Zie Blauwdruk/ARCHITECTURE.md. */
export function onSafe(el, evt, fn, opts) {
  if (el) el.addEventListener(evt, fn, opts);
}
/** addMessage(): functionele rol en contract. Zie Blauwdruk/ARCHITECTURE.md. */
import { renderMarkdown } from './markdown.js';

export function addMessage(role, text = "", opts = {}) {
  const chatEl = document.getElementById("chat");
  if (!chatEl) return null;
  const m = document.createElement("div");
  m.className = "msg " + role + (opts.typing ? " typing" : "");
  if (opts.typing) {
    m.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
  } else {
    // AI-berichten krijgen een kopieerknop
    if (role === "ai") {
      // hoofdtekst
      const content = document.createElement("div");
      content.className = "msg-content";
      // render markdown -> safe because renderMarkdown escapes
      content.innerHTML = renderMarkdown(text);
      m.appendChild(content);
      // kopieerknop
      const btn = document.createElement("button");
      btn.className = "copyBtn";
      btn.title = "Kopieer";
      btn.innerHTML = '📋';
      btn.onclick = function(e) {
        e.stopPropagation();
        try {
          // Try to reproduce exact visible selection like a user would do.
          const text = getVisibleTextViaSelection(content);
          if (text && text.length) {
            navigator.clipboard.writeText(text);
            btn.innerHTML = '✔️';
            setTimeout(() => { btn.innerHTML = '📋'; }, 1200);
            return;
          }
        } catch (err) {
          // fallback below
        }
        // Fallback: DOM-aware plain text extraction + normalization
        const raw = elementToPlainText(content);
        const normalized = normalizePlainText(raw);
        navigator.clipboard.writeText(normalized);
        btn.innerHTML = '✔️';
        setTimeout(() => { btn.innerHTML = '📋'; }, 1200);
      };
      m.appendChild(btn);
    } else {
      m.textContent = text;
    }
  }
  chatEl.appendChild(m);
  chatEl.scrollTop = chatEl.scrollHeight;
  return m;
}

// Normalizes multiline text for tight copy/paste:
// - split into lines, trim each line (remove trailing spaces and NBSPs)
// - collapse multiple blank lines into a single blank line
// - remove leading/trailing blank lines
export function normalizePlainText(s) {
  if (s == null) return '';
  // Normalize line endings into \n and split
  const lines = String(s).replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let lastWasEmpty = false;
  for (let rawLine of lines) {
    // replace NBSP and trim both ends
    const line = rawLine.replace(/\u00A0/g, ' ').trim();
    if (line === '') {
      if (!lastWasEmpty) {
        // preserve a single blank line between paragraphs
        out.push('');
        lastWasEmpty = true;
      }
      continue;
    }
    out.push(line);
    lastWasEmpty = false;
  }
  // remove leading/trailing blank lines
  while (out.length && out[0] === '') out.shift();
  while (out.length && out[out.length - 1] === '') out.pop();
  return out.join('\n');
}

// Convert message HTML content into a predictable plain-text representation
function elementToPlainText(el) {
  if (!el) return '';
  // If there is an ordered list, prefer explicit numbering
  const ol = el.querySelector('ol');
  if (ol) {
    const items = Array.from(ol.querySelectorAll('li'))
      .map((li, i) => `${i + 1}. ${li.innerText.replace(/\u00A0/g, ' ').trim()}`);
    return items.join('\n');
  }
  // If unordered list(s) present, use dash prefix
  const ul = el.querySelector('ul');
  if (ul) {
    const items = Array.from(ul.querySelectorAll('li'))
      .map(li => `- ${li.innerText.replace(/\u00A0/g, ' ').trim()}`);
    return items.join('\n');
  }

  // If there are multiple paragraphs, return as a single blob (join with spaces)
  const ps = Array.from(el.querySelectorAll('p'))
    .map(p => p.innerText.replace(/\u00A0/g, ' ').trim())
    .filter(t => t.length > 0);
  if (ps.length > 1) {
    return ps.join(' ');
  }

  // Fallback: use innerText (single paragraph or other content)
  return (el.innerText || '').replace(/\u00A0/g, ' ').trim();
}

// Programmatically select the visible content of an element and return the
// text that the browser would copy when a user selects it manually.
function getVisibleTextViaSelection(el) {
  if (!el) return '';
  const sel = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(el);
  sel.removeAllRanges();
  sel.addRange(range);
  // toString() gives the same text as a manual selection would
  const text = sel.toString();
  // clear selection to avoid visual selection linger
  sel.removeAllRanges();
  // trim leading/trailing empty lines but otherwise keep visible formatting
  return normalizePlainText(text);
}
/** toast(): functionele rol en contract. Zie Blauwdruk/ARCHITECTURE.md. */
export function toast(msg, kind = "warn") {
  const t = document.createElement("div");
  t.className = "toast" + (kind === "error" ? " error" : "");
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}
/** setTitleAndDescription(): functionele rol en contract. Zie Blauwdruk/ARCHITECTURE.md. */
export function setTitleAndDescription(titel, description) {
  const tEl = document.getElementById("appTitle") || document.querySelector("[data-start-title]");
  const dEl = document.getElementById("appDescription") || document.querySelector("[data-start-desc]");
  if (tEl && titel != null) tEl.textContent = titel || "Ongetitelde installatie";
  if (dEl && description != null) dEl.textContent = description || "";
}
