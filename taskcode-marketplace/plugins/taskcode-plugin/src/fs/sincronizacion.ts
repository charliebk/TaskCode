/**
 * Sincronizacion de ficheros derivados — TASK-033 (version 0.1.1).
 *
 * Un proyecto que genera ficheros a partir del estado de las tareas (un
 * plan con una tabla de seguimiento, un tablero propio) los tenia
 * desincronizados tras CADA transicion: los commits automaticos mueven
 * la tarea, pero no pueden saber que ese fichero existe. El arreglo
 * obvio desde el proyecto —un hook de pre-commit que regenere y haga
 * `git add`— no funciona con taskctl: autoCommit commitea en modo
 * `--only` (`git commit -- <rutas>`), el `git add` del hook va al indice
 * temporal y el indice real se queda con el contenido viejo. Despues del
 * commit, `git status` marca `MM` y el SIGUIENTE comando aborta en el
 * guard de la 8.3. Reproducido, no supuesto.
 *
 * Asi que el comando lo ejecuta taskctl, dentro de autoCommit y antes
 * del primer `git add`, y sus rutas entran en el mismo commit que la
 * tarea. Lo configuran tres claves de `.taskcode/config.yml`
 * (config.ts); sin ellas, aqui no se hace nada, ni un spawn.
 *
 * La regla que manda, decidida al aprobar el plan: **la transicion
 * NUNCA se aborta por la sincronizacion**. En `finish` el merge ya esta
 * hecho cuando se llega aqui; abortar dejaria la tarea movida sin
 * commitear y sin camino de reintento (riesgo 1 del brainstorm). Los
 * tres desenlaces en que la sincronizacion no se aplica commitean la
 * tarea igual, avisan y hacen que el CLI salga con
 * CODIGO_SINCRONIZACION_NO_APLICADA:
 *
 *   (a) una ruta declarada ya tenia cambios: no se ejecuta, porque
 *       commitearla meteria trabajo de la persona en un commit
 *       automatico;
 *   (b) el comando falla o expira: las rutas declaradas vuelven a HEAD
 *       (estaban limpias por (a), asi que no se pierde nada);
 *   (c) el comando toco ficheros no declarados: esos no se tocan y se
 *       nombran; las rutas declaradas si se commitean.
 */
import { existsSync, readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { raizDelRepo, type TaskcodeConfig } from '../core/config.js';
import { runGit } from './git.js';
import { ejecutarAcotado, fotoDelArbol, fueCortado, type SalidaEjecucion } from './ejecucion-acotada.js';

/**
 * Codigo de salida del CLI cuando la transicion se hizo pero la
 * sincronizacion no se aplico. Distinto de 1 (el comando fallo) a
 * proposito: quien lo lea tiene que poder distinguir "no reintentes,
 * sincroniza a mano" de "no ha pasado nada".
 */
export const CODIGO_SINCRONIZACION_NO_APLICADA = 3;

export type EstadoSincronizacion =
  /** Sin `comando_sincronizacion`: comportamiento anterior a 0.1.1. */
  | 'no-configurada'
  /** El comando corrio bien y solo toco rutas declaradas. */
  | 'aplicada'
  /** (a) Alguna ruta declarada ya tenia cambios: no se ejecuto. */
  | 'omitida-rutas-con-cambios'
  /** (b) Exit != 0, senal, timeout o no se pudo lanzar. */
  | 'fallida'
  /** (c) Corrio bien, pero ademas toco ficheros no declarados. */
  | 'rutas-ajenas';

export interface ResultadoSincronizacion {
  estado: EstadoSincronizacion;
  /** Rutas (absolutas) que deben entrar en el commit automatico. */
  rutas: readonly string[];
  /** Avisos para stderr. Vacio en 'no-configurada' y 'aplicada'. */
  avisos: readonly string[];
}

/** true si el desenlace debe hacer que el CLI salga con CODIGO_SINCRONIZACION_NO_APLICADA. */
export function sincronizacionNoAplicada(r: ResultadoSincronizacion): boolean {
  return r.estado !== 'no-configurada' && r.estado !== 'aplicada';
}

export interface OpcionesSincronizacion {
  /** Solo para tests: sustituye a `timeout_sincronizacion` (en ms). */
  timeoutMs?: number;
}

export const SIN_SINCRONIZACION: ResultadoSincronizacion = Object.freeze({
  estado: 'no-configurada',
  rutas: Object.freeze([]) as readonly string[],
  avisos: Object.freeze([]) as readonly string[],
});

export function ejecutarSincronizacion(
  cwd: string,
  config: TaskcodeConfig,
  opciones: OpcionesSincronizacion = {}
): ResultadoSincronizacion {
  const comando = config.comando_sincronizacion;
  if (comando === null) return SIN_SINCRONIZACION;

  const raiz = raizDelRepo(cwd);
  const declaradas = config.rutas_sincronizacion;
  const absolutas = declaradas.map((r) => path.join(raiz, r));
  const aMano =
    `Cuando lo resuelvas, ejecuta a mano "${comando}" y commitea ${declaradas.join(', ')}. ` +
    'La transicion de la tarea YA esta hecha: no repitas el comando de taskctl.';

  // (a) Antes de nada: si una ruta declarada ya trae cambios, el
  // commit automatico se los llevaria. `start`, `review` y `finish` no
  // exigen workspace limpio, asi que esto es un caso real. Se pregunta
  // tambien por el nombre REAL en disco: con otras mayusculas, el
  // pathspec declarado no casa con el fichero modificado y el comando lo
  // sobrescribiria sin que nada lo detectara (MENOR de la ronda 2).
  const aComprobar = [
    ...new Set(declaradas.flatMap((r) => [r, nombreRealEnDisco(raiz, r) ?? r])),
  ];
  const conCambios = porcelain(raiz, aComprobar);
  if (conCambios.length > 0) {
    return {
      estado: 'omitida-rutas-con-cambios',
      rutas: [],
      avisos: [
        `No se ha ejecutado la sincronizacion: ${conCambios.join(', ')} ya tenia(n) cambios ` +
          'sin commitear, y el commit automatico los habria incluido. Commitealos o ' +
          `descartalos. ${aMano}`,
      ],
    };
  }

  const antes = fotoDelArbol(raiz);
  const timeoutMs = opciones.timeoutMs ?? config.timeout_sincronizacion * 1000;

  // El comando no se lanza directamente: lo lanza ENVOLTORIO, un node
  // hijo que es quien aplica el timeout. Con un `spawnSync(comando, {
  // shell: true, timeout })` a pelo, el timeout mata a cmd.exe pero en
  // Windows el `node` nieto SIGUE VIVO y puede seguir escribiendo el
  // derivado despues de que lo hayamos restaurado (riesgo 6 del
  // brainstorm; reproducido: el test del timeout dejaba la carpeta del
  // repo bloqueada con EBUSY). El envoltorio mata el arbol entero.
  //
  // stdin ignorado SIEMPRE: con una tuberia heredada que nadie cierra
  // (un arnes de agente, `node --test`) un script que pregunte algo
  // esperaria para siempre. Con EOF, falla y se va por (b).
  const r = ejecutarAcotado(raiz, comando, timeoutMs);

  const fallo = describirFallo(r, timeoutMs);
  if (fallo !== null) {
    restaurarAHead(raiz, declaradas, antes);
    return fallida(comando, declaradas, fallo, aMano);
  }

  // Una ruta que Git no va a poder commitear (ignorada, o con otras
  // mayusculas que el fichero real en un disco que no las distingue)
  // tumbaria el `git add` / `git commit` de autoCommit y, con el, la
  // transicion entera — en `finish`, con el merge ya hecho (hallazgo
  // IMPORTANTE de la revision por pares de TASK-033). Se detecta aqui y
  // se va por (b).
  const noCommiteable = motivoNoCommiteable(raiz, declaradas);
  if (noCommiteable !== null) {
    restaurarAHead(raiz, declaradas, antes);
    return fallida(comando, declaradas, noCommiteable, aMano);
  }

  const despues = fotoDelArbol(raiz);
  const declaradasSet = new Set(declaradas);
  const ajenas = [...new Set([...antes.keys(), ...despues.keys()])]
    .filter((f) => !declaradasSet.has(f) && antes.get(f) !== despues.get(f))
    .sort();

  if (ajenas.length > 0) {
    return {
      estado: 'rutas-ajenas',
      rutas: absolutas,
      avisos: [
        `La sincronizacion "${comando}" ha modificado ficheros que no estan en ` +
          `rutas_sincronizacion: ${ajenas.join(', ')}. No se han commiteado ni tocado: ` +
          'revisalos. Si los genera el comando a proposito, anadelos a rutas_sincronizacion; ' +
          'si no, el siguiente comando de taskctl puede abortar por workspace sucio.',
      ],
    };
  }

  return { estado: 'aplicada', rutas: absolutas, avisos: [] };
}

function fallida(
  comando: string,
  declaradas: readonly string[],
  motivo: string,
  aMano: string
): ResultadoSincronizacion {
  return {
    estado: 'fallida',
    rutas: [],
    avisos: [
      `La sincronizacion "${comando}" ${motivo}. ${declaradas.join(', ')} se ha(n) dejado ` +
        `como en HEAD y la tarea se ha commiteado sin ella(s). ${aMano}`,
    ],
  };
}

/**
 * Resultado 'fallida' para cuando el `git add` de una ruta de
 * sincronizacion falla ya dentro de autoCommit: segunda barrera de
 * motivoNoCommiteable, para lo que no se haya podido prever.
 */
export function sincronizacionFallidaAlPreparar(
  cwd: string,
  config: Pick<TaskcodeConfig, 'comando_sincronizacion' | 'rutas_sincronizacion'>,
  detalle: string
): ResultadoSincronizacion {
  const raiz = raizDelRepo(cwd);
  const declaradas = config.rutas_sincronizacion;
  for (const r of declaradas) {
    // Desprepararla primero: si el add llego a meterla en el indice,
    // restaurar solo el arbol la dejaria en "A"/"M" y el siguiente
    // comando abortaria por workspace sucio.
    runGitOk(['reset', '-q', '--', r], raiz);
  }
  restaurarAHead(raiz, declaradas);
  const comando = config.comando_sincronizacion ?? '';
  return fallida(
    comando,
    declaradas,
    `escribio sus ficheros, pero Git no pudo prepararlos (${detalle})`,
    `Cuando lo resuelvas, ejecuta a mano "${comando}" y commitea ${declaradas.join(', ')}. ` +
      'La transicion de la tarea YA esta hecha: no repitas el comando de taskctl.'
  );
}

/**
 * null si Git puede commitear todas las rutas; si no, el motivo. Dos
 * casos reproducidos en la revision: una ruta en `.gitignore` (el
 * `git add` falla) y, en Windows o macOS, una ruta con otras mayusculas
 * que el fichero que existe en disco (el pathspec no casa).
 */
function motivoNoCommiteable(raiz: string, rutas: readonly string[]): string | null {
  for (const r of rutas) {
    if (runGitOk(['check-ignore', '-q', '--', r], raiz)) {
      return `escribio ${r}, pero esa ruta esta en .gitignore y Git no la commitearia`;
    }
    const real = nombreRealEnDisco(raiz, r);
    if (real !== null && real !== r) {
      return (
        `escribio ${r}, pero en disco el fichero se llama ${real}: corrige las mayusculas ` +
        'en rutas_sincronizacion'
      );
    }
  }
  return null;
}

/**
 * La ruta tal y como se llama en disco, segmento a segmento, o null si
 * no existe. En un disco que no distingue mayusculas, `existsSync`
 * diria que si a cualquier variante; leer el directorio no miente.
 */
function nombreRealEnDisco(raiz: string, rel: string): string | null {
  let dir = raiz;
  const partes: string[] = [];
  for (const seg of rel.split('/')) {
    let entradas: string[];
    try {
      entradas = readdirSync(dir);
    } catch {
      return null;
    }
    const exacto = entradas.find((e) => e === seg);
    const real = exacto ?? entradas.find((e) => e.toLowerCase() === seg.toLowerCase());
    if (real === undefined) return null;
    partes.push(real);
    dir = path.join(dir, real);
  }
  return partes.join('/');
}

/** null si el comando termino bien; si no, que le paso, en palabras de persona. */
function describirFallo(r: SalidaEjecucion, timeoutMs: number): string | null {
  const corte = `no termino en ${String(Math.round(timeoutMs / 1000))} s y se ha cortado`;
  if (fueCortado(r)) return corte;
  if (r.error !== undefined) return `no se pudo ejecutar (${r.error.message})`;
  if (r.signal !== null) return `termino por la senal ${r.signal}`;
  if (r.status !== 0) {
    const stderr = r.salida.trim();
    const cola = stderr === '' ? '' : `: ${ultimasLineas(stderr, 5)}`;
    return `salio con codigo ${String(r.status)}${cola}`;
  }
  return null;
}

function ultimasLineas(texto: string, n: number): string {
  return texto.split(/\r?\n/).slice(-n).join(' | ');
}

/** Rutas (de las dadas) con cambios respecto a HEAD, incluidas las no trackeadas. */
function porcelain(raiz: string, rutas: readonly string[]): string[] {
  const salida = runGit(['status', '--porcelain', '--untracked-files=all', '--', ...rutas], raiz);
  return salida
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l !== '')
    .map((l) => l.slice(l.indexOf(' ') + 1).trim());
}

/**
 * (b) Deja cada ruta declarada como en HEAD. Estaban limpias antes de
 * ejecutar (lo garantiza (a)), asi que lo unico que se deshace es lo
 * que escribio el comando: si existia en HEAD se restaura, y si no
 * existia el fichero lo creo el comando y se borra.
 */
function restaurarAHead(
  raiz: string,
  rutas: readonly string[],
  antes: ReadonlyMap<string, string> = new Map()
): void {
  for (const r of rutas) {
    // Se trabaja con el nombre REAL del fichero. Con la ruta declarada
    // tal cual, una errata de mayusculas en un disco que no las
    // distingue no se encontraria en HEAD y caeria en el rmSync de
    // abajo: borraria el fichero versionado de verdad.
    const objetivo = nombreRealEnDisco(raiz, r) ?? r;
    // Si con otro nombre resulta ser un fichero que ya estaba sucio
    // antes de ejecutar, es trabajo de la persona (en un disco que si
    // distingue mayusculas es OTRO fichero): no se toca.
    if (objetivo !== r && antes.has(objetivo)) continue;
    if (runGitOk(['cat-file', '-e', `HEAD:${objetivo}`], raiz)) {
      runGit(['checkout', 'HEAD', '--', objetivo], raiz);
    } else if (!antes.has(objetivo)) {
      const abs = path.join(raiz, objetivo);
      if (existsSync(abs)) rmSync(abs, { force: true });
    }
  }
}

function runGitOk(args: readonly string[], cwd: string): boolean {
  return spawnSync('git', args, { cwd, encoding: 'utf8' }).status === 0;
}
