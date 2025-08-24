/**
 * VPAICore – public/JS/app.js
 * Rol: Renderer entrypoint: events binden en orkestreren
 * Koppelingen: api.js, seed.js, status.js, chat.js
 * Belangrijk: —
 *
 * Conventies:
 * - Houd main.js dun (alleen IPC doorverwijzers).
 * - Startobject is SSOT-regiekamer; pad hard uit init/ini.cfg of config/ini.cfg.
 * - AI seed: compacte index + startobject in system prompt (renderer of service).
 */

// public/js/app.js
import { API, onSafe, toast } from "./api.js";
import { loadSeedAndBindUI } from "./seed.js";
import { refreshStatus, refreshKeyStatus } from "./status.js";
import { handleUserInput, onStreamChunk } from "./chat.js";

/** autoGrowTextarea(): functionele rol en contract. Zie Blauwdruk/ARCHITECTURE.md. */
function autoGrowTextarea(e) {
  const el = e.target;
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}

document.addEventListener("DOMContentLoaded", async () => {
  const api = API();
  const sendBtn = document.getElementById("send");
  const inputEl = document.getElementById("input");
  const form = document.getElementById("apiKeyForm");
  const keyStatus = document.getElementById('st-key');

  // 1) Seed (startobject + index) + UI vullen
  await loadSeedAndBindUI();

  // 2) Status
  await refreshStatus();

  // 3) Events
  onSafe(sendBtn, "click", async () => {
    if (!inputEl) return;
    const txt = inputEl.value;
    inputEl.value = "";
    inputEl.style.height = "auto";
    await handleUserInput(txt);
  });

  onSafe(inputEl, "keydown", (e) => {
    if (e.isComposing) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const txt = inputEl.value;
      inputEl.value = "";
      inputEl.style.height = "auto";
      handleUserInput(txt);
    }
  });
  onSafe(inputEl, "input", autoGrowTextarea);

  // 4) Live updates vanuit main via preload-bridge (optioneel)
  api.onSetTitle?.((t) => {
    const el = document.getElementById("appTitle") || document.querySelector("[data-start-title]");
    if (el) el.textContent = t || el.textContent;
  });
  api.onSetDescription?.((d) => {
    const el = document.getElementById("appDescription") || document.querySelector("[data-start-desc]");
    if (el) el.textContent = d || el.textContent;
  });
  api.onAiChunk?.((chunk) => onStreamChunk(chunk));

  // 5) API-key formulier (optioneel)
  onSafe(form, "submit", async (e) => {
    e.preventDefault();
    const key = document.getElementById("apiKeyInput")?.value?.trim();
    if (!key) return;
    const setter = api.setApiKey ?? window.vpaicore?.setApiKey;
    if (setter) await setter(key);
    await refreshStatus();
    toast("API-key opgeslagen", "ok");
  });
}); // <-- deze regel sluit alles netjes af

window.addEventListener("DOMContentLoaded", () => {
  refreshKeyStatus();
});


