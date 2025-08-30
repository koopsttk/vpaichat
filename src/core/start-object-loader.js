/**
 * VPAICore – src/core/startObject.js
 * Rol: Core: resolve en lees startobject via ini.json (JSON-first)
 * Koppelingen: init/config/ini.json, data/<startobject_file>
 * Belangrijk: Zoek init/ini.json eerst (indien aanwezig); fallback config/ini.json
 *
 * Conventies:
 * - Houd main.js dun (alleen IPC doorverwijzers).
 * - Startobject is SSOT-regiekamer; pad hard uit init/ini.json of config/ini.json.
 * - AI seed: compacte index + startobject in system prompt (renderer of service).
 */

 const fs = require("fs");
 const path = require("path");
 const { getConfig } = require("./config-service");
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
