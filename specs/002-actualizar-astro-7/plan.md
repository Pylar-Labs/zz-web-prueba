# Plan 002 — Actualizar Astro a la versión 7 (alertas de seguridad)
> El CÓMO. Debe cumplir `docs/constitution.md` y cubrir todos los RF de `spec.md`.

## Enfoque técnico
Es una actualización de dependencias **sin cambios de código previstos**. Se hace en una rama aparte (`chore/astro-7`, desde `master`) y consiste en:

1. Subir `astro` a 7.4.12 y `@astrojs/react` a 7.1.9 (esto actualiza `package.json` y `package-lock.json`).
2. Subir `engines.node` a `>=22.23.4`.
3. Verificar con los criterios de la spec y abrir un pull request. La fusión espera la confirmación de Node del responsable (RF-15).

**Evidencia previa (prueba real en una copia desechable fuera del repositorio):** instalación limpia con Astro 7.4.12 + `@astrojs/react` 7.1.9 y Tailwind sin tocar (4.3.1).

| Comprobación | Astro 6 (base) | Astro 7 (prueba) |
|---|---|---|
| `npm audit` | 3 vulnerabilidades | **0** |
| Tests del contrato | 416 de 416 | **416 de 416** (ver riesgo 1) |
| Build demo / mínima / máxima | correcto | **correcto**, `check-dist` en verde |
| Archivos del proyecto modificados | — | **ninguno** (compiló tal cual) |
| Salida (bytes) demo / mín. / máx. | 262 065 / 236 587 / 420 930 | 259 502 / 234 092 / 418 293 |
| Construcción de Astro (s) demo / mín. / máx. | 10,6 / 5,5 / 5,9 | 2,6 / 2,3 / 1,9 |
| Versiones | vite 7.3.8, sharp 0.34.5, esbuild 0.27.7 | vite 8.3.8, sharp 0.35.5, **esbuild ya no es dependencia** |
| `oxc-transform-react` | — | no se instala (par opcional) |

**Qué cambia en el HTML (RF-7):** la estructura, los atributos y el texto son idénticos en las tres variantes. Astro 7 solo (a) quita espacios entre etiquetas y alrededor del texto (288, 213 y 362 espacios) y (b) minifica distinto el `<script>` del menú (mismo código, `var` y plantillas en lugar de `const` y comillas). Los puntos donde se tocan elementos en línea son 3 distintos (las tres barras del botón de menú, los botones del hero y los enlaces de redes del pie) y los tres están dentro de contenedores `flex`, donde el espacio no se ve. Falta confirmarlo con capturas.

**Alternativas descartadas:**
- *Quitar React:* fuera de alcance (la spec lo excluye).
- *Instalar `oxc-transform-react`:* es opcional y no hace falta; no se añade (RF-14).
- *`overrides` para forzar `sharp` y `esbuild` en Astro 6:* deja 8 avisos de `astro` abiertos, incluido el crítico.

## Archivos a crear / modificar
| Archivo | Cambio |
|---|---|
| `package.json` | `astro` → `^7.4.12`, `@astrojs/react` → `^7.1.9`, `engines.node` → `>=22.23.4`. Nada más. |
| `package-lock.json` | Regenerado por npm (árbol más pequeño, sin `esbuild`). |
| `AGENTS.md` | Línea de stack (Astro 7, Node ≥ 22.23.4) y una nota con la limitación de Linux (RF-27, RF-29). |
| `MEMORY.md` | Estado, decisiones y qué quedó pendiente (RF-29). |
| `specs/002-actualizar-astro-7/spec.md` | Cerrar las dos dudas abiertas con lo ya resuelto (plazo de 1 hora; Tailwind verificado). |
| `scripts/compare-builds.mjs` | **Nuevo, aprobado por el responsable.** Compara dos carpetas de build y lista las diferencias de HTML que quedan tras ignorar la etiqueta del generador, los nombres con huella, los scripts minificados y la repetición de espacios (RF-7). Sin dependencias. |

Sin cambios previstos: `src/`, `scripts/` existentes, fixtures, `docs/` generados, `.mcp.json`, `README.md`. Si algo en `src/` tuviera que cambiar, se aplica RF-17 (ajuste mínimo) o se declara bloqueo (RF-18).

## Modelo de datos / interfaces
El **contrato de datos 2.0 no cambia** (RF-10): mismos campos, reglas, códigos y mensajes. Los documentos generados se mantienen idénticos en contenido (RF-11).

**Dependencias directas, antes y después:**

| Paquete | Antes | Después |
|---|---|---|
| astro | ^6.4.6 (instalada 6.4.8) | ^7.4.12 |
| @astrojs/react | ^5.0.7 | ^7.1.9 |
| @tailwindcss/vite, tailwindcss | ^4.3.1 | sin cambios |
| react, react-dom, shadcn y demás | — | sin cambios |
| node (`engines`) | >=22.12.0 | >=22.23.4 |

Compatibilidad hacia atrás: ninguna necesaria para los datos. Sí cambia el entorno: quien construya el proyecto necesita Node ≥ 22.23.4 (npm solo avisa si no lo cumple, no frena la instalación).

## Mapa RF → implementación → test
| RF | Dónde se implementa | Cómo se verifica |
|---|---|---|
| RF-1 | `package-lock.json` regenerado | `npm audit` sin `astro`, `sharp` ni `esbuild` (prueba previa: 0) |
| RF-2, RF-3 | Tras fusionar | Consulta de alertas abiertas por GHSA contra el Anexo, a la hora de fusionar; si algo sigue abierto con parche instalado, se investiga e informa |
| RF-4, RF-5 | Antes y después de la actualización | Lista de alertas y de `npm audit` antes/después; cualquier alerta nueva se informa antes de fusionar |
| RF-6, RF-7, RF-8 | `scripts/compare-builds.mjs` | Lista de diferencias de HTML revisada una a una, más capturas a 375 px y 1280 px de las tres variantes, antes y después |
| RF-9 | Sin cambios de código | `check-dist` y capturas (menú, enlaces, WhatsApp, secciones opcionales omitidas) |
| RF-10, RF-11, RF-12 | Sin cambios | `npm run test:schema` en verde sin tocar ningún test; el test de documentos compara el contenido |
| RF-13 | `package.json` | `npm ls astro` muestra 7.4.12 o una 7.x posterior |
| RF-14 | `package.json` | `git diff package.json` solo toca esas dos dependencias y `engines`; `npm ls oxc-transform-react` vacío; Tailwind sin cambio |
| RF-15 | Lista de comprobación en el pull request | Confirmación escrita del responsable antes de fusionar |
| RF-16 | Sin cambios | Build con datos inválidos falla con la lista completa, y con datos válidos termina bien (como en la spec 001) |
| RF-17 | Solo si hiciera falta | En la prueba no fue necesario; cualquier ajuste se documenta en el pull request |
| RF-18, RF-19 | Proceso | Registro del bloqueo en el pull request, que se cierra sin fusionar; `master` queda en Astro 6 |
| RF-20, RF-21 | Rama `chore/astro-7` | Pull request; `master` se fusiona en la rama antes de fusionar; si el lockfile choca, se regenera y se repite la verificación |
| RF-22 | Proceso | `git revert -m 1` del merge, descrito en el pull request |
| RF-23 | Clon limpio | Clon nuevo con `core.autocrlf=false`, `npm ci`, `npm run test:schema`, tres builds y `check-dist` |
| RF-24 | Sin cambios | Servidor de desarrollo y vista previa abiertos con Chrome DevTools: consola sin errores |
| RF-25 | Sin cambios | Build con datos que contienen `<b>` y `<script>` y con textos largos con saltos de línea; comprobación en `dist` y en pantalla, como en la spec 001 |
| RF-26 | Registro | Tabla de tamaño y tiempo antes y después (la de este plan, repetida con los valores finales) |
| RF-27 | `AGENTS.md` y pull request | Limitación declarada: Linux no verificable aquí |
| RF-28 | `npm ci` en el clon limpio | El build y los tests pasan con los scripts de instalación bloqueados |
| RF-29 | `AGENTS.md`, `MEMORY.md` | Revisión de los dos archivos |

## Riesgos y casos límite
1. **El test de documentos depende de los fines de línea (problema que ya existía, de la spec 001).** En la prueba, la copia exportada con `git archive` trajo los documentos con CRLF (por `core.autocrlf=true` en esta máquina) y 2 tests fallaron; el contenido era idéntico y, regenerados con LF, pasaron 416 de 416. Ocurriría igual en cualquier clon nuevo en Windows con esa configuración, con o sin Astro 7. *Mitigación en este plan:* la verificación de instalación limpia (RF-23) usa un clon con `autocrlf=false`. *Decisión pendiente:* el arreglo del test queda fuera de esta spec (RF-11 exige no tocar tests); propongo una corrección aparte, antes o después.
2. **Espacios que desaparecen (compresión del HTML).** En la prueba, los tres puntos con elementos en línea contiguos están en contenedores flex. *Mitigación:* lista de diferencias más capturas (RF-7, RF-8); si alguna cambia visualmente, se corrige.
3. **Script del menú minificado distinto.** Mismo código; se verifica que el menú móvil abre y cierra en desarrollo y en la vista previa (RF-24).
4. **Instalación limpia no probada con `npm ci` sobre el lockfile final.** La prueba usó `npm install` sobre el lockfile existente. Se cubre con RF-23.
5. **Linux y binarios de `sharp`.** No verificable desde aquí (RF-27). Recomendación: probar primero en el servicio tras fusionar.
6. **Node del servicio generador.** Sin la confirmación del responsable no se fusiona (RF-15). npm solo avisa si la versión no cumple.
7. **Alertas nuevas.** Aparecen alertas nuevas a diario; se tratan según RF-4 y RF-5.
8. **Servidor de desarrollo y vista previa con Vite 8 no probados.** Cubiertos por RF-24.
9. **Política de scripts de instalación de npm.** Bloquea `sharp` y `esbuild` y ya se aplicó en la actualización anterior sin consecuencias; se comprueba otra vez (RF-28).
10. **Resultado de la auditoría variable.** `npm audit` reflejará los avisos del momento; la meta se mide contra los 12 avisos congelados, no contra el total.

## Comprobación con la constitución
- [x] **1. Simplicidad:** ninguna dependencia directa nueva y el árbol se reduce (desaparece `esbuild`); se mantiene Astro estático con el mínimo de JS de cliente.
- [x] **2. La spec manda:** todo el plan cubre RF-1 a RF-29 y las dudas abiertas quedan resueltas. El archivo nuevo `scripts/compare-builds.mjs` está aprobado por el responsable.
- [x] **3. Datos separados de interfaz:** sin cambios.
- [x] **4. El build como puerta:** se exigen build, tests y comprobador en verde en cada variante; la rama no se fusiona con el build roto.
- [x] **5. Contrato sagrado:** contrato 2.0 intacto. El nuevo mínimo de Node es un requisito de entorno; por eso la confirmación previa (RF-15).
- [x] **6. Idioma:** código y nombres en inglés, documentación y mensajes en español.

## Actualizaciones previstas
- **spec.md:** cerrar las dos dudas abiertas (plazo de 1 hora; Tailwind 4.3.1 verificado con Vite 8 en la prueba) y fijar RF-2 y RF-3 en una hora.
- **AGENTS.md:** stack (Astro 7, Node ≥ 22.23.4) y nota sobre Linux. **MEMORY.md:** estado, decisiones y pendientes.

## Orden de construcción (para `/tasks`)
1. Hecho: el archivo nuevo de comparación está aprobado. Pendiente, fuera de esta spec: el arreglo del test de fines de línea (hasta entonces, la verificación limpia usa un clon con `core.autocrlf=false`).
2. Crear la rama y registrar la línea base (build de las tres variantes con Astro 6, alertas y `npm audit`).
3. Actualizar dependencias y `engines`; `npm audit`, tests y tres builds.
4. Comparar HTML (lista de diferencias) y capturas a 375 px y 1280 px.
5. Servidor de desarrollo, vista previa, escape de HTML y textos largos.
6. Clon limpio con `npm ci` y verificación completa.
7. Actualizar `AGENTS.md` y `MEMORY.md`; abrir el pull request con la lista de comprobación (incluida la confirmación de Node).
8. Fusionar con tu aprobación y confirmar a la hora siguiente que GitHub cerró los 12 avisos.
