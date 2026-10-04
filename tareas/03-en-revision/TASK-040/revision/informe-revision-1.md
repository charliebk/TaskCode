# Informe de revision — TASK-040 (ronda 1)

- Commit revisado: d3809db23f5cafc19824fcf18c42666c940ba1b4
- Revisor: revisor por pares independiente (code-quality-reviewer), clon temporal de la rama en e61299a
- Veredicto: aprobada con correcciones

## Hallazgos

| ID | Severidad | Estado | Fichero |
|---|---|---|---|
| MEN-1 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/core/informe-revision.ts:136 |
| MEN-2 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/test/commands/review-incremental.test.ts |

Sin CRITICO ni IMPORTANTE: por la politica A3 esta ronda cierra.

### MEN-1 — el parser de la tabla no conoce los bloques de codigo

`hallazgosNoCerrados` toma la primera linea que empieza por `|` bajo
`## Hallazgos`, sin saltar bloques cercados. Probado contra
`dist/src/core/informe-revision.js`:

- `## Hallazgos` + una tabla de ejemplo dentro de un bloque ``` + la tabla
  real con `IMP-1 abierto` devuelve `abiertos: [FAKE]`. La fila real IMP-1
  se pierde: se omite un hallazgo, justo el fallo que el modulo dice evitar
  («omitir es caro»).
- Un bloque que solo trae la tabla, sin tabla real despues, devuelve
  `tabla: true` con la fila falsa, en vez de «tabla ausente o ilegible».
- Un `## Hallazgos` escrito dentro de un bloque antes de la seccion real
  tambien se toma como el bueno.

Lo que el enunciado pedia vigilar si funciona: una tabla en un bloque de
codigo o en otra seccion **despues** de la tabla real se ignora (E2E de
abajo: FAKE-1 en el bloque y FAKE-2 en `## Otra seccion` no aparecen). Lo
dejo en MENOR porque hace falta que el revisor pegue una tabla cercada
encima de la real, y la plantilla no lo hace.

### MEN-2 — la ronda fragmentada con varios informes no tiene test

Mutante M2 (`for (... of textos.slice(0, 1))` en `leerRondaPrevia`, review.ts:256,
para listar solo los hallazgos del primer informe de la ronda): **7/7 en
verde, sobrevive**. Ningun test encadena una ronda N fragmentada. La
funcionalidad si va bien (E2E de abajo); falta el test que lo fije, que
el plan pedia en el riesgo 3 («hallazgos no cerrados de TODOS los
informes en cada peticion, con origen»).

### Reproduccion

**Suite completa en el clon** (`npm install && npm run build && npm test`):
920 tests, 917 pasan, 3 fallan. Son los 3 rojos conocidos de Windows
(approve #119 por stat/EPERM, plan #281 y #287). Ningun EBUSY.

**Mutantes** (`timeout 900 node --test dist/test/commands/review-incremental.test.js`, dist restaurado despues de cada uno):

| Mutante | Resultado |
|---|---|
| M1 `veredictoDeRonda` sin prioridad de `pendiente` | muerto (2 rojos) |
| M2 solo los hallazgos del primer informe de la ronda | **sobrevive** (MEN-2) |
| M3 `desde = baseBranch` aunque el commit de la ronda N sea antepasado | muerto (1 rojo) |
| M4 `aceptado` cuenta como abierto | muerto (1 rojo) |

**E2E con el CLI real** (`node <clon>/bin/taskctl`, repo Git temporal,
rama `feature/task-900-e2e`, ficheros `src/a.ts`, `src/A.java`, `src/C.vue`):

1. `review`: ronda 1 fragmentada en 3 (java-spring, angular-vue,
   code-quality) con 6 ficheros y autocommit.
2. Con la ronda en PENDIENTE: `review` aborta y manda a `taskctl veredicto`;
   `start` manda a `taskctl review`. Se acaba el circulo.
3. Los informes se rellenan con tablas: vue lleva `IMP-1 abierto`,
   `MEN-1 corregido`, `MEN-2 aceptado` y, debajo, tablas falsas en un bloque
   de codigo y en otra seccion. java lleva `MEN-9 abierto`. Veredictos
   con `--informe`: java `aprobada-con-correcciones`, vue
   `cambios-solicitados`, code-quality `aprobada`. `finish` bloquea
   («revision primaria no aprobada»).
4. Commit de correccion solo en `src/C.vue`. Aparte, `develop` avanza con
   `ajeno.txt`.
5. `review`: «ronda 2 ... solo con los cambios desde 95f1f80 (sin update de
   develop)». El arbol queda limpio y hay autocommit. La tarea sigue en
   `03-en-revision`: el move de la carpeta a si misma no hace rename y
   funciona en Windows. La guarda leyo `03-en-revision/TASK-900/revision`.
   La peticion generada (`peticion-revision-2-angular-vue-reviewer.md`):
   - se reclasifica por dominio: solo vue, «1 fichero(s) de 1»;
   - el diff es solo `src/C.vue`, sin `ajeno.txt` de develop;
   - los 6 commits de peticion y veredicto de `tareas/` no entran en el
     diff y salen en «Excluido del diff»;
   - la tabla de abiertos trae IMP-1 (de vue) y MEN-9 (de java), cada uno
     con su informe de origen. No trae MEN-1, MEN-2, FAKE-1 ni FAKE-2.
6. `veredicto TASK-900 aprobada` (ronda 2, un solo informe). `review`
   aborta y manda a finish. `finish` lee la ronda 2, cierra y mergea en
   develop.

**Nota, no hallazgo.** El bloque «Commits a revisar» de la ronda 2 lista los
`chore(...)` de peticion y veredicto, que no aportan nada al revisor. Solo
es ruido: el diff esta limpio.
