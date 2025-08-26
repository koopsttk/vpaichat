# ROADMAP – VPAICore / aichat

## Fase 1 – Basis werkend maken
- [x] **Electron shell** draait (main.js)  
- [x] **Renderer** (chat-UI, enter/shift-enter bug opgelost)  
- [x] **Preload bridges** (chat, startobject ophalen)  
- [x] **Startobject hardcoded via ini.json**  

---

## Fase 2 – Documentatie & Commentaar
- [x] Code voorzien van inline commentaar (zie `aichat_annotated.zip`)  
- [x] Basis documentatie gemaakt (`aichat_docs.zip`)  
- [ ] **ARCHITECTURE.md uitbreiden** met splitsing renderer.js → modules (UI, AI-chat, object-handling)  
- [ ] **CONFIG.md** aanvullen met voorbeelden van `ini.json`

---

## Fase 3 – Objectbeheer (SSOT)
- [ ] Helpers implementeren in `ssot.js`:  
  - `createObject()`  
  - `readObjectById()`  
  - `updateObject()`  
  - `listObjects()`  
  - `findByLogicalName()`  
- [ ] `_index.json` genereren/bijwerken  
- [ ] Bestandsnaam standaardiseren → `Timestamp_GUID.json`  
- [ ] `__meta.hash` opnemen en integriteits-check toevoegen  

---

## Fase 4 – AI-awareness
- [ ] System prompt verrijken met compacte index (`id`, `rol`, `titel`, `created`)  
- [ ] Bij “wat is je rol?” laat AI antwoorden vanuit **startobject** i.p.v. standaardmodel  
- [ ] On-demand volledig object inlezen bij vragen  

---

## Fase 5 – UI uitbreiden
- [ ] Renderer: zoek/koppel functies toevoegen  
- [ ] Renderer opsplitsen in modules (bijv. `ui.chat.js`, `ui.status.js`, `ui.forms.js`)  
- [ ] Toasts uitbreiden met niveaus (info, success, warning, error)  

---

## Fase 6 – Integriteit & Logging
- [ ] Batch “Controleer integriteit” → hash-compare over alle objecten  
- [ ] Logging bij mismatch of corrupte objecten  
- [ ] Versiebeheer (`__meta.rev`) → optioneel  

---

## Fase 7 – Nice-to-have
- [ ] Soft-delete / archiveren objecten  
- [ ] Export/import van dataset (zip + manifest)  
- [ ] Automatisch genereren van tutorials (AI leest eigen core en maakt uitleg-objecten)  
