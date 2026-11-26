# Spec 002 — Actualizar Astro a la versión 7 (alertas de seguridad)
> Solo el QUÉ y el POR QUÉ. Nada de stack, arquitectura ni nombres de archivos (eso va en plan.md).
> Nota: esta spec nombra paquetes y versiones (`astro`, `sharp`, `esbuild`, React, Tailwind, Node) porque son el tema mismo del cambio; es un desvío consciente de la plantilla.

## Contexto y objetivo
Dependabot mantiene **12 avisos de seguridad abiertos** sobre el proyecto (1 crítica, 3 altas, 5 medias y 3 bajas), todos en tres componentes: `astro` (8), `sharp` (3) y `esbuild` (1). La actualización de las dependencias transitivas ya cerró otros 30. Estos 12 solo tienen corrección en Astro 7, un cambio de versión mayor. El aviso crítico es una ejecución remota de código al optimizar imágenes AVIF.

Las webs que se generan son estáticas, y la mayoría de estas vulnerabilidades afectan a funciones que no se usan (servidor, optimización de imágenes de Astro, transiciones, MDX). La exposición real es baja, pero no nula: afecta a las herramientas de construcción y al servidor de desarrollo, y el servicio generador construirá webs de clientes de forma automática. El objetivo es **cerrar esos 12 avisos sin cambiar nada de lo que ve el visitante ni de lo que consume el generador**.

Una prueba aislada previa (solo resolución de versiones, sin instalar ni construir) indica que Astro 7.4.12 con la integración de React 7.1.9 deja la auditoría en 0 vulnerabilidades: `sharp` resuelve a 0.35.5 y `esbuild` deja de ser dependencia. Es una señal, no una garantía: falta comprobar que compile y se vea igual.

## Usuarios / actores
- **Responsable del proyecto:** aprueba cada paso, decide qué es un bloqueo y autoriza la fusión.
- **Desarrollador de Pylar Labs:** mantiene el proyecto y necesita poder confiar en que la actualización no rompe nada y se puede revertir.
- **Servicio generador:** construye las webs de los clientes. Su entorno debe cumplir el nuevo mínimo de Node y el contrato de datos que consume no debe cambiar.
- **Visitante de las webs:** no debe notar ningún cambio.

## Aprobaciones previas
El responsable del proyecto aprobó expresamente, antes de redactar esta spec:
- Subir el mínimo de Node a la versión que exija Astro 7 (hoy ≥ 22.23.4).
- Tratar el cambio con una spec propia y con rama aparte, numerada 002 (la spec de textos fijos de la sección "Quiénes somos" pasa a ser la 003).
- La actualización de `astro` y de la integración de React. No se necesita ninguna dependencia nueva: la que se había planteado (un par de la integración de React) resultó ser opcional y no se instala.

## Historias de usuario
- H1: Como responsable quiero cerrar los 12 avisos para dejar de arrastrar vulnerabilidades conocidas, incluida la crítica.
- H2: Como servicio generador quiero que el contrato de datos 2.0 no cambie para seguir produciendo datos válidos sin ajustes.
- H3: Como visitante quiero que la web se vea y funcione igual para no percibir ningún cambio.
- H4: Como responsable quiero que, si la actualización se bloquea, el trabajo se detenga sin tocar `master` para no romper lo que ya funciona.
- H5: Como responsable quiero poder deshacer la actualización en un solo paso si aparece una regresión tras fusionarla.

## Requisitos funcionales (criterios de aceptación en EARS)

### Seguridad
- RF-1: CUANDO termine la actualización, EL SISTEMA no tendrá marcados `astro`, `sharp` ni `esbuild` en la auditoría local de dependencias sobre el archivo de bloqueo final.
- RF-2: CUANDO se fusione y GitHub reescanee el repositorio, EL SISTEMA tendrá cerrados los 12 avisos de la lista congelada (Anexo); se esperará una hora para el reescaneo.
- RF-3: SI, pasada esa hora, GitHub mantiene abierto un aviso cuyo parche ya está instalado, ENTONCES se investigará y se informará al responsable; descartarlo en GitHub, con su motivo, lo decide el responsable.
- RF-4: SI aparece una alerta nueva (incluso sobre los mismos componentes), ENTONCES se registrará y se resolverá aparte, y no impedirá dar esta spec por cumplida si los 12 avisos congelados están cerrados.
- RF-5: SI la propia actualización introduce alertas nuevas en paquetes nuevos, ENTONCES EL SISTEMA las informará al responsable antes de fusionar, para que decida.

### Resultado visible
- RF-6: EL SISTEMA producirá, con los datos demo, mínimos y máximos, webs que se ven iguales a las anteriores a 375 px y a 1280 px.
- RF-7: EL SISTEMA comparará el HTML construido antes y después ignorando únicamente la etiqueta del generador, los nombres de archivo con huella y la repetición de espacios; las diferencias restantes se revisarán una a una por una persona y se explicarán. Además se compararán capturas antes y después, a esos dos anchos, de las tres variantes.
- RF-8: EL SISTEMA considerará irrelevante una diferencia que no cambie el texto ni el espaciado visible a esos anchos; SI una diferencia sí los cambia (por ejemplo, un espacio que desaparece entre dos elementos en línea), ENTONCES se corregirá antes de dar el trabajo por terminado.
- RF-9: EL SISTEMA mantendrá las funciones de la web: enlaces internos sin roturas, menú, enlaces de WhatsApp con el número de contacto y secciones opcionales omitidas cuando faltan sus datos.

### Contrato de datos
- RF-10: EL SISTEMA mantendrá el contrato de datos en la versión 2.0, con los mismos campos, reglas, códigos de error y mensajes.
- RF-11: EL SISTEMA dejará idénticos los documentos generados del contrato y los 416 tests existentes pasarán sin modificar ninguno; como ya existe un test que compara los documentos regenerados con los versionados, cualquier diferencia hará fallar un test y se tratará como bloqueo.
- RF-12: SI algún test necesita cambiar para que la actualización funcione, ENTONCES EL SISTEMA lo tratará como un bloqueo (RF-18).

### Compatibilidad y entorno
- RF-13: EL SISTEMA actualizará a Astro 7.4.12 (o a una 7.x posterior, nunca a otra versión mayor) y declarará como mínimo la versión de Node que esa versión exija.
- RF-14: EL SISTEMA no añadirá ninguna dependencia directa nueva: se actualizan `astro` y la integración de React; la integración de Tailwind solo podrá cambiar de versión dentro de su misma versión mayor (4.x) y solo si hace falta para que compile; un salto mayor será un bloqueo. Las dependencias transitivas cambiarán y no se limitan.
- RF-15: ANTES de fusionar, el responsable confirmará que el entorno del servicio generador (y cualquier otro que construya el proyecto) usa la versión mínima de Node; SI no hay esa confirmación, ENTONCES el pull request quedará listo pero no se fusionará.
- RF-16: EL SISTEMA seguirá validando los datos antes de construir: con datos inválidos la construcción falla mostrando la lista completa de errores, y con datos válidos termina bien.
- RF-17: SI hace falta corregir las plantillas para que compilen o se vean igual (por ejemplo, un HTML que el compilador nuevo rechaza), ENTONCES EL SISTEMA aplicará el ajuste mínimo: el que no cambia el diseño ni la estructura de los componentes; ante la duda se preguntará, y un cambio de estructura cuenta como reescritura (RF-18).

### Bloqueos, ramas y reversión
- RF-18: EL SISTEMA considerará bloqueo todo problema que no se resuelva con un ajuste mínimo (RF-17) y que obligaría a tocar algo fuera de alcance: el contrato de datos, los tests, quitar React o reescribir componentes. Lo declara el desarrollador y lo confirma el responsable.
- RF-19: SI hay un bloqueo, ENTONCES EL SISTEMA detendrá el trabajo, lo informará, no fusionará la rama y lo documentará en el pull request, que se cerrará sin fusionar; `master` quedará en Astro 6, y cualquier cambio documental en `master` (por ejemplo, la memoria del proyecto) se hará solo con aprobación y en un commit aparte.
- RF-20: EL SISTEMA realizará todo el trabajo en una rama aparte y solo cambiará `master` tras verificación y aprobación expresa del responsable, dada por escrito en la conversación.
- RF-21: ANTES de fusionar, EL SISTEMA actualizará la rama con `master`; SI el archivo de bloqueo entra en conflicto, ENTONCES lo regenerará y repetirá la verificación completa.
- RF-22: SI tras fusionar aparece una regresión visible o de contrato, ENTONCES EL SISTEMA revertirá primero la fusión en un solo paso y corregirá después en otra rama.

### Verificación
- RF-23: EL SISTEMA verificará, sobre una instalación limpia desde el archivo de bloqueo, los tests, las tres construcciones (demo, mínima y máxima) y el comprobador de la web construida.
- RF-24: EL SISTEMA verificará que el servidor de desarrollo y la vista previa sirven la web sin errores de consola.
- RF-25: EL SISTEMA verificará, en la web real, que el HTML escrito en un texto se muestra literal y no se ejecuta, y que los textos largos con saltos de línea se muestran igual que antes.
- RF-26: EL SISTEMA registrará, sin exigir ningún valor, el tamaño de la salida y el tiempo de construcción antes y después.
- RF-27: EL SISTEMA declarará como limitación conocida que la compatibilidad con Linux no se puede verificar desde el entorno de trabajo, y recomendará probar primero en el servicio generador tras fusionar.
- RF-28: EL SISTEMA comprobará que el bloqueo de scripts de instalación que aplica npm a `sharp` y `esbuild` no impide construir ni probar.

### Documentación
- RF-29: EL SISTEMA reflejará en `AGENTS.md` las versiones y el nuevo mínimo de Node, y dejará el estado actualizado en `MEMORY.md`; el README queda fuera.

## Requisitos no funcionales
- **Reversible:** el cambio se revierte como un conjunto, con un solo paso.
- **Sin cambios de funcionalidad:** es una actualización de seguridad, no una mejora.
- **Sin dependencias directas nuevas.**

## Casos límite
- Una alerta nueva aparece durante el trabajo (ya pasó: 6 en un día): se registra y no bloquea (RF-4).
- GitHub tarda en reescanear tras fusionar: no se declara el éxito hasta que lo confirme; la auditoría local es una señal previa, no la definitiva.
- El servicio generador corre una versión de Node inferior a la mínima: por defecto npm solo avisa y no frena la instalación, por eso la confirmación previa de RF-15.
- El compilador nuevo rechaza HTML que el anterior toleraba: ajuste mínimo según RF-17.
- La compresión del HTML elimina un espacio entre elementos en línea: se detecta en la lista de diferencias y se corrige según RF-8.
- Una dependencia directa (React, Tailwind) no es compatible con la versión nueva y no se resuelve dentro de lo permitido: bloqueo (RF-18).
- `sharp` es una dependencia opcional con binarios por plataforma: solo se puede verificar en la plataforma de trabajo (RF-27).
- Un aviso nuevo de `sharp` o `esbuild` exige una versión que Astro 7 no resuelva: se informa y se trata como RF-4 si no pertenece a los 12 congelados.
- El archivo de bloqueo choca con otro trabajo en `master`: RF-21.

## Fuera de alcance
- Adoptar funciones nuevas de Astro 7 o reorganizar código para aprovecharlas.
- Quitar React o reescribir los componentes Button y Card.
- Instalar `typescript` para revisar tipos (sigue pendiente aparte).
- Tocar los textos fijos de la sección "Quiénes somos" (spec 003).
- Añadir dependencias directas nuevas; subir la integración de Tailwind a otra versión mayor.
- Cambiar el contrato de datos 2.0.
- Quitar las opciones experimentales de los scripts de Node, aunque con el nuevo mínimo ya no hagan falta.
- Configurar npm para que la instalación falle con una versión de Node inferior, y añadir integración continua.
- Actualizar el README.

## Criterios de finalización
- La auditoría local no marca `astro`, `sharp` ni `esbuild`, y GitHub muestra cerrados los 12 avisos del Anexo.
- Los 416 tests pasan sin haber modificado ninguno y los documentos generados del contrato quedan idénticos.
- La instalación limpia, las tres construcciones y el comprobador de la web construida pasan.
- La lista de diferencias de HTML está revisada y explicada, y las capturas a 375 px y 1280 px de las tres variantes no muestran diferencias perceptibles.
- El servidor de desarrollo y la vista previa sirven la web sin errores de consola; el escape de HTML y los textos largos se comprobaron en la web real.
- La construcción falla con datos inválidos mostrando todos los errores, y termina bien con datos válidos.
- El responsable confirmó el Node del servicio generador antes de fusionar (RF-15).
- `AGENTS.md` y `MEMORY.md` están actualizados.
- El pull request se fusionó con la aprobación expresa del responsable.

## Anexo — Avisos congelados (12)
Lista fijada el 16 de noviembre de 2026 por identificador público; los números de alerta de GitHub pueden cambiar.

| Componente | Gravedad | Aviso | Parche en |
|---|---|---|---|
| astro | crítica | GHSA-26w7-cxv4-gfx2 | 7.2.8 |
| astro | media | GHSA-376h-93r7-7g6f | 7.2.4 |
| astro | media | GHSA-4g3v-8h47-v7g6 | 7.1.0 |
| astro | media | GHSA-98hj-9722-w3j8 | 7.3.2 |
| astro | media | GHSA-f48w-9m4c-m7f5 | 7.0.6 |
| astro | media | GHSA-r3h5-4585-7x3w | 7.4.7 |
| astro | baja | GHSA-7pw4-f3q4-r2p2 | 7.0.4 |
| astro | baja | GHSA-mh32-jxcr-mh9f | 7.4.5 |
| sharp | alta | GHSA-f88m-g3jw-g9cj | 0.35.0 |
| sharp | alta | GHSA-rgj7-g3m4-5g8c | 0.35.4 |
| sharp | alta | GHSA-wq5f-xc86-pv6w | 0.35.5 |
| esbuild | baja | GHSA-g7r4-m6w7-qqqr | 0.28.1 |

## Dudas abiertas
- Resuelta: la integración de Tailwind (4.3.1, sin cambios) funciona con Vite 8. Se verificó con una instalación limpia y tres construcciones reales en una copia desechable.
- Resuelta: el plazo de espera para el reescaneo de GitHub es de una hora; pasado ese tiempo se investiga un aviso que siga abierto (RF-2, RF-3).
