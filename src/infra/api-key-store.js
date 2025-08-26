/**
 * VPAICore – src/infra/apiKeyStore.js
 * Rol: Infra: API-key opslag (encryptie)
 * Koppelingen: config/apikey.enc
 * Belangrijk: —
 *
 * Conventies:
 * - Houd main.js dun (alleen IPC doorverwijzers).
 * - Startobject is SSOT-regiekamer; pad hard uit init/ini.json of config/ini.json.
 * - AI seed: compacte index + startobject in system prompt (renderer of service).
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

//const ENC_FILE = path.join(__dirname, "apikey.enc");
const ENC_FILE = path.resolve(__dirname, "../../config/apikey.enc");
const ALGO = "aes-256-cbc";

// Machine-bound key (bijv. hash van CPU + hostname)
/** getMachineKey(): functionele rol en contract. Zie Blauwdruk/ARCHITECTURE.md. */
function getMachineKey() {
  const base = require("os").hostname() + require("os").arch();
  return crypto.createHash("sha256").update(base).digest();
}

/** encrypt(): functionele rol en contract. Zie Blauwdruk/ARCHITECTURE.md. */
function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGO, getMachineKey(), iv);
  let enc = cipher.update(text, "utf8", "hex");
  enc += cipher.final("hex");
  return iv.toString("hex") + ":" + enc;
}

/** decrypt(): functionele rol en contract. Zie Blauwdruk/ARCHITECTURE.md. */
function decrypt(data) {
  const [ivHex, enc] = data.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv(ALGO, getMachineKey(), iv);
  let dec = decipher.update(enc, "hex", "utf8");
  dec += decipher.final("utf8");
  return dec;
}

/** saveApiKey(): functionele rol en contract. Zie Blauwdruk/ARCHITECTURE.md. */
function saveApiKey(key) {
  const enc = encrypt(key);
  fs.writeFileSync(ENC_FILE, enc, "utf-8");
}

/** loadApiKey(): functionele rol en contract. Zie Blauwdruk/ARCHITECTURE.md. */
function loadApiKey() {
  if (!fs.existsSync(ENC_FILE)) return null;
  try {
    return decrypt(fs.readFileSync(ENC_FILE, "utf-8"));
  } catch {
    return null; // fout bij decryptie
  }
}

module.exports = { saveApiKey, loadApiKey };
