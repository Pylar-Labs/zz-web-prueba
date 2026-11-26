# Contrato de datos del sitio

> Documento generado desde `src/content/site.schema.ts` con `npm run schema:export`. No se edita a mano.

Versión del contrato: 2.3

## Cómo se entregan los datos

Los datos del sitio son un archivo JSON (`src/content/site.data.json`). Se validan con `npm run validate` antes de construir la web, y la construcción (`npm run build`) falla si no son válidos.

Los datos no llevan un campo de versión: la versión es la de este contrato. Un campo `version` en los datos se rechaza como campo no previsto.

Los campos que no figuran en este documento se rechazan (`unrecognized_field`). Un campo opcional se omite quitándolo; si se incluye, no puede estar vacío. Las listas vacías equivalen a ausentes.

## Campos

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `language` | texto | No | Idioma de la interfaz fija de la web (opcional): `es` (español), `en` (inglés) o `pt` (portugués de Brasil), escritos exactos. Por defecto `es`. Cambia el menú, el formulario, los botones, el pie, las tarjetas de contacto, los `aria-label`, los mensajes de WhatsApp, los títulos neutros de sección y la etiqueta por defecto del botón de producto. No traduce lo que escribe el cliente. |
| `name` | texto | Sí | Nombre del negocio. Máximo 80 caracteres, una sola línea. |
| `tagline` | texto | Sí | Eslogan del negocio. Máximo 80 caracteres, una sola línea. |
| `description` | texto | Sí | Descripción del negocio (también para buscadores). Máximo 500 caracteres. |
| `hero` | objeto | Sí | Sección inicial de la web (obligatoria). |
| `hero.headline` | texto | Sí | Titular principal de la web. Máximo 80 caracteres, una sola línea. |
| `hero.subheadline` | texto | Sí | Subtítulo bajo el titular. Máximo 500 caracteres. |
| `hero.ctaPrimary` | objeto | Sí | Botón principal (obligatorio). |
| `hero.ctaPrimary.label` | texto | Sí | Texto del botón. Máximo 40 caracteres, una sola línea. |
| `hero.ctaPrimary.href` | texto | Sí | Destino del botón: URL completa http/https o ancla interna en minúsculas (por ejemplo #contacto) a una sección que exista con estos datos. |
| `hero.ctaSecondary` | objeto | No | Botón secundario (opcional). Si se incluye, lleva etiqueta y destino. |
| `hero.ctaSecondary.label` | texto | Sí, si existe `hero.ctaSecondary` | Texto del botón. Máximo 40 caracteres, una sola línea. |
| `hero.ctaSecondary.href` | texto | Sí, si existe `hero.ctaSecondary` | Destino del botón: URL completa http/https o ancla interna en minúsculas (por ejemplo #contacto) a una sección que exista con estos datos. |
| `about` | objeto | Sí | Sección "Quiénes somos" (obligatoria). |
| `about.title` | texto | Sí | Título de la sección "Quiénes somos". Máximo 80 caracteres. |
| `about.body` | texto | Sí | Texto de la sección "Quiénes somos". Máximo 500 caracteres. |
| `about.stats[]` | lista (0 a 3) | No | Cifras de "Quiénes somos" (opcional): hasta 3, la primera se muestra destacada. Sin cifras no se muestra la tarjeta de cifras. Lista vacía equivale a ausente. Nunca se muestra una cifra que no esté aquí. |
| `about.stats[].value` | texto | Sí, si existe `about.stats` | Valor de la cifra, por ejemplo "+14", "100%" o "24/7". Máximo 10 caracteres, una sola línea. Obligatorio junto con `label`. |
| `about.stats[].label` | texto | Sí, si existe `about.stats` | Descripción de la cifra, por ejemplo "años de experiencia". Máximo 40 caracteres, una sola línea. Obligatoria junto con `value`. |
| `about.highlights[]` | lista (0 a 5) | No | Destacados breves (opcional): hasta 5, de 40 caracteres como máximo cada uno. Lista vacía equivale a ausente. |
| `contact` | objeto | Sí | Datos de contacto (obligatorio): WhatsApp y al menos un email o un teléfono. |
| `contact.whatsapp` | texto | Sí | WhatsApp de contacto: solo dígitos con código de país (de 8 a 15), sin +, espacios ni guiones. Lo usan el botón flotante, el contacto y las consultas de cada producto. |
| `contact.email` | texto | No | Email de contacto. Formato válido, máximo 254 caracteres. Obligatorio si no hay teléfono. |
| `contact.phone` | texto | No | Teléfono de contacto. De 8 a 15 dígitos; admite +, espacios, guiones y paréntesis; se muestra tal cual. Obligatorio si no hay email. |
| `contact.address` | texto | No | Dirección (opcional). Máximo 150 caracteres, una sola línea. |
| `social` | objeto | No | Redes sociales (opcional). Solo Instagram y Facebook. |
| `social.instagram` | texto | No | URL de Instagram (opcional). http o https, hasta 2000 caracteres, sin usuario ni contraseña. |
| `social.facebook` | texto | No | URL de Facebook (opcional). http o https, hasta 2000 caracteres, sin usuario ni contraseña. |
| `services[]` | lista (1 a 8) | Sí | Servicios que ofrece el negocio: de 1 a 8. |
| `services[].icon` | texto | Sí | Ícono del servicio. Uno de: ShoppingBag, Truck, Gift, Leaf, Star, Phone, Mail, MapPin, MessageCircle, Instagram, Facebook. |
| `services[].title` | texto | Sí | Título del servicio. Máximo 80 caracteres. |
| `services[].description` | texto | Sí | Descripción del servicio. Máximo 500 caracteres. |
| `testimonials[]` | lista (0 a 9) | No | Testimonios (opcional): hasta 9. Lista vacía equivale a ausente: la sección no se muestra. |
| `testimonials[].name` | texto | Sí, si existe `testimonials` | Nombre de quien opina. Máximo 80 caracteres. |
| `testimonials[].role` | texto | No | Rol o relación con el negocio (opcional). Máximo 40 caracteres. |
| `testimonials[].text` | texto | Sí, si existe `testimonials` | Texto del testimonio. Máximo 500 caracteres. |
| `testimonials[].rating` | número | Sí, si existe `testimonials` | Valoración: número entero de 1 a 5. |
| `products[]` | lista (0 a 60) | No | Productos del catálogo (opcional): hasta 60. Lista vacía equivale a ausente: no hay catálogo. |
| `products[].id` | texto | Sí, si existe `products` | Identificador único del producto: solo minúsculas, números y guiones, de 1 a 60 caracteres. |
| `products[].name` | texto | Sí, si existe `products` | Nombre del producto. Máximo 80 caracteres. |
| `products[].description` | texto | Sí, si existe `products` | Descripción del producto. Máximo 500 caracteres. |
| `products[].image` | texto | Sí, si existe `products` | URL de la imagen del producto (http o https). |
| `products[].price` | número | No | Precio: número mayor que 0, hasta 2 decimales, máximo 99.999.999,99. Obligatorio si el catálogo muestra precios. Se muestra con el formato estándar de la moneda del catálogo (`productGridConfig.currency`, por defecto ARS) y del idioma de la web, con los decimales de esa moneda. En CLP y COP no admite decimales. |
| `products[].category` | texto | No | Categoría (opcional). Máximo 40 caracteres. Obligatoria si el catálogo agrupa por categoría; hasta 12 distintas y escritas siempre igual. |
| `productGridConfig` | objeto | No | Configuración del catálogo (opcional). Sin productos no tiene efecto. El catálogo usa siempre el WhatsApp de contacto. |
| `productGridConfig.showPrice` | verdadero/falso | No | Mostrar los precios (por defecto sí). |
| `productGridConfig.currency` | texto | No | Moneda de los precios del catálogo (opcional): ARS, USD, EUR, BRL, MXN, CLP, COP, PEN o UYU, escritas exactas. Por defecto ARS. CLP y COP no usan decimales. Sin productos no tiene efecto. |
| `productGridConfig.ctaLabel` | texto | No | Texto del botón de consulta de cada producto. Máximo 40 caracteres. Por defecto, según el idioma: "Consultar por WhatsApp" (es), "Ask on WhatsApp" (en), "Consultar pelo WhatsApp" (pt). |
| `productGridConfig.groupByCategory` | verdadero/falso | No | Agrupar los productos por categoría (por defecto no). |
| `sections` | objeto | No | Títulos y subtítulos de las secciones de servicios, productos, testimonios y contacto (opcional). Sin título cada sección muestra uno neutro; sin subtítulo no se muestra ninguno. |
| `sections.services` | objeto | No | Título y subtítulo de la sección de servicios (opcional). Si la sección no se muestra, no tiene efecto. |
| `sections.services.title` | texto | No | Título de la sección de servicios (opcional). Máximo 80 caracteres, una sola línea. Por defecto, según el idioma: "Servicios" (es), "Services" (en), "Serviços" (pt). |
| `sections.services.subtitle` | texto | No | Subtítulo de la sección de servicios (opcional). Máximo 200 caracteres, una sola línea. Sin subtítulo no se muestra ninguno. |
| `sections.products` | objeto | No | Título y subtítulo de la sección de productos (opcional). Si la sección no se muestra, no tiene efecto. |
| `sections.products.title` | texto | No | Título de la sección de productos (opcional). Máximo 80 caracteres, una sola línea. Por defecto, según el idioma: "Productos" (es), "Products" (en), "Produtos" (pt). |
| `sections.products.subtitle` | texto | No | Subtítulo de la sección de productos (opcional). Máximo 200 caracteres, una sola línea. Sin subtítulo no se muestra ninguno. |
| `sections.testimonials` | objeto | No | Título y subtítulo de la sección de testimonios (opcional). Si la sección no se muestra, no tiene efecto. |
| `sections.testimonials.title` | texto | No | Título de la sección de testimonios (opcional). Máximo 80 caracteres, una sola línea. Por defecto, según el idioma: "Testimonios" (es), "Testimonials" (en), "Depoimentos" (pt). |
| `sections.testimonials.subtitle` | texto | No | Subtítulo de la sección de testimonios (opcional). Máximo 200 caracteres, una sola línea. Sin subtítulo no se muestra ninguno. |
| `sections.contact` | objeto | No | Título y subtítulo de la sección de contacto (opcional). Si la sección no se muestra, no tiene efecto. |
| `sections.contact.title` | texto | No | Título de la sección de contacto (opcional). Máximo 80 caracteres, una sola línea. Por defecto, según el idioma: "Contacto" (es), "Contact" (en), "Contato" (pt). |
| `sections.contact.subtitle` | texto | No | Subtítulo de la sección de contacto (opcional). Máximo 200 caracteres, una sola línea. Sin subtítulo no se muestra ninguno. |

## Reglas entre campos

Estas reglas relacionan varios campos y no se pueden expresar en el JSON Schema.

| Código | Regla |
|---|---|
| `missing_contact_method` | En `contact` debe haber al menos un email o un teléfono, además del WhatsApp. |
| `required` | El precio de cada producto es obligatorio si el catálogo muestra precios (por defecto sí); la categoría, si el catálogo agrupa por categoría. |
| `duplicate_id` | Los identificadores de producto no se repiten. |
| `inconsistent_category` | Dos categorías que difieren solo en mayúsculas o espacios se rechazan: hay que escribirlas igual. |
| `too_many_categories` | Hasta 12 categorías distintas. |
| `unknown_anchor` | Los botones solo enlazan a secciones que existen con esos datos: `#inicio`, `#nosotros`, `#servicios` y `#contacto` siempre; `#productos` solo con productos; `#testimonios` solo con testimonios. |
| `price_currency_decimals` | En CLP y COP (monedas sin decimales) los precios no llevan decimales; se comprueba también si los precios están ocultos. Sin `productGridConfig.currency` la moneda es ARS. |

## Informe de validación

`npm run validate -- --json` devuelve un informe estructurado; sin `--json` imprime el mismo contenido como texto legible. Los errores salen ordenados por ruta y sin tope. Se informan todos a la vez: una lista que excede su máximo da el error de cantidad y además los errores de cada uno de sus elementos.

```json
{
  "ok": false,
  "schemaVersion": "2.3",
  "errors": [
    { "path": "products[2].price", "code": "price_not_positive", "message": "…", "expected": ["…"] }
  ]
}
```

`path` es la ruta exacta del campo (con la posición en las listas), `code` es estable, `message` está en español y `expected` solo aparece cuando hay valores permitidos.

## Códigos de error

| Código | Significado |
|---|---|
| `required` | Falta un campo obligatorio. |
| `invalid_type` | El valor no es del tipo esperado (texto, número, lista, objeto o verdadero/falso). |
| `empty` | Texto vacío o solo con espacios. |
| `too_long` | Texto más largo que el máximo permitido. |
| `line_break` | Salto de línea donde solo se admite una línea. |
| `too_few` | Lista con menos elementos que el mínimo. |
| `too_many` | Lista con más elementos que el máximo. |
| `unrecognized_field` | Campo que no forma parte del contrato. |
| `removed_field` | Campo que existió en una versión anterior y fue eliminado; el mensaje indica qué usar. |
| `invalid_whatsapp` | WhatsApp con formato inválido (solo dígitos con código de país, de 8 a 15). |
| `invalid_phone` | Teléfono con formato inválido (8 a 15 dígitos; solo +, espacios, guiones y paréntesis). |
| `invalid_email` | Email con formato inválido o de más de 254 caracteres. |
| `unknown_icon` | Ícono que no está disponible; `expected` lista los permitidos. |
| `unknown_language` | Idioma que el template no incluye (solo `es`, `en` y `pt`, escritos exactos); `expected` lista los permitidos. |
| `unknown_currency` | Moneda que el template no incluye (solo ARS, USD, EUR, BRL, MXN, CLP, COP, PEN y UYU, escritas exactas); `expected` lista las permitidas. |
| `price_not_positive` | Precio igual o menor que 0. |
| `price_too_high` | Precio mayor que 99.999.999,99. |
| `price_too_many_decimals` | Precio con más de 2 decimales. |
| `price_currency_decimals` | Precio con decimales en una moneda que no los usa (CLP y COP); el mensaje nombra la moneda. |
| `invalid_rating` | Valoración que no es un entero de 1 a 5. |
| `invalid_id` | Identificador de producto con caracteres no permitidos o fuera de 1 a 60. |
| `invalid_url` | URL que no es http/https completa, con espacios, con credenciales o de más de 2000 caracteres. |
| `invalid_anchor` | Ancla interna con formato inválido (minúsculas, números y guiones). |
| `missing_contact_method` | Falta un email o un teléfono además del WhatsApp. |
| `duplicate_id` | Identificador de producto repetido. |
| `inconsistent_category` | Categoría escrita distinto (mayúsculas o espacios) que otra ya usada. |
| `too_many_categories` | Más de 12 categorías distintas. |
| `unknown_anchor` | Botón que apunta a una sección que no existirá con estos datos; `expected` lista las disponibles. |
| `invalid_value` | Valor no válido por otra razón. |

## Registro de cambios

### 2.3

- Nuevo campo opcional `productGridConfig.currency`: la moneda de los precios del catálogo (`ARS`, `USD`, `EUR`, `BRL`, `MXN`, `CLP`, `COP`, `PEN` o `UYU`, escritos exactos). Sin el campo se usa `ARS`. Un valor que no sea uno de los nueve se rechaza con el error `unknown_currency`, que lista las monedas permitidas.
- El precio se muestra con el formato estándar de la moneda en el idioma de la web (antes: siempre `$` y formato argentino), siempre con los decimales de la moneda. Esto cambia el aspecto de los precios de las webs ya generadas.
- CLP y COP no usan decimales: un precio con decimales en esas monedas se rechaza con el error `price_currency_decimals`, también si los precios están ocultos.
- Compatible con la 2.2, la 2.1 y la 2.0: los datos válidos en esas versiones siguen siéndolo.

### 2.2

- Nuevo campo opcional `language` en la raíz: `es`, `en` o `pt` (portugués de Brasil). Toda la interfaz fija (menú, formulario, botones, pie, tarjetas de contacto, `aria-label`, mensajes de WhatsApp, títulos neutros de sección y etiqueta por defecto del botón de producto) sale en ese idioma.
- Sin `language` se usa `es`, y la web es la misma de antes. Un valor que no sea uno de los tres se rechaza con el error `unknown_language`, que lista los valores permitidos.
- Compatible con la 2.1 y la 2.0: los datos válidos en esas versiones siguen siéndolo. El contenido del cliente no se traduce y no depende de `language`.

### 2.1

- Nuevo campo opcional `about.stats`: de 0 a 3 cifras de "Quiénes somos", cada una con `value` (hasta 10 caracteres) y `label` (hasta 40). Reemplaza las cifras que el template traía escritas.
- Nuevo campo opcional `sections`: título (hasta 80 caracteres) y subtítulo (hasta 200) de las secciones de servicios, productos, testimonios y contacto. Sin título se muestra uno neutro ("Servicios", "Productos", "Testimonios" o "Contacto"); sin subtítulo no se muestra ninguno.
- Compatible con la 2.0: los datos válidos en la 2.0 siguen siéndolo, pero ya no muestran las cifras ni los subtítulos que antes traía el template.

### 2.0

- Los datos pasan de un módulo TypeScript a un archivo JSON validado por este esquema.
- Se retira el número de WhatsApp propio del catálogo: el catálogo usa el de contacto.
- Productos y configuración del catálogo pasan a ser opcionales.
- Se rechazan los campos no previstos y se aplican reglas de formato y límites.

### 1.0

- Forma original: datos como módulo TypeScript sin validación.
