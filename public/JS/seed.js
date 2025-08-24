/**
 * VPAICore – public/JS/seed.js
 * Rol: Startobject + (compacte) index laden en system prompt bouwen
 * Koppelingen: api.getStartObject(), api.getCompactIndex() | api.getIndex()
 *
 * Conventies (Blauwdruk):
 * - Renderer haalt titel/omschrijving uit startobject (SSOT).
 * - System prompt komt uit startobject (prompt.header / instructions) + compacte index.
 */

import { API, setTitleAndDescription, toast } from "./api.js";

let SYSTEM_PROMPT = null;
let STARTOBJECT = null;

/** buildSystemPrompt(): strikt SSOT — geen hardcoded fallback-teksten. */
function buildSystemPrompt(startObj, indexArr) {
  const compactIdx = (indexArr || []).map((it) => ({
    id: it.id,
    rol: it.rol,
    titel: it.titel,
    created: it.created,
  }));

  // Header uitsluitend uit startobject (prompt.header → array|string) of instructions
  const soHeaderArr =
    (Array.isArray(startObj?.prompt?.header) && startObj.prompt.header.length > 0)
      ? startObj.prompt.header
      : (typeof startObj?.prompt?.header === "string" && startObj.prompt.header.trim())
        ? [startObj.prompt.header]
        : (startObj?.instructions && String(startObj.instructions).trim()
            ? [String(startObj.instructions)]
            : []);

  if (!soHeaderArr.length) {
    // Strikt: fail fast i.p.v. code-fallbacks
    throw new Error("Startobject mist 'prompt.header' en 'instructions' — geen system-header beschikbaar (SSOT).");
  }

  const header = soHeaderArr.join(" ");

  const startCore = startObj
    ? {
        id: startObj.id,
        rol: startObj.rol,
        titel: startObj.titel,
        omschrijving: startObj.omschrijving,
        instructions: startObj.instructions,
      }
    : null;

  return `${header}\n\n[INDEX]\n${JSON.stringify(compactIdx)}\n\n[STARTOBJECT]\n${JSON.stringify(startCore)}`;
}

/** loadSeedAndBindUI(): haalt SSOT op, zet UI-titel/omschrijving en bouwt system prompt. */
export async function loadSeedAndBindUI() {
  try {
    const api = API();

    const [s, idx] = await Promise.all([
      api.getStartObject?.(),
      typeof api.getCompactIndex === "function"
        ? api.getCompactIndex()
        : (typeof api.getIndex === "function" ? api.getIndex() : Promise.resolve([])),
    ]);

    STARTOBJECT = s || null;

    // UI vanuit SSOT
    document.title = s?.titel || "VPAICore";
    setTitleAndDescription(s?.titel, s?.omschrijving || s?.instructions || "");

    // Prompt strikt uit SSOT + index
    SYSTEM_PROMPT = buildSystemPrompt(s, idx);

    // Handig voor DevTools
    window.__STARTOBJECT__ = STARTOBJECT;
    window.__SYSTEM_PROMPT__ = SYSTEM_PROMPT;
  } catch (e) {
    // Zichtbare, nette fout
    console.error("[seed] laden/opbouwen faalde:", e);
    toast(e?.message || "Kon startobject/system-header niet opbouwen", "error");

    // UI fallback (alleen titel leeg/placeholder; geen system prompt aanmaken)
    setTitleAndDescription("Ongetitelde installatie", "");
    SYSTEM_PROMPT = null;
    STARTOBJECT = null;
  }
}

/** getSystemPrompt(): expose voor AI-client. */
export function getSystemPrompt() {
  return SYSTEM_PROMPT;
}

/** getStartObject(): expose voor UI/andere modules. */
export function getStartObject() {
  return STARTOBJECT;
}
