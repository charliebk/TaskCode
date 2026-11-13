# Plan — TASK-127: tope de rondas de revision configurable, 2 por defecto, y decision de una persona al llegar

(Modo rapido: el plan lo redacta el coordinador sin lanzar los roles de
brainstorm ni el unificador. Decision de Carlos del 2026-11-12; la heuristica
pedia 2 roles.)

## Enfoque propuesto

Duracion estimada: 70 min (de la rama abierta al cierre con merge; senales: 4 ficheros de codigo, 4 de tests, 3 skills, README y CHANGELOG, 6 criterios)

No se trocea: decision de Carlos del 2026-11-13 («No aceptamos trocear la
tarea»). El exceso sobre la hora es documentacion, no codigo.

Estado de partida: `TOPE_RONDAS = 3` fijo en `src/core/flujo.ts`; lo leen
`siguienteFase` (pregunta en el tope con `cambios-solicitados`) y `review`
(rechaza la ronda 4 sin `--ronda-extra`). `--ronda-extra` no exige nada mas.

1. `core/config.ts`: clave `tope_rondas`, entero de 1 a 10, defecto 2. Fuera
   de rango o no entero aborta (fallo cerrado, como el resto de claves).
2. `core/flujo.ts`: `TOPE_RONDAS` pasa a `TOPE_RONDAS_POR_DEFECTO = 2` y
   `ContextoFlujo.topeRondas` (opcional; ausente = defecto). En el tope con
   `cambios-solicitados` devuelve `accion: preguntar` en todos los modos con
   `salidas` de tres opciones:
   - `cerrar`: marcar `aceptado` lo que queda abierto (IDs y motivo en el
     Resultado) y `taskctl veredicto <ID> aprobada-con-correcciones`.
   - `ronda-extra`: anotar la decision en `tarea.md` y
     `taskctl review <ID> --ronda-extra`.
   - `volver-a-diseno`: redisenar lo abierto en una tarea nueva
     (`taskctl new`), enlazada desde el Resultado (decision de Carlos del
     2026-11-13: sin transicion en-revision -> en-diseno).
   El `comando` del paso sigue sin `--ronda-extra` (MEN-6 de TASK-095).
3. `commands/siguiente.ts`: pasa `config.tope_rondas` al contexto.
4. `commands/review.ts`: usa `config.tope_rondas`. Pasado el tope,
   `--ronda-extra` exige en `tarea.md` la seccion `## Rondas extra` con una
   linea `- Ronda N: <quien decide y por que>` para la ronda que se abre
   (N = ultima + 1, texto no vacio). Sin ella aborta antes de tocar nada y
   dice la linea exacta que falta. Cada ronda extra necesita su propia linea:
   vuelve a preguntar. La seccion entra en el commit de la ronda (TASK-119).
5. Skills `review` y `task-workflow` (revision.md, avance.md), README del
   plugin y CHANGELOG: el tope, su defecto (2), la clave y las tres salidas.

## Lo que el rol no cubrio

No se lanzaron roles.

## Riesgos aceptados y que los contiene

- Proyectos sin la clave pasan de 3 a 2 rondas: es lo que pide la tarea; el
  CHANGELOG lo dice y `tope_rondas: 3` devuelve el comportamiento anterior.
- La linea de `## Rondas extra` la puede escribir el propio agente: el mismo
  modelo de confianza que `--aceptar-sin-revisar`; la skill dice que solo la
  escribe con el si de una persona.

## Plan de pruebas

- `test/core/config`: defecto 2, 1 y 10 validos, 0, 11 y no entero abortan.
- `test/core/flujo` / `siguiente`: tope 2 pregunta en la ronda 2 con tres
  salidas en manual, semiautomatico y automatico; ronda 1 no pregunta; con
  `topeRondas: 3`, como hoy (regresion); una ronda extra (3 con tope 2) vuelve
  a preguntar.
- `test/commands/review-alcance` (repo temporal): con tope 2 la ronda 3 se
  rechaza; `--ronda-extra` sin la linea se rechaza; con ella abre la ronda; la
  ronda 4 vuelve a exigir su linea; con `tope_rondas: 3` en config, el test
  actual (rechazo en la 4) sigue igual.
- `test:rapido` y `verificar-impacto`.

## Lo que necesita decision de una persona

Nada: la tercera salida y el no trocear ya los decidio Carlos.
