// Casos de ejemplo del contrato de datos del sitio (spec 001).
// Ejecutar: node --test scripts/site-schema.test.mjs   (o: npm run test:schema)
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { validateSite } from "../src/content/site.schema.ts";
import * as schema from "../src/content/site.schema.ts";
import { iconPaths } from "../src/lib/icons.ts";
import { compareDocument } from "./text-compare.mjs";

// ---------- Ayudantes ----------
const load = (name) =>
  JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8"));
const MIN = () => load("site.min.json");
const MAX = () => load("site.max.json");

const tokens = (path) =>
  path.match(/[^.[\]]+/g).map((t) => (/^\d+$/.test(t) ? Number(t) : t));

function parentOf(obj, path) {
  const t = tokens(path);
  let o = obj;
  for (let i = 0; i < t.length - 1; i++) o = o[t[i]];
  return [o, t[t.length - 1]];
}
const mutate = (base, fn) => {
  const d = structuredClone(base);
  fn(d);
  return d;
};
const setPath = (base, path, value) =>
  mutate(base, (d) => {
    const [o, k] = parentOf(d, path);
    o[k] = value;
  });
const delPath = (base, path) =>
  mutate(base, (d) => {
    const [o, k] = parentOf(d, path);
    delete o[k];
  });

// Datos mínimos más un ejemplo de cada opcional (para borrarlos de a uno).
const full = () =>
  mutate(MIN(), (d) => {
    d.hero.ctaSecondary = { label: "Ver servicios", href: "#servicios" };
    d.about.highlights = ["Diseño propio"];
    d.contact.phone = "+54 11 1234-5678";
    d.contact.address = "Jujuy, Argentina";
    d.social = {
      instagram: "https://instagram.com/aurora",
      facebook: "https://facebook.com/aurora",
    };
    d.testimonials = [{ name: "Ana", role: "Clienta", text: "Excelente trabajo.", rating: 5 }];
    d.products = [
      {
        id: "afiche-a3",
        name: "Afiche A3",
        description: "Impresión en papel mate.",
        image: "https://placehold.co/400x300",
        price: 1500,
        category: "Impresos",
      },
    ];
    d.productGridConfig = { showPrice: true, ctaLabel: "Consultar", groupByCategory: false };
  });

const errorPaths = (r) => r.errors.map((e) => e.path);
const expectValid = (data, msg = "") => {
  const r = validateSite(data);
  assert.equal(r.ok, true, `${msg} esperaba datos válidos; errores: ${JSON.stringify(r.errors)}`);
};
const expectInvalidAt = (data, path, msg = "") => {
  const r = validateSite(data);
  assert.equal(r.ok, false, `${msg} esperaba rechazo en "${path}" pero los datos se aceptaron`);
  assert.ok(
    errorPaths(r).includes(path),
    `${msg} esperaba un error en "${path}"; hubo: [${errorPaths(r).join(", ")}]`,
  );
};

const makeProducts = (n) =>
  Array.from({ length: n }, (_, i) => ({
    id: `p-${i + 1}`,
    name: `Producto ${i + 1}`,
    description: "Descripción.",
    image: "https://placehold.co/400x300",
    price: 100,
    category: `Cat ${i % 12}`,
  }));

// ---------- RF-10, RF-11: obligatorios y opcionales ----------
describe("RF-10, RF-11: obligatorios y opcionales", () => {
  it("los fixtures mínimo y máximo son válidos", () => {
    expectValid(MIN(), "min");
    expectValid(MAX(), "max");
    expectValid(full(), "full");
  });

  const REQUIRED = [
    "name", "tagline", "description",
    "hero", "hero.headline", "hero.subheadline",
    "hero.ctaPrimary", "hero.ctaPrimary.label", "hero.ctaPrimary.href",
    "about", "about.title", "about.body",
    "contact", "contact.whatsapp",
    "services",
  ];
  for (const path of REQUIRED) {
    it(`falta el obligatorio "${path}" → error en ese campo`, () => {
      expectInvalidAt(delPath(full(), path), path);
    });
  }

  const OPTIONAL = [
    "social", "social.instagram", "social.facebook",
    "hero.ctaSecondary", "about.highlights",
    "contact.phone", "contact.address", "contact.email",
    "testimonials", "testimonials[0].role",
    "products", "products[0].category", "productGridConfig",
  ];
  for (const path of OPTIONAL) {
    it(`falta el opcional "${path}" → datos válidos`, () => {
      expectValid(delPath(full(), path));
    });
  }
});

// ---------- RF-12: obligatorios dentro de cada elemento ----------
describe("RF-12: campos obligatorios por elemento", () => {
  const PER_ELEMENT = [
    "services[0].icon", "services[0].title", "services[0].description",
    "testimonials[0].name", "testimonials[0].text", "testimonials[0].rating",
    "products[0].id", "products[0].name", "products[0].description", "products[0].image",
  ];
  for (const path of PER_ELEMENT) {
    it(`falta "${path}" → error en ese campo`, () => {
      expectInvalidAt(delPath(full(), path), path);
    });
  }

  it("botón secundario con solo etiqueta → error en el enlace", () => {
    expectInvalidAt(
      setPath(full(), "hero.ctaSecondary", { label: "Solo etiqueta" }),
      "hero.ctaSecondary.href",
    );
  });
  it("botón secundario con solo enlace → error en la etiqueta", () => {
    expectInvalidAt(
      setPath(full(), "hero.ctaSecondary", { href: "#servicios" }),
      "hero.ctaSecondary.label",
    );
  });
});

// ---------- RF-15: presente pero vacío ----------
describe("RF-15: opcional presente pero vacío", () => {
  const EMPTY_TEXT = [
    "contact.address", "contact.phone", "contact.email",
    "social.instagram", "social.facebook",
    "testimonials[0].role", "products[0].category", "about.highlights[0]",
  ];
  for (const path of EMPTY_TEXT) {
    it(`"${path}" = "" → se rechaza`, () => {
      expectInvalidAt(setPath(full(), path, ""), path);
    });
  }

  for (const path of ["testimonials", "products", "about.highlights"]) {
    it(`lista vacía "${path}" = [] → válido (equivale a ausente)`, () => {
      expectValid(setPath(full(), path, []));
    });
  }
});

// ---------- RF-31: cantidades ----------
describe("RF-31: mínimos y máximos de listas", () => {
  const service = () => MIN().services[0];
  const testimonial = () => full().testimonials[0];

  it("servicios: 0 inválido, 1 y 8 válidos, 9 inválido", () => {
    expectInvalidAt(setPath(MIN(), "services", []), "services");
    expectValid(setPath(MIN(), "services", Array.from({ length: 1 }, service)));
    expectValid(setPath(MIN(), "services", Array.from({ length: 8 }, service)));
    expectInvalidAt(setPath(MIN(), "services", Array.from({ length: 9 }, service)), "services");
  });
  it("testimonios: 9 válidos, 10 inválidos", () => {
    expectValid(setPath(full(), "testimonials", Array.from({ length: 9 }, testimonial)));
    expectInvalidAt(
      setPath(full(), "testimonials", Array.from({ length: 10 }, testimonial)),
      "testimonials",
    );
  });
  it("productos: 60 válidos, 61 inválidos", () => {
    expectValid(setPath(full(), "products", makeProducts(60)));
    expectInvalidAt(setPath(full(), "products", makeProducts(61)), "products");
  });
  it("destacados: 5 válidos, 6 inválidos", () => {
    const h = (n) => Array.from({ length: n }, (_, i) => `Destacado ${i}`);
    expectValid(setPath(full(), "about.highlights", h(5)));
    expectInvalidAt(setPath(full(), "about.highlights", h(6)), "about.highlights");
  });
});

// ---------- RF-9: campos no previstos ----------
describe("RF-9: campos no previstos", () => {
  const UNKNOWN = [
    ["extra", "extra"],
    ["hero.foo", "hero.foo"],
    ["contact.fax", "contact.fax"],
    ["services[0].color", "services[0].color"],
  ];
  for (const [path] of UNKNOWN) {
    it(`campo desconocido "${path}" → se rechaza con esa ruta`, () => {
      expectInvalidAt(setPath(full(), path, "x"), path);
    });
  }
});

// ---------- RF-4 a RF-9: informe de errores ----------
describe("RF-6: forma de cada error", () => {
  const errorAt = (data, path) => validateSite(data).errors.find((e) => e.path === path);
  const SNAKE = /^[a-z][a-z0-9_]*$/;

  it("falta un obligatorio → código `required`, mensaje en español", () => {
    const e = errorAt(delPath(full(), "hero.headline"), "hero.headline");
    assert.ok(e, "debe haber un error en hero.headline");
    assert.equal(e.code, "required");
    assert.match(e.code, SNAKE);
    assert.match(e.message, /obligatorio/);
    assert.match(e.message, /hero\.headline/);
  });
  it("tipo incorrecto → código `invalid_type`", () => {
    const e = errorAt(setPath(full(), "services[0].title", 5), "services[0].title");
    assert.equal(e?.code, "invalid_type");
    assert.match(e.message, /debe ser/);
  });
  it("texto vacío → código `empty`", () => {
    const e = errorAt(setPath(full(), "contact.address", ""), "contact.address");
    assert.equal(e?.code, "empty");
    assert.match(e.message, /vac[ií]o/);
  });
  it("campo desconocido → código `unrecognized_field`", () => {
    const e = errorAt(setPath(full(), "extra", 1), "extra");
    assert.equal(e?.code, "unrecognized_field");
    assert.match(e.message, /no est[aá] previsto/);
  });
  it("la ruta incluye la posición en listas", () => {
    const e = errorAt(delPath(full(), "products[0].name"), "products[0].name");
    assert.ok(e);
  });
});

describe("RF-9: campos retirados del contrato", () => {
  it("productGridConfig.whatsappNumber → `removed_field` e indica qué usar", () => {
    const data = setPath(full(), "productGridConfig.whatsappNumber", "5491112345678");
    const e = validateSite(data).errors.find((x) => x.path === "productGridConfig.whatsappNumber");
    assert.equal(e?.code, "removed_field");
    assert.match(e.message, /eliminado/);
    assert.match(e.message, /contact\.whatsapp/);
  });
});

describe("RF-5: todos los errores a la vez, sin tope y en orden determinista", () => {
  it("errores en distintos niveles salen todos", () => {
    let d = delPath(full(), "hero.headline");
    d = setPath(d, "services[0].title", 5);
    d = setPath(d, "extra", 1);
    const paths = errorPaths(validateSite(d));
    for (const p of ["hero.headline", "services[0].title", "extra"]) {
      assert.ok(paths.includes(p), `falta el error de "${p}"; hubo [${paths.join(", ")}]`);
    }
  });
  it("sin tope: 60 productos sin id dan 60 errores o más", () => {
    const products = makeProducts(60).map(({ id, ...rest }) => rest);
    const r = validateSite(setPath(full(), "products", products));
    assert.ok(r.errors.length >= 60, `se esperaban ≥ 60 errores; hubo ${r.errors.length}`);
  });
  it("el orden es determinista y no depende del orden de las claves de entrada", () => {
    const a = { ...full() };
    delete a.name;
    delete a.tagline;
    const b = Object.fromEntries(Object.entries(a).reverse());
    const ra = validateSite(a);
    assert.deepEqual(ra, validateSite(a));
    assert.deepEqual(errorPaths(ra), errorPaths(validateSite(b)));
  });
  it("los errores salen ordenados por ruta", () => {
    let d = delPath(full(), "tagline");
    d = delPath(d, "name");
    d = delPath(d, "about.title");
    const paths = errorPaths(validateSite(d));
    const sorted = [...paths].sort((x, y) => (x < y ? -1 : x > y ? 1 : 0));
    assert.deepEqual(paths, sorted);
  });
});

describe("RF-8: datos degenerados no rompen el validador", () => {
  for (const [label, value] of [["null", null], ["texto", "x"], ["lista", []], ["undefined", undefined], ["número", 5]]) {
    it(`entrada completa = ${label} → rechazada con un error en la raíz`, () => {
      const r = validateSite(value);
      assert.equal(r.ok, false);
      assert.equal(r.errors[0].path, "");
      assert.equal(r.errors[0].code, "invalid_type");
    });
  }
  const CASES = [
    ["name", null], ["hero", null], ["services", "x"], ["hero.ctaSecondary", null],
    ["products[0].price", "1800"], ["testimonials[0].rating", Number.NaN],
    ["testimonials[0].rating", Number.POSITIVE_INFINITY], ["social", []],
  ];
  for (const [path, value] of CASES) {
    it(`${path} = ${String(value)} → error con esa ruta, sin excepción`, () => {
      const data = setPath(full(), path, value);
      let r;
      assert.doesNotThrow(() => {
        r = validateSite(data);
      });
      assert.equal(r.ok, false);
      assert.ok(errorPaths(r).includes(path), `esperaba error en ${path}; hubo [${errorPaths(r).join(", ")}]`);
    });
  }
});

describe("RF-4: no se corrige ni se modifica nada", () => {
  it("la entrada no se muta y el informe no devuelve datos corregidos", () => {
    const data = setPath(full(), "name", "  Nombre con espacios  ");
    const before = structuredClone(data);
    const r = validateSite(data);
    assert.deepEqual(data, before);
    assert.equal("data" in r, false);
  });
});

describe("RF-7: texto legible y estructura equivalentes", () => {
  it("el informe es JSON puro", () => {
    const r = validateSite(delPath(full(), "name"));
    assert.deepEqual(JSON.parse(JSON.stringify(r)), r);
    assert.equal(r.schemaVersion, "2.3");
  });
  it("formatReport() lista cada error con su ruta, código y mensaje", () => {
    let d = delPath(full(), "name");
    d = setPath(d, "extra", 1);
    const r = validateSite(d);
    const text = schema.formatReport(r);
    assert.equal(typeof text, "string");
    for (const e of r.errors) {
      assert.ok(text.includes(e.path), `el texto debe incluir la ruta ${e.path}`);
      assert.ok(text.includes(e.code), `el texto debe incluir el código ${e.code}`);
      assert.ok(text.includes(e.message), `el texto debe incluir el mensaje de ${e.path}`);
    }
    assert.match(text, /2\.3/);
  });
  it("formatReport() de datos válidos lo indica", () => {
    assert.match(schema.formatReport(validateSite(full())), /v[aá]lidos/);
  });
});

// ---------- RF-32, RF-33, RF-34: reglas de texto ----------
const errorAt = (data, path) => validateSite(data).errors.find((e) => e.path === path);

const LABEL_FIELDS = [
  "hero.ctaPrimary.label", "hero.ctaSecondary.label", "about.highlights[0]",
  "testimonials[0].role", "products[0].category", "productGridConfig.ctaLabel",
];
const SHORT_FIELDS = [
  "name", "tagline", "hero.headline", "about.title",
  "services[0].title", "testimonials[0].name", "products[0].name",
];
const LONG_FIELDS = [
  "description", "hero.subheadline", "about.body",
  "services[0].description", "testimonials[0].text", "products[0].description",
];
const ADDRESS_FIELD = "contact.address";
const MAX_BY_FIELD = new Map([
  ...LABEL_FIELDS.map((p) => [p, 40]),
  ...SHORT_FIELDS.map((p) => [p, 80]),
  ...LONG_FIELDS.map((p) => [p, 500]),
  [ADDRESS_FIELD, 150],
]);

describe("RF-32: longitudes máximas por tipo de campo", () => {
  for (const [path, max] of MAX_BY_FIELD) {
    it(`"${path}": ${max} caracteres válido, ${max + 1} → too_long`, () => {
      expectValid(setPath(full(), path, "á".repeat(max)), path);
      const e = errorAt(setPath(full(), path, "á".repeat(max + 1)), path);
      assert.equal(e?.code, "too_long", `se esperaba too_long en ${path}`);
      assert.match(e.message, new RegExp(String(max)));
    });
  }
  it("un emoji con tono de piel y una letra con tilde combinada cuentan como 1", () => {
    const emoji = "\u{1F44D}\u{1F3FD}";
    assert.ok(emoji.length > 1);
    expectValid(setPath(full(), "name", emoji.repeat(80)));
    expectInvalidAt(setPath(full(), "name", emoji.repeat(81)), "name");
    const combined = "é";
    expectValid(setPath(full(), "tagline", combined.repeat(80)));
  });
});

describe("RF-33: al menos un carácter visible", () => {
  const ALL = [...LABEL_FIELDS, ...SHORT_FIELDS, ...LONG_FIELDS, ADDRESS_FIELD];
  for (const path of ALL) {
    it(`"${path}" solo con espacios → empty`, () => {
      assert.equal(errorAt(setPath(full(), path, "   "), path)?.code, "empty");
    });
  }
  it("un largo solo con saltos de línea también cuenta como vacío", () => {
    assert.equal(errorAt(setPath(full(), "about.body", "\n\n \t\n"), "about.body")?.code, "empty");
  });
  it("un texto con espacios alrededor pero con contenido es válido y no se recorta", () => {
    const data = setPath(full(), "name", "  Aurora  ");
    expectValid(data);
    assert.equal(data.name, "  Aurora  ");
  });
});

describe("RF-34: saltos de línea y texto plano", () => {
  for (const path of [...LABEL_FIELDS, ...SHORT_FIELDS, ADDRESS_FIELD]) {
    it(`"${path}" con salto de línea → line_break`, () => {
      assert.equal(errorAt(setPath(full(), path, "uno\ndos"), path)?.code, "line_break");
      assert.equal(errorAt(setPath(full(), path, "uno\rdos"), path)?.code, "line_break");
    });
  }
  for (const path of LONG_FIELDS) {
    it(`"${path}" admite saltos de línea`, () => {
      expectValid(setPath(full(), path, "primera línea\nsegunda línea"));
    });
  }
  it("el HTML escrito en un texto es válido (se mostrará como texto literal)", () => {
    expectValid(setPath(full(), "name", "<b>Aurora</b> & Co"));
    expectValid(setPath(full(), "about.body", "<script>alert(1)</script>"));
  });
});

// ---------- RF-20 a RF-25, RF-29: reglas de valores ----------
const codeAt = (data, path) => errorAt(data, path)?.code;

describe("RF-20: WhatsApp", () => {
  const P = "contact.whatsapp";
  for (const ok of ["12345678", "123456789012345", "5491112345678"]) {
    it(`"${ok}" (${ok.length} dígitos) es válido`, () => expectValid(setPath(full(), P, ok)));
  }
  for (const bad of ["1234567", "1234567890123456", "+5491112345678", "54 9 11 1234 5678", "54-9-11-1234", "54911abc5678", ""]) {
    it(`"${bad}" → invalid_whatsapp`, () => {
      assert.equal(codeAt(setPath(full(), P, bad), P), "invalid_whatsapp");
    });
  }
  it("un número (no texto) → invalid_type", () => {
    assert.equal(codeAt(setPath(full(), P, 5491112345678), P), "invalid_type");
  });
  it("el mensaje explica el formato", () => {
    assert.match(errorAt(setPath(full(), P, "+54"), P).message, /d[ií]gitos/);
  });
});

describe("RF-21: teléfono", () => {
  const P = "contact.phone";
  for (const ok of ["+54 9 11 1234-5678", "(011) 4321-8765", "1234-5678", "123456789012345"]) {
    it(`"${ok}" es válido y se acepta tal cual`, () => expectValid(setPath(full(), P, ok)));
  }
  for (const bad of ["11 abcd 5678", "1234567", "1234567890123456", "+++", "11.1234.5678", "llamar al 12345678"]) {
    it(`"${bad}" → invalid_phone`, () => {
      assert.equal(codeAt(setPath(full(), P, bad), P), "invalid_phone");
    });
  }
});

describe("RF-22: email", () => {
  const P = "contact.email";
  const longEmail = (domainTail) =>
    `${"a".repeat(64)}@${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(domainTail)}.com`;
  it("254 caracteres es válido y 255 → invalid_email", () => {
    assert.equal(longEmail(57).length, 254);
    expectValid(setPath(full(), P, longEmail(57)));
    assert.equal(codeAt(setPath(full(), P, longEmail(58)), P), "invalid_email");
  });
  for (const ok of ["a@b.co", "hola@estudio-aurora.com.ar", "nombre.apellido+tag@dominio.org"]) {
    it(`"${ok}" es válido`, () => expectValid(setPath(full(), P, ok)));
  }
  for (const bad of ["sin-arroba", "a@", "@x.com", "a b@c.com", "a@b", "a@@b.com"]) {
    it(`"${bad}" → invalid_email`, () => {
      assert.equal(codeAt(setPath(full(), P, bad), P), "invalid_email");
    });
  }
});

describe("RF-23: ícono de servicio", () => {
  const P = "services[0].icon";
  const available = Object.keys(iconPaths);
  for (const icon of available) {
    it(`"${icon}" es un ícono disponible`, () => expectValid(setPath(full(), P, icon)));
  }
  for (const bad of ["Nope", "leaf", "Leaf ", ""]) {
    it(`"${bad}" → unknown_icon con la lista de íconos disponibles`, () => {
      const e = errorAt(setPath(full(), P, bad), P);
      assert.equal(e?.code, "unknown_icon");
      assert.deepEqual([...e.expected].sort(), [...available].sort());
    });
  }
  it("la lista del esquema coincide con las claves de icons.ts", () => {
    const e = errorAt(setPath(full(), P, "Nope"), P);
    assert.equal(e.expected.length, available.length);
  });
});

describe("RF-24: precio", () => {
  const P = "products[0].price";
  for (const ok of [0.01, 10.5, 1500, 19.99, 99999999.99]) {
    it(`${ok} es válido`, () => expectValid(setPath(full(), P, ok)));
  }
  const BAD = [
    [0, "price_not_positive"], [-1, "price_not_positive"], [-0.01, "price_not_positive"],
    [100000000, "price_too_high"], [1.234, "price_too_many_decimals"],
    ["1800", "invalid_type"], [Number.NaN, "invalid_type"], [Number.POSITIVE_INFINITY, "invalid_type"],
  ];
  for (const [bad, code] of BAD) {
    it(`${String(bad)} (${typeof bad}) → ${code}`, () => {
      assert.equal(codeAt(setPath(full(), P, bad), P), code);
    });
  }
});

describe("RF-25: valoración del testimonio", () => {
  const P = "testimonials[0].rating";
  for (const ok of [1, 2, 3, 4, 5]) it(`${ok} es válida`, () => expectValid(setPath(full(), P, ok)));
  for (const bad of [0, 6, 4.5, -1, 1.0001]) {
    it(`${bad} → invalid_rating`, () => assert.equal(codeAt(setPath(full(), P, bad), P), "invalid_rating"));
  }
});

describe("RF-29: identificador de producto (formato)", () => {
  const P = "products[0].id";
  for (const ok of ["a", "dulce-cayote", "p1", "3d-print", "a".repeat(60), "-"]) {
    it(`"${ok.slice(0, 20)}" (${ok.length}) es válido`, () => expectValid(setPath(full(), P, ok)));
  }
  for (const bad of ["Mayus", "con espacio", "a".repeat(61), "ñandú", "a_b", "", "a.b"]) {
    it(`"${bad.slice(0, 20)}" (${bad.length}) → invalid_id`, () => {
      assert.equal(codeAt(setPath(full(), P, bad), P), "invalid_id");
    });
  }
});

// ---------- RF-26, RF-27, RF-28: enlaces ----------
const urlOfLength = (n) => "https://example.com/" + "a".repeat(n - "https://example.com/".length);
const GOOD_URLS = [
  "https://example.com", "http://example.com/ruta?q=1#x", "HTTPS://EXAMPLE.COM",
  "https://localhost:4321/x", urlOfLength(2000),
];
const BAD_URLS = [
  "javascript:alert(1)", "data:text/html,x", "mailto:a@b.com", "tel:+5491112345678",
  "ftp://example.com", "https://user:pass@example.com", "https://exa mple.com",
  " https://example.com", "https://example.com ", "//example.com", "example.com",
  "https://", "", urlOfLength(2001),
];

describe("RF-26: URLs de imágenes, redes y botones (http/https)", () => {
  const URL_FIELDS = ["products[0].image", "social.instagram", "social.facebook", "hero.ctaPrimary.href", "hero.ctaSecondary.href"];
  for (const path of URL_FIELDS) {
    for (const ok of GOOD_URLS) {
      it(`${path}: "${ok.slice(0, 40)}" (${ok.length}) es válida`, () => expectValid(setPath(full(), path, ok)));
    }
    for (const bad of BAD_URLS) {
      it(`${path}: "${bad.slice(0, 40)}" (${bad.length}) → invalid_url`, () => {
        assert.equal(codeAt(setPath(full(), path, bad), path), "invalid_url");
      });
    }
  }
  it("una imagen no admite anclas internas", () => {
    assert.equal(codeAt(setPath(full(), "products[0].image", "#contacto"), "products[0].image"), "invalid_url");
  });
  it("una red social no admite anclas internas", () => {
    assert.equal(codeAt(setPath(full(), "social.instagram", "#contacto"), "social.instagram"), "invalid_url");
  });
});

describe("RF-27: anclas internas en botones (formato)", () => {
  it('"#a1-b2" tiene formato válido pero apunta a una sección inexistente → unknown_anchor, no invalid_anchor', () => {
    assert.equal(codeAt(setPath(full(), "hero.ctaPrimary.href", "#a1-b2"), "hero.ctaPrimary.href"), "unknown_anchor");
  });
  for (const path of ["hero.ctaPrimary.href", "hero.ctaSecondary.href"]) {
    for (const ok of ["#contacto", "#servicios", "#inicio"]) {
      it(`${path}: "${ok}" tiene formato válido`, () => expectValid(setPath(full(), path, ok)));
    }
    for (const bad of ["#", "#Contacto", "#con tacto", "# contacto", "#con_tacto", "#ñandú"]) {
      it(`${path}: "${bad}" → invalid_anchor`, () => {
        assert.equal(codeAt(setPath(full(), path, bad), path), "invalid_anchor");
      });
    }
  }
});

describe("RF-28: redes sociales", () => {
  it("solo Instagram y Facebook: otra red es un campo no previsto", () => {
    assert.equal(codeAt(setPath(full(), "social.tiktok", "https://tiktok.com/@x"), "social.tiktok"), "unrecognized_field");
    assert.equal(codeAt(setPath(full(), "social.twitter", "https://x.com/x"), "social.twitter"), "unrecognized_field");
  });
  it("no se valida el dominio: una URL ajena a la red es válida", () => {
    expectValid(setPath(full(), "social.instagram", "https://example.com/perfil"));
    expectValid(setPath(full(), "social.facebook", "https://fb.com/aurora"));
  });
});

// ---------- Reglas cruzadas (RF-10, RF-13, RF-14, RF-17, RF-29, RF-30) ----------
describe("RF-10: al menos un email o un teléfono", () => {
  it("sin email ni teléfono → error en contact", () => {
    const d = delPath(delPath(full(), "contact.email"), "contact.phone");
    assert.equal(codeAt(d, "contact"), "missing_contact_method");
  });
  it("con solo email o solo teléfono es válido", () => {
    expectValid(delPath(full(), "contact.phone"));
    expectValid(delPath(full(), "contact.email"));
  });
});

describe("RF-13: precio y categoría condicionales", () => {
  it("el catálogo muestra precios (por defecto) y falta el precio → required", () => {
    assert.equal(codeAt(delPath(full(), "products[0].price"), "products[0].price"), "required");
    const sinConfig = delPath(delPath(full(), "productGridConfig"), "products[0].price");
    assert.equal(codeAt(sinConfig, "products[0].price"), "required");
  });
  it("showPrice falso → el precio no se exige", () => {
    const d = setPath(delPath(full(), "products[0].price"), "productGridConfig.showPrice", false);
    expectValid(d);
  });
  it("showPrice falso con un precio inválido se rechaza igualmente", () => {
    const d = setPath(setPath(full(), "productGridConfig.showPrice", false), "products[0].price", -5);
    assert.equal(codeAt(d, "products[0].price"), "price_not_positive");
  });
  it("groupByCategory verdadero y falta la categoría → required", () => {
    const d = setPath(delPath(full(), "products[0].category"), "productGridConfig.groupByCategory", true);
    assert.equal(codeAt(d, "products[0].category"), "required");
  });
  it("groupByCategory falso o ausente → la categoría no se exige", () => {
    expectValid(delPath(full(), "products[0].category"));
  });
});

describe("RF-14: configuración del catálogo sin productos", () => {
  it("se acepta sin efecto", () => {
    expectValid(delPath(full(), "products"));
    expectValid(setPath(full(), "products", []));
  });
});

describe("RF-17: enlaces internos solo a secciones que existirán", () => {
  const BASE_ANCHORS = ["#contacto", "#inicio", "#nosotros", "#servicios"];
  for (const path of ["hero.ctaPrimary.href", "hero.ctaSecondary.href"]) {
    it(`${path}: #productos sin productos → unknown_anchor con las secciones disponibles`, () => {
      const d = setPath(delPath(full(), "products"), path, "#productos");
      const e = errorAt(d, path);
      assert.equal(e?.code, "unknown_anchor");
      assert.ok(Array.isArray(e.expected));
      assert.deepEqual([...e.expected].sort(), [...BASE_ANCHORS, "#testimonios"].sort());
    });
    it(`${path}: #productos con productos es válido`, () => {
      expectValid(setPath(full(), path, "#productos"));
    });
    it(`${path}: #testimonios sin testimonios → unknown_anchor`, () => {
      const d = setPath(delPath(full(), "testimonials"), path, "#testimonios");
      assert.equal(codeAt(d, path), "unknown_anchor");
    });
    it(`${path}: #testimonios con testimonios es válido`, () => {
      expectValid(setPath(full(), path, "#testimonios"));
    });
    it(`${path}: un ancla desconocida (#otra) → unknown_anchor`, () => {
      assert.equal(codeAt(setPath(full(), path, "#otra"), path), "unknown_anchor");
    });
    for (const a of BASE_ANCHORS) {
      it(`${path}: ${a} siempre es válido`, () => expectValid(setPath(full(), path, a)));
    }
  }
  it("las listas vacías cuentan como sección ausente", () => {
    const d = setPath(setPath(full(), "products", []), "hero.ctaPrimary.href", "#productos");
    assert.equal(codeAt(d, "hero.ctaPrimary.href"), "unknown_anchor");
  });
  it("las secciones disponibles dependen de los datos", () => {
    const d = setPath(delPath(delPath(full(), "products"), "testimonials"), "hero.ctaPrimary.href", "#otra");
    assert.deepEqual([...errorAt(d, "hero.ctaPrimary.href").expected].sort(), BASE_ANCHORS);
  });
});

describe("RF-29: identificadores únicos", () => {
  it("dos productos con el mismo id → duplicate_id en el segundo", () => {
    const products = makeProducts(3);
    products[2].id = products[0].id;
    const d = setPath(delPath(full(), "productGridConfig"), "products", products);
    assert.equal(codeAt(d, "products[2].id"), "duplicate_id");
  });
  it("ids distintos → válido", () => {
    expectValid(setPath(full(), "products", makeProducts(5)));
  });
});

describe("RF-30: categorías", () => {
  const withCategories = (cats) =>
    setPath(
      delPath(full(), "productGridConfig"),
      "products",
      cats.map((category, i) => ({ ...makeProducts(1)[0], id: `p-${i}`, category })),
    );
  it("12 categorías distintas son válidas y 13 → too_many_categories", () => {
    const cats = (n) => Array.from({ length: n }, (_, i) => `Categoría ${i}`);
    expectValid(withCategories(cats(12)));
    assert.equal(codeAt(withCategories(cats(13)), "products"), "too_many_categories");
  });
  it("categorías que difieren solo en mayúsculas o espacios → inconsistent_category", () => {
    assert.equal(codeAt(withCategories(["Cajas regalo", "cajas  regalo"]), "products[1].category"), "inconsistent_category");
    assert.equal(codeAt(withCategories(["Cajas regalo", " CAJAS REGALO "]), "products[1].category"), "inconsistent_category");
  });
  it("la misma categoría escrita igual en varios productos es válida", () => {
    expectValid(withCategories(["Cajas regalo", "Cajas regalo", "Dulces"]));
  });
});

describe("RF-5: los errores de campo y los cruzados salen juntos", () => {
  it("un tipo incorrecto y un error cruzado a la vez", () => {
    let d = setPath(full(), "hero.headline", 5);
    d = delPath(delPath(d, "contact.email"), "contact.phone");
    const r = validateSite(d);
    assert.ok(errorPaths(r).includes("hero.headline"));
    assert.ok(errorPaths(r).includes("contact"));
  });
  it("un campo desconocido y un ancla inexistente a la vez", () => {
    let d = setPath(full(), "extra", 1);
    d = setPath(d, "hero.ctaPrimary.href", "#otra");
    const r = validateSite(d);
    assert.ok(errorPaths(r).includes("extra"));
    assert.ok(errorPaths(r).includes("hero.ctaPrimary.href"));
  });
  it("datos degenerados no hacen fallar las reglas cruzadas", () => {
    for (const data of [
      { products: "x", contact: null, hero: 5, testimonials: 3, productGridConfig: [] },
      { products: [null, 5, "x"], contact: [], hero: { ctaPrimary: null } },
      { products: [{ id: 1, category: 2 }], productGridConfig: { groupByCategory: "sí" } },
    ]) {
      assert.doesNotThrow(() => validateSite(data));
      assert.equal(validateSite(data).ok, false);
    }
  });
});

// ---------- RF-14, RF-18: datos demo y valores por defecto ----------
describe("datos demo (src/content/site.data.json)", () => {
  const demo = () =>
    JSON.parse(readFileSync(new URL("../src/content/site.data.json", import.meta.url), "utf8"));

  it("existe y cumple el contrato 2.0", () => {
    const r = validateSite(demo());
    assert.equal(r.ok, true, schema.formatReport(r));
  });
  it("no trae el número de WhatsApp propio del catálogo (RF-18)", () => {
    assert.equal(demo().productGridConfig?.whatsappNumber, undefined);
    assert.ok(demo().contact.whatsapp);
  });
});

describe("RF-14: valores por defecto del catálogo (applyDefaults)", () => {
  const DEFAULT_CONFIG = { showPrice: true, ctaLabel: "Consultar por WhatsApp", groupByCategory: false };

  it("sin configuración: usa los valores por defecto", () => {
    const out = schema.applyDefaults(delPath(full(), "productGridConfig"));
    assert.deepEqual(out.productGridConfig, DEFAULT_CONFIG);
  });
  it("configuración parcial: respeta lo enviado y completa el resto", () => {
    const out = schema.applyDefaults(setPath(full(), "productGridConfig", { showPrice: false }));
    assert.deepEqual(out.productGridConfig, { ...DEFAULT_CONFIG, showPrice: false });
  });
  it("configuración completa: no cambia nada", () => {
    const cfg = { showPrice: false, ctaLabel: "Pedir", groupByCategory: true };
    assert.deepEqual(schema.applyDefaults(setPath(full(), "productGridConfig", cfg)).productGridConfig, cfg);
  });
  it("lo ausente equivale a vacío: listas [] y redes {}", () => {
    const out = schema.applyDefaults(MIN());
    assert.deepEqual(out.testimonials, []);
    assert.deepEqual(out.products, []);
    assert.deepEqual(out.about.highlights, []);
    assert.deepEqual(out.social, {});
  });
  it("no inventa ni cambia ningún otro dato y no muta la entrada", () => {
    const input = full();
    const before = structuredClone(input);
    const out = schema.applyDefaults(input);
    assert.deepEqual(input, before);
    for (const key of ["name", "tagline", "description", "hero", "contact", "services", "testimonials", "products", "social"]) {
      assert.deepEqual(out[key], before[key], `"${key}" no debe cambiar`);
    }
    assert.deepEqual(out.about, before.about);
  });
});

// ---------- RF-1, RF-3, RF-7: script de validación (CLI) ----------
describe("validate-site (línea de comandos)", () => {
  const ROOT = fileURLToPath(new URL("..", import.meta.url));
  const SCRIPT = join(ROOT, "scripts", "validate-site.mjs");
  const NODE_FLAGS = ["--experimental-strip-types", "--disable-warning=ExperimentalWarning"];
  const dir = mkdtempSync(join(tmpdir(), "site-cli-"));

  const writeJson = (name, data) => {
    const file = join(dir, name);
    writeFileSync(file, typeof data === "string" ? data : JSON.stringify(data));
    return file;
  };
  const run = (args = [], env = {}) => {
    const base = { ...process.env };
    delete base.SITE_DATA;
    return spawnSync(process.execPath, [...NODE_FLAGS, SCRIPT, ...args], {
      cwd: ROOT,
      env: { ...base, ...env },
      encoding: "utf8",
    });
  };

  const invalid = () => {
    let d = delPath(full(), "hero.headline");
    d = setPath(d, "services[0].title", 5);
    return setPath(d, "extra", 1);
  };

  it("RF-1: datos válidos → salida 0 y lo indica", () => {
    const r = run([writeJson("ok.json", full())]);
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /v[aá]lidos/);
  });
  it("RF-1: datos inválidos → salida 1 con la lista completa de errores", () => {
    const r = run([writeJson("bad.json", invalid())]);
    assert.equal(r.status, 1, r.stderr);
    for (const p of ["hero.headline", "services[0].title", "extra"]) {
      assert.ok(r.stdout.includes(p), `la salida debe incluir ${p}:\n${r.stdout}`);
    }
  });
  it("RF-3, RF-7: el texto es idéntico al de la API (formatReport)", () => {
    const data = invalid();
    const r = run([writeJson("same.json", data)]);
    assert.equal(r.stdout.trim(), schema.formatReport(validateSite(data)).trim());
  });
  it("RF-3, RF-7: --json entrega el mismo informe que la API", () => {
    const data = invalid();
    const r = run([writeJson("json.json", data), "--json"]);
    assert.equal(r.status, 1);
    assert.deepEqual(JSON.parse(r.stdout), validateSite(data));
  });
  it("--json con datos válidos → salida 0 e informe ok", () => {
    const r = run([writeJson("okjson.json", full()), "--json"]);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(JSON.parse(r.stdout).ok, true);
  });
  it("sin argumentos valida los datos por defecto (demo válido) → salida 0", () => {
    const r = run([]);
    assert.equal(r.status, 0, r.stdout + r.stderr);
  });
  it("respeta SITE_DATA cuando no hay argumento", () => {
    const r = run([], { SITE_DATA: writeJson("env-bad.json", invalid()) });
    assert.equal(r.status, 1);
    assert.ok(r.stdout.includes("hero.headline"));
  });
  it("el argumento tiene prioridad sobre SITE_DATA", () => {
    const good = writeJson("arg-good.json", full());
    const r = run([good], { SITE_DATA: writeJson("env-bad2.json", invalid()) });
    assert.equal(r.status, 0, r.stdout + r.stderr);
  });
  it("archivo inexistente → salida 2 con mensaje en español (no es un error de datos)", () => {
    const r = run([join(dir, "no-existe.json")]);
    assert.equal(r.status, 2);
    assert.match(r.stderr, /No se pudo leer/);
  });
  it("JSON mal formado → salida 2 con mensaje en español", () => {
    const r = run([writeJson("roto.json", "{ no es json")]);
    assert.equal(r.status, 2);
    assert.match(r.stderr, /JSON/);
  });
  it("no ejecuta nada del archivo de datos y no lo modifica", () => {
    const file = writeJson("intacto.json", invalid());
    const before = readFileSync(file, "utf8");
    run([file]);
    assert.equal(readFileSync(file, "utf8"), before);
  });

  // Limpieza de los archivos temporales al terminar el grupo.
  it("limpieza", () => rmSync(dir, { recursive: true, force: true }));
});

// ---------- RF-35, RF-36: documentación del contrato ----------
describe("RF-35, RF-36: documentación generada desde el esquema", () => {
  const docsDir = new URL("../docs/", import.meta.url);
  const committed = (name) => readFileSync(new URL(name, docsDir), "utf8");
  const generator = () => import("./export-schema.mjs");

  it("docs/site.schema.json coincide con lo que genera el esquema", async () => {
    const { renderSchemaJson } = await generator();
    // Tolera CRLF frente a LF (git en Windows puede bajar el archivo con CRLF); cualquier otra diferencia falla.
    const problem = compareDocument("docs/site.schema.json", committed("site.schema.json"), renderSchemaJson());
    assert.equal(problem, null, problem ?? undefined);
  });
  it("docs/site-schema.md coincide con lo que genera el esquema", async () => {
    const { renderSchemaMarkdown } = await generator();
    const problem = compareDocument("docs/site-schema.md", committed("site-schema.md"), renderSchemaMarkdown());
    assert.equal(problem, null, problem ?? undefined);
  });

  it("todo campo del esquema tiene descripción (RF-35)", () => {
    const json = JSON.parse(committed("site.schema.json"));
    const missing = [];
    const walk = (node, prefix) => {
      for (const [key, sub] of Object.entries(node.properties ?? {})) {
        const isList = sub.type === "array";
        const path = prefix ? `${prefix}.${key}` : key;
        if (!sub.description) missing.push(path);
        const child = isList ? sub.items : sub;
        if (child?.properties) walk(child, isList ? `${path}[]` : path);
      }
    };
    walk(json, "");
    assert.deepEqual(missing, [], `campos sin descripción: ${missing.join(", ")}`);
  });

  it("el JSON Schema refleja obligatoriedad y límites de listas", () => {
    const json = JSON.parse(committed("site.schema.json"));
    assert.equal(json.additionalProperties, false);
    for (const key of ["name", "tagline", "description", "hero", "about", "contact", "services"]) {
      assert.ok(json.required.includes(key), `"${key}" debe ser obligatorio`);
    }
    for (const key of ["social", "testimonials", "products", "productGridConfig"]) {
      assert.ok(!json.required.includes(key), `"${key}" debe ser opcional`);
    }
    assert.equal(json.properties.services.minItems, 1);
    assert.equal(json.properties.services.maxItems, 8);
    assert.equal(json.properties.testimonials.maxItems, 9);
    assert.equal(json.properties.products.maxItems, 60);
    assert.equal(json.properties.about.properties.highlights.maxItems, 5);
  });

  it("el Markdown declara la versión, el registro de cambios y que los datos no llevan versión", () => {
    const md = committed("site-schema.md");
    assert.ok(md.includes(`Versión del contrato: ${schema.SCHEMA_VERSION}`));
    assert.equal(schema.SCHEMA_VERSION, "2.3");
    for (const entry of schema.CHANGELOG) {
      assert.ok(md.includes(`### ${entry.version}`), `falta la versión ${entry.version} en el registro de cambios`);
      for (const change of entry.changes) assert.ok(md.includes(change), `falta el cambio: ${change}`);
    }
    assert.match(md, /no llevan (un campo de )?versi[oó]n/);
  });

  it("el Markdown documenta las reglas entre campos y todos los códigos de error", () => {
    const md = committed("site-schema.md");
    for (const code of ["missing_contact_method", "duplicate_id", "inconsistent_category", "too_many_categories", "unknown_anchor"]) {
      assert.ok(md.includes(code), `el Markdown debe mencionar ${code}`);
    }
    assert.ok(Array.isArray(schema.ERROR_CODES) && schema.ERROR_CODES.length > 0);
    for (const { code, meaning } of schema.ERROR_CODES) {
      assert.ok(md.includes(`\`${code}\``), `falta el código ${code}`);
      assert.ok(meaning && meaning.length > 0, `el código ${code} necesita significado`);
    }
  });

  it("todos los códigos que emite el validador están documentados", () => {
    const documented = new Set(schema.ERROR_CODES.map((e) => e.code));
    let d = delPath(full(), "name");
    d = setPath(d, "extra", 1);
    d = setPath(d, "productGridConfig.whatsappNumber", "1");
    d = setPath(d, "contact.whatsapp", "x");
    d = setPath(d, "services[0].icon", "Nope");
    d = delPath(delPath(d, "contact.email"), "contact.phone");
    d = setPath(d, "hero.ctaPrimary.href", "#otra");
    d = setPath(d, "products", [{ ...makeProducts(1)[0], id: "A", price: -1 }, makeProducts(1)[0], makeProducts(1)[0]]);
    for (const e of validateSite(d).errors) {
      assert.ok(documented.has(e.code), `el código ${e.code} no está en ERROR_CODES`);
    }
  });

  it("RF-36: los datos no llevan versión (un campo `version` es un campo no previsto)", () => {
    assert.equal(codeAt(setPath(full(), "version", "2.0"), "version"), "unrecognized_field");
    assert.equal(codeAt(setPath(full(), "schemaVersion", "2.0"), "schemaVersion"), "unrecognized_field");
  });
});

// ---------- Spec 012: fixtures de la tarjeta de cifras ----------
describe("spec 012: fixtures de cifras (1, 2 y 3 cifras, de largo normal y en los límites)", () => {
  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  const length = (text) => [...segmenter.segment(text)].length;
  const CASES = [
    ["site.stats.one.json", 1, false],
    ["site.stats.two.json", 2, false],
    ["site.stats.two-limits.json", 2, true],
    ["site.stats.three-limits.json", 3, true],
  ];

  for (const [file, count, limits] of CASES) {
    it(`${file} es válido y tiene ${count} cifra(s) ${limits ? "en los límites" : "de largo normal"}`, () => {
      const data = load(file);
      expectValid(data, file);
      const stats = data.about.stats;
      assert.equal(stats.length, count);
      if (limits) {
        for (const s of stats) {
          assert.equal(length(s.value), 10, `valor de 10 caracteres: ${s.value}`);
          assert.equal(length(s.label), 40, `etiqueta de 40 caracteres: ${s.label}`);
        }
      } else {
        for (const s of stats) assert.ok(length(s.value) <= 6, `valor corto: ${s.value}`);
      }
    });
  }

  it("la segunda cifra de two-limits combina un valor con espacios y una etiqueta sin espacios", () => {
    const [, second] = load("site.stats.two-limits.json").about.stats;
    assert.equal(length(second.value), 10);
    assert.match(second.value, /\s/);
    assert.equal(length(second.label), 40);
    assert.doesNotMatch(second.label, /\s/);
  });

  it("la primera cifra de two-limits es un valor de 10 caracteres sin espacios con una etiqueta de 40", () => {
    const [first] = load("site.stats.two-limits.json").about.stats;
    assert.equal(length(first.value), 10);
    assert.doesNotMatch(first.value, /\s/);
    assert.equal(length(first.label), 40);
  });
});
