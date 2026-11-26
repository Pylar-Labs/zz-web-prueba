// Esquema del contrato de datos del sitio (spec 001). Fuente de verdad de campos, reglas y versión.
// Nota: este archivo lo importan también scripts de Node (type stripping): solo `import type`,
// extensiones `.ts` en rutas relativas, sin enums ni alias `@/`.
import { z } from "astro/zod";
import { iconPaths } from "../lib/icons.ts";
import { LANGUAGES, UI_TEXT } from "./ui-text.ts";
import type { Language } from "./ui-text.ts";
import { CURRENCIES, CURRENCY_DECIMALS } from "./price-format.ts";
import type { Currency } from "./price-format.ts";

export const SCHEMA_VERSION = "2.3";

export const CHANGELOG: { version: string; changes: string[] }[] = [
  {
    version: "2.3",
    changes: [
      "Nuevo campo opcional `productGridConfig.currency`: la moneda de los precios del catálogo (`ARS`, `USD`, `EUR`, `BRL`, `MXN`, `CLP`, `COP`, `PEN` o `UYU`, escritos exactos). Sin el campo se usa `ARS`. Un valor que no sea uno de los nueve se rechaza con el error `unknown_currency`, que lista las monedas permitidas.",
      "El precio se muestra con el formato estándar de la moneda en el idioma de la web (antes: siempre `$` y formato argentino), siempre con los decimales de la moneda. Esto cambia el aspecto de los precios de las webs ya generadas.",
      "CLP y COP no usan decimales: un precio con decimales en esas monedas se rechaza con el error `price_currency_decimals`, también si los precios están ocultos.",
      "Compatible con la 2.2, la 2.1 y la 2.0: los datos válidos en esas versiones siguen siéndolo.",
    ],
  },
  {
    version: "2.2",
    changes: [
      "Nuevo campo opcional `language` en la raíz: `es`, `en` o `pt` (portugués de Brasil). Toda la interfaz fija (menú, formulario, botones, pie, tarjetas de contacto, `aria-label`, mensajes de WhatsApp, títulos neutros de sección y etiqueta por defecto del botón de producto) sale en ese idioma.",
      "Sin `language` se usa `es`, y la web es la misma de antes. Un valor que no sea uno de los tres se rechaza con el error `unknown_language`, que lista los valores permitidos.",
      "Compatible con la 2.1 y la 2.0: los datos válidos en esas versiones siguen siéndolo. El contenido del cliente no se traduce y no depende de `language`.",
    ],
  },
  {
    version: "2.1",
    changes: [
      "Nuevo campo opcional `about.stats`: de 0 a 3 cifras de \"Quiénes somos\", cada una con `value` (hasta 10 caracteres) y `label` (hasta 40). Reemplaza las cifras que el template traía escritas.",
      "Nuevo campo opcional `sections`: título (hasta 80 caracteres) y subtítulo (hasta 200) de las secciones de servicios, productos, testimonios y contacto. Sin título se muestra uno neutro (\"Servicios\", \"Productos\", \"Testimonios\" o \"Contacto\"); sin subtítulo no se muestra ninguno.",
      "Compatible con la 2.0: los datos válidos en la 2.0 siguen siéndolo, pero ya no muestran las cifras ni los subtítulos que antes traía el template.",
    ],
  },
  {
    version: "2.0",
    changes: [
      "Los datos pasan de un módulo TypeScript a un archivo JSON validado por este esquema.",
      "Se retira el número de WhatsApp propio del catálogo: el catálogo usa el de contacto.",
      "Productos y configuración del catálogo pasan a ser opcionales.",
      "Se rechazan los campos no previstos y se aplican reglas de formato y límites.",
    ],
  },
  {
    version: "1.0",
    changes: ["Forma original: datos como módulo TypeScript sin validación."],
  },
];

// Campos que existieron en versiones anteriores y ya no forman parte del contrato.
const REMOVED_FIELDS: Record<string, string> = {
  "productGridConfig.whatsappNumber":
    'El campo "productGridConfig.whatsappNumber" fue eliminado en la versión 2.0: el catálogo usa el WhatsApp de contacto (contact.whatsapp).',
};

// Códigos de error estables que puede devolver la validación (RF-6). Se publican en la documentación.
export const ERROR_CODES: { code: string; meaning: string }[] = [
  { code: "required", meaning: "Falta un campo obligatorio." },
  { code: "invalid_type", meaning: "El valor no es del tipo esperado (texto, número, lista, objeto o verdadero/falso)." },
  { code: "empty", meaning: "Texto vacío o solo con espacios." },
  { code: "too_long", meaning: "Texto más largo que el máximo permitido." },
  { code: "line_break", meaning: "Salto de línea donde solo se admite una línea." },
  { code: "too_few", meaning: "Lista con menos elementos que el mínimo." },
  { code: "too_many", meaning: "Lista con más elementos que el máximo." },
  { code: "unrecognized_field", meaning: "Campo que no forma parte del contrato." },
  { code: "removed_field", meaning: "Campo que existió en una versión anterior y fue eliminado; el mensaje indica qué usar." },
  { code: "invalid_whatsapp", meaning: "WhatsApp con formato inválido (solo dígitos con código de país, de 8 a 15)." },
  { code: "invalid_phone", meaning: "Teléfono con formato inválido (8 a 15 dígitos; solo +, espacios, guiones y paréntesis)." },
  { code: "invalid_email", meaning: "Email con formato inválido o de más de 254 caracteres." },
  { code: "unknown_icon", meaning: "Ícono que no está disponible; `expected` lista los permitidos." },
  { code: "unknown_language", meaning: "Idioma que el template no incluye (solo `es`, `en` y `pt`, escritos exactos); `expected` lista los permitidos." },
  { code: "unknown_currency", meaning: "Moneda que el template no incluye (solo ARS, USD, EUR, BRL, MXN, CLP, COP, PEN y UYU, escritas exactas); `expected` lista las permitidas." },
  { code: "price_not_positive", meaning: "Precio igual o menor que 0." },
  { code: "price_too_high", meaning: "Precio mayor que 99.999.999,99." },
  { code: "price_too_many_decimals", meaning: "Precio con más de 2 decimales." },
  { code: "price_currency_decimals", meaning: "Precio con decimales en una moneda que no los usa (CLP y COP); el mensaje nombra la moneda." },
  { code: "invalid_rating", meaning: "Valoración que no es un entero de 1 a 5." },
  { code: "invalid_id", meaning: "Identificador de producto con caracteres no permitidos o fuera de 1 a 60." },
  { code: "invalid_url", meaning: "URL que no es http/https completa, con espacios, con credenciales o de más de 2000 caracteres." },
  { code: "invalid_anchor", meaning: "Ancla interna con formato inválido (minúsculas, números y guiones)." },
  { code: "missing_contact_method", meaning: "Falta un email o un teléfono además del WhatsApp." },
  { code: "duplicate_id", meaning: "Identificador de producto repetido." },
  { code: "inconsistent_category", meaning: "Categoría escrita distinto (mayúsculas o espacios) que otra ya usada." },
  { code: "too_many_categories", meaning: "Más de 12 categorías distintas." },
  { code: "unknown_anchor", meaning: "Botón que apunta a una sección que no existirá con estos datos; `expected` lista las disponibles." },
  { code: "invalid_value", meaning: "Valor no válido por otra razón." },
];

// Reglas que relacionan varios campos (no caben en un JSON Schema). Se publican en la documentación.
export const CROSS_RULES: { code: string; rule: string }[] = [
  { code: "missing_contact_method", rule: "En `contact` debe haber al menos un email o un teléfono, además del WhatsApp." },
  { code: "required", rule: "El precio de cada producto es obligatorio si el catálogo muestra precios (por defecto sí); la categoría, si el catálogo agrupa por categoría." },
  { code: "duplicate_id", rule: "Los identificadores de producto no se repiten." },
  { code: "inconsistent_category", rule: "Dos categorías que difieren solo en mayúsculas o espacios se rechazan: hay que escribirlas igual." },
  { code: "too_many_categories", rule: "Hasta 12 categorías distintas." },
  { code: "unknown_anchor", rule: "Los botones solo enlazan a secciones que existen con esos datos: `#inicio`, `#nosotros`, `#servicios` y `#contacto` siempre; `#productos` solo con productos; `#testimonios` solo con testimonios." },
  { code: "price_currency_decimals", rule: "En CLP y COP (monedas sin decimales) los precios no llevan decimales; se comprueba también si los precios están ocultos. Sin `productGridConfig.currency` la moneda es ARS." },
];

// ---------- Tipos de texto (RF-32, RF-33, RF-34) ----------
// Los textos se miden en caracteres tal como los ve una persona (un emoji o una letra con tilde = 1).
const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
function countChars(value: string): number {
  let count = 0;
  for (const _ of segmenter.segment(value)) count++;
  return count;
}

function plainText(max: number, multiline: boolean) {
  return z.string().check((ctx) => {
    const value = ctx.value;
    if (value.trim() === "") {
      ctx.issues.push({ code: "custom", input: value, message: "empty", params: { code: "empty" } });
      return;
    }
    const count = countChars(value);
    if (count > max) {
      ctx.issues.push({
        code: "custom",
        input: value,
        message: "too_long",
        params: { code: "too_long", max, count },
      });
    }
    if (!multiline && /[\r\n]/.test(value)) {
      ctx.issues.push({ code: "custom", input: value, message: "line_break", params: { code: "line_break" } });
    }
  });
}

const Label = plainText(40, false); // etiquetas: botones, categoría, rol, destacados
const Short = plainText(80, false); // nombres y titulares
const StatValue = plainText(10, false); // valor de una cifra ("+14", "100%")
const Subtitle = plainText(200, false); // subtítulo de sección
const Long = plainText(500, true); // descripciones y textos largos
const Address = plainText(150, false);

// Títulos neutros (sin rubro) de las secciones cuando los datos no traen uno (spec 003, RF-9).
export const DEFAULT_SECTION_TITLES = {
  services: "Servicios",
  products: "Productos",
  testimonials: "Testimonios",
  contact: "Contacto",
} as const;
export type SectionKey = keyof typeof DEFAULT_SECTION_TITLES;

// Texto de un valor por defecto en los tres idiomas, para la documentación del contrato:
// `"Servicios" (es), "Services" (en), "Serviços" (pt)`.
function inEachLanguage(pick: (ui: (typeof UI_TEXT)["es"]) => string): string {
  return LANGUAGES.map((language) => `"${pick(UI_TEXT[language])}" (${language})`).join(", ");
}

// ---------- Reglas de valores (RF-20 a RF-25, RF-29) ----------
function reject(
  ctx: { value: unknown; issues: unknown[] },
  code: string,
  extra: Record<string, unknown> = {},
) {
  ctx.issues.push({ code: "custom", input: ctx.value, message: code, params: { code, ...extra } });
}

// RF-20: solo dígitos con código de país, de 8 a 15, sin "+", espacios ni guiones.
const Whatsapp = z.string().check((ctx) => {
  if (!/^\d{8,15}$/.test(ctx.value)) reject(ctx, "invalid_whatsapp");
});

// RF-21: admite "+", espacios, guiones y paréntesis; entre 8 y 15 dígitos; sin letras.
const Phone = z.string().check((ctx) => {
  const digits = ctx.value.replace(/\D/g, "").length;
  if (!/^[\d\s+\-()]+$/.test(ctx.value) || digits < 8 || digits > 15) reject(ctx, "invalid_phone");
});

// RF-22: formato de email válido, máximo 254 caracteres.
const Email = z.string().check((ctx) => {
  if (ctx.value.length > 254 || !/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(ctx.value)) {
    reject(ctx, "invalid_email");
  }
});

// RF-23: la lista de íconos se deriva de icons.ts (única fuente).
const ICON_NAMES = Object.keys(iconPaths);
const Icon = z.string().check((ctx) => {
  if (!ICON_NAMES.includes(ctx.value)) reject(ctx, "unknown_icon", { expected: ICON_NAMES });
});

// RF-24: número finito > 0, hasta 2 decimales, máximo 99.999.999,99.
const MAX_PRICE = 99999999.99;
const Price = z.number().check((ctx) => {
  const value = ctx.value;
  if (value <= 0) return reject(ctx, "price_not_positive");
  if (value > MAX_PRICE) return reject(ctx, "price_too_high");
  const cents = value * 100;
  if (Math.abs(cents - Math.round(cents)) > 1e-4) reject(ctx, "price_too_many_decimals");
});

// RF-25: entero de 1 a 5.
const Rating = z.number().check((ctx) => {
  if (!Number.isInteger(ctx.value) || ctx.value < 1 || ctx.value > 5) reject(ctx, "invalid_rating");
});

// RF-29: solo minúsculas, números y guiones, de 1 a 60 caracteres.
const ProductId = z.string().check((ctx) => {
  if (!/^[a-z0-9-]{1,60}$/.test(ctx.value)) reject(ctx, "invalid_id");
});

// RF-26: solo URLs http o https, sin usuario ni contraseña, sin espacios, hasta 2000 caracteres.
const MAX_URL_LENGTH = 2000;
function isHttpUrl(value: string): boolean {
  if (value.length > MAX_URL_LENGTH || /\s/.test(value) || !/^https?:\/\//i.test(value)) return false;
  try {
    const url = new URL(value);
    return url.hostname !== "" && url.username === "" && url.password === "";
  } catch {
    return false;
  }
}
const HttpUrl = z.string().check((ctx) => {
  if (!isHttpUrl(ctx.value)) reject(ctx, "invalid_url");
});

// RF-26, RF-27: enlace de botón = URL http/https o ancla interna en minúsculas (#contacto).
const Link = z.string().check((ctx) => {
  if (ctx.value.startsWith("#")) {
    if (!/^#[a-z0-9-]+$/.test(ctx.value)) reject(ctx, "invalid_anchor");
  } else if (!isHttpUrl(ctx.value)) {
    reject(ctx, "invalid_url");
  }
});

// ---------- Estructura ----------
// Cada campo lleva su descripción: es la documentación del contrato (RF-35) y alimenta el
// JSON Schema y el Markdown generados en `docs/`.
const Button = z.strictObject({
  label: Label.describe("Texto del botón. Máximo 40 caracteres, una sola línea."),
  href: Link.describe(
    "Destino del botón: URL completa http/https o ancla interna en minúsculas (por ejemplo #contacto) a una sección que exista con estos datos.",
  ),
});

const Hero = z.strictObject({
  headline: Short.describe("Titular principal de la web. Máximo 80 caracteres, una sola línea."),
  subheadline: Long.describe("Subtítulo bajo el titular. Máximo 500 caracteres."),
  ctaPrimary: Button.describe("Botón principal (obligatorio)."),
  ctaSecondary: Button.optional().describe("Botón secundario (opcional). Si se incluye, lleva etiqueta y destino."),
});

const Stat = z.strictObject({
  value: StatValue.describe('Valor de la cifra, por ejemplo "+14", "100%" o "24/7". Máximo 10 caracteres, una sola línea. Obligatorio junto con `label`.'),
  label: Label.describe('Descripción de la cifra, por ejemplo "años de experiencia". Máximo 40 caracteres, una sola línea. Obligatoria junto con `value`.'),
});

// Máximo de elementos de cada lista (spec 013). Es la única fuente de estos números.
// Zod no valida los elementos de un array que ya falla su `.max()`, así que el esquema con el que se valida
// (`relaxed`) no lleva `.max()` y el máximo se comprueba aparte en `listLimits`; el esquema exportado (`siteSchema`)
// sí lo lleva, para que el esquema JSON y la documentación conserven `maxItems`. Una lista nueva con máximo
// se añade aquí y se construye con `list()`.
const LIST_LIMITS = {
  "about.stats": 3,
  "about.highlights": 5,
  services: 8,
  testimonials: 9,
  products: 60,
} as const;
type ListPath = keyof typeof LIST_LIMITS;

function list<T extends z.ZodType>(item: T, path: ListPath, relaxed: boolean, min?: number) {
  const array = min === undefined ? z.array(item) : z.array(item).min(min);
  return relaxed ? array : array.max(LIST_LIMITS[path]);
}

const buildAbout = (relaxed: boolean) =>
  z.strictObject({
    title: Short.describe('Título de la sección "Quiénes somos". Máximo 80 caracteres.'),
    body: Long.describe('Texto de la sección "Quiénes somos". Máximo 500 caracteres.'),
    stats: list(Stat, "about.stats", relaxed)
      .optional()
      .describe(
        'Cifras de "Quiénes somos" (opcional): hasta 3, la primera se muestra destacada. Sin cifras no se muestra la tarjeta de cifras. Lista vacía equivale a ausente. Nunca se muestra una cifra que no esté aquí.',
      ),
    highlights: list(Label, "about.highlights", relaxed)
      .optional()
      .describe("Destacados breves (opcional): hasta 5, de 40 caracteres como máximo cada uno. Lista vacía equivale a ausente."),
  });

const Contact = z.strictObject({
  whatsapp: Whatsapp.describe(
    "WhatsApp de contacto: solo dígitos con código de país (de 8 a 15), sin +, espacios ni guiones. Lo usan el botón flotante, el contacto y las consultas de cada producto.",
  ),
  email: Email.optional().describe("Email de contacto. Formato válido, máximo 254 caracteres. Obligatorio si no hay teléfono."),
  phone: Phone.optional().describe(
    "Teléfono de contacto. De 8 a 15 dígitos; admite +, espacios, guiones y paréntesis; se muestra tal cual. Obligatorio si no hay email.",
  ),
  address: Address.optional().describe("Dirección (opcional). Máximo 150 caracteres, una sola línea."),
});

const Social = z.strictObject({
  instagram: HttpUrl.optional().describe("URL de Instagram (opcional). http o https, hasta 2000 caracteres, sin usuario ni contraseña."),
  facebook: HttpUrl.optional().describe("URL de Facebook (opcional). http o https, hasta 2000 caracteres, sin usuario ni contraseña."),
});

const Service = z.strictObject({
  icon: Icon.describe(`Ícono del servicio. Uno de: ${ICON_NAMES.join(", ")}.`),
  title: Short.describe("Título del servicio. Máximo 80 caracteres."),
  description: Long.describe("Descripción del servicio. Máximo 500 caracteres."),
});

const Testimonial = z.strictObject({
  name: Short.describe("Nombre de quien opina. Máximo 80 caracteres."),
  role: Label.optional().describe("Rol o relación con el negocio (opcional). Máximo 40 caracteres."),
  text: Long.describe("Texto del testimonio. Máximo 500 caracteres."),
  rating: Rating.describe("Valoración: número entero de 1 a 5."),
});

const Product = z.strictObject({
  id: ProductId.describe("Identificador único del producto: solo minúsculas, números y guiones, de 1 a 60 caracteres."),
  name: Short.describe("Nombre del producto. Máximo 80 caracteres."),
  description: Long.describe("Descripción del producto. Máximo 500 caracteres."),
  image: HttpUrl.describe("URL de la imagen del producto (http o https)."),
  price: Price.optional().describe(
    "Precio: número mayor que 0, hasta 2 decimales, máximo 99.999.999,99. Obligatorio si el catálogo muestra precios. Se muestra con el formato estándar de la moneda del catálogo (`productGridConfig.currency`, por defecto ARS) y del idioma de la web, con los decimales de esa moneda. En CLP y COP no admite decimales.",
  ),
  category: Label.optional().describe(
    "Categoría (opcional). Máximo 40 caracteres. Obligatoria si el catálogo agrupa por categoría; hasta 12 distintas y escritas siempre igual.",
  ),
});

// Título y subtítulo opcionales de una sección. Si la sección no se muestra (por ejemplo, productos
// sin productos), se aceptan y no tienen efecto.
function heading(section: SectionKey, name: string) {
  return z
    .strictObject({
      title: Short.optional().describe(
        `Título de la sección de ${name} (opcional). Máximo 80 caracteres, una sola línea. Por defecto, según el idioma: ${inEachLanguage((ui) => ui.nav[section])}.`,
      ),
      subtitle: Subtitle.optional().describe(
        `Subtítulo de la sección de ${name} (opcional). Máximo 200 caracteres, una sola línea. Sin subtítulo no se muestra ninguno.`,
      ),
    })
    .describe(`Título y subtítulo de la sección de ${name} (opcional). Si la sección no se muestra, no tiene efecto.`);
}

const SectionHeadings = z.strictObject({
  services: heading("services", "servicios").optional(),
  products: heading("products", "productos").optional(),
  testimonials: heading("testimonials", "testimonios").optional(),
  contact: heading("contact", "contacto").optional(),
});

const CatalogConfig = z.strictObject({
  showPrice: z.boolean().optional().describe("Mostrar los precios (por defecto sí)."),
  currency: z
    .enum(CURRENCIES)
    .optional()
    .describe(
      "Moneda de los precios del catálogo (opcional): ARS, USD, EUR, BRL, MXN, CLP, COP, PEN o UYU, escritas exactas. Por defecto ARS. CLP y COP no usan decimales. Sin productos no tiene efecto.",
    ),
  ctaLabel: Label.optional().describe(
    `Texto del botón de consulta de cada producto. Máximo 40 caracteres. Por defecto, según el idioma: ${inEachLanguage((ui) => ui.catalog.cta)}.`,
  ),
  groupByCategory: z.boolean().optional().describe("Agrupar los productos por categoría (por defecto no)."),
});

const buildSiteSchema = (relaxed: boolean) => z.strictObject({
  language: z
    .enum(LANGUAGES)
    .optional()
    .describe(
      "Idioma de la interfaz fija de la web (opcional): `es` (español), `en` (inglés) o `pt` (portugués de Brasil), escritos exactos. Por defecto `es`. Cambia el menú, el formulario, los botones, el pie, las tarjetas de contacto, los `aria-label`, los mensajes de WhatsApp, los títulos neutros de sección y la etiqueta por defecto del botón de producto. No traduce lo que escribe el cliente.",
    ),
  name: Short.describe("Nombre del negocio. Máximo 80 caracteres, una sola línea."),
  tagline: Short.describe("Eslogan del negocio. Máximo 80 caracteres, una sola línea."),
  description: Long.describe("Descripción del negocio (también para buscadores). Máximo 500 caracteres."),
  hero: Hero.describe("Sección inicial de la web (obligatoria)."),
  about: buildAbout(relaxed).describe('Sección "Quiénes somos" (obligatoria).'),
  contact: Contact.describe("Datos de contacto (obligatorio): WhatsApp y al menos un email o un teléfono."),
  social: Social.optional().describe("Redes sociales (opcional). Solo Instagram y Facebook."),
  services: list(Service, "services", relaxed, 1).describe("Servicios que ofrece el negocio: de 1 a 8."),
  testimonials: list(Testimonial, "testimonials", relaxed)
    .optional()
    .describe("Testimonios (opcional): hasta 9. Lista vacía equivale a ausente: la sección no se muestra."),
  products: list(Product, "products", relaxed)
    .optional()
    .describe("Productos del catálogo (opcional): hasta 60. Lista vacía equivale a ausente: no hay catálogo."),
  productGridConfig: CatalogConfig.optional().describe(
    "Configuración del catálogo (opcional). Sin productos no tiene efecto. El catálogo usa siempre el WhatsApp de contacto.",
  ),
  sections: SectionHeadings.optional().describe(
    "Títulos y subtítulos de las secciones de servicios, productos, testimonios y contacto (opcional). Sin título cada sección muestra uno neutro; sin subtítulo no se muestra ninguno.",
  ),
});

// Esquema del contrato, con los máximos de las listas (esquema JSON, documentación y tipo `SiteData`).
export const siteSchema = buildSiteSchema(false);
// Esquema con el que se valida: igual, pero sin el `.max()` de las listas, para informar también los errores de
// sus elementos. El máximo lo da `listLimits`.
const relaxedSiteSchema = buildSiteSchema(true);

export type SiteData = z.infer<typeof siteSchema>;

// ---------- Valores por defecto (RF-14) ----------
export const DEFAULT_CATALOG_CONFIG = {
  showPrice: true,
  ctaLabel: "Consultar por WhatsApp",
  groupByCategory: false,
} as const;

// Datos ya validados y completados: lo ausente equivale a vacío, para que las secciones lo omitan.
export type ResolvedSite = Omit<
  SiteData,
  "about" | "social" | "testimonials" | "products" | "productGridConfig" | "sections" | "language"
> & {
  // Idioma resuelto (es por defecto) y las traducciones de la interfaz fija en ese idioma.
  language: Language;
  ui: (typeof UI_TEXT)["es"];
  // Moneda del catálogo (ARS por defecto). Va en la raíz y no dentro de `productGridConfig` resuelto.
  currency: Currency;
  // `about.stats` puede faltar: no se inventan cifras; las plantillas lo tratan como lista vacía.
  about: Omit<SiteData["about"], "highlights"> & { highlights: string[] };
  sections: Record<SectionKey, { title: string; subtitle?: string }>;
  social: NonNullable<SiteData["social"]>;
  testimonials: NonNullable<SiteData["testimonials"]>;
  products: NonNullable<SiteData["products"]>;
  productGridConfig: { showPrice: boolean; ctaLabel: string; groupByCategory: boolean };
};

// No modifica la entrada ni inventa contenido: completa la configuración del catálogo y los
// títulos neutros de las secciones, y sustituye lo ausente por vacío (destacados, listas). No rellena
// las cifras ni los subtítulos: lo que falta no se muestra.
export function applyDefaults(data: SiteData): ResolvedSite {
  const copy = structuredClone(data);
  const language: Language = copy.language ?? "es";
  const ui = UI_TEXT[language];
  // La moneda se resuelve aparte: no entra en `productGridConfig` resuelto (tests existentes lo comparan entero).
  const { currency: configCurrency, ...catalogRest } = copy.productGridConfig ?? {};
  const currency: Currency = configCurrency ?? "ARS";
  const sections = {} as ResolvedSite["sections"];
  for (const key of Object.keys(DEFAULT_SECTION_TITLES) as SectionKey[]) {
    const given = copy.sections?.[key];
    sections[key] = { title: given?.title ?? ui.nav[key] };
    if (given?.subtitle !== undefined) sections[key].subtitle = given.subtitle;
  }
  return {
    ...copy,
    language,
    ui,
    currency,
    about: { ...copy.about, highlights: copy.about.highlights ?? [] },
    sections,
    social: copy.social ?? {},
    testimonials: copy.testimonials ?? [],
    products: copy.products ?? [],
    productGridConfig: { ...DEFAULT_CATALOG_CONFIG, ctaLabel: ui.catalog.cta, ...catalogRest },
  };
}

// ---------- Informe de validación ----------
export interface ValidationError {
  path: string;
  code: string;
  message: string;
  expected?: string[];
}

export interface ValidationReport {
  ok: boolean;
  schemaVersion: string;
  errors: ValidationError[];
}

// Ruta de Zod (["products", 2, "price"]) a texto ("products[2].price").
function formatPath(path: PropertyKey[]): string {
  let out = "";
  for (const part of path) {
    if (typeof part === "number") out += `[${part}]`;
    else out += out === "" ? String(part) : `.${String(part)}`;
  }
  return out;
}

function valueAt(data: unknown, path: PropertyKey[]): unknown {
  let current: unknown = data;
  for (const part of path) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as Record<PropertyKey, unknown>)[part];
  }
  return current;
}

const EXPECTED_TYPE: Record<string, string> = {
  string: "un texto",
  number: "un número",
  boolean: "verdadero o falso",
  object: "un objeto",
  array: "una lista",
};

function describeValue(value: unknown): string {
  if (value === undefined) return "nada";
  if (value === null) return "null";
  if (Array.isArray(value)) return "una lista";
  if (typeof value === "string") return "un texto";
  if (typeof value === "boolean") return "verdadero o falso";
  if (typeof value === "number") {
    if (Number.isNaN(value)) return "NaN";
    if (!Number.isFinite(value)) return "infinito";
    return "un número";
  }
  if (typeof value === "object") return "un objeto";
  return typeof value;
}

type Issue = ReturnType<typeof siteSchema.safeParse> extends { error?: infer E }
  ? E extends { issues: (infer I)[] }
    ? I
    : never
  : never;

interface CustomParams {
  code?: string;
  max?: number;
  count?: number;
  expected?: string[];
}

// Mensajes en español de las reglas propias (clave = código estable del error).
// Un código que no está en la tabla da `undefined`: el tipo lo declara para que `toErrors` lo compruebe.
const CUSTOM_MESSAGES: Record<string, ((label: string, p: CustomParams) => string) | undefined> = {
  empty: (l) => `${l} no puede estar vacío.`,
  too_long: (l, p) => `${l} admite como máximo ${String(p.max)} caracteres (tiene ${String(p.count)}).`,
  line_break: (l) => `${l} no admite saltos de línea.`,
  invalid_whatsapp: (l) =>
    `${l} debe tener solo dígitos con código de país (entre 8 y 15), sin "+", espacios ni guiones.`,
  invalid_phone: (l) =>
    `${l} debe tener entre 8 y 15 dígitos y solo puede incluir "+", espacios, guiones y paréntesis.`,
  invalid_email: (l) => `${l} no es un email válido (máximo 254 caracteres).`,
  unknown_icon: (l) => `${l} no es un ícono disponible.`,
  price_not_positive: (l) => `${l} debe ser un número mayor que 0.`,
  price_too_high: (l) => `${l} no puede superar 99.999.999,99.`,
  price_too_many_decimals: (l) => `${l} admite hasta 2 decimales.`,
  invalid_rating: (l) => `${l} debe ser un número entero de 1 a 5.`,
  invalid_id: (l) => `${l} solo admite minúsculas, números y guiones (de 1 a 60 caracteres).`,
  invalid_url: (l) =>
    `${l} debe ser una URL completa que empiece por http:// o https:// (sin espacios, sin usuario ni contraseña, hasta 2000 caracteres).`,
  invalid_anchor: (l) =>
    `${l} debe ser un ancla en minúsculas, números y guiones (por ejemplo #contacto) o una URL http/https.`,
};

// Convierte un problema de Zod en un error con código estable y mensaje en español.
function toErrors(issue: Issue, data: unknown): ValidationError[] {
  const path = formatPath(issue.path);
  const label = path === "" ? "los datos" : `El campo "${path}"`;
  const value = valueAt(data, issue.path);
  const raw = issue as unknown as Record<string, unknown>;

  switch (issue.code) {
    case "unrecognized_keys":
      return (raw.keys as string[]).map((key) => {
        const full = path === "" ? key : `${path}.${key}`;
        const removed = REMOVED_FIELDS[full];
        return removed
          ? { path: full, code: "removed_field", message: removed }
          : {
              path: full,
              code: "unrecognized_field",
              message: `El campo "${full}" no está previsto en el contrato.`,
            };
      });
    case "invalid_type": {
      if (path !== "" && value === undefined) {
        return [{ path, code: "required", message: `El campo "${path}" es obligatorio.` }];
      }
      const expected = EXPECTED_TYPE[String(raw.expected)] ?? String(raw.expected);
      const subject = path === "" ? "Los datos" : label;
      return [
        {
          path,
          code: "invalid_type",
          message: `${subject} debe ser ${expected} (se recibió ${describeValue(value)}).`,
        },
      ];
    }
    case "too_small":
      if (raw.origin === "array") {
        return [
          {
            path,
            code: "too_few",
            message: `La lista "${path}" debe tener al menos ${String(raw.minimum)} elemento(s).`,
          },
        ];
      }
      return [{ path, code: "empty", message: `${label} no puede estar vacío.` }];
    case "too_big":
      if (raw.origin === "array") {
        return [
          {
            path,
            code: "too_many",
            message: `La lista "${path}" admite como máximo ${String(raw.maximum)} elemento(s).`,
          },
        ];
      }
      return [{ path, code: "too_long", message: `${label} supera el máximo permitido.` }];
    case "custom": {
      const params = (raw.params ?? {}) as CustomParams;
      const code = params.code ?? "invalid_value";
      const build = CUSTOM_MESSAGES[code];
      const error: ValidationError = {
        path,
        code: build ? code : "invalid_value",
        message: build ? build(label, params) : `${label} no es válido.`,
      };
      if (params.expected) error.expected = params.expected;
      return [error];
    }
    case "invalid_value": {
      // `z.enum` informa como valor inválido cualquier cosa que no esté en la lista, incluidos los
      // tipos equivocados: aquí se separan (texto fuera de la lista → unknown_language; otro tipo →
      // invalid_type).
      if (path === "language") {
        if (typeof value !== "string") {
          return [{ path, code: "invalid_type", message: `${label} debe ser un texto (se recibió ${describeValue(value)}).` }];
        }
        const allowed = (raw.values as string[]) ?? [...LANGUAGES];
        return [
          {
            path,
            code: "unknown_language",
            message: `${label} no es un idioma disponible (se recibió "${value}").`,
            expected: allowed,
          },
        ];
      }
      if (path === "productGridConfig.currency") {
        if (typeof value !== "string") {
          return [{ path, code: "invalid_type", message: `${label} debe ser un texto (se recibió ${describeValue(value)}).` }];
        }
        const allowed = (raw.values as string[]) ?? [...CURRENCIES];
        return [
          {
            path,
            code: "unknown_currency",
            message: `${label} no es una moneda disponible (se recibió "${value}").`,
            expected: allowed,
          },
        ];
      }
      return [{ path, code: "invalid_value", message: `${label} no es válido.` }];
    }
    default:
      return [{ path, code: "invalid_value", message: `${label} no es válido.` }];
  }
}

const byPathThenCode = (a: ValidationError, b: ValidationError) =>
  a.path < b.path ? -1 : a.path > b.path ? 1 : a.code < b.code ? -1 : a.code > b.code ? 1 : 0;

// ---------- Reglas cruzadas (segunda pasada) ----------
// Zod no ejecuta las reglas de objeto cuando un campo ya falló por tipo o por campo desconocido
// (comprobado en T1), así que se evalúan aparte sobre los datos crudos, tolerando cualquier forma.
const MAX_CATEGORIES = 12;
const ALWAYS_SECTIONS = ["#inicio", "#nosotros", "#servicios", "#contacto"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const normalizeCategory = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();

function crossRules(data: unknown): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!isRecord(data)) return errors;

  // RF-10: al menos un email o un teléfono.
  const contact = data.contact;
  if (isRecord(contact) && contact.email === undefined && contact.phone === undefined) {
    errors.push({
      path: "contact",
      code: "missing_contact_method",
      message: 'Debe indicarse al menos un email o un teléfono en "contact".',
    });
  }

  const products = Array.isArray(data.products) ? data.products : [];
  const testimonials = Array.isArray(data.testimonials) ? data.testimonials : [];
  const config = isRecord(data.productGridConfig) ? data.productGridConfig : {};
  const showPrice = config.showPrice !== false; // por defecto se muestran precios
  const groupByCategory = config.groupByCategory === true;
  // Moneda del catálogo para la regla de decimales: ausente = ARS; inválida = null (no se evalúa la regla,
  // solo se informa el error de la moneda).
  const rawCurrency = config.currency;
  const currencyCode: Currency | null =
    rawCurrency === undefined ? "ARS" : typeof rawCurrency === "string" && (CURRENCIES as readonly string[]).includes(rawCurrency) ? (rawCurrency as Currency) : null;

  const seenIds = new Map<string, number>();
  const firstCategory = new Map<string, string>();
  products.forEach((product, i) => {
    if (!isRecord(product)) return;
    const at = `products[${i}]`;

    // RF-13: precio y categoría condicionales.
    if (showPrice && product.price === undefined) {
      errors.push({
        path: `${at}.price`,
        code: "required",
        message: `El campo "${at}.price" es obligatorio porque el catálogo muestra precios.`,
      });
    }
    if (groupByCategory && product.category === undefined) {
      errors.push({
        path: `${at}.category`,
        code: "required",
        message: `El campo "${at}.category" es obligatorio porque el catálogo agrupa por categoría.`,
      });
    }

    // Spec 006 (RF-10): en una moneda sin decimales (CLP y COP) el precio no los lleva. Se comprueba siempre,
    // también con los precios ocultos. Si el precio ya falla "más de 2 decimales" no se repite el error.
    if (currencyCode !== null && CURRENCY_DECIMALS[currencyCode] === 0 && typeof product.price === "number" && Number.isFinite(product.price)) {
      const cents = product.price * 100;
      const hasTwoDecimalsAtMost = Math.abs(cents - Math.round(cents)) <= 1e-4;
      if (hasTwoDecimalsAtMost && Math.abs(product.price - Math.round(product.price)) > 1e-6) {
        errors.push({
          path: `${at}.price`,
          code: "price_currency_decimals",
          message: `El campo "${at}.price" no admite decimales porque la moneda del catálogo es ${currencyCode}.`,
        });
      }
    }

    // RF-29: identificadores únicos.
    if (typeof product.id === "string") {
      const first = seenIds.get(product.id);
      if (first === undefined) seenIds.set(product.id, i);
      else {
        errors.push({
          path: `${at}.id`,
          code: "duplicate_id",
          message: `El campo "${at}.id" repite el identificador "${product.id}" de products[${first}].`,
        });
      }
    }

    // RF-30: categorías escritas siempre igual.
    if (typeof product.category === "string" && product.category.trim() !== "") {
      const key = normalizeCategory(product.category);
      const first = firstCategory.get(key);
      if (first === undefined) firstCategory.set(key, product.category);
      else if (first !== product.category) {
        errors.push({
          path: `${at}.category`,
          code: "inconsistent_category",
          message: `La categoría "${product.category}" difiere de "${first}" solo en mayúsculas o espacios; escríbela igual en todos los productos.`,
        });
      }
    }
  });
  if (firstCategory.size > MAX_CATEGORIES) {
    errors.push({
      path: "products",
      code: "too_many_categories",
      message: `Hay ${firstCategory.size} categorías distintas; el máximo es ${MAX_CATEGORIES}.`,
    });
  }

  // RF-17: los enlaces internos solo apuntan a secciones que existirán con estos datos.
  const available = [...ALWAYS_SECTIONS];
  if (products.length > 0) available.push("#productos");
  if (testimonials.length > 0) available.push("#testimonios");
  available.sort();
  const hero = isRecord(data.hero) ? data.hero : {};
  for (const key of ["ctaPrimary", "ctaSecondary"] as const) {
    const button = hero[key];
    if (!isRecord(button)) continue;
    const href = button.href;
    if (typeof href === "string" && /^#[a-z0-9-]+$/.test(href) && !available.includes(href)) {
      errors.push({
        path: `hero.${key}.href`,
        code: "unknown_anchor",
        message: `El campo "hero.${key}.href" apunta a ${href}, una sección que no existirá con estos datos.`,
        expected: available,
      });
    }
  }

  return errors;
}

// Máximo de elementos de las listas (spec 013). Se comprueba aquí y no con el `.max()` de Zod: Zod no valida los
// elementos de una lista que ya falla su `.max()`, y el informe tiene que traer también los errores de esos elementos.
function listLimits(data: unknown): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!isRecord(data)) return errors;
  for (const path of Object.keys(LIST_LIMITS) as ListPath[]) {
    const value = path.split(".").reduce<unknown>((node, key) => (isRecord(node) ? node[key] : undefined), data);
    const max = LIST_LIMITS[path];
    if (Array.isArray(value) && value.length > max) {
      errors.push({ path, code: "too_many", message: `La lista "${path}" admite como máximo ${max} elemento(s).` });
    }
  }
  return errors;
}

export function validateSite(data: unknown): ValidationReport {
  const result = relaxedSiteSchema.safeParse(data);
  const errors = result.success
    ? []
    : result.error.issues.flatMap((issue) => toErrors(issue as Issue, data));
  errors.push(...listLimits(data), ...crossRules(data));

  if (errors.length === 0) {
    return { ok: true, schemaVersion: SCHEMA_VERSION, errors: [] };
  }
  errors.sort(byPathThenCode);
  // Un mismo problema se informa una sola vez por ruta y código, aunque lo detecten a la vez el esquema y una regla.
  const seen = new Set<string>();
  const unique = errors.filter((e) => {
    const key = `${e.path}|${e.code}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return { ok: false, schemaVersion: SCHEMA_VERSION, errors: unique };
}

// Texto legible para personas. Los mismos datos están en el informe estructurado.
export function formatReport(report: ValidationReport): string {
  if (report.ok) return `Datos válidos (contrato ${report.schemaVersion}).`;
  const lines = [
    `Datos inválidos (contrato ${report.schemaVersion}): ${report.errors.length} error(es).`,
  ];
  for (const e of report.errors) {
    const where = e.path === "" ? "(raíz)" : e.path;
    const extra = e.expected && e.expected.length > 0 ? ` Valores permitidos: ${e.expected.join(", ")}.` : "";
    lines.push(`  - ${where} [${e.code}] ${e.message}${extra}`);
  }
  return lines.join("\n");
}
