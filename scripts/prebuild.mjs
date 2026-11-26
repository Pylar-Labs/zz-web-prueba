// Comprobaciones previas al build (spec 007): validación de datos y revisión de tipos.
//
// Las dos se ejecutan SIEMPRE, aunque la primera falle, para mostrar todos los errores a la vez.
// Si falla cualquiera, termina con código 1 y `astro build` no se ejecuta (npm corta la cadena).
// La validación de datos es la misma de `npm run validate` (mismos mensajes y formato).
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { runTypecheck } from "./typecheck.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

// Cada paso es { name, run } y `run()` devuelve { ok, output }.
export function runAll(steps) {
  const results = steps.map(({ name, run }) => ({ name, ...run() }));
  return { ok: results.every((result) => result.ok), results };
}

export function formatSummary(results) {
  const failed = results.filter((result) => !result.ok).map((result) => result.name);
  if (failed.length === 0) return "Comprobaciones previas al build: todo correcto.";
  const verb = failed.length > 1 ? "Fallaron" : "Falló";
  return `${verb} ${failed.join(" y ")}: no se construye la web.`;
}

function runValidate() {
  const result = spawnSync(
    process.execPath,
    ["--experimental-strip-types", "--disable-warning=ExperimentalWarning", "scripts/validate-site.mjs"],
    { cwd: ROOT, encoding: "utf8" },
  );
  if (result.error) {
    return { ok: false, output: `No se pudo ejecutar la validación de datos: ${result.error.message}` };
  }
  return { ok: result.status === 0, output: `${result.stdout ?? ""}${result.stderr ?? ""}`.trimEnd() };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const { ok, results } = runAll([
    { name: "la validación de datos", run: runValidate },
    { name: "la revisión de tipos", run: runTypecheck },
  ]);
  for (const result of results) {
    (result.ok ? console.log : console.error)(`${result.output}\n`);
  }
  (ok ? console.log : console.error)(formatSummary(results));
  process.exit(ok ? 0 : 1);
}
