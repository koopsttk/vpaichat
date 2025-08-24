/**
 * VPAICore – src/core/startObjectService.js
 * Rol: Core service: startobject CRUD/backup/restore
 * Koppelingen: startObject.js, utils/fileHelpers
 * Belangrijk: —
 *
 * Conventies:
 * - Houd main.js dun (alleen IPC doorverwijzers).
 * - Startobject is SSOT-regiekamer; pad hard uit init/ini.cfg of config/ini.cfg.
 * - AI seed: compacte index + startobject in system prompt (renderer of service).
 */

// src/core/startObjectService.js
const fs = require("fs");
const path = require("path");

const { readStartObject, resolveStartObjectPath } = require("./start-object-loader");
const { utcStampTight, ensureDir, writeJSONAtomic } = require("../utils/file-helpers");
const { getConfig, getAppConfig } = require("./config.service");

/** dataDir(): functionele rol en contract. Zie Blauwdruk/ARCHITECTURE.md. */
function dataDir() {
  const cfg = getConfig();
  return cfg.dataDir;
}

/** Lees actuele startobject + pad. */
/** read(): functionele rol en contract. Zie Blauwdruk/ARCHITECTURE.md. */
function read() {
  const { obj, soPath } = readStartObject();
  return { obj, soPath };
}

/** Update met .bak + history, valideert rol, zet timestamps. */
/** update(): functionele rol en contract. Zie Blauwdruk/ARCHITECTURE.md. */
function update(json) {
  if (!json || typeof json !== "object") throw new Error("Ongeldige JSON.");
  if (json.rol !== "startobject") throw new Error("Veld 'rol' moet 'startobject' zijn.");

  const { obj: current, soPath } = readStartObject();

  const now = new Date().toISOString();
  json.updated = now;
  if (!json.created) json.created = now;

  // Backup + history
  fs.writeFileSync(soPath + ".bak", JSON.stringify(current, null, 2), "utf-8");
  const histRoot = path.join(dataDir(), ".history", "startobject", path.basename(soPath, ".json"));
  ensureDir(histRoot);
  const histFile = path.join(histRoot, `${utcStampTight()}.json`);
  fs.writeFileSync(histFile, JSON.stringify(current, null, 2), "utf-8");

  // Nieuwe versie
  writeJSONAtomic(soPath, json);

  return { soPath, obj: json, backup: { bak: soPath + ".bak", history: histFile } };
}

/** Lijst alle history-backups. */
/** listBackups(): functionele rol en contract. Zie Blauwdruk/ARCHITECTURE.md. */
function listBackups() {
  const soPath = resolveStartObjectPath();
  const histRoot = path.join(dataDir(), ".history", "startobject", path.basename(soPath, ".json"));
  if (!fs.existsSync(histRoot)) return [];
  return fs
    .readdirSync(histRoot)
    .filter(f => f.endsWith(".json"))
    .map(f => ({ file: path.join(histRoot, f), name: f }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Zet laatste of specifiek backup‑bestand terug. */
/** restore(): functionele rol en contract. Zie Blauwdruk/ARCHITECTURE.md. */
function restore(which = "last") {
  const soPath = resolveStartObjectPath();
  let src = which;

  if (!which || which === "last") {
    const histRoot = path.join(dataDir(), ".history", "startobject", path.basename(soPath, ".json"));
    if (!fs.existsSync(histRoot)) throw new Error("Geen history-map gevonden.");
    const files = fs.readdirSync(histRoot).filter(f => f.endsWith(".json")).sort();
    if (!files.length) throw new Error("Geen backup gevonden.");
    src = path.join(histRoot, files[files.length - 1]);
  }

  const content = JSON.parse(fs.readFileSync(src, "utf-8"));
  writeJSONAtomic(soPath, content);
  return { soPath, obj: content, restoredFrom: src };
}

/** Handige helpers voor renderer */
/** getStartObject(): functionele rol en contract. Zie Blauwdruk/ARCHITECTURE.md. */
function getStartObject() {
  const { obj } = readStartObject();
  return obj;
}

module.exports = {
  read,
  update,
  listBackups,
  restore,
  getStartObject,
  getAppConfig,
};
