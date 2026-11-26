# Tareas 004 — Interfaz fija en el idioma del cliente (multi-idioma)
> Tareas pequeñas, ordenadas, verificables. Cada una referencia sus RF y termina con tests en verde.
> `[P]` = puede hacerse en paralelo.

## Reglas de ejecución
- **Test primero** en lo que es código nuevo: contrato, traducciones y barrera (T4 a T8). Las plantillas se verifican con builds, la lista de diferencias de HTML y el volcado de layout.
- **Traducciones aprobadas:** el texto de las 28 frases es el de la tabla del plan, aprobada por ti. Cualquier cambio de redacción se te pregunta antes.
- **Bloqueos (me detengo y te lo cuento):** (a) falla un test existente distinto de las comprobaciones de versión; (b) un texto de otro idioma no cabe ni con un ajuste mínimo de espaciado; (c) hace falta algo fuera del plan (dependencia, archivo o cambio de diseño no previsto). Si `z.enum` no informa bien el error, **no** es un bloqueo: se usa la regla propia prevista en el plan.
- **Tests existentes:** solo se tocan las comprobaciones de versión de `site-schema.test.mjs` (3) y `site-text-fields.test.mjs` (4), de "2.1" a "2.2". Los tests nuevos van en `scripts/site-i18n.test.mjs` (archivo nuevo, aprobado con estas tareas).
- **Archivos nuevos aprobados con estas tareas:** `src/content/ui-text.ts`, `scripts/site-i18n.test.mjs` y los fixtures `scripts/fixtures/site.{min,max}.{en,pt}.json`.
- **Nada hacia GitHub, ni commits, ni cambios de la constitución sin tu aprobación expresa.**
- **Archivos temporales** (líneas base, capturas, datos de prueba, copia limpia) en la carpeta temporal de la sesión, nunca en el repositorio.
- **Comandos:** esta sesión ejecuta Bash; para ti, en PowerShell, las variables de entorno van como `$env:SITE_DATA = "..."`.
- **Servidores ajenos:** si hay `astro dev` o `astro preview` corriendo de sesiones anteriores, se reutilizan o se usan otros puertos; no se matan.
- **Ruta crítica:** T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9 → T10 → T11 → T12 a T17 → T18 → T19 → T20 → T21 → T22 → T23 → T24 → T25.

## Fase 0 — Rama, línea base y comprobación previa
- [x] T1: **Crear la rama `feat/multi-idioma` desde `master`.** Comprobar que `master` está al día con `origin`. Los dos documentos de `docs/` que aparecen modificados por fines de línea se regeneran, no se commitean.
  *Hecho cuando:* estás en `feat/multi-idioma` y `git status` solo muestra `specs/004-multi-idioma/` sin seguimiento (más, si aplica, el ruido de fines de línea de `docs/`).
- [x] T2: **Línea base con la `master` actual**, en la carpeta temporal: build de las tres variantes en español (demo, mínima, máxima) guardando cada `dist` y `check-dist`; `npm run test:schema` (490 en verde); volcado de layout y estilos de cada variante a 375, 768 y 1280 px.
  *Hecho cuando:* existen las tres carpetas `dist`, los 9 volcados y el recuento de tests.
- [x] T3 (RF-3, RF-4) `[P]`: **Comprobación previa de Zod (sin tocar el repositorio).** Con un script desechable, ver qué issue devuelve `z.enum` de `astro/zod` para `"fr"`, `""`, `null`, `5`, `[]` y `{}`, y qué JSON Schema produce.
  *Hecho cuando:* queda anotado si el issue permite mapear a `unknown_language` con `expected`, o si hay que usar la regla propia del plan.

## Fase 1 — Contrato y traducciones (test primero)
- [x] T4 (RF-1 a RF-4, RF-6 a RF-8, RF-10, RF-11, RF-13 a RF-16, RF-21): **Tests rojos.** Crear `scripts/site-i18n.test.mjs` y añadirlo a `test:schema`; cambiar a "2.2" las 7 comprobaciones de versión. Casos: `es`, `en` y `pt` válidos; `fr`, `EN`, `pt-BR`, `en-US`, `" en"` y `""` → `unknown_language` en `language` con los tres valores permitidos; `null`, `5`, `true`, `[]` y `{}` → `invalid_type`; `unknown_language` documentado en `ERROR_CODES` y con mensaje en español; el error nuevo se suma a otros en una sola lista y los campos no previstos siguen rechazados; `applyDefaults` sin `language` devuelve `ui` en español y los textos de hoy (instantánea de los 28 textos actuales); con `en` y `pt` devuelve sus títulos neutros iguales al menú y su etiqueta de botón por defecto; los textos del cliente (título, subtítulo, etiqueta) se conservan en cualquier idioma; `htmlLang` es `es`, `en` y `pt-BR`; los mensajes tienen sus marcadores `{name}` y `{product}` en los tres idiomas; completitud (mismas claves, ninguna vacía, mismos marcadores, en/pt sin copiar el español salvo la lista corta de excepciones); los cuatro fixtures nuevos son válidos y traen el `language` que dicen; la variante mínima en español sigue sin traer `language`; los datos 2.0 y 2.1 siguen válidos; documentos con versión 2.2, `language`, `unknown_language` y los valores por defecto de cada idioma.
  *Hecho cuando:* los tests nuevos y las 7 comprobaciones de versión fallan por la razón esperada, y el resto de los 490 siguen en verde.
- [x] T5 (RF-1 a RF-4, RF-6, RF-7, RF-10, RF-11, RF-14, RF-16): **Traducciones y esquema.** Crear `src/content/ui-text.ts` con el texto aprobado; en `site.schema.ts`: `SCHEMA_VERSION` "2.2", entrada 2.2 en `CHANGELOG`, campo `language`, error `unknown_language` en `ERROR_CODES` y en los mensajes, `applyDefaults` con `language`, `ui`, títulos neutros y etiqueta del botón por idioma, y las descripciones de campo con los valores por defecto de cada idioma. `DEFAULT_SECTION_TITLES` y `DEFAULT_CATALOG_CONFIG` se conservan.
  *Hecho cuando:* los tests de T4 están en verde, salvo los de fixtures nuevos y los de documentos (esperado hasta T6 y T7).
- [x] T6 (RF-21) `[P]`: **Fixtures en inglés y portugués.** Crear `site.min.en.json`, `site.min.pt.json`, `site.max.en.json` y `site.max.pt.json` como copias de las variantes en español con `language` añadido. Las variantes en español no cambian.
  *Hecho cuando:* `npm run validate` pasa con los seis fixtures y las variantes en español quedaron intactas.
- [x] T7 (RF-15): **Regenerar la documentación** con `npm run schema:export` y revisar el cambio.
  *Hecho cuando:* `git diff docs` muestra solo la versión 2.2, el campo `language`, el error nuevo y los valores por defecto por idioma, y `npm run test:schema` está completamente en verde.

## Fase 2 — Barrera y plantillas
- [x] T8 (RF-9, RF-18): **Barrera por idioma de `check-dist.mjs`, en rojo primero.** Leer los textos de cada idioma de `ui-text.ts`; si la web está en un idioma, fallar cuando aparezca un texto de otro idioma que no esté en los datos, buscando por palabra completa con letras Unicode y eximiendo las coincidencias entre idiomas. Probarla con el build de la línea base (plantillas viejas) usando los datos mínimos en inglés y en portugués, y con una prueba sintética: "Contact" dentro de "Contacto" no debe dar falso positivo.
  *Hecho cuando:* `check-dist` falla contra el build viejo con `language: "en"` y `"pt"` por los textos en español, y no da falsos positivos en la prueba sintética ni con la demo en español.
- [x] T9 (RF-5, RF-6, RF-11, RF-12): **`index.astro`.** Menú, botón de contacto, `aria-label` del menú, pie y `lang` desde `siteConfig.ui`.
  *Hecho cuando:* las variantes en español, inglés y portugués construyen sin errores.
- [x] T10 (RF-5, RF-7, RF-12, RF-13) `[P]`: **`Contact.astro`, `WhatsAppFloat.astro` y `ProductGrid.astro`** desde `siteConfig.ui` (formulario, tarjetas, `aria-label` y mensajes prellenados con sus marcadores rellenados). Sin tocar nada más de esas plantillas.
  *Hecho cuando:* las variantes en español, inglés y portugués construyen sin errores.
- [x] T11 (RF-9, RF-16, RF-18): **Builds y barrera.** `npm run build` y `check-dist` de la demo, la mínima y la máxima en español y de la mínima y la máxima en inglés y portugués (7 builds); build con `language` inválido (falla con la lista completa y sin ocultar otros errores) y con datos válidos (termina bien).
  *Hecho cuando:* los siete builds pasan `check-dist` y la barrera de datos funciona como en las specs anteriores.

## Fase 3 — Verificación contra la línea base
- [x] T12 (RF-2, RF-20) `[P]`: **El español no cambió.** `compare-builds` entre la línea base de T2 y los builds nuevos de la demo, la mínima y la máxima en español. Revisar cada diferencia.
  *Hecho cuando:* contenido, atributos y espacios: 0 diferencias en las tres variantes, o cada una explicada.
- [x] T13 (RF-19, RF-20) `[P]`: **Español a 375, 768 y 1280 px.** Volcado de layout y estilos de las tres variantes en español, comparado con T2.
  *Hecho cuando:* no hay diferencias (salvo el rebote animado del hero), o están corregidas.
- [x] T14 (RF-5, RF-19) `[P]`: **Inglés y portugués a 375, 768 y 1280 px.** Volcado de layout de las variantes mínima y máxima en inglés y portugués; buscar desbordes y recortes nuevos y mirar en particular el menú a 768 px y la tarjeta de WhatsApp en portugués.
  *Hecho cuando:* sin desbordes ni recortes nuevos en ningún caso, o corregidos con un ajuste mínimo; si no se puede, bloqueo (b).
- [x] T15 (RF-5, RF-8, RF-11, RF-12, RF-13) `[P]`: **Textos, `lang` y mensajes en la web real.** En inglés y en portugués: `lang`, `aria-label`, texto del menú, del formulario y del pie; ningún texto fijo en español; los enlaces de WhatsApp del botón flotante, del contacto y de un producto, decodificados, en el idioma elegido. Con datos temporales: nombre de negocio y de producto con tildes, comillas, emojis y otro alfabeto; títulos, subtítulos y etiquetas del cliente en otro idioma, que se muestran tal cual.
  *Hecho cuando:* todo coincide con la tabla aprobada y con la spec.
- [x] T16 (RF-3, RF-4, RF-16) `[P]`: **`language` inválido de punta a punta.** `npm run validate` y `npm run build` con `fr`, `EN`, `pt-BR`, `""`, `null` y `5`, solos y junto con otros errores.
  *Hecho cuando:* cada uno falla con el error esperado y la lista completa en una sola respuesta.
- [x] T17 (RF-11, RF-12) `[P]`: **Servidor de desarrollo y vista previa en inglés y portugués.** Sin errores de consola y con el menú móvil funcionando, usando puertos distintos de los servidores ya abiertos.
  *Hecho cuando:* sin errores de consola y el menú abre y cierra en ambos idiomas.

## Fase 4 — Instalación limpia
- [x] T18 (RF-14, RF-15): **Copia limpia** del árbol de trabajo (archivos de git, sin ignorados) en la carpeta temporal: `npm ci`, `npm run test:schema`, los siete builds con `check-dist` y `npm audit`. Confirmar que `package.json` solo cambió en el script `test:schema`.
  *Hecho cuando:* todo pasa sobre la instalación limpia y `npm audit` da 0.

## Fase 5 — Constitución, documentación, pull request y fusión
- [x] T19 (RF-22): **Enmienda de la constitución.** Mostrarte el texto exacto de los principios 3, 5 y 6 y aplicarlo solo con tu aprobación expresa.
  *Hecho cuando:* aprobaste el texto y `docs/constitution.md` está actualizado.
- [x] T20 (RF-22): **Actualizar `AGENTS.md`** (convención de idioma, versión 2.2, regla del archivo de traducciones, fixtures y barrera, excepciones conocidas) sin pasar de 60 líneas. Mostrar el texto antes de aplicarlo.
  *Hecho cuando:* aprobaste el texto y `AGENTS.md` está actualizado.
- [x] T21: **Actualizar la rama con `master`** y repetir la verificación abreviada (tests y builds) si hubo cambios.
  *Hecho cuando:* la rama incluye `master` y la verificación pasa.
- [x] T22: **Pedir tu aprobación para commitear, subir la rama y abrir el pull request.** Lleva la evidencia, las comprobaciones de versión modificadas explicadas, las traducciones aprobadas, la enmienda de la constitución y el procedimiento de reversión (`git revert -m 1`).
  *Hecho cuando:* aprobaste y el pull request está abierto.
- [x] T23: **Fusionar** con tu aprobación expresa (un solo merge commit).
  *Hecho cuando:* el pull request está fusionado y `master` local actualizada.

## Fase 6 — Verificación final y memoria
- [x] T24: **Verificación final.** Recorrer uno a uno los criterios de finalización de la spec y ejecutar `/verify`; anotar cualquier desviación.
  *Hecho cuando:* todos los criterios están marcados o la desviación está explicada.
- [x] T25 (RF-22): **Actualizar `MEMORY.md`** (máximo ~50 líneas): estado, decisiones con su porqué, errores a evitar y pendientes. Proponer mover a `AGENTS.md` cualquier regla permanente. El commit y su subida, solo con tu aprobación.
  *Hecho cuando:* `MEMORY.md` está al día y, con tu aprobación, subido.

## Cobertura de requisitos
| RF | Tareas |
|---|---|
| RF-1, RF-2 | T3, T4, T5, T12 |
| RF-3, RF-4 | T3, T4, T5, T16 |
| RF-5 | T4, T9, T10, T14, T15 |
| RF-6, RF-7 | T4, T5, T10, T15 |
| RF-8 | T4, T15 |
| RF-9 | T8, T11 |
| RF-10 | T4, T5 |
| RF-11 | T4, T9, T15, T17 |
| RF-12 | T9, T10, T15, T17 |
| RF-13 | T4, T10, T15 |
| RF-14 | T4, T5, T7, T18 |
| RF-15 | T4, T5, T7, T18 |
| RF-16 | T4, T5, T11, T16 |
| RF-17 | Aprobada con el plan; reglas de ejecución |
| RF-18 | T8, T11 |
| RF-19 | T13, T14 |
| RF-20 | T12, T13 |
| RF-21 | T4, T6 |
| RF-22 | T19, T20, T25 |
