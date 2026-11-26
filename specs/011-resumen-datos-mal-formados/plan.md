# Plan 011 — Resumen de pasos: datos mal formados y versión de Node en blanco
> El CÓMO. Debe cumplir `docs/constitution.md` y cubrir todos los RF de `spec.md`.

## Enfoque técnico
Todo el cambio vive en el script del resumen (`scripts/ci-verify.mjs`) y en sus tests. No se toca el workflow, la web, los datos, el contrato ni las dependencias.

1. **Forma de los datos, dentro de `formatStepSummary`.** Antes de buscar pasos conocidos se hacen dos comprobaciones nuevas, en este orden, y la función lanza el `StepSummaryError` que ya existe (el arranque ya lo convierte en código 2 sin escribir nada en el resumen del trabajo):
   - **Conjunto:** debe ser un objeto de verdad (ni `null`, ni array, ni texto, número, booleano o valor ausente). Si no, mensaje de forma con el tipo recibido.
   - **Pasos:** cada valor del conjunto debe ser un objeto de verdad. Se recorren todos, se reúnen los que no lo son y se lanza un solo mensaje que los lista por identificador (entre comillas invertidas) con el tipo de cada uno.
   Después sigue el orden de la spec 010 sin cambios: «ningún paso conocido» y «todos los conocidos omitidos». El orden de RF-3 queda así por construcción.
2. **Un único helper de tipo** (`describeType`, interno): devuelve «un objeto», «un array», «null», «un texto», «un número», «un booleano» o «ningún valor». Lo usan los dos mensajes, así que el vocabulario es el mismo. No copia contenido (RF-1).
3. **Versión de Node, en una función pequeña exportada** (`resolveNodeVersion`): recibe el valor crudo de `NODE_VERSION` y la versión del proceso; recorta con `trim()` (que ya cubre tabuladores, saltos de línea y espacios Unicode) y, si no queda nada o falta, devuelve la versión del proceso con la misma indicación de hoy. El arranque la llama en lugar de la expresión `process.env.NODE_VERSION || …`. `formatStepSummary` no cambia de firma ni vuelve a recortar: recibe la versión ya resuelta, así que el título y las tres líneas finales usan la misma.
4. **Alternativas descartadas:**
   - *Validar la forma en el arranque, antes de llamar a `formatStepSummary`:* separaría la regla de los tests de la función, que son los que cubren la mayoría de los casos, y duplicaría la comprobación.
   - *Recortar la versión dentro de `formatStepSummary`:* mezcla entrada de entorno con formato; el helper se prueba solo y el arranque sigue siendo la única puerta de entrada de `NODE_VERSION`.
   - *Códigos de error estables o una clase por tipo de error:* descartado en la spec (texto libre en español, como el resto del script).

## Archivos a crear / modificar
| Archivo | Cambio |
|---|---|
| `scripts/ci-verify.mjs` | `describeType` (interno), comprobación de forma del conjunto y de los pasos al inicio de `formatStepSummary`, `resolveNodeVersion` exportada y usada por el arranque. Sin otros cambios. |
| `scripts/ci-verify.test.mjs` | Actualizar el test de «sin ningún paso conocido» (`null` y `undefined` pasan a forma de datos); añadir tests de forma del conjunto, de los pasos, del orden de comprobaciones, de `resolveNodeVersion` y del arranque (CLI) con datos mal formados y versión en blanco. |
| `MEMORY.md` | Estado (spec 011), recuento de tests, quitar los tres defectos bajos de «Próximos pasos»; sin pasar de 50 líneas. |
| `specs/011-resumen-datos-mal-formados/` | `spec.md`, `plan.md`, `tasks.md`. |

No se crea ningún archivo nuevo fuera de la carpeta de la spec. No cambian `.github/workflows/verificacion.yml`, `package.json`, el lockfile, `AGENTS.md` (sus reglas y su descripción del CI siguen valiendo), `src/` ni `docs/`.

## Modelo de datos / interfaces
- **Entrada del resumen (sin cambio de contrato):** `STEPS_JSON` = salida de `toJSON(steps)` de GitHub: un objeto cuyas claves son los `id` de los pasos y cuyos valores son objetos con `outcome` (y otros campos que se ignoran). El workflow siempre la entrega así; los datos bien formados dan exactamente el mismo resumen que hoy (RF-9).
- **`formatStepSummary(steps, node)`:** misma firma. Nuevo: lanza `StepSummaryError` también por mala forma del conjunto o de los pasos. Sigue sin escribir nada.
- **`resolveNodeVersion(raw, processVersion = process.version)`:** devuelve la versión recortada si `raw` es texto con contenido; si no, `"<processVersion> (la del proceso: falta NODE_VERSION)"`. Texto de la indicación idéntico al de hoy.
- **`StepSummaryError`:** sin cambios. Los dos mensajes nuevos cuelgan de ella.
- **Mensajes nuevos (texto libre en español, palabras clave fijadas por test):**
  - Conjunto: «Los datos de los pasos no tienen la forma esperada (un objeto con el resultado de cada paso): se recibió *<tipo>*.»
  - Pasos: «Los datos de los pasos no tienen la forma esperada: cada paso debe ser un objeto con su resultado, pero `id` es *<tipo>*, …»
  El arranque añade la línea de uso como en el resto de errores.
- **Compatibilidad hacia atrás:** el código de salida de los casos `null` y `undefined` sigue siendo 2; solo cambia el texto. Los casos `{}` y «solo desconocidos bien formados» mantienen el texto y el código de la spec 010.

## Mapa RF → implementación → test
| RF | Dónde se implementa | Test que lo verifica |
|---|---|---|
| RF-1 | `formatStepSummary`: comprobación del conjunto + `describeType` | Función: array, `null`, texto, número, booleano y `undefined` lanzan el mensaje de forma con el tipo y sin copiar el contenido. CLI: `STEPS_JSON` `[]`, `null`, `"x"`, `3`, `true` → código 2, stderr con la forma, stdout sin tabla. |
| RF-2 | `formatStepSummary`: comprobación de pasos, mensaje único con todos | Función: un paso texto, número, booleano, `null` y array (conocido y desconocido); varios a la vez en un solo mensaje con cada `id` entre comillas invertidas y su tipo; el resumen no se escribe (lanza). CLI: código 2 y nada en `GITHUB_STEP_SUMMARY`. |
| RF-3 | Orden de las comprobaciones dentro de `formatStepSummary` | Función: paso mal formado sin ningún conocido → forma; conjunto `[]` → forma (no «ningún paso conocido»); `{}` → «ningún paso conocido»; todos omitidos con datos bien formados → «ningún paso conocido se ejecutó». |
| RF-4 | Sin cambios en esas ramas | Tests existentes de `{}`, solo desconocidos bien formados y todos omitidos, sin modificar (salvo el de `null` y `undefined`). |
| RF-5 | Sin cambios en el tratamiento de objetos | Test existente de `outcome` raro/ausente/objeto; test nuevo: paso `{}` se muestra como no reconocido y no lanza. |
| RF-6 | `resolveNodeVersion` | Unitario: ausente, `""`, `"   "`, `"\t\n"`, espacio duro (U+00A0) → versión del proceso con la indicación. CLI: `NODE_VERSION="  "` → título con la versión del proceso, indicación presente, código 0. |
| RF-7 | `resolveNodeVersion` (recorte) + título y líneas finales que ya usan el valor | Unitario: `" 24 "`, `"\n22.23.4\n"` → recortadas. CLI: `NODE_VERSION=" 24 "` con un paso fallido: el título y la línea «Falló el paso con Node 24: …» sin espacios sobrantes. No se valida el contenido: `abc` se usa tal cual. |
| RF-8 | Arranque ya existente + errores nuevos | CLI: los dos errores nuevos terminan con 2; con datos bien formados y pasos fallidos sigue en 0. Los tests de `STEPS_JSON` ausente o no válido, y de argumentos, no cambian. |
| RF-9 | Suite de `ci-verify.test.mjs` | Los tests de arriba cubren cada caso listado; ninguno construye variantes. |
| RF-10 | Revisión del `git diff` y la verificación completa | `npm run test:schema`, comparador (17), `test:typecheck` (14), `typecheck`, `build` y `check-dist` en verde; `git diff --stat` solo con los archivos de este plan. |
| RF-11 | Ejecución en GitHub del pull request | Resumen de los dos trabajos con los nueve pasos y «Todos los pasos pasan» (se comprueba en el registro del paso, como en la spec 010). Los casos de mala forma solo con tests y ensayo local. |
| RF-12 | `MEMORY.md` | `check-setup` sin avisos, ≤ 50 líneas, tres defectos retirados. |

## Riesgos y casos límite
- **Cambio de texto para `null` y `undefined`:** el test de la spec 010 los agrupa con `{}` y espera «ningún paso conocido». Se separa: `{}` y «solo desconocidos» siguen en ese test, `null` y `undefined` pasan a uno nuevo de forma de datos. Es el único test existente que cambia (RF-10); si falla cualquier otro, es bloqueo.
- **Falso positivo de «objeto»:** `typeof x === "object"` acepta `null` y arrays; la comprobación excluye ambos de forma explícita y lo cubren los tests de RF-1 y RF-2.
- **Claves especiales (`__proto__`, `constructor`):** `JSON.parse` las crea como propiedades propias y `Object.entries` las recorre; se tratan como cualquier identificador. Test con un paso `__proto__` mal formado, para ver que se lista y que no contamina nada.
- **Identificadores con comillas invertidas o muy largos:** se listan tal cual (fuera de alcance validarlos). Un mensaje largo es solo estética.
- **`trim()` y espacios Unicode:** `String.prototype.trim` incluye espacio duro, separadores Unicode y saltos de línea; lo fija el test con U+00A0. No recorta caracteres de control que no sean espacio (fuera de alcance).
- **Paso final en rojo si cambia `toJSON(steps)`:** consecuencia aceptada en la spec 010; ahora el motivo sería el mensaje de forma, que lo dice mejor.
- **Windows y Linux:** sin rutas ni saltos de línea nuevos; los tests del arranque ya se ejecutan en los dos.
- **Coste de CI:** una ejecución de unos 5 minutos de Actions por subida; una sola prevista.
- **Dependencias de otras specs:** ninguna; el workflow y la tabla de nombres de la spec 010 no cambian, y su vigilante sigue en verde.

## Comprobación con la constitución
- [x] Principio 1 (simplicidad): sin dependencias nuevas, sin JS de cliente, sin archivos nuevos fuera de la spec; un helper de tipo y una función de versión.
- [x] Principio 2 (la spec manda): solo lo de RF-1 a RF-12; lo demás (contenido de `outcome`, validar identificadores, validar la versión) queda fuera.
- [x] Principio 3 (datos separados de interfaz): no se toca la web ni su texto fijo; los mensajes del script son del CI, no de la interfaz de las webs.
- [x] Principio 4 (el build como puerta): `npm run build` (con validación y tipos), `test:schema`, `test:typecheck` y `check-dist` en verde antes de dar algo por hecho.
- [x] Principio 5 (contrato sagrado): el contrato 2.3 y la forma de los datos del sitio no cambian.
- [x] Principio 6 (idioma): código en inglés, mensajes y documentación en español.

## Actualizaciones previstas
- AGENTS.md: ninguna (sus reglas y su descripción del CI siguen valiendo). Si al implementar hiciera falta, se propone y se pregunta.
- MEMORY.md: estado (spec 011 terminada y fusionada), recuento de `test:schema`, decisión (forma de datos → error de datos con código 2, versión en blanco = ausente), retirar los tres defectos bajos de «Próximos pasos»; sin pasar de 50 líneas (hoy 46).
