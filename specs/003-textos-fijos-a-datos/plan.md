# Plan 003 — Llevar a los datos los textos fijos falsos o de un rubro
> El CÓMO. Debe cumplir `docs/constitution.md` y cubrir todos los RF de `spec.md`.

## Enfoque técnico
Se amplía el contrato con **campos opcionales nuevos** (versión 2.1) y las secciones los leen en vez de llevar el texto escrito. Todo reutiliza lo que ya existe: los mismos tipos de texto (`plainText`), los mismos códigos de error y la misma segunda pasada de reglas. **No hay códigos de error nuevos ni dependencias nuevas.**

1. **Cifras:** `about.stats`, lista opcional de 0 a 3 objetos `{ value, label }` (valor ≤ 10 caracteres, descripción ≤ 40, una línea). Ambos campos son obligatorios dentro de cada cifra, así que "solo uno" falla con el error `required` ya existente (RF-3). Más de 3: `too_many`. Lista vacía = ausente, como `highlights`.
2. **Títulos y subtítulos:** un objeto opcional `sections` con cuatro entradas opcionales (`services`, `products`, `testimonials`, `contact`), cada una con `title` (≤ 80) y `subtitle` (≤ 200) opcionales. Un `sections` con textos de una sección omitida es válido y no tiene efecto (RF-12) sin escribir ninguna regla extra: simplemente no se lee.
3. **Valores por defecto:** `applyDefaults` completa solo los **títulos neutros** ("Servicios", "Productos", "Testimonios", "Contacto"), igual que ya hace con `ctaLabel`. Subtítulos y cifras no tienen valor por defecto: ausente = no se muestra. Las secciones reciben ya los datos resueltos.
4. **Secciones:** `About.astro` pinta la tarjeta solo si hay cifras; `Services`, `ProductGrid`, `Testimonials` y `Contact` leen título y subtítulo (el subtítulo solo si existe). Sin componente nuevo: el bloque de título se repite como hoy, para no añadir archivos ni abstracciones.
5. **Tamaño de la cifra:** el tamaño de letra se elige por el largo del valor mediante clases de Tailwind en pasos (≤ 4 caracteres conserva `text-6xl`, como hoy), más `[overflow-wrap:anywhere]` como red de seguridad para valores sin puntos de corte. Los umbrales exactos se fijan midiendo a 375, 768 y 1280 px (tarea de medición antes de implementar). Se descartó la solución con unidades de contenedor (`cqw`) porque su resultado depende del ancho de cada letra y es más difícil de comprobar.
6. **Barrera en la web real:** `check-dist.mjs` gana una comprobación que cumple RF-6 y RF-11: ninguno de los textos antiguos (por ejemplo "14+", "500+", "clientes satisfechos", "Elaborados con ingredientes naturales") puede aparecer en el HTML si no está en los datos.

Alternativas descartadas: poner título y subtítulo dentro de cada sección existente (`services` es una lista, no admite campos propios); ocho campos planos (`servicesTitle`, `servicesSubtitle`…) sin agrupar; rechazar textos de secciones omitidas (se decidió aceptarlos sin efecto).

## Archivos a crear / modificar
| Archivo | Cambio |
|---|---|
| `src/content/site.schema.ts` | `SCHEMA_VERSION` a "2.1"; entrada 2.1 en `CHANGELOG`; tipos `Stat` (valor 10, descripción 40) y `SectionHeading` (título 80, subtítulo 200); campos `about.stats` y `sections`; `DEFAULT_SECTION_TITLES`; `ResolvedSite` y `applyDefaults` completan `about.stats` y los títulos |
| `src/components/sections/About.astro` | Cifras desde los datos; tarjeta y cuadrados decorativos solo con cifras; una sola columna sin cifras; tamaños por largo; 1/2/3 cifras sin celdas vacías |
| `src/components/sections/Services.astro`, `ProductGrid.astro`, `Testimonials.astro`, `Contact.astro` | Título y subtítulo desde los datos; subtítulo solo si existe |
| `src/content/site.data.json` | Demo: añade `about.stats` y `sections` con sus textos actuales; sus destacados dejan de repetir las cifras |
| `scripts/fixtures/site.max.json` | Se amplía: 3 cifras en el límite (una con valor de 10 caracteres sin puntos de corte) y los cuatro `sections` con título de 80 y subtítulo de 200 |
| `scripts/fixtures/site.min.json` | **Sin cambios** (ya no trae ningún campo nuevo) |
| `scripts/site-schema.test.mjs` | **Solo** las 3 comprobaciones de versión: líneas 340, 353 y 934 pasan de "2.0" a "2.1" |
| `scripts/site-text-fields.test.mjs` | **Archivo nuevo (a confirmar):** tests de los campos nuevos |
| `package.json` | `test:schema` también ejecuta el archivo nuevo (sin dependencias nuevas) |
| `scripts/check-dist.mjs` | Comprobación de textos antiguos (RF-6, RF-11) |
| `docs/site-schema.md`, `docs/site.schema.json` | **Generados** con `npm run schema:export`, sin editar a mano |
| `AGENTS.md`, `MEMORY.md` | Ver "Actualizaciones previstas" |

Nada fuera de `src/content`, `src/components/sections`, `scripts`, `docs`, `package.json` y los dos archivos de memoria. `compare-builds.mjs` se reutiliza sin cambios.

## Modelo de datos / interfaces
```
about.stats?       lista de 0 a 3 · cada elemento: { value, label } (ambos obligatorios, estricto)
  value            texto, 1 a 10 caracteres, una línea
  label            texto, 1 a 40 caracteres, una línea
sections?          { services?, products?, testimonials?, contact? } (estricto)
  <sección>        { title?, subtitle? } (estricto)
    title          texto, 1 a 80 caracteres, una línea
    subtitle       texto, 1 a 200 caracteres, una línea
```
- **Compatibilidad:** todo es opcional, así que los datos 2.0 siguen válidos (RF-18). Un objeto vacío (`sections: {}` o `services: {}`) es válido y equivale a ausente.
- **Datos resueltos (`ResolvedSite`):** `sections.<sección>.title` siempre es un texto (el neutro si falta); `subtitle` es opcional. `about.stats` **no se rellena**: puede faltar y `About.astro` lo trata como lista vacía (`stats ?? []`). *Cambio respecto a la versión aprobada del plan, aprobado por ti en T5: un test existente exige que `applyDefaults` deje `about` igual cuando no hay cifras.*
- **Errores:** solo códigos existentes: `required`, `empty`, `too_long`, `line_break`, `too_many`, `invalid_type`, `unrecognized_field`. Las rutas son exactas (por ejemplo `about.stats[1].value`, `sections.products.subtitle`).
- **Reglas cruzadas:** ninguna nueva.
- **Orden:** las cifras se muestran en el orden de los datos; la primera es la destacada.

## Mapa RF → implementación → test
| RF | Dónde se implementa | Test que lo verifica |
|---|---|---|
| RF-1 | `about.stats` con `.max(3)` | Válido con 0, 1, 2 y 3 cifras; con 4 → `too_many` en `about.stats` |
| RF-2 | `Stat` con los tipos de texto de 10 y 40 caracteres, una línea | Límite exacto (10 y 40) válido, uno por encima (11 y 41) → `too_long`; salto de línea → `line_break`; emoji y tilde combinada cuentan 1 |
| RF-3 | Ambos campos obligatorios dentro de `Stat` | Solo valor o solo descripción → `required` en la ruta que falta |
| RF-4 | `About.astro`: 1/2/3 cifras sin celdas vacías | Prueba visual y lista de diferencias con 1, 2 y 3 cifras; el HTML tiene exactamente tantas cifras como los datos |
| RF-5 | `About.astro`: sin cifras, ni tarjeta ni cuadrados y una columna | Build de la variante mínima: sin tarjeta, sin cuadrados; volcado de layout a 375, 768 y 1280 px |
| RF-6 | Las cifras solo vienen de `siteConfig` | `check-dist`: ningún texto antiguo en el HTML si no está en los datos; build de la mínima |
| RF-7 | `sections` y `SectionHeading` en el esquema | Cada una de las cuatro secciones acepta título y subtítulo |
| RF-8 | Tipos de 80 y 200 caracteres, una línea | Límite exacto y uno por encima por cada campo; salto de línea rechazado |
| RF-9 | `DEFAULT_SECTION_TITLES` en `applyDefaults` | `applyDefaults` devuelve los cuatro títulos neutros; build de la mínima los muestra |
| RF-10 | Cada sección dibuja el subtítulo solo si existe | Build de la mínima: sin párrafo de subtítulo; volcado de layout sin espacio vacío |
| RF-11 | Los títulos solo vienen de los datos o del neutro | `check-dist`: no aparece ningún título o subtítulo antiguo fuera de los datos |
| RF-12 | `sections.products` y `sections.testimonials` son válidos sin productos o testimonios y las secciones no se dibujan | Test de validación con título de productos y sin productos → válido; build: la sección no existe |
| RF-13 | Tipo de texto existente (`empty`) | Título, subtítulo, valor y descripción vacíos o con solo espacios → `empty` |
| RF-14 | Tipos de texto existentes; sin recorte | Más largo o con salto de línea → rechazado y entrada sin modificar; espacios en los bordes conservados |
| RF-15 | `validateSite` reutiliza `toErrors` | Los errores nuevos salen con ruta, código estable y mensaje en español, sumados a otros errores en una lista |
| RF-16 | Objetos estrictos | Campo no previsto en `stats[0]`, en `sections` y en cada sección → `unrecognized_field` |
| RF-17 | Las plantillas escapan el texto (Astro) | Test con `<script>` y `<b>` en los textos nuevos; build y revisión del HTML y de la página |
| RF-18 | `SCHEMA_VERSION = "2.1"` | Los fixtures y los datos 2.0 existentes siguen válidos; los 3 tests de versión actualizados |
| RF-19 | Descripciones de campo + `CHANGELOG` + `schema:export` | Los tests existentes de documentos (regenerados = versionados, declaran 2.1); descripción de cada campo nuevo |
| RF-20 | `site.data.json` | La demo valida; lista de diferencias de HTML y volcado de layout contra la línea base |
| RF-21 | `site.max.json` ampliado; `site.min.json` igual | Fixtures válidos; la máxima trae todos los campos nuevos en su límite; la mínima no trae ninguno |
| RF-22 | `About.astro` y secciones con los datos mínimos | Volcado de layout y capturas a 375, 768 y 1280 px |
| RF-23 | Tamaños por largo y `overflow-wrap` en la cifra | Volcado de layout sin desborde a 375, 768 y 1280 px con la máxima (valor de 10 caracteres sin puntos de corte) y con datos temporales de caracteres anchos |
| RF-24 | Cifra y descripción en elementos contiguos; cada sección conserva su `h2` | `check-dist` y revisión del HTML: valor seguido de su descripción y un `h2` por sección |
| RF-25 | Sin cambios en menú, formulario, botones, pie, `aria-label` ni tarjetas de contacto | `compare-builds` demo: esos textos idénticos |
| RF-26 | Clases de la demo iguales a las actuales con 3 cifras cortas | `compare-builds` demo: solo difieren los destacados; volcado de layout sin diferencias salvo ellos |
| RF-27 | `AGENTS.md`, `MEMORY.md` | Revisión de ambos archivos |

## Riesgos y casos límite
- **Cifra de 10 caracteres en 375 px (duda abierta de la spec).** Mitigación: la primera tarea mide con valores reales antes de fijar los umbrales; `overflow-wrap:anywhere` evita el desborde aunque el umbral sea impreciso. Si ni así cabe, se informa antes de seguir (podría exigir bajar el límite de 10, decisión tuya).
- **Cifra pequeña de 10 caracteres** en una celda de unos 140 px: mismo mecanismo con sus propios umbrales.
- **Caracteres anchos o de derecha a izquierda:** el límite cuenta caracteres, no ancho. Se prueba con datos temporales (fuera del repositorio) y se registra el resultado.
- **Versión en tests:** hay que cambiar 3 aserciones (ya aprobado). Riesgo: que otro test dependa de "2.0" sin haberlo visto. Mitigación: ejecutar el conjunto completo tras subir la versión y revisar cada fallo antes de tocar nada; si falla un test distinto de esos 3, es un bloqueo.
- **Documentos regenerados y fines de línea:** el test de documentos es sensible a CRLF (pendiente conocido). Mitigación: regenerar con `npm run schema:export` en este equipo y verificar en un clon con `core.autocrlf=false`.
- **La demo cambia a propósito** solo en los destacados. La lista de diferencias de HTML debe mostrar solo eso; cualquier otra diferencia se investiga.
- **Línea base:** se construye con la `master` actual (demo, mínima y máxima) antes de tocar nada. Para la mínima y la máxima las diferencias esperadas son muchas (cifras, títulos neutros, subtítulos): ahí se compara con volcado de layout y revisión manual, no con la lista de diferencias estricta.
- **Objeto `sections` vacío o con secciones vacías:** válido y sin efecto; hay un test.
- **Textos con HTML:** Astro escapa los textos por defecto; se comprueba en la web real (RF-17).
- **Sin generadores en uso:** no hay migración, pero cualquier generador futuro debe leer el contrato 2.1 (la documentación lo explica).

## Comprobación con la constitución
- [x] Principio 1 (simplicidad): sin dependencias ni componentes nuevos, sin JS de cliente; solo plantillas y esquema.
- [x] Principio 2 (la spec manda): solo se implementa lo de la spec; los archivos nuevos (`site-text-fields.test.mjs` y el cambio de `package.json`) se someten a tu aprobación.
- [x] Principio 3 (datos separados de interfaz): cumple más que hoy, porque las cifras y los títulos pasan a los datos. Quedan los títulos neutros (un valor por defecto, como `ctaLabel`) y la interfaz fija, ya declarados como límite en la spec.
- [x] Principio 4 (el build como puerta): las tareas ejecutan `npm run test:schema` y `npm run build` de las tres variantes con `check-dist` tras cada cambio; no se avanza con algo en rojo.
- [x] Principio 5 (contrato sagrado): cambio compatible, subido a 2.1, anotado en `CHANGELOG` y aprobado por ti; el contrato 2.0 sigue siendo válido.
- [x] Principio 6 (idioma): código en inglés (`stats`, `sections`, `subtitle`), textos y documentación en español.

## Actualizaciones previstas
- **AGENTS.md:** contrato "versión 2.1"; la línea de "Excepciones conocidas" sin las cifras ni los subtítulos de rubro y con la interfaz fija, los títulos neutros y "Respondemos rápido"; una línea breve sobre los campos nuevos. Hoy tiene 63 líneas (el aviso salta a partir de 60): aprovechar para recortar y no crecer. Se muestra el texto antes de aplicarlo.
- **MEMORY.md:** estado (spec 003, contrato 2.1), decisiones con su porqué (cifras opcionales, títulos neutros, secciones omitidas aceptadas sin efecto, 3 tests de versión), errores a evitar y pendientes (test de fines de línea, `typescript`, multi-idioma, ramas viejas). Máximo ~50 líneas.
