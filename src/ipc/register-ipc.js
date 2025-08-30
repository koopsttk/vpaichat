/**
 * VPAICore – src/ipc/registerIpc.js
 * Rol: Main IPC registry: kanalen registreren
 * Koppelingen: Electron ipcMain, *.ipc.js
 * Belangrijk: —
 *
 * Conventies:
 * - Houd main.js dun (alleen IPC doorverwijzers).
 * - Startobject is SSOT-regiekamer; pad hard uit init/ini.json of config/ini.json.
 * - AI seed: compacte index + startobject in system prompt (renderer of service).
 */

// src/ipc/registerIpc.js
const { ipcMain, shell } = require("electron");
const { registerStartObjectIpc } = require("./start-object.ipc");
const { registerChatIpc } = require("./chat.ipc");
const { registerChatlogIpc } = require("./chatlog.ipc");
const { registerChatlogTitleIpc } = require("./chatlog-title.ipc");

const { registerKeyIpc } = require("./key.ipc");
// Optioneel: websearch
let registerWebsearchIpc;
try {
  registerWebsearchIpc = require("./websearch.ipc").registerWebsearchIpc;
} catch (e) {
  registerWebsearchIpc = null;
}

let _registered = false;

/** registerIpc(): functionele rol en contract. Zie Blauwdruk/ARCHITECTURE.md. */
function registerIpc() {
  if (_registered) return;
  registerStartObjectIpc(ipcMain);
  registerChatIpc(ipcMain);
  registerChatlogTitleIpc(ipcMain);
  registerKeyIpc(ipcMain);
  registerChatlogIpc(ipcMain);
  if (registerWebsearchIpc) registerWebsearchIpc(ipcMain);
  _registered = true;
}

// Nieuw IPC-kanaal voor het openen van externe links
ipcMain.handle("open-external-link", async (event, url) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    console.error("Error opening external link:", error);
    return { success: false, error: error.message };
  }
});

module.exports = { registerIpc };
