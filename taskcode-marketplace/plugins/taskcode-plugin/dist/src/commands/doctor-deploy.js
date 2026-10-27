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
import { existsSync, linkSync, mkdirSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { rechazarFlagsDesconocidos } from '../cli/args.js';
import { cargarCapaProyecto, cargarCatalogoDeploy, combinarCatalogo, TIPO_TODOS, } from '../core/doctor-deploy-catalogo.js';
import { codigoSalida, formatearInforme, formatearJson, formatearTexto, sanearPunto, } from '../core/doctor-deploy.js';
import { ocultarSecretos } from '../core/secretos.js';
import { ocultarCredenciales } from '../core/plataforma-remota.js';
import { detectarTipos, listarArchivos } from '../fs/deteccion-app.js';
import { gitTexto } from '../fs/git-crudo.js';
import { pathDelProceso } from '../fs/herramientas-deploy.js';
import { OPCIONES_SONDAS_POR_DEFECTO, SONDAS, } from '../fs/sondas-deploy.js';
export class DoctorDeployCommandError extends Error {
    constructor(message) {
        super(message);
        this.name = 'DoctorDeployCommandError';
    }
}
/** Flags de `taskctl doctor-deploy`. */
export const FLAGS_DOCTOR_DEPLOY = ['--json', '--escribir'];
/** Carpeta (relativa a la raiz del repo) donde `--escribir` deja el informe. */
export const CARPETA_INFORMES = path.join('docs', 'doctor-deploy');
const salidaSegura = (t) => ocultarSecretos(ocultarCredenciales(t));
// ---------------------------------------------------------------------
function evaluarPunto(punto, ctx, cat) {
    const base = {
        id: punto.id,
        severidad: punto.severidad,
        metodo: punto.metodo,
        arreglo: punto.arreglo,
        descripcion: punto.descripcion,
        referencia: punto.referencia,
        desactivado: false,
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
                motivo: `solo aplica a ${punto.tipos.join(' o ')}; ` +
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
    }
    catch (e) {
        const msg = (e instanceof Error ? e.message : String(e)).replace(/\s+/g, ' ').trim();
        return {
            ...base,
            estado: 'no-verificado',
            motivo: `la comprobacion fallo por una excepcion y no se pudo verificar: ${msg}`,
            evidencias: [],
        };
    }
}
function fechaLocal(d) {
    const dos = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}
/**
 * Escribe el informe en docs/doctor-deploy/<fecha>.md; si ya existe uno de ese
 * dia, <fecha>-2.md, <fecha>-3.md... Escritura atomica: fichero temporal en la
 * misma carpeta y `link` (falla si el destino existe, no pisa nada) o, donde
 * el sistema de ficheros no lo admite, `rename`.
 */
export function escribirInforme(raiz, fecha, contenido) {
    const dir = path.join(raiz, CARPETA_INFORMES);
    mkdirSync(dir, { recursive: true });
    const tmp = path.join(dir, `.informe-${process.pid}-${Date.now()}.tmp`);
    writeFileSync(tmp, contenido, { encoding: 'utf8', flag: 'wx' });
    try {
        for (let n = 1; n < 1000; n++) {
            const destino = path.join(dir, n === 1 ? `${fecha}.md` : `${fecha}-${n}.md`);
            try {
                linkSync(tmp, destino);
                return destino;
            }
            catch (e) {
                const code = e.code;
                if (code === 'EEXIST')
                    continue;
                // Sin soporte de enlaces duros: rename, tras comprobar a mano que no existe.
                if (existsSync(destino))
                    continue;
                renameSync(tmp, destino);
                return destino;
            }
        }
        throw new DoctorDeployCommandError(`[ERROR] taskctl doctor-deploy: ya hay mil informes de ${fecha} en ${CARPETA_INFORMES}. Muevelos o borralos.`);
    }
    finally {
        try {
            unlinkSync(tmp);
        }
        catch {
            // ya renombrado, o no existe
        }
    }
}
// ---------------------------------------------------------------------
export function runDoctorDeployCommand(argv, deps) {
    rechazarFlagsDesconocidos(argv, FLAGS_DOCTOR_DEPLOY, 'doctor-deploy', (m) => new DoctorDeployCommandError(m));
    const sobra = argv.find((a) => !a.startsWith('-'));
    if (sobra !== undefined) {
        throw new DoctorDeployCommandError(`[ERROR] taskctl doctor-deploy: no admite argumentos ("${sobra}"). Uso: taskctl doctor-deploy [--json] [--escribir].`);
    }
    const json = argv.includes('--json');
    const escribir = argv.includes('--escribir');
    const raizGit = gitTexto(['rev-parse', '--show-toplevel'], deps.repoCwd, { timeoutMs: 15_000 });
    if (raizGit === null || raizGit.trim() === '') {
        throw new DoctorDeployCommandError('[ERROR] taskctl doctor-deploy: este directorio no es un repositorio Git (o git no esta instalado).\n' +
            '        Ejecutalo desde la raiz del proyecto que quieres comprobar.');
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
    const ctx = {
        cwd: raiz,
        presentes: archivos.presentes,
        versionados: archivos.versionados,
        versionadosTodos: archivos.versionadosTodos,
        paraEscanear: archivos.paraEscanear,
        tipos,
        silencios: catalogo.silencios,
        silenciosUsados: new Set(),
        opciones: {
            ...OPCIONES_SONDAS_POR_DEFECTO,
            pathHerramientas: pathDelProceso(),
            ...deps.opciones,
        },
    };
    const puntos = catalogo.puntos.map((p) => evaluarPunto(p, ctx, catalogo));
    const avisos = [...catalogo.avisos];
    if (tipos.length === 0) {
        avisos.push('No se detecto ningun tipo de aplicacion (no hay package.json, Cargo.toml, pyproject.toml, pom.xml...): ' +
            'los puntos que dependen de un tipo salen NO APLICA. Si el proyecto tiene otra estructura, comprueba que lo ejecutas desde su raiz.');
    }
    for (const s of catalogo.silencios) {
        if (!ctx.silenciosUsados.has(s.numero)) {
            avisos.push(`silenciar_${s.numero} (patron ${s.patron}, fichero ${s.fichero}) no coincide con ningun hallazgo: ` +
                'ya no hace falta, o el patron o la ruta no son los que informa el punto.');
        }
    }
    // Los informes de --escribir no cuentan como «sucio»: dejan el arbol sin trackear a proposito
    // y una segunda ejecucion se marcaria sucia solo por el informe anterior.
    const estado = gitTexto(['status', '--porcelain', '--', '.', ':(exclude)docs/doctor-deploy'], raiz, { timeoutMs: 30_000 });
    const commit = gitTexto(['rev-parse', '--verify', '--quiet', 'HEAD'], raiz, { timeoutMs: 15_000 });
    const rama = gitTexto(['symbolic-ref', '--short', '-q', 'HEAD'], raiz, { timeoutMs: 15_000 });
    if (estado === null)
        avisos.push('no se pudo saber si el arbol esta limpio (git status fallo): se marca como sucio.');
    const ahora = (deps.ahora ?? (() => new Date()))();
    const informe = {
        version: 1,
        comando: 'doctor-deploy',
        fecha: ahora.toISOString(),
        commit: commit === null || commit.trim() === '' ? null : commit.trim(),
        rama: rama === null || rama.trim() === '' ? null : rama.trim(),
        arbolSucio: estado === null ? true : estado.trim() !== '',
        tipos,
        avisos,
        puntos,
    };
    const salida = salidaSegura(json ? formatearJson(informe) : formatearTexto(informe));
    const codigo = codigoSalida(puntos);
    let rutaInforme = null;
    let mensajeEscritura = '';
    if (escribir) {
        try {
            const destino = escribirInforme(raiz, fechaLocal(ahora), salidaSegura(formatearInforme(informe)));
            rutaInforme = destino;
            const rel = path.relative(raiz, destino).replace(/\\/g, '/');
            mensajeEscritura =
                `Informe escrito en ${rel}${informe.arbolSucio ? ' (el arbol estaba sucio: no describe un commit limpio)' : ''}. ` +
                    'No se ha commiteado: revisalo y commitealo tu.\n';
        }
        catch (e) {
            // El analisis ya esta hecho: se imprime igualmente y se avisa de que el informe no se guardo.
            const msg = e instanceof Error ? e.message : String(e);
            mensajeEscritura =
                salidaSegura(`[AVISO] No se pudo escribir el informe en ${CARPETA_INFORMES}: ${msg.replace(/\s+/g, ' ')}. `) +
                    'El analisis de arriba es completo; arregla la ruta y repite con --escribir.\n';
        }
    }
    return { informe, codigo, salida, json, rutaInforme, mensajeEscritura };
}
