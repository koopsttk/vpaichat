/**
 * VPAICore – src/ipc/chat.ipc.js
 * Rol: IPC handlers: chat/AI routes
 * Koppelingen: infra/openAiClient
 * Belangrijk: —
 *
 * Conventies:
 * - Houd main.js dun (alleen IPC doorverwijzers).
 * - Startobject is SSOT-regiekamer; pad hard uit init/ini.cfg of config/ini.cfg.
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
  ipcMain.handle("ai:chat", async (_evt, { messages = [], model = "gpt-4o-mini", system }) => {
    const win = BrowserWindow.getAllWindows()[0];
    try {
      const client = getOpenAIClient();
      if (!client) {
        if (win) win.webContents.send("ai:chunk", "⚠️ Geen API-key ingesteld.");
        return { ok: false, error: "Geen API-key" };
      }

      const { obj: startObj } = readStartObject();

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

      const fullMessages = [
        ...(sysParts.length ? [{ role: "system", content: sysParts.join("\n\n") }] : []),
        ...(system ? [{ role: "system", content: system }] : []),
        ...messages,
      ];

      const result = await client.chat.completions.create({
        model,
        messages: fullMessages,
        temperature: startObj?.config?.aiTemperature ?? 0.3,
      });

      const text = result?.choices?.[0]?.message?.content || "";
      if (win) win.webContents.send("ai:chunk", text);
      return { ok: true };
    } catch (err) {
      console.error("AI chat error:", err);
      if (win) win.webContents.send("ai:chunk", `⚠️ Fout: ${err.message}`);
      return { ok: false, error: err.message };
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
