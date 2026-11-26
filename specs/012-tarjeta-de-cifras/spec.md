# Spec 012 — Tarjeta de cifras de «Quiénes somos» con una o dos cifras
> Solo el QUÉ y el POR QUÉ. Nada de stack, arquitectura ni nombres de archivos (eso va en plan.md).

## Contexto y objetivo
La sección «Quiénes somos» puede mostrar de 0 a 3 cifras (por ejemplo «+8 años tostando»): la primera se muestra destacada y las demás en tarjetas pequeñas debajo. El contrato admite esas tres cantidades, pero solo se probaron 0 y 3.

Al probar el flujo completo con una solicitud de prueba de un cliente con **exactamente dos cifras** apareció un defecto visible: la segunda cifra queda en una tarjeta de **52 px de ancho** y su texto se parte casi letra por letra. A 375 px el contenido además desborda y queda recortado por el recuadro; a 1280 px la tarjeta mide igual de poco aunque no se recorta. Con 0, 1 y 3 cifras la tarjeta se ve bien.

Una web de cliente con dos cifras (un caso normal, permitido por el contrato) sale visiblemente rota sin que ningún test lo detecte. El objetivo es que **la tarjeta de cifras se vea bien con 1, 2 y 3 cifras, a 375, 768 y 1280 px, incluso con textos en los límites del contrato, y que quede cubierta para que no vuelva a pasar**, sin cambiar el contrato, los datos ni el aspecto de los casos que hoy se ven bien.

## Aprobaciones previas (decisiones del responsable)
- Con dos cifras, la segunda va en una **tarjeta centrada con ancho propio**: toma el ancho de su contenido, con un mínimo razonable y sin pasar del ancho disponible, con el mismo estilo que las tarjetas de la variante de tres cifras.
- La spec garantiza además que con **1, 2 y 3 cifras ningún texto se recorta ni desborda**, y que con **0 y 3 cifras de largo normal el aspecto actual no cambia**.
- Con valores de hasta 10 caracteres y etiquetas de hasta 40 (los límites del contrato), a 375 px **no hay recorte ni desborde**: las etiquetas pueden ocupar varias líneas y el recuadro puede crecer en alto si hace falta.
- La verificación combina **fixtures nuevos** con una **medición visual manual documentada**, como la de la cabecera; sin dependencias nuevas.
- Los fixtures nuevos **se suman a las variantes del CI**, y se actualiza el número de variantes en todo lo vivo donde figura (workflow, resumen, mensajes, tests, `AGENTS.md` y `MEMORY.md`); las specs cerradas y las mediciones históricas de `MEMORY.md` se dejan como estaban.
- Que lo que ya se ve bien «no cambia» se comprueba con **medidas de layout** (recuadro y cada cifra, antes y después, con tolerancia de 1 px), no byte a byte: el HTML y el CSS de las variantes con cifras pueden cambiar.
- Los anchos de verificación son **375, 768, 1024 y 1280 px** (1024 es el ancho más estrecho con dos columnas), y la exigencia de textos en los límites vale para los cuatro.
- El recuadro **conserva su forma cuadrada mientras el contenido cabe y solo crece en alto cuando no cabe**; los dos cuadrados decorativos siguen anclados a sus esquinas.
- Se añaden **cuatro fixtures, solo en español**: una cifra y dos cifras de largo normal, y dos y tres cifras con textos en los límites (el caso de una cifra con textos largos se cubre dentro de la de dos). Las variantes del CI pasan de 12 a 16.
- La regla nueva de `AGENTS.md` entra **compactando texto existente** (te lo muestro antes de aplicarlo) sin superar las 59 líneas que exige `check-setup`.

## Términos
- **Largo normal:** el de las cifras de la demo y de los fixtures que ya existen.
- **Textos en los límites:** valor de 10 caracteres (con y sin espacios) y etiqueta de 40, los máximos del contrato; deben validar.
- **Recorte:** el contenido de la tarjeta, o de cualquier cifra, es más alto o más ancho que su contenedor (más de 1 px de diferencia). **Desborde:** la página tiene scroll horizontal.
- **Valor corto:** hasta 6 caracteres sin espacios; no se parte a ningún ancho de la lista. Un valor de 7 a 10 caracteres sin espacios puede partirse solo si no cabe.
- **Mínimo razonable (RF-1):** el que permite que un valor corto y una etiqueta de una palabra no se partan; el plan fija el valor y la medición lo comprueba.

## Usuarios / actores
- **Cliente final de una web generada:** ve la sección «Quiénes somos» en el móvil o el ordenador.
- **Servicio generador y agente de desarrollo:** entregan datos con 0 a 3 cifras y esperan que cualquier cantidad se vea bien.
- **Responsable (tú):** decide si fusionar mirando el resultado visual y el CI.

## Historias de usuario
- H1: Como cliente final quiero que las cifras de la empresa se lean bien sea cual sea su cantidad, para confiar en la web.
- H2: Como servicio generador quiero que cualquier cantidad de cifras que admite el contrato se muestre bien, para no filtrar datos válidos que salen rotos.
- H3: Como desarrollador quiero que una cantidad de cifras o un texto en el límite que rompa la tarjeta lo detecte el repositorio, para no descubrirlo con un cliente.

## Requisitos funcionales (criterios de aceptación en EARS)

### Presentación de la tarjeta
- RF-1: CUANDO hay exactamente dos cifras, EL SISTEMA mostrará la segunda en una tarjeta centrada, con el ancho de su contenido, con un mínimo razonable (ver Términos) y sin pasar del ancho disponible de la fila, con el mismo estilo visual (fondo, bordes, sombra y tamaños de letra) que las tarjetas de la variante de tres cifras.
- RF-2: CUANDO hay una, dos o tres cifras, EL SISTEMA mostrará todos los textos completos: ninguno recortado por el recuadro, ninguno fuera de su tarjeta y sin desbordar horizontalmente la página, a 375, 768, 1024 y 1280 px.
- RF-3: SI el valor o la etiqueta de una cifra son largos (valor de hasta 10 caracteres y etiqueta de hasta 40, escritos con o sin espacios), ENTONCES EL SISTEMA los mostrará completos a 375, 768, 1024 y 1280 px, partiendo las etiquetas en varias líneas y ampliando el recuadro en alto solo cuando el contenido no cabe en el cuadrado, con los dos cuadrados decorativos anclados a sus esquinas, sin partir un valor corto letra por letra. La cifra destacada sigue adaptando el tamaño de su letra al largo del valor, como hoy.
- RF-4: CUANDO no hay cifras, EL SISTEMA no mostrará la tarjeta ni sus adornos, como hoy.

### Lo que no cambia
- RF-5: CUANDO hay tres cifras de largo normal, EL SISTEMA mantendrá el aspecto actual: el ancho y el alto del recuadro y de cada una de las tres cifras no cambian más de 1 px a 375, 768, 1024 y 1280 px, comparados antes y después del cambio. Con ninguna cifra, también igual.
- RF-6: CUANDO hay una sola cifra, EL SISTEMA mantendrá el aspecto actual de la cifra destacada, con la misma medición de RF-5.
- RF-7: EL SISTEMA no cambiará el contrato, los datos, los textos fijos de la interfaz ni las dependencias. Los límites de las cifras (hasta 3, valor de hasta 10 caracteres, etiqueta de hasta 40) y el idioma de cada web siguen igual.

### Cobertura y verificación
- RF-8: EL SISTEMA incluirá cuatro fixtures de datos en español: una cifra de largo normal, dos cifras de largo normal, dos cifras con textos en los límites y tres cifras con textos en los límites. Todos validan con el contrato 2.3 y llevan el resto de los datos de un fixture existente. El caso de una sola cifra con textos largos queda cubierto en la medición manual con el fixture de dos.
- RF-9: EL SISTEMA incorporará esos fixtures a las variantes que construye el CI (de 12 a 16) y a la comprobación posterior al build, y actualizará el número en todo lo vivo: el nombre del paso del workflow, la tabla de nombres del resumen (que el test del repositorio exige que coincida con el workflow), los mensajes del script, los tests, `AGENTS.md` y `MEMORY.md`. No se reescriben las specs cerradas ni las mediciones históricas de `MEMORY.md`.
- RF-10: EL SISTEMA documentará en `AGENTS.md` un método de verificación visual de la tarjeta de cifras, igual en espíritu al de la cabecera: cantidades 1, 2 y 3, textos de largo normal y en los límites, anchos de 375, 768, 1024 y 1280 px, y qué se mide (ancho y alto de recuadro, tarjetas y cifras, recorte y scroll horizontal). Entra sin que `AGENTS.md` supere las 59 líneas de `check-setup`, compactando texto existente sin perder información, y se te muestra antes de aplicarlo.
- RF-11: EL SISTEMA mantendrá en verde los tests existentes (salvo los que fijan el número de variantes, que pasan a esperar el nuevo), la revisión de tipos y el build de las 12 variantes ya existentes. De ellas, las que no llevan cifras (las de datos mínimos) mantienen la misma salida; las que llevan cifras pueden cambiar de HTML y de CSS, y se comparan por medidas de layout (RF-5 y RF-6).
- RF-12: CUANDO se suba el cambio al pull request, EL SISTEMA ejecutará la verificación en GitHub con las dos versiones de Node y el resumen mostrará los nueve pasos con «Todos los pasos pasan», con todas las variantes, las nuevas incluidas.

### Documentación
- RF-13: EL SISTEMA actualizará `MEMORY.md` con la spec, la causa del defecto y lo aprendido, sin pasar de 50 líneas (hoy tiene 47).

## Requisitos no funcionales
- Sin dependencias nuevas; sin JavaScript de cliente nuevo.
- Sin cambiar el contrato ni los datos de ninguna web existente: lo que hoy se ve bien se sigue viendo igual.
- Coste: cada subida al pull request dispara una ejecución de unos 5 minutos de Actions; con 16 variantes sube a unos 6 o 7 minutos (se mide; si pasa de 8 se te consulta). Se hace una sola subida para el cambio, más las que exija un arreglo.
- Idioma: documentación en español; código en inglés.

## Casos límite
- **Una cifra con valor y etiqueta en el límite:** la cifra destacada cabe sin recorte a 375 px.
- **Dos cifras con la segunda muy larga** (etiqueta de 40 caracteres, valor de 10): la tarjeta no pasa del ancho disponible, parte la etiqueta en líneas y el recuadro crece si hace falta.
- **Tres cifras con textos en el límite:** las dos tarjetas pequeñas caben en la fila a 375 px sin recorte.
- **Valor de 10 caracteres sin espacios** (por ejemplo «1.234.567+»): no se sale de su tarjeta.
- **Cero cifras:** no hay tarjeta ni adornos, sin cambios.
- **Una cifra con valor y etiqueta en los límites a 1024 px:** cubierta por la medición a ese ancho.
- **Cifra destacada larga junto a una segunda larga:** la destacada ya adapta su tamaño de letra; la combinación se mide en el fixture de dos cifras con textos en los límites.
- **Orden de las cifras:** no cambia; la primera es la destacada.
- **Pantalla muy estrecha** (menos de 375 px), **texto ampliado por el usuario** (150 % o 200 %), **impresión** y otros navegadores distintos de Chrome: fuera de alcance; el mínimo del proyecto es 375 px y la verificación es en Chrome.
- **Cifras vacías o más de tres:** el contrato ya las rechaza.
- **Caracteres anchos o de otros alfabetos:** el contrato cuenta los caracteres que ve una persona; se mide solo con los fixtures de la spec.
- **Etiquetas en inglés y portugués** (textos del cliente más largos o más cortos): no cambian el comportamiento; el contenido del cliente no se traduce.
- **Idiomas de derecha a izquierda:** fuera de alcance (solo es, en y pt).

## Fuera de alcance
- Rediseñar la sección «Quiénes somos» o la tarjeta de cifras más allá de lo que hace falta para cubrir 1, 2 y 3 cifras con textos hasta los límites del contrato.
- Cambiar los límites de caracteres o de cantidad de cifras, o el contrato.
- Un test visual automático (exigiría una dependencia o herramienta nueva).
- Modo oscuro (el proyecto no lo tiene), impresión y la verificación en navegadores distintos de Chrome.
- Los demás puntos de la sección o de la página (cabecera, catálogo, testimonios, contacto), el aviso de `autocomplete` del formulario y el resto de pendientes del proyecto.
- Alpine, ARM, macOS y los demás pendientes de `MEMORY.md`.

## Criterios de finalización
- RF-1 a RF-9 cumplidos, comprobados con los fixtures y la medición manual a 375, 768, 1024 y 1280 px, sin recortes ni desbordes en ninguna cantidad de cifras.
- Aspecto de 0, 1 y 3 cifras de largo normal igual al actual (RF-5 y RF-6), comprobado con medidas del recuadro y de las cifras tomadas antes del cambio.
- Una ejecución verde en GitHub con Node 22.23.4 y la última 24.x, con las 16 variantes y «Todos los pasos pasan».
- `AGENTS.md` y `MEMORY.md` actualizados.
- Pull request revisado y fusionado con aprobación expresa del responsable.

## Dudas abiertas
Ninguna. Resueltas en la revisión previa: el aspecto de la segunda cifra (tarjeta centrada de ancho propio), el alcance (1, 2 y 3 sin recorte, 0 y 3 sin cambios), el nivel de exigencia con textos largos (sin recorte ni desborde a 375 px), la verificación (fixtures más método manual documentado) y la incorporación al CI (variantes sumadas y número actualizado).

Resueltas también en la aclaración: el criterio de «no cambia» (medidas de layout), los anchos (con 1024 px), el recuadro (cuadrado si cabe), los cuatro fixtures, dónde se actualiza el número de variantes (lo vivo) y cómo entra la regla en `AGENTS.md` (compactando, sin pasar de 59 líneas). El valor exacto del mínimo de la tarjeta, las medidas de referencia de antes del cambio y el texto de la regla de `AGENTS.md` se fijan en el plan; esa regla se te muestra antes de aplicarla.
