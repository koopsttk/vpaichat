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

export async function handleUserInput(rawText) {
  const api = API();
  const userMsg = (rawText || "").trim();
  if (!userMsg) return;

  addMessage("user", userMsg);

  // Command: "open <rol> <naam?>"
  if (/^open\s+/i.test(userMsg)) {
    try {
      const parts = userMsg.trim().split(/\s+/);
      const role = parts[1] || "startobject";
      const name = parts.slice(2).join(" ") || null;
      const res = await api.openObject?.(role, name);
      if (res?.ok) addMessage("ai", `📂 Object geopend:\n${JSON.stringify(res.obj, null, 2)}`);
      else addMessage("ai", "❌ " + (res?.error || "Kon object niet openen"));
    } catch (err) {
      addMessage("ai", "❌ " + (err?.message || String(err)));
    }
    return;
  }

  // Streaming placeholder
  lastAiMsgEl = addMessage("ai", "");

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
    lastAiMsgEl = addMessage("ai", "");
  }
  lastAiMsgEl.textContent += chunk;
  const chatEl = document.getElementById("chat");
  if (chatEl) chatEl.scrollTop = chatEl.scrollHeight;
}
