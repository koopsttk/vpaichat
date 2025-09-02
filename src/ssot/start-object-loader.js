const fs = require("fs");
const path = require("path");
const { getConfig } = require("../core/config-service");
const { readJSON } = require("../utils/file-helpers");

function resolveStartObjectPath() {
  const cfg = getConfig();
  const dataDir = cfg.dataDir;
  const startFile = cfg.startFile;
  const absDataDir = dataDir;
  const absStartPath = path.isAbsolute(startFile) ? startFile : path.resolve(absDataDir, startFile);
  return absStartPath;
}

function readStartObject() {
  const soPath = resolveStartObjectPath();
  if (!fs.existsSync(soPath)) throw new Error(`Startobject niet gevonden: ${soPath}`);
  const obj = readJSON(soPath);
  return { obj, soPath };
}

module.exports = {
  readStartObject,
  resolveStartObjectPath
};
