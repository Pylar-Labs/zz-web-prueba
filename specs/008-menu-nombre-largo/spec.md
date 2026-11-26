# Spec 008 — Menú y cabecera con nombres largos
> Solo el QUÉ y el POR QUÉ. Nada de stack, arquitectura ni nombres de archivos (eso va en plan.md).

## Contexto y objetivo
El nombre del negocio puede tener hasta 80 caracteres (límite del contrato) y se muestra en la cabecera, a la izquierda del menú. Con un nombre largo la cabecera se desordena: el nombre y los enlaces compiten por el ancho, y los enlaces del menú se parten en dos líneas (por ejemplo «About us» en inglés o «Sobre nós» en portugués). El problema ya figuraba en la memoria como pendiente desde la spec 004, y lo causa también el menú en anchos medios (una tablet de 768 px): hay seis enlaces más el botón «Contacto» y el nombre, y no caben juntos ni siquiera con nombres cortos en los idiomas con textos más largos.

El objetivo es que **la cabecera y el menú se vean ordenados y legibles con cualquier nombre de negocio válido (hasta 80 caracteres) y con los textos de menú de los tres idiomas**, sin cambiar el contenido ni el contrato.

## Aprobaciones previas (decisiones del responsable)
- Un nombre largo **se corta con puntos suspensivos en una sola línea**; la cabecera mantiene siempre la misma altura. No se parte en varias líneas ni se reduce el tamaño de la letra.
- **El nombre nunca queda por debajo de unos 24 caracteres visibles** (unos 260 px). El menú horizontal solo aparece cuando, con ese mínimo del nombre, el botón «Contacto» y los seis enlaces con los textos más largos de los tres idiomas, todo cabe en una línea; si no cabe, se usa el menú desplegable.
- **El botón «Contacto» de la cabecera se mantiene visible desde 768 px**, como hoy; en los anchos medios que pasan al desplegable, los enlaces van dentro del desplegable y el botón sigue en la cabecera.
- El nombre completo se ofrece con **un título nativo del navegador siempre presente** en el enlace del nombre, sin texto fijo nuevo. En pantallas táctiles y con teclado, el nombre completo se ve en el pie.
- En el **pie**, el nombre largo se parte en las líneas que haga falta (también uno sin espacios), sin desbordar y sin cortarse. Solo se ajusta si hoy desborda; si ya se ve bien, no se toca.
- Con el desplegable abierto, si la ventana se ensancha y vuelve a estrecharse, **se deja como hoy**, sin JavaScript nuevo.
- La vigilancia a futuro es una **verificación manual documentada**: el método queda en `AGENTS.md` y es obligatorio al tocar la cabecera o añadir un idioma. No se añade un test automatizado con navegador.
- Se verifica a 375, 768, 1024 y 1280 px en Chrome. 320 px queda fuera.
- El menú desplegable pasa a usarse en anchos medios **en todas las webs**, también con nombres cortos: es un cambio de aspecto intencional.

## Usuarios / actores
- **Visitante de la web de un cliente:** en móvil, tablet o escritorio; debe poder leer el nombre y usar el menú sin desorden.
- **Cliente de Pylar Labs (dueño del negocio):** su nombre puede ser largo; la web no debe verse rota por eso.
- **Desarrollador y agente de desarrollo:** verifican la cabecera con nombres de 80 caracteres en los tres idiomas.

## Historias de usuario
- H1: Como visitante quiero que el menú se vea ordenado, con cada enlace en una sola línea, para encontrar rápido lo que busco.
- H2: Como cliente con un nombre de negocio largo quiero que mi web se vea bien igual que la de un nombre corto, sin que la cabecera crezca ni se rompa.
- H3: Como visitante quiero poder ver el nombre completo del negocio aunque la cabecera lo corte, para saber de quién es la web.
- H4: Como visitante en una tablet quiero que el menú no se aplaste ni se parta, aunque eso signifique usar el desplegable.

## Requisitos funcionales (criterios de aceptación en EARS)

### Nombre en la cabecera
- RF-1: EL SISTEMA mostrará el nombre del negocio en la cabecera en una sola línea.
- RF-2: SI el nombre no cabe en el espacio disponible, ENTONCES EL SISTEMA lo cortará con puntos suspensivos («…») al final, sin partirlo en varias líneas ni reducir el tamaño de la letra.
- RF-3: EL SISTEMA mantendrá, en cualquier ancho, al menos el espacio de unos 24 caracteres (unos 260 px) para el nombre antes de cortarlo más; antes de bajar de ahí, el menú pasa al desplegable.
- RF-4: EL SISTEMA incluirá siempre el nombre completo como título nativo del enlace del nombre, sin añadir ningún texto fijo; se verá al pasar el cursor. El texto del enlace ya contiene el nombre completo, así que los lectores de pantalla lo leen entero.
- RF-5: SI el nombre cabe sin cortarse, ENTONCES EL SISTEMA lo mostrará completo y sin ningún añadido visible.
- RF-6: EL SISTEMA mantendrá la misma altura de cabecera, con una tolerancia de 1 px frente a la de un nombre corto, con cualquier nombre válido, incluido uno de 80 caracteres sin espacios.
- RF-7: EL SISTEMA seguirá llevando al inicio de la página al hacer clic en el nombre.

### Menú
- RF-8: EL SISTEMA mostrará cada enlace del menú (horizontal y desplegable) en una sola línea, sin partirlo, en los tres idiomas.
- RF-9: EL SISTEMA mostrará el menú horizontal solo desde el ancho en que caben, con un margen libre de al menos 16 px, el nombre con su mínimo (RF-3), el botón «Contacto» y los seis enlaces con los textos más largos de los tres idiomas. El ancho de cambio será el menor de los puntos de corte estándar de la hoja de estilos que cumpla esa condición, y por debajo se usará el desplegable.
- RF-10: EL SISTEMA aplicará el mismo punto de cambio a todas las webs, tengan o no productos y testimonios, para que el diseño no salte según los datos.
- RF-11: CUANDO se muestre el menú desplegable, EL SISTEMA mantendrá visible y accionable el botón que lo abre, sin que el nombre lo comprima, lo tape ni lo saque de la pantalla.
- RF-12: EL SISTEMA mantendrá el comportamiento actual del menú desplegable: se abre y se cierra con el botón y se cierra al elegir un enlace. No se añade lógica para cerrarlo al cambiar de ancho.
- RF-13: EL SISTEMA mantendrá visible el botón «Contacto» de la cabecera desde 768 px, como hoy, con sus enlaces a las mismas secciones, y mantendrá «Contacto» también como enlace dentro del menú.
- RF-14: MIENTRAS el menú horizontal esté visible, EL SISTEMA no superpondrá el nombre, los enlaces ni el botón «Contacto».

### Pie
- RF-15: EL SISTEMA mostrará en el pie el nombre largo completo, partido en las líneas que haga falta (incluido uno de 80 caracteres sin espacios), sin desbordar la pantalla ni superponer textos, a 375, 768, 1024 y 1280 px. SI el pie ya se ve así hoy, ENTONCES no se tocará.

### Resultado verificable
- RF-16: CUANDO se vea la web con el nombre de 80 caracteres (con espacios y sin espacios) y con un nombre corto, en español, inglés y portugués, a 375, 768, 1024 y 1280 px, EL SISTEMA no mostrará desbordes horizontales, enlaces partidos en dos líneas, ni cabeceras con altura distinta de la del nombre corto (tolerancia de 1 px).
- RF-17: CUANDO se vea una web con un nombre corto, EL SISTEMA se verá igual que antes a 375 px y desde el ancho de cambio (RF-9) en adelante; entre 768 px y el ancho de cambio el menú pasa al desplegable (cambio intencional).
- RF-18: EL SISTEMA no cambiará el contenido de ninguna web: las únicas diferencias en el HTML de las 12 variantes serán el título nativo del nombre (RF-4) y las clases de estilo de la cabecera y del pie, y se revisarán a mano con el comparador de builds. Ningún texto cambia.
- RF-19: CUANDO se abra el menú desplegable en una ventana de 812 × 375 px (móvil en horizontal), EL SISTEMA mostrará los seis enlaces sin cortarlos; si no cupieran, se informará pero no se corregirá en esta spec.

### Documentación
- RF-20: EL SISTEMA documentará en `AGENTS.md` la regla de la cabecera (nombre en una línea con puntos suspensivos, mínimo de 24 caracteres, menú que pasa al desplegable antes, punto de cambio calculado con los textos más largos de los tres idiomas) y el método de verificación manual (los anchos, los tres idiomas y los tres nombres: corto, de 80 caracteres con espacios y de 80 sin espacios), que es obligatorio al tocar la cabecera o al añadir un idioma. Retirará el pendiente de `MEMORY.md`.

## Requisitos no funcionales
- Sin dependencias nuevas.
- Sin cambios en el contrato (el límite de 80 caracteres del nombre no cambia; sigue en la 2.3), en los datos ni en los textos de interfaz. La versión del contrato no sube; el cambio de aspecto en anchos medios se anota en el pull request y en `MEMORY.md`.
- Sin JavaScript nuevo; el comportamiento se logra con el diseño.
- Accesible: el botón del menú sigue siendo operable con teclado y con lector de pantalla; el nombre completo está en el texto del enlace.
- Idioma: documentación y mensajes en español.
- Los 700 tests existentes, los 14 de tipos y la revisión de tipos del build siguen en verde.

## Casos límite
- **Nombre de 80 caracteres con espacios:** se corta con «…» (RF-2).
- **Nombre de 80 caracteres sin espacios (una sola «palabra»):** igual; no debe desbordar ni empujar el menú.
- **Nombre muy corto (por ejemplo, 3 caracteres):** se muestra completo; la cabecera se ve como hoy en móvil y en escritorio ancho.
- **Nombre con letras muy anchas (W, M, mayúsculas) o con tildes:** se corta igual y no cambia la altura.
- **Web sin productos ni testimonios (menú de cuatro enlaces):** el punto de cambio es el mismo que con seis (RF-10); en anchos medios usa el desplegable aunque los cuatro enlaces cabrían.
- **Anchos medios (768 px hasta el ancho de cambio):** **cambio intencional para todas las webs**: hoy ven el menú horizontal apretado; pasarán a ver el desplegable, con el botón «Contacto» visible. Un cliente con nombre corto notará el cambio en tablet.
- **Menú desplegable abierto con el nombre largo:** el desplegable no se ve afectado por el largo del nombre; los enlaces siguen en una línea.
- **Cambio de ancho con el desplegable abierto:** se deja como hoy (queda oculto al ensanchar y reaparece como estaba al estrechar).
- **Pantallas táctiles y teclado:** no hay cursor para el título del nombre; el nombre completo se ve en el pie.
- **Idioma nuevo con textos más largos:** el punto de cambio debe revisarse con el método de `AGENTS.md` (RF-20); no se maneja automáticamente.
- **Pie con el nombre largo:** la fila con «© año nombre» y el nombre repetido no deben desbordar.

## Fuera de alcance
- Cambiar el límite de 80 caracteres del nombre o el contrato.
- Textos de interfaz, traducciones o idiomas nuevos.
- 320 px, anchos menores a 375 px, el zoom del navegador al 200 % o el texto grande del sistema.
- Las secciones, tarjetas y títulos (ya resueltos en la spec 003), el botón de WhatsApp, el título de la pestaña del navegador y los mensajes.
- Rediseñar la cabecera (colores, tipografía, logotipo, menú pegajoso o animaciones).
- Cambiar la navegación del menú desplegable (por ejemplo, un panel lateral), anunciar su estado a lectores de pantalla o mover el foco al abrirlo.
- Cerrar el desplegable al cambiar de ancho (queda como hoy).
- Un test automatizado de la cabecera con un navegador.
- Caracteres compuestos, emojis, escrituras de derecha a izquierda o cortes entre caracteres combinados.
- Medir en Linux, en otros navegadores distintos de Chrome o en otros sistemas operativos.

## Criterios de finalización
- A 375, 768, 1024 y 1280 px, con los tres nombres (corto, de 80 caracteres con espacios y de 80 sin espacios) en español, inglés y portugués: cabecera de una sola línea con altura constante, sin enlaces partidos y sin desbordes (RF-16).
- Una web con nombre corto se ve igual que antes a 375 px y a partir del ancho de cambio (RF-17); la diferencia en anchos medios es la acordada.
- El nombre completo está en el título del enlace y completo en el pie (RF-4, RF-15).
- Las diferencias de HTML de las 12 variantes son solo las acordadas y revisadas a mano (RF-18).
- Los tests existentes y los de tipos pasan; el build y `check-dist` pasan en los 12 builds.
- `AGENTS.md` y `MEMORY.md` actualizados.
- Pull request revisado y fusionado con aprobación expresa del responsable.

## Dudas abiertas
Ninguna que bloquee el plan. Resueltas en la revisión previa: nombre largo (una línea con «…», mínimo de 24 caracteres), anchos medios (desplegable antes, botón «Contacto» visible desde 768 px), alcance (cabecera, menús y pie), nombre completo (título nativo siempre presente y pie), desplegable abierto (como hoy), vigilancia (verificación manual documentada) y ancho mínimo (375 px, verificando 375, 768, 1024 y 1280).

Se resuelve en el plan, midiendo: el ancho exacto del punto de cambio (el menor punto de corte estándar que cumpla RF-9) y el estado actual del pie.
