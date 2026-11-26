# Spec 003 — Llevar a los datos los textos fijos falsos o de un rubro
> Solo el QUÉ y el POR QUÉ. Nada de stack, arquitectura ni nombres de archivos (eso va en plan.md).

## Contexto y objetivo
Cada web generada publica hoy textos que el template trae escritos y que el cliente nunca dijo. Un inventario de la web demo muestra más de 30 textos fijos (sin contar precios ni iniciales, que ya salen de los datos); tres grupos son un problema real:
- **Cifras falsas** en "Quiénes somos": "14+ años de experiencia", "500+ clientes satisfechos" y "100% artesanal" aparecen en la web de cualquier negocio, sea o no verdad.
- **Subtítulos de un rubro**: el de productos dice "Elaborados con ingredientes naturales de la región", que solo tiene sentido para alimentos.
- **Títulos y subtítulos de sección fijos** (servicios, productos, testimonios y contacto), incluida una promesa ("te respondemos a la brevedad") que el negocio no controla.

Esto viola el principio de la constitución de que todo contenido vive en los datos, y expone al cliente a publicar afirmaciones falsas. El objetivo es que **ninguna cifra, texto de un rubro ni promesa de sección que no esté en los datos del cliente llegue a la web**, sin cambiar el diseño ni la interfaz.

Este cambio es parcial a propósito: la interfaz fija (menú, formulario, botones, pie, tarjetas de contacto) y los títulos neutros siguen en español hasta la spec de multi-idioma; queda registrado como límite conocido (ver "Fuera de alcance").

## Aprobaciones previas (decisiones del responsable)
- Alcance: solo lo falso o específico de un rubro; la interfaz fija queda fuera.
- Cifras opcionales en los datos, y títulos y subtítulos de sección opcionales con valores neutros.
- Contrato 2.1, compatible con 2.0.
- Límites: valor de cifra 10 caracteres, descripción 40, título 80, subtítulo 200; hasta 3 cifras.
- Los 3 tests que fijan la versión "2.0" se actualizan solo en la versión; los demás no se tocan.
- La tarjeta de cifras se adapta a 1, 2 o 3 cifras; sin cifras desaparece con sus cuadrados decorativos.
- Un texto de una sección omitida se acepta sin efecto.
- Títulos neutros: "Servicios", "Productos", "Testimonios", "Contacto".
- La demo lleva sus cifras en los datos y sus destacados dejan de repetirlas.
- Verificación visual a 375, 768 y 1280 px.
- La variante máxima existente se amplía; la mínima no cambia.

## Usuarios / actores
- **Servicio generador:** rellena los datos de cada cliente; puede aportar cifras y textos de sección o dejarlos neutros. Decide también el orden de las cifras.
- **Cliente final (dueño del negocio):** no debe ver publicadas cifras o promesas que no dijo.
- **Visitante de la web:** no debe leer cifras falsas ni textos de otro rubro.
- **Desarrollador de Pylar Labs:** mantiene el contrato y necesita que el cambio sea compatible y verificable.

## Historias de usuario
- H1: Como servicio generador quiero aportar, si el cliente las tiene, hasta tres cifras con su descripción para mostrar datos reales del negocio.
- H2: Como visitante quiero no ver cifras que el negocio no declaró para no recibir información falsa.
- H3: Como servicio generador quiero personalizar el título y el subtítulo de cada sección, o dejarlos neutros, para que ningún texto sea de otro rubro.
- H4: Como desarrollador quiero que el contrato suba de versión de forma compatible, para no romper datos válidos.
- H5: Como cliente final quiero que una web sin cifras ni textos propios se vea correcta y sobria, sin huecos ni bloques vacíos.

## Requisitos funcionales (criterios de aceptación en EARS)

### Cifras de "Quiénes somos"
- RF-1: EL SISTEMA aceptará en "Quiénes somos" de 0 a 3 cifras opcionales, cada una con un valor y una descripción.
- RF-2: EL SISTEMA aceptará como valor un texto libre de hasta 10 caracteres y como descripción un texto de hasta 40 caracteres, ambos sin saltos de línea (por ejemplo "+14", "100%", "24/7" o "4,9★"). Al mostrarse, el texto podrá ajustarse en varias líneas si no cabe.
- RF-3: SI una cifra trae solo el valor o solo la descripción, ENTONCES EL SISTEMA rechazará los datos (ambos o ninguno).
- RF-4: MIENTRAS haya al menos una cifra, EL SISTEMA mostrará la tarjeta de cifras con solo las cifras aportadas, en el orden de los datos: la primera destacada y las demás, pequeñas. Con 1 cifra se muestra sola y centrada; con 2, la destacada y la pequeña centrada; con 3, la destacada y dos pequeñas. Ninguna combinación deja celdas vacías.
- RF-5: MIENTRAS no haya cifras (campo ausente o lista vacía), EL SISTEMA omitirá la tarjeta de cifras junto con sus cuadrados decorativos, y el texto de "Quiénes somos" ocupará todo el ancho de la sección en una sola columna, sin huecos ni bloques vacíos.
- RF-6: EL SISTEMA no mostrará nunca una cifra que no figure en los datos.

### Títulos y subtítulos de sección
- RF-7: EL SISTEMA aceptará un título y un subtítulo opcionales para cada una de las cuatro secciones: servicios, productos, testimonios y contacto.
- RF-8: EL SISTEMA aceptará como título un texto de hasta 80 caracteres y como subtítulo un texto de hasta 200 caracteres, ambos sin saltos de línea.
- RF-9: MIENTRAS falte el título de una sección que se muestra, EL SISTEMA mostrará un título neutro y sin rubro: "Servicios", "Productos", "Testimonios" o "Contacto" (los mismos nombres del menú).
- RF-10: MIENTRAS falte el subtítulo de una sección, EL SISTEMA no mostrará subtítulo ni dejará espacio vacío en su lugar.
- RF-11: EL SISTEMA no mostrará ningún título o subtítulo de sección que no esté en los datos del cliente, salvo el título neutro de RF-9.
- RF-12: SI una sección se omite por falta de sus datos (productos o testimonios), ENTONCES EL SISTEMA aceptará sus títulos y subtítulos como datos válidos, no los exigirá y no los mostrará.

### Validación
- RF-13: SI un texto nuevo presente está vacío o solo tiene espacios, ENTONCES EL SISTEMA rechazará los datos; una lista de cifras vacía se acepta y equivale a ausente.
- RF-14: SI un valor, una descripción, un título o un subtítulo supera su máximo o contiene saltos de línea, ENTONCES EL SISTEMA rechazará los datos; no recortará ni corregirá nada. Los espacios al principio o al final se conservan tal cual.
- RF-15: EL SISTEMA informará de cada error nuevo con la misma forma que los demás (ruta exacta, código estable, mensaje en español), sumado al resto de errores en una sola lista.
- RF-16: EL SISTEMA seguirá rechazando los campos no previstos.
- RF-17: EL SISTEMA tratará los textos nuevos como texto plano: el HTML escrito en ellos se muestra literal y nunca se ejecuta, también en la web construida.

### Contrato de datos
- RF-18: EL SISTEMA publicará el contrato en la versión 2.1, compatible con la 2.0: los datos válidos en la 2.0 seguirán siéndolo.
- RF-19: EL SISTEMA describirá cada campo nuevo (significado, obligatoriedad, límites y valor por defecto, cuando exista) en la documentación del contrato y anotará el cambio en su registro de cambios; los documentos generados reflejarán la versión 2.1.

### Datos de ejemplo y resultado visible
- RF-20: EL SISTEMA llevará en los datos demo sus propios textos y cifras ("14+ años", "500+ clientes", "100%", "Nuestros servicios"…), de modo que la demo se vea como hoy porque son datos de ese negocio. Los destacados de la demo dejarán de repetir las cifras.
- RF-21: EL SISTEMA dispondrá de una variante de datos sin ninguno de los campos nuevos (la mínima actual) y de otra con todos en su límite máximo (la máxima actual, ampliada), para comprobar ambos extremos.
- RF-22: CUANDO los datos no traen ninguno de los campos nuevos, EL SISTEMA producirá una web correcta a 375, 768 y 1280 px: sin cifras, con títulos neutros, sin subtítulos y sin huecos.
- RF-23: CUANDO los datos traen todos los campos nuevos en su límite máximo, EL SISTEMA producirá una web sin recortes ni desbordes a 375, 768 y 1280 px, también con una cifra de 10 caracteres sin puntos de corte y con texto de caracteres anchos. El tamaño de letra de la cifra destacada podrá adaptarse a su largo.
- RF-24: EL SISTEMA mantendrá accesible el contenido nuevo: cada sección que se muestre conserva un encabezado, y cada cifra se lee junto con su descripción.
- RF-25: EL SISTEMA mantendrá fijos el menú, las etiquetas y *placeholders* del formulario, los botones, el pie de página, los `aria-label` y los textos de las tarjetas de contacto.
- RF-26: CUANDO se compare la demo con su estado anterior, EL SISTEMA no mostrará diferencias de estructura ni de estilos más allá de las cambiadas a propósito (destacados de la demo y tarjeta de cifras), comprobado con la lista de diferencias de HTML y el volcado de layout a 375, 768 y 1280 px.

### Documentación
- RF-27: EL SISTEMA actualizará en la documentación del proyecto la lista de excepciones conocidas al "sin texto fijo": se retiran las cifras y los subtítulos de rubro; se conservan el símbolo `$` y se añaden la interfaz fija y los títulos neutros en español; y registrará el estado en la memoria.

## Requisitos no funcionales
- Sin dependencias nuevas.
- Idioma: mensajes y documentación en español; los textos del cliente pueden estar en cualquier idioma, mientras la interfaz y los títulos neutros siguen en español rioplatense (límite conocido hasta la spec de multi-idioma).
- Sin cambios de diseño más allá de RF-4, RF-5 y el tamaño de la cifra destacada (RF-23).
- Los tests existentes siguen en verde; solo las 3 comprobaciones de la versión del contrato cambian de "2.0" a "2.1".
- No hay generadores en uso: no se requiere migración de datos antiguos.

## Casos límite
- Una cifra con el valor de exactamente 10 caracteres es válida; con 11, no. Lo mismo con 40 (descripción), 80 (título) y 200 (subtítulo). Un emoji o una letra con tilde combinada cuentan como un carácter.
- Valor de cifra enviado como número (por ejemplo `14`) en lugar de texto: se rechaza por tipo.
- Una sola cifra: se muestra destacada, sola. Dos cifras: una destacada y una pequeña. Tres: una destacada y dos pequeñas.
- Tres cifras con valores de 10 caracteres a 375 px: no se desbordan ni se recortan (RF-23).
- Título de 80 caracteres en móvil, también sin espacios: no desborda.
- Título presente sin subtítulo, o al revés: ver RF-9 y RF-10; un subtítulo sin título usa el título neutro.
- Cifras repetidas o textos que duplican el menú: se aceptan.
- Texto de una sección omitida (por ejemplo, un título de productos sin productos): aceptado sin efecto (RF-12).
- Espacios al principio o al final, o textos solo con signos o emojis: se aceptan tal cual si no están vacíos (RF-13, RF-14).
- Datos antiguos (contrato 2.0) sin los campos nuevos: siguen siendo válidos, pero ya no muestran las cifras ni los subtítulos de antes, y los títulos pasan a ser los neutros.
- HTML o `<script>` escrito en un texto nuevo: se muestra literal (RF-17).

## Fuera de alcance
- El menú, las etiquetas y *placeholders* del formulario, los botones, el pie de página y los `aria-label`: siguen fijos en español rioplatense; el multi-idioma será otra spec.
- Los textos de las tarjetas de contacto ("Envianos un mensaje", "Escribinos por WhatsApp", "Respondemos rápido"). "Respondemos rápido" es una promesa del mismo tipo que se retira en el objetivo; queda registrada como excepción conocida pendiente de otra spec.
- Los títulos neutros en español para webs de otro idioma.
- Cualquier cambio de diseño más allá de RF-4, RF-5 y RF-23.
- El símbolo `$` del precio y el formato numérico (límite aceptado en la spec 001).
- Migrar datos antiguos: no hay generadores en uso.
- Corregir el test de documentos que depende de los fines de línea (pendiente aparte).
- Instalar `typescript` y cualquier otra mejora ajena a este cambio.

## Criterios de finalización
- Ninguna web construida con datos que no traigan cifras ni textos de sección muestra las cifras de antes ni los subtítulos de un rubro.
- Los datos válidos en la 2.0 siguen validando; los tests existentes pasan, con solo 3 comprobaciones de versión actualizadas; los casos nuevos tienen sus propios tests, con el límite exacto y uno por encima.
- La documentación generada declara la versión 2.1 y describe cada campo nuevo.
- La demo coincide con su estado anterior salvo lo cambiado a propósito, y las variantes sin campos nuevos y con todos en el máximo se ven correctas a 375, 768 y 1280 px.
- La construcción falla con datos inválidos mostrando todos los errores, y termina bien con datos válidos.
- `AGENTS.md` y `MEMORY.md` actualizados.
- Pull request revisado y fusionado con aprobación expresa del responsable.

## Dudas abiertas
Ninguna. Resueltas en la revisión: títulos de secciones omitidas (RF-12: se aceptan sin efecto), redacción de los títulos neutros (RF-9) y ajuste de tamaño de la cifra destacada (RF-23).
