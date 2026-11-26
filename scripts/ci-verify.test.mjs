// Tests de la verificación de las 16 variantes (spec 009). Pruebas puras: no lanzan builds.
// Se ejecutan con `npm run test:schema`.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ENV = { node: "v24.15.0", npm: "12.2.0", platform: "linux x64" };

describe("las variantes (RF-3)", () => {
  test("son 16: la demo primero (sin datos) y una por cada fixture", async () => {
    const { listVariants } = await import("./ci-verify.mjs");
    const variants = listVariants(ROOT);
    assert.equal(variants.length, 16);
    assert.deepEqual(variants[0], { name: "demo", data: null });
    assert.deepEqual(
      variants.slice(1).map((v) => v.name),
      [
        "max", "max.en", "max.pt", "min", "min.en", "min.pt",
        "price.ars.en", "price.ars.pt", "price.clp.es", "price.mxn.es", "price.usd.es",
        "stats.one", "stats.three-limits", "stats.two", "stats.two-limits",
      ],
    );
  });

  // Spec 012 (RF-9): el número del nombre del paso no puede quedar viejo al añadir o quitar fixtures.
  test("el número del nombre del paso de las variantes coincide con las variantes que hay", async () => {
    const { listVariants, STEP_NAMES } = await import("./ci-verify.mjs");
    assert.equal(STEP_NAMES.builds, `Construir las ${listVariants(ROOT).length} variantes`);
  });

  test("cada fixture lleva su ruta relativa con barras normales y el archivo existe", async () => {
    const { listVariants } = await import("./ci-verify.mjs");
    for (const v of listVariants(ROOT).slice(1)) {
      assert.match(v.data, /^scripts\/fixtures\/site\..+\.json$/);
      assert.ok(existsSync(join(ROOT, v.data)), v.data);
    }
  });

  test("los nombres no se repiten", async () => {
    const { listVariants } = await import("./ci-verify.mjs");
    const names = listVariants(ROOT).map((v) => v.name);
    assert.equal(new Set(names).size, names.length);
  });
});

describe("el bucle no se detiene al primer fallo (RF-3, RF-4)", () => {
  const variants = [{ name: "a" }, { name: "b" }, { name: "c" }, { name: "d" }];
  const ok = { buildOk: true, distOk: true, seconds: 1, output: "" };

  test("ejecuta todas las variantes aunque una falle y devuelve el resultado de cada una", async () => {
    const { runVariants } = await import("./ci-verify.mjs");
    const ran = [];
    const results = runVariants(variants, (v) => {
      ran.push(v.name);
      return v.name === "b" ? { buildOk: false, distOk: false, seconds: 2, output: "error del build" } : ok;
    });
    assert.deepEqual(ran, ["a", "b", "c", "d"]);
    assert.equal(results.length, 4);
    assert.deepEqual(results.map((r) => r.name), ["a", "b", "c", "d"]);
    assert.deepEqual(results.map((r) => r.ok), [true, false, true, true]);
    assert.equal(results[1].output, "error del build");
  });

  test("falla check-dist con el build bien: la variante cuenta como fallida", async () => {
    const { runVariants } = await import("./ci-verify.mjs");
    const [r] = runVariants([{ name: "a" }], () => ({ buildOk: true, distOk: false, seconds: 1, output: "texto antiguo" }));
    assert.equal(r.ok, false);
    assert.equal(r.build, true);
    assert.equal(r.dist, false);
  });

  test("una excepción del ejecutor se cuenta como fallo y no corta el bucle", async () => {
    const { runVariants } = await import("./ci-verify.mjs");
    const results = runVariants(variants, (v) => {
      if (v.name === "a") throw new Error("no se pudo lanzar");
      return ok;
    });
    assert.equal(results.length, 4);
    assert.equal(results[0].ok, false);
    assert.match(results[0].output, /no se pudo lanzar/);
    assert.equal(results[3].ok, true);
  });
});

describe("el resumen (RF-2, RF-4)", () => {
  const pass = (name, seconds = 10) => ({ name, ok: true, build: true, dist: true, seconds, output: "" });
  const fail = (name) => ({ name, ok: false, build: false, dist: false, seconds: 5, output: "x" });

  test("lista cada variante, las versiones y el sistema, y no habla de fallos si todo pasa", async () => {
    const { formatSummary } = await import("./ci-verify.mjs");
    const text = formatSummary([pass("demo"), pass("max"), pass("min.en", 12.4)], ENV);
    for (const name of ["demo", "max", "min.en"]) assert.ok(text.includes(name), name);
    assert.ok(text.includes("v24.15.0"));
    assert.ok(text.includes("12.2.0"));
    assert.ok(text.includes("linux x64"));
    assert.ok(text.includes("12,4") || text.includes("12.4"));
    assert.doesNotMatch(text, /fall(ó|aron)/i);
  });

  test("nombra las variantes que fallaron y cuántas, y no las que pasaron", async () => {
    const { formatSummary } = await import("./ci-verify.mjs");
    const text = formatSummary([pass("demo"), fail("max.en"), pass("min"), fail("price.clp.es")], ENV);
    const line = text.split("\n").find((l) => /Fallaron/.test(l));
    assert.ok(line, "debe haber una línea «Fallaron …»");
    assert.ok(line.includes("max.en") && line.includes("price.clp.es"));
    assert.ok(!line.includes("demo") && !line.includes("min"));
    assert.match(line, /2 de 4/);
  });

  test("con un solo fallo usa el singular", async () => {
    const { formatSummary } = await import("./ci-verify.mjs");
    const text = formatSummary([pass("demo"), fail("max")], ENV);
    assert.match(text, /Falló/);
  });
});

// La carpeta de salida no puede estar dentro del repositorio: la revisión de tipos y Tailwind recorren todo el
// árbol y, con los builds copiados dentro, la revisión falla (ENOBUFS) a partir de la segunda variante.
describe("la carpeta de salida va fuera del repositorio", () => {
  test("isInsideRepo: la raíz y sus subcarpetas están dentro; hermanas, padre y carpeta temporal, fuera", async () => {
    const { isInsideRepo } = await import("./ci-verify.mjs");
    assert.equal(isInsideRepo(ROOT, ROOT), true);
    assert.equal(isInsideRepo(ROOT, join(ROOT, "salida")), true);
    assert.equal(isInsideRepo(ROOT, join(ROOT, "a", "b", "c")), true);
    assert.equal(isInsideRepo(ROOT, `${ROOT}-otro`), false);
    assert.equal(isInsideRepo(ROOT, dirname(ROOT)), false);
    assert.equal(isInsideRepo(ROOT, join(tmpdir(), "salida")), false);
  });

  test("con --out dentro del repositorio el script se niega con un mensaje en español, sin construir ni crear la carpeta", () => {
    const target = join(ROOT, "salida-prueba-ci-verify");
    try {
      const result = spawnSync(process.execPath, ["scripts/ci-verify.mjs", "--out", target], { cwd: ROOT, encoding: "utf8", timeout: 60000 });
      assert.equal(result.status, 2, `${result.stdout}${result.stderr}`);
      assert.match(result.stderr, /fuera del repositorio/);
      assert.doesNotMatch(result.stdout, /Variante/);
      assert.equal(existsSync(target), false);
    } finally {
      rmSync(target, { recursive: true, force: true });
    }
  });

  test("con --out sin valor el script se niega con un mensaje en español", () => {
    const result = spawnSync(process.execPath, ["scripts/ci-verify.mjs", "--out"], { cwd: ROOT, encoding: "utf8", timeout: 60000 });
    assert.equal(result.status, 2, `${result.stdout}${result.stderr}`);
    assert.match(result.stderr, /--out/);
    assert.doesNotMatch(result.stdout, /Variante/);
  });
});

// Arreglos menores de la revisión de código del script.
describe("endurecimiento del script", () => {
  test("isInsideRepo: una carpeta cuyo nombre empieza por «..» está dentro del repositorio", async () => {
    const { isInsideRepo } = await import("./ci-verify.mjs");
    assert.equal(isInsideRepo(ROOT, join(ROOT, "..cache")), true);
    assert.equal(isInsideRepo(ROOT, join(ROOT, "..", "fuera")), false);
  });

  test("copyBuild copia el build y devuelve ok", async () => {
    const { copyBuild } = await import("./ci-verify.mjs");
    const base = mkdtempSync(join(tmpdir(), "ci-verify-"));
    try {
      mkdirSync(join(base, "origen", "_astro"), { recursive: true });
      writeFileSync(join(base, "origen", "index.html"), "<p>hola</p>");
      writeFileSync(join(base, "origen", "_astro", "a.css"), "a{}");
      const result = copyBuild(join(base, "origen"), join(base, "salida", "dist-demo"));
      assert.deepEqual(result, { ok: true });
      assert.equal(readFileSync(join(base, "salida", "dist-demo", "index.html"), "utf8"), "<p>hola</p>");
      assert.equal(existsSync(join(base, "salida", "dist-demo", "_astro", "a.css")), true);
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });

  test("copyBuild sustituye un build viejo y, si falta el origen, devuelve ok false con el motivo sin lanzar", async () => {
    const { copyBuild } = await import("./ci-verify.mjs");
    const base = mkdtempSync(join(tmpdir(), "ci-verify-"));
    try {
      mkdirSync(join(base, "salida", "dist-demo"), { recursive: true });
      writeFileSync(join(base, "salida", "dist-demo", "viejo.txt"), "de una ejecución anterior");
      const result = copyBuild(join(base, "no-existe"), join(base, "salida", "dist-demo"));
      assert.equal(result.ok, false);
      assert.match(result.message, /no-existe|ENOENT/);
      assert.equal(existsSync(join(base, "salida", "dist-demo", "viejo.txt")), false, "no debe quedar el build viejo");
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });

  test("clearBuild borra solo el dist-<nombre> indicado", async () => {
    const { clearBuild } = await import("./ci-verify.mjs");
    const base = mkdtempSync(join(tmpdir(), "ci-verify-"));
    try {
      mkdirSync(join(base, "dist-demo"), { recursive: true });
      mkdirSync(join(base, "dist-max"), { recursive: true });
      writeFileSync(join(base, "dist-demo", "viejo.txt"), "x");
      clearBuild(base, "demo");
      assert.equal(existsSync(join(base, "dist-demo")), false);
      assert.equal(existsSync(join(base, "dist-max")), true);
      clearBuild(base, "no-existe");
      clearBuild(null, "demo");
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });

  test("un argumento desconocido (por ejemplo --out=carpeta) se rechaza con código 2 sin construir", () => {
    for (const arg of ["--out=algo", "--otra-cosa"]) {
      const result = spawnSync(process.execPath, ["scripts/ci-verify.mjs", arg], { cwd: ROOT, encoding: "utf8", timeout: 60000 });
      assert.equal(result.status, 2, `${arg}: ${result.stdout}${result.stderr}`);
      assert.match(result.stderr, /no reconocido/);
      assert.doesNotMatch(result.stdout, /Variante/);
    }
  });
});

// RF-4 y spec 010: el resumen de cada trabajo nombra los pasos que fallaron y la versión de Node, y nunca
// afirma que todo pasa sin base.
describe("el resumen por pasos (RF-4, spec 010)", () => {
  const ok = { outcome: "success" };
  const skipped = { outcome: "skipped" };
  const failure = { outcome: "failure" };
  const KNOWN_IDS = ["checkout", "setup-node", "versions", "install", "contract-tests", "comparator-tests", "type-tests", "builds", "upload"];
  const KNOWN_NAMES = [
    "Descargar el código",
    "Instalar Node",
    "Versiones usadas",
    "Instalar dependencias",
    "Tests de contrato",
    "Tests del comparador de builds",
    "Tests de tipos",
    "Construir las 16 variantes",
    "Guardar los builds",
  ];
  const allOk = () => Object.fromEntries(KNOWN_IDS.map((id) => [id, ok]));
  const lineMatching = (text, pattern) => text.split("\n").find((line) => pattern.test(line));

  test("lista los nueve pasos con su nombre y la versión de Node, y no habla de fallos si todo pasa", async () => {
    const { formatStepSummary } = await import("./ci-verify.mjs");
    const text = formatStepSummary(allOk(), "22.23.4");
    for (const name of KNOWN_NAMES) assert.ok(text.includes(name), name);
    assert.ok(text.includes("22.23.4"));
    assert.match(text, /Todos los pasos pasan/);
    assert.doesNotMatch(text, /fall(ó|aron)/i);
  });

  test("con un paso conocido fallido lo nombra junto a la versión de Node y no nombra los que pasaron", async () => {
    const { formatStepSummary } = await import("./ci-verify.mjs");
    const text = formatStepSummary({ ...allOk(), "contract-tests": failure }, "24");
    const line = lineMatching(text, /^Falló el paso/);
    assert.ok(line, "debe haber una línea «Falló el paso …»");
    assert.ok(line.includes("Tests de contrato") && line.includes("24"));
    assert.ok(!line.includes("Tests de tipos") && !line.includes("Instalar"));
    assert.doesNotMatch(text, /Todos los pasos pasan/);
  });

  test("con varios pasos fallidos usa el plural y los nombra a todos", async () => {
    const { formatStepSummary } = await import("./ci-verify.mjs");
    const text = formatStepSummary({ ...allOk(), "contract-tests": failure, "type-tests": failure }, "22.23.4");
    const line = lineMatching(text, /^Fallaron los pasos/);
    assert.ok(line && line.includes("Tests de contrato") && line.includes("Tests de tipos"));
  });

  test("si un paso previo falla y los siguientes se omiten, nombra el fallido y los omitidos no cuentan como fallo", async () => {
    const { formatStepSummary } = await import("./ci-verify.mjs");
    const text = formatStepSummary({ checkout: failure, "setup-node": skipped, versions: skipped, install: skipped }, "24");
    const line = lineMatching(text, /^Falló el paso/);
    assert.ok(line && line.includes("Descargar el código"));
    assert.ok(!line.includes("Instalar Node"));
    assert.ok(text.includes("omitido"));
  });

  test("los conocidos van en el orden de la tabla aunque lleguen desordenados y los desconocidos al final, con su id entre comillas invertidas", async () => {
    const { formatStepSummary } = await import("./ci-verify.mjs");
    const text = formatStepSummary({ upload: ok, "extra-uno": ok, install: ok, "extra-dos": ok }, "24");
    const at = (needle) => text.indexOf(needle);
    assert.ok(at("Instalar dependencias") > 0 && at("Instalar dependencias") < at("Guardar los builds"));
    assert.ok(at("Guardar los builds") < at("`extra-uno`") && at("`extra-uno`") < at("`extra-dos`"));
  });

  test("un paso desconocido que pasa se muestra con su id y no cambia el veredicto", async () => {
    const { formatStepSummary } = await import("./ci-verify.mjs");
    const text = formatStepSummary({ install: ok, "paso-nuevo": ok }, "24");
    assert.ok(text.includes("`paso-nuevo`"));
    assert.match(text, /Todos los pasos pasan/);
  });

  test("un paso desconocido que falla se nombra por su id, en singular y en plural", async () => {
    const { formatStepSummary } = await import("./ci-verify.mjs");
    const one = formatStepSummary({ install: ok, "paso-nuevo": failure }, "24");
    assert.ok(lineMatching(one, /^Falló el paso/)?.includes("`paso-nuevo`"));
    const two = formatStepSummary({ install: ok, "paso-a": failure, "paso-b": failure }, "24");
    const line = lineMatching(two, /^Fallaron los pasos/);
    assert.ok(line && line.includes("`paso-a`") && line.includes("`paso-b`"));
  });

  test("sin ningún paso conocido (vacío o solo desconocidos bien formados) lanza un error que lo explica", async () => {
    const { formatStepSummary } = await import("./ci-verify.mjs");
    for (const data of [{}, { otro: ok }, { "paso-a": failure }]) {
      assert.throws(() => formatStepSummary(data, "24"), /ningún paso conocido/, JSON.stringify(data));
    }
  });

  // Spec 011 (RF-1 a RF-5): los datos que no tienen la forma de toJSON(steps) se rechazan con un mensaje de forma,
  // distinto del de «ningún paso conocido», que sugiere renombrar ids.
  const SHAPE = /no tienen la forma esperada/;

  test("un conjunto que no es un objeto se rechaza con la forma esperada y el tipo recibido, sin copiar su contenido", async () => {
    const { formatStepSummary } = await import("./ci-verify.mjs");
    const cases = [
      [[], /un array/],
      [[{ outcome: "success" }], /un array/],
      [null, /null/],
      ["secreto-largo-no-copiar", /un texto/],
      [42, /un número/],
      [true, /un booleano/],
      [false, /un booleano/],
      [undefined, /ningún valor/],
    ];
    for (const [data, type] of cases) {
      assert.throws(() => formatStepSummary(data, "24"), (error) => SHAPE.test(error.message) && type.test(error.message) && !/ningún paso conocido/.test(error.message) && !error.message.includes("secreto-largo-no-copiar"), JSON.stringify(data));
    }
  });

  test("un paso que no es un objeto se rechaza, sea conocido o desconocido, con su id entre comillas invertidas y su tipo", async () => {
    const { formatStepSummary } = await import("./ci-verify.mjs");
    const cases = [
      ["success", /un texto/],
      [3, /un número/],
      [true, /un booleano/],
      [null, /null/],
      [[], /un array/],
      [[{ outcome: "success" }], /un array/],
    ];
    for (const [value, type] of cases) {
      for (const id of ["install", "paso-nuevo"]) {
        assert.throws(
          () => formatStepSummary({ builds: ok, [id]: value }, "24"),
          (error) => SHAPE.test(error.message) && error.message.includes(`\`${id}\``) && type.test(error.message),
          `${id}: ${JSON.stringify(value)}`,
        );
      }
    }
  });

  test("varios pasos mal formados se informan todos en un solo mensaje, y no se lista ninguno bien formado", async () => {
    const { formatStepSummary } = await import("./ci-verify.mjs");
    let message = "";
    try {
      formatStepSummary({ install: "success", builds: ok, "paso-nuevo": null, upload: 5 }, "24");
    } catch (error) {
      message = error.message;
    }
    assert.match(message, SHAPE);
    for (const id of ["install", "paso-nuevo", "upload"]) assert.ok(message.includes(`\`${id}\``), id);
    assert.ok(!message.includes("`builds`"));
  });

  test("un id raro como __proto__ mal formado se lista tal cual y no contamina nada", async () => {
    const { formatStepSummary } = await import("./ci-verify.mjs");
    const data = JSON.parse('{"install":{"outcome":"success"},"__proto__":"x"}');
    assert.throws(() => formatStepSummary(data, "24"), (error) => SHAPE.test(error.message) && error.message.includes("`__proto__`"));
    assert.equal({}.outcome, undefined);
  });

  test("la forma se comprueba antes que «ningún paso conocido» y que «todos omitidos»", async () => {
    const { formatStepSummary } = await import("./ci-verify.mjs");
    assert.throws(() => formatStepSummary({ extra: "x" }, "24"), SHAPE);
    assert.throws(() => formatStepSummary([], "24"), SHAPE);
    assert.throws(() => formatStepSummary({ install: "x", builds: { outcome: "skipped" } }, "24"), SHAPE);
    assert.throws(() => formatStepSummary({}, "24"), /ningún paso conocido/);
    assert.throws(() => formatStepSummary({ install: skipped }, "24"), /ningún paso conocido se ejecutó/);
  });

  test("un paso que es un objeto vacío está bien formado: se muestra como no reconocido y no lanza", async () => {
    const { formatStepSummary } = await import("./ci-verify.mjs");
    const text = formatStepSummary({ install: ok, builds: {} }, "24");
    assert.ok(text.includes("| Construir las 16 variantes | desconocido |"));
    assert.match(text, /Resultado no reconocido en el paso con Node 24: Construir las 16 variantes\./);
  });

  test("los datos bien formados dan el mismo resumen que antes", async () => {
    const { formatStepSummary } = await import("./ci-verify.mjs");
    const text = formatStepSummary({ install: ok, "type-tests": failure, extra: ok }, "22.23.4");
    assert.equal(
      text,
      [
        "## Resultado de los pasos (Node 22.23.4)",
        "",
        "| Paso | Resultado |",
        "|---|---|",
        "| Instalar dependencias | ✅ correcto |",
        "| Tests de tipos | ❌ falló |",
        "| `extra` | ✅ correcto |",
        "",
        "Falló el paso con Node 22.23.4: Tests de tipos.",
      ].join("\n"),
    );
  });

  test("con todos los pasos conocidos omitidos y sin problemas lanza un error, aunque un desconocido pase", async () => {
    const { formatStepSummary } = await import("./ci-verify.mjs");
    assert.throws(() => formatStepSummary({ install: skipped }, "24"), /ningún paso conocido se ejecutó/);
    assert.throws(() => formatStepSummary({ install: skipped, builds: skipped, extra: ok }, "24"), /ningún paso conocido se ejecutó/);
  });

  test("con todos los conocidos omitidos y un desconocido que falla no lanza y nombra el fallo", async () => {
    const { formatStepSummary } = await import("./ci-verify.mjs");
    const text = formatStepSummary({ install: skipped, extra: failure }, "24");
    assert.ok(lineMatching(text, /^Falló el paso/)?.includes("`extra`"));
    assert.doesNotMatch(text, /Todos los pasos pasan/);
  });

  test("cancelados, con resultado no reconocido o con outcome ausente se nombran y no dan «todos pasan»", async () => {
    const { formatStepSummary } = await import("./ci-verify.mjs");
    const cancelled = formatStepSummary({ install: ok, "type-tests": { outcome: "cancelled" } }, "24");
    assert.ok(lineMatching(cancelled, /^Quedó cancelado el paso/)?.includes("Tests de tipos"));
    assert.doesNotMatch(cancelled, /Todos los pasos pasan/);
    const weird = formatStepSummary({ install: ok, builds: { outcome: "rara" } }, "24");
    assert.ok(lineMatching(weird, /^Resultado no reconocido en el paso/)?.includes("Construir las 16 variantes"));
    assert.doesNotMatch(weird, /Todos los pasos pasan/);
    const absent = formatStepSummary({ install: ok, upload: {} }, "24");
    assert.ok(lineMatching(absent, /^Resultado no reconocido en el paso/)?.includes("Guardar los builds"));
    const plural = formatStepSummary({ install: ok, "type-tests": { outcome: "cancelled" }, builds: { outcome: "cancelled" } }, "24");
    assert.match(plural, /Quedaron cancelados los pasos/);
  });

  test("con varios tipos de problema escribe una línea por tipo, en el orden fallaron, cancelados, no reconocidos", async () => {
    const { formatStepSummary } = await import("./ci-verify.mjs");
    const text = formatStepSummary({ install: ok, "contract-tests": failure, "type-tests": { outcome: "cancelled" }, builds: { outcome: "rara" } }, "24");
    const lines = text.split("\n");
    const failed = lines.findIndex((l) => /^Falló el paso/.test(l));
    const cancelled = lines.findIndex((l) => /^Quedó cancelado el paso/.test(l));
    const unknown = lines.findIndex((l) => /^Resultado no reconocido en el paso/.test(l));
    assert.ok(failed >= 0 && failed < cancelled && cancelled < unknown, `${failed} ${cancelled} ${unknown}`);
  });

  test("«Todos los pasos pasan» sale con un éxito conocido y pasos omitidos, y no sin éxito conocido", async () => {
    const { formatStepSummary } = await import("./ci-verify.mjs");
    assert.match(formatStepSummary({ install: ok, builds: skipped }, "24"), /Todos los pasos pasan/);
    assert.throws(() => formatStepSummary({ builds: skipped }, "24"), /ningún paso conocido se ejecutó/);
  });
});

// Spec 011 (RF-6, RF-7): la versión de Node del título nunca queda en blanco ni con espacios sobrantes.
describe("la versión de Node del resumen (spec 011)", () => {
  const PROCESS = "v99.1.2";

  test("ausente, vacía o solo con espacios en blanco usa la versión del proceso e indica que falta NODE_VERSION", async () => {
    const { resolveNodeVersion } = await import("./ci-verify.mjs");
    for (const raw of [undefined, null, "", "   ", "\t\n", " ", "  \n\t "]) {
      const value = resolveNodeVersion(raw, PROCESS);
      assert.ok(value.startsWith(PROCESS), JSON.stringify(raw));
      assert.match(value, /la del proceso: falta NODE_VERSION/, JSON.stringify(raw));
    }
  });

  test("con valor lo usa sin los espacios en blanco de los lados y sin mencionar que falte", async () => {
    const { resolveNodeVersion } = await import("./ci-verify.mjs");
    assert.equal(resolveNodeVersion("24", PROCESS), "24");
    assert.equal(resolveNodeVersion(" 24 ", PROCESS), "24");
    assert.equal(resolveNodeVersion("\n22.23.4\n", PROCESS), "22.23.4");
    assert.equal(resolveNodeVersion(" 24 ", PROCESS), "24");
  });

  test("no valida el contenido: un valor sin sentido se usa tal cual", async () => {
    const { resolveNodeVersion } = await import("./ci-verify.mjs");
    assert.equal(resolveNodeVersion("abc", PROCESS), "abc");
  });

  test("sin segundo argumento usa la versión del proceso que lo ejecuta", async () => {
    const { resolveNodeVersion } = await import("./ci-verify.mjs");
    assert.ok(resolveNodeVersion("  ").startsWith(process.version));
  });
});

// Spec 010: el arranque del modo `--resumen-pasos` (lanza el script de verdad, sin construir ninguna variante).
describe("el arranque del resumen por pasos (spec 010)", () => {
  const ok = { outcome: "success" };
  const steps = (value) => JSON.stringify(value);

  // Entorno limpio: sin las variables del resumen heredadas de quien ejecute los tests (por ejemplo, el CI).
  const run = (args, env = {}) => {
    const clean = { ...process.env };
    for (const key of ["STEPS_JSON", "NODE_VERSION", "GITHUB_STEP_SUMMARY"]) delete clean[key];
    const result = spawnSync(process.execPath, ["scripts/ci-verify.mjs", ...args], {
      cwd: ROOT,
      encoding: "utf8",
      env: { ...clean, ...env },
      timeout: 60000,
    });
    return { status: result.status, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
  };

  test("con --resumen-pasos y --out juntos, en cualquier orden, se rechaza con código 2 sin resumir ni construir", () => {
    const out = join(tmpdir(), "ci-verify-no-debe-existir");
    const env = { STEPS_JSON: steps({ install: ok }), NODE_VERSION: "24" };
    for (const args of [["--resumen-pasos", "--out", out], ["--out", out, "--resumen-pasos"], ["--out", "--resumen-pasos"]]) {
      const result = run(args, env);
      assert.equal(result.status, 2, `${args.join(" ")}: ${result.stdout}${result.stderr}`);
      assert.match(result.stderr, /no se combinan/);
      assert.doesNotMatch(result.stdout, /Resultado de los pasos|Variante/);
    }
    assert.equal(existsSync(out), false);
  });

  test("si además hay argumentos desconocidos, el mismo mensaje los lista todos", () => {
    const result = run(["--resumen-pasos", "--out", join(tmpdir(), "x"), "--otra", "--mas"], { STEPS_JSON: steps({ install: ok }) });
    assert.equal(result.status, 2);
    assert.match(result.stderr, /no se combinan/);
    assert.match(result.stderr, /no reconocido/);
    assert.ok(result.stderr.includes("--otra") && result.stderr.includes("--mas"));
  });

  test("con un paso fallido el resumen se escribe y termina con código 0", () => {
    const result = run(["--resumen-pasos"], { STEPS_JSON: steps({ install: ok, builds: { outcome: "failure" } }), NODE_VERSION: "24" });
    assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
    assert.match(result.stdout, /Falló el paso con Node 24: Construir las 16 variantes/);
  });

  test("sin ningún paso conocido termina con código 2 y el mensaje, sin tabla ni veredicto", () => {
    const result = run(["--resumen-pasos"], { STEPS_JSON: steps({}), NODE_VERSION: "24" });
    assert.equal(result.status, 2, `${result.stdout}${result.stderr}`);
    assert.match(result.stderr, /ningún paso conocido/);
    assert.doesNotMatch(result.stdout, /Todos los pasos pasan|Resultado de los pasos/);
  });

  test("con todos los pasos conocidos omitidos termina con código 2", () => {
    const result = run(["--resumen-pasos"], { STEPS_JSON: steps({ install: { outcome: "skipped" } }), NODE_VERSION: "24" });
    assert.equal(result.status, 2);
    assert.match(result.stderr, /ningún paso conocido se ejecutó/);
  });

  test("sin NODE_VERSION usa la versión del proceso, lo indica en el título y termina con código 0", () => {
    const result = run(["--resumen-pasos"], { STEPS_JSON: steps({ install: ok }) });
    assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
    assert.ok(result.stdout.includes(process.version));
    assert.match(result.stdout, /falta NODE_VERSION/);
  });

  test("con NODE_VERSION no menciona que falte", () => {
    const result = run(["--resumen-pasos"], { STEPS_JSON: steps({ install: ok }), NODE_VERSION: "22.23.4" });
    assert.equal(result.status, 0);
    assert.ok(result.stdout.includes("22.23.4"));
    assert.doesNotMatch(result.stdout, /falta NODE_VERSION/);
  });

  test("escribe el resumen en GITHUB_STEP_SUMMARY si existe, y no escribe nada si hay un error", () => {
    const base = mkdtempSync(join(tmpdir(), "ci-verify-"));
    try {
      const good = join(base, "bueno.md");
      assert.equal(run(["--resumen-pasos"], { STEPS_JSON: steps({ install: ok }), NODE_VERSION: "24", GITHUB_STEP_SUMMARY: good }).status, 0);
      assert.match(readFileSync(good, "utf8"), /Resultado de los pasos/);
      const bad = join(base, "malo.md");
      assert.equal(run(["--resumen-pasos"], { STEPS_JSON: steps({}), NODE_VERSION: "24", GITHUB_STEP_SUMMARY: bad }).status, 2);
      assert.equal(existsSync(bad), false);
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });

  // Spec 011 (RF-1, RF-2, RF-6, RF-7, RF-8): datos mal formados y versión de Node en blanco, con el script de verdad.
  test("un conjunto que no es un objeto termina con código 2, la forma esperada en stderr y nada en stdout", () => {
    for (const json of ["[]", "null", '"x"', "3", "true"]) {
      const result = run(["--resumen-pasos"], { STEPS_JSON: json, NODE_VERSION: "24" });
      assert.equal(result.status, 2, `${json}: ${result.stdout}${result.stderr}`);
      assert.match(result.stderr, /no tienen la forma esperada/, json);
      assert.doesNotMatch(result.stderr, /ningún paso conocido/, json);
      assert.doesNotMatch(result.stdout, /Todos los pasos pasan|Resultado de los pasos|\| Paso \|/, json);
    }
  });

  test("un paso que no es un objeto termina con código 2 y lo nombra con su id", () => {
    const result = run(["--resumen-pasos"], { STEPS_JSON: steps({ install: "success", builds: ok }), NODE_VERSION: "24" });
    assert.equal(result.status, 2, `${result.stdout}${result.stderr}`);
    assert.match(result.stderr, /no tienen la forma esperada/);
    assert.ok(result.stderr.includes("`install`") && !result.stderr.includes("`builds`"));
    assert.doesNotMatch(result.stdout, /Resultado de los pasos/);
  });

  test("con datos mal formados no se escribe nada en el resumen del trabajo", () => {
    const base = mkdtempSync(join(tmpdir(), "ci-verify-"));
    try {
      const target = join(base, "resumen.md");
      assert.equal(run(["--resumen-pasos"], { STEPS_JSON: "[]", NODE_VERSION: "24", GITHUB_STEP_SUMMARY: target }).status, 2);
      assert.equal(run(["--resumen-pasos"], { STEPS_JSON: steps({ install: "success" }), NODE_VERSION: "24", GITHUB_STEP_SUMMARY: target }).status, 2);
      assert.equal(existsSync(target), false);
    } finally {
      rmSync(base, { recursive: true, force: true });
    }
  });

  test("con NODE_VERSION en blanco usa la versión del proceso con la indicación y termina con código 0", () => {
    for (const blank of ["", "  ", "\t\n"]) {
      const result = run(["--resumen-pasos"], { STEPS_JSON: steps({ install: ok }), NODE_VERSION: blank });
      assert.equal(result.status, 0, `${JSON.stringify(blank)}: ${result.stdout}${result.stderr}`);
      assert.ok(result.stdout.includes(`## Resultado de los pasos (Node ${process.version}`), JSON.stringify(blank));
      assert.match(result.stdout, /falta NODE_VERSION/);
    }
  });

  test("con NODE_VERSION con espacios a los lados el título y la línea final no los llevan", () => {
    const result = run(["--resumen-pasos"], { STEPS_JSON: steps({ install: ok, builds: { outcome: "failure" } }), NODE_VERSION: " 24 " });
    assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
    assert.ok(result.stdout.includes("## Resultado de los pasos (Node 24)"));
    assert.ok(result.stdout.includes("Falló el paso con Node 24: Construir las 16 variantes."));
    assert.doesNotMatch(result.stdout, /falta NODE_VERSION/);
  });

  test("sin STEPS_JSON o con un JSON no válido sigue siendo un error con código 2", () => {
    assert.equal(run(["--resumen-pasos"], { NODE_VERSION: "24" }).status, 2);
    assert.equal(run(["--resumen-pasos"], { STEPS_JSON: "no es json", NODE_VERSION: "24" }).status, 2);
  });
});

// Spec 010 (RF-9 a RF-11): el repositorio vigila que todos los pasos del workflow tengan `id` y estén en la tabla de
// nombres del resumen. Análisis de texto, sin parser de YAML: un paso empieza en cualquier elemento de lista
// («- name:», «- uses:», «- run:»…) y sus propiedades van más a la derecha. El paso que ejecuta `--resumen-pasos`
// es el único que no lleva `id`.
const unquote = (value) => value.replace(/\s+#.*$/, "").trim().replace(/^(["'])(.*)\1$/, "$2");
function parseWorkflowSteps(text) {
  const steps = [];
  let current = null;
  const take = (step, key, value) => {
    if (key === "name") step.name = unquote(value);
    else if (key === "id") step.id = unquote(value);
    step.body += `${key}: ${value}\n`;
  };
  for (const line of text.replace(/\r/g, "").split("\n")) {
    const start = line.match(/^(\s*)- ([\w-]+):\s*(.*?)\s*$/);
    if (start) {
      current = { name: "", id: null, body: "", indent: start[1].length };
      steps.push(current);
      take(current, start[2], start[3]);
      continue;
    }
    if (!current || line.trim() === "" || line.trim().startsWith("#")) continue;
    const indent = line.length - line.trimStart().length;
    if (indent <= current.indent) {
      current = null;
      continue;
    }
    const prop = line.match(/^\s*([\w-]+):\s*(.*?)\s*$/);
    if (prop && indent === current.indent + 2) take(current, prop[1], prop[2]);
    else current.body += `${line}\n`;
  }
  return steps;
}

function checkWorkflowSteps(text, table) {
  const problems = [];
  const steps = parseWorkflowSteps(text);
  const summary = steps.find((step) => /^run: .*ci-verify\.mjs\s+--resumen-pasos\s*$/m.test(step.body));
  if (!summary) problems.push("falta el paso que ejecuta --resumen-pasos");
  else if (summary.id) problems.push(`el paso del resumen «${summary.name}» no debe tener id (${summary.id})`);
  const others = steps.filter((step) => step !== summary);
  for (const step of others) if (!step.id) problems.push(`el paso «${step.name}» no tiene id`);
  const ids = others.filter((step) => step.id).map((step) => step.id);
  for (const id of new Set(ids.filter((value, index) => ids.indexOf(value) !== index))) problems.push(`el id ${id} está repetido`);
  const tableIds = table.map(([id]) => id);
  for (const id of ids.filter((value) => !tableIds.includes(value))) problems.push(`el id ${id} no está en la tabla de nombres`);
  for (const id of tableIds.filter((value) => !ids.includes(value))) problems.push(`la tabla tiene el id ${id}, que no existe en el workflow`);
  const common = ids.filter((value) => tableIds.includes(value));
  if (JSON.stringify(common) !== JSON.stringify(tableIds.filter((value) => ids.includes(value)))) {
    problems.push(`el orden de los id del workflow (${common.join(", ")}) no coincide con el de la tabla`);
  }
  for (const [id, name] of table) {
    const step = others.find((candidate) => candidate.id === id);
    if (step && step.name !== name) problems.push(`el paso con id ${id} se llama «${step.name}» y la tabla dice «${name}»`);
  }
  return problems;
}

describe("el vigilante del workflow (spec 010)", () => {
  const TABLE = [["uno", "Paso uno"], ["dos", "Paso dos"]];
  const SUMMARY = { name: "Resumen", run: "node scripts/ci-verify.mjs --resumen-pasos" };
  const workflow = (steps) =>
    [
      "jobs:",
      "  verificar:",
      "    steps:",
      ...steps.flatMap((step) => [
        ...(step.comment ? [`      # ${step.comment}`] : []),
        `      - name: ${step.name}`,
        ...(step.id ? [`        id: ${step.id}`] : []),
        `        run: ${step.run ?? "echo hola"}`,
        "",
      ]),
    ].join("\n");
  const good = [{ name: "Paso uno", id: "uno" }, { name: "Paso dos", id: "dos" }, SUMMARY];

  test("el workflow real cumple las reglas: todos los pasos con id (salvo el resumen), en la tabla, en orden y con el mismo nombre", async () => {
    const { STEP_NAMES } = await import("./ci-verify.mjs");
    const text = readFileSync(join(ROOT, ".github", "workflows", "verificacion.yml"), "utf8");
    assert.deepEqual(checkWorkflowSteps(text, Object.entries(STEP_NAMES)), []);
    assert.equal(Object.keys(STEP_NAMES).length, 9);
  });

  test("un workflow que cumple todo no da problemas, con saltos LF o CRLF y con comentarios entre pasos", () => {
    assert.deepEqual(checkWorkflowSteps(workflow(good), TABLE), []);
    assert.deepEqual(checkWorkflowSteps(workflow(good).replace(/\n/g, "\r\n"), TABLE), []);
    const withComment = [{ ...good[0], comment: "una nota" }, good[1], good[2]];
    assert.deepEqual(checkWorkflowSteps(workflow(withComment), TABLE), []);
  });

  test("detecta un paso sin id", () => {
    const problems = checkWorkflowSteps(workflow([{ name: "Paso uno", id: "uno" }, { name: "Paso dos" }, SUMMARY]), TABLE);
    assert.ok(problems.some((p) => /«Paso dos» no tiene id/.test(p)), problems.join(" | "));
  });

  test("detecta un id repetido", () => {
    const problems = checkWorkflowSteps(workflow([{ name: "Paso uno", id: "uno" }, { name: "Paso dos", id: "uno" }, SUMMARY]), TABLE);
    assert.ok(problems.some((p) => /id uno está repetido/.test(p)), problems.join(" | "));
  });

  test("detecta un id que no está en la tabla", () => {
    const problems = checkWorkflowSteps(workflow([...good.slice(0, 2), { name: "Paso tres", id: "tres" }, SUMMARY]), TABLE);
    assert.ok(problems.some((p) => /id tres no está en la tabla/.test(p)), problems.join(" | "));
  });

  test("detecta un id de la tabla que no existe en el workflow", () => {
    const problems = checkWorkflowSteps(workflow([good[0], SUMMARY]), TABLE);
    assert.ok(problems.some((p) => /tabla tiene el id dos/.test(p)), problems.join(" | "));
  });

  test("detecta un orden distinto", () => {
    const problems = checkWorkflowSteps(workflow([good[1], good[0], SUMMARY]), TABLE);
    assert.ok(problems.some((p) => /orden/.test(p)), problems.join(" | "));
  });

  test("detecta un nombre distinto entre el workflow y la tabla", () => {
    const problems = checkWorkflowSteps(workflow([{ name: "Otro nombre", id: "uno" }, good[1], SUMMARY]), TABLE);
    assert.ok(problems.some((p) => /id uno se llama «Otro nombre»/.test(p)), problems.join(" | "));
  });

  test("ve los pasos que empiezan por uses o run, con nombre entre comillas e id con comentario", () => {
    const text = [
      "steps:",
      "  - uses: foo/bar@1",
      '    name: "Paso uno"',
      "    id: uno # comentario",
      "  - run: echo hola",
      "    name: Paso dos",
      "  - name: Resumen",
      "    run: node scripts/ci-verify.mjs --resumen-pasos",
    ].join("\n");
    const problems = checkWorkflowSteps(text, [["uno", "Paso uno"], ["dos", "Paso dos"]]);
    assert.ok(problems.includes("el paso «Paso dos» no tiene id"), problems.join(" | "));
    assert.ok(!problems.some((p) => /se llama|«Paso uno»/.test(p)), problems.join(" | "));
  });

  test("detecta un id en el paso del resumen y no lo confunde con otro paso que nombre la opción", () => {
    const withId = workflow([good[0], good[1], { ...SUMMARY, id: "resumen" }]);
    assert.ok(checkWorkflowSteps(withId, TABLE).some((p) => /no debe tener id/.test(p)));
    const mention = workflow([{ name: "Paso uno", id: "uno", run: "echo ver --resumen-pasos" }, good[1], SUMMARY]);
    assert.deepEqual(checkWorkflowSteps(mention, TABLE), []);
  });

  test("un resultado que coincide con una propiedad de Object o lleva «|» se muestra como texto", async () => {
    const { formatStepSummary } = await import("./ci-verify.mjs");
    const text = formatStepSummary({ install: { outcome: "success" }, x: { outcome: "constructor" }, y: { outcome: "a|b" }, z: { outcome: { raro: 1 } } }, "24");
    assert.ok(text.includes("| `x` | constructor |"));
    assert.ok(text.includes("| `y` | a\\|b |"));
    assert.ok(text.includes("| `z` | desconocido |"));
    assert.doesNotMatch(text, /native code|\[object Object\]/);
  });

  test("detecta que falta el paso del resumen", () => {
    const problems = checkWorkflowSteps(workflow(good.slice(0, 2)), TABLE);
    assert.ok(problems.some((p) => /falta el paso que ejecuta --resumen-pasos/.test(p)), problems.join(" | "));
  });
});
