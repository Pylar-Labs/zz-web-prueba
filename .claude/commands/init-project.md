---
description: Onboarding guiado del proyecto nuevo. Completa todo lo requerido antes de desarrollar
argument-hint: [descripción breve del proyecto]
---
Vamos a inicializar este proyecto desde la plantilla. Descripción inicial: $ARGUMENTS

1. Ejecuta `node scripts/check-setup.mjs` y muéstrame qué falta.
   - Si hay código existente (proyecto adoptado): explóralo primero (README, manifiestos como package.json/pyproject, carpetas, tests, CI) y deduce stack, comandos y convenciones. Preséntamelo para confirmar en vez de preguntarlo todo desde cero.
   - Si existen `AGENTS.template.md`, `MEMORY.template.md` o `docs/constitution.template.md`: fusiona su contenido en los archivos ya existentes (conserva lo mío, añade las secciones que falten: Memoria, Límites, Verificación, etc.), muéstrame el resultado y, con mi aprobación, borra los `.template`.
2. Hazme las preguntas necesarias UNA a UNA (máximo 8) para completar, en este orden:
   a. Nombre, objetivo y usuarios del proyecto.
   b. Stack, versiones y comandos exactos (ejecutar, tests, lint/build).
   c. Idioma del código y de la interfaz/documentación.
   d. Reglas de dominio y trampas conocidas.
   e. ¿Tiene interfaz web? (si no, quita Chrome DevTools de `.mcp.json`, `opencode.json` y de Verificación).
3. Con mis respuestas, propón el contenido de `AGENTS.md`, `docs/constitution.md` (6 principios, ≤ 15 líneas) y `MEMORY.md` (estado actual). Espera mi aprobación antes de escribir.
4. Tras escribir, vuelve a ejecutar `node scripts/check-setup.mjs` hasta que pase.
5. Recuérdame los pasos manuales pendientes: `git init`, definir `CONTEXT7_API_KEY`, instalar skills opcionales (ver README).
6. Cierra indicando que el siguiente paso es `/spec <primera funcionalidad>`.

No escribas código de producción en este comando.
