# Plan — TASK-100: Verificacion proporcional A: una tarea que solo cambia documentacion no corre la suite de tests

(Lo consolida el agente unificador a partir de 2 roles de brainstorm
lanzados en paralelo: arquitectura, riesgos.
Los desacuerdos entre roles se senalan, no se promedian.)

## Enfoque propuesto

Duracion estimada: 75 min (solo A1, tras trocear; de la rama abierta al cierre con merge; senales: 5 ficheros de codigo previstos (config, verificacion-proporcional, git, verificacion, finish-verificacion, mas finish-cobertura), 3 capas core/fs/commands, 5 criterios; los 60 de arquitectura mas las mitigaciones de riesgos y la documentacion. La tarea entera estimaba 165 min)
- (arquitectura) Se crea `core/verificacion-proporcional.ts` puro: `decidirVerificacion(config, ambito, diff|null)` -> completa/selectiva/documentacion/ninguna + motivo; `null` -> decision de siempre. Lo llaman finish, Stop, review y guardian, que pierden su logica de decision propia.
- (arquitectura) Se extienden `core/config.ts` (`rutas_documentacion` con semantica `:(glob)`, `comando_verificacion_documentacion`), `fs/git.ts` (`rutasDeTarea` contra merge-base, con 'arbol' para Stop) y `fs/verificacion.ts` (tipo y memo `'documentacion'` propios, patron de TASK-091).
- (riesgos, CRITICAS, entran en el enfoque) rutas leidas de la config de la base; cambio en `.taskcode/config.yml` = codigo; `--no-renames`; diff vacio = verificacion de siempre; Stop clasifica tambien el arbol sucio; nunca memo de completa sin correrla; `puertaCobertura`/`puertaHeldout` tratan «solo documentacion» como `omitida`.
- Orden (arquitectura): A1 config+nucleo+`rutasDeTarea`+memo+finish (~60 min) -> A2 guardian (~40) -> A3 Stop+review+docs+suite completa (~50). Supera 60 min: la particion es decision humana (abajo).

## Desacuerdos entre roles, y como se resuelven

- Guardian recalcula el diff vs fiarse del memo — arquitectura lo previo como desacuerdo / riesgos pide lo mismo («el guardian recalcula la decision», clasificacion por fuente->destino sin depender de la tarea) — no hay choque: gana recalcular con `merge-base(destino, fuente)`, ambos lo sostienen.
- Diff vacio — arquitectura: «la regla concreta no es de este rol», una rama de `decidirVerificacion` / riesgos: vacio -> siempre (verdad vacua de `every()`) — gana riesgos: es la unica regla concreta propuesta y es la fail-closed del enunciado.
- Renombres y borrados — arquitectura: lo decide el nucleo, sin regla / riesgos: `--no-renames` (o `--name-status` con ambas rutas); borrados cuentan por su ruta — gana riesgos, mismo motivo; ademas se resuelve en `rutasDeTarea`, no en el nucleo puro.
- De donde salen las rutas de documentacion — arquitectura: lee la config sin decir de que arbol / riesgos: de la base, y `.taskcode/config.yml` cambiado = codigo (precedente `finish-cobertura.ts:60`) — gana riesgos: sin ello la rama se autoexime de la suite en su propio diff.
- Arbol sucio en review — arquitectura: 'arbol' solo para Stop, review con `base...HEAD` / riesgos: Stop y review clasifican tambien lo no commiteado y no trackeado — gana riesgos: sumar el arbol solo puede volver la decision mas conservadora.
- Entregar A1 sin guardian — arquitectura: valido, el guardian queda como en 0.14.0, mas estricto / riesgos: si el merge de finish muere y se lanza el script a mano, el guardian decide sin memo — gana arquitectura para el orden (nada se vuelve mas laxo); el requisito de riesgos se exige al diseno de A2.

## Riesgos aceptados y que los contiene

- CRITICO: un `.md` que se ejecuta (skills, agents, CLAUDE.md, commands) declarado como documentacion — riesgos — nunca por extension, solo rutas declaradas, y ejemplo explicito en `verificacion-selectiva.md` de que esos `.md` no son documentacion. Lo declarado mal por el proyecto no lo para el fail-closed: se acepta.
- Lo integrado sin suite no se «desverifica» — riesgos — vuelta atras: quitar la clave en la base y correr la completa; finish deja en `tarea.md` que la verificacion fue «solo documentacion» y por que.
- Config invalida desactiva hoy el guardian (`guardia-merge.ts:88-92`, `catch` -> `continue`) — riesgos — un valor invalido de la clave nueva no puede convertir «hay comando» en «no hay config».
- Rutas con tildes (`core.quotePath`) van a codigo sin beneficio — riesgos — `-z` al pedir el diff.
- Coste de procesos git en cada turno de Stop y cada merge protegido — arquitectura — solo tras la guarda 6 y solo con la clave declarada; sin opt-in, ni se calcula el diff (riesgos lo pide igual).
- Proyecto con la clave y plugin 0.14.0: aviso de clave desconocida en cada turno de Stop — riesgos — se ignora y corre la completa (seguro); se acepta la molestia.

## Plan de pruebas

Todo contra repos Git temporales reales (convencion del proyecto); un test por caso de los criterios 1-5.
- Solo documentacion: finish integra sin `comando_verificacion`, dice que corrio y por que; con comando de docs, su fallo bloquea — arquitectura (criterio 1).
- Fail-closed: mixto, ruta no clasificada, diff no calculable, diff vacio, renombre `src/x.ts`->`docs/x.md`, `.taskcode/config.yml` que amplia rutas en la rama -> completa — riesgos + criterio 2.
- Stop y review con `.ts` sin commitear o sin seguimiento -> no es solo documentacion; solo docs -> no corren la suite — riesgos + criterio 3.
- Guardian: deja pasar solo docs sin verde de completa, bloquea con codigo, bloquea si no calcula el diff (tras el paso 5) — riesgos + criterio 4.
- Puerta de cobertura/heldout con resultado «solo documentacion»: ni rojo falso ni informe viejo — riesgos.
- Regresion sin la clave en finish, Stop, review y guardian, y memos existentes de la completa siguen valiendo — arquitectura + riesgos (criterio 5); suite completa una vez al final (criterio 7).

## Sin cubrir

- Ningun rol estima el coste de las mitigaciones de riesgos (config de la base, cobertura/heldout, `-z`, `--no-renames`): A1 de ~60 min no las incluye — revisar la estimacion al decidir la particion.
- Criterio 6 (docs) esta solo en A3 segun arquitectura: si se trocea, A1 publicaria claves sin documentar — decision humana.

## Salidas que faltaron

- ninguna (llegaron arquitectura y riesgos; se lanzaron 2 por la regla del mayor entre declarada media y heuristica simple).

## Suposiciones no verificadas

- Que `git diff` detecta renombres por defecto en la version instalada — riesgos — probarlo; `--no-renames` se pone igual.
- Que existe `puertaHeldout` acoplada al resultado de la verificacion — riesgos — leer `finish-cobertura.ts` y vecinos.
- Que review sin `comando_verificacion_selectiva` no corre nada y que `base...HEAD` tras el update da lo que ve finish; como calcula review el diff en rondas incrementales — arquitectura + riesgos — leer `review.ts:759-1031`.
- Que `resolveBaseBranchForTipo` vale para finish como para Stop (hotfix, release) — arquitectura — leer su uso.
- Que el parser acepta claves de lista nuevas sin codigo extra, y si se reutiliza `timeout_verificacion` — arquitectura — precedente `rutas_sincronizacion`.
- Que el pathspec de Git distingue mayusculas tambien en Windows (riesgos lo exige) — unificador lo deja como supuesto — test con `Docs/` vs `docs/`.

## Decision de la persona (2026-11-10)

- Carlos decide trocear en A1-A2-A3. Esta TASK-100 hace A1: `core/verificacion-proporcional.ts`, las dos claves de config (leidas de la base), `rutasDeTarea` (merge-base, `--no-renames`, `-z`), el memo `'documentacion'`, su uso en `finish-verificacion.ts` y `puertaCobertura`/`puertaHeldout` tratando «solo documentacion» como `omitida`; todas las mitigaciones criticas de riesgos que tocan finish entran aqui. Criterios: 1, 2, regresion de finish, docs de lo que hace A1 y suite.
- A2 (guardian) es TASK-101 y A3 (Stop y review, con el arbol sucio) es TASK-102, las dos dependientes de esta. Hasta entonces el guardian, Stop y review se comportan como en la 0.14.0 (mas estrictos, nunca mas laxos).
- A1 lleva su parte de documentacion y CHANGELOG para poder entregarse sola.
- La estimacion de A1 pasa de 60 a 75 min por las mitigaciones y la documentacion; Carlos aprobo la particion sabiendolo.

## Lo que necesita decision de una persona (antes de trocear)

- Trocear o no (regla de una hora: 165 min > 60). Propuesta de arquitectura: A1 config+nucleo+finish+cobertura (~60 min, criterios 1, 2 y regresion de finish), A2 guardian (~40, criterio 4), A3 Stop+review (~50, criterio 3) + docs y suite. Si se trocea, esta TASK-100 hace A1 y A2/A3 son tareas nuevas — lo decide la persona, no este rol.
- Si se trocea: redistribuir criterios 3, 4 y 6 y decidir si A1 lleva ya su parte de docs y CHANGELOG — cambia el enunciado aprobado.
- Aprobacion del plan entero con `taskctl approve`: no se implementa nada antes.
