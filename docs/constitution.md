# Constitución — Template landing — Pylar Labs
Principios innegociables. Toda spec, plan y tarea debe cumplirlos.

1. **Simplicidad primero**: Astro estático con el mínimo de dependencias; sin backend ni JS de cliente salvo necesidad.
2. **La spec manda**: nada se implementa si no está en la spec activa. Si falta una decisión, se para y se pregunta.
3. **Datos separados de interfaz**: todo contenido vive en los datos del sitio y toda paleta en `theme.css`; los componentes no llevan texto fijo. El texto fijo de la interfaz vive en un único archivo de traducciones del template, con las mismas claves en cada idioma.
4. **El build como puerta**: `npm run build` debe pasar sin errores antes de dar algo por hecho. Prohibido avanzar con el build roto.
5. **El contrato con el generador es sagrado**: no romper la forma de los datos sin aprobación; el template debe seguir siendo reemplazable solo con datos. Un idioma nuevo es la excepción: exige una versión del template.
6. **Idioma**: código en inglés; documentación en español; interfaz de cada web en el idioma indicado en los datos (español por defecto).
