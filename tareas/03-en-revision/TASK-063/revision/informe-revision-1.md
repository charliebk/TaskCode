# Informe de revision — TASK-063 (ronda 1)

- Commit revisado: 3148321440c45cb6ce494100d3307e11b2e19292
- Revisor: code-quality-reviewer (agente general-purpose, modelo sonnet, independiente de la implementacion)
- Veredicto: aprobada

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | abierto | src/core/coste-registro.ts (leerCostes, `if (enBloque[i]) continue;`) | implementacion |
| MEN-2 | MENOR | abierto | src/commands/registrar-coste.ts (costeDeAgentes) | especificacion |
| MEN-3 | MENOR | abierto | src/core/coste-registro.ts (anadirCoste) | implementacion |

Ningun hallazgo CRITICO ni IMPORTANTE. Veredicto propuesto por el revisor: aprobada.

## Reproduccion y trabajo realizado

Clon temporal de la rama en `%LOCALAPPDATA%\pruebas-claude\TaskCode\task-063-r1` (ya borrado), `npm install`, build y suite completa una vez; copia aparte del clon para mutantes.

### Suite (`npm test`, una vez)

1370 tests: 1364 pasan, 6 fallan, ninguno en ficheros de la tarea:
- Conocidos de Windows: n.º 109 (symlink `EPERM`), n.º 456 (`chmod` en NTFS) y n.º 462 (texto del estado leido de la rama base; atribuido a CRLF).
- Conocidos aparte: los 2 de "contraprueba de descubrimiento" (n.º 74 y n.º 1369, `claude plugin validate` con README_MISSING; fallan igual en develop).
- n.º 224 (`doctor.test`, "con un error el codigo es 1", obtuvo 2): intermitente bajo carga (35 s). Repetido solo pasa en la rama (1/1) y en `origin/develop` (1/1). El diff no toca `doctor.ts`.

### Prueba manual con el CLI real

Repo Git temporal, `taskctl new` y `CLAUDE_CONFIG_DIR` apuntando a un `agent-<id>.jsonl` con `message.id` repetido, un `tool_use` Read repetido y un `Bash` con `  grep -r x .`:
- `registrar-coste --fase diseno --agente a1b2c3d4e5f60718` suma 69 (10+20+30+9, ultima aparicion del id): `tokens_diseno: 69` y fila `| ... | diseno | agente:a1b2c3d4e5f60718 | 10 | 20 | 30 | 9 | 2 | 69 |` (2 lecturas: Read deduplicado + grep), en un unico commit de un fichero.
- `--tokens 500` deja una fila `manual` con `-` en las cinco columnas de desglose y total 500.
- Una tercera llamada anade otra fila (totales acumulados 638); arbol limpio; la tabla se crea al final del cuerpo sin tocar lo anterior.

### Sondeos directos sobre `dist/`

- `sumarUsoTranscripcion`: cuenta `Read`, `Glob`, `cat > f` (heuristica documentada), `sed -n`, `cat` solo y `grep<TAB>x`; no cuenta `cd x && cat y`, `catalog x`, `ls-files` ni `sed -i`. Un id repetido en dos mensajes cuenta una vez; una linea sin `usage` pero con `tool_use` suma lecturas.
- `anadirCoste`: funciona con CRLF y sin salto final; inserta tras la ultima fila de una seccion existente respetando la siguiente seccion.
- `leerHallazgos`: `**Implementación**` → `implementacion`; `Especificacion.` (con punto) y celda vacia → `sin clasificar`; reconoce la cabecera `Origen (implementacion / plan / especificacion)`; sin columna Origen todo es `sin clasificar`; ignora la fila de ejemplo; una fila corta no rompe.

### Mutantes

Detectados (algun test en rojo): lecturas sin deduplicar por id; contador de lecturas sin id roto; quitar `Glob` de la lista; anadir `cd` a los comandos Bash de lectura; sumar `cacheEscritura` en `cacheLectura`; ignorar la cabecera `origen (...)`; no pasar a minusculas; default `plan` con columna ausente; default `implementacion` fuera de vocabulario; `fuente` invertida; no escribir la fila; `lecturas` siempre `null`; insertar antes de la ultima fila; quitar la validacion de fecha en `leerCostes`; quitar el aviso de `finish` para implementacion; cambiar la rama `=== 0` de implementacion a revision.

Supervivientes: quitar `if (enBloque[i]) continue;` en `leerCostes` (MEN-1). El mutante de `sed\s+-n` no se pudo aplicar (el reemplazo no coincidio); el caso tiene test pero no queda probado por mutacion.

## Detalle de los hallazgos

**MEN-1 (MENOR, implementacion).** El salto de bloques de codigo dentro de `## Coste` no tiene test que lo ejerza: el test existente pone tambien el titulo `## Coste` dentro del bloque, asi que `rangoDeSeccion` no encuentra seccion y nunca llega a la linea. Falta el caso de una seccion `## Coste` real con un bloque de codigo que contiene una fila valida. Sin la guarda, `leerCostes` la contaria y `anadirCoste` podria insertar dentro del bloque. El codigo actual es correcto; falta el test.

**MEN-2 (MENOR, especificacion).** Registrar dos veces el mismo `--agente` en la misma fase suma dos veces y deja dos filas identicas. Es el comportamiento previo (la suma acumulativa ya existia); la tabla lo hace visible. Ni el CHANGELOG ni `coste.md` avisan de que el id no se deduplica entre llamadas. Decidir en TASK-064 si `metricas` deduplica por fuente, o documentarlo.

**MEN-3 (MENOR, implementacion).** Si una seccion `## Coste` editada a mano tiene una tabla ajena (p. ej. `| a |`), `anadirCoste` anade la fila de 9 columnas tras ella sin cabecera valida (reproducido). No se pierde nada y `leerCostes` ignora filas que no casan. El cuerpo ya dice "no la edites a mano".

## Notas

Decisiones de diseno coherentes: el total sigue en `tokens_<fase>`, la tabla es el desglose, commit unico, y `leerHallazgos` es el unico parser de la tabla de hallazgos (`hallazgosNoCerrados` filtra sobre el). Sin duplicacion con consecuencia demostrable; `rangoDeSeccion` y `dentroDeBloque` se reutilizan. Carpeta temporal borrada; sin commits ni push en el repo original.
