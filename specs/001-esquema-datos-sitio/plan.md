# Plan 001 — Esquema de datos del sitio
> El CÓMO. Debe cumplir `docs/constitution.md` y cubrir todos los RF de `spec.md`.

## Enfoque técnico
Un **único módulo de esquema** (Zod, importado desde `astro/zod`; ya viene dentro de Astro 6, no se añade ninguna dependencia) es la fuente de verdad de todo el contrato. De él salen:

1. **Validación independiente (RF-1):** un script de línea de comandos que valida un archivo de datos y devuelve texto legible o JSON estructurado, con código de salida 0/1.
2. **Barrera en la construcción (RF-2):** el cargador de datos del sitio valida al importarse y lanza un error con la lista completa. Además, un paso `prebuild` ejecuta el mismo script para que el fallo se vea limpio, antes de que Astro empiece.
3. **Documentación del contrato (RF-35, RF-36):** JSON Schema (`z.toJSONSchema`) y una tabla Markdown generados desde el esquema, con versión 2.0 y registro de cambios.
4. **Casos de ejemplo (criterios de finalización):** un archivo de pruebas con el ejecutor integrado de Node (`node:test`), sin dependencias.

**Decisión de diseño — formato de los datos:** los datos pasan de un módulo TypeScript (`site.config.ts` con `as const`) a un **archivo JSON** (`site.data.json`). Razones: el validador de línea de comandos y los casos de ejemplo pueden leerlo sin compilar TypeScript; el generador produce datos, no código; y un JSON no puede ejecutar nada. `site.config.ts` se mantiene como punto de entrada para los componentes (siguen importando `siteConfig` desde el mismo sitio), pero ahora carga, valida y aplica los valores por defecto.

**Alternativas descartadas:**
- *Validador escrito a mano:* más código y más riesgo de errores propios.
- *Añadir Zod directo y Vitest:* dependencias sin necesidad real (principio 1).
- *Solo validar al construir:* no cumple RF-1 (ciclo corto para el generador).

**Mecanismo para verificar sin tocar el demo:** el cargador y el script aceptan la variable de entorno `SITE_DATA` con la ruta de otro archivo de datos (por defecto, `src/content/site.data.json`). Permite construir y validar los casos mínimo y máximo sin modificar el demo.

## Archivos a crear / modificar
| Archivo | Cambio |
|---|---|
| `src/content/site.schema.ts` | **Nuevo.** Esquema, `SCHEMA_VERSION = "2.0"`, registro de cambios, reglas cruzadas, mapa de campos retirados, `validateSite()` y `formatReport()`. Importa la lista de íconos de `src/lib/icons.ts` (sin duplicarla). |
| `src/content/site.data.json` | **Nuevo.** Datos demo migrados al contrato 2.0 (sin el número propio del catálogo). Es lo que escribirá el generador. |
| `src/content/site.config.ts` | **Reescrito.** Lee `SITE_DATA` o el JSON por defecto, valida, lanza error si es inválido, aplica valores por defecto del catálogo y exporta `siteConfig` y `SiteConfig` (tipo derivado del esquema). |
| `scripts/validate-site.mjs` | **Nuevo.** CLI de validación (RF-1). Opciones: ruta del archivo, `--json`. |
| `scripts/export-schema.mjs` | **Nuevo.** Genera `docs/site.schema.json` y `docs/site-schema.md` (RF-35, RF-36). |
| `scripts/site-schema.test.mjs` | **Nuevo.** Casos de ejemplo con `node:test`, un grupo por RF. |
| `scripts/fixtures/site.min.json`, `site.max.json` | **Nuevos.** Datos válidos en el mínimo (solo obligatorios) y en el máximo de todos los límites. |
| `scripts/check-dist.mjs` | **Nuevo.** Tras un build, lee `dist/index.html` y comprueba que cada `href="#x"` tiene su `id`, y que todos los enlaces `wa.me` usan el WhatsApp de contacto (RF-16, RF-17, RF-18, RF-19). |
| `docs/site.schema.json`, `docs/site-schema.md` | **Nuevos, generados.** No se editan a mano. |
| `package.json` | Solo scripts: `validate`, `prebuild`, `test:schema`, `schema:export`. Sin dependencias. |
| `src/pages/index.astro` | Menú filtrado según secciones existentes; `social` opcional; pie sin contenedor vacío (RF-16). |
| `src/components/sections/Hero.astro` | Botón secundario condicional (RF-11, RF-16). |
| `src/components/sections/About.astro` | Destacados condicionales (RF-11, RF-16). |
| `src/components/sections/Testimonials.astro` | Rol condicional (RF-11). |
| `src/components/sections/ProductGrid.astro` | Se omite sin productos; usa el WhatsApp de contacto; categoría y precio opcionales (RF-13, RF-16, RF-18, RF-19). |
| `src/components/sections/Contact.astro` | Teléfono, email y dirección condicionales (RF-16). |
| `AGENTS.md`, `MEMORY.md` | Ver "Actualizaciones previstas". |
| `specs/001-…/spec.md` | Una aclaración de RF-15 (ver Riesgos, punto 7). |

Sin cambios previstos: `WhatsAppFloat.astro`, `Services.astro` (se revisará que compile con el tipo nuevo), `src/lib/icons.ts` (solo se lee), `components/ui/*`, `theme.css`.

## Modelo de datos / interfaces
**Estructura del JSON** (`?` = opcional; límites según RF-31/RF-32):
```
name (corto) · tagline (corto) · description (largo)
hero:     headline (corto) · subheadline (largo) · ctaPrimary {label (etiqueta), href} · ctaSecondary? {label, href}
about:    title (corto) · body (largo) · highlights? [etiqueta ×0–5]
contact:  whatsapp (8–15 dígitos) · email? · phone? · address? (150)     ← al menos email o phone
social?:  instagram? · facebook?                                           ← URL http/https
services: [ {icon, title (corto), description (largo)} ×1–8 ]
testimonials?: [ {name (corto), role? (etiqueta), text (largo), rating 1–5} ×0–9 ]
products?: [ {id (kebab, 1–60), name (corto), description (largo), image (URL), price?, category? (etiqueta)} ×0–60 ]
productGridConfig?: showPrice? (def. true) · ctaLabel? (def. "Consultar por WhatsApp") · groupByCategory? (def. false)
```
Reglas cruzadas (fuera de los campos individuales): email o teléfono presentes; precio obligatorio si `showPrice`; categoría obligatoria si `groupByCategory`; `id` únicos; categorías distintas ≤ 12 y sin duplicados por mayúsculas/espacios; los enlaces internos solo a secciones que existirán.

**Informe de validación** (salida de `validateSite` y del script `--json`):
```
{ ok: false, schemaVersion: "2.0",
  errors: [ { path: "products[2].price", code: "price_not_positive",
              message: "El precio debe ser un número mayor que 0.", expected?: [...] } ] }
```
Errores ordenados por ruta y luego por código (determinista). Códigos estables en `snake_case` (p. ej. `required`, `invalid_type`, `too_long`, `invalid_whatsapp`, `invalid_url`, `unknown_icon`, `unknown_anchor`, `duplicate_id`, `unrecognized_field`, `removed_field`).

**Compatibilidad hacia atrás:** ninguna (aprobado en la spec; no hay generadores en uso). El campo `productGridConfig.whatsappNumber` produce `removed_field` con el mensaje de qué usar. El archivo `site.config.ts` deja de contener los datos.

## Mapa RF → implementación → test
Los tests son casos en `scripts/site-schema.test.mjs` salvo que se indique otra cosa. "Máx/mín" = límite exacto válido y uno por encima inválido.

| RF | Dónde se implementa | Test que lo verifica |
|---|---|---|
| RF-1 | `validate-site.mjs` (usa `validateSite`) | Lanza el script con un JSON válido (salida 0) y otro inválido (salida 1 + lista) |
| RF-2 | `prebuild` + validación al importar `site.config.ts` | `SITE_DATA=<inválido> npm run build` falla con la lista; con válido termina bien (verificación de build) |
| RF-3 | Ambos caminos llaman a la misma `validateSite` | Mismos errores en la API y en el script para el mismo caso |
| RF-4 | El esquema no usa transformaciones (sin recorte ni normalización) | Texto con espacios alrededor y valores fuera de límite se rechazan, no se arreglan |
| RF-5 | Se recogen todos los problemas y se ordenan | Caso con 3+ errores en niveles distintos: salen todos, mismo orden en 2 ejecuciones |
| RF-6 | Conversor de problemas de Zod a `{path, code, message, expected?}` | Forma del error en un caso por tipo; lista de íconos en `expected` |
| RF-7 | `formatReport()` (texto) + salida JSON | Texto y JSON contienen los mismos errores |
| RF-8 | Mapeo de `invalid_type` y números no finitos | `null`, tipo erróneo, `NaN`, `Infinity`, `"1800"` en varios campos: errores con ruta; el validador no se rompe |
| RF-9 | Objetos estrictos + mapa de campos retirados | Campo desconocido → `unrecognized_field`; `productGridConfig.whatsappNumber` → `removed_field` |
| RF-10 | Campos requeridos en el esquema | Quitar cada obligatorio: un error por cada uno |
| RF-11 | Campos opcionales | Mínimo válido (`site.min.json`) sin ningún opcional |
| RF-12 | Requeridos por elemento (servicio, testimonio, producto, botón) | Quitar cada campo requerido; botón con solo etiqueta o solo enlace |
| RF-13 | Reglas cruzadas | Precio ausente con `showPrice` true (error) y false (válido); categoría ausente con y sin agrupar |
| RF-14 | Valores por defecto en `site.config.ts`; configuración sin productos aceptada | Sin configuración: valores por defecto; configuración sin productos: válido |
| RF-15 | Validación de "presente pero vacío" | Texto opcional `""` → error; campo quitado → válido |
| RF-16 | Componentes + menú condicional | `check-dist.mjs` sobre build de `site.min.json`; revisión visual (ver Verificación) |
| RF-17 | Regla cruzada de anclas (secciones calculadas de los datos) | `#productos` sin productos → `unknown_anchor` con las secciones disponibles; `check-dist.mjs` |
| RF-18 | `ProductGrid.astro` usa `contact.whatsapp` | `check-dist.mjs`: todos los `wa.me` usan el número de contacto |
| RF-19 | Conjunto de RF-16 a RF-18 | Build de `site.min.json` sin productos: `check-dist.mjs` sin enlaces rotos + vista móvil 375 px |
| RF-20 | Regla de WhatsApp | Válido 8 y 15 dígitos; inválido 7 y 16, `+`, espacios, guiones, letras |
| RF-21 | Regla de teléfono | Válido con `+ - ( )` y 8/15 dígitos; inválido con letras, 7 y 16 dígitos |
| RF-22 | Regla de email | Válido 254; inválido 255 y formatos mal formados |
| RF-23 | Enumeración derivada de `iconPaths` | Ícono desconocido → error con la lista; test de que la lista coincide con las claves de `icons.ts` |
| RF-24 | Regla de precio | Válido 0,01 y 99.999.999,99; inválido 0, negativo, 3 decimales, superior al máximo, texto |
| RF-25 | Regla de valoración | Válido 1 y 5; inválido 0, 6, 4,5 |
| RF-26 | Regla de URL | Válido http/https de 2000; inválido `javascript:`, `data:`, `mailto:`, `tel:`, credenciales, espacios, 2001 |
| RF-27 | Regla de ancla | `#` vacío, mayúsculas, desconocida → inválidos |
| RF-28 | Objeto `social` estricto | Otra red → `unrecognized_field`; dominio distinto no se valida (válido) |
| RF-29 | Regla de identificador | Válido 1 y 60; inválido mayúsculas, espacios, 61, duplicado |
| RF-30 | Regla cruzada de categorías | 12 válidas, 13 inválidas; "Cajas regalo" y "cajas  regalo" → inconsistentes |
| RF-31 | Mínimos/máximos de listas | Máx/mín de servicios, productos, testimonios, destacados |
| RF-32 | Longitudes por tipo | Máx/mín por cada tipo (40/80/500/150) con acentos y emojis cuentan uno |
| RF-33 | Texto con al menos un carácter visible | `""`, espacios, saltos de línea solos → inválidos |
| RF-34 | Regla de saltos de línea; Astro escapa el texto | Salto de línea en etiqueta/corto inválido, en largo válido; `<b>x</b>` válido y verificado como texto literal en `dist` |
| RF-35 | `export-schema.mjs` | Los archivos generados coinciden con los versionados (si no, el test falla) |
| RF-36 | `SCHEMA_VERSION` y `CHANGELOG` en el esquema | La versión en `docs/site-schema.md` es 2.0; un campo `version` en los datos → `unrecognized_field` |

## Riesgos y casos límite
1. **Reglas cruzadas y "todos los errores a la vez" (RF-5).** En Zod, las reglas a nivel de objeto pueden no ejecutarse si un campo ya falló. *Mitigación:* ejecutar las reglas cruzadas en una segunda pasada propia sobre los datos crudos (protegida contra tipos erróneos) y unir ambos informes. Hay un test específico. Pendiente confirmar el comportamiento en la documentación oficial (Context7 aún no está operativo en esta sesión; se hará al implementar).
2. **TypeScript desde Node.** El script importa `site.schema.ts`. Con Node 24 funciona sin opciones; con el mínimo declarado (22.12) hace falta `--experimental-strip-types`. *Mitigación:* los scripts de `package.json` pasan el flag; el esquema usa solo `import type`, extensiones `.ts` en importaciones relativas y nada que no se pueda "borrar" (sin enums ni alias `@/`). `tsconfig` ya permite extensiones `.ts` y `verbatimModuleSyntax`.
3. **Dependencia de `astro/zod`.** Es API pública hoy, pero una actualización mayor de Astro podría cambiarla. *Mitigación:* un único punto de importación en el esquema; si cambia, declarar Zod directamente (requiere aprobación).
4. **Error al importar dentro de Astro.** El error de validación aparece envuelto en la traza de Astro. *Mitigación:* `prebuild` valida antes con salida limpia; la barrera al importar cubre `astro build` directo y el servidor de desarrollo.
5. **Longitud en caracteres visibles.** Se cuenta con `Intl.Segmenter` (disponible en Node 24 y 22). Solo se usa en la validación, no en el navegador.
6. **Hallazgo fuera de alcance, pero grave.** `About.astro` tiene fijos "14+ años de experiencia", "500+ clientes satisfechos" y "100% artesanal"; `ProductGrid` y `Contact` tienen subtítulos fijos específicos de alimentos ("Elaborados con ingredientes naturales de la región"). Cada web de cliente mostraría cifras falsas. La spec lo excluye (textos fijos), así que **no se toca aquí**, pero incumple el principio 3. *Recomendación:* una spec 002 para sacar esos textos a los datos.
7. **Inconsistencia en la spec.** RF-15 dice que un opcional presente pero vacío se rechaza, y "Casos límite" dice que una lista vacía de testimonios o productos es válida. *Propuesta:* RF-15 aplica a textos y valores; las listas vacías de testimonios, productos y destacados son válidas y equivalen a "ausente". Se corrige en la spec con tu aprobación.
8. **`null`.** Un `null` donde va un objeto opcional (p. ej. `ctaSecondary: null`) se rechaza como tipo inválido (RF-8); para omitirlo se quita el campo.
9. **Rendimiento en el máximo.** 60 productos con imágenes remotas: ya cargan en diferido (`loading="lazy"`). Se comprueba con `site.max.json` en móvil (375 px).
10. **Datos demo.** Con el formato nuevo, el demo debe pasar la validación; si algún valor no cumple una regla, se corrige el demo, no la regla. Se comprobó a mano que todos los valores actuales (ids, URLs, WhatsApp de 13 dígitos, anclas `#productos` y `#contacto`) cumplen.

## Comprobación con la constitución
- [x] **1. Simplicidad:** cero dependencias nuevas (Zod ya viene en Astro; `node:test` es de Node). Se añaden archivos de script y datos, listados arriba.
- [x] **2. La spec manda:** todo el plan cubre RF-1 a RF-36; lo que no está en la spec (textos fijos) se deja fuera y se señala. Dos puntos requieren tu aprobación (RF-15 y los archivos nuevos).
- [~] **3. Datos separados de interfaz:** el contenido pasa a un JSON y el esquema valida. Excepciones conocidas y fuera de alcance: el símbolo `$` del precio (aceptado en la spec) y los textos fijos del punto 6 de Riesgos.
- [x] **4. El build como puerta:** `prebuild` valida los datos, por lo que `npm run build` ya no pasa con datos inválidos. Los casos de ejemplo se ejecutan con `npm run test:schema`. Propongo que `AGENTS.md` pida ambos antes de dar algo por hecho; si prefieres que la constitución lo diga expresamente, habría que ampliar su texto (cambio tuyo).
- [x] **5. Contrato con el generador:** el cambio de forma está aprobado en la spec; este plan añade el cambio de formato (TypeScript a JSON), que necesita tu aprobación expresa.
- [x] **6. Idioma:** código y nombres de campo en inglés; mensajes de error, documentación y comentarios de documentación en español.

## Verificación
- `npm run test:schema` en verde.
- `npm run build` con los datos demo; y con `SITE_DATA=scripts/fixtures/site.min.json` y `site.max.json`, seguido de `node scripts/check-dist.mjs`.
- `SITE_DATA=<archivo inválido> npm run build` debe fallar con la lista completa.
- Chrome DevTools en `npm run dev`: web mínima y máxima en 375 px, consola sin errores, menú sin enlaces a secciones ausentes.

## Orden de construcción (para `/tasks`)
1. Esquema y `validateSite` + casos de datos (`site.schema.ts`, fixtures, test base).
2. Datos demo en JSON y cargador `site.config.ts` (la web vuelve a compilar igual que antes).
3. Script de validación y `prebuild`.
4. Componentes: de a uno, cada uno verificado con build.
5. `check-dist.mjs` y verificación visual mínimo/máximo.
6. Exportación de documentación y su test.
7. Actualización de `AGENTS.md` y `MEMORY.md`.

## Actualizaciones previstas
- **AGENTS.md:** Stack y estructura (datos en `site.data.json`, esquema en `site.schema.ts`, carpeta `scripts/` con pruebas); Comandos (`validate`, `test:schema`, `schema:export`); Reglas de dominio (retirar la regla de los dos números de WhatsApp, indicar que los íconos válidos salen de `icons.ts`, que el generador escribe `site.data.json`); Límites (`npm run test:schema` junto a `npm run build`); Verificación.
- **MEMORY.md:** estado (contrato 2.0), decisiones (JSON, Zod de Astro, `SITE_DATA`, doble barrera) y el hallazgo de los textos fijos.
- **docs/constitution.md:** sin cambios, salvo que apruebes ampliar el principio 4.
