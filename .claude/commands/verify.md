---
description: Verifica el estado actual contra la spec activa y la constitución
argument-hint: [carpeta de la spec]
---
Verifica el trabajo actual ($ARGUMENTS o la spec activa):
1. Ejecuta los tests y el lint indicados en `AGENTS.md`.
2. Comprueba, RF por RF, que cada criterio de aceptación de `spec.md` está cubierto por un test o una prueba manual.
3. Revisa el cumplimiento de cada principio de `docs/constitution.md`.
4. Si hay UI, usa el MCP de Chrome DevTools: abre la app, prueba el flujo, revisa la consola y la vista móvil (375 px).
Informa: qué pasa, qué falla y qué no pudiste comprobar. No arregles nada sin preguntar.
