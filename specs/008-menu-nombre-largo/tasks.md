# Tareas 008 — Menú y cabecera con nombres largos
> Tareas pequeñas, ordenadas, verificables. Cada una referencia sus RF y termina con tests en verde.
> `[P]` = puede hacerse en paralelo.

## Reglas de ejecución
- **Test primero.** El «test» de esta spec es un guion de medición en Chrome (decisión aprobada: sin test automatizado con navegador). Se escribe y se ejecuta **antes** de tocar la web, y debe dar rojo con los defectos ya medidos; luego se implementa y se repite hasta el verde.
- **Plan aprobado, con su decisión:** punto de cambio único en 1024 px para todas las webs (las webs con nombre corto pasan al desplegable entre 768 y 1023 px). Cualquier otro cambio se te pregunta antes.
- **Bloqueos (me detengo y te lo cuento):** (a) falla un test existente; (b) una web con nombre corto se ve distinta de la línea base a 375 px o desde 1024 px (RF-17); (c) el pie necesita más que clases de ancho y partido de texto; (d) el HTML de los 12 builds difiere en algo que no sea el `title` del nombre y las clases acordadas; (e) hace falta JavaScript nuevo, una dependencia o un archivo fuera del plan.
- **Archivos del repositorio que se tocan:** `src/pages/index.astro`, `AGENTS.md`, `MEMORY.md` y la carpeta de la spec. No se crea ningún archivo nuevo en el repositorio; el guion de medición y los datos de prueba viven en la carpeta temporal de la sesión.
- **Tests existentes:** los 700, los 17 del comparador y los 14 de tipos no se modifican y siguen en verde.
- **Nada hacia GitHub ni commits sin tu aprobación expresa.**
- **Archivos temporales** (líneas base, builds, guion de medición) en la carpeta temporal de la sesión, nunca en el repositorio.
- **Comandos:** esta sesión ejecuta Bash; para ti, en PowerShell, las variables de entorno van como `$env:SITE_DATA = "..."`.
- **Servidores ajenos:** si hay `astro dev`, `astro preview` o servidores de sesiones anteriores, se dejan como están. Los servidores estáticos de medición los levanto yo en puertos propios.
- **Casos de medición:** 3 idiomas (es, en, pt) × 3 nombres (corto «Aurora», 80 caracteres con espacios y 80 sin espacios) × anchos 375, 768, 1024 y 1280 px; además 1023 px, 812×375 px y la web sin productos ni testimonios (menú de cuatro enlaces).
- **Ruta crítica:** T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9 → T10 → T11 → T12 → T13 → T14 → T15 → T16 → T17 → T18.

## Fase 0 — Rama, línea base y guion de medición
- [x] T1: **Crear la rama `feat/menu-nombre-largo` desde `master`.** Comprobar que `master` está al día con `origin`.
  *Hecho cuando:* estás en `feat/menu-nombre-largo` y `git status` solo muestra la carpeta de la spec sin seguimiento.
- [x] T2 (RF-17, RF-18): **Línea base con la `master` actual**, en la carpeta temporal: los 12 builds (demo, mínima y máxima en español, inglés y portugués, y los cinco fixtures de precio) guardando cada `dist`, con `check-dist`; `npm run test:schema` (700), el comparador (17) y `npm run test:typecheck` (14).
  *Hecho cuando:* existen los 12 `dist` de la línea base y los recuentos de tests.
- [x] T3 `[P]`: **Guion de medición.** En la carpeta temporal: un script para Chrome que, sobre la página cargada, aplica uno de los tres nombres (cabecera y pie) y devuelve las medidas: altura de la cabecera; ancho, alto y recorte del nombre (¿termina en «…»?); atributo `title`; enlaces del menú partidos en dos líneas; posición y visibilidad del botón «Contacto» y del botón del menú dentro de la pantalla; superposiciones entre nombre, enlaces y botones; desborde horizontal de la página; y para el pie, desborde y superposición. Más los servidores estáticos de los builds de medición (máxima en es, en y pt, y la mínima para el caso de cuatro enlaces).
  *Hecho cuando:* el guion devuelve medidas coherentes sobre la línea base (por ejemplo, la cabecera de 67 px a 375 px con nombre corto).

## Fase 1 — Prueba roja
- [x] T4 (RF-1 a RF-16): **Medir la línea base: debe dar rojo.** Ejecutar el guion sobre los 9 casos a 375, 768, 1024 y 1280 px con el código actual y guardar los resultados. Guardar también, como referencia de RF-17, los rectángulos de la cabecera y del pie con el nombre corto a 375, 768, 1024 y 1280 px.
  *Hecho cuando:* los defectos medidos en el plan se reproducen (cabecera de 117 y 229 px, botones fuera de la pantalla con el nombre sin espacios, pie desbordado a 375, 768 y 1024 px, «About us» partido en inglés) y quedan guardadas las referencias del nombre corto.

## Fase 2 — Implementación
- [x] T5 (RF-1, RF-2, RF-4 a RF-7): **El nombre de la cabecera.** En `src/pages/index.astro`: el enlace del nombre pasa a una sola línea con «…» (`truncate`, `min-w-0`) y lleva `title` con el nombre completo; la fila gana un hueco mínimo de 16 px (`gap-4`) y los elementos que no deben encogerse llevan `shrink-0`. Revisión de tipos con `npm run typecheck`.
  *Hecho cuando:* `npm run typecheck` pasa y el diff de `index.astro` solo contiene esas clases y el atributo `title`.
- [x] T6 (RF-8 a RF-14): **El punto de cambio.** En `src/pages/index.astro`: los enlaces del menú con `whitespace-nowrap`; el menú horizontal sale a `lg` (1024 px) y el botón del menú y el panel desplegable pasan a `lg:hidden`; el botón «Contacto» sigue visible desde `md` con `md:ml-auto lg:ml-0`.
  *Hecho cuando:* `npm run typecheck` pasa y el diff contiene solo cambios de clases del plan.
- [x] T7 (RF-15): **El pie.** En `src/pages/index.astro`: los dos textos del pie con `min-w-0 break-words`.
  *Hecho cuando:* `npm run typecheck` pasa y el diff del pie contiene solo esas clases.
- [x] T8 (RF-1 a RF-17, RF-19): **Medir de nuevo: debe dar verde.** Construir las 4 variantes de medición con el código nuevo y ejecutar el guion sobre los 9 casos a 375, 768, 1024 y 1280 px, más 1023 px, el desplegable abierto a 812×375 px y la web de cuatro enlaces. Comparar el nombre corto con las referencias de T4: a 375 px y desde 1024 px los rectángulos deben ser los mismos.
  *Hecho cuando:* en todos los casos la cabecera es de una línea con la altura del nombre corto (±1 px), el nombre con 80 caracteres termina en «…» y mide al menos 260 px, ningún enlace se parte, nada sale de la pantalla ni se superpone, el pie no desborda, el punto de cambio está entre 1023 px (desplegable) y 1024 px (horizontal), y el nombre corto no cambia a 375 px ni desde 1024 px. Si no se cumple algo, es un ajuste dentro del plan o el bloqueo (b) o (c).
- [x] T9 (RF-4, RF-7, RF-11, RF-12): **Comprobación de uso en Chrome.** A 375 px: abrir y cerrar el desplegable, elegir un enlace y ver que se cierra, clic en el nombre (va a `#inicio`) y botón del menú accionable con el nombre de 80 caracteres sin espacios; el `title` del nombre es el nombre completo; la consola sin errores.
  *Hecho cuando:* todo funciona y la consola está limpia.

## Fase 3 — Verificación
- [x] T10 (RF-17, RF-18): **Los 12 builds después y revisión del HTML.** Construir las 12 variantes con la revisión de tipos activa y `check-dist`; ejecutar `compare-builds` contra la línea base de T2 y revisar a mano cada tipo de diferencia; en una copia, revertir las clases y el `title` nuevos y comprobar que el HTML queda idéntico a la línea base. El CSS cambia (clases nuevas): se anota.
  *Hecho cuando:* las únicas diferencias de las 12 variantes son el `title` del nombre y las clases acordadas, ningún texto cambia y `check-dist` pasa en los 12. Cualquier otra diferencia es el bloqueo (d).
- [x] T11: **Tests y comprobaciones generales.** `npm run test:schema` (700), el comparador (17), `npm run test:typecheck` (14), `npm run build` y `npm audit`.
  *Hecho cuando:* todo en verde y `npm audit` en 0.

## Fase 4 — Documentación, pull request y fusión
- [x] T12 (RF-20): **Actualizar `AGENTS.md`** con la regla de la cabecera y el método de verificación manual (anchos, idiomas y nombres, los casos de la lista de reglas), sin pasar de lo que `check-setup` admite. Mostrar el texto antes de aplicarlo.
  *Hecho cuando:* aprobaste el texto y `AGENTS.md` está actualizado con `check-setup` sin avisos.
- [x] T13: **Actualizar la rama con `master`** y repetir la verificación abreviada (tests y builds) si hubo cambios.
  *Hecho cuando:* la rama incluye `master` y la verificación pasa.
- [x] T14: **Pedir tu aprobación para commitear, subir la rama y abrir el pull request.** Dos commits (la spec, el plan y las tareas por un lado; el cambio de `index.astro` y `AGENTS.md` por otro, este último tras `/verify`). Lleva la evidencia (las medidas antes y después), el cambio de aspecto en anchos medios para todas las webs, el `title` y la reversión (`git revert -m 1`).
  *Hecho cuando:* aprobaste y el PR está abierto.
- [x] T15: **Fusionar el pull request** con merge commit y con tu aprobación expresa.
  *Hecho cuando:* el PR está fusionado.
- [x] T16: **`/verify` final** sobre `master`: tests, `test:typecheck`, build, revisión de cada RF y de los principios de la constitución, y la comprobación en Chrome a 375 px.
  *Hecho cuando:* todo en verde y el informe entregado.
- [x] T17: **Actualizar `MEMORY.md`**: estado (spec 008 cerrada), decisiones con su porqué y las cifras medidas, retirar el pendiente del menú; commit y push con tu aprobación.
  *Hecho cuando:* `MEMORY.md` actualizado, con `check-setup` sin avisos y subido.
- [x] T18: **Borrar la rama `feat/menu-nombre-largo`** (local y remota) si lo apruebas.
  *Hecho cuando:* la rama ya no existe.
