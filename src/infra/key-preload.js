/**
 * VPAICore – src/infra/key_preload.js
 * Rol: Preload voor key-window
 * Koppelingen: ipcRenderer voor key-window
 * Belangrijk: —
 *
 * Conventies:
 * - Houd main.js dun (alleen IPC doorverwijzers).
 * - Startobject is SSOT-regiekamer; pad hard uit init/ini.json of config/ini.json.
 * - AI seed: compacte index + startobject in system prompt (renderer of service).
 */

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("keyWizard", {
  // test + opslaan in één flow wordt in main gedaan; hier enkel events doorgeven
  submit: (key) => ipcRenderer.invoke("key:testAndSave", key),
  cancel: () => ipcRenderer.invoke("key:cancel"),

  // Sla Google API key op via main
  saveGoogleKey: (googleKey) => ipcRenderer.invoke('save-google-key', googleKey),

  // feedback events (tekstregels uit main pushen)
  onFeedback: (cb) => {
    const channel = "key:feedback";
    const listener = (_e, msg) => { try { cb && cb(msg); } catch {} };
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
  }
});
