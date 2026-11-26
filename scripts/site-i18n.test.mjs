// Tests del idioma de la interfaz (spec 004): campo `language`, traducciones, valores por defecto
// por idioma, fixtures y documentación.
// Ejecutar: node --test scripts/site-i18n.test.mjs   (o: npm run test:schema)
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import * as schema from "../src/content/site.schema.ts";
import { LANGUAGES, UI_TEXT, fill } from "../src/content/ui-text.ts";

const { validateSite, applyDefaults, formatReport } = schema;

// ---------- Ayudantes ----------
const load = (name) => JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8"));
const doc = (name) => readFileSync(fileURLToPath(new URL(`../docs/${name}`, import.meta.url)), "utf8");
const MIN = () => load("site.min.json");
const MAX = () => load("site.max.json");

const withLanguage = (language, base = MIN) => {
  const data = base();
  data.language = language;
  return data;
};
const errorsOf = (data) => validateSite(data).errors;
const find = (errors, path, code) => errors.find((e) => e.path === path && e.code === code);

function assertValid(data, label = "datos") {
  const r = validateSite(data);
  assert.equal(r.ok, true, `${label} deberían ser válidos: ${formatReport(r)}`);
}

// Recorre un objeto de traducciones y devuelve { "nav.home": "Inicio", ... }.
function flatten(node, prefix = "", out = {}) {
  for (const [key, value] of Object.entries(node)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object") flatten(value, path, out);
    else out[path] = value;
  }
  return out;
}
const placeholders = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

// Los textos que la interfaz traía escritos en español antes de la spec 004. No deben cambiar.
const ES_BASELINE = {
  nav: { home: "Inicio", about: "Nosotros", services: "Servicios", products: "Productos", testimonials: "Testimonios", contact: "Contacto" },
  aria: { openMenu: "Abrir menú", whatsapp: "Contactar por WhatsApp" },
  footer: { rights: "Todos los derechos reservados." },
  form: {
    title: "Envianos un mensaje",
    name: "Nombre",
    email: "Email",
    subject: "Asunto",
    message: "Mensaje",
    namePlaceholder: "Tu nombre",
    emailPlaceholder: "tu@email.com",
    subjectPlaceholder: "¿En qué podemos ayudarte?",
    messagePlaceholder: "Contanos tu consulta...",
    submit: "Enviar por WhatsApp",
  },
  info: { title: "Información de contacto", phone: "Teléfono", email: "Email", address: "Ubicación" },
  whatsapp: { title: "Escribinos por WhatsApp", subtitle: "Respondemos rápido" },
  catalog: { cta: "Consultar por WhatsApp" },
  message: { general: "Hola {name}, quiero hacer una consulta", product: "Hola, me interesa el producto: {product}" },
  htmlLang: "es",
};

const SECTIONS = ["services", "products", "testimonials", "contact"];

// ---------- RF-1: valores permitidos ----------
describe("RF-1: campo `language`", () => {
  it("los idiomas incluidos son es, en y pt", () => {
    assert.deepEqual([...LANGUAGES], ["es", "en", "pt"]);
    assert.deepEqual(Object.keys(UI_TEXT).sort(), ["en", "es", "pt"]);
  });
  for (const language of ["es", "en", "pt"]) {
    it(`"${language}" es válido`, () => assertValid(withLanguage(language)));
  }
  it("sin el campo es válido (datos 2.0 y 2.1)", () => {
    assertValid(MIN());
    assertValid(MAX());
  });
});

// ---------- RF-3: texto fuera de la lista ----------
describe("RF-3: idioma no incluido", () => {
  for (const bad of ["fr", "EN", "Es", "pt-BR", "en-US", " en", "en ", "", "español", "xx"]) {
    it(`${JSON.stringify(bad)} → unknown_language en "language" con los valores permitidos`, () => {
      const r = validateSite(withLanguage(bad));
      assert.equal(r.ok, false);
      const error = find(r.errors, "language", "unknown_language");
      assert.ok(error, `salió ${JSON.stringify(r.errors.map((e) => `${e.path}:${e.code}`))}`);
      assert.deepEqual(error.expected, ["es", "en", "pt"]);
      assert.match(error.message, /language/);
      assert.match(error.message, /idioma/);
    });
  }
  it("no corrige el valor: la entrada queda igual", () => {
    const data = withLanguage("EN");
    const copy = structuredClone(data);
    validateSite(data);
    assert.deepEqual(data, copy);
  });
  it("formatReport lista los valores permitidos", () => {
    assert.match(formatReport(validateSite(withLanguage("fr"))), /es, en, pt/);
  });
});

// ---------- RF-4: tipo equivocado ----------
describe("RF-4: language que no es un texto", () => {
  for (const bad of [null, 5, 0, true, false, [], ["en"], {}, { code: "en" }]) {
    it(`${JSON.stringify(bad)} → invalid_type en "language"`, () => {
      const errors = errorsOf(withLanguage(bad));
      assert.ok(find(errors, "language", "invalid_type"), `salió ${JSON.stringify(errors.map((e) => `${e.path}:${e.code}`))}`);
      assert.equal(find(errors, "language", "unknown_language"), undefined);
    });
  }
});

// ---------- RF-16: forma de los errores ----------
describe("RF-16: el error del idioma se suma a los demás en una lista", () => {
  it("language inválido junto con otros errores", () => {
    const data = withLanguage("fr");
    delete data.name;
    data.extra = 1;
    const codes = errorsOf(data).map((e) => `${e.path}:${e.code}`);
    for (const expected of ["language:unknown_language", "name:required", "extra:unrecognized_field"]) {
      assert.ok(codes.includes(expected), `falta ${expected}; salió ${JSON.stringify(codes)}`);
    }
  });
  it("unknown_language está documentado entre los códigos de error", () => {
    const entry = schema.ERROR_CODES.find((e) => e.code === "unknown_language");
    assert.ok(entry && entry.meaning.length > 10);
  });
  it("el informe es JSON puro y trae la versión 2.3", () => {
    const r = validateSite(withLanguage("fr"));
    assert.deepEqual(JSON.parse(JSON.stringify(r)), r);
    assert.equal(r.schemaVersion, "2.3");
  });
});

// ---------- RF-14: versión ----------
describe("RF-14: contrato 2.3", () => {
  it("la versión es 2.3 y el registro de cambios abre con ella", () => {
    assert.equal(schema.SCHEMA_VERSION, "2.3");
    assert.equal(schema.CHANGELOG[0].version, "2.3");
    assert.ok(schema.CHANGELOG[0].changes.length >= 1);
    for (const old of ["2.1", "2.0", "1.0"]) assert.ok(schema.CHANGELOG.some((c) => c.version === old), `se conserva la ${old}`);
  });
});

// ---------- RF-2: el español no cambia ----------
describe("RF-2: sin `language` la web es la de antes", () => {
  it("las traducciones en español son exactamente los textos de antes", () => {
    assert.deepEqual(UI_TEXT.es, ES_BASELINE);
  });
  it("sin el campo, applyDefaults usa el español", () => {
    const site = applyDefaults(MIN());
    assert.equal(site.language, "es");
    assert.deepEqual(site.ui, ES_BASELINE);
  });
  it("sin el campo, los títulos neutros y la etiqueta del botón son los de antes", () => {
    const site = applyDefaults(MIN());
    assert.equal(site.sections.services.title, "Servicios");
    assert.equal(site.sections.products.title, "Productos");
    assert.equal(site.sections.testimonials.title, "Testimonios");
    assert.equal(site.sections.contact.title, "Contacto");
    assert.equal(site.productGridConfig.ctaLabel, "Consultar por WhatsApp");
  });
  it("DEFAULT_SECTION_TITLES y DEFAULT_CATALOG_CONFIG se conservan en español", () => {
    assert.deepEqual({ ...schema.DEFAULT_SECTION_TITLES }, {
      services: "Servicios",
      products: "Productos",
      testimonials: "Testimonios",
      contact: "Contacto",
    });
    assert.equal(schema.DEFAULT_CATALOG_CONFIG.ctaLabel, "Consultar por WhatsApp");
  });
  it("`es` explícito da lo mismo que sin el campo", () => {
    const implicit = applyDefaults(MIN());
    const explicit = applyDefaults(withLanguage("es"));
    assert.deepEqual({ ...explicit, language: undefined }, { ...implicit, language: undefined });
  });
});

// ---------- RF-6, RF-7, RF-8: valores por defecto por idioma ----------
describe("RF-6, RF-7, RF-8: valores por defecto según el idioma", () => {
  for (const language of ["en", "pt"]) {
    it(`${language}: applyDefaults resuelve el idioma y sus textos`, () => {
      const site = applyDefaults(withLanguage(language));
      assert.equal(site.language, language);
      assert.deepEqual(site.ui, UI_TEXT[language]);
    });
    it(`${language}: los títulos neutros son los del menú de ese idioma`, () => {
      const site = applyDefaults(withLanguage(language));
      for (const section of SECTIONS) {
        assert.equal(site.sections[section].title, UI_TEXT[language].nav[section], section);
      }
    });
    it(`${language}: la etiqueta del botón de producto por defecto es la de ese idioma`, () => {
      assert.equal(applyDefaults(withLanguage(language)).productGridConfig.ctaLabel, UI_TEXT[language].catalog.cta);
    });
    it(`${language}: lo que escribe el cliente tiene prioridad y no se traduce`, () => {
      const data = withLanguage(language);
      data.sections = { services: { title: "Nuestros servicios", subtitle: "Todo en un lugar" } };
      data.productGridConfig = { ctaLabel: "Pedir ya" };
      const site = applyDefaults(data);
      assert.equal(site.sections.services.title, "Nuestros servicios");
      assert.equal(site.sections.services.subtitle, "Todo en un lugar");
      assert.equal(site.productGridConfig.ctaLabel, "Pedir ya");
      assert.equal(site.sections.products.title, UI_TEXT[language].nav.products);
    });
  }
  it("no modifica los datos de entrada", () => {
    const data = withLanguage("pt");
    const copy = structuredClone(data);
    applyDefaults(data);
    assert.deepEqual(data, copy);
  });
});

// ---------- RF-11, RF-13: lang y mensajes ----------
describe("RF-11, RF-13: atributo de idioma y mensajes de WhatsApp", () => {
  it("htmlLang es es, en y pt-BR", () => {
    assert.equal(UI_TEXT.es.htmlLang, "es");
    assert.equal(UI_TEXT.en.htmlLang, "en");
    assert.equal(UI_TEXT.pt.htmlLang, "pt-BR");
  });
  for (const language of ["es", "en", "pt"]) {
    it(`${language}: los mensajes llevan sus marcadores`, () => {
      assert.deepEqual(placeholders(UI_TEXT[language].message.general), ["name"]);
      assert.deepEqual(placeholders(UI_TEXT[language].message.product), ["product"]);
    });
  }
  it("fill rellena los marcadores sin interpretar caracteres especiales", () => {
    assert.equal(fill("Hola {name}!", { name: "Café $& \"Ñandú\" 😀" }), 'Hola Café $& "Ñandú" 😀!');
    assert.equal(fill("{name} y {name}", { name: "A" }), "A y A");
    assert.equal(fill("Sin marcadores", { name: "A" }), "Sin marcadores");
  });
  it("el mensaje en español de antes sale igual", () => {
    assert.equal(fill(UI_TEXT.es.message.general, { name: "Sabores del Norte" }), "Hola Sabores del Norte, quiero hacer una consulta");
    assert.equal(fill(UI_TEXT.es.message.product, { product: "Alfajor" }), "Hola, me interesa el producto: Alfajor");
  });
});

// ---------- RF-10: las traducciones están completas ----------
describe("RF-10: los tres idiomas tienen los mismos textos", () => {
  const es = flatten(UI_TEXT.es);
  it("el español trae 28 textos más el atributo de idioma", () => {
    assert.equal(Object.keys(es).length, 29);
  });
  for (const language of ["en", "pt"]) {
    const other = flatten(UI_TEXT[language]);
    it(`${language}: mismas claves que el español`, () => {
      assert.deepEqual(Object.keys(other).sort(), Object.keys(es).sort());
    });
    it(`${language}: ningún texto vacío`, () => {
      for (const [key, value] of Object.entries(other)) {
        assert.equal(typeof value, "string", key);
        assert.ok(value.trim() !== "", `${key} está vacío`);
      }
    });
    it(`${language}: mismos marcadores que el español`, () => {
      for (const key of Object.keys(es)) assert.deepEqual(placeholders(other[key]), placeholders(es[key]), key);
    });
    it(`${language}: no repite el texto en español, salvo palabras iguales en ambos idiomas`, () => {
      const allowed = language === "en" ? new Set(["form.email", "info.email"]) : new Set();
      for (const key of Object.keys(es)) {
        if (key === "htmlLang" || allowed.has(key)) continue;
        assert.notEqual(other[key], es[key], `${key} quedó sin traducir ("${es[key]}")`);
      }
    });
  }
  it("el atributo de idioma es distinto en cada idioma", () => {
    assert.equal(new Set(["es", "en", "pt"].map((l) => UI_TEXT[l].htmlLang)).size, 3);
  });
});

// ---------- RF-21: datos de ejemplo ----------
describe("RF-21: variantes mínima y máxima en inglés y portugués", () => {
  for (const [name, language, base] of [
    ["site.min.en.json", "en", "site.min.json"],
    ["site.min.pt.json", "pt", "site.min.json"],
    ["site.max.en.json", "en", "site.max.json"],
    ["site.max.pt.json", "pt", "site.max.json"],
  ]) {
    it(`${name} es válido, trae language "${language}" y es la variante en español con ese campo`, () => {
      const data = load(name);
      assertValid(data, name);
      assert.equal(data.language, language);
      const { language: _ignored, ...rest } = data;
      assert.deepEqual(rest, load(base));
    });
  }
  it("las variantes en español no traen language", () => {
    assert.equal(MIN().language, undefined);
    assert.equal(MAX().language, undefined);
  });
});

// ---------- RF-15: documentación generada ----------
describe("RF-15: documentación del idioma", () => {
  it("el JSON Schema lista los tres valores y deja el campo opcional", () => {
    const json = JSON.parse(doc("site.schema.json"));
    assert.deepEqual(json.properties.language.enum, ["es", "en", "pt"]);
    assert.ok(json.properties.language.description?.length > 20);
    assert.ok(!json.required.includes("language"));
  });
  it("el Markdown declara 2.3, el campo, el error y los valores por defecto de cada idioma", () => {
    const md = doc("site-schema.md");
    assert.ok(md.includes("Versión del contrato: 2.3"));
    assert.ok(md.includes("`language`"));
    assert.ok(md.includes("unknown_language"));
    for (const language of ["es", "en", "pt"]) {
      assert.ok(md.includes(`"${UI_TEXT[language].nav.services}"`), `falta el título por defecto de ${language}`);
      assert.ok(md.includes(`"${UI_TEXT[language].catalog.cta}"`), `falta la etiqueta por defecto de ${language}`);
    }
  });
});
