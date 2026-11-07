# Informe de revision — TASK-085 (ronda 1)

- Commit revisado: 126d18d096a7479082c1db060b4df6d66c7922a5
- Revisor: agente general-purpose con code-quality-reviewer
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | abierto | src/commands/finish.ts (bloque `volcarCosteAutomatico` y `volcado.olvidar()`) | implementacion |
| MEN-2 | MENOR | abierto | src/core/coste-automatico.ts:~116 (`CAMPOS.some((k) => delta[k] < 0)`) | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

No hay hallazgos CRITICOS ni IMPORTANTES. Los dos MENORES son huecos en la red de tests, no fallos de comportamiento observados.

### Reproduccion

**Entorno de la revision.** Clon limpio de `develop` en `AppData\Local\pruebas-claude\taskcode\task-085-r1`, posicionado en 126d18d. `npm install` y `npm run build` sin errores. La suite completa (~10 min) no se corrio.
- Los tres ficheros nuevos (`dist/test/core/coste-automatico.test.js`, `dist/test/hooks/registro-coste.test.js`, `dist/test/commands/coste-automatico.test.js`): 20 tests, 20 pasan, 0 fallan.
- Los de review y registrar-coste (`review*.test.js`, `registrar-coste*.test.js`): 86 tests, 86 pasan, 0 fallan.
- No se corrieron los tests de `finish*`.

**Mutantes.** Aplicados sobre el JS compilado del clon, uno a uno, corriendo los tres ficheros nuevos tras cada uno. "Muerto" = al menos un test en rojo.

| Mutante | Resultado |
|---|---|
| M1: quitar la ventana abierta hasta el volcado | muerto (5 fallos) |
| M2: `t < hasta` pasa a `t <= hasta` | muerto (1) |
| M3: quitar el filtro por `gitBranch` | muerto (4) |
| M4: quitar el filtro por `cwd` | muerto (1) |
| M5: ignorar las ventanas (cuenta cualquier timestamp) | muerto (4) |
| M6: quitar "ya anotado en otra fase no se toca" | muerto (1) |
| M7: quitar "anotado junto a otros o sin desglose no se toca" | muerto (1) |
| M8: quitar el guard de campos negativos | SOBREVIVE (0 fallos) |
| M9: quitar el prefijo `dif:` | muerto (3) |
| M10: quitar `COSTE_AUTOMATICO=0` en el hook | muerto (1) |
| M11: quitar la guarda "la rama actual es la de la tarea" | muerto (1) |
| M12: quitar la guarda barata `carpetaEnCurso` | sobrevive, equivalente: sin la carpeta, `listTareasEnEstados` devuelve vacio y el hook sale antes de consultar la rama. Solo se pierde el ahorro del `stat`. |
| M13: quitar `COSTE_AUTOMATICO=0` en el volcado | muerto (1) |
| M14: quitar `volcado.olvidar()` en review | muerto (2) |
| M15: quitar `volcado.olvidar()` en finish | SOBREVIVE (0 fallos) |

**MEN-1. El volcado de red en `finish` no tiene ningun test.**
- `grep` de `volcarCosteAutomatico`, `coste-pendiente` y `COSTE_AUTOMATICO` en `test/` solo devuelve los tests del hook y los de review. Ningun test de `finish*` lo toca.
- El README y `coste.md` prometen que finish repite el volcado como red y que lo ya sumado no se suma dos veces. M15 sobrevive; quitar el bloque entero del volcado en `finish` tampoco romperia nada.
- La correccion del codigo se deduce solo por lectura y por analogia con `review`.
- Caso a cubrir: tarea con libro y transcripcion, `review` con `COSTE_AUTOMATICO=0` (o un fallo forzado) y luego `finish` sin la variable: suma una vez, escribe las filas en el commit de cierre y vacia el libro; un segundo volcado no suma nada.

**MEN-2. Ningun test pone a prueba el guard de campos negativos.**
- `delta.tokens <= 0 || CAMPOS.some((k) => delta[k] < 0)`: el test "una transcripcion que encoge" solo baja el total. M8 (dejar solo `delta.tokens <= 0`) sobrevive.
- Caso no cubierto: total mayor que lo anotado, pero algun campo menor (p. ej. `salida` baja y `cacheLectura` sube). Sin el guard saldria una fila `dif:` con un campo negativo.
- Es un test que falta; el codigo hace lo previsto.

**Verificado y correcto.** Ventanas (abierta hasta `hasta`, cerrada por `review`, fila de solo dia sin ventana); filtros por rama, cwd y timestamp; descuento de lo ya anotado (`dif:`, otra fase, "junto a otros"); interruptores `COSTE_AUTOMATICO` del hook y del volcado; guarda de rama del hook; vaciado del libro en `review`; el hook como proceso real sale con 0 sin escribir nada; `hooks.json` declara `Stop` y `SubagentStop`; un libro corrupto no rompe `review`.

**Observaciones sin severidad.**
- Lineas de un mismo `message.id` que cayeran a ambos lados del limite de una ventana se cuentan solo en parte. Borde de milisegundos, no reproducido.
- `finish` solo cuenta lo anterior al primer `review`, como declara el README. No es un fallo.

## Lecturas fuera del contexto permitido

Se leyo `peticion-revision-1.md` solo hasta la linea 924 de 1800 (la pagina del diff estaba truncada) y el codigo completo se leyo del clon: `hooks/registro-coste.ts`, `hooks/coste-turno.ts`, el final de `fs/coste-pendiente.ts` y los titulos de los tres tests nuevos. Motivo: completar la revision de los ficheros listados en el contexto permitido.
