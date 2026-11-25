# Informe de revision — TASK-167c (ronda 1)

- Commit revisado: 519bd17 (contenido de la parte c igual que a52b9ed, que es el de la peticion; 519bd17 solo anade la peticion de revision)
- Revisor: code-quality-reviewer
- Veredicto: cambios-solicitados

(El revisor propuso aprobada-con-correcciones; el coordinador lo pasa a cambios-solicitados porque las correcciones de IMP-1 e IMP-2 tocan la skill y core/auditoria-4d.ts y necesitan una ronda que las verifique.)

Verificacion: la de la ronda (verde para a52b9ed) vale. Yo solo corri, en un clon en
`%LOCALAPPDATA%\pruebas-claude\taskcode\task-167c-r1`, `npm install`, `tsc` (0 errores) y los cuatro
ficheros de test pedidos: 46 tests, 46 pasan. Reproduccion por mutacion de la skill y lectura de
`src/commands/new.ts`. Clon borrado al terminar (sin commits propios; solo `package-lock.json`
tocado por npm).

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/skills/auditoria-4d/SKILL.md:76 | implementacion |
| IMP-2 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/test/skills/auditoria-4d.test.ts:71 | implementacion |
| MEN-1 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/skills/auditoria-4d/SKILL.md:90 | implementacion |
| MEN-2 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/test/skills/auditoria-4d.test.ts:61 | implementacion |
| MEN-3 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/skills/auditoria-4d/SKILL.md:55 | plan |

### IMP-1 — el sufijo `-2`, `-3` que pide la skill no lo reconoce el formato fuente unica
La skill dice: "si ya existe uno de hoy, anade `-2`, `-3`..." (SKILL.md:76 aprox., paso 5). Pero
`PATRON_INFORME_AUDITORIA_4D = /^auditoria-4d-(\d{4}-\d{2}-\d{2})\.md$/` (src/core/auditoria-4d.ts:205)
no casa con `auditoria-4d-2026-11-25-2.md`. Reproduccion: `node -e "...PATRON_INFORME_AUDITORIA_4D.test('auditoria-4d-2026-11-25-2.md')"` devuelve `false`.
Incoherencia concreta: dos auditorias el mismo dia y la segunda es invisible para `taskctl metricas`
(parte d) o, si la parte d acepta el sufijo por su cuenta, hay dos decisiones del nombre. Arreglo:
ampliar el patron a `(?:-(\d+))?` y exponer el sufijo, o quitar el sufijo de la skill. Ademas el test
no lo cubre: solo prueba `nombreInformeAuditoria4D('2026-11-25')`; mutar la skill a "sobrescribelo"
sigue en verde.

### IMP-2 — mutaciones que sobreviven: el test no protege la creacion de tareas con criterios ni el "solo si la persona lo pide"
Mutadas sobre `skills/auditoria-4d/SKILL.md` (clon) y corrido `auditoria-4d.test.js`:

| Mutacion | Resultado |
|---|---|
| cabecera de hallazgos sin `Ola`; quitar fila Total; quitar fila Disfraz; quitar `--etiquetas regla-4d`; quitar `git commit`; quitar `AskUserQuestion`; `### Ola 1 - `; "solo lectura" -> "lectura" | el test falla (bien) |
| quitar `--criterio ...` del comando `taskctl new` | **sigue verde** (quedan 4 flags: `--titulo --tipo --etiquetas --objetivo`, pasa el `>= 4`). Las tareas por ola nacerian sin criterios de aceptacion |
| quitar "Solo si dice que si" del paso 6 | **sigue verde**: el orden `AskUserQuestion < git commit < taskctl new` se mantiene, pero ya no dice que sin respuesta afirmativa no se crea nada (el nombre del test lo promete) |
| quitar "Una D sin hallazgos va con ceros" | sigue verde (menor) |
| quitar la fila de ejemplo `4D-01` de la tabla de hallazgos | sigue verde: nada comprueba que el ejemplo tenga el numero de columnas de la cabecera |

Es una proteccion de la tarea (criterios comprobables por ola) sin test que se ponga rojo al quitarla.
Arreglo: exigir `--objetivo` y `--criterio` en el bloque, y una asercion de texto sobre "Solo si".

### MEN-1 — `taskctl new` de la skill: encaje con el CLI real (comprobado) y un hueco
Comprobado en `src/commands/new.ts`: los flags usados (`--titulo --tipo --etiquetas --objetivo --criterio`)
estan en `FLAGS_NEW` (:38); `--tipo fix` es valido; `--sprint` es opcional (DEFAULT_SPRINT);
`ensureBaseBranchReady` (:361) aborta con el arbol sucio y cambia a la rama base segun el tipo
(fix -> la de integracion): la skill lo advierte y commitea el informe antes. Encaja. Hueco menor:
si la persona audito una rama que no es la base, el informe se commitea en esa rama y `taskctl new`
cambia a la base, donde `docs/auditoria-4d-<fecha>.md` (que cita cada objetivo) no existe. El paso 1
solo dice "dilo antes de empezar". Mejor: pedir parar si la rama actual no es la base.

### MEN-2 — el test acepta el ejemplo del informe sin validar las filas de hallazgos ni las olas completas
`ejemploInforme` + el test (auditoria-4d.test.ts:61 aprox.) comprueban cabeceras y una fila por D, pero
no que la fila de ejemplo de hallazgos tenga 6 columnas ni que el bloque `### Ola N` traiga
`- Hallazgos:` y `- Duracion estimada:`, que la parte d probablemente leera. Ver tambien MEN-3.

### MEN-3 — ambiguedades de parseo para la parte d
(1) Una celda `Hallazgo` con `|` (frecuente al citar codigo) rompe la tabla y la skill no avisa de
escaparlo o evitarlo. (2) Las D y severidades van sin tilde (`Duplicacion`, `CRITICO`) y el resto de
la skill esta acentuado: un modelo puede escribir `CRÍTICO`/`Duplicación`; conviene decir "sin tilde"
junto a la lista. (3) Resumen y tabla de hallazgos duplican las cifras (la skill ya dice que salen de
la tabla: la parte d deberia leer la tabla, no el resumen; dejarlo escrito en `core/auditoria-4d.ts`).
(4) `n` en el ejemplo es un marcador, no un numero: nadie debe parsear el ejemplo, pero el test no
lo impide.

## Regla 4D

- Duplicacion: cumple (el formato esta una sola vez en `src/core/auditoria-4d.ts`; la skill lo repite a proposito como texto para el modelo y el test los ata; la excepcion es el sufijo del nombre, ver IMP-1)
- Desviacion: cumple (los cambios de redaccion en task-workflow/SKILL.md:173-176 son recortes ajenos al objetivo, MENOR y sin consecuencia)
- Diluvio: cumple
- Disfraz: IMP-2 (mutaciones supervivientes)

Punto 4 del encargo: la skill no menciona el proyecto que construye el plugin ni rutas internas;
solo `taskctl` y `/taskcode-plugin:...`, que son el propio producto instalado (el test de marcas de
doctor-deploy.test.ts pasa con la skill incluida).

## Lecturas fuera del contexto permitido

- `taskcode-marketplace/plugins/taskcode-plugin/src/commands/new.ts`: pedido expresamente en el encargo para comprobar el encaje de `taskctl new` con la skill.
