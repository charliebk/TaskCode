# Plan — TASK-101: Verificacion proporcional A2: el guardian de merges no exige la completa si la tarea solo cambia documentacion

(Lo consolida el agente unificador a partir de 2 roles de brainstorm
lanzados en paralelo: arquitectura, riesgos.
Los desacuerdos entre roles se senalan, no se promedian.)

## Enfoque propuesto

Duracion estimada: 120 min (de la rama abierta al cierre con merge; senales: 4-5 ficheros de codigo (fs/decision-documentacion nuevo, finish-verificacion, guardia-merge, config.ts, y lo que detecte el comando compuesto), 3 capas hooks/commands->fs->core, 7 criterios; ~90 de arquitectura, que no cuentan las mitigaciones de riesgos (comando compuesto, release, presupuesto de tiempo, par/memo, held-out): ~30 mas, cuenta del unificador, no de un rol. Sin MEN-5 bajaria a ~100: sigue pasando de 60)
- (arquitectura) Se crea `src/fs/decision-documentacion.ts`: `decidirVerificacionEntre(base, hasta, cwd)` -> `{decision, timeoutS} | {invalida} | null`, sacando `decisionDocumentacion` de `finish-verificacion.ts`; finish lo llama con `(ramaBase,'HEAD')` y el guardian con `(destino, sha)`: criterio 2 por construccion.
- (arquitectura) `guardia-merge.ts`: paso 6b perezoso, solo tras fallar el memo de la completa y solo si el destino declara `rutas_documentacion`; documentacion sin comando -> pasa; con comando -> memo 'documentacion' con el timeout de la BASE; completa/invalida -> bloqueo de hoy con el motivo.
- (riesgos, CRITICAS, entran en el enfoque) rutas, comando de docs y timeout solo de `configDeRef(destino)`, nunca del arbol; par `(destino, sha ya resuelto)`, nunca nombres; decision y memo por cada par (octopus, hotfix); release -> siempre la completa, como finish; sin exencion si el comando puede mover la fuente antes del merge (commit, reset, rebase, pull, cherry-pick, am) o si la fuente es la rama actual con cambios fuera de docs en el arbol; presupuesto interno ~20 s, y si se supera hacia rama protegida, bloquear.
- Orden (arquitectura, con lo de riesgos insertado en 2): 1 helper + finish sin cambio de comportamiento; 2 paso 6b + mitigaciones de riesgos; 3 ConfigError del paso 3 (pendiente de decision); 4 MEN-6, MEN-7, docs y CHANGELOG; suite una vez.

## Desacuerdos entre roles, y como se resuelven

- Config invalida (MEN-5): trocear o resolver aqui — arquitectura: sacar el paso 3 a otra tarea, lo decide Carlos / riesgos: es el modo de fallo 3, A2 anade formas nuevas de lanzar (config.ts:764, 777, 784) y debe mitigarse ya — sin ganador: va a decision humana. Ojo: si se saca entero, el criterio 3 («un valor invalido de la clave nueva no desactiva el guardian») queda sin cumplir.
- Criterios 3 y 4 chocan — riesgos: en 0.14.0 una config invalida deja pasar (`guardia-merge.ts:88-93`, `catch -> continue`); bloquear cambia la 0.14.0 y trae bloqueos nuevos; posicion: bloquear con cualquier clave invalida / arquitectura: ve el mismo choque y tambien bloquearia para todas las claves — coinciden en la posicion, pero contradice el criterio 4 tal como esta escrito: decision humana.
- Como sabe el guardian que integra en rama protegida con config invalida — arquitectura: `configDeRef(<destino candidato>)` para `rama_base` y `comando_verificacion` / riesgos: lista fija `develop` (defecto), `main`, `master`; ConfigError del destino -> completa, nunca `continue` — sin ganador con lo que hay (la de arquitectura falla si el destino tambien es invalido; la de riesgos no ve un `rama_base` propio): se decide junto con lo anterior.
- `core/comando-merge.ts` — arquitectura: no se toca / riesgos: `analizarComando` no detecta commits y el comando compuesto es el riesgo que mas preocupa — gana riesgos: A2 abre el hueco a toda rama de solo docs (hoy exige memo verde); donde se detecta lo decide quien implemente.
- Coste en el hook — arquitectura: como mucho 3 procesos git, «cabe en 30 s» / riesgos: presupuesto interno ~20 s y bloquear si se supera (supone que un hook que agota el timeout deja pasar el merge) — gana riesgos: lo de arquitectura no esta medido y el fallo de riesgos es abierto.
- Release y hotfix — arquitectura: destino `main` decide con la config de `main`, igual que finish (supuesto) / riesgos: finish fuerza la completa en release (finish.ts:466-468), recalcular seria mas laxo y rompe el criterio 2 — gana riesgos.

## Riesgos aceptados y que los contiene

- Hotfix en dos merges sueltos: el segundo puede bloquearse y dejar main y develop divergentes — riesgos — falla cerrado; salida con `finish --sin-verificacion` anotado.
- finish muere entre el commit «solo documentacion» y el memo: el merge a mano bloquea — riesgos — el mensaje remite a finish, no a la completa.
- Un memo por tipo y por worktree: otro finish o Stop lo sobrescribe -> bloqueo de mas — riesgos — falla cerrado.
- Destino local atrasado (`pull && merge`): diff mayor que lo que entra — riesgos — mas conservador, se acepta.
- Memo de documentacion huerfano al revertir — riesgos — no molesta.
- Un merge que pasa por error y se empuja no tiene vuelta atras — riesgos — por eso, ante la duda, bloquear en todos los desacuerdos de arriba.

## Plan de pruebas

Todo contra repos Git temporales reales; un test por caso.
- Solo docs pasa sin verde de completa (con y sin comando de docs); con codigo bloquea — criterio 1 — arquitectura.
- Merge a mano sin finish llega a la decision de finish para el mismo par; release bloquea sin la completa aunque solo haya docs — criterio 2 — arquitectura + riesgos.
- Diff no calculable con destino protegido, clave nueva invalida, `config.yml` del arbol sin commitear que amplia rutas -> bloquea — criterio 3 — riesgos.
- `git add -A && git commit && git checkout develop && git merge` con `src/` en el arbol -> bloquea; par invertido y memo de otro par no eximen — riesgos.
- Sin `rutas_documentacion` en el destino: mismos pasos, textos y cero llamadas git de mas que 0.14.0 — criterio 4 — arquitectura + riesgos.
- MEN-6 (texto para `*` y `*/**`); suite completa una vez (criterio 7) — arquitectura.

## Sin cubrir

- Ningun rol estimo el coste de las mitigaciones de riesgos: los ~30 min extra son cuenta del unificador.
- Held-out bajo `tareas/**/aceptacion/`: riesgos lo detecta (modo 6) pero ningun rol propone que hacer — decision humana.
- Octopus con N fuentes frente al presupuesto de tiempo: nadie lo midio — al plan de pruebas si se mantiene el presupuesto.

## Salidas que faltaron

- ninguna (llegaron arquitectura y riesgos; se lanzaron 2 por el mayor entre declarada media y heuristica simple).

## Suposiciones no verificadas

- Que un hook `PreToolUse` que agota el timeout no bloquea y el comando se ejecuta — riesgos — probarlo con un hook lento.
- Que `git show <destino>:.taskcode/config.yml` resuelve rama y no tag — arquitectura — usar `refs/heads/<destino>` o probar la ambiguedad.
- Que el memo de documentacion de finish se guarda con HEAD igual al commit integrado — arquitectura — leer `finish-verificacion.ts:220-242`.
- En que orden mergea a main y develop el script de cierre del hotfix — riesgos — leer el script.
- Que los held-out de los consumidores viven siempre bajo `tareas/**/aceptacion` — riesgos — sin forma de verificarlo aqui.
- Que existe `verificacion-selectiva.md` donde dice MEN-7 — arquitectura — buscarlo.

## Lo que necesita decision de una persona

- Trocear o no (regla de una hora: ~120 min > 60). Corte de arquitectura: sacar MEN-5 (paso 3) a otra tarea (~100, sigue pasando); si se saca, decidir que parte del criterio 3 se queda — cambia el enunciado aprobado.
- Config invalida: bloquear siempre hacia rama protegida (riesgos y arquitectura; cambia la 0.14.0, contradice el criterio 4, va al CHANGELOG) o solo cuando la clave invalida es nueva (respeta el criterio 4); y con que se detecta la rama protegida (destino candidato vs lista fija) — elegir entre criterios es cambiar el enunciado.
- Held-out en `tareas/**/aceptacion/`: p. ej. tratarlo como codigo en el guardian (mas estricto que finish, roza el criterio 2) o aceptarlo — ningun rol lo fundamenta.
- Aprobacion del plan entero con `taskctl approve`: no se implementa nada antes.
