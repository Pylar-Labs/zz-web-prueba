# Plan 008 — Menú y cabecera con nombres largos
> El CÓMO. Debe cumplir `docs/constitution.md` y cubrir todos los RF de `spec.md`.

## Medición previa (Chrome, Windows, sin tocar el repositorio)
Sobre builds ya existentes del scratchpad, cambiando el texto del nombre en la página para probar tres nombres: corto («Aurora»), 80 caracteres con espacios y 80 sin espacios. Tipografía: `ui-sans-serif, system-ui` (nombre a 20 px, negrita; enlaces a 14 px, medio).

**Anchos naturales de los enlaces (una sola línea) y del botón «Contacto»:**
| Idioma | Suma de los 6 enlaces | Con 5 huecos de 24 px | Botón «Contacto» |
|---|---|---|---|
| Español | 345,9 px | **465,9 px** (el más ancho) | 90 px |
| Portugués | 344,1 px | 464,1 px | 83 px |
| Inglés | 330,9 px | 450,9 px | 81 px |

**Cálculo del ancho mínimo del menú horizontal (RF-9):** nombre 260 + margen 16 + enlaces 466 + margen 16 + botón 90 = **848 px de contenido**, más 32 px de relleno lateral = **unos 880 px de ventana**. Los puntos de corte estándar son 768 (`md`) y 1024 (`lg`): **768 no alcanza y 1024 sí, con 144 px de holgura**, lo que absorbe una tipografía algo más ancha en otros sistemas. El ancho de cambio es **`lg` = 1024 px**.

**Qué falla hoy (confirmado):**
| Ancho | Nombre de 80 con espacios | Nombre de 80 sin espacios |
|---|---|---|
| 375 px | cabecera de 67 a **117 px** (nombre en 3 líneas) | nombre de 851 px: el botón del menú queda en x=867, **fuera de la pantalla** |
| 768 px | cabecera de 69 a **229 px** (nombre en 7 líneas) | el botón «Contacto» queda en x=1423, **fuera de la pantalla** |
| 1024 px | cabecera de 69 a 89 px | botón «Contacto» en x=1423, **fuera de la pantalla** |
| 1280 px | cabecera de 69 a 89 px | botón «Contacto» en x=1479, **fuera de la pantalla** |
En inglés «About us» se parte en dos líneas incluso a 1280 px con el nombre largo.

**Pie (hoy):** con 80 caracteres **sin espacios desborda** a 375 px (el título mide 572 px; la página se ensancha a 474), a 768 px (docOverflow de 384 px) y a 1024 px (128 px). A 1280 px cabe. Con espacios no desborda en ningún ancho. **Hay que arreglarlo** (RF-15).

**Desplegable abierto:** 233 px de alto. Con una cabecera de 67 px suma ~300 px, y cabe en una ventana de 375 px de alto (móvil en horizontal) con 75 px de margen (RF-19).

## Aviso: una premisa de la spec no es del todo cierta
La spec dice que los enlaces «no caben juntos ni siquiera con nombres cortos». **Con un nombre corto el menú horizontal sí cabe a 768 px** (≈621 px de los 736 disponibles, en los tres idiomas) y hoy no se parte. El problema real a 768 px aparece con nombres medianos y largos. Como el punto de cambio es **único para todas las webs** (RF-10, aprobado), una web con nombre corto pasará a ver el desplegable entre 768 y 1023 px aunque hoy el menú le cupiera. La spec lo acepta («cambio intencional»), pero lo dejo a la vista porque el motivo no es el que daba la spec. Ver «Decisiones».

## Enfoque técnico
Solo CSS (clases de Tailwind) y un atributo, sin JavaScript nuevo ni dependencias, en la página principal. La solución:
1. **Nombre:** el enlace del nombre pasa a `truncate` (una línea, «…»), con `min-w-0` para que pueda encogerse, y lleva `title` con el nombre completo (sin texto fijo). Nav, botón «Contacto» y botón del menú pasan a `shrink-0`; los enlaces del menú, a `whitespace-nowrap`. La fila gana un hueco mínimo de 16 px (`gap-4`).
2. **Punto de cambio `lg` (1024 px):** el menú horizontal pasa de `md:flex` a `lg:flex`; el botón del menú y el panel desplegable pasan de `md:hidden` a `lg:hidden`. El botón «Contacto» sigue visible desde `md` (RF-13).
3. **Posición del botón «Contacto» en anchos medios:** `md:ml-auto lg:ml-0`. Entre 768 y 1023 px empuja el botón junto al botón del menú (a la derecha); desde 1024 px vuelve al reparto actual (`justify-between`), de modo que **a partir de 1024 px una web con nombre corto queda en las mismas posiciones que hoy**: el hueco de 16 px no mueve nada cuando sobra espacio, porque se descuenta del reparto.
4. **Pie:** los dos textos del pie ganan `min-w-0 break-words` para que un nombre sin espacios se parta en líneas en vez de desbordar.
5. **No hay cambio de textos, datos ni contrato.**

El mínimo de 24 caracteres (RF-3) no se impone con un `min-width` (movería el menú de las webs con nombre corto); lo garantiza el punto de cambio y se **comprueba midiendo**: espacio del nombre a 375 px = 375 − 32 − 40 (botón del menú) − 16 = 287 px; entre 768 y 1023 px ≥ 570 px; a 1024 px ≥ 400 px.

## Decisiones que necesito de ti
1. **Punto de cambio único en 1024 px (RF-10).** Con la medición, las webs con nombre corto pierden el menú horizontal entre 768 y 1023 px aunque hoy les cupiera. Opciones: **(a) mantenerlo como aprobó la spec (recomendada)**: una sola regla, sin depender del largo del nombre, y el desplegable en tablet es normal; (b) cambiar a `md` solo cuando el nombre sea corto, lo que obliga a decidir en el build según el largo del nombre y hace el diseño dependiente de los datos y de la tipografía (rompe RF-10). Si apruebas el plan sin más, sigo con (a).

## Archivos a crear / modificar
| Archivo | Cambio |
|---|---|
| `src/pages/index.astro` | cabecera (nombre con `truncate`, `min-w-0`, `title`; `gap-4`; `shrink-0` y `whitespace-nowrap`; cambio de `md` a `lg`), panel desplegable (`lg:hidden`) y pie (`min-w-0 break-words`) |
| `AGENTS.md` | regla de la cabecera y método de verificación manual (RF-20); sin pasar de 60 líneas |
| `MEMORY.md` | estado, decisiones y aprendizajes; retirar el pendiente |
| `specs/008-menu-nombre-largo/` | `spec.md`, `plan.md`, `tasks.md` |
| Scratchpad (fuera del repo) | script de medición reutilizable y datos de prueba de los nombres |

No cambian: `package.json`, esquema, datos, `ui-text.ts`, estilos globales, scripts ni tests.

## Modelo de datos / interfaces
Sin cambios. El nombre sale de `name` del contrato (hasta 80 caracteres, una línea) y se usa como texto del enlace, como título del enlace y en el pie, igual que hoy. Sin versión nueva del contrato.

## Mapa RF → implementación → test
Verificación: **medición manual en Chrome** (decisión aprobada: sin test automatizado con navegador), con un guion de medición repetible en el scratchpad que se ejecuta **antes (rojo, ya medido arriba) y después (verde)** sobre los 9 casos (3 idiomas × 3 nombres) a 375, 768, 1024 y 1280 px. Más `compare-builds` para el HTML.
| RF | Dónde se implementa | Cómo se verifica |
|---|---|---|
| RF-1, RF-2, RF-5 | `truncate` + `min-w-0` en el nombre | medición: el nombre ocupa 1 línea; con 80 caracteres termina en «…»; con nombre corto, sin cambios |
| RF-3 | punto de cambio `lg` + `gap-4` | medición: ancho del nombre ≥ 260 px con 80 caracteres a 375, 768, 1024 y 1280 px |
| RF-4 | `title={name}` | HTML de los 12 builds (aparece una vez, con el nombre exacto); comprobación en Chrome de que el atributo está |
| RF-6 | altura constante | medición: altura de cabecera con nombre largo = la del nombre corto al mismo ancho (±1 px) |
| RF-7 | enlace sin cambios | clic en el nombre lleva a `#inicio` |
| RF-8 | `whitespace-nowrap` en enlaces | medición: ningún enlace con altura de dos líneas en los 3 idiomas |
| RF-9, RF-10 | clases `lg:` | medición a 1023 y 1024 px: desplegable por debajo, horizontal desde 1024; igual con menú de 4 enlaces (web sin productos) |
| RF-11 | `shrink-0` en el botón del menú | medición: el botón queda dentro de la pantalla y accionable a 375, 768 y 1023 px |
| RF-12 | JS sin cambios | abrir, cerrar y elegir un enlace en 375 px |
| RF-13 | botón `hidden md:block` sin cambiar | medición a 768 px: visible junto al botón del menú; a 375 px: oculto como hoy |
| RF-14 | `shrink-0` + `gap-4` | medición a 1024 y 1280 px: sin superposiciones (rectángulos que no se cruzan) |
| RF-15 | `min-w-0 break-words` en el pie | medición del pie a 375, 768, 1024 y 1280 px con 80 caracteres sin espacios: sin desborde |
| RF-16 | resultado conjunto | los 9 casos × 4 anchos: sin desborde, sin enlaces partidos, altura constante |
| RF-17 | solo CSS | web con nombre corto a 375 px y a 1280 px (y 1024 px): mismos rectángulos que antes de los cambios |
| RF-18 | solo clases y `title` | `compare-builds` de los 12 builds frente a la línea base: se revisan a mano; además, revertir en una copia las clases y el `title` nuevos y comprobar que el HTML queda idéntico a la base |
| RF-19 | cabecera de 67 px + desplegable de 233 px | Chrome a 812×375 px con el desplegable abierto: seis enlaces visibles |
| RF-20 | `AGENTS.md`, `MEMORY.md` | `check-setup` sin avisos |

## Riesgos y casos límite
- **Las medidas dependen de la tipografía del sistema.** Se midió con la de Windows. Mitigación: 144 px de holgura a 1024 px y 16 px de margen mínimo; en otros sistemas el margen sigue siendo amplio.
- **Cambio de aspecto en tablet para todas las webs** (ver aviso y decisión 1).
- **`title` cambia el HTML de las 12 variantes** (acordado). Mitigación: revisar las diferencias a mano con el comparador.
- **Los enlaces dejan de poder partirse**: un idioma nuevo con textos más largos podría desbordar; queda en la verificación manual documentada (RF-20).
- **`md:ml-auto lg:ml-0`:** el botón «Contacto» podría quedar mal alineado a 1024 px exactos si `lg:ml-0` no anula `md:ml-auto`; se comprueba a 1023 y 1024 px.
- **Pie:** `break-words` no sirve en una fila (`md:flex-row`) si el texto no puede encogerse; por eso va con `min-w-0`. Se verifica a 768 y 1024 px, donde hoy desborda.
- **Sin test automático:** un cambio futuro podría romper la cabecera sin que nada lo detecte; es la decisión aprobada y queda cubierta por el método manual de `AGENTS.md`.
- **Reversión:** `git revert -m 1 <merge>`; cambia un archivo de la web y la documentación.

## Comprobación con la constitución
- [x] **1. Simplicidad:** solo CSS y un atributo; sin dependencias ni JavaScript nuevo.
- [x] **2. La spec manda:** todo cambio responde a un RF; la única decisión abierta (punto de cambio único) está separada arriba.
- [x] **3. Datos separados de interfaz:** el `title` y el texto salen de `name`; no se añade ningún texto fijo.
- [x] **4. El build como puerta:** el build y la revisión de tipos siguen pasando; no hay un test de diseño automático (decisión aprobada).
- [x] **5. Contrato sagrado:** el contrato y los datos no cambian; la web sigue generándose solo con datos. Cambia el aspecto en anchos medios de todas las webs (aprobado y declarado).
- [x] **6. Idioma:** código en inglés, documentación en español, interfaz sin cambios.

## Actualizaciones previstas
- **AGENTS.md:** regla de la cabecera (una línea con «…», mínimo de ~24 caracteres, desplegable hasta 1023 px, el punto de cambio se calcula con los textos más largos y el botón) y método de verificación manual (anchos, idiomas, nombres) obligatorio al tocar la cabecera o añadir un idioma. Se muestra el texto antes de aplicarlo y se mantiene en 60 líneas o menos fusionando líneas.
- **MEMORY.md:** estado (spec 008), decisiones con su porqué y las cifras medidas; retirar el pendiente del menú.
