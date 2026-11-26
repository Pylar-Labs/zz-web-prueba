// Spec 013: el informe de validación es completo. Una lista que excede su máximo no oculta los errores de sus
// elementos, y ningún error oculta a otro independiente.
// Ejecutar: node --test scripts/site-errors.test.mjs   (o: npm run test:schema)
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { formatReport, siteSchema, validateSite } from "../src/content/site.schema.ts";

const FIXTURES = join(fileURLToPath(new URL(".", import.meta.url)), "fixtures");
const load = (name) => JSON.parse(readFileSync(join(FIXTURES, name), "utf8"));
const MAX = () => load("site.max.json");
const MIN = () => load("site.min.json");

const errorsOf = (data) => validateSite(data).errors;
const has = (errors, path, code) => errors.some((e) => e.path === path && e.code === code);
const dump = (errors) => JSON.stringify(errors.map((e) => `${e.path}:${e.code}`));

// Las cinco listas con máximo. `bad` estropea un elemento y `badPath`/`badCode` dicen qué error esperar.
const LISTS = [
  {
    path: "about.stats",
    max: 3,
    get: (d) => d.about.stats,
    set: (d, value) => (d.about.stats = value),
    bad: (el) => ({ ...el, value: "x".repeat(11) }),
    badPath: (i) => `about.stats[${i}].value`,
    badCode: "too_long",
  },
  {
    path: "about.highlights",
    max: 5,
    get: (d) => d.about.highlights,
    set: (d, value) => (d.about.highlights = value),
    bad: () => "h".repeat(41),
    badPath: (i) => `about.highlights[${i}]`,
    badCode: "too_long",
  },
  {
    path: "services",
    max: 8,
    get: (d) => d.services,
    set: (d, value) => (d.services = value),
    bad: (el) => ({ ...el, icon: "Heart" }),
    badPath: (i) => `services[${i}].icon`,
    badCode: "unknown_icon",
  },
  {
    path: "testimonials",
    max: 9,
    get: (d) => d.testimonials,
    set: (d, value) => (d.testimonials = value),
    bad: (el) => ({ ...el, rating: 6 }),
    badPath: (i) => `testimonials[${i}].rating`,
    badCode: "invalid_rating",
  },
  {
    path: "products",
    max: 60,
    get: (d) => d.products,
    set: (d, value) => (d.products = value),
    bad: (el) => ({ ...el, image: "ftp://x" }),
    badPath: (i) => `products[${i}].image`,
    badCode: "invalid_url",
  },
];

// El fixture máximo trae cada lista justo en su máximo. Una lista excedida en 1 clona su último elemento.
function withExcess(list) {
  const data = MAX();
  const items = list.get(data);
  assert.equal(items.length, list.max, `${list.path}: el fixture máximo debe tener ${list.max} elementos`);
  const extra = structuredClone(items.at(-1));
  if (list.path === "products") extra.id = "producto-extra";
  list.set(data, [...items, extra]);
  return data;
}

// Estropea el elemento `index` de la lista de `data` (modifica `data`).
function breakItem(list, data, index) {
  const items = list.get(data);
  items[index] = list.bad(items[index]);
}

describe("spec 013, RF-1 y RF-2: una lista excedida informa también los errores de sus elementos", () => {
  for (const list of LISTS) {
    it(`${list.path}: excedida en 1, informa too_many y el error de un elemento de dentro`, () => {
      const data = withExcess(list);
      breakItem(list, data, 0);
      const errors = errorsOf(data);
      assert.ok(has(errors, list.path, "too_many"), `falta too_many; salió: ${dump(errors)}`);
      assert.ok(has(errors, list.badPath(0), list.badCode), `falta ${list.badPath(0)}; salió: ${dump(errors)}`);
    });

    it(`${list.path}: excedida en 1, informa el error del elemento que está por encima del máximo`, () => {
      const data = withExcess(list);
      breakItem(list, data, list.max);
      const errors = errorsOf(data);
      assert.ok(has(errors, list.path, "too_many"), `falta too_many; salió: ${dump(errors)}`);
      assert.ok(has(errors, list.badPath(list.max), list.badCode), `falta ${list.badPath(list.max)}; salió: ${dump(errors)}`);
    });

    it(`${list.path}: errores dentro y fuera del máximo salen todos, y la cantidad va antes que sus elementos`, () => {
      const data = withExcess(list);
      breakItem(list, data, 0);
      breakItem(list, data, list.max);
      const errors = errorsOf(data);
      const paths = errors.map((e) => e.path);
      for (const path of [list.path, list.badPath(0), list.badPath(list.max)]) {
        assert.ok(paths.includes(path), `falta ${path}; salió: ${dump(errors)}`);
      }
      assert.ok(paths.indexOf(list.path) < paths.indexOf(list.badPath(0)), `orden: ${dump(errors)}`);
      assert.ok(paths.indexOf(list.badPath(0)) < paths.indexOf(list.badPath(list.max)), `orden: ${dump(errors)}`);
    });

    it(`${list.path}: justo en el máximo, el error de un elemento sale y no hay too_many (sin cambios)`, () => {
      const data = MAX();
      breakItem(list, data, 0);
      const errors = errorsOf(data);
      assert.ok(has(errors, list.badPath(0), list.badCode), `falta ${list.badPath(0)}; salió: ${dump(errors)}`);
      assert.ok(!has(errors, list.path, "too_many"), `no debía haber too_many; salió: ${dump(errors)}`);
    });
  }
});

describe("spec 013, RF-4: elementos de tipo equivocado en una lista excedida", () => {
  const WRONG = [["un texto", "texto"], ["un número", 42], ["null", null], ["un array", []]];
  for (const list of LISTS.filter((l) => l.path !== "about.highlights")) {
    for (const [label, value] of WRONG) {
      it(`${list.path}: un elemento que es ${label} da invalid_type y la lista sigue dando too_many`, () => {
        const data = withExcess(list);
        list.get(data)[0] = value;
        const errors = errorsOf(data);
        assert.ok(has(errors, `${list.path}[0]`, "invalid_type"), `falta invalid_type en ${list.path}[0]; salió: ${dump(errors)}`);
        assert.ok(has(errors, list.path, "too_many"), `falta too_many; salió: ${dump(errors)}`);
      });
    }
  }
  for (const [label, value] of [["un número", 5], ["null", null], ["un objeto", {}]]) {
    it(`about.highlights: un destacado que es ${label} da invalid_type en una lista excedida`, () => {
      const data = withExcess(LISTS[1]);
      data.about.highlights[0] = value;
      const errors = errorsOf(data);
      assert.ok(has(errors, "about.highlights[0]", "invalid_type"), `falta invalid_type; salió: ${dump(errors)}`);
      assert.ok(has(errors, "about.highlights", "too_many"), `falta too_many; salió: ${dump(errors)}`);
    });
  }
});

describe("spec 013, RF-5 y RF-5b: reglas entre campos y objeto contenedor", () => {
  const catalog = (n) => {
    const base = MIN();
    base.products = Array.from({ length: n }, (_, i) => ({
      id: `p-${i}`,
      name: `Producto ${i}`,
      description: "Descripción.",
      image: "https://placehold.co/400x300",
      price: 100,
      category: `Cat${i % 3}`,
    }));
    return base;
  };

  it("61 productos: id repetido entre un producto de dentro y otro de fuera, precio obligatorio y categoría inconsistente salen como hoy", () => {
    const data = catalog(61);
    data.products[60].id = data.products[3].id;
    delete data.products[6].price;
    data.products[7].category = "cat1";
    const errors = errorsOf(data);
    assert.ok(has(errors, "products", "too_many"), dump(errors));
    assert.ok(has(errors, "products[60].id", "duplicate_id"), dump(errors));
    assert.ok(has(errors, "products[6].price", "required"), dump(errors));
    assert.ok(has(errors, "products[7].category", "inconsistent_category"), dump(errors));
  });

  it("más de 12 categorías distintas con más de 60 productos sale too_many_categories", () => {
    const data = catalog(61);
    data.products.forEach((p, i) => (p.category = `Categoría ${i % 13}`));
    assert.ok(has(errorsOf(data), "products", "too_many_categories"), dump(errorsOf(data)));
  });

  it("about sin título y cuatro cifras: salen los dos errores", () => {
    const data = MIN();
    data.about.stats = [1, 2, 3, 4].map((n) => ({ value: String(n), label: `Cifra ${n}` }));
    delete data.about.title;
    const errors = errorsOf(data);
    assert.ok(has(errors, "about.title", "required"), dump(errors));
    assert.ok(has(errors, "about.stats", "too_many"), dump(errors));
  });
});

describe("spec 013, RF-8 y RF-9: lo que no cambia", () => {
  const fixtureNames = readdirSync(FIXTURES).filter((f) => /^site\..+\.json$/.test(f));

  it("hay fixtures que recorrer", () => {
    assert.ok(fixtureNames.length >= 12, `solo ${fixtureNames.length} fixtures`);
  });

  for (const name of fixtureNames) {
    it(`${name}: validateSite y siteSchema coinciden en aceptar`, () => {
      const data = load(name);
      assert.equal(validateSite(data).ok, siteSchema.safeParse(data).success);
      assert.equal(validateSite(data).ok, true);
    });
  }

  for (const list of LISTS) {
    it(`${list.path} excedida: validateSite y siteSchema coinciden en rechazar`, () => {
      const data = withExcess(list);
      assert.equal(siteSchema.safeParse(data).success, false);
      assert.equal(validateSite(data).ok, false);
    });
    it(`${list.path} con un elemento inválido dentro del máximo: coinciden en rechazar`, () => {
      const data = MAX();
      breakItem(list, data, 0);
      assert.equal(siteSchema.safeParse(data).success, false);
      assert.equal(validateSite(data).ok, false);
    });
  }

  it("el esquema JSON conserva los máximos de las listas (maxItems)", async () => {
    const { z } = await import("astro/zod");
    const json = z.toJSONSchema(siteSchema);
    assert.equal(json.properties.services.maxItems, 8);
    assert.equal(json.properties.products.maxItems, 60);
    assert.equal(json.properties.testimonials.maxItems, 9);
    assert.equal(json.properties.about.properties.stats.maxItems, 3);
    assert.equal(json.properties.about.properties.highlights.maxItems, 5);
  });

  it("el informe de texto lista exactamente los errores del informe estructurado", () => {
    const data = withExcess(LISTS[0]);
    breakItem(LISTS[0], data, 0);
    const report = validateSite(data);
    const lines = formatReport(report).split("\n").slice(1);
    assert.equal(lines.length, report.errors.length);
    report.errors.forEach((e, i) => assert.ok(lines[i].includes(`${e.path === "" ? "(raíz)" : e.path} [${e.code}]`), lines[i]));
  });

  it("un mismo problema sale una sola vez por ruta y código", () => {
    const data = withExcess(LISTS[4]);
    breakItem(LISTS[4], data, 0);
    breakItem(LISTS[4], data, 60);
    data.products[60].id = data.products[3].id;
    const keys = errorsOf(data).map((e) => `${e.path}|${e.code}`);
    assert.equal(new Set(keys).size, keys.length, `repetidos: ${keys.join(" ")}`);
  });

  it("el orden es el de siempre: por ruta y luego por código, igual con claves en otro orden", () => {
    const a = withExcess(LISTS[2]);
    breakItem(LISTS[2], a, 0);
    const b = Object.fromEntries(Object.entries(a).reverse());
    assert.deepEqual(validateSite(a), validateSite(b));
  });
});

// ---------- RF-6, RF-7: ningún error oculta a otro independiente ----------
// Se parte del fixture máximo con cada lista reducida a 2 elementos y se recorren sus campos hoja de forma
// genérica: un campo o una lista futuros entran solos. Cada campo recibe dos mutaciones (tipo equivocado y valor
// malo). Para todo par de campos independientes, el informe de las dos mutaciones juntas contiene todos los errores
// de cada una por separado. Los pares con dependencia declarada (contacto; catálogo y su configuración) quedan fuera:
// en ellos un error puede cambiar legítimamente el resultado del otro. Si falla un par que no es de esos grupos, es
// un caso nuevo (RF-7): se para y se consulta, no se corrige aquí.
describe("spec 013, RF-6: comprobación sistemática", () => {
  const reduced = () => {
    const data = MAX();
    for (const list of LISTS) list.set(data, list.get(data).slice(0, 2));
    return data;
  };

  // Campos hoja: [ruta, valor, forma de asignar]. Las rutas usan el mismo formato que el informe.
  function leaves(node, path = "") {
    if (Array.isArray(node)) return node.flatMap((el, i) => leaves(el, `${path}[${i}]`));
    if (node !== null && typeof node === "object") {
      return Object.entries(node).flatMap(([key, value]) => leaves(value, path === "" ? key : `${path}.${key}`));
    }
    return [{ path, value: node }];
  }
  const tokens = (path) => path.match(/[^.[\]]+/g).map((t) => (/^\d+$/.test(t) ? Number(t) : t));
  function assign(data, path, value) {
    const t = tokens(path);
    let o = data;
    for (let i = 0; i < t.length - 1; i++) o = o[t[i]];
    o[t.at(-1)] = value;
  }

  const MUTATIONS = (value) => {
    const kinds = [["tipo equivocado", { x: 1 }]];
    if (typeof value === "string") kinds.push(["texto demasiado largo", "x".repeat(2000)]);
    if (typeof value === "number") kinds.push(["número negativo", -1]);
    return kinds;
  };

  // Dependencias declaradas: contacto (método de contacto) y catálogo (precio, id, categoría, moneda).
  const group = (path) => {
    if (/^contact\.(whatsapp|email|phone)$/.test(path)) return "contacto";
    if (/^products\[\d+\]\.(id|price|category)$/.test(path) || path.startsWith("productGridConfig.")) return "catálogo";
    return null;
  };

  const base = reduced();
  const LEAVES = leaves(base);
  const MUTATED = LEAVES.flatMap(({ path, value }) =>
    MUTATIONS(value).map(([kind, bad]) => {
      const data = structuredClone(base);
      assign(data, path, bad);
      return { path, kind, bad, data, errors: errorsOf(data) };
    }),
  );
  const keyOf = (e) => `${e.path}|${e.code}`;

  it("el fixture reducido es válido y tiene campos que recorrer", () => {
    assert.equal(validateSite(base).ok, true, dump(errorsOf(base)));
    assert.ok(LEAVES.length >= 50, `solo ${LEAVES.length} campos hoja`);
    assert.ok(MUTATED.length >= 100, `solo ${MUTATED.length} mutaciones`);
  });

  it("cada mutación sola da al menos un error en su propia ruta (la prueba es válida)", () => {
    const sinError = MUTATED.filter((m) => !m.errors.some((e) => e.path === m.path));
    assert.deepEqual(sinError.map((m) => `${m.path} (${m.kind}): ${dump(m.errors)}`), []);
  });

  it("para todo par de campos independientes, el informe combinado trae los errores de cada uno", () => {
    const started = Date.now();
    const failures = [];
    let pairs = 0;
    for (let i = 0; i < MUTATED.length; i++) {
      for (let j = i + 1; j < MUTATED.length; j++) {
        const a = MUTATED[i];
        const b = MUTATED[j];
        if (a.path === b.path) continue;
        const ga = group(a.path);
        if (ga !== null && ga === group(b.path)) continue;
        pairs++;
        const data = structuredClone(a.data);
        assign(data, b.path, b.bad);
        const got = new Set(errorsOf(data).map(keyOf));
        const missing = [...a.errors, ...b.errors].map(keyOf).filter((k) => !got.has(k));
        if (missing.length > 0) failures.push(`${a.path} (${a.kind}) + ${b.path} (${b.kind}): faltan ${[...new Set(missing)].join(", ")}`);
      }
    }
    assert.ok(pairs > 3000, `solo se comprobaron ${pairs} pares`);
    assert.deepEqual(failures.slice(0, 10), [], `${failures.length} pares ocultan un error`);
    assert.ok(Date.now() - started < 30000, `la comprobación tardó ${Date.now() - started} ms`);
  });

  for (const list of LISTS) {
    it(`${list.path} excedida: su too_many y los errores de campos de otras partes salen juntos`, () => {
      const inList = (path) => path === list.path || path.startsWith(`${list.path}[`);
      const failures = [];
      for (const m of MUTATED.filter((x) => !inList(x.path))) {
        const data = structuredClone(m.data);
        const items = list.get(data);
        const clones = Array.from({ length: list.max + 1 - items.length }, () => structuredClone(items.at(-1)));
        if (list.path === "products") clones.forEach((c, k) => (c.id = `producto-extra-${k}`));
        list.set(data, [...items, ...clones]);
        const got = new Set(errorsOf(data).map(keyOf));
        const missing = [...m.errors.map(keyOf), `${list.path}|too_many`].filter((k) => !got.has(k));
        if (missing.length > 0) failures.push(`${m.path} (${m.kind}): faltan ${[...new Set(missing)].join(", ")}`);
      }
      assert.deepEqual(failures.slice(0, 10), [], `${failures.length} casos ocultan un error`);
    });
  }
});

// ---------- RF-10: la solicitud sintética de la prueba del flujo ----------
describe("spec 013, RF-10: una solicitud con muchos errores se informa completa a la primera", () => {
  const ROOT = fileURLToPath(new URL("..", import.meta.url));
  const SCRIPT = join(ROOT, "scripts", "validate-site.mjs");
  const NODE_FLAGS = ["--experimental-strip-types", "--disable-warning=ExperimentalWarning"];

  // Una clínica de fisioterapia en portugués, sin catálogo, con los errores típicos de un generador.
  const request = () => ({
    language: "pt-BR",
    name: "Clínica Vitalis",
    tagline: "Fisioterapia e reabilitação\ncom atendimento humano",
    description: "Clínica de fisioterapia em São Paulo com foco em reabilitação ortopédica e pilates clínico.",
    hero: {
      headline: "Volte a se mover sem dor",
      subheadline: "Avaliação completa, plano de tratamento individual e acompanhamento próximo.",
      ctaPrimary: { label: "Ver produtos", href: "#produtos" },
      ctaSecondary: { label: "Agende uma avaliação", href: "#contato" },
    },
    about: {
      title: "Sobre nós",
      body: "Somos uma equipe de fisioterapeutas especializados em ortopedia e esporte.",
      stats: [
        { value: "12.000+ pacientes", label: "atendidos desde 2012" },
        { value: "98%", label: "de pacientes satisfeitos" },
        { value: "6", label: "especialistas na equipe" },
        { value: "24h", label: "para agendar sua avaliação" },
      ],
      highlights: ["Atendimento domiciliar", "Pilates clínico"],
    },
    contact: { whatsapp: "011 98765-4321", email: "contato@clinicavitalis", phone: "+55 11 3456-7890" },
    social: { instagram: "instagram.com/clinicavitalis" },
    services: [
      { icon: "Star", title: "Reabilitação ortopédica", description: "Tratamento de lesões musculares e articulares." },
      { icon: "Leaf", title: "Pilates clínico", description: "Aulas individuais e em duplas." },
      { icon: "Heart", title: "Atendimento domiciliar", description: "Sessões na sua casa." },
    ],
    testimonials: [
      { name: "Carla M.", text: "Voltei a caminhar sem dor em dois meses.", rating: 5 },
      { name: "Roberto S.", text: "Atendimento atencioso e plano claro.", rating: 6 },
    ],
  });
  const EXPECTED = [
    "about.stats|too_many",
    "about.stats[0].value|too_long",
    "contact.email|invalid_email",
    "contact.whatsapp|invalid_whatsapp",
    "hero.ctaPrimary.href|unknown_anchor",
    "hero.ctaSecondary.href|unknown_anchor",
    "language|unknown_language",
    "services[2].icon|unknown_icon",
    "social.instagram|invalid_url",
    "tagline|line_break",
    "testimonials[1].rating|invalid_rating",
  ];

  it("validateSite lista los once errores a la primera, incluido el de la primera cifra", () => {
    const keys = errorsOf(request()).map((e) => `${e.path}|${e.code}`);
    assert.deepEqual([...keys].sort(), [...EXPECTED].sort());
  });

  it("el comando validate (con --json) lista los mismos once errores y sale con código 1", () => {
    const dir = mkdtempSync(join(tmpdir(), "site-errors-"));
    try {
      const file = join(dir, "solicitud.json");
      writeFileSync(file, JSON.stringify(request()));
      const base = { ...process.env };
      delete base.SITE_DATA;
      const result = spawnSync(process.execPath, [...NODE_FLAGS, SCRIPT, file, "--json"], { cwd: ROOT, env: base, encoding: "utf8" });
      assert.equal(result.status, 1, result.stderr);
      const report = JSON.parse(result.stdout);
      assert.equal(report.ok, false);
      assert.deepEqual(report.errors.map((e) => `${e.path}|${e.code}`).sort(), [...EXPECTED].sort());
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
