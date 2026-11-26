# Spec 005 — Documentos generados sin depender de los fines de línea
> Solo el QUÉ y el POR QUÉ. Nada de stack, arquitectura ni nombres de archivos (eso va en plan.md).

## Contexto y objetivo
Los dos documentos generados del contrato (la tabla de campos en Markdown y el JSON Schema) se guardan en el repositorio con saltos de línea LF. En Windows, con la configuración habitual de git (`core.autocrlf=true`), cada checkout, clon o `git pull` los baja con CRLF. Los tests que comprueban que el documento coincide con lo que genera el esquema comparan carácter por carácter y fallan, aunque el contenido sea idéntico. Pasó en las specs 002, 003 y 004: cada vez costó pasos extra (regenerar a mano, clonar con otra configuración) y dejó los dos archivos como "modificados" en `git status` sin que el contenido hubiera cambiado.

El problema ya figuraba como pendiente desde la spec 001. El objetivo es que **un clon o un checkout en cualquier plataforma pase los tests de documentos sin pasos extra, y que un cambio real de contenido siga haciéndolos fallar**.

## Aprobaciones previas (decisiones del responsable)
- Se arregla en dos lugares: una política del repositorio que guarda y entrega los documentos generados siempre con LF, y un test que tolera CRLF frente a LF como red de seguridad.
- El test tolera solo CRLF frente a LF; cualquier otra diferencia sigue siendo un error.
- La política de LF alcanza solo a los dos documentos generados, no al resto del proyecto.
- Un fallo real muestra el archivo, la primera línea distinta (esperada y encontrada) y cómo arreglarlo, sin volcar el documento entero.
- Los clones existentes no se automatizan: el test pasa solo y la instrucción para limpiar `git status` queda documentada.
- Esta spec modifica los dos tests existentes que comparan los documentos con lo generado: es la única excepción a "los tests existentes no se tocan".

## Usuarios / actores
- **Desarrollador de Pylar Labs (en Windows):** clona, hace checkout y regenera la documentación; no debe tropezar con fallos ni con archivos "modificados" fantasma.
- **Servicio generador y entornos Linux o macOS:** no deben notar ningún cambio.
- **Agente de desarrollo (Claude Code):** corre los tests tras cada cambio y necesita que un fallo signifique algo real.

## Historias de usuario
- H1: Como desarrollador en Windows quiero que un clon nuevo pase los tests de documentos sin pasos extra para no perder tiempo con fallos que no son reales.
- H2: Como desarrollador quiero que los documentos generados queden siempre con los mismos saltos de línea para que `git status` no los marque como modificados sin que cambien.
- H3: Como desarrollador quiero que un cambio real en un documento siga haciendo fallar el test para no publicar documentación desactualizada.
- H4: Como desarrollador quiero que un fallo real diga qué archivo y qué línea difieren y cómo arreglarlo para resolverlo sin leer un volcado enorme.

## Requisitos funcionales (criterios de aceptación en EARS)

### Política del repositorio
- RF-1: EL SISTEMA guardará y entregará los dos documentos generados del contrato siempre con saltos de línea LF, sea cual sea la configuración de git del equipo (checkout, clon o `git pull`, con o sin conversión automática).
- RF-2: EL SISTEMA no impondrá esa política a ningún otro archivo del proyecto.
- RF-3: CUANDO se regeneren los documentos, EL SISTEMA los escribirá con LF en cualquier plataforma, y su contenido no cambiará si el esquema no cambió.

### Comprobación en los tests
- RF-4: CUANDO un test compare un documento con lo que genera el esquema, EL SISTEMA tratará igual un salto de línea CRLF y uno LF, por cada salto.
- RF-5: SI el documento difiere de lo generado en algo que no sea CRLF frente a LF (texto, espacios al final de una línea, salto de línea final que falta o sobra, BOM, un `\r` suelto o un documento vacío), ENTONCES EL SISTEMA hará fallar el test.
- RF-6: SI el test falla por contenido, ENTONCES EL SISTEMA mostrará el archivo, la primera línea que difiere (la esperada y la encontrada) y que se arregla con `npm run schema:export`, sin volcar el documento completo.
- RF-7: CUANDO los documentos estén en CRLF (un clon o un directorio de trabajo anterior a esta spec), EL SISTEMA pasará los tests de documentos sin necesidad de regenerarlos.

### Resultado verificable
- RF-8: CUANDO se haga un clon nuevo con `core.autocrlf=true`, EL SISTEMA entregará los documentos en LF y todos los tests pasarán sin pasos extra.
- RF-9: CUANDO se regeneren los documentos en un directorio de trabajo con los documentos ya en LF, EL SISTEMA no los mostrará como modificados en `git status` si su contenido no cambió.
- RF-10: EL SISTEMA no cambiará el contenido de los documentos generados ni la versión del contrato.

### Documentación
- RF-11: EL SISTEMA documentará en la documentación del proyecto la política de LF de los documentos, la instrucción corta para dejar un clon existente en LF (volver a bajar esos dos archivos) y el estado en la memoria, y retirará de la memoria el pendiente y el aprendizaje del test de fines de línea.

## Requisitos no funcionales
- Sin dependencias nuevas.
- Idioma: mensajes de los tests y documentación en español.
- Sin cambios de comportamiento para el servicio generador, el build ni las webs generadas.
- El tiempo de los tests no debe cambiar de forma apreciable.

## Casos límite
- Documento en LF (Linux, macOS, Windows sin conversión): pasa, como hoy.
- Documento en CRLF por completo: pasa (RF-4, RF-7).
- Documento con saltos CRLF y LF mezclados: pasa, porque cada salto se trata por separado.
- Documento con un `\r` suelto (sin `\n`): falla (RF-5).
- Documento sin el salto de línea final, o con uno de más: falla.
- Documento con espacios al final de una línea, o con un BOM al principio: falla.
- Documento vacío o truncado: falla, con el mensaje de RF-6.
- Contenido distinto en la última línea, o solo en el título: falla y señala esa línea.
- Los dos documentos fallan a la vez: cada uno informa su propio archivo y su propia línea.
- Un editor que guarda el documento con CRLF: el test pasa; `git status` seguirá marcándolo hasta volver a bajarlo, y la instrucción documentada lo cubre.
- Clon con `core.autocrlf=input` o `false`: sin cambios, pasa.

## Fuera de alcance
- Forzar LF en el resto de los archivos del proyecto.
- Automatizar la normalización de clones existentes (no se añade lógica de git a `schema:export` ni a otros scripts).
- Cualquier cambio de contenido, formato o versión de los documentos del contrato.
- Otros tests que leen archivos de texto (por ejemplo, los datos de ejemplo), que ya no dependen de los fines de línea.
- Hooks de git, reglas de editor o comprobaciones de configuración del equipo.

## Criterios de finalización
- Un clon nuevo con `core.autocrlf=true` entrega los documentos en LF y los tests pasan sin pasos extra.
- Una copia de los documentos en CRLF pasa los tests, y una copia con un cambio real (texto, salto final, espacios, BOM) los hace fallar con el archivo y la línea.
- Los casos nuevos tienen sus propios tests; los demás tests existentes pasan sin modificar.
- El contenido de los documentos y la versión del contrato no cambian.
- `AGENTS.md` y `MEMORY.md` actualizados.
- Pull request revisado y fusionado con aprobación expresa del responsable.

## Dudas abiertas
Ninguna. Resueltas en la revisión previa: dónde se arregla (política y test), qué tolera el test (solo CRLF frente a LF), alcance de LF (solo los documentos generados), mensaje de error (archivo, línea y cómo arreglarlo) y clones existentes (documentado, sin automatizar).
