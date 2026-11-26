# Plan 004 — Interfaz fija en el idioma del cliente (multi-idioma)
> El CÓMO. Debe cumplir `docs/constitution.md` y cubrir todos los RF de `spec.md`.

## Enfoque técnico
Todo el texto fijo de la interfaz se concentra en **un único archivo de traducciones** del template, con las mismas claves en español, inglés y portugués. Un campo opcional `language` en los datos elige el idioma, y los componentes dejan de llevar texto escrito: lo leen del idioma resuelto. Se reutiliza lo que ya existe (tipos de texto, segunda pasada de reglas, `applyDefaults`, `check-dist`, `compare-builds`); no hay dependencias nuevas.

1. **Archivo de traducciones** (`ui-text.ts`): un objeto por idioma (`es`, `en`, `pt`) con 28 textos agrupados (`nav`, `aria`, `footer`, `form`, `info`, `whatsapp`, `catalog`, `message`) y un dato de metadatos (`htmlLang`). Solo datos, sin lógica ni tipos de TypeScript propios del compilador, como `icons.ts`, para que lo importen también los scripts de Node. El español contiene **exactamente** los textos de hoy.
2. **Campo `language`:** `z.enum(["es","en","pt"])` opcional en la raíz. Con enum, el JSON Schema trae la lista de valores (útil para el generador). El error de Zod por un valor fuera de la lista se traduce al **código nuevo `unknown_language`**, con `expected` = los tres valores, igual que `unknown_icon`. Un tipo equivocado (`null`, número, lista, objeto) conserva `invalid_type`. Se comprueba en las pruebas que Zod lo reporta como se espera; si no, se usa una regla propia como la de los íconos.
3. **Valores por defecto que dependen del idioma:** `applyDefaults` toma `language ?? "es"`, devuelve en los datos resueltos `language` y `ui` (las traducciones de ese idioma) y completa con ellas los títulos neutros de sección (iguales al menú) y la etiqueta del botón de producto. `DEFAULT_SECTION_TITLES` y `DEFAULT_CATALOG_CONFIG` se conservan con los valores en español para no tocar los tests existentes.
4. **Plantillas:** `index.astro`, `Contact.astro`, `WhatsAppFloat.astro` y `ProductGrid.astro` leen `siteConfig.ui`. El atributo `lang` sale de `htmlLang` (`es`, `en`, `pt-BR`). Los mensajes de WhatsApp llevan marcadores (`{name}`, `{product}`) que se rellenan al construir el enlace.
5. **Comprobaciones nuevas:**
   - **Completitud (RF-10):** un test exige que los tres idiomas tengan exactamente las mismas claves, ninguna vacía, y los mismos marcadores; y que en/pt no copien el texto en español salvo una lista corta y explícita de palabras iguales.
   - **Barrera por idioma (RF-18):** `check-dist` conoce los textos de cada idioma y falla si en la web aparece un texto de **otro** idioma que no esté en los datos. Se busca por palabra completa (con letras Unicode) para evitar falsos positivos como "Contact" dentro de "Contacto"; los textos que coinciden en ambos idiomas ("Email") y los nombres de red quedan exentos.
6. **Documentación y constitución:** los valores por defecto por idioma salen de las traducciones al generar la documentación; el error nuevo se lista en `ERROR_CODES`; la enmienda de la constitución se muestra antes de aplicarla.

Alternativas descartadas: traducciones como datos del contrato (el contrato crecería unos 28 campos); un JSON importado con atributos de importación (riesgo de compatibilidad entre Node y el bundler sin necesidad); una biblioteca de internacionalización (dependencia nueva para 28 textos); una regla propia en lugar de `z.enum` (se pierde la lista de valores en el JSON Schema).

## Lista de textos fijos y traducciones (RF-17: requiere tu aprobación antes de pasar a las tareas)
`{name}` = nombre del negocio; `{product}` = nombre del producto. Las columnas EN y PT son **propuestas mías, sin revisión de un hablante nativo**.

| Clave | Español (actual, no cambia) | Inglés (propuesta) | Portugués de Brasil (propuesta) |
|---|---|---|---|
| nav.home | Inicio | Home | Início |
| nav.about | Nosotros | About us | Sobre nós |
| nav.services | Servicios | Services | Serviços |
| nav.products | Productos | Products | Produtos |
| nav.testimonials | Testimonios | Testimonials | Depoimentos |
| nav.contact | Contacto | Contact | Contato |
| aria.openMenu | Abrir menú | Open menu | Abrir menu |
| aria.whatsapp | Contactar por WhatsApp | Contact us on WhatsApp | Fale conosco pelo WhatsApp |
| footer.rights | Todos los derechos reservados. | All rights reserved. | Todos os direitos reservados. |
| form.title | Envianos un mensaje | Send us a message | Envie uma mensagem |
| form.name | Nombre | Name | Nome |
| form.email | Email | Email | E-mail |
| form.subject | Asunto | Subject | Assunto |
| form.message | Mensaje | Message | Mensagem |
| form.namePlaceholder | Tu nombre | Your name | Seu nome |
| form.emailPlaceholder | tu@email.com | you@email.com | voce@email.com |
| form.subjectPlaceholder | ¿En qué podemos ayudarte? | How can we help you? | Como podemos ajudar? |
| form.messagePlaceholder | Contanos tu consulta... | Tell us about your inquiry... | Conte-nos sobre sua dúvida... |
| form.submit | Enviar por WhatsApp | Send via WhatsApp | Enviar pelo WhatsApp |
| info.title | Información de contacto | Contact information | Informações de contato |
| info.phone | Teléfono | Phone | Telefone |
| info.email | Email | Email | E-mail |
| info.address | Ubicación | Location | Localização |
| whatsapp.title | Escribinos por WhatsApp | Message us on WhatsApp | Escreva para nós no WhatsApp |
| whatsapp.subtitle | Respondemos rápido | We reply quickly | Respondemos rapidamente |
| catalog.cta | Consultar por WhatsApp | Ask on WhatsApp | Consultar pelo WhatsApp |
| message.general | Hola {name}, quiero hacer una consulta | Hello {name}, I would like to ask a question | Olá {name}, gostaria de fazer uma consulta |
| message.product | Hola, me interesa el producto: {product} | Hello, I am interested in the product: {product} | Olá, tenho interesse no produto: {product} |
| (meta) htmlLang | es | en | pt-BR |

Notas de la lista:
- El botón "Contacto" del encabezado usa `nav.contact`, y los títulos neutros de sección usan `nav.services`, `nav.products`, `nav.testimonials` y `nav.contact`: así coinciden con el menú en cada idioma (RF-6).
- "Instagram" y "Facebook" (`aria-label` de las redes) no se traducen.
- "Email" coincide entre español e inglés; es un caso exento en la barrera.
- "Respondemos rápido" se traduce, no se retira (decisión de la spec).

## Archivos a crear / modificar
| Archivo | Cambio |
|---|---|
| `src/content/ui-text.ts` | **Nuevo.** Las traducciones (`es`, `en`, `pt`), la lista `LANGUAGES` y `htmlLang` |
| `src/content/site.schema.ts` | `SCHEMA_VERSION` "2.2" y entrada 2.2 en `CHANGELOG`; campo `language`; error `unknown_language` en `ERROR_CODES` y `CUSTOM_MESSAGES`/`toErrors`; `applyDefaults` resuelve `language`, `ui`, títulos neutros y etiqueta del botón por idioma; descripciones de campo con los valores por defecto por idioma |
| `src/pages/index.astro` | Menú, botón de contacto, `aria-label` del menú, pie y `lang` desde `siteConfig.ui` |
| `src/components/sections/Contact.astro` | Formulario, tarjetas de contacto, tarjeta de WhatsApp y mensaje prellenado desde `siteConfig.ui` |
| `src/components/sections/WhatsAppFloat.astro` | `aria-label` y mensaje prellenado desde `siteConfig.ui` |
| `src/components/sections/ProductGrid.astro` | Mensaje prellenado del producto desde `siteConfig.ui` |
| `scripts/check-dist.mjs` | Barrera por idioma (textos de otro idioma que no estén en los datos) |
| `scripts/site-i18n.test.mjs` | **Nuevo.** Tests de `language`, de los valores por defecto por idioma, de completitud de las traducciones y de la compatibilidad con el español actual |
| `scripts/fixtures/site.min.en.json`, `site.min.pt.json`, `site.max.en.json`, `site.max.pt.json` | **Nuevos.** Variantes mínima y máxima en inglés y portugués (RF-21): copias de las actuales con `language` |
| `scripts/site-schema.test.mjs` | **Solo** las 3 comprobaciones de versión (líneas 340, 353 y 934): "2.1" pasa a "2.2" |
| `scripts/site-text-fields.test.mjs` | **Solo** las 4 comprobaciones de versión del contrato: "2.1" pasa a "2.2" (versión, informe, registro de cambios y Markdown) |
| `package.json` | `test:schema` también ejecuta `site-i18n.test.mjs` |
| `docs/site-schema.md`, `docs/site.schema.json` | **Generados** con `npm run schema:export` |
| `docs/constitution.md`, `AGENTS.md`, `MEMORY.md` | Enmienda aprobada y actualización de estado (ver abajo) |

`site.data.json` (la demo) **no cambia**: sin `language` equivale a `es`, y eso es lo que comprueba RF-20.

## Modelo de datos / interfaces
```
language?          "es" | "en" | "pt"          (raíz de los datos; ausente = "es")

Datos resueltos (ResolvedSite):
  language         "es" | "en" | "pt"          (siempre presente)
  ui               las traducciones de ese idioma (nav, aria, footer, form, info, whatsapp, catalog, message, htmlLang)
  sections.<s>.title   el del cliente o, si falta, ui.nav.<s>
  productGridConfig.ctaLabel   el del cliente o, si falta, ui.catalog.cta
```
- **Compatibilidad:** `language` es opcional y los datos 2.0 y 2.1 siguen válidos (RF-14). Sin el campo la web es la misma de antes (RF-2, RF-20).
- **Error nuevo:** `unknown_language` (valor de texto fuera de la lista), con `expected: ["es","en","pt"]`. Tipo equivocado: `invalid_type`.
- **Regla de las traducciones:** mismas claves y mismos marcadores en los tres idiomas; ningún valor vacío; en/pt no repiten el texto en español salvo una lista corta de excepciones.
- **Reglas cruzadas:** ninguna nueva.

## Mapa RF → implementación → test
| RF | Dónde se implementa | Test que lo verifica |
|---|---|---|
| RF-1 | Campo `language` con `z.enum` | `es`, `en` y `pt` son válidos; el JSON Schema lo lista |
| RF-2 | `applyDefaults`: `language ?? "es"` | Sin el campo, `ui` es el español y los textos resueltos son los de hoy |
| RF-3 | `toErrors` → `unknown_language` + `expected` | `fr`, `EN`, `pt-BR`, `en-US`, `" en"`, `""` → `unknown_language` en `language` con los tres valores |
| RF-4 | Error de tipo existente | `null`, `5`, `[]`, `{}`, `true` → `invalid_type` en `language` |
| RF-5 | `ui-text.ts` + plantillas | Completitud; build en `en` y `pt` y barrera de `check-dist`; revisión de la lista aprobada |
| RF-6 | Títulos neutros desde `ui.nav` | Test de `applyDefaults` por idioma; build de la mínima en `en` y `pt` |
| RF-7 | `ctaLabel` por defecto desde `ui.catalog.cta` | Test de `applyDefaults` por idioma; build con productos en `en` y `pt` |
| RF-8 | El texto del cliente tiene prioridad | Test: título, subtítulo y etiqueta propios se conservan con `en` y `pt` |
| RF-9 | Barrera de `check-dist` | `check-dist` falla con una build en `en` que contenga un texto en español sin estar en los datos (probado en rojo contra una build deliberadamente mezclada) |
| RF-10 | Test de completitud | Mismas claves, mismos marcadores, sin vacíos, sin copias del español salvo excepciones |
| RF-11 | `lang` desde `ui.htmlLang` | Build en `es`, `en` y `pt`: `<html lang="es">`, `"en"`, `"pt-BR"` |
| RF-12 | `aria-label` desde `ui.aria` | Build: los `aria-label` del menú y de WhatsApp están en el idioma; "Instagram" y "Facebook" quedan igual |
| RF-13 | Enlaces `wa.me` con el mensaje por idioma | Test del mensaje con marcadores; build: enlace del botón flotante, del contacto y de un producto en cada idioma, con nombres con tildes, comillas y emojis |
| RF-14 | `SCHEMA_VERSION = "2.2"` | Fixtures y datos 2.0 y 2.1 válidos; los 7 tests de versión actualizados |
| RF-15 | Descripciones de campo + `CHANGELOG` + `ERROR_CODES` + `schema:export` | Tests de documentos existentes y nuevos: versión 2.2, `language`, `unknown_language` y los valores por defecto de cada idioma |
| RF-16 | `validateSite` reutiliza `toErrors` | `language` inválido junto con otros errores sale en una sola lista; campos no previstos siguen rechazados |
| RF-17 | Esta lista, aprobada por ti | Aprobación explícita antes de `/tasks` |
| RF-18 | `check-dist` por idioma | Builds de `es`, `en` y `pt` sin problemas; build mezclada falla |
| RF-19 | Plantillas sin cambios de estructura; ajuste mínimo de ser necesario | Volcado de layout a 375, 768 y 1280 px de las variantes mínima y máxima en los tres idiomas, sin desbordes nuevos |
| RF-20 | `es` idéntico | `compare-builds`: demo actual contra la línea base de `master` (construida el mismo año), 0 diferencias de contenido y de espacios |
| RF-21 | Cuatro fixtures nuevos | `npm run validate` de cada uno; los tests de completitud los usan |
| RF-22 | Enmienda de la constitución, `AGENTS.md` y `MEMORY.md` | Revisión de los tres archivos tras tu aprobación del texto |

## Riesgos y casos límite
- **Menú a 768 px en portugués.** "Sobre nós" y "Depoimentos" son más largos que "Nosotros" y "Testimonios", y a 768 el menú muestra 6 enlaces y un botón con un nombre de negocio de hasta 80 caracteres. Mitigación: medir en la variante máxima de cada idioma; si hace falta, un ajuste mínimo de espaciado, que RF-19 permite.
- **Tarjeta de WhatsApp en portugués** ("Escreva para nós no WhatsApp", más larga): hoy se adapta con salto de línea. Se comprueba en la variante máxima.
- **`z.enum` y el error.** Hay que confirmar con un test cómo informa Zod 4 un valor fuera de la lista. Mitigación: si no es utilizable, regla propia al estilo de `Icon`, sin cambiar el contrato.
- **Falsos positivos de la barrera.** Palabras iguales en dos idiomas ("Email") o contenidas en otras ("Contact" en "Contacto"). Mitigación: búsqueda por palabra completa y lista de excepciones; se prueban ambos casos.
- **Falsos negativos de la barrera.** No detecta un texto cambiado por error en el diccionario del propio idioma; lo cubre la revisión de la lista que tú aprobas.
- **Traducciones sin revisar por un hablante nativo.** Mitigación: tu aprobación frase por frase (RF-17); queda en la documentación quién las aprobó.
- **Años distintos.** El pie lleva el año de construcción: la comparación de RF-20 se hace con builds del mismo año.
- **Tests existentes.** Se tocan solo las comprobaciones de versión (3 en el archivo de la spec 001 y 4 en el de la spec 003). Si falla cualquier otro test, es un bloqueo.
- **Fines de línea.** El test de documentos sigue siendo sensible a CRLF (pendiente conocido): regenerar con `npm run schema:export` antes de verificar.
- **Cambios en la constitución** son de política, no de código: se muestran y se aprueban antes de aplicarse.

## Comprobación con la constitución
- [x] Principio 1 (simplicidad): sin dependencias nuevas ni JS de cliente; un solo archivo de traducciones.
- [x] Principio 2 (la spec manda): solo lo de la spec; los archivos nuevos (`ui-text.ts`, `site-i18n.test.mjs` y cuatro fixtures) y el cambio de `package.json` los sometes a aprobación.
- [~] Principio 3 (datos separados de interfaz): las traducciones quedan en el template, no en los datos ni en los componentes. **Es una excepción declarada**, que la enmienda del principio recoge (ver abajo). Lo que escribe el cliente sigue en los datos.
- [x] Principio 4 (el build como puerta): cada tarea ejecuta `npm run test:schema` y el build de las variantes con `check-dist`.
- [~] Principio 5 (contrato sagrado): cambio compatible, subido a 2.2 y anotado. Añadir un idioma exige una versión del template, no solo datos; la enmienda lo aclara.
- [~] Principio 6 (idioma): el código sigue en inglés y la documentación en español, pero la interfaz de cada web pasa a estar en su idioma; hace falta la enmienda.

### Enmienda propuesta de la constitución (se aplica solo con tu aprobación expresa)
```diff
-3. **Datos separados de interfaz**: todo contenido vive en `site.config.ts` y toda paleta en `theme.css`; los componentes no llevan texto fijo.
+3. **Datos separados de interfaz**: todo contenido vive en los datos del sitio y toda paleta en `theme.css`; los componentes no llevan texto fijo. El texto fijo de la interfaz vive en un único archivo de traducciones del template, con las mismas claves en cada idioma.
...
-5. **El contrato con el generador es sagrado**: no romper la forma de `site.config.ts` sin aprobación; el template debe seguir siendo reemplazable solo con datos.
+5. **El contrato con el generador es sagrado**: no romper la forma de los datos sin aprobación; el template debe seguir siendo reemplazable solo con datos. Un idioma nuevo es la excepción: exige una versión del template.
-6. **Idioma**: código en inglés; interfaz y documentación en español.
+6. **Idioma**: código en inglés; documentación en español; interfaz de cada web en el idioma indicado en los datos (español por defecto).
```
La referencia a `site.config.ts` de los principios 3 y 5 está desactualizada desde la spec 001 (los datos viven en `site.data.json`); la corrijo en el mismo cambio.

## Actualizaciones previstas
- **AGENTS.md:** línea de convenciones (interfaz en su idioma, español por defecto); contrato "versión 2.2"; regla nueva: el texto fijo de la interfaz vive solo en `src/content/ui-text.ts`, con las mismas claves en los tres idiomas; `check-dist` y los fixtures `*.en.json` y `*.pt.json`; excepciones conocidas sin la interfaz fija y sin los títulos neutros (queda el símbolo `$`). Hoy tiene 60 líneas: el aumento se compensa fusionando líneas. Se muestra el texto antes de aplicarlo.
- **MEMORY.md:** estado (spec 004, contrato 2.2), decisiones con su porqué (campo `language` exacto, error propio, `pt-BR` en `lang`, traducciones revisadas por el responsable), errores a evitar y pendientes (test de fines de línea, `typescript`, más idiomas).
