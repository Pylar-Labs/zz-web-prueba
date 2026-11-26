# Spec 009 — Verificación en Linux con integración continua
> Solo el QUÉ y el POR QUÉ. Nada de stack, arquitectura ni nombres de archivos (eso va en plan.md).

## Contexto y objetivo
El servicio generador puede construir las webs de los clientes en Linux, pero el proyecto solo se ha verificado en Windows (así lo dice `AGENTS.md` y figura como pendiente en la memoria desde la spec 001): la instalación, el build, la revisión de tipos y los tests. Hay motivos concretos para desconfiar de «funciona en Windows»: la herramienta de imágenes trae binarios distintos por sistema, Linux distingue mayúsculas y minúsculas en los nombres de archivo, usa otras rutas y otros saltos de línea, y el formato de los precios depende de los datos regionales de la plataforma. Esta máquina no tiene WSL ni Docker, así que no se puede probar Linux desde aquí. Además, el proyecto no tiene integración continua: las comprobaciones dependen de que alguien las ejecute a mano.

El objetivo es que **el proyecto se compruebe automáticamente en Linux en cada cambio, con las dos versiones de Node que importan (la mínima y la del servicio), y que la primera ejecución confirme que el servicio generará exactamente la misma web que probamos en Windows**.

## Aprobaciones previas (decisiones del responsable)
- La verificación se hace con **integración continua en GitHub** (un Linux de GitHub), que queda permanente. No se instala WSL ni se prueba a mano en el servicio.
- **Alcance:** Linux con Node 22.23.4 (la mínima que declara el proyecto, versión exacta) y con **la última Node 24.x registrando cuál fue** (el servicio dice «Node 24» sin fijar la menor), en cada pull request hacia `master` y en cada subida a `master`.
- **Organización:** un trabajo por versión de Node. En cada uno: instalación exacta de dependencias, los tests de contrato, del comparador y de tipos **una vez**, y los 12 builds en bucle con el build normal (que ya incluye la validación de datos y la revisión de tipos) y `check-dist`. El bucle **no se detiene al primer fallo** y termina con un resumen de qué variante falló.
- **Solo informa, no bloquea:** el resultado se ve en el pull request pero no impide fusionar ni cambia la configuración del repositorio. **Ante un rojo, se investiga antes de pedirte la aprobación del pull request y solo se fusiona con rojo si lo apruebas expresamente tras ver la causa.**
- **Si Linux falla, se corrige dentro de esta spec** sin cambiar la web: ajustes de compatibilidad (rutas, scripts, tests). Si algún arreglo exigiera cambiar el HTML de la web, los datos, el contrato, el archivo de bloqueo o una dependencia, se para y se consulta.
- **«Funciona igual»** significa que el build de Linux es **idéntico, archivo a archivo, al de Windows, con la misma versión de Node**: Linux 22 frente a Windows 22 y Linux 24 frente a Windows 24, en las 12 variantes (HTML, CSS, JavaScript e imágenes). Los builds de Windows se hacen **desde un clon limpio con saltos de línea LF**, en el mismo commit, para que una diferencia sea de plataforma y no de saltos de línea. La comparación se hace una vez y no queda en el CI.
- El aviso conocido de `npm audit` (`picomatch`, sin versión corregida) **no forma parte del CI**: lo pondría en rojo siempre.

## Usuarios / actores
- **Servicio generador de webs:** construye en Linux; necesita la certeza de que el template funciona allí.
- **Desarrollador de Pylar Labs y agente de desarrollo:** ven en cada pull request si el cambio rompe Linux o una versión de Node, sin ejecutarlo a mano.
- **Responsable (tú):** aprueba las fusiones y quiere evidencia de que Linux funciona.

## Historias de usuario
- H1: Como responsable quiero saber si el template funciona en Linux para no romper la generación de webs del servicio.
- H2: Como desarrollador quiero que cada pull request se compruebe solo en Linux y en las dos versiones de Node, para detectar un fallo de plataforma antes de fusionar.
- H3: Como responsable quiero confirmar que la web que genera Linux es idéntica a la que probamos en Windows, para no tener sorpresas en producción.
- H4: Como desarrollador quiero que un fallo diga qué paso, qué variante y qué versión de Node lo causó, para corregirlo sin adivinar.

## Requisitos funcionales (criterios de aceptación en EARS)

### Integración continua
- RF-1: CUANDO se abra o se actualice un pull request hacia `master`, o se suba algo a `master`, EL SISTEMA ejecutará la verificación en Linux. El pull request que añada la verificación se comprueba a sí mismo con la primera ejecución.
- RF-2: EL SISTEMA ejecutará la verificación con Node 22.23.4 y con la última Node 24.x, cada una en un trabajo separado, y escribirá en el resultado la versión exacta de Node y de `npm` usadas. SI falla una versión, ENTONCES la otra continuará.
- RF-3: EL SISTEMA, en cada trabajo, instalará las dependencias exactamente como indica el archivo de bloqueo, ejecutará una vez los tests de contrato (incluidos los de moneda y formato de precio), del comparador de builds y de tipos, y construirá las 12 variantes (demo, mínima y máxima en español, inglés y portugués, y los cinco fixtures de precio) con el build normal, pasando la barrera de `check-dist` en cada una.
- RF-4: SI algún paso falla, ENTONCES EL SISTEMA marcará la ejecución en rojo y mostrará, en un resumen al final de cada trabajo, qué pasos y qué variantes fallaron, con la versión de Node. Los nombres de los trabajos y de los pasos estarán en español.
- RF-5: EL SISTEMA no bloqueará la fusión de un pull request por el resultado de la verificación ni cambiará la configuración del repositorio.
- RF-6: EL SISTEMA no modificará el repositorio (no hará commits ni subidas) ni usará secretos. Solo usará GitHub, el registro de paquetes y la descarga oficial de las versiones de Node.
- RF-7: CUANDO llegue un cambio nuevo a un pull request mientras otra verificación de ese mismo pull request sigue en curso, EL SISTEMA cancelará la ejecución obsoleta; las ejecuciones de `master` nunca se cancelan.
- RF-8: EL SISTEMA limitará la duración de cada trabajo con un tope de tiempo (30 minutos) para no consumir minutos sin fin.

### Primer resultado en Linux
- RF-9: EL SISTEMA instalará, construirá y pasará todos los tests y la revisión de tipos en Linux con las dos versiones de Node.
- RF-10: SI algo falla en Linux por una diferencia de plataforma (binarios, mayúsculas y minúsculas, rutas, saltos de línea, datos regionales, versión de `npm`), ENTONCES EL SISTEMA lo corregirá con ajustes de compatibilidad sin cambiar la web, los datos ni el contrato.
- RF-11: SI un arreglo exigiera cambiar el HTML de la web, los datos, el contrato, el archivo de bloqueo o una dependencia, ENTONCES se detendrá el trabajo y se consultará al responsable. Esta regla prevalece sobre RF-10.
- RF-12: EL SISTEMA no omitirá ni desactivará tests, pasos ni variantes para que la verificación pase.

### Misma web en Linux y en Windows
- RF-13: EL SISTEMA guardará los 12 builds de cada versión de Node de una ejecución de Linux como un archivo temporal de GitHub con vida de 1 día, solo para la comparación puntual.
- RF-14: EL SISTEMA construirá las 12 variantes en Windows desde un clon limpio, con saltos de línea LF y en el mismo commit, con Node 22.23.4 y con Node 24, y las comparará archivo a archivo con las de Linux de la misma versión de Node; el resultado debe ser idéntico (HTML, CSS, JavaScript e imágenes).
- RF-15: SI hay una diferencia entre Linux y Windows, ENTONCES se investigará su causa y se corregirá si es una diferencia de plataforma; si es inevitable o implica cambiar la web, se consultará al responsable.

### Comprobación del propio CI
- RF-16: EL SISTEMA probará que un fallo se marca en rojo creando una rama temporal con un test roto a propósito, comprobando que el resumen indica el paso y la versión (RF-4), y borrando la rama después. La creación y el borrado de esa rama se hacen con la aprobación del responsable.

### Documentación
- RF-17: EL SISTEMA documentará en `AGENTS.md` que existe la verificación en Linux, qué comprueba, cómo ver el resultado, que no bloquea la fusión pero que un rojo se investiga, y qué no cubre (ver «Casos límite»), y retirará de `AGENTS.md` y de `MEMORY.md` el pendiente de «Linux sin verificar».

## Requisitos no funcionales
- **Permisos mínimos:** la verificación solo lee el repositorio. Las acciones de terceros que use son oficiales de GitHub y van fijadas a un commit exacto, no a una etiqueta.
- **Coste:** el repositorio es privado y consume minutos de Actions. Objetivo: menos de 15 minutos por trabajo; tope de 30 (RF-8). Se medirá. SI pasa de 20 minutos, ENTONCES se consulta al responsable antes de ampliar o recortar el alcance. Sin caché de dependencias, salvo que el tiempo lo exija, y entonces se consulta.
- **Fiabilidad:** una caída transitoria del registro de paquetes se resuelve volviendo a ejecutar; no se corrige en el código.
- Sin dependencias nuevas en el proyecto; sin cambios en la web, el contrato ni los datos.
- Idioma: mensajes del proyecto, nombres de pasos y documentación en español.
- Los 700 tests existentes, los 14 de tipos y el comparador siguen en verde en Windows; esa comprobación es manual y local, no del CI.

## Casos límite
- **Mayúsculas y minúsculas en los nombres de archivo:** Linux distingue «Header.astro» de «header.astro»; un import o una ruta mal escritos, que en Windows pasan, fallan en Linux.
- **Saltos de línea:** en Linux los archivos se extraen con LF; los tests de documentos ya toleran CRLF frente a LF (spec 005) y deben pasar igual. La comparación con Windows usa un clon con LF por la misma razón.
- **Rutas:** barras y rutas absolutas en scripts y tests; las variables de datos usan rutas relativas.
- **Formato de precios:** depende de los datos regionales del Node usado; con los binarios oficiales de Node deben coincidir con los de Windows (se verificó en Windows con Node 22 y 24).
- **Binarios de imágenes (`sharp`):** el archivo de bloqueo ya incluye los de Linux (x64, arm64 y musl); si faltara el del sistema del CI, la instalación fallaría y es un hallazgo.
- **Versión de `npm` distinta entre Node 22 y Node 24:** cada Node trae el suyo; si el archivo de bloqueo no se instalara igual con uno, es un hallazgo (RF-11 si exige tocar el archivo de bloqueo).
- **Node 24.x que cambia con el tiempo:** una versión nueva puede romper algo sin que el proyecto cambie; el CI lo mostrará y la versión queda registrada (RF-2).
- **Año del pie:** el pie usa el año del momento del build; la comparación con Windows se hace el mismo día, y fuera de ese año el HTML cambiaría sin ser un defecto.
- **Un pull request que solo cambia documentación:** también ejecuta la verificación (no se excluyen rutas).
- **Distribuciones y arquitecturas:** solo se verifica la de GitHub (Ubuntu, x64). Otras (Alpine, ARM) **no se verifican** y se declara en `AGENTS.md`.
- **Cuota de minutos agotada o Actions apagado:** el CI no se ejecuta; se nota porque el pull request no muestra ninguna ejecución, y `AGENTS.md` lo indica. No se maneja.
- **Fallo transitorio de red al instalar:** se vuelve a ejecutar; no es un fallo del proyecto.
- **El aviso de `npm audit`:** conocido y fuera del CI.
- **Un error en el propio archivo del CI:** se detecta en la primera ejecución del pull request que lo añade (RF-1).
- **Confidencialidad:** el código del repositorio privado se ejecuta en servidores de GitHub, donde ya se aloja; no se envía a ningún otro servicio.

## Fuera de alcance
- Hacer la verificación obligatoria para fusionar (protección de rama) o cambiar ajustes del repositorio.
- Verificar en macOS, Windows en el CI, Alpine/musl o ARM.
- Despliegue, publicación o generación de webs de clientes; el servicio generador no se toca.
- `npm audit`, el aviso de `picomatch` y la actualización automática de dependencias.
- Pruebas de diseño o de navegador en el CI (la cabecera sigue con su verificación manual).
- Cambiar la web, los datos, el contrato, los textos o las dependencias del proyecto.
- Conservar los builds de Linux más de 1 día o añadir la comparación con Windows al CI.
- Gestionar la cuota de minutos de Actions.

## Criterios de finalización
- Una ejecución de la verificación en Linux, con Node 22.23.4 y con la última Node 24.x, pasa en verde con los tests, la revisión de tipos y los 12 builds con `check-dist`, y registra las versiones usadas.
- Los 12 builds de Linux son idénticos, archivo a archivo, a los de Windows de la misma versión de Node (RF-14).
- Una ejecución con un fallo provocado a propósito se marca en rojo con el paso y la versión (RF-16), y la rama temporal se borra.
- La verificación no bloquea la fusión, no modifica el repositorio y no usa secretos.
- Los tests de Windows, el comparador y la revisión de tipos siguen en verde.
- `AGENTS.md` y `MEMORY.md` actualizados.
- Pull request revisado y fusionado con aprobación expresa del responsable.

## Dudas abiertas
Ninguna que bloquee el plan. Resueltas en la revisión previa: cómo verificar (integración continua en GitHub), qué ejecutar (Linux, Node 22.23.4 y la última 24.x), cómo organizarlo (un trabajo por Node, 12 builds en bucle), qué es «igual» (idéntico al de Windows con la misma Node, desde un clon con LF), si bloquea (solo informa; un rojo se investiga) y qué hacer si falla (corregir sin cambiar la web).

Pendiente de confirmar fuera de la spec (no bloquea): en qué distribución y arquitectura de Linux corre el servicio generador. El CI verifica Ubuntu x64; si el servicio usa Alpine o ARM, esa combinación queda sin verificar y habría que ampliar el alcance en otra spec.
