# Plan — TASK-120: P-12: sincronizacion con su duracion registrada y limitada a las fases que se declaren

(Modo rapido: el plan lo redacta el coordinador sin lanzar el rol de brainstorm
ni unificador. Decision de Carlos del 2026-11-12.)

## Enfoque propuesto

Duracion estimada: 60 min (de la rama abierta al cierre con merge; senales: ~6 ficheros de codigo, 3-4 de tests, 4 criterios)

1. **Formato comun del registro de puertas** (`src/core/registro-puertas.ts`,
   puro): una linea por ejecucion con seis campos separados por tabulador:
   `puerta  tarea  instante(ISO 8601 UTC)  modo  duracion_s(1 decimal)  resultado`.
   `formatearLineaPuerta`, `parsearRegistroPuertas` (ignora lineas mal formadas)
   y `sumarPorTarea(lineas, puerta)`. Documentado en
   `docs/registro-puertas.md` del plugin para TASK-111 (freno Stop) y TASK-128
   (verificaciones de review y finish).
2. **Fichero** (`src/fs/registro-puertas.ts`): `.git/taskcode/puertas.log`
   (`git rev-parse --git-path`, vale en worktrees). Anotar nunca lanza: un
   registro que no se puede escribir no tumba una transicion.
3. **Sincronizacion** (`src/fs/git-commit.ts`): `autoCommit` recibe `fase`
   (cada uno de sus llamadores la pasa: new, plan, approve, start, review,
   veredicto, verificar-menores, finish, pausa, trocear, import,
   registrar-coste, codex-review, doctor-deploy). Si la clave nueva
   `fases_sincronizacion` (lista; por defecto null = todas, como hoy) no
   incluye la fase, la sincronizacion no corre. Cuando corre, se cronometra y
   se anota con puerta `sincronizacion`, la tarea (del mensaje del commit), la
   fase como modo y su estado como resultado.
4. **Config** (`src/core/config.ts`): `fases_sincronizacion`, validada contra
   la lista de fases; un valor desconocido aborta como cualquier valor
   invalido. Documentada en docs/configuracion.md.
5. **Metricas**: columna `sinc` con la suma por tarea de la puerta
   `sincronizacion`; lineas de otras puertas se ignoran; sin registro, `—`.

## Lo que el rol no cubrio

No se lanzo rol. El freno Stop y las verificaciones de review/finish no se
registran aqui (TASK-111 y TASK-128 reutilizan el formato).

## Riesgos aceptados y que los contiene

- El registro crece sin limite: una linea por transicion con sincronizacion;
  miles de lineas son KB. Se puede rotar en una tarea futura.
- Un llamador nuevo de `autoCommit` sin `fase` sincroniza siempre (como hoy) y
  se registra con modo `otra`.

## Plan de pruebas

- Core: formato y parseo (ida y vuelta, lineas rotas, puertas desconocidas),
  suma por tarea.
- Repo temporal: una transicion con `comando_sincronizacion` anota una linea con
  puerta, tarea, fase y duracion; con `fases_sincronizacion: [finish]` una
  transicion de otra fase no ejecuta el comando; sin la clave corre en todas.
- Config: la clave valida y rechaza fases desconocidas.
- Metricas: suma por tarea, ignora puertas desconocidas, `—` sin registro.
- `test:rapido` y `verificar-impacto`.

## Lo que necesita decision de una persona

Nada.
