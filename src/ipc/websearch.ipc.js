// src/ipc/websearch.ipc.js
// IPC handler voor websearch (optioneel inschakelbaar)


function registerWebsearchIpc(ipcMain) {
  try { ipcMain.removeHandler('websearch:query'); } catch {}
  const { googleWebSearch } = require('../infra/websearch-client');
  const { semanticWebsearch } = require('../core/semantic-search');
  ipcMain.handle('websearch:query', async (_event, query) => {
    try {
      // Gebruik semantische zoekpipeline, backend is googleWebSearch
      const results = await semanticWebsearch(query, googleWebSearch);
      return { ok: true, results };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  });
}

module.exports = { registerWebsearchIpc };
