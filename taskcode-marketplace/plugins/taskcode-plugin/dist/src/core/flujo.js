/**
 * Todas las fases que puede devolver siguienteFase. Lista en tiempo de
 * ejecucion (no solo tipo) para que el test de las skills de fase compruebe
 * que cada una tiene skill asignada: una fase nueva sin mapear lo pone rojo.
 */
export const FASES_SIGUIENTE = [
    'plan',
    'approve',
    'start',
    'review',
    'veredicto',
    'codex-review',
    'veredicto-codex',
    'finish',
    'terminada',
];
/** Tope de rondas de revision: desde esta, otra ronda la decide una persona. */
export const TOPE_RONDAS = 3;
/**
 * Fases que abren una fase NUEVA del ciclo: en semiautomatico se pregunta
 * antes de entrar. Las demas (veredicto, la primera codex-review, otra ronda
 * de review) son pasos internos de la revision y siguen solas, salvo las que
 * marcan `exigePersona`: el veredicto de la segunda opinion y otra
 * codex-review tras pedir cambios preguntan en cualquier modo que encadene.
 */
function accionPara(fase, modo, task, abreFase, exigePersona, faltaTrabajo) {
    if (fase === 'terminada' || modo === 'manual')
        return 'detener';
    // Lo que falta no es una fase sino trabajo (implementar, o corregir tras
    // cambios-solicitados). Fuera del automatico se detiene SIEMPRE, tambien en
    // el tope de rondas: encadenar la revision ahi la relanzaria sobre el mismo
    // codigo (IMP-3 de la revision de TASK-058; IMP-2 de la de TASK-059).
    if (faltaTrabajo && modo !== 'automatico')
        return 'detener';
    // Pasos que solo puede decidir una persona aunque el modo encadene (tambien
    // los topes: ronda de mas, finish con algo distinto de lo revisado).
    if (exigePersona)
        return 'preguntar';
    // En automatico el trabajo pendiente lo hace la skill y sigue (TASK-059).
    if (faltaTrabajo)
        return 'continuar';
    // Decision de Carlos (2026-10-04): hotfix y release mergean a main con
    // tag; en ningun modo se cierran sin preguntar.
    if (fase === 'finish' && (task.tipo === 'hotfix' || task.tipo === 'release'))
        return 'preguntar';
    // Automatico (TASK-059): todas las preguntas se hicieron en plan; sus guardas
    // (modo congelado, lo revisado = lo que se cierra, tope de rondas, hotfix/release)
    // llegan aqui como exigePersona.
    if (modo === 'automatico')
        return 'continuar';
    return abreFase ? 'preguntar' : 'continuar';
}
export function siguienteFase(task, ctx, modo) {
    const paso = (fase, abreFase, motivo, comando = `taskctl ${fase} ${task.id}`, exigePersona = false, faltaTrabajo = false) => ({
        fase,
        comando,
        accion: accionPara(fase, modo, task, abreFase, exigePersona, faltaTrabajo),
        motivo,
    });
    switch (task.estado) {
        case 'planificada':
            return paso('plan', true, 'la tarea esta planificada: toca disenarla');
        case 'en-diseno':
            if (task.plan_aprobado)
                return paso('start', true, 'el plan esta aprobado: toca abrir la rama');
            if (!ctx.planRedactado) {
                // No `taskctl plan`: abriria otra ronda de diseno. Lo que falta es
                // trabajo de agente (roles, unificador) sobre la ronda ya abierta.
                return paso('plan', false, 'falta redactar planificacion/plan-final.md', null);
            }
            if (!ctx.modoCongelado) {
                // Tarea sin fila plan (anterior al registro): approve
                // --decidido-por automatico se rechaza, asi que la aprueba una persona.
                return paso('approve', true, 'el plan esta redactado y sin aprobar; la tarea no tiene modo congelado, asi que la aprueba una persona', `taskctl approve ${task.id}`, true);
            }
            return paso('approve', true, 'el plan esta redactado y sin aprobar');
        case 'en-curso':
            return paso('review', true, 'cuando la implementacion este commiteada y la suite en verde, toca la revision', `taskctl review ${task.id}`, false, true);
        case 'en-revision':
            switch (ctx.veredicto) {
                case 'cambios-solicitados':
                    if (ctx.rondaRevision >= TOPE_RONDAS) {
                        return paso('review', false, `la ronda ${String(ctx.rondaRevision)} tambien pidio cambios: tope de rondas alcanzado; corregir y abrir otra ronda lo decide una persona`, `taskctl review ${task.id}`, true, true);
                    }
                    return paso('review', false, 'la ultima ronda pidio cambios: corregir, commitear y pedir otra ronda', `taskctl review ${task.id}`, false, true);
                case 'aprobada':
                    if (task.revision_codex) {
                        switch (ctx.veredictoCodex) {
                            case null:
                                return paso('codex-review', false, 'falta la segunda opinion (revision_codex: true)');
                            case 'aprobada':
                                break;
                            case 'cambios-solicitados':
                                // Otra ronda de Codex solo tras corregir: lo decide una persona,
                                // o se pediria una segunda opinion sobre el mismo codigo.
                                return paso('codex-review', false, 'la segunda opinion pidio cambios: corregir y pedir otra ronda de codex-review', `taskctl codex-review ${task.id}`, true);
                            default:
                                // No hay comando que escriba el veredicto de Codex, y que lo
                                // escriba el mismo agente que encadena el flujo es el agujero
                                // del veredicto autoescrito: lo decide una persona.
                                return paso('veredicto-codex', false, ctx.veredictoCodex === 'desconocido'
                                    ? 'el veredicto de la segunda opinion no se reconoce: una persona lo lee y reescribe su linea "- Veredicto:"'
                                    : 'el informe de la segunda opinion no tiene veredicto: una persona lo lee y escribe su linea "- Veredicto:"', null, true);
                        }
                    }
                    if (!ctx.informeEnCommitPropio) {
                        return paso('finish', true, 'la revision esta aprobada, pero lo que se cerraria no coincide con lo revisado (codigo posterior al Commit revisado, informe sin rellenar o sin commitear, o peticion sin Commit revisado): el cierre lo decide una persona', `taskctl finish ${task.id}`, true);
                    }
                    return paso('finish', true, 'la revision esta aprobada');
                default:
                    return paso('veredicto', false, ctx.veredicto === 'desconocido'
                        ? 'el veredicto de la ultima ronda no se reconoce: reescribelo con taskctl veredicto'
                        : 'la ultima ronda no tiene veredicto: falta el revisor', `taskctl veredicto ${task.id} <aprobada|aprobada-con-correcciones|cambios-solicitados>`);
            }
        case 'terminada':
            return paso('terminada', false, 'la tarea ya esta terminada', null);
    }
}
