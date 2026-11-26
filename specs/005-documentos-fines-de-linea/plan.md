# Plan 005 — Documentos generados sin depender de los fines de línea
> El CÓMO. Debe cumplir `docs/constitution.md` y cubrir todos los RF de `spec.md`.

## Enfoque técnico
Dos arreglos que se refuerzan, sin tocar el contenido de los documentos ni el generador:

1. **Política del repositorio** (`.gitattributes`): dos líneas que declaran `text eol=lf` solo para `docs/site-schema.md` y `docs/site.schema.json`. Con eso git los guarda y los baja siempre con LF, aunque `core.autocrlf=true`. Ninguna regla comodín: el resto del proyecto no cambia (RF-2).
2. **Comparación tolerante en los tests:** un módulo pequeño (`text-compare.mjs`) con una función que compara un documento con lo generado normalizando **solo** `\r\n` a `\n` en el documento leído. Todo lo demás (un `\r` suelto, un BOM, espacios al final, salto final que falta o sobra, texto distinto) sigue siendo una diferencia. Si hay diferencia, devuelve un mensaje con el archivo, la primera línea que difiere (esperada y encontrada, recortadas a 200 caracteres) y `npm run schema:export`; nunca vuelca el documento. Los dos tests existentes de igualdad pasan a usarla.

El generador (`export-schema.mjs`) ya escribe LF en cualquier plataforma (`join("\n")` y `JSON.stringify` más `\n` final); no cambia. Un test nuevo lo deja fijado (RF-3).

Antes de implementar se hace una **prueba previa en un repositorio desechable** (no el del proyecto) para confirmar que `text eol=lf` hace lo esperado con `core.autocrlf=true`: clon nuevo en LF, directorio de trabajo con CRLF que no figura como modificado, y regeneración que no ensucia `git status` (RF-8, RF-9). Si algo no se comporta como se espera, se informa antes de seguir.

Alternativas descartadas: `* text=auto eol=lf` para todo el repositorio (cambia cómo se baja todo el código; rechazado en la spec); normalizar en `schema:export` con lógica de git (rechazado en la spec); comparar sin espacio en blanco (deja pasar documentos rotos; rechazado en la spec); instalar una biblioteca de diferencias (dependencia nueva para una comparación de líneas).

## Archivos a crear / modificar
| Archivo | Cambio |
|---|---|
| `.gitattributes` | **Nuevo.** `docs/site-schema.md text eol=lf` y `docs/site.schema.json text eol=lf` |
| `scripts/text-compare.mjs` | **Nuevo.** `normalizeLineEndings(text)` y `compareDocument(file, found, expected)`, que devuelve `null` si coinciden o el mensaje de diferencia |
| `scripts/text-compare.test.mjs` | **Nuevo.** Tests de la función (CRLF, LF, mezcla, `\r` suelto, BOM, espacios al final, salto final, vacío, primera línea distinta, mensaje), del generador (sin `\r`, termina en `\n`) y de `.gitattributes` (solo esas dos reglas) |
| `scripts/site-schema.test.mjs` | **Solo** los dos tests de igualdad de documentos (líneas 890 a 897): usan `compareDocument`. Es la excepción aprobada en la spec |
| `package.json` | `test:schema` también ejecuta `text-compare.test.mjs` |
| `AGENTS.md` | Una línea con la política y la instrucción para clones existentes (queda en 60 líneas) |
| `MEMORY.md` | Estado (spec 005), se retiran el pendiente y el aprendizaje de los fines de línea |

No cambian: `docs/*.md` y `docs/*.json` (contenido), `export-schema.mjs`, el esquema, las plantillas, los fixtures ni la versión del contrato (2.2).

## Modelo de datos / interfaces
```
normalizeLineEndings(text)  →  text con cada "\r\n" cambiado a "\n"; nada más
compareDocument(file, found, expected)
   found    = texto leído del documento (puede traer CRLF)
   expected = texto que genera el esquema (siempre LF)
   →  null                      si normalizeLineEndings(found) === expected
   →  mensaje (string, español) si no: "<archivo> no coincide con lo que genera el esquema.
        Primera diferencia en la línea N:
          esperada: «…»
          encontrada: «…»
        Se arregla con: npm run schema:export"
```
- **Política:** solo dos rutas exactas. Sin comodines.
- **Línea de la diferencia:** se numera tras normalizar; si un documento es más corto o más largo, la línea que falta o sobra se muestra como `(fin del documento)`.
- **Recorte:** cada línea mostrada se limita a 200 caracteres con `…`; el mensaje no incluye el documento completo.
- **Compatibilidad:** sin cambios de contrato, de datos ni de comportamiento del servicio generador.

## Mapa RF → implementación → test
| RF | Dónde se implementa | Test que lo verifica |
|---|---|---|
| RF-1 | `.gitattributes` | Test del contenido de `.gitattributes` (las dos reglas exactas) + prueba previa y verificación con un clon desechable con `core.autocrlf=true`: los dos archivos llegan en LF |
| RF-2 | `.gitattributes` sin comodines | Test: `.gitattributes` no tiene ninguna otra regla ni patrón comodín |
| RF-3 | `export-schema.mjs` (sin cambios) | Test: `renderSchemaJson()` y `renderSchemaMarkdown()` no contienen `\r` y terminan en un solo `\n` |
| RF-4 | `normalizeLineEndings` + `compareDocument` | Tests: LF, CRLF y mezcla dan `null` cuando coinciden |
| RF-5 | `compareDocument` | Tests: `\r` suelto, BOM, espacios al final, falta o sobra el salto final, documento vacío, texto distinto → devuelven mensaje |
| RF-6 | Mensaje de `compareDocument` | Tests: el mensaje nombra el archivo, el número de línea, la línea esperada y la encontrada y `npm run schema:export`, y no incluye el documento entero (largo acotado) |
| RF-7 | Los dos tests de igualdad usan `compareDocument` | `npm run test:schema` sobre una copia de `docs/` con CRLF: pasa sin regenerar |
| RF-8 | Política + test | Clon desechable con `core.autocrlf=true`: `git ls-files --eol` da `w/lf` y `npm run test:schema` pasa sin pasos extra |
| RF-9 | Política + generador en LF | Directorio de trabajo desechable: `schema:export` no deja los documentos como modificados en `git status` |
| RF-10 | No se toca el generador ni el esquema | `git diff` de `docs/` vacío (ignorando fines de línea) y `SCHEMA_VERSION` sigue en 2.2 |
| RF-11 | `AGENTS.md` y `MEMORY.md` | Revisión de ambos archivos |

## Riesgos y casos límite
- **Comportamiento real de git.** `text eol=lf` debe dar LF con `core.autocrlf=true`, `input` y `false`, y no ensuciar `git status` en un directorio con CRLF. Mitigación: la prueba previa lo comprueba en un repositorio desechable antes de tocar el proyecto; el resultado fija el texto exacto de la instrucción para clones existentes.
- **Clones existentes con CRLF.** Los tests pasan (RF-7), pero `git status` puede seguir marcando los documentos hasta volver a bajarlos. Mitigación: instrucción de una línea en `AGENTS.md`, probada en la prueba previa.
- **Tolerancia demasiado amplia.** Si la normalización fuera más allá de `\r\n`, un documento roto pasaría. Mitigación: tests de `\r` suelto, BOM, espacios al final y salto final, que deben fallar.
- **Mensaje de fallo ilegible.** Si no se acota, volvería el volcado enorme. Mitigación: test que limita el largo del mensaje.
- **Copias sin `.git`.** Las copias limpias (`git ls-files -co`) no traen la carpeta `.git`, pero sí `.gitattributes`; los tests solo leen el archivo, no ejecutan git, así que funcionan igual.
- **Cambio en dos tests existentes.** Es la excepción aprobada; el resto de los 557 tests no se toca. Si falla cualquier otro, es un bloqueo.
- **Editores que guardan con CRLF.** El test pasa; el aviso de `git status` lo cubre la instrucción documentada.

## Comprobación con la constitución
- [x] Principio 1 (simplicidad): sin dependencias nuevas ni JS de cliente; un archivo de atributos y un módulo de dos funciones.
- [x] Principio 2 (la spec manda): solo lo de la spec; los tres archivos nuevos (`.gitattributes`, `text-compare.mjs` y `text-compare.test.mjs`) y el cambio de `package.json` se someten a tu aprobación.
- [x] Principio 3 (datos separados de interfaz): no aplica; no toca contenido ni interfaz.
- [x] Principio 4 (el build como puerta): cada tarea ejecuta `npm run test:schema` y el build con `check-dist`; no se avanza con algo en rojo.
- [x] Principio 5 (contrato sagrado): sin cambios de forma ni de versión (sigue en 2.2).
- [x] Principio 6 (idioma): código en inglés; mensajes de los tests y documentación en español.

## Actualizaciones previstas
- **AGENTS.md:** una línea en "Reglas de dominio": los dos documentos de `docs/` se guardan siempre con LF (`.gitattributes`); si un clon antiguo los tiene con CRLF, el test pasa igual y se vuelven a bajar con la instrucción que fije la prueba previa. Hoy tiene 59 líneas: queda en 60, sin pasarse. Se muestra el texto antes de aplicarlo.
- **MEMORY.md:** estado (spec 005, tests en `site-schema.test.mjs` con comparación tolerante), decisión con su porqué (política solo para los dos documentos; tolerancia solo CRLF frente a LF), se retira el pendiente "corregir el test de documentos" y el aprendizaje del checkout que dejaba CRLF (o se reduce a una nota), y se actualiza el recuento de tests.
