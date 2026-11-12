# Informe de revision — TASK-121 (ronda 1)

- Commit revisado: ccac45208cd1f43f2fd73ea1c2b0b0b4db75087d
- Revisor: code-quality-reviewer (agente general-purpose, revisor independiente; modo rapido)
- Veredicto: aprobada

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | abierto | src/core/roadmap-comparar.ts:115 | implementacion |
| MEN-2 | MENOR | abierto | src/core/flujo.ts:185 / skills/task-workflow/duracion.md | plan |
| MEN-3 | MENOR | abierto | src/commands/start.ts:365 | implementacion |
| MEN-4 | MENOR | abierto | test/commands/troceo.test.ts | implementacion |
| MEN-5 | MENOR | abierto | src/commands/trocear.ts:98 | plan |
| MEN-6 | MENOR | abierto | src/core/troceo.ts:38 | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Alcance y profundidad: revision completa de la rama (un solo pase generico), en modo rapido: solo
tests afectados, nunca la suite completa. Reproducido con repos Git temporales reales y el CLI real.
Ningun hallazgo CRITICO ni IMPORTANTE.

### Lo que se reprodujo y funciona

- `taskctl trocear` con 2 y 3 partes: TASK-001 pasa a TASK-001a (en diseno, con su plan y su registro), crea
  TASK-001b/c en 00-planificadas con la misma `rama` y `dependencias` en cadena, un solo commit
  `chore(TASK-001): troceo en ...` con el ROADMAP regenerado y arbol limpio. Un titulo con comillas y `:` queda
  bien escapado en el YAML.
- Ciclo completo a -> approve -> start -> review -> veredicto -> finish; luego plan/approve/start de b: reutiliza la
  rama, no crea otra, y el merge de la base en la rama (`merge(TASK-001b): develop en ...`) deja `tareas/` coherente
  (001a en 04-terminadas, 001b en 02-en-curso, sin duplicados).
- Conflicto en ese merge (forzado con `--asignado-a otro` porque el limite de WIP lo bloquea antes para la misma
  persona): `git merge --abort`, error claro, tarea sin mover, arbol limpio, sin `MERGE_HEAD`.
- WIP: `start` de b con a sin cerrar aborta por el limite de una tarea por persona (bien).
- Plan malformado: partes duplicadas, objetivo vacio, parte solo con duracion, sin seccion, solo `## Troceo aceptado`:
  todos abortan con mensaje accionable y sin tocar nada. Colision de numeracion: un directorio o un FICHERO
  llamado TASK-001c en 00-planificadas aborta antes de escribir ("ya existen TASK-001c ... no se ha tocado nada").
- `new` tras el troceo da TASK-002; `board`, `roadmap`, `metricas --tokens`, `siguiente`, `board TASK-001b` aceptan
  IDs con letra. `registrar-coste` y `pausa` con letra funcionan (piden estar en la rama de la tarea, como siempre).
- Nada se trocea sin una persona: `siguiente` devuelve `preguntar` con las dos salidas en cualquier modo y
  `approve --decidido-por automatico` sigue rechazando el exceso; `trocear` no lo encadena nada.
- Mutacion: anulada la llamada a `traerBaseALaRama` en `dist/src/commands/start.js`, el test «las partes comparten
  la rama» se pone rojo (restaurado despues).

### MEN-1 — `roadmap-comparar` no reconoce IDs con letra

`src/core/roadmap-comparar.ts:115` sigue con `/^TASK-\d+$/` (y `numero()` en :135 con `(\d+)$`); el criterio pide
IDs con letra en `roadmap`. Reproduccion: `compararRoadmaps(mk('TASK-121a'), mk('TASK-121a'))` devuelve
`["fila no comparable en el actual: | 1 | TASK-121a | ..."]`, mientras que con `TASK-121` devuelve `[]`.
Efecto: solo al migrar un ROADMAP sin marca de taskctl que ya liste una parte con letra; `fs/roadmap.ts:209` lo
trata como diferencia y se niega a sustituirlo. Camino poco frecuente (el ROADMAP generado lleva la marca y no pasa
por aqui), por eso MENOR. Propuesta: `/^TASK-\d+[a-z]?$/` y que `numero()` ordene por numero y letra; test con una
fila `TASK-001a`.

### MEN-2 — Una parte sin `Duracion estimada` vuelve a disparar la pregunta de la hora

Reproduccion: trocear con la parte a sin la linea `Duracion estimada:` (plan original de 150 min). `taskctl
siguiente TASK-001a` responde «el plan estima 150 min, y la regla de una hora pide trocear...» con una sola salida
(aprobar-entera). En automatico, `approve --decidido-por automatico` de la parte a se rechaza y el flujo espera a una
persona, que ya habia decidido trocear. `planTrasTroceo` solo reescribe la linea si la parte a trae cifra, y la
documentacion (duracion.md, plan/SKILL.md) no pide ponerla. Propuesta: que `leerPartes`/`trocear` exija la duracion
de la parte a (o la avise) y que duracion.md lo diga.

### MEN-3 — Mensajes de `start` de una parte

(a) El script de Git-Flow y el resumen dicen «rama ... creada» aunque se reutilice (es el texto del script, que el
plan decidio no tocar). (b) `src/commands/start.ts:365` cita como causa del conflicto la primera linea de la salida
de git; en la reproduccion fue «Auto-merging app.txt», que no dice por que fallo (lo util es `CONFLICT (content)`).
Propuesta: elegir la primera linea que contenga `CONFLICT` o mostrar las dos primeras.

### MEN-4 — El camino de conflicto de `traerBaseALaRama` no tiene test

`grep` en `test/` no encuentra ningun test del conflicto (el exito si queda cubierto de forma implicita en el test
de rama compartida, y la mutacion lo confirma). Un `catch` sin test. Propuesta: test con repo temporal que deje un
cambio divergente en la rama y en develop y compruebe error, `git status` limpio y tarea sin mover (se alcanza con
`--asignado-a` de otra persona).

### MEN-5 — `trocear` no es atomico y no deja traza de la decision de la persona

`src/commands/trocear.ts:98-103` escribe el plan primero, mueve la carpeta y crea b, c...; las comprobaciones
previas (ID, estado, plan, colisiones) cubren los fallos esperables, pero un fallo de disco a mitad dejaria el plan
anotado con «Troceo aceptado» y un ID movido sin commit, y un reintento fallaria por ID inexistente. No verificado
(no se logro provocar un fallo a mitad sin tocar el sistema). Ademas, «solo una persona» es una garantia de proceso
(skills y que `siguiente` pregunte); el comando no registra transicion ni `decidido_por`, asi que no hay evidencia
en `## Transiciones` de que la persona lo aceptara. Propuesta: aceptable para 0.16; anotar en HALLAZGOS o registrar
la transicion.

### MEN-6 — Export sin uso

`idRaiz` (`src/core/troceo.ts:38`) no se usa en `src/` (solo se prueba). Borrarla o usarla en `metricas`, donde el
plan reconoce que los commits de diseno quedan atribuidos al ID sin letra.

## Tests ejecutados (Windows nativo, `npm run build` previo, sin errores de compilacion)

- `node --test dist/test/core/troceo.test.js dist/test/commands/troceo.test.js`: 11 de 11 pasan.
- Afectados (start-basico, start-wip, start-wip-ramas, siguiente, duracion-estimada, approve, board,
  roadmap-transiciones, roadmap-ajenos de commands; board-format, roadmap, task-id, duracion-estimada, metricas de
  core): 183 tests, 182 pasan, 1 falla: `approve: propaga cualquier error de stat ...` por `EPERM` al crear un
  symlink (entorno de Windows, no regresion).
- No se corrio la suite completa ni `test:rapido` entero (modo rapido de Carlos).
- Escenarios manuales con el CLI real en repos temporales bajo `%LOCALAPPDATA%\pruebas-claude\taskcode\task-121-r1`
  (borrados al terminar).

## Lecturas fuera del contexto permitido

- `src/core/roadmap-comparar.ts` y `src/fs/roadmap.ts` (no estan en el diff): para comprobar si el cambio de regex
  de ID en roadmap dejaba algun sitio sin cubrir (MEN-1).
- `test/helpers/automatico-fixtures.ts`: para montar los repos de reproduccion igual que la suite.
