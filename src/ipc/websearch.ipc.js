// src/ipc/websearch.ipc.js
// IPC handler voor websearch (optioneel inschakelbaar)
ipcMain.handle('websearch:query', async (event, query) => {
function registerWebsearchIpc(ipcMain) {
  const { bingWebSearch } = require('../infra/websearch-client');
  ipcMain.handle('websearch:query', async (event, query) => {
    try {
      const results = await bingWebSearch(query);
      return { ok: true, results };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  });
}

module.exports = { registerWebsearchIpc };
