/**
 * Fases que abren una fase NUEVA del ciclo: en semiautomatico se pregunta
 * antes de entrar. Las demas (veredicto, codex-review, otra ronda de
 * review) son pasos internos de la revision y siguen solas.
 */
function accionPara(fase, modo, task, abreFase) {
    if (fase === 'terminada' || modo === 'manual')
        return 'detener';
    // Decision de Carlos (2026-10-04): hotfix y release mergean a main con
    // tag; en ningun modo se cierran sin preguntar.
    if (fase === 'finish' && (task.tipo === 'hotfix' || task.tipo === 'release'))
        return 'preguntar';
    if (modo === 'automatico')
        return 'continuar';
    return abreFase ? 'preguntar' : 'continuar';
}
export function siguienteFase(task, ctx, modo) {
    const paso = (fase, abreFase, motivo, comando = `taskctl ${fase} ${task.id}`) => ({
        fase,
        comando,
        accion: accionPara(fase, modo, task, abreFase),
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
            return paso('approve', true, 'el plan esta redactado y sin aprobar');
        case 'en-curso':
            return paso('review', true, 'cuando la implementacion este commiteada y la suite en verde, toca la revision');
        case 'en-revision':
            switch (ctx.veredicto) {
                case 'cambios-solicitados':
                    return paso('review', false, 'la ultima ronda pidio cambios: corregir y pedir otra ronda');
                case 'aprobada':
                    if (task.revision_codex && !ctx.codexAprobada) {
                        return paso('codex-review', false, 'falta la segunda opinion (revision_codex: true)');
                    }
                    return paso('finish', true, 'la revision esta aprobada');
                default:
                    return paso('veredicto', false, 'la ultima ronda no tiene veredicto: falta el revisor', `taskctl veredicto ${task.id} <aprobada|aprobada-con-correcciones|cambios-solicitados>`);
            }
        case 'terminada':
            return paso('terminada', false, 'la tarea ya esta terminada', null);
    }
}
