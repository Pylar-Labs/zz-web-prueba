// Tests de la comparación de documentos generados sin depender de los fines de línea (spec 005).
// Ejecutar: node --test scripts/text-compare.test.mjs   (o: npm run test:schema)
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { compareDocument, normalizeLineEndings } from "./text-compare.mjs";

const FILE = "docs/site-schema.md";
const EXPECTED = "# Título\n\nLínea uno\nLínea dos\n";

// ---------- RF-4: CRLF y LF son lo mismo ----------
describe("RF-4: CRLF y LF se tratan igual", () => {
  it("normalizeLineEndings cambia cada \\r\\n por \\n y nada más", () => {
    assert.equal(normalizeLineEndings("a\r\nb\r\n"), "a\nb\n");
    assert.equal(normalizeLineEndings("a\nb\n"), "a\nb\n");
    assert.equal(normalizeLineEndings("a\r\nb\nc\r\n"), "a\nb\nc\n");
    assert.equal(normalizeLineEndings("a\rb"), "a\rb", "un \\r suelto no se toca");
    assert.equal(normalizeLineEndings("﻿a  \n"), "﻿a  \n", "ni el BOM ni los espacios");
  });
  it("un documento igual en LF coincide", () => {
    assert.equal(compareDocument(FILE, EXPECTED, EXPECTED), null);
  });
  it("el mismo documento en CRLF coincide", () => {
    assert.equal(compareDocument(FILE, EXPECTED.replace(/\n/g, "\r\n"), EXPECTED), null);
  });
  it("el mismo documento con CRLF y LF mezclados coincide", () => {
    assert.equal(compareDocument(FILE, "# Título\r\n\nLínea uno\r\nLínea dos\n", EXPECTED), null);
  });
});

// ---------- RF-5: cualquier otra diferencia es un error ----------
describe("RF-5: lo que no es CRLF frente a LF sigue siendo un error", () => {
  const cases = {
    "un \\r suelto": "# Título\n\nLínea\runo\nLínea dos\n",
    "un BOM al principio": "﻿" + EXPECTED,
    "espacios al final de una línea": "# Título\n\nLínea uno  \nLínea dos\n",
    "falta el salto de línea final": EXPECTED.replace(/\n$/, ""),
    "sobra un salto de línea final": EXPECTED + "\n",
    "documento vacío": "",
    "documento truncado": "# Título\n\nLínea uno\n",
    "documento más largo": EXPECTED + "Línea tres\n",
    "texto distinto en la primera línea": EXPECTED.replace("# Título", "# Otro"),
    "texto distinto en una del medio": EXPECTED.replace("Línea uno", "Línea 1"),
    "texto distinto en la última línea": EXPECTED.replace("Línea dos", "Línea 2"),
    "una tilde que cambia": EXPECTED.replace("Título", "Titulo"),
  };
  for (const [name, found] of Object.entries(cases)) {
    it(`${name} → falla`, () => {
      assert.equal(typeof compareDocument(FILE, found, EXPECTED), "string");
    });
    it(`${name}, con CRLF además → sigue fallando`, () => {
      assert.equal(typeof compareDocument(FILE, found.replace(/\n/g, "\r\n"), EXPECTED), "string");
    });
  }
});

// ---------- RF-6: el mensaje ----------
describe("RF-6: el mensaje de un fallo real", () => {
  it("nombra el archivo, la línea, la esperada, la encontrada y cómo arreglarlo", () => {
    const message = compareDocument(FILE, "# Título\r\n\r\nLínea 1\r\nLínea dos\r\n", EXPECTED);
    assert.match(message, /docs\/site-schema\.md/);
    assert.match(message, /línea 3/);
    assert.ok(message.includes("Línea uno"), "debe mostrar la línea esperada");
    assert.ok(message.includes("Línea 1"), "debe mostrar la línea encontrada");
    assert.match(message, /npm run schema:export/);
  });
  it("señala la PRIMERA línea distinta aunque haya más después", () => {
    const message = compareDocument(FILE, "# Título\n\nX\nY\n", EXPECTED);
    assert.match(message, /línea 3/);
    assert.equal(/línea 4/.test(message), false);
  });
  it("cuenta las líneas igual con CRLF que con LF", () => {
    const lf = compareDocument(FILE, "a\nb\nc\n", "a\nX\nc\n");
    const crlf = compareDocument(FILE, "a\r\nb\r\nc\r\n", "a\nX\nc\n");
    assert.equal(lf, crlf);
    assert.match(lf, /línea 2/);
  });
  it("un documento más corto indica que se acabó antes", () => {
    const message = compareDocument(FILE, "# Título\n", EXPECTED);
    assert.match(message, /línea 2|línea 3/);
    assert.match(message, /fin del documento|salto de línea final/);
  });
  it("un documento más largo indica que sobra contenido", () => {
    const message = compareDocument(FILE, EXPECTED + "Sobra\n", EXPECTED);
    assert.ok(message.includes("Sobra"));
    assert.match(message, /fin del documento|salto de línea final/);
  });
  it("hace visibles los caracteres que no se ven (espacios, \\r suelto y BOM)", () => {
    assert.ok(compareDocument(FILE, "a  \n", "a\n").includes('"a  "'));
    assert.ok(compareDocument(FILE, "a\rb\n", "a\n").includes("\\r"));
    assert.ok(compareDocument(FILE, "﻿a\n", "a\n").toLowerCase().includes("\\ufeff"));
  });
  it("recorta las líneas largas y nunca vuelca el documento entero", () => {
    const long = "x".repeat(5000);
    const expected = Array.from({ length: 300 }, (_, i) => `línea ${i} ${long}`).join("\n") + "\n";
    const found = expected.replace("línea 150", "línea ciento cincuenta");
    const message = compareDocument(FILE, found, expected);
    assert.ok(message.length < 1500, `el mensaje mide ${message.length} caracteres`);
    assert.match(message, /línea 151/);
    assert.ok(message.includes("…"), "debe indicar el recorte");
  });
  it("cuando coincide devuelve null y no un mensaje vacío", () => {
    assert.strictEqual(compareDocument(FILE, EXPECTED, EXPECTED), null);
  });
});

// ---------- RF-3: el generador escribe LF en cualquier plataforma ----------
describe("RF-3: lo que genera el esquema no lleva \\r y termina en un solo salto", () => {
  it("el JSON Schema y el Markdown", async () => {
    const { renderSchemaJson, renderSchemaMarkdown } = await import("./export-schema.mjs");
    for (const [name, text] of [["site.schema.json", renderSchemaJson()], ["site-schema.md", renderSchemaMarkdown()]]) {
      assert.equal(text.includes("\r"), false, `${name} no debe contener \\r`);
      assert.ok(text.endsWith("\n"), `${name} termina en un salto de línea`);
      assert.equal(text.endsWith("\n\n"), false, `${name} termina en un solo salto de línea`);
    }
  });
});

// ---------- RF-1, RF-2: la política del repositorio ----------
describe("RF-1, RF-2: .gitattributes fuerza LF solo en los dos documentos generados", () => {
  const file = new URL("../.gitattributes", import.meta.url);
  const rules = () =>
    readFileSync(file, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line !== "" && !line.startsWith("#"));

  it("existe y tiene exactamente las dos reglas", () => {
    assert.deepEqual(rules().sort(), ["docs/site-schema.md text eol=lf", "docs/site.schema.json text eol=lf"]);
  });
  it("no usa comodines ni toca otras rutas", () => {
    for (const rule of rules()) {
      const [pattern] = rule.split(/\s+/);
      assert.equal(/[*?\[]/.test(pattern), false, `el patrón "${pattern}" no debe ser un comodín`);
      assert.match(pattern, /^docs\/(site-schema\.md|site\.schema\.json)$/);
    }
  });
});
