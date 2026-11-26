# Plan 007 — Revisión de tipos del código de la web
> El CÓMO. Debe cumplir `docs/constitution.md` y cubrir todos los RF de `spec.md`.

## Medición previa (hecha en una copia temporal, fuera del repositorio)
Instalé las herramientas solo en una copia del scratchpad (el repositorio no se tocó) y ejecuté `astro check`:
- **Herramientas compatibles con Astro 7.4.12:** `@astrojs/check` 0.9.12 (última) exige `typescript` `^5 || ^6`. La última de `typescript` es la **7.0.2, que no es compatible**; se usa la **6.0.3**. `npm audit`: 0 vulnerabilidades con las tres herramientas.
- **Errores existentes: 7 en 31 archivos (0 avisos, 0 sugerencias).** Por debajo del umbral de ~30 de la spec. Con `@types/node@22` bajan a **3**:
  1. 4 errores en `site.config.ts` (`node:fs`, `node:path`, `process`): faltan los tipos de Node. Se arreglan con un paquete de desarrollo, sin tocar código.
  2. 1 error en `site.schema.ts:595`: `CUSTOM_MESSAGES[code]` está tipado como si siempre existiera, pero en ejecución puede ser `undefined` (la comprobación `build ?` es correcta). Es un ajuste de tipos puro.
  3. 2 errores en `ui/icon.tsx`: importa `Instagram` y `Facebook`, que `lucide-react` 1.18 ya no exporta. **Nadie importa ese componente** (código muerto) y en ejecución esas dos entradas serían `undefined`.
- **Tiempo:** `astro check` tarda **~18 s** (17,5 s y 18,5 s en dos pasadas). `npm run build` hoy tarda **~6,3 s**. Con la revisión el build pasa a ~24 s: **cuatro veces más** (+18 s). Eso supera el umbral «se duplica» que fijó la spec (no el de +30 s), así que **te lo consulto** (ver «Decisiones que necesito de ti»).
- **Alternativa descartada:** `tsc --noEmit` tarda ~4 s, pero no revisa las plantillas `.astro` (8 archivos); la spec (RF-4) las incluye.
- **Importaciones con extensión `.ts`:** no producen ningún error con la configuración actual, así que RF-5 no choca con la regla de los scripts.
- **Alcance:** el recuento de «31 archivos» incluye los `.mjs` de `scripts/`, pero los scripts JavaScript no se tipan (no hay revisión de JavaScript activada), así que quedan fuera sin tocar la configuración. Se verifica con una prueba.

## Enfoque técnico
1. **Herramienta:** `astro check` (revisa `.ts`, `.tsx` y `.astro` con la configuración estricta que el proyecto ya declara; sin tocar `tsconfig.json`).
2. **Comando propio** (`npm run typecheck`): un script de Node que (a) comprueba que están instaladas `typescript` y `@astrojs/check` y, si faltan, termina con un mensaje en español que dice qué falta y cómo instalarlo (RF-10), y (b) ejecuta `astro check`, muestra su salida tal cual y termina con su código de salida.
3. **Build:** hoy `prebuild` = `npm run validate`. Pasa a un script que ejecuta **las dos comprobaciones aunque una falle** (validación de datos y revisión de tipos), deja sus salidas completas y termina con fallo si falló cualquiera (RF-6 a RF-8). `npm run validate` no cambia (RF-9). `npm run dev` y `preview` no cambian (RF-11).
4. **Errores existentes:** `@types/node` (4 errores menos); tipo correcto en `site.schema.ts`; quitar de `icon.tsx` las dos entradas inexistentes (ver decisión 3).
5. **Test permanente:** un test que crea un archivo de prueba con un error de tipos, comprueba que el comando falla mostrando archivo y línea, lo borra y comprueba que vuelve a pasar. Más pruebas de la lógica pura (herramientas ausentes, las dos comprobaciones a la vez) sin lanzar el compilador.

## Decisiones que necesito de ti (con el plan)
1. **Tres paquetes de desarrollo nuevos** (RF-18; regla «pregunta antes»). Aprobar el plan los autoriza; sin tu aprobación no se instalan:
   | Paquete | Versión | Motivo |
   |---|---|---|
   | `typescript` | `^6.0.3` (no la 7: incompatible con `@astrojs/check`) | el compilador de tipos |
   | `@astrojs/check` | `^0.9.12` | revisa también las plantillas `.astro` (`tsc` solo no puede) |
   | `@types/node` | `^22.20.5` (la mínima que declara el proyecto, Node ≥ 22.23.4) | tipos de `node:fs`, `node:path` y `process` que usa `site.config.ts` |
2. **Tiempo del build: ~6 s → ~24 s (×4, +18 s).** La spec pedía consultarte si se duplicaba. Recomiendo aceptarlo: es el precio de la puerta y la alternativa más rápida (`tsc`, 4 s) no revisa las plantillas. Cada web que genere el servicio tardará 18 s más.
3. **`ui/icon.tsx`:** quitar `Instagram` y `Facebook` del componente (no existen en `lucide-react` 1.18 y nadie lo usa). No cambia la web ni los datos, pero no es un ajuste de tipos «puro» (RF-14), por eso te lo planteo. Alternativas: borrar el archivo entero (más limpio, pero sale del alcance) o una supresión con comentario (oculta que hoy está roto).

## Archivos a crear / modificar
| Archivo | Cambio |
|---|---|
| `package.json` | + `typescript`, `@astrojs/check`, `@types/node` en `devDependencies`; + script `typecheck`; `prebuild` pasa al nuevo script; + script `test:typecheck` |
| `package-lock.json` | actualizado por `npm install` (solo esas dependencias y sus transitivas) |
| `scripts/typecheck.mjs` (nuevo) | comando de revisión: comprueba herramientas, ejecuta `astro check`, devuelve su código de salida; exporta funciones puras para los tests |
| `scripts/prebuild.mjs` (nuevo) | ejecuta validación de datos y revisión de tipos, las dos siempre, y falla si falla cualquiera |
| `scripts/typecheck.test.mjs` (nuevo) | test permanente (RF-17) y pruebas de la lógica pura |
| `src/content/site.schema.ts` | solo el tipo de `build` en `toErrors` (línea ~594): `| undefined`; sin cambio de comportamiento |
| `src/components/ui/icon.tsx` | quitar `Instagram` y `Facebook` (si apruebas la decisión 3) |
| `AGENTS.md` | comando, build, verificación obligatoria, mensajes propios frente a los de la herramienta, número de tests |
| `MEMORY.md` | retirar «TypeScript no está instalado…», anotar decisiones y estado |
| `tsconfig.json` | **sin cambios** (RF-5) |
| `docs/site-schema.md`, `docs/site.schema.json` | **sin cambios** (el contrato no cambia; no hace falta `schema:export`) |

## Modelo de datos / interfaces
- No cambia el contrato (sigue en 2.3), ni los datos, ni la web.
- `scripts/typecheck.mjs` exporta `findMissingTools(resolve)` (devuelve las herramientas que faltan) y `buildMissingToolsMessage(missing)` (mensaje en español) y, cuando se ejecuta directamente, hace la comprobación. `scripts/prebuild.mjs` exporta `runAll(steps)` (ejecuta todos los pasos y devuelve el resultado de cada uno) para probarla con pasos simulados.
- Códigos de salida: 0 si todo pasa, 1 si algo falla. Los scripts son `.mjs`: no usan el alias `@/` ni `enum`.

## Mapa RF → implementación → test
| RF | Dónde se implementa | Test que lo verifica |
|---|---|---|
| RF-1 | script `typecheck` | `typecheck.test`: el comando existe y termina con éxito en el árbol limpio |
| RF-2 | `scripts/typecheck.mjs` | el mismo test: éxito y mensaje de éxito |
| RF-3 | salida de `astro check` tal cual; avisos no frenan | test del archivo de prueba: falla con ruta y línea; el código de salida es 1 solo ante errores |
| RF-4 | alcance de `astro check`; scripts JS no se tipan | prueba: un error de tipos en un `.mjs` no hace fallar el comando; en `.ts`/`.tsx`/`.astro` sí |
| RF-5 | `tsconfig.json` sin cambios | `git diff` de `tsconfig.json` vacío; el comando pasa con la configuración original |
| RF-6 | `scripts/prebuild.mjs` | test de `runAll` con pasos simulados: ejecuta los dos pasos |
| RF-7 | `prebuild` falla ⇒ `astro build` no corre | build real con un error provocado: no genera `dist` |
| RF-8 | `runAll` junta los dos resultados | test con los dos pasos fallando: salen los dos errores |
| RF-9 | `npm run validate` intacto | los 700 tests existentes y una comparación de la salida de `validate` antes y después |
| RF-10 | `findMissingTools` y su mensaje | test con un `resolve` simulado que falla: mensaje en español con qué falta y cómo instalarlo |
| RF-11 | `dev` y `preview` no se tocan | `git diff` de esos scripts vacío |
| RF-12 a RF-15 | `@types/node`, tipo en `site.schema.ts`, `icon.tsx`; comentario obligatorio en excepciones | el comando pasa en limpio; revisión del diff: ninguna supresión ni `any` nuevos; el PR lista las excepciones (hoy: ninguna prevista) |
| RF-16 | verificación de 12 builds antes/después | comparación de todos los archivos del build (HTML, CSS, JS) byte a byte, más `compare-builds` |
| RF-17 | `scripts/typecheck.test.mjs` | el propio test; los 700 existentes pasan sin modificar |
| RF-18 | tres `devDependencies` | `npm ls --omit=dev` no muestra las nuevas; `npm audit` 0 |
| RF-19 | comandos de verificación | revisión de tipos y build con Node 22.23.4 y con Node 24 |
| RF-20 | `AGENTS.md`, `MEMORY.md` | `check-setup` sin avisos |

## Riesgos y casos límite
- **Servicio sin dependencias de desarrollo** (`--omit=dev`): el build fallaría con el mensaje de RF-10. **Condición de fusión:** confirmas cómo instala y qué comando de build usa. Si usa `astro build` directamente, la puerta se salta sin avisar; hay que decirlo.
- **Tiempo:** +18 s por web. Mitigación: ninguna sin perder RF-4; la alternativa documentada (`tsc`, 4 s) no cubre `.astro`.
- **TypeScript 7:** `^6.0.3` evita que una actualización automática lo instale; si `@astrojs/check` pasa a admitirla, se decide aparte.
- **Dependabot o actualización de herramientas** que destape errores: el build falla y se decide; no se silencia.
- **Clon limpio:** `astro check` debe generar solo lo que necesita; se verifica con `npm ci` en copia limpia (la tarea de copia limpia de la spec 006 es el modelo).
- **Test que crea un archivo en `src/`:** se borra en `finally`; si el proceso muriera dejaría el archivo y el siguiente `typecheck` fallaría señalándolo. El test se niega a empezar si ya existe y es un script aparte (`test:typecheck`) para no mezclar con `test:schema` (~40 s estimados por las dos revisiones).
- **Salida en Windows:** se muestra tal cual la salida de `astro check`; se verifica ruta y código de salida.
- **`icon.tsx`:** si prefieres otra opción, se cambia antes de las tareas.
- **Reversión:** `git revert -m 1 <merge>`; no queda nada fuera del repositorio.

## Comprobación con la constitución
- [x] **1. Simplicidad:** tres paquetes solo de desarrollo, justificados uno a uno; ninguno entra en la web ni añade JavaScript de cliente.
- [x] **2. La spec manda:** cada archivo responde a un RF; los tres puntos que necesitan tu decisión están separados arriba.
- [x] **3. Datos separados de interfaz:** no se toca contenido ni textos de interfaz; los mensajes nuevos son de herramientas del proyecto (español), no de la web.
- [x] **4. El build como puerta:** el build pasa a revisar también los tipos y falla si faltan las herramientas.
- [x] **5. Contrato sagrado:** el contrato no cambia; el template sigue reemplazable solo con datos, **pero ahora el build exige herramientas de desarrollo** (riesgo declarado, condición de fusión).
- [x] **6. Idioma:** código en inglés; mensajes y documentación en español; la salida del compilador, en su idioma (aclarado en `AGENTS.md`).

## Actualizaciones previstas
- **AGENTS.md:** comando `npm run typecheck` y `test:typecheck`; el build revisa tipos; regla «Siempre» y sección de verificación; nota de qué mensajes son nuestros y cuáles de la herramienta; recuento de tests. Se muestra el texto antes de aplicarlo.
- **MEMORY.md:** estado (spec 007), decisiones con su porqué (TypeScript 6 por compatibilidad, `astro check` frente a `tsc`, build ×4) y retirar «TypeScript no está instalado».
