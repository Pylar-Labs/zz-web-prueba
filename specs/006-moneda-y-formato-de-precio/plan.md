# Plan 006 — Moneda y formato de precio
> El CÓMO. Debe cumplir `docs/constitution.md` y cubrir todos los RF de `spec.md`.

## Enfoque técnico
La moneda pasa a ser un dato del catálogo y el precio se formatea con las funciones de formato de números que ya trae la plataforma (`Intl.NumberFormat`), sin dependencias nuevas. Se reutiliza lo que ya existe: la segunda pasada de reglas, la traducción de errores de `z.enum` (como en `language`), `applyDefaults`, las fixtures y `compare-builds`.

1. **Módulo de formato** (`src/content/price-format.ts`): solo datos y una función, importable también por los scripts de Node (sin tipos de compilador, extensiones `.ts`).
   - `CURRENCIES`: `ARS, USD, EUR, BRL, MXN, CLP, COP, PEN, UYU`.
   - `CURRENCY_DECIMALS`: tabla **fija** (`CLP` y `COP` en 0, el resto en 2), no derivada de la plataforma, porque RF-7 la declara. Un test la compara con lo que informa la plataforma para detectar un cambio.
   - Locale por idioma: inglés `en-US`, portugués `pt-BR`; español `es-AR` salvo `MXN` `es-MX`, `CLP` `es-CL`, `COP` `es-CO`, `PEN` `es-PE` y `UYU` `es-UY` (RF-6).
   - `formatPrice(price, currency, language)`: `Intl.NumberFormat` con `style: "currency"` y `minimumFractionDigits` igual a `maximumFractionDigits` igual a los decimales de la tabla, con los formateadores en caché. Nunca llama a `toFixed` ni a `Math.round`: la validación ya garantiza que el valor tiene como mucho esos decimales (RF-9).
2. **Esquema** (`site.schema.ts`):
   - Campo `productGridConfig.currency` con `z.enum(CURRENCIES).optional()`. Igual que con `language`, `z.enum` informa todo valor inválido como `invalid_value`: en `toErrors` se separa por tipo (texto fuera de la lista → `unknown_currency` con `expected`; otro tipo → `invalid_type`).
   - Regla cruzada nueva en la segunda pasada (`crossRules`): si la moneda es válida (o falta, que equivale a ARS) y es `CLP` o `COP`, un precio con decimales da `price_currency_decimals` en la ruta del precio, con la moneda en el mensaje. Se evalúa siempre, también con los precios ocultos (RF-10). No se emite si el precio ya falla la comprobación de "más de 2 decimales" (para no duplicar errores sobre la misma ruta), ni si la moneda es inválida (RF-14). Tolerancia: la misma que ya usa el contrato para "2 decimales" (1e-4 centavos); para "entero" se usa 1e-6, de modo que el ruido de coma flotante no cuente como decimal (RF-9).
   - Datos resueltos: **`currency` va aparte, en la raíz de `ResolvedSite`** (por defecto `"ARS"`), y no dentro de `productGridConfig`. Tres tests existentes comparan `productGridConfig` resuelto con `deepEqual` y fallarían si apareciera una clave nueva (mismo caso que `about.stats` en la spec 003).
   - Versión 2.3, entrada en `CHANGELOG`, errores en `ERROR_CODES` y una regla en `CROSS_RULES`; la descripción de `price` pierde la frase "símbolo $ y formato argentino".
3. **Plantilla** (`ProductGrid.astro`): el texto del precio pasa de `$` + `toLocaleString("es-AR")` a `formatPrice(product.price, currency, language)`, dentro del mismo `<span>` y sin tocar clases ni marcado (RF-11, RF-16).
4. **Barrera en la web real:** la comprobación de precios se hace como verificación en las tareas (un script desechable compara cada precio del HTML con `formatPrice` de los datos); `check-dist.mjs` no cambia.
5. **Verificación de la plataforma antes de implementar:** una comprobación previa compara la tabla en la versión mínima de Node exigida (22.23.4) y en la del servicio generador (Node 24). Aquí solo hay Node 24 (ICU 78, CLDR 48); para probar 22.23.4 habría que descargarlo, y **te lo pido aparte** (ver riesgos).

Alternativas descartadas: `toLocaleString` con tabla propia de símbolos (rehace lo que ya hace la plataforma y se desactualiza); derivar los decimales de la plataforma (el contrato dejaría de ser estable entre Node); meter `currency` en `productGridConfig` resuelto (rompe tres tests); una biblioteca de formato (dependencia nueva para nueve monedas).

## Tabla de textos exactos esperados (RF-15: requiere tu aprobación antes de pasar a las tareas)
Precio de 1800,50 (1800 en CLP y COP). El espacio entre símbolo o código y número es el **espacio no separable (U+00A0)** que usa la plataforma; aquí se muestra como `␣`. Cuando no aparece, no hay espacio.

| Moneda | Precio | Español | Inglés | Portugués |
|---|---|---|---|---|
| ARS | 1800,5 | `$␣1.800,50` | `ARS␣1,800.50` | `ARS␣1.800,50` |
| USD | 1800,5 | `US$␣1.800,50` | `$1,800.50` | `US$␣1.800,50` |
| EUR | 1800,5 | `EUR␣1.800,50` | `€1,800.50` | `€␣1.800,50` |
| BRL | 1800,5 | `BRL␣1.800,50` | `R$1,800.50` | `R$␣1.800,50` |
| MXN | 1800,5 | `$1,800.50` | `MX$1,800.50` | `MX$␣1.800,50` |
| CLP | 1800 | `$1.800` | `CLP␣1,800` | `CLP␣1.800` |
| COP | 1800 | `$␣1.800` | `COP␣1,800` | `COP␣1.800` |
| PEN | 1800,5 | `S/␣1,800.50` | `PEN␣1,800.50` | `PEN␣1.800,50` |
| UYU | 1800,5 | `$␣1.800,50` | `UYU␣1,800.50` | `UYU␣1.800,50` |

Precio máximo (99.999.999,99; en CLP y COP, 99.999.999) y mínimo (0,01; en CLP y COP, 1), que los tests también comprueban:

| Moneda | Máximo en español | Máximo en inglés | Máximo en portugués |
|---|---|---|---|
| ARS | `$␣99.999.999,99` | `ARS␣99,999,999.99` | `ARS␣99.999.999,99` |
| USD | `US$␣99.999.999,99` | `$99,999,999.99` | `US$␣99.999.999,99` |
| EUR | `EUR␣99.999.999,99` | `€99,999,999.99` | `€␣99.999.999,99` |
| BRL | `BRL␣99.999.999,99` | `R$99,999,999.99` | `R$␣99.999.999,99` |
| MXN | `$99,999,999.99` | `MX$99,999,999.99` | `MX$␣99.999.999,99` |
| CLP | `$99.999.999` | `CLP␣99,999,999` | `CLP␣99.999.999` |
| COP | `$␣99.999.999` | `COP␣99,999,999` | `COP␣99.999.999` |
| PEN | `S/␣99,999,999.99` | `PEN␣99,999,999.99` | `PEN␣99.999.999,99` |
| UYU | `$␣99.999.999,99` | `UYU␣99,999,999.99` | `UYU␣99.999.999,99` |

Mínimos: ARS `$␣0,01` / `ARS␣0.01` / `ARS␣0,01`; USD `US$␣0,01` / `$0.01` / `US$␣0,01`; CLP `$1` / `CLP␣1` / `CLP␣1`.

Notas de la tabla:
- Los textos más anchos miden 17 caracteres: USD en español (`US$␣99.999.999,99`) y ARS en inglés y portugués.
- En español, ARS, MXN, CLP, COP y UYU comparten el símbolo `$`, como cada país; no se distinguen entre sí (caso límite de la spec).
- Los espacios varían según la convención regional (por ejemplo `$1.800` en Chile pero `$␣1.800` en Colombia); es lo que informa la plataforma, no una decisión nuestra.

## Archivos a crear / modificar
| Archivo | Cambio |
|---|---|
| `src/content/price-format.ts` | **Nuevo.** `CURRENCIES`, `CURRENCY_DECIMALS`, locales y `formatPrice` |
| `src/content/site.schema.ts` | Versión 2.3 y `CHANGELOG`; campo `productGridConfig.currency`; errores `unknown_currency` y `price_currency_decimals` en `ERROR_CODES`, mensajes y `toErrors`; regla en `CROSS_RULES` y en `crossRules`; `currency` resuelto en `applyDefaults` y en `ResolvedSite`; descripción de `price` |
| `src/components/sections/ProductGrid.astro` | El texto del precio usa `formatPrice` |
| `scripts/site-currency.test.mjs` | **Nuevo.** Moneda (válidas, inválidas, tipo), decimales por moneda (también con precios ocultos), valores por defecto, formato de las 27 combinaciones y de máximos y mínimos, no redondeo, tabla de decimales frente a la plataforma, fixtures y documentos |
| `scripts/fixtures/site.price.usd.es.json`, `site.price.ars.en.json`, `site.price.ars.pt.json`, `site.price.clp.es.json`, `site.price.mxn.es.json` | **Nuevos.** Datos de ejemplo (RF-18): el texto más ancho de cada idioma, una moneda sin decimales y una con variante regional propia; cada uno con productos de precio mínimo, 1800,50 y máximo |
| `scripts/site-schema.test.mjs`, `scripts/site-text-fields.test.mjs`, `scripts/site-i18n.test.mjs` | **Solo** las comprobaciones de versión "2.2" a "2.3" (3, 4 y 4 aserciones, con sus títulos) |
| `package.json` | `test:schema` también ejecuta `site-currency.test.mjs` |
| `docs/site-schema.md`, `docs/site.schema.json` | **Generados** con `npm run schema:export` |
| `AGENTS.md`, `MEMORY.md` | Ver "Actualizaciones previstas" |

No cambian: `site.data.json` (la demo; usa ARS por defecto), `check-dist.mjs`, `ui-text.ts`, las plantillas salvo `ProductGrid.astro` ni la constitución.

## Modelo de datos / interfaces
```
productGridConfig.currency?   "ARS"|"USD"|"EUR"|"BRL"|"MXN"|"CLP"|"COP"|"PEN"|"UYU"   (ausente = "ARS")

Datos resueltos (ResolvedSite):
  currency        Currency, siempre presente (ARS por defecto)   ← en la raíz, no en productGridConfig
  productGridConfig  sin cambios (showPrice, ctaLabel, groupByCategory)

price-format.ts:
  formatPrice(price, currency, language)  →  texto del precio (ej. "$␣1.800,50")

Errores nuevos:
  unknown_currency          texto fuera de la lista; expected = las nueve monedas
  price_currency_decimals   precio con decimales en CLP o COP; ruta products[i].price; el mensaje nombra la moneda
  (tipo equivocado en la moneda: invalid_type, ya existente)
```
- **Compatibilidad:** `currency` es opcional y los datos 2.0, 2.1 y 2.2 siguen válidos (RF-12). Un precio con 2 decimales sin moneda se muestra en ARS.
- **Reglas cruzadas:** una nueva (decimales según la moneda). Las demás no cambian.
- **Orden de comprobación:** moneda inválida → solo ese error (la regla de decimales no se evalúa); moneda válida → regla de decimales con la tabla.

## Mapa RF → implementación → test
| RF | Dónde se implementa | Test que lo verifica |
|---|---|---|
| RF-1 | Campo con `z.enum` en `site.schema.ts` | Las nueve monedas son válidas; el JSON Schema lista los nueve valores |
| RF-2 | `applyDefaults`: `currency` de la raíz | Sin moneda y sin configuración del catálogo, `currency` resuelta es `ARS` |
| RF-3 | `toErrors` → `unknown_currency` + `expected` | `ars`, `JPY`, `" USD"`, `""`, `Usd` → `unknown_currency` en `productGridConfig.currency`, con las nueve monedas y sin corregir el valor |
| RF-4 | Error de tipo existente | `null`, `5`, `[]`, `{}`, `true` → `invalid_type` |
| RF-5 | Sin productos no hay precios que formatear ni validar | Moneda con catálogo sin productos → datos válidos |
| RF-6 | `price-format.ts` (locales) | La tabla aprobada: 27 combinaciones exactas |
| RF-7 | `CURRENCY_DECIMALS` fija | La tabla de decimales coincide con la de la plataforma; precios enteros con 2 decimales; CLP y COP sin decimales |
| RF-8 | Símbolo y código de la plataforma | Casos de la tabla: ARS en inglés (`ARS␣`), USD en español (`US$␣`), EUR en portugués (`€␣`) |
| RF-9 | `formatPrice` sin redondeo propio; tolerancias de la validación | Precios mínimo y máximo exactos; `0.30000000000000004` se muestra como 0,30 sin error; `1800.5` en ARS sale `1.800,50` |
| RF-10 | `crossRules` → `price_currency_decimals` | CLP y COP con `1800.5`, también con `showPrice: false`; entero válido; 2 decimales en USD válido; `1.005` solo da el error de "más de 2 decimales" |
| RF-11 | Espacio no separable de la plataforma; sin marcado nuevo | Test: el espacio es U+00A0 en las combinaciones con espacio; `compare-builds` de la demo: solo cambia el texto de los precios |
| RF-12 | `SCHEMA_VERSION = "2.3"` | Fixtures y datos 2.2 válidos; las comprobaciones de versión actualizadas |
| RF-13 | Descripciones + `CHANGELOG` + `ERROR_CODES` + `CROSS_RULES` + `schema:export` | Tests de documentos: versión 2.3, campo, errores, regla y ya no dice "símbolo $" |
| RF-14 | `validateSite` reutiliza `toErrors`; orden de comprobación | Moneda inválida más precio con decimales → solo el error de moneda; errores nuevos junto a otros en una lista |
| RF-15 | Esta tabla | Aprobación explícita antes de `/tasks` |
| RF-16 | `ProductGrid.astro` | `compare-builds` de la demo contra la línea base: la única diferencia es el texto de los precios; 0 diferencias de espacios |
| RF-17 | Fixtures de precio máximo + volcado de layout | Volcado a 375, 768 y 1280 px de las tres variantes de precio máximo, sin desbordes nuevos |
| RF-18 | Cinco fixtures y `site-currency.test.mjs` | Fixtures válidos; 27 combinaciones cubiertas por tests |
| RF-19 | `AGENTS.md` y `MEMORY.md` | Revisión de ambos archivos |

## Riesgos y casos límite
- **Estabilidad entre versiones de Node (el más importante).** Los textos exactos salen de datos de idiomas (ICU/CLDR) de Node. Aquí solo hay Node 24.15 (ICU 78, CLDR 48). Mitigación: antes de implementar se compara la tabla con Node 22.23.4. **Para eso hay que descargar una copia desechable de Node 22 (con `npx`, sin instalarla en el proyecto ni tocar `package.json`); te lo pido aparte en las tareas.** Si no la apruebas, se anota que no se comprobó. Si los textos difieren, se informa antes de seguir.
- **Un cambio futuro de Node que altere la tabla.** Los tests fallan señalando la combinación; la tabla solo se actualiza con tu aprobación (requisito de la spec).
- **Tres tests existentes sobre `productGridConfig`.** Mitigación: `currency` va fuera de ese objeto; si falla cualquier otro test que no sea de versión, es un bloqueo.
- **Errores duplicados en la misma ruta.** Un precio con 3 decimales en CLP no debe dar dos errores: la regla cruzada se salta los precios que ya fallan "más de 2 decimales".
- **Ruido de coma flotante en CLP y COP.** `1800.0000001` cuenta como entero (tolerancia 1e-6); `1800.5` no. Hay tests de ambos.
- **Precio largo en la tarjeta a 375 px.** El precio puede medir 17 caracteres junto al botón de consulta, que ya se ajusta (spec 002). Mitigación: volcado de layout con los tres precios máximos; si hay desborde, solo un ajuste mínimo de estilo, que RF-16 permite.
- **Espacio no separable en el HTML.** `compare-builds` normaliza espacios, pero el texto del precio cambia de todos modos; se revisa a mano que sea la única diferencia.
- **Documentos y fines de línea.** Con la política de la spec 005 los documentos salen en LF y el test los tolera; no hay pasos extra.
- **Lectores de pantalla.** Fuera de alcance (spec).

## Comprobación con la constitución
- [x] Principio 1 (simplicidad): sin dependencias nuevas ni JS de cliente; un módulo con una función y una tabla.
- [x] Principio 2 (la spec manda): solo lo de la spec; los archivos nuevos (`price-format.ts`, `site-currency.test.mjs` y cinco fixtures) y el cambio de `package.json` los sometes a aprobación.
- [x] Principio 3 (datos separados de interfaz): la moneda es un dato; el formato de números y monedas son datos regionales de la plataforma, no texto de interfaz (decisión registrada en la spec y en `AGENTS.md`; sin enmienda).
- [x] Principio 4 (el build como puerta): cada tarea ejecuta `npm run test:schema` y los builds con `check-dist`.
- [x] Principio 5 (contrato sagrado): cambio compatible, subido a 2.3 y anotado; el contrato 2.2 sigue siendo válido.
- [x] Principio 6 (idioma): código en inglés; mensajes y documentación en español.

## Actualizaciones previstas
- **AGENTS.md:** la línea de excepciones conocidas pierde "el símbolo `$` con formato argentino" (queda el año del pie); contrato "versión 2.3"; una nota breve: el formato de precio sale de `price-format.ts` y de los datos regionales de la plataforma (no de `ui-text.ts`), y `currency` va en `productGridConfig`. Hoy tiene 59 líneas (`check-setup` avisa a partir de 61): se compensa fusionando líneas y se confirma con `check-setup`. Se muestra el texto antes de aplicarlo.
- **MEMORY.md:** estado (spec 006, contrato 2.3), decisiones con su porqué (formato por idioma con variante regional del español, decimales rechazados en CLP y COP siempre, `currency` fuera de `productGridConfig` resuelto), aprendizajes (la plataforma redondea sin avisar CLP y COP) y pendientes (comprobar Node 22 si no se hizo).
