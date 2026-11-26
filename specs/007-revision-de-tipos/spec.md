# Spec 007 — Revisión de tipos del código de la web
> Solo el QUÉ y el POR QUÉ. Nada de stack, arquitectura ni nombres de archivos (eso va en plan.md).

## Contexto y objetivo
El código de la web está escrito en TypeScript y el proyecto tiene una configuración estricta de tipos, pero **nada la aplica**: ni el build ni los tests revisan tipos (ya figuraba en la memoria como "TypeScript no está instalado: ni el build ni los tests revisan tipos"). Un error de tipos, por ejemplo un campo que se renombra en el esquema y un componente que sigue usando el nombre viejo, puede pasar los 700 tests y construir una web sin que nadie lo vea. Cada spec nueva (003 a 006) tocó el esquema, los datos resueltos y los componentes, y la única red de seguridad fue comparar builds y probar a mano.

El objetivo es que **un error de tipos en el código de la web se detecte antes de dar algo por hecho, y que impida construir**, sin cambiar lo que ve el cliente final.

## Aprobaciones previas (decisiones del responsable)
- Un error de tipos **frena el build**, igual que hoy lo frenan los datos inválidos (principio 4 de la constitución: el build como puerta).
- Se revisa el código de la web (componentes, esquema, carga de datos, textos de interfaz y formato de precio). Los scripts de verificación y los tests quedan fuera. Se acota qué archivos se revisan sin relajar ninguna regla de tipos.
- Los errores de tipos que ya existan se **corrigen dentro de esta spec**, con tipos reales y sin cambiar la web. Se admiten excepciones puntuales (una aserción o una supresión) solo con un comentario que diga por qué, listadas en el pull request. Si los errores son más de unos 30, o alguno exige cambiar el comportamiento o el HTML, se para y se consulta.
- Los paquetes nuevos son **solo de desarrollo** y no entran en la web generada.
- La revisión tiene su propio comando, el build la ejecuta antes de construir y pasa a la verificación obligatoria del proyecto. El servidor de desarrollo y la vista previa no cambian.
- Si faltan las herramientas de tipos, el build **falla con un mensaje claro** (no se salta la revisión).
- Cuando haya datos inválidos y errores de tipos a la vez, se informa de **ambos** juntos antes de negarse a construir.
- La web generada debe salir **idéntica en todos sus archivos** (HTML, CSS y JavaScript), no solo en lo que ve el visitante.
- Queda un **test permanente** que provoca un error de tipos y comprueba que la revisión falla (es una adición: los 700 tests existentes no se modifican).
- Los mensajes que escribe el proyecto van en español; los errores de tipos salen como los emite la herramienta. No se enmienda la constitución: se aclara en esta spec y en `AGENTS.md`.

## Usuarios / actores
- **Desarrollador de Pylar Labs:** cambia el esquema o un componente y quiere saber de inmediato si dejó algo roto.
- **Agente de desarrollo (Claude Code):** corre la verificación antes de dar una tarea por hecha y necesita que un error de tipos cuente como fallo.
- **Servicio generador de webs:** construye cada web con el build; no debe notar cambios en el resultado, y hay que asegurar que el build siga funcionando en su entorno.

## Historias de usuario
- H1: Como desarrollador quiero que un error de tipos haga fallar el build para no publicar una web con un componente inconsistente con el esquema.
- H2: Como desarrollador quiero un comando que revise los tipos sin construir para comprobar un cambio rápido.
- H3: Como desarrollador quiero que cada error diga el archivo, la línea y el problema para corregirlo sin buscar.
- H4: Como responsable quiero que añadir la revisión no cambie ni un byte de la web generada para no introducir riesgo en las webs de los clientes.

## Requisitos funcionales (criterios de aceptación en EARS)

### Revisión
- RF-1: EL SISTEMA ofrecerá un comando que revisa los tipos del código de la web sin construirla.
- RF-2: CUANDO el comando termine sin errores de tipos, EL SISTEMA terminará con éxito y lo dirá.
- RF-3: SI hay errores de tipos, ENTONCES EL SISTEMA terminará con fallo y mostrará la lista completa, con archivo, línea y descripción de cada uno, en una sola ejecución. Cuenta como error todo diagnóstico de severidad "error" según la configuración estricta que el proyecto ya declara; los avisos y las sugerencias se muestran, pero no frenan ni cambian el código de salida.
- RF-4: EL SISTEMA revisará los archivos de componentes, de código TypeScript y de plantillas de la web, y no revisará los scripts de verificación ni los tests.
- RF-5: EL SISTEMA aplicará las reglas de tipos que el proyecto ya declara, sin relajarlas ni añadir excepciones globales para que pase. SI una regla actual choca con las importaciones con extensión `.ts` que usan los scripts de Node, ENTONCES se detendrá el trabajo y se consultará al responsable.

### Build
- RF-6: CUANDO se ejecute el build, EL SISTEMA ejecutará tanto la validación de datos como la revisión de tipos antes de construir, las dos aunque una falle.
- RF-7: SI cualquiera de las dos falla, ENTONCES EL SISTEMA no construirá la web y terminará con fallo.
- RF-8: SI fallan las dos, ENTONCES EL SISTEMA mostrará los errores de datos y los de tipos juntos, sin ocultar ninguno.
- RF-9: EL SISTEMA mantendrá los mensajes y el formato de la validación de datos exactamente como hasta ahora.
- RF-10: SI faltan las herramientas de tipos, ENTONCES EL SISTEMA hará fallar el build con un mensaje en español que diga qué falta y cómo instalarlo, sin saltar la revisión y sin un error críptico.
- RF-11: EL SISTEMA no cambiará el comportamiento del servidor de desarrollo ni de la vista previa.

### Errores existentes
- RF-12: EL SISTEMA corregirá todos los errores de tipos que existan al empezar, con tipos reales y sin cambiar el comportamiento de la web.
- RF-13: SI una corrección puntual exige una aserción o una supresión, ENTONCES EL SISTEMA la admitirá solo con un comentario que explique el motivo, y el pull request la listará.
- RF-14: SI los errores existentes superan unos 30, o corregir uno obligara a cambiar el HTML, los datos o el comportamiento, ENTONCES se detendrá el trabajo y se consultará al responsable antes de seguir.
- RF-15: EL SISTEMA no ocultará errores con ignorados masivos ni con relajaciones del tipado (silenciar archivos enteros, declarar todo como "cualquier tipo").

### Resultado verificable
- RF-16: CUANDO se construya cada una de las 12 variantes (demo, mínima y máxima en tres idiomas, y los fixtures de precio), EL SISTEMA generará exactamente el mismo contenido que antes de esta spec en todos los archivos del build (HTML, CSS y JavaScript): el comparador de builds no debe mostrar diferencias de contenido ni de espacios, y el contenido de cada archivo generado debe coincidir.
- RF-17: EL SISTEMA tendrá un test permanente que provoca un error de tipos y comprueba que el comando y el build fallan con archivo y línea, y que al retirarlo vuelven a pasar. Los 700 tests existentes no se modifican.
- RF-18: EL SISTEMA no añadirá paquetes a la web generada: los nuevos serán solo de desarrollo, y el contenido del sitio construido no dependerá de ellos. El plan listará cada paquete con su versión y su motivo y se pedirá aprobación expresa antes de instalarlo.
- RF-19: EL SISTEMA pasará la revisión de tipos y el build con Node 22.23.4 y con Node 24.

### Documentación
- RF-20: EL SISTEMA documentará en `AGENTS.md` el comando de revisión de tipos, que el build la ejecuta, que forma parte de la verificación obligatoria (regla "Siempre" y sección de verificación) y qué mensajes son nuestros y cuáles de la herramienta, y retirará de la memoria el aprendizaje de que los tipos no se revisan.

## Requisitos no funcionales
- Dependencias: solo de desarrollo y solo las necesarias; la web generada no cambia.
- Entorno: Node ≥ 22.23.4 y Node 24, en Windows; Linux queda sin verificar, como hoy.
- Tiempo: se medirá la duración del build antes y después y se informará la diferencia. SI el build se duplica o añade más de 30 segundos, ENTONCES se consultará al responsable.
- Idioma: mensajes del proyecto y documentación en español; los mensajes de la herramienta de tipos, en su idioma.
- Seguridad: `npm audit` debe seguir en 0 vulnerabilidades tras añadir paquetes.
- Reversión: la fusión se puede revertir con `git revert -m 1`.

## Casos límite
- Error de tipos en un componente que no se usa en la web mínima: se detecta igual (la revisión no depende de los datos).
- Error de tipos en el esquema o en los textos de interfaz que los scripts de Node importan: se detecta, y los scripts siguen funcionando con sus reglas (solo `import type`, extensiones `.ts`, sin `enum` ni alias `@/`).
- Datos inválidos y tipos correctos: falla la validación de datos como hasta ahora.
- Tipos con error y datos válidos: falla la revisión de tipos antes de construir.
- Datos inválidos y tipos con error a la vez: se muestran ambos (RF-8).
- Clon recién hecho con `npm ci`: la revisión pasa sin pasos manuales; SI le falta algún archivo que la herramienta genera por su cuenta, ENTONCES se genera sola o el mensaje indica cuál falta.
- Herramientas de tipos ausentes (instalación sin dependencias de desarrollo): el build falla con el mensaje de RF-10.
- Avisos y sugerencias (código sin usar, por ejemplo): se muestran sin frenar (RF-3).
- Un cambio de versión de las herramientas de tipos (por ejemplo, una actualización automática) que destape errores nuevos: el build falla y el responsable decide; no se silencia.
- Los archivos de datos (`site.data.json` y los fixtures de `SITE_DATA`) no se tipan: los valida el esquema, no la revisión de tipos.
- Webs ya generadas con versiones anteriores del template: no se ven afectadas; la revisión solo actúa al construir.
- Salida de la herramienta: se muestra completa con rutas y un código de salida distinto de cero; no se recorta aunque haya muchos errores.
- No hay integración continua: las redes de seguridad son el comando, el build y la verificación de `AGENTS.md`.

## Fuera de alcance
- Revisar los scripts de verificación y los tests (`.mjs`).
- Relajar las reglas de tipos o hacerlas más estrictas de lo que ya son.
- Reescribir código para mejorar tipos que ya pasan la revisión.
- Añadir reglas de estilo, formato o `lint` (el proyecto no tiene lint y no se añade aquí).
- Cualquier cambio de comportamiento, diseño, datos, contrato o versión del contrato.
- Revisar tipos en el servidor de desarrollo o en la vista previa.
- Tipar los archivos de datos.
- Integración continua.
- Cambiar cómo el servicio generador instala dependencias (ver condición de fusión).
- Verificar en Linux.

## Criterios de finalización
- El comando de revisión pasa en limpio y falla con archivo y línea ante un error provocado a propósito (test permanente).
- El build ejecuta validación de datos y revisión de tipos antes de construir, informa de ambas si fallan y falla si hay errores de tipos.
- Los 12 builds salen idénticos en todos sus archivos a los de antes de la spec.
- Los 700 tests existentes pasan sin modificar, más el test nuevo; `npm audit` en 0; Node 22.23.4 y Node 24 en verde.
- `AGENTS.md` y `MEMORY.md` actualizados.
- **Condición de fusión:** el responsable confirma que el servicio generador instala las dependencias de desarrollo al construir y qué comando de build ejecuta. Sin esa confirmación el pull request no se fusiona.
- Pull request revisado y fusionado con aprobación expresa del responsable.

## Dudas abiertas
Ninguna que bloquee el plan. Resueltas en la revisión previa: efecto de los errores (frenan el build), alcance (código de la web), errores existentes (se corrigen; consulta si superan unos 30), dependencias (solo desarrollo; cada paquete con aprobación en el plan), build sin herramientas (falla con mensaje claro), datos y tipos a la vez (se informan ambos), identidad de la web (todos los archivos), test permanente, desarrollo y vista previa (sin cambios) e idioma de los mensajes.

Pendiente de confirmar fuera de la spec (condición de fusión): cómo instala y construye el servicio generador.
