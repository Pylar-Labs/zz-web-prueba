// Tests de los campos de texto del contrato 2.1 (spec 003): cifras de "Quiénes somos" y
// títulos y subtítulos de sección.
// Ejecutar: node --test scripts/site-text-fields.test.mjs   (o: npm run test:schema)
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import * as schema from "../src/content/site.schema.ts";

const { validateSite, applyDefaults, formatReport } = schema;

// ---------- Ayudantes ----------
const load = (name) => JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8"));
const MIN = () => load("site.min.json");
const MAX = () => load("site.max.json");
const doc = (name) => readFileSync(fileURLToPath(new URL(`../docs/${name}`, import.meta.url)), "utf8");

const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
const count = (text) => [...segmenter.segment(text)].length;

// Datos mínimos válidos con cambios.
const withData = (fn) => {
  const data = MIN();
  fn(data);
  return data;
};
const withStats = (stats) => withData((d) => (d.about.stats = stats));
const withSections = (sections) => withData((d) => (d.sections = sections));

const errorsOf = (data) => validateSite(data).errors;
const find = (errors, path, code) => errors.find((e) => e.path === path && e.code === code);

function assertValid(data, label = "datos") {
  const r = validateSite(data);
  assert.equal(r.ok, true, `${label} deberían ser válidos: ${formatReport(r)}`);
}
function assertRejected(data, path, code) {
  const errors = errorsOf(data);
  assert.ok(
    find(errors, path, code),
    `se esperaba el error ${code} en "${path}"; salió: ${JSON.stringify(errors.map((e) => `${e.path}:${e.code}`))}`,
  );
}

const SECTIONS = ["services", "products", "testimonials", "contact"];
const NEUTRAL_TITLES = { services: "Servicios", products: "Productos", testimonials: "Testimonios", contact: "Contacto" };

// ---------- RF-1: de 0 a 3 cifras ----------
describe("RF-1: cifras de 'Quiénes somos' (0 a 3)", () => {
  const stat = (i) => ({ value: `+${i}`, label: `Etiqueta ${i}` });
  for (const n of [0, 1, 2, 3]) {
    it(`${n} cifra(s) → datos válidos`, () => {
      assertValid(withStats(Array.from({ length: n }, (_, i) => stat(i + 1))));
    });
  }
  it("4 cifras → too_many en about.stats", () => {
    assertRejected(withStats([1, 2, 3, 4].map(stat)), "about.stats", "too_many");
  });
  it("sin el campo about.stats → datos válidos", () => {
    assertValid(MIN());
  });
  it("applyDefaults no inventa cifras: lo ausente sigue ausente y una lista vacía sigue vacía", () => {
    assert.equal(applyDefaults(MIN()).about.stats, undefined);
    assert.deepEqual(applyDefaults(withStats([])).about.stats, []);
  });
  it("algo que no es una lista → invalid_type", () => {
    assertRejected(withStats("14+"), "about.stats", "invalid_type");
  });
});

// ---------- RF-2, RF-14: límites de valor (10) y descripción (40) ----------
describe("RF-2, RF-14: límites de la cifra", () => {
  const limits = [
    ["value", 10],
    ["label", 40],
  ];
  for (const [field, max] of limits) {
    const path = `about.stats[0].${field}`;
    const build = (text) => withStats([{ value: "+14", label: "años", [field]: text }]);
    it(`${field}: ${max} caracteres es válido`, () => assertValid(build("x".repeat(max))));
    it(`${field}: ${max + 1} caracteres → too_long`, () => assertRejected(build("x".repeat(max + 1)), path, "too_long"));
    it(`${field}: un salto de línea → line_break`, () => assertRejected(build("a\nb"), path, "line_break"));
    it(`${field}: vacío → empty`, () => assertRejected(build(""), path, "empty"));
    it(`${field}: solo espacios → empty`, () => assertRejected(build("   "), path, "empty"));
    it(`${field}: ${max} emojis (1 carácter cada uno) es válido; ${max + 1}, no`, () => {
      assertValid(build("😀".repeat(max)));
      assertRejected(build("😀".repeat(max + 1)), path, "too_long");
    });
    it(`${field}: una letra con tilde combinada cuenta como 1 carácter`, () => {
      assertValid(build("é".repeat(max)));
      assertRejected(build("é".repeat(max + 1)), path, "too_long");
    });
  }
  it("un valor enviado como número → invalid_type", () => {
    assertRejected(withStats([{ value: 14, label: "años" }]), "about.stats[0].value", "invalid_type");
  });
  it("ejemplos de valores reales: +14, 100%, 24/7 y 4,9★", () => {
    for (const value of ["+14", "100%", "24/7", "4,9★"]) assertValid(withStats([{ value, label: "años" }]), value);
  });
  it("el mensaje de too_long está en español y nombra el campo, el máximo y el largo real", () => {
    const error = find(errorsOf(withStats([{ value: "x".repeat(11), label: "a" }])), "about.stats[0].value", "too_long");
    assert.match(error.message, /about\.stats\[0\]\.value/);
    assert.match(error.message, /10/);
    assert.match(error.message, /11/);
  });
});

// ---------- RF-3: ambos o ninguno ----------
describe("RF-3: valor y descripción, ambos o ninguno", () => {
  it("solo el valor → required en la descripción", () => {
    assertRejected(withStats([{ value: "+14" }]), "about.stats[0].label", "required");
  });
  it("solo la descripción → required en el valor", () => {
    assertRejected(withStats([{ label: "años" }]), "about.stats[0].value", "required");
  });
  it("una cifra vacía → required en ambos", () => {
    const errors = errorsOf(withStats([{}]));
    assert.ok(find(errors, "about.stats[0].value", "required"));
    assert.ok(find(errors, "about.stats[0].label", "required"));
  });
  it("la ruta apunta a la cifra que falla, no a otra", () => {
    const errors = errorsOf(withStats([{ value: "+1", label: "uno" }, { value: "+2" }]));
    assert.ok(find(errors, "about.stats[1].label", "required"));
    assert.equal(errors.filter((e) => e.path.startsWith("about.stats[0]")).length, 0);
  });
});

// ---------- RF-7, RF-8: títulos y subtítulos ----------
describe("RF-7, RF-8: títulos y subtítulos de sección", () => {
  it("las cuatro secciones aceptan título y subtítulo", () => {
    const sections = Object.fromEntries(SECTIONS.map((s) => [s, { title: `Título ${s}`, subtitle: `Subtítulo ${s}` }]));
    assertValid(withSections(sections));
  });
  it("título sin subtítulo, y subtítulo sin título, son válidos", () => {
    assertValid(withSections({ services: { title: "Qué hacemos" } }));
    assertValid(withSections({ services: { subtitle: "Todo en un lugar" } }));
  });
  for (const section of SECTIONS) {
    for (const [field, max] of [["title", 80], ["subtitle", 200]]) {
      const path = `sections.${section}.${field}`;
      const build = (text) => withSections({ [section]: { [field]: text } });
      it(`${path}: ${max} caracteres es válido; ${max + 1}, too_long`, () => {
        assertValid(build("x".repeat(max)));
        assertRejected(build("x".repeat(max + 1)), path, "too_long");
      });
      it(`${path}: salto de línea → line_break; vacío o espacios → empty`, () => {
        assertRejected(build("a\nb"), path, "line_break");
        assertRejected(build(""), path, "empty");
        assertRejected(build("  "), path, "empty");
      });
    }
  }
  it("un emoji o una tilde combinada cuentan 1 en título y subtítulo", () => {
    assertValid(withSections({ services: { title: "😀".repeat(80), subtitle: "é".repeat(200) } }));
    assertRejected(withSections({ services: { title: "😀".repeat(81) } }), "sections.services.title", "too_long");
  });
  it("un texto enviado como número → invalid_type", () => {
    assertRejected(withSections({ services: { title: 5 } }), "sections.services.title", "invalid_type");
  });
});

// ---------- RF-9, RF-10: valores por defecto ----------
describe("RF-9, RF-10: títulos neutros y subtítulos sin valor por defecto", () => {
  it("DEFAULT_SECTION_TITLES trae los cuatro títulos neutros", () => {
    assert.deepEqual({ ...schema.DEFAULT_SECTION_TITLES }, NEUTRAL_TITLES);
  });
  it("applyDefaults deja about sin cambios cuando no hay cifras (no añade `stats`)", () => {
    const data = MIN();
    assert.deepEqual(applyDefaults(data).about, { ...data.about, highlights: [] });
  });
  it("sin el campo sections, cada sección resuelve su título neutro y ningún subtítulo", () => {
    const site = applyDefaults(MIN());
    for (const section of SECTIONS) {
      assert.equal(site.sections[section].title, NEUTRAL_TITLES[section]);
      assert.equal(site.sections[section].subtitle, undefined);
    }
  });
  it("un título propio reemplaza al neutro y el subtítulo se conserva", () => {
    const site = applyDefaults(withSections({ products: { title: "Nuestra carta", subtitle: "Hecho a mano" } }));
    assert.equal(site.sections.products.title, "Nuestra carta");
    assert.equal(site.sections.products.subtitle, "Hecho a mano");
    assert.equal(site.sections.services.title, "Servicios");
  });
  it("un subtítulo sin título usa el título neutro", () => {
    const site = applyDefaults(withSections({ contact: { subtitle: "Escribinos" } }));
    assert.equal(site.sections.contact.title, "Contacto");
    assert.equal(site.sections.contact.subtitle, "Escribinos");
  });
  it("applyDefaults no modifica los datos de entrada ni inventa cifras", () => {
    const data = withStats([{ value: "+14", label: "años" }]);
    const copy = structuredClone(data);
    const site = applyDefaults(data);
    assert.deepEqual(data, copy);
    assert.deepEqual(site.about.stats, [{ value: "+14", label: "años" }]);
  });
});

// ---------- RF-12: secciones omitidas ----------
describe("RF-12: textos de una sección omitida", () => {
  it("título y subtítulo de productos sin productos → datos válidos", () => {
    assertValid(withSections({ products: { title: "Productos", subtitle: "Sin productos" } }));
  });
  it("título y subtítulo de testimonios sin testimonios → datos válidos", () => {
    assertValid(withSections({ testimonials: { title: "Opiniones", subtitle: "Aún sin opiniones" } }));
  });
  it("sections vacío, o con secciones vacías → datos válidos", () => {
    assertValid(withSections({}));
    assertValid(withSections({ services: {}, products: {}, testimonials: {}, contact: {} }));
  });
});

// ---------- RF-13, RF-14: sin recortes ni correcciones ----------
describe("RF-14: no se corrige ni se recorta nada", () => {
  it("espacios al principio y al final se aceptan y se conservan", () => {
    const data = withStats([{ value: " +14 ", label: " años " }]);
    const copy = structuredClone(data);
    assertValid(data);
    assert.deepEqual(data, copy);
    assert.equal(applyDefaults(data).about.stats[0].value, " +14 ");
  });
  it("un texto con solo signos o emojis se acepta", () => {
    assertValid(withStats([{ value: "★★★", label: "!!!" }]));
  });
  it("cifras repetidas y títulos que repiten el menú se aceptan", () => {
    assertValid(withStats([{ value: "+14", label: "años" }, { value: "+14", label: "años" }]));
    assertValid(withSections({ services: { title: "Contacto" }, contact: { title: "Contacto" } }));
  });
  it("un dato inválido no se corrige: la entrada queda igual", () => {
    const data = withStats([{ value: "x".repeat(11), label: "a" }]);
    const copy = structuredClone(data);
    validateSite(data);
    assert.deepEqual(data, copy);
  });
});

// ---------- RF-15, RF-16: forma de los errores y campos no previstos ----------
describe("RF-15, RF-16: errores y campos no previstos", () => {
  it("cada error nuevo trae ruta, código estable y mensaje en español, sumados al resto en una lista", () => {
    const data = withData((d) => {
      delete d.name;
      d.about.stats = [{ value: "x".repeat(11), label: "a" }, { value: "+2" }];
      d.sections = { products: { title: "  " } };
    });
    const r = validateSite(data);
    assert.equal(r.ok, false);
    const codes = r.errors.map((e) => `${e.path}:${e.code}`);
    for (const expected of ["name:required", "about.stats[0].value:too_long", "about.stats[1].label:required", "sections.products.title:empty"]) {
      assert.ok(codes.includes(expected), `falta ${expected}; salió ${JSON.stringify(codes)}`);
    }
    for (const e of r.errors) {
      assert.equal(typeof e.path, "string");
      assert.match(e.code, /^[a-z_]+$/);
      assert.ok(e.message.length > 0 && /[a-záéíóúñ]/i.test(e.message));
    }
    const text = formatReport(r);
    for (const e of r.errors) assert.ok(text.includes(e.path) && text.includes(e.code));
  });
  it("todos los códigos que emiten los campos nuevos ya están documentados", () => {
    const documented = new Set(schema.ERROR_CODES.map((e) => e.code));
    const data = withData((d) => {
      d.about.stats = [{ value: 1, label: "" }, { label: "a\nb" }, { value: "x".repeat(11), label: "a", extra: 1 }, {}, {}];
      d.sections = { services: { title: 5, extra: 1 }, extra: {} };
    });
    for (const e of errorsOf(data)) assert.ok(documented.has(e.code), `código sin documentar: ${e.code}`);
  });
  it("un campo no previsto en una cifra → unrecognized_field", () => {
    assertRejected(withStats([{ value: "+14", label: "años", icon: "x" }]), "about.stats[0].icon", "unrecognized_field");
  });
  it("un campo no previsto en sections o en una sección → unrecognized_field", () => {
    assertRejected(withSections({ blog: { title: "Blog" } }), "sections.blog", "unrecognized_field");
    assertRejected(withSections({ services: { title: "a", footer: "b" } }), "sections.services.footer", "unrecognized_field");
  });
  it("sections que no es un objeto → invalid_type", () => {
    assertRejected(withData((d) => (d.sections = "Servicios")), "sections", "invalid_type");
  });
});

// ---------- RF-18, RF-21: contrato 2.1 y compatibilidad con 2.0 ----------
describe("RF-18, RF-21: versión 2.1 y datos 2.0", () => {
  it("la versión del contrato es 2.3", () => {
    assert.equal(schema.SCHEMA_VERSION, "2.3");
    assert.equal(validateSite(MIN()).schemaVersion, "2.3");
  });
  it("el registro de cambios abre con la 2.3 y la describe", () => {
    assert.equal(schema.CHANGELOG[0].version, "2.3");
    assert.ok(schema.CHANGELOG[0].changes.length >= 1);
    assert.ok(schema.CHANGELOG.some((c) => c.version === "2.0"), "la entrada 2.0 se conserva");
  });
  it("datos del contrato 2.0 (sin campos nuevos) siguen siendo válidos", () => {
    assertValid(MIN(), "min");
    const legacy = MAX();
    delete legacy.about.stats;
    delete legacy.sections;
    assertValid(legacy, "max sin campos nuevos");
  });
  it("la variante mínima no trae ningún campo nuevo", () => {
    const min = MIN();
    assert.equal(min.about.stats, undefined);
    assert.equal(min.sections, undefined);
  });
  it("la variante máxima trae todos los campos nuevos en su límite", () => {
    const max = MAX();
    assertValid(max, "max");
    assert.equal(max.about.stats.length, 3);
    assert.ok(max.about.stats.some((s) => count(s.value) === 10), "una cifra con valor de 10 caracteres");
    assert.ok(max.about.stats.some((s) => count(s.label) === 40), "una cifra con descripción de 40 caracteres");
    assert.ok(max.about.stats.some((s) => !/[\s.,-]/.test(s.value) && count(s.value) === 10), "un valor de 10 caracteres sin puntos de corte");
    for (const section of SECTIONS) {
      assert.equal(count(max.sections[section].title), 80, `título de ${section}`);
      assert.equal(count(max.sections[section].subtitle), 200, `subtítulo de ${section}`);
    }
  });
});

// ---------- RF-19: documentación generada ----------
describe("RF-19: documentación de los campos nuevos", () => {
  const json = () => JSON.parse(doc("site.schema.json"));
  it("el JSON Schema describe cada campo nuevo y los deja opcionales", () => {
    const j = json();
    const stats = j.properties.about.properties.stats;
    assert.equal(stats.maxItems, 3);
    assert.equal(stats.items.properties.value.type, "string");
    assert.ok(stats.description?.length > 10, "about.stats sin descripción");
    for (const field of ["value", "label"]) assert.ok(stats.items.properties[field].description?.length > 10, `stats.${field} sin descripción`);
    for (const section of SECTIONS) {
      const node = j.properties.sections.properties[section];
      assert.ok(node.description?.length > 10, `sections.${section} sin descripción`);
      assert.ok(node.properties.title.description?.length > 10);
      assert.ok(node.properties.subtitle.description?.length > 10);
    }
    assert.ok(!j.required.includes("sections"), "sections es opcional");
    assert.ok(!j.properties.about.required.includes("stats"), "about.stats es opcional");
  });
  it("el Markdown declara 2.3 y lista cada campo nuevo con su valor por defecto", () => {
    const md = doc("site-schema.md");
    assert.ok(md.includes("Versión del contrato: 2.3"));
    assert.ok(md.includes("about.stats[]"));
    for (const section of SECTIONS) {
      assert.ok(md.includes(`sections.${section}.title`), `falta sections.${section}.title`);
      assert.ok(md.includes(`sections.${section}.subtitle`), `falta sections.${section}.subtitle`);
    }
    for (const title of Object.values(NEUTRAL_TITLES)) assert.ok(md.includes(`"${title}"`), `falta el valor por defecto "${title}"`);
  });
});
