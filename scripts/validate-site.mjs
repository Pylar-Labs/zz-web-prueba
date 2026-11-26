// Valida un archivo de datos del sitio contra el esquema (spec 001, RF-1).
//
// Uso:  node scripts/validate-site.mjs [ruta-al-json] [--json]
//   - Sin ruta usa la variable SITE_DATA o, si no existe, src/content/site.data.json.
//   - --json imprime el informe estructurado en vez del texto legible.
// Salida del proceso: 0 = datos válidos · 1 = datos inválidos · 2 = no se pudo leer el archivo.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { formatReport, validateSite } from "../src/content/site.schema.ts";

const root = fileURLToPath(new URL("..", import.meta.url));
const args = process.argv.slice(2);
const asJson = args.includes("--json");
const argPath = args.find((a) => !a.startsWith("--"));

const path = argPath
  ? resolve(process.cwd(), argPath)
  : process.env.SITE_DATA
    ? resolve(process.cwd(), process.env.SITE_DATA)
    : resolve(root, "src/content/site.data.json");

let text;
try {
  text = readFileSync(path, "utf8");
} catch (error) {
  console.error(`No se pudo leer "${path}": ${error instanceof Error ? error.message : String(error)}`);
  process.exit(2);
}

let data;
try {
  data = JSON.parse(text);
} catch (error) {
  console.error(`El archivo "${path}" no es un JSON válido: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(2);
}

const report = validateSite(data);
console.log(asJson ? JSON.stringify(report, null, 2) : formatReport(report));
process.exit(report.ok ? 0 : 1);
