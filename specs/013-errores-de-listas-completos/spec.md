# Spec 013 — Informe de validación completo: los errores de una lista no ocultan los de sus elementos
> Solo el QUÉ y el POR QUÉ. Nada de stack, arquitectura ni nombres de archivos (eso va en plan.md).

## Contexto y objetivo
El contrato con el generador promete que los datos inválidos se rechazan **con la lista completa de errores** (ruta, código estable y mensaje en español), para que quien genera los datos corrija todo de una vez. Probando una solicitud sintética apareció un caso en que no se cumple: **cuando una lista excede su máximo, solo se informa que tiene demasiados elementos y se ocultan los errores de sus elementos.**

Comprobado ejecutando la validación:
- Con 4 cifras en «Quiénes somos» (el máximo es 3) solo sale `too_many`; el `too_long` de la primera cifra («12.000+ pacientes», 17 caracteres) aparece recién cuando la lista ya tiene 3.
- Pasa igual con los servicios (máximo 8: un ícono inválido queda oculto), los testimonios (máximo 9: una valoración de 9 queda oculta) y los destacados (máximo 5: uno de 41 caracteres queda oculto). Con más de 60 productos queda oculto el error propio de cada producto, por ejemplo una imagen con URL inválida; las reglas entre campos de los productos (id repetido, precio obligatorio, categorías inconsistentes) sí se informan.

El efecto práctico es que el generador necesita **un segundo intento** para ver errores que ya estaban en la primera entrega, y la promesa de «lista completa» es falsa en ese caso. El objetivo es que **ningún error oculte a otro independiente**: se informan todos en una sola pasada, empezando por las listas, y se comprueba de forma sistemática, sin cambiar la forma del contrato, lo que es válido ni los códigos de error existentes.

## Aprobaciones previas (decisiones del responsable)
- La corrección vale para **todas las listas que tienen máximo**: cifras de «Quiénes somos», destacados, servicios, testimonios y productos.
- Se informan los errores de **todos los elementos de la lista, sin importar su posición**, con su ruta exacta (por ejemplo `about.stats[3].value`): no se sabe cuál elemento quitará quien corrija el exceso.
- La spec garantiza el **principio general** de que un error no oculta ninguno independiente, con una **comprobación sistemática** (un test que recorre los campos de un fixture válido combinando cada error con otro no relacionado). Si aparece otro caso del mismo tipo se corrige aquí; los que no sean del mismo tipo se anotan.
- **El contrato 2.3 no cambia:** no se sube la versión ni se añade entrada al registro de cambios. Cambia solo lo completo que es el informe de datos inválidos; la documentación generada lo explica con una línea. `AGENTS.md` no se toca: su regla de «lista completa de errores» pasa a cumplirse.
- **Independencia:** la garantía es para errores **sin relación lógica**. Dos errores son independientes si ninguno puede cambiar el resultado del otro (campos distintos sin una regla que los una). Los pares con dependencia declarada (anclas a secciones opcionales, contacto, precio–moneda–categorías) quedan fuera de la garantía y el plan los lista expresamente.
- **Casos nuevos:** si la comprobación sistemática encuentra otro caso en que un error oculta a otro, **se para y se te pregunta antes de corregirlo**: tú decides si se corrige aquí, se anota o se abre otra spec.
- **Comprobación sistemática:** sobre el fixture máximo, **un error por cada campo hoja** y **todos los pares de campos independientes**; además, cada lista con máximo se prueba excedida.
- **Archivos autorizados:** el script que genera el documento del contrato (para la línea de RF-12), un archivo de tests nuevo si hace falta y los tests existentes que afirmen que un error es «el único».

## Términos
- **Error independiente:** un error que ninguno otro puede cambiar. Dos errores son independientes si están en campos distintos y ninguna regla del contrato los relaciona.
- **Contención:** un error en un valor que impide validar lo que contiene (un campo ausente, o de tipo equivocado, no tiene campos internos que validar). No cuenta como ocultamiento.
- **Dependencia declarada (fuera de la garantía de RF-6):** las anclas que apuntan a secciones opcionales (`#testimonios` y `#productos` dependen de que la lista exista y no esté vacía, aunque sus elementos sean inválidos), el contacto (WhatsApp y email o teléfono), y precio, moneda y categorías de los productos.
- **Campo hoja:** un campo de los datos que no contiene otros (por ejemplo `about.stats[0].value`).

## Usuarios / actores
- **Servicio generador y agente de desarrollo:** entregan datos y leen el informe de validación para corregirlos.
- **Responsable (tú):** quiere que el generador acierte a la segunda entrega como mucho, sin intentos de más.

## Historias de usuario
- H1: Como servicio generador quiero recibir todos los errores de mis datos en una sola respuesta, para corregirlos en un solo intento.
- H2: Como desarrollador quiero que una lista con demasiados elementos no oculte los errores de esos elementos, para no descubrirlos de a uno.
- H3: Como desarrollador quiero un test que recorra los campos del contrato y detecte cualquier error que oculte a otro, para que no vuelva a pasar con campos o listas futuras.

## Requisitos funcionales (criterios de aceptación en EARS)

### Listas con máximo
- RF-1: SI una lista con máximo excede ese máximo (cifras de «Quiénes somos», destacados, servicios, testimonios o productos), ENTONCES EL SISTEMA informará el error de cantidad de siempre (`too_many`, con su mensaje) **y además** los errores de cada uno de sus elementos.
- RF-2: EL SISTEMA validará todos los elementos de la lista, incluidos los que están por encima del máximo, y cada error llevará la ruta exacta del elemento (por ejemplo `about.stats[3].value`, `services[8].icon`, `products[60].image`).
- RF-3: CUANDO una lista no excede su máximo, EL SISTEMA se comportará exactamente como hoy: los errores de sus elementos se informan, el informe no cambia.
- RF-4: SI un elemento de una lista que excede el máximo no es del tipo esperado (un texto, un número, `null` o un array donde se espera un objeto; cualquier valor que no sea texto en `about.highlights`), ENTONCES EL SISTEMA informará `invalid_type` para ese elemento, como hoy lo haría con una lista de tamaño válido.
- RF-5: EL SISTEMA mantendrá las reglas entre campos de los productos (id repetido, precio obligatorio, categorías inconsistentes o demasiadas, moneda sin decimales) informándose también con listas de más de 60 productos, incluidos los productos que están por encima del máximo y los cruces entre un producto de dentro y uno de fuera (por ejemplo un id repetido entre `products[3]` y `products[61]`).
- RF-5b: CUANDO el objeto que contiene una lista tiene un error propio (por ejemplo `about` sin título) y la lista además excede su máximo, EL SISTEMA informará ambos.

### Principio general
- RF-6: EL SISTEMA no ocultará un error por la presencia de otro error independiente (ver Términos): para cualquier par de errores en campos sin relación lógica, y que no sea de contención (un campo ausente o de tipo equivocado no puede tener errores internos), ambos aparecerán en el mismo informe. Los pares con dependencia declarada quedan fuera de esta garantía y se listan en el plan.
- RF-7: SI la comprobación sistemática encuentra otro caso en que un error oculta a otro independiente, ENTONCES EL SISTEMA se detendrá y se lo contará al responsable antes de corregirlo: corregirlo en esta spec, anotarlo en `MEMORY.md` o abrir otra spec lo decide el responsable.

### Lo que no cambia
- RF-8: EL SISTEMA no cambiará la forma del contrato, lo que es válido, los códigos de error existentes ni sus mensajes, ni la versión (2.3). Los datos válidos siguen siendo válidos y el resultado de `validateSite` para datos sin errores no cambia. SI corregir un caso requiriera un código nuevo o cambiar un mensaje existente, ENTONCES EL SISTEMA se detendrá y lo consultará con el responsable antes de hacerlo (RF-7). El esquema JSON generado no cambia de forma; solo puede cambiar el texto del documento Markdown.
- RF-9: EL SISTEMA mantendrá el orden del informe (por ruta y luego por código: el error de la lista, `about.stats`, va antes que los de sus elementos, `about.stats[3].value`), sin tope de errores, y el formato de texto y el estructurado. Un mismo problema se informa una sola vez por ruta y código, aunque lo detecten a la vez la validación del elemento y una regla entre campos.

### Resultado verificable
- RF-10: EL SISTEMA tendrá tests que cubran: cada una de las cinco listas con máximo excedido y un error en un elemento (con elementos por encima y por debajo del máximo); un elemento de tipo equivocado (texto, número, `null`, array) en una lista excedida; las reglas entre campos de productos con más de 60 productos, incluido el cruce entre un producto de dentro y uno de fuera; el objeto contenedor con error propio y la lista excedida a la vez (RF-5b); el caso sin exceso, sin cambios; que el informe estructurado y el de texto contienen los mismos errores con una lista excedida; la solicitud sintética de la prueba (cuatro cifras, ícono inválido, ancla a una sección que no existe, etc.) validada con el comando `npm run validate`, que lista todos sus errores a la primera; y la comprobación sistemática de RF-6 sobre el fixture máximo, que recorre sus campos de forma genérica (un error por campo hoja y todos los pares independientes) para cubrir también campos y listas futuros.
- RF-11: EL SISTEMA mantendrá en verde los tests existentes, la revisión de tipos y el build de las 16 variantes, y no cambiará la web, los datos de ningún cliente ni las dependencias.
- RF-12: EL SISTEMA documentará en el documento generado del contrato, en el apartado del informe de validación, que se informan todos los errores aunque una lista exceda su máximo, regenerando los documentos con el comando habitual; no se editan a mano. El texto de ese apartado vive en el script que genera el documento, que se edita para esto; los dos documentos generados se guardan con LF, como siempre.
- RF-13: CUANDO se suba el cambio al pull request, EL SISTEMA ejecutará la verificación en GitHub con las dos versiones de Node y el resumen mostrará los nueve pasos con «Todos los pasos pasan».

### Documentación
- RF-14: EL SISTEMA actualizará `MEMORY.md` con la spec, la causa del defecto y lo aprendido, sin pasar de 50 líneas (hoy tiene 48).

## Requisitos no funcionales
- Sin dependencias nuevas.
- El informe sigue sin tope de errores; una lista muy larga con muchos errores produce muchos errores (el documento ya lo indica: «sin tope»).
- La validación de un fixture máximo sigue tardando menos de un segundo; la comprobación sistemática se ejecuta en los tests (no en el build) y debe terminar en menos de 30 segundos.
- El código de validación respeta las reglas de `AGENTS.md` para los scripts de Node que lo importan: solo `import type`, extensiones `.ts` en rutas relativas, sin `enum` ni el alias `@/`.
- Idioma: mensajes y documentación en español; código en inglés.

## Casos límite
- **Lista justo en el máximo:** sin cambios (RF-3).
- **Lista excedida en 1 con un solo elemento inválido en la posición excedente:** se informa el `too_many` y el error de ese elemento.
- **Lista excedida con errores en elementos de dentro y de fuera del máximo:** se informan todos.
- **Lista excedida donde un elemento no es un objeto:** `invalid_type` de ese elemento (RF-4).
- **Lista por debajo del mínimo (`services` vacía):** sin elementos, no hay errores de elementos; sigue `too_few`.
- **`about.stats` que no es una lista:** `invalid_type`, sin errores internos posibles.
- **Más de 60 productos con id repetido y categorías inconsistentes:** esas reglas se informan como hoy (RF-5).
- **Lista excedida muchísimo** (cientos de elementos con errores): se informan todos; el tamaño de la entrada no está limitado aquí.
- **Dos errores del mismo campo** (por ejemplo texto vacío y demasiado largo no pueden coexistir): sin cambios.
- **Elementos `null` o huecos** en una lista excedida: `invalid_type` de ese elemento (RF-4).
- **Objeto contenedor inválido más lista excedida** (`about` sin título y cuatro cifras): se informan ambos (RF-5b).
- **Ancla `#testimonios` o `#productos` con la lista excedida y todos sus elementos inválidos:** el ancla sigue siendo válida mientras la lista exista y no esté vacía, como hoy.
- **Lista excedida con cientos de elementos y errores:** se informan todos; el tamaño no se limita aquí.
- **Listas anidadas futuras:** la comprobación sistemática recorre el fixture de forma genérica, así que las cubriría sin cambiar el test.
- **Datos con un campo no previsto dentro de un elemento de una lista excedida:** `unrecognized_field` con la ruta del elemento, como en una lista de tamaño válido.

## Fuera de alcance
- Cambiar los máximos y mínimos, la forma del contrato o los códigos y mensajes de error.
- Un tope de errores o un resumen de errores agrupados.
- La validación de la web (qué se muestra), los componentes, el generador y el servicio.
- Las otras observaciones de la prueba del flujo: las anclas válidas fijas en español en webs en inglés y portugués, el formulario de contacto que descarta lo escrito y el teléfono sin enlace `tel:`.
- Rendimiento con entradas enormes y la validación de archivos de datos de más de un solo sitio.

## Criterios de finalización
- RF-1 a RF-9 con test y en verde, con la comprobación sistemática sin casos pendientes; si apareciera uno nuevo, se resuelve con tu decisión (RF-7) antes de dar la spec por terminada.
- Con la solicitud de la prueba (cuatro cifras, ícono inválido, etc.) el informe lista todos los errores a la primera.
- Los 16 builds de variantes y la revisión de tipos en verde.
- Una ejecución verde en GitHub con Node 22.23.4 y la última 24.x, con «Todos los pasos pasan».
- Documento de contrato regenerado, `MEMORY.md` actualizado.
- Pull request revisado y fusionado con aprobación expresa del responsable.

## Dudas abiertas
Ninguna. Resueltas en la revisión previa: las listas afectadas (todas las que tienen máximo), qué elementos se validan (todos, sin importar la posición), el alcance (principio general con comprobación sistemática) y la versión del contrato (sin cambios).

Resueltas también en la aclaración: la definición de independencia (sin relación lógica, con las dependencias declaradas fuera de la garantía), quién decide ante un caso nuevo (el responsable, antes de corregir), la forma de la comprobación sistemática (un error por campo hoja y todos los pares independientes) y los archivos autorizados (el generador del documento, un archivo de tests nuevo si hace falta y los tests existentes que afirmen un único error). La lista exacta de dependencias declaradas y los pares que quedan fuera, y el nombre del archivo de tests nuevo, se fijan en el plan.
