/**
 * VPAICore – public/JS/api.js
 * Rol: Renderer helper: DOM + veilige toegang tot preload API
 * Koppelingen: renderer-modules, preload window.api.*
 * Belangrijk: —
 *
 * Conventies:
 * - Houd main.js dun (alleen IPC doorverwijzers).
 * - Startobject is SSOT-regiekamer; pad hard uit init/ini.cfg of config/ini.cfg.
 * - AI seed: compacte index + startobject in system prompt (renderer of service).
 */

// public/js/api.js
/** API(): functionele rol en contract. Zie Blauwdruk/ARCHITECTURE.md. */
export function API() {
  return window.api ?? window.vpaicore ?? {};
}
/** onSafe(): functionele rol en contract. Zie Blauwdruk/ARCHITECTURE.md. */
export function onSafe(el, evt, fn, opts) {
  if (el) el.addEventListener(evt, fn, opts);
}
/** addMessage(): functionele rol en contract. Zie Blauwdruk/ARCHITECTURE.md. */
export function addMessage(role, text = "", opts = {}) {
  const chatEl = document.getElementById("chat");
  if (!chatEl) return null;
  const m = document.createElement("div");
  m.className = "msg " + role + (opts.typing ? " typing" : "");
  if (opts.typing) {
    m.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
  } else {
    // AI-berichten krijgen een kopieerknop
    if (role === "ai") {
      // hoofdtekst
      const content = document.createElement("span");
      content.className = "msg-content";
      content.textContent = text;
      m.appendChild(content);
      // kopieerknop
      const btn = document.createElement("button");
      btn.className = "copyBtn";
      btn.title = "Kopieer";
      btn.innerHTML = '📋';
      btn.onclick = function(e) {
        e.stopPropagation();
        // kopieer alleen de tekst (zonder knop)
        navigator.clipboard.writeText(content.textContent);
        btn.innerHTML = '✔️';
        setTimeout(() => { btn.innerHTML = '📋'; }, 1200);
      };
      m.appendChild(btn);
    } else {
      m.textContent = text;
    }
  }
  chatEl.appendChild(m);
  chatEl.scrollTop = chatEl.scrollHeight;
  return m;
}
/** toast(): functionele rol en contract. Zie Blauwdruk/ARCHITECTURE.md. */
export function toast(msg, kind = "warn") {
  const t = document.createElement("div");
  t.className = "toast" + (kind === "error" ? " error" : "");
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}
/** setTitleAndDescription(): functionele rol en contract. Zie Blauwdruk/ARCHITECTURE.md. */
export function setTitleAndDescription(titel, description) {
  const tEl = document.getElementById("appTitle") || document.querySelector("[data-start-title]");
  const dEl = document.getElementById("appDescription") || document.querySelector("[data-start-desc]");
  if (tEl && titel != null) tEl.textContent = titel || "Ongetitelde installatie";
  if (dEl && description != null) dEl.textContent = description || "";
}
