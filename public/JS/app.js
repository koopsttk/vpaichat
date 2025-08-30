// Thema toggle
function setTheme(theme) {
  document.body.classList.toggle('light-theme', theme === 'light');
  document.getElementById('theme-toggle').textContent = theme === 'light' ? '☀️' : '🌙';
  localStorage.setItem('theme', theme);
  // Swap highlight.js theme CSS
  try {
    const hljsLink = document.getElementById('hljs-theme');
    if (hljsLink) {
      // Choose theme files located in public/vendor/
      hljsLink.href = theme === 'light' ? 'vendor/highlight.default.css' : 'vendor/highlight.atom-one-dark.css';
    }
  } catch (e) {
    // ignore — hljs theme is progressive enhancement
    console.warn('Could not swap hljs theme', e);
  }
}

function toggleTheme() {
  const isLight = document.body.classList.contains('light-theme');
  setTheme(isLight ? 'dark' : 'light');
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.addEventListener('click', toggleTheme);
  // Init theme from localStorage
  const saved = localStorage.getItem('theme');
  if (saved === 'light') setTheme('light');
});
/**
 * VPAICore – public/JS/app.js
 * Rol: Renderer entrypoint: events binden en orkestreren
 * Koppelingen: api.js, seed.js, status.js, chat.js
 * Belangrijk: —
 *
 * Conventies:
 * - Houd main.js dun (alleen IPC doorverwijzers).
 * - Startobject is SSOT-regiekamer; pad hard uit init/ini.json of config/ini.json.
 * - AI seed: compacte index + startobject in system prompt (renderer of service).
 */

// public/js/app.js
import { API, onSafe, toast } from "./api.js";
import { loadSeedAndBindUI } from "./seed.js";
import { refreshStatus, refreshKeyStatus } from "./status.js";
import { handleUserInput, onStreamChunk } from "./chat.js";
import { countTokens, updateTokenStatus } from "./token.js";

/** autoGrowTextarea(): functionele rol en contract. Zie Blauwdruk/ARCHITECTURE.md. */
function autoGrowTextarea(e) {
  const el = e.target;
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}


let chatlogFilePath = null;
let activeChatlog = null;
let activeChatlogHistory = [];

document.addEventListener("DOMContentLoaded", async () => {
  // --- Chatlog lijst functionaliteit ---
  const chatlogListEl = document.getElementById('chatlogList');
  const newChatBtn = document.getElementById('newChatBtn');
  // Helper: haal chatlogs op uit backend (via preload bridge of direct via window.api)
  async function fetchChatlogs() {
    // Simpel: vraag lijst op via IPC (maak evt. een eigen IPC-kanaal voor dir-list)
    if (!window.api?.listChatlogs) {
      // Fallback: hardcoded lijst (vervang door IPC voor productie)
      return [
        '20250830T102510333Z_1d859408-0a0d-4a75-bd27-e149f83005ed.json',
        '20250830T103121130Z_16be84e6-d566-48c5-9a0e-7ebec899d663.json'
      ];
    }
    return await window.api.listChatlogs();
  }

  // Helper: toon chatlogs in de UI
  async function renderChatlogList() {
    const logs = await fetchChatlogs();
    chatlogListEl.innerHTML = '';
    for (const filename of logs) {
      const li = document.createElement('li');
      li.className = (activeChatlog === filename) ? 'active' : '';
      li.style.display = 'flex';
      li.style.alignItems = 'center';
      li.style.gap = '0.5em';
      li.style.marginBottom = '0.2em';
      // Titel ophalen: eerste user-bericht, anders '…' bij lege chat, anders bestandsnaam
      let title = '…';
      if (window.api?.openChatlog) {
        try {
          const data = await window.api.openChatlog(filename);
          if (data && Array.isArray(data.log)) {
            const firstUser = data.log.find(e => e.role === 'user' && e.message);
            if (firstUser) {
              title = firstUser.message.slice(0, 40) + (firstUser.message.length > 40 ? '…' : '');
            }
          }
        } catch {}
      }
      // Fallback: als geen user-bericht en chat niet leeg, gebruik bestandsnaam
      if (title === '…') {
        if (window.api?.openChatlog) {
          try {
            const data = await window.api.openChatlog(filename);
            if (data && Array.isArray(data.log) && data.log.length > 0) {
              title = filename.replace('.json', '');
            }
          } catch {}
        }
      }
      li.textContent = title;
      // Klik op li: laad deze chatlog
      li.onclick = async (e) => {
        if (activeChatlog === filename) return;
        activeChatlog = filename;
        // Volledig pad naar chatlogbestand
        const chatlogDir = (window.api?.getAppConfig && (await window.api.getAppConfig()).dataDir) ? (await window.api.getAppConfig()).dataDir + '/chatlogs/' : 'data/chatlogs/';
        chatlogFilePath = chatlogDir + filename;
        await renderChatlogList();
        // Chatvenster vullen en history opslaan
        if (window.api?.openChatlog) {
          try {
            const data = await window.api.openChatlog(filename);
            activeChatlogHistory = Array.isArray(data.log) ? data.log : [];
            renderChatHistory(activeChatlogHistory);
          } catch {
            activeChatlogHistory = [];
            renderChatHistory([]);
          }
        }
      };
      // Verwijder-knop
      const delBtn = document.createElement('button');
      delBtn.textContent = '🗑️';
      delBtn.title = 'Verwijder deze chat';
      delBtn.onclick = async (e) => {
        e.stopPropagation();
        if (window.api?.deleteChatlog) {
          await window.api.deleteChatlog(filename);
        } else {
          toast('Verwijderen niet geïmplementeerd', 'error');
        }
        if (activeChatlog === filename) {
          activeChatlog = null;
          renderChatHistory([]);
        }
        await renderChatlogList();
      };
      li.appendChild(delBtn);
      chatlogListEl.appendChild(li);
    }
  }

  // Helper: render chatgeschiedenis in het chatvenster
  function renderChatHistory(log) {
    const chatEl = document.getElementById('chat');
    chatEl.innerHTML = '';
    log.forEach(entry => {
      const msgDiv = document.createElement('div');
      msgDiv.className = 'msg ' + (entry.role === 'user' ? 'user' : 'ai');
      // Berichttekst
      const msgContent = document.createElement('span');
      msgContent.className = 'msg-content';
      msgContent.textContent = entry.message;
      msgDiv.appendChild(msgContent);
      // Alleen copy-icoon bij AI-uitvoer
      if (entry.role !== 'user') {
        const copyBtn = document.createElement('button');
        copyBtn.className = 'copyBtn';
        copyBtn.title = 'Kopieer tekst';
        copyBtn.innerHTML = '📋';
        copyBtn.onclick = (e) => {
          e.stopPropagation();
          navigator.clipboard.writeText(entry.message || '').then(() => {
            copyBtn.innerHTML = '✔️';
            setTimeout(() => { copyBtn.innerHTML = '📋'; }, 1200);
          });
        };
        msgDiv.appendChild(copyBtn);
      }
      chatEl.appendChild(msgDiv);
    });
  }

  if (newChatBtn) {
    newChatBtn.onclick = async () => {
      if (window.api?.createChatlogSession) {
        chatlogFilePath = await window.api.createChatlogSession();
        await renderChatlogList(); // lijst direct updaten
        activeChatlog = null;
        activeChatlogHistory = [];
        renderChatHistory([]);
        toast('Nieuwe chat gestart', 'ok');
      }
    };
  }

  // Init chatlog lijst
  await renderChatlogList();
  const api = API();
  const sendBtn = document.getElementById("send");
  const inputEl = document.getElementById("input");
  const form = document.getElementById("apiKeyForm");
  const keyStatus = document.getElementById('st-key');

  // 1) Seed (startobject + index) + UI vullen
  await loadSeedAndBindUI();

  // 2) Status
  await refreshStatus();

  // 3) Chatlog sessie starten
  // Verwijderd: chatlog sessie wordt alleen gestart bij user-actie (Nieuwe chat)

  // Helper om interacties te loggen
  async function logInteraction(role, message) {
    if (!chatlogFilePath || !window.api?.appendToChatlog) return;
    await window.api.appendToChatlog(chatlogFilePath, { role, message });
    // Voeg toe aan actieve history als we in een nieuwe chat zitten
    if (!activeChatlog) {
      activeChatlogHistory.push({ role, message });
    }
  }
  // Exposeer logInteraction voor andere modules (zoals chat.js)
  window.logInteraction = logInteraction;

  // Helper: geef de huidige context (voor chat.js)
  window.getActiveChatContext = function() {
    // Neem alleen de laatste N berichten als context (bijv. 20)
    const N = 20;
    if (activeChatlogHistory.length > N) {
      return activeChatlogHistory.slice(-N);
    }
    return [...activeChatlogHistory];
  };

  // 4) Events
  onSafe(sendBtn, "click", async () => {
    if (!inputEl) return;
    const txt = inputEl.value;
    inputEl.value = "";
    inputEl.style.height = "auto";
    updateTokenStatus(countTokens(txt));
    // Als er nog geen chatlog is, maak er nu een aan
    if (!chatlogFilePath && window.api?.createChatlogSession) {
      chatlogFilePath = await window.api.createChatlogSession();
      activeChatlog = null;
      activeChatlogHistory = [];
      await renderChatlogList();
    }
    await logInteraction('user', txt);
    // Als dit het eerste bericht in een nieuwe chat is, update lijst
    if (!activeChatlog && activeChatlogHistory.length === 1) {
      await renderChatlogList();
    }
    await handleUserInput(txt);
  });

  onSafe(inputEl, "keydown", async (e) => {
    if (e.isComposing) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const txt = inputEl.value;
      inputEl.value = "";
      inputEl.style.height = "auto";
      updateTokenStatus(countTokens(txt));
      // Als er nog geen chatlog is, maak er nu een aan
      if (!chatlogFilePath && window.api?.createChatlogSession) {
        chatlogFilePath = await window.api.createChatlogSession();
        activeChatlog = null;
        activeChatlogHistory = [];
        await renderChatlogList();
      }
      await logInteraction('user', txt);
      // Als dit het eerste bericht in een nieuwe chat is, update lijst
      if (!activeChatlog && activeChatlogHistory.length === 1) {
        await renderChatlogList();
      }
      handleUserInput(txt);
    }
  });
  onSafe(inputEl, "input", (e) => {
    autoGrowTextarea(e);
    updateTokenStatus(countTokens(inputEl.value));
  });

  // 5) Live updates vanuit main via preload-bridge (optioneel)
  // Titel uit startobject (DatasetOmschrijving) wordt via seed.js gezet
  api.onSetDescription?.((d) => {
    const el = document.getElementById("appDescription") || document.querySelector("[data-start-desc]");
    if (el) el.textContent = d || el.textContent;
  });
  api.onAiChunk?.((chunk) => {
    updateTokenStatus(countTokens(chunk));
    onStreamChunk(chunk);
  });

  // 6) API-key formulier (optioneel)
  onSafe(form, "submit", async (e) => {
    e.preventDefault();
    const key = document.getElementById("apiKeyInput")?.value?.trim();
    if (!key) return;
    const setter = api.setApiKey ?? window.vpaicore?.setApiKey;
    if (setter) await setter(key);
    await refreshStatus();
    toast("API-key opgeslagen", "ok");
  });

  // Delegated handler: per-codeblock copy button
  document.addEventListener('click', (e) => {
    const btn = e.target.closest?.('.copy-code');
    if (!btn) return;
    const wrap = btn.closest('.codewrap');
    if (!wrap) return;
    const codeEl = wrap.querySelector('pre.codeblock code');
    if (!codeEl) return;
    const text = codeEl.innerText || codeEl.textContent || '';
    navigator.clipboard.writeText(text).then(() => {
      const old = btn.innerHTML;
      btn.innerHTML = '✔️';
      setTimeout(() => { btn.innerHTML = old; }, 1200);
    }).catch(() => {
      toast('Kon code niet kopiëren', 'error');
    });
  });
}); // <-- deze regel sluit alles netjes af

window.addEventListener("DOMContentLoaded", () => {
  refreshKeyStatus();
});


