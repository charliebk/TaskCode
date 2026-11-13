# Plan — TASK-115: P-7: verificacion completa por lote de cierres en modo automatico

(Modo rapido: el plan lo redacta el coordinador sin lanzar los roles de
brainstorm ni el unificador. Decision de Carlos del 2026-11-12.)

## Enfoque propuesto

Duracion estimada: 80 min (de la rama abierta al cierre con merge; senales: 4 ficheros de codigo, 2 de tests, docs y CHANGELOG, 5 criterios)

No se trocea: decision de Carlos del 2026-11-13.

**Forma elegida** (la tarea la dejaba a Carlos; el 2026-11-13 pidio aceptar
todas las recomendaciones y esta es la recomendada): la clave relaja SOLO la
completa de `finish` de feature/fix con codigo; el resto de puertas sigue
igual (documentacion, selectiva del nivel 2, release y hotfix, que van a la
principal, siempre con la completa). La vuelta atras ante un rojo la decide
una persona: el comando dice que tareas entraron desde la ultima completa en
verde, no revierte nada solo.

1. `core/config.ts`: clave `verificacion_por_lote` (booleano, false por
   defecto). Exige `comando_verificacion`. `finish` la lee de la config de la
   RAMA BASE (`configDeRef`): la rama de una tarea no puede activarsela para
   saltarse la completa.
2. `commands/finish-verificacion.ts`: en `puertaVerificacion`, despues de
   `--sin-verificacion` y de las vias de documentacion y selectiva, si la
   tarea iria a la completa, no es release ni hotfix y la base declara la
   clave: anota en `tarea.md` `## Verificacion por lote` la linea
   `- <instante>: pendiente de lote; no se ejecuta \`<comando>\`
   (verificacion_por_lote)`, la commitea en la rama y devuelve `omitida`
   (cobertura y held-out se comportan como con el salto). Aviso por stderr.
3. `commands/verificar-lote.ts` (nuevo), `taskctl verificar-lote [--push]`:
   - exige estar en la rama de integracion con el arbol limpio y
     `comando_verificacion`;
   - pendientes = tareas de `04-terminadas` cuya ultima linea de
     `## Verificacion por lote` dice «pendiente de lote», en orden de anotacion;
   - sin pendientes: lo dice y no ejecuta nada;
   - ejecuta la completa sobre HEAD (guarda el memo de la completa con el
     arbol limpio, anota la puerta `finish` modo `lote`);
   - verde: anade a cada pendiente `- <instante>: lote en verde en <sha>
     (taskctl verificar-lote)` y lo commitea en la rama de integracion;
   - rojo: no anota nada y sale con error listando las tareas que entraron
     desde la ultima completa en verde (las pendientes) con su commit de
     merge si se encuentra, y la salida de la verificacion.
4. `cli.ts`: registrar el comando y su ayuda.
5. Docs: docs/configuracion.md (seccion de la clave y del comando),
   docs/comandos.md, CHANGELOG.

## Lo que el rol no cubrio

No se lanzaron roles.

## Riesgos aceptados y que los contiene

- Entre dos lotes, la rama de integracion puede tener un rojo que nadie ha
  visto: es lo que se cambia por 28 min por tarea; `verificar-lote` lo
  encuentra y dice que tareas sospechar; release sigue exigiendo la completa.
- El guardian de merges no cambia: los merges a mano siguen exigiendo el
  verde, y los de `finish` no pasan por el.

## Plan de pruebas

- `test/core/config`: la clave (booleano; texto o numero aborta; sin
  `comando_verificacion` aborta).
- `test/commands/verificar-lote` (repo temporal, script real de verificacion):
  con la clave en develop, `finish` de una feature con codigo no ejecuta la
  completa, integra y deja la linea pendiente; dos tareas asi y
  `verificar-lote` en develop: una ejecucion, las dos anotadas en verde y
  commit; en rojo: error con las dos tareas listadas y nada anotado; sin
  pendientes no ejecuta; fuera de develop o con el arbol sucio aborta.
- Regresion: sin la clave `finish` corre la completa (tests existentes) y con
  la clave solo en la rama de la tarea (no en develop) tambien.
- `verificar-impacto` y `test:rapido`.

## Lo que necesita decision de una persona

La forma de la verificacion por lote: decidida como arriba por la regla de
aceptar las recomendaciones (Carlos, 2026-11-13). Se puede revisar.
