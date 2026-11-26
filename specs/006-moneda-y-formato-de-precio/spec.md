# Spec 006 — Moneda y formato de precio
> Solo el QUÉ y el POR QUÉ. Nada de stack, arquitectura ni nombres de archivos (eso va en plan.md).

## Contexto y objetivo
Todos los precios de las webs generadas salen con el símbolo `$` y el formato numérico argentino, sea cual sea el negocio o el idioma de la web. En una web en inglés, "$1.800" se lee como dólares aunque el negocio cobre en pesos, y un negocio chileno o brasileño publicaría un precio en una moneda que no es la suya. Además el formato actual es irregular: un precio de 1800 sale "$1.800", pero uno de 1800,50 sale "$1.800,5" (sin el cero final). La spec 001 lo dejó como limitación consciente ("la moneda no es un dato").

El objetivo es que **la moneda sea un dato del negocio y que el precio se muestre con el formato estándar de esa moneda en el idioma de la web**, sin que nunca se publique un precio distinto del que escribió el cliente.

## Aprobaciones previas (decisiones del responsable)
- La moneda es un campo opcional de la configuración del catálogo; sin él se usa el peso argentino (ARS), como hoy.
- Monedas válidas: una lista cerrada y corta, escrita exacta en mayúsculas: ARS, USD, EUR, BRL, MXN, CLP, COP, PEN y UYU. Cualquier otra se rechaza.
- Formato estándar de la moneda y del idioma de la web, con un solo comportamiento. Cambia el aspecto actual del precio (por ejemplo "$1.800" pasa a "$ 1.800,00"), aceptado porque no hay generadores en uso. Esta spec rompe a propósito, y solo en el precio, la regla de las specs 003 y 004 de que la web en español no cambia.
- Formato de los números: inglés al estilo de Estados Unidos y portugués al de Brasil; en español, los separadores siguen al país de la moneda (ARS, USD, EUR y BRL como Argentina; MXN como México; CLP como Chile; COP como Colombia; PEN como Perú; UYU como Uruguay), para que un negocio no lea sus precios con los separadores al revés.
- Un precio con decimales en una moneda que no los usa (CLP y COP) se rechaza con un error claro; nunca se redondea en silencio. Se valida siempre, también con los precios ocultos.
- Los precios enteros se muestran siempre con dos decimales en las monedas que los usan.
- El formato de números y monedas no es texto de interfaz: son datos regionales estándar que provee la plataforma. No se enmienda la constitución; se aclara en `AGENTS.md`.
- Los textos exactos esperados (nueve monedas por tres idiomas) los redacta el plan y el responsable los aprueba antes de pasar a las tareas.

## Usuarios / actores
- **Servicio generador:** indica la moneda del negocio al rellenar los datos del catálogo.
- **Cliente final (dueño del negocio):** quiere que sus precios aparezcan en su moneda y como los espera su público.
- **Visitante de la web:** debe entender en qué moneda está cada precio y no ver un precio distinto del real.
- **Desarrollador de Pylar Labs:** mantiene el contrato y necesita que el formato sea verificable y estable.

## Historias de usuario
- H1: Como servicio generador quiero indicar la moneda del catálogo para que los precios salgan en la moneda del negocio y no en pesos por defecto.
- H2: Como visitante de una web en inglés, portugués o español quiero ver los precios con los separadores que espero para leerlos sin confundirlos.
- H3: Como visitante quiero que una moneda ambigua se distinga (pesos frente a dólares) para no entender mal el precio.
- H4: Como cliente final quiero que ningún precio se redondee ni cambie al mostrarse para no publicar un precio equivocado.
- H5: Como desarrollador quiero que el cambio sea compatible con los datos actuales para no tener que migrar nada.

## Requisitos funcionales (criterios de aceptación en EARS)

### Moneda en los datos
- RF-1: EL SISTEMA aceptará en la configuración del catálogo un campo opcional `currency` con uno de estos códigos exactos: ARS, USD, EUR, BRL, MXN, CLP, COP, PEN o UYU.
- RF-2: MIENTRAS falte `currency`, o falte toda la configuración del catálogo, EL SISTEMA usará ARS.
- RF-3: SI `currency` es un texto que no es uno de los nueve códigos (por ejemplo `ars`, `JPY`, un código con espacios o vacío), ENTONCES EL SISTEMA rechazará los datos con un error de código estable propio, en la ruta de `currency`, que liste las monedas válidas; no normalizará ni sustituirá el código.
- RF-4: SI `currency` no es un texto (por ejemplo un número o `null`), ENTONCES EL SISTEMA rechazará los datos por tipo, con la misma forma de error que los demás.
- RF-5: MIENTRAS no haya productos, EL SISTEMA aceptará `currency` sin efecto.

### Formato del precio
- RF-6: CUANDO se muestre un precio, EL SISTEMA lo escribirá con el formato estándar de la moneda en el idioma de la web: inglés al estilo de Estados Unidos, portugués al de Brasil y español con los separadores del país de la moneda (ARS, USD, EUR y BRL: Argentina; MXN: México; CLP: Chile; COP: Colombia; PEN: Perú; UYU: Uruguay).
- RF-7: EL SISTEMA mostrará siempre dos decimales en las monedas que los usan (ARS, USD, EUR, BRL, MXN, PEN y UYU) y ninguno en las que no (CLP y COP).
- RF-8: EL SISTEMA mostrará el símbolo o el código que usa el estándar regional de ese idioma para esa moneda, de modo que una moneda no se confunda con la de otro idioma (por ejemplo, pesos argentinos en una web en inglés se muestran como "ARS", no con el símbolo de dólar).
- RF-9: EL SISTEMA no redondeará ni modificará el valor del precio al mostrarlo. El ruido de coma flotante que el contrato ya tolera (por ejemplo 0,30000000000000004) no cuenta como un decimal.
- RF-10: SI un precio tiene más decimales de los que admite la moneda (más de 2 en general; cualquier decimal en CLP y COP), ENTONCES EL SISTEMA rechazará los datos con un error de código estable propio, distinto del de "más de 2 decimales", en la ruta del precio, cuyo mensaje nombre la moneda. La comprobación se hará siempre, con independencia de que los precios se muestren.
- RF-11: EL SISTEMA no partirá el símbolo y el número del precio en líneas distintas, usando solo el espacio no separable que provee la plataforma, sin añadir marcado ni clases al HTML.

### Contrato de datos
- RF-12: EL SISTEMA publicará el contrato en la versión 2.3, compatible con la 2.2, la 2.1 y la 2.0: los datos válidos en ellas seguirán siéndolo.
- RF-13: EL SISTEMA describirá en la documentación del contrato el campo nuevo (significado, valores permitidos, valor por defecto), el error nuevo y la regla de decimales por moneda, corregirá la descripción del precio (que hoy dice que se muestra con el símbolo `$` y formato argentino) y anotará el cambio en su registro de cambios; los documentos generados reflejarán la versión 2.3.
- RF-14: EL SISTEMA informará de los errores nuevos con la misma forma que los demás (ruta exacta, código estable, mensaje en español), sumados al resto en una sola lista, y seguirá rechazando los campos no previstos. SI `currency` es inválida, ENTONCES no evaluará la regla de decimales y solo informará el error de la moneda.
- RF-15: ANTES de pasar a las tareas, EL SISTEMA contará con la tabla de los textos exactos (nueve monedas por tres idiomas), aprobada por el responsable.

### Resultado visible
- RF-16: CUANDO los datos no traen moneda y la web está en español, EL SISTEMA producirá la misma web que antes del cambio salvo el texto de los precios y, solo si RF-17 lo exige, un ajuste mínimo de estilo.
- RF-17: CUANDO los datos traen el precio máximo permitido con el texto de precio más ancho de cada idioma (17 caracteres: USD en español, ARS en inglés y portugués), EL SISTEMA producirá una web sin recortes ni desbordes a 375, 768 y 1280 px.
- RF-18: EL SISTEMA dispondrá de datos de ejemplo, además de la demo, con el texto de precio más ancho de cada idioma y con una moneda sin decimales (CLP) y una con variante regional propia (MXN), y de tests que cubran las 27 combinaciones de moneda e idioma.

### Documentación
- RF-19: EL SISTEMA actualizará en la documentación del proyecto la lista de excepciones conocidas (se retira el símbolo `$` con formato argentino), aclarará que el formato de números y monedas son datos regionales de la plataforma y no texto de interfaz, y el estado en la memoria.

## Requisitos no funcionales
- Sin dependencias nuevas.
- Idioma: mensajes de error y documentación en español.
- El formato debe verificarse con el texto exacto de cada moneda y cada idioma, para que un cambio de la plataforma que lo altere se detecte. Debe ser el mismo en las versiones de Node admitidas (desde la mínima exigida hasta la que usa el servicio generador); si difiere, se informa antes de implementar.
- Si una actualización de Node cambia algún texto esperado, los tests lo señalan y la tabla aprobada solo se actualiza con aprobación expresa.
- Sin cambios de diseño más allá de que un precio más largo no se corte.
- No hay generadores en uso: no se requiere migración de datos.

## Casos límite
- Precio entero (1800) y con decimales (1800,50): ambos con dos decimales en ARS, USD, EUR, BRL, MXN, PEN y UYU; el entero sin decimales en CLP y COP.
- Precio mínimo (0,01) y máximo (99.999.999,99): se muestran completos, sin redondear. El máximo es el mismo para todas las monedas.
- Moneda en un idioma que no es el de su país (ARS en inglés, USD en español, EUR en portugués): se muestra con el símbolo o código del estándar de ese idioma (por ejemplo "ARS 1,800.00", "US$ 1.800,00", "€ 1.800,00").
- En español, varios pesos comparten el símbolo `$` (ARS, MXN, CLP, COP y UYU), como es la convención de cada país; no se desambiguan entre sí.
- Precio con más de 2 decimales (por ejemplo 1,005): se rechaza como hoy.
- Precio con decimales en CLP o COP (por ejemplo 1800,5): se rechaza (RF-10), también con los precios ocultos; un entero es válido.
- `currency` inválida junto con un precio con decimales: solo se informa el error de la moneda (RF-14).
- `currency` con minúsculas (`usd`), con espacios, vacía o fuera de la lista: se rechaza; solo valen los nueve códigos exactos.
- `currency` indicada sin productos: válida y sin efecto. Con productos pero con los precios ocultos: se aplica la comprobación de decimales (RF-10).
- Datos 2.2 con precios hasta 2 decimales y sin moneda: siguen siendo válidos y se muestran en ARS.
- Un catálogo con productos de varias monedas: no es posible; la moneda es una por catálogo.
- El texto "Consultar" del botón de producto, los nombres y las descripciones: no cambian; un precio escrito dentro de una descripción no se toca.
- Cada construcción es independiente: no queda estado de otro idioma o moneda.

## Fuera de alcance
- Más monedas que las nueve de la lista, y monedas con otros números de decimales (por ejemplo JPY). CLP y COP se tratan como monedas sin decimales según el estándar regional de la plataforma, aunque el estándar ISO 4217 defina 2 para COP.
- Un máximo de precio distinto por moneda.
- Una moneda distinta por producto, conversión entre monedas, impuestos o descuentos.
- Precios "desde", rangos o precios por unidad.
- Símbolos o separadores personalizados escritos por el cliente.
- Cómo leen los lectores de pantalla el espacio no separable y los códigos de moneda.
- Cambiar el formato de fechas, de números que no sean precios o el año del pie.
- Más idiomas ni variantes regionales de los tres idiomas incluidos, salvo los separadores del español según la moneda (RF-6).

## Criterios de finalización
- Los datos válidos en la 2.0, la 2.1 y la 2.2 siguen validando, y una web en español sin moneda solo cambia en el texto de los precios.
- Cada una de las nueve monedas se muestra con el texto exacto de la tabla aprobada en español, inglés y portugués.
- Una moneda inválida, un tipo equivocado y un precio con decimales no admitidos hacen fallar la validación y la construcción con la lista completa de errores.
- La documentación generada declara la versión 2.3 y describe el campo, el error y la regla de decimales.
- Los casos nuevos tienen sus propios tests; los tests existentes pasan sin modificar más que las comprobaciones de versión (ningún test existente comprueba hoy el texto del precio).
- Sin recortes ni desbordes a 375, 768 y 1280 px con el precio máximo en cada idioma.
- `AGENTS.md` y `MEMORY.md` actualizados.
- Pull request revisado y fusionado con aprobación expresa del responsable.

## Dudas abiertas
Ninguna. Resueltas en la revisión previa: de dónde sale la moneda (campo opcional del catálogo, ARS por defecto), lista de monedas (nueve códigos exactos), formato (estándar de la moneda y del idioma; en español, separadores del país de la moneda), decimales en monedas sin ellos (se rechazan, siempre), precios enteros (siempre con dos decimales) y registro de la excepción de la constitución (se aclara en `AGENTS.md`, sin enmienda).
