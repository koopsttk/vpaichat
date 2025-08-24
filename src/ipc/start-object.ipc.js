/**
 * VPAICore – src/ipc/startobject.ipc.js
 * Rol: IPC handlers: startobject routes
 * Koppelingen: startObjectService
 * Belangrijk: —
 *
 * Conventies:
 * - Houd main.js dun (alleen IPC doorverwijzers).
 * - Startobject is SSOT-regiekamer; pad hard uit init/ini.cfg of config/ini.cfg.
 * - AI seed: compacte index + startobject in system prompt (renderer of service).
 */

// src/ipc/startobject.ipc.js
const { BrowserWindow } = require("electron");
const svc = require("../core/start-object-service.js");

/** UI helpers */
/** sendCoreMeta(): functionele rol en contract. Zie Blauwdruk/ARCHITECTURE.md. */
function sendCoreMeta(obj) {
  const win = BrowserWindow.getAllWindows()[0];
  if (!win) return;
  const titel = obj?.config?.titel || obj?.titel || "vpAIChat";
  const omschrijving = obj?.config?.omschrijving || obj?.omschrijving || "AI chatomgeving";
  win.webContents.send("core:setTitle", titel);
  win.webContents.send("core:setDescription", omschrijving);
}

/** registerStartObjectIpc(): functionele rol en contract. Zie Blauwdruk/ARCHITECTURE.md. */
function registerStartObjectIpc(ipcMain) {
  // Idempotent: oude handlers opruimen
  ["startobj:read","startobj:update","startobj:listBackups","startobj:restore","core:getStartObject","core:getAppConfig"]
    .forEach(ch => { try { ipcMain.removeHandler(ch); } catch (_) {} });

  // READ
  // IPC: 'startobj:read' → doorverwijzer naar service
ipcMain.handle("startobj:read", async () => {
    const { obj, soPath } = svc.read();
    return { ok: true, obj, path: soPath };
  });

  // UPDATE (+ backups + UI-titel/omschrijving)
  // IPC: 'startobj:update' → doorverwijzer naar service
ipcMain.handle("startobj:update", async (_evt, { json }) => {
    try {
      const out = svc.update(json);
      sendCoreMeta(out.obj);
      return { ok: true, path: out.soPath, backup: out.backup };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  });

  // LIST BACKUPS
  // IPC: 'startobj:listBackups' → doorverwijzer naar service
ipcMain.handle("startobj:listBackups", async () => {
    const items = svc.listBackups();
    return { ok: true, items };
  });

  // RESTORE (+ UI-titel/omschrijving)
  // IPC: 'startobj:restore' → doorverwijzer naar service
ipcMain.handle("startobj:restore", async (_evt, which) => {
    try {
      const out = svc.restore(which);
      sendCoreMeta(out.obj);
      return { ok: true, restoredFrom: out.restoredFrom, path: out.soPath };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  });

  // CORE HELPERS
  // IPC: 'core:getStartObject' → doorverwijzer naar service
ipcMain.handle("core:getStartObject", async () => {
    try { return svc.getStartObject(); } catch { return null; }
  });

  // IPC: 'core:getAppConfig' → doorverwijzer naar service
ipcMain.handle("core:getAppConfig", async () => {
    try { return svc.getAppConfig(); } catch { return null; }
  });
}

module.exports = { registerStartObjectIpc };
