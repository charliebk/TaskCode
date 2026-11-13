# Plan — TASK-119: P-11: menos commits de proceso por tarea

(Modo rapido: el plan lo redacta el coordinador sin lanzar los roles de
brainstorm ni el unificador. Decision de Carlos del 2026-11-12; la heuristica
pedia 2 roles por la complejidad declarada `media`.)

## Enfoque propuesto

Duracion estimada: 60 min (de la rama abierta al cierre con merge; senales: 6 ficheros de codigo, 4 de tests, 3 skills, 3 criterios)

Estado de partida (leido en el codigo y en el historial de TASK-112): un ciclo
con una ronda deja hoy 12 commits de proceso (sin contar el merge): creada,
en diseno, plan final (a mano, lo pide la skill de plan), coste de diseno,
plan aprobado, en curso, coste de implementacion, peticion, informe relleno (a
mano), veredicto, coste de revision y terminada. `registrar-coste` y
`veredicto` commitean cada uno lo suyo, y `approve`, `start`, `review` y
`finish` exigen el arbol entero limpio, asi que todo lo escrito entre fases
necesita su propio commit.

Regla nueva: **lo pendiente de la carpeta de la propia tarea lo absorbe el
siguiente comando de fase**. Nada mas: un cambio fuera de esa carpeta sigue
abortando como hoy.

1. `fs/git.ts`: `pendientesDeTarea(cwd, tareasRoot, id)` lista los cambios sin
   commitear bajo `tareas/<estado>/<ID>/` (cualquier estado: un movimiento deja
   alta y baja) y `cambiosFueraDeTarea(...)` el resto. `ensureBaseBranchReady`
   acepta esas rutas como permitidas cuando no hay que cambiar de rama.
2. `fs/pendientes.ts` (nuevo): apartar lo pendiente de la tarea en un stash con
   nombre propio (`taskctl <ID>: pendientes de la tarea`) solo mientras corre lo
   que necesita el arbol limpio (el script de Git-Flow y la verificacion, que
   guarda su memo solo con el arbol limpio), y devolverlo antes de escribir y
   commitear. Si un comando muere con el stash puesto, el siguiente intento del
   mismo comando lo recupera al empezar; si no se puede devolver (conflicto,
   merge a medias), el error dice el nombre del stash y como recuperarlo.
3. `registrar-coste` y `veredicto` dejan de commitear (salvo una tarea ya
   terminada, que no tiene fase siguiente: ahi se commitea como hoy). Su salida
   dice que el cambio queda pendiente y que lo incluye el siguiente comando de
   fase. `--push` sin commit avisa de que no tiene efecto.
4. `approve`: la guarda deja pasar lo pendiente de la tarea y su commit lo
   incluye (plan final y coste de diseno). `review` y `finish`: la guarda
   tolera lo pendiente de la tarea, lo aparta alrededor del script y de la
   verificacion, y lo devuelve antes de su commit (`review`: la peticion en la
   rama; `finish`: el de cierre en la rama de integracion, tras el merge).
   `start` no cambia: con lo pendiente absorbido en `approve`, no le llega nada.
5. `siguiente`: un informe de revision sin commitear ya no obliga a que el
   cierre lo decida una persona (lo absorbe `finish`); el diff de codigo desde
   el Commit revisado se sigue comprobando igual.
6. Skills `plan`, `review` y `finish`: no pedir commits a mano de plan final,
   informe ni coste.

## Lo que el rol no cubrio

No se lanzaron roles.

## Riesgos aceptados y que los contiene

- Un comando de fase que muere con el stash puesto: lo recupera el siguiente
  intento del mismo comando, y el error lo nombra.
- El veredicto y el coste de revision no quedan en la rama de la tarea, sino
  en el commit de cierre de la rama de integracion (la historia de la
  integracion los conserva).
- Mientras haya algo pendiente, `new` de otra tarea aborta por arbol sucio (como
  hoy con el plan final sin commitear).

## Plan de pruebas

- Repo temporal: `registrar-coste` y `veredicto` no crean commit; `approve`,
  `review` y `finish` con lo pendiente de la tarea no abortan y lo meten en su
  commit; con un cambio fuera de la carpeta de la tarea siguen abortando.
- Stash huerfano de un intento anterior: el siguiente `review` lo recupera.
- Ciclo completo new..finish con una ronda que cuenta los commits de proceso:
  como mucho 6 (la mitad de 12).
- Ajuste de las expectativas de los tests que contaban el commit de
  `registrar-coste` y `veredicto`.
- `test:rapido` y `verificar-impacto`.

## Lo que necesita decision de una persona

Nada.
