import { fenceFor } from './markdown.js';
/** `peticion-<rol>-<ronda>.md` — el rol ya viene prefijado por "brainstorm-". */
export function nombrePeticionRol(rol, ronda) {
    return `peticion-${rol.id}-${ronda}.md`;
}
/** `salida-<rol>-<ronda>.md` — donde el agente de ese rol vuelca su respuesta. */
export function nombreSalidaRol(rol, ronda) {
    return `salida-${rol.id}-${ronda}.md`;
}
export function nombrePeticionUnificador(ronda) {
    return `peticion-unificador-${ronda}.md`;
}
/** Cabecera comun a las tres plantillas: quien es la tarea y en que ronda va. */
function cabecera(task, ronda, fecha) {
    return (`- Tarea: ${task.id} — ${task.titulo}\n` +
        `- Tipo: ${task.tipo} · Complejidad declarada: ${task.complejidad}\n` +
        `- Ronda: ${ronda}\n` +
        `- Fecha: ${fecha}\n`);
}
/**
 * El enunciado de la tarea, embebido con valla dinamica: el objetivo y
 * los criterios son texto de la persona y pueden contener backticks.
 */
function enunciado(objetivo, criterios) {
    const criteriosBlock = criterios.length === 0 ? '(la tarea no declara criterios de aceptacion)' : criterios.join('\n');
    const fence = fenceFor(objetivo, criteriosBlock);
    return ('## Enunciado de la tarea\n\n' +
        '### Objetivo\n\n' +
        `${fence}\n${objetivo}\n${fence}\n\n` +
        '### Criterios de aceptacion\n\n' +
        `${fence}\n${criteriosBlock}\n${fence}\n`);
}
/**
 * Como se describe la discrepancia entre el nivel declarado y el
 * heuristico. Se escribe SIEMPRE (tambien cuando coinciden): un bloque
 * que solo aparece en el caso raro entrena a quien lo lee a no
 * buscarlo, y ademas hace que su ausencia sea ambigua — no se sabria
 * si es que no hay discrepancia o si es que el calculo no llego a
 * correr.
 */
function bloqueComplejidad(resolucion) {
    const senales = resolucion.senales.length === 0
        ? '  (ninguna senal encontrada — el texto de la tarea no aporta ninguna)\n'
        : resolucion.senales.map((s) => `  - ${s.clave}: ${s.detalle} (+${s.puntos})\n`).join('');
    const veredicto = resolucion.hayDiscrepancia
        ? `Los dos niveles NO coinciden. Se lanzan ${resolucion.agentes} roles, que es el mayor de ` +
            'los dos numeros: infraestimar sale caro y sobreestimar es barato. La discrepancia se te ' +
            'senala aqui a proposito — puede significar que el enunciado de la tarea no refleja lo que ' +
            'de verdad cuesta.'
        : `Los dos niveles coinciden. Se lanzan ${resolucion.agentes} roles.`;
    return ('## Complejidad: declarada frente a heuristica\n\n' +
        `- Declarada en la tarea: **${resolucion.nivelDeclarado}**\n` +
        `- Heuristica (${resolucion.puntos} puntos): **${resolucion.nivelHeuristico}**\n` +
        '- Senales encontradas:\n' +
        senales +
        (resolucion.topeHotfixAplicado
            ? '- Se aplico el tope de `hotfix`: un hotfix abrevia el brainstorm previo (nunca la ' +
                'revision posterior).\n'
            : '') +
        `\n${veredicto}\n`);
}
export function peticionRolTemplate(task, objetivo, criterios, rol, otrosRoles, ronda, fecha) {
    const companeros = otrosRoles.length === 0
        ? 'Eres el unico rol que se lanza en esta tarea.\n'
        : `Trabajan en paralelo contigo, sin verte: ${otrosRoles
            .map((r) => `**${r.titulo}**`)
            .join(', ')}. No cubras lo suyo — si lo haces, el unificador recibira el mismo punto ` +
            'de vista repetido y lo leera como confirmacion.\n';
    return (`# Peticion de brainstorm — ${task.id}, rol ${rol.titulo} (ronda ${ronda})\n\n` +
        cabecera(task, ronda, fecha) +
        `- Rol: \`${rol.id}\` — lanzalo con el agente de ese mismo nombre\n` +
        `- Vuelca tu respuesta en: \`${nombreSalidaRol(rol, ronda)}\`\n\n` +
        '## Tu pregunta\n\n' +
        `> ${rol.pregunta}\n\n` +
        '## Que miras\n\n' +
        rol.mira.map((m) => `- ${m}\n`).join('') +
        '\n## Que NO miras\n\n' +
        'No es una lista de cortesia. Si la ignoras y lo cubres todo "por si acaso", el acotado de ' +
        'contexto se deshace sin que se note y esta tarea deja de tener varios puntos de vista:\n\n' +
        rol.noMira.map((m) => `- ${m}\n`).join('') +
        '\n' +
        enunciado(objetivo, criterios) +
        '\n## Como entregas\n\n' +
        `Escribe en \`${nombreSalidaRol(rol, ronda)}\`, con estas secciones y en este orden:\n\n` +
        rol.entregables.map((e) => `- ${e}\n`).join('') +
        '\n## Reglas\n\n' +
        '- **Propones enfoque; no implementas.** No escribas codigo de produccion ni modifiques ' +
        'ficheros del repo: tu salida es un documento.\n' +
        '- Evidencia, no suposicion: si afirmas que algo se comporta de cierta manera, es porque lo ' +
        'has mirado. Di de donde lo sacas.\n' +
        '- Prefiere lo concreto: rutas, nombres y casos reales por encima de recomendaciones ' +
        'genericas.\n' +
        `- ${companeros}`);
}
export function salidaRolTemplate(task, rol, ronda) {
    return (`# Brainstorm — ${task.id}, rol ${rol.titulo} (ronda ${ronda})\n\n` +
        `- Rol: \`${rol.id}\`\n` +
        '- Agente: (rellenar)\n\n' +
        rol.entregables.map((e) => `## ${e}\n\n\n`).join(''));
}
export function peticionUnificadorTemplate(task, objetivo, criterios, roles, ronda, fecha, resolucion, planFinalRelativo) {
    const listaSalidas = roles.length === 0
        ? '(ninguna: esta tarea no lanza brainstorm, ver el bloque de complejidad)\n'
        : roles.map((r) => `- \`${nombreSalidaRol(r, ronda)}\` — rol ${r.titulo}\n`).join('');
    const instruccionesConRoles = roles.length === 0
        ? 'No hay salidas de brainstorm que consolidar: redacta el plan directamente a partir del ' +
            'enunciado. Deja dicho en el plan que se redacto sin brainstorm y por que (el numero de ' +
            'roles sale del lookup de complejidad, no de un descuido).\n'
        : '1. Lee las salidas de arriba. **Si alguna falta o esta sin rellenar, sigue adelante con ' +
            'las que haya y escribe en el plan cual falto**: un plan con un punto de vista menos, ' +
            'dicho, vale mas que un plan que finge estar completo.\n' +
            '2. **No promedies.** Donde dos roles discrepen, el plan dice quien propone que, cual ' +
            'gana y por que. Un desacuerdo resuelto con una frase intermedia que no defiende nadie ' +
            'es la peor salida posible de este paso.\n' +
            '3. **Si no discrepan en nada, eso es la alarma, no la nota de calidad**: significa que ' +
            'los roles recibieron el mismo contexto o que alguno no hizo su trabajo. Dilo en el plan.\n' +
            '4. Cada afirmacion del plan que venga de un rol se atribuye a ese rol.\n';
    return (`# Peticion al unificador — ${task.id} (ronda ${ronda})\n\n` +
        cabecera(task, ronda, fecha) +
        `- Rol: \`brainstorm-unificador\`\n` +
        `- Vuelca el resultado en: \`${planFinalRelativo}\`\n\n` +
        '## Salidas que tienes que consolidar\n\n' +
        listaSalidas +
        '\n' +
        bloqueComplejidad(resolucion) +
        '\n## Como consolidas\n\n' +
        instruccionesConRoles +
        '\n## Que tiene que traer el plan final\n\n' +
        '- Enfoque propuesto, concreto: que se crea, que se extiende, en que orden.\n' +
        '- Los desacuerdos entre roles y como se resuelve cada uno.\n' +
        '- Riesgos aceptados y que los contiene.\n' +
        '- Plan de pruebas.\n' +
        '- Lo que necesita decision de una persona antes de implementar. **El checkpoint humano es ' +
        'obligatorio**: este plan no vale hasta que alguien lo apruebe con `taskctl approve`.\n\n' +
        enunciado(objetivo, criterios));
}
