const { contextBridge, ipcRenderer, shell } = require("electron");

const api = {
  openExternal: (url) => ipcRenderer.invoke('open-external-link', url),
  getStartObject: () => ipcRenderer.invoke("core:getStartObject"),
  getAppConfig: async () => {
    const cfg = await ipcRenderer.invoke("core:getAppConfig");
    console.log("[preload] getAppConfig returns:", cfg);
    return cfg;
  },
  updateField: (objectType, id, field, value) =>
    ipcRenderer.invoke("ssot:updateField", { objectType, id, field, value }),
  openObject: (role, name) =>
    ipcRenderer.invoke("ssot:openObject", { role, name }),
  onSetTitle: (cb) =>
    ipcRenderer.on("core:setTitle", (_evt, data) => cb?.(data)),
  onSetDescription: (cb) =>
    ipcRenderer.on("core:setDescription", (_evt, data) => cb?.(data)),
  aiChat: (messages, model = "gpt-4o-mini", system) =>
    ipcRenderer.invoke("ai:chat", { messages, model, system }),
  onAiChunk: (cb) =>
    ipcRenderer.on("ai:chunk", (_evt, data) => cb?.(data)),
  onWebsearchResults: (cb) =>
    ipcRenderer.on('websearch:results', (_evt, data) => cb?.(data)),
  getApiKey: () => ipcRenderer.invoke("core:getApiKey"),
  setApiKey: (key) => ipcRenderer.invoke("key:testAndSave", key),
  getCompactIndex: () => ipcRenderer.invoke("index:get"),
  getKeyStatus: async () => {
    const status = await ipcRenderer.invoke("core:getKeyStatus");
    console.log("[preload] getKeyStatus returns:", status);
    return status;
  },
  // Chatlog functies
  createChatlogSession: () => ipcRenderer.invoke('chatlog:createSession'),
  appendToChatlog: (filePath, entry) => ipcRenderer.invoke('chatlog:append', filePath, entry),
  listChatlogs: () => ipcRenderer.invoke('chatlog:list'),
  deleteChatlog: (filename) => ipcRenderer.invoke('chatlog:delete', filename),
  openChatlog: (filename) => ipcRenderer.invoke('chatlog:open', filename),
  renameChatlogTitle: (...args) => ipcRenderer.invoke('renameChatlogTitle', ...args),
};

const startobj = {
  read: () => ipcRenderer.invoke("startobj:read"),
  update: (json) => {
    if (!json || typeof json !== "object") {
      return Promise.resolve({ ok: false, error: "Lege of ongeldige JSON payload" });
    }
    if (json.rol !== "startobject") {
      return Promise.resolve({ ok: false, error: "Veld 'rol' moet 'startobject' zijn" });
    }
    return ipcRenderer.invoke("startobj:update", { json });
  },
  listBackups: () => ipcRenderer.invoke("startobj:listBackups"),
  restore: (which) => ipcRenderer.invoke("startobj:restore", which)
};

const ssot = {
  aiCreateObject: (payload) => {
    if (!payload || typeof payload !== "object") {
      return Promise.resolve({ ok: false, error: "Lege of ongeldige payload" });
    }
    if (!payload.role) {
      return Promise.resolve({ ok: false, error: "Veld 'role' ontbreekt" });
    }
    if (!payload.instruction) {
      return Promise.resolve({ ok: false, error: "Veld 'instruction' ontbreekt" });
    }
    return ipcRenderer.invoke("ssot:aiCreateObject", payload);
  }
};

const off = {
  channel: (name, handler) => {
    try { ipcRenderer.removeListener(name, handler); } catch {}
  }
};

contextBridge.exposeInMainWorld("api", api);
contextBridge.exposeInMainWorld("startobj", startobj);
contextBridge.exposeInMainWorld("ssot", ssot);
contextBridge.exposeInMainWorld("off", off);

console.log("[preload] exposing api", api);