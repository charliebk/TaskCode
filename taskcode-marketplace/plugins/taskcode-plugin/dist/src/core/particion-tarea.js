import { frentesDe, gruposComunes, MAX_CRITERIOS } from './validacion-tarea.js';
function citar(texto) {
    return texto
        .split(/\r?\n/)
        .map((l) => (l.trim() === '' ? '>' : `> ${l.trimEnd()}`))
        .join('\n');
}
export function proponerParticion(task, s) {
    const frentes = frentesDe(s.grupos);
    if (frentes.length < 2)
        return null;
    const comunes = gruposComunes(s.grupos).flatMap((g) => g.criterios);
    const titulos = [];
    const hijasGrandes = [];
    const bloques = [];
    const vistos = new Set();
    for (const frente of frentes) {
        let titulo = `${task.id} ${frente.titulo ?? ''}`.trim();
        // Dos grupos con el mismo titulo darian dos hijas que import rechaza
        // por duplicadas: la segunda se numera.
        for (let n = 2; vistos.has(titulo.toLowerCase()); n++)
            titulo = `${task.id} ${frente.titulo ?? ''} (${String(n)})`;
        vistos.add(titulo.toLowerCase());
        titulos.push(titulo);
        const criterios = [...frente.criterios, ...comunes];
        if (criterios.length > MAX_CRITERIOS)
            hijasGrandes.push(titulo);
        const objetivo = `Parte de ${task.id} (${task.titulo}): el frente «${frente.titulo ?? ''}».` +
            (s.objetivo.trim() === '' ? '' : `\n\nObjetivo de la tarea original:\n\n${s.objetivo.trim()}`);
        bloques.push(`### ${titulo}\n${citar(objetivo)}\n${criterios.map((c) => `- ${c}`).join('\n')}\n`);
    }
    const preambulo = `Particion propuesta de ${task.id} (${task.titulo}) por "taskctl plan": una tarea por frente.\n` +
        'Revisala antes de importarla. Los criterios comunes se han copiado en cada tarea.\n' +
        (s.criteriosTrasCierre.length === 0
            ? ''
            : 'Criterios de "Tras el cierre" que hay que reponer a mano en la tarea que corresponda: ' +
                `${s.criteriosTrasCierre.map((c) => `«${c}»`).join('; ')}.\n`);
    return { titulos, hijasGrandes, markdown: `${preambulo}\n${bloques.join('\n')}` };
}
