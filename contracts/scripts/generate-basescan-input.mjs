import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const contractRoot = path.resolve(scriptDir, "..");
const projectRoot = path.resolve(contractRoot, "..");
const sources = {};

function resolveImport(importPath, parentUnit, parentFile) {
  if (importPath.startsWith("@openzeppelin/contracts/")) {
    const unit = path.posix.join("node_modules", importPath);
    return { unit, file: path.resolve(projectRoot, unit) };
  }
  const unit = path.posix.normalize(path.posix.join(path.posix.dirname(parentUnit), importPath));
  return { unit, file: path.resolve(path.dirname(parentFile), importPath) };
}

function addSource(unit, file) {
  if (sources[unit]) return;
  const content = readFileSync(file, "utf8");
  sources[unit] = { content };
  const importPattern = /import\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']\s*;/g;
  for (const match of content.matchAll(importPattern)) {
    const resolved = resolveImport(match[1], unit, file);
    addSource(resolved.unit, resolved.file);
  }
}

addSource("src/Thanksmaxxing.sol", path.resolve(contractRoot, "src", "Thanksmaxxing.sol"));

const input = {
  language: "Solidity",
  sources,
  settings: {
    remappings: ["@openzeppelin/contracts/=node_modules/@openzeppelin/contracts/"],
    optimizer: { enabled: true, runs: 200 },
    viaIR: true,
    outputSelection: {
      "*": {
        "*": ["abi", "metadata", "evm.bytecode", "evm.deployedBytecode", "evm.methodIdentifiers"],
      },
    },
  },
};

const outputDir = path.resolve(contractRoot, "out");
mkdirSync(outputDir, { recursive: true });
const outputPath = path.join(outputDir, "Thanksmaxxing.standard-input.json");
writeFileSync(outputPath, `${JSON.stringify(input, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ outputPath, sourceFiles: Object.keys(sources).length }));
