const { logError } = require('./logger-service');
/**
 * VPAICore – src/core/ssot2.js
 * Rol: Core: SSOT helpers (2e generatie)
 * Koppelingen: fileHelpers, startObjectService
 * Belangrijk: —
 *
 * Conventies:
 * - Houd main.js dun (alleen IPC doorverwijzers).
 * - Startobject is SSOT-regiekamer; pad hard uit init/ini.json of config/ini.json.
 * - AI seed: compacte index + startobject in system prompt (renderer of service).
 */

// src/core/ssot.js
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { ensureDir, writeJSONAtomic, utcStampTight, readJSON, writeJSON } = require("../utils/file-helpers");
const { checkIniConfig, ensureDataDirectory } = require("./app-init");

const { dataDir } = (function init() {
  const cfg = checkIniConfig();
  return { dataDir: ensureDataDirectory(cfg) };
})();

const INDEX = path.join(dataDir, "_index.json");

/** readIndex(): functionele rol en contract. Zie Blauwdruk/ARCHITECTURE.md. */
function readIndex() {
  if (!fs.existsSync(INDEX)) return [];
  try {
    return readJSON(INDEX);
  } catch (err) {
    logError('Fout bij lezen van _index.json (mogelijk corrupt): ' + INDEX, err);
    throw new Error('Indexbestand (_index.json) is corrupt of niet leesbaar. Zie logs voor details.');
  }
}

/** writeIndex(): functionele rol en contract. Zie Blauwdruk/ARCHITECTURE.md. */
function writeIndex(arr) {
  try {
    writeJSONAtomic(INDEX, arr);
  } catch (err) {
    logError('Fout bij schrijven van _index.json: ' + INDEX, err);
    throw new Error('Kon indexbestand niet opslaan. Zie logs voor details.');
  }
}

/** newId(): functionele rol en contract. Zie Blauwdruk/ARCHITECTURE.md. */
function newId() {
  return crypto.randomUUID();
}

/** objectFileName(): functionele rol en contract. Zie Blauwdruk/ARCHITECTURE.md. */
function objectFileName(id) {
  return `${utcStampTight()}_${id}.json`;
}

/** createObject(): functionele rol en contract. Zie Blauwdruk/ARCHITECTURE.md. */
function createObject(obj) {
  const id = obj.id || newId();
  const file = path.join(dataDir, objectFileName(id));
  const saved = { ...obj, id };
  try {
    writeJSONAtomic(file, saved);
  } catch (err) {
    logError('Fout bij schrijven van objectbestand: ' + file, err);
    throw new Error('Kon object niet opslaan. Zie logs voor details.');
  }
  let idx;
  try {
    idx = readIndex();
  } catch (err) {
    logError('Fout bij lezen van index tijdens createObject: ' + INDEX, err);
    throw new Error('Kon index niet lezen. Zie logs voor details.');
  }
  idx.push({ id, rol: obj.rol || null, titel: obj.titel || null, created: new Date().toISOString(), file: path.basename(file) });
  try {
    writeIndex(idx);
  } catch (err) {
    logError('Fout bij bijwerken van index tijdens createObject: ' + INDEX, err);
    throw new Error('Kon index niet bijwerken. Zie logs voor details.');
  }
  return saved;
}

/** readObjectById(): functionele rol en contract. Zie Blauwdruk/ARCHITECTURE.md. */
function readObjectById(id) {
  let idx;
  try {
    idx = readIndex();
  } catch (err) {
    logError('Fout bij lezen van index tijdens readObjectById: ' + INDEX, err);
    return null;
  }
  const hit = idx.find(i => i.id === id);
  if (!hit) return null;
  const file = path.join(dataDir, hit.file);
  if (!fs.existsSync(file)) return null;
  try {
    return readJSON(file);
  } catch (err) {
    logError('Fout bij lezen van objectbestand (mogelijk corrupt): ' + file, err);
    return null;
  }
}

/** updateObject(): functionele rol en contract. Zie Blauwdruk/ARCHITECTURE.md. */
function updateObject(id, patch) {
  const obj = readObjectById(id);
  if (!obj) throw new Error("Object niet gevonden");
  const updated = { ...obj, ...patch };
  // hergebruik bestaand bestandspad
  let idx;
  try {
    idx = readIndex();
  } catch (err) {
    logError('Fout bij lezen van index tijdens updateObject: ' + INDEX, err);
    throw new Error('Kon index niet lezen. Zie logs voor details.');
  }
  const hit = idx.find(i => i.id === id);
  const file = path.join(dataDir, hit.file);
  try {
    writeJSONAtomic(file, updated);
  } catch (err) {
    logError('Fout bij schrijven van objectbestand tijdens updateObject: ' + file, err);
    throw new Error('Kon object niet opslaan. Zie logs voor details.');
  }
  // evt. index bijwerken als titel/rol wijzigt
  if (patch.titel || patch.rol) {
    hit.titel = patch.titel ?? hit.titel;
    hit.rol   = patch.rol   ?? hit.rol;
    try {
      writeIndex(idx);
    } catch (err) {
      logError('Fout bij bijwerken van index tijdens updateObject: ' + INDEX, err);
      throw new Error('Kon index niet bijwerken. Zie logs voor details.');
    }
  }
  return updated;
}

/** listObjects(): functionele rol en contract. Zie Blauwdruk/ARCHITECTURE.md. */
function listObjects() {
  return readIndex();
}

/** findByLogicalName(): functionele rol en contract. Zie Blauwdruk/ARCHITECTURE.md. */
function findByLogicalName(name) {
  const idx = readIndex();
  const hits = idx.filter(i => (i.titel || "").toLowerCase() === String(name).toLowerCase());
  return hits;
}

module.exports = { createObject, readObjectById, updateObject, listObjects, findByLogicalName };
