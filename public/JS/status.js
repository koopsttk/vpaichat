/**
 * VPAICore – public/JS/status.js
 * Rol: Renderer: statusbalk (model/key/data)
 * Koppelingen: api.getAppConfig(), api.getStartObject()
 * Belangrijk: —
 *
 * Conventies:
 * - Houd main.js dun (alleen IPC doorverwijzers).
 * - Startobject is SSOT-regiekamer; pad hard uit init/ini.json of config/ini.json.
 * - AI seed: compacte index + startobject in system prompt (renderer of service).
 */

// public/js/status.js
import { API } from "./api.js";

export async function refreshStatus() {
  const api = API();
  // Model/key
  try {
    const cfg = await api.getAppConfig();
    console.log("AppConfig in status.js:", cfg);
    const modelEl = document.getElementById("st-model");
    const keyEl   = document.getElementById("st-key");
  if (modelEl) modelEl.textContent = `model: ${cfg?.model || '–'}`;
    // if (keyEl) keyEl.textContent = `key: ${cfg?.apiKey ? "✔" : "?"}`; // <-- UITZETTEN OF VERWIJDEREN
  } catch {
    const modelEl = document.getElementById("st-model");
    const keyEl   = document.getElementById("st-key");
    if (modelEl) modelEl.textContent = `model: –`;
   // if (keyEl)   keyEl.textContent   = `key: ?`;
  }
  // Data/startobject
  try {
    const s = await (api.getStartObject?.() ?? null);
    const dataEl = document.getElementById("st-data");
    if (dataEl) dataEl.textContent = `data: ${s ? "✔" : "!"}`;
  } catch {
    const dataEl = document.getElementById("st-data");
    if (dataEl) dataEl.textContent = `data: !`;
  }
}

export async function refreshKeyStatus() {
  const keyEl = document.getElementById("st-key");
  if (!keyEl) return;
  const status = await window.api.getKeyStatus();
  keyEl.textContent = `key: ${status?.hasKey ? "✔" : "?"}`;
}
