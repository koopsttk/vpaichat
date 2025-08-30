// src/core/chatlog.service.js
// Chatlog service: maakt en beheert chatlog-bestanden per sessie

const fs = require('fs');
const { writeJSONAtomic, readJSON } = require('../utils/file-helpers');
const { logError } = require('./logger-service');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { getConfig } = require('./config-service');

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
    try {
        writeJSONAtomic(filePath, { sessionId, created: new Date().toISOString(), log: [] });
        return filePath;
    } catch (err) {
        logError('Fout bij aanmaken chatlog sessie', err);
        throw new Error('Kon chatlog sessie niet aanmaken. Zie logs voor details.');
    }
}

// Voeg een interactie toe aan een bestaande chatlog
function appendToChatlog(filePath, entry) {
    if (!fs.existsSync(filePath)) {
        logError('Chatlog bestand niet gevonden: ' + filePath);
        throw new Error('Chatlog bestand niet gevonden');
    }
    let data;
    try {
        data = readJSON(filePath);
    } catch (err) {
        logError('Fout bij lezen chatlog (mogelijk corrupte JSON): ' + filePath, err);
        throw new Error('Chatlog is corrupt of niet leesbaar. Zie logs voor details.');
    }
    data.log.push({ ...entry, timestamp: new Date().toISOString() });
    try {
        writeJSONAtomic(filePath, data);
    } catch (err) {
        logError('Fout bij schrijven chatlog: ' + filePath, err);
        throw new Error('Kon chatlog niet opslaan. Zie logs voor details.');
    }
}

module.exports = {
    createChatlogSession,
    appendToChatlog
};
