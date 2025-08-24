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

// Haal chat validatieparameters uit ini.cfg
function getAppConfig() {
  const cfg = getConfig();
  const enableForbiddenWords = (cfg.kv["chat.enable_forbidden_words"] || cfg.kv["enable_forbidden_words"] || "true").toString().toLowerCase() === "true";
  // Zoek chat-sectie parameters
  const maxInputLength = parseInt(cfg.kv["chat.max_input_length"] || cfg.kv["max_input_length"] || 500, 10);
  const minInputLength = parseInt(cfg.kv["chat.min_input_length"] || cfg.kv["min_input_length"] || 2, 10);
  const allowedChars = cfg.kv["chat.allowed_chars"] || cfg.kv["allowed_chars"] || "^[\\w\\s.,!?@#\\-]+$";
  // Forbidden words uit los bestand (voorrang) of uit ini.cfg
  let forbiddenWords = [];
  const forbiddenWordsPath = path.join(path.dirname(cfg.iniPath), "forbidden_words.txt");
  if (fs.existsSync(forbiddenWordsPath)) {
    try {
      forbiddenWords = fs.readFileSync(forbiddenWordsPath, "utf-8")
        .split(/\r?\n/)
        .map(w => w.trim().toLowerCase())
        .filter(Boolean);
    } catch (e) {
      console.error("[getAppConfig] Fout bij lezen forbidden_words.txt:", e);
    }
  } else {
    const forbiddenWordsRaw = cfg.kv["chat.forbidden_words"] || cfg.kv["forbidden_words"] || "";
    forbiddenWords = forbiddenWordsRaw
      .split(',')
      .map(w => w.trim().toLowerCase())
      .filter(Boolean);
  }
  // Debug logging verwijderd
  const maxLines = parseInt(cfg.kv["chat.max_lines"] || cfg.kv["max_lines"] || 5, 10);
  const allowLinks = (cfg.kv["chat.allow_links"] || cfg.kv["allow_links"] || "false").toString().toLowerCase() === "true";
  const allowUnicode = (cfg.kv["chat.allow_unicode"] || cfg.kv["allow_unicode"] || "true").toString().toLowerCase() === "true";
  const requireQuestion = (cfg.kv["chat.require_question"] || cfg.kv["require_question"] || "false").toString().toLowerCase() === "true";
  const blockRepeatedChars = (cfg.kv["chat.block_repeated_chars"] || cfg.kv["block_repeated_chars"] || "true").toString().toLowerCase() === "true";
  const maxWordLength = parseInt(cfg.kv["chat.max_word_length"] || cfg.kv["max_word_length"] || 30, 10);
  const allowCommands = (cfg.kv["chat.allow_commands"] || cfg.kv["allow_commands"] || "true").toString().toLowerCase() === "true";
  return {
    maxInputLength,
    minInputLength,
    allowedChars,
    forbiddenWords,
    maxLines,
    allowLinks,
    allowUnicode,
    requireQuestion,
    blockRepeatedChars,
    maxWordLength,
    allowCommands,
    enableForbiddenWords,
  };
}

module.exports = { getConfig, getAppConfig };