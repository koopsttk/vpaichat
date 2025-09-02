/**
 * VPAICore – src/ssot/start-object-service.js
 * Rol: Core service: startobject CRUD/backup/restore
 */

const fs = require("fs");
const path = require("path");

const { readStartObject, resolveStartObjectPath } = require("./start-object-loader");
const { utcStampTight, ensureDir, writeJSONAtomic, readJSON, writeJSON } = require("../utils/file-helpers");
const { getConfig, getAppConfig } = require("../core/config-service");

function dataDir() {
  const cfg = getConfig();
  return cfg.dataDir;
}

function read() {
  const { obj, soPath } = readStartObject();
  return { obj, soPath };
}

function update(json) {
  if (!json || typeof json !== "object") throw new Error("Ongeldige JSON.");
  if (json.rol !== "startobject") throw new Error("Veld 'rol' moet 'startobject' zijn.");

  const { obj: current, soPath } = readStartObject();

  const now = new Date().toISOString();
  json.updated = now;
  if (!json.created) json.created = now;

  // Backup + history
  writeJSON(soPath + ".bak", current);
  const histRoot = path.join(dataDir(), ".history", "startobject", path.basename(soPath, ".json"));
  ensureDir(histRoot);
  const histFile = path.join(histRoot, `${utcStampTight()}.json`);
  writeJSON(histFile, current);

  // Nieuwe versie
  writeJSONAtomic(soPath, json);

  return { soPath, obj: json, backup: { bak: soPath + ".bak", history: histFile } };
}

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

  const content = require("../utils/file-helpers").readJSON(src);
  writeJSONAtomic(soPath, content);
  return { soPath, obj: content, restoredFrom: src };
}

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
