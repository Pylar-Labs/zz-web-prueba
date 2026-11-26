# Tareas 003 — Llevar a los datos los textos fijos falsos o de un rubro
> Tareas pequeñas, ordenadas, verificables. Cada una referencia sus RF y termina con tests en verde.
> `[P]` = puede hacerse en paralelo.

## Reglas de ejecución
- **Test primero** en lo que es código nuevo: el esquema (T4 a T6) y la barrera de `check-dist` (T8). Las plantillas se verifican con builds y volcado de layout.
- **Bloqueos (me detengo y te lo cuento):** (a) falla un test existente distinto de las 3 comprobaciones de versión; (b) una cifra de 10 caracteres no cabe a 375 px ni con el tamaño adaptable (podría exigir bajar el límite de 10, decisión tuya); (c) hace falta algo fuera del plan (dependencia, archivo o cambio de diseño no previsto).
- **Tests existentes:** solo se tocan las 3 comprobaciones de versión de `site-schema.test.mjs` (líneas 340, 353 y 934), de "2.0" a "2.1". Los tests nuevos van en `scripts/site-text-fields.test.mjs` (archivo nuevo; lo apruebas con estas tareas).
- **Nada hacia GitHub ni commits sin tu aprobación:** ni commit, ni push, ni pull request, ni fusión.
- **Archivos temporales** (líneas base, capturas, datos de prueba, clon limpio) en la carpeta temporal de la sesión, nunca en el repositorio.
- **Comandos:** esta sesión ejecuta Bash; para ti, en PowerShell, las variables de entorno van como `$env:SITE_DATA = "..."`.
- **Ruta crítica:** T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9 → T10 → T11 → T12 a T17 → T18 → T19 → T20 → T21 → T22 → T23 → T24.

## Fase 0 — Rama, línea base y medición
- [x] T1: **Crear la rama `feat/textos-a-datos` desde `master`.** Comprobar que `master` está actualizada con `origin` y que lo único sin seguimiento es `specs/003-textos-fijos-a-datos/`.
  *Hecho cuando:* estás en `feat/textos-a-datos` y `git status` solo muestra la carpeta de la spec.
- [x] T2: **Línea base con la `master` actual**, en la carpeta temporal: build de las tres variantes (demo, mínima, máxima) guardando cada `dist` y `check-dist`; `npm run test:schema` (416 en verde); volcado de layout y estilos de cada variante a 375, 768 y 1280 px.
  *Hecho cuando:* existen las tres carpetas `dist`, los 9 volcados y el recuento de tests.
- [x] T3 (RF-23) `[P]`: **Medir las cifras (sin tocar el repositorio).** Sobre la vista previa de la línea base, sustituir en la página el texto de la cifra destacada y de las pequeñas por valores de 3, 5, 7, 8 y 10 caracteres (incluido uno de 10 sin puntos de corte) y anotar a 375, 768 y 1280 px el ancho que ocupa cada tamaño de letra frente al ancho disponible.
  *Hecho cuando:* hay una tabla "largo del valor → tamaño de letra más grande que cabe" para la cifra destacada y para las pequeñas, con los umbrales propuestos. Si 10 caracteres no caben a 375 px con el tamaño más pequeño razonable, es el bloqueo (b).

## Fase 1 — Contrato (test primero)
- [x] T4 (RF-1 a RF-3, RF-7 a RF-9, RF-12 a RF-16, RF-18): **Tests rojos.** Crear `scripts/site-text-fields.test.mjs` y añadirlo a `test:schema` en `package.json`; cambiar a "2.1" las 3 comprobaciones de versión. Casos: 0 a 3 cifras válidas y 4 → `too_many`; límite exacto y uno por encima de valor (10), descripción (40), título (80) y subtítulo (200); emoji y tilde combinada = 1 carácter; salto de línea → `line_break`; vacío o solo espacios → `empty`; valor numérico → `invalid_type`; solo valor o solo descripción → `required` en la ruta que falta; lista vacía válida; campo no previsto en `stats[0]`, `sections` y cada sección → `unrecognized_field`; `sections` vacío y secciones vacías válidos; título de productos sin productos válido (RF-12); espacios en los bordes conservados y entrada sin modificar; errores nuevos con ruta, código y mensaje en español sumados a otros errores en una lista; `applyDefaults` devuelve los cuatro títulos neutros y `about.stats` como lista; los fixtures y los datos 2.0 siguen válidos.
  *Hecho cuando:* los tests nuevos y las 3 comprobaciones de versión fallan por la razón esperada, y los otros 413 siguen en verde.
- [x] T5 (RF-1 a RF-3, RF-7 a RF-9, RF-12, RF-18): **Implementar en `site.schema.ts`:** `SCHEMA_VERSION` "2.1", entrada 2.1 en `CHANGELOG`, tipos `Stat` y `SectionHeading` con su documentación de campo, `about.stats`, `sections`, `DEFAULT_SECTION_TITLES`, `ResolvedSite` y `applyDefaults`.
  *Hecho cuando:* los tests de T4 están en verde. Los de documentos fallan hasta T7: es lo esperado.
- [x] T6 (RF-20, RF-21) `[P]`: **Datos de ejemplo.** Ampliar `site.max.json` (3 cifras en el límite, una con valor de 10 caracteres sin puntos de corte, y los cuatro `sections` con título de 80 y subtítulo de 200); `site.min.json` no cambia; en `site.data.json` añadir `about.stats` y `sections` con los textos actuales y cambiar los destacados para que no repitan las cifras.
  *Hecho cuando:* `npm run validate` pasa con las tres variantes, la mínima no trae ningún campo nuevo y la máxima trae todos.
- [x] T7 (RF-19): **Regenerar la documentación** con `npm run schema:export` y revisar el cambio.
  *Hecho cuando:* `git diff docs` muestra solo la versión 2.1, el registro de cambios y los campos nuevos, y `npm run test:schema` está completamente en verde (416 + los nuevos).

## Fase 2 — Barrera y plantillas
- [x] T8 (RF-6, RF-11, RF-24): **Barrera de `check-dist.mjs`, en rojo primero.** Añadir la comprobación: ninguno de los textos antiguos ("14+", "500+", "100%", "años de experiencia", "clientes satisfechos", "artesanal", "Nuestros servicios", "Todo lo que necesitás en un solo lugar", "Nuestros productos", "Elaborados con ingredientes naturales de la región", "Lo que dicen nuestros clientes", "Experiencias reales de personas reales", "Contactanos", "te respondemos a la brevedad") puede estar en el HTML si no figura en los datos; y cada sección mostrada tiene un `h2`. Probarla con el build de la línea base (plantillas viejas) usando los datos mínimos.
  *Hecho cuando:* `check-dist` falla contra ese build viejo por los textos antiguos (prueba de que detecta lo que debe).
- [x] T9 (RF-4, RF-5, RF-6, RF-17, RF-23, RF-24): **`About.astro`.** Cifras desde `siteConfig.about.stats`; tarjeta y cuadrados decorativos solo con cifras; una sola columna sin cifras; 1, 2 o 3 cifras sin celdas vacías; tamaños por largo con los umbrales de T3 y `overflow-wrap:anywhere`; con 3 cifras cortas, las clases iguales a las actuales.
  *Hecho cuando:* la demo, la mínima y la máxima construyen sin errores.
- [x] T10 (RF-7 a RF-13, RF-17, RF-24) `[P]`: **Títulos y subtítulos** en `Services.astro`, `ProductGrid.astro`, `Testimonials.astro` y `Contact.astro`, desde `siteConfig.sections`; el subtítulo solo si existe; sin tocar nada más de esas plantillas.
  *Hecho cuando:* las tres variantes construyen sin errores.
- [x] T11 (RF-6, RF-11, RF-24): **Builds y barrera.** `npm run build` y `check-dist` de las tres variantes; build con datos inválidos (falla con la lista completa) y con válidos (termina bien).
  *Hecho cuando:* las tres variantes pasan `check-dist` con la comprobación nueva y la barrera de datos funciona como en la spec 001.

## Fase 3 — Verificación contra la línea base
- [x] T12 (RF-20, RF-25, RF-26) `[P]`: **Lista de diferencias de la demo.** `compare-builds` entre la línea base y el build nuevo de la demo. Revisar cada diferencia una a una.
  *Hecho cuando:* las únicas diferencias son los destacados cambiados a propósito (y cualquier otra está explicada o corregida).
- [x] T13 (RF-20, RF-22, RF-26) `[P]`: **Demo a 375, 768 y 1280 px.** Volcado de layout y estilos más capturas, comparados con los de T2.
  *Hecho cuando:* no hay diferencias salvo los destacados, o están corregidas.
- [x] T14 (RF-5, RF-9, RF-10, RF-18, RF-22) `[P]`: **Variante mínima a 375, 768 y 1280 px.** Sin tarjeta ni cuadrados decorativos, texto de "Quiénes somos" a todo el ancho en una columna, títulos neutros, sin subtítulos, sin huecos. Incluir los datos 2.0 originales (`git show master:src/content/site.data.json`): válidos, con títulos neutros y sin cifras.
  *Hecho cuando:* las observaciones coinciden con la spec en los tres anchos.
- [x] T15 (RF-4, RF-23) `[P]`: **Variante máxima y casos de borde.** Con la máxima, y con datos temporales de 1 cifra, 2 cifras, valor de 10 caracteres sin puntos de corte, título de 80 caracteres sin espacios y caracteres anchos (por ejemplo, japonés): sin desborde ni recorte a 375, 768 y 1280 px, y sin celdas vacías.
  *Hecho cuando:* el volcado de layout no muestra desbordes en ningún caso, o están corregidos; si no se puede, bloqueo (b).
- [x] T16 (RF-12, RF-17) `[P]`: **Texto con HTML y sección omitida.** Con datos temporales, `<b>` y `<script>` en todos los textos nuevos: `dist` los muestra literales y no se ejecutan en la página; con un título de productos y sin productos: construye bien y la sección no existe.
  *Hecho cuando:* el HTML se muestra literal, no se ejecuta, y la sección omitida no aparece.
- [x] T17 (RF-24) `[P]`: **Servidor de desarrollo y vista previa.** `npm run dev` y `npm run preview` sin errores de consola; el menú móvil abre y cierra.
  *Hecho cuando:* sin errores de consola y el menú funciona en ambos.

## Fase 4 — Instalación limpia
- [x] T18 (RF-18, RF-19): **Clon limpio** de la rama en la carpeta temporal, con `core.autocrlf=false`: `npm ci`, `npm run test:schema`, tres builds y `check-dist`. Confirmar que `npm audit` sigue en 0 y que `package.json` solo cambió en el script `test:schema`.
  *Hecho cuando:* todo pasa sobre la instalación limpia.

## Fase 5 — Documentación, pull request y fusión
- [x] T19 (RF-27): **Actualizar `AGENTS.md`** (versión 2.1, excepciones conocidas, nota breve de los campos nuevos y recorte para bajar de 60 líneas). Mostrar el texto antes de aplicarlo.
  *Hecho cuando:* aprobaste el texto y `AGENTS.md` está actualizado.
- [x] T20: **Actualizar la rama con `master`** y repetir la verificación abreviada (tests y builds) si hubo cambios.
  *Hecho cuando:* la rama incluye `master` y la verificación pasa.
- [x] T21: **Pedir tu aprobación para commitear, subir la rama y abrir el pull request.** Lleva: evidencia (diferencias de la demo, volcados de layout, casos de borde), los 3 tests de versión modificados explicados, y el procedimiento de reversión (`git revert -m 1`).
  *Hecho cuando:* aprobaste y el pull request está abierto.
- [x] T22: **Fusionar** con tu aprobación expresa (un solo merge commit).
  *Hecho cuando:* el pull request está fusionado y `master` local actualizada.

## Fase 6 — Verificación final y memoria
- [x] T23: **Verificación final.** Recorrer uno a uno los criterios de finalización de la spec y ejecutar `/verify`; anotar cualquier desviación.
  *Hecho cuando:* todos los criterios están marcados o la desviación está explicada.
- [x] T24 (RF-27): **Actualizar `MEMORY.md`** (máximo ~50 líneas): estado, decisiones con su porqué, errores a evitar y pendientes. Proponer mover a `AGENTS.md` cualquier regla permanente. El commit y su subida, solo con tu aprobación.
  *Hecho cuando:* `MEMORY.md` está al día y, con tu aprobación, subido.

## Cobertura de requisitos
| RF | Tareas |
|---|---|
| RF-1, RF-2, RF-3 | T4, T5 |
| RF-4 | T9, T15 |
| RF-5 | T9, T14 |
| RF-6 | T8, T9, T11 |
| RF-7, RF-8 | T4, T5, T10 |
| RF-9 | T4, T5, T10, T14 |
| RF-10 | T10, T14 |
| RF-11 | T8, T10, T11 |
| RF-12 | T4, T5, T16 |
| RF-13 a RF-16 | T4, T5 |
| RF-17 | T9, T10, T16 |
| RF-18 | T4, T5, T14, T18 |
| RF-19 | T7, T18 |
| RF-20 | T6, T12, T13 |
| RF-21 | T6 |
| RF-22 | T13, T14 |
| RF-23 | T3, T9, T15 |
| RF-24 | T8, T9, T10, T17 |
| RF-25 | T12 |
| RF-26 | T12, T13 |
| RF-27 | T19, T24 |
