# Plan 009 — Verificación en Linux con integración continua
> El CÓMO. Debe cumplir `docs/constitution.md` y cubrir todos los RF de `spec.md`.

## Datos de partida (comprobados, sin tocar el repositorio)
- **Repositorio privado con GitHub Actions habilitado** (`allowed=all`) y **sin ningún workflow**. No existe la carpeta `.github`.
- **Acciones oficiales, versión y commit exacto hoy** (para fijarlas, RF de permisos mínimos):
  | Acción | Versión | Commit |
  |---|---|---|
  | `actions/checkout` | v7.0.1 | `3d3c42e5aac5ba805825da76410c181273ba90b1` |
  | `actions/setup-node` | v7.1.0 | `949feb2413d6458794dcd2491c4babbbce0c15c1` |
  | `actions/upload-artifact` | v7.0.2 | `cf430e030ddbb5b0abf93d22962f4752f3646cd9` |
- **Runner:** existen Ubuntu 22.04, 24.04 y 26.04. Se fija **`ubuntu-24.04`** (LTS, no se mueve solo como `ubuntu-latest`).
- **`setup-node`** admite versión exacta (`22.23.4`) y la mayor (`24` = la última 24.x).
- **Variantes:** 11 fixtures en `scripts/fixtures` más la demo = **12**, tal como pide la spec. Un `dist` pesa ~420 KB.
- **`npm` distinto por Node:** Node 24.15.0 trae `npm` 12.2.0 y Node 22.23.4 trae `npm` 10.9.9. El `npm ci --dry-run` con el de Node 22 **resolvió el archivo de bloqueo sin errores**, pero ve un árbol algo distinto (en seco «añadiría» 99 paquetes que el de Node 24 da por presentes). Es un riesgo a vigilar en el primer resultado.
- **Lo que ya funciona en Windows y se reutiliza:** `npm run build` (con la validación y la revisión de tipos), `scripts/check-dist.mjs`, los tests (`test:schema` con 700, el comparador con 17 y `test:typecheck` con 14) y el método de 12 builds con `SITE_DATA`.

## Enfoque técnico
Tres piezas, sin dependencias nuevas en el proyecto:
1. **Un workflow de GitHub Actions** (`verificacion`) que se ejecuta en cada pull request hacia `master` y en cada subida a `master`.
2. **Un script del proyecto que construye las 12 variantes** (`scripts/ci-verify.mjs`), para que la lógica de «bucle que no se detiene, resumen y copia de los builds» esté escrita en Node, se pruebe con tests y funcione igual en Windows y en Linux. Así puedo ejecutarlo aquí para probarlo y también usarlo para construir los 12 builds de Windows de la comparación.
3. **Un procedimiento de comparación** Linux ↔ Windows (en la carpeta temporal, fuera del repositorio), que se hace una vez.

**Workflow (diseño):**
- **Disparadores:** `pull_request` hacia `master` y `push` a `master` (RF-1). El pull request que añade el workflow se verifica a sí mismo con la primera ejecución.
- **Concurrencia:** una ejecución por rama o pull request; cancela la obsoleta **solo si es un pull request** (`cancel-in-progress` condicionado al evento), nunca en `master` (RF-7).
- **Permisos:** `contents: read` y nada más (RF-6). Sin secretos.
- **Un trabajo con matriz de dos Node:** `22.23.4` y `24` (la última 24.x), `fail-fast: false` para que si falla uno el otro continúe (RF-2). `ubuntu-24.04`, `timeout-minutes: 30` (RF-8).
- **Pasos, en español** (RF-4), con `if: ${{ !cancelled() }}` en los pasos de comprobación para que un fallo de tests no impida mostrar el resultado de los builds:
  1. Descargar el código (`checkout`, sin guardar credenciales).
  2. Instalar Node (`setup-node`, **sin caché**).
  3. Versiones usadas: `node -v` y `npm -v` al resumen (RF-2).
  4. Instalar dependencias: `npm ci --no-audit --no-fund` (RF-3; el audit queda fuera, como pide la spec).
  5. Tests de contrato: `npm run test:schema` (incluye los de moneda y formato de precio).
  6. Tests del comparador de builds: `node --test scripts/compare-builds.test.mjs`.
  7. Tests de tipos: `npm run test:typecheck`.
  8. Construir las 12 variantes: `node scripts/ci-verify.mjs --out salida`.
  9. Guardar los builds: `upload-artifact` con vida de **1 día** y nombre por versión de Node (RF-13).
- **Todas las acciones fijadas por commit** (tabla de arriba), con la versión en un comentario.

**Script `ci-verify.mjs`:**
- Calcula las variantes: `demo` (sin `SITE_DATA`) y un `site.<nombre>.json` por cada fixture, en orden. Al derivarlas del directorio, una fixture nueva entra sola.
- Para cada una: `npm run build` con `SITE_DATA` relativo, luego `node scripts/check-dist.mjs`, y copia el `dist` a `<salida>/dist-<nombre>`. **No se detiene al primer fallo.**
- Al terminar imprime una tabla (variante, build, `check-dist`, tiempo) y, si existe `GITHUB_STEP_SUMMARY`, la añade ahí junto con las versiones de Node y de `npm` y el sistema (RF-2, RF-4). Termina con código 1 si falló cualquiera. Si falla una variante, muestra las últimas líneas de su salida.
- Funciona en Windows (`npm.cmd`) y en Linux. Las funciones puras (`listVariants`, `formatSummary`) se exportan para probarlas sin lanzar builds.

**Comparación Linux ↔ Windows (puntual, RF-13 a RF-15):**
1. Del run verde, `gh run download` de los dos artefactos (Node 22 y Node 24).
2. En Windows, un **clon limpio con `core.autocrlf=false`** en el mismo commit; `npm ci`; con el Node 22.23.4 ya descargado y con el Node 24 local, `node scripts/ci-verify.mjs --out ...`.
3. Comparar, por cada Node y cada una de las 12 variantes, **todos los archivos** (suma de verificación por archivo y lista de archivos). Cualquier diferencia se investiga (RF-15). Si la Node 24.x de Linux difiere en la versión menor de la de Windows (24.15.0), se anota.

**Prueba del propio CI (RF-16):** una rama temporal desde la del cambio con **un test roto a propósito**, un pull request en borrador hacia `master` (no se fusiona) para que se dispare el evento; se comprueba el rojo con el resumen que nombra el paso y la versión; se cierra el pull request y se borra la rama. Se hace con tu aprobación.

## Decisiones que necesito de ti (con el plan)
1. **Tres archivos nuevos y una carpeta nueva** (regla «pregunta antes: archivos nuevos»): `.github/workflows/verificacion.yml`, `scripts/ci-verify.mjs` y `scripts/ci-verify.test.mjs`. Aprobar el plan los autoriza.
2. **Runner fijo `ubuntu-24.04`** en lugar de `ubuntu-latest`: reproducible, pero hay que cambiarlo a mano cuando salga otra LTS.
3. **El test nuevo entra en `test:schema`** (el recuento sube de 700; los 700 existentes no se tocan). Es una prueba rápida y pura.
4. **Los builds se guardan en cada ejecución** (1 día de vida, ~12 × 420 KB × 2 versiones ≈ 10 MB), no solo cuando hacen falta. Es lo más simple; la alternativa sería subirlos solo a mano.

## Archivos a crear / modificar
| Archivo | Cambio |
|---|---|
| `.github/workflows/verificacion.yml` (nuevo) | el workflow de arriba |
| `scripts/ci-verify.mjs` (nuevo) | construye las 12 variantes con resumen y copia; funciones puras exportadas |
| `scripts/ci-verify.test.mjs` (nuevo) | tests de `listVariants` y `formatSummary` |
| `package.json` | el test nuevo se añade a `test:schema`; script `verify:ci` que ejecuta el nuevo script |
| `AGENTS.md` | se reemplaza «Linux sin verificar…» por lo que existe: qué comprueba el CI, cómo verlo, que no bloquea pero un rojo se investiga, qué no cubre; sin pasar de 59 líneas (se fusiona en la línea de «Entorno») |
| `MEMORY.md` | estado, decisiones, cifras medidas y aprendizajes; retirar el pendiente de Linux |
| `specs/009-verificacion-en-linux/` | `spec.md`, `plan.md`, `tasks.md` |
| Carpeta temporal | procedimiento de comparación y clon limpio de Windows |

**No cambian:** el código de la web, el esquema, los datos, `ui-text.ts`, `tsconfig.json`, las dependencias ni `package-lock.json`.

## Modelo de datos / interfaces
- No cambia el contrato (sigue en 2.3) ni los datos.
- `listVariants(raíz)` devuelve `[{ nombre, datos }]`: `demo` con `datos: null` y el resto con la ruta relativa de su fixture.
- `formatSummary(resultados, entorno)` devuelve el texto de la tabla y del resumen con las versiones; lista qué variantes fallaron (RF-4).
- Salida del proceso de `ci-verify.mjs`: 0 si todas pasan, 1 si falla alguna.

## Mapa RF → implementación → test
| RF | Dónde se implementa | Test que lo verifica |
|---|---|---|
| RF-1 | disparadores del workflow | la primera ejecución en el pull request que lo añade, y la de `master` tras fusionar |
| RF-2 | matriz de Node, paso «Versiones usadas», `fail-fast: false` | el resumen del run muestra las dos versiones; en el rojo provocado (RF-16) la otra versión sigue |
| RF-3 | pasos 4 a 8 | run verde con los 8 pasos; `ci-verify.mjs` ejecutado aquí en Windows con las 12 variantes |
| RF-4 | `formatSummary` y el resumen del workflow | `ci-verify.test.mjs` (nombra variantes fallidas y versión) y el rojo provocado |
| RF-5 | ningún cambio de ajustes | comprobar que la protección de rama no existe ni cambió |
| RF-6 | `permissions: contents: read`, sin secretos, sin escrituras | revisión del YAML; el run no crea commits |
| RF-7 | `concurrency` condicionada | una segunda subida al pull request con otra ejecución en curso cancela la primera; las de `master` no |
| RF-8 | `timeout-minutes: 30` | revisión del YAML; se mide la duración real |
| RF-9, RF-10, RF-12 | arreglos de compatibilidad si hacen falta | run verde en las dos versiones sin omitir pasos |
| RF-11 | regla de parada | si hace falta tocar HTML, datos, contrato, bloqueo o dependencias, se para y se consulta |
| RF-13 | `upload-artifact` con 1 día | descarga con `gh run download` |
| RF-14, RF-15 | procedimiento de comparación | informe: 12 variantes × 2 Node, archivos comparados y diferencias |
| RF-16 | rama temporal con un test roto | run en rojo con el paso y la versión; rama y pull request cerrados |
| RF-17 | `AGENTS.md`, `MEMORY.md` | `check-setup` sin avisos |

## Riesgos y casos límite
- **Tiempo y coste.** Estimación por trabajo en un runner de 2 CPU (más lento que este portátil): instalación 1–2 min, tests 1,5 min, y 12 builds de ~40–50 s cada uno (la revisión de tipos se repite en cada uno, como se aprobó) ≈ 9 min; total ~12–13 min por versión de Node, **~26 minutos de Actions por ejecución**. Cada subida a un pull request cuesta eso. Se mide en la primera ejecución; si pasa de 20 min se consulta (spec). Sin caché de dependencias.
- **Resultados distintos entre `npm` 10 y `npm` 12.** Posible hallazgo en el primer run con Node 22. Si exigiera tocar el archivo de bloqueo, se para y se consulta (RF-11).
- **Primera ejecución desconocida.** Es la primera vez que el proyecto corre fuera de esta máquina: lo esperable son 0 a pocos hallazgos de compatibilidad; cada uno se corrige sin cambiar la web o se consulta.
- **Node 24.x que cambia.** Una menor nueva puede romper algo; queda registrada en el resumen.
- **Acciones fijadas por commit:** hay que actualizarlas a mano cuando salgan versiones nuevas (no hay actualización automática, fuera de alcance); se anota en `AGENTS.md`.
- **Saltos de línea de la comparación.** El clon de Windows con `core.autocrlf=false` evita que CRLF cause diferencias; se comprueba con `git ls-files --eol` que los archivos fuente son LF en el índice.
- **Año del pie:** la comparación se hace el mismo día.
- **Cuota de minutos de Actions** del repositorio privado: si se agota no hay ejecuciones; `AGENTS.md` lo indica (pestaña Actions vacía).
- **`npm run build` en Linux ejecuta `astro check`**, que genera archivos de apoyo en `.astro/`; ya se comprobó en una copia limpia en Windows (spec 007).
- **YAML con error:** solo se detecta en la primera ejecución del pull request (RF-1); un error de sintaxis aparece como ejecución fallida sin pasos.
- **Reversión:** `git revert -m 1 <merge>` quita el workflow, el script y el test; no hay efectos fuera del repositorio.

## Comprobación con la constitución
- [x] **1. Simplicidad:** sin dependencias nuevas en el proyecto; un workflow, un script y su test. Las acciones de terceros son tres, oficiales y fijadas por commit.
- [x] **2. La spec manda:** todo responde a un RF; las cuatro decisiones nuevas (archivos, runner, test, artefactos) están separadas arriba.
- [x] **3. Datos separados de interfaz:** no se toca contenido ni textos de la web; los nombres de pasos y mensajes del CI son del proyecto, en español.
- [x] **4. El build como puerta:** el CI ejecuta el build normal (con validación y revisión de tipos) en las 12 variantes; informa, y un rojo se investiga antes de fusionar (decisión aprobada).
- [x] **5. Contrato sagrado:** el contrato y los datos no cambian; el CI comprueba que la web generada en Linux es idéntica a la de Windows.
- [x] **6. Idioma:** código en inglés; nombres de pasos, mensajes y documentación en español.

## Actualizaciones previstas
- **AGENTS.md:** en «Entorno», sustituir «Linux sin verificar: `sharp`… probar primero `npm ci`…» por la verificación existente (qué comprueba, cómo se ve el resultado, no bloquea pero un rojo se investiga, solo Ubuntu x64 con Node 22.23.4 y la última 24.x, acciones fijadas por commit y a actualizar a mano). Se muestra el texto antes de aplicarlo y se mantiene en 59 líneas.
- **MEMORY.md:** estado (spec 009), decisiones con su porqué, tiempos y minutos medidos, y retirar el pendiente de Linux.
