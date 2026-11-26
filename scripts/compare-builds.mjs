// Compara el HTML de dos builds y lista las diferencias que quedan tras ignorar lo inocuo (spec 002, RF-7).
//
// Uso:  node scripts/compare-builds.mjs <carpeta-base> <carpeta-nueva> [--json]
// Se ignoran: la etiqueta del generador, los nombres de archivo con huella, el contenido de los
// <script> (minificado distinto) y la repetición de espacios. Lo que queda es contenido (etiquetas,
// atributos y texto) y espacios perdidos o ganados, clasificados según su posible efecto visible.
// Salida del proceso: 0 = nada que revisar · 1 = hay diferencias a revisar · 2 = uso o lectura erróneos.
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const dirs = args.filter((a) => !a.startsWith("--"));
if (dirs.length !== 2) {
  console.error("Uso: node scripts/compare-builds.mjs <carpeta-base> <carpeta-nueva> [--json]");
  process.exit(2);
}

function read(dir) {
  const file = join(resolve(dir), "index.html");
  try {
    return readFileSync(file, "utf8");
  } catch (error) {
    console.error(`No se pudo leer "${file}": ${error instanceof Error ? error.message : String(error)}`);
    process.exit(2);
  }
}

// ---------- Normalización ----------
function clean(html) {
  return html
    .replace(/<meta name="generator"[^>]*>/g, "")
    .replace(/\/_astro\/([A-Za-z0-9_-]+)\.[A-Za-z0-9_-]{6,12}\.(css|js|svg|png|jpe?g|webp|avif|woff2?)/g, "/_astro/$1.HASH.$2")
    .replace(/(<script\b[^>]*>)[\s\S]*?(<\/script>)/g, "$1SCRIPT$2");
}

// Divide en etiquetas, texto y espacio suelto entre etiquetas.
function parse(html) {
  const tokens = [];
  const re = /(<[^>]+>)|([^<]+)/g;
  let m;
  while ((m = re.exec(html))) {
    if (m[1]) {
      tokens.push({ type: "tag", value: m[1].replace(/\s+/g, " ") });
    } else {
      const core = m[2].replace(/\s+/g, " ").trim();
      if (core === "") tokens.push({ type: "ws" });
      else tokens.push({ type: "text", value: core, lead: /^\s/.test(m[2]), trail: /\s$/.test(m[2]) });
    }
  }
  return tokens;
}

const content = (tokens) => tokens.filter((t) => t.type !== "ws");
const signature = (t) => (t.type === "tag" ? t.value : `T:${t.value}`);

// Hay espacio entre cada par de elementos consecutivos (contando el que va dentro del texto).
function boundaries(tokens) {
  const result = [];
  let prev = null;
  let space = false;
  for (const t of tokens) {
    if (t.type === "ws") {
      space = true;
      continue;
    }
    if (t.type === "text" && t.lead) space = true;
    if (prev !== null) result.push(space);
    space = false;
    prev = t;
    if (t.type === "text" && t.trail) space = true;
  }
  return result;
}

// ---------- Diferencias de contenido (LCS) ----------
function diffSequences(a, b) {
  const n = a.length;
  const m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const ops = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) ops.push({ kind: "quitado", value: a[i++] });
    else ops.push({ kind: "añadido", value: b[j++] });
  }
  while (i < n) ops.push({ kind: "quitado", value: a[i++] });
  while (j < m) ops.push({ kind: "añadido", value: b[j++] });
  return ops;
}

// ---------- Clasificación de espacios ----------
const INLINE = "a|span|b|strong|em|i|u|small|code|abbr|mark|sub|sup|button|label";
const INLINE_OPEN = new RegExp(`^<(${INLINE}|img|svg|input)\\b`, "i");
const INLINE_CLOSE = new RegExp(`^</(${INLINE})\\b`, "i");
const isOpen = (t) => t.type === "tag" && INLINE_OPEN.test(t.value);
const isClose = (t) => t.type === "tag" && INLINE_CLOSE.test(t.value);
const shown = (t) => (t.type === "text" ? `«${t.value.length > 30 ? "…" + t.value.slice(-28) : t.value}»` : t.value.slice(0, 50));

function classifySpaces(a, b) {
  const ba = boundaries(a);
  const bb = boundaries(b);
  const ca = content(a);
  let lost = 0;
  let gained = 0;
  let betweenTags = 0;
  let textEdges = 0;
  const riskyMap = new Map();
  for (let k = 0; k < ba.length; k++) {
    if (ba[k] && !bb[k]) {
      lost++;
      const l = ca[k];
      const r = ca[k + 1];
      const risky = (l.type === "text" && isOpen(r)) || (r.type === "text" && isClose(l)) || (isClose(l) && isOpen(r));
      if (risky) {
        const where = `${shown(l)}  ␣✗  ${shown(r)}`;
        riskyMap.set(where, (riskyMap.get(where) ?? 0) + 1);
      } else if (l.type === "tag" && r.type === "tag") betweenTags++;
      else textEdges++;
    } else if (!ba[k] && bb[k]) gained++;
  }
  return { lost, gained, betweenTags, textEdges, risky: [...riskyMap].map(([where, count]) => ({ where, count })) };
}

// ---------- Comparación ----------
const A = parse(clean(read(dirs[0])));
const B = parse(clean(read(dirs[1])));
const contentDiffs = diffSequences(content(A).map(signature), content(B).map(signature));
const whitespace =
  contentDiffs.length === 0
    ? classifySpaces(A, B)
    : { lost: 0, gained: 0, betweenTags: 0, textEdges: 0, risky: [], skipped: true };
const needsReview = contentDiffs.length > 0 || whitespace.risky.length > 0;

if (asJson) {
  console.log(JSON.stringify({ base: dirs[0], nuevo: dirs[1], contentDiffs, whitespace, needsReview }, null, 2));
} else {
  const out = [`Comparación de builds: ${dirs[0]}  →  ${dirs[1]}`];
  if (contentDiffs.length === 0) out.push("Contenido (etiquetas, atributos y texto): sin diferencias.");
  else {
    out.push(`Contenido: ${contentDiffs.length} diferencia(s):`);
    for (const d of contentDiffs.slice(0, 40)) out.push(`  ${d.kind === "quitado" ? "-" : "+"} ${d.value.slice(0, 200)}`);
    if (contentDiffs.length > 40) out.push(`  … y ${contentDiffs.length - 40} más`);
    out.push("Los espacios no se analizan mientras haya diferencias de contenido.");
  }
  if (!whitespace.skipped) {
    out.push(`Espacios perdidos: ${whitespace.lost} | ganados: ${whitespace.gained}`);
    out.push(`  perdidos entre etiquetas: ${whitespace.betweenTags}`);
    out.push(`  perdidos en bordes de texto: ${whitespace.textEdges}`);
    out.push(`  perdidos junto a elementos en línea (posible efecto visible): ${whitespace.risky.length} caso(s) distinto(s)`);
    for (const r of whitespace.risky) out.push(`    · ${r.where}${r.count > 1 ? `  (×${r.count})` : ""}`);
  }
  out.push(needsReview ? "Resultado: hay diferencias a revisar." : "Resultado: sin diferencias a revisar.");
  console.log(out.join("\n"));
}
process.exit(needsReview ? 1 : 0);
