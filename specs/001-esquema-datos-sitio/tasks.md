# Tareas 001 — Esquema de datos del sitio
> Tareas pequeñas, ordenadas, verificables. Cada una referencia sus RF y termina con tests en verde.
> `[P]` = puede hacerse en paralelo.

## Reglas de ejecución
- **Test primero:** las tareas "Test rojo" escriben los casos y se comprueba que **fallan por la razón correcta** antes de pasar a la tarea de implementación que los pone en verde.
- **Una tarea = un cambio revisable.** Al terminar cada una: `npm run test:schema` (cuando exista) y, si toca la web, `npm run build`.
- **`[P]`** solo entre tareas que tocan archivos distintos. Los cambios a `package.json` se aplican de uno en uno aunque las tareas sean `[P]`.
- **Comandos en Windows (PowerShell):** variables de entorno con `$env:SITE_DATA = "ruta"` (no la sintaxis `VAR=valor` de Bash). Los tests que lanzan procesos pasan el entorno por opciones, no por la línea de comandos.
- **Ruta crítica:** T1 → T2…T13 (esquema, secuencial: mismo archivo) → T14–T16 (datos y cargador) → T19 → T20–T26 `[P]` → T27 → T30–T34.

## Fase 0 — Premisas técnicas
- [x] T1 (RF-5, RF-8, RF-32, RF-35): **Experimento desechable** fuera del proyecto (carpeta temporal de la sesión), sin tocar archivos del repositorio. Comprobar con Zod de Astro y Context7: (a) con `.check()` en lugar de `superRefine` (obsoleto), si las reglas cruzadas se ejecutan cuando un campo ya falló; (b) que un `.mjs` pueda importar un `.ts` que usa `astro/zod` con Node 24 y con `--experimental-strip-types`; (c) conteo de caracteres con `Intl.Segmenter`; (d) `z.toJSONSchema` con objetos estrictos y reglas personalizadas.
  *Hecho cuando:* los cuatro puntos tienen respuesta anotada; si alguno contradice el plan, se actualiza "Riesgos" de `plan.md` y se avisa antes de seguir.

## Fase 1 — Esquema y validación (secuencial: mismos archivos)
- [x] T2 (RF-9, RF-10, RF-11, RF-12, RF-15, RF-31): **Test rojo — estructura.** Crear `scripts/fixtures/site.min.json` (solo obligatorios) y `site.max.json` (todo en el máximo de los límites), y `scripts/site-schema.test.mjs` con ayudantes (copiar datos, fijar o borrar una ruta). Casos: ambos fixtures válidos; quitar cada obligatorio da un error; cada opcional ausente es válido; listas vacías de testimonios, productos y destacados son válidas; textos opcionales presentes pero vacíos se rechazan; mínimos y máximos de listas (servicios 1–8, productos 0–60, testimonios 0–9, destacados 0–5); botón con solo etiqueta o solo enlace; campo desconocido rechazado.
  *Hecho cuando:* los tests existen y fallan porque aún no hay esquema.
- [x] T3 (RF-9, RF-10, RF-11, RF-12, RF-15, RF-31, RF-36): **Implementar la estructura** en `src/content/site.schema.ts`: objetos estrictos, requeridos y opcionales según el plan, límites de listas, `SCHEMA_VERSION = "2.0"`, registro de cambios, y una primera `validateSite()` que devuelve `{ ok, errors }`. Una sola importación de `astro/zod`.
  *Hecho cuando:* los tests de T2 en verde.
- [x] T4 (RF-4, RF-5, RF-6, RF-7, RF-8, RF-9): **Test rojo — informe de errores.** Casos: cada error trae ruta exacta (con posición en listas), código estable, mensaje en español y `expected` cuando aplica; varios errores en distintos niveles salen todos y sin tope; mismo orden en dos ejecuciones; `null`, tipo incorrecto, `NaN`, `Infinity` y `"1800"` dan errores con ruta sin romper el validador; ningún valor se recorta ni normaliza; `productGridConfig.whatsappNumber` da `removed_field`; texto legible y JSON contienen los mismos errores.
  *Hecho cuando:* fallan por la razón correcta.
- [x] T5 (RF-4, RF-5, RF-6, RF-7, RF-8, RF-9): **Implementar el informe:** conversor de problemas de Zod a `{path, code, message, expected?}`, tabla de códigos en `snake_case`, orden determinista, mapa de campos retirados, `formatReport()` (texto) y salida estructurada.
  *Hecho cuando:* tests de T4 en verde y T2 sigue en verde.
- [x] T6 (RF-32, RF-33, RF-34): **Test rojo — textos.** Máx/mín exactos por tipo (etiqueta 40, corto 80, largo 500, dirección 150) con acentos y emojis contando uno; obligatorio vacío, solo espacios o solo saltos de línea rechazado; salto de línea inválido en etiquetas y textos cortos y válido en largos.
- [x] T7 (RF-32, RF-33, RF-34): **Implementar reglas de texto** con conteo de caracteres visibles. Tests de T6 en verde.
- [x] T8 (RF-20, RF-21, RF-22, RF-23, RF-24, RF-25, RF-29): **Test rojo — valores.** WhatsApp (8 y 15 dígitos válidos; 7, 16, `+`, espacios, guiones y letras inválidos); teléfono con `+ - ( )`, 8–15 dígitos, sin letras; email (254 válido, 255 inválido, formatos malos); ícono desconocido con la lista en `expected` y **test de que esa lista coincide con las claves de `iconPaths`**; precio (0,01 y 99.999.999,99 válidos; 0, negativo, 3 decimales, mayor al máximo y texto inválidos); valoración (1 y 5 válidos; 0, 6, 4,5 inválidos); identificador (1 y 60 válidos; mayúsculas, espacios, 61 inválidos).
- [x] T9 (RF-20 a RF-25, RF-29): **Implementar reglas de valores**, importando la lista de íconos desde `src/lib/icons.ts`. Tests de T8 en verde.
- [x] T10 (RF-26, RF-27, RF-28): **Test rojo — enlaces.** URL http/https de 2000 caracteres válida y 2001 inválida; `javascript:`, `data:`, `mailto:`, `tel:`, credenciales y espacios inválidos; ancla vacía o con mayúsculas inválida; redes: solo Instagram y Facebook, otra red es campo desconocido, dominio ajeno aceptado.
- [x] T11 (RF-26, RF-27, RF-28): **Implementar reglas de enlaces.** Tests de T10 en verde.
- [x] T12 (RF-10, RF-13, RF-14, RF-17, RF-29, RF-30): **Test rojo — reglas cruzadas.** Falta email y teléfono a la vez; precio ausente con `showPrice` verdadero (error) y falso (válido); categoría ausente con y sin agrupar; identificadores duplicados; categorías 12 válidas y 13 inválidas; "Cajas regalo" y "cajas  regalo" inconsistentes; `#productos` sin productos y `#testimonios` sin testimonios dan `unknown_anchor` con las secciones disponibles; configuración del catálogo sin productos aceptada; **un caso que combina un error de campo y uno cruzado y los devuelve ambos** (valida la decisión de la segunda pasada).
- [x] T13 (RF-10, RF-13, RF-14, RF-17, RF-29, RF-30): **Implementar la segunda pasada** de reglas cruzadas sobre los datos crudos (protegida contra tipos incorrectos) y unir ambos informes. Tests de T12 en verde y toda la batería anterior sigue en verde.

## Fase 2 — Datos y cargador
- [x] T14 (RF-14, RF-18): **Test rojo.** `site.data.json` existe y es válido; `applyDefaults()` devuelve valores por defecto del catálogo (mostrar precio sí, agrupar no, etiqueta "Consultar por WhatsApp") cuando falta la configuración; no inventa nada en lo demás.
- [x] T15 (RF-14, RF-18): **Crear `src/content/site.data.json`** migrando los datos demo actuales (sin el número propio del catálogo, contrato 2.0) e implementar `applyDefaults()` en el módulo del esquema para poder probarla. Comparar el JSON campo a campo con el `site.config.ts` actual antes de reemplazarlo.
  *Hecho cuando:* tests de T14 en verde.
- [x] T16 (RF-2, RF-14): **Reescribir `src/content/site.config.ts`** como cargador: lee `SITE_DATA` o el JSON por defecto, valida con la misma función, lanza error con el informe completo si es inválido, aplica valores por defecto, y exporta `siteConfig` y `SiteConfig` (tipo derivado del esquema). Los componentes siguen importando desde el mismo lugar.
  *Nota:* entre T16 y T20 el build puede fallar porque `ProductGrid` aún usa el campo retirado; el build vuelve a estar verde al terminar T20.

## Fase 3 — Validación desde línea de comandos y comprobador de la web construida
- [x] T17 (RF-1, RF-3, RF-7) `[P]`: **Test rojo — CLI.** El script devuelve salida 0 con un JSON válido y 1 con uno inválido; muestra la lista completa; `--json` entrega los datos estructurados; acepta una ruta y respeta `SITE_DATA`; su informe es idéntico al de la API para el mismo caso.
- [x] T18 (RF-1, RF-2, RF-3) `[P]`: **Implementar `scripts/validate-site.mjs`** y los scripts de `package.json` `validate`, `test:schema` y `prebuild` (con el flag de Node necesario y sin avisos experimentales). Sin dependencias nuevas.
  *Hecho cuando:* tests de T17 en verde y `npm run validate` pasa con los datos demo.
- [x] T19 (RF-16, RF-17, RF-18, RF-19): **Test primero de la web: `scripts/check-dist.mjs`.** Lee `dist/index.html` y falla si algún `href="#x"` no tiene su `id` o si algún enlace `wa.me` no usa el WhatsApp de contacto. Ejecutarlo contra un build con `site.min.json` (sin productos ni testimonios).
  *Hecho cuando:* falla como se espera (menú y botón principal enlazan a secciones ausentes), que es el "rojo" de la fase de componentes.

## Fase 4 — Componentes (todas `[P]`, archivos distintos; requieren T16 y T19)
- [x] T20 (RF-13, RF-16, RF-18, RF-19) `[P]`: `ProductGrid.astro` — se omite sin productos; usa el WhatsApp de contacto; precio solo si el catálogo lo muestra; categoría opcional sin agrupar.
- [x] T21 (RF-16, RF-17) `[P]`: `index.astro` — menú de escritorio y móvil con solo las secciones existentes; `social` opcional; pie sin contenedor vacío.
- [x] T22 (RF-11, RF-16) `[P]`: `Hero.astro` — botón secundario condicional.
- [x] T23 (RF-11, RF-16) `[P]`: `About.astro` — destacados condicionales.
- [x] T24 (RF-11) `[P]`: `Testimonials.astro` — rol condicional sin dejar línea vacía.
- [x] T25 (RF-16) `[P]`: `Contact.astro` — teléfono, email y dirección condicionales, sin enlaces `mailto:` vacíos.
- [x] T26 (RF-18) `[P]`: Revisar `Services.astro` y `WhatsAppFloat.astro`: compilan con los tipos nuevos y el botón flotante usa el WhatsApp de contacto. Sin cambios si ya cumplen.
- [x] T27 (RF-16, RF-17, RF-18, RF-19): **Build verde y comprobador.** `npm run build` con los datos demo, con `site.min.json` y con `site.max.json` (cada uno con `$env:SITE_DATA`), y `node scripts/check-dist.mjs` después de cada uno.
  *Hecho cuando:* los tres builds pasan y el comprobador no encuentra enlaces rotos (el "verde" de T19).

## Fase 5 — Documentación del contrato (`[P]` con la fase 4; distinto archivo que los componentes)
- [x] T28 (RF-35, RF-36) `[P]`: **Test rojo.** Los archivos generados coinciden con los versionados; `docs/site-schema.md` declara la versión 2.0 y su registro de cambios; un campo `version` en los datos se rechaza como no previsto.
- [x] T29 (RF-35, RF-36) `[P]`: **Implementar `scripts/export-schema.mjs`**, añadir `schema:export` a `package.json`, y generar `docs/site.schema.json` y `docs/site-schema.md` (campos, obligatoriedad, formatos, límites, reglas cruzadas, versión y cambios).
  *Hecho cuando:* tests de T28 en verde.

## Fase 6 — Verificación final
- [x] T30 (RF-2): **Probar la barrera de construcción.** `$env:SITE_DATA` apuntando a un archivo inválido (con varios errores): `npm run build` falla antes de que arranque Astro, con la lista completa; con datos válidos termina bien. Probar también `npx astro build` directo (debe fallar por la validación al importar).
- [x] T31 (RF-16, RF-19, RF-34): **Verificación visual con Chrome DevTools** en `npm run dev`: web mínima (solo servicios y contacto) y máxima a 375 px; consola sin errores; menú sin enlaces a secciones ausentes; el texto `<b>x</b>` de un campo se ve literal.
- [x] T32: **Verificación final** — `npm run test:schema` en verde, `npm run build` en verde, `node scripts/check-setup.mjs` pasa, y recorrer uno a uno los **criterios de finalización de la spec** marcando cada uno. Ejecutar `/verify`. Anotar cualquier desviación.
- [x] T33: **Actualizar `AGENTS.md`** (Stack y estructura, Comandos, Reglas de dominio —retirar la regla de los dos WhatsApp e indicar que el generador escribe `site.data.json` y que los íconos salen de `icons.ts`—, Límites y Verificación). Mostrar el cambio antes de aplicarlo.
- [x] T34: **Actualizar `MEMORY.md`** (máximo ~50 líneas): estado (contrato 2.0), decisiones con su porqué (JSON, Zod de Astro, `SITE_DATA`, doble barrera, `.check()` en lugar de `superRefine`), errores a evitar (sintaxis de variables de entorno en Windows), y el hallazgo de los textos fijos de `About.astro` con la recomendación de abrir la spec 002. Proponer mover a `AGENTS.md` cualquier regla permanente.

## Cobertura de requisitos
| RF | Tareas |
|---|---|
| RF-1, RF-3 | T17, T18 |
| RF-2 | T16, T18, T30 |
| RF-4 a RF-8 | T4, T5 |
| RF-9 | T2, T3, T4, T5 |
| RF-10 a RF-12, RF-15 | T2, T3, T12, T13 |
| RF-13 | T12, T13, T20 |
| RF-14 | T12, T13, T14, T15, T16 |
| RF-16, RF-17 | T12, T13, T19 a T25, T27, T31 |
| RF-18 | T14, T19, T20, T26, T27 |
| RF-19 | T19, T20, T27, T31 |
| RF-20 a RF-25, RF-29 | T8, T9 |
| RF-26 a RF-28 | T10, T11 |
| RF-30 | T12, T13 |
| RF-31 | T2, T3 |
| RF-32 a RF-34 | T6, T7, T31 |
| RF-35, RF-36 | T3, T28, T29 |
