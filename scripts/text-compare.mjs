// Comparación de un documento generado con lo que genera el esquema, sin depender de los fines de
// línea (spec 005). En Windows, con `core.autocrlf=true`, git puede bajar los documentos con CRLF;
// el contenido es el mismo. Aquí solo se tolera CRLF frente a LF: cualquier otra diferencia (texto,
// espacios al final, salto de línea final, BOM, un `\r` suelto, un documento vacío) sigue siendo un error.

const MAX_LINE = 200;

// Cada "\r\n" pasa a "\n". Nada más: un "\r" suelto, el BOM y los espacios se conservan.
export function normalizeLineEndings(text) {
  return text.replace(/\r\n/g, "\n");
}

// Muestra una línea entre comillas, con los caracteres invisibles escapados y recortada si es larga.
function show(lines, index) {
  if (index >= lines.length) return "(fin del documento)";
  const line = lines[index];
  if (line === "" && index === lines.length - 1) return "(salto de línea final)";
  const clipped = line.length > MAX_LINE ? `${line.slice(0, MAX_LINE)}…` : line;
  return JSON.stringify(clipped).replace(/﻿/g, "\\uFEFF");
}

// Devuelve null si el documento coincide con lo generado (ignorando CRLF frente a LF) o, si no, un
// mensaje en español con el archivo, la primera línea distinta (esperada y encontrada) y cómo arreglarlo.
// Nunca incluye el documento entero.
export function compareDocument(file, found, expected) {
  const foundLines = normalizeLineEndings(found).split("\n");
  const expectedLines = normalizeLineEndings(expected).split("\n");
  if (foundLines.length === expectedLines.length && foundLines.every((line, i) => line === expectedLines[i])) return null;

  let index = 0;
  const longest = Math.max(foundLines.length, expectedLines.length);
  while (index < longest && foundLines[index] === expectedLines[index]) index++;

  return [
    `${file} no coincide con lo que genera el esquema.`,
    `Primera diferencia en la línea ${index + 1}:`,
    `  esperada:   ${show(expectedLines, index)}`,
    `  encontrada: ${show(foundLines, index)}`,
    "Se arregla con: npm run schema:export",
  ].join("\n");
}
