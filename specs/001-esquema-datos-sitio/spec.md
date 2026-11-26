# Spec 001 — Esquema de datos del sitio
> Solo el QUÉ y el POR QUÉ. Nada de stack, arquitectura ni nombres de archivos (eso va en plan.md).

## Contexto y objetivo
El servicio web de Pylar Labs genera la web de cada cliente a partir de su solicitud, rellenando los datos del sitio (negocio, hero, contacto, servicios, testimonios, productos). Hoy esos datos no tienen un contrato formal: qué campos existen, cuáles son obligatorios y qué valores son válidos solo se deduce leyendo el template. Un dato mal formado (p. ej. un WhatsApp con "+") se descubre al ver la web rota, y en un flujo automático eso es caro de depurar. El objetivo es definir un esquema que **describa** los datos del sitio y **valide** automáticamente lo que genera el servicio, rechazando lo inválido con errores claros antes de publicar, y garantizando que toda web con datos válidos queda completa y sin enlaces rotos.

## Usuarios / actores
- **Servicio web de Pylar Labs (generador):** produce los datos a partir de la solicitud del cliente y consume el resultado de la validación.
- **Desarrollador de Pylar Labs:** mantiene el template y necesita entender y depurar rechazos.
- **Cliente final:** no interactúa con el esquema; se beneficia de webs sin datos rotos.

## Cambio de contrato aprobado
El responsable del proyecto aprobó expresamente estos cambios respecto a la forma actual de los datos:
- Se retira el número de WhatsApp propio del catálogo; el catálogo usa siempre el de contacto.
- Productos y la configuración del catálogo pasan a ser opcionales.
- Cambian las reglas de obligatoriedad (ver RF-10 a RF-15) y se rechazan los campos no previstos.
- La regla de la documentación del proyecto que exige mantener sincronizados dos números de WhatsApp queda obsoleta y se actualiza.
- La versión inicial del contrato es 1.0 y esta spec lo lleva a **2.0**.

## Historias de usuario
- H1: Como generador quiero conocer exactamente qué datos acepta el sitio (obligatorios, opcionales, formatos, límites) para producir datos válidos a la primera.
- H2: Como generador quiero validar mis datos antes de escribirlos y recibir la lista completa de errores para corregirlos todos en una sola pasada.
- H3: Como desarrollador quiero que los errores indiquen campo, código y motivo para depurar sin leer el template.
- H4: Como desarrollador quiero que un cliente sin testimonios, productos o redes sociales produzca una web completa, sin huecos ni enlaces rotos, para no inventar contenido.
- H5: Como desarrollador quiero que ningún dato inválido llegue a una web publicada, aunque alguien edite los datos a mano.

## Requisitos funcionales (criterios de aceptación en EARS)

### Cuándo y cómo se valida
- RF-1: EL SISTEMA ofrecerá un paso de validación independiente que el generador pueda ejecutar sobre unos datos, sin construir la web, y que informe si son válidos y, si no, la lista de errores.
- RF-2: CUANDO se construye la web, EL SISTEMA validará los datos con las mismas reglas; SI son inválidos, ENTONCES la construcción fallará mostrando los errores y no se generará la web.
- RF-3: EL SISTEMA aplicará exactamente las mismas reglas y producirá los mismos errores en el paso independiente y en la construcción.

### Errores
- RF-4: SI hay uno o más errores, ENTONCES EL SISTEMA rechazará todos los datos; no corregirá, normalizará, recortará ni descartará ningún valor.
- RF-5: SI hay varios errores, ENTONCES EL SISTEMA informará de todos ellos, sin tope, en un orden determinista (los mismos datos producen siempre los mismos errores en el mismo orden).
- RF-6: EL SISTEMA indicará por cada error: la ruta exacta del campo (incluida la posición si está en una lista), un código estable, un mensaje en español y, cuando aplique, los valores permitidos (p. ej. íconos o secciones disponibles).
- RF-7: EL SISTEMA presentará el resultado de dos formas equivalentes: texto legible para personas y datos estructurados para el generador.
- RF-8: SI un dato es de un tipo incorrecto, nulo, vacío o numéricamente inválido (no es un número, infinito), ENTONCES EL SISTEMA lo informará como un error más con su ruta, sin interrumpir la validación del resto.
- RF-9: SI los datos contienen un campo no previsto, ENTONCES EL SISTEMA lo rechazará; SI el campo fue retirado del contrato (como el número propio del catálogo), ENTONCES el error indicará que fue eliminado y qué usar en su lugar.

### Qué es obligatorio y qué es opcional
- RF-10: EL SISTEMA exigirá: nombre del negocio, eslogan, descripción, hero (titular, subtítulo y botón principal), "Quiénes somos" (título y texto), contacto (WhatsApp y al menos email o teléfono) y entre 1 y 8 servicios.
- RF-11: EL SISTEMA tratará como opcionales: testimonios, productos y su configuración, Instagram y Facebook (cada una por separado), botón secundario del hero, destacados de "Quiénes somos", dirección, el email o el teléfono que no se use, el rol del testimonio y la categoría del producto.
- RF-12: EL SISTEMA exigirá dentro de cada elemento: servicio (ícono, título, descripción); testimonio (nombre, texto, valoración); producto (identificador, nombre, descripción, imagen); botón (etiqueta y enlace, ambos o ninguno).
- RF-13: EL SISTEMA exigirá la categoría del producto solo si el catálogo agrupa por categoría, y exigirá el precio solo si el catálogo muestra precios.
- RF-14: SI hay productos y no hay configuración del catálogo, ENTONCES EL SISTEMA usará los valores por defecto: mostrar precio sí, agrupar por categoría no y la etiqueta de consulta estándar. SI hay configuración del catálogo sin productos, ENTONCES EL SISTEMA la aceptará sin efecto.
- RF-15: MIENTRAS un dato opcional esté ausente, EL SISTEMA aceptará los datos; SI un texto o valor opcional está presente pero vacío, ENTONCES lo rechazará (para omitirlo se quita el campo); las listas vacías de testimonios, productos y destacados se aceptan y equivalen a ausentes.

### Web completa y coherente
- RF-16: MIENTRAS falte un dato opcional, EL SISTEMA mostrará la web sin la sección o elemento correspondiente, sin huecos, enlaces vacíos ni referencias a él en el menú o el pie. Aplica a productos, testimonios, redes sociales, email, teléfono, dirección y destacados.
- RF-17: EL SISTEMA aceptará un enlace interno solo si apunta a una sección que existirá con esos datos (p. ej. productos exige productos); el error listará las secciones disponibles.
- RF-18: EL SISTEMA usará siempre el WhatsApp de contacto en el botón flotante, el botón de contacto y la consulta de cada producto.
- RF-19: CUANDO no haya productos, EL SISTEMA aceptará los datos y producirá una web solo de servicios y contacto, completa y sin enlaces rotos.

### Reglas de valores
- RF-20: WhatsApp: solo dígitos con código de país, de 8 a 15 dígitos, sin "+", espacios ni guiones.
- RF-21: Teléfono: puede incluir "+", espacios, guiones y paréntesis; debe contener de 8 a 15 dígitos y ninguna letra; se muestra tal cual se recibe.
- RF-22: Email: formato válido, máximo 254 caracteres.
- RF-23: Ícono de servicio: debe ser uno de los disponibles; el error los lista. La lista aceptada por el esquema será siempre la misma que el template puede mostrar.
- RF-24: Precio: número finito mayor que 0, hasta 2 decimales, máximo 99.999.999,99; se muestra tal como se recibe.
- RF-25: Valoración del testimonio: entero de 1 a 5.
- RF-26: Imágenes, botones y redes sociales: solo URLs http o https, sin usuario ni contraseña, sin espacios y de hasta 2000 caracteres; se rechaza cualquier otro esquema (`javascript:`, `data:`, `mailto:`, `tel:`).
- RF-27: Enlaces internos de botones: en minúsculas y no vacíos; un ancla vacía (`#`) o desconocida se rechaza.
- RF-28: Redes sociales: solo Instagram y Facebook; no se valida que la URL pertenezca al dominio de la red.
- RF-29: Identificador de producto: solo minúsculas, números y guiones, de 1 a 60 caracteres, único entre productos.
- RF-30: Categorías de productos: máximo 12 distintas; dos que difieran solo en mayúsculas o espacios se rechazan como inconsistentes.
- RF-31: Cantidades: servicios 1–8, productos 0–60, testimonios 0–9, destacados de "Quiénes somos" 0–5. Superar un máximo se rechaza, nunca se recorta.
- RF-32: Longitudes máximas, medidas en caracteres tal como los ve una persona:

| Tipo | Máximo | Campos |
|---|---|---|
| Etiqueta | 40 | etiqueta de botones, categoría, rol del testimonio, cada destacado |
| Corto | 80 | nombre del negocio, eslogan, titular y títulos, nombre de producto, nombre de testimonio |
| Largo | 500 | descripción del negocio, subtítulo del hero, texto de "Quiénes somos", descripciones de servicios y productos, texto del testimonio |
| Dirección | 150 | dirección |

- RF-33: Un campo obligatorio necesita al menos un carácter visible; un texto solo con espacios cuenta como vacío.
- RF-34: Los textos se interpretan como texto plano: el HTML escrito en ellos se muestra literalmente y nunca se ejecuta. Los saltos de línea se rechazan en etiquetas y textos cortos y se permiten en textos largos.

### Documentación del contrato
- RF-35: EL SISTEMA describirá cada campo (significado, obligatoriedad, formato y límites) en un único lugar consultable por el generador y por los desarrolladores.
- RF-36: EL SISTEMA publicará con el esquema un número de versión y un registro breve de cambios; los datos no llevan la versión.

## Requisitos no funcionales
- Idioma: descripción y mensajes de error en español; los nombres de campo siguen la convención de código (inglés).
- Los mensajes de error deben ser legibles por una persona; los códigos de error, estables entre ejecuciones.
- La validación no requiere conexión a servicios externos y no comprueba que las URL existan.
- Limitación conocida y consciente: el precio se muestra con el símbolo `$` y formato argentino; la moneda no es un dato. Es una excepción aceptada al principio de la constitución de que el contenido vive en los datos.

## Casos límite
- Listas vacías de testimonios o productos: válido; la sección se omite, con menú, pie y enlaces coherentes.
- Lista de servicios vacía: inválido (mínimo 1).
- Datos vacíos, nulos o con tipos incorrectos en cualquier nivel: errores con ruta, no un fallo del propio validador.
- Los límites exactos son válidos; uno por encima se rechaza (80/40/500/150/254, 8–15 dígitos, cantidades, 1–5, 2 decimales).
- Campos opcionales presentes pero vacíos: inválido.
- Precio ausente con precios ocultos: válido; precio presente con precios ocultos: debe ser válido igualmente.
- Catálogo con una sola categoría o un solo producto: válido.
- Varios errores a la vez en distintos niveles: se informan todos, en orden determinista.
- Un solo problema que afecta a varios campos: se informa sin duplicar el motivo ni ocultar otros errores.
- Contenido en el máximo de todos los límites a la vez: la web debe seguir siendo usable en móvil.

## Fuera de alcance
- Paleta de colores y tipografía (se tratará en otra spec).
- Textos fijos del template, salvo que el menú y el pie deben omitir enlaces a secciones ausentes (RF-16).
- Multi-idioma dentro de una misma web.
- Moneda y formato numérico regional configurables.
- Clientes sin WhatsApp (requerirían otra spec o template).
- Botones de llamada o correo (`tel:`, `mailto:`) y redes distintas de Instagram y Facebook.
- Validar el dominio de las redes sociales o que las URL existan.
- Subida o alojamiento de imágenes (solo se valida la URL).
- Envío del formulario de contacto.
- Cambios en la lógica del generador.
- Versión dentro de los datos (puede añadirse en una spec futura).

## Criterios de finalización
- Existe un conjunto de casos de ejemplo, válidos e inválidos, que cubre cada requisito, incluidos los límites exactos y uno por encima. Cada caso tiene su resultado esperado documentado y se puede ejecutar con el paso de validación (RF-1).
- Los datos demo están actualizados a la nueva forma y son válidos.
- Con datos válidos la construcción termina sin errores; con datos inválidos falla mostrando todos los errores con ruta, código y mensaje.
- Una web de solo servicios y contacto (sin productos, testimonios ni redes) se construye completa y sin enlaces rotos; se comprueba en vista móvil de 375 px.
- Una web con todo en el máximo permitido se construye y se ve correcta en móvil.
- La documentación del contrato está publicada con versión 2.0 y su registro de cambios, y la regla de WhatsApp duplicado de la documentación del proyecto está actualizada.

## Dudas abiertas
- Resuelta: no hay generadores ni datos en uso todavía; el cambio de contrato no requiere migración ni compatibilidad con consumidores previos.
- [NECESITA ACLARACIÓN] Cómo ejecutar los casos de ejemplo sin añadir dependencias (el proyecto no tiene tests y añadir dependencias requiere aprobación): se decide en el plan.
