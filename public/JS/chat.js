/**
 * VPAICore – public/JS/chat.js
 * Rol: Renderer: chat, streaming en commands
 * Koppelingen: api.aiChat(), api.onAiChunk
 * Belangrijk: Injecteer SYSTEM_PROMPT vóór user bericht; Enter vs Shift+Enter
 *
 * Conventies:
 * - Houd main.js dun (alleen IPC doorverwijzers).
 * - Startobject is SSOT-regiekamer; pad hard uit init/ini.cfg of config/ini.cfg.
 * - AI seed: compacte index + startobject in system prompt (renderer of service).
 */

// public/js/chat.js
import { API, addMessage, toast } from "./api.js";
import { getSystemPrompt } from "./seed.js";

let lastAiMsgEl = null;
// Toon typende AI-animatie na user input
export async function handleUserInput(rawText) {
  const api = API();
  const userMsg = (rawText || "").trim();
  if (!userMsg) return;

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
    toast("Commando's zijn niet toegestaan.", "error");
    return;
  }

  addMessage("user", userMsg);

  // Typ animatie tonen voor AI
  lastAiMsgEl = addMessage("ai", "", { typing: true });

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
      lastAiMsgEl.textContent = "❌ aiChat() niet beschikbaar";
      toast("aiChat() ontbreekt in preload API", "error");
      return;
    }
    const msgs = [];
    const SYSTEM_PROMPT = getSystemPrompt();
    if (SYSTEM_PROMPT) msgs.push({ role: "system", content: SYSTEM_PROMPT });
    msgs.push({ role: "user", content: userMsg });

    const res = await fn(msgs, "gpt-4o-mini");
    if (res?.error) {
      lastAiMsgEl.textContent = "❌ " + res.error;
      toast(res.error, "error");
    }
  } catch (err) {
    lastAiMsgEl.textContent = "❌ " + (err?.message || "Onbekende fout");
    toast("Fout: " + (err?.message || String(err)), "error");
  }
}

/** onStreamChunk(): functionele rol en contract. Zie Blauwdruk/ARCHITECTURE.md. */
export function onStreamChunk(chunk) {
  if (!chunk) return;
  if (!lastAiMsgEl || !lastAiMsgEl.isConnected) {
    lastAiMsgEl = addMessage("ai", "", { typing: true });
  }
  // Vervang typ animatie door echte tekst als eerste chunk binnenkomt
  if (lastAiMsgEl.classList.contains("typing")) {
    lastAiMsgEl.classList.remove("typing");
    lastAiMsgEl.innerHTML = "";
  }
  lastAiMsgEl.textContent += chunk;
  const chatEl = document.getElementById("chat");
  if (chatEl) chatEl.scrollTop = chatEl.scrollHeight;
}
