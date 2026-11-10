# Informe de revision — TASK-100 (ronda 2)

- Commit revisado: ca2198de494244e805acdd3b067e88f5debffa0f
- Revisor: revisor independiente (agente general-purpose, modelo haiku, skill code-quality-reviewer); verificacion acotada
- Veredicto: aprobada-con-correcciones

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/fs/git.ts (`rutasDeTarea`, pathspecs `:(top)` y `:(top,exclude,glob)`) | implementacion |
| MEN-1 | MENOR | corregido | src/commands/finish-verificacion.ts (`puertaSoloDocumentacion`) y src/core/transiciones.ts (`anotarVerificacionDocumentacion`) | implementacion |
| MEN-2 | MENOR | corregido | README.md y skills/task-workflow/verificacion-selectiva.md (frase de mayusculas) | implementacion |
| MEN-3 | MENOR | aceptado | src/core/verificacion-proporcional.ts (`tareas/**` siempre es documentacion) | plan |
| MEN-4 | MENOR | corregido | src/core/config.ts (`validarRutasDocumentacion`): rechaza `*`, `**`, `**/*` | plan |
| MEN-5 | MENOR | aceptado | src/core/config.ts (`validarDocumentacionCompleta`) con src/hooks/guardia-merge.ts:88-92 | plan |
| MEN-6 | MENOR | abierto | src/core/config.ts (`validarRutasDocumentacion`, mensaje de error) | implementacion |
| MEN-7 | MENOR | abierto | skills/task-workflow/verificacion-selectiva.md (frase nueva sobre `core.ignorecase`) | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

MEN-6 y MEN-7 los introduce la propia correccion y son de texto: ninguno es CRITICO ni cambia el
comportamiento de integracion.

### IMP-1 — corregido

Repo temporal: la rama cambia `proj/docs/a.md` y `other/code.ts`, `rutas_documentacion:
[proj/docs/**]`, proyecto en `proj/`. Con el pathspec anterior desde `proj/`, `other/code.ts`
desaparecia de `fueraDeDocs` (el fallo de la ronda 1). Con el build actual, desde `proj/`:
`todas: [other/code.ts, proj/docs/a.md]`, `fueraDeDocs: [other/code.ts]` → `completa` («cambia rutas
que no son documentacion: other/code.ts»). Desde la raiz, identico.

### MEN-1 — corregido

La anotacion es idempotente y `puertaSoloDocumentacion` solo reescribe y commitea si el cuerpo
cambia; el test de reintento (rojo, luego verde) comprueba un unico commit y una unica linea.

### MEN-2 — corregido; MEN-7 abierto

Con Git 2.56.0.windows.4 y `core.ignorecase=true`, `git diff -- ':(top,exclude,glob)docs/**'` NO
excluye `Docs/evil.js` (solo `:(icase)` lo haria): un cambio en `Docs/` cuenta como codigo y corre
la completa, el lado seguro; el riesgo de la ronda 1 no se reproduce. Pero la frase nueva («segun
core.ignorecase (en Windows y macOS `Docs/` y `docs/` son la misma)») atribuye a `core.ignorecase`
un efecto que el pathspec no tiene: el literal distingue mayusculas siempre, salvo con `:(icase)`.

### MEN-4 — corregido; MEN-6 abierto

Se rechazan `*`, `*/**`, `**/*`, `/**` y `**/`. Con magia `glob`, `*` solo casa con la raiz y `*/**`
no casa con la raiz: el mensaje «casa con cualquier fichero» es falso para ellos (rechazarlos es
sobrerestrictivo pero seguro). `**` y `**/*` si casan con todo. `:(glob)**`, `./**` y `**/` son inocuos.

## Reproduccion y verificacion empirica

`node --test` de `verificacion-proporcional`, `finish-documentacion` y `finish-verificacion`: 26/26;
build limpio. Reproduccion de IMP-1 con `rutasDeTarea` y `decidirVerificacion` en repo temporal; de
mayusculas y comodines con `git diff` directo. Sin CRITICOS: ninguna correccion abre una via para
integrar codigo sin verificar.

## Lecturas fuera del contexto permitido

- `src/core/verificacion-proporcional.ts` (lineas 38-99): ver que decision consume `rutasDeTarea`.
- `package.json` (campo `type`): ejecutar un script ESM de reproduccion.
