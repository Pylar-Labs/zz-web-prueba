// Comprueba la web ya construida (spec 001: RF-16, RF-17, RF-18, RF-19).
//
// Uso (tras `npm run build`):  node scripts/check-dist.mjs
//   1. Todo enlace interno (href="#x") debe tener su elemento con id="x": no hay enlaces rotos.
//   2. Todo enlace de WhatsApp (wa.me) debe usar el número de contacto de los datos.
//   3. Ninguno de los textos que el template traía escritos (cifras, títulos y subtítulos antiguos)
//      puede verse si no está en los datos (spec 003).
//   4. Cada sección que se muestra tiene su título (h2).
//   5. La página declara el idioma de los datos (`language`, `es` por defecto) y no muestra textos fijos
//      ni mensajes de WhatsApp de otro idioma (spec 004).
// Los datos se leen de SITE_DATA o, si no existe, de src/content/site.data.json.
// Salida del proceso: 0 = sin problemas · 1 = hay problemas · 2 = no se pudo leer algún archivo.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const htmlPath = resolve(root, "dist/index.html");
const dataPath = process.env.SITE_DATA
  ? resolve(process.cwd(), process.env.SITE_DATA)
  : resolve(root, "src/content/site.data.json");

function read(path, hint) {
  try {
    return readFileSync(path, "utf8");
  } catch (error) {
    console.error(`No se pudo leer "${path}": ${error instanceof Error ? error.message : String(error)}${hint}`);
    process.exit(2);
  }
}

const html = read(htmlPath, " (¿ejecutaste `npm run build` antes?)");
const data = JSON.parse(read(dataPath, ""));
const whatsapp = String(data.contact?.whatsapp ?? "");

const problems = [];

// 1) Enlaces internos con destino.
const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
const anchors = [...new Set([...html.matchAll(/\shref="#([^"]*)"/g)].map((m) => m[1]))];
for (const anchor of anchors) {
  if (anchor === "" || !ids.has(anchor)) {
    problems.push(`Enlace roto: href="#${anchor}" no tiene ningún elemento con id="${anchor}".`);
  }
}

// 2) Todos los enlaces wa.me usan el WhatsApp de contacto.
const waLinks = [...html.matchAll(/https:\/\/wa\.me\/([^?"'\s&<>]*)/g)].map((m) => m[1]);
if (waLinks.length === 0) {
  problems.push("No se encontró ningún enlace wa.me (el botón flotante y el contacto deben tenerlo).");
}
for (const number of new Set(waLinks)) {
  if (number !== whatsapp) {
    problems.push(`Un enlace wa.me usa "${number}" en lugar del WhatsApp de contacto "${whatsapp}".`);
  }
}

// 3) Textos que el template traía escritos (spec 003: RF-6, RF-11): solo pueden verse si están en los datos.
const OLD_FIXED_TEXTS = [
  "14+",
  "500+",
  "100%",
  "años de experiencia",
  "clientes satisfechos",
  "artesanal",
  "Nuestros servicios",
  "Todo lo que necesitás en un solo lugar",
  "Nuestros productos",
  "Elaborados con ingredientes naturales de la región",
  "Lo que dicen nuestros clientes",
  "Experiencias reales de personas reales",
  "Contactanos",
  "te respondemos a la brevedad",
];
const strings = [];
(function collect(node) {
  if (typeof node === "string") strings.push(node.toLowerCase());
  else if (node && typeof node === "object") Object.values(node).forEach(collect);
})(data);
const visibleText = html
  .replace(/<script\b[\s\S]*?<\/script>/g, " ")
  .replace(/<style\b[\s\S]*?<\/style>/g, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&quot;/g, '"')
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/&amp;/g, "&")
  .replace(/\s+/g, " ")
  .toLowerCase();
for (const text of OLD_FIXED_TEXTS) {
  const needle = text.toLowerCase();
  if (visibleText.includes(needle) && !strings.some((s) => s.includes(needle))) {
    problems.push(`La web muestra "${text}", un texto del template que no está en los datos.`);
  }
}

// 4) Cada sección que se muestra conserva un título (h2) (spec 003: RF-24).
const SECTION_IDS = ["nosotros", "servicios", "productos", "testimonios", "contacto"];
for (const id of SECTION_IDS) {
  const match = html.match(new RegExp(`<section\\b[^>]*\\sid="${id}"[^>]*>([\\s\\S]*?)</section>`));
  if (match && !/<h2\b/.test(match[1])) problems.push(`La sección "${id}" se muestra sin título (h2).`);
}

// 5) Idioma de la interfaz (spec 004: RF-9, RF-11, RF-12, RF-13, RF-18). La web lleva `lang`, y ningún
// texto fijo (visible, `aria-label` o `placeholder`) ni mensaje de WhatsApp de otro idioma puede estar
// presente si no viene de los datos. Se busca por palabra completa para que "Contact" no salte dentro
// de "Contacto", y se eximen los textos que son iguales en el idioma de la web ("Email").
const { LANGUAGES, UI_TEXT } = await import("../src/content/ui-text.ts");
const language = LANGUAGES.includes(data.language) ? data.language : "es";
const own = UI_TEXT[language];

function flatten(node, skip, out = []) {
  for (const [key, value] of Object.entries(node)) {
    if (skip.includes(key)) continue;
    if (typeof value === "object") flatten(value, skip, out);
    else out.push(value);
  }
  return out;
}
const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const ownTexts = new Set(flatten(own, ["htmlLang"]).map((t) => t.toLowerCase()));

// 5a) Atributo de idioma de la página.
const lang = /<html\b[^>]*\slang="([^"]*)"/.exec(html)?.[1];
if (lang !== own.htmlLang) problems.push(`La página declara lang="${lang}" y debería declarar "${own.htmlLang}" (idioma "${language}").`);

// 5b) Textos de otros idiomas en el texto visible y en los atributos que se leen en voz alta o se ven.
const attributeTexts = [...html.matchAll(/\s(?:aria-label|placeholder|title)="([^"]*)"/g)].map((m) => m[1]);
// Las direcciones de correo (el ejemplo del formulario o el del cliente) no son texto de interfaz:
// "voce@email.com" contiene la palabra "email" sin ser una etiqueta en otro idioma.
const scanned = `${visibleText} | ${attributeTexts.join(" | ").toLowerCase()}`.replace(/\S+@\S+/g, " ");
for (const other of LANGUAGES.filter((l) => l !== language)) {
  for (const text of flatten(UI_TEXT[other], ["htmlLang", "message"])) {
    const needle = text.toLowerCase();
    if (ownTexts.has(needle) || strings.some((s) => s.includes(needle))) continue;
    const word = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(needle)}(?![\\p{L}\\p{N}])`, "u");
    if (word.test(scanned)) problems.push(`La web en "${language}" muestra "${text}", un texto fijo del idioma "${other}" que no está en los datos.`);
  }
}

// 5c) Mensajes prellenados de WhatsApp: deben ser los del idioma de la web.
const messagePatterns = Object.values(own.message).map((template) => {
  const pieces = template.split(/\{\w+\}/).map(escapeRegExp);
  return new RegExp(`^${pieces.join(".+")}$`, "s");
});
for (const raw of new Set([...html.matchAll(/https:\/\/wa\.me\/[^?"'\s<>]*\?text=([^"\s<>]*)/g)].map((m) => m[1]))) {
  let text;
  try {
    text = decodeURIComponent(raw);
  } catch {
    problems.push(`Un enlace de WhatsApp lleva un mensaje mal codificado: ${raw.slice(0, 60)}`);
    continue;
  }
  if (!messagePatterns.some((pattern) => pattern.test(text))) {
    problems.push(`Un mensaje de WhatsApp no está en el idioma de la web ("${language}"): "${text.slice(0, 80)}".`);
  }
}

if (problems.length > 0) {
  console.log(`dist/index.html: ${problems.length} problema(s):`);
  for (const p of problems) console.log(`  - ${p}`);
  process.exit(1);
}
console.log(
  `dist/index.html: ${anchors.length} enlace(s) interno(s) con destino y ${waLinks.length} enlace(s) wa.me con el número de contacto. Sin problemas.`,
);
