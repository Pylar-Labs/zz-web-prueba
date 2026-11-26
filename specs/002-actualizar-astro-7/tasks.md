# Tareas 002 — Actualizar Astro a la versión 7 (alertas de seguridad)
> Tareas pequeñas, ordenadas, verificables. Cada una referencia sus RF y termina con tests en verde.
> `[P]` = puede hacerse en paralelo.

## Reglas de ejecución
- **Test primero** en lo único que es código nuevo: el comparador de builds (T4 a T6). El resto son verificaciones.
- **Bloqueo (RF-18, RF-19):** si cualquier tarea revela algo que no se arregla con un ajuste mínimo y obligaría a tocar lo que está fuera de alcance (contrato, tests, quitar React, reescribir componentes), **me detengo**, te lo cuento, el pull request se cierra sin fusionar y `master` queda en Astro 6.
- **Sin cambios en `src/`** salvo el ajuste mínimo de RF-17, y solo si un build lo exige (T11). En la prueba previa no hizo falta ninguno.
- **Nada hacia GitHub sin tu aprobación:** ni push de la rama, ni pull request, ni fusión (RF-20).
- **Tests existentes:** ninguno se modifica (RF-11). El test nuevo del comparador va en un archivo aparte.
- **Archivos temporales** (líneas base, capturas, clon limpio) en la carpeta temporal de la sesión, nunca en el repositorio.
- **Comandos:** esta sesión ejecuta Bash; para ti, en PowerShell, las variables de entorno van como `$env:SITE_DATA = "..."`.
- **Ruta crítica:** T1 → T2 → T7 → T8 → T9 → T10 → T12 y T13 → T14 y T15 → T17 → T18 → T19 → T20 → T21 → T22 → T23 → T24 → T25.

## Fase 0 — Rama y línea base (Astro 6)
- [x] T1 (RF-20): **Crear la rama `chore/astro-7` desde `master`.** Comprobar que `master` está actualizada con `origin` y que el árbol está limpio.
  *Hecho cuando:* estás en `chore/astro-7` sin cambios pendientes.
- [x] T2 (RF-4, RF-5, RF-26): **Registrar la línea base con Astro 6** en la carpeta temporal: build de las tres variantes (demo, mínima, máxima) guardando cada `dist`, tamaños y tiempos; `npm audit`; lista de alertas abiertas por identificador, comprobando que son las 12 del Anexo.
  *Hecho cuando:* existen las tres carpetas de línea base, la tabla de tamaños y tiempos y la lista de alertas.
- [x] T3 (RF-6, RF-7) `[P]`: **Capturas "antes".** Servir cada línea base (vista previa) y capturar con Chrome DevTools a 375 px y a 1280 px las tres variantes (6 capturas).
  *Hecho cuando:* las 6 capturas "antes" están guardadas en la carpeta temporal.

## Fase 1 — Comparador de builds (test primero)
- [x] T4 (RF-7): **Test rojo — `scripts/compare-builds.test.mjs` (archivo nuevo, a confirmar al aprobar estas tareas).** Con carpetas de build sintéticas creadas en la carpeta temporal: (a) ignora la etiqueta del generador, los nombres con huella, el contenido de los `<script>` y la repetición de espacios; (b) detecta un cambio de texto, de atributo y de etiqueta; (c) detecta un espacio perdido entre texto y elemento en línea; (d) clasifica las diferencias (espacio entre etiquetas, espacio junto a elemento en línea, contenido); (e) salida legible, y código de salida 0 sin diferencias, 1 con diferencias y 2 si no puede leer; (f) no modifica las carpetas.
  *Hecho cuando:* los tests existen y fallan porque el comparador aún no existe.
- [x] T5 (RF-7): **Implementar `scripts/compare-builds.mjs`** (sin dependencias) hasta poner T4 en verde.
  *Hecho cuando:* los tests de T4 están en verde.
- [x] T6 (RF-7): **Validar el comparador con datos reales.** Ejecutarlo sobre la prueba previa (carpetas "base" y "after" de la copia desechable) y comprobar que reporta lo ya conocido: estructura, atributos y texto idénticos en las tres variantes, espacios quitados (288, 213 y 362) y 3 puntos con elementos en línea contiguos.
  *Hecho cuando:* los números coinciden con los de la prueba previa.

## Fase 2 — Actualización
- [x] T7 (RF-13, RF-14): **Actualizar dependencias** con `npm install astro@7.4.12 @astrojs/react@7.1.9` y subir `engines.node` a `>=22.23.4`. Revisar el cambio de `package.json`.
  *Hecho cuando:* `git diff package.json` muestra solo `astro`, `@astrojs/react` y `engines`; `npm ls oxc-transform-react` está vacío y Tailwind no cambió.
- [x] T8 (RF-1, RF-4, RF-5): **Auditoría.** `npm audit` no marca `astro`, `sharp` ni `esbuild`. Comparar con la lista de T2: cualquier alerta nueva que introduzca la actualización se informa antes de seguir.
  *Hecho cuando:* auditoría limpia para esos tres componentes, o alertas nuevas informadas.
- [x] T9 (RF-10, RF-11, RF-12): **Tests del contrato.** `npm run test:schema`: 416 de 416 sin haber modificado ninguno, y `git status docs` limpio.
  *Hecho cuando:* 416 de 416 en verde. Si un test hay que cambiarlo, es un bloqueo.
- [x] T10 (RF-9, RF-16): **Builds y barrera.** `npm run build` con las tres variantes más `check-dist` en cada una; build con datos inválidos (falla con la lista completa) y con válidos (termina bien).
  *Hecho cuando:* los tres builds y `check-dist` pasan, y la barrera de datos funciona como en la spec 001.
- [x] T11 (RF-17) *(condicional; no hizo falta ningún ajuste: `src/` sin cambios)*: **Ajuste mínimo en plantillas**, solo si T10 o un build lo exige (por ejemplo, un HTML que el compilador nuevo rechaza). Documentar cada línea cambiada.
  *Hecho cuando:* no hizo falta ningún ajuste (lo esperado), o cada ajuste está documentado y un cambio de estructura se declaró bloqueo.

## Fase 3 — Verificación contra la línea base
- [x] T12 (RF-6, RF-7, RF-8) `[P]`: **Lista de diferencias de HTML.** Ejecutar `compare-builds` entre las líneas base de T2 y los builds nuevos de T10 en las tres variantes. Revisar cada diferencia una a una y explicarla.
  *Hecho cuando:* toda diferencia está clasificada como irrelevante (con motivo) o corregida.
- [x] T13 (RF-6, RF-8, RF-9) `[P]`: **Capturas "después"** a 375 px y a 1280 px de las tres variantes; compararlas con las de T3 y documentar cualquier diferencia perceptible (menú, botones del hero, enlaces de redes del pie).
  *Hecho cuando:* las 6 capturas "después" están comparadas con las "antes" y no hay diferencias perceptibles, o están corregidas.
- [x] T14 (RF-24) `[P]`: **Servidor de desarrollo y vista previa.** `npm run dev` y `npm run preview` sirven la web sin errores de consola; el menú móvil abre y cierra (el script del menú se minifica distinto).
  *Hecho cuando:* sin errores de consola y el menú funciona en ambos.
- [x] T15 (RF-25) `[P]`: **Escape de HTML y textos largos en la web real.** Construir con datos que incluyan `<b>` y `<script>` y con un texto largo con saltos de línea; comprobar en `dist` y en pantalla; compararlo con el comportamiento anterior.
  *Hecho cuando:* el HTML se muestra literal, no se ejecuta, y los saltos de línea se ven igual que antes.
- [x] T16 (RF-26): **Registrar tamaño y tiempo "después"** y completar la tabla antes/después de T2.
  *Hecho cuando:* la tabla está completa para las tres variantes.

## Fase 4 — Instalación limpia
- [x] T17 (RF-23, RF-28): **Clon limpio** de la rama en la carpeta temporal, con `core.autocrlf=false` (hasta que se corrija el test de fines de línea de la spec 001). `npm ci`, `npm run test:schema`, tres builds y `check-dist`. Confirmar que el bloqueo de scripts de instalación de `sharp` y `esbuild` no impide construir ni probar.
  *Hecho cuando:* todo pasa sobre la instalación limpia.

## Fase 5 — Documentación, pull request y fusión
- [x] T18 (RF-15, RF-27, RF-29): **Actualizar `AGENTS.md`** (línea de stack: Astro 7 y Node ≥ 22.23.4, y una nota con la limitación de Linux). Mostrar el cambio antes de aplicarlo.
  *Hecho cuando:* aprobaste el texto y `AGENTS.md` está actualizado.
- [x] T19 (RF-21): **Actualizar la rama con `master`.** Si el archivo de bloqueo choca, regenerarlo y repetir la verificación abreviada (tests y builds).
  *Hecho cuando:* la rama incluye `master` y la verificación abreviada pasa.
- [x] T20 (RF-15, RF-19, RF-22, RF-27): **Pedir tu aprobación para subir la rama y abrir el pull request.** El pull request lleva: evidencia (tablas, lista de diferencias, capturas), la limitación de Linux, el procedimiento de reversión (`git revert -m 1`) y una casilla de **confirmación del Node del servicio generador**.
  *Hecho cuando:* aprobaste y el pull request está abierto con esa lista de comprobación.
- [x] T21 (RF-15): **Confirmación del Node del servicio generador.** El responsable confirma por escrito que el entorno que construye usa Node ≥ 22.23.4. Sin esa confirmación el pull request queda listo y no se fusiona.
  *Hecho cuando:* tienes la confirmación escrita del responsable.
- [x] T22 (RF-20): **Fusionar** con tu aprobación expresa por escrito (un solo merge commit, igual que en la actualización anterior, para que se pueda revertir en un paso).
  *Hecho cuando:* el pull request está fusionado y `master` local actualizada.
- [x] T23 (RF-2, RF-3, RF-4): **Confirmar las alertas, una hora después de fusionar.** Consultar GitHub y comprobar que los 12 avisos del Anexo están cerrados. Si alguno sigue abierto con el parche instalado, investigarlo e informar; descartarlo en GitHub lo decides tú. Registrar aparte cualquier alerta nueva.
  *Hecho cuando:* los 12 avisos figuran cerrados, o la investigación y tu decisión están documentadas.

## Fase 6 — Verificación final y memoria
- [x] T24: **Verificación final.** Recorrer uno a uno los criterios de finalización de la spec marcando cada uno; ejecutar `/verify`; anotar cualquier desviación.
  *Hecho cuando:* todos los criterios están marcados o la desviación está explicada.
- [x] T25 (RF-29): **Actualizar `MEMORY.md`** (máximo ~50 líneas): estado, decisiones con su porqué, errores a evitar y pendientes (la corrección del test de fines de línea, la spec 003 de textos fijos, `typescript`). Proponer mover a `AGENTS.md` cualquier regla permanente. El commit y su subida, solo con tu aprobación.
  *Hecho cuando:* `MEMORY.md` está al día y, con tu aprobación, subido.

## Cobertura de requisitos
| RF | Tareas |
|---|---|
| RF-1 | T8 |
| RF-2, RF-3 | T23 |
| RF-4, RF-5 | T2, T8, T23 |
| RF-6, RF-7, RF-8 | T3, T4, T5, T6, T12, T13 |
| RF-9 | T10, T13 |
| RF-10, RF-11, RF-12 | T9 |
| RF-13, RF-14 | T7 |
| RF-15 | T18, T20, T21 |
| RF-16 | T10 |
| RF-17 | T11 |
| RF-18, RF-19 | Reglas de ejecución, T20 |
| RF-20, RF-21 | T1, T19, T20, T22 |
| RF-22 | T20 |
| RF-23 | T17 |
| RF-24 | T14 |
| RF-25 | T15 |
| RF-26 | T2, T16 |
| RF-27 | T18, T20 |
| RF-28 | T17 |
| RF-29 | T18, T25 |
