const fs = require("fs");
const path = require("path");
const parseArgs = require("minimist");

function loadSpecs(dir) {
  const replaceImportsMappings = [];
  const deprecateImportsMappings = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  const getMappingsFromEntry = (entry) => {
    if (entry.isDirectory()) {
      return loadSpecs(path.join(dir, entry.name));
    } else if (entry.name === "update-imports-specs.json") {
      const jsonFile = fs.readFileSync(path.join(dir, entry.name), "utf8");
      return JSON.parse(jsonFile);
    } else return null;
  };

  entries.forEach((entry) => {
    const newMappings = getMappingsFromEntry(entry);
    if (newMappings) {
      replaceImportsMappings.push(...newMappings.replaceImportsMappings);
      deprecateImportsMappings.push(...newMappings.deprecateImportsMappings);
    }
  });
  return { replaceImportsMappings, deprecateImportsMappings };
}

const { specsFile, projectDir } = parseArgs(process.argv.slice(2));

const jsonData = loadSpecs(projectDir);

fs.writeFileSync(specsFile, JSON.stringify(jsonData), { endocing: "utf8" });
