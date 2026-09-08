/**
 * taskctl plan — la fase de diseno de la seccion 6 de la metodologia.
 * Nacio en TASK-010 como version minima (un solo scaffold) y TASK-016
 * (item D1) la convirtio en el orquestador determinista del brainstorm
 * paralelo por roles.
 *
 * QUE HACE, y donde esta la linea. El CLI resuelve SIN LLM todo lo que
 * es lookup o escritura: cuantos roles entran (tabla de
 * scripts/heuristica-complejidad.yml), cuales (orden fijo de
 * core/roles-brainstorm.ts), con que contexto acotado va cada uno
 * (seccion 16.2) y en que ficheros se deja todo. Luego escribe las
 * peticiones y para. NO invoca ningun modelo: quien orquesta la sesion
 * las dispara y vuelca las respuestas en los scaffolds. Es el mismo
 * reparto que TASK-013 fijo para "taskctl review", y por el mismo
 * motivo — un CLI que llama a un agente no se puede probar sin uno.
 *
 * LO QUE SIGUE SIN HACER: contexto determinista desde docs/INDEX.md,
 * gatekeeper barato para la discrepancia de complejidad y seleccion de
 * skill (6.6, TASK-017).
 *
 * Aplica la precondicion de rama base de la seccion 8.3 desde TASK-012
 * (ensureBaseBranchReady, antes de mover nada).
 */
import path from 'node:path';
import { mkdir, readdir, rename, stat, writeFile } from 'node:fs/promises';
import { parseArgs } from '../cli/args.js';
import { parseAsignadoAFlag, identidadUsable, PISTA_VACIO_ESCRITURA, } from '../cli/asignado.js';
import { readTareaFile, moveTareaFile, isEexist, isEnoent, isEnotdir } from '../fs/task-store.js';
import { assertTransitionAllowed } from '../core/state-machine.js';
import { ensureBaseBranchReady, gitUserEmail } from '../fs/git.js';
import { autoCommit, extraerPushFlag, mensajeChore, } from '../fs/git-commit.js';
import { resolverAsignado } from '../core/wip.js';
import { ultimaRonda } from '../fs/rondas.js';
import { extraerSecciones } from '../core/tarea-body.js';
import { cargarHeuristica, resolverNumeroAgentes, } from '../core/heuristica.js';
import { seleccionarRoles, ROLES_BRAINSTORM, } from '../core/roles-brainstorm.js';
import { nombrePeticionRol, nombreSalidaRol, nombrePeticionUnificador, peticionRolTemplate, salidaRolTemplate, peticionUnificadorTemplate, } from '../core/plan-brainstorm.js';
export class PlanCommandError extends Error {
}
export const PLAN_FINAL_FILENAME = 'plan-final.md';
/**
 * Subcarpeta del brainstorm, DENTRO de `planificacion/` y no colgando
 * de la raiz de la carpeta de tarea. No es cosmetica: asi el `rename`
 * de moveTareaFile se la lleva entera al cambiar de estado y el
 * autoCommit del paso 5 de la 8.3 ya la cubre con el dirname de la
 * tarea, sin tocar su lista de rutas ni anadir un caso especial.
 */
export const BRAINSTORM_DIRNAME = 'brainstorm';
/**
 * QUE FICHERO DECIDE EN QUE RONDA VAMOS. El del unificador, que se
 * escribe SIEMPRE EL ULTIMO — pero NO basta con que exista: hay que
 * comprobar que la ronda que atestigua esta de verdad completa (ver
 * rondaCompleta).
 *
 * La ronda 2 de la revision por pares demostro por que. El primer
 * intento de arreglo se quedo en "la ronda sale solo del testigo", y
 * eso deja dos puertas abiertas por las que vuelve a entrar el mismo
 * fallo: (a) si lo que sobrevive a la interrupcion es justo el fichero
 * del unificador y NO las peticiones de rol, y (b) si el testigo
 * existe pero esta VACIO, que es exactamente lo que deja un `open()`
 * seguido de una muerte antes del volcado — el escenario que motivo
 * todo esto. En los dos casos volvia a pasar lo de antes: primera
 * planificacion sin una sola peticion de rol, exit 0, y sin salida por
 * comandos.
 *
 * La leccion, y por eso queda escrita: **la existencia de un nombre de
 * fichero no es evidencia de que algo se completara.** El invariante
 * "se escribe el ultimo" solo ordena las escrituras; no dice nada de
 * si la ultima llego a terminar.
 *
 * De donde viene todo esto: la version original deducia la ronda de los
 * TRES tipos de fichero, y era el primer CRITICO de la ronda 1. Con
 * cualquier resto de una ronda interrumpida — un Ctrl+C entre dos
 * escrituras, un antivirus bloqueando un fichero — la ronda subia a 2
 * en la PRIMERA planificacion, el codigo la trataba como
 * re-planificacion y no escribia ni una sola peticion de rol. La tarea
 * pasaba a en-diseno con exit 0, anunciando una re-planificacion que
 * nunca habia ocurrido. Cada `plan` posterior repetia el diagnostico,
 * asi que no se salia con ningun comando: habia que borrar la carpeta a
 * mano.
 *
 * Consecuencia buscada de las correcciones juntas: una ronda a medias
 * se REINTENTA con el mismo numero, y las escrituras que ya se hicieron
 * se toleran (ver escribirSiNoEstaYa). "Ronda a medias" significa que
 * NO produjo lo que a ella le tocaba, que no es lo mismo para la ronda
 * 1 que para las siguientes — ver rondaCompleta, donde esa distincion
 * costo un tercer CRITICO.
 */
const RONDA_UNIFICADOR_RE = /^peticion-unificador-(\d+)\.md$/;
/**
 * Las salidas de rol, para saber de QUE ronda son las que el unificador
 * tiene que consolidar. No es lo mismo que la ronda en curso: en una
 * re-planificacion los roles no se relanzan, asi que la ronda 3 puede
 * tener que consolidar las salidas de la 1.
 *
 * Acepta digitos y guiones en el id del rol, no solo `[a-z]+`: la
 * version anterior dejaba de casar en cuanto alguien añadiera un rol
 * llamado `brainstorm-datos-externos`, y la numeracion se rompia en
 * silencio (hallazgo MENOR de la revision por pares).
 */
const SALIDA_ROL_RE = /^salida-brainstorm-[a-z0-9-]+-(\d+)\.md$/;
/**
 * Subcarpeta de artefactos de diseno dentro de la carpeta de la tarea
 * (TASK-027, item C3). La seccion 2 de la metodologia describe cada
 * carpeta de tarea como `tarea.md` + `planificacion/` + `revision/`;
 * `revision/` ya la crea "taskctl review" (REVISION_DIRNAME en
 * review.ts) y esta es la otra mitad.
 *
 * Se crea BAJO DEMANDA, cuando hay algo que escribir dentro, no en
 * "new"/"import": Git no versiona directorios vacios, asi que crearla
 * al dar de alta la tarea no llegaria al repo sin un .gitkeep que
 * nadie ha pedido, y de paso ensuciaria el workspace de quien solo
 * queria dar de alta una tarea. Mismo criterio que ya sigue
 * `revision/`.
 */
export const PLANIFICACION_DIRNAME = 'planificacion';
/** readdir tolerante: un directorio que no existe es "no hay nada". */
async function listarDir(dir) {
    try {
        return await readdir(dir);
    }
    catch (e) {
        if (isEnoent(e) || isEnotdir(e))
            return [];
        throw e;
    }
}
/**
 * Fichero regular Y con algo dentro. Un fichero de cero bytes es lo
 * que deja una escritura que se corto entre el `open()` y el volcado,
 * asi que para decidir "esto ya estaba hecho" no vale preguntar solo
 * si existe (CRITICO de la ronda 2 de la revision por pares).
 */
async function ficheroConContenido(p) {
    try {
        const s = await stat(p);
        return s.isFile() && s.size > 0;
    }
    catch (e) {
        if (isEnoent(e) || isEnotdir(e))
            return false;
        throw e;
    }
}
/**
 * isFile(), no "existe" a secas (hallazgo MENOR de revision por pares,
 * TASK-027): un DIRECTORIO llamado plan-final.md no es un plan. Con un
 * stat pelado, "plan" anunciaba "el plan se ha movido intacto" tras
 * renombrar un directorio, y "approve" lo daba por bueno.
 */
async function existeFichero(p) {
    try {
        return (await stat(p)).isFile();
    }
    catch (e) {
        // ENOTDIR ademas de ENOENT (hallazgo IMPORTANTE de revision por
        // pares ronda 2, TASK-027): si "planificacion" lo ocupa un FICHERO,
        // stat("planificacion/plan-final.md") contesta ENOTDIR en POSIX y
        // ENOENT en Windows. Absorber solo ENOENT hacia que el fix del
        // mkdir de la ronda 1 fuese un fix solo de Windows: en Linux el
        // fallo ocurre ANTES, aqui, y salia crudo por "plan" y tambien por
        // "approve" (que ni siquiera hace mkdir). Semanticamente ENOTDIR es
        // lo mismo que ENOENT para esta pregunta: ahi no hay ningun
        // fichero. Quien tenga que quejarse de la ruta ocupada es el mkdir
        // de "plan", que ya lo hace con un mensaje accionable.
        if (isEnoent(e) || isEnotdir(e))
            return false;
        throw e;
    }
}
/**
 * Dice donde esta el plan de una tarea, mirando las DOS ubicaciones
 * posibles. Existe porque toda tarea planificada antes de TASK-027
 * tiene su `plan-final.md` suelto en la raiz de la carpeta: si el
 * codigo nuevo mirase solo la ruta canonica, "taskctl approve" diria
 * "todavia no hay plan que aprobar" sobre una tarea que si lo tiene, y
 * la dejaria bloqueada en la maquina de estados.
 *
 * Lo comparten "plan" (que migra el legado) y "approve" (que acepta
 * cualquiera de las dos), para que no puedan divergir.
 */
export async function resolverPlanFinal(taskDir) {
    const canonica = path.join(taskDir, PLANIFICACION_DIRNAME, PLAN_FINAL_FILENAME);
    const legada = path.join(taskDir, PLAN_FINAL_FILENAME);
    return {
        canonica,
        legada,
        canonicaExiste: await existeFichero(canonica),
        legadaExiste: await existeFichero(legada),
    };
}
/**
 * El scaffold del plan final. Lo rellena el agente unificador
 * siguiendo `brainstorm/peticion-unificador-<ronda>.md`, que es donde
 * viven las instrucciones largas; aqui solo van las secciones, para
 * que el fichero no le repita al agente lo que ya tiene delante.
 */
export function planTemplate(task, roles) {
    // Las secciones se ajustan al numero de roles. Emitir "Desacuerdos
    // entre roles" con uno solo o con ninguno era pedirle al unificador
    // que rellenara una seccion imposible — y una seccion imposible se
    // rellena con relleno (hallazgo de la revision por pares: con la
    // tabla actual, 14 de las 32 tareas del repo resuelven un solo rol).
    let origen;
    let seccionRoles;
    if (roles.length === 0) {
        origen =
            '(Esta tarea no lanza brainstorm: su complejidad resuelve cero roles.\n' +
                'El plan se redacta directamente a partir del enunciado.)\n';
        seccionRoles = '';
    }
    else if (roles.length === 1) {
        origen =
            `(Lo consolida el agente unificador a partir de un solo rol de brainstorm:\n` +
                `${roles[0].titulo}. Con uno no hay desacuerdos que resolver, asi que lo que\n` +
                'aporta el unificador es senalar lo que ese rol no cubrio.)\n';
        seccionRoles = '## Lo que el rol no cubrio\n\n\n';
    }
    else {
        origen =
            `(Lo consolida el agente unificador a partir de ${roles.length} roles de brainstorm\n` +
                `lanzados en paralelo: ${roles.map((r) => r.titulo).join(', ')}.\n` +
                'Los desacuerdos entre roles se senalan, no se promedian.)\n';
        seccionRoles = '## Desacuerdos entre roles, y como se resuelven\n\n\n';
    }
    return (`# Plan — ${task.id}: ${task.titulo}\n\n` +
        origen +
        '\n## Enfoque propuesto\n\n\n' +
        seccionRoles +
        '## Riesgos aceptados y que los contiene\n\n\n' +
        '## Plan de pruebas\n\n\n' +
        '## Lo que necesita decision de una persona\n\n');
}
export async function runPlanCommand(tareasRoot, argv, today, deps) {
    // El ID sale de los POSICIONALES, no de argv[0] a secas (item B6):
    // con "--asignado-a" en juego, "taskctl plan --asignado-a carlos
    // TASK-001" tiene que funcionar igual que con el flag detras. De
    // paso, un "taskctl plan --loquesea" ya no se cuela como ID para
    // morir mas abajo con un InvalidTaskIdError que cli.ts no captura.
    // --push se saca del argv ANTES de parsear nada mas: es booleano
    // puro y parseArgs, que trata "--flag valor" como par, se habria
    // comido el ID en "taskctl plan --push TASK-030".
    const { push, resto } = extraerPushFlag(argv);
    const { positional } = parseArgs(resto);
    const id = positional[0];
    if (id === undefined || id.trim() === '') {
        throw new PlanCommandError('[ERROR] Falta el ID de la tarea: taskctl plan TASK-NNN.');
    }
    // Se parsea ANTES de tocar Git: un flag mal escrito no debe llegar a
    // cambiar de rama ni a mover carpetas antes de fallar.
    const asignadoA = parseAsignadoAFlag(resto, (m) => new PlanCommandError(m), PISTA_VACIO_ESCRITURA);
    // Lectura PRELIMINAR, contra la rama activa en este momento — que
    // puede no ser la rama base real si alguien invoca "plan" desde una
    // rama de feature vieja. Sirve solo para (a) rechazar rapido, sin
    // tocar Git, un caso ya claramente invalido en esta rama, y (b)
    // conocer task.tipo para poder resolver la rama base. NO se usa para
    // nada mas: ni su "body"/"filePath" ni un "aprobado en esta lectura"
    // se llevan a la escritura de mas abajo (hallazgo CRITICO de
    // revision por pares, TASK-012 — antes de este fix, una lectura
    // hecha en una rama vieja podia acabar escribiendose encima del
    // contenido real de la rama base tras el cambio automatico, o
    // disparar un TaskFolderConflictError falso comparando la carpeta
    // vieja con la carpeta real de la rama base).
    const initial = await readTareaFile(tareasRoot, id);
    assertTransitionAllowed('plan', initial ? initial.task : null);
    // ensureBaseBranchReady lanza BaseBranchGuardError si el workspace
    // tiene cambios sin commitear, o si no puede cambiar de forma
    // automatica a la rama base esperada segun task.tipo. task.tipo es
    // metadata estable que ningun comando de taskctl reescribe, asi que
    // usar la lectura preliminar para esto es seguro aunque sea de antes
    // del cambio de rama.
    const baseBranchGuard = ensureBaseBranchReady(initial.task.tipo, deps.repoCwd);
    // Lectura FRESCA, ya en la rama base real (si hubo cambio, aqui es
    // donde se nota) — esta es la unica que decide si se muta algo y con
    // que contenido. Puede rechazar aunque la preliminar de arriba haya
    // pasado (p. ej. otra persona ya avanzo la tarea en la rama base
    // mientras tanto) o aceptar como re-planificacion legitima un caso
    // que en la rama vieja parecia otra cosa.
    const existing = await readTareaFile(tareasRoot, id);
    assertTransitionAllowed('plan', existing ? existing.task : null);
    const { task, body, filePath } = existing;
    // asignado_a se resuelve contra la lectura FRESCA (la de justo
    // arriba), no contra la preliminar: otra persona pudo cambiarlo en la
    // rama base mientras tanto, y decidir "cambio o no" con la lectura
    // vieja daria un asignadoCambiado mentiroso — la misma regla de doble
    // lectura que obliga TASK-012.
    // Precedencia (TASK-024): flag > asignado_a previo > identidad Git >
    // null. Sin flag se CONSERVA lo que hubiera ("no lo has mencionado"
    // no es "quitalo"), y solo si no habia nada entra la identidad de
    // quien ejecuta.
    // identidadUsable filtra la identidad Git con las MISMAS reglas que
    // el flag (hallazgo CRITICO de revision por pares, TASK-024): un
    // user.email con un salto de linea dentro inyectaba claves en el
    // frontmatter y llegaba a pisar 'estado'. Una identidad invalida no
    // aborta el comando — quien ejecuta no ha pedido nada raro — pero se
    // ignora y se avisa.
    const { identidad, aviso: avisoIdentidad } = identidadUsable(gitUserEmail(deps.repoCwd));
    const asignadoFinal = resolverAsignado(asignadoA, task.asignado_a, identidad);
    const asignadoCambiado = asignadoFinal !== task.asignado_a;
    const updated = {
        ...task,
        estado: 'en-diseno',
        asignado_a: asignadoFinal,
        actualizado: today,
    };
    // --- Resolucion determinista del brainstorm (TASK-016) -------------
    // Va ANTES de cualquier escritura y de mover nada: todo lo que puede
    // abortar tiene que abortar con la tarea intacta.
    //
    // Un fallo aqui NO cae al comportamiento de antes: si el YML de la
    // heuristica falta o esta corrupto, "plan" para. Es la doctrina de
    // config.ts (fallo cerrado) y aqui pesa mas todavia, porque la
    // alternativa seria planificar en silencio con cero roles y que nadie
    // se entere de que el brainstorm no se hizo.
    const heuristica = cargarHeuristica();
    const resolucion = resolverNumeroAgentes(task, body, heuristica);
    const roles = seleccionarRoles(resolucion.agentes);
    const secciones = extraerSecciones(body);
    // Puerta del objetivo vacio. "taskctl new" deja el Objetivo en blanco
    // a proposito, y mientras "plan" solo escribia un scaffold eso era
    // inofensivo. Con N agentes detras deja de serlo: cada rol recibiria
    // una peticion sin sustancia, devolveria una invencion distinta, y el
    // unificador las consolidaria en un plan-final.md CON AUTORIDAD que
    // nadie podria distinguir de uno bien fundado.
    //
    // Se aplica SOLO cuando iba a escribirse al menos una peticion: con 0
    // roles el comportamiento es identico al de antes de TASK-016, asi
    // que ninguna tarea existente cambia de conducta por esto.
    //
    // No es un caso hipotetico: es exactamente lo que paso al planificar
    // la propia TASK-016, cuyo Objetivo estaba vacio — y de paso hundio
    // su puntuacion heuristica, porque las palabras de riesgo son la
    // unica senal del YML que mira el contenido del trabajo.
    if (roles.length > 0 && secciones.objetivo === '') {
        throw new PlanCommandError(`[ERROR] ${task.id}: el "## Objetivo" de tarea.md esta vacio, y esta tarea lanza ` +
            `${roles.length} agente(s) de brainstorm. Sin objetivo cada rol se inventaria el suyo y ` +
            'el plan resultante pareceria fundado sin serlo. Escribe el objetivo en ' +
            `"${filePath}" y reintenta. La tarea no se ha movido.`);
    }
    // El plan se escribe/migra en la carpeta ACTUAL, ANTES de mover la
    // tarea de estado — mismo orden y mismo motivo que "review" con
    // revision/ (TASK-013): si una escritura falla, la tarea no se ha
    // movido todavia y reintentar es posible, en vez de dejarla en
    // en-diseno sin plan. El rename de moveTareaFile se lleva despues
    // la subcarpeta entera.
    const taskDir = path.dirname(filePath);
    const ubicacion = await resolverPlanFinal(taskDir);
    // Fail-closed (TASK-027): con los dos ficheros a la vez no hay forma
    // de saber cual es el plan bueno, y elegir por nuestra cuenta puede
    // tirar el que la persona redacto. Se aborta ANTES de tocar nada.
    if (ubicacion.canonicaExiste && ubicacion.legadaExiste) {
        throw new PlanCommandError(`[ERROR] ${task.id}: hay un ${PLAN_FINAL_FILENAME} en la raiz de la carpeta y otro ` +
            `en ${PLANIFICACION_DIRNAME}/. No se puede saber cual es el plan bueno. Compara ` +
            `"${ubicacion.legada}" con "${ubicacion.canonica}", deja solo el de ` +
            `${PLANIFICACION_DIRNAME}/ y reintenta. La tarea no se ha movido.`);
    }
    // plan-final.md no tiene frontmatter y no encaja en el modelo Task,
    // asi que no pasa por writeTareaFile/moveTareaFile (que son
    // especificas de tarea.md) — pero SI reusa isEexist de task-store.ts
    // en vez de duplicar la comprobacion (hallazgo de revision por
    // pares, TASK-010).
    // Si "planificacion" existe pero como FICHERO, mkdir falla con un
    // EEXIST/ENOTDIR crudo que el CLI presentaba como "taskctl no pudo
    // arrancar" — ni cierto ni accionable (hallazgo MENOR de revision por
    // pares, TASK-027; CONVENCIONES: los errores dicen que hacer).
    const planificacionDir = path.join(taskDir, PLANIFICACION_DIRNAME);
    try {
        await mkdir(planificacionDir, { recursive: true });
    }
    catch (e) {
        throw new PlanCommandError(`[ERROR] ${task.id}: no se pudo crear "${planificacionDir}" (${e.code ?? 'error desconocido'}). Si ahi hay un fichero llamado "${PLANIFICACION_DIRNAME}", renombralo o borralo: ` +
            'esa ruta tiene que ser la carpeta de artefactos de diseno de la tarea. ' +
            'La tarea no se ha movido.');
    }
    let planCreated = false;
    let planMigrado = false;
    if (ubicacion.legadaExiste) {
        // Tarea planificada con el CLI anterior a TASK-027: el plan real
        // (redactado o no) esta suelto en la raiz. Se MUEVE, no se copia
        // ni se pisa con el scaffold — perder un plan redactado seria
        // exactamente el fallo que este item viene a evitar.
        await rename(ubicacion.legada, ubicacion.canonica);
        planMigrado = true;
    }
    else {
        // Sin un "else if (!canonicaExiste)" delante A PROPOSITO (hallazgo
        // IMPORTANTE de revision por pares, TASK-027): esa condicion hacia
        // inalcanzable el flag 'wx', que es justo el guardian contra pisar
        // un plan ya redactado, y con el se perdia la unica red de
        // regresion sobre un camino de perdida de datos. El 'wx' hace las
        // dos cosas — decide y protege — y ademas cierra la ventana entre
        // el stat de resolverPlanFinal y esta escritura.
        try {
            await writeFile(ubicacion.canonica, planTemplate(task, roles), {
                encoding: 'utf8',
                flag: 'wx',
            });
            planCreated = true;
        }
        catch (e) {
            if (!isEexist(e))
                throw e;
            // EEXIST con "wx" NO siempre es una re-planificacion: open() con
            // O_CREAT|O_EXCL contesta EEXIST tambien cuando la ruta la ocupa
            // un DIRECTORIO (comprobado en Windows, y es lo que manda POSIX).
            // Y aqui sabemos que canonicaExiste era false, o sea que el stat
            // no vio un fichero regular. Tragarse ese EEXIST dejaba a la
            // persona en un callejon sin salida: "plan" decia "ya existia --
            // se dejo intacto" con exit 0 sin haber plan ninguno, y "approve"
            // contestaba "todavia no tiene un plan-final.md que aprobar.
            // Ejecuta taskctl plan primero" -- un consejo que no lleva a
            // ningun sitio, porque "plan" vuelve a decir que todo esta bien
            // (hallazgo MENOR del smoke test manual, TASK-027).
            // Se distingue re-stateando: fichero regular = la carrera contra
            // la ventana entre resolverPlanFinal y esta escritura, que es
            // justo lo que el "wx" protege, y se deja intacto; cualquier otra
            // cosa = ruta ocupada, y se dice que hacer.
            if (!(await existeFichero(ubicacion.canonica))) {
                throw new PlanCommandError(`[ERROR] ${task.id}: "${ubicacion.canonica}" existe pero no es un fichero ` +
                    '(¿una carpeta con ese nombre?), asi que ahi no hay ningun plan que redactar ' +
                    'ni que aprobar. Renombra o borra esa ruta y reintenta. La tarea no se ha movido.');
            }
        }
    }
    // --- El paquete de brainstorm (TASK-016) ---------------------------
    // Se escribe en la carpeta ACTUAL y ANTES de mover la tarea, por el
    // mismo motivo que la peticion de revision en TASK-013: si una
    // escritura falla a mitad, la tarea sigue donde estaba y reintentar
    // es posible. El orden inverso dejaria el estado movido sin
    // peticiones, que es un callejon de la maquina de estados.
    const brainstormDir = path.join(planificacionDir, BRAINSTORM_DIRNAME);
    const peticionesRolCompletasDe = async (n) => {
        for (const rol of roles) {
            if (!(await ficheroConContenido(path.join(brainstormDir, nombrePeticionRol(rol, n))))) {
                return false;
            }
        }
        return true;
    };
    /**
     * Una ronda esta COMPLETA cuando produjo todo lo que a ELLA le
     * tocaba producir. Y no a todas les toca lo mismo: **solo la ronda 1
     * lanza los roles**; de la 2 en adelante el unico artefacto propio es
     * la peticion del unificador (§16.3 — un "pide cambios" es una
     * correccion incremental, no un reinicio).
     *
     * Esa asimetria es justo lo que se me paso, y la encontro la ronda 3
     * de la revision por pares. Exigir peticiones de rol a TODA ronda
     * hacia que ninguna ronda ≥2 pudiera estar completa nunca, con lo que
     * la ronda se quedaba **clavada en 2 para siempre**: del tercer
     * `plan` en adelante el comando era un no-op con exit 0, reutilizando
     * una peticion de unificador rancia y sin dejar rastro de las vueltas
     * posteriores. Y no hacia falta ningun estado corrupto para llegar
     * ahi: bastaba el camino feliz, tres veces seguidas.
     *
     * La leccion de fondo: aqui vivian fusionadas dos preguntas distintas
     * — "¿que ronda toca escribir?" y "¿hay que relanzar los roles?" —, y
     * responderlas con una sola variable funcionaba justo hasta la
     * tercera vuelta.
     */
    const rondaCompleta = async (n) => {
        if (!(await ficheroConContenido(path.join(brainstormDir, nombrePeticionUnificador(n))))) {
            return false;
        }
        return n > 1 ? true : peticionesRolCompletasDe(n);
    };
    // Ronda a escribir: la siguiente si la ultima quedo completa, y la
    // MISMA si quedo a medias — reintentarla es lo que impide que una
    // escritura interrumpida deje la tarea sin brainstorm para siempre.
    const ultimaTestigo = await ultimaRonda(brainstormDir, RONDA_UNIFICADOR_RE);
    const ronda = ultimaTestigo > 0 && (await rondaCompleta(ultimaTestigo))
        ? ultimaTestigo + 1
        : Math.max(ultimaTestigo, 1);
    // Re-planificacion (bucle B9->B5 de la 16.3): si ya hubo una ronda
    // COMPLETA, NO se relanza el brainstorm entero. El feedback de la
    // persona sobre el plan es una correccion incremental, y tratarla
    // como un reinicio es donde mas se gasta sin que nadie lo note,
    // precisamente porque cada vuelta parece barata. Solo reprocesa el
    // unificador.
    const brainstormReutilizado = ronda > 1;
    // De QUE ronda son las salidas que el unificador tiene que
    // consolidar. En la ronda 1 son las suyas; en una re-planificacion
    // son las de la ultima ronda que llego a escribirlas, que no es la
    // actual. Componer la lista con la ronda en curso hacia que la
    // peticion apuntase a ficheros inexistentes y el unificador
    // concluyera que se habia perdido el brainstorm entero, teniendolo
    // al lado sin leer — el segundo CRITICO de la revision por pares.
    //
    // Se busca la ronda mas alta cuyo juego de salidas este COMPLETO, no
    // el numero mas alto que aparezca. Tomar el maximo a secas dejaba que
    // un fichero rezagado — una salida de una ronda vieja que sobrevivio
    // sola, o una copiada a mano — secuestrara la lista: el unificador
    // recibia la orden de consolidar esa ronda huerfana y las salidas
    // reales no se nombraban en ninguna parte, asi que redactaba el plan
    // ignorando el brainstorm que si se hizo. Fallaba en silencio y hacia
    // arriba, que es la peor direccion (IMPORTANTE de la ronda 2).
    const salidasCompletasDe = async (n) => {
        if (roles.length === 0)
            return false;
        for (const rol of roles) {
            if (!(await ficheroConContenido(path.join(brainstormDir, nombreSalidaRol(rol, n))))) {
                return false;
            }
        }
        return true;
    };
    /**
     * Las salidas que hay que consolidar, resueltas a NOMBRES REALES de
     * fichero en vez de componerse a partir de `roles`.
     *
     * El cambio lo obliga un IMPORTANTE de la ronda 3: si alguien BAJA la
     * complejidad entre dos vueltas, `roles` se queda vacio y la lista
     * derivada salia vacia tambien — con lo que la peticion decia "no hay
     * salidas de brainstorm que consolidar" teniendo al lado, llenas, las
     * salidas que los agentes de la ronda anterior habian escrito. Y
     * ademas mentia sobre la causa ("el numero de roles sale del lookup,
     * no de un descuido"): aqui si hubo brainstorm, y se estaba tirando.
     *
     * Es el mismo sintoma que ya se corrigio dos veces — el unificador
     * ignorando un brainstorm real — entrando por una tercera puerta. La
     * unica forma de cerrarla del todo es preguntarle al disco que hay,
     * en vez de deducirlo de un parametro que puede haber cambiado.
     */
    const salidasAConsolidar = [];
    let rondaSalidas = null;
    const tituloDeSalida = (nombre) => {
        const rol = ROLES_BRAINSTORM.find((r) => nombre.startsWith(`salida-${r.id}-`));
        return rol?.titulo ?? 'rol desconocido';
    };
    if (!brainstormReutilizado) {
        rondaSalidas = ronda;
        for (const rol of roles) {
            salidasAConsolidar.push({ nombre: nombreSalidaRol(rol, ronda), titulo: rol.titulo });
        }
    }
    else {
        // Con roles, la ronda mas alta cuyo juego este COMPLETO: un fichero
        // rezagado no puede secuestrar la lista (IMPORTANTE de la ronda 2).
        for (let n = await ultimaRonda(brainstormDir, SALIDA_ROL_RE); n >= 1 && rondaSalidas === null; n--) {
            if (await salidasCompletasDe(n))
                rondaSalidas = n;
        }
        if (rondaSalidas !== null) {
            for (const rol of roles) {
                salidasAConsolidar.push({
                    nombre: nombreSalidaRol(rol, rondaSalidas),
                    titulo: rol.titulo,
                });
            }
        }
        else {
            // Sin roles con los que definir "juego completo" (complejidad
            // bajada a 0 roles), se listan las salidas que de verdad hay en
            // disco de la ronda mas alta que tenga alguna. Mejor nombrar un
            // brainstorm real de forma imperfecta que negar que existe.
            const enDisco = (await listarDir(brainstormDir))
                .map((nombre) => ({ nombre, m: SALIDA_ROL_RE.exec(nombre) }))
                .filter((x) => x.m !== null);
            const maxN = enDisco.reduce((acc, x) => Math.max(acc, Number(x.m[1])), 0);
            if (maxN > 0) {
                for (const { nombre, m } of enDisco) {
                    if (Number(m[1]) !== maxN)
                        continue;
                    if (await ficheroConContenido(path.join(brainstormDir, nombre))) {
                        salidasAConsolidar.push({ nombre, titulo: tituloDeSalida(nombre) });
                    }
                }
                if (salidasAConsolidar.length > 0)
                    rondaSalidas = maxN;
                salidasAConsolidar.sort((a, b) => a.nombre.localeCompare(b.nombre));
            }
        }
    }
    /**
     * Escribe con 'wx' y tolera que el fichero YA ESTE con el contenido
     * de esta misma ronda. Es lo que hace reintentable una ronda
     * interrumpida: si el proceso murio tras escribir dos de seis
     * ficheros, el reintento completa los cuatro que faltan en vez de
     * morir con EEXIST y dejar la tarea atascada para siempre.
     *
     * Lo que NO se tolera es que la ruta este ocupada por otra cosa:
     * open() con O_CREAT|O_EXCL contesta EEXIST tambien sobre un
     * DIRECTORIO, y ahi no hay ninguna peticion que reaprovechar. Se
     * distingue re-stateando, igual que hace plan-final.md desde
     * TASK-027 — tragarse el EEXIST a secas era el callejon sin salida
     * que aquel item ya pago.
     */
    const escribirSiNoEstaYa = async (nombre, contenido) => {
        const destino = path.join(brainstormDir, nombre);
        try {
            await writeFile(destino, contenido, { encoding: 'utf8', flag: 'wx' });
        }
        catch (e) {
            if (!isEexist(e))
                throw e;
            if (await ficheroConContenido(destino)) {
                // Ya escrito en un intento anterior: se respeta tal cual. Puede
                // llevar dentro el trabajo de un agente.
                return;
            }
            if (!(await existeFichero(destino))) {
                throw new PlanCommandError(`[ERROR] ${task.id}: "${destino}" existe pero no es un fichero (¿una carpeta con ese ` +
                    'nombre?), asi que ahi no se puede escribir la peticion de brainstorm. Renombra o ' +
                    'borra esa ruta y reintenta. La tarea no se ha movido.');
            }
            // Fichero regular pero VACIO: es la escritura que se corto entre
            // el open() y el volcado. Aqui no hay nada que respetar, asi que
            // se completa. Dejarlo como estaba era el bug que hacia que un
            // testigo truncado siguiera truncado ronda tras ronda.
            await writeFile(destino, contenido, { encoding: 'utf8', flag: 'w' });
        }
    };
    await mkdir(brainstormDir, { recursive: true });
    if (!brainstormReutilizado) {
        for (const rol of roles) {
            const otros = roles.filter((r) => r.id !== rol.id);
            await escribirSiNoEstaYa(nombrePeticionRol(rol, ronda), peticionRolTemplate(updated, secciones.objetivo, secciones.criterios, rol, otros, ronda, today));
            await escribirSiNoEstaYa(nombreSalidaRol(rol, ronda), salidaRolTemplate(updated, rol, ronda));
        }
    }
    // La peticion del unificador se escribe SIEMPRE la ULTIMA, y es el
    // unico fichero del que se deduce la ronda (ver RONDA_UNIFICADOR_RE).
    // Las dos cosas juntas son lo que hace que una interrupcion a mitad
    // se pueda reintentar en vez de dejar la tarea sin brainstorm.
    await escribirSiNoEstaYa(nombrePeticionUnificador(ronda), peticionUnificadorTemplate(updated, secciones.objetivo, secciones.criterios, roles, salidasAConsolidar, ronda, rondaSalidas, today, resolucion, path.posix.join('..', PLAN_FINAL_FILENAME)));
    const newFilePath = await moveTareaFile(tareasRoot, filePath, updated, body);
    const planPath = path.join(path.dirname(newFilePath), PLANIFICACION_DIRNAME, PLAN_FINAL_FILENAME);
    // Paso 5 de la 8.3 (TASK-030, item C2): la carpeta de ORIGEN entra
    // tambien, para que el commit registre el movimiento (y el borrado
    // de 00-planificadas/) en vez de una copia con la carpeta vieja
    // huerfana. planificacion/plan-final.md ya cae dentro de la carpeta
    // de destino, no hace falta nombrarlo aparte.
    const commitResult = autoCommit({
        cwd: deps.repoCwd,
        rutas: [path.dirname(filePath), path.dirname(newFilePath)],
        mensaje: mensajeChore(task.id, 'tarea en diseno'),
        push,
    });
    // Las rutas del brainstorm se recalculan contra la carpeta de
    // DESTINO: se escribieron en la de origen y el rename se las llevo,
    // asi que las de arriba ya no apuntan a nada. Devolver rutas muertas
    // seria peor que no devolverlas — el CLI las imprime para que la
    // persona las abra.
    const brainstormDirFinal = path.join(path.dirname(newFilePath), PLANIFICACION_DIRNAME, BRAINSTORM_DIRNAME);
    return {
        autoCommit: commitResult,
        id: task.id,
        filePath: newFilePath,
        planPath,
        planCreated,
        planMigrado,
        ronda,
        resolucion,
        roles,
        // Vacio en una re-planificacion: las peticiones de rol son las de
        // la ronda anterior y llevan SU numero, no este. Componer aqui la
        // ruta con la ronda actual devolveria ficheros que no existen.
        peticionesRol: brainstormReutilizado
            ? []
            : roles.map((rol) => path.join(brainstormDirFinal, nombrePeticionRol(rol, ronda))),
        peticionUnificador: path.join(brainstormDirFinal, nombrePeticionUnificador(ronda)),
        brainstormReutilizado,
        asignadoA: asignadoFinal,
        asignadoCambiado,
        avisoIdentidad,
        baseBranchGuard,
    };
}
