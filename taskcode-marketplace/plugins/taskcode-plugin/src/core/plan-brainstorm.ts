/**
 * Las plantillas del brainstorm paralelo de la fase de diseno —
 * TASK-016, item D1. Funciones puras: reciben datos y devuelven texto,
 * sin tocar disco ni Git. Quien escribe los ficheros es commands/plan.ts.
 *
 * El reparto que implementan es el mismo que TASK-013 fijo para
 * `taskctl review` y no se reabre aqui: el CLI hace lo determinista
 * (cuantos roles, cuales, con que contexto, en que ficheros) y deja
 * las peticiones escritas; NO invoca ningun modelo. Quien orquesta la
 * sesion las dispara y vuelca las respuestas en los scaffolds.
 *
 * LO QUE ESTAS PLANTILLAS TIENEN QUE CONSEGUIR, y por que estan
 * escritas asi: si el recorte de contexto por rol es pobre, N roles no
 * producen N puntos de vista sino UNO CON N FIRMAS, y el unificador
 * lee esa coincidencia como confirmacion. El sintoma es invisible al
 * reves — el plan sale mas largo y mas seguro de si mismo. De ahi las
 * dos medidas que no son adorno: cada peticion lleva el bloque "Que NO
 * miras" de su rol (sin el, todo agente tiende a cubrirlo todo por si
 * acaso, que es la forma barata de deshacer el acotado sin que se
 * note), y la peticion del unificador le PROHIBE promediar y le exige
 * escribir en que discrepan los roles.
 */
import type { Task } from './task.js';
import type { ResolucionAgentes } from './heuristica.js';
import { UNIFICADOR_ID, type RolBrainstorm } from './roles-brainstorm.js';
import { fenceFor } from './markdown.js';

/**
 * "1 rol" / "2 roles" / "ningun rol". Es texto que acaba en un fichero
 * versionado y delante de un agente, asi que un "Se lanzan 1 roles"
 * desentona con el resto de la salida del CLI (hallazgo MENOR de la
 * revision por pares).
 */
function plural(n: number): string {
  if (n === 0) return 'ningun rol';
  return n === 1 ? '1 rol' : `${n} roles`;
}

/** `peticion-<rol>-<ronda>.md` — el rol ya viene prefijado por "brainstorm-". */
export function nombrePeticionRol(rol: RolBrainstorm, ronda: number): string {
  return `peticion-${rol.id}-${ronda}.md`;
}

/** `salida-<rol>-<ronda>.md` — donde el agente de ese rol vuelca su respuesta. */
export function nombreSalidaRol(rol: RolBrainstorm, ronda: number): string {
  return `salida-${rol.id}-${ronda}.md`;
}

export function nombrePeticionUnificador(ronda: number): string {
  return `peticion-unificador-${ronda}.md`;
}

/**
 * `peticion-plan-<ronda>.md` — TASK-042 (decision C4). Con UN solo rol no
 * hay unificador: esta peticion va al propio rol, que redacta
 * `plan-final.md`. Hace tambien de testigo de ronda (ver plan.ts).
 */
export function nombrePeticionRedaccion(ronda: number): string {
  return `peticion-plan-${ronda}.md`;
}

/** Cabecera comun a las plantillas: quien es la tarea y en que ronda va. */
function cabecera(task: Task, ronda: number, fecha: string): string {
  return (
    `- Tarea: ${task.id} — ${task.titulo}\n` +
    `- Tipo: ${task.tipo} · Complejidad declarada: ${task.complejidad ?? 'no declarada (decide la heuristica)'}\n` +
    `- Ronda: ${ronda}\n` +
    `- Fecha: ${fecha}\n`
  );
}

/**
 * El enunciado de la tarea, embebido con valla dinamica: el objetivo y
 * los criterios son texto de la persona y pueden contener backticks.
 */
function enunciado(objetivo: string, criterios: readonly string[]): string {
  const criteriosBlock =
    criterios.length === 0 ? '(la tarea no declara criterios de aceptacion)' : criterios.join('\n');
  const fence = fenceFor(objetivo, criteriosBlock);
  return (
    '## Enunciado de la tarea\n\n' +
    '### Objetivo\n\n' +
    `${fence}\n${objetivo}\n${fence}\n\n` +
    '### Criterios de aceptacion\n\n' +
    `${fence}\n${criteriosBlock}\n${fence}\n`
  );
}

/**
 * Como se describe la discrepancia entre el nivel declarado y el
 * heuristico. Se escribe SIEMPRE (tambien cuando coinciden): un bloque
 * que solo aparece en el caso raro entrena a quien lo lee a no
 * buscarlo, y ademas hace que su ausencia sea ambigua — no se sabria
 * si es que no hay discrepancia o si es que el calculo no llego a
 * correr.
 */
function bloqueComplejidad(resolucion: ResolucionAgentes): string {
  const senales =
    resolucion.senales.length === 0
      ? '  (ninguna senal encontrada — el texto de la tarea no aporta ninguna)\n'
      : resolucion.senales.map((s) => `  - ${s.clave}: ${s.detalle} (+${s.puntos})\n`).join('');
  const veredicto = resolucion.hayDiscrepancia
    ? `Los dos niveles NO coinciden. Se lanzan ${plural(resolucion.agentes)}, que es el mayor de ` +
      'los dos numeros: infraestimar sale caro y sobreestimar es barato. La discrepancia se te ' +
      'senala aqui a proposito — puede significar que el enunciado de la tarea no refleja lo que ' +
      'de verdad cuesta.'
    : `Los dos niveles coinciden. Se lanzan ${plural(resolucion.agentes)}.`;
  return (
    '## Complejidad: declarada frente a heuristica\n\n' +
    `- Declarada en la tarea: **${resolucion.nivelDeclarado ?? 'no declarada (decide la heuristica)'}**\n` +
    `- Heuristica (${resolucion.puntos} puntos): **${resolucion.nivelHeuristico}**\n` +
    '- Senales encontradas:\n' +
    senales +
    (resolucion.topeHotfixAplicado
      ? '- Se aplico el tope de `hotfix`: un hotfix abrevia el brainstorm previo (nunca la ' +
        'revision posterior).\n'
      : '') +
    `\n${veredicto}\n`
  );
}

export function peticionRolTemplate(
  task: Task,
  objetivo: string,
  criterios: readonly string[],
  rol: RolBrainstorm,
  otrosRoles: readonly RolBrainstorm[],
  ronda: number,
  fecha: string
): string {
  const companeros =
    otrosRoles.length === 0
      ? 'Eres el unico rol que se lanza en esta tarea.\n'
      : `Trabajan en paralelo contigo, sin verte: ${otrosRoles
          .map((r) => `**${r.titulo}**`)
          .join(', ')}. No cubras lo suyo — si lo haces, el unificador recibira el mismo punto ` +
        'de vista repetido y lo leera como confirmacion.\n';
  return (
    `# Peticion de brainstorm — ${task.id}, rol ${rol.titulo} (ronda ${ronda})\n\n` +
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
    `- ${companeros}`
  );
}

/**
 * La peticion de redaccion (TASK-042, decision C4): el modo de UN solo
 * rol, sin unificador. Reutiliza las piezas de las otras plantillas
 * (cabecera, bloque de complejidad, enunciado, "Que tiene que traer el
 * plan final") y del rol toma su pregunta y sus limites. Quien la recibe
 * es el autor del plan: no hay salida de rol intermedia ni nadie que
 * consolide, asi que escribe el plan final directamente.
 *
 * En la ronda 2 o siguientes lleva el bloque de re-planificacion: relanzar
 * al autor del plan ES la correccion incremental.
 */
export function peticionRedaccionTemplate(
  task: Task,
  objetivo: string,
  criterios: readonly string[],
  rol: RolBrainstorm,
  ronda: number,
  fecha: string,
  resolucion: ResolucionAgentes,
  planFinalRelativo: string
): string {
  const bloqueReplanificacion =
    ronda === 1
      ? ''
      : '## Esto es una re-planificacion, no un primer pase\n\n' +
        `Ya existe un plan redactado en \`${planFinalRelativo}\` y una persona ha pedido ` +
        'cambios sobre el. **Leelo antes que nada.** Tu trabajo es incorporar el feedback de la ' +
        'persona al plan que ya hay, no reescribirlo entero — y menos volver a redactar desde el ' +
        'enunciado como si fuera la primera vez.\n\n' +
        'Si el feedback dice que el enfoque entero esta mal, eso NO se arregla aqui: dilo en el ' +
        'plan y que alguien decida si se replantea.\n\n';
  return (
    `# Peticion de redaccion del plan — ${task.id} (ronda ${ronda})\n\n` +
    cabecera(task, ronda, fecha) +
    `- Rol: \`${rol.id}\` — lanzalo con el agente de ese mismo nombre\n` +
    `- Vuelca el plan en: \`${planFinalRelativo}\`\n\n` +
    '**Esta tarea se planifica con un solo rol y no hay unificador**: tu escribes ' +
    '`plan-final.md` directamente, sin salida intermedia que nadie vaya a consolidar.\n\n' +
    bloqueReplanificacion +
    '## Tu pregunta\n\n' +
    `> ${rol.pregunta}\n\n` +
    '## Que miras\n\n' +
    rol.mira.map((m) => `- ${m}\n`).join('') +
    '\n## Que NO miras\n\n' +
    'Que lo mires solo tu no te autoriza a cubrirlo todo: lo que queda fuera de tu pregunta ' +
    'no se mira, pero se DICE. Anota en el plan lo que no cubres, para que quien lo apruebe ' +
    'sepa que ese lado no se ha revisado:\n\n' +
    rol.noMira.map((m) => `- ${m}\n`).join('') +
    '\n' +
    bloqueComplejidad(resolucion) +
    '\n## Que tiene que traer el plan final\n\n' +
    '- Enfoque propuesto, concreto: que se crea, que se extiende, en que orden.\n' +
    '- Lo que el rol no cubrio, contrastado contra los criterios de aceptacion.\n' +
    '- Riesgos aceptados y que los contiene.\n' +
    '- Plan de pruebas.\n' +
    '- Lo que necesita decision de una persona antes de implementar. **El checkpoint humano es ' +
    'obligatorio**: este plan no vale hasta que alguien lo apruebe con `taskctl approve`.\n\n' +
    '## Reglas\n\n' +
    '- **Propones enfoque; no implementas.** No escribas codigo de produccion ni modifiques ' +
    'ficheros del repo: tu salida es el plan.\n' +
    '- Evidencia, no suposicion: si afirmas que algo se comporta de cierta manera, es porque lo ' +
    'has mirado. Di de donde lo sacas.\n\n' +
    enunciado(objetivo, criterios)
  );
}

export function salidaRolTemplate(task: Task, rol: RolBrainstorm, ronda: number): string {
  return (
    `# Brainstorm — ${task.id}, rol ${rol.titulo} (ronda ${ronda})\n\n` +
    `- Rol: \`${rol.id}\`\n` +
    '- Agente: (rellenar)\n\n' +
    rol.entregables.map((e) => `## ${e}\n\n\n`).join('')
  );
}

export function peticionUnificadorTemplate(
  task: Task,
  objetivo: string,
  criterios: readonly string[],
  roles: readonly RolBrainstorm[],
  /**
   * Las salidas a consolidar, YA RESUELTAS a nombres reales de fichero
   * por quien mira el disco. No se componen aqui a partir de `roles`:
   * si alguien baja la complejidad entre dos vueltas, `roles` se queda
   * corto o vacio y la lista negaria un brainstorm que si existe
   * (IMPORTANTE de la ronda 3 de la revision por pares).
   */
  salidas: readonly { nombre: string; titulo: string }[],
  ronda: number,
  /**
   * Ronda a la que pertenecen las SALIDAS que hay que consolidar. En la
   * ronda 1 coincide con `ronda`; en una re-planificacion no, porque
   * los roles no se relanzan y sus salidas siguen llevando el numero de
   * la ronda en que corrieron. Componer la lista con `ronda` a secas
   * apuntaba a ficheros inexistentes — CRITICO de la revision por
   * pares.
   *
   * `null` = no hay NINGUNA ronda con peticiones de rol en disco, o sea
   * que esta tarea no ha lanzado brainstorm nunca. No significa "no hay
   * salidas": para eso esta `salidas`, que puede venir vacia con
   * `rondaSalidas` puesta si los agentes aun no han respondido.
   *
   * (El comentario anterior decia lo segundo y era falso desde el
   * redisenio de la ronda 4. Lo destapo la ronda 5, y es el recordatorio
   * de que en este fichero los comentarios documentan hallazgos
   * pagados: uno desactualizado no es ruido, es una afirmacion con
   * autoridad que ya no se cumple.)
   */
  rondaSalidas: number | null,
  fecha: string,
  resolucion: ResolucionAgentes,
  planFinalRelativo: string
): string {
  const listaSalidas =
    salidas.length > 0
      ? salidas.map((s) => `- \`${s.nombre}\` — ${s.titulo}\n`).join('')
      : roles.length === 0
        ? '(ninguna: esta tarea no lanza brainstorm, ver el bloque de complejidad)\n'
        : '**(ninguna: no queda en disco ningun juego completo de salidas de rondas ' +
          'anteriores.** Puede que se borraran, o que los agentes de la ronda anterior no ' +
          'llegaran a responder. Redacta con lo que tengas y dilo en el plan; no supongas que ' +
          'hubo un brainstorm que no puedes leer.)\n';

  // Las tres formas de este paso son distintas de verdad, no un mismo
  // texto con el numero cambiado. Con UN solo rol no puede haber
  // desacuerdo, asi que pedir que se senalen — y ademas tratar la
  // unanimidad como alarma — obligaria al agente a inventarse uno o a
  // disparar una alarma falsa en casi la mitad de las tareas. Una
  // alarma que salta siempre deja de significar nada, que es justo lo
  // que arruinaria el criterio de "senalar los desacuerdos".
  // La forma del texto la decide cuantas salidas hay QUE CONSOLIDAR de
  // verdad, no cuantos roles resuelve la complejidad de hoy: pueden no
  // coincidir si alguien la cambio entre dos vueltas, y quien lee esta
  // peticion tiene delante las salidas, no la tabla.
  const nSalidas = salidas.length;
  let comoConsolidas: string;
  if (nSalidas === 0) {
    comoConsolidas =
      'No hay salidas de brainstorm que consolidar: redacta el plan directamente a partir del ' +
      'enunciado. Deja dicho en el plan que se redacto sin brainstorm y por que (el numero de ' +
      'roles sale del lookup de complejidad, no de un descuido).\n';
  } else if (nSalidas === 1) {
    comoConsolidas =
      '**Esta tarea se planifico con un solo rol**, asi que aqui no hay desacuerdos que resolver: ' +
      'no te los inventes ni trates la ausencia de discrepancia como una senal de nada.\n\n' +
      '1. Lee la salida de arriba. Si falta o esta sin rellenar, dilo en el plan en vez de ' +
      'suplirla en silencio.\n' +
      '2. **Contrasta esa propuesta contra el enunciado de la tarea**, que tienes al final. Lo ' +
      'util que puedes aportar aqui no es mediar entre puntos de vista, es senalar QUE QUEDO SIN ' +
      'CUBRIR: criterios de aceptacion que el rol no toca, riesgos que no mira porque no era su ' +
      'papel, decisiones que da por hechas.\n' +
      '3. Cada afirmacion del plan que venga del rol se atribuye a el; lo que anadas tu, tambien.\n';
  } else {
    comoConsolidas =
      '1. Lee las salidas de arriba. **Si alguna falta o esta sin rellenar, sigue adelante con ' +
      'las que haya y escribe en el plan cual falto**: un plan con un punto de vista menos, ' +
      'dicho, vale mas que un plan que finge estar completo.\n' +
      '2. **No promedies.** Donde dos roles discrepen, el plan dice quien propone que, cual ' +
      'gana y por que. Un desacuerdo resuelto con una frase intermedia que no defiende nadie ' +
      'es la peor salida posible de este paso.\n' +
      '3. **Si no discrepan en nada, eso es la alarma, no la nota de calidad**: significa que ' +
      'los roles recibieron el mismo contexto o que alguno no hizo su trabajo. Dilo en el plan.\n' +
      '4. Cada afirmacion del plan que venga de un rol se atribuye a ese rol.\n';
  }

  // Re-planificacion: el unificador tiene que saber que NO parte de
  // cero. Sin esto la peticion de la ronda 2 era byte a byte la de la
  // ronda 1 salvo el numero, no mencionaba el plan ya redactado ni el
  // feedback que motivo la vuelta, y un agente obediente rehacia el
  // mismo plan — o sea que el ahorro de no relanzar los roles no
  // compraba nada (IMPORTANTE de la revision por pares; la 16.3 pide
  // justo lo contrario, "incorporar el feedback puntual de la persona").
  const bloqueReplanificacion =
    ronda === 1
      ? ''
      : '## Esto es una re-planificacion, no un primer pase\n\n' +
        `Ya existe un plan redactado en \`${planFinalRelativo}\` y una persona ha pedido ` +
        'cambios sobre el. **Leelo antes que nada.**\n\n' +
        (rondaSalidas === null
          ? 'No queda ningun juego completo de salidas de brainstorm en disco (ver arriba), y '
          : `Las salidas de brainstorm son las de la ronda ${rondaSalidas} y `) +
        'NO se han vuelto a ' +
        'lanzar, a proposito: una vuelta de "pide cambios" es una correccion incremental, no un ' +
        'reinicio. Tu trabajo es incorporar el feedback de la persona al plan que ya hay, no ' +
        'reescribirlo entero — y menos volver a redactar desde el enunciado como si fuera la ' +
        'primera vez.\n\n' +
        'Si el feedback dice que el enfoque entero esta mal, eso NO se arregla aqui: dilo en el ' +
        'plan y que alguien decida relanzar el brainstorm.\n\n';

  const desacuerdosEnPlanFinal =
    nSalidas > 1
      ? '- Los desacuerdos entre roles y como se resuelve cada uno.\n'
      : nSalidas === 1
        ? '- Lo que el rol no cubrio, contrastado contra los criterios de aceptacion.\n'
        : '';

  return (
    `# Peticion al unificador — ${task.id} (ronda ${ronda})\n\n` +
    cabecera(task, ronda, fecha) +
    `- Rol: \`${UNIFICADOR_ID}\` — lanzalo con el agente de ese mismo nombre\n` +
    `- Vuelca el resultado en: \`${planFinalRelativo}\`\n\n` +
    bloqueReplanificacion +
    `## Salidas que tienes que consolidar${
      rondaSalidas === null || ronda === rondaSalidas ? '' : ` (de la ronda ${rondaSalidas})`
    }\n\n` +
    listaSalidas +
    '\n' +
    bloqueComplejidad(resolucion) +
    '\n## Como consolidas\n\n' +
    comoConsolidas +
    '\n## Que tiene que traer el plan final\n\n' +
    '- Enfoque propuesto, concreto: que se crea, que se extiende, en que orden.\n' +
    desacuerdosEnPlanFinal +
    '- Riesgos aceptados y que los contiene.\n' +
    '- Plan de pruebas.\n' +
    '- Lo que necesita decision de una persona antes de implementar. **El checkpoint humano es ' +
    'obligatorio**: este plan no vale hasta que alguien lo apruebe con `taskctl approve`.\n\n' +
    enunciado(objetivo, criterios)
  );
}
