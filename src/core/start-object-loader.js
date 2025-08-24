/**
 * VPAICore – src/core/startObject.js
 * Rol: Core: resolve en lees startobject via ini.cfg
 * Koppelingen: init/config/ini.cfg, data/<startobject_file>
 * Belangrijk: Zoek init/ini.cfg eerst (indien aanwezig); fallback config/ini.cfg
 *
 * Conventies:
 * - Houd main.js dun (alleen IPC doorverwijzers).
 * - Startobject is SSOT-regiekamer; pad hard uit init/ini.cfg of config/ini.cfg.
 * - AI seed: compacte index + startobject in system prompt (renderer of service).
 */

 const fs = require("fs");
 const path = require("path");
 const { getIniConfig } = require("./config.service");

 function loadIniPairs(iniPath) {
   if (!fs.existsSync(iniPath)) return {};
   const raw = fs.readFileSync(iniPath, "utf-8");
   const out = {};
   for (const line of raw.split(/\r?\n/)) {
     const m = line.match(/^\s*([^#;][^=]+?)\s*=\s*(.+?)\s*$/);
     if (m) out[m[1].trim()] = m[2].trim();
   }
   return out;
 }

 function resolveStartObjectPath() {

  // Zoek ini eerst in /init (volgens Blauwdruk), dan fallback /config (backwards compat)
  const iniInit  = path.join(__dirname, "../../init/ini.cfg");
  const iniConf  = path.join(__dirname, "../../config/ini.cfg");
  const iniPath  = fs.existsSync(iniInit) ? iniInit : iniConf;

   const kv = loadIniPairs(iniPath);
   const dataDir = kv["data_dir"] || kv["paths.data_dir"] || "../data";
   const startFile = kv["startobject_file"] || kv["paths.startobject_file"];

  if (!startFile) {
    throw new Error(`ini.cfg mist 'startobject_file' (keys: startobject_file of [paths].startobject_file). Gelezen uit: ${iniPath}`);
  }

   const iniDir = path.dirname(iniPath);
   const absDataDir = path.isAbsolute(dataDir) ? dataDir : path.resolve(iniDir, dataDir);
   const absStartPath = path.isAbsolute(startFile)
     ? startFile
     : path.resolve(absDataDir, startFile);

   return absStartPath;
 }

 function readStartObject() {
   const soPath = resolveStartObjectPath();
   if (!fs.existsSync(soPath)) throw new Error(`Startobject niet gevonden: ${soPath}`);
   const obj = JSON.parse(fs.readFileSync(soPath, "utf-8"));
   return { obj, soPath };
 }

 module.exports = {
   readStartObject,
   resolveStartObjectPath
 };
