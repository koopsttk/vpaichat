# VPAICore – CONFIG.md (config/ini.json schema)

`ini.json` ondersteunt platte sleutels **of** `[paths]`-sectie (geflattened JSON of object met secties).

Sleutels:
- `data_dir` – pad naar `/data` map (mag relatief aan ini.json).
- `startobject_file` – bestandsnaam van startobject in `data_dir`.
Alternatieven in `[paths]`:
- `data_dir`, `startobject_file`.

Resolutie:
- `src/core/startObject.js` leest eerst `/init/ini.json` (aanbevolen), anders fallback `/config/ini.json`.
- Paden worden relatief aan de ini-locatie absoluut gemaakt.
