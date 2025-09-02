# VPAICore Blauwdruk (v0.4 – September 2025)

## 📖 Samenvatting
Dit document is de **regisseur** van VPAICore.  
Het beschrijft de architectuur, documentatie, afspraken en koppelingen tussen code en data.  
De Blauwdruk fungeert als **Single Source of Truth (SSOT)**: alle andere documenten, code en pakketten verwijzen hiernaar.

---

## 📂 Projectstructuur

- **/src** → broncode (JavaScript/Electron), implementatie + korte inline comments.  
- **/docs** → documentatie, SSOT met detailuitleg en conventies.  
- **/data** → JSON objecten (startobject, templates, instances, indexen).  
- **/config** → configuratie (`ini.json`).  
- **/public** → frontend bestanden (`renderer.js`, UI).  

Distributiepakketten:
- `aichat_docs.zip` – volledige documentatie.  
- `aichat_annotated.zip` – code met commentaar.  
- `vpaicore_summary.zip` – samenvattend overzicht.  

---

## 📘 Documentatie & Snelkoppelingen

De detaildocumentatie staat in [`docs/`](docs/):

- 📘 [architecture.md](docs/architecture.md) – Overzicht modules en opzet  
- ⚙️ [config.md](docs/config.md) – Configuratie en voorbeelden  
- 🗺️ [roadmap.md](docs/roadmap.md) – Takenlijst en backlog  
- 📖 [readme.md](docs/readme.md) – Startpunt documentatie  

### ➕ Extra documentatie
- 📝 [CHANGELOG.md](docs/CHANGELOG.md) – Volledige wijzigingsgeschiedenis  
- 📐 [CONVENTIONS.md](docs/CONVENTIONS.md) – Afspraken over code & documentatie  
- 💬 [PROMPTING.md](docs/PROMPTING.md) – Prompting handleiding voor AI en gebruiker  

📦 Download docs-pakket: [aichat_docs.zip](aichat_docs.zip)

---

## ⚙️ Kernprincipes

1. **SSOT** – Data en documentatie worden altijd centraal beheerd.  
2. **Startobject** – Regelt rol, titel/omschrijving en context. Staat in `/data`, pad vastgelegd via `/config/ini.json`.  
3. **Separation of concerns** – Main-process/core alleen doorverwijzingen; services regelen de logica.  
4. **Transparantie** – Documentatie legt alles uit voor zowel mens als AI.  

---

## 🔗 Belangrijkste koppelingen

-- **Startobject Service**  
  - Leest `ini.json` om pad te vinden.  
  - Haalt startobject JSON in `/data` op.  
  - Geeft rol, titel en omschrijving door aan renderer.  

- **Renderer**  
  - UI-chatbox.  
  - Vraagt status op via `window.api`.  
  - Toont titel en omschrijving uit startobject.  
  - Stuurt chatvragen door naar AI.  

- **AI**  
  - Wordt gevoed met context (rol, startobject).  
  - Antwoorden volgen conventies uit `docs/CONVENTIONS.md`.  

---

## ➕ Stap 2 – SSOT Minimal Spec (natuurlijke taal)

1. **MainParameters (vast blok in elk object):** `id` (GUID), `createdAt` (ISO), `updatedAt` (ISO), `schema` (bijv. v0.4), `role` (type), `aliases` (optioneel).  
2. **Templates per type:** definieert velden/regels; ontbreekt een template, dan wordt het **eerst aangemaakt** (append‑only uitbreiden bij nieuwe velden).  
3. **Instance-opbouw:** AI bouwt object op basis van template; ontbrekende verplichte velden worden uitgevraagd.  
4. **Natuurlijke taal:** gebruiker typt “maak een notitie/adres …”; AI orkestreert, SSOT bewaart.  
5. **Opslag & indexen:** alles in `/data/`; **gescheiden indexen** → `index/templates.index.json` (templates) en `index/instances.index.json` (instances; sharden mogelijk).  
6. **Startobject als regisseur:** verwijst minimaal naar `templates.index.json` (en optioneel naar het instances‑manifest). UI/AI kennen **geen paden**; alleen alias/id via indexen.  

---

## 📝 Changelog

- **v0.4 – September 2025**  
  - Nieuwe sectie *Stap 2 – SSOT Minimal Spec* toegevoegd (natuurlijke taal).  
  - Startobject pad gecorrigeerd naar `/config/ini.json`.  
- **v0.3 – August 2025**  
  - Structuur verbeterd en overzichtelijke secties toegevoegd.  
  - Samenvatting bovenaan toegevoegd.  
  - Documentatie-links samengevoegd en verduidelijkt.  
- **v0.2 – August 2025**  
  - Sectie *Documentatie & Snelkoppelingen* toegevoegd.  
  - Nieuwe docs toegevoegd: CHANGELOG.md, CONVENTIONS.md, PROMPTING.md  
  - Versie-header bovenaan Blauwdruk.  
  - Roadmap, Architectuur en Config-documentatie geïntegreerd.  
- **v0.1 – July 2025**  
  - Eerste versie van de Blauwdruk opgesteld.  

