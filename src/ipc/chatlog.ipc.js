// src/ipc/chatlog.ipc.js
// IPC handlers voor chatlog service

const chatlogService = require('../core/chatlog-service');

const fs = require('fs');
const path = require('path');
const { getConfig } = require('../core/config-service');

function registerChatlogIpc(ipcMain) {
    // Start een nieuwe chatlog sessie
    ipcMain.handle('chatlog:createSession', async () => {
        return chatlogService.createChatlogSession();
    });

    // Voeg een entry toe aan een chatlog
    ipcMain.handle('chatlog:append', async (event, filePath, entry) => {
        try {
            chatlogService.appendToChatlog(filePath, entry);
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    });

    // Lijst chatlogs op
    ipcMain.handle('chatlog:list', async () => {
        const config = getConfig();
        const chatlogDir = path.join(config.dataDir, 'chatlogs');
        if (!fs.existsSync(chatlogDir)) return [];
        return fs.readdirSync(chatlogDir).filter(f => f.endsWith('.json'));
    });

    // Verwijder een chatlog
    ipcMain.handle('chatlog:delete', async (event, filename) => {
        const config = getConfig();
        const chatlogDir = path.join(config.dataDir, 'chatlogs');
        const filePath = path.join(chatlogDir, filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return { success: true };
        }
        return { success: false, error: 'Bestand niet gevonden' };
    });

    // Open een chatlog (optioneel: return inhoud)
    ipcMain.handle('chatlog:open', async (event, filename) => {
        const config = getConfig();
        const chatlogDir = path.join(config.dataDir, 'chatlogs');
        const filePath = path.join(chatlogDir, filename);
        if (fs.existsSync(filePath)) {
            // Chatlogs zijn JSON, dus gebruik readJSON helper
            return require('../utils/file-helpers').readJSON(filePath);
        }
        return null;
    });

    // Zoek in alle chatlogs naar een query (veilige, server-side search)
    ipcMain.handle('chatlog:search', async (event, query, opts = {}) => {
        try {
            if (!query || typeof query !== 'string' || !query.trim()) return { ok: false, error: 'empty_query', results: [] };
            const maxResults = parseInt(opts.maxResults || 10, 10) || 10;
            const contextChars = parseInt(opts.contextChars || 200, 10) || 200;
            const q = query.toLowerCase();
            const config = getConfig();
            const chatlogDir = path.join(config.dataDir, 'chatlogs');
            if (!fs.existsSync(chatlogDir)) return { ok: true, results: [] };
            const files = fs.readdirSync(chatlogDir).filter(f => f.endsWith('.json'));
            const matches = [];
            for (const filename of files) {
                const filePath = path.join(chatlogDir, filename);
                let data;
                try {
                    data = require('../utils/file-helpers').readJSON(filePath);
                } catch (e) {
                    // skip corrupt files
                    continue;
                }
                if (!data || !Array.isArray(data.log)) continue;
                for (const entry of data.log) {
                    if (!entry || !entry.message) continue;
                    const msg = String(entry.message);
                    if (msg.toLowerCase().includes(q)) {
                        // Create a short snippet around the match
                        const idx = msg.toLowerCase().indexOf(q);
                        const start = Math.max(0, idx - Math.floor(contextChars / 2));
                        const end = Math.min(msg.length, start + contextChars);
                        const snippet = (start > 0 ? '…' : '') + msg.slice(start, end) + (end < msg.length ? '…' : '');
                        matches.push({ filename, role: entry.role || null, timestamp: entry.timestamp || null, message: msg, snippet });
                        if (matches.length >= maxResults) break;
                    }
                }
                if (matches.length >= maxResults) break;
            }
            return { ok: true, results: matches };
        } catch (err) {
            return { ok: false, error: err?.message || String(err), results: [] };
        }
    });
}

module.exports = { registerChatlogIpc };
