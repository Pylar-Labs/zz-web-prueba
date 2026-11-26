# Tareas 006 — Moneda y formato de precio
> Tareas pequeñas, ordenadas, verificables. Cada una referencia sus RF y termina con tests en verde.
> `[P]` = puede hacerse en paralelo.

## Reglas de ejecución
- **Test primero** en lo que es código nuevo: el contrato, la regla de decimales y el formato (T4 a T7). La plantilla se verifica con builds, la lista de diferencias de HTML y el volcado de layout.
- **La tabla de textos del plan está aprobada.** Cualquier cambio de un texto se te pregunta antes.
- **Bloqueos (me detengo y te lo cuento):** (a) falla un test existente distinto de las comprobaciones de versión; (b) la comprobación de Node 22 (T3) muestra textos distintos a la tabla; (c) un precio no cabe a 375 px ni con un ajuste mínimo de estilo; (d) hace falta algo fuera del plan (dependencia, archivo o cambio de diseño no previsto).
- **Tests existentes:** solo se tocan las comprobaciones de versión de `site-schema.test.mjs` (3), `site-text-fields.test.mjs` (4) y `site-i18n.test.mjs` (4), de "2.2" a "2.3", con sus títulos. Los tests nuevos van en `scripts/site-currency.test.mjs` (archivo nuevo, aprobado con estas tareas).
- **Archivos nuevos aprobados con estas tareas:** `src/content/price-format.ts`, `scripts/site-currency.test.mjs` y cinco fixtures `scripts/fixtures/site.price.{usd.es,ars.en,ars.pt,clp.es,mxn.es}.json`.
- **Descargar Node 22 (T3) necesita tu aprobación expresa** y solo se hace en la carpeta temporal, sin tocar el proyecto ni `package.json`.
- **Nada hacia GitHub ni commits sin tu aprobación expresa.**
- **Archivos temporales** (líneas base, datos de prueba, volcados, copia limpia) en la carpeta temporal de la sesión, nunca en el repositorio.
- **Comandos:** esta sesión ejecuta Bash; para ti, en PowerShell, las variables de entorno van como `$env:SITE_DATA = "..."`.
- **Servidores ajenos:** si hay `astro dev` o `astro preview` de sesiones anteriores, se dejan como están.
- **Ruta crítica:** T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9 → T10 a T13 → T14 → T15 → T16 → T17 → T18 → T19 → T20 → T21.

## Fase 0 — Rama, línea base y plataforma
- [x] T1: **Crear la rama `feat/moneda-precio` desde `master`.** Comprobar que `master` está al día con `origin`.
  *Hecho cuando:* estás en `feat/moneda-precio` y `git status` solo muestra la carpeta de la spec sin seguimiento.
- [x] T2: **Línea base con la `master` actual**, en la carpeta temporal: build de la demo, la mínima y la máxima en español, inglés y portugués (7 builds) guardando cada `dist` y `check-dist`; `npm run test:schema` (596 en verde) y el comparador (17).
  *Hecho cuando:* existen los 7 `dist` de la línea base y el recuento de tests.
- [x] T3 (RF-6, RF-7, RF-8) `[P]`: **Comprobar la tabla en la plataforma.** (a) En este Node 24, un script desechable verifica que `Intl.NumberFormat` produce exactamente los textos de la tabla aprobada (27 combinaciones, máximos y mínimos) y que CLP y COP informan 0 decimales y el resto 2. (b) Pedirte aprobación para descargar una copia desechable de Node 22.23.4 (con `npx`, fuera del proyecto) y repetir (a) en ella.
  *Hecho cuando:* la tabla coincide en Node 24 y está anotado qué pasó con Node 22 (coincide, difiere o no se aprobó la descarga). Si difiere, es el bloqueo (b).

## Fase 1 — Contrato y formato (test primero)
- [x] T4 (RF-1 a RF-10, RF-12 a RF-14, RF-18): **Tests rojos.** Crear `scripts/site-currency.test.mjs` y añadirlo a `test:schema` en `package.json`; cambiar a "2.3" las 11 comprobaciones de versión. Casos: las nueve monedas válidas; `ars`, `JPY`, `" USD"`, `""` y `Usd` → `unknown_currency` en `productGridConfig.currency` con las nueve monedas y sin corregir; `null`, número, lista, objeto y booleano → `invalid_type`; sin moneda y sin configuración del catálogo, la `currency` resuelta es `ARS` y `productGridConfig` resuelto no cambia; moneda sin productos → válida; CLP y COP con `1800.5` → `price_currency_decimals` en la ruta del precio y con la moneda en el mensaje, también con `showPrice: false`; CLP y COP con entero y con ruido (`1800.0000001`) → válidos; USD y demás con 2 decimales → válidos; `1.005` en CLP → solo el error de "más de 2 decimales"; moneda inválida más precio con decimales → solo el error de la moneda; errores nuevos junto a otros en una lista; las 27 combinaciones de `formatPrice` exactas, los máximos y los mínimos; el espacio es U+00A0 donde aparece; `0.30000000000000004` se muestra como 0,30 sin error; la tabla de decimales coincide con la de la plataforma; los cinco fixtures nuevos válidos; los datos 2.2 siguen válidos; documentos con versión 2.3, el campo, los dos errores, la regla y sin la frase "símbolo $".
  *Hecho cuando:* los tests nuevos y las 11 comprobaciones de versión fallan por la razón esperada, y los demás tests existentes siguen en verde.
- [x] T5 (RF-1 a RF-10, RF-12, RF-14): **Formato y esquema.** Crear `src/content/price-format.ts` (monedas, decimales, locales, `formatPrice`); en `site.schema.ts`: versión 2.3 y `CHANGELOG`, campo `productGridConfig.currency`, `unknown_currency` y `price_currency_decimals` en `ERROR_CODES`, mensajes y `toErrors`, regla en `CROSS_RULES` y `crossRules`, `currency` resuelta en la raíz de `applyDefaults` y `ResolvedSite`, y la descripción de `price` sin la frase del símbolo `$`.
  *Hecho cuando:* los tests de T4 están en verde, salvo los de fixtures y de documentos (esperado hasta T6 y T7).
- [x] T6 (RF-17, RF-18) `[P]`: **Fixtures de precio.** Crear `site.price.usd.es.json`, `site.price.ars.en.json`, `site.price.ars.pt.json`, `site.price.clp.es.json` y `site.price.mxn.es.json` a partir de la variante mínima, con su idioma y su moneda y tres productos cada uno: precio mínimo (0,01; 1 en CLP), 1800,50 (1800 en CLP) y máximo (99.999.999,99; 99.999.999 en CLP).
  *Hecho cuando:* `npm run validate` pasa con los cinco y las demás fixtures quedaron intactas.
- [x] T7 (RF-13): **Regenerar la documentación** con `npm run schema:export` y revisar el cambio.
  *Hecho cuando:* `git diff docs` muestra solo la versión 2.3, el campo, los errores, la regla y la descripción del precio corregida, y `npm run test:schema` está completamente en verde.

## Fase 2 — Plantilla y builds
- [x] T8 (RF-6, RF-11, RF-16): **`ProductGrid.astro`.** El texto del precio usa `formatPrice` con la `currency` y el `language` resueltos, dentro del mismo `<span>` y sin tocar clases ni marcado.
  *Hecho cuando:* las variantes construyen sin errores.
- [x] T9 (RF-14, RF-18): **Builds y barrera.** `npm run build` y `check-dist` de la demo, la mínima y la máxima en español, inglés y portugués y de los cinco fixtures de precio (12 builds); build con una moneda inválida, con CLP y decimales y con ambos a la vez (fallan con la lista completa) y con datos válidos (termina bien).
  *Hecho cuando:* los 12 builds pasan `check-dist` y la barrera de datos funciona como en las specs anteriores.

## Fase 3 — Verificación contra la línea base
- [x] T10 (RF-11, RF-16) `[P]`: **La demo solo cambia en el precio.** `compare-builds` entre la línea base y el build nuevo de la demo; revisar cada diferencia. Repetirlo con la máxima, cuyos precios llevan decimales.
  *Hecho cuando:* las únicas diferencias son el texto de los precios (sin diferencias de estructura, atributos ni espacios fuera de él).
- [x] T11 (RF-6 a RF-9) `[P]`: **Cada precio de la web real es el esperado.** Un script desechable lee cada build (los 12) y, para cada producto de los datos, comprueba que el HTML contiene exactamente el texto de `formatPrice` con la moneda y el idioma de esos datos.
  *Hecho cuando:* todos los precios de los 12 builds coinciden con la tabla aprobada y no hay ningún precio sin formatear.
- [x] T12 (RF-17) `[P]`: **Layout con los precios más anchos.** Volcado a 375, 768 y 1280 px de las variantes de precio máximo (español con USD, inglés y portugués con ARS), de CLP y de MXN, comparado con la demo; buscar desbordes y recortes nuevos.
  *Hecho cuando:* sin desbordes ni recortes nuevos en ningún caso, o corregidos con un ajuste mínimo de estilo; si no se puede, bloqueo (c).
- [x] T13 (RF-3, RF-4, RF-10, RF-14) `[P]`: **Errores de punta a punta.** `npm run validate` y `npm run build` con las monedas inválidas, los tipos equivocados, CLP y COP con decimales (con precios visibles y ocultos), moneda inválida más decimales y un precio con 3 decimales.
  *Hecho cuando:* cada caso falla con el error esperado, la ruta correcta y la lista completa en una sola respuesta.

## Fase 4 — Instalación limpia
- [x] T14 (RF-12, RF-13): **Copia limpia** del árbol de trabajo (archivos de git, sin ignorados) en la carpeta temporal: `npm ci`, `npm run test:schema`, el comparador, los 12 builds con `check-dist` y `npm audit`. Confirmar que `package.json` solo cambió en el script `test:schema`.
  *Hecho cuando:* todo pasa sobre la instalación limpia y `npm audit` da 0.

## Fase 5 — Documentación, pull request y fusión
- [x] T15 (RF-19): **Actualizar `AGENTS.md`** (excepciones conocidas sin el símbolo `$`, versión 2.3 y nota del formato de precio y de `currency`) sin pasar de lo que `check-setup` admite. Mostrar el texto antes de aplicarlo.
  *Hecho cuando:* aprobaste el texto y `AGENTS.md` está actualizado con `check-setup` sin avisos.
- [x] T16: **Actualizar la rama con `master`** y repetir la verificación abreviada (tests y builds) si hubo cambios.
  *Hecho cuando:* la rama incluye `master` y la verificación pasa.
- [x] T17: **Pedir tu aprobación para commitear, subir la rama y abrir el pull request.** Lleva la evidencia, las comprobaciones de versión modificadas, la tabla aprobada, el resultado de Node 22 (o que no se comprobó) y la reversión (`git revert -m 1`).
  *Hecho cuando:* aprobaste y el pull request está abierto.
- [x] T18: **Fusionar** con tu aprobación expresa (un solo merge commit).
  *Hecho cuando:* el pull request está fusionado y `master` local actualizada.

## Fase 6 — Verificación final y memoria
- [x] T19: **Verificación final.** Recorrer uno a uno los criterios de finalización de la spec y ejecutar `/verify`; anotar cualquier desviación.
  *Hecho cuando:* todos los criterios están marcados o la desviación está explicada.
- [x] T20 (RF-19): **Actualizar `MEMORY.md`** (máximo ~50 líneas): estado, decisiones con su porqué, aprendizajes y pendientes. El commit y su subida, solo con tu aprobación.
  *Hecho cuando:* `MEMORY.md` está al día y, con tu aprobación, subido.
- [x] T21: **Borrar la rama `feat/moneda-precio`** (local y remota) si lo apruebas.
  *Hecho cuando:* la rama no existe o decidiste conservarla.

## Cobertura de requisitos
| RF | Tareas |
|---|---|
| RF-1 | T4, T5 |
| RF-2 | T4, T5 |
| RF-3 | T4, T5, T13 |
| RF-4 | T4, T5, T13 |
| RF-5 | T4, T5 |
| RF-6 | T3, T4, T5, T8, T11 |
| RF-7 | T3, T4, T5, T11 |
| RF-8 | T3, T4, T5, T11 |
| RF-9 | T4, T5, T11 |
| RF-10 | T4, T5, T13 |
| RF-11 | T4, T8, T10 |
| RF-12 | T4, T5, T7, T14 |
| RF-13 | T4, T7, T14 |
| RF-14 | T4, T5, T9, T13 |
| RF-15 | Aprobada con el plan; reglas de ejecución |
| RF-16 | T8, T10 |
| RF-17 | T6, T12 |
| RF-18 | T4, T6, T9 |
| RF-19 | T15, T20 |
