# Plan — TASK-142: Regla 4D: disfraz en los scripts de Git-Flow

Redactado por el coordinador (modo rapido, sin brainstorm: cuatro scripts de
bash con el fallo ya localizado y reproducido por la auditoria de TASK-141).

## Enfoque propuesto

Duracion estimada: 75 min (de la rama abierta al cierre con merge; senales:
5 scripts de bash, 1 README, 1 fichero de test nuevo, 4 criterios)

1. **resume-work.sh (SCR-01, CRITICO).** Buscar el stash recorriendo
   `git stash list --format='%gd%x09%gs'` y quedarse con el primero cuyo
   asunto termine EXACTAMENTE en `pause: <rama> AAAA-MM-DD` (comparacion con
   patron de bash, el nombre entre comillas para que sea literal: sin casar
   prefijos ni metacaracteres). Aplicar ESE con `stash pop "$stash_ref"`.
2. **pause-work.sh (SCR-09).** Los dos `push origin` pasan por
   `detect_origin_available`: con origin disponible se sube; configurado y
   caido, o sin origin, se avisa «push omitido» y el trabajo queda guardado
   en local (exit 0, igual que resume-work y los demas). Las fechas con
   `_gf_hora` en vez de `$(date ...)`.
3. **push-back-to-remote.sh (SCR-10).** En modo aditivo se apunta cada push
   fallido; si alguno falla, el script termina con `log_summary "FALLIDO"`,
   exit 1, y NO promueve el destino a origin. Ya no imprime «completado»
   tras un fallo.
4. **mirror-to-remote.sh y `ensure_remote_empty` (SCR-11).** Se corrige el
   texto, no el comportamiento (cambiarlo seria otra tarea): la cabecera dice
   que copia las ramas locales y los tags; el aviso de destino no vacio dice
   que NO sobreescribe (sin `--force`, las ramas que diverjan se rechazan y
   el envio se detiene) y la pregunta pasa a «¿Continuar igualmente?».
5. **Textos (SCR-14).** «los 19 scripts» → «los scripts de Git-Flow» (sin
   numero, para que no vuelva a quedarse viejo). El README deja de decir
   «copia literal del zip salvo dos ajustes» y «no se ha arreglado nada mas»:
   dice que partieron del zip y que cada ajuste posterior esta documentado
   en el propio script con su tarea.

## Desacuerdos entre roles, y como se resuelven

No hubo roles. Decision del coordinador: SCR-11 se cierra corrigiendo lo que
el script promete, no ampliando lo que hace (copiar tambien las ramas que
solo existen en origin cambiaria el comportamiento de una migracion; si se
quiere, va en tarea aparte).

## Riesgos aceptados y que los contiene

- Un stash creado a mano con otro formato ya no se encuentra: aceptado, solo
  se buscan los de `pause-work.sh` (es lo que el script anuncia).
- Cambiar exit 0 por exit 1 en el push aditivo fallido: quien lo llame por
  script vera el fallo, que es justo lo que se quiere.

## Plan de pruebas

Fichero nuevo `test/gitflow/disfraz-gitflow.test.ts`, repos Git temporales
reales y un bare como remoto (sin dobles).

Tests nuevos por criterio (presupuesto de 1 a 3 por criterio; si se pasa, el motivo):
- Criterio 1: 1 test. Dos stashes `pause: feature/a` y `pause: feature/ab`
  (este el ultimo); `resume-work.sh feature/a` deja el contenido del stash de
  `feature/a` y el de `feature/ab` sigue en la lista. Rojo con el codigo
  actual (aplica stash@{0}).
- Criterio 2: 1 test. `pause-work.sh --push` sin origin y workspace limpio:
  exit 0 y aviso de push omitido. Rojo hoy (exit 1, fatal de git).
- Criterio 3: 2 tests. Aditivo contra un destino con una rama divergente:
  exit distinto de 0, sin «COMPLETADO» ni «Push de ramas completado».
  Mirror contra destino no vacio: el aviso no promete sobreescribir.
- Criterio 4: 1 test. Ningun fichero de `scripts/gitflow` dice «19 scripts»
  ni «copia literal».
Ninguno pesado. Cada test nuevo se comprueba por mutacion (volver a meter el
fallo y verlo en rojo).

## Lo que necesita decision de una persona

Nada abierto (Carlos pidio encadenar todas las correcciones sin parar).
