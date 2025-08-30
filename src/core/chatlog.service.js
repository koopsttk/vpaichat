// src/core/chatlog.service.js
// Chatlog service: maakt en beheert chatlog-bestanden per sessie

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { getConfig } = require('./config.service');

// Maak een nieuwe chatlog sessie aan en retourneer het pad
function createChatlogSession() {
    const config = getConfig();
    const dataDir = config.dataDir;
    const chatlogDir = path.join(dataDir, 'chatlogs');
    if (!fs.existsSync(chatlogDir)) fs.mkdirSync(chatlogDir, { recursive: true });
    const sessionId = uuidv4();
    const utc = new Date().toISOString().replace(/[-:.]/g, '').replace('T', 'T').replace('Z', 'Z');
    const filename = `${utc}_${sessionId}.json`;
    const filePath = path.join(chatlogDir, filename);
    fs.writeFileSync(filePath, JSON.stringify({ sessionId, created: new Date().toISOString(), log: [] }, null, 2));
    return filePath;
}

// Voeg een interactie toe aan een bestaande chatlog
function appendToChatlog(filePath, entry) {
    if (!fs.existsSync(filePath)) throw new Error('Chatlog bestand niet gevonden');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    data.log.push({ ...entry, timestamp: new Date().toISOString() });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

module.exports = {
    createChatlogSession,
    appendToChatlog
};
