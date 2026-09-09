export const PETICION_DESEMPATE_SKILL_FILENAME = 'peticion-desempate-skill-1.md';
export const SALIDA_DESEMPATE_SKILL_FILENAME = 'salida-desempate-skill-1.md';
export function peticionDesempateSkillTemplate(task, candidatos, fecha) {
    const filas = candidatos
        .map((c) => `- \`${c.id}\` (prioridad ${c.prioridad}, rol ${c.rol}): ${c.descripcion}\n` +
        `  etiquetas: ${c.etiquetas.join(', ')}\n`)
        .join('');
    const etiquetasTarea = task.etiquetas.length === 0 ? '(sin etiquetas)' : task.etiquetas.join(', ');
    return (`# Peticion de desempate de skill — ${task.id}\n\n` +
        `- Tarea: ${task.id} — ${task.titulo}\n` +
        `- Fecha: ${fecha}\n` +
        `- Vuelca tu respuesta en: \`${SALIDA_DESEMPATE_SKILL_FILENAME}\`\n\n` +
        '## Por que te llamamos\n\n' +
        `Estos ${candidatos.length} skills del catalogo empatan en solape de etiquetas contra esta ` +
        'tarea y tambien en prioridad declarada. El desempate que sigue no lo resuelve un calculo ' +
        'determinista.\n\n' +
        '## Candidatos empatados\n\n' +
        filas +
        '\n## Etiquetas de la tarea\n\n' +
        `${etiquetasTarea}\n\n` +
        '## Como entregas\n\n' +
        `Escribe en \`${SALIDA_DESEMPATE_SKILL_FILENAME}\` una unica linea con el \`id\` EXACTO (tal ` +
        'cual aparece arriba) del candidato que mejor encaje con esta tarea concreta — taskctl solo ' +
        'lee la primera linea no vacia. Puedes anadir tu razonamiento en lineas siguientes.\n\n' +
        '## Reglas\n\n' +
        '- Eliges uno de los candidatos de arriba, tal cual. Cualquier otro texto en esa primera ' +
        'linea se trata como respuesta invalida y taskctl la ignora.\n' +
        '- Evidencia, no suposicion: basate en el objetivo real de la tarea, no solo en las ' +
        'etiquetas que ya empataron.\n');
}
/**
 * Scaffold vacio de la salida, igual de minimo que el de un rol de
 * brainstorm: solo el sitio donde escribir, sin invencion de contenido.
 */
export function salidaDesempateSkillTemplate(task) {
    return `# Salida del desempate de skill — ${task.id}\n\n(pendiente de completar)\n`;
}
/**
 * Ganador declarado en la salida ya escrita, o null si esta vacia o si
 * su primera linea no coincide EXACTAMENTE con el `id` de uno de los
 * candidatos vigentes (respuesta a medio escribir, catalogo editado
 * entre la peticion y la respuesta, etc.). Fail-closed: una salida que
 * no se puede interpretar sin ambiguedad no elige un candidato al azar.
 */
export function leerGanadorDesempate(contenido, candidatos) {
    const primeraLinea = contenido.split(/\r?\n/).find((l) => l.trim() !== '')?.trim() ?? '';
    if (primeraLinea === '')
        return null;
    return candidatos.find((c) => c.id === primeraLinea) ?? null;
}
