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
import { mkdir, rename, stat, writeFile } from 'node:fs/promises';
import { parseArgs } from '../cli/args.js';
import { parseAsignadoAFlag, identidadUsable, PISTA_VACIO_ESCRITURA, } from '../cli/asignado.js';
import { readTareaFile, moveTareaFile, isEexist, isEnoent, isEnotdir } from '../fs/task-store.js';
import { assertTransitionAllowed } from '../core/state-machine.js';
import { ensureBaseBranchReady, gitUserEmail } from '../fs/git.js';
import { autoCommit, extraerPushFlag, mensajeChore, } from '../fs/git-commit.js';
import { resolverAsignado } from '../core/wip.js';
import { siguienteRonda } from '../fs/rondas.js';
import { extraerSecciones } from '../core/tarea-body.js';
import { cargarHeuristica, resolverNumeroAgentes, } from '../core/heuristica.js';
import { seleccionarRoles } from '../core/roles-brainstorm.js';
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
 * Los tres tipos de fichero que numera una ronda de brainstorm. Se
 * deduce la ronda del disco, no de una clave del frontmatter: un
 * contador guardado seria un segundo sitio donde vive la misma verdad.
 */
const RONDA_BRAINSTORM_RE = /^(?:peticion-brainstorm-[a-z]+|salida-brainstorm-[a-z]+|peticion-unificador)-(\d+)\.md$/;
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
    const origen = roles.length === 0
        ? '(Esta tarea no lanza brainstorm: su complejidad resuelve 0 roles. El plan\n' +
            'se redacta directamente a partir del enunciado.)\n'
        : `(Lo consolida el agente unificador a partir de ${roles.length} rol(es) de\n` +
            `brainstorm lanzados en paralelo: ${roles.map((r) => r.titulo).join(', ')}.\n` +
            'Los desacuerdos entre roles se senalan, no se promedian.)\n';
    return (`# Plan — ${task.id}: ${task.titulo}\n\n` +
        origen +
        '\n## Enfoque propuesto\n\n\n' +
        '## Desacuerdos entre roles, y como se resuelven\n\n\n' +
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
    const ronda = await siguienteRonda(brainstormDir, RONDA_BRAINSTORM_RE);
    // Re-planificacion (bucle B9->B5 de la 16.3): si ya hubo una ronda,
    // NO se relanza el brainstorm entero. El feedback de la persona sobre
    // el plan es una correccion incremental, y tratarla como un reinicio
    // es donde mas se gasta sin que nadie lo note, precisamente porque
    // cada vuelta parece barata. Solo reprocesa el unificador.
    const brainstormReutilizado = ronda > 1;
    try {
        await mkdir(brainstormDir, { recursive: true });
        if (!brainstormReutilizado) {
            for (const rol of roles) {
                const otros = roles.filter((r) => r.id !== rol.id);
                await writeFile(path.join(brainstormDir, nombrePeticionRol(rol, ronda)), peticionRolTemplate(updated, secciones.objetivo, secciones.criterios, rol, otros, ronda, today), { encoding: 'utf8', flag: 'wx' });
                await writeFile(path.join(brainstormDir, nombreSalidaRol(rol, ronda)), salidaRolTemplate(updated, rol, ronda), { encoding: 'utf8', flag: 'wx' });
            }
        }
        // La peticion del unificador se escribe SIEMPRE la ULTIMA. Es el
        // testigo barato de "el brainstorm se escribio entero": si el
        // proceso muere a mitad, su ausencia lo dice sin necesidad de
        // inventar un fichero de estado ni una clave de frontmatter.
        await writeFile(path.join(brainstormDir, nombrePeticionUnificador(ronda)), peticionUnificadorTemplate(updated, secciones.objetivo, secciones.criterios, roles, ronda, today, resolucion, path.posix.join('..', PLAN_FINAL_FILENAME)), { encoding: 'utf8', flag: 'wx' });
    }
    catch (e) {
        if (!isEexist(e))
            throw e;
        // Mismo razonamiento que con plan-final.md (TASK-027): open() con
        // O_CREAT|O_EXCL contesta EEXIST tambien cuando la ruta la ocupa un
        // DIRECTORIO, y la numeracion de ronda ya garantiza que el hueco
        // estaba libre. Tragarse este EEXIST dejaria "plan" diciendo que
        // todo fue bien con un brainstorm a medias escrito.
        throw new PlanCommandError(`[ERROR] ${task.id}: no se pudo escribir la ronda ${ronda} de brainstorm en ` +
            `"${brainstormDir}" porque alguna de sus rutas ya esta ocupada (¿restos con otro case ` +
            'en un filesystem case-insensitive, o una carpeta con el nombre de un fichero?). ' +
            'Limpia o renombra esa ruta y reintenta. La tarea no se ha movido.');
    }
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
