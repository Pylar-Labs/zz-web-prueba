# Tareas 011 — Resumen de pasos: datos mal formados y versión de Node en blanco
> Tareas pequeñas, ordenadas, verificables. Cada una referencia sus RF y termina con tests en verde.
> `[P]` = puede hacerse en paralelo.

## Reglas de ejecución
- **Test primero**: los tests de forma (T3), de la versión de Node (T4) y del arranque (T5) se escriben en rojo antes de implementar (T6 y T7).
- **Plan aprobado, con sus decisiones:** la forma se comprueba dentro de `formatStepSummary` (conjunto, luego pasos, luego «ningún paso conocido»); la versión se resuelve en una función exportada `resolveNodeVersion`; los errores nuevos son texto libre en español y lanzan el `StepSummaryError` ya existente. Cualquier otro cambio se te pregunta antes.
- **Bloqueos (me detengo y te lo cuento):** (a) falla un test existente distinto del de `null` y `undefined` de «sin ningún paso conocido»; (b) hace falta tocar el workflow, la web, los datos, el contrato, `AGENTS.md`, el archivo de bloqueo, una dependencia o crear un archivo nuevo fuera de la carpeta de la spec; (c) los datos bien formados dan un resumen distinto del de la spec 010; (d) en GitHub el resumen sale distinto de lo previsto; (e) se agota la cuota de minutos de Actions.
- **Tests existentes:** los 751 de `test:schema` siguen en verde salvo el de `null` y `undefined` de «sin ningún paso conocido», que se divide. Los comparadores (17) y los de tipos (14) no se tocan.
- **Archivos del repositorio que se tocan:** `scripts/ci-verify.mjs`, `scripts/ci-verify.test.mjs`, `MEMORY.md` y la carpeta de la spec. No se crea ningún archivo nuevo fuera de ella.
- **Nada hacia GitHub sin tu aprobación expresa:** commits, subidas, pull requests, cierres y borrados. La subida al pull request dispara una ejecución de ~5 minutos de Actions; cada arreglo se te presenta antes de subirlo.
- **Agentes y worktrees:** los worktrees de los agentes viven dentro del repositorio (`.claude/worktrees`): se borran al terminar y no ejecuto `typecheck` ni `test:typecheck` mientras existan. Verifico cada informe de un agente (rama, SHA, diff, tests) antes de usarlo. Los hallazgos reales de una revisión se te presentan antes de corregirlos.
- **Archivos temporales** (los ensayos) en la carpeta temporal de la sesión, nunca en el repositorio.
- **Comandos:** esta sesión ejecuta Bash; para ti, en PowerShell, las variables de entorno van como `$env:NOMBRE = "..."`.
- **Ruta crítica:** T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T10 → T12 → T13 → T14 → T15 → T16 → T17.

## Fase 0 — Rama y base
- [ ] T1: **Crear la rama `feat/resumen-datos-mal-formados` desde `master`.** Comprobar que `master` está al día con `origin`.
  *Hecho cuando:* estás en `feat/resumen-datos-mal-formados` y `git status` solo muestra la carpeta de la spec sin seguimiento.
- [x] T2 `[P]`: **Base.** Anotar los recuentos de referencia (`npm run test:schema` 751, el comparador 17, `npm run test:typecheck` 14, la revisión de tipos) y comprobar en GitHub que la última ejecución del CI sobre `master` está en verde.
  *Hecho cuando:* los recuentos y el estado del CI están anotados.

## Fase 1 — Tests rojos
- [x] T3 (RF-1 a RF-5, RF-9): **Forma de los datos: tests rojos.** En `scripts/ci-verify.test.mjs`: dividir el test de «sin ningún paso conocido» (`{}` y solo desconocidos siguen igual; `null` y `undefined` pasan a forma de datos) y añadir pruebas de `formatStepSummary` para: conjunto array (vacío y con elementos), `null`, texto, número, booleano y ausente, cada uno con el tipo recibido en el mensaje y sin copiar el contenido; un paso texto, número, booleano, `null` y array, conocido y desconocido; varios pasos mal formados en un solo mensaje con cada `id` entre comillas invertidas y su tipo; un paso `__proto__` mal formado listado sin contaminar nada; orden de comprobaciones (mala forma sin ningún conocido → forma; `[]` → forma; `{}` → «ningún paso conocido»; todos omitidos bien formados → «ningún paso conocido se ejecutó»); un paso `{}` bien formado que se muestra como no reconocido sin lanzar; y que los datos bien formados dan el mismo resumen que antes (tabla y líneas finales de los casos existentes).
  *Hecho cuando:* las pruebas nuevas fallan por la razón esperada (la comprobación de forma aún no existe), y los demás tests existentes siguen en verde.
- [x] T4 (RF-6, RF-7, RF-9): **Versión de Node: tests rojos.** Pruebas de `resolveNodeVersion` (función aún inexistente): ausente, `""`, `"   "`, `"\t\n"` y espacio duro (U+00A0) → versión del proceso con la indicación de hoy; `" 24 "` y `"\n22.23.4\n"` → recortadas; `"abc"` se usa tal cual (no se valida); con valor no menciona que falte.
  *Hecho cuando:* las pruebas fallan porque la función aún no existe, sin tocar los demás tests.
- [x] T5 (RF-1, RF-2, RF-6, RF-7, RF-8, RF-9): **Arranque: tests rojos.** Pruebas que lanzan el script (sin construir variantes) con `STEPS_JSON` `[]`, `null`, `"x"`, `3`, `true` y un paso que es texto: código 2, mensaje de forma en stderr y ninguna tabla ni veredicto en stdout; con `GITHUB_STEP_SUMMARY` apuntando a un archivo temporal, no se escribe nada; con `NODE_VERSION="  "` el título lleva la versión del proceso y la indicación, con código 0; con `NODE_VERSION=" 24 "` y un paso fallido, el título y la línea «Falló el paso con Node 24: …» sin espacios sobrantes; con datos bien formados y pasos fallidos sigue en 0.
  *Hecho cuando:* las pruebas que dependen del comportamiento nuevo fallan por la razón esperada y ninguna construye variantes ni deja archivos en el repositorio.

## Fase 2 — Implementación
- [x] T6 (RF-1 a RF-5): **`scripts/ci-verify.mjs`: forma de los datos.** `describeType` (interno), comprobación del conjunto y de los pasos al inicio de `formatStepSummary` con un solo mensaje por comprobación, lanzando `StepSummaryError`; el resto de la función sin cambios.
  *Hecho cuando:* los tests de T3 están en verde y los tests de la spec 010 (salvo el dividido) siguen en verde.
- [x] T7 (RF-6, RF-7, RF-8): **`scripts/ci-verify.mjs`: versión de Node.** `resolveNodeVersion` exportada, y el arranque la usa en lugar de `process.env.NODE_VERSION || …`; sin otros cambios en el arranque.
  *Hecho cuando:* los tests de T4 y T5 están en verde.
- [x] T8 `[P]` (RF-10): **Comprobación de que no se tocó nada más.** `git diff --stat` solo con `scripts/ci-verify.mjs` y `scripts/ci-verify.test.mjs`; el workflow, `package.json` y el lockfile sin cambios; el vigilante del workflow de la spec 010 en verde.
  *Hecho cuando:* el diff coincide con la lista del plan.

## Fase 3 — Verificación local
- [x] T9 (RF-10): **Todo en verde en local.** `npm run test:schema` (751 más los nuevos), el comparador (17), `npm run test:typecheck` (14), `npm run typecheck`, `npm run build` con `check-dist` y `check-setup`.
  *Hecho cuando:* todo en verde.
- [x] T10 (RF-1 a RF-8) `[P]`: **Ensayo manual con datos de ejemplo.** Ejecutar el script a mano con `STEPS_JSON` de ejemplo para cada caso (conjunto array, `null`, texto y booleano; paso de texto; varios pasos mal formados a la vez; mala forma junto a «ningún paso conocido»; `{}` sin cambios; `NODE_VERSION` ausente, en blanco y con espacios a los lados; datos bien formados con un paso fallido) y anotar la salida y el código de cada uno.
  *Hecho cuando:* cada caso se comporta como dice la spec y queda anotado.
- [x] T11 `[P]`: **Revisión independiente (solo lectura).** Un agente revisa el cambio (código y tests) en busca de defectos reales, sin modificar nada; verifico su informe antes de actuar.
  *Hecho cuando:* hay un informe verificado; cualquier hallazgo real se presenta antes de corregirlo.

## Fase 4 — Pull request, fusión y cierre
- [ ] T12: **Pedir tu aprobación para commitear, subir la rama y abrir el pull request.** Dos commits (la spec, el plan y las tareas por un lado; el script y los tests por otro, este último tras `/verify`). Aviso de que la subida dispara una ejecución de ~5 minutos de Actions.
  *Hecho cuando:* aprobaste y el pull request está abierto, con la ejecución en marcha.
- [x] T13 (RF-11): **Resultado en GitHub.** Ver la ejecución con las dos versiones de Node: nueve pasos en el resumen y «Todos los pasos pasan». Si es rojo, investigar y proponerte el arreglo; solo se sube con tu aprobación.
  *Hecho cuando:* hay una ejecución verde con las dos versiones y los nueve pasos visibles.
- [ ] T14: **Fusionar el pull request** con merge commit y con tu aprobación expresa.
  *Hecho cuando:* el pull request está fusionado.
- [ ] T15: **Ejecución en `master` y `/verify` final.** Ver que la subida a `master` dispara la verificación y termina en verde; `/verify` final sobre `master` (tests, `test:typecheck`, build, revisión de cada RF y de los principios de la constitución).
  *Hecho cuando:* la ejecución de `master` es verde y el informe está entregado.
- [x] T16 (RF-12): **Actualizar `MEMORY.md`**: estado (spec 011 cerrada), recuento de `test:schema`, decisiones (forma de datos → error de datos con código 2; versión en blanco = ausente), lo aprendido, y retirar los tres defectos bajos; sin pasar de 50 líneas; commit y push con tu aprobación.
  *Hecho cuando:* `MEMORY.md` actualizado, con `check-setup` sin avisos y subido.
- [ ] T17: **Borrar la rama `feat/resumen-datos-mal-formados`** (local y remota) si lo apruebas.
  *Hecho cuando:* la rama ya no existe.
