# Spec 010 — Resumen de pasos del CI sin falsos verdes
> Solo el QUÉ y el POR QUÉ. Nada de stack, arquitectura ni nombres de archivos (eso va en plan.md).

## Contexto y objetivo
La verificación en Linux (spec 009) escribe al final de cada trabajo un resumen con el resultado de cada paso y el nombre de los que fallaron. Dos revisiones independientes encontraron defectos bajos en ese resumen, ambos comprobados:

1. **Puede decir «Todos los pasos pasan» sin haber comprobado nada.** Si recibe datos sin ningún paso conocido (porque se renombró un `id` del workflow, por ejemplo), la tabla sale vacía y afirma éxito. Además, un paso que falle y no esté en la tabla de nombres no se nombra, y tres pasos del workflow (descargar el código, instalar Node y registrar las versiones) ni siquiera aparecen en el resumen porque no tienen identificador. Si uno de ellos fallara, los demás se omitirían y el resumen diría igualmente que todo pasa.
2. **Ignora una opción en silencio.** Pasar a la vez el modo de resumen y `--out` entra en el modo resumen y descarta `--out` sin avisar: quien lo escribió creerá que se construyó y se copió algo.

Un resumen de verificación que afirma éxito sin base, o que acepta órdenes que no ejecuta, es peor que no tenerlo. El objetivo es que **el resumen nunca diga «todos pasan» sin base, nombre siempre un paso que falle y rechace las combinaciones que no puede cumplir**, sin cambiar el resultado de los trabajos ni la web.

## Aprobaciones previas (decisiones del responsable)
- Si el resumen no encuentra **ningún paso conocido** (datos vacíos, `null` o solo pasos con otros identificadores), **falla con un error claro y código de salida 2**, sin afirmar nada.
- **Todos los pasos del workflow tendrán identificador**, y cualquier paso con identificador que no esté en la tabla de nombres se muestra con su identificador como nombre y, si falla, se nombra. Así ningún fallo queda sin nombrar.
- **«Todos los pasos pasan» exige que al menos un paso conocido (de la tabla) haya terminado con éxito.** Los pasos desconocidos que pasan se muestran pero no bastan para dar el veredicto.
- Pasar `--resumen-pasos` junto con `--out` **se rechaza con código 2 y un mensaje claro**, sin construir nada y sin escribir el resumen, en cualquier orden de los argumentos.
- **Los identificadores de los pasos van todos en inglés**, renombrando los seis actuales; los nombres visibles del resumen siguen en español.
- **Un test del repositorio, sin dependencias, vigila** que todos los pasos del workflow tengan identificador y estén en la tabla de nombres.

## Usuarios / actores
- **Desarrollador de Pylar Labs y agente de desarrollo:** leen el resumen de cada ejecución para saber qué falló sin abrir los registros.
- **Responsable (tú):** decide si fusionar mirando ese resumen; un falso verde lo induciría a error.

## Historias de usuario
- H1: Como responsable quiero que el resumen nunca diga que todo pasa sin haberlo comprobado, para fiarme de él.
- H2: Como desarrollador quiero que un paso fallido aparezca nombrado aunque sea nuevo o no esté en la tabla, para no buscarlo en los registros.
- H3: Como desarrollador quiero que el script rechace una combinación de opciones que no puede cumplir, para no creer que se hizo algo que no se hizo.
- H4: Como desarrollador quiero que el repositorio me avise si añado un paso sin identificador o sin nombre, para no romper el resumen sin darme cuenta.

## Requisitos funcionales (criterios de aceptación en EARS)

### Resumen de pasos
- RF-1: EL SISTEMA mostrará en el resumen todos los pasos que reciba: primero los conocidos, con su nombre en español y en el orden de la tabla, y a continuación los desconocidos, cada uno con su identificador entre comillas invertidas y en el orden en que lleguen.
- RF-2: SI un paso falló, sea conocido o no, ENTONCES EL SISTEMA lo nombrará en la línea final junto con la versión de Node, en singular si es uno y en plural si son varios. El resultado que manda es el del paso mismo, no el del trabajo.
- RF-3: EL SISTEMA dirá «Todos los pasos pasan» solo si ningún paso falló, ninguno quedó cancelado ni con un resultado que no reconozca, y al menos un paso conocido terminó con éxito.
- RF-4: SI algún paso terminó cancelado o con un resultado que el sistema no reconoce, ENTONCES EL SISTEMA lo nombrará en una línea propia y no dirá «Todos los pasos pasan». Si coexisten varios tipos de problema, escribirá una línea por tipo, en este orden: fallaron, cancelados, resultado no reconocido.
- RF-5: SI no llega ningún paso conocido (datos vacíos, `null` o solo identificadores desconocidos), ENTONCES EL SISTEMA terminará con código 2 y un mensaje en español que explique que no encontró ningún paso conocido (probable cambio de identificadores en el workflow), sin escribir ninguna tabla ni afirmar ningún resultado.
- RF-6: SI llegan pasos conocidos, pero ningún paso falló, ninguno quedó cancelado ni con resultado no reconocido y ninguno conocido terminó con éxito (todos omitidos), ENTONCES EL SISTEMA terminará con código 2 y un mensaje en español que diga que ningún paso conocido se ejecutó, sin afirmar ningún resultado. Un paso fallido siempre se nombra: si hay alguno, no se aplica este requisito.
- RF-7: EL SISTEMA mantendrá el resumen como un paso que no cambia el resultado de los demás: terminará con código 0 cada vez que resuma, haya o no pasos fallidos, cancelados o con resultado no reconocido, y con código 2 solo por un error de uso o de configuración (RF-5, RF-6, argumentos incorrectos, o datos que faltan o no son válidos).
- RF-8: SI falta la versión de Node, ENTONCES EL SISTEMA usará la del proceso que ejecuta el resumen y lo indicará en el título.

### Workflow
- RF-9: EL SISTEMA dará identificador, en inglés, a todos los pasos del workflow, renombrando los seis actuales y añadiéndolo a los tres que hoy no lo tienen (descargar el código, instalar Node y registrar las versiones). El paso final del resumen es el único sin identificador, porque no puede aparecer en su propio resultado. La tabla de nombres incluirá los nueve pasos con identificador, en el orden del workflow.
- RF-10: CUANDO se añada al workflow un paso con identificador que no esté en la tabla, EL SISTEMA lo mostrará al final del resumen y, si falla, lo nombrará (RF-1 y RF-2), sin necesidad de editar el script.
- RF-11: EL SISTEMA tendrá un test del repositorio, sin dependencias nuevas, que lea el texto del workflow y compruebe que todos los pasos salvo el del resumen tienen identificador, que cada identificador está en la tabla de nombres, que la tabla no contiene identificadores que no existan en el workflow y que el orden coincide.

### Argumentos
- RF-12: SI se piden juntos `--resumen-pasos` y `--out`, en cualquier orden, ENTONCES EL SISTEMA terminará con código 2 y un mensaje en español que diga que no se combinan, sin construir ninguna variante, sin copiar nada y sin escribir el resumen. Si además hay argumentos desconocidos, el mismo mensaje los listará todos.
- RF-13: EL SISTEMA seguirá rechazando con código 2 los argumentos desconocidos y `--out` sin valor, como hasta ahora.

### Resultado verificable
- RF-14: EL SISTEMA tendrá tests que cubran cada caso: resumen sin pasos conocidos, paso desconocido que falla, paso desconocido que pasa, un desconocido que pasa con todos los conocidos omitidos, pasos cancelados o con resultado no reconocido (solos y junto a fallidos), todos omitidos, orden de la tabla, versión de Node ausente y combinación de argumentos en los dos órdenes; todo sin construir las 12 variantes.
- RF-15: CUANDO se suba el cambio al pull request, EL SISTEMA ejecutará la verificación en GitHub con las dos versiones de Node y el resumen mostrará los nueve pasos con «Todos los pasos pasan». Los casos de pasos cancelados o con resultado no reconocido solo se cubren con tests, porque en CI el paso del resumen no se ejecuta si el trabajo se cancela.
- RF-16: EL SISTEMA mantendrá en verde los tests existentes y la revisión de tipos, y no cambiará la web, los datos, el contrato ni las dependencias.

### Documentación
- RF-17: EL SISTEMA retirará de `MEMORY.md` los dos defectos pendientes de `ci-verify` y anotará lo aprendido, sin pasar de 50 líneas (hoy tiene 45).

## Requisitos no funcionales
- Sin dependencias nuevas.
- Idioma: mensajes del resumen y documentación en español; identificadores de los pasos en inglés.
- El resumen no debe poder poner en rojo un trabajo verde por una causa distinta de un error de uso o de configuración (código 2), ni ocultar un rojo verdadero. Consecuencia aceptada: si el resumen está mal configurado (por ejemplo, identificadores renombrados sin actualizar la tabla), el paso final sale en rojo aunque el resto de las comprobaciones pasen.
- Coste: cada subida al pull request dispara una ejecución de unos 5 minutos de Actions; se hace una sola subida para el cambio, más las que exija un arreglo.

## Casos límite
- **Datos vacíos o `null`:** error con código 2 (RF-5).
- **Solo identificadores desconocidos:** error con código 2 (RF-5); no se muestran como si fuera un resumen válido.
- **Algún paso conocido y otros desconocidos:** se muestran todos; un desconocido que falla se nombra por su identificador (RF-1, RF-2).
- **Un paso previo falla y los siguientes se omiten:** el fallido se nombra y el resumen sale con código 0; los omitidos se muestran como omitidos y no cuentan como fallo.
- **Todos los pasos conocidos omitidos y un desconocido que pasa:** error con código 2 (RF-6); el desconocido no basta para el veredicto.
- **Todos los pasos conocidos omitidos y un desconocido que falla:** se nombra el fallo y el resumen sale con código 0 (RF-2, RF-7).
- **Pasos cancelados o con resultado no reconocido:** se muestran y se nombran; no se dice «Todos los pasos pasan» (RF-4).
- **Un paso nuevo sin entrada en la tabla que pasa:** se muestra con su identificador y no afecta al veredicto.
- **`--resumen-pasos` y `--out` en cualquier orden:** se rechaza igual (RF-12).
- **Falta `STEPS_JSON` o no es JSON:** sigue siendo error con código 2.
- **Falta la versión de Node:** se usa la del proceso y se indica (RF-8).
- **Cancelación del trabajo:** el paso de resumen no se ejecuta, como hoy.

## Fuera de alcance
- Cambiar qué comprueba el CI, las versiones de Node, el runner o las acciones.
- Detectar identificadores repetidos o reutilizados con otro significado, el límite de tamaño de la entrada del resumen y los caracteres especiales en identificadores (GitHub solo admite letras, números, guiones y guiones bajos).
- Los demás hallazgos menores de la revisión de código (enlaces simbólicos, avisos de deprecación, tiempo máximo de cada comando).
- Hacer que el CI bloquee fusiones, `npm audit`, Alpine, ARM o macOS.
- Cambiar la web, los datos, el contrato o las dependencias.

## Criterios de finalización
- Los casos de RF-1 a RF-13 tienen test y pasan, y los tests existentes siguen en verde.
- El ensayo local con datos de ejemplo muestra el comportamiento de cada caso (sin pasos, paso desconocido fallido, combinación de argumentos).
- Una ejecución verde en GitHub con Node 22.23.4 y la última 24.x muestra los nueve pasos y «Todos los pasos pasan» (RF-15).
- `MEMORY.md` actualizado.
- Pull request revisado y fusionado con aprobación expresa del responsable.

## Dudas abiertas
Ninguna que bloquee el plan. Resueltas en la revisión previa: qué hacer sin pasos conocidos (error con código 2), cómo cubrir los pasos sin nombre o sin identificador (dar identificador a todos y mostrar los desconocidos por su identificador), qué hacer con `--resumen-pasos` junto a `--out` (rechazar con código 2), qué cuenta como éxito (al menos un paso conocido), el idioma de los identificadores (inglés, renombrando los seis actuales) y quién vigila los identificadores (un test del repositorio sin dependencias).

Los nombres exactos de los nueve identificadores se fijan en el plan.
