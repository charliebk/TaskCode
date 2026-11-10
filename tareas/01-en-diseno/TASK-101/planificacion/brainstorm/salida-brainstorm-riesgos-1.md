## Modos de fallo, de mayor a menor gravedad

1. **El comando compuesto cambia la fuente despues de que el hook la evalue.**
   `git add -A && git commit -m x && git checkout develop && git merge --no-ff feature/t`: el hook
   corre una vez, antes de todo, y evalua el sha antiguo de la rama (solo documentacion); sin comando
   de documentacion pasa sin memo, y el commit mete `src/` sin verificar. `analizarComando`
   (core/comando-merge.ts) no detecta commits. Hoy el hueco existe pero exige un memo verde del sha
   antiguo; A2 lo abre a cualquier rama de solo documentacion. Mitigacion: no aplicar la exencion si
   antes del merge el comando puede mover la fuente (commit, reset, rebase, pull, cherry-pick, am), ni
   si la fuente es la rama actual con cambios fuera de documentacion en el arbol: decision de la 0.14.0.
2. **La rama se exime con la config del arbol de trabajo.** El guardian lee `resolverConfigConAvisos(raiz)`
   (guardia-merge.ts:90); en `checkout develop && merge`, al evaluar, el arbol es el de la fuente: un
   `.taskcode/config.yml` editado sin commitear con `rutas_documentacion: [src/**]` no sale en el diff y
   `RUTA_CONFIG` no salta. Mitigacion: rutas, comando de documentacion y su timeout solo de
   `configDeRef(destino)`, como finish (finish-verificacion.ts:97).
3. **Config invalida desactiva el guardian (MEN-5).** `catch → continue` en guardia-merge.ts:88-92;
   TASK-100 anadio formas nuevas de lanzar (config.ts:764, 777, 784). Si `configDeRef(destino)` entra
   en ese `try`, un error del destino tambien lo desactiva. Mitigacion: fichero que existe pero no se
   puede leer y merge hacia `develop` (defecto de `rama_base`), `main` o `master` → bloquear con
   «arregla la config»; un `ConfigError` del destino → decision completa, nunca `continue`; «no hay
   fichero» sigue dejando pasar.
4. **Par invertido.** `rutasDeTarea(fuente, destino)` en vez de `rutasDeTarea(destino, sha)` muestra
   lo que gano el destino y el codigo pasa sin que nadie lo note; pasar el sha ya resuelto, no el nombre.
5. **Un memo de documentacion sirve para otro par.** La huella es sha1(sha, comando, timeout), sin
   destino (verificacion.ts:144-149): decidir por cada par (incluidos los dos destinos del script de
   cierre) y consultar el memo 'documentacion' solo si la decision de ESE par es documentacion.
6. **`tareas/**` siempre documentacion** (verificacion-proporcional.ts:25) y ahi viven los held-out
   ejecutables (`aceptacion/`): finish los corre con `puertaHeldout`, el guardian no. Una rama que solo
   toca `tareas/**/aceptacion/*.test.ts`, mergeada a mano, pasa sin nada.
7. **Timeout del hook** (30 s, hooks.json:54): A2 anade `git show`, merge-base, dos diffs y lectura de
   memo por fuente (N en un octopus). Si el hook muere, supuesto: el merge se ejecuta igual.
   Mitigacion: presupuesto interno de ~20 s y bloquear si se supera tras saber que va a una rama
   protegida; calcular el diff solo si hay rutas declaradas y tras fallar el paso 6.

## Estados intermedios y fallos parciales

- **Release**: finish fuerza la completa (finish.ts:466-468); si el guardian recalcula con
  merge-base(main, release/x) y solo hubo documentacion, dejaria pasar sin la completa (mas laxo que
  finish, rompe el criterio 2). Release: siempre la completa.
- **Hotfix**: finish decide contra `main`; el guardian, contra cada destino. Dos merges sueltos: si el
  primero va a develop, el segundo puede bloquearse y dejar main y develop divergentes; si el primero va
  a main, el paso 5 (linea 148) deja pasar el segundo.
- **finish muere** entre el commit «cierre solo documentacion» y el memo (finish-verificacion.ts:220-242):
  con comando de documentacion el merge a mano bloquea (el mensaje debe remitir a finish, no a la
  completa); sin comando, pasa, coherente.
- **Un memo por tipo y por worktree** (verificacion.ts:41-45): otro finish o Stop puede sobrescribirlo;
  bloqueo de mas, falla cerrado.
- **Destino local atrasado** (`checkout develop && pull && merge`): diff mayor que lo que entra; mas
  conservador.

## Compatibilidad hacia atras

- Sin `rutas_documentacion` en el destino: ni diff ni memo de documentacion; mismos pasos y textos que 0.14.0.
- Destino sin `config.yml`: `configDeRef` parsea '' → defectos → completa (config-de-ref.ts:14-15);
  `comando_verificacion` debe seguir saliendo del arbol, o cambia la 0.14.0.
- **Los criterios 3 y 4 chocan**: en 0.14.0 una config invalida (claves viejas) deja pasar; bloquear
  cambia la 0.14.0 y aparecerian bloqueos nuevos en proyectos sin `comando_verificacion`. Lo decide
  Carlos y va al CHANGELOG. Posicion: bloquear con cualquier clave invalida.

## Vuelta atras

- Revertir el merge de TASK-101 o volver a 0.14.x; el memo de documentacion queda huerfano y no molesta.
- Sin retorno: un merge que pasa por error y se empuja. Un bloqueo de mas tiene salida
  (`finish --sin-verificacion`, anotado); un merge que pasa por error, ninguna: ante la duda, bloquear.

## El riesgo que mas preocupa

El 1: commit y merge en la misma llamada. Es como cierra un agente, y A2 deja de exigir el memo que hoy
cierra ese hueco.

## Desacuerdos previstos

- Con arquitectura, si reutiliza la config del arbol para las claves nuevas: no, `configDeRef(destino)`.
- Con arquitectura, si mantiene «un fallo antes de saber que integra deja pasar» para config invalida:
  no, bloquear hacia develop, main o master.

## Suposiciones no verificadas

- Que un hook `PreToolUse` que agota el timeout no bloquea y el comando se ejecuta.
- En que orden mergea a main y develop el script de cierre del hotfix.
- Que en los proyectos consumidores los held-out estan siempre bajo `tareas/**/aceptacion`.
