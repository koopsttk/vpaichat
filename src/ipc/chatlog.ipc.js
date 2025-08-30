// src/ipc/chatlog.ipc.js
// IPC handlers voor chatlog service

const chatlogService = require('../core/chatlog.service');

const fs = require('fs');
const path = require('path');
const { getConfig } = require('../core/config.service');

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
            return fs.readFileSync(filePath, 'utf-8');
        }
        return null;
    });
}

module.exports = { registerChatlogIpc };
