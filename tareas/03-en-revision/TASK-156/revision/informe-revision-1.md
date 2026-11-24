# Informe de revision — TASK-156 (ronda 1)

- Commit revisado: d4c51c4b7491e10b6e5691157b5647270a6cb391
- Revisor: code-quality-reviewer (general-purpose, sonnet)
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | scripts/verificar-impacto.mjs:375 (`proximidad`) y :309-311 (`lectores`) | implementacion |
| MEN-1 | MENOR | aceptado | scripts/verificar-impacto.mjs:92-95 (`CARPETAS_LEIDAS`, patron de `skills`/`agents`) | implementacion |

### IMP-1: con el tope (por defecto y con `freno`), un cambio en una skill deja fuera tests que leen ese fichero por nombre y que antes entraban

Los `lectores` se anotan como directos con el mismo motivo que los que nombran el fichero, y `proximidad` les da 2 por vivir en `test/skills/`, mientras los que nombran el fichero concreto quedan en 3. Con mas de 10 directos, el recorte por proximidad se queda con los lectores de carpeta y descarta a quien lee exactamente el fichero cambiado.

Reproduccion en un clon temporal del commit revisado, con un cambio en `skills/finish/SKILL.md` y `RAMA_BASE=develop node scripts/verificar-impacto.mjs --listar`:

- Script de `develop`: `105 ficheros por impacto pasan del tope de 10; se corren los 10 tests directos mas proximos de 14 (4 se dejan fuera)`; entran `commands/verificacion-pesada.test.ts`, `commands/finish-heldout.test.ts`, `commands/verificacion-selectiva.test.ts` y `commands/doctor-correcciones.test.ts`.
- Script del commit: `107 ficheros ... los 10 tests directos mas proximos de 19 (9 se dejan fuera)`; los cuatro anteriores desaparecen y entran `skills/regla-4d`, `skills/tamanos`, `skills/task-workflow` y `core/revisores`.
- Con `TIPO_VERIFICACION=selectiva` (sin tope) `verificacion-pesada.test.ts` si entra: el fallo solo afecta a ejecuciones con tope (freno y uso manual).

`test/commands/verificacion-pesada.test.ts:200` lee `skills/finish/SKILL.md` y aserta su contenido: un test que lee exactamente el fichero cambiado ya no se ejecuta con tope. Igual con `plan/SKILL.md`. El test nuevo no lo cubre (su fixture no recorta lo nombrado).

Correccion sugerida: que los tests que nombran el fichero sigan por delante de los lectores de carpeta.

### MEN-1: patron de `skills`/`agents` demasiado ancho

`/['"/]skills\//` casa tambien con comentarios o cadenas que citan rutas como `test/skills/revisores.test.ts` (`test/agents/brainstorm-roles.test.ts`, `test/integracion/cli-main.test.ts`). Sobreselecciona, que es seguro, pero encarece. No se reproduce como fallo.

### Reproduccion adicional (sin hallazgo)

- `--listar` en el repo real con cambios en `skills/plan/SKILL.md`, `skills/task-workflow/avance.md`, `agents/brainstorm-riesgos.md` y `docs/problemas-conocidos.md`: `test/skills/task-workflow.test.ts` entra para skills y agents (criterio 1); `agents/` elige `brainstorm-roles`, `roles-brainstorm`, `metadatos`, `doctor-deploy`, `tamanos`, `task-workflow` y `validador-claude`; `docs/problemas-conocidos.md` elige `doctor-hooks-subagente`, `distribucion` y `readme`, sin los que usan `'docs'` en su repo temporal (criterio 2).
- Mutantes sobre el test `TASK-156` compilado (base 1/1 en verde): vaciar `lectores` → rojo; patron `docs` sin `PLUGIN_ROOT` → rojo; quitar la linea de `proximidad` → rojo; renombrar la carpeta `agents` → rojo (criterio 3).
- La cabecera del script documenta la regla (criterio 4).
- Se reutilizo la verificacion de la ronda (720/720, commit verificado igual al revisado).

## Regla 4D

- Duplicacion: cumple (`carpetaLeida` se reutiliza en `seleccionar` y en `proximidad`).
- Desviacion: cumple (el diff se limita al script y a su test).
- Diluvio: cumple (tabla de 3 entradas y un helper de una linea).
- Disfraz: cumple (`deepEqual` sobre listas exactas, 4 mutantes en rojo); el test no discrimina IMP-1.

## Lecturas fuera del contexto permitido

- `taskcode-marketplace/plugins/taskcode-plugin/test/` (grep de patrones, fragmentos de `verificacion-pesada.test.ts` y `task-workflow.test.ts`): para contrastar `CARPETAS_LEIDAS` con los tests reales.

## Correcciones de quien implementa

- IMP-1 (corregido): `proximidad` pone a quien solo entro por leer la carpeta detras de todos los que nombran el fichero (3.5 si vive en `test/<carpeta>/`, 4 si no); el orden de los que lo nombran es el de antes. Con `skills/finish/SKILL.md` y tope 10 en el repo real vuelven `verificacion-pesada`, `finish-heldout`, `verificacion-selectiva` y `doctor-correcciones`. El test de TASK-156 lo cubre con tope 1 y 2 (mutante «lectores con prioridad 1»: rojo).
- MEN-1 (aceptado): sobreseleccionar es el lado seguro, y sin tope (review y finish) es lo que se busca; afinar el patron a solo `PLUGIN_ROOT, 'skills'` dejaria fuera a quien compone la ruta de otra forma (`'..', 'skills'`, `raiz, 'skills'`, que hoy existen). Con el tope, el arreglo de IMP-1 ya deja a los lectores de carpeta al final.
