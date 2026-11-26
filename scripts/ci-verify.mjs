// Construye las 16 variantes de la web (la demo y una por cada fixture) y comprueba cada una (spec 009).
//
// Uso:  node scripts/ci-verify.mjs --out <carpeta fuera del repositorio>   (o: npm run verify:ci -- --out <carpeta>)
//       node scripts/ci-verify.mjs --resumen-pasos                         (solo en el workflow, ver abajo)
//   - Para cada variante: `npm run build` (con su validación y su revisión de tipos) y `scripts/check-dist.mjs`.
//   - No se detiene al primer fallo: al final imprime un resumen y, si existe GITHUB_STEP_SUMMARY, lo añade ahí.
//   - Con --out copia el `dist` de cada variante a <carpeta>/dist-<nombre> (para compararlos entre sistemas).
//     La carpeta debe estar fuera del repositorio: la revisión de tipos y Tailwind recorren todo el árbol.
//   - Con --resumen-pasos (último paso del workflow) escribe el resultado de cada paso, leído de STEPS_JSON
//     (la salida de toJSON(steps) del workflow) y NODE_VERSION, nombrando los pasos que fallaron.
// Salida del proceso: 0 = todo pasa · 1 = alguna variante falla · 2 = argumentos o configuración incorrectos.
// Funciona igual en Windows y en Linux.
import { spawnSync } from "node:child_process";
import { appendFileSync, cpSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const IS_WINDOWS = process.platform === "win32";

// La demo (sin SITE_DATA) y un `site.<nombre>.json` por cada fixture, en orden alfabético por nombre.
export function listVariants(root) {
  const fixtures = readdirSync(join(root, "scripts", "fixtures"))
    .filter((file) => /^site\..+\.json$/.test(file))
    .map((file) => ({ name: file.slice("site.".length, -".json".length), data: `scripts/fixtures/${file}` }))
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  return [{ name: "demo", data: null }, ...fixtures];
}

// Ejecuta todas las variantes aunque alguna falle. `execute(variante)` devuelve { buildOk, distOk, seconds, output }.
export function runVariants(variants, execute) {
  return variants.map((variant) => {
    try {
      const result = execute(variant);
      return {
        name: variant.name,
        ok: Boolean(result.buildOk && result.distOk),
        build: Boolean(result.buildOk),
        dist: Boolean(result.distOk),
        seconds: result.seconds,
        output: result.output ?? "",
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { name: variant.name, ok: false, build: false, dist: false, seconds: 0, output: `No se pudo ejecutar la variante: ${message}` };
    }
  });
}

// ¿La carpeta está dentro del repositorio (o es el propio repositorio)? La revisión de tipos y Tailwind recorren
// todo el árbol: con los builds copiados dentro, la revisión falla (ENOBUFS) a partir de la segunda variante.
// Una carpeta llamada «..algo» dentro del repositorio está dentro: solo «..» o «../…» sube fuera.
export function isInsideRepo(root, dir) {
  const rel = relative(resolve(root), resolve(dir));
  const goesUp = rel === ".." || rel.startsWith(`..${sep}`);
  return rel === "" || (!goesUp && !isAbsolute(rel));
}

// Borra el build de una ejecución anterior (<salida>/dist-<nombre>), para que un fallo no deje uno viejo que parezca válido.
export function clearBuild(outDir, name) {
  if (!outDir) return;
  rmSync(join(outDir, `dist-${name}`), { recursive: true, force: true });
}

// Copia el build a la salida sin lanzar: si falla devuelve el motivo, y nunca deja el build viejo en su sitio.
export function copyBuild(source, target) {
  try {
    rmSync(target, { recursive: true, force: true });
    cpSync(source, target, { recursive: true });
    return { ok: true };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

const mark = (ok) => (ok ? "✅" : "❌");
const time = (seconds) => `${seconds.toFixed(1).replace(".", ",")} s`;

export function formatSummary(results, env) {
  const failed = results.filter((result) => !result.ok);
  const lines = [
    `## Verificación de las ${results.length} variantes`,
    "",
    `Node ${env.node} · npm ${env.npm} · ${env.platform}`,
    "",
    "| Variante | Build | check-dist | Tiempo |",
    "|---|---|---|---|",
    ...results.map((result) => `| ${result.name} | ${mark(result.build)} | ${mark(result.dist)} | ${time(result.seconds)} |`),
    "",
  ];
  if (failed.length === 0) lines.push("Todas las variantes pasan.");
  else lines.push(`${failed.length > 1 ? "Fallaron" : "Falló"} ${failed.length} de ${results.length}: ${failed.map((result) => result.name).join(", ")}.`);
  return lines.join("\n");
}

// Pasos del workflow con su identificador (`id`, en inglés) y su nombre en español, en el orden del workflow.
// El paso final del resumen es el único sin `id` (no puede aparecer en su propio resultado). Un test del
// repositorio comprueba que esta tabla coincide con el workflow.
export const STEP_NAMES = {
  checkout: "Descargar el código",
  "setup-node": "Instalar Node",
  versions: "Versiones usadas",
  install: "Instalar dependencias",
  "contract-tests": "Tests de contrato",
  "comparator-tests": "Tests del comparador de builds",
  "type-tests": "Tests de tipos",
  builds: "Construir las 16 variantes",
  upload: "Guardar los builds",
};
const OUTCOME_TEXT = { success: "✅ correcto", failure: "❌ falló", skipped: "⏭ omitido", cancelled: "⏹ cancelado" };

// Texto de un resultado: los no reconocidos se muestran tal cual (como texto y sin romper la tabla), nunca como
// propiedad heredada de Object.
function outcomeText(outcome) {
  if (typeof outcome === "string" && Object.hasOwn(OUTCOME_TEXT, outcome)) return OUTCOME_TEXT[outcome];
  if (typeof outcome === "string" && outcome !== "") return outcome.replaceAll("|", "\\|");
  return "desconocido";
}

// No hay nada fiable que resumir (error de configuración): el arranque lo convierte en el código de salida 2.
export class StepSummaryError extends Error {}

// Tipo JSON de un valor, en español, para los mensajes de forma de datos. No copia el contenido.
function describeType(value) {
  if (value === undefined) return "ningún valor";
  if (value === null) return "null";
  if (Array.isArray(value)) return "un array";
  if (typeof value === "string") return "un texto";
  if (typeof value === "number") return "un número";
  if (typeof value === "boolean") return "un booleano";
  return "un objeto";
}
const isPlainObject = (value) => describeType(value) === "un objeto";

// Versión de Node del título (spec 011): la de la matriz sin espacios en blanco a los lados; si falta, está vacía o
// solo tiene espacios en blanco, la del proceso, y se dice para no hacerla pasar por la de la matriz.
export function resolveNodeVersion(raw, processVersion = process.version) {
  const value = typeof raw === "string" ? raw.trim() : "";
  return value || `${processVersion} (la del proceso: falta NODE_VERSION)`;
}

// Resumen de los pasos de un trabajo (RF-4, spec 010): muestra todos los pasos que recibe, nombra los que fallaron,
// los cancelados y los de resultado no reconocido, y solo dice «Todos los pasos pasan» con un paso conocido en éxito.
// `steps` es la salida de toJSON(steps) del workflow: { <id>: { outcome, conclusion, outputs } }. Se usa `outcome`,
// el resultado del propio paso. Los pasos desconocidos (con `id` que no está en la tabla) se muestran por su `id`.
export function formatStepSummary(steps, node) {
  // Spec 011: primero la forma (conjunto y luego pasos), antes de buscar pasos conocidos.
  if (!isPlainObject(steps)) {
    throw new StepSummaryError(
      `Los datos de los pasos no tienen la forma esperada (un objeto con el resultado de cada paso): se recibió ${describeType(steps)}.`,
    );
  }
  const received = Object.entries(steps);
  const malformed = received.filter(([, step]) => !isPlainObject(step));
  if (malformed.length > 0) {
    throw new StepSummaryError(
      `Los datos de los pasos no tienen la forma esperada: cada paso debe ser un objeto con su resultado, pero ${malformed
        .map(([id, step]) => `\`${id}\` es ${describeType(step)}`)
        .join(", ")}.`,
    );
  }
  const knownIds = Object.keys(STEP_NAMES).filter((id) => received.some(([key]) => key === id));
  if (knownIds.length === 0) {
    throw new StepSummaryError(
      "No se encontró ningún paso conocido en el resultado de los pasos (¿se renombraron los id del workflow sin actualizar la tabla de nombres?).",
    );
  }
  const rows = [
    ...knownIds.map((id) => ({ known: true, name: STEP_NAMES[id], outcome: steps[id]?.outcome })),
    ...received.filter(([id]) => !Object.hasOwn(STEP_NAMES, id)).map(([id, step]) => ({ known: false, name: `\`${id}\``, outcome: step?.outcome })),
  ];
  const named = (test) => rows.filter((row) => test(row.outcome)).map((row) => row.name);
  const failed = named((outcome) => outcome === "failure");
  const cancelled = named((outcome) => outcome === "cancelled");
  const unrecognized = named((outcome) => !["success", "skipped", "failure", "cancelled"].includes(outcome));
  const problems = failed.length + cancelled.length + unrecognized.length;
  if (problems === 0 && !rows.some((row) => row.known && row.outcome === "success")) {
    throw new StepSummaryError(
      "Hay pasos conocidos, pero ningún paso conocido se ejecutó con éxito ni falló (¿se omitieron todos?): no hay resultado que resumir.",
    );
  }
  const lines = [
    `## Resultado de los pasos (Node ${node})`,
    "",
    "| Paso | Resultado |",
    "|---|---|",
    ...rows.map((row) => `| ${row.name} | ${outcomeText(row.outcome)} |`),
    "",
  ];
  if (failed.length === 1) lines.push(`Falló el paso con Node ${node}: ${failed[0]}.`);
  else if (failed.length > 1) lines.push(`Fallaron los pasos con Node ${node}: ${failed.join(", ")}.`);
  if (cancelled.length === 1) lines.push(`Quedó cancelado el paso con Node ${node}: ${cancelled[0]}.`);
  else if (cancelled.length > 1) lines.push(`Quedaron cancelados los pasos con Node ${node}: ${cancelled.join(", ")}.`);
  if (unrecognized.length === 1) lines.push(`Resultado no reconocido en el paso con Node ${node}: ${unrecognized[0]}.`);
  else if (unrecognized.length > 1) lines.push(`Resultado no reconocido en los pasos con Node ${node}: ${unrecognized.join(", ")}.`);
  if (problems === 0) lines.push("Todos los pasos pasan.");
  return lines.join("\n");
}

function lastLines(text, count) {
  return text.trimEnd().split("\n").slice(-count).join("\n");
}

function run(command, args, options) {
  return spawnSync(IS_WINDOWS && command === "npm" ? "npm.cmd" : command, args, {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    shell: IS_WINDOWS && command === "npm",
    ...options,
  });
}

function executeVariant(variant, outDir) {
  const env = { ...process.env };
  if (variant.data) env.SITE_DATA = variant.data;
  else delete env.SITE_DATA;

  clearBuild(outDir, variant.name);
  const started = Date.now();
  const build = run("npm", ["run", "build"], { env });
  const buildOk = build.status === 0;
  let distOk = false;
  let output = "";
  if (buildOk) {
    const check = run(process.execPath, ["scripts/check-dist.mjs"], { env });
    distOk = check.status === 0;
    if (!distOk) output = lastLines(`${check.stdout ?? ""}${check.stderr ?? ""}`, 40);
    if (outDir) {
      const copy = copyBuild(join(ROOT, "dist"), join(outDir, `dist-${variant.name}`));
      if (!copy.ok) {
        distOk = false;
        output = `${output}\nNo se pudo copiar el build a la salida: ${copy.message}`.trim();
      }
    }
  } else {
    output = lastLines(`${build.stdout ?? ""}${build.stderr ?? ""}${build.error ? String(build.error) : ""}`, 40);
  }
  return { buildOk, distOk, seconds: (Date.now() - started) / 1000, output };
}

function environment() {
  const npm = run("npm", ["--version"], {});
  return { node: process.version, npm: (npm.stdout ?? "").trim() || "?", platform: `${process.platform} ${process.arch}` };
}

function fail(message) {
  console.error(message);
  process.exit(2);
}

const USAGE = "Uso: node scripts/ci-verify.mjs --out <carpeta fuera del repositorio>  |  node scripts/ci-verify.mjs --resumen-pasos";

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const args = process.argv.slice(2);
  // Primero se detecta el modo resumen: `--out` no puede consumir `--resumen-pasos` como si fuera su valor,
  // para que la combinación dé el mismo error en cualquier orden.
  const stepsMode = args.includes("--resumen-pasos");
  let outGiven = false;
  let outValue;
  const unknown = [];
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === "--resumen-pasos") continue;
    if (args[i] === "--out") {
      outGiven = true;
      const next = args[i + 1];
      if (next !== undefined && !next.startsWith("--")) {
        outValue = next;
        i += 1;
      }
    } else unknown.push(args[i]);
  }
  // Todos los problemas de uso en un solo mensaje, con código 2 y sin construir, copiar ni resumir nada.
  const problems = [];
  if (unknown.length > 0) problems.push(`Argumento no reconocido: ${unknown.join(" ")}.`);
  if (stepsMode && outGiven) problems.push("--resumen-pasos y --out no se combinan: son dos modos distintos (resumir un trabajo o construir las 16 variantes).");
  if (outGiven && !outValue) problems.push("Falta la carpeta después de --out.");
  if (problems.length > 0) fail(`${problems.join(" ")} ${USAGE}`);

  if (stepsMode) {
    let steps;
    try {
      steps = JSON.parse(process.env.STEPS_JSON ?? "");
    } catch {
      fail(`Falta STEPS_JSON o no es un JSON válido (se espera la salida de toJSON(steps)). ${USAGE}`);
    }
    const node = resolveNodeVersion(process.env.NODE_VERSION);
    let text;
    try {
      text = formatStepSummary(steps, node);
    } catch (error) {
      if (error instanceof StepSummaryError) fail(`${error.message} ${USAGE}`);
      throw error;
    }
    console.log(text);
    if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${text}\n`);
    process.exit(0);
  }

  const outDir = outValue ? resolve(process.cwd(), outValue) : null;
  if (outDir && isInsideRepo(ROOT, outDir)) {
    fail(
      `La carpeta de --out debe estar fuera del repositorio (${outDir}): la revisión de tipos y Tailwind recorren todo el árbol y los builds copiados dentro la hacen fallar. Usa una carpeta temporal.`,
    );
  }
  if (outDir) mkdirSync(outDir, { recursive: true });

  const variants = listVariants(ROOT);
  let n = 0;
  const results = runVariants(variants, (variant) => {
    n += 1;
    console.log(`▶ Variante ${variant.name} (${n} de ${variants.length})…`);
    const result = executeVariant(variant, outDir);
    console.log(`  ${result.buildOk && result.distOk ? "pasa" : "FALLA"} en ${time(result.seconds)}`);
    return result;
  });

  for (const result of results.filter((r) => !r.ok)) {
    console.error(`\n--- ${result.name}: últimas líneas de la salida ---\n${result.output}`);
  }
  const summary = formatSummary(results, environment());
  console.log(`\n${summary}`);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`);
  process.exit(results.every((result) => result.ok) ? 0 : 1);
}
