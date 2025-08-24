/**
 * VPAICore – src/utils/fileHelpers.js
 * Rol: Utils: timestamps, pad helpers
 * Koppelingen: SSOT naamgeving/UTC timestamp
 * Belangrijk: —
 *
 * Conventies:
 * - Houd main.js dun (alleen IPC doorverwijzers).
 * - Startobject is SSOT-regiekamer; pad hard uit init/ini.cfg of config/ini.cfg.
 * - AI seed: compacte index + startobject in system prompt (renderer of service).
 */

const fs = require("fs");

 function utcStampTight() {
  const d = new Date();
  const p2 = (n) => String(n).padStart(2, "0");
  const p3 = (n) => String(n).padStart(3, "0");
  // Formaat zoals je huidige files: 2025-08-19T200630153Z
  const Y = d.getUTCFullYear();
  const M = p2(d.getUTCMonth() + 1);
  const D = p2(d.getUTCDate());
  const h = p2(d.getUTCHours());
  const m = p2(d.getUTCMinutes());
  const s = p2(d.getUTCSeconds());
  const ms = p3(d.getUTCMilliseconds());
  return `${Y}-${M}-${D}T${h}${m}${s}${ms}Z`;
 }


/** ensureDir(): functionele rol en contract. Zie Blauwdruk/ARCHITECTURE.md. */
function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

/** writeJSONAtomic(): functionele rol en contract. Zie Blauwdruk/ARCHITECTURE.md. */
function writeJSONAtomic(targetPath, obj) {
  const tmp = targetPath + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2), "utf-8");
  fs.renameSync(tmp, targetPath);
}

module.exports = {
  utcStampTight,
  ensureDir,
  writeJSONAtomic
};
