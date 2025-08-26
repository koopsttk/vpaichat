const fs = require('fs');
const path = require('path');

function loadIniPairs(iniPath) {
  if (!fs.existsSync(iniPath)) return {};
  const raw = fs.readFileSync(iniPath, 'utf-8');
  const out = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([^#;][^=]+?)\s*=\s*(.+?)\s*$/);
    if (m) out[m[1].trim()] = m[2].trim();
  }
  return out;
}

function flattenObject(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      flattenObject(v, key, out);
    } else {
      // Preserve original primitive types (boolean, number, string)
      out[key] = v;
    }
  }
  return out;
}

function getConfig() {
  const jsonInit = path.join(__dirname, '../../init/ini.json');
  const jsonConf = path.join(__dirname, '../../config/ini.json');
  const iniInit = path.join(__dirname, '../../init/ini.cfg');
  const iniConf = path.join(__dirname, '../../config/ini.cfg');

  let cfgPath = null;
  let flat = {};

  if (fs.existsSync(jsonInit)) {
    cfgPath = jsonInit;
    const obj = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'));
    flat = flattenObject(obj);
  } else if (fs.existsSync(jsonConf)) {
    cfgPath = jsonConf;
    const obj = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'));
    flat = flattenObject(obj);
  } else {
    cfgPath = fs.existsSync(iniInit) ? iniInit : iniConf;
    flat = loadIniPairs(cfgPath);
  }

  const dataDirRaw = flat['data_dir'] || flat['paths.data_dir'] || '../data';
  const dataDir = path.resolve(path.dirname(cfgPath), dataDirRaw);
  const startFile = flat['startobject_file'] || flat['paths.startobject_file'];

  if (!dataDir) throw new Error('data_dir ontbreekt in config');
  if (!startFile) throw new Error('startobject_file ontbreekt in config');

  return { iniPath: cfgPath, dataDir, startFile, kv: flat };
}

function getAppConfig() {
  const cfg = getConfig();
  const kv = cfg.kv;

  // helpers: pick first defined value (not just truthy)
  function firstDefined(...keys) {
    for (const k of keys) {
      if (typeof kv[k] !== 'undefined') return kv[k];
    }
    return undefined;
  }

  function asBoolean(val, def) {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') return val.toLowerCase() === 'true';
    return typeof def !== 'undefined' ? def : false;
  }

  function asNumber(val, def) {
    if (typeof val === 'number') return val;
    if (typeof val === 'string' && val !== '') {
      const n = parseInt(val, 10);
      if (!Number.isNaN(n)) return n;
    }
    return typeof def !== 'undefined' ? def : 0;
  }

  const enableForbiddenWords = asBoolean(firstDefined('chat.enable_forbidden_words', 'enable_forbidden_words'), true);
  const maxInputLength = asNumber(firstDefined('chat.max_input_length', 'max_input_length'), 500);
  const minInputLength = asNumber(firstDefined('chat.min_input_length', 'min_input_length'), 2);
  const allowedChars = firstDefined('chat.allowed_chars', 'allowed_chars') || '^[\\w\\s.,!?@#\\-]+$';

  let forbiddenWords = [];
  const forbiddenWordsPath = path.join(path.dirname(cfg.iniPath), 'forbidden_words.txt');
  if (fs.existsSync(forbiddenWordsPath)) {
    try {
      forbiddenWords = fs.readFileSync(forbiddenWordsPath, 'utf-8')
        .split(/\r?\n/)
        .map(w => w.trim().toLowerCase())
        .filter(Boolean);
    } catch (e) {
      console.error('[getAppConfig] Fout bij lezen forbidden_words.txt:', e.message);
    }
  } else {
    const forbiddenWordsRaw = kv['chat.forbidden_words'] || kv['forbidden_words'] || '';
    forbiddenWords = forbiddenWordsRaw.split(',').map(w => w.trim().toLowerCase()).filter(Boolean);
  }

  const maxLines = asNumber(firstDefined('chat.max_lines', 'max_lines'), 5);
  const allowLinks = asBoolean(firstDefined('chat.allow_links', 'allow_links'), false);
  const allowUnicode = asBoolean(firstDefined('chat.allow_unicode', 'allow_unicode'), true);
  const requireQuestion = asBoolean(firstDefined('chat.require_question', 'require_question'), false);
  const blockRepeatedChars = asBoolean(firstDefined('chat.block_repeated_chars', 'block_repeated_chars'), true);
  const maxWordLength = asNumber(firstDefined('chat.max_word_length', 'max_word_length'), 30);
  const allowCommands = asBoolean(firstDefined('chat.allow_commands', 'allow_commands'), true);

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