// src/ui/keyWindow.js
const { BrowserWindow } = require("electron");
const path = require("path");

function createKeyWindow() {
  const win = new BrowserWindow({
    width: 560,
    height: 360,
    resizable: false,
    title: "API key instellen",
    webPreferences: {
  preload: path.join(__dirname, "../infra/key-preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // markeer dit venster als de key-wizard
  win.isKeyWizard = true;
  win.removeMenu?.();

  // laad je HTML (staat onder /public)
  win.loadFile(path.join(__dirname, "../../public/key.html"));
  return win;
}

module.exports = { createKeyWindow };
