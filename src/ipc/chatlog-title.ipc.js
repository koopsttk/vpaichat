// IPC handler voor chatlog-titel wijzigen en registratie-functie voor registerIpc.js
const path = require('path');
const fs = require('fs');
const { getConfig } = require('../core/config-service');

// Helper: pad naar chatlogs dir
function getChatlogPath(filename) {
  const config = getConfig();
  const dir = config.dataDir ? path.join(config.dataDir, 'chatlogs') : path.join(__dirname, '../../data/chatlogs');
  return path.join(dir, filename);
}

function registerChatlogTitleIpc(ipcMain) {
  ipcMain.handle('renameChatlogTitle', async (event, filename, newTitle) => {
    const filePath = getChatlogPath(filename);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      data.title = newTitle;
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  });
}

module.exports = { registerChatlogTitleIpc };
