# Spec 004 — Interfaz fija en el idioma del cliente (multi-idioma)
> Solo el QUÉ y el POR QUÉ. Nada de stack, arquitectura ni nombres de archivos (eso va en plan.md).

## Contexto y objetivo
El contenido que escribe el cliente puede estar en cualquier idioma, pero todo lo demás que ve el visitante sigue escrito en español rioplatense: el menú, el formulario, los botones, el pie de página, las tarjetas de contacto, los títulos neutros de sección que dejó la spec 003 y hasta el mensaje que se prellena en WhatsApp. Una web de un negocio brasileño o de habla inglesa sale con el contenido en su idioma y la interfaz en otro, y sus lectores de pantalla pronuncian todo como español.

Esto contradice la regla de que el texto visible de cada web está en el idioma del cliente. El objetivo es que **el servicio generador indique un idioma y toda la interfaz fija de la web salga en ese idioma**, sin cambiar el diseño y sin que las webs actuales (en español) cambien ni una palabra.

## Aprobaciones previas (decisiones del responsable)
- Mecanismo: un código de idioma en los datos y traducciones incluidas en el template (el generador solo envía el código).
- Idiomas de esta primera versión: español, inglés y portugués.
- Un código que el template no incluye se rechaza con un error (no se reemplaza en silencio por español).
- Alcance: textos visibles de la interfaz, `aria-label`, mensajes prellenados de WhatsApp y atributo `lang` de la página. El precio (símbolo `$` y formato argentino) y los números quedan fuera.
- Variantes: el español conserva los textos actuales (rioplatense); el portugués es el de Brasil; el inglés es neutro.
- Forma del contrato: campo opcional `language` en la raíz de los datos; un valor inválido da un error con código estable propio que lista los valores permitidos; un tipo equivocado da el error de tipo; la página declara `es`, `en` o `pt-BR`.
- Constitución: se enmienda con aprobación expresa (principios 3, 5 y 6) y se actualiza `AGENTS.md`; ver RF-22.
- Verificación: la lista de textos fijos y sus traducciones la redacta el plan y el responsable la aprueba antes de pasar a las tareas; una barrera automática y una comprobación de completitud evitan textos de otro idioma o sin traducir.

## Usuarios / actores
- **Servicio generador:** indica el idioma de cada web en los datos del cliente.
- **Cliente final (dueño del negocio):** quiere una web coherente en su idioma y recibir los mensajes de WhatsApp en ese idioma.
- **Visitante de la web:** lee la interfaz en el idioma del negocio; si usa lector de pantalla, la pronunciación debe corresponder.
- **Desarrollador de Pylar Labs:** mantiene las traducciones y el contrato, y necesita que sea verificable y compatible.

## Historias de usuario
- H1: Como servicio generador quiero indicar el idioma de la web con un solo dato para que toda la interfaz fija salga en ese idioma.
- H2: Como visitante quiero leer el menú, el formulario, los botones y el pie en el idioma del negocio para entender la web sin mezclas.
- H3: Como cliente final quiero que el mensaje que llega por WhatsApp esté en el idioma de mi web para atender consultas sin confusión.
- H4: Como visitante con lector de pantalla quiero que la página declare su idioma y que las etiquetas de accesibilidad estén traducidas para que se lea bien.
- H5: Como desarrollador quiero que el cambio sea compatible con los datos actuales para no tocar ni una web existente.

## Requisitos funcionales (criterios de aceptación en EARS)

### Elección del idioma
- RF-1: EL SISTEMA aceptará en la raíz de los datos un campo opcional `language` con tres valores exactos: `es` (español), `en` (inglés) y `pt` (portugués de Brasil).
- RF-2: MIENTRAS falte `language`, EL SISTEMA usará `es` y producirá la misma web que antes del cambio.
- RF-3: SI `language` es un texto que no es uno de los tres valores (por ejemplo `fr`, `EN`, `pt-BR`, con espacios o vacío), ENTONCES EL SISTEMA rechazará los datos con un error de código estable propio, en la ruta `language`, que liste los valores permitidos; no normalizará ni sustituirá el valor.
- RF-4: SI `language` no es un texto (por ejemplo un número, `null`, una lista o un objeto), ENTONCES EL SISTEMA rechazará los datos con el error de tipo existente, con la misma forma que los demás.

### Textos traducidos
- RF-5: MIENTRAS el idioma sea `en` o `pt`, EL SISTEMA mostrará en ese idioma todo texto fijo de la interfaz: el menú, el botón de contacto del encabezado, las etiquetas, los *placeholders*, el título y el botón del formulario, los títulos y etiquetas de las tarjetas de contacto (incluido "Respondemos rápido" y su equivalente) y el pie de página. La lista cerrada de esos textos la fija el plan (RF-17).
- RF-6: MIENTRAS falte el título de una sección, EL SISTEMA mostrará el título neutro de esa sección en el idioma elegido, igual al nombre de esa sección en el menú de ese idioma.
- RF-7: MIENTRAS falte la etiqueta del botón de consulta de los productos, EL SISTEMA mostrará la etiqueta por defecto en el idioma elegido.
- RF-8: CUANDO los datos traen su propio texto (títulos, subtítulos, etiqueta de botón, contenido), EL SISTEMA mostrará ese texto tal cual, sin traducirlo ni mezclarlo.
- RF-9: MIENTRAS el idioma sea `en` o `pt`, EL SISTEMA no mostrará ningún texto fijo de la interfaz de otro idioma (en particular, ninguno en español), salvo los nombres propios de las redes ("Instagram", "Facebook"), las palabras que sean iguales en ambos idiomas y lo que venga de los datos. Los precios y los números quedan fuera de este requisito.
- RF-10: EL SISTEMA comprobará que los tres idiomas tengan exactamente los mismos textos fijos, de modo que ninguno quede sin traducir.

### Accesibilidad y mensajes
- RF-11: EL SISTEMA declarará en la página el idioma elegido (`es`, `en` o `pt-BR`) para que lo usen los lectores de pantalla y los navegadores.
- RF-12: MIENTRAS el idioma sea `en` o `pt`, EL SISTEMA mostrará en ese idioma los `aria-label` (menú, WhatsApp); los nombres de las redes no se traducen.
- RF-13: CUANDO el visitante abra WhatsApp desde el botón flotante, el contacto o un producto, EL SISTEMA prellenará el mensaje en el idioma elegido, con el nombre del negocio o del producto tal como está en los datos: el mismo mensaje en el botón flotante y en el contacto, y uno propio para el producto.

### Contrato de datos
- RF-14: EL SISTEMA publicará el contrato en la versión 2.2, compatible con la 2.1 y la 2.0: los datos válidos en esas versiones seguirán siéndolo.
- RF-15: EL SISTEMA describirá el campo nuevo (significado, valores permitidos, obligatoriedad y valor por defecto) y, para cada idioma, los valores por defecto que dependen de él (títulos neutros y etiqueta del botón de producto) en la documentación del contrato, anotará el cambio en su registro de cambios y listará el error nuevo entre los códigos estables; los documentos generados reflejarán la versión 2.2.
- RF-16: EL SISTEMA informará del error del idioma con la misma forma que los demás (ruta exacta, código estable, mensaje en español), sumado al resto de errores en una sola lista, y seguirá rechazando los campos no previstos.

### Calidad de las traducciones y del resultado
- RF-17: ANTES de pasar a las tareas, EL SISTEMA contará con la lista completa de textos fijos, con su versión en español, inglés y portugués, aprobada por el responsable.
- RF-18: CUANDO se construya la web en cada idioma, EL SISTEMA comprobará automáticamente que no aparezca un texto fijo de otro idioma que no esté en los datos.
- RF-19: CUANDO se construya la web en cada uno de los tres idiomas, EL SISTEMA producirá una página sin recortes ni desbordes a 375, 768 y 1280 px, incluidas las variantes con todos los campos en su límite máximo.
- RF-20: CUANDO se construya la web sin `language` o con `es`, EL SISTEMA producirá el mismo HTML que la web actual, construida el mismo año.
- RF-21: EL SISTEMA dispondrá de datos de ejemplo mínimos y máximos en inglés y en portugués, además de los actuales en español, para comprobar los tres idiomas.

### Documentación y constitución
- RF-22: EL SISTEMA actualizará, con la aprobación del responsable, los principios 3, 5 y 6 de la constitución y la convención equivalente de `AGENTS.md` (interfaz de cada web en su idioma, español por defecto; las traducciones del template son una excepción declarada a "sin texto fijo"; un idioma nuevo exige una versión del template), la lista de excepciones conocidas (se retiran la interfaz fija y los títulos neutros; queda el símbolo `$` y el formato del precio) y el estado en la memoria.

## Requisitos no funcionales
- Sin dependencias nuevas.
- Idioma: mensajes de error y documentación en español; los textos del cliente pueden estar en cualquier idioma y no dependen de `language`.
- Sin cambios de diseño: el idioma no altera la estructura ni los estilos, salvo el ajuste que haga falta para que los textos más largos no se corten.
- No hay generadores en uso: no se requiere migración de datos.
- Cada construcción es independiente: no queda ningún estado de un idioma anterior.

## Casos límite
- El idioma de la interfaz y el del contenido del cliente son independientes: contenido en español con `language: "en"` se respeta. El sistema no lo detecta ni avisa; límite conocido: un lector de pantalla leerá ese contenido con la pronunciación del idioma declarado.
- `language` ausente, `es` y datos 2.0 o 2.1 sin el campo: web idéntica a la actual.
- `language` con mayúsculas (`EN`), región (`pt-BR`, `en-US`), espacios, vacío o `null`: se rechaza; solo valen `es`, `en` y `pt` exactos.
- Título de sección o etiqueta de botón propios en un idioma distinto del elegido: se muestran tal cual (RF-8).
- Nombre de negocio o de producto con comillas, tildes, emojis o caracteres de otro alfabeto: aparece sin alterar en el mensaje de WhatsApp, codificado como hoy, y el enlace sigue siendo válido con textos largos.
- Textos traducidos más largos que los españoles (por ejemplo, etiquetas del formulario en portugués): no se cortan ni desbordan (RF-19).
- Sin productos, sin testimonios o sin redes: las secciones y enlaces omitidos no dejan huecos en ningún idioma.
- Año del pie: se sigue mostrando con el año de la construcción, como número, sin formato regional.
- Precio: sigue con `$` y formato argentino en los tres idiomas (límite de la spec 001).
- Un texto fijo nuevo que se añada en el futuro sin traducción en los tres idiomas: la comprobación de RF-10 falla.

## Fuera de alcance
- Más idiomas que español, inglés y portugués; variantes regionales (por ejemplo `pt-PT`, `en-GB`, `es-MX`) como códigos propios.
- Una web que cambie de idioma desde la propia página (selector de idioma) o que contenga varios idiomas a la vez.
- Traducir automáticamente el contenido del cliente.
- Moneda, símbolo y formato de números y fechas por idioma.
- Idiomas de derecha a izquierda (árabe, hebreo).
- SEO multi-idioma (varias URL por idioma, etiquetas `hreflang`).
- Cambiar los textos actuales en español (incluida la promesa "Respondemos rápido", que se traduce, no se retira).
- Los textos que solo aparecerían si el formulario enviara datos (estados de error o de éxito): hoy es solo maqueta.
- Cualquier cambio de diseño ajeno a que los textos largos quepan.

## Criterios de finalización
- Los datos válidos en la 2.0 y la 2.1 siguen validando, y la web sin `language`, construida el mismo año, tiene el mismo HTML que la actual.
- Con `en` y con `pt`, la web construida no contiene ningún texto fijo de otro idioma, y su atributo de idioma, sus `aria-label` y sus mensajes de WhatsApp están en ese idioma.
- Un `language` inválido hace fallar la construcción con la lista completa de errores, y un test falla si algún idioma tiene un texto menos que otro.
- La documentación generada declara la versión 2.2, describe el campo nuevo, su error y los valores por defecto de cada idioma.
- Los casos nuevos tienen sus propios tests, con cada valor permitido y varios inválidos; los tests existentes pasan sin modificar más que las comprobaciones de versión (incluidas las del archivo de tests de los campos de texto).
- Las traducciones fueron aprobadas por el responsable antes de pasar a las tareas.
- Las tres variantes (español, inglés y portugués) se ven correctas a 375, 768 y 1280 px.
- La constitución, `AGENTS.md` y `MEMORY.md` actualizados con la enmienda aprobada.
- Pull request revisado y fusionado con aprobación expresa del responsable.

## Dudas abiertas
Ninguna. Resueltas en la revisión: nombre y lugar del campo (RF-1), error propio y tipo (RF-3, RF-4), atributo de idioma `pt-BR` (RF-11), enmienda de la constitución (RF-22), definición y comprobación de "sin texto de otro idioma" (RF-9, RF-10, RF-18), traducción de "Respondemos rápido" y de los nombres de red (RF-9, RF-12).
