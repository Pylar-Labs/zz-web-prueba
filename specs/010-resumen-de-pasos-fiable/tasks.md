# Tareas 010 — Resumen de pasos del CI sin falsos verdes
> Tareas pequeñas, ordenadas, verificables. Cada una referencia sus RF y termina con tests en verde.
> `[P]` = puede hacerse en paralelo.

## Reglas de ejecución
- **Test primero**: las reglas del resumen (T3), el arranque (T4) y el vigilante del workflow (T5) se escriben en rojo antes de implementar (T6 a T8).
- **Plan aprobado, con sus tres decisiones:** los nueve `id` en inglés (`checkout`, `setup-node`, `versions`, `install`, `contract-tests`, `comparator-tests`, `type-tests`, `builds`, `upload`), los cuatro tests existentes del bloque «el resumen por pasos» que cambian, y `STEP_NAMES` exportada. Cualquier otro cambio se te pregunta antes.
- **Bloqueos (me detengo y te lo cuento):** (a) falla un test existente distinto de esos cuatro; (b) hace falta tocar el HTML de la web, los datos, el contrato, el archivo de bloqueo, una dependencia o crear un archivo nuevo; (c) en GitHub `toJSON(steps)` no tiene la forma esperada o el resumen sale distinto de lo previsto; (d) el vigilante de texto da falsos positivos o negativos sobre el workflow real; (e) se agota la cuota de minutos de Actions.
- **Tests existentes:** los 721 siguen en verde salvo los cuatro del bloque «el resumen por pasos (RF-4)» de `ci-verify.test.mjs`, que se actualizan. Los comparadores (17) y los de tipos (14) no se tocan.
- **Archivos del repositorio que se tocan:** `scripts/ci-verify.mjs`, `scripts/ci-verify.test.mjs`, `.github/workflows/verificacion.yml`, `MEMORY.md` y la carpeta de la spec. No se crea ningún archivo nuevo en el repositorio.
- **Nada hacia GitHub sin tu aprobación expresa:** commits, subidas, pull requests, cierres y borrados. La subida al pull request dispara una ejecución de ~5 minutos de Actions; cada arreglo se te presenta antes de subirlo.
- **Agentes y worktrees:** los worktrees de los agentes viven dentro del repositorio (`.claude/worktrees`): se borran al terminar y no ejecuto `typecheck` ni `test:typecheck` mientras existan. Verifico cada informe de un agente (rama, SHA, diff, tests) antes de usarlo.
- **Archivos temporales** (la comprobación del workflow, los ensayos) en la carpeta temporal de la sesión, nunca en el repositorio.
- **Comandos:** esta sesión ejecuta Bash; para ti, en PowerShell, las variables de entorno van como `$env:NOMBRE = "..."`.
- **Ruta crítica:** T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T10 → T11 → T13 → T14 → T15 → T16 → T17 → T18.

## Fase 0 — Rama y base
- [x] T1: **Crear la rama `feat/resumen-de-pasos-fiable` desde `master`.** Comprobar que `master` está al día con `origin`.
  *Hecho cuando:* estás en `feat/resumen-de-pasos-fiable` y `git status` solo muestra la carpeta de la spec sin seguimiento.
- [x] T2 `[P]`: **Base.** Anotar los recuentos de referencia (`npm run test:schema` 721, el comparador 17, `npm run test:typecheck` 14, la revisión de tipos) y comprobar en GitHub que la última ejecución del CI sobre `master` está en verde.
  *Hecho cuando:* los recuentos y el estado del CI están anotados.

## Fase 1 — Tests rojos
- [x] T3 (RF-1 a RF-6, RF-10): **Reglas del resumen: tests rojos.** En `scripts/ci-verify.test.mjs`: actualizar a los `id` nuevos los cuatro tests del bloque «el resumen por pasos (RF-4)» y añadir pruebas de `formatStepSummary` para: orden de la tabla con datos desordenados y desconocidos al final con su `id` entre comillas invertidas; desconocido que pasa (se muestra y no cambia el veredicto); desconocido que falla (se nombra, singular y plural); datos vacíos, `null` y solo desconocidos (lanza un error con «ningún paso conocido»); todos los conocidos omitidos sin problemas (lanza «ningún paso conocido se ejecutó»); todos omitidos con un desconocido que pasa (lanza); todos omitidos con un desconocido que falla (no lanza y nombra el fallo); cancelados, resultado no reconocido y `outcome` ausente, solos y junto a fallidos, con una línea por tipo en el orden fallaron, cancelados, no reconocidos; y que «Todos los pasos pasan» solo sale con un éxito conocido y sin problemas.
  *Hecho cuando:* las pruebas nuevas y las cuatro actualizadas fallan por la razón esperada (los `id` nuevos y las reglas aún no existen), y los demás tests existentes siguen en verde.
- [x] T4 (RF-7, RF-8, RF-12, RF-13): **Arranque: tests rojos.** Pruebas que lanzan el script (sin construir variantes): `--resumen-pasos --out x` y `--out x --resumen-pasos` terminan con código 2 y «no se combinan», sin construir ni resumir; con un argumento desconocido el mismo mensaje lo lista; `--out` sin valor, `--out=algo` y `--otra-cosa` siguen en código 2; con `STEPS_JSON` válido que incluye un paso fallido el resumen se escribe y termina con código 0; sin pasos conocidos termina con código 2 y el mensaje; sin `NODE_VERSION` usa la versión del proceso, lo indica en el título y termina con 0.
  *Hecho cuando:* las pruebas que dependen del comportamiento nuevo fallan por la razón esperada y ninguna construye variantes ni deja archivos en el repositorio.
- [x] T5 (RF-9, RF-11): **Vigilante del workflow: tests rojos.** En el mismo archivo de test: una función auxiliar que lee el texto del workflow y comprueba, sin parser de YAML, que todos los pasos salvo el que ejecuta `--resumen-pasos` tienen `id`, que no se repiten, que coinciden en orden con las claves de `STEP_NAMES` y que los nombres de la tabla coinciden con los `name` del workflow; una prueba contra el workflow real (roja hasta T8) y pruebas negativas con textos de ejemplo (sin `id`, `id` repetido, `id` fuera de la tabla, tabla con `id` inexistente, orden distinto, nombre distinto, saltos CRLF).
  *Hecho cuando:* la prueba contra el workflow real falla porque los `id` aún no son los nuevos, y las negativas detectan cada incumplimiento.

## Fase 2 — Implementación
- [x] T6 (RF-1 a RF-6, RF-10): **`scripts/ci-verify.mjs`: las reglas del resumen.** `STEP_NAMES` con los nueve `id`, en inglés, y exportada; `formatStepSummary` con conocidos primero y desconocidos al final con su `id`, las líneas finales por tipo, el veredicto «Todos los pasos pasan» solo con un éxito conocido y sin problemas, y un error propio con mensaje en español para los dos casos de configuración.
  *Hecho cuando:* los tests de T3 están en verde.
- [x] T7 (RF-7, RF-8, RF-12, RF-13): **`scripts/ci-verify.mjs`: el arranque.** Detectar el modo resumen y `--out` antes de consumir valores; reunir todos los problemas (argumentos desconocidos, combinación, `--out` sin valor) en un solo mensaje con código 2; capturar el error del resumen y terminar con código 2; la versión de Node ausente usa la del proceso e indica que falta `NODE_VERSION`; el resumen termina con 0 siempre que resuma.
  *Hecho cuando:* los tests de T4 están en verde.
- [x] T8 (RF-9, RF-10): **`.github/workflows/verificacion.yml`.** Dar los `id` en inglés a los nueve pasos (renombrando los seis actuales y añadiendo tres) y un comentario con la regla; nada más.
  *Hecho cuando:* la prueba de T5 contra el workflow real pasa y `git diff` solo muestra `id` y el comentario.
- [x] T9 (RF-9) `[P]`: **Actualizar la comprobación del workflow de la carpeta temporal** a los `id` nuevos y a la regla de que el último paso es el único sin `id`.
  *Hecho cuando:* la comprobación da verde sobre el workflow nuevo y rojo si se estropea un `id` (una mutación).

## Fase 3 — Verificación local
- [x] T10 (RF-14, RF-16): **Todo en verde en local.** `npm run test:schema` (721 más los nuevos, con los cuatro actualizados), el comparador (17), `npm run test:typecheck` (14), `npm run typecheck`, `npm run build` con `check-dist` y `check-setup`; `git diff --stat` solo con los archivos del plan, sin tocar la web, `package-lock.json` ni las dependencias.
  *Hecho cuando:* todo en verde y los archivos tocados coinciden con la lista del plan.
- [x] T11 (RF-5 a RF-8, RF-12) `[P]`: **Ensayo del arranque con datos de ejemplo.** Ejecutar el script a mano con `STEPS_JSON` de ejemplo para cada caso (todo correcto, paso conocido fallido, desconocido fallido, sin pasos conocidos, todos omitidos, cancelados, combinación de argumentos en los dos órdenes, sin `NODE_VERSION`) y anotar la salida y el código de cada uno.
  *Hecho cuando:* cada caso se comporta como dice la spec y queda anotado.
- [x] T12 `[P]`: **Revisión independiente (solo lectura).** Un agente revisa el cambio (código, tests y workflow) en busca de defectos reales, sin modificar nada; verifico su informe antes de actuar.
  *Hecho cuando:* hay un informe verificado; cualquier hallazgo real se presenta antes de corregirlo.

## Fase 4 — Pull request, fusión y cierre
- [ ] T13: **Pedir tu aprobación para commitear, subir la rama y abrir el pull request.** Dos commits (la spec, el plan y las tareas por un lado; el script, los tests y el workflow por otro, este último tras `/verify`). Aviso de que la subida dispara una ejecución de ~5 minutos de Actions.
  *Hecho cuando:* aprobaste y el pull request está abierto, con la ejecución en marcha.
- [x] T14 (RF-15): **Resultado en GitHub.** Ver la ejecución con las dos versiones de Node: nueve pasos en el resumen y «Todos los pasos pasan». Si es rojo, investigar y proponerte el arreglo; solo se sube con tu aprobación. Si `toJSON(steps)` no tiene la forma esperada, es el bloqueo (c).
  *Hecho cuando:* hay una ejecución verde con las dos versiones y los nueve pasos visibles.
- [ ] T15: **Fusionar el pull request** con merge commit y con tu aprobación expresa.
  *Hecho cuando:* el pull request está fusionado.
- [ ] T16: **Ejecución en `master` y `/verify` final.** Ver que la subida a `master` dispara la verificación y termina en verde; `/verify` final sobre `master` (tests, `test:typecheck`, build, revisión de cada RF y de los principios de la constitución).
  *Hecho cuando:* la ejecución de `master` es verde y el informe está entregado.
- [x] T17 (RF-17): **Actualizar `MEMORY.md`**: estado (spec 010 cerrada), decisiones (identificadores en inglés, éxito exige un paso conocido, error con código 2 si falta lo que resumir), lo aprendido, y retirar los dos defectos pendientes; sin pasar de 50 líneas; commit y push con tu aprobación.
  *Hecho cuando:* `MEMORY.md` actualizado, con `check-setup` sin avisos y subido.
- [ ] T18: **Borrar la rama `feat/resumen-de-pasos-fiable`** (local y remota) si lo apruebas.
  *Hecho cuando:* la rama ya no existe.
