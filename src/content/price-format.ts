// Moneda y formato de precio (spec 006). Las nueve monedas, sus decimales y cómo se escribe un precio.
//
// El símbolo, el código y los separadores NO son texto de interfaz nuestro: salen de los datos
// regionales estándar que trae la plataforma (`Intl.NumberFormat`). Lo único que se decide aquí es qué
// variante regional se usa (por idioma y, en español, por país de la moneda) y cuántos decimales lleva
// cada moneda. Los textos exactos esperados están en `scripts/site-currency.test.mjs`.
// Nota: este archivo lo importan también scripts de Node (type stripping): solo datos y una función,
// extensiones `.ts` en rutas relativas, sin enums ni alias `@/`.

export const CURRENCIES = ["ARS", "USD", "EUR", "BRL", "MXN", "CLP", "COP", "PEN", "UYU"] as const;
export type Currency = (typeof CURRENCIES)[number];

// Decimales de cada moneda. Tabla fija (no derivada de la plataforma): CLP y COP no los usan.
// Un test la compara con lo que informa la plataforma para detectar un cambio.
export const CURRENCY_DECIMALS = {
  ARS: 2,
  USD: 2,
  EUR: 2,
  BRL: 2,
  MXN: 2,
  CLP: 0,
  COP: 0,
  PEN: 2,
  UYU: 2,
};

// Inglés al estilo de Estados Unidos y portugués al de Brasil. En español, los separadores siguen al
// país de la moneda; ARS, USD, EUR y BRL usan la variante rioplatense.
const SPANISH_LOCALE = { MXN: "es-MX", CLP: "es-CL", COP: "es-CO", PEN: "es-PE", UYU: "es-UY" };

export function localeFor(currency: string, language: string): string {
  if (language === "en") return "en-US";
  if (language === "pt") return "pt-BR";
  return SPANISH_LOCALE[currency as keyof typeof SPANISH_LOCALE] ?? "es-AR";
}

const formatters = new Map<string, Intl.NumberFormat>();

// Escribe un precio con el formato estándar de la moneda en el idioma de la web. Siempre muestra los
// decimales de la moneda (dos, o ninguno en CLP y COP). No redondea por su cuenta: la validación ya
// garantiza que el precio no tiene más decimales de los que la moneda admite.
export function formatPrice(price: number, currency: Currency, language: string): string {
  const locale = localeFor(currency, language);
  const key = `${locale}|${currency}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    const decimals = CURRENCY_DECIMALS[currency];
    formatter = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    formatters.set(key, formatter);
  }
  return formatter.format(price);
}
