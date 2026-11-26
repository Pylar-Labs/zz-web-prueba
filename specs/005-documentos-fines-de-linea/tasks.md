# Tareas 005 — Documentos generados sin depender de los fines de línea
> Tareas pequeñas, ordenadas, verificables. Cada una referencia sus RF y termina con tests en verde.
> `[P]` = puede hacerse en paralelo.

## Reglas de ejecución
- **Test primero** en lo que es código nuevo: la función de comparación (T4 a T5). La política de git se verifica con un repositorio desechable (T3, T8 y T9).
- **Bloqueos (me detengo y te lo cuento):** (a) falla un test existente distinto de los dos de igualdad de documentos; (b) la prueba previa (T3) muestra que `text eol=lf` no se comporta como se espera; (c) hace falta algo fuera del plan (dependencia, archivo o cambio de contenido de los documentos).
- **Tests existentes:** solo se tocan los dos de igualdad de documentos de `site-schema.test.mjs` (líneas 890 a 897), que pasan a usar la función nueva. Es la excepción aprobada en la spec.
- **Archivos nuevos aprobados con estas tareas:** `.gitattributes`, `scripts/text-compare.mjs` y `scripts/text-compare.test.mjs`.
- **El repositorio del proyecto no se usa como banco de pruebas de git:** todo lo que cree commits o clones va a un repositorio desechable en la carpeta temporal.
- **Nada hacia GitHub ni commits sin tu aprobación expresa.**
- **Archivos temporales** (repositorio desechable, copias con CRLF, datos de prueba) en la carpeta temporal de la sesión, nunca en el repositorio.
- **Comandos:** esta sesión ejecuta Bash; para ti, en PowerShell, las variables de entorno van como `$env:SITE_DATA = "..."`.
- **Servidores ajenos:** si hay `astro dev` o `astro preview` de sesiones anteriores, se dejan como están.
- **Ruta crítica:** T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 a T11 → T12 → T13 → T14 → T15 → T16 → T17.

## Fase 0 — Rama, línea base y prueba previa
- [x] T1: **Crear la rama `fix/docs-line-endings` desde `master`.** Comprobar que `master` está al día con `origin`. Los dos documentos de `docs/` que hoy aparecen modificados solo por CRLF se dejan para T7, no se commitean.
  *Hecho cuando:* estás en `fix/docs-line-endings` y `git status` solo muestra la carpeta de la spec sin seguimiento y, si aplica, el ruido de fines de línea de `docs/`.
- [x] T2: **Línea base.** `npm run test:schema` (557 en verde, con los documentos regenerados si hace falta) y guardar en la carpeta temporal una copia de los dos documentos en LF, para comprobar en T11 que su contenido no cambia.
  *Hecho cuando:* los 557 pasan y existen las dos copias de referencia.
- [x] T3 (RF-1, RF-8, RF-9) `[P]`: **Prueba previa en un repositorio desechable.** En la carpeta temporal: `git init`, un commit con dos archivos como los documentos en LF y otro con `.gitattributes` (`text eol=lf` para ellos). Comprobar: (a) un clon con `core.autocrlf=true`, `input` y `false` deja los dos archivos con LF (`git ls-files --eol`); (b) un directorio de trabajo con CRLF no figura como modificado; (c) regenerar con LF no lo ensucia; (d) la instrucción exacta y mínima para dejar en LF un directorio de trabajo con CRLF.
  *Hecho cuando:* están anotados los resultados de (a) a (d) y el texto exacto de la instrucción. Si algo no se comporta como se espera, es el bloqueo (b).

## Fase 1 — Función de comparación (test primero)
- [x] T4 (RF-2 a RF-6): **Tests rojos.** Crear `scripts/text-compare.test.mjs` y añadirlo a `test:schema` en `package.json`. Casos: LF y CRLF dan `null` si coinciden; mezcla de CRLF y LF también; un `\r` suelto, un BOM, espacios al final de una línea, falta o sobra el salto final, documento vacío, texto distinto en la primera, en una del medio y en la última línea, y documento más corto o más largo → devuelven mensaje; el mensaje nombra el archivo, el número de línea, la esperada y la encontrada y `npm run schema:export`, recorta líneas largas y no incluye el documento entero; el generador (`renderSchemaJson` y `renderSchemaMarkdown`) no devuelve `\r` y termina en un solo `\n`; `.gitattributes` existe y contiene exactamente las dos reglas, sin comodines ni otras rutas.
  *Hecho cuando:* los tests nuevos fallan por la razón esperada (módulo y archivo inexistentes) y los 557 existentes siguen en verde.
- [x] T5 (RF-4 a RF-6): **Implementar `scripts/text-compare.mjs`:** `normalizeLineEndings` (solo `\r\n` a `\n`) y `compareDocument`, hasta poner en verde los tests de la función y del generador.
  *Hecho cuando:* los tests de la función y del generador están en verde; el de `.gitattributes` sigue en rojo hasta T7.
- [x] T6 (RF-4, RF-7): **Usar la función en los dos tests de igualdad de documentos.** Primero comprobar el rojo: copiar `docs/` con CRLF y ver que los dos tests fallan con el código actual. Luego cambiarlos para que usen `compareDocument` y fallen con su mensaje cuando haya una diferencia real.
  *Hecho cuando:* con los documentos en CRLF los dos tests pasan sin regenerar, y con un cambio real fallan con archivo y línea.
- [x] T7 (RF-1, RF-2, RF-9): **Crear `.gitattributes`** con las dos reglas y dejar los dos documentos del equipo en LF con la instrucción fijada en T3.
  *Hecho cuando:* `.gitattributes` contiene solo esas dos reglas, `git ls-files --eol docs/` da `w/lf` para ellos, `git status` no los marca modificados y `npm run test:schema` está completamente en verde.

## Fase 2 — Verificación
- [x] T8 (RF-1, RF-8) `[P]`: **Clon desechable con `core.autocrlf=true`.** Crear en la carpeta temporal un repositorio con los archivos del proyecto (los versionados más los nuevos), hacer commit, clonarlo con `-c core.autocrlf=true`, ejecutar `npm ci` y `npm run test:schema`.
  *Hecho cuando:* en el clon los documentos tienen `w/lf` y los tests pasan sin pasos extra.
- [x] T9 (RF-7, RF-9) `[P]`: **Clon antiguo y regeneración.** En el clon desechable: dejar los documentos en CRLF a mano y comprobar que los tests pasan; aplicar la instrucción documentada y comprobar que quedan en LF y sin figurar como modificados; ejecutar `npm run schema:export` y comprobar que `git status` queda limpio.
  *Hecho cuando:* las tres comprobaciones salen como en la spec.
- [x] T10 (RF-5, RF-6) `[P]`: **Fallos reales de punta a punta.** Con copias desechables de los documentos: cambiar una palabra, quitar el salto final, añadir espacios al final de una línea, añadir un BOM, insertar un `\r` suelto, vaciar el archivo y truncarlo. Ejecutar los tests en cada caso.
  *Hecho cuando:* cada caso falla con el archivo y la primera línea distinta, sin volcar el documento, y los tests vuelven a pasar al restaurar.
- [x] T11 (RF-10): **El contenido no cambió.** Comparar los documentos con las copias de T2 ignorando fines de línea; confirmar que `SCHEMA_VERSION` sigue en 2.2; ejecutar `npm run build` con la demo y `check-dist`.
  *Hecho cuando:* no hay diferencias de contenido, la versión es 2.2 y el build pasa.

## Fase 3 — Documentación, pull request y fusión
- [x] T12 (RF-11): **Actualizar `AGENTS.md`** con una línea (política de LF de los dos documentos y la instrucción de T3 para clones existentes), sin pasar de 60 líneas. Mostrar el texto antes de aplicarlo.
  *Hecho cuando:* aprobaste el texto y `AGENTS.md` está actualizado con `check-setup` sin avisos.
- [x] T13: **Actualizar la rama con `master`** y repetir la verificación abreviada (tests y build) si hubo cambios.
  *Hecho cuando:* la rama incluye `master` y la verificación pasa.
- [x] T14: **Pedir tu aprobación para commitear, subir la rama y abrir el pull request.** Lleva la evidencia, la excepción de los dos tests modificados explicada, los resultados de la prueba previa y la reversión (`git revert -m 1`).
  *Hecho cuando:* aprobaste y el pull request está abierto.
- [x] T15: **Fusionar** con tu aprobación expresa (un solo merge commit).
  *Hecho cuando:* el pull request está fusionado y `master` local actualizada.

## Fase 4 — Verificación final y memoria
- [x] T16: **Verificación final.** Recorrer uno a uno los criterios de finalización de la spec y ejecutar `/verify`; anotar cualquier desviación.
  *Hecho cuando:* todos los criterios están marcados o la desviación está explicada.
- [x] T17 (RF-11): **Actualizar `MEMORY.md`** (máximo ~50 líneas): estado, decisión con su porqué, se retira el pendiente de los fines de línea y el aprendizaje que ya no aplica. El commit y su subida, solo con tu aprobación.
  *Hecho cuando:* `MEMORY.md` está al día y, con tu aprobación, subido.

## Cobertura de requisitos
| RF | Tareas |
|---|---|
| RF-1 | T3, T7, T8 |
| RF-2 | T4, T7 |
| RF-3 | T4, T5 |
| RF-4 | T4, T5, T6 |
| RF-5 | T4, T5, T10 |
| RF-6 | T4, T5, T6, T10 |
| RF-7 | T6, T9 |
| RF-8 | T3, T8 |
| RF-9 | T3, T7, T9 |
| RF-10 | T2, T11 |
| RF-11 | T12, T17 |
