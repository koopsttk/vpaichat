const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { generateObjectFileName } = require("../src/utils/file-helpers");


function eersteInstallatie() {
  const baseDir = path.resolve(__dirname, "..");
  const iniDir = path.join(baseDir, "config");
  const dataDir = path.join(baseDir, "data");
  const bootstrapFile = path.join(__dirname, "vonk.json");

  if (!fs.existsSync(bootstrapFile)) {
    throw new Error("Geen bootstrapbestand gevonden.");
  }
  const bootstrapData = JSON.parse(fs.readFileSync(bootstrapFile, "utf-8"));

  // Robust lookup for the startobject in different bootstrap file shapes
  let startObj = null;
  if (Array.isArray(bootstrapData.objects) && bootstrapData.objects.length > 0) {
    startObj = bootstrapData.objects[0];
  } else if (bootstrapData.startobject_payload) {
    startObj = bootstrapData.startobject_payload;
  } else if (bootstrapData.startobject) {
    startObj = bootstrapData.startobject;
  } else {
    // Try to find any top-level object that looks like a startobject
    for (const k of Object.keys(bootstrapData)) {
      const v = bootstrapData[k];
      if (v && typeof v === 'object' && v.rol === 'startobject') {
        startObj = v;
        break;
      }
    }
  }

  if (!startObj) throw new Error('Geen startobject gevonden in bootstrapbestand.');

  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  // ✅ Genereer bestandsnaam via helper
  const filename = generateObjectFileName();
  const filePath = path.join(dataDir, filename);

  // Zorg dat het startobject 'id' overeenkomt met de bestandsnaam (timestamp + uuid)
  try {
    const baseId = path.basename(filename, '.json');
    if (startObj && typeof startObj === 'object') startObj.id = baseId;
  } catch (e) {
    // fallback: leave original id
  }

  fs.writeFileSync(filePath, JSON.stringify(startObj, null, 2), "utf-8");
  console.log(`[Eerste installatie] Startobject opgeslagen als ${filename}`);

  // ini.json schrijven (nieuwe JSON-first config)
  if (!fs.existsSync(iniDir)) fs.mkdirSync(iniDir);
  const cfgObj = {
    paths: {
      data_dir: path.relative(iniDir, dataDir),
      startobject_file: filename
    },
    security: {
      encryption: 'aes-256',
      bind_to_machine: true
    }
    ,
    chat: {
      max_input_length: 1000,
      allowed_chars: "^[\\w\\s.,!?@#\\-]+$",
      min_input_length: 2,
      max_lines: 5,
      allow_links: false,
      allow_unicode: true,
      require_question: false,
      block_repeated_chars: true,
      max_word_length: 30,
      allow_commands: true,
      enable_forbidden_words: true
    },
    development: {
      "dev.openDevTools": true
    }
  };
  fs.writeFileSync(path.join(iniDir, "ini.json"), JSON.stringify(cfgObj, null, 2), "utf-8");

  // Bootstrap markeren
  const doneFile = bootstrapFile.replace(/\.json$/i, ".done");
  fs.renameSync(bootstrapFile, doneFile);
}

if (require.main === module) {
  try {
    eersteInstallatie();
    console.log("✅ Eerste installatie afgerond.");
  } catch (err) {
    console.error("❌ Fout:", err.message);
    process.exit(1);
  }
}

module.exports = { eersteInstallatie };
