---
description: Implementa las tareas de una spec, una a una, con tests como puerta (SDD paso 6)
argument-hint: <carpeta de la spec> [tarea, p.ej. T1-T3]
---
Implementa $ARGUMENTS.
Lee `docs/constitution.md`, `AGENTS.md`, `@MEMORY.md`, y `spec.md`, `plan.md`, `tasks.md` de la spec.

Reglas:
- Una tarea cada vez, en orden. Marca `[x]` en `tasks.md` al completarla.
- Test primero; no avances con tests en rojo.
- No implementes nada que no esté en la spec. Si falta una decisión, para y pregunta.
- Al terminar: ejecuta la verificación de AGENTS.md, actualiza `MEMORY.md` y resume qué hiciste, cómo lo verificaste y decisiones que debo revisar.
