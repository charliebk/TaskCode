/**
 * Los roles del brainstorm paralelo de la fase de diseno (seccion 6 de
 * la metodologia) — TASK-016, item D1.
 *
 * `scripts/heuristica-complejidad.yml` fija CUANTOS agentes entran; no
 * fija CUALES, y lo dice el mismo: "esa eleccion queda abierta a
 * proposito: depende de la tarea, y este fichero no la tiene delante".
 * Este modulo es quien la cierra, y la cierra de forma DETERMINISTA:
 * un orden de prioridad fijo y los N primeros. El CLI no puede juzgar
 * que roles pide una tarea concreta sin llamar a un modelo, y llamarlo
 * aqui seria pagar un LLM para elegir entre cuatro opciones fijas —
 * exactamente lo que la seccion 16 viene a evitar.
 *
 * EL ORDEN NO ES ARBITRARIO y es la unica decision de diseño de este
 * fichero, asi que conviene que quede escrita: es el orden en que los
 * enumera el criterio de aceptacion 1 de la tarea (arquitectura,
 * riesgos, testing, dominio), y sobrevive a la prueba de los extremos.
 * Con N=1 entra arquitectura, que es el unico rol que propone una
 * FORMA para el cambio; los otros tres reaccionan a una forma que
 * alguien tuvo que proponer antes. Con N=3 el que se cae es dominio,
 * que es el rol cuyo contexto (las reglas de negocio) es el que menos
 * se puede deducir del repositorio y mas depende de que haya una
 * persona con ese conocimiento delante.
 *
 * ACOPLAMIENTO CON agents/. Cada `id` de aqui tiene que ser
 * literalmente el `name:` del frontmatter de su `agents/<id>.md`: el
 * CLI escribe peticiones dirigidas a ese nombre, y si divergen se
 * estarian invocando agentes que no existen. Eso NO se comprueba en
 * caliente (leer cuatro ficheros en cada `plan` para verificar una
 * constante es gasto sin retorno): lo comprueba la suite, en las dos
 * direcciones, contra el contenido real de agents/.
 *
 * ROLES CONDICIONALES (TASK-080). Ademas de la escalera de prioridad hay
 * roles que no compiten por el presupuesto N: entran por las ETIQUETAS
 * de la tarea y se suman a los N de la escalera. El primero es
 * rendimiento (wasm, workers, 3d, carga pesada). Con eso los roles de una
 * tarea dejan de ser siempre un prefijo de ROLES_BRAINSTORM: quien
 * necesite saber que roles lleva una tarea usa seleccionarRolesDeTarea,
 * y quien busque un rol por nombre (salidas en disco) usa
 * TODOS_LOS_ROLES. Un condicional solo se suma cuando la escalera ya
 * lanza MIN_ROLES_PARA_CONDICIONALES o mas: con 0 o 1 rol no hay
 * unificador, y el condicional quedaria como autor unico de un plan
 * cuya forma no le toca proponer (decision de la persona en TASK-080).
 */

/** Los roles de la escalera, en orden de prioridad, y los condicionales. */
export type RolBrainstormId =
  | 'brainstorm-arquitectura'
  | 'brainstorm-riesgos'
  | 'brainstorm-testing'
  | 'brainstorm-dominio'
  | 'brainstorm-rendimiento';

export interface RolBrainstorm {
  /** Igual al `name:` del frontmatter de agents/<id>.md. */
  id: RolBrainstormId;
  /** Nombre corto para cabeceras y para el nombre de fichero. */
  titulo: string;
  /** La unica pregunta del rol. Va literal en su peticion. */
  pregunta: string;
  /**
   * El recorte de contexto de la seccion 16.2: que mira ESTE rol. Cada
   * rol tiene el suyo y ninguno se solapa con otro — si los cuatro
   * recibieran lo mismo no habria cuatro puntos de vista, habria uno
   * con cuatro firmas, y el unificador leeria esa coincidencia como
   * confirmacion.
   */
  mira: readonly string[];
  /**
   * Lo que este rol NO mira, dicho explicitamente. No es decoracion:
   * sin esta lista cada agente tiende a cubrirlo todo "por si acaso",
   * que es la forma barata de deshacer el acotado sin que se note.
   */
  noMira: readonly string[];
  /** Secciones que su salida tiene que traer. Acota el formato (16.4 punto 4). */
  entregables: readonly string[];
}

export const ROLES_BRAINSTORM: readonly RolBrainstorm[] = Object.freeze([
  Object.freeze({
    id: 'brainstorm-arquitectura',
    titulo: 'arquitectura',
    pregunta:
      'Dado lo que ya existe, ¿donde encaja este cambio y que forma tiene?',
    mira: Object.freeze([
      'Los modulos y ficheros que ya resuelven algo parecido, para extenderlos en vez de duplicarlos.',
      'Que se crea nuevo, que se extiende y en que orden se construye.',
      'Los limites que el cambio cruza: contratos publicos, formatos de fichero, esquemas.',
      'El precedente interno mas cercano: como se resolvio la ultima vez un problema de esta forma.',
    ]),
    noMira: Object.freeze([
      'Como se prueba (es del rol de testing).',
      'Por donde se rompe (es del rol de riesgos).',
      'Las reglas de negocio (son del rol de dominio).',
    ]),
    entregables: Object.freeze([
      'Enfoque propuesto, con rutas y nombres concretos',
      'Que se extiende y que se crea',
      'Limites que cruza',
      'La decision de diseño que mas te preocupa (UNA sola)',
    ]),
  }),
  Object.freeze({
    id: 'brainstorm-riesgos',
    titulo: 'riesgos',
    pregunta: '¿Por donde se rompe esto?',
    mira: Object.freeze([
      'Bordes y estados intermedios: que queda a medias si el proceso muere a mitad.',
      'Fallos parciales y concurrencia: dos ejecuciones, un recurso ocupado, un permiso denegado.',
      'Compatibilidad hacia atras con los datos y ficheros que YA existen.',
      'La vuelta atras: si esto sale mal, como se deshace y que queda inservible.',
    ]),
    noMira: Object.freeze([
      'Donde encaja el cambio (es del rol de arquitectura).',
      'Que aserciones escribir (es del rol de testing).',
      'Las reglas de negocio (son del rol de dominio).',
    ]),
    entregables: Object.freeze([
      'Modos de fallo, ordenados por gravedad, con el escenario concreto de cada uno',
      'Estados intermedios y fallos parciales',
      'Compatibilidad hacia atras',
      'Vuelta atras',
      'El riesgo que mas te preocupa (UNO solo)',
    ]),
  }),
  Object.freeze({
    id: 'brainstorm-testing',
    titulo: 'testing',
    pregunta: '¿Como se demuestra que esto funciona, y como envejece?',
    mira: Object.freeze([
      'Que es observable desde fuera, y contra que recurso real se comprueba.',
      'Para cada prueba propuesta, LA MUTACION DEL CODIGO FUENTE QUE LA PONDRIA ROJA. Si no sabes decirla, esa prueba no vale.',
      'Que pruebas ya existentes cambian de expectativa y cuales siguen valiendo de red de regresion.',
      'Como envejece: que se rompe dentro de seis meses cuando alguien extienda esto.',
    ]),
    noMira: Object.freeze([
      'Donde encaja el cambio (es del rol de arquitectura).',
      'Por donde se rompe en produccion (es del rol de riesgos).',
      'Las reglas de negocio (son del rol de dominio).',
    ]),
    entregables: Object.freeze([
      'Que es observable sin llamar a ningun agente',
      'Plan de pruebas, cada una con su mutacion',
      'Aserciones trampa que hay que evitar en esta tarea concreta',
      'Que pruebas existentes cambian de expectativa',
      'Como envejece',
    ]),
  }),
  Object.freeze({
    id: 'brainstorm-dominio',
    titulo: 'dominio',
    pregunta:
      '¿Que sabe quien va a usar esto que no se deduce leyendo el codigo?',
    mira: Object.freeze([
      'El vocabulario real: que nombra cada cosa quien trabaja en este dominio.',
      'Los invariantes del negocio que ningun tipo del lenguaje impone y que aun asi no se pueden violar.',
      'Los casos que en el codigo son simetricos y en el negocio no lo son.',
      'Cuando una solucion correcta en codigo es incorrecta para quien la va a usar.',
    ]),
    noMira: Object.freeze([
      'Donde encaja el cambio (es del rol de arquitectura).',
      'Por donde se rompe (es del rol de riesgos).',
      'Como se prueba (es del rol de testing).',
    ]),
    entregables: Object.freeze([
      'Vocabulario e invariantes que el enfoque tiene que respetar',
      'Donde una solucion tecnicamente correcta seria incorrecta aqui',
      'Lo que hace falta preguntarle a una persona antes de implementar',
    ]),
  }),
]);

/** Un rol que entra por las etiquetas de la tarea, fuera del presupuesto N. */
export interface RolCondicional {
  rol: RolBrainstorm;
  /** Etiquetas que lo disparan, en minusculas. Basta con que la tarea lleve una. */
  etiquetas: readonly string[];
}

export const ROLES_CONDICIONALES: readonly RolCondicional[] = Object.freeze([
  Object.freeze({
    rol: Object.freeze({
      id: 'brainstorm-rendimiento',
      titulo: 'rendimiento',
      pregunta: '¿Cuanto cuesta esto en ejecucion con los datos reales, y donde se va ese coste?',
      mira: Object.freeze([
        'El coste algoritmico con el volumen real de datos: que crece mas que lineal y a partir de que tamaño se nota.',
        'Las asignaciones y copias en los bucles calientes: lo que se crea en cada iteracion o en cada frame.',
        'Las fronteras caras: copias entre JS y WASM, mensajes y transferibles hacia Web Workers, lo que bloquea el hilo principal.',
        'Las cargas grandes: mallas 3D, teselas e imagenes pesadas, cuanta memoria ocupan y cuando se liberan.',
        'Como se mide antes de optimizar: con que datos reales, que metrica y que umbral decide si hace falta.',
      ]),
      noMira: Object.freeze([
        'La forma del cambio y la escalabilidad que fija el diseño (es del rol de arquitectura).',
        'Por donde se rompe (es del rol de riesgos).',
        'Que aserciones escribir (es del rol de testing).',
        'Las reglas de negocio (son del rol de dominio).',
      ]),
      entregables: Object.freeze([
        'Donde se va el coste, con el volumen de datos real de cada punto',
        'Fronteras caras: JS-WASM, Web Workers e hilo principal',
        'Que medir antes de optimizar, con que datos y que umbral',
        'La optimizacion que NO harias todavia (UNA sola)',
      ]),
    }),
    etiquetas: Object.freeze(['rendimiento', 'wasm', 'workers', '3d']),
  }),
]);

/** Escalera + condicionales: para buscar un rol por nombre (salidas en disco). */
export const TODOS_LOS_ROLES: readonly RolBrainstorm[] = Object.freeze([
  ...ROLES_BRAINSTORM,
  ...ROLES_CONDICIONALES.map((c) => c.rol),
]);

/** Por debajo de este numero de roles de la escalera no se suma ningun condicional. */
export const MIN_ROLES_PARA_CONDICIONALES = 2;

/** El id del agente unificador. No es un rol de brainstorm: consolida los que hay. */
export const UNIFICADOR_ID = 'brainstorm-unificador';

export class RolesBrainstormError extends Error {}

/**
 * Los `n` primeros roles por prioridad. `n` viene del lookup de la
 * heuristica, que ya lo acota; que aqui se valide igualmente es a
 * proposito: un `n` fuera de rango significa que la tabla del YML y
 * esta lista han dejado de cuadrar, y eso tiene que gritar en vez de
 * recortarse en silencio con un slice tolerante.
 */
export function seleccionarRoles(n: number): readonly RolBrainstorm[] {
  if (!Number.isInteger(n) || n < 0 || n > ROLES_BRAINSTORM.length) {
    throw new RolesBrainstormError(
      `[ERROR] Se han pedido ${n} roles de brainstorm y solo hay ${ROLES_BRAINSTORM.length} ` +
        'definidos (o el numero no es un entero >= 0). Revisa las claves ' +
        '"agentes_brainstorm_*" de scripts/heuristica-complejidad.yml: su valor no puede ' +
        `pasar de ${ROLES_BRAINSTORM.length}.`
    );
  }
  return ROLES_BRAINSTORM.slice(0, n);
}

/** La etiqueta de la tarea que dispara el condicional, o null. Sin distinguir mayusculas. */
function etiquetaQueDispara(c: RolCondicional, etiquetas: readonly string[]): string | null {
  for (const e of etiquetas) {
    if (c.etiquetas.includes(e.trim().toLowerCase())) return e;
  }
  return null;
}

/**
 * Los roles que lanza una tarea: los `n` de la escalera y, si son al menos
 * MIN_ROLES_PARA_CONDICIONALES, los condicionales que disparan sus
 * etiquetas, al final y en el orden de ROLES_CONDICIONALES.
 */
export function seleccionarRolesDeTarea(
  n: number,
  etiquetas: readonly string[]
): readonly RolBrainstorm[] {
  const base = seleccionarRoles(n);
  if (base.length < MIN_ROLES_PARA_CONDICIONALES) return base;
  return [
    ...base,
    ...ROLES_CONDICIONALES.filter((c) => etiquetaQueDispara(c, etiquetas) !== null).map((c) => c.rol),
  ];
}

/**
 * Los condicionales que las etiquetas disparan pero que no entran porque la
 * escalera lanza menos de MIN_ROLES_PARA_CONDICIONALES. `plan` lo avisa:
 * quien puso la etiqueta tiene que saber por que el rol no se lanzo.
 */
export function condicionalesDescartados(
  n: number,
  etiquetas: readonly string[]
): readonly { rol: RolBrainstorm; etiqueta: string }[] {
  if (seleccionarRoles(n).length >= MIN_ROLES_PARA_CONDICIONALES) return [];
  const fuera: { rol: RolBrainstorm; etiqueta: string }[] = [];
  for (const c of ROLES_CONDICIONALES) {
    const etiqueta = etiquetaQueDispara(c, etiquetas);
    if (etiqueta !== null) fuera.push({ rol: c.rol, etiqueta });
  }
  return fuera;
}
