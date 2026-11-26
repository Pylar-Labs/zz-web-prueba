# Plan 013 — Informe de validación completo: los errores de una lista no ocultan los de sus elementos
> El CÓMO. Debe cumplir `docs/constitution.md` y cubrir todos los RF de `spec.md`.

## Enfoque técnico
**Causa comprobada.** No es código del proyecto: es Zod. Con `z.array(X).max(N)`, cuando la lista excede el máximo Zod informa `too_big` y **no llega a validar los elementos** (pasa igual con `z.string().max(3)` nativo dentro de un array). Probé las alternativas en memoria:

| Alternativa | Resultado con una lista excedida y un elemento inválido |
|---|---|
| `.max(N)` (hoy) | solo `too_big` |
| `.check()` o `.superRefine()` de cantidad | solo el error del elemento (se pierde el de cantidad: Zod salta los checks si hay errores de elementos) |
| `.refine()` con `when: () => true` | ambos, pero el esquema JSON generado pierde `maxItems` (cambia `site.schema.json` y el texto «lista (1 a 8)» del documento) |
| array **sin** `.max()` | solo los elementos |

**Diseño elegido: un solo esquema construido de dos formas, y el máximo comprobado a mano.**
1. **Tabla única de máximos** (`LIST_LIMITS`): `about.stats` 3, `about.highlights` 5, `services` 8, `testimonials` 9, `products` 60. Es la única fuente de esos números.
2. **El esquema se construye con una función** que recibe si la lista lleva `.max()` de Zod o no. `siteSchema` (exportado, con `.max()`) queda **idéntico a hoy**: lo usan `export-schema.mjs` (esquema JSON con `maxItems` y el texto de rangos del documento) y el tipo `SiteData`. Una versión interna **relajada** (sin `.max()` en esas cinco listas) valida los elementos.
3. **`validateSite` usa la versión relajada** y añade una regla propia, `listLimits(data)`, que da `too_many` (mismo código, ruta y mensaje de hoy) por cada lista excedida, leyendo los datos crudos como ya hace `crossRules`. Así el informe tiene `too_many` y además los errores de todos los elementos, dentro y fuera del máximo (RF-1, RF-2).
4. **Un mismo problema una sola vez por ruta y código** (RF-9): tras ordenar, se descartan los repetidos.
5. **Sin cambios** en códigos, mensajes, orden, formato, `unrecognized_field` y demás: solo se mueve *dónde* se calcula `too_many` y *cuándo* se validan los elementos. `.min(1)` de `services` se conserva en las dos versiones (no tiene elementos que ocultar).

**Por qué no las otras:** `refine` con `when` cambia el esquema JSON y el documento generado (RF-8); editar a mano el JSON generado está prohibido; reescribir el motor de validación es desproporcionado.

**Comprobación de que las dos versiones no se separan.** Un test exige que, para los fixtures y para datos mutados, `validateSite` dé `ok` exactamente cuando `siteSchema.safeParse` tenga éxito, de modo que la versión relajada no acepte lo que la estricta rechaza ni al revés (salvo los máximos, que cubre `listLimits`).

**Comprobación sistemática (RF-6, RF-10)** en un archivo de tests nuevo:
- Se parte del fixture máximo con cada lista **reducida a 2 elementos** (para que el número de campos sea manejable) y se recorren todos sus **campos hoja** de forma genérica (objetos y listas), de modo que un campo o lista futuros entran solos.
- Dos mutaciones por campo: **tipo equivocado** (`{ x: 1 }`) y **valor malo** (texto de 2000 caracteres si es texto, `-1` si es número; el booleano solo tiene la primera). Cada mutación sola debe dar al menos un error en su ruta (comprobación de que la mutación es válida como prueba).
- Para cada **par de mutaciones en campos distintos** que no sean de la misma dependencia declarada (abajo), el informe combinado contiene **todos** los errores de cada mutación por separado. Son unos pocos miles de validaciones (estimado: 100 a 150 mutaciones, unos 7.000 pares); debe terminar en menos de 30 s.
- **Dependencias declaradas (pares excluidos), de la spec:** (a) contacto: `contact.whatsapp`, `contact.email`, `contact.phone` entre sí (regla del método de contacto); (b) catálogo: `products[*].id`, `products[*].price`, `products[*].category` y `productGridConfig.*` entre sí (repetidos, precio obligatorio, categorías, moneda); (c) anclas: `hero.ctaPrimary.href` y `hero.ctaSecondary.href` frente a la existencia de las listas `testimonials` y `products` (se cubre con las pruebas de lista, no con pares de hojas). Cualquier par fuera de estos grupos que falle es el caso del **RF-7: me detengo y te lo cuento antes de corregir**.

## Archivos a crear / modificar
| Archivo | Cambio |
|---|---|
| `src/content/site.schema.ts` | `LIST_LIMITS`; función constructora del esquema (con y sin `.max()`) para `About` y el objeto raíz; versión relajada interna; `listLimits(data)` con el `too_many` de hoy; `validateSite` usa la relajada, añade `listLimits`, y descarta repetidos por ruta y código. `siteSchema` exportado idéntico. Respeta las reglas de `AGENTS.md` (solo `import type`, extensiones `.ts`, sin `enum` ni `@/`). |
| `scripts/site-errors.test.mjs` | **Nuevo** (autorizado en la spec): listas excedidas, tipos equivocados, productos con más de 60 y cruces, contenedor inválido, equivalencia con `siteSchema`, informe estructurado y de texto, la solicitud sintética de la prueba con el comando `validate`, y la comprobación sistemática. |
| `package.json` | **Un cambio de script, sin dependencias:** el archivo nuevo se añade a `test:schema` (si no, nunca correría). |
| `scripts/export-schema.mjs` | Una frase en el apartado «Informe de validación» (RF-12). |
| `docs/site-schema.md` | **Se regenera** con `npm run schema:export`; no se edita a mano. Solo cambia esa frase. |
| `MEMORY.md` | Estado, causa del defecto (el `.max()` de Zod corta antes de validar los elementos), recuento de tests; sin pasar de 50 líneas. |
| `specs/013-errores-de-listas-completos/` | `spec.md`, `plan.md`, `tasks.md`. |

No cambian `docs/site.schema.json` (se comprueba con `git diff`), `AGENTS.md`, la web, los datos de ningún cliente, `site.data.json`, los fixtures, el workflow del CI ni ninguna dependencia. Tests existentes: `assertRejected` y el resto comprueban «existe este error», no «es el único», así que no deberían cambiar; si alguno afirmara exclusividad, se actualiza (autorizado).

## Modelo de datos / interfaces
- **Contrato 2.3 sin cambios:** forma, máximos, códigos y mensajes. `siteSchema` (con `maxItems`) y `SiteData` iguales.
- **`validateSite(data)`:** misma firma y mismo tipo de informe (`ok`, `schemaVersion`, `errors[{path, code, message, expected?}]`). Cambia solo que, para listas excedidas, el informe incluye además los errores de sus elementos, con rutas como `about.stats[3].value` o `products[60].image`.
- **`LIST_LIMITS`:** tabla interna `{ ruta: máximo }` de cinco entradas; no se exporta (los scripts siguen leyendo `maxItems` del esquema JSON).
- **Orden y dedupe:** por ruta y luego por código, como hoy; `about.stats` (cantidad) antes de `about.stats[3].value`; una sola vez por ruta y código.

## Mapa RF → implementación → test
| RF | Dónde se implementa | Test que lo verifica |
|---|---|---|
| RF-1 | `validateSite` + esquema relajado + `listLimits` | Para cada una de las cinco listas excedida en 1 con un error en un elemento: el informe trae `too_many` y el error del elemento. |
| RF-2 | Esquema relajado valida todos los elementos | El error del elemento en la posición de dentro y en la de fuera del máximo, con la ruta exacta (`about.stats[0]`/`[3]`, `services[0]`/`[8]`, `testimonials[…]`, `about.highlights[…]`, `products[0]`/`[60]`). |
| RF-3 | Listas dentro del máximo: la ruta es la misma que hoy | Los tests actuales de elementos inválidos pasan sin cambios; test nuevo de lista justo en el máximo con un error en un elemento. |
| RF-4 | Esquema relajado: `invalid_type` por elemento | Elemento texto, número, `null` y array en lista excedida de objetos; número en `about.highlights`. |
| RF-5 | `crossRules` sin cambios | 61 productos con id repetido entre `products[3]` y `products[61]`, sin precio, categorías inconsistentes y más de 12: salen como hoy. |
| RF-5b | `validateSite` junta los dos orígenes | `about` sin título y cuatro cifras: salen `required` y `too_many`. |
| RF-6 | Esquema relajado + `listLimits` | Comprobación sistemática: un error por campo hoja y todos los pares independientes del fixture máximo reducido; el combinado contiene los dos errores. |
| RF-7 | Proceso: parada y consulta | Si la comprobación sistemática falla en un par fuera de las dependencias declaradas, me detengo. |
| RF-8 | `siteSchema` y mensajes sin tocar | Test de equivalencia `validateSite.ok ⇔ siteSchema.safeParse.success` sobre los fixtures y sobre datos con listas excedidas; `git diff docs/site.schema.json` vacío; todos los tests actuales de códigos y mensajes en verde. |
| RF-9 | Orden y dedupe en `validateSite` | Test de orden (`about.stats` antes de `about.stats[3].value`), sin repetidos por ruta y código, el informe de texto y el estructurado con los mismos errores. |
| RF-10 | `scripts/site-errors.test.mjs` | Todo lo anterior más la solicitud sintética de la prueba (cuatro cifras, ícono inválido, ancla inexistente, etc.) con `validate-site.mjs`: lista los once errores esperados a la primera, incluido `about.stats[0].value`. |
| RF-11 | Verificación completa | `test:schema`, comparador (17), `test:typecheck` (14), `typecheck`, build y `check-dist`; `git diff --stat` solo con los archivos de este plan. |
| RF-12 | `scripts/export-schema.mjs` y regeneración | `npm run schema:export`; el test que compara el documento con la generación pasa; solo cambia esa frase. |
| RF-13 | Subida al PR | Registro del paso «Resumen del resultado» de los dos trabajos: nueve pasos y «Todos los pasos pasan». |
| RF-14 | `MEMORY.md` | `check-setup` sin avisos y ≤ 50 líneas. |

## Riesgos y casos límite
- **Otros casos de ocultamiento (RF-7).** La comprobación sistemática puede encontrar más. Por decisión no se corrigen sin consultarte: me detengo y te presento el caso.
- **Las dos versiones del esquema se separan con el tiempo.** Salen de la misma función y el test de equivalencia lo vigila; si alguien añade una lista con máximo, debe añadirla a `LIST_LIMITS` (comentario junto a la tabla).
- **Una versión futura de Zod cambie el orden de los checks.** Los tests de listas excedidas lo detectarían de inmediato.
- **Tiempo de la comprobación sistemática.** ~7.000 validaciones de un fixture reducido; si pasa de 30 s se reduce el fixture o las mutaciones (se te cuenta antes de recortar cobertura).
- **Informes muy largos** con listas enormes (cientos de elementos con errores): se informan todos; fuera de alcance limitarlos.
- **`package.json`:** el cambio de `test:schema` es solo la lista de archivos; si prefieres no tocarlo, el test nuevo iría dentro de `site-schema.test.mjs` (más grande y menos legible).
- **Windows y Linux:** sin rutas ni saltos de línea nuevos; el documento regenerado se guarda con LF como siempre.
- **Rendimiento de la validación real:** un fixture máximo valida en menos de un segundo; la regla propia añade un recorrido de cinco listas.

## Comprobación con la constitución
- [x] Principio 1 (simplicidad): sin dependencias nuevas, sin JS de cliente; una tabla de cinco máximos y una regla.
- [x] Principio 2 (la spec manda): solo RF-1 a RF-14; los casos nuevos se paran y se consultan (RF-7); el cambio de `package.json` es tuyo para aprobar.
- [x] Principio 3 (datos separados de interfaz): no se toca la web ni su texto fijo.
- [x] Principio 4 (el build como puerta): `npm run build`, `test:schema`, `test:typecheck` y `check-dist` en verde antes de dar algo por hecho; las 16 variantes siguen construyendo.
- [x] Principio 5 (contrato sagrado): forma, valores válidos, códigos y mensajes sin cambios; `site.schema.json` idéntico; versión 2.3.
- [x] Principio 6 (idioma): código en inglés, mensajes y documentación en español.

## Actualizaciones previstas
- AGENTS.md: ninguna (su regla de «lista completa de errores» pasa a cumplirse).
- MEMORY.md: spec 013 terminada, causa (el `.max()` de Zod corta antes de validar los elementos; un `check` normal pierde el error de cantidad), diseño (esquema con y sin `.max()` más `listLimits`), recuento de tests y las dos fricciones de la prueba que quedaron fuera (anclas en español en webs en inglés y portugués, formulario que descarta lo escrito y teléfono sin enlace); sin pasar de 50 líneas (hoy 48).
