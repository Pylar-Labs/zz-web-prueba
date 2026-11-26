#!/usr/bin/env node
// Validación inicial del proyecto. Sin dependencias: `node scripts/check-setup.mjs`
// Sale con código 1 si falta algo BLOQUEANTE. Con --hook imprime un aviso para el agente.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const hookMode = process.argv.includes('--hook');
const read = (f) => (existsSync(join(root, f)) ? readFileSync(join(root, f), 'utf8') : null);

const blocking = [];
const warnings = [];

// 1) Archivos obligatorios
for (const f of ['AGENTS.md', 'CLAUDE.md', 'MEMORY.md', 'docs/constitution.md', 'specs/_template/spec.md', 'specs/_template/plan.md', 'specs/_template/tasks.md']) {
  if (!existsSync(join(root, f))) blocking.push(`Falta el archivo ${f}`);
}

// 2) Placeholders [ASÍ] sin completar (se ignoran enlaces markdown [txt](url) y casillas [ ] / [x])
const placeholder = /\[(?!\s?\]|x\])[^\]\n]+\](?!\()/gi;
for (const f of ['AGENTS.md', 'MEMORY.md', 'docs/constitution.md']) {
  const txt = read(f);
  if (!txt) continue;
  const n = (txt.match(placeholder) || []).length;
  if (n) blocking.push(`${f}: ${n} placeholder(s) [ENTRE CORCHETES] sin completar`);
}

// 2b) Archivos *.template.md pendientes de fusionar (proyectos existentes adoptados con adopt.mjs)
for (const f of ['AGENTS.template.md', 'MEMORY.template.md', 'docs/constitution.template.md']) {
  if (existsSync(join(root, f))) blocking.push(`${f} pendiente: fusiónalo en ${f.replace('.template', '')} y bórralo (lo hace /init-project)`);
}

// 3) Líneas máximas recomendadas
const lines = (f) => (read(f) || '').split('\n').length;
if (lines('AGENTS.md') > 60) warnings.push(`AGENTS.md tiene ${lines('AGENTS.md')} líneas (recomendado ≤ 40-60)`);
if (lines('MEMORY.md') > 50) warnings.push(`MEMORY.md tiene ${lines('MEMORY.md')} líneas (máx. ~50): resúmelo`);

// 4) Memoria aún en estado inicial
if ((read('MEMORY.md') || '').includes('recién creado desde la plantilla')) {
  blocking.push('MEMORY.md sigue en estado inicial: actualiza "Estado actual"');
}

// 5) Entorno (solo avisos)
if (!process.env.CONTEXT7_API_KEY) warnings.push('Variable de entorno CONTEXT7_API_KEY no definida (Context7 no funcionará)');
if (!existsSync(join(root, '.git'))) {
  warnings.push('No es un repositorio git (ejecuta `git init`)');
} else {
  // Protección: un proyecto copiado de la plantilla no debe apuntar al repo de la plantilla
  try {
    const origin = execSync('git remote get-url origin', { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    if (/plantilla-agentes-sdd/i.test(origin) && basename(root) !== 'plantilla-agentes-sdd') {
      blocking.push(`origin apunta al repo de la plantilla (${origin}). Cámbialo: git remote set-url origin <TU-REPO> (o borra .git y haz git init)`);
    }
  } catch {
    warnings.push('Sin remote "origin" configurado (crea el repo con `gh repo create`)');
  }
}

// 6) Specs (informativo)
const specsDir = join(root, 'specs');
const specs = existsSync(specsDir) ? readdirSync(specsDir).filter((d) => /^\d{3}-/.test(d)) : [];
const info = specs.length ? `Specs existentes: ${specs.join(', ')}` : 'Aún no hay specs: usa /spec <idea> para crear la primera.';

const ok = blocking.length === 0;

if (hookMode) {
  if (!ok) {
    console.log('⛔ SETUP INCOMPLETO. Antes de desarrollar, ejecuta el comando /init-project y completa lo pendiente:');
    blocking.forEach((b) => console.log(`- ${b}`));
    console.log('No escribas código de producción hasta que `node scripts/check-setup.mjs` pase.');
  } else {
    console.log('✅ Setup del proyecto completo. ' + info);
  }
  process.exit(0);
}

console.log(ok ? '✅ Setup completo.' : '⛔ Setup incompleto:');
blocking.forEach((b) => console.log(`  ✗ ${b}`));
warnings.forEach((w) => console.log(`  ⚠ ${w}`));
console.log(`  ℹ ${info}`);
process.exit(ok ? 0 : 1);
