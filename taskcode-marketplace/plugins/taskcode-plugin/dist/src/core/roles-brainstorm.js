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
 */
export const ROLES_BRAINSTORM = Object.freeze([
    Object.freeze({
        id: 'brainstorm-arquitectura',
        titulo: 'arquitectura',
        pregunta: 'Dado lo que ya existe, ¿donde encaja este cambio y que forma tiene?',
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
        pregunta: '¿Que sabe quien va a usar esto que no se deduce leyendo el codigo?',
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
/** El id del agente unificador. No es un rol de brainstorm: consolida los que hay. */
export const UNIFICADOR_ID = 'brainstorm-unificador';
export class RolesBrainstormError extends Error {
}
/**
 * Los `n` primeros roles por prioridad. `n` viene del lookup de la
 * heuristica, que ya lo acota; que aqui se valide igualmente es a
 * proposito: un `n` fuera de rango significa que la tabla del YML y
 * esta lista han dejado de cuadrar, y eso tiene que gritar en vez de
 * recortarse en silencio con un slice tolerante.
 */
export function seleccionarRoles(n) {
    if (!Number.isInteger(n) || n < 0 || n > ROLES_BRAINSTORM.length) {
        throw new RolesBrainstormError(`[ERROR] Se han pedido ${n} roles de brainstorm y solo hay ${ROLES_BRAINSTORM.length} ` +
            'definidos (o el numero no es un entero >= 0). Revisa las claves ' +
            '"agentes_brainstorm_*" de scripts/heuristica-complejidad.yml: su valor no puede ' +
            `pasar de ${ROLES_BRAINSTORM.length}.`);
    }
    return ROLES_BRAINSTORM.slice(0, n);
}
