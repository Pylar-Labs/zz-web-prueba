// Tests de la moneda y del formato de precio (spec 006): campo `productGridConfig.currency`, regla de
// decimales por moneda, valores por defecto, formato exacto de las 27 combinaciones y documentación.
// Ejecutar: node --test scripts/site-currency.test.mjs   (o: npm run test:schema)
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import * as schema from "../src/content/site.schema.ts";
import { CURRENCIES, CURRENCY_DECIMALS, formatPrice } from "../src/content/price-format.ts";

const { validateSite, applyDefaults, formatReport } = schema;

// ---------- Ayudantes ----------
const load = (name) => JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8"));
const doc = (name) => readFileSync(fileURLToPath(new URL(`../docs/${name}`, import.meta.url)), "utf8");
const MIN = () => load("site.min.json");
const MAX = () => load("site.max.json");

const product = (id, price) => ({ id, name: `Producto ${id}`, description: "Descripción.", image: "https://placehold.co/400x300", price });
// Datos mínimos con productos y una configuración del catálogo.
const catalog = ({ config, prices = [100], language } = {}) => {
  const data = MIN();
  data.products = prices.map((price, i) => product(`p${i + 1}`, price));
  if (config !== undefined) data.productGridConfig = config;
  if (language !== undefined) data.language = language;
  return data;
};
const withCurrency = (currency, prices = [100], extra = {}) => catalog({ config: { currency, ...extra }, prices });

const errorsOf = (data) => validateSite(data).errors;
const find = (errors, path, code) => errors.find((e) => e.path === path && e.code === code);
const CURRENCY_PATH = "productGridConfig.currency";

function assertValid(data, label = "datos") {
  const r = validateSite(data);
  assert.equal(r.ok, true, `${label} deberían ser válidos: ${formatReport(r)}`);
}

const NB = " ";
const un = (s) => s.replaceAll("␣", NB);
const LANGS = ["es", "en", "pt"];
const decimalsOf = (c) => (c === "CLP" || c === "COP" ? 0 : 2);

// Tabla aprobada en el plan 006 (RF-15). [español, inglés, portugués]; el espacio no separable se escribe ␣.
const TYPICAL = {
  ARS: ["$␣1.800,50", "ARS␣1,800.50", "ARS␣1.800,50"], USD: ["US$␣1.800,50", "$1,800.50", "US$␣1.800,50"],
  EUR: ["EUR␣1.800,50", "€1,800.50", "€␣1.800,50"], BRL: ["BRL␣1.800,50", "R$1,800.50", "R$␣1.800,50"],
  MXN: ["$1,800.50", "MX$1,800.50", "MX$␣1.800,50"], CLP: ["$1.800", "CLP␣1,800", "CLP␣1.800"],
  COP: ["$␣1.800", "COP␣1,800", "COP␣1.800"], PEN: ["S/␣1,800.50", "PEN␣1,800.50", "PEN␣1.800,50"],
  UYU: ["$␣1.800,50", "UYU␣1,800.50", "UYU␣1.800,50"],
};
const MAXIMUM = {
  ARS: ["$␣99.999.999,99", "ARS␣99,999,999.99", "ARS␣99.999.999,99"], USD: ["US$␣99.999.999,99", "$99,999,999.99", "US$␣99.999.999,99"],
  EUR: ["EUR␣99.999.999,99", "€99,999,999.99", "€␣99.999.999,99"], BRL: ["BRL␣99.999.999,99", "R$99,999,999.99", "R$␣99.999.999,99"],
  MXN: ["$99,999,999.99", "MX$99,999,999.99", "MX$␣99.999.999,99"], CLP: ["$99.999.999", "CLP␣99,999,999", "CLP␣99.999.999"],
  COP: ["$␣99.999.999", "COP␣99,999,999", "COP␣99.999.999"], PEN: ["S/␣99,999,999.99", "PEN␣99,999,999.99", "PEN␣99.999.999,99"],
  UYU: ["$␣99.999.999,99", "UYU␣99,999,999.99", "UYU␣99.999.999,99"],
};
const MINIMUM = { ARS: ["$␣0,01", "ARS␣0.01", "ARS␣0,01"], USD: ["US$␣0,01", "$0.01", "US$␣0,01"], CLP: ["$1", "CLP␣1", "CLP␣1"] };

// ---------- RF-1: las nueve monedas ----------
describe("RF-1: campo `productGridConfig.currency`", () => {
  it("las monedas incluidas son exactamente las nueve", () => {
    assert.deepEqual([...CURRENCIES], ["ARS", "USD", "EUR", "BRL", "MXN", "CLP", "COP", "PEN", "UYU"]);
  });
  for (const currency of ["ARS", "USD", "EUR", "BRL", "MXN", "CLP", "COP", "PEN", "UYU"]) {
    it(`"${currency}" es válido`, () => assertValid(withCurrency(currency, [decimalsOf(currency) === 0 ? 1800 : 1800.5])));
  }
  it("sin el campo es válido (datos 2.2 y anteriores)", () => {
    assertValid(MIN());
    assertValid(MAX());
    assertValid(catalog({ config: { showPrice: true }, prices: [1800.5] }));
  });
});

// ---------- RF-3: texto fuera de la lista ----------
describe("RF-3: moneda no incluida", () => {
  for (const bad of ["ars", "JPY", " USD", "USD ", "Usd", "", "US$", "dólar", "XXX"]) {
    it(`${JSON.stringify(bad)} → unknown_currency en la moneda, con las nueve válidas`, () => {
      const r = validateSite(withCurrency(bad));
      assert.equal(r.ok, false);
      const error = find(r.errors, CURRENCY_PATH, "unknown_currency");
      assert.ok(error, `salió ${JSON.stringify(r.errors.map((e) => `${e.path}:${e.code}`))}`);
      assert.deepEqual(error.expected, [...CURRENCIES]);
      assert.match(error.message, /currency/);
    });
  }
  it("no corrige el valor: la entrada queda igual", () => {
    const data = withCurrency("ars");
    const copy = structuredClone(data);
    validateSite(data);
    assert.deepEqual(data, copy);
  });
  it("formatReport lista las monedas permitidas", () => {
    assert.match(formatReport(validateSite(withCurrency("JPY"))), /ARS, USD, EUR, BRL, MXN, CLP, COP, PEN, UYU/);
  });
});

// ---------- RF-4: tipo equivocado ----------
describe("RF-4: moneda que no es un texto", () => {
  for (const bad of [null, 5, 0, true, [], ["USD"], {}, { code: "USD" }]) {
    it(`${JSON.stringify(bad)} → invalid_type`, () => {
      const errors = errorsOf(withCurrency(bad));
      assert.ok(find(errors, CURRENCY_PATH, "invalid_type"), `salió ${JSON.stringify(errors.map((e) => `${e.path}:${e.code}`))}`);
      assert.equal(find(errors, CURRENCY_PATH, "unknown_currency"), undefined);
    });
  }
});

// ---------- RF-2, RF-5: valor por defecto ----------
describe("RF-2, RF-5: ARS por defecto, y sin productos no hay efecto", () => {
  it("sin moneda y sin configuración del catálogo, la moneda resuelta es ARS", () => {
    assert.equal(applyDefaults(MIN()).currency, "ARS");
    assert.equal(applyDefaults(catalog()).currency, "ARS");
  });
  it("con configuración pero sin moneda, es ARS", () => {
    assert.equal(applyDefaults(catalog({ config: { showPrice: true } })).currency, "ARS");
  });
  it("con moneda, es esa moneda", () => {
    assert.equal(applyDefaults(withCurrency("CLP", [1800])).currency, "CLP");
  });
  it("la configuración resuelta del catálogo no gana ninguna clave nueva", () => {
    const resolved = applyDefaults(withCurrency("USD")).productGridConfig;
    assert.deepEqual(Object.keys(resolved).sort(), ["ctaLabel", "groupByCategory", "showPrice"]);
  });
  it("una moneda sin productos es válida y sin efecto", () => {
    const data = MIN();
    data.productGridConfig = { currency: "CLP" };
    assertValid(data);
    assert.equal(applyDefaults(data).currency, "CLP");
  });
});

// ---------- RF-10: decimales por moneda ----------
describe("RF-10: un precio con decimales en una moneda que no los usa", () => {
  for (const currency of ["CLP", "COP"]) {
    it(`${currency} con 1800.5 → price_currency_decimals en la ruta del precio, con la moneda en el mensaje`, () => {
      const errors = errorsOf(withCurrency(currency, [1800, 1800.5]));
      const error = find(errors, "products[1].price", "price_currency_decimals");
      assert.ok(error, `salió ${JSON.stringify(errors.map((e) => `${e.path}:${e.code}`))}`);
      assert.ok(error.message.includes(currency), "el mensaje nombra la moneda");
      assert.equal(find(errors, "products[0].price", "price_currency_decimals"), undefined, "el entero es válido");
    });
    it(`${currency} se comprueba también con los precios ocultos`, () => {
      const errors = errorsOf(withCurrency(currency, [1800.5], { showPrice: false }));
      assert.ok(find(errors, "products[0].price", "price_currency_decimals"));
    });
    it(`${currency} con un entero, o con ruido de coma flotante, es válido`, () => {
      assertValid(withCurrency(currency, [1800]));
      assertValid(withCurrency(currency, [1800.0000001]));
    });
    it(`${currency} con 1.005 da solo el error de "más de 2 decimales", sin duplicar`, () => {
      const codes = errorsOf(withCurrency(currency, [1.005])).filter((e) => e.path === "products[0].price").map((e) => e.code);
      assert.deepEqual(codes, ["price_too_many_decimals"]);
    });
  }
  for (const currency of ["ARS", "USD", "EUR", "BRL", "MXN", "PEN", "UYU"]) {
    it(`${currency} admite hasta 2 decimales`, () => {
      assertValid(withCurrency(currency, [1800.5, 0.01, 99999999.99]));
      assert.ok(find(errorsOf(withCurrency(currency, [1.005])), "products[0].price", "price_too_many_decimals"));
    });
  }
  it("sin moneda (ARS) un precio con 2 decimales es válido", () => assertValid(catalog({ prices: [1800.5] })));
  it("el ruido de coma flotante en una moneda con decimales sigue siendo válido", () => {
    assertValid(withCurrency("USD", [0.30000000000000004, 19.989999999999998]));
  });
});

// ---------- RF-14: forma de los errores ----------
describe("RF-14: los errores nuevos se suman a los demás en una lista", () => {
  it("moneda inválida más precio con decimales → solo el error de la moneda", () => {
    const codes = errorsOf(withCurrency("JPY", [1800.5])).map((e) => `${e.path}:${e.code}`);
    assert.ok(codes.includes(`${CURRENCY_PATH}:unknown_currency`));
    assert.equal(codes.some((c) => c.endsWith("price_currency_decimals")), false);
  });
  it("errores de moneda y de otros campos salen juntos y con la forma de siempre", () => {
    const data = withCurrency("CLP", [1800.5]);
    delete data.name;
    data.extra = 1;
    const r = validateSite(data);
    const codes = r.errors.map((e) => `${e.path}:${e.code}`);
    for (const expected of ["name:required", "extra:unrecognized_field", "products[0].price:price_currency_decimals"]) {
      assert.ok(codes.includes(expected), `falta ${expected}; salió ${JSON.stringify(codes)}`);
    }
    for (const e of r.errors) {
      assert.match(e.code, /^[a-z_]+$/);
      assert.ok(e.message.length > 0 && typeof e.path === "string");
    }
  });
  it("los dos códigos nuevos están documentados y la regla también", () => {
    const codes = schema.ERROR_CODES.map((e) => e.code);
    assert.ok(codes.includes("unknown_currency") && codes.includes("price_currency_decimals"));
    assert.ok(schema.CROSS_RULES.some((r) => r.code === "price_currency_decimals"));
  });
});

// ---------- RF-6, RF-7, RF-8: el formato exacto ----------
describe("RF-6, RF-7, RF-8: formatPrice con la tabla aprobada", () => {
  for (const currency of ["ARS", "USD", "EUR", "BRL", "MXN", "CLP", "COP", "PEN", "UYU"]) {
    LANGS.forEach((language, i) => {
      it(`${currency} en ${language}: típico y máximo`, () => {
        const typical = decimalsOf(currency) === 0 ? 1800 : 1800.5;
        const max = decimalsOf(currency) === 0 ? 99999999 : 99999999.99;
        assert.equal(formatPrice(typical, currency, language), un(TYPICAL[currency][i]));
        assert.equal(formatPrice(max, currency, language), un(MAXIMUM[currency][i]));
      });
    });
  }
  for (const [currency, row] of Object.entries(MINIMUM)) {
    it(`${currency}: precio mínimo en los tres idiomas`, () => {
      LANGS.forEach((language, i) => assert.equal(formatPrice(decimalsOf(currency) === 0 ? 1 : 0.01, currency, language), un(row[i])));
    });
  }
  it("un precio entero lleva dos decimales en las monedas que los usan y ninguno en CLP y COP", () => {
    assert.equal(formatPrice(1800, "ARS", "es"), un("$␣1.800,00"));
    assert.equal(formatPrice(1800, "USD", "en"), "$1,800.00");
    assert.equal(formatPrice(1800, "CLP", "es"), "$1.800");
    assert.equal(formatPrice(1800, "COP", "pt"), un("COP␣1.800"));
  });
  it("el símbolo no se confunde: pesos argentinos en inglés salen como ARS, no como dólar", () => {
    assert.ok(formatPrice(1800.5, "ARS", "en").startsWith("ARS"));
    assert.notEqual(formatPrice(1800.5, "ARS", "en")[0], "$");
  });
  it("símbolo y número no se parten: nunca hay un espacio normal, solo el no separable", () => {
    for (const c of CURRENCIES) for (const l of LANGS) assert.equal(formatPrice(1800, c, l).includes(" "), false, `${c}/${l}`);
  });
  it("el espacio no separable (U+00A0) aparece donde la tabla lo marca", () => {
    for (const c of CURRENCIES) LANGS.forEach((l, i) => assert.equal(formatPrice(1800.5, c, l).includes(NB), TYPICAL[c][i].includes("␣"), `${c}/${l}`));
  });
  it("el texto más ancho mide 17 caracteres (USD en español; ARS en inglés y portugués)", () => {
    for (const l of LANGS) {
      const widest = Math.max(...CURRENCIES.map((c) => formatPrice(decimalsOf(c) === 0 ? 99999999 : 99999999.99, c, l).length));
      assert.equal(widest, 17, l);
    }
  });
});

// ---------- RF-7, RF-9: decimales y no redondeo ----------
describe("RF-7, RF-9: decimales por moneda y nada de redondeo", () => {
  it("la tabla de decimales coincide con lo que informa la plataforma", () => {
    for (const c of CURRENCIES) {
      const real = new Intl.NumberFormat("en-US", { style: "currency", currency: c }).resolvedOptions().maximumFractionDigits;
      assert.equal(CURRENCY_DECIMALS[c], real, c);
    }
  });
  it("CLP y COP no tienen decimales y el resto tiene 2", () => {
    for (const c of CURRENCIES) assert.equal(CURRENCY_DECIMALS[c], decimalsOf(c), c);
  });
  it("el ruido de coma flotante no cambia el valor mostrado", () => {
    assert.equal(formatPrice(0.30000000000000004, "ARS", "es"), un("$␣0,30"));
    assert.equal(formatPrice(19.989999999999998, "USD", "en"), "$19.99");
  });
  it("los dígitos mostrados son exactamente los del precio (sin redondear)", () => {
    for (const price of [0.01, 0.1, 0.29, 1.1, 19.99, 1234.56, 99999999.99, 5000, 0.05]) {
      for (const l of LANGS) {
        const digits = formatPrice(price, "USD", l).replace(/\D/g, "");
        assert.equal(Number(digits), Math.round(price * 100), `${price} en ${l}`);
      }
    }
  });
});

// ---------- RF-12, RF-13: contrato 2.3 y documentación ----------
describe("RF-12, RF-13: contrato 2.3", () => {
  it("la versión es 2.3 y el registro de cambios abre con ella", () => {
    assert.equal(schema.SCHEMA_VERSION, "2.3");
    assert.equal(schema.CHANGELOG[0].version, "2.3");
    for (const old of ["2.2", "2.1", "2.0", "1.0"]) assert.ok(schema.CHANGELOG.some((c) => c.version === old), `se conserva la ${old}`);
  });
  it("el JSON Schema lista las nueve monedas y deja el campo opcional", () => {
    const json = JSON.parse(doc("site.schema.json"));
    const node = json.properties.productGridConfig.properties.currency;
    assert.deepEqual(node.enum, [...CURRENCIES]);
    assert.ok(node.description?.length > 20);
    assert.ok(!(json.properties.productGridConfig.required ?? []).includes("currency"));
  });
  it("el Markdown declara 2.3, el campo, los dos errores y la regla", () => {
    const md = doc("site-schema.md");
    assert.ok(md.includes("Versión del contrato: 2.3"));
    assert.ok(md.includes("`productGridConfig.currency`"));
    assert.ok(md.includes("unknown_currency"));
    assert.ok(md.includes("price_currency_decimals"));
  });
  it("la descripción del precio ya no dice que se muestra con el símbolo $ y formato argentino", () => {
    const md = doc("site-schema.md");
    const row = md.split("\n").find((line) => line.startsWith("| `products[].price`"));
    assert.ok(row, "falta la fila del precio");
    assert.equal(/símbolo \$/.test(row), false);
    assert.equal(/formato argentino/.test(row), false);
  });
});

// ---------- RF-17, RF-18: datos de ejemplo ----------
describe("RF-17, RF-18: datos de ejemplo con precios", () => {
  const fixtures = [
    ["site.price.usd.es.json", "es", "USD", [0.01, 1800.5, 99999999.99]],
    ["site.price.ars.en.json", "en", "ARS", [0.01, 1800.5, 99999999.99]],
    ["site.price.ars.pt.json", "pt", "ARS", [0.01, 1800.5, 99999999.99]],
    ["site.price.clp.es.json", "es", "CLP", [1, 1800, 99999999]],
    ["site.price.mxn.es.json", "es", "MXN", [0.01, 1800.5, 99999999.99]],
  ];
  for (const [name, language, currency, prices] of fixtures) {
    it(`${name}: válido, ${language}, ${currency} y sus tres precios`, () => {
      const data = load(name);
      assertValid(data, name);
      assert.equal(data.language, language);
      assert.equal(data.productGridConfig.currency, currency);
      assert.deepEqual(data.products.map((p) => p.price), prices);
    });
  }
  it("los precios de los fixtures se muestran con el texto de la tabla", () => {
    assert.equal(formatPrice(99999999.99, "USD", "es"), un(MAXIMUM.USD[0]));
    assert.equal(formatPrice(99999999.99, "ARS", "en"), un(MAXIMUM.ARS[1]));
    assert.equal(formatPrice(99999999.99, "ARS", "pt"), un(MAXIMUM.ARS[2]));
    assert.equal(formatPrice(99999999, "CLP", "es"), un(MAXIMUM.CLP[0]));
    assert.equal(formatPrice(99999999.99, "MXN", "es"), un(MAXIMUM.MXN[0]));
  });
});
