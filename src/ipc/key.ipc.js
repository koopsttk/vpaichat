/**
 * VPAICore – src/ipc/key.ipc.js
 * Rol: IPC handlers: API-key beheren
 * Koppelingen: apiKeyStore
 * Belangrijk: —
 *
 * Conventies:
 * - Houd main.js dun (alleen IPC doorverwijzers).
 * - Startobject is SSOT-regiekamer; pad hard uit init/ini.json of config/ini.json.
 * - AI seed: compacte index + startobject in system prompt (renderer of service).
 */

// src/ipc/key.ipc.js
const { app, BrowserWindow } = require("electron");
const { saveApiKey } = require("../infra/api-key-store");
const { OpenAI } = require("openai");

/** feedback(): functionele rol en contract. Zie Blauwdruk/ARCHITECTURE.md. */
function feedback(win, msg) {
  try { win?.webContents.send("key:feedback", msg); } catch {}
}

/** registerKeyIpc(): functionele rol en contract. Zie Blauwdruk/ARCHITECTURE.md. */
function registerKeyIpc(ipcMain) {
  // handlers eerst netjes verwijderen (idempotent)
  try { ipcMain.removeHandler("key:testAndSave"); } catch {}
  try { ipcMain.removeHandler("key:cancel"); } catch {}

  // IPC: 'key:testAndSave' → doorverwijzer naar service
ipcMain.handle("key:testAndSave", async (_evt, key) => {
    const win =
      BrowserWindow.getFocusedWindow() ||
      BrowserWindow.getAllWindows().find(w => w.isKeyWizard);

    if (!key) {
      feedback(win, "Voer een API key in.");
      return { ok: false, error: "EMPTY_KEY" };
    }

    try {
      feedback(win, "Key testen…");

      // Snelle/goedkope call om key te valideren
      const client = new OpenAI({ apiKey: key.trim() });
      await client.models.list({ limit: 1 });

      // ✔️ geldig: opslaan en feedback
      saveApiKey(key.trim());
      feedback(win, "✔️ Key opgeslagen. App herstart…");

      // 🔁 Herstart de app zodat alles schoon met key opkomt
      setTimeout(() => {
        app.relaunch();
        app.exit(0);
      }, 500);

      return { ok: true };
    } catch (err) {
      console.error("[key:testAndSave] fout:", err?.message);
      feedback(win, `⚠️ Ongeldige key of netwerkfout: ${err?.message || "onbekend"}`);
      return { ok: false, error: err?.message || "TEST_FAILED" };
    }
  });

  // IPC: 'key:cancel' → doorverwijzer naar service
ipcMain.handle("key:cancel", async () => {
    const win =
      BrowserWindow.getFocusedWindow() ||
      BrowserWindow.getAllWindows().find(w => w.isKeyWizard);
    try { win?.close(); } catch {}
    return { ok: true };
  });
}

module.exports = { registerKeyIpc };
