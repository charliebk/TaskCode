# Informe de revision — TASK-117 (ronda 1)

- Commit revisado: 2973dd702046bf6189339065a8ef354421d0fcc7
- Revisor: code-quality-reviewer
- Veredicto: cambios-solicitados

Modo rapido: no se ejecuto la suite completa. Se compilo (`npm run build`, sin errores) y se corrio
`node --test dist/test/core/complejidad-similar.test.js dist/test/commands/new-complejidad.test.js dist/test/commands/new.test.js dist/test/commands/new-contenido.test.js`:
31 tests, 31 pasan, 0 fallan.

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | abierto | src/commands/new.ts:382 (efecto en src/core/heuristica.ts:653) | plan |
| MEN-1 | MENOR | abierto | src/commands/new.ts:52-54 | implementacion |
| MEN-2 | MENOR | abierto | src/core/complejidad-similar.ts:42 | implementacion |
| MEN-3 | MENOR | abierto | test/commands/new-complejidad.test.ts | implementacion |

### IMP-1 — la propuesta se escribe como complejidad "declarada" y desde ahi solo puede subir los roles

`new` escribe `opts.complejidad = propuesta.valor`. En `resolverNumeroAgentes` (heuristica.ts:653) una
complejidad declarada hace `max(declarada, heuristica)`, mientras que con `null` decide solo la heuristica
(decision C4 de TASK-042, que existio justo para que `media` por defecto no inflara el brainstorm). Efecto:
una propuesta alta o critica, sacada de etiquetas genericas (`urgente`, `v0.16`, los propios riesgos aceptados
del plan), fuerza mas roles aunque la heuristica vea la tarea simple, y ademas activa `hayDiscrepancia`.
Una propuesta baja nunca baja nada. Es decir, en la practica la propuesta solo puede encarecer el diseno,
justo lo contrario de la motivacion de la tarea (la declarada no predice el coste). No se ejecuto el
caso por fallo del script auxiliar; la conclusion sale de leer heuristica.ts:649-655. El criterio 1 pide
escribirla, asi que es una tension del plan/criterio, no un bug de codigo: se sugiere o aceptarlo y
documentarlo en el `Resultado`, o escribir la propuesta como comentario/linea informativa en vez de
campo declarado.

### MEN-1 — comentario desactualizado

new.ts:52-54 sigue diciendo "Sin --complejidad la tarea nace sin declararla (null): la decide la heuristica".
Ya no es cierto cuando hay terminadas parecidas.

### MEN-2 — la mediana par depende de una convencion no visible en el mensaje del CLI

Con numero par, el CLI imprime "mediana de ..." y elige la inferior de las centrales (probado en el test
unitario). Es lo decidido en el plan; solo se anota que la palabra "mediana" no avisa de ese sesgo.

### MEN-3 — cobertura que no discrimina dos caminos

Ningun test cubre terminadas ilegibles (el plan lo declara como riesgo aceptado: "se ignora, no aborta new")
ni etiquetas con repeticion/mayusculas en el camino de `new`. Compruebo a mano, en un repo temporal con 401
terminadas ilegibles, que `new` no aborta, no propone nada y tarda ~1,4 s en total. Sin test, quitar el
tratamiento de ilegibles no pone nada en rojo. El unitario si cubre las mayusculas y duplicados.

## Comprobado sin hallazgo

- Orden: la lectura de terminadas va despues del guard de rama y antes de escribir/auto-commit; un fallo del
  guard aborta sin leer nada.
- `opts` es local a `runNewCommand`; `import` y `doctor-deploy --crear-tareas` no llaman a `runNewCommand`
  (solo reutilizan `crearTareaEn`), asi que no les afecta la mutacion.
- Terminadas ilegibles: ignoradas (listTareasEnEstados las separa), `new` termina bien.
- Coste de leer ~400 terminadas: ~1,4 s en total, aceptable.
- Etiquetas repetidas o con mayusculas: se normalizan con minusculas y `Set`.
- Texto del CLI: coincide con lo que dice el plan y con el test.

## Lecturas fuera del contexto permitido

- src/fs/task-store.ts (listTareasEnEstados) y src/core/heuristica.ts (resolverNumeroAgentes): para comprobar
  el tratamiento de ilegibles y el efecto de la complejidad declarada.
- src/commands/doctor-deploy-tareas.ts (via grep): para descartar efectos en otros llamadores.

## Incidente del revisor

Por un fallo de mi script (variable `$LOCALAPPDATA` mal expandida en Git Bash) ejecute una vez
`taskctl new` en el repo real: cambio a `develop` y creo el commit 7ecad66 "chore(TASK-131): tarea creada"
(tareas/00-planificadas/TASK-131 y tareas/ROADMAP.md). No esta subido. Volvi a la rama de la tarea; el commit
sigue en `develop` y hay que deshacerlo (por ejemplo `git reset --hard 0ccfe63` estando en develop) —
no lo hice yo porque el sistema bloqueo el reset.
