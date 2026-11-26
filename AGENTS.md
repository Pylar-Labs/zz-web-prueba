# AGENTS.md — Template landing — Pylar Labs
Template base de landing de Pylar Labs. El servicio web de la agencia lo usa para generar las webs de los clientes a partir de su solicitud, cambiando solo datos y paleta.

## Stack y estructura
- Stack: Astro 7.4 · React 19 · Tailwind 4.3 · shadcn/ui · TypeScript · Node ≥ 22.23.4
- `src/content/site.data.json` datos del sitio (lo que escribe el generador) · `src/content/site.schema.ts` esquema y validación · `src/content/site.config.ts` cargador
- `src/` código · `scripts/` validación, comprobadores y tests (no hay carpeta `tests/`) · `docs/` constitución y contrato generado
- `docs/constitution.md` principios · `specs/NNN-*/` specs activas · `MEMORY.md` memoria entre sesiones

## Comandos
- Ejecutar: `npm run dev` (localhost:4321) · Lint: no existe
- Tests: `npm run test:schema` (contrato y campos de texto) · `node --test scripts/compare-builds.test.mjs` (comparador de builds) · `npm run test:typecheck` (revisión de tipos de punta a punta, ~40 s)
- Comparar dos builds (tras actualizar dependencias): `node scripts/compare-builds.mjs <carpeta-base> <carpeta-nueva>` (añade `--json` para el informe estructurado)
- Validar datos: `npm run validate` (acepta una ruta; con `-- --json` da el informe estructurado) · Revisar tipos: `npm run typecheck` (sin construir)
- Build: `npm run build` (antes, con `prebuild`, valida los datos y revisa los tipos, las dos aunque una falle; sin las dependencias de desarrollo falla con un mensaje claro) · `npm run preview` · regenerar la documentación del contrato: `npm run schema:export`

## Convenciones
- Código en inglés; documentación en español; interfaz de cada web en su idioma (campo `language`: `es` por defecto, `en` o `pt`).
- Contenido de cada web: lo escribe el cliente en `site.data.json`. Texto fijo de la interfaz: solo en `src/content/ui-text.ts` (mismas claves en es, en y pt; un idioma nuevo exige versión del template), nunca en los componentes. Archivo de referencia del estilo: `src/components/sections/Services.astro`

## Reglas de dominio / trampas conocidas
- Datos del cliente solo en `src/content/site.data.json`. `site.config.ts` solo carga, valida y completa valores por defecto: no poner datos ahí. Para usar otro archivo de datos (pruebas, builds de verificación) está la variable `SITE_DATA`.
- El contrato (campos, obligatorios, límites, reglas entre campos) vive en `src/content/site.schema.ts`, versión 2.3. Cambiar su forma = preguntar, subir la versión, anotarlo en `CHANGELOG` y ejecutar `npm run schema:export`. `docs/site-schema.md` y `docs/site.schema.json` son generados: no se editan a mano.
- Los dos documentos de `docs/` (`site-schema.md`, `site.schema.json`) se guardan siempre con LF (`.gitattributes`) y los tests toleran CRLF frente a LF; el resto del proyecto no cambia. Un clon anterior que los tenga con CRLF o marcados modificados sin cambios: borrar los dos y `git checkout -- docs/site-schema.md docs/site.schema.json` (en PowerShell, `Remove-Item` en vez de `rm`).
- Los datos inválidos se rechazan con la lista completa de errores (ruta, código estable y mensaje en español); no se corrigen ni se recortan solos. Un campo no previsto también se rechaza.
- Los scripts de Node importan `site.schema.ts` y `icons.ts` quitando los tipos: en esos archivos usar solo `import type`, extensiones `.ts` en rutas relativas, sin `enum` ni el alias `@/`.
- Paleta solo en `src/styles/theme.css` (`@theme inline`). No existe `tailwind.config.js`; no crearlo.
- Íconos en `.astro`: `renderIcon()` de `src/lib/icons.ts` con `set:html`. No importar `lucide-react` en `.astro` (Node cae a CJS en prerender). `ui/icon.tsx` es solo client-side. Los `icon` válidos de `services` son las claves de `iconPaths` en `icons.ts` (única fuente): añadir uno allí lo habilita en el esquema; luego regenerar la documentación.
- Button/Card shadcn son React sin hidratar (sin `client:*`). En `.astro`, importar `buttonVariants` para estilizar `<a>`; con `cn()` si hay que anular sus clases.
- WhatsApp: un único número, `contact.whatsapp` (solo dígitos con código de país, 8 a 15). Lo usan el botón flotante, el contacto y las consultas de cada producto; el catálogo no tiene número propio.
- Lo opcional que falta no se muestra: cifras de "Quiénes somos" (`about.stats`), subtítulos de sección (`sections`), testimonios, productos, redes, email, teléfono, dirección, destacados y botón secundario. Sin título de sección se usa uno neutro (`DEFAULT_SECTION_TITLES`: "Servicios", "Productos", "Testimonios", "Contacto"). El menú y los enlaces internos solo apuntan a secciones que existen; `scripts/check-dist.mjs` lo comprueba tras el build, que ningún texto antiguo del template aparezca fuera de los datos y que la web no muestre textos fijos ni mensajes de WhatsApp de otro idioma.
- Entorno: npm solo avisa, no frena la instalación, si la versión de Node no cumple `engines` (≥ 22.23.4); confirmarla antes de desplegar. Linux: `.github/workflows/verificacion.yml` instala, revisa tipos, ejecuta los tests y construye las 16 variantes (`npm run verify:ci`) en Ubuntu 24.04 x64 con Node 22.23.4 y la última 24.x, en cada pull request y subida a `master`; el resultado está en la pestaña Actions del pull request (si no hay ejecuciones, revisar la cuota de minutos). Solo informa: un rojo se investiga antes de fusionar. Alpine, ARM y macOS no se verifican; las acciones van fijadas por commit y se actualizan a mano.
- Revisión de tipos (`astro check`, `tsconfig` estricto): cubre `.ts`, `.tsx` y `.astro`, no los `.mjs`. Necesita `typescript` 6 (la 7 no es compatible con `@astrojs/check`), `@astrojs/check` y `@types/node`, solo de desarrollo; `@types/node` también se instala con `--omit=dev` porque Vite lo pide como peer opcional (solo tipos, no entra en la web). Los errores de tipos salen como los emite la herramienta y los mensajes del proyecto, en español. Sin `any` ni supresiones salvo con un comentario que diga por qué.
- Cabecera: el nombre va en una sola línea con «…» (`truncate`, con `title` con el nombre completo) y nunca baja de ~24 caracteres (~260 px); los enlaces del menú no se parten (`whitespace-nowrap`). El menú horizontal aparece desde `lg` (1024 px): se calculó con el enlace más largo de los tres idiomas (es: 466 px con huecos), el botón «Contacto» (90 px), el nombre mínimo y márgenes de 16 px; por debajo hay desplegable, con «Contacto» visible desde `md`. El pie parte el nombre (`wrap-anywhere`). Un idioma nuevo o un enlace más obliga a repetir ese cálculo.
- `Contact` no lleva mapa y su formulario es solo maqueta (no envía). Los datos actuales de `site.data.json` (Sabores del Norte, placehold.co) son demo.
- Precio: `productGridConfig.currency` (ARS por defecto; ARS, USD, EUR, BRL, MXN, CLP, COP, PEN, UYU) y el idioma fijan el formato estándar vía `formatPrice()` de `src/content/price-format.ts`. Símbolo y separadores salen de los datos regionales de la plataforma, no son texto de interfaz: no ponerlos en `ui-text.ts`. CLP y COP no admiten decimales (`price_currency_decimals`). Excepción conocida al "sin texto fijo" (pendiente de otra spec): el año del pie como número.

## Forma de trabajar
- ANTES DE TODO: ejecuta `node scripts/check-setup.mjs`. Si falla, corre `/init-project` y no escribas código hasta que pase.
- Lee `docs/constitution.md` y la spec activa (`specs/NNN-*/`) antes de tocar código. Cambio no trivial: planifica primero y espera aprobación; cambios pequeños y revisables.
- Al terminar explica qué cambiaste, cómo lo verificaste y decisiones tomadas por tu cuenta.

## Memoria
- Al empezar, lee `MEMORY.md`. Al terminar una tarea, actualízalo (estado, decisiones con su porqué, errores a evitar).
- Máximo ~50 líneas: resume o elimina lo que ya no aporte.
- Si algo es regla permanente, propón moverlo a `AGENTS.md`. Nunca guardes datos sensibles (claves, tokens, datos personales).

## Límites
- ✅ Siempre: actualizar `MEMORY.md` al terminar; correr `npm run test:schema`, `npm run test:typecheck` y `npm run build` antes de dar algo por hecho.
- ⚠️ Pregunta antes: dependencias nuevas, archivos nuevos fuera de la spec, cambios de formato de datos (forma del contrato en `site.schema.ts`).
- 🚫 Nunca: implementar algo que no esté en la spec activa; subir secretos; avanzar con tests en rojo o con el build roto.

## Verificación
- `npm run test:schema` y `npm run test:typecheck` en verde y `npm run build` sin errores (incluye la revisión de tipos).
- Web mínima y máxima (también `site.min.en.json`, `site.max.pt.json` y el resto de los fixtures en inglés y portugués): construir con `SITE_DATA=scripts/fixtures/site.min.json` y `site.max.json` (en PowerShell: `$env:SITE_DATA = "..."`) y ejecutar `node scripts/check-dist.mjs` después de cada build.
- Tras actualizar dependencias: comparar el build anterior con el nuevo con `node scripts/compare-builds.mjs` y revisar a mano cada diferencia; confirmar además que el layout a 375 px y a 1280 px no cambia.
- UI: MCP Chrome DevTools: abrir `npm run dev`, probar secciones y enlaces `wa.me`, revisar consola sin errores y vista móvil 375 px. La ventana de Chrome no baja de ~500 px: usar `emulate` con viewport `375x812x2,mobile,touch`.
- Cabecera (al tocarla o al añadir un idioma): en Chrome, con tres nombres (corto, de 80 caracteres con espacios y de 80 sin espacios) en es, en y pt, a 375, 768, 1023, 1024 y 1280 px y a 812×375 con el desplegable abierto: cabecera de una línea y altura constante (±1 px), nombre ≥ 260 px terminado en «…», enlaces sin partir, nada fuera de pantalla ni superpuesto y pie sin desbordar. No hay test automático.
- Tarjeta de cifras (al tocarla o al cambiar su contenido): construir `site.stats.one`, `site.stats.two`, `site.stats.two-limits`, `site.stats.three-limits` y `site.max.json` y medir en Chrome (un `iframe` por ancho) a 375, 768, 1024 y 1280 px: recuadro cuadrado (crece en alto solo si el contenido no cabe; sin `overflow-hidden`), nada recortado ni fuera de su tarjeta, sin scroll horizontal y ningún valor de hasta 6 caracteres partido. Tomar la referencia antes del cambio y exigir ±1 px en lo que ya se veía bien. No hay test automático.
