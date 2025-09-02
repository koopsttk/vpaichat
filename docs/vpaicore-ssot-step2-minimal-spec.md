# VPAICore – Stap 2: SSOT Minimal Spec (natuurlijke taal, zonder code)

> Situatie: de chat‑app werkt volledig. Dit document legt het **minimale** SSOT‑gedrag vast om dataobjecten (zoals notities of adressen) te maken, te bewaren en vindbaar te houden.


## 1) Standaardparameters (altijd aanwezig)
Elk object bevat één vast **MainParameters**‑blok:
- **id**: GUID (globaal uniek)
- **createdAt**: ISO8601 (immutabel)
- **updatedAt**: ISO8601 (wijzigt bij elke write)
- **schema**: versie/contract (bijv. `v0.4`)
- **role**: type, bijv. `notitie`, `adres`
- **aliases**: optioneel

> Dit blok staat **in elk object** (templates én instances) onder dezelfde sleutelnaam.


## 2) Template (per type)
Voor elk type bestaat een **template‑object** in `/data/` met velden en regels (append‑only: velden toevoegen mag; verwijderen pas later via migratie).  
Als er geen template is wanneer jij iets vraagt (“maak een notitie”), dan wordt het template **eerst aangemaakt** en vastgelegd.


## 3) Objectopbouw (instance)
De AI bouwt op basis van het template een **instance‑object**:
- **MainParameters** invullen (id, tijden, schema, role)
- **Type‑specifieke velden** (zoals gedefinieerd in het template)
- **Gebruikersdata** uit de chat

Ontbreekt een genoemd veld in het template? Dan wordt het **aan het template toegevoegd** (append‑only) en vervolgens in de instance gebruikt.


## 4) Cyclus bij nieuwe input (voorbeeld: notitie)
1. Jij typt in natuurlijke taal: “maak een notitie …”
2. AI bepaalt `type = notitie` en zoekt **eerst** het bijbehorende template
3. Template bestaat → direct gebruiken; anders **aanmaken**
4. Instance bouwen (standaardparameters + templatevelden + ingevoerde data)
5. **Opslaan** in `/data/` en registreren in **instances‑index**


## 5) Cyclus bij bestaand type (voorbeeld: adres)
1. Jij typt: “maak een adres …”
2. AI gebruikt bestaand **template `adres`**
3. Velden invullen; ontbrekende verplichte velden worden uitgevraagd
4. Nieuwe velden? **Eerst template uitbreiden**, dán instance opslaan


## 6) Opslag & indexen (schaalbaar vanaf dag 1)
- Alles staat in **`/data/`** (templates én instances). Bestandsnamen: `YYYY-MM-DDTHH-mm-ssZ_<GUID>.json`
- **Gescheiden indexen**:
  - `/data/index/templates.index.json` → klein/snel; alléén templates
  - `/data/index/instances.index.json` → alle instances (later sharden per type/maand indien groot)
- Het **startobject** verwijst minimaal naar **templates.index.json** (en optioneel naar het instances‑manifest)
- De app leest/schrijft **altijd via de indexen**; UI/AI hebben geen padkennis


---

## Blueprint‑patch (plak in *vpaicore-blauwdruk-v0.3.md* onder “⚙️ Kernprincipes” als nieuwe sectie)

### Stap 2 – SSOT Minimal Spec (natuurlijke taal)

- **MainParameters (vast blok in elk object):** `id` (GUID), `createdAt` (ISO), `updatedAt` (ISO), `schema` (bijv. v0.4), `role` (type), `aliases` (optioneel).
- **Templates per type:** definieert velden/regels; ontbreekt een template, dan wordt het **eerst aangemaakt** (append‑only uitbreiden bij nieuwe velden).
- **Instance‑opbouw:** AI bouwt object op basis van template; ontbrekende verplichte velden worden uitgevraagd.
- **Natuurlijke taal:** gebruiker typt “maak een notitie/adres …”; AI orkestreert, SSOT bewaart.
- **Opslag & indexen:** alles in `/data/`; **gescheiden indexen** → `index/templates.index.json` (templates) en `index/instances.index.json` (instances; sharden mogelijk).
- **Startobject als regisseur:** verwijst minimaal naar `templates.index.json` (en optioneel naar het instances‑manifest). UI/AI kennen **geen paden**; alleen alias/id via indexen.

