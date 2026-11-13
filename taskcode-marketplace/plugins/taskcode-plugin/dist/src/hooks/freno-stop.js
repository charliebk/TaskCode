/**
 * Freno de fin de turno — TASK-071. Lo ejecuta el hook `Stop` de Claude Code
 * (hooks/hooks.json -> dist/src/hooks/stop-verificacion.js) al terminar cada
 * turno del agente principal, en TODAS las sesiones de TODOS los proyectos con
 * el plugin. De ahi el orden de las guardas: de la mas barata a la mas cara, y
 * ningun proceso hasta saber que hay una tarea en curso.
 *
 *   1. `FRENO_VERIFICACION=0` en el entorno: interruptor de emergencia.
 *   2. `stop_hook_active: true`: Claude Code ya esta continuando por un
 *      bloqueo nuestro; volver a bloquear haria un bucle con un test flaky.
 *      Por eso el freno es de UN disparo por turno (aceptado en el plan).
 *   3. `tareas/02-en-curso/` no existe en la raiz del repo (solo `stat`).
 *   4. Ninguna tarea en curso (lectura de esa carpeta).
 *   5. Config: sin `comando_verificacion`, nada. Config invalida: se recuerda.
 *   6. La rama actual (el unico `git`) no es la `rama` de ninguna tarea en
 *      curso: nada. HEAD desacoplado cae aqui (aceptado en el plan).
 *   7. Config invalida con tarea en curso en la rama: BLOQUEA (decision de
 *      Carlos: fallo cerrado, como el resto de la config).
 *   8. Memo: misma huella del arbol que el ultimo verde del freno (TASK-111)
 *      -> 0 sin ejecutar ni escribir; misma que la ultima verificacion del
 *      memo compartido -> su resultado.
 *   9. Ejecutar. Verde -> 0. Cualquier otra cosa -> 2 con el informe.
 *
 * Registro (TASK-111): cada vez que llega al paso 8 anota una linea de la
 * puerta `freno` en el registro de puertas (docs/registro-puertas.md): modo =
 * tipo de verificacion; resultado verde, rojo u omitido.
 *
 * Que verificacion (TASK-091): con `comando_verificacion_selectiva`, la
 * selectiva, con la base de la tarea (la de su tipo: un hotfix va contra la
 * principal) en RAMA_BASE y su propio memo; sin ella, la completa, como
 * siempre. La puerta de integracion sigue siendo la completa de `finish`.
 *
 * Solo documentacion (TASK-102): si la config del arbol declara
 * `rutas_documentacion` y todo lo que cambia la tarea (sus commits frente a la
 * base y lo que hay sin commitear o sin trackear) es documentacion, no se corre
 * la suite: solo `comando_verificacion_documentacion` si se declara, y si no,
 * nada. Se decide antes que la selectiva y con `peticionDeTrabajo`, la misma
 * eleccion que usa review. Las rutas y el comando salen de la config de la
 * BASE (como en finish y en el guardian); la del arbol solo abre la puerta, asi
 * que sin la clave no hay ni un git mas que en la 0.14.0. Tarea sin tipo o
 * hotfix (su base puede costar red): no se exime nada.
 *
 * Contrato con Claude Code (spike TASK-069 y documentacion oficial): exit 0
 * deja parar; exit 2 bloquea y el stderr le llega al agente; exit 1 NO
 * bloquea, asi que nunca se sale con 1 por accidente: decidirStop no lanza.
 * Nada de lo que escribe nombra el producto: lo leen proyectos ajenos.
 */
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ConfigError, presupuestoFreno, raizDelRepo, resolverConfigConAvisos, TECHO_HOOK_STOP_S, } from '../core/config.js';
import { formatearVerificacionRoja } from '../core/informe-verificacion.js';
import { peticionDeTrabajo } from '../fs/decision-documentacion.js';
import { baseDeTipoSinRed, resolveBaseBranchForTipo } from '../fs/git.js';
import { listTareasEnEstados } from '../fs/task-store.js';
import { contextoDePeticion, huellaDelArbol, verificarConMemo } from '../fs/verificacion.js';
import { crearProgreso, entornoConContador } from '../fs/progreso.js';
import { PUERTA_FRENO } from '../core/registro-puertas.js';
import { anotarPuerta } from '../fs/registro-puertas.js';
import { esUltimoVerde, guardarUltimoVerde } from '../fs/freno-ultimo-verde.js';
/**
 * `timeout` del hook Stop en hooks/hooks.json, en segundos. Claude Code cancela
 * el hook al vencerlo y descarta su salida: el freno fallaria ABIERTO. Por eso
 * la verificacion se corta antes, con margen para escribir el informe. Un test
 * comprueba que coincide con hooks.json.
 */
export const TECHO_HOOK_S = TECHO_HOOK_STOP_S;
export const MARGEN_HOOK_S = 60;
/** Variable de entorno que apaga el freno: `FRENO_VERIFICACION=0`. */
export const INTERRUPTOR = 'FRENO_VERIFICACION';
const DEJAR_PARAR = Object.freeze({ codigo: 0, stderr: '' });
/**
 * Segundos que se le dan a la verificacion: `timeout_verificacion`, pero nunca
 * mas que el `timeout` del hook menos el margen. Si el hook agotara el suyo,
 * Claude Code descartaria el informe y el freno fallaria abierto.
 */
export function timeoutEfectivoS(timeoutVerificacion) {
    const techo = TECHO_HOOK_S - MARGEN_HOOK_S;
    return timeoutVerificacion > techo
        ? { timeoutS: techo, recortado: true }
        : { timeoutS: timeoutVerificacion, recortado: false };
}
/** El directorio de tareas en curso, si existe. Sin procesos. */
export function carpetaEnCurso(raiz) {
    const dir = path.join(raiz, 'tareas', '02-en-curso');
    try {
        return statSync(dir).isDirectory() ? dir : null;
    }
    catch {
        return null;
    }
}
export function ramaActual(raiz) {
    const r = spawnSync('git', ['branch', '--show-current'], { cwd: raiz, encoding: 'utf8', windowsHide: true });
    if (r.error !== undefined || r.status !== 0)
        return null;
    const rama = (r.stdout ?? '').trim();
    return rama === '' ? null : rama;
}
export async function decidirStop(entrada, deps = {}) {
    const env = deps.env ?? process.env;
    // 1 y 2: sin I/O.
    if (env[INTERRUPTOR] === '0')
        return DEJAR_PARAR;
    if (entrada.stop_hook_active === true)
        return DEJAR_PARAR;
    if (typeof entrada.cwd !== 'string' || entrada.cwd === '' || !existsSync(entrada.cwd))
        return DEJAR_PARAR;
    let raiz;
    let ids;
    let config = null;
    let errorConfig = null;
    let rama;
    let tipo = null;
    try {
        // 3 y 4: stat y lectura de una carpeta.
        raiz = raizDelRepo(entrada.cwd);
        const dir = carpetaEnCurso(raiz);
        if (dir === null)
            return DEJAR_PARAR;
        const { tareas, ilegibles } = await listTareasEnEstados(path.join(raiz, 'tareas'), ['en-curso']);
        const ramas = new Set(tareas.map((t) => t.task.rama).filter((r) => typeof r === 'string' && r !== ''));
        ids = tareas.map((t) => t.task.id);
        if (ramas.size === 0 && ilegibles.length === 0)
            return DEJAR_PARAR;
        // Una tarea en curso ilegible podria ser la de esta rama: el freno no la
        // ve. No se bloquea (no se sabe si aplica), pero tampoco se calla.
        const sinLeer = ilegibles.length === 0
            ? DEJAR_PARAR
            : {
                codigo: 0,
                stderr: `Aviso: no se pudo leer ${ilegibles.map((f) => path.relative(raiz, f)).join(', ')}. Si es la tarea ` +
                    'en curso de esta rama, el freno de verificacion no la ve: corrige su frontmatter.',
            };
        // 5: un readFile.
        try {
            config = resolverConfigConAvisos(raiz).config;
            if (config.comando_verificacion === null)
                return DEJAR_PARAR;
        }
        catch (e) {
            if (!(e instanceof ConfigError))
                throw e;
            errorConfig = e.message.replace(/^\[ERROR\]\s*/, '');
        }
        // 6: el unico git hasta aqui.
        rama = ramaActual(raiz);
        if (rama === null || !ramas.has(rama))
            return sinLeer;
        const deEstaRama = tareas.filter((t) => t.task.rama === rama);
        ids = deEstaRama.map((t) => t.task.id);
        tipo = deEstaRama[0]?.task.tipo ?? null;
    }
    catch {
        // Algo inesperado ANTES de saber si el freno aplica (tareas ilegibles,
        // permisos): no se puede afirmar que haya una tarea en curso aqui.
        return DEJAR_PARAR;
    }
    try {
        const tarea = ids.join(', ');
        // 7
        if (errorConfig !== null || config === null) {
            return {
                codigo: 2,
                stderr: `Hay una tarea en curso en esta rama (${tarea}), pero la configuracion del proyecto no se ` +
                    `puede leer, asi que no se sabe como verificarla:\n  ${errorConfig ?? 'configuracion ausente'}\n` +
                    'Corrige .taskcode/config.yml y vuelve a verificar antes de dar la tarea por terminada.',
            };
        }
        const cfg = config;
        const tipoTarea = tipo;
        const { plan, avisos: avisosDecision } = peticionDeTrabajo({
            config: cfg,
            raiz,
            base: () => (tipoTarea === null ? cfg.rama_base : resolveBaseBranchForTipo(tipoTarea, raiz)),
            // Sin tipo, la base es un respaldo; en un hotfix, resolverla puede ir a
            // la red (ls-remote) en cada turno (MEN-1 de la revision). En los dos
            // casos no se exime nada por documentacion: la verificacion de siempre.
            baseFiable: tipoTarea !== null && baseDeTipoSinRed(tipoTarea),
            sinSelectiva: 'completa',
        });
        const dejarParar = avisosDecision.length === 0 ? DEJAR_PARAR : { codigo: 0, stderr: avisosDecision.join('\n') };
        // Solo documentacion sin comprobacion declarada: no hay nada que correr.
        if (plan.tipo === 'nada' || (plan.tipo === 'documentacion' && plan.comando === null))
            return dejarParar;
        // TASK-125: con comando_verificacion_freno, el freno corre ese comando en
        // vez de la completa o la selectiva (la documentacion se decide igual), y
        // con presupuesto lo corta al agotarse sin bloquear el turno.
        const presupuesto = presupuestoFreno(cfg);
        const rapido = cfg.comando_verificacion_freno !== null && (plan.tipo === 'completa' || plan.tipo === 'selectiva');
        const timeoutPlan = rapido ? presupuesto : plan.timeoutS;
        const clave = rapido
            ? 'presupuesto_freno_s'
            : plan.tipo === 'selectiva'
                ? 'timeout_verificacion_selectiva'
                : 'timeout_verificacion';
        const porPresupuesto = presupuesto !== null && presupuesto <= timeoutPlan;
        const pedido = porPresupuesto ? presupuesto : timeoutPlan;
        const { timeoutS, recortado } = timeoutEfectivoS(pedido);
        const avisos = [...avisosDecision];
        if (recortado) {
            avisos.push(`${porPresupuesto ? 'presupuesto_freno_s' : clave} pide ${String(pedido)} s, pero este freno tiene un tope de ` +
                `${String(timeoutS)} s: se ha usado el tope.`);
        }
        let peticion;
        if (rapido) {
            const base = plan.tipo === 'selectiva'
                ? plan.base
                : tipoTarea !== null && baseDeTipoSinRed(tipoTarea)
                    ? resolveBaseBranchForTipo(tipoTarea, raiz)
                    : cfg.rama_base;
            peticion = { tipo: 'freno', comando: cfg.comando_verificacion_freno, timeoutS, base };
        }
        else {
            peticion =
                plan.tipo === 'selectiva'
                    ? { tipo: 'selectiva', comando: plan.comando, timeoutS, base: plan.base }
                    : { tipo: plan.tipo, comando: plan.comando, timeoutS };
        }
        const idTarea = ids[0] ?? tarea;
        const anotar = (resultado, duracionS) => {
            (deps.anotarPuerta ?? anotarPuerta)(raiz, {
                puerta: PUERTA_FRENO,
                tarea: idTarea,
                instante: new Date().toISOString(),
                modo: peticion.tipo,
                duracionS,
                resultado,
            });
        };
        // 8a. TASK-111: misma huella que el ultimo verde del freno -> ni se ejecuta
        // ni se escribe nada (salvo los avisos de la decision): el turno no cambio
        // nada que verificar. Vale tambien con el arbol sucio, donde el memo
        // compartido de la selectiva no se guarda (TASK-105).
        const huella = huellaDelArbol(raiz, peticion.comando, peticion.timeoutS, contextoDePeticion(raiz, peticion));
        if (huella !== null && esUltimoVerde(raiz, peticion.tipo, huella)) {
            anotar('omitido', 0);
            return dejarParar;
        }
        // 8 y 9. TASK-110: el paso se ve mientras corre; acaba "terminada" si sale
        // en verde, "en rojo" si la verificacion sale en rojo y bloquea el turno, y
        // "abortada" solo si algo lanza.
        const progreso = deps.progreso ?? crearProgreso(raiz);
        const paso = peticion.tipo === 'completa' ? 'verificacion' : `verificacion ${peticion.tipo}`;
        progreso.fase(ids[0] ?? tarea, 'freno', [paso]);
        progreso.paso(paso);
        // TASK-110: solo el comando de verificacion recibe el contador (TASKCTL_PROGRESO).
        const deOpciones = {
            env: entornoConContador(process.env, progreso.contador()),
            ...(deps.timeoutMs === undefined ? {} : { timeoutMs: deps.timeoutMs }),
        };
        let verificacion;
        const inicio = Date.now();
        try {
            verificacion = verificarConMemo(raiz, peticion, deOpciones);
        }
        catch (e) {
            progreso.terminar('abortada');
            throw e;
        }
        const duracionS = (Date.now() - inicio) / 1000;
        const { resultado: r, deMemo, cambioElArbol } = verificacion;
        // TASK-125: cortada por el presupuesto -> no bloquea: una linea y `excedido`.
        // Review y finish la vuelven a exigir con sus comandos.
        if (r.estado === 'cortada' && porPresupuesto) {
            progreso.terminar('ok');
            anotar(deMemo ? 'omitido' : 'excedido', duracionS);
            const aviso = `Aviso: la verificacion del freno de fin de turno supero su presupuesto (${String(timeoutS)} s, ` +
                'presupuesto_freno_s) y se corto sin resultado; review y finish la vuelven a exigir.';
            return { codigo: 0, stderr: [...avisos, aviso].join('\n') };
        }
        progreso.terminar(r.estado === 'verde' ? 'ok' : 'en-rojo');
        if (r.estado === 'verde') {
            // TASK-111: un verde del memo compartido tampoco ha ejecutado nada.
            anotar(deMemo ? 'omitido' : 'verde', duracionS);
            if (verificacion.huella !== null && !cambioElArbol)
                guardarUltimoVerde(raiz, peticion.tipo, verificacion.huella);
            return dejarParar;
        }
        // IMP-1 (revision TASK-111): un rojo servido del memo compartido sigue
        // bloqueando, pero no ha ejecutado nada: no cuenta como ejecucion.
        anotar(deMemo ? 'omitido' : 'rojo', duracionS);
        if (plan.tipo === 'documentacion') {
            avisos.push(`Es la comprobacion de documentacion (comando_verificacion_documentacion): ${plan.motivo}. ` +
                'Antes de integrar se vuelve a exigir.');
        }
        if (peticion.tipo === 'selectiva') {
            avisos.push(`Es la verificacion selectiva (por impacto respecto a ${peticion.base}); antes de integrar ` +
                'se exige ademas la completa.');
        }
        if (peticion.tipo === 'freno') {
            avisos.push('Es el comando del freno (comando_verificacion_freno); review y finish corren ademas los suyos antes ' +
                'de integrar.');
        }
        if (deMemo) {
            avisos.push('Es el resultado guardado de la ultima verificacion: el arbol no ha cambiado desde entonces y no ' +
                'se ha vuelto a ejecutar. Si crees que el fallo es intermitente, cambia algo o ejecuta el comando a mano.');
        }
        if (cambioElArbol) {
            avisos.push('La propia verificacion ha cambiado ficheros del arbol de trabajo (git status): revisalos antes del ' +
                'siguiente comando, que puede abortar por workspace sucio.');
        }
        return bloquear(tarea, r, avisos);
    }
    catch (e) {
        // Con una tarea en curso en la rama y el freno configurado, un fallo del
        // propio freno no puede convertirse en un "todo bien" silencioso.
        const msg = e instanceof Error ? e.message : String(e);
        return {
            codigo: 2,
            stderr: `El freno de verificacion no pudo comprobar la tarea en curso: ${msg}\n` +
                'Ejecuta a mano el comando de verificacion del proyecto antes de dar la tarea por terminada.',
        };
    }
}
function bloquear(tarea, r, avisos) {
    const lineas = [`Tarea en curso en esta rama: ${tarea}.`, formatearVerificacionRoja(r), ...avisos];
    return { codigo: 2, stderr: lineas.join('\n') };
}
/** Lee stdin entero (el JSON del hook). Un JSON roto o vacio es una entrada sin campos. */
export function parsearEntrada(texto) {
    try {
        const v = JSON.parse(texto);
        return typeof v === 'object' && v !== null && !Array.isArray(v) ? v : {};
    }
    catch {
        return {};
    }
}
