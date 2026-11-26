// Tests del comparador de builds (spec 002, RF-7).
// Ejecutar: node --test scripts/compare-builds.test.mjs
import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SCRIPT = join(ROOT, "scripts", "compare-builds.mjs");
const TMP = mkdtempSync(join(tmpdir(), "compare-builds-"));
after(() => rmSync(TMP, { recursive: true, force: true }));

let counter = 0;
// Crea una carpeta de build con un index.html y devuelve su ruta.
function build(body, { generator = "Astro v6.4.8", css = "AAAA1111", script = "const a=1;" } = {}) {
  const dir = join(TMP, `b${++counter}`);
  mkdirSync(dir, { recursive: true });
  const html =
    `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">` +
    `<meta name="generator" content="${generator}">` +
    `<link rel="stylesheet" href="/_astro/index.${css}.css"></head>` +
    `<body>${body}<script type="module">${script}</script></body></html>`;
  writeFileSync(join(dir, "index.html"), html);
  return dir;
}

const run = (a, b, extra = []) =>
  spawnSync(process.execPath, [SCRIPT, a, b, ...extra], { cwd: ROOT, encoding: "utf8" });

const BASE = `<header><nav><a href="#a">Inicio</a> <a href="#b">Nosotros</a></nav></header><main><p>Hola <b>mundo</b> feliz</p><div>uno</div> <div>dos</div></main>`;

describe("sin diferencias relevantes → salida 0", () => {
  it("dos builds idénticos", () => {
    const r = run(build(BASE), build(BASE));
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /sin diferencias/i);
  });
  it("ignora la etiqueta del generador", () => {
    const r = run(build(BASE, { generator: "Astro v6.4.8" }), build(BASE, { generator: "Astro v7.4.12" }));
    assert.equal(r.status, 0, r.stdout);
  });
  it("ignora los nombres de archivo con huella", () => {
    const r = run(build(BASE, { css: "AAAA1111" }), build(BASE, { css: "BBBB2222" }));
    assert.equal(r.status, 0, r.stdout);
  });
  it("ignora el contenido de los scripts (minificado distinto)", () => {
    const r = run(build(BASE, { script: 'const t=document.getElementById("x");' }), build(BASE, { script: "var e=document.getElementById(`x`);" }));
    assert.equal(r.status, 0, r.stdout);
  });
  it("ignora la repetición de espacios y los saltos de línea entre etiquetas", () => {
    const spaced = BASE.replace("<p>Hola <b>mundo</b> feliz</p>", "<p>Hola   <b>mundo</b>\n feliz</p>");
    const r = run(build(BASE), build(spaced));
    assert.equal(r.status, 0, r.stdout);
  });
});

describe("cambios de contenido → salida 1", () => {
  it("detecta un cambio de texto y muestra los dos valores", () => {
    const r = run(build(BASE), build(BASE.replace("Inicio", "Principio")));
    assert.equal(r.status, 1);
    assert.match(r.stdout, /contenido/i);
    assert.match(r.stdout, /Inicio/);
    assert.match(r.stdout, /Principio/);
  });
  it("detecta un cambio de atributo", () => {
    const r = run(build(BASE), build(BASE.replace('href="#a"', 'href="#z"')));
    assert.equal(r.status, 1);
    assert.match(r.stdout, /#z/);
  });
  it("detecta un cambio de etiqueta", () => {
    const r = run(build(BASE), build(BASE.replace("<main>", "<section>").replace("</main>", "</section>")));
    assert.equal(r.status, 1);
    assert.match(r.stdout, /section/);
  });
  it("detecta un elemento de más o de menos", () => {
    const r = run(build(BASE), build(BASE.replace("<div>dos</div>", "<div>dos</div><div>tres</div>")));
    assert.equal(r.status, 1);
  });
});

describe("espacios perdidos: se clasifican", () => {
  it("espacio perdido entre etiquetas de bloque → informativo, salida 0", () => {
    const r = run(build(BASE), build(BASE.replace("</div> <div>", "</div><div>")));
    assert.equal(r.status, 0, r.stdout);
    assert.match(r.stdout, /entre etiquetas: 1/i);
  });
  it("espacio perdido entre texto y un elemento en línea → a revisar, salida 1", () => {
    const r = run(build(BASE), build(BASE.replace("Hola <b>", "Hola<b>")));
    assert.equal(r.status, 1);
    assert.match(r.stdout, /posible efecto visible/i);
    assert.match(r.stdout, /Hola/);
  });
  it("espacio perdido entre dos elementos en línea contiguos → a revisar, salida 1", () => {
    const r = run(build(BASE), build(BASE.replace("</a> <a", "</a><a")));
    assert.equal(r.status, 1);
    assert.match(r.stdout, /posible efecto visible/i);
  });
  it("espacio alrededor del texto dentro de un elemento (borde) → informativo", () => {
    const withEdges = BASE.replace('<a href="#a">Inicio</a>', '<a href="#a"> Inicio </a>');
    const r = run(build(withEdges), build(BASE));
    assert.equal(r.status, 0, r.stdout);
  });
});

describe("salida y errores", () => {
  it("--json entrega un informe estructurado", () => {
    const r = run(build(BASE), build(BASE.replace("Hola <b>", "Hola<b>")), ["--json"]);
    assert.equal(r.status, 1);
    const j = JSON.parse(r.stdout);
    assert.equal(typeof j.contentDiffs.length, "number");
    assert.equal(j.whitespace.risky.length, 1);
    assert.equal(typeof j.whitespace.betweenTags, "number");
  });
  it("carpeta inexistente → salida 2 con mensaje en español", () => {
    const r = run(build(BASE), join(TMP, "no-existe"));
    assert.equal(r.status, 2);
    assert.match(r.stderr, /No se pudo leer/);
  });
  it("sin argumentos → salida 2 con el uso", () => {
    const r = spawnSync(process.execPath, [SCRIPT], { cwd: ROOT, encoding: "utf8" });
    assert.equal(r.status, 2);
    assert.match(r.stderr, /Uso/);
  });
  it("no modifica las carpetas comparadas", () => {
    const a = build(BASE);
    const b = build(BASE.replace("Inicio", "Otro"));
    const before = [readFileSync(join(a, "index.html"), "utf8"), readFileSync(join(b, "index.html"), "utf8")];
    const mtimes = [statSync(join(a, "index.html")).mtimeMs, statSync(join(b, "index.html")).mtimeMs];
    run(a, b);
    assert.deepEqual([readFileSync(join(a, "index.html"), "utf8"), readFileSync(join(b, "index.html"), "utf8")], before);
    assert.deepEqual([statSync(join(a, "index.html")).mtimeMs, statSync(join(b, "index.html")).mtimeMs], mtimes);
  });
});
