# Tareas 007 — Revisión de tipos del código de la web
> Tareas pequeñas, ordenadas, verificables. Cada una referencia sus RF y termina con tests en verde.
> `[P]` = puede hacerse en paralelo.

## Reglas de ejecución
- **Test primero** en lo que es código nuevo: los dos scripts (T4 a T8). Las comprobaciones sobre la web se verifican con builds, la comparación byte a byte y los comandos reales.
- **Plan aprobado, con sus tres decisiones:** los tres paquetes de desarrollo (`typescript` `^6.0.3`, `@astrojs/check` `^0.9.12`, `@types/node` `^22.20.5`), aceptar el build de ~24 s y quitar `Instagram` y `Facebook` de `ui/icon.tsx`. Cualquier otro paquete, archivo o cambio se te pregunta antes.
- **Bloqueos (me detengo y te lo cuento):** (a) falla un test existente; (b) la revisión de tipos o el build dan resultados distintos en Node 22.23.4 y en Node 24; (c) aparecen más de ~30 errores de tipos o uno exige cambiar HTML, datos o comportamiento (hoy hay 3, todos ya analizados); (d) algún archivo del build difiere de la línea base (RF-16); (e) hace falta algo fuera del plan.
- **Tests existentes:** los 700 no se modifican. Los tests nuevos van en `scripts/typecheck.test.mjs` (archivo nuevo, aprobado con estas tareas) y se ejecutan con su propio script `test:typecheck`.
- **Archivos nuevos aprobados con estas tareas:** `scripts/typecheck.mjs`, `scripts/prebuild.mjs` y `scripts/typecheck.test.mjs`.
- **Nada hacia GitHub ni commits sin tu aprobación expresa.**
- **Archivos temporales** (líneas base, copias limpias, volcados) en la carpeta temporal de la sesión, nunca en el repositorio. La única excepción son los archivos de prueba con errores de tipos que crean los tests y la tarea T11 en `src/` y `scripts/`: llevan nombre propio, se borran en el mismo comando y se comprueba con `git status` que no queda nada.
- **Comandos:** esta sesión ejecuta Bash; para ti, en PowerShell, las variables de entorno van como `$env:SITE_DATA = "..."`.
- **Servidores ajenos:** si hay `astro dev`, `astro preview` o servidores de volcado de sesiones anteriores, se dejan como están.
- **Ruta crítica:** T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9 → T10 → T11 → T12 → T13 → T14 → T15 → T16 → T17 → T18 → T19 → T20 → T21.

## Fase 0 — Rama y línea base
- [x] T1: **Crear la rama `feat/revision-de-tipos` desde `master`.** Comprobar que `master` está al día con `origin`.
  *Hecho cuando:* estás en `feat/revision-de-tipos` y `git status` solo muestra la carpeta de la spec sin seguimiento.
- [x] T2 (RF-9, RF-16): **Línea base con la `master` actual**, en la carpeta temporal: los 12 builds (demo, mínima y máxima en español, inglés y portugués, y los cinco fixtures de precio) guardando cada `dist` completo; `check-dist` de cada uno; la salida de `npm run validate` con la demo y con un dato inválido; el tiempo de `npm run build` en tres pasadas; `npm run test:schema` (700 en verde) y el comparador (17).
  *Hecho cuando:* existen los 12 `dist`, la salida de `validate` guardada, los tres tiempos y los recuentos de tests.
- [x] T3 (RF-19) `[P]`: **Comprobar el Node 22.23.4 desechable.** Confirmar que el binario oficial descargado antes sigue en la carpeta temporal y que informa `v22.23.4`; si no está, pedirte aprobación para descargarlo de nuevo (con verificación SHA256).
  *Hecho cuando:* hay un Node 22.23.4 utilizable y anotada su ruta.

## Fase 1 — Tests rojos y dependencias
- [x] T4 (RF-1 a RF-4, RF-6 a RF-8, RF-10, RF-17): **Tests rojos.** Crear `scripts/typecheck.test.mjs` con (a) lógica pura: `findMissingTools` con un `resolve` simulado devuelve las herramientas que faltan (ninguna, `typescript`, `@astrojs/check`, las dos); `buildMissingToolsMessage` da un mensaje en español que nombra lo que falta y cómo instalarlo; `runAll` con pasos simulados ejecuta **todos** los pasos aunque el primero falle, devuelve el resultado de cada uno, falla si falla cualquiera, muestra los dos errores si fallan los dos y tiene éxito si pasan; (b) de punta a punta: el test se niega a empezar si ya existe algún archivo de prueba; con un error de tipos en un `.ts` y otro en un `.astro` de `src/` y un error en un `.mjs` de `scripts/`, el comando falla (código 1) y la salida incluye la ruta y la línea de los dos primeros y **no** la del `.mjs`; sin los dos primeros, solo con el `.mjs` de prueba, el comando termina con éxito (código 0) y lo dice; los archivos de prueba se borran siempre (`finally`).
  *Hecho cuando:* el archivo existe y todos sus tests fallan por la razón esperada (los scripts no existen todavía), y los demás tests existentes siguen en verde.
- [x] T5 (RF-18): **Instalar los tres paquetes de desarrollo.** `npm install --save-dev typescript@^6.0.3 @astrojs/check@^0.9.12 @types/node@^22.20.5` y revisar `git diff` de `package.json` y `package-lock.json`.
  *Hecho cuando:* `package.json` solo gana esas tres líneas en `devDependencies`; `npm ls --omit=dev` es igual que antes; `npm audit` da 0; `typescript` es la 6.x; los 700 tests existentes siguen en verde.

## Fase 2 — Implementación
- [x] T6 (RF-1 a RF-3, RF-10): **`scripts/typecheck.mjs`.** Comprueba que están `typescript` y `@astrojs/check` (si faltan, mensaje en español y salida con fallo, sin ejecutar nada más); ejecuta `astro check` con el mismo Node, muestra su salida tal cual y devuelve su código de salida; con éxito dice que no hay errores de tipos; exporta `findMissingTools` y `buildMissingToolsMessage`.
  *Hecho cuando:* los tests de lógica pura de T4 que corresponden están en verde. Los de punta a punta pueden seguir rojos hasta T8 (esperado: hay errores de tipos reales).
- [x] T7 (RF-6 a RF-9, RF-11): **`scripts/prebuild.mjs` y `package.json`.** El script ejecuta primero la validación de datos y después la revisión de tipos, **las dos siempre**, deja sus salidas completas y falla si falla cualquiera; exporta `runAll`. En `package.json`: script `typecheck`, `prebuild` apunta al nuevo script y script `test:typecheck`. `validate`, `dev`, `preview`, `build`, `astro` y `test:schema` no cambian.
  *Hecho cuando:* los tests de `runAll` de T4 están en verde y `git diff` de `package.json` muestra, además de las tres dependencias de T5, solo esos tres scripts.
- [x] T8 (RF-12 a RF-15): **Corregir los 3 errores de tipos.** En `site.schema.ts` (línea ~594), el tipo de `build` en `toErrors` admite `undefined`; en `src/components/ui/icon.tsx`, quitar `Instagram` y `Facebook`. Sin supresiones, sin `any`, sin tocar `tsconfig.json`.
  *Hecho cuando:* `npm run typecheck` termina con 0 errores, `git diff` de `tsconfig.json` está vacío y el diff no contiene supresiones ni `any` nuevos.
- [x] T9 (RF-1 a RF-4, RF-17): **Todos los tests en verde.** `npm run test:typecheck`, `npm run test:schema` (700) y el comparador (17). Anotar los tiempos.
  *Hecho cuando:* todo en verde, incluidos los de punta a punta; el recuento de tests nuevos queda anotado y los 700 existentes pasan sin haberlos modificado.

## Fase 3 — Verificación
- [x] T10 (RF-5, RF-9, RF-11, RF-12 a RF-15): **Comprobación del diff.** `git diff --stat` contiene solo los archivos del plan; `tsconfig.json`, `dev`, `preview` y `validate` sin cambios; la salida de `npm run validate` con la demo y con el dato inválido es idéntica a la de T2; ninguna supresión ni `any` nuevo.
  *Hecho cuando:* los archivos tocados coinciden con la lista del plan y las salidas de `validate` son idénticas a la línea base.
- [x] T11 (RF-6 a RF-8): **El build real con errores provocados.** Con un error de tipos en un `.ts` de prueba: `npm run build` falla mostrando ruta y línea y no genera `dist`. Con datos inválidos y tipos correctos: falla como antes, con el mismo mensaje de validación. Con las dos cosas a la vez: muestra las dos listas completas. Cada prueba borra su archivo y se comprueba con `git status` que no queda nada.
  *Hecho cuando:* los tres casos se comportan así y el árbol queda limpio.
- [x] T12 (RF-16, RF-19): **Los 12 builds después y comparación.** Construir las 12 variantes con la revisión activa y `check-dist` en cada una; comparar **todos los archivos** de cada `dist` con la línea base de T2 (HTML, CSS, JavaScript, imágenes), más `compare-builds`; medir el tiempo del build (tres pasadas) frente a T2; repetir la revisión de tipos y un build con Node 22.23.4.
  *Hecho cuando:* los 12 `dist` son idénticos archivo a archivo, el comparador no ve diferencias, la revisión y el build pasan en Node 22.23.4 y en Node 24, y anotado el tiempo (esperado ~24 s frente a ~6 s). Cualquier diferencia de contenido es el bloqueo (d).
- [x] T13 (RF-10, RF-18) `[P]`: **Copias limpias**, en la carpeta temporal (archivos de git, sin ignorados). (a) `npm ci` completo: `npm run typecheck` a la primera sin pasos manuales, `test:schema`, `test:typecheck`, los 12 builds con `check-dist` y `npm audit`; (b) `npm ci --omit=dev`: `npm run build` falla con el mensaje en español que nombra lo que falta y cómo instalarlo, y `npm run validate` sigue funcionando; `npm ls --omit=dev` no muestra los tres paquetes.
  *Hecho cuando:* (a) todo pasa y `npm audit` da 0; (b) falla con el mensaje esperado y sin error críptico.

## Fase 4 — Documentación, pull request y fusión
- [x] T14 (RF-20): **Actualizar `AGENTS.md`** (comando `npm run typecheck`, que el build revisa tipos, `test:typecheck`, regla «Siempre» y sección de verificación, qué mensajes son nuestros y cuáles de la herramienta, recuento de tests) sin pasar de lo que `check-setup` admite. Mostrar el texto antes de aplicarlo.
  *Hecho cuando:* aprobaste el texto y `AGENTS.md` está actualizado con `check-setup` sin avisos.
- [x] T15: **Actualizar la rama con `master`** y repetir la verificación abreviada (tests y builds) si hubo cambios.
  *Hecho cuando:* la rama incluye `master` y la verificación pasa.
- [x] T16: **Pedir tu aprobación para commitear, subir la rama y abrir el pull request.** Dos commits (la spec, el plan y las tareas por un lado; el código, los tests, las dependencias y `AGENTS.md` por otro, este último tras `/verify`). Lleva la evidencia (12 builds idénticos, tiempos, Node 22 y 24, errores corregidos, ninguna supresión), el cambio de `icon.tsx`, el build más lento y la reversión (`git revert -m 1`).
  *Hecho cuando:* aprobaste y el PR está abierto.
- [x] T17: **Condición de fusión: confirmar cómo construye el servicio generador.** Te pido que confirmes (a) que instala las dependencias de desarrollo al construir cada web y (b) qué comando de build ejecuta (`npm run build` ejecuta la revisión; `astro build` directo la salta). Sin tu confirmación, no se fusiona.
  *Hecho cuando:* tienes la respuesta anotada y el comando que usa el servicio pasa la revisión.
- [x] T18: **Fusionar el pull request** con merge commit y con tu aprobación expresa.
  *Hecho cuando:* el PR está fusionado.
- [x] T19: **`/verify` final** sobre `master`: tests, `test:typecheck`, build, revisión de cada RF y de los principios de la constitución.
  *Hecho cuando:* todo en verde y el informe entregado.
- [x] T20: **Actualizar `MEMORY.md`**: estado (spec 007 cerrada), decisiones con su porqué (TypeScript 6 por compatibilidad con `@astrojs/check`, `astro check` frente a `tsc`, build de ~6 s a ~24 s, `icon.tsx`), retirar «TypeScript no está instalado…» y los pendientes resueltos; commit y push con tu aprobación.
  *Hecho cuando:* `MEMORY.md` actualizado, con `check-setup` sin avisos y subido.
- [x] T21: **Borrar la rama `feat/revision-de-tipos`** (local y remota) si lo apruebas.
  *Hecho cuando:* la rama ya no existe.
