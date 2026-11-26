# Tareas 012 — Tarjeta de cifras de «Quiénes somos» con una o dos cifras
> Tareas pequeñas, ordenadas, verificables. Cada una referencia sus RF y termina con tests en verde.
> `[P]` = puede hacerse en paralelo.

## Reglas de ejecución
- **Test primero** en lo que se puede probar con tests: el test de los fixtures (T3) y los del número de variantes (T4) se escriben en rojo antes de crearlos y de cambiar los números (T5 a T7). Lo visual no tiene test automático: se mide, y **la referencia «antes» se toma antes de tocar el componente** (T8 y T9).
- **Plan aprobado, con sus tres decisiones:** cuatro fixtures (16 variantes), «misma salida» entendida como mismo HTML y mismos textos en las variantes sin cifras con el CSS compartido revisado a mano, y test guardián del número de variantes. Cualquier otro cambio se te pregunta antes.
- **Bloqueos (me detengo y te lo cuento):** (a) falla un test existente distinto de los que fijan el número de variantes o el nombre del paso; (b) hace falta tocar `package.json`, el lockfile, el contrato, `check-dist.mjs`, otro componente o crear un archivo que no sea de los cuatro fixtures; (c) la referencia «antes» no se pudo tomar con el código original; (d) tras el cambio alguna variante muestra recorte o desborde a algún ancho, o 0, 1 o 3 cifras de largo normal cambian más de 1 px; (e) `min-h-fit` no hace crecer el recuadro y el plan B (quitar `overflow-hidden`) tampoco; (f) el HTML de una variante sin cifras cambia; (g) la ejecución del CI pasa de 8 minutos o se agota la cuota de Actions; (h) en GitHub el resumen sale distinto de lo previsto.
- **Tests existentes:** los 767 de `test:schema` siguen en verde salvo los que fijan 12 variantes o «Construir las 12 variantes», que pasan a 16. Los comparadores (17) y los de tipos (14) no se tocan.
- **Archivos del repositorio que se tocan:** `src/components/sections/About.astro`, los cuatro fixtures nuevos, `scripts/site-schema.test.mjs`, `scripts/ci-verify.mjs`, `scripts/ci-verify.test.mjs`, `.github/workflows/verificacion.yml`, `AGENTS.md`, `MEMORY.md` y la carpeta de la spec. Nada más.
- **`AGENTS.md`:** el texto exacto del plan se te muestra de nuevo y se aplica solo con tu aprobación; `check-setup` debe seguir sin avisos (59 líneas como máximo).
- **Nada hacia GitHub sin tu aprobación expresa:** commits, subidas, pull requests, cierres y borrados. La subida dispara una ejecución de ~5 a 7 minutos de Actions; cada arreglo se te presenta antes de subirlo.
- **Agentes y worktrees:** los worktrees de los agentes viven dentro del repositorio (`.claude/worktrees`): se borran al terminar y no ejecuto `typecheck` ni `test:typecheck` mientras existan. Verifico cada informe de un agente (rama, SHA, diff, tests) antes de usarlo. Los hallazgos reales de una revisión se te presentan antes de corregirlos.
- **Archivos temporales** (la página de medición, las referencias, los builds de comparación) en la carpeta temporal de la sesión, nunca en el repositorio. Los builds de comparación van fuera del repositorio (`--out`).
- **Servidores:** el servidor de vista previa de la medición se levanta en un puerto propio (no los 4321, 4431 y 4432 de otras sesiones) y se detiene al terminar.
- **Comandos:** esta sesión ejecuta Bash; para ti, en PowerShell, las variables de entorno van como `$env:NOMBRE = "..."`.
- **Ruta crítica:** T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9 → T10 → T11 → T13 → T14 → T16 → T17 → T18 → T19 → T20 → T21 → T22.

## Fase 0 — Rama y base
- [ ] T1: **Crear la rama `feat/tarjeta-de-cifras` desde `master`.** Comprobar que `master` está al día con `origin`.
  *Hecho cuando:* estás en `feat/tarjeta-de-cifras` y `git status` solo muestra la carpeta de la spec sin seguimiento.
- [x] T2 `[P]`: **Base.** Anotar los recuentos de referencia (`npm run test:schema` 767, el comparador 17, `npm run test:typecheck` 14, la revisión de tipos) y comprobar en GitHub que la última ejecución del CI sobre `master` está en verde.
  *Hecho cuando:* los recuentos y el estado del CI están anotados.

## Fase 1 — Tests rojos y fixtures
- [x] T3 (RF-8): **Test de los fixtures: rojo.** En `scripts/site-schema.test.mjs`: un test que carga `site.stats.one`, `site.stats.two`, `site.stats.two-limits` y `site.stats.three-limits`, comprueba que validan con el contrato, que tienen 1, 2, 2 y 3 cifras, que los de límites incluyen un valor de 10 caracteres y una etiqueta de 40 (y que la segunda cifra de `two-limits` combina valor con espacios y etiqueta sin espacios), y que los de largo normal no pasan de 6 caracteres de valor.
  *Hecho cuando:* el test falla porque los archivos aún no existen, y los demás tests siguen en verde.
- [x] T4 (RF-9): **Número de variantes: tests rojos.** En `scripts/ci-verify.test.mjs`: `listVariants` devuelve 16 (la demo y los 15 fixtures, con los nombres `stats.one`, `stats.two`, `stats.two-limits` y `stats.three-limits`), «Construir las 12 variantes» pasa a «Construir las 16 variantes» en los tests que lo citan, y un test guardián que compara el número del nombre del paso (`STEP_NAMES.builds`) con `listVariants().length`.
  *Hecho cuando:* los tests fallan por la razón esperada (los fixtures y los números aún no existen) y los demás siguen en verde.
- [x] T5 (RF-8): **Crear los cuatro fixtures.** Copias de `scripts/fixtures/site.min.json` con `about.stats` reemplazado: `site.stats.one.json` (1 cifra de largo normal), `site.stats.two.json` (2 de largo normal), `site.stats.two-limits.json` (2 en los límites) y `site.stats.three-limits.json` (3 en los límites), todo en español y con textos que no sean del template antiguo.
  *Hecho cuando:* el test de T3 está en verde, `npm run validate` acepta cada uno y `listVariants` devuelve 16.
- [x] T6 (RF-9): **`scripts/ci-verify.mjs`: «12» → «16».** En el comentario inicial, `STEP_NAMES.builds` y el mensaje de uso.
  *Hecho cuando:* los tests de T4 están en verde, salvo la prueba del workflow real, que queda roja hasta T7.
- [x] T7 (RF-9): **`.github/workflows/verificacion.yml`: «12» → «16».** El comentario inicial y el nombre del paso «Construir las 16 variantes»; nada más.
  *Hecho cuando:* la prueba del workflow real (vigilante de la spec 010) pasa y `git diff` solo muestra esos dos textos.

## Fase 2 — Medición «antes» y arreglo
- [x] T8 (RF-2, RF-5, RF-6): **Preparar la medición (fuera del repositorio).** En la carpeta temporal de la sesión: una página de medición con un `iframe` por ancho (375, 768, 1024 y 1280 px) que sirve cada variante y mide, por cada una, el ancho y el alto del recuadro y de cada cifra, si el contenido supera al contenedor (más de 1 px) y si hay scroll horizontal, y un script que lo guarda en JSON. Servirla en un puerto propio.
  *Hecho cuando:* la página mide una variante conocida y el resultado es coherente con lo ya visto (con `stats.two`: tarjeta de 52 px).
- [x] T9 (RF-5, RF-6, RF-11): **Referencia «antes».** Con el componente aún sin tocar, construir las 16 variantes con `npm run verify:ci -- --out <carpeta temporal>` (así también se comprueba que las 16 construyen y pasan `check-dist`), guardar esos builds como base de `compare-builds`, y medir demo, `max`, `min`, `stats.one` y `stats.two` a los cuatro anchos; guardar el JSON.
  *Hecho cuando:* los builds base y las medidas «antes» existen fuera del repositorio, con el defecto de `stats.two` visible en ellas.
- [x] T10 (RF-1, RF-3, RF-7): **`About.astro`: el arreglo.** `min-h-fit` en el recuadro; en la tarjeta de la segunda cifra quitar `w-[calc(50%-0.5rem)]` y añadir `min-w-28`; actualizar el comentario. Sin tocar nada más del componente.
  *Hecho cuando:* `git diff` del componente solo muestra esas clases y el comentario, y el build de una variante pasa.

## Fase 3 — Verificación
- [x] T11 (RF-1 a RF-6) `[P]`: **Medición «después» y comparación.** Construir las 16 variantes con el componente arreglado y medir los mismos anchos. Comprobar: `stats.two` sin la tarjeta de 52 px; sin recorte ni desborde en `stats.one`, `stats.two`, `stats.two-limits`, `stats.three-limits` y `max` a los cuatro anchos; demo, `max`, `min` y `stats.one` dentro de 1 px de la referencia (donde el contenido cabe); recuadro cuadrado salvo que el contenido no quepa. Si `min-h-fit` no funciona, el plan B (quitar `overflow-hidden`) y se vuelve a medir.
  *Hecho cuando:* las medidas cumplen RF-1 a RF-6 en todos los anchos y quedan anotadas contra la referencia.
- [x] T12 (RF-11) `[P]`: **Comparación de builds.** `node scripts/compare-builds.mjs <base> <nueva>` con los builds de T9 y el nuevo, variante por variante: el HTML de las variantes sin cifras idéntico, el de las que llevan cifras solo distinto en las clases de la tarjeta y del recuadro, y el CSS compartido distinto solo por las dos clases nuevas y la que se quita; revisar a mano cada diferencia.
  *Hecho cuando:* cada diferencia está explicada y ninguna sale fuera de lo previsto.
- [ ] T13 (RF-7, RF-11): **Todo en verde en local.** `npm run test:schema` (767 más los nuevos), el comparador (17), `npm run test:typecheck` (14), `npm run typecheck`, `npm run build` con `check-dist`, `check-setup`; `git diff --stat` solo con los archivos del plan, sin tocar `package.json`, el lockfile ni el contrato.
  *Hecho cuando:* todo en verde y los archivos tocados coinciden con la lista de las reglas.
- [x] T14 `[P]`: **Revisión independiente (solo lectura).** Un agente revisa el cambio (componente, fixtures, tests y workflow) en busca de defectos reales, sin modificar nada; verifico su informe antes de actuar y te presento los hallazgos reales antes de corregirlos.
  *Hecho cuando:* hay un informe verificado.
- [x] T15 (RF-10): **Mostrarte el texto de `AGENTS.md`.** Presentar el texto exacto del plan (línea compactada, regla nueva de la tarjeta de cifras y «16 variantes»), ajustado con lo medido (los anchos, qué se mide y la tolerancia), y esperar tu aprobación. No se aplica antes.
  *Hecho cuando:* aprobaste el texto.
- [x] T16 (RF-10): **Aplicar `AGENTS.md`.** Con el texto aprobado; `check-setup` sin avisos y `AGENTS.md` en 59 líneas como máximo.
  *Hecho cuando:* `AGENTS.md` actualizado, 59 líneas como máximo y `check-setup` sin avisos.

## Fase 4 — Pull request, fusión y cierre
- [ ] T17: **Pedir tu aprobación para commitear, subir la rama y abrir el pull request.** Dos commits (la spec, el plan y las tareas por un lado; el componente, los fixtures, los tests, el workflow y `AGENTS.md` por otro, este último tras `/verify`). Aviso de que la subida dispara una ejecución de ~5 a 7 minutos de Actions.
  *Hecho cuando:* aprobaste y el pull request está abierto, con la ejecución en marcha.
- [x] T18 (RF-12): **Resultado en GitHub.** Ver la ejecución con las dos versiones de Node: nueve pasos en el resumen, el paso «Construir las 16 variantes» y «Todos los pasos pasan»; anotar la duración de cada trabajo. Si es rojo, investigar y proponerte el arreglo; solo se sube con tu aprobación. Si pasa de 8 minutos, es el bloqueo (g).
  *Hecho cuando:* hay una ejecución verde con las dos versiones, las 16 variantes y la duración anotada.
- [ ] T19: **Fusionar el pull request** con merge commit y con tu aprobación expresa.
  *Hecho cuando:* el pull request está fusionado.
- [ ] T20: **Ejecución en `master` y `/verify` final.** Ver que la subida a `master` dispara la verificación y termina en verde; `/verify` final sobre `master` (tests, `test:typecheck`, build, revisión de cada RF y de los principios de la constitución).
  *Hecho cuando:* la ejecución de `master` es verde y el informe está entregado.
- [x] T21 (RF-13): **Actualizar `MEMORY.md`**: estado (spec 012 cerrada), recuento de tests y de variantes (16), decisiones (tarjeta única con ancho propio, recuadro `min-h-fit`, fixtures `site.stats.*`, método de medición), lo aprendido (la causa: porcentaje dentro de un contenedor que se encoge; casos sin fixture), y el aviso de que `max` ya cubría tres cifras en los límites; sin pasar de 50 líneas; commit y push con tu aprobación.
  *Hecho cuando:* `MEMORY.md` actualizado, con `check-setup` sin avisos y subido.
- [ ] T22: **Borrar la rama `feat/tarjeta-de-cifras`** (local y remota) si lo apruebas.
  *Hecho cuando:* la rama ya no existe.
