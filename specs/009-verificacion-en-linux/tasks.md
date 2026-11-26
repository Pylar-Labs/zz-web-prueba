# Tareas 009 — Verificación en Linux con integración continua
> Tareas pequeñas, ordenadas, verificables. Cada una referencia sus RF y termina con tests en verde.
> `[P]` = puede hacerse en paralelo.

## Reglas de ejecución
- **Test primero** en lo que es código nuevo: el script (T3 y T4) y el workflow (T6 y T7). El CI real solo se puede ver en GitHub, tras tu aprobación para subir (T10).
- **Plan aprobado, con sus cuatro decisiones:** los tres archivos nuevos (`.github/workflows/verificacion.yml`, `scripts/ci-verify.mjs` y `scripts/ci-verify.test.mjs`), el runner `ubuntu-24.04`, el test nuevo dentro de `test:schema` y los builds guardados en cada ejecución. Cualquier otro archivo o cambio se te pregunta antes.
- **Bloqueos (me detengo y te lo cuento):** (a) falla un test existente en Windows; (b) un arreglo exigiría cambiar el HTML de la web, los datos, el contrato, el archivo de bloqueo o una dependencia (RF-11); (c) una ejecución pasa de 20 minutos por trabajo; (d) hay una diferencia Linux ↔ Windows que no es de plataforma o implica cambiar la web (RF-15); (e) se agota la cuota de minutos de Actions o la ejecución no arranca; (f) hace falta algo fuera del plan.
- **Nada hacia GitHub sin tu aprobación expresa:** commits, subidas, pull requests, ramas temporales, cierres y borrados. **Cada subida a un pull request dispara una ejecución de ~26 minutos de Actions**; por eso cada arreglo se te presenta antes de subirlo y no subo dos veces seguidas sin motivo.
- **Tests existentes:** los 700, los 17 del comparador y los 14 de tipos no se modifican y siguen en verde. El test nuevo se añade; el recuento de `test:schema` sube.
- **Archivos temporales** (builds de Linux descargados, clon limpio de Windows, comparación, comprobación del YAML) en la carpeta temporal de la sesión, nunca en el repositorio.
- **Comandos:** esta sesión ejecuta Bash; para ti, en PowerShell, las variables de entorno van como `$env:SITE_DATA = "..."`.
- **Servidores ajenos:** si hay `astro dev`, `astro preview` o servidores de sesiones anteriores, se dejan como están.
- **Ruta crítica:** T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9 → T10 → T11 → T12 → T13 → T14 → T15 → T16 → T17 → T18 → T19.

## Fase 0 — Rama y base
- [x] T1: **Crear la rama `feat/verificacion-linux` desde `master`.** Comprobar que `master` está al día con `origin`.
  *Hecho cuando:* estás en `feat/verificacion-linux` y `git status` solo muestra la carpeta de la spec sin seguimiento.
- [x] T2 `[P]`: **Base local.** Confirmar que el Node 22.23.4 desechable sigue en la carpeta temporal y anotar los recuentos y tiempos de referencia en esta máquina: `npm run test:schema` (700), el comparador (17), `npm run test:typecheck` (14) y un `npm run build`.
  *Hecho cuando:* hay un Node 22.23.4 utilizable y los recuentos y tiempos están anotados.

## Fase 1 — Script de las 12 variantes (test primero)
- [x] T3 (RF-3, RF-4): **Tests rojos.** Crear `scripts/ci-verify.test.mjs` con pruebas puras (sin lanzar builds): `listVariants` devuelve 12 variantes con `demo` primero (sin datos) y una por cada fixture con su ruta relativa; el bucle (`runVariants` con un ejecutor simulado) ejecuta **todas** las variantes aunque una falle y devuelve el resultado de cada una; `formatSummary` lista cada variante con su resultado, nombra las que fallaron, incluye la versión de Node y de `npm` y el sistema, y no menciona fallos si todas pasan.
  *Hecho cuando:* el archivo existe y todos sus tests fallan porque `scripts/ci-verify.mjs` no existe, y los demás tests existentes siguen en verde.
- [x] T4 (RF-3, RF-4): **`scripts/ci-verify.mjs` y `package.json`.** El script calcula las variantes, construye cada una con `npm run build` y `SITE_DATA`, pasa `check-dist`, copia el `dist` a la salida indicada con `--out`, no se detiene al primer fallo, imprime el resumen, lo añade a `GITHUB_STEP_SUMMARY` si existe y termina con 1 si falló alguna; funciona en Windows y en Linux. En `package.json`, el test nuevo se añade a `test:schema` y se crea el script `verify:ci`.
  *Hecho cuando:* los tests de T3 están en verde, `npm run test:schema` sube de 700 sin tocar los existentes y el diff de `package.json` solo muestra esas dos líneas.
- [x] T5 (RF-3, RF-4, RF-12): **El script de verdad, aquí.** Ejecutar `node scripts/ci-verify.mjs --out <carpeta temporal>` con Node 24 y con Node 22.23.4: las 12 variantes con `check-dist`, el resumen y las copias. Comprobar que cada `dist` copiado es idéntico al de un build directo.
  *Hecho cuando:* las 12 variantes pasan con las dos versiones, el resumen muestra tiempos y versiones y las copias coinciden con los builds directos.

## Fase 2 — El workflow (test primero)
- [x] T6 (RF-1, RF-2, RF-5 a RF-8) `[P]`: **Comprobación del workflow: roja.** En la carpeta temporal, un script que lee el workflow con el analizador de YAML que ya está instalado (el de Astro) y verifica: disparadores de pull request y subida a `master`; matriz con `22.23.4` y `24` y `fail-fast: false`; `ubuntu-24.04`; `timeout-minutes: 30`; permisos solo de lectura de contenido; concurrencia que cancela solo en pull requests; todas las acciones con commit de 40 caracteres y en la lista aprobada; sin caché ni secretos ni pasos que escriban en el repositorio; `npm ci --no-audit --no-fund`; los pasos 4 a 8 en el orden del plan, en español, con `!cancelled()` en los de comprobación; artefacto con 1 día de vida.
  *Hecho cuando:* el script existe y falla porque el workflow no existe.
- [x] T7 (RF-1 a RF-8, RF-13): **`.github/workflows/verificacion.yml`.** Crear el workflow del plan.
  *Hecho cuando:* la comprobación de T6 pasa y el workflow tiene exactamente los pasos y valores del plan.
- [x] T8: **Todo en verde en local.** `npm run test:schema` (700 más los nuevos), el comparador (17), `npm run test:typecheck` (14), `npm run typecheck`, `npm run build` y `check-setup`; `git diff --stat` solo con los archivos del plan, sin tocar el código de la web, `package-lock.json` ni las dependencias.
  *Hecho cuando:* todo en verde y los archivos tocados coinciden con la lista del plan.

## Fase 3 — Documentación y primera subida
- [x] T9 (RF-17): **Actualizar `AGENTS.md`**: en «Entorno», sustituir lo de «Linux sin verificar» por la verificación existente (qué comprueba, cómo ver el resultado, que no bloquea pero un rojo se investiga, solo Ubuntu x64 con Node 22.23.4 y la última 24.x, acciones fijadas por commit y a actualizar a mano, y que sin ejecuciones puede ser la cuota de minutos), sin pasar de 59 líneas. Mostrar el texto antes de aplicarlo.
  *Hecho cuando:* aprobaste el texto y `AGENTS.md` está actualizado con `check-setup` sin avisos.
- [x] T10: **Pedir tu aprobación para commitear, subir la rama y abrir el pull request.** Dos commits (la spec, el plan y las tareas por un lado; el workflow, el script, su test, `package.json` y `AGENTS.md` por otro, este último tras `/verify`). Aviso de que la subida dispara la primera ejecución en GitHub (~26 minutos de Actions).
  *Hecho cuando:* aprobaste y el pull request está abierto, con la ejecución en marcha.

## Fase 4 — Primer resultado en Linux
- [x] T11 (RF-1, RF-2, RF-3, RF-9 a RF-12): **Resultado de la primera ejecución.** Ver el resultado con las dos versiones de Node. Si es verde, seguir. Si es rojo: investigar la causa, clasificarla (diferencia de plataforma, red transitoria, mi error) y proponerte el arreglo; solo se sube con tu aprobación. Si exige cambiar el HTML, los datos, el contrato, el archivo de bloqueo o una dependencia, es el bloqueo (b). Sin omitir pasos ni variantes.
  *Hecho cuando:* hay una ejecución completamente verde con Node 22.23.4 y la última 24.x, con las versiones registradas en el resumen.
- [x] T12 (RF-2, RF-8): **Tiempos y minutos.** Medir la duración de cada trabajo, la de la ejecución y los minutos de Actions consumidos; comparar con la estimación (~12–13 min por trabajo, ~26 min por ejecución).
  *Hecho cuando:* los números están anotados; si algún trabajo pasa de 20 minutos, es el bloqueo (c).
- [x] T13 (RF-13 a RF-15): **Comparación Linux ↔ Windows.** Con los artefactos de la ejecución verde (Node 22 y Node 24): clon limpio de Windows con `core.autocrlf=false` en el mismo commit, `npm ci`, `ci-verify` con Node 22.23.4 y con Node 24, y comparación de todos los archivos de las 12 variantes de cada Node.
  *Hecho cuando:* las 12 variantes × 2 Node son idénticas archivo a archivo, o cada diferencia está explicada y resuelta o consultada (bloqueo (d)).
- [x] T14 (RF-7, RF-16): **Prueba del rojo y de la cancelación.** Con tu aprobación para cada paso: una rama temporal desde la del cambio con un test roto a propósito, un pull request en borrador hacia `master`, y una segunda subida inmediata para comprobar que cancela la primera; verificar el rojo con el paso y la versión en el resumen y que la otra versión de Node continuó; cerrar el pull request y borrar la rama.
  *Hecho cuando:* se ve el rojo con paso y versión, la ejecución obsoleta se canceló, la otra versión continuó y la rama temporal y su pull request ya no existen.
- [x] T15 (RF-5, RF-6): **Comprobación de permisos y configuración.** Revisar que el repositorio no tiene protección de rama (ni la creó el CI), que el run solo leyó el repositorio, que no hay commits de la ejecución y que no usa secretos.
  *Hecho cuando:* todo confirmado y anotado.

## Fase 5 — Fusión y cierre
- [x] T16: **Fusionar el pull request** con merge commit y con tu aprobación expresa; solo si el CI está en verde o si, tras ver la causa de un rojo, tú lo apruebas expresamente.
  *Hecho cuando:* el pull request está fusionado.
- [x] T17 (RF-1): **Ejecución en `master` y `/verify` final.** Ver que la subida a `master` dispara la verificación y termina en verde; `/verify` final sobre `master` (tests, `test:typecheck`, build, revisión de cada RF y de los principios de la constitución).
  *Hecho cuando:* la ejecución de `master` es verde y el informe está entregado.
- [x] T18: **Actualizar `MEMORY.md`**: estado (spec 009 cerrada), decisiones con su porqué, tiempos y minutos medidos, resultado de la comparación, aprendizajes, y retirar el pendiente de Linux; commit y push con tu aprobación.
  *Hecho cuando:* `MEMORY.md` actualizado, con `check-setup` sin avisos y subido.
- [ ] T19: **Borrar la rama `feat/verificacion-linux`** (local y remota) si lo apruebas.
  *Hecho cuando:* la rama ya no existe.
