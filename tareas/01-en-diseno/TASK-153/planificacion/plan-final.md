# Plan — TASK-153: Regla 4D en la creacion de codigo y tests

Redactado por el coordinador (modo rapido, sin brainstorm: la auditoria de
TASK-141 ya dice donde falla la regla al crear; las piezas existen y se
extienden).

## Enfoque propuesto

Duracion estimada: 60 min (la de la parte a; la tarea entera, unas 3 h, se trocea abajo)

La Regla 4D pasa de «se comprueba al revisar» a «se aplica al crear», en
las tres fases que crean:

1. **Plan.** `plan-final.md` gana `## Reutilizacion (Regla 4D)`: los
   helpers, funciones, fixtures y tests existentes que la tarea usara,
   buscados en el repo antes de disenar (y lo que se crea nuevo, con el
   motivo de no reutilizar). La plantilla de `plan.ts` la trae; las
   peticiones de redaccion y del unificador (`plan-brainstorm.ts`) la piden;
   el unificador y arquitectura la mencionan en su salida. `approve` avisa
   (sin bloquear, como la duracion) si falta o esta vacia.
2. **Implementacion.** `avisoAutorrevision` avisa tambien si la seccion
   existe pero no trae una linea `- 4D — <commit>: ...`. La skill `start`
   lista los patrones de disfraz en tests que encontro la auditoria, para
   comprobarlos antes de pedir revision.
3. **Revision.** La peticion de revision gana `## Candidatos 4D`, generada
   por el CLI desde el diff de la tarea, pura y sin dependencias:
   - funciones y constantes nuevas (lineas anadidas con `function`,
     `export const`, `fn`, `def` y equivalentes) y, para cada una, las ya
     existentes en el repo con nombre igual o parecido (`git grep` de
     definiciones y la distancia de `sugerencia.ts`): posibles duplicados;
   - tests nuevos cuyo nombre promete algo comprobable («sin efectos», «no
     toca», «ordena», «antes de», «intacto», «limpio», «nunca», «solo»): a
     mutar.
   Con el diff vacio o sin candidatos, la seccion lo dice en una linea.
4. **Medida.** `taskctl metricas` cuenta por tarea los hallazgos 4D: en la
   seccion `## Regla 4D` de los informes, cada linea con un ID en vez de
   `cumple` suma a su D.

## Reutilizacion (Regla 4D)

- `rangoDeSeccion` (`core/transiciones.ts`) para leer las secciones nuevas;
  `faltasRegla4D` y `DIMENSIONES_4D` (`core/informe-revision.ts`) para la
  medida; `masParecida`/distancia de `core/sugerencia.ts` para los nombres
  parecidos; el patron de aviso de duracion de `approve.ts` para el aviso de
  reutilizacion; `diffRangeForPaths`/`lotesDeRutas` (`fs/git.ts`) para el
  diff de la peticion.
- Nuevo: un modulo puro `core/candidatos-4d.ts` (extraer definiciones y
  tests nuevos de un diff y cruzarlos con las existentes): no hay nada
  parecido que extender.

## Troceo

### Parte a: plan con reutilizacion y autorrevision 4D exigida
La plantilla del plan y las peticiones de los agentes piden la seccion de reutilizacion, approve avisa si falta o esta vacia, review avisa si la autorrevision no trae la linea 4D, y start lista los patrones de disfraz en tests.
Duracion estimada: 60 min
- [ ] plan-final.md lleva una seccion de reutilizacion (Regla 4D) con los helpers, funciones y fixtures existentes que se usaran; la plantilla de plan, las peticiones de redaccion y del unificador y los agentes que escriben el plan la piden, y approve avisa si falta o esta vacia, con test
- [ ] review avisa si la autorrevision no trae la linea 4D (helper buscado, criterios citados, tests mutados), con test; la skill start lista los patrones de disfraz en tests (nombre que promete sin asercion, datos que no distinguen, rejects sin matcher, skip que esconde un fallo)

### Parte b: candidatos 4D en la peticion de revision
El CLI genera desde el diff una seccion con los posibles duplicados y los tests a mutar.
Duracion estimada: 60 min
- [ ] La peticion de revision trae una seccion de candidatos 4D generada desde el diff: por cada funcion o constante nueva, las existentes con nombre igual o parecido en el repo, con test contra un repo temporal real
- [ ] La misma seccion lista los tests nuevos cuyo nombre promete algo comprobable; con diff sin candidatos lo dice en una linea; las revisoras y revision.md piden mutar esos tests

### Parte c: metricas de hallazgos 4D
taskctl metricas cuenta por tarea los hallazgos 4D de sus informes, para ver la tendencia.
Duracion estimada: 45 min
- [ ] taskctl metricas cuenta por tarea los hallazgos 4D de sus informes (por regla, desde la seccion Regla 4D: un ID suma, cumple no), con test; las tareas sin la seccion salen sin dato, no con cero

## Desacuerdos entre roles, y como se resuelven

No hubo roles. Coordinacion con TASK-150 (skills): esta tarea solo anade la
seccion de reutilizacion y la lista de patrones de disfraz; la unificacion de
plantillas y formatos de los agentes (CONT-05..07) queda en TASK-150.

## Riesgos aceptados y que los contiene

- Los candidatos por nombre parecido daran falsos positivos: son pistas para
  el revisor, no hallazgos; la seccion lo dice. Se acota a N candidatos por
  definicion para no inflar la peticion.
- Detectar definiciones con regex no cubre todos los lenguajes: se cubren
  TS/JS, Rust, Python, Java/C# y bash; lo demas, sin candidatos (no falla).
- El aviso de reutilizacion es no bloqueante: los planes anteriores no se
  atascan.

## Plan de pruebas

Tests nuevos por criterio (presupuesto de 1 a 3 por criterio):
- a1: 2 (plantilla y peticiones traen la seccion; approve avisa con la seccion ausente o vacia y no con ella rellena).
- a2: 1 (autorrevision con seccion pero sin linea 4D avisa; con ella no).
- b1: 2 (puro: extraer definiciones de un diff y cruzar con existentes; integracion: peticion real en repo temporal con un helper duplicado).
- b2: 1 (tests con nombre que promete aparecen; diff sin candidatos da la linea).
- c1: 1 (metricas con informes con IDs, con cumple y sin seccion).
Ninguno pesado. Cada test nuevo se comprueba por mutacion.

## Lo que necesita decision de una persona

Nada abierto: pedido por Carlos; trocear lo autorizo al pedir no parar.
