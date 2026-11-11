# Informe de revision — TASK-096 (ronda 1)

- Commit revisado: 51da391d65140d9c41401284fe8f43a5a9c1492b (HEAD a1322fa solo añade la peticion)
- Revisor: code-quality-reviewer (agente independiente general-purpose/sonnet, pase generico; el diff no cae en ningun dominio con revisor propio)
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/core/verificacion-proporcional.ts:122-153 y test/core/verificacion-proporcional.test.ts:335-370 | implementacion |
| MEN-2 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts:776-796 y test/core/verificacion-proporcional.test.ts:389-425 | implementacion |
| MEN-3 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/core/verificacion-proporcional.ts:84-86 y test:372-387 | implementacion |

Ningun hallazgo CRITICO ni IMPORTANTE.

## Reproduccion

Preparacion. Clon en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-096-r1`, checkout de a1322fa, `npm install` y `npm run build` sin errores. `npm run test:rapido`: 710 tests, 710 pasan, 0 fallan. No corri la suite completa porque ningun hallazgo la exige.

Entrada real. Ejercite `parsearConfig` y `decidirVerificacion` desde el `dist` compilado:
- `rutas_verificacion_parcial: [src/**]` sin selectiva: aborta con el mensaje esperado.
- Lista vacia sin selectiva: aborta (coherente con `rutas_documentacion`). Lista vacia con selectiva: `[]`.
- `"*"`, `"**"`, `"**/*"` y `"*/**"`: rechazados con el mensaje propio de la clave nueva.
- Ruta absoluta y `../fuera/**`: rechazadas. Un texto en vez de lista: rechazado.
- `comando_verificacion_selectiva: null`, `""` y `~` con las rutas parciales: aborta en el parseo del comando; no se puede activar el nivel 2 sin comando.
- Duplicados: se deduplican.
- Los llamadores actuales (`fs/decision-documentacion.ts:82`) cortan con `if (!documentacionDeclarada(config)) return null` y no calculan `fueraDeParcial`: un proyecto que declare la clave cae hoy en `completa`. Es lo previsto para B1. `finish-verificacion.ts:156` solo reacciona a `documentacion`, asi que `selectiva` se trata como completa hasta TASK-106.

Mutantes (sobre una copia, restaurada tras cada uno). Murieron 12 de 15 que compilaron (M4 y M8 no compilaron):
- Muertos: M1 quitar `validarParcialCompleta`; M3 `fueraDeParcial.length > 1`; M5 nivel 2 solo por tener selectiva; M7 `if (!docs)`; M9 patrones sin `tareas/**`; M10 patrones sin las parciales; M12 quitar el chequeo de diff vacio; M13 quitar el chequeo de `.taskcode/config.yml` (la mutacion del criterio 2); M14 motivo con la lista equivocada; M15 comando fijo; M16 clave no conocida; M17 default distinto de `[]`.
- Sobreviven M2, M6 y M11: son los tres MENOR.

### MEN-1 — Diff solo de `tareas/**` sin `rutas_documentacion`: la rama `selectiva` no esta probada y su motivo dice «0 fichero(s)»
Con `rutas_documentacion: []`, `rutas_verificacion_parcial: ['src/**']` y selectiva, un diff con solo `tareas/a.md` (`fueraDeDocs: []`, `fueraDeParcial: []`) devuelve `selectiva` con el motivo «todo el codigo que cambia la tarea (0 fichero(s)) cae en...». En la 0.14.0 daba `completa` («no declara rutas_documentacion»). Inocuo hoy (el fs corta antes), pero no hay codigo y el motivo miente. Mutante M6 (quitar `docs &&` en la rama de documentacion): toda la suite sigue verde. Sugerencia: decidir a proposito ese caso y fijarlo con un test antes de TASK-105.

### MEN-2 — Ningun test comprueba que los errores de la clave nueva nombran la clave nueva
Mutante M2 (pasar siempre `'rutas_documentacion'` a `validarPatronesExclusion`): «debe ser una lista» o «es absoluto» de `rutas_verificacion_parcial` nombrarian la otra clave; la suite sigue verde. Solo «demasiado amplio» afirma el nombre. Sugerencia: afirmar `/rutas_verificacion_parcial/` en `../fuera/**` y en la lista mal formada.

### MEN-3 — `parcialDeclarada` sin test del caso mixto
Mutante M11 (`parcialDeclarada = rutas.length > 0`): sigue verde; el test solo evalua nada declarado y todo declarado. TASK-105 a TASK-108 la usaran como unico sitio que dice si el nivel 2 esta activo. Sugerencia: dos aserciones mas.

### Observaciones sin hallazgo
- La validacion cruzada, el rechazo de patrones totales y el orden de las condiciones (config antes que selectiva) son correctos y estan protegidos por tests que se ponen rojos al mutarlos.
- `**/*.ts` se acepta en `rutas_verificacion_parcial`, igual que `**/*.md` en `rutas_documentacion`: consistente.
- `validarRutasDocumentacion` se reutiliza para la clave de codigo y su nombre ya no es exacto (cosmetico).
- Los held-out (`aceptacion/`) aun no cuentan como codigo para `fueraDeParcial`, como hace `decision-documentacion.ts:87-88` con `fueraDeDocs`: alcance de TASK-105.
- El criterio de regresion (sin la clave, como en la 0.14.0) queda cubierto en core; finish y el guardian no usan la clave todavia.

## Lecturas fuera del contexto permitido

- `src/commands/finish-verificacion.ts`, `src/fs/decision-documentacion.ts`, `src/fs/git.ts` (solo greps de puntos de uso): para confirmar que ningun llamador consume `selectiva` ni la clave nueva todavia.
- `src/core/config.ts` fuera del diff (parseo de `comando_verificacion_selectiva` y `validarPatronesExclusion`): para comprobar que un comando nulo o vacio no puede dejar activo el nivel 2.

La carpeta temporal del clon fue borrada. El repo original no se modifico.
