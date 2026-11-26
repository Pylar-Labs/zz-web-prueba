# Plan 012 — Tarjeta de cifras de «Quiénes somos» con una o dos cifras
> El CÓMO. Debe cumplir `docs/constitution.md` y cubrir todos los RF de `spec.md`.

## Enfoque técnico
**Causa medida.** En `About.astro` la tarjeta de la segunda cifra (cuando hay exactamente dos) lleva `w-[calc(50%-0.5rem)]`. Un porcentaje dentro de un contenedor que se encoge a su contenido es circular: el contenedor interior (`text-center p-8`, hijo de un flex centrado) mide solo lo que mide el texto de la cifra destacada (119 px con «años tostando»), y el 50 % de eso (menos el hueco) da 52 px. Con 3 cifras la rejilla de dos columnas llena el ancho porque las dos tarjetas tienen contenido propio, por eso no se veía.

**Arreglo mínimo, solo clases en `About.astro`** (sin JavaScript, sin dependencias, sin cambiar el contrato):
1. **Tarjeta de la segunda cifra:** quitar `w-[calc(50%-0.5rem)]` y dejar `col-span-2 justify-self-center` con un ancho mínimo (`min-w-28`, 112 px, a confirmar midiendo). Un elemento de rejilla con `justify-self-center` y ancho automático toma el ancho de su contenido (`fit-content`) sin pasar del disponible. Es lo que pide la spec: «tarjeta centrada con ancho propio».
2. **Recuadro que crece en alto solo si hace falta:** añadir `min-h-fit` al recuadro `aspect-square`. Con `aspect-square` solo, la altura es el ancho; con `min-h-fit` es el mayor de los dos (el ancho o la altura del contenido). Si el contenido cabe, no cambia nada (RF-5, RF-6); si no cabe, el recuadro crece en vez de recortar. Se mantiene `overflow-hidden` (redondea las esquinas del degradado) porque el alto mínimo ya evita el recorte. Los dos cuadrados decorativos son hermanos absolutos del recuadro, así que siguen anclados a sus esquinas.
3. **Comentario del componente** actualizado: la tarjeta pequeña única toma su propio ancho en vez de «media anchura».
4. **No se tocan** las funciones del tamaño de letra (`mainValueSize`, `otherValueSize`), la cuadrícula de dos columnas de las tres cifras ni el resto de la sección.

**Alternativas descartadas:**
- *`w-full` en el contenedor interior:* estira el contenido a todo el recuadro y cambia las medidas de las tres cifras (RF-5).
- *Quitar `overflow-hidden` para que el alto mínimo salga solo del contenido:* menos explícito; si `min-h-fit` falla al medir se usa como plan B.
- *Un test visual automático:* exige una herramienta nueva; fuera de alcance por decisión.

**Verificación visual (manual y medida, sin dependencias):** una página de medición con un `iframe` por ancho (375, 768, 1024 y 1280 px), como la de la cabecera (spec 008), que sirve cada variante y mide: ancho y alto del recuadro y de cada cifra, si el contenido supera al contenedor (más de 1 px) y si la página tiene scroll horizontal. Se toma **una referencia antes del cambio** (demo y `max` con tres cifras, `min` sin cifras y el fixture de una cifra, construidos con el código actual) y se compara después con tolerancia de 1 px (RF-5, RF-6). Las variantes de dos cifras y las de límites se miden después para comprobar que ya no hay recorte ni desborde (RF-1 a RF-3).

**Fixtures:** cuatro archivos nuevos en `scripts/fixtures/`, todos en español, que `listVariants` recoge solos por su nombre (`site.<nombre>.json`), de modo que las variantes pasan de 12 a 16 sin tocar el bucle. Base: `site.min.json` (el más ligero) con `about.stats` reemplazado:
- `site.stats.one.json`: una cifra de largo normal.
- `site.stats.two.json`: dos cifras de largo normal (el caso que hoy falla).
- `site.stats.two-limits.json`: dos cifras en los límites (valor de 10 caracteres sin espacios, etiqueta de 40; la segunda con un valor de 10 caracteres con espacios y etiqueta de 40 sin espacios).
- `site.stats.three-limits.json`: tres cifras en los límites.

**Número de variantes:** el nombre del paso del workflow, la tabla `STEP_NAMES`, los mensajes del script, los comentarios y los tests pasan de 12 a 16, junto con `AGENTS.md` y `MEMORY.md`. Se añade un test que compara el número del nombre del paso con `listVariants().length`, para que el próximo fixture no deje un número viejo sin que nadie lo vea.

## Decisiones y desviaciones que conviene revisar
1. **`site.max.json` ya trae tres cifras en los límites** (valor «1234567890», etiquetas de 40 caracteres y letras anchas), con la misma forma que pide el cuarto fixture. El fixture `three-limits` duplicaría esa cobertura. Propongo conservarlo como pide la spec (4 fixtures, 16 variantes) porque cuesta poco y deja la cobertura explícita por nombre; si prefieres evitar la duplicación, se descarta y quedan 3 fixtures y 15 variantes (cambia el número en RF-9, RF-8 y los criterios).
2. **«Misma salida» de RF-11 no puede cumplirse al pie de la letra ni siquiera para las variantes sin cifras:** el CSS compartido cambia porque se quitan y se añaden clases del componente (Tailwind genera el CSS de todas las variantes desde el código fuente, no del HTML). Interpreto que las variantes sin cifras mantienen **el mismo HTML y los mismos textos**, y que `compare-builds` mostrará solo la diferencia del CSS; la reviso a mano, como en las actualizaciones de dependencias. Las que llevan cifras se comparan por medidas (RF-5 y RF-6).
3. **Test guardián del número de variantes** (arriba): es una adición pequeña dentro de los tests que la spec no pide de forma literal; si prefieres no incluirla, se omite.

## Archivos a crear / modificar
| Archivo | Cambio |
|---|---|
| `src/components/sections/About.astro` | `min-h-fit` en el recuadro; en la tarjeta de la segunda cifra quitar `w-[calc(50%-0.5rem)]` y añadir `min-w-28`; comentario actualizado. Sin otros cambios. |
| `scripts/fixtures/site.stats.one.json`, `site.stats.two.json`, `site.stats.two-limits.json`, `site.stats.three-limits.json` | **Nuevos.** Copia de `site.min.json` con `about.stats` de 1, 2, 2 (límites) y 3 (límites) elementos. |
| `scripts/site-schema.test.mjs` | Test nuevo: los cuatro fixtures validan con el contrato, tienen 1, 2, 2 y 3 cifras, y los de límites llegan a 10 caracteres de valor y 40 de etiqueta. |
| `scripts/ci-verify.mjs` | «12» → «16» en el comentario inicial, `STEP_NAMES.builds` y el mensaje de uso. |
| `scripts/ci-verify.test.mjs` | `variants.length` 16 y el nombre del paso «Construir las 16 variantes» en todos los tests; test guardián del número. |
| `.github/workflows/verificacion.yml` | Comentario inicial y nombre del paso «Construir las 16 variantes» (coincide con `STEP_NAMES`; lo comprueba el vigilante de la spec 010). |
| `AGENTS.md` | «las 12 variantes» → «las 16 variantes»; regla nueva de verificación de la tarjeta de cifras; una línea compactada para no pasar de 59 (ver abajo). |
| `MEMORY.md` | Estado (spec 012), recuento de tests, número de variantes vivo, aprendizaje de la causa; sin pasar de 50 líneas. |
| `specs/012-tarjeta-de-cifras/` | `spec.md`, `plan.md`, `tasks.md`. |

No cambian `package.json`, el lockfile, `site.schema.ts`, `docs/` generados, `check-dist.mjs`, el resto de `src/` ni las specs cerradas. Archivos nuevos: solo los cuatro fixtures, dentro de lo que autoriza la spec.

## Modelo de datos / interfaces
- **Contrato 2.3 sin cambios:** `about.stats` de 0 a 3 elementos, `value` hasta 10 caracteres y `label` hasta 40. Los fixtures nuevos son datos válidos del contrato, sin campos nuevos.
- **Variantes del CI:** la lista sale de `scripts/fixtures/site.*.json` más la demo. Con los cuatro archivos nuevos son 16. Los nombres de variante nuevos: `stats.one`, `stats.two`, `stats.two-limits`, `stats.three-limits`.
- **Tabla de nombres del resumen:** `STEP_NAMES.builds` = «Construir las 16 variantes»; el nombre del paso del workflow debe ser idéntico.
- **Compatibilidad hacia atrás:** el HTML de las variantes sin cifras no cambia; el de las que llevan 0, 1 o 3 cifras de largo normal mantiene sus medidas (±1 px); el CSS compartido cambia en dos clases.

## Cambio propuesto de `AGENTS.md` (te lo muestro de nuevo antes de aplicarlo)
1. **Compactar** («Forma de trabajar»), de dos líneas a una, sin perder contenido:
   - Antes: «- Lee `docs/constitution.md` y la spec activa (`specs/NNN-*/`) antes de tocar código.» y «- Cambio no trivial: planifica primero y espera aprobación. Cambios pequeños y revisables.»
   - Después: «- Lee `docs/constitution.md` y la spec activa (`specs/NNN-*/`) antes de tocar código. Cambio no trivial: planifica primero y espera aprobación; cambios pequeños y revisables.»
2. **Regla nueva** en «Verificación»: «- Tarjeta de cifras (al tocarla o al cambiar su contenido): con 1, 2 y 3 cifras, de largo normal y con valor de 10 y etiqueta de 40 caracteres (fixtures `site.stats.*` y `site.max.json`), a 375, 768, 1024 y 1280 px en Chrome: recuadro cuadrado salvo que el contenido no quepa (entonces crece en alto), ninguna cifra recortada ni fuera de su tarjeta, sin scroll horizontal y sin valor corto partido. Se mide con `evaluate_script` (ancho y alto del recuadro y de cada cifra, tolerancia 1 px). No hay test automático.»
3. «las 12 variantes» → «las 16 variantes» en la línea «Entorno».
Total: 59 líneas, sin cambios de significado.

## Mapa RF → implementación → test
| RF | Dónde se implementa | Test que lo verifica |
|---|---|---|
| RF-1 | `About.astro`: tarjeta única con `col-span-2 justify-self-center min-w-28` (sin porcentaje) | Medición manual a 375, 768, 1024 y 1280 px con `stats.two`: la tarjeta mide más que su mínimo, queda centrada, no pasa del ancho disponible y tiene el estilo de las de tres cifras. |
| RF-2 | Ídem + `min-h-fit` en el recuadro | Medición manual con `stats.one`, `stats.two`, `stats.two-limits`, `stats.three-limits` y `max`: sin recorte (contenido ≤ contenedor + 1 px), sin cifra fuera de su tarjeta, sin scroll horizontal, en los cuatro anchos. |
| RF-3 | `min-h-fit` (el recuadro crece solo cuando no cabe), cuadrados decorativos sin tocar, `[overflow-wrap:anywhere]` ya existente | Medición manual con los fixtures de límites a los cuatro anchos: etiquetas en varias líneas, recuadro más alto que ancho solo cuando hace falta, valores cortos sin partir. |
| RF-4 | Sin cambios (`hasStats`) | `check-dist` + HTML de `site.min.json` idéntico antes y después. |
| RF-5 | Clases del recuadro con contenido que cabe: sin efecto | Medición antes/después en demo y `max` (tres cifras) y en `min` (sin cifras), a los cuatro anchos, con tolerancia de 1 px. |
| RF-6 | Sin cambios en la cifra destacada | Medición antes/después con `stats.one` (referencia tomada con el código actual). |
| RF-7 | Ningún archivo de contrato, datos ni dependencias en el diff | `git diff --stat`; `test:schema` y `validate` en verde. |
| RF-8 | Cuatro fixtures nuevos | Test nuevo en `site-schema.test.mjs`: validan, cantidad 1, 2, 2, 3 y límites de 10 y 40 caracteres. |
| RF-9 | `listVariants` recoge los fixtures; «12» → «16» en nombre del paso, `STEP_NAMES`, mensajes y tests | `ci-verify.test.mjs`: 16 variantes, el nombre del paso coincide con el workflow (vigilante de la spec 010), test guardián número = `listVariants().length`; `npm run verify:ci` local con las 16; ejecución del CI. |
| RF-10 | `AGENTS.md` | `check-setup` sin avisos (≤ 59 líneas) y revisión del texto contigo antes de aplicarlo. |
| RF-11 | Cambios solo de clases | Los 767 + nuevos tests en verde; `compare-builds` entre el build anterior y el nuevo de las 12 variantes ya existentes: sin diferencias de HTML en las que no llevan cifras y solo el CSS compartido distinto (revisado a mano). |
| RF-12 | Subida al PR | Registro del paso «Resumen del resultado» de los dos trabajos: nueve pasos, «Todos los pasos pasan», con las 16 variantes. |
| RF-13 | `MEMORY.md` | `check-setup` sin avisos y ≤ 50 líneas. |

## Riesgos y casos límite
- **`min-h-fit` no hace crecer el recuadro en algún navegador o con `aspect-ratio`:** se mide en Chrome; plan B, quitar `overflow-hidden` (el alto mínimo automático del `aspect-ratio` entonces cubre el contenido). Firefox y Safari quedan fuera de la verificación por decisión de la spec; la propiedad `min-height: fit-content` existe en ambos.
- **El CSS de todas las variantes cambia** (clases nuevas y una menos): inofensivo para las páginas, pero `compare-builds` lo mostrará como diferencia; se revisa a mano (punto 2 de decisiones).
- **Medidas de referencia mal tomadas:** si la referencia «antes» se toma con el código ya modificado, la comparación no vale. Se toma en la primera tarea, antes de tocar el componente, y se guarda fuera del repositorio.
- **Tailwind y las palabras de `specs/`:** el texto de la spec y del plan puede añadir reglas inertes al CSS (ya documentado); no afecta al aspecto.
- **Tres cifras con etiquetas largas a 375 px:** cada tarjeta mide unos 100 px de texto; ya se ve bien en `max` (existente). La medición lo confirma; si recortara, se ajusta `otherValueSize`/clases y se pregunta, porque ya no sería solo el caso de dos cifras.
- **Tiempo de CI:** 16 variantes en lugar de 12; se mide la ejecución y, si pasa de 8 minutos por ejecución, se te consulta.
- **Vigilante de la spec 010:** el nombre del paso cambia en el workflow y en `STEP_NAMES` a la vez; si se olvida uno, el test del repositorio falla. Es la comprobación esperada.
- **Cabecera y demás secciones:** no se tocan; su verificación manual no se repite salvo que el diff las alcance (no debería).

## Comprobación con la constitución
- [x] Principio 1 (simplicidad): solo clases, sin JavaScript de cliente ni dependencias nuevas.
- [x] Principio 2 (la spec manda): solo lo de RF-1 a RF-13; las tres decisiones de arriba se te piden antes de aplicarlas.
- [x] Principio 3 (datos separados de interfaz): los fixtures son datos; la tarjeta sigue leyendo solo `about.stats`; no se añade texto fijo.
- [x] Principio 4 (el build como puerta): `npm run build` con `check-dist` y `test:schema`, `test:typecheck` y los builds de las 16 variantes en verde antes de dar algo por hecho.
- [x] Principio 5 (contrato sagrado): el contrato 2.3 no cambia; los fixtures son datos válidos.
- [x] Principio 6 (idioma): código en inglés, documentación y mensajes en español.

## Actualizaciones previstas
- AGENTS.md: «16 variantes», regla nueva de verificación de la tarjeta y una línea compactada (texto arriba; sin pasar de 59 líneas).
- MEMORY.md: spec 012 terminada, causa del defecto (porcentaje en un contenedor que se encoge y casos sin fixture), recuento de tests y de variantes vivo; sin pasar de 50 líneas (hoy 47).
