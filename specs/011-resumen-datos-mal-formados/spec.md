# Spec 011 — Resumen de pasos: datos mal formados y versión de Node en blanco
> Solo el QUÉ y el POR QUÉ. Nada de stack, arquitectura ni nombres de archivos (eso va en plan.md).

## Contexto y objetivo
La spec 010 hizo que el resumen de pasos del CI nunca diga «todos pasan» sin base. Su revisión independiente dejó tres defectos bajos, comprobados al ejecutarlos y aceptados entonces como pendientes:

1. **Un paso que no es un objeto** (por ejemplo `{"install":"success"}`) se muestra como «desconocido», se nombra como resultado no reconocido y el resumen sale con código 0, como si fuera un resultado más. En realidad los datos no tienen la forma que entrega el workflow.
2. **Un conjunto de datos que no es un objeto** (un array, `null`, un texto o un número) da el mensaje «ningún paso conocido», que sugiere renombrar identificadores del workflow cuando el problema es la forma de los datos.
3. **Una versión de Node con solo espacios** deja el título del resumen en blanco, en vez de usar la versión del proceso e indicarlo, como ya se hace cuando falta.

Un resumen que presenta como resultado datos que no puede interpretar, o que manda a buscar el problema donde no está, hace perder tiempo y resta confianza. El objetivo es que **los datos mal formados se rechacen con un mensaje que diga qué forma esperaba y qué recibió, y que el título nunca quede vacío**, sin cambiar el comportamiento de los datos bien formados ni la web.

## Aprobaciones previas (decisiones del responsable)
- Un paso que no es un objeto se rechaza como **error de datos, con código de salida 2**.
- **Bien formado** significa: el conjunto es un objeto y cada paso es otro objeto. Un conjunto vacío (`{}`) sigue siendo un caso aparte: «ningún paso conocido».
- Una versión de Node vacía o de solo espacios **se trata como ausente**: se usa la del proceso y se indica; con valor, se usa sin los espacios sobrantes a los lados.
- El contenido de `outcome` (ausente, raro o que no sea texto) **queda fuera**: se sigue mostrando como resultado no reconocido, como hoy.
- Si hay varios problemas de forma a la vez, **se informan todos en un solo mensaje**, cada paso por su identificador.
- El mensaje sobre un conjunto que no es un objeto indica **solo el tipo recibido**, sin copiar su contenido.
- «Vacía o solo espacios» significa **cualquier espacio en blanco** (espacios, tabuladores, saltos de línea y espacios Unicode); se recortan a ambos lados y, si no queda nada, la versión se trata como ausente, con **el mismo texto de indicación que hoy**.
- Un booleano (`true` o `false`), como conjunto o como paso, **es mala forma**, igual que un texto o un número.
- Los errores nuevos son **texto libre en español**, como los demás mensajes del script; no llevan ruta ni código estable.
- Cuando los datos tienen mala forma **no se escribe nada en el resumen del trabajo de GitHub**: el motivo queda en el registro del paso, como con los demás errores de la spec 010.

## Términos
- **Conjunto:** el valor JSON completo recibido con el resultado de los pasos.
- **Paso:** cada valor asociado a un identificador dentro del conjunto.
- **Objeto, array, texto, número, booleano y `null`:** los tipos de JSON. «Objeto» excluye los arrays y `null`.

## Usuarios / actores
- **Desarrollador de Pylar Labs y agente de desarrollo:** leen el resumen y, si el paso final falla en rojo, el mensaje de error para saber qué corregir.
- **Responsable (tú):** decide si fusionar mirando el resumen.

## Historias de usuario
- H1: Como desarrollador quiero que un resultado con forma inesperada se rechace con un mensaje claro, para no tomarlo por un resultado válido.
- H2: Como desarrollador quiero que el mensaje distinga «los datos tienen mala forma» de «no hay pasos conocidos», para buscar el problema donde está.
- H3: Como desarrollador quiero que el título del resumen siempre lleve una versión de Node legible, para no leer un título en blanco.

## Requisitos funcionales (criterios de aceptación en EARS)

### Forma de los datos
- RF-1: SI el conjunto de pasos recibido no es un objeto (un array, `null`, un texto, un número o un booleano), ENTONCES EL SISTEMA terminará con código 2 y un mensaje en español que diga que los datos no tienen la forma esperada (un objeto con un resultado por paso) e indique el tipo recibido, sin copiar su contenido, sin escribir ninguna tabla ni afirmar ningún resultado. Lo mismo vale cuando se invoque el resumen sin conjunto alguno (valor ausente).
- RF-2: SI uno o varios pasos no son un objeto (un texto, un número, un booleano, `null` o un array), ENTONCES EL SISTEMA terminará con código 2 y un mensaje en español que liste todos esos pasos por su identificador, entre comillas invertidas, con el tipo recibido de cada uno, y diga qué se esperaba (un objeto con el resultado del paso), sin escribir ninguna tabla ni afirmar ningún resultado. Aplica a pasos conocidos y desconocidos por igual. Un identificador se lista tal cual llega, sea cual sea.
- RF-3: EL SISTEMA comprobará los datos en este orden y se detendrá en el primer problema: (1) forma del conjunto, (2) forma de los pasos, (3) ningún paso conocido, (4) todos los pasos conocidos omitidos. Si hay a la vez problemas de forma y ningún paso conocido, se informa el de forma.
- RF-4: EL SISTEMA mantendrá sin cambios el caso de un conjunto vacío (`{}`) y el de solo pasos desconocidos bien formados: código 2 con el mensaje «ningún paso conocido» de la spec 010.
- RF-5: EL SISTEMA mantendrá sin cambios el tratamiento de los pasos que son objetos, haya o no `outcome` y sea cual sea: se muestran y, si su resultado no se reconoce, se nombran, como hoy.

### Versión de Node
- RF-6: SI la versión de Node falta, está vacía o contiene solo espacios en blanco (espacios, tabuladores, saltos de línea o espacios Unicode), ENTONCES EL SISTEMA usará la versión del proceso que ejecuta el resumen y lo indicará en el título con el mismo texto que hoy, tanto si falta como si está en blanco.
- RF-7: SI la versión de Node tiene valor, ENTONCES EL SISTEMA la usará sin los espacios en blanco sobrantes a ambos lados, tanto en el título como en las líneas finales (fallaron, cancelados y resultado no reconocido). No se valida su contenido.

### Código de salida
- RF-8: EL SISTEMA mantendrá el código de salida de la spec 010: 0 cada vez que resume (haya o no pasos fallidos, cancelados o no reconocidos) y 2 solo por un error de uso, de configuración o de datos, incluidos los nuevos de RF-1 y RF-2. Los argumentos, `STEPS_JSON` ausente o no válido y el resto del comportamiento no cambian. En un error de datos no se escribe nada en el resumen del trabajo de GitHub (RF-1 y RF-2).

### Resultado verificable
- RF-9: EL SISTEMA tendrá tests que cubran cada caso: conjunto que es array, `null`, texto, número, booleano y valor ausente; un paso que es texto, número, booleano, `null` y array; un paso que es un objeto vacío (se muestra como no reconocido); varios pasos mal formados a la vez; mala forma junto con ningún paso conocido; conjunto vacío sin cambios; versión de Node vacía, de solo espacios y con espacios a los lados; y que los datos bien formados dan el mismo resumen que antes. Los tests fijan las palabras que importan (forma esperada, tipo recibido, identificadores entre comillas invertidas), no el texto completo. Todo sin construir las 12 variantes.
- RF-10: EL SISTEMA mantendrá en verde los tests existentes (salvo los que verifican el mensaje de `null`, de array y de ausencia de conjunto, que pasan a esperar el de forma de datos), la regla de `AGENTS.md` y el contrato, la revisión de tipos y el build, y no cambiará la web, los datos, el contrato ni las dependencias.
- RF-11: CUANDO se suba el cambio al pull request, EL SISTEMA ejecutará la verificación en GitHub con las dos versiones de Node y el resumen seguirá mostrando los nueve pasos con «Todos los pasos pasan». Los casos de datos mal formados solo se cubren con tests y ensayo local: el workflow siempre entrega datos bien formados.

### Documentación
- RF-12: EL SISTEMA retirará de `MEMORY.md` los tres defectos bajos pendientes y anotará lo aprendido, sin pasar de 50 líneas (hoy tiene 46).

## Requisitos no funcionales
- Sin dependencias nuevas.
- Idioma: mensajes del resumen y documentación en español.
- El resumen no debe poder poner en rojo un trabajo verde por una causa distinta de un error de uso, de configuración o de datos (código 2), ni ocultar un rojo verdadero. El workflow real entrega siempre datos bien formados, así que estos errores no deberían verse en el CI salvo que cambie la forma de `toJSON(steps)`.

## Casos límite
- **Conjunto `null`:** pasa a error de forma de datos (RF-1); en la spec 010 daba «ningún paso conocido». Mismo código 2, mensaje más preciso.
- **Conjunto array (vacío o no):** error de forma (RF-1), incluido `[]`, que no es un objeto.
- **Conjunto booleano, texto o número:** error de forma (RF-1), con el tipo recibido.
- **Conjunto `{}`:** sigue siendo «ningún paso conocido» (RF-4).
- **Paso `{}`:** objeto vacío, bien formado: se muestra como resultado no reconocido (RF-5).
- **Identificador raro** (`__proto__`, con comillas invertidas, muy largo): se trata como cualquier otro y se lista tal cual; validarlos está fuera de alcance.
- **Muchos pasos mal formados:** se listan todos; limitar el tamaño de la entrada está fuera de alcance.
- **Claves repetidas en el JSON:** vale la última, como en cualquier lector de JSON.
- **Paso `null` o array:** error de forma de pasos (RF-2); no son objetos.
- **Paso que es objeto sin `outcome`, con `outcome` raro o que no es texto:** se muestra y se nombra como resultado no reconocido, como hoy (RF-5).
- **Paso mal formado y desconocido, junto a pasos conocidos correctos:** error de forma (RF-2); no se resume nada, porque los datos no son fiables.
- **Varios pasos mal formados:** un solo mensaje que los lista todos (RF-2).
- **Mala forma y ningún paso conocido a la vez:** gana el mensaje de forma (RF-3).
- **Versión de Node con espacios en blanco a los lados:** se recorta (RF-7); solo con ellos, se trata como ausente (RF-6).
- **Versión de Node con un valor sin sentido** (`abc`) o con saltos de línea en medio: se usa tal cual, sin validar; fuera de alcance.
- **Falta `STEPS_JSON` o no es JSON:** sigue siendo error con código 2, sin cambios.

## Fuera de alcance
- El contenido de `outcome`: ausente, raro, que no sea texto o que contenga caracteres especiales de la tabla (ya se muestran sin romper la tabla desde la spec 010).
- Validar los identificadores de los pasos (caracteres, repetidos), validar el contenido de la versión de Node o limitar el tamaño de la entrada.
- Cambiar qué comprueba el CI, las versiones de Node, el runner, las acciones o los identificadores del workflow.
- Los demás hallazgos menores de revisiones anteriores (enlaces simbólicos, avisos de deprecación, tiempo máximo de cada comando).
- Cambiar la web, los datos, el contrato o las dependencias.

## Criterios de finalización
- Los casos de RF-1 a RF-8 tienen test y pasan, y los tests existentes siguen en verde salvo los de RF-10 actualizados.
- El ensayo local con datos de ejemplo muestra el comportamiento de cada caso (conjunto array, paso de texto, varios pasos mal formados, versión en blanco).
- Una ejecución verde en GitHub con Node 22.23.4 y la última 24.x muestra los nueve pasos y «Todos los pasos pasan».
- `MEMORY.md` actualizado.
- Pull request revisado y fusionado con aprobación expresa del responsable.

## Dudas abiertas
Ninguna. Resueltas en la revisión previa y en la aclaración: qué hacer con un paso que no es objeto (error de datos con código 2), qué es «bien formado» (objeto de objetos, con el contenido de `outcome` fuera de alcance), cómo tratar una versión de Node en blanco (como ausente, cualquier espacio en blanco, mismo texto de indicación), cómo informar varios problemas (todos en un mensaje), qué detalle dar del tipo recibido (solo el tipo), los booleanos (mala forma), el formato de los errores (texto libre en español) y que el resumen del trabajo no se escribe en un error de datos.

Decisión derivada que conviene revisar: pasar `null` y los arrays al mensaje de forma cambia el texto que la spec 010 daba para esos dos casos (el código de salida sigue siendo 2). Se actualizan los tests que lo fijaban (RF-10).
