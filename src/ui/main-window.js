/**
 * VPAICore – src/ui/window.js
 * Rol: UI: BrowserWindow factory
 * Koppelingen: BrowserWindow, preload pad
 * Belangrijk: —
 *
 * Conventies:
 * - Houd main.js dun (alleen IPC doorverwijzers).
 * - Startobject is SSOT-regiekamer; pad hard uit init/ini.cfg of config/ini.cfg.
 * - AI seed: compacte index + startobject in system prompt (renderer of service).
 */

// src/ui/window.js
const { BrowserWindow, Menu } = require("electron");
const path = require("path");

/** createMainWindow(): functionele rol en contract. Zie Blauwdruk/ARCHITECTURE.md. */
function createMainWindow() {
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "../preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "../../public/index.html"));
  Menu.setApplicationMenu(null);

  return mainWindow;
}

module.exports = { createMainWindow };
