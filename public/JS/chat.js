/**
 * VPAICore – public/JS/chat.js
 * Rol: Renderer: chat, streaming en commands
 * Koppelingen: api.aiChat(), api.onAiChunk
 * Belangrijk: Injecteer SYSTEM_PROMPT vóór user bericht; Enter vs Shift+Enter
 *
 * Conventies:
 * - Houd main.js dun (alleen IPC doorverwijsers).
 * - Startobject is SSOT-regiekamer; pad hard uit init/ini.json of config/ini.json.
 * - AI seed: compacte index + startobject in system prompt (renderer of service).
 */

// public/js/chat.js
import { API, addMessage, toast } from "./api.js";
import { getSystemPrompt } from "./seed.js";

let lastAiMsgEl = null;
let typingTimeout = null;
// Toon typende AI-animatie na user input
export async function handleUserInput(rawText) {
  const api = API();
  const userMsg = (rawText || "").trim();
  // Beschikbare commando's (uitbreidbaar)
  const commandList = [
    { cmd: '/startobject', desc: 'Toon het volledige startobject als JSON' },
    { cmd: '/help', desc: 'Toon deze lijst met commando’s' },
    { cmd: '/key', desc: 'Open de sleutelpagina (key.html)' }
  ];

  // /help of natuurlijke taal: toon commando-overzicht
  if (userMsg === '/help' || /welke commando'?s? zijn er|commando-overzicht|help/i.test(userMsg)) {
    const lines = commandList.map(c => `${c.cmd} — ${c.desc}`);
    addMessage("ai", 'Beschikbare commando’s:\n' + lines.join('\n'));
    return;
  }
  if (!userMsg) return;

  // Speciale command: /startobject toont het startobject als AI-bericht
  if (userMsg === '/startobject') {
    if (window.api?.getStartObject) {
      try {
        const obj = await window.api.getStartObject();
        // Toon het volledige JSON-object, niet een samenvatting
        addMessage("ai", '```json\n' + JSON.stringify(obj, null, 2) + '\n```');
      } catch (e) {
        addMessage("ai", "❌ Kon startobject niet ophalen");
      }
    } else {
      addMessage("ai", "❌ getStartObject niet beschikbaar");
    }
    return;
  }

  // Speciale command: /key opent de key.html pagina
  if (userMsg === '/key') {
    if (window.api?.openKeyPage) {
      try {
        await window.api.openKeyPage();
        addMessage("ai", "De sleutelpagina is geopend.");
      } catch (err) {
        addMessage("ai", "Er is een fout opgetreden bij het openen van de sleutelpagina.");
      }
    } else {
      addMessage("ai", "De sleutelpagina kan niet worden geopend. IPC-handler ontbreekt.");
    }
    return;
  }

  // Haal context op uit app.js (indien beschikbaar)
  let contextMsgs = [];
  if (typeof window.getActiveChatContext === 'function') {
    contextMsgs = window.getActiveChatContext();
  }

  // Haal validatieparameters op uit config (via preload bridge)
  let maxInputLength = 500;
  let minInputLength = 2;
  let allowedChars = /^[\w\s.,!?@#\-]+$/;
  let forbiddenWords = [];
  let maxLines = 5;
  let allowLinks = false;
  let allowUnicode = true;
  let requireQuestion = false;
  let blockRepeatedChars = true;
  let maxWordLength = 30;
  let allowCommands = true;
  let enableForbiddenWords = true;
  try {
    if (api.getAppConfig) {
      const cfg = await api.getAppConfig();
      if (cfg?.maxInputLength) maxInputLength = cfg.maxInputLength;
      if (cfg?.minInputLength) minInputLength = cfg.minInputLength;
      if (cfg?.allowedChars) allowedChars = new RegExp(cfg.allowedChars);
      if (Array.isArray(cfg?.forbiddenWords)) forbiddenWords = cfg.forbiddenWords;
      if (cfg?.maxLines) maxLines = parseInt(cfg.maxLines, 10);
      if (cfg?.allowLinks !== undefined) allowLinks = cfg.allowLinks === true || cfg.allowLinks === 'true';
      if (cfg?.allowUnicode !== undefined) allowUnicode = cfg.allowUnicode === true || cfg.allowUnicode === 'true';
      if (cfg?.requireQuestion !== undefined) requireQuestion = cfg.requireQuestion === true || cfg.requireQuestion === 'true';
      if (cfg?.blockRepeatedChars !== undefined) blockRepeatedChars = cfg.blockRepeatedChars === true || cfg.blockRepeatedChars === 'true';
      if (cfg?.maxWordLength) maxWordLength = parseInt(cfg.maxWordLength, 10);
      if (cfg?.allowCommands !== undefined) allowCommands = cfg.allowCommands === true || cfg.allowCommands === 'true';
      if (cfg?.enableForbiddenWords !== undefined) enableForbiddenWords = cfg.enableForbiddenWords === true || cfg.enableForbiddenWords === 'true';
    }
  } catch (e) {
    // fallback op defaults
  }

  if (userMsg.length > maxInputLength) {
    toast(`Input te lang (max ${maxInputLength} tekens)`, "error");
    return;
  }
  if (userMsg.length < minInputLength) {
    toast(`Input te kort (min ${minInputLength} tekens)`, "error");
    return;
  }

  // Controleer eerst op onbekende commando's
  if (userMsg.startsWith("/")) {
    const knownCommands = commandList.map(c => c.cmd);
    if (!knownCommands.includes(userMsg)) {
      toast("Onbekend commando ingevoerd.", "error");
      return;
    }
  }

  // Validatie voor niet-toegestane tekens en andere regels
  if (!allowedChars.test(userMsg)) {
    toast("Input bevat niet-toegestane tekens.", "error");
    return;
  }
  // Blokkeer HTML-tags en HTML entities
  if (/<[a-z][\s\S]*>/i.test(userMsg) || /&[a-zA-Z0-9#]+;/.test(userMsg)) {
    toast("HTML-code of entities zijn niet toegestaan.", "error");
    return;
  }
  if (enableForbiddenWords && forbiddenWords.length && forbiddenWords.some(w => userMsg.toLowerCase().includes(w))) {
    toast("Input bevat verboden woorden.", "error");
    return;
  }
  if (userMsg.split(/\r?\n/).length > maxLines) {
    toast(`Input bevat te veel regels (max ${maxLines})`, "error");
    return;
  }
  if (!allowLinks && /(https?:\/\/|www\.)\S+/i.test(userMsg)) {
    toast("Links zijn niet toegestaan.", "error");
    return;
  }
  if (!allowUnicode && /[^\x00-\x7F]/.test(userMsg)) {
    toast("Unicode/emoji zijn niet toegestaan.", "error");
    return;
  }
  if (requireQuestion && !userMsg.includes("?")) {
    toast("Stel een vraag (vraagteken vereist)", "error");
    return;
  }
  if (blockRepeatedChars && /(.)\1{3,}/.test(userMsg)) {
    toast("Input bevat te veel herhaalde tekens.", "error");
    return;
  }
  if (userMsg.split(/\s+/).some(w => w.length > maxWordLength)) {
    toast(`Woorden mogen max ${maxWordLength} tekens zijn.`, "error");
    return;
  }
  if (!allowCommands && userMsg.startsWith("/")) {
    const knownCommands = commandList.map(c => c.cmd);
    if (!knownCommands.includes(userMsg)) {
      toast("Onbekend commando ingevoerd.", "error");
      return;
    }
  }


  addMessage("user", userMsg);

  // Typ animatie tonen voor AI
  lastAiMsgEl = addMessage("ai", "", { typing: true });
  // Typing cleanup: verwijder na 20s als er geen antwoord komt
  if (typingTimeout) clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    if (lastAiMsgEl && lastAiMsgEl.classList && lastAiMsgEl.classList.contains("typing")) {
      lastAiMsgEl.remove();
      lastAiMsgEl = null;
    }
  }, 20000);

  // Command: "open <rol> <naam?>"
  if (/^open\s+/i.test(userMsg)) {
    try {
      const parts = userMsg.trim().split(/\s+/);
      const role = parts[1] || "startobject";
      const name = parts.slice(2).join(" ") || null;
      const res = await api.openObject?.(role, name);
      if (res?.ok) {
        addMessage("ai", '📂 Object geopend:\n' + JSON.stringify(res.obj, null, 2));
      } else {
        addMessage("ai", "❌ " + (res?.error || "Kon object niet openen"));
      }
    } catch (err) {
      addMessage("ai", "❌ " + (err?.message || String(err)));
    }
    return;
  }

  // Streaming placeholder wordt nu niet meer gebruikt, want typ animatie is al getoond

  try {
    const fn = api.aiChat;
    if (typeof fn !== "function") {
      lastAiMsgEl = addMessage("ai", "❌ aiChat() niet beschikbaar");
      toast("aiChat() ontbreekt in preload API", "error");
      return;
    }
    const msgs = [];
    const SYSTEM_PROMPT = getSystemPrompt();
    if (SYSTEM_PROMPT) msgs.push({ role: "system", content: SYSTEM_PROMPT });
    // Voeg context toe (oude berichten)
    if (Array.isArray(contextMsgs) && contextMsgs.length > 0) {
      for (const m of contextMsgs) {
        if (m.role && m.message) {
          let role = m.role;
          if (role === 'ai') role = 'assistant';
          msgs.push({ role, content: m.message });
        }
      }
    }
    // Voeg huidige user prompt toe
    msgs.push({ role: "user", content: userMsg });

    const res = await fn(msgs, "gpt-4o-mini");
    if (res?.error) {
      lastAiMsgEl = addMessage("ai", "❌ " + res.error);
      toast(res.error, "error");
    }
  } catch (err) {
    lastAiMsgEl = addMessage("ai", "❌ " + (err?.message || "Onbekende fout"));
    toast("Fout: " + (err?.message || String(err)), "error");
  }
}

/** onStreamChunk(): functionele rol en contract. Zie Blauwdruk/ARCHITECTURE.md. */
export function onStreamChunk(chunk) {
  if (!chunk) return;
  // Log AI-antwoord indien logInteraction beschikbaar is (via window uit app.js)
  if (typeof window.logInteraction === 'function') {
    window.logInteraction('ai', chunk);
  }
  if (typingTimeout) {
    clearTimeout(typingTimeout);
    typingTimeout = null;
  }
  // Verwijder het oude 'typing' bericht als die er nog is
  if (lastAiMsgEl && lastAiMsgEl.classList && lastAiMsgEl.classList.contains("typing")) {
    lastAiMsgEl.remove();
    lastAiMsgEl = null;
  }
  // Voeg het AI-antwoord toe als nieuw bericht
  lastAiMsgEl = addMessage("ai", chunk);
  const chatEl = document.getElementById("chat");
  if (chatEl) chatEl.scrollTop = chatEl.scrollHeight;
}

// Luister naar websearch resultaten (automatisch door intent detection)
if (window.api?.onWebsearchResults) {
  window.api.onWebsearchResults((data) => {
    try {
      const lines = [];
      lines.push(`🔎 Websearch resultaten voor: ${data?.query || ''}`);
      if (Array.isArray(data?.results) && data.results.length) {
        data.results.forEach((r, i) => {
          // Maak een klikbare link
          const linkId = `websearch-link-${Date.now()}-${i}`;
          lines.push(`${i+1}. <a href="#" data-url="${r.url}" id="${linkId}">${r.name}</a>`);
          if (r.snippet) lines.push(`   ${r.snippet}`);
        });
      } else {
        lines.push('Geen resultaten gevonden.');
      }
      // Voeg als HTML toe
      const msgEl = addMessage('ai', lines.join('<br>'));
      // Voeg click handlers toe voor alle links
      if (msgEl) {
        const links = msgEl.querySelectorAll('a[data-url]');
        links.forEach(link => {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            const url = link.getAttribute('data-url');
            if (window.api?.openExternal && url) window.api.openExternal(url);
          });
        });
      }
    } catch (e) {
      // ignore
    }
  });
}
