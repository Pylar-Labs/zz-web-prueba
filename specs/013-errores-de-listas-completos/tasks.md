# Tareas 013 — Informe de validación completo: los errores de una lista no ocultan los de sus elementos
> Tareas pequeñas, ordenadas, verificables. Cada una referencia sus RF y termina con tests en verde.
> `[P]` = puede hacerse en paralelo.

## Reglas de ejecución
- **Test primero**: los tests de listas excedidas (T3) se escriben en rojo antes de tocar `site.schema.ts` (T5 y T6). Los tests que ya pasan hoy (listas dentro del máximo, productos con más de 60, equivalencia con `siteSchema`, informe de texto y estructurado) entran como red de seguridad y deben seguir en verde durante todo el cambio.
- **Plan aprobado, con sus dos decisiones:** el archivo de tests nuevo se añade a `test:schema` en `package.json` (solo la lista de archivos, sin dependencias), y los tests existentes que afirmen que un error es «el único» se pueden actualizar. Cualquier otro cambio se te pregunta antes.
- **Bloqueos (me detengo y te lo cuento):** (a) falla un test existente que no afirme exclusividad; (b) la comprobación sistemática falla en un par fuera de las dependencias declaradas (RF-7: tú decides si se corrige aquí, se anota o se abre otra spec); (c) corregir algo exigiría un código nuevo, cambiar un mensaje o cambiar `siteSchema`, `SiteData` o la versión (RF-8); (d) `git diff docs/site.schema.json` no queda vacío tras regenerar; (e) hace falta tocar un archivo que no esté en la lista de abajo; (f) la comprobación sistemática pasa de 30 s o el fixture máximo tarda más de 1 s en validarse; (g) fallan la revisión de tipos o `test:typecheck` por los cambios del esquema; (h) en GitHub el resumen sale distinto de lo previsto o se agota la cuota de Actions.
- **Tests existentes:** los 774 de `test:schema` siguen en verde (solo se tocan los que afirmen exclusividad, si hay alguno). Los comparadores (17) y los de tipos (14) no se tocan.
- **Archivos del repositorio que se tocan:** `src/content/site.schema.ts`, `scripts/site-errors.test.mjs` (nuevo), `package.json` (solo el script `test:schema`), `scripts/export-schema.mjs`, `docs/site-schema.md` (regenerado, no a mano), `MEMORY.md` y la carpeta de la spec. Nada más. `docs/site.schema.json`, `AGENTS.md`, la web, los fixtures y el workflow no cambian.
- **Reglas de `AGENTS.md` para `site.schema.ts`:** los scripts de Node lo importan quitando los tipos: solo `import type`, extensiones `.ts` en rutas relativas, sin `enum` ni el alias `@/`.
- **Nada hacia GitHub sin tu aprobación expresa:** commits, subidas, pull requests, cierres y borrados. La subida dispara una ejecución de Actions de ~5 minutos; cada arreglo se te presenta antes de subirlo.
- **Agentes y worktrees:** los worktrees de los agentes viven dentro del repositorio (`.claude/worktrees`): se borran al terminar y no ejecuto `typecheck` ni `test:typecheck` mientras existan. Verifico cada informe de un agente (rama, SHA, diff, tests) antes de usarlo. Los hallazgos reales de una revisión se te presentan antes de corregirlos.
- **Archivos temporales** (los ensayos con las solicitudes sintéticas) en la carpeta temporal de la sesión, nunca en el repositorio. Los builds de comprobación van fuera del repositorio (`--out`).
- **Comandos:** esta sesión ejecuta Bash; para ti, en PowerShell, las variables de entorno van como `$env:NOMBRE = "..."`.
- **Ruta crítica:** T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9 → T10 → T12 → T13 → T14 → T15 → T16 → T17.

## Fase 0 — Rama y base
- [ ] T1: **Crear la rama `feat/errores-de-listas-completos` desde `master`.** Comprobar que `master` está al día con `origin`.
  *Hecho cuando:* estás en `feat/errores-de-listas-completos` y `git status` solo muestra la carpeta de la spec sin seguimiento.
- [x] T2 `[P]`: **Base.** Anotar los recuentos de referencia (`npm run test:schema` 774, el comparador 17, `npm run test:typecheck` 14, la revisión de tipos), que `docs/site.schema.json` y `docs/site-schema.md` están sin cambios, y comprobar en GitHub que la última ejecución del CI sobre `master` está en verde.
  *Hecho cuando:* los recuentos y el estado del CI están anotados.

## Fase 1 — Tests primero
- [x] T3 (RF-1 a RF-5b, RF-8, RF-9, RF-10): **Tests de listas: rojos y de seguridad.** Crear `scripts/site-errors.test.mjs` y añadirlo a `test:schema` en `package.json`. Rojos hoy: para cada una de las cinco listas (`about.stats`, `about.highlights`, `services`, `testimonials`, `products`) excedida en 1 con un error en un elemento de dentro y otro en uno de fuera del máximo, el informe trae `too_many` y el error del elemento con su ruta exacta; elementos de tipo equivocado (texto, número, `null`, array; número en `about.highlights`) en una lista excedida; `about` sin título más cuatro cifras. Verdes hoy (red de seguridad): lista justo en el máximo con un error en un elemento; 61 productos con id repetido entre `products[3]` y `products[61]`, sin precio y categorías inconsistentes; equivalencia `validateSite.ok ⇔ siteSchema.safeParse.success` sobre los fixtures y sobre datos con listas excedidas; el informe estructurado y el de texto con los mismos errores; orden (`about.stats` antes de `about.stats[3].value`) y sin repetidos por ruta y código.
  *Hecho cuando:* los tests rojos fallan por la razón esperada (los errores de los elementos no aparecen), los de seguridad pasan, los demás tests existentes siguen en verde y el archivo nuevo corre con `npm run test:schema`.
- [x] T4 (RF-6, RF-10): **Comprobación sistemática y solicitud sintética.** En el mismo archivo: el recorrido genérico del fixture máximo reducido (listas a 2 elementos): dos mutaciones por campo hoja (tipo equivocado y valor malo), cada una debe dar sola al menos un error en su ruta, y para todos los pares de campos fuera de las dependencias declaradas (contacto; catálogo e id, precio, categoría y `productGridConfig`; anclas) el informe combinado contiene todos los errores de cada una. Además, cada lista excedida combinada con cada mutación de otros campos. Y la solicitud sintética de la prueba (cuatro cifras, ícono inválido, ancla a una sección inexistente, idioma mal escrito, WhatsApp con espacios, email inválido, URL sin `https`, valoración 6, salto de línea) con `validate-site.mjs`, que debe listar los once errores esperados, incluido `about.stats[0].value`.
  *Hecho cuando:* el test sistemático corre en menos de 30 s y la solicitud sintética falla solo en el error oculto de la cifra; si la comprobación sistemática falla en un par fuera de las dependencias declaradas, es el bloqueo (b) y paro.

## Fase 2 — Implementación
- [x] T5 (RF-1, RF-2, RF-8): **`site.schema.ts`: el esquema con y sin `.max()`.** Tabla `LIST_LIMITS` de cinco máximos y una función constructora para `About` y el objeto raíz; `siteSchema` exportado (con `.max()`) idéntico a hoy y una versión relajada interna (sin `.max()`) sin usar todavía.
  *Hecho cuando:* los tests existentes y los de seguridad de T3 siguen en verde, `npm run typecheck` pasa, `npm run schema:export` no cambia `docs/site.schema.json` ni `docs/site-schema.md`, y `siteSchema` genera el mismo esquema JSON (comprobado con `git diff`).
- [x] T6 (RF-1 a RF-5b, RF-9): **`site.schema.ts`: `validateSite` completa.** `validateSite` usa la versión relajada, `listLimits(data)` da `too_many` con el mismo código, ruta y mensaje de hoy, y se descartan los repetidos por ruta y código tras ordenar.
  *Hecho cuando:* los tests de T3 pasan todos, los de T4 siguen en verde y todos los demás tests existentes también.
- [x] T7 (RF-6, RF-7): **La comprobación sistemática, sin casos nuevos.** Ejecutar el test sistemático con el cambio y verificar que no hay pares fuera de las dependencias declaradas que fallen.
  *Hecho cuando:* el test sistemático pasa. Si falla un par nuevo, es el bloqueo (b): te lo describo y espero tu decisión.
- [x] T8 (RF-12): **Documento: una frase.** Añadir al apartado «Informe de validación» de `scripts/export-schema.mjs` que se informan todos los errores aunque una lista exceda su máximo, y regenerar con `npm run schema:export`.
  *Hecho cuando:* `docs/site-schema.md` cambia solo por esa frase (`git diff`), `docs/site.schema.json` no cambia, y el test que compara los documentos con su generación pasa.

## Fase 3 — Verificación local
- [x] T9 (RF-8, RF-11): **Todo en verde en local.** `npm run test:schema` (774 más los nuevos, con el archivo nuevo incluido), el comparador (17), `npm run test:typecheck` (14), `npm run typecheck`, `npm run build` con `check-dist` y `check-setup`; `git diff --stat` solo con los archivos de las reglas, sin tocar `AGENTS.md`, la web ni las dependencias; el fixture máximo valida en menos de un segundo.
  *Hecho cuando:* todo en verde y los archivos tocados coinciden con la lista.
- [x] T10 (RF-10, RF-11) `[P]`: **Ensayo manual y las 16 variantes.** Con las solicitudes sintéticas de la prueba anterior (la clínica en portugués con sus diez errores y las sondas de listas excedidas) ejecutar `npm run validate` y anotar que el informe ya lista todos los errores a la primera; y construir las 16 variantes con `npm run verify:ci -- --out <carpeta temporal>` para comprobar que el cambio de `site.schema.ts` no afecta a ninguna.
  *Hecho cuando:* el informe de cada solicitud está anotado y las 16 variantes construyen y pasan `check-dist`.
- [x] T11 `[P]`: **Revisión independiente (solo lectura).** Un agente revisa el cambio (esquema, regla de listas, dedupe, tests y documento) en busca de defectos reales, sin modificar nada; verifico su informe antes de actuar y te presento los hallazgos reales antes de corregirlos.
  *Hecho cuando:* hay un informe verificado.

## Fase 4 — Pull request, fusión y cierre
- [ ] T12: **Pedir tu aprobación para commitear, subir la rama y abrir el pull request.** Dos commits (la spec, el plan y las tareas por un lado; el esquema, el archivo de tests, `package.json`, `export-schema.mjs` y el documento por otro, este último tras `/verify`). Aviso de que la subida dispara una ejecución de Actions de ~5 minutos.
  *Hecho cuando:* aprobaste y el pull request está abierto, con la ejecución en marcha.
- [x] T13 (RF-13): **Resultado en GitHub.** Ver la ejecución con las dos versiones de Node: nueve pasos en el resumen y «Todos los pasos pasan». Si es rojo, investigar y proponerte el arreglo; solo se sube con tu aprobación.
  *Hecho cuando:* hay una ejecución verde con las dos versiones.
- [ ] T14: **Fusionar el pull request** con merge commit y con tu aprobación expresa.
  *Hecho cuando:* el pull request está fusionado.
- [ ] T15: **Ejecución en `master` y `/verify` final.** Ver que la subida a `master` dispara la verificación y termina en verde; `/verify` final sobre `master` (tests, `test:typecheck`, build, revisión de cada RF y de los principios de la constitución).
  *Hecho cuando:* la ejecución de `master` es verde y el informe está entregado.
- [x] T16 (RF-14): **Actualizar `MEMORY.md`**: estado (spec 013 cerrada), recuento de tests, la causa (el `.max()` de Zod corta antes de validar los elementos; un `check` normal pierde el error de cantidad), el diseño (esquema con y sin `.max()` más `listLimits`), y las dos fricciones de la prueba que quedaron fuera (anclas en español en webs en inglés y portugués, formulario que descarta lo escrito y teléfono sin enlace); sin pasar de 50 líneas; commit y push con tu aprobación.
  *Hecho cuando:* `MEMORY.md` actualizado, con `check-setup` sin avisos y subido.
- [ ] T17: **Borrar la rama `feat/errores-de-listas-completos`** (local y remota) si lo apruebas.
  *Hecho cuando:* la rama ya no existe.
