// Punto de entrada de los datos del sitio. Los componentes importan `siteConfig` de aquí.
//
// Los datos viven en `site.data.json` (es lo que escribe el generador). Este módulo los carga,
// los valida con el esquema (`site.schema.ts`) y completa los valores por defecto. Si los datos
// no son válidos, lanza un error con la lista completa y la construcción de la web falla.
//
// Para validar o construir con otro archivo de datos, define la variable de entorno SITE_DATA
// con su ruta (relativa a la raíz del proyecto o absoluta). Sin ella se usa `site.data.json`.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import defaultData from "./site.data.json";
import { applyDefaults, formatReport, validateSite } from "./site.schema.ts";
import type { ResolvedSite, SiteData } from "./site.schema.ts";

function loadRaw(): { source: string; data: unknown } {
  const override = process.env.SITE_DATA;
  if (!override) return { source: "src/content/site.data.json", data: defaultData };

  const path = resolve(process.cwd(), override);
  try {
    return { source: path, data: JSON.parse(readFileSync(path, "utf8")) };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`No se pudieron leer los datos del sitio en "${path}": ${reason}`);
  }
}

function loadSite(): ResolvedSite {
  const { source, data } = loadRaw();
  const report = validateSite(data);
  if (!report.ok) {
    throw new Error(`Los datos del sitio no son válidos (${source}).\n${formatReport(report)}`);
  }
  return applyDefaults(data as SiteData);
}

export const siteConfig = loadSite();
export type SiteConfig = ResolvedSite;
