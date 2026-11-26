// Tests de la revisión de tipos (spec 007). Se ejecutan con `npm run test:typecheck`.
// La primera parte prueba la lógica pura (sin lanzar el compilador). La segunda ejecuta el comando de
// verdad con archivos de prueba que tienen errores de tipos y que se borran siempre.
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ANSI = /\x1b\[[0-9;]*m/g;

describe("herramientas ausentes (RF-10)", () => {
  const resolverWithout = (...absent) => (name) => {
    if (absent.includes(name)) throw new Error(`Cannot find module '${name}'`);
    return `/node_modules/${name}`;
  };

  test("sin ninguna ausente no devuelve nada", async () => {
    const { findMissingTools } = await import("./typecheck.mjs");
    assert.deepEqual(findMissingTools(resolverWithout()), []);
  });

  test("detecta typescript ausente", async () => {
    const { findMissingTools } = await import("./typecheck.mjs");
    assert.deepEqual(findMissingTools(resolverWithout("typescript")), ["typescript"]);
  });

  test("detecta @astrojs/check ausente", async () => {
    const { findMissingTools } = await import("./typecheck.mjs");
    assert.deepEqual(findMissingTools(resolverWithout("@astrojs/check")), ["@astrojs/check"]);
  });

  test("detecta las dos ausentes", async () => {
    const { findMissingTools } = await import("./typecheck.mjs");
    assert.deepEqual(findMissingTools(resolverWithout("typescript", "@astrojs/check")), [
      "typescript",
      "@astrojs/check",
    ]);
  });

  test("el mensaje está en español, nombra lo que falta y dice cómo instalarlo", async () => {
    const { buildMissingToolsMessage } = await import("./typecheck.mjs");
    const message = buildMissingToolsMessage(["typescript", "@astrojs/check"]);
    assert.match(message, /revisión de tipos/i);
    assert.match(message, /faltan|falta/i);
    assert.ok(message.includes("typescript"));
    assert.ok(message.includes("@astrojs/check"));
    assert.match(message, /npm (ci|install)/);
    assert.match(message, /desarrollo/i);
  });

  test("el mensaje en singular nombra solo lo que falta", async () => {
    const { buildMissingToolsMessage } = await import("./typecheck.mjs");
    const message = buildMissingToolsMessage(["typescript"]);
    assert.ok(message.includes("typescript"));
    assert.ok(!message.includes("@astrojs/check"));
  });
});

describe("las dos comprobaciones del build (RF-6 a RF-8)", () => {
  const step = (name, ok, output) => ({ name, run: () => ({ ok, output }) });

  test("ejecuta todos los pasos aunque el primero falle", async () => {
    const { runAll } = await import("./prebuild.mjs");
    const ran = [];
    const steps = [
      { name: "datos", run: () => (ran.push("datos"), { ok: false, output: "error de datos" }) },
      { name: "tipos", run: () => (ran.push("tipos"), { ok: true, output: "sin errores" }) },
    ];
    const result = runAll(steps);
    assert.deepEqual(ran, ["datos", "tipos"]);
    assert.equal(result.ok, false);
  });

  test("falla si solo falla el segundo", async () => {
    const { runAll } = await import("./prebuild.mjs");
    const result = runAll([step("datos", true, "bien"), step("tipos", false, "mal")]);
    assert.equal(result.ok, false);
    assert.deepEqual(result.results.map((r) => r.ok), [true, false]);
  });

  test("si fallan los dos, devuelve los dos errores completos", async () => {
    const { runAll } = await import("./prebuild.mjs");
    const result = runAll([step("datos", false, "ERROR-DATOS-1\nERROR-DATOS-2"), step("tipos", false, "ERROR-TIPOS-1")]);
    assert.equal(result.ok, false);
    assert.equal(result.results.length, 2);
    assert.equal(result.results[0].output, "ERROR-DATOS-1\nERROR-DATOS-2");
    assert.equal(result.results[1].output, "ERROR-TIPOS-1");
  });

  test("tiene éxito si pasan los dos", async () => {
    const { runAll } = await import("./prebuild.mjs");
    const result = runAll([step("datos", true, "a"), step("tipos", true, "b")]);
    assert.equal(result.ok, true);
  });

  test("el resumen en español nombra cada comprobación que falló", async () => {
    const { runAll, formatSummary } = await import("./prebuild.mjs");
    const result = runAll([step("validación de datos", false, "x"), step("revisión de tipos", false, "y")]);
    const summary = formatSummary(result.results);
    assert.ok(summary.includes("validación de datos"));
    assert.ok(summary.includes("revisión de tipos"));
    assert.match(summary, /no se construye|no se construirá/i);
  });

  test("el resumen no menciona fallos si todo pasa", async () => {
    const { runAll, formatSummary } = await import("./prebuild.mjs");
    const result = runAll([step("validación de datos", true, "x"), step("revisión de tipos", true, "y")]);
    assert.doesNotMatch(formatSummary(result.results), /falló|fallaron/i);
  });
});

describe("el comando de punta a punta (RF-1 a RF-4)", () => {
  const PROBE_TS = join(ROOT, "src", "__typecheck_probe__.ts");
  const PROBE_ASTRO = join(ROOT, "src", "components", "__typecheck_probe__.astro");
  const PROBE_MJS = join(ROOT, "scripts", "__typecheck_probe__.mjs");
  const probes = [PROBE_TS, PROBE_ASTRO, PROBE_MJS];

  const clean = () => probes.forEach((p) => rmSync(p, { force: true }));
  const run = () => {
    const result = spawnSync(process.execPath, ["scripts/typecheck.mjs"], { cwd: ROOT, encoding: "utf8" });
    return { status: result.status, output: `${result.stdout}${result.stderr}`.replace(ANSI, "") };
  };

  before(() => {
    const left = probes.filter((p) => existsSync(p));
    assert.deepEqual(left, [], `Quedan archivos de prueba de una ejecución anterior; bórralos antes de seguir: ${left.join(", ")}`);
  });
  after(clean);

  test("con errores de tipos en .ts y .astro falla, con ruta y línea, y no revisa los scripts .mjs", () => {
    try {
      writeFileSync(PROBE_TS, 'export const probe: number = "texto";\n');
      writeFileSync(PROBE_ASTRO, '---\nconst n: number = "texto";\n---\n<div>{n}</div>\n');
      writeFileSync(PROBE_MJS, "const n = 1;\nn.noExiste();\n");
      const { status, output } = run();
      assert.equal(status, 1, output);
      assert.match(output, /__typecheck_probe__\.ts:1:/);
      assert.match(output, /__typecheck_probe__\.astro:2:/);
      assert.doesNotMatch(output, /__typecheck_probe__\.mjs/);
    } finally {
      clean();
    }
  });

  test("solo con un error en un script .mjs y sin errores en el código de la web, pasa", () => {
    try {
      writeFileSync(PROBE_MJS, "const n = 1;\nn.noExiste();\n");
      const { status, output } = run();
      assert.equal(status, 0, output);
      assert.match(output, /sin errores de tipos/i);
    } finally {
      clean();
    }
  });
});
