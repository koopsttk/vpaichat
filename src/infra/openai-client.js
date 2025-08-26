/**
 * VPAICore – src/infra/openAiClient.js
 * Rol: Infra: OpenAI client wrapper voor chat
 * Koppelingen: OpenAI SDK, chat.ipc
 * Belangrijk: —
 *
 * Conventies:
 * - Houd main.js dun (alleen IPC doorverwijzers).
 * - Startobject is SSOT-regiekamer; pad hard uit init/ini.json of config/ini.json.
 * - AI seed: compacte index + startobject in system prompt (renderer of service).
 */

const { OpenAI } = require("openai");
const { loadApiKey } = require("./api-key-store");

/** getOpenAIClient(): functionele rol en contract. Zie Blauwdruk/ARCHITECTURE.md. */
function getOpenAIClient(usingKey) {
  const apiKey = usingKey || loadApiKey();
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
  
}

module.exports = { getOpenAIClient };
