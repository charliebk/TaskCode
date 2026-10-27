/**
 * `taskctl doctor-deploy [--json] [--escribir]` - TASK-066.
 *
 * Recorre el catalogo de puntos de `scripts/doctor-deploy.yml` (mas la capa de
 * `.taskcode/doctor-deploy.yml`), detecta el tipo de aplicacion por ficheros
 * marcadores y dice, punto por punto, si esta bien (OK), mal (FALLA), no se
 * pudo comprobar (NO VERIFICADO, con lo que falta) o no corresponde (NO
 * APLICA, con el motivo). Es un comando distinto de `doctor`: aquel comprueba
 * que el proyecto esta listo para trabajar con el flujo de tareas; este, que la
 * aplicacion esta lista para publicarse.
 *
 * Decisiones:
 * - Solo lee. Con `--escribir` guarda el informe en docs/doctor-deploy/ pero
 *   NO lo commitea (como `metricas --escribir`).
 * - Las unicas comprobaciones deterministas son las de fs/sondas-deploy.ts; el
 *   resto del catalogo es de juicio y sale NO VERIFICADO.
 * - Una sonda que lanza una excepcion es NO VERIFICADO de ESE punto, nunca un
 *   throw hacia el CLI ni un OK.
 * - Codigo de salida: 0 sin FALLA, 1 con alguna. NO VERIFICADO no lo cambia,
 *   pero el resumen dice cuantos puntos quedaron sin verificar.
 * - Todo texto que sale (stdout, JSON, informe en disco) pasa por
 *   `ocultarSecretos`: es la segunda red tras el enmascarado en origen.
 */
import { existsSync, linkSync, mkdirSync, readFileSync, realpathSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { rechazarFlagsDesconocidos } from '../cli/args.js';
import {
  cargarCapaProyecto,
  cargarCatalogoDeploy,
  combinarCatalogo,
  TIPO_TODOS,
  type CatalogoEfectivo,
  type PuntoCatalogo,
} from '../core/doctor-deploy-catalogo.js';
import {
  codigoSalida,
  formatearInforme,
  formatearJson,
  formatearTexto,
  sanearPunto,
  type InformeDeploy,
  type ResultadoPunto,
} from '../core/doctor-deploy.js';
import {
  mezclarVeredictos,
  parsearResultado,
  VeredictoFormatoError,
  type ResumenVeredictos,
} from '../core/doctor-deploy-veredictos.js';
import { ocultarSecretos } from '../core/secretos.js';
import { ocultarCredenciales } from '../core/plataforma-remota.js';
import { BaseBranchGuardError } from '../fs/git.js';
import { crearTareasDeFallas, type ResultadoCrearTareas } from './doctor-deploy-tareas.js';
import { detectarTipos, listarArchivos } from '../fs/deteccion-app.js';
import { comprobadorEnCommit } from '../fs/evidencia-veredicto.js';
import { gitTexto } from '../fs/git-crudo.js';
import { pathDelProceso } from '../fs/herramientas-deploy.js';
import {
  OPCIONES_SONDAS_POR_DEFECTO,
  SONDAS,
  type ContextoDeploy,
  type OpcionesSondas,
} from '../fs/sondas-deploy.js';

export class DoctorDeployCommandError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DoctorDeployCommandError';
  }
}

/** Flags de `taskctl doctor-deploy`. */
export const FLAGS_DOCTOR_DEPLOY: readonly string[] = ['--json', '--escribir', '--resultado', '--crear-tareas'];

/** Mas que esto no es el resultado de una revision (los veredictos pesan unos KB). */
const MAX_BYTES_RESULTADO = 1024 * 1024;

/** Carpeta (relativa a la raiz del repo) donde `--escribir` deja el informe. */
export const CARPETA_INFORMES = path.join('docs', 'doctor-deploy');

export interface DoctorDeployDeps {
  repoCwd: string;
  /** Ruta del catalogo del plugin (por defecto el del plugin). Para los tests. */
  rutaCatalogo?: string;
  /** Reloj inyectable (fecha del informe). Para los tests. */
  ahora?: () => Date;
  /** Limites y PATH de las sondas. Para los tests. */
  opciones?: Partial<OpcionesSondas>;
}

export interface DoctorDeployResult {
  informe: InformeDeploy;
  /** 0 sin FALLA, 1 con alguna. */
  codigo: 0 | 1;
  /** Lo que hay que escribir en stdout: el texto, o SOLO el JSON con --json. */
  salida: string;
  json: boolean;
  /** Ruta del informe escrito con --escribir; null si no se pidio. */
  rutaInforme: string | null;
  /** Ruta del mismo informe en JSON, junto al .md; null si no se escribio. */
  rutaJson: string | null;
  /** Aviso de que se escribio el informe (a stdout en texto, a stderr con --json); '' si no. */
  mensajeEscritura: string;
  /** Lo que hizo `--crear-tareas` (rama, commit); undefined si no se pidio. */
  tareas?: ResultadoCrearTareas;
}

const salidaSegura = (t: string): string => ocultarSecretos(ocultarCredenciales(t));

// ---------------------------------------------------------------------

function evaluarPunto(punto: PuntoCatalogo, ctx: ContextoDeploy, cat: CatalogoEfectivo): ResultadoPunto {
  const base = {
    id: punto.id,
    severidad: punto.severidad,
    metodo: punto.metodo,
    arreglo: punto.arreglo,
    descripcion: punto.descripcion,
    referencia: punto.referencia,
    desactivado: false,
    origen: 'sonda' as const,
  };

  const desactivacion = cat.desactivados.get(punto.id);
  if (desactivacion !== undefined) {
    return {
      ...base,
      desactivado: true,
      estado: 'no-aplica',
      motivo: `desactivado por el proyecto: ${desactivacion}`,
      evidencias: [{ descripcion: `desactivado en .taskcode/doctor-deploy.yml con el motivo: ${desactivacion}` }],
    };
  }

  if (!punto.tipos.includes(TIPO_TODOS)) {
    const detectados = new Set(ctx.tipos.map((t) => t.id));
    if (!punto.tipos.some((t) => detectados.has(t))) {
      return {
        ...base,
        estado: 'no-aplica',
        motivo:
          `solo aplica a ${punto.tipos.join(' o ')}; ` +
          `detectado: ${ctx.tipos.length === 0 ? 'ningun tipo' : ctx.tipos.map((t) => t.id).join(', ')}`,
        evidencias: [],
      };
    }
  }

  if (punto.metodo === 'juicio' || punto.sonda === null) {
    return {
      ...base,
      estado: 'no-verificado',
      motivo: `falta la revision con juicio (leer el codigo con criterio): ${punto.descripcion}`,
      evidencias: [],
    };
  }

  const sonda = SONDAS[punto.sonda];
  if (sonda === undefined) {
    return { ...base, estado: 'no-verificado', motivo: `la comprobacion "${punto.sonda}" no esta registrada en este taskctl`, evidencias: [] };
  }
  try {
    return sanearPunto({ ...base, ...sonda(ctx) });
  } catch (e: unknown) {
    const msg = (e instanceof Error ? e.message : String(e)).replace(/\s+/g, ' ').trim();
    return {
      ...base,
      estado: 'no-verificado',
      motivo: `la comprobacion fallo por una excepcion y no se pudo verificar: ${msg}`,
      evidencias: [],
    };
  }
}

function fechaLocal(d: Date): string {
  const dos = (n: number): string => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}

/** Pone `tmp` en `destino` sin pisar nada: `link` (falla si existe) o, sin enlaces duros, `rename` tras comprobar. */
function colocar(tmp: string, destino: string): boolean {
  try {
    linkSync(tmp, destino);
    return true;
  } catch (e: unknown) {
    if ((e as NodeJS.ErrnoException).code === 'EEXIST') return false;
    if (existsSync(destino)) return false;
    renameSync(tmp, destino);
    return true;
  }
}

/**
 * Escribe el informe en docs/doctor-deploy/<fecha>.md y, junto a el, el mismo informe en JSON
 * (<fecha>.json: es lo que lee `finish` de una release); si ya hay uno de ese dia, <fecha>-2,
 * <fecha>-3... Escritura atomica: ficheros temporales en la misma carpeta y `link` (no pisa nada).
 * Un `.json` suelto con ese nombre cuenta como ocupado.
 */
export function escribirInforme(raiz: string, fecha: string, md: string, json: string): { md: string; json: string } {
  const dir = path.join(raiz, CARPETA_INFORMES);
  mkdirSync(dir, { recursive: true });
  const sufijo = `${process.pid}-${Date.now()}`;
  const tmpMd = path.join(dir, `.informe-${sufijo}.md.tmp`);
  const tmpJson = path.join(dir, `.informe-${sufijo}.json.tmp`);
  writeFileSync(tmpMd, md, { encoding: 'utf8', flag: 'wx' });
  writeFileSync(tmpJson, json, { encoding: 'utf8', flag: 'wx' });
  try {
    for (let n = 1; n < 1000; n++) {
      const base = n === 1 ? fecha : `${fecha}-${n}`;
      const destinoMd = path.join(dir, `${base}.md`);
      const destinoJson = path.join(dir, `${base}.json`);
      if (existsSync(destinoJson)) continue;
      if (!colocar(tmpMd, destinoMd)) continue;
      if (!colocar(tmpJson, destinoJson)) {
        unlinkSync(destinoMd);
        continue;
      }
      return { md: destinoMd, json: destinoJson };
    }
    throw new DoctorDeployCommandError(`[ERROR] taskctl doctor-deploy: ya hay mil informes de ${fecha} en ${CARPETA_INFORMES}. Muevelos o borralos.`);
  } finally {
    for (const tmp of [tmpMd, tmpJson]) {
      try {
        unlinkSync(tmp);
      } catch {
        // ya colocado con rename, o no existe
      }
    }
  }
}

// ---------------------------------------------------------------------

/** Lo que se pidio en la linea de comandos. */
interface OpcionesComando {
  json: boolean;
  escribir: boolean;
  /** Ruta del JSON con los veredictos del agente, o null. */
  resultado: string | null;
  /** Crear una tarea por cada punto que FALLA. */
  crearTareas: boolean;
}

const USO = 'Uso: taskctl doctor-deploy [--json] [--escribir] [--resultado <fichero.json>] [--crear-tareas].';

function leerOpciones(argv: readonly string[]): OpcionesComando {
  rechazarFlagsDesconocidos(argv, FLAGS_DOCTOR_DEPLOY, 'doctor-deploy', (m) => new DoctorDeployCommandError(m));
  // `--resultado` lleva valor: se saca antes de buscar argumentos sueltos.
  const resto: string[] = [];
  let resultado: string | null = null;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i] as string;
    if (a === '--resultado' || a.startsWith('--resultado=')) {
      const valor = a === '--resultado' ? argv[++i] : a.slice('--resultado='.length);
      if (valor === undefined || valor.trim() === '' || valor.startsWith('--')) {
        throw new DoctorDeployCommandError(`[ERROR] taskctl doctor-deploy: --resultado necesita la ruta del JSON del agente. ${USO}`);
      }
      resultado = valor;
    } else {
      resto.push(a);
    }
  }
  const sobra = resto.find((a) => !a.startsWith('-'));
  if (sobra !== undefined) {
    throw new DoctorDeployCommandError(`[ERROR] taskctl doctor-deploy: no admite argumentos ("${sobra}"). ${USO}`);
  }
  return { json: argv.includes('--json'), escribir: argv.includes('--escribir'), resultado, crearTareas: argv.includes('--crear-tareas') };
}

/** Lee el JSON del agente y lo mezcla con los puntos (ver core/doctor-deploy-veredictos.ts). */
function incorporarVeredictos(
  fichero: string,
  raiz: string,
  repoCwd: string,
  puntos: ResultadoPunto[],
  commit: string | null,
  avisos: string[]
): { puntos: ResultadoPunto[]; resumen: ResumenVeredictos } {
  const ruta = path.resolve(repoCwd, fichero);
  let texto: string;
  try {
    if (statSync(ruta).size > MAX_BYTES_RESULTADO) {
      throw new DoctorDeployCommandError(
        `[ERROR] taskctl doctor-deploy: ${fichero} pesa mas de ${MAX_BYTES_RESULTADO / 1024} KB: no es el resultado de una revision.`
      );
    }
    texto = readFileSync(ruta, 'utf8');
  } catch (e: unknown) {
    if (e instanceof DoctorDeployCommandError) throw e;
    throw new DoctorDeployCommandError(
      `[ERROR] taskctl doctor-deploy: no se pudo leer --resultado "${fichero}": ${e instanceof Error ? e.message : String(e)}`
    );
  }
  let entrada;
  try {
    entrada = parsearResultado(texto);
  } catch (e: unknown) {
    if (e instanceof VeredictoFormatoError) {
      throw new DoctorDeployCommandError(`[ERROR] taskctl doctor-deploy: ${e.message}. La skill doctor-deploy describe el formato.`);
    }
    throw e;
  }
  // Dentro del repo ensucia el arbol (y con --crear-tareas aborta el guard de rama): se avisa.
  // Con las rutas reales: en Windows la carpeta temporal puede venir en formato corto (8.3).
  const rel = path.relative(realpathSync.native(raiz), realpathSync.native(ruta));
  if (rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel)) {
    avisos.push(
      `el fichero de --resultado esta dentro del repositorio (${rel.replace(/\\/g, '/')}): ensucia el arbol de trabajo. ` +
        'Guardalo fuera (la carpeta temporal del sistema).'
    );
  }
  const mezcla = mezclarVeredictos(puntos, entrada, commit, commit === null ? () => 'sin commit' : comprobadorEnCommit(raiz, commit));
  for (const x of mezcla.resumen.rechazados) avisos.push(`veredicto rechazado (${x.punto}): ${x.motivo}`);
  return mezcla;
}

// ---------------------------------------------------------------------

/** El analisis hecho: lo que hace falta para dar la salida. */
interface Analisis {
  informe: InformeDeploy;
  opciones: OpcionesComando;
  raiz: string;
  ahora: Date;
}

function analizar(argv: readonly string[], deps: DoctorDeployDeps): Analisis {
  const opciones = leerOpciones(argv);

  const raizGit = gitTexto(['rev-parse', '--show-toplevel'], deps.repoCwd, { timeoutMs: 15_000 });
  if (raizGit === null || raizGit.trim() === '') {
    throw new DoctorDeployCommandError(
      '[ERROR] taskctl doctor-deploy: este directorio no es un repositorio Git (o git no esta instalado).\n' +
        '        Ejecutalo desde la raiz del proyecto que quieres comprobar.'
    );
  }
  const raiz = path.normalize(raizGit.trim());

  const base = cargarCatalogoDeploy(deps.rutaCatalogo);
  const capa = cargarCapaProyecto(raiz, base);
  const catalogo = combinarCatalogo(base, capa);

  const archivos = listarArchivos(raiz);
  if (archivos === null) {
    throw new DoctorDeployCommandError('[ERROR] taskctl doctor-deploy: no se pudo listar los ficheros del proyecto (git ls-files fallo).');
  }
  const tipos = detectarTipos(archivos.presentes, catalogo.tipos);

  const ctx: ContextoDeploy = {
    cwd: raiz,
    presentes: archivos.presentes,
    versionados: archivos.versionados,
    versionadosTodos: archivos.versionadosTodos,
    paraEscanear: archivos.paraEscanear,
    hallazgosHistorial: [],
    tipos,
    silencios: catalogo.silencios,
    silenciosUsados: new Set<number>(),
    opciones: {
      ...OPCIONES_SONDAS_POR_DEFECTO,
      pathHerramientas: pathDelProceso(),
      ...deps.opciones,
    },
  };

  const puntos = catalogo.puntos.map((p) => evaluarPunto(p, ctx, catalogo));

  const avisos = [...catalogo.avisos];
  if (tipos.length === 0) {
    avisos.push(
      'No se detecto ningun tipo de aplicacion (no hay package.json, Cargo.toml, pyproject.toml, pom.xml...): ' +
        'los puntos que dependen de un tipo salen NO APLICA. Si el proyecto tiene otra estructura, comprueba que lo ejecutas desde su raiz.'
    );
  }
  for (const s of catalogo.silencios) {
    if (!ctx.silenciosUsados.has(s.numero)) {
      if (s.commit === null && ctx.hallazgosHistorial.some((h) => h.patron === s.patron && h.fichero === s.fichero)) {
        avisos.push(
          `silenciar_${s.numero} (patron ${s.patron}, fichero ${s.fichero}) es un silencio de arbol (sin commit), pero ese patron y fichero ` +
            `tienen un hallazgo en el historial: un hallazgo del historial exige silenciar_${s.numero}_commit.`
        );
        continue;
      }
      avisos.push(
        `silenciar_${s.numero} (patron ${s.patron}, fichero ${s.fichero}) no coincide con ningun hallazgo: ` +
          'ya no hace falta, o el patron o la ruta no son los que informa el punto.'
      );
    }
  }

  // Los informes de --escribir no cuentan como «sucio»: dejan el arbol sin trackear a proposito
  // y una segunda ejecucion se marcaria sucia solo por el informe anterior.
  const estado = gitTexto(['status', '--porcelain', '--', '.', ':(exclude)docs/doctor-deploy'], raiz, { timeoutMs: 30_000 });
  const commitCrudo = gitTexto(['rev-parse', '--verify', '--quiet', 'HEAD'], raiz, { timeoutMs: 15_000 });
  const rama = gitTexto(['symbolic-ref', '--short', '-q', 'HEAD'], raiz, { timeoutMs: 15_000 });
  if (estado === null) avisos.push('no se pudo saber si el arbol esta limpio (git status fallo): se marca como sucio.');
  const commit = commitCrudo === null || commitCrudo.trim() === '' ? null : commitCrudo.trim();

  // Veredictos del agente: se mezclan sobre el analisis recien repetido en este HEAD.
  let puntosFinales = puntos;
  let veredictos: ResumenVeredictos | null = null;
  if (opciones.resultado !== null) {
    const m = incorporarVeredictos(opciones.resultado, raiz, deps.repoCwd, puntos, commit, avisos);
    puntosFinales = m.puntos;
    veredictos = m.resumen;
  }

  const ahora = (deps.ahora ?? ((): Date => new Date()))();
  const informe: InformeDeploy = {
    version: 2,
    comando: 'doctor-deploy',
    fecha: ahora.toISOString(),
    commit,
    rama: rama === null || rama.trim() === '' ? null : rama.trim(),
    arbolSucio: estado === null ? true : estado.trim() !== '',
    tipos,
    avisos,
    puntos: puntosFinales,
    veredictos,
    tareas: null,
  };
  return { informe, opciones, raiz, ahora };
}

/** La salida del comando y, con --escribir, el informe en disco. */
function emitir(a: Analisis): DoctorDeployResult {
  const { informe, opciones, raiz, ahora } = a;
  const { json, escribir } = opciones;
  const salida = salidaSegura(json ? formatearJson(informe) : formatearTexto(informe));
  const codigo = codigoSalida(informe.puntos);

  let rutaInforme: string | null = null;
  let rutaJson: string | null = null;
  let mensajeEscritura = '';
  if (escribir) {
    try {
      const destino = escribirInforme(raiz, fechaLocal(ahora), salidaSegura(formatearInforme(informe)), salidaSegura(formatearJson(informe)));
      rutaInforme = destino.md;
      rutaJson = destino.json;
      const rel = path.relative(raiz, destino.md).replace(/\\/g, '/');
      mensajeEscritura =
        `Informe escrito en ${rel} (y ${path.basename(destino.json)} al lado)${informe.arbolSucio ? ' (el arbol estaba sucio: no describe un commit limpio)' : ''}. ` +
        'No se ha commiteado: revisalo y commitealo tu.\n';
    } catch (e: unknown) {
      // El analisis ya esta hecho: se imprime igualmente y se avisa de que el informe no se guardo.
      const msg = e instanceof Error ? e.message : String(e);
      mensajeEscritura =
        salidaSegura(`[AVISO] No se pudo escribir el informe en ${CARPETA_INFORMES}: ${msg.replace(/\s+/g, ' ')}. `) +
        'El analisis de arriba es completo; arregla la ruta y repite con --escribir.\n';
    }
  }

  return { informe, codigo, salida, json, rutaInforme, rutaJson, mensajeEscritura };
}

/**
 * La variante sin `--crear-tareas`, sincrona (la que usan casi todos los tests). Con `--crear-tareas`
 * hay que usar `runDoctorDeployCompleto`: crear tareas escribe en disco y toca Git, y es asincrono.
 */
export function runDoctorDeployCommand(argv: readonly string[], deps: DoctorDeployDeps): DoctorDeployResult {
  const a = analizar(argv, deps);
  if (a.opciones.crearTareas) {
    throw new DoctorDeployCommandError('[ERROR] taskctl doctor-deploy: --crear-tareas necesita la variante asincrona (runDoctorDeployCompleto).');
  }
  return emitir(a);
}

/**
 * El comando entero, con `--crear-tareas`. Orden: analisis -> tareas -> informe. Las tareas se crean
 * ANTES de escribir el informe de `--escribir`: el guard de rama base aborta con ficheros sin
 * trackear, incluido el informe recien escrito.
 */
export async function runDoctorDeployCompleto(argv: readonly string[], deps: DoctorDeployDeps): Promise<DoctorDeployResult> {
  const a = analizar(argv, deps);
  if (!a.opciones.crearTareas) return emitir(a);
  let tareas: ResultadoCrearTareas;
  try {
    tareas = await crearTareasDeFallas(a.informe, a.raiz, fechaLocal(a.ahora));
  } catch (e: unknown) {
    if (e instanceof BaseBranchGuardError && a.informe.avisos.some((x) => x.includes('--resultado esta dentro del repositorio'))) {
      throw new BaseBranchGuardError(
        `${e.message}\n        Si el cambio es el fichero de --resultado, guardalo fuera del repositorio (la carpeta temporal del sistema).`
      );
    }
    throw e;
  }
  const informe: InformeDeploy = { ...a.informe, tareas: tareas.resumen };
  return { ...emitir({ ...a, informe }), tareas };
}
