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
const { createKeyWindow } = require('../ui/key-window');
const { saveApiKey, encrypt } = require("../infra/api-key-store");
const { OpenAI } = require("openai");
const fs = require('fs');
const path = require('path');

/** feedback(): functionele rol en contract. Zie Blauwdruk/ARCHITECTURE.md. */
function feedback(win, msg) {
  try { win?.webContents.send("key:feedback", msg); } catch {}
}

/** registerKeyIpc(): functionele rol en contract. Zie Blauwdruk/ARCHITECTURE.md. */
function registerKeyIpc(ipcMain) {
  // handlers eerst netjes verwijderen (idempotent)
  try { ipcMain.removeHandler("key:testAndSave"); } catch {}
  try { ipcMain.removeHandler("key:cancel"); } catch {}
  try { ipcMain.removeHandler("/key"); } catch {}

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

  // IPC: '/key' → opent key.html via shared createKeyWindow (zorgt voor preload)
  ipcMain.handle("/key", async () => {
      try {
        createKeyWindow();
        return { ok: true };
      } catch (err) {
        console.error('[IPC /key] createKeyWindow fout:', err);
        return { ok: false, error: err?.message };
      }
    });

  // IPC: 'save-google-key' → slaat Google API key op in googlekey.enc
  ipcMain.handle('save-google-key', async (event, googleKey) => {
    try {
      const configPath = path.resolve(__dirname, '../../config/googlekey.enc');
      console.log('Google API key opslaan in:', configPath);
      console.log('Google API key inhoud:', googleKey);
      const encryptedKey = encrypt(googleKey);
      fs.writeFileSync(configPath, encryptedKey, { encoding: 'utf8' });

      const logPath = path.resolve(__dirname, '../../logs/googlekey.log');
      fs.appendFileSync(logPath, 'Handler save-google-key aangeroepen\n');
      fs.appendFileSync(logPath, `Google API key opslaan in: ${configPath}\n`);
      fs.appendFileSync(logPath, `Google API key inhoud: ${googleKey}\n`);

      return true;
    } catch (err) {
      console.error('Fout bij het opslaan van de Google API key:', err);
      throw err;
    }
  });
}

module.exports = { registerKeyIpc };
