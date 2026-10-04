# Brainstorm — TASK-040, rol riesgos (ronda 1)

- Rol: `brainstorm-riesgos`

## Riesgos, de mayor a menor dano
1. **Ronda N+1 a medio escribir deja la tarea sin salida**: un fallo a mitad
   del bucle de escrituras (EEXIST, disco) o antes del autoCommit deja
   peticion/informe N+1 con PENDIENTE; `finish` bloquea y la guarda nueva
   rechaza `review`. En `en-revision` ya no existe la red de «la tarea sigue
   en-curso». Mitigacion: deshacer las escrituras de la ronda si falla.
2. **El delta mete develop entero** si la ronda N+1 ejecuta `update-feature.sh`
   (el diff compara arboles). Mitigacion: no mergear la base en N+1, o restarla.
3. **Ronda fragmentada con veredictos mezclados**: «el ultimo informe dice» no
   esta definido con varios. Mitigacion: ninguno PENDIENTE y al menos uno pide
   cambios.
4. **El commit de la ronda N ya no es ancestro de HEAD** (rebase, amend, push
   forzado, gc) o la linea viene con prosa o partida (visto en TASK-020 r3,
   TASK-022 r2). Mitigacion: `isAncestor(A, HEAD)` y, si falla, diff completo
   con aviso explicito.
5. **Tabla ausente presentada como «sin hallazgos»** (informes anteriores a
   TASK-036, ninguna ronda >=2 historica la tiene; fila de ejemplo sin borrar;
   estados libres). Mitigacion: distinguir «tabla ausente» de «0 abiertos».
6. **La aprobacion de Codex de la ronda anterior sigue valiendo** con
   `revision_codex: true`. Mitigacion: atarla a la ronda o avisar.
7. **Vocabulario historico** (`cambios solicitados` sin guion, `aprobada con
   menores documentados`): normalizar como `veredictoAprobado`.

## Puntos sin retorno
- Merge de develop en la rama durante el update de N+1, con `--push`.
- Numero de ronda consumido (no se reutiliza por diseno).

## Descartado a proposito
Colision con peticiones escritas a mano (todas canonicas); commits chore en el
delta (`tareas/**` excluido); dos `review` concurrentes.

## Desacuerdos previstos
- Guardar `ultimo_commit_revisado` en el frontmatter: segunda fuente de verdad;
  manda el informe.
- `aprobada con correcciones` como permiso para abrir N+1 vuelve bloqueada una
  tarea cerrable: que sea explicito.
