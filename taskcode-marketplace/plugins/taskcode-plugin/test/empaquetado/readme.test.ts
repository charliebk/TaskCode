/**
 * TASK-124: el README del plugin es una portada por debajo de 40 KB, y la
 * referencia detallada vive en docs/ del plugin sin perder nada.
 *
 * Tres comprobaciones:
 * 1. el README pesa menos de 40 960 B (bytes en disco, como `wc -c`);
 * 2. todo enlace relativo del README y de docs/*.md apunta a un fichero que
 *    existe y, si lleva ancla, a un encabezado que existe en el destino
 *    (slug al estilo de GitHub);
 * 3. todos los encabezados (##, ###, ####) que tenia el README antes de
 *    partirlo (fijados abajo) siguen apareciendo, una sola vez, entre el
 *    README y docs/*.md: ninguna seccion se perdio ni quedo duplicada.
 *
 * Los bloques de codigo cercados no cuentan ni para enlaces ni para
 * encabezados; el codigo en linea, tampoco para enlaces. Las funciones de
 * analisis son puras y llevan contrapruebas sobre textos de prueba.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Compilado, este fichero vive en dist/test/empaquetado/: tres niveles arriba
// esta la raiz del plugin.
const PLUGIN_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

const TOPE_README = 40 * 1024;

/** Los encabezados del README antes de partirlo (TASK-124), en su orden. */
const ENCABEZADOS_README_ORIGINAL: readonly string[] = [
  '## Modelo de los agentes',
  '## Revisores por pares que trae el plugin',
  '## Regla de una hora',
  '## Roles del brainstorm de diseño',
  '## Instalación local (para desarrollo y pruebas)',
  '## Cómo se distribuye: por qué `dist/src/` está versionado',
  '### Limitación conocida: `bin/` y las organization settings de claude.ai',
  '## Usar `taskctl` fuera de Claude Code (PowerShell, cmd, Git Bash)',
  '## `taskctl` en el PATH del Bash tool',
  '### Bug encontrado y corregido en TASK-006',
  '### `commands` en `plugin.json`: campo con forma inválida, eliminado — corrección tras revisión por pares',
  '### Evidencia recogida en esta sesión',
  '### Smoke test en un clon aislado',
  '### Lo que NO se ha podido verificar en esta sesión (limitación de entorno)',
  '### RESUELTO (2026-09-05): el CI de Windows nativo contestó las preguntas',
  '### RESUELTO (2026-09-07, TASK-031): el `/plugin install` real, por fin ejecutado',
  '### Segunda limitación, específica de este repo: `core.fileMode=false`',
  '## Sincronización de ficheros derivados',
  '## ROADMAP de tareas (`tareas/ROADMAP.md`)',
  '## Problemas conocidos',
  '### Un subagente se deniega con «Auto-Mode Bypass»',
  '## Mecanismo determinista de sección 14 (punto 11): sigue sin confirmarse',
  '## Comandos disponibles',
  '#### Progreso visible: `taskctl estado`, la status line y `TASKCTL_PROGRESO`',
  '#### Cómo se verifica el proyecto: `comando_verificacion`',
  '#### Verificación selectiva por impacto: `comando_verificacion_selectiva`',
  '#### Tareas de solo documentación: `rutas_documentacion`',
  '#### Código parcial: `rutas_verificacion_parcial`',
  '#### Freno de fin de turno (hook `Stop`)',
  '#### Coste de implementación automático (hooks `Stop` y `SubagentStop`)',
  '#### Puerta de verificación en `finish`',
  '#### Tests held-out (`aceptacion/`)',
  '#### Cobertura de las líneas cambiadas',
  '#### Guardián de merges (hook `PreToolUse`)',
  '### Puntos de juicio: `--resultado`',
  '### Una tarea por FALLA: `--crear-tareas`',
  '### Aviso al cerrar una release',
  '#### GitLab propio (autoalojado, con dominio propio o bajo una ruta)',
];

// --- Analisis puro -----------------------------------------------------------

/** Las lineas fuera de bloques de codigo cercados (``` o ~~~). */
function lineasFueraDeCodigo(texto: string): string[] {
  const fuera: string[] = [];
  let valla: string | null = null;
  for (const l of texto.split(/\r?\n/)) {
    const m = /^\s{0,3}(`{3,}|~{3,})/.exec(l);
    if (m) {
      const marca = m[1] as string;
      if (valla === null) valla = marca;
      else if (marca[0] === valla[0] && marca.length >= valla.length) valla = null;
      continue;
    }
    if (valla === null) fuera.push(l);
  }
  return fuera;
}

/** Los encabezados ATX (`# ...` a `###### ...`) fuera de codigo, normalizados: `## Titulo`. */
function encabezados(texto: string): string[] {
  const fuera: string[] = [];
  for (const l of lineasFueraDeCodigo(texto)) {
    const m = /^ {0,3}(#{1,6})[ \t]+(.*?)(?:[ \t]+#+)?[ \t]*$/.exec(l);
    if (m) fuera.push(`${m[1]} ${m[2]}`);
  }
  return fuera;
}

/**
 * Slug de un encabezado al estilo de GitHub: minusculas, fuera todo lo que no
 * sea letra, marca, numero, guion bajo, guion o espacio, y espacios a guiones.
 * Conserva las tildes.
 */
function slug(titulo: string): string {
  return titulo
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\p{Pc}\- ]/gu, '')
    .replace(/ /g, '-');
}

/** Las anclas de un documento, con el sufijo `-1`, `-2`... de GitHub para los repetidos. */
function anclas(texto: string): Set<string> {
  const vistas = new Map<string, number>();
  const fuera = new Set<string>();
  for (const e of encabezados(texto)) {
    const base = slug(e.replace(/^#+ /, ''));
    const n = vistas.get(base) ?? 0;
    vistas.set(base, n + 1);
    fuera.add(n === 0 ? base : `${base}-${n}`);
  }
  return fuera;
}

/** Los destinos de los enlaces relativos `[texto](ruta[#ancla])`, fuera de codigo. */
function enlacesRelativos(texto: string): string[] {
  const fuera: string[] = [];
  for (const l of lineasFueraDeCodigo(texto)) {
    const sinCodigo = l.replace(/(`+)[\s\S]*?\1/g, '');
    for (const m of sinCodigo.matchAll(/!?\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g)) {
      const destino = m[1] as string;
      if (/^[a-z][a-z0-9+.-]*:/i.test(destino)) continue; // http:, https:, mailto:...
      fuera.push(destino);
    }
  }
  return fuera;
}

/**
 * Comprueba los enlaces relativos de `documentos` (ruta POSIX relativa ->
 * texto). `leer` devuelve el texto de un fichero, '' para un directorio, o
 * null si no existe. Un mensaje por enlace roto.
 */
function enlacesRotos(documentos: ReadonlyMap<string, string>, leer: (ruta: string) => string | null): string[] {
  const errores: string[] = [];
  for (const [origen, texto] of documentos) {
    for (const destino of enlacesRelativos(texto)) {
      const almohadilla = destino.indexOf('#');
      const rutaCruda = almohadilla === -1 ? destino : destino.slice(0, almohadilla);
      const ancla = almohadilla === -1 ? null : decodeURIComponent(destino.slice(almohadilla + 1));
      const ruta = rutaCruda === '' ? origen : path.posix.normalize(path.posix.join(path.posix.dirname(origen), decodeURIComponent(rutaCruda)));
      const contenido = documentos.get(ruta) ?? leer(ruta);
      if (contenido === null) {
        errores.push(`${origen}: el enlace "${destino}" apunta a ${ruta}, que no existe`);
      } else if (ancla !== null && !anclas(contenido).has(ancla)) {
        errores.push(`${origen}: el enlace "${destino}" apunta a un encabezado que no existe en ${ruta}`);
      }
    }
  }
  return errores;
}

/** Los encabezados esperados que no aparecen exactamente una vez entre los textos. */
function encabezadosNoUnicos(esperados: readonly string[], textos: readonly string[]): string[] {
  const cuenta = new Map<string, number>();
  for (const t of textos) for (const e of encabezados(t)) cuenta.set(e, (cuenta.get(e) ?? 0) + 1);
  return esperados.filter((e) => cuenta.get(e) !== 1).map((e) => `${e} (aparece ${cuenta.get(e) ?? 0} veces)`);
}

// --- Lectura del plugin --------------------------------------------------------

function leerDelPlugin(ruta: string): string | null {
  const absoluta = path.join(PLUGIN_ROOT, ...ruta.split('/'));
  try {
    return statSync(absoluta).isDirectory() ? '' : readFileSync(absoluta, 'utf8');
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw e;
  }
}

/** README.md y docs/*.md del plugin, por ruta POSIX relativa a su raiz. */
function documentosDelPlugin(): Map<string, string> {
  const docs = readdirSync(path.join(PLUGIN_ROOT, 'docs'))
    .filter((f) => f.endsWith('.md'))
    .sort();
  const fuera = new Map<string, string>([['README.md', readFileSync(path.join(PLUGIN_ROOT, 'README.md'), 'utf8')]]);
  for (const f of docs) fuera.set(`docs/${f}`, readFileSync(path.join(PLUGIN_ROOT, 'docs', f), 'utf8'));
  return fuera;
}

// --- Tests sobre el plugin real ------------------------------------------------

test('README: pesa menos de 40 960 B', () => {
  const bytes = readFileSync(path.join(PLUGIN_ROOT, 'README.md')).length;
  assert.ok(bytes < TOPE_README, `README.md: ${bytes} B, tope ${TOPE_README} B; mueve la referencia detallada a docs/`);
});

test('README y docs/: todo enlace relativo apunta a un fichero y a un encabezado que existen', () => {
  const documentos = documentosDelPlugin();
  assert.ok(documentos.size >= 5, `solo hay ${documentos.size} documentos: el test no esta mirando docs/`);
  assert.deepEqual(enlacesRotos(documentos, leerDelPlugin), []);
});

test('README y docs/: los encabezados del README original aparecen todos, una sola vez', () => {
  assert.deepEqual(encabezadosNoUnicos(ENCABEZADOS_README_ORIGINAL, [...documentosDelPlugin().values()]), []);
});

test('README: enlaza docs/ y la seccion «Problemas conocidos» que citan el CLI y la skill task-workflow', () => {
  const readme = documentosDelPlugin().get('README.md') as string;
  const enlaces = enlacesRelativos(readme);
  for (const f of ['instalacion-y-distribucion', 'configuracion', 'cierre-y-release', 'comandos', 'problemas-conocidos']) {
    assert.ok(enlaces.includes(`docs/${f}.md`), `el README no enlaza docs/${f}.md`);
  }
  assert.match(readme, /\[Problemas conocidos\]\(docs\/problemas-conocidos\.md#problemas-conocidos\)/);
});

// --- Contrapruebas sobre textos de prueba --------------------------------------

const DOCS_PRUEBA = new Map<string, string>([
  ['README.md', '# Portada\n\n## Uno\n\nVer [dos](docs/b.md#dos-y-tres).\n'],
  ['docs/b.md', '# B\n\n## Dos y `tres`\n\nVolver al [README](../README.md#uno).\n'],
]);
const sinDisco = (): string | null => null;

test('enlacesRotos: un conjunto sano no da errores', () => {
  assert.deepEqual(enlacesRotos(DOCS_PRUEBA, sinDisco), []);
});

test('enlacesRotos: un enlace a un fichero que no existe falla', () => {
  const docs = new Map(DOCS_PRUEBA).set('README.md', '## Uno\n\nVer [x](docs/no-existe.md).\n');
  assert.deepEqual(enlacesRotos(docs, sinDisco), ['README.md: el enlace "docs/no-existe.md" apunta a docs/no-existe.md, que no existe']);
});

test('enlacesRotos: un ancla a un encabezado que no existe falla', () => {
  const docs = new Map(DOCS_PRUEBA).set('README.md', '## Uno\n\nVer [x](docs/b.md#cuatro).\n');
  assert.deepEqual(enlacesRotos(docs, sinDisco), ['README.md: el enlace "docs/b.md#cuatro" apunta a un encabezado que no existe en docs/b.md']);
});

test('enlacesRotos: ancla en el mismo fichero, URLs absolutas y enlaces dentro de codigo', () => {
  const docs = new Map([['a.md', '## Sí\n\n[aquí](#sí) [web](https://x.example/#no) `[x](roto.md)`\n\n```\n[y](roto.md)\n```\n']]);
  assert.deepEqual(enlacesRotos(docs, sinDisco), []);
  docs.set('a.md', '## Sí\n\n[aquí](#no)\n');
  assert.equal(enlacesRotos(docs, sinDisco).length, 1);
});

test('slug y anclas: al estilo de GitHub, con tildes y sufijo para repetidos', () => {
  assert.equal(slug('Cómo se distribuye: por qué `dist/src/` está versionado'), 'cómo-se-distribuye-por-qué-distsrc-está-versionado');
  assert.equal(slug('Un subagente se deniega con «Auto-Mode Bypass»'), 'un-subagente-se-deniega-con-auto-mode-bypass');
  assert.equal(slug('campo eliminado — corrección'), 'campo-eliminado--corrección');
  assert.equal(slug('`comando_verificacion`'), 'comando_verificacion');
  assert.deepEqual([...anclas('## A\n## A\n```\n## A\n```\n')], ['a', 'a-1']);
});

test('encabezadosNoUnicos: un encabezado ausente, duplicado o con otro nivel se detecta', () => {
  const textos = ['## Uno\n### Dos\n```\n## Tres\n```\n', '## Dos\n## Cuatro\n## Cuatro\n'];
  assert.deepEqual(encabezadosNoUnicos(['## Uno', '### Dos', '## Tres', '## Cuatro'], textos), [
    '## Tres (aparece 0 veces)',
    '## Cuatro (aparece 2 veces)',
  ]);
  assert.deepEqual(encabezadosNoUnicos(['## Uno', '### Dos'], textos), []);
});
