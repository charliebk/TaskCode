/**
 * Peticion/salida para el desempate barato de skill (seccion 16.4.1 de
 * docs/PROPUESTA_METODOLOGIA.md, TASK-017 item 5 del plan). Solo entra
 * en juego cuando seleccionarSkill() (catalogo-skills.ts) devuelve dos
 * o mas `candidatosEmpatados` — empate en solape de etiquetas Y en
 * prioridad declarada, que un calculo determinista ya no puede romper.
 *
 * Mismo reparto que TASK-013 fijo para "taskctl review" y TASK-016 para
 * el brainstorm de rol: plan.ts nunca invoca un modelo, deja escrita la
 * peticion y para. A diferencia del brainstorm, aqui NO hay numeracion
 * de rondas: el nombre es fijo, con un "-1" literal, porque el registro
 * que produce (`skills_recomendados` / `regla_seleccion_skill` en el
 * frontmatter) se trata como DERIVADO y se recalcula siempre desde el
 * catalogo actual en cada "taskctl plan", nunca como estado a preservar
 * entre reintentos — si el catalogo cambia entre dos invocaciones, una
 * peticion de una ronda anterior listando candidatos que ya no empatan
 * seria peor que no tener ninguna.
 */
import type { Task } from './task.js';
import type { EntradaCatalogoSkill } from './catalogo-skills.js';

export const PETICION_DESEMPATE_SKILL_FILENAME = 'peticion-desempate-skill-1.md';
export const SALIDA_DESEMPATE_SKILL_FILENAME = 'salida-desempate-skill-1.md';

/**
 * Marcador de relleno que deja salidaDesempateSkillTemplate() en el
 * scaffold. leerGanadorDesempate() lo salta ademas del encabezado
 * Markdown y de las lineas en blanco: "dejarlo intacto y responder
 * debajo" (lo que promete el docblock de leerGanadorDesempate) solo
 * funciona si el lector conoce este literal exacto (hallazgo IMPORTANTE
 * de revision por pares, TASK-017, ronda 2).
 */
const PLACEHOLDER_SALIDA_DESEMPATE = '(pendiente de completar)';

export function peticionDesempateSkillTemplate(
  task: Task,
  candidatos: readonly EntradaCatalogoSkill[],
  fecha: string
): string {
  const filas = candidatos
    .map(
      (c) =>
        `- \`${c.id}\` (prioridad ${c.prioridad}, rol ${c.rol}): ${c.descripcion}\n` +
        `  etiquetas: ${c.etiquetas.join(', ')}\n`
    )
    .join('');
  const etiquetasTarea = task.etiquetas.length === 0 ? '(sin etiquetas)' : task.etiquetas.join(', ');
  return (
    `# Peticion de desempate de skill — ${task.id}\n\n` +
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
    'cual aparece arriba) del candidato que mejor encaje con esta tarea concreta — taskctl lee ' +
    'la primera linea que no este vacia, no sea un encabezado Markdown ni el marcador ' +
    `"${PLACEHOLDER_SALIDA_DESEMPATE}" del scaffold. Puedes anadir tu razonamiento en lineas ` +
    'siguientes.\n\n' +
    '## Reglas\n\n' +
    '- Eliges uno de los candidatos de arriba, tal cual. Cualquier otro texto en esa primera ' +
    'linea se trata como respuesta invalida y taskctl la ignora.\n' +
    '- Evidencia, no suposicion: basate en el objetivo real de la tarea, no solo en las ' +
    'etiquetas que ya empataron.\n'
  );
}

/**
 * Scaffold vacio de la salida, igual de minimo que el de un rol de
 * brainstorm: solo el sitio donde escribir, sin invencion de contenido.
 */
export function salidaDesempateSkillTemplate(task: Task): string {
  return `# Salida del desempate de skill — ${task.id}\n\n${PLACEHOLDER_SALIDA_DESEMPATE}\n`;
}

/**
 * Ganador declarado en la salida ya escrita, o null si esta vacia o si
 * su primera linea de contenido no coincide EXACTAMENTE con el `id` de
 * uno de los candidatos vigentes (respuesta a medio escribir, catalogo
 * editado entre la peticion y la respuesta, etc.). Fail-closed: una
 * salida que no se puede interpretar sin ambiguedad no elige un
 * candidato al azar.
 *
 * Se saltan las lineas en blanco, las que empiezan por "#" y el
 * marcador de relleno del propio scaffold (PLACEHOLDER_SALIDA_DESEMPATE):
 * salidaDesempateSkillTemplate() genera un encabezado Markdown y ese
 * marcador como primeras lineas, y responder debajo de ellas
 * (dejandolas intactas, igual que se hace con los
 * `salida-brainstorm-*.md`) es la forma obvia de completar el scaffold.
 * Sin este triple salto, esa respuesta se descartaba en silencio porque
 * la "primera linea no vacia" seguia siendo el encabezado o el marcador
 * (hallazgo IMPORTANTE de revision por pares, TASK-017, rondas 1 y 2).
 */
export function leerGanadorDesempate(
  contenido: string,
  candidatos: readonly EntradaCatalogoSkill[]
): EntradaCatalogoSkill | null {
  const primeraLinea = contenido
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l !== '' && l !== PLACEHOLDER_SALIDA_DESEMPATE && !l.startsWith('#'));
  if (primeraLinea === undefined) return null;
  return candidatos.find((c) => c.id === primeraLinea) ?? null;
}
