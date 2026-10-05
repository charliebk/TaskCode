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
 * LO QUE SIGUE SIN HACER: contexto determinista desde docs/INDEX.md y
 * gatekeeper barato para la discrepancia de complejidad. La seleccion
 * determinista de skill (6.6/16.4.1, TASK-017) ya vive aqui, entre el
 * calculo del brainstorm y la escritura del frontmatter.
 *
 * Aplica la precondicion de rama base de la seccion 8.3 desde TASK-012
 * (ensureBaseBranchReady, antes de mover nada).
 */
import path from 'node:path';
import { mkdir, readdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import { parseArgs, rechazarFlagsDesconocidos } from '../cli/args.js';
import { parseAsignadoAFlag, identidadUsable, PISTA_VACIO_ESCRITURA, } from '../cli/asignado.js';
import { readTareaFile, moveTareaFile, isEexist, isEnoent, isEnotdir } from '../fs/task-store.js';
import { registrarTransicion } from '../core/transiciones.js';
import { resolverConfig } from '../core/config.js';
import { assertTransitionAllowed } from '../core/state-machine.js';
import { ensureBaseBranchReady, gitUserEmail } from '../fs/git.js';
import { autoCommit, extraerPushFlag, mensajeChore, } from '../fs/git-commit.js';
import { resolverAsignado } from '../core/wip.js';
import { extraerSecciones } from '../core/tarea-body.js';
import { validarEnunciado } from '../core/validacion-tarea.js';
import { proponerParticion } from '../core/particion-tarea.js';
import { escribirPropuestaParticion } from '../fs/particion.js';
import { cargarHeuristica, resolverNumeroAgentes, } from '../core/heuristica.js';
import { seleccionarRoles, ROLES_BRAINSTORM, } from '../core/roles-brainstorm.js';
import { nombrePeticionRol, nombreSalidaRol, nombrePeticionUnificador, nombrePeticionRedaccion, peticionRedaccionTemplate, peticionRolTemplate, salidaRolTemplate, peticionUnificadorTemplate, } from '../core/plan-brainstorm.js';
import { cargarCatalogoSkills, seleccionarSkill, FICHERO_CATALOGO_SKILLS, } from '../core/catalogo-skills.js';
import { PETICION_DESEMPATE_SKILL_FILENAME, SALIDA_DESEMPATE_SKILL_FILENAME, peticionDesempateSkillTemplate, salidaDesempateSkillTemplate, leerGanadorDesempate, } from '../core/plan-desempate-skill.js';
import { comprobarSkillInstalado } from '../core/plugin-instalado.js';
export class PlanCommandError extends Error {
}
/** Flags de `taskctl plan`: parseAsignadoAFlag (con su alias) y extraerPushFlag. */
export const FLAGS_PLAN = ['--asignado-a', '--asignado_a', '--push', '-p'];
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
 * Los tres tipos de fichero que numera una ronda de brainstorm. El
 * numero de ronda se DEDUCE del disco, no de una clave del frontmatter:
 * un contador guardado seria un segundo sitio donde vive la misma
 * verdad, y el dia que discrepara ganaria el equivocado.
 *
 * Como se usa cada uno esta explicado donde se usa (ver el bloque "COMO
 * SE MODELA EL ESTADO DE ESTA CARPETA" en runPlanCommand), que es donde
 * se pagaron cuatro rondas de revision por pares.
 *
 * Los ids de rol admiten digitos y guiones, no solo `[a-z]+`: la
 * primera version dejaba de casar en cuanto alguien añadiera un rol
 * llamado `brainstorm-datos-externos`, y la numeracion se rompia en
 * silencio.
 */
// TASK-042 (decision C4): el testigo de ronda es la peticion del unificador
// (2 o mas roles, o carpetas antiguas) o la de redaccion (1 rol, sin
// unificador). Las dos se escriben las ultimas y cierran la ronda.
const RONDA_UNIFICADOR_RE = /^peticion-(unificador|plan)-(\d+)\.md$/;
const PETICION_ROL_RE = /^peticion-brainstorm-[a-z0-9-]+-(\d+)\.md$/;
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
            `(Es la respuesta del unico rol de brainstorm, ${roles[0].titulo},\n` +
                'volcada aqui por quien orquesta.\n' +
                'Con un solo rol no hay unificador ni desacuerdos que resolver; en su lugar,\n' +
                'el plan senala lo que ese rol no cubrio.)\n';
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
/**
 * TASK-044 (C3 de la auditoria): cuando la tarea es demasiado grande, la
 * particion propuesta (una tarea por frente, lista para `import`) o, si no
 * hay frentes, como conseguirlos. Se escribe FUERA del repo y antes de
 * abortar, asi la tarea y el workspace siguen intactos.
 */
async function textoParticion(task, secciones, deps) {
    const propuesta = proponerParticion(task, secciones);
    if (propuesta === null) {
        return ('        Para que "taskctl plan" proponga la particion, agrupa los criterios por frente bajo\n' +
            '        un subtitulo "###" o una linea solo en negrita ("**Frente**"); los grupos\n' +
            '        "Transversal", "Comunes" o "General" se copian en cada tarea.\n');
    }
    const r = await escribirPropuestaParticion(task.id, propuesta.markdown, deps.repoCwd, deps.dirParticion);
    if (!r.escrito) {
        return `        (No se pudo escribir la particion propuesta: ${r.motivo}.)\n`;
    }
    return (`        Particion propuesta en ${String(propuesta.titulos.length)} tareas, una por frente:\n` +
        propuesta.titulos.map((t) => `          · ${t}\n`).join('') +
        `        Revisala e importala con: taskctl import "${r.ruta}" --tipo ${task.tipo} --sprint ${String(task.sprint)}\n` +
        (propuesta.hijasGrandes.length === 0
            ? ''
            : `        Ojo: ${propuesta.hijasGrandes.map((t) => `«${t}»`).join(', ')} sigue(n) con mas de 12 ` +
                'criterios al copiar los comunes; recortalos en el fichero.\n') +
        `        Tras importarla, ${task.id} sigue en 00-planificadas: retirala a mano (no hay comando ` +
        'para cancelar una tarea).\n');
}
export async function runPlanCommand(tareasRoot, argv, today, deps) {
    // TASK-047: un flag mal escrito aborta antes de cualquier efecto.
    rechazarFlagsDesconocidos(argv, FLAGS_PLAN, 'plan', (m) => new PlanCommandError(m));
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
    // --- Seleccion determinista de skill (seccion 6.6/16.4.1, TASK-017) -
    // Mismo criterio fail-closed que la heuristica de arriba, y por eso
    // va aqui y no mas abajo (hallazgo IMPORTANTE de revision por pares,
    // TASK-017): un catalogo mal formado tiene que abortar "plan" ANTES
    // del mkdir/writeFile del scaffold, no despues -- si no, el aborto
    // deja el workspace sucio (planificacion/ ya creada) y el guard de
    // la seccion 8.3 bloquea el reintento con un mensaje que no explica
    // la causa real. La diferencia con la heuristica es que aqui CERO
    // candidatos tras cruzar etiquetas SI es un resultado valido
    // (catalogo-skills.ts: el catalogo no es exhaustivo por diseno, a
    // diferencia de la heuristica).
    const catalogoSkills = cargarCatalogoSkills();
    const seleccionSkill = seleccionarSkill(task, catalogoSkills);
    const secciones = extraerSecciones(body);
    const avisosEnunciado = [];
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
    //
    // TASK-043: la puerta pasa a ser la validacion entera del enunciado
    // (objetivo, numero de criterios, criterios vacios o solo vagos), y se
    // aplica TAMBIEN con 0 roles: una tarea mal definida es igual de cara
    // de revisar aunque no lance brainstorm. Se valida la lectura FRESCA
    // (la de la rama base, donde la persona ya esta y donde hay que editar).
    const validacion = validarEnunciado(secciones);
    if (validacion.bloqueos.length > 0) {
        throw new PlanCommandError(`[ERROR] ${task.id}: la tarea no esta lista para planificar:\n` +
            validacion.bloqueos.map((b) => `        - ${b}\n`).join('') +
            (validacion.demasiadoGrande ? await textoParticion(task, secciones, deps) : '') +
            `        Estas en la rama base: edita "${filePath}", commitea el cambio y reintenta ` +
            '"taskctl plan". La tarea no se ha movido.');
    }
    avisosEnunciado.push(...validacion.avisos);
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
    let skillsRecomendadosFinal = [];
    let reglaSeleccionSkillFinal = null;
    let avisoSkillSinCandidato = null;
    let avisoSkillDesempatePendiente = null;
    let avisoSkillNoInstalada = null;
    let peticionDesempateSkillPath = null;
    let hayDesempatePendiente = false;
    if (seleccionSkill.ganador !== null) {
        skillsRecomendadosFinal = [seleccionSkill.ganador.id];
        reglaSeleccionSkillFinal = seleccionSkill.regla;
    }
    else if (seleccionSkill.candidatosEmpatados.length === 0) {
        avisoSkillSinCandidato =
            `Ningun skill de "${FICHERO_CATALOGO_SKILLS}" comparte etiquetas con ${task.id}: se deja ` +
                'sin "skills_recomendados". No es un fallo -- el catalogo no tiene por que cubrir toda tarea.';
    }
    else {
        // Empate en solape Y en prioridad: el desempate barato no lo
        // resuelve un calculo (16.4.1). La peticion se REGENERA siempre
        // (es derivada, igual que peticionRolTemplate): si el catalogo
        // cambio entre intentos, una peticion rancia listando candidatos
        // que ya no empatan seria peor que no tener ninguna.
        const peticionDesempatePath = path.join(planificacionDir, PETICION_DESEMPATE_SKILL_FILENAME);
        const salidaDesempatePath = path.join(planificacionDir, SALIDA_DESEMPATE_SKILL_FILENAME);
        await writeFile(peticionDesempatePath, peticionDesempateSkillTemplate(task, seleccionSkill.candidatosEmpatados, today), { encoding: 'utf8' });
        peticionDesempateSkillPath = peticionDesempatePath;
        if (!(await ficheroConContenido(salidaDesempatePath))) {
            await writeFile(salidaDesempatePath, salidaDesempateSkillTemplate(task), { encoding: 'utf8' });
        }
        // Tras el bloque de arriba el fichero siempre tiene contenido (o ya lo
        // tenia, o se acaba de escribir el scaffold, que nunca es vacio): no
        // hace falta comprobarlo una segunda vez (MEN-16, revision por pares
        // ronda 3, TASK-017).
        const ganadorDesempate = leerGanadorDesempate(await readFile(salidaDesempatePath, 'utf8'), seleccionSkill.candidatosEmpatados);
        if (ganadorDesempate !== null) {
            skillsRecomendadosFinal = [ganadorDesempate.id];
            reglaSeleccionSkillFinal = 'llm';
        }
        else {
            // El aviso final se construye mas abajo, sobre las rutas de
            // DESTINO tras moveTareaFile: en la primera vuelta (la unica en
            // la que se llega aqui con la tarea todavia en su carpeta de
            // origen) planificacionDir ya no existira una vez movida la tarea.
            hayDesempatePendiente = true;
        }
    }
    if (skillsRecomendadosFinal.length > 0) {
        const entradaGanadora = catalogoSkills.find((e) => e.id === skillsRecomendadosFinal[0]);
        if (entradaGanadora.origen === 'externo') {
            // "skill_N_id" de una entrada externa es "plugin:skill" (seccion
            // 6.6 del catalogo); el nombre del PLUGIN es el tramo antes de
            // ":". Comparar solo el marketplace (hallazgo IMP-5, revision por
            // pares ronda 2) reportaba 'instalado' un plugin inexistente si
            // CUALQUIER OTRO plugin del mismo marketplace si lo estaba -- el
            // id completo "plugin@marketplace" es la unica comprobacion que
            // no esconde un candidato real que falta.
            const nombrePlugin = entradaGanadora.id.split(':')[0];
            const pluginId = `${nombrePlugin}@${entradaGanadora.marketplace}`;
            const estadoInstalacion = comprobarSkillInstalado(pluginId);
            if (estadoInstalacion !== 'instalado') {
                // 'no-verificable' avisa igual que 'no-instalado' -- el riesgo
                // aceptado es peor si se calla -- pero con una redaccion propia
                // (hallazgo MENOR de revision por pares, TASK-017): decir "no
                // esta instalado" cuando lo unico que sabemos es que no se pudo
                // comprobar afirma algo que el subproceso no confirmo.
                const diagnostico = estadoInstalacion === 'no-verificable'
                    ? 'no se ha podido comprobar si esta instalado'
                    : 'no esta instalado';
                avisoSkillNoInstalada =
                    `Esta tarea se beneficiaria del skill "${entradaGanadora.id}" (marketplace ` +
                        `"${entradaGanadora.marketplace}") -- ${diagnostico}. Instalalo con "/plugin install ` +
                        `${pluginId}" antes de arrancar, o continua sin el.`;
            }
        }
    }
    // Re-planificacion (bucle B9->B5): sin esta comparacion,
    // "skills_recomendados" ya fijado en una vuelta anterior se pisaba en
    // silencio en cada "plan" -- misma trampa que asignadoCambiado ya
    // cierra para "asignado_a".
    const skillsRecomendadosCambiado = skillsRecomendadosFinal.length !== task.skills_recomendados.length ||
        skillsRecomendadosFinal.some((id, i) => id !== task.skills_recomendados[i]);
    const updated = {
        ...task,
        estado: 'en-diseno',
        asignado_a: asignadoFinal,
        actualizado: today,
        skills_recomendados: skillsRecomendadosFinal,
        regla_seleccion_skill: reglaSeleccionSkillFinal,
    };
    // --- El paquete de brainstorm (TASK-016) ---------------------------
    // Se escribe en la carpeta ACTUAL y ANTES de mover la tarea, por el
    // mismo motivo que la peticion de revision en TASK-013: si una
    // escritura falla a mitad, la tarea sigue donde estaba y reintentar
    // es posible. El orden inverso dejaria el estado movido sin
    // peticiones, que es un callejon de la maquina de estados.
    //
    // ── COMO SE MODELA EL ESTADO DE ESTA CARPETA, y por que asi ────────
    //
    // Este bloque se reescribio entero tras CUATRO rondas de revision por
    // pares, en las que el MISMO CRITICO se arreglo tres veces y volvio a
    // aparecer por una puerta distinta cada vez. Los tres arreglos eran
    // correctos para el caso que tenian delante; lo que fallaba era el
    // modelo. Merece la pena que quede escrito, porque es la parte
    // reutilizable:
    //
    //   1º intento — la ronda se deducia de los TRES tipos de fichero, y
    //      un resto de una ronda interrumpida la subia: la primera
    //      planificacion acababa sin peticiones de rol, con exit 0.
    //   2º intento — se eligio "el testigo" (la peticion del unificador,
    //      que se escribe la ultima), pero validado POR SU NOMBRE: un
    //      testigo huerfano o de cero bytes contaba como ronda completa.
    //   3º intento — se exigio a TODA ronda lo que solo la ronda 1
    //      produce, con lo que ninguna ronda >=2 podia estar completa y
    //      el contador se quedaba clavado en 2 para siempre.
    //   4ª ronda — un testigo con numero >=2 volvia a dejar la tarea sin
    //      brainstorm; subir el numero de roles dejaba la peticion del
    //      unificador rancia y contradiciendo a las peticiones de rol; y
    //      bajarlo sin llegar a cero seguia tirando salidas reales.
    //
    // La grieta comun: se estaba modelando la carpeta con DOS escalares
    // ("en que ronda voy" y "reutilizo el brainstorm") derivados de UN
    // solo fichero. Lo que la logica necesita saber son TRES cosas
    // independientes, y aqui se preguntan por separado y contra el disco:
    //
    //   (a) ¿En que ronda escribo?  -> avanza con cada vuelta cerrada.
    //   (b) ¿Hay un brainstorm reutilizable PARA LOS ROLES DE HOY?
    //       -> no es lo mismo que "la ronda es > 1". Es una pregunta
    //          sobre ficheros, y cambia si cambia el juego de roles.
    //   (c) ¿Que salidas hay que consolidar? -> las que existan EN DISCO
    //       de la ronda que lanzo esos roles; nunca una lista compuesta a
    //       partir de `roles`, que puede haber cambiado desde entonces.
    const brainstormDir = path.join(planificacionDir, BRAINSTORM_DIRNAME);
    // Mismo trato que el mkdir de `planificacion/` desde TASK-027: un
    // EEXIST crudo aqui salia como "taskctl no pudo arrancar", que ni es
    // cierto ni dice que hacer (MENOR de la ronda 4).
    try {
        await mkdir(brainstormDir, { recursive: true });
    }
    catch (e) {
        throw new PlanCommandError(`[ERROR] ${task.id}: no se pudo crear "${brainstormDir}" (${e.code ?? 'error desconocido'}). Si ahi hay un fichero con ese nombre, renombralo o borralo: esa ruta tiene que ser la ` +
            'carpeta del brainstorm de la tarea. La tarea no se ha movido.');
    }
    const enBrainstorm = await listarDir(brainstormDir);
    const rondasConAlgo = (re) => [...new Set(enBrainstorm.map((f) => re.exec(f)).filter((m) => m !== null).map((m) => Number(m[m.length - 1])))]
        .sort((a, b) => b - a);
    // (a) Ronda a escribir. El testigo (la peticion del unificador) se
    // escribe el ultimo, asi que la ronda avanza cuando el ultimo testigo
    // esta entero; si quedo vacio o no llego a escribirse, se reintenta
    // ese mismo numero.
    const ultimoTestigo = rondasConAlgo(RONDA_UNIFICADOR_RE)[0] ?? 0;
    const testigoEntero = ultimoTestigo > 0 &&
        ((await ficheroConContenido(path.join(brainstormDir, nombrePeticionUnificador(ultimoTestigo)))) ||
            (await ficheroConContenido(path.join(brainstormDir, nombrePeticionRedaccion(ultimoTestigo)))));
    const ronda = testigoEntero ? ultimoTestigo + 1 : Math.max(ultimoTestigo, 1);
    // (b) ¿Estan ya lanzados los roles DE HOY? Se busca la ronda mas alta
    // que tenga la peticion de cada uno de ellos. Si el juego de roles
    // cambio — subio la complejidad, o el enunciado gano criterios y la
    // heuristica subio sola — esto da null y el brainstorm se relanza con
    // el juego nuevo, que es lo que la persona esta pidiendo.
    //
    // Con cero roles no hay nada que lanzar, pero puede haber un
    // brainstorm anterior que consolidar: se busca la ronda mas alta que
    // tenga ALGUNA peticion, para no negar un trabajo que existe.
    const rolesLanzadosEn = async (n) => {
        if (roles.length === 0)
            return false;
        for (const rol of roles) {
            if (!(await ficheroConContenido(path.join(brainstormDir, nombrePeticionRol(rol, n))))) {
                return false;
            }
        }
        return true;
    };
    let rondaRoles = null;
    if (roles.length > 0) {
        for (const n of rondasConAlgo(PETICION_ROL_RE)) {
            if (await rolesLanzadosEn(n)) {
                rondaRoles = n;
                break;
            }
        }
    }
    else {
        rondaRoles = rondasConAlgo(PETICION_ROL_RE)[0] ?? null;
    }
    // Modo de la ronda (TASK-042, decision C4). Con exactamente 1 rol no hay
    // unificador: se escribe solo la peticion de redaccion, salvo que la
    // ronda reutilizable ya tenga 2 o mas salidas en disco (se bajo de 2
    // roles a 1): esas salidas son trabajo real y alguien las consolida.
    const contarSalidasDe = (n) => enBrainstorm.filter((f) => f.startsWith('salida-brainstorm-') && f.endsWith(`-${n}.md`)).length;
    const modo = roles.length === 1 && (rondaRoles === null || contarSalidasDe(rondaRoles) < 2)
        ? 'redaccion'
        : 'unificador';
    // En redaccion no se lanza ni se consolida ninguna ronda de rol: el
    // unico rol recibe la peticion de redaccion y escribe el plan.
    if (modo === 'redaccion')
        rondaRoles = null;
    const relanzarRoles = modo === 'unificador' && rondaRoles === null && roles.length > 0;
    if (relanzarRoles)
        rondaRoles = ronda;
    /**
     * LA NATURALEZA DE CADA ARTEFACTO DECIDE COMO SE ESCRIBE, y esta es
     * la distincion que la quinta ronda de revision obligo a hacer
     * explicita:
     *
     *   - La peticion de rol y la del unificador son DERIVADAS: se
     *     calculan enteras a partir de la tarea y del juego de roles. No
     *     llevan dentro el trabajo de nadie, asi que se REGENERAN. Antes
     *     se toleraban por nombre, y eso dejaba peticiones rancias
     *     conviviendo con las nuevas: una diciendo "eres el unico rol que
     *     se lanza" y la de al lado, escrita en el mismo segundo,
     *     diciendo "trabajan en paralelo contigo: arquitectura, testing".
     *   - El scaffold de salida SI puede llevar trabajo dentro: es donde
     *     el agente vuelca su respuesta. Ese se tolera si tiene contenido
     *     y solo se crea cuando falta.
     */
    const regenerar = async (nombre, contenido) => {
        const destino = path.join(brainstormDir, nombre);
        try {
            await writeFile(destino, contenido, { encoding: 'utf8', flag: 'w' });
        }
        catch (e) {
            // EISDIR si la ruta la ocupa una carpeta, EACCES/EPERM si el
            // fichero es de solo lectura. Sin envolverlo salia como "taskctl
            // no pudo arrancar", que ni es cierto ni dice que hacer — el
            // mismo sintoma que este fichero dice haber arreglado ya dos
            // veces, reintroducido en el unico artefacto que no pasaba por el
            // guard (IMPORTANTE de la ronda 5).
            throw new PlanCommandError(`[ERROR] ${task.id}: no se pudo escribir "${destino}" (${e.code ?? 'error desconocido'}). Si ahi hay una carpeta con ese nombre, o el fichero esta como solo lectura, ` +
                'renombralo o corrige sus permisos y reintenta. La tarea no se ha movido.');
        }
    };
    /**
     * Crea el scaffold solo si falta o si quedo vacio. Un fichero de cero
     * bytes es lo que deja una escritura cortada entre el `open()` y el
     * volcado; uno con contenido puede ser la respuesta de un agente y no
     * se toca jamas.
     */
    const asegurarScaffold = async (nombre, contenido) => {
        const destino = path.join(brainstormDir, nombre);
        if (await ficheroConContenido(destino))
            return;
        await regenerar(nombre, contenido);
    };
    if (relanzarRoles) {
        for (const rol of roles) {
            const otros = roles.filter((r) => r.id !== rol.id);
            await regenerar(nombrePeticionRol(rol, ronda), peticionRolTemplate(updated, secciones.objetivo, secciones.criterios, rol, otros, ronda, today));
        }
    }
    // Los roles que de verdad se lanzaron en `rondaRoles`, leidos del
    // disco. No es lo mismo que `roles`: si hoy hay menos que entonces,
    // los de entonces siguen contando — su trabajo existe.
    const rolesDeLaRonda = modo === 'redaccion'
        ? roles
        : rondaRoles === null
            ? []
            : ROLES_BRAINSTORM.filter((r) => [...enBrainstorm, ...(relanzarRoles ? roles.map((x) => nombrePeticionRol(x, ronda)) : [])]
                .includes(nombrePeticionRol(r, rondaRoles)));
    // Los scaffolds se aseguran SIEMPRE, se relancen los roles o no.
    // Antes iban dentro del "si no se reutiliza", asi que un scaffold que
    // faltara — por una muerte entre la peticion y su scaffold, o porque
    // alguien lo borrara por parecer basura — no se recreaba nunca: el
    // rol se quedaba con peticion y sin sitio donde escribir, y nadie lo
    // decia (CRITICO de la ronda 5).
    if (rondaRoles !== null) {
        for (const rol of rolesDeLaRonda) {
            await asegurarScaffold(nombreSalidaRol(rol, rondaRoles), salidaRolTemplate(updated, rol, rondaRoles));
        }
    }
    // (c) Las salidas a consolidar salen del DISCO, no de `roles`.
    // Componerlas a partir de `roles` fue lo que hizo que bajar la
    // complejidad tirase salidas reales — dos veces, por dos puertas
    // distintas. Se listan las de la ronda que lanzo los roles, sean
    // cuantas sean.
    const salidasAConsolidar = [];
    if (rondaRoles !== null) {
        const sufijo = `-${rondaRoles}.md`;
        for (const nombre of await listarDir(brainstormDir)) {
            if (!nombre.startsWith('salida-brainstorm-') || !nombre.endsWith(sufijo))
                continue;
            const rol = ROLES_BRAINSTORM.find((r) => nombre === nombreSalidaRol(r, rondaRoles));
            salidasAConsolidar.push({
                nombre,
                // Sin el "rol" delante salia "— rol rol desconocido" para una
                // salida de un rol retirado o renombrado a mano.
                titulo: rol !== undefined ? `rol ${rol.titulo}` : 'rol ya no declarado en el plugin',
            });
        }
        salidasAConsolidar.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }
    // Es una re-planificacion solo si el brainstorm que se reutiliza es
    // de una vuelta ANTERIOR. Si `rondaRoles === ronda` estamos
    // reintentando la misma vuelta, y llamar a eso "re-planificacion"
    // hacia que el CLI hablara de "salidas anteriores" y "tu feedback" en
    // una primera planificacion que nadie habia ejecutado todavia
    // (CRITICO de la ronda 5).
    const brainstormReutilizado = rondaRoles !== null && rondaRoles < ronda;
    // La peticion del unificador se escribe la ULTIMA, y eso es lo que
    // hace que la ronda solo avance cuando todo lo demas esta escrito.
    //
    // Matiz que costo una mutacion equivalente en la ronda 5: que se
    // REGENERE (en vez de tolerarse) no es lo que arregla el critico de
    // la ronda 4 — eso lo arregla que la ronda avance y que (b) mire los
    // roles de hoy. Por construccion, el fichero de ESTA ronda casi nunca
    // existe ya cuando llegamos aqui. Se regenera igualmente por dos
    // motivos reales: es defensa en profundidad si alguna vez la ronda no
    // avanza, y es lo coherente con su naturaleza (derivada, sin trabajo
    // de nadie dentro).
    if (modo === 'redaccion') {
        await regenerar(nombrePeticionRedaccion(ronda), peticionRedaccionTemplate(updated, secciones.objetivo, secciones.criterios, roles[0], ronda, today, resolucion, path.posix.join('..', PLAN_FINAL_FILENAME)));
    }
    else {
        await regenerar(nombrePeticionUnificador(ronda), peticionUnificadorTemplate(updated, secciones.objetivo, secciones.criterios, rolesDeLaRonda, salidasAConsolidar, ronda, rondaRoles, today, resolucion, path.posix.join('..', PLAN_FINAL_FILENAME)));
    }
    // TASK-056: la fila de plan congela el modo de flujo del config en la tarea.
    const conRegistro = registrarTransicion(body, 'plan', today, resolverConfig(deps.repoCwd).modo_flujo);
    const newFilePath = await moveTareaFile(tareasRoot, filePath, updated, conRegistro);
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
    // Mismo problema y misma solucion que brainstormDirFinal: las rutas
    // del desempate de skill se escribieron contra la carpeta de origen,
    // que el rename de arriba se acaba de llevar. Se recalculan aqui,
    // contra la de destino, antes de construir el aviso o devolver la
    // ruta de la peticion.
    if (peticionDesempateSkillPath !== null) {
        const planificacionDirFinal = path.join(path.dirname(newFilePath), PLANIFICACION_DIRNAME);
        const peticionDesempatePathFinal = path.join(planificacionDirFinal, PETICION_DESEMPATE_SKILL_FILENAME);
        peticionDesempateSkillPath = peticionDesempatePathFinal;
        if (hayDesempatePendiente) {
            const salidaDesempatePathFinal = path.join(planificacionDirFinal, SALIDA_DESEMPATE_SKILL_FILENAME);
            avisoSkillDesempatePendiente =
                `${seleccionSkill.candidatosEmpatados.length} skills empatan en solape y prioridad para ` +
                    `${task.id}: responde "${peticionDesempatePathFinal}" en "${salidaDesempatePathFinal}" y vuelve a ` +
                    'lanzar "taskctl plan" para dejarlo resuelto. Por ahora se deja sin "skills_recomendados".';
        }
    }
    return {
        avisosEnunciado,
        autoCommit: commitResult,
        id: task.id,
        filePath: newFilePath,
        planPath,
        planCreated,
        planMigrado,
        ronda,
        resolucion,
        roles: rolesDeLaRonda,
        rondaRoles,
        peticionesRol: rondaRoles === null
            ? []
            : rolesDeLaRonda.map((rol) => path.join(brainstormDirFinal, nombrePeticionRol(rol, rondaRoles))),
        modo,
        peticionUnificador: modo === 'unificador' ? path.join(brainstormDirFinal, nombrePeticionUnificador(ronda)) : null,
        peticionRedaccion: modo === 'redaccion' ? path.join(brainstormDirFinal, nombrePeticionRedaccion(ronda)) : null,
        brainstormReutilizado,
        asignadoA: asignadoFinal,
        asignadoCambiado,
        avisoIdentidad,
        baseBranchGuard,
        skillsRecomendados: skillsRecomendadosFinal,
        reglaSeleccionSkill: reglaSeleccionSkillFinal,
        skillsRecomendadosCambiado,
        avisoSkillSinCandidato,
        avisoSkillDesempatePendiente,
        peticionDesempateSkill: peticionDesempateSkillPath,
        avisoSkillNoInstalada,
    };
}
