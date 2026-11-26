// Genera la documentación del contrato de datos desde el esquema (spec 001: RF-35, RF-36).
//
// Uso:  npm run schema:export
// Escribe docs/site.schema.json (JSON Schema para el generador) y docs/site-schema.md (tabla de
// campos, reglas entre campos, códigos de error y registro de cambios). Ambos son generados:
// no se editan a mano; la fuente de verdad es src/content/site.schema.ts.
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { z } from "astro/zod";
import { CHANGELOG, CROSS_RULES, ERROR_CODES, SCHEMA_VERSION, siteSchema } from "../src/content/site.schema.ts";

const root = fileURLToPath(new URL("..", import.meta.url));

export function renderSchemaJson() {
  return JSON.stringify(z.toJSONSchema(siteSchema), null, 2) + "\n";
}

const TYPE_LABEL = { string: "texto", number: "número", boolean: "verdadero/falso", object: "objeto" };

function typeOf(node) {
  if (node.type === "array") {
    const min = node.minItems ?? 0;
    return node.maxItems === undefined ? `lista (desde ${min})` : `lista (${min} a ${node.maxItems})`;
  }
  return TYPE_LABEL[node.type] ?? String(node.type ?? "valor");
}

const cell = (text) => String(text ?? "").replace(/\|/g, "\\|").replace(/\s*\n\s*/g, " ");

// Recorre el JSON Schema y devuelve una fila por campo, en el orden del esquema.
function collectRows(node, prefix, optionalAncestor, rows) {
  const required = new Set(node.required ?? []);
  for (const [key, sub] of Object.entries(node.properties ?? {})) {
    const isList = sub.type === "array";
    const path = prefix ? `${prefix}.${key}` : key;
    const isRequired = required.has(key);
    let mandatory = "No";
    if (isRequired) mandatory = optionalAncestor ? `Sí, si existe \`${optionalAncestor}\`` : "Sí";
    rows.push({ path: isList ? `${path}[]` : path, type: typeOf(sub), mandatory, description: sub.description });
    const child = isList ? sub.items : sub;
    if (child?.properties) {
      collectRows(child, isList ? `${path}[]` : path, optionalAncestor ?? (isRequired ? null : path), rows);
    }
  }
}

export function renderSchemaMarkdown() {
  const json = z.toJSONSchema(siteSchema);
  const rows = [];
  collectRows(json, "", null, rows);

  const lines = [
    "# Contrato de datos del sitio",
    "",
    "> Documento generado desde `src/content/site.schema.ts` con `npm run schema:export`. No se edita a mano.",
    "",
    `Versión del contrato: ${SCHEMA_VERSION}`,
    "",
    "## Cómo se entregan los datos",
    "",
    "Los datos del sitio son un archivo JSON (`src/content/site.data.json`). Se validan con `npm run validate` antes de construir la web, y la construcción (`npm run build`) falla si no son válidos.",
    "",
    "Los datos no llevan un campo de versión: la versión es la de este contrato. Un campo `version` en los datos se rechaza como campo no previsto.",
    "",
    "Los campos que no figuran en este documento se rechazan (`unrecognized_field`). Un campo opcional se omite quitándolo; si se incluye, no puede estar vacío. Las listas vacías equivalen a ausentes.",
    "",
    "## Campos",
    "",
    "| Campo | Tipo | Obligatorio | Descripción |",
    "|---|---|---|---|",
    ...rows.map((r) => `| \`${r.path}\` | ${r.type} | ${cell(r.mandatory)} | ${cell(r.description)} |`),
    "",
    "## Reglas entre campos",
    "",
    "Estas reglas relacionan varios campos y no se pueden expresar en el JSON Schema.",
    "",
    "| Código | Regla |",
    "|---|---|",
    ...CROSS_RULES.map((r) => `| \`${r.code}\` | ${cell(r.rule)} |`),
    "",
    "## Informe de validación",
    "",
    "`npm run validate -- --json` devuelve un informe estructurado; sin `--json` imprime el mismo contenido como texto legible. Los errores salen ordenados por ruta y sin tope. Se informan todos a la vez: una lista que excede su máximo da el error de cantidad y además los errores de cada uno de sus elementos.",
    "",
    "```json",
    "{",
    '  "ok": false,',
    `  "schemaVersion": "${SCHEMA_VERSION}",`,
    '  "errors": [',
    '    { "path": "products[2].price", "code": "price_not_positive", "message": "…", "expected": ["…"] }',
    "  ]",
    "}",
    "```",
    "",
    "`path` es la ruta exacta del campo (con la posición en las listas), `code` es estable, `message` está en español y `expected` solo aparece cuando hay valores permitidos.",
    "",
    "## Códigos de error",
    "",
    "| Código | Significado |",
    "|---|---|",
    ...ERROR_CODES.map((e) => `| \`${e.code}\` | ${cell(e.meaning)} |`),
    "",
    "## Registro de cambios",
    "",
    ...CHANGELOG.flatMap((entry) => [`### ${entry.version}`, "", ...entry.changes.map((c) => `- ${c}`), ""]),
  ];
  return lines.join("\n").replace(/\n+$/, "\n");
}

// Solo escribe los archivos cuando se ejecuta directamente (no al importarlo desde los tests).
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  writeFileSync(resolve(root, "docs/site.schema.json"), renderSchemaJson());
  writeFileSync(resolve(root, "docs/site-schema.md"), renderSchemaMarkdown());
  console.log("Documentación del contrato generada en docs/site.schema.json y docs/site-schema.md.");
}
