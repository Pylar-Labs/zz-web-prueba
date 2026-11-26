# Plan 010 — Resumen de pasos del CI sin falsos verdes
> El CÓMO. Debe cumplir `docs/constitution.md` y cubrir todos los RF de `spec.md`.

## Punto de partida (código de la spec 009, ya en `master`)
- **`formatStepSummary(steps, node)`** en `scripts/ci-verify.mjs` recorre una tabla fija `STEP_NAMES` (6 ids en español), muestra los que llegan y nombra los que tienen `outcome` `failure`. Si no llega ninguno conocido, devuelve una tabla vacía y «Todos los pasos pasan». Un paso desconocido no se muestra y un fallo suyo no se nombra.
- **Arranque del modo `--resumen-pasos`:** lee `STEPS_JSON` y `NODE_VERSION`; si se pasa también `--out`, entra en el modo resumen y descarta `--out` en silencio. El análisis de argumentos consume el valor de `--out` aunque sea `--resumen-pasos`.
- **Workflow:** seis pasos con `id` en español (`instalar`, `contrato`, `comparador`, `tipos`, `variantes`, `guardar`) y tres sin `id` (descargar el código, instalar Node, versiones usadas). El paso final «Resumen del resultado» recibe `toJSON(steps)`, que solo contiene los pasos con `id`.
- **Tests existentes del resumen** (4, en `scripts/ci-verify.test.mjs`) usan los ids antiguos.

## Enfoque técnico
Sin archivos nuevos ni dependencias: se cambian el script, su test y el workflow.

1. **Identificadores en inglés para los nueve pasos** (RF-9), en el orden del workflow. Se proponen:
   | Orden | Nombre visible (no cambia) | `id` nuevo | `id` antiguo |
   |---|---|---|---|
   | 1 | Descargar el código | `checkout` | — |
   | 2 | Instalar Node | `setup-node` | — |
   | 3 | Versiones usadas | `versions` | — |
   | 4 | Instalar dependencias | `install` | `instalar` |
   | 5 | Tests de contrato | `contract-tests` | `contrato` |
   | 6 | Tests del comparador de builds | `comparator-tests` | `comparador` |
   | 7 | Tests de tipos | `type-tests` | `tipos` |
   | 8 | Construir las 12 variantes | `builds` | `variantes` |
   | 9 | Guardar los builds | `upload` | `guardar` |
   El paso «Resumen del resultado» es el único sin `id` (no puede aparecer en su propio resultado). Todos cumplen la regla de GitHub (letras, números, `-` y `_`, empezando por letra).
2. **Reglas del resumen** (RF-1 a RF-8), con una función pura que se prueba sin lanzar nada. `formatStepSummary` devuelve el texto en los casos normales y **lanza un error propio con mensaje en español** en los dos casos de configuración (RF-5, RF-6); el arranque lo captura y termina con código 2:
   - Pasos **conocidos** = claves de la tabla `STEP_NAMES` presentes en los datos, en el orden de la tabla. **Desconocidos** = el resto, en el orden en que llegan, con su `id` entre comillas invertidas como nombre.
   - Resultado por paso: `success` (correcto), `skipped` (omitido), `failure` (falló), `cancelled` (cancelado) y cualquier otro valor (o ausente) = «no reconocido». Se usa `outcome`, el resultado del paso mismo.
   - **Sin ningún paso conocido** (vacío, `null`, solo desconocidos) → error (RF-5).
   - **Líneas finales**, una por tipo en este orden: fallaron (conserva «Falló el paso…» / «Fallaron los pasos…»), cancelados y no reconocidos; cada una con la versión de Node.
   - **«Todos los pasos pasan»** solo si no hay ningún fallido, cancelado ni no reconocido **y** al menos un paso conocido terminó con éxito (RF-3). Si no hay fallidos, cancelados ni no reconocidos y ningún conocido tuvo éxito (todos omitidos) → error (RF-6). Un fallo siempre se nombra, aunque todos los conocidos se hayan omitido.
   - El título lleva la versión de Node; si falta `NODE_VERSION`, el arranque usa la del proceso y lo indica en el título (RF-8).
3. **Arranque** (RF-7, RF-12, RF-13): el modo resumen y `--out` se detectan antes de consumir valores, de modo que `--out --resumen-pasos` y `--resumen-pasos --out x` den el mismo error. Se reúnen todos los problemas (argumentos desconocidos, combinación, `--out` sin valor) en **un solo mensaje** y código 2, sin construir, copiar ni resumir. El resumen termina con 0 siempre que resuma.
4. **Test del repositorio que vigila el workflow** (RF-11), en el mismo archivo de test, sin parser de YAML: una función auxiliar divide el texto del workflow en pasos (líneas `- name:`), saca el `id` de cada uno y comprueba: todos los pasos salvo el que ejecuta `--resumen-pasos` tienen `id`; los `id` no se repiten; coinciden, en el mismo orden, con las claves de `STEP_NAMES` (que pasa a exportarse); y los nombres de la tabla coinciden con los `name` del workflow. Se prueba también con textos de ejemplo que incumplen cada regla, para que no dé verde por defecto. Tolera saltos CRLF.
5. **Workflow** (RF-9, RF-10): solo se añaden y renombran `id` y se pone un comentario con la regla («todos los pasos llevan `id` en inglés salvo el resumen; lo comprueba un test»). Nada más cambia.
6. **Comprobación del workflow de la carpeta temporal** (fuera del repositorio): se actualiza a los ids nuevos.

## Decisiones que necesito de ti (con el plan)
1. **Los nueve `id` propuestos** de la tabla de arriba. Aprobar el plan los fija.
2. **Cambian cuatro tests existentes** del bloque «el resumen por pasos (RF-4)» de `ci-verify.test.mjs` (son los de la spec 009 sobre esta misma función), porque usan los `id` antiguos y porque una de sus expectativas cambia (un paso omitido sin ningún éxito conocido ahora es error). No cambia ningún otro test. Los 721 existentes, salvo esos cuatro, siguen intactos.
3. **`STEP_NAMES` pasa a exportarse** del script, para que el test del repositorio lo compare con el workflow.

## Archivos a crear / modificar
| Archivo | Cambio |
|---|---|
| `scripts/ci-verify.mjs` | `STEP_NAMES` con los nueve `id` y exportada; `formatStepSummary` con las reglas nuevas y error propio; arranque con análisis de argumentos que detecta la combinación y reúne los problemas; versión de Node ausente |
| `scripts/ci-verify.test.mjs` | cuatro tests actualizados; tests nuevos de cada caso, de argumentos y del vigilante del workflow (con casos negativos) |
| `.github/workflows/verificacion.yml` | `id` en inglés en los nueve pasos y un comentario con la regla |
| `MEMORY.md` | retirar los dos defectos pendientes, anotar lo aprendido, sin pasar de 50 líneas |
| `specs/010-resumen-de-pasos-fiable/` | `spec.md`, `plan.md`, `tasks.md` |
| Carpeta temporal | comprobación del workflow actualizada |

**No cambian:** `package.json` (el test ya está en `test:schema`), `AGENTS.md`, la web, el esquema, los datos, el archivo de bloqueo y las dependencias.

## Modelo de datos / interfaces
- Entrada del resumen: `STEPS_JSON` = `toJSON(steps)` de GitHub, `{ "<id>": { "outcome": "...", "conclusion": "...", "outputs": {} } }`. Sin cambios de formato.
- `formatStepSummary(steps, node)` → texto Markdown; lanza `Error` con mensaje en español en RF-5 y RF-6.
- Códigos de salida del script: 0 (resumió o construyó todo), 1 (alguna variante falla), 2 (uso o configuración).

## Mapa RF → implementación → test
| RF | Dónde se implementa | Test que lo verifica |
|---|---|---|
| RF-1 | `formatStepSummary`: conocidos en el orden de la tabla y desconocidos al final con su `id` | orden de la tabla con los datos desordenados; desconocido que pasa se muestra con su `id` |
| RF-2 | línea «Falló el paso…» con conocidos y desconocidos | fallo conocido, fallo desconocido, varios (plural) |
| RF-3 | veredicto «Todos los pasos pasan» solo con éxito conocido y sin problemas | todos correctos; omitidos junto a un éxito; desconocido que pasa con conocidos omitidos (no es «todos pasan») |
| RF-4 | líneas de cancelados y no reconocidos, una por tipo en orden | cancelados, no reconocidos y `outcome` ausente, solos y junto a fallidos |
| RF-5 | error sin pasos conocidos | `{}`, `null`, solo desconocidos → lanza; arranque con código 2 |
| RF-6 | error si todos los conocidos se omiten y no hay problemas | todos omitidos → lanza; con un desconocido fallido no lanza y lo nombra |
| RF-7 | el arranque termina con 0 al resumir | ensayo del arranque con un fallo (código 0) y con error (código 2) |
| RF-8 | título con la versión del proceso si falta `NODE_VERSION` | arranque sin `NODE_VERSION`: la salida lo indica y termina con 0 |
| RF-9 | `STEP_NAMES` y `id` del workflow | test del repositorio contra el workflow real |
| RF-10 | desconocidos se muestran y nombran sin editar el script | un `id` nuevo en los datos que falla aparece nombrado |
| RF-11 | función auxiliar de análisis de texto del workflow | positivo contra el workflow real; negativos: sin `id`, `id` repetido, `id` fuera de la tabla, tabla con `id` inexistente, orden distinto, nombre distinto |
| RF-12 | arranque que detecta la combinación en los dos órdenes y reúne problemas | `--resumen-pasos --out x` y `--out x --resumen-pasos` → 2 con «no se combinan»; con un argumento desconocido los lista todos |
| RF-13 | los rechazos actuales se conservan | `--out=algo`, `--otra-cosa`, `--out` sin valor → 2 (tests existentes) |
| RF-14 | los tests anteriores | el archivo cubre cada caso listado, sin construir variantes |
| RF-15 | una subida al pull request | ejecución en GitHub con las dos versiones: nueve pasos y «Todos los pasos pasan» |
| RF-16 | no se tocan web, datos, contrato ni dependencias | `test:schema` (721 + nuevos), comparador (17), tipos (14), `git diff` sin cambios en esos archivos |
| RF-17 | `MEMORY.md` | `check-setup` sin avisos y ≤ 50 líneas |

## Riesgos y casos límite
- **Tres sitios que deben cambiar a la vez** (workflow, tabla, tests): si uno queda atrás, el paso final sale en rojo. Lo atrapa el test del repositorio en local, antes de subir, y la ejecución de GitHub lo confirma.
- **`toJSON(steps)` con claves con guion** (`setup-node`, `contract-tests`): JSON válido; no se comprobó antes en GitHub. La ejecución de GitHub lo verifica (RF-15).
- **El paso final en rojo por mala configuración** (consecuencia aceptada en la spec). Se prueba que el error es claro.
- **Análisis de texto del workflow:** es frágil si cambia la sangría. Lo mitiga que el test solo mira las líneas `- name:` y `id:` de los pasos y falla con un mensaje que dice qué esperaba; y los casos negativos cubren las formas habituales.
- **Un paso nuevo sin `id`:** lo detecta el test del repositorio antes de fusionar.
- **Coste:** una subida al pull request (~5 minutos de Actions); más si un arreglo la repite.
- **Reversión:** `git revert -m 1 <merge>` devuelve el resumen anterior; no hay efectos fuera del repositorio.

## Comprobación con la constitución
- [x] **1. Simplicidad:** sin archivos nuevos ni dependencias; cambios acotados en el script, su test y el workflow.
- [x] **2. La spec manda:** todo cambio responde a un RF; las tres decisiones nuevas (ids, cuatro tests, exportar la tabla) están separadas arriba.
- [x] **3. Datos separados de interfaz:** no se toca contenido ni textos de la web; los mensajes del resumen son del proyecto, en español.
- [x] **4. El build como puerta:** el cambio no toca el build; el CI sigue informando y un rojo se investiga.
- [x] **5. Contrato sagrado:** el contrato y los datos no cambian.
- [x] **6. Idioma:** identificadores de código en inglés (los nueve `id`), mensajes y documentación en español.

## Actualizaciones previstas
- **MEMORY.md:** quitar los dos defectos pendientes de `ci-verify`; anotar la decisión (identificadores en inglés, éxito exige un paso conocido, error con código 2 si falta lo que resumir) y lo aprendido; sin pasar de 50 líneas.
- **AGENTS.md:** sin cambios.
