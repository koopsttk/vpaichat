const fs = require("fs");
const path = require("path");

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

function getConfig() {
  const iniInit  = path.join(__dirname, "../../init/ini.cfg");
  const iniConf  = path.join(__dirname, "../../config/ini.cfg");
  const iniPath  = fs.existsSync(iniInit) ? iniInit : iniConf;

  const kv = loadIniPairs(iniPath);
  const dataDirRaw = kv["data_dir"] || kv["paths.data_dir"] || kv["paths"]?.data_dir || "../data";
  const dataDir = path.resolve(path.dirname(iniPath), dataDirRaw); // Absoluut pad!
  const startFile = kv["startobject_file"] || kv["paths.startobject_file"];

  if (!dataDir) throw new Error('data_dir ontbreekt in config/ini.cfg');
  if (!startFile) throw new Error('startobject_file ontbreekt in config/ini.cfg');

  return {
    iniPath,
    dataDir,
    startFile,
    kv
  };
}

module.exports = { getConfig };