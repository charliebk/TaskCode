# Plan — TASK-118: P-10: linea FIN con la duracion en todos los scripts de Git-Flow

(Modo rapido: tarea pequena, el plan lo redacta el coordinador sin lanzar el
rol de brainstorm ni unificador. Decision de Carlos del 2026-11-12.)

## Enfoque propuesto

Duracion estimada: 40 min (de la rama abierta al cierre con merge; senales: 1 fichero de codigo (bash), 1 de tests, 2 criterios)

Estado de partida: los 23 scripts que registran llaman a `initialize_gitflow_log`
(`_gitflow-common.sh`), pero solo los que llegan a `log_summary` dejan un cierre
reconocible; un `exit` intermedio (workspace sucio cancelado, rama inexistente,
conflicto) deja el registro sin final, y por eso `create-*` no se puede medir.

Cambio, todo en `scripts/gitflow/_gitflow-common.sh`:

1. `initialize_gitflow_log` instala `trap '_gf_fin $?' EXIT` (ningun script que
   registra tiene su propio trap de EXIT; `_sonda-bash.sh` no registra).
2. `log_summary` guarda su resultado en `GF_RESULTADO`.
3. `_gf_fin` escribe, solo en el fichero de registro, una linea con el formato
   de siempre: `[fecha hora] [FIN  ] FIN: <operacion> | resultado: <R> | duracion: <N>s`,
   con R = el de `log_summary` si salio 0 tras el resumen, `ABORTADO` si salio 0
   sin resumen y `ERROR (codigo N)` si salio con codigo distinto de 0.

## Lo que el rol no cubrio

No se lanzo rol. Un script que aborta ANTES de `initialize_gitflow_log` (nombre
de rama invalido) no tiene registro, asi que tampoco linea FIN: no hay nada que
medir. Que `metricas` lea la linea queda para quien la use (P-1 ya mide finish
desde taskctl).

## Riesgos aceptados y que los contiene

- El trap pisa un trap de EXIT que un script pusiera despues: hoy no hay ninguno;
  el test por script lo veria (sin linea FIN).

## Plan de pruebas

`test/gitflow/linea-fin.test.ts`, repos Git temporales reales: cada uno de los 23
scripts que registran se ejecuta en un estado que lo hace terminar (casi todos
abortan en un repo minimo) y la ultima linea de su registro es la FIN con
operacion, resultado y duracion. Casos dirigidos: COMPLETADO (create-develop),
ABORTADO (salida 0 sin resumen) y ERROR con su codigo. `test:rapido` y
`verificar-impacto`.

## Lo que necesita decision de una persona

Nada.
