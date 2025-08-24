/**
 * VPAICore – src/main.js
 * Rol: Electron main: window + IPC doorverwijzers
 * Koppelingen: ipc/registerIpc, ui/window
 * Belangrijk: Geen business logic; alleen registreren + window
 *
 * Conventies:
 * - Houd main.js dun (alleen IPC doorverwijzers).
 * - Startobject is SSOT-regiekamer; pad hard uit init/ini.cfg of config/ini.cfg.
 * - AI seed: compacte index + startobject in system prompt (renderer of service).
 */

// src/main.js
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const { registerIpc } = require("./ipc/register-ipc");
const { readStartObject } = require("./core/start-object-loader");
const { createMainWindow } = require("./ui/main-window");
const { loadApiKey } = require("./infra/api-key-store");
const { createKeyWindow } = require("./ui/key-window");
const { getAppConfig } = require("./core/config.service.js");
const { getKeyStatus } = require("./core/get-key-status");
const { logError } = require('./core/logger.service');
const { getConfig } = require('./core/config.service');
const fs = require('fs');

const config = getConfig();
// const dataDir = ensureDataDirectory(config); // Verwijderd of zelf implementeren
console.log(config.dataDir); // Nu bestaat dataDir wél

if (!fs.existsSync(config.dataDir)) {
  const msg = `Data directory bestaat niet: ${config.dataDir}`;
  logError(msg);
  dialog.showErrorBox(
    "Data directory niet gevonden",
    `${msg}\nControleer je configuratie of verplaats de map terug.`
  );
  app.quit();
  return;
}

let mainWindow = null;

app.whenReady().then(() => {
  mainWindow = createMainWindow();

  // registreer ALLE ipc-handlers (startobject + chat)
  registerIpc();


 // Als er (nog) geen key is: wizard tonen
try {
    const key = loadApiKey();
    if (!key) {
      createKeyWindow();
    }
  } catch (e) {
    console.warn("[Main] API key load fout:", e?.message);
    createKeyWindow();
  }


  mainWindow.webContents.on("did-finish-load", () => {
    try {
      const { obj } = readStartObject();
      const titel = obj?.config?.titel || obj?.titel || "vpAIChat";
      const omschrijving = obj?.config?.omschrijving || obj?.omschrijving || "AI chatomgeving";
      mainWindow.webContents.send("core:setTitle", titel);
      mainWindow.webContents.send("core:setDescription", omschrijving);
    } catch (e) {
      console.error("[did-finish-load] Startobject fout:", e.message);
    }
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow();
    }
  });

  mainWindow.webContents.openDevTools(); // <-- Zet deze regel hier!
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("core:getApiKey", () => {
  const config = getConfig();
  // Pas eventueel aan op basis van jouw config-structuur:
  return config.kv?.api_key || null;
});

ipcMain.handle("core:getAppConfig", () => {
  const result = getAppConfig();
  console.log("IPC getAppConfig result:", result);
  return result;
});

ipcMain.handle("core:getKeyStatus", () => {
  const status = getKeyStatus();
  console.log("[IPC] getKeyStatus:", status);
  return status;
});
