# Informe de revision — TASK-076 (ronda 2)

- Commit revisado: a35717aed117def8f12035bf6da7841af17d87de
- Revisor: code-quality-reviewer (agente revisor independiente, general-purpose, sonnet; no implemento la tarea)
- Veredicto: aprobada con correcciones

Veredicto propuesto por el revisor: aprobada-con-correcciones (sin CRITICO ni IMPORTANTE; los 5 MENOR
de la ronda 1 corregidos; 2 MENOR nuevos que no justifican otra ronda). Quien orquesta acepta MEN-6 y
MEN-7 sin corregir (una ronda 3 la decide una persona y la persona pidio cerrar ya); quedan en el Resultado.

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | corregido | src/core/hooks-subagente.ts (espacios alrededor de `\|`; regex anclada y `"Ag"` sin avisar se mantienen por decision de la persona) | plan |
| MEN-2 | MENOR | corregido | src/core/hooks-subagente.ts (`.trim()` inalcanzable de `porNombres`) | implementacion |
| MEN-3 | MENOR | corregido | src/fs/sondas-hooks-claude.ts (`disableAllHooks`; managed settings y frontmatter siguen fuera, acotado en el README) | plan |
| MEN-4 | MENOR | corregido | src/commands/doctor.ts (ilegibles nombrados tambien con avisos, como `omitida`) | implementacion |
| MEN-5 | MENOR | corregido | test/commands/doctor-correcciones.test.ts (aislado con `configClaudeDir`) | implementacion |
| MEN-6 | MENOR | aceptado | src/commands/doctor.ts (mensaje de la `omitida` repite "sin leer") | implementacion |
| MEN-7 | MENOR | aceptado | test/commands/doctor-hooks-subagente.test.ts (`disableAllHooks` solo probado en `settings.local.json`) | implementacion |

No hay hallazgos CRITICOS ni IMPORTANTES.

## Reproduccion y evidencia

Clon temporal en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-076-r2` (HEAD 6500982, con el codigo de a35717a), `npm install` y `tsc` limpios, carpeta borrada al terminar. Una pasada de `hooks-subagente`, `doctor-hooks-subagente`, `doctor` y `doctor-correcciones`: 71/71. Suite completa no repetida (1858/1862 de quien orquesta: los 3 rojos conocidos de Windows y un intermitente de `gitflow/origin-deteccion`, que aislado pasa 5/5).

**Correcciones**: MEN-1 `"Bash | Agent"`, `" Read |Task "`, `"(Agent | Task)"` alcanzan, `"Bash | Read"` no, `"   "` = vacio; MEN-2 el mutante que quita el `.map(trim)` mata 2; MEN-3 `disableAllHooks: true` da un unico `ok` con el fichero, `false`/ausente deja los avisos; MEN-4 CLI real: `[AVISO]` seguido de `[omitida]` con el ilegible, codigo sin cambios; MEN-5 ningun `runDoctorCommand` de `doctor-correcciones` lee el `~/.claude` real.

**Mutantes** (solo lo cambiado en la ronda):

| Mutante | Resultado |
|---|---|
| quitar el `.map(trim)` por elemento | mata (2) |
| `disableAllHooks === true` -> `=== 'x'` | mata (1) |
| `disableAllHooks !== undefined` | mata (1) |
| quitar `settings.local.json` del bucle de `disableAllHooks` | mata (1) |
| quitar `settings.json` de usuario del bucle | **sobrevive** (MEN-7) |
| quitar la rama `omitida` de ilegibles con avisos | mata (1) |
| `omitida` -> `aviso` | mata (1) |
| ignorar `hooksDesactivadosEn` en doctor | mata (1) |

### MEN-6 — Mensaje duplicado en la `omitida` (implementacion)
`nota.replace(/^;/, ':')` deja `ficheros sin leer al buscar hooks: sin leer: <ruta>: <motivo>`. Estetico; el test (`startsWith` + `includes`) no lo detecta. Arreglo: `ficheros sin leer al buscar hooks: ${s.ilegibles.join('; ')}`.

### MEN-7 — `disableAllHooks` de usuario y de proyecto sin test (implementacion)
Solo se prueba `settings.local.json`; quitar el de usuario del bucle sobrevive. Arreglo: parametrizar el test con los tres ficheros.

Nota sin severidad: con `disableAllHooks` activo el `ok` no menciona ilegibles (la sonda sale antes); coherente.

## Conclusion del revisor
Los cinco MENOR de la ronda 1 resueltos y probados con mutantes, sin efectos en `enabledPlugins`, `projectPath`, codigo de salida ni neutralidad. Dos MENOR nuevos que no bloquean el cierre.
