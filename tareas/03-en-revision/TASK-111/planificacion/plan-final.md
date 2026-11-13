# Plan — TASK-111: P-3: registrar cada ejecucion del freno Stop y no correrlo si el turno no cambio codigo

(Modo rapido: el plan lo redacta el coordinador sin lanzar los roles de
brainstorm ni el unificador. Decision de Carlos del 2026-11-12; la heuristica
pedia 2 roles.)

## Enfoque propuesto

Duracion estimada: 60 min (de la rama abierta al cierre con merge; senales: 3 ficheros de codigo, 3 de tests, 1 doc, 5 criterios)

No se trocea: decision de Carlos del 2026-11-13.

Estado de partida: `decidirStop` (src/hooks/freno-stop.ts) llama a
`verificarConMemo`. El memo de la completa se guarda siempre; el de la
selectiva y el de documentacion solo con el arbol limpio (TASK-105: no pisar
el verde limpio que buscan finish y el guardian). Asi, con cambios sin
commitear, el freno repite la selectiva en cada turno aunque el turno no haya
tocado nada. No queda registro de ninguna ejecucion.

1. `core/registro-puertas.ts`: constantes de la puerta `freno` y de sus
   resultados (`verde`, `rojo`, `omitido`, `excedido`; este ultimo solo
   declarado, lo escribe TASK-125). Funcion pura `resumirFreno(lineas)` ->
   `Map<tarea, { ejecuciones, duracionS }>`: ejecuciones = lineas `freno` que
   no son `omitido`; duracion = suma de todas.
2. `fs/freno-ultimo-verde.ts` (nuevo): memo PROPIO del freno en
   `git rev-parse --git-path taskcode/freno-ultimo-verde.json` con la huella
   (`huellaDelArbol` con el mismo comando, timeout y contexto que la
   verificacion; `contextoSelectiva` en la selectiva) y el tipo. Leer y
   guardar nunca lanzan. Es independiente del memo compartido, asi que no
   pisa el verde limpio de finish/guardian (la decision de TASK-105 sigue).
3. `hooks/freno-stop.ts`, tras decidir el plan y antes del progreso:
   - calcula la huella; si coincide con la del ultimo verde del freno ->
     no ejecuta, no escribe progreso, sale 0 con los avisos de la decision
     (sin anadir salida propia) y anota `omitido`.
   - si no, verifica como hoy y anota una linea con `modo` = tipo de
     verificacion (`completa`, `selectiva`, `documentacion`), duracion de
     reloj (inicio -> fin de `verificarConMemo`) y resultado: `verde` si
     ejecuto en verde, `omitido` si vino del memo compartido en verde,
     `rojo` en cualquier otro estado (roja, cortada, no lanzable, de memo o
     no). En verde guarda la huella como ultimo verde si la verificacion no
     cambio el arbol.
   - `tarea` de la linea: el primer ID de las tareas en curso de la rama.
   - Cuando el freno no llega a verificar (sin tarea, sin comando, solo
     documentacion sin comando) no hay linea: no hubo puerta.
4. `commands/metricas.ts` + `core/metricas.ts`: `FilaMetricas.freno`
   (`{ ejecuciones, duracion }` o null) y dos columnas al final, `freno_n`
   y `freno` (tiempo), con `—` sin lineas de la tarea.
5. `docs/registro-puertas.md` y CHANGELOG: la puerta `freno`, sus modos y
   resultados, el memo propio y las columnas.

## Lo que el rol no cubrio

No se lanzaron roles.

## Riesgos aceptados y que los contiene

- Un rojo intermitente seguido de un verde: el ultimo verde se guarda, asi que
  el siguiente turno sin cambios se omite. Es lo que pide la tarea.
- La huella cuesta un `git status` y leer lo sucio, una vez mas por turno
  (verificarConMemo la vuelve a calcular). Coste de milisegundos frente a
  minutos de verificacion; aceptado.
- El registro es por worktree (como el de la sincronizacion, MEN-1 de
  TASK-120).

## Plan de pruebas

- `test/core/registro-puertas`: `resumirFreno` cuenta sin omitidos, suma todo
  e ignora otras puertas.
- `test/hooks/freno-stop` (repo temporal, script real): verde -> una linea
  `freno` con `verde`; rojo -> `rojo`; con un cambio sin commitear y la
  selectiva, el segundo turno sin cambios no ejecuta el script (contador de
  ejecuciones), no escribe stderr ni progreso y anota `omitido`; tocar un
  fichero vuelve a ejecutar; sin tarea no hay linea.
- `test/commands/metricas` y `test/core/metricas`: columnas `freno_n` y
  `freno` con dato y con `—` (expectativas de cabecera actualizadas, no
  debilitadas).
- `verificar-impacto` y `test:rapido`.

## Lo que necesita decision de una persona

Nada.
