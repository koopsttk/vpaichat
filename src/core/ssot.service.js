/**
 * VPAICore – src/core/ssot2.js
 * Rol: Core: SSOT helpers (2e generatie)
 * Koppelingen: fileHelpers, startObjectService
 * Belangrijk: —
 *
 * Conventies:
 * - Houd main.js dun (alleen IPC doorverwijzers).
 * - Startobject is SSOT-regiekamer; pad hard uit init/ini.cfg of config/ini.cfg.
 * - AI seed: compacte index + startobject in system prompt (renderer of service).
 */

// src/core/ssot.js
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { ensureDir, writeJSONAtomic, utcStampTight } = require("../utils/file-helpers");
const { checkIniConfig, ensureDataDirectory } = require("./appInit");

const { dataDir } = (function init() {
  const cfg = checkIniConfig();
  return { dataDir: ensureDataDirectory(cfg) };
})();

const INDEX = path.join(dataDir, "_index.json");

/** readIndex(): functionele rol en contract. Zie Blauwdruk/ARCHITECTURE.md. */
function readIndex() {
  if (!fs.existsSync(INDEX)) return [];
  return JSON.parse(fs.readFileSync(INDEX, "utf-8"));
}

/** writeIndex(): functionele rol en contract. Zie Blauwdruk/ARCHITECTURE.md. */
function writeIndex(arr) {
  writeJSONAtomic(INDEX, arr);
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
  writeJSONAtomic(file, saved);

  const idx = readIndex();
  idx.push({ id, rol: obj.rol || null, titel: obj.titel || null, created: new Date().toISOString(), file: path.basename(file) });
  writeIndex(idx);

  return saved;
}

/** readObjectById(): functionele rol en contract. Zie Blauwdruk/ARCHITECTURE.md. */
function readObjectById(id) {
  const idx = readIndex();
  const hit = idx.find(i => i.id === id);
  if (!hit) return null;
  const file = path.join(dataDir, hit.file);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

/** updateObject(): functionele rol en contract. Zie Blauwdruk/ARCHITECTURE.md. */
function updateObject(id, patch) {
  const obj = readObjectById(id);
  if (!obj) throw new Error("Object niet gevonden");
  const updated = { ...obj, ...patch };
  // hergebruik bestaand bestandspad
  const idx = readIndex();
  const hit = idx.find(i => i.id === id);
  const file = path.join(dataDir, hit.file);
  writeJSONAtomic(file, updated);

  // evt. index bijwerken als titel/rol wijzigt
  if (patch.titel || patch.rol) {
    hit.titel = patch.titel ?? hit.titel;
    hit.rol   = patch.rol   ?? hit.rol;
    writeIndex(idx);
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
