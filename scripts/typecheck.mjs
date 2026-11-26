// Revisión de tipos del código de la web (spec 007).
//
// Uso:  npm run typecheck   (o: node scripts/typecheck.mjs)
//   - Comprueba que las herramientas de desarrollo están instaladas y ejecuta `astro check`, que revisa
//     los archivos .ts, .tsx y .astro con la configuración estricta de tsconfig.json.
//   - Los scripts .mjs no se tipan (no hay revisión de JavaScript activada).
// Salida del proceso: 0 = sin errores de tipos · 1 = hay errores o faltan las herramientas.
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const ROOT = fileURLToPath(new URL("..", import.meta.url));

export const REQUIRED_TOOLS = ["typescript", "@astrojs/check"];

// Devuelve las herramientas que no se pueden resolver. `resolve` se inyecta para poder probarlo.
export function findMissingTools(resolve = (name) => require.resolve(name)) {
  return REQUIRED_TOOLS.filter((name) => {
    try {
      resolve(name);
      return false;
    } catch {
      return true;
    }
  });
}

export function buildMissingToolsMessage(missing) {
  const what = missing.length > 1 ? "faltan estas herramientas" : "falta esta herramienta";
  return [
    `No se puede hacer la revisión de tipos: ${what}: ${missing.join(", ")}.`,
    "Son dependencias de desarrollo. Instálalas con `npm ci` (o `npm install`) sin la opción --omit=dev y vuelve a ejecutar el comando.",
  ].join("\n");
}

// Ejecuta la revisión y devuelve { ok, output } (la salida de la herramienta, tal cual, más un resumen).
export function runTypecheck() {
  const missing = findMissingTools();
  if (missing.length > 0) return { ok: false, output: buildMissingToolsMessage(missing) };

  const astroBin = join(dirname(require.resolve("astro/package.json")), "bin", "astro.mjs");
  const result = spawnSync(process.execPath, [astroBin, "check"], { cwd: ROOT, encoding: "utf8" });
  if (result.error) {
    return { ok: false, output: `No se pudo ejecutar la revisión de tipos: ${result.error.message}` };
  }
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.trimEnd();
  const ok = result.status === 0;
  const summary = ok
    ? "Revisión de tipos: sin errores de tipos."
    : "Revisión de tipos: se encontraron errores de tipos (arriba, con archivo y línea).";
  return { ok, output: `${output}\n\n${summary}` };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const { ok, output } = runTypecheck();
  (ok ? console.log : console.error)(output);
  process.exit(ok ? 0 : 1);
}
