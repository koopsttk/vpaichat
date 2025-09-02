/**
 * VPAICore – src/ipc/chat.ipc.js
 * Rol: IPC handlers: chat/AI routes
 * Koppelingen: infra/openAiClient
 * Belangrijk: —
 *
 * Conventies:
 * - Houd main.js dun (alleen IPC doorverwijzers).
 * - Startobject is SSOT-regiekamer; pad hard uit init/ini.json of config/ini.json.
 * - AI seed: compacte index + startobject in system prompt (renderer of service).
 */

// src/ipc/chat.ipc.js
const { BrowserWindow, ipcMain } = require("electron");
const { getOpenAIClient } = require("../infra/openai-client");
const { readStartObject } = require("../core/start-object-loader");

/** registerChatIpc(): functionele rol en contract. Zie Blauwdruk/ARCHITECTURE.md. */
function registerChatIpc(ipcMain) {
  // eerst eventueel oude handler opruimen
  try { ipcMain.removeHandler("ai:chat"); } catch (_) {}

  // IPC: 'ai:chat' → doorverwijzer naar service
  const { getAppConfig } = require('../core/config-service');

  ipcMain.handle("ai:chat", async (_evt, { messages = [], model, system }) => {
    const win = BrowserWindow.getAllWindows()[0];
    try {
      const client = getOpenAIClient();
      if (!client) {
        if (win) win.webContents.send("ai:chunk", "⚠️ Geen API-key ingesteld.");
        return { ok: false, error: "Geen API-key" };
      }

      let startObj;
      try {
        const r = readStartObject();
        startObj = r.obj;
      } catch (e) {
        console.error('[ai:chat] startobject read failed:', e?.message || e);
        if (win) win.webContents.send("ai:chunk", "⚠️ Startobject niet beschikbaar.");
        return { ok: false, error: 'startobject_not_found' };
      }

      const sysParts = [];
      if (startObj.system_prompt) sysParts.push(startObj.system_prompt);
      if (Array.isArray(startObj.guidelines)) {
        sysParts.push("Richtlijnen:\n- " + startObj.guidelines.join("\n- "));
      }
      if (startObj.titel || startObj.omschrijving) {
        sysParts.push(
          `Context: ${[startObj.titel, startObj.omschrijving].filter(Boolean).join(" — ")}`
        );
      }
      if (startObj.tools) {
        const on = Object.entries(startObj.tools).filter(([, v]) => v).map(([k]) => k);
        const off = Object.entries(startObj.tools).filter(([, v]) => !v).map(([k]) => k);
        sysParts.push(`Tools: aan=[${on.join(", ")}], uit=[${off.join(", ")}]`);
      }

      // automatic intent detection: kleine, explainable keyword-based check
      function detectSearchIntent(text) {
        if (!text || typeof text !== 'string') return false;
        const t = text.toLowerCase();
        const searchVerbs = ['zoek', 'zoeken', 'ik zoek', 'wil kopen', 'kopen', 'vind', 'zoeken naar', 'wil een', 'ik wil'];
        const objectKeywords = ['auto', 'wagen', 'voertuig', 'car', "auto's", 'nieuwe auto', 'nieuwe wagen'];
        const hasObject = objectKeywords.some(k => t.includes(k));
        const hasVerb = searchVerbs.some(v => t.includes(v));
        return hasObject && hasVerb;
      }

      const fullMessages = [
        ...(sysParts.length ? [{ role: "system", content: sysParts.join("\n\n") }] : []),
        ...(system ? [{ role: "system", content: system }] : []),
        ...messages,
      ];

      // Kijk of de laatste gebruikerszin zoekt naar iets (bv. "ik zoek een nieuwe auto")
      try {
        const lastUser = [...messages].reverse().find(m => m.role === 'user');
        const userText = lastUser?.content || '';
        if (detectSearchIntent(userText)) {
          // Start websearch (optioneel afhankelijk van API-key). Stuur resultaten naar renderer en
          // voeg een samenvatting toe aan de system messages zodat de AI ze kan gebruiken.
          try {
            // lazy-load websearch client so missing optional deps don't break startup
            let results = [];
            try {
              const wsClient = require('../infra/websearch-client');
              if (wsClient && typeof wsClient.googleWebSearch === 'function') {
                results = await wsClient.googleWebSearch(userText);
              } else {
                throw new Error('websearch client unavailable');
              }
            } catch (loadErr) {
              throw loadErr;
            }

            if (win) win.webContents.send('websearch:results', { query: userText, results });

            if (Array.isArray(results) && results.length) {
              const summary = results.map((r, i) => `[$${i+1}] ${r.name} - ${r.url}\n${r.snippet || ''}`).join('\n\n');
              fullMessages.unshift({ role: 'system', content: `Websearch results for query: "${userText}"\n\n${summary}` });
            }
          } catch (wsErr) {
            console.warn('[ai:chat] websearch failed:', wsErr?.message || wsErr);
            if (win) win.webContents.send('ai:chunk', `⚠️ Websearch niet beschikbaar: ${wsErr?.message || 'onbekend'}`);
          }
        }
      } catch (detectErr) {
        console.warn('[ai:chat] intent detection failed:', detectErr?.message || detectErr);
      }

      // Enforce configured model from single source of truth
      let appCfg;
      try {
        appCfg = getAppConfig();
      } catch (cfgErr) {
        console.error('[ai:chat] app config missing or invalid:', cfgErr?.message || cfgErr);
        if (win) win.webContents.send("ai:chunk", "⚠️ AI-config niet ingesteld.");
        return { ok: false, error: 'ai_config_missing' };
      }

      if (!appCfg?.model) {
        if (win) win.webContents.send("ai:chunk", "⚠️ AI-model niet geconfigureerd.");
        return { ok: false, error: 'ai_model_not_configured' };
      }

      model = appCfg.model;
      const temperature = startObj?.config?.aiTemperature ?? appCfg?.aiTemperature ?? 0.3;

      let result;
      try {
        result = await client.chat.completions.create({
          model,
          messages: fullMessages,
          temperature,
        });
      } catch (apiErr) {
        console.error('[ai:chat] OpenAI request failed:', apiErr?.message || apiErr);
        if (win) win.webContents.send("ai:chunk", `⚠️ Fout bij AI-aanvraag: ${apiErr?.message || 'onbekend'}`);
        return { ok: false, error: 'openai_error', details: apiErr?.message || String(apiErr) };
      }

      const text = result?.choices?.[0]?.message?.content || "";
      if (win) win.webContents.send("ai:chunk", text);
      return { ok: true, tokens: result?.usage || null };
    } catch (err) {
      console.error("AI chat error:", err);
      if (win) win.webContents.send("ai:chunk", `⚠️ Fout: ${err?.message || 'onbekend'}`);
      return { ok: false, error: 'internal_error', details: err?.message || String(err) };
    }
  });

  ipcMain.handle("index:get", async () => {
    // Stel je hebt een functie getCompactIndex() die de index ophaalt:
    // return await getCompactIndex();

    // Tijdelijk kun je testen met een dummy:
    return [
      { id: "1", naam: "Voorbeeld", type: "startobject" }
    ];
  });
}

module.exports = { registerChatIpc };
