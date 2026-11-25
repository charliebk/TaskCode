# Informe de revision — TASK-158a (ronda 2)

- Commit revisado: 00aef24b25b81d40623b3fbab134026a538e7c79
- Revisor: code-quality-reviewer
- Veredicto: aprobada con correcciones

Alcance: verificacion acotada (peticion-revision-2.md). Comprobados IMP-1 e IMP-2 de la ronda 1 y los fallos que abre la correccion en `review/SKILL.md`, `task-workflow/revision.md` y `test/skills/regla-4d.test.ts`. No se revisa la rama entera ni los MENORES de la ronda 1.

## Reproduccion

- Verificacion de la ronda: la peticion trae `node scripts/verificar-impacto.mjs` en verde sobre este mismo commit (2065 tests, 2063 pasan, 0 fallan, 2 omitidos). Se cita y no se repite.
- Clon limpio en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-158a-r2`, checkout de 00aef24 (detached), `npm install`, `npx tsc -p .` sin errores.
- `node --test "dist/test/skills/**/*.test.js"`: 112 tests, 112 pasan, 0 fallan.
- Mutaciones sobre los textos que `regla-4d.test.ts` comprueba (una por fichero, restaurando con `git checkout` tras cada una):
  - M1 revision.md: quitar "Todos los usos, no solo los citados" -> rojo test 6.
  - M2 revision.md: formato de `- 4D menores — ` sin "usos buscados, N tests mutados" -> rojo test 6.
  - M3 start/SKILL.md: quitar "helper buscado" de la linea 4D -> rojo test 7. M3b (quitar "busca todos los usos") -> rojo test 7.
  - M4 review/SKILL.md: quitar "la `- 4D ronda K — ` de las correcciones" -> rojo test 8.
  - M5 review/SKILL.md: quitar la linea `- 4D menores — ` del bloque MENORES -> rojo test 8. M5b (quitar "todos los usos;" del paso 2) -> rojo test 8.
  - M6 brainstorm-dominio, brainstorm-testing y brainstorm-unificador: quitar "todos los" del apartado "Regla 4D desde tu rol" (o de su apartado) -> rojo test 9 en cada rol.
  - M7 doctor-deploy: quitar "todos los usos" -> rojo test 10.
  - M8 finish: "hotfix pasa por `start`" reescrito -> rojo test 10.
  - Control: cambiar "anota su linea" por "anota la suya" (sin frase comprobada) -> verde, como debe ser.
- Los ficheros mutados se restauraron; `git status` del clon queda solo con `package-lock.json` (de `npm install`).
- Clon borrado al terminar (ver paso final).

## Hallazgos

| ID | Severidad | Fichero | Hallazgo | Estado |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | skills/task-workflow/revision.md:97-102 | La frase sin verbo se sustituyo por el formato completo de `- 4D ronda K — <commit>: usos buscados, N tests mutados` y de `- 4D menores — ...`. Ya no hay recorte ni frase rota. Verificado con M1 y M2. | corregido |
| IMP-2 | IMPORTANTE | skills/review/SKILL.md:41-42 y 113-114 | Ahora review/SKILL.md nombra la linea `- 4D ronda K — ` en la autorrevision del paso 2 (con "todos los usos" y remision a revision.md) y la linea `- 4D menores — ` en el bloque "MENORES tras aprobar", antes de `verificar-menores`. Verificado con M4, M5 y M5b. | corregido |
| MEN-NUEVO-1 | MENOR | taskcode-marketplace/plugins/taskcode-plugin/skills/review/SKILL.md:112 | Orden ambiguo: el bloque MENORES pide anotar `- 4D menores — <commit>` y despues "commitea". El `<commit>` de la linea no existe todavia en ese momento, y la linea no se valida (`verificar-menores` no mira la seccion 4D; ver Lecturas). Lo introduce la correccion de la ronda 1 (cb84d8b). No hay fallo de comportamiento demostrable ni de tests: queda como documentacion ambigua. Sugerencia: anotar el sha de la correccion en la autorrevision posterior, como el paso 2, o decir explicitamente que el sha es el del commit de la correccion anterior. No abre ronda. | corregido |

Ninguno de estos tres bloquea el cierre: IMP-1 e IMP-2 estan corregidos y verificados, y MEN-NUEVO-1 es MENOR.

## Regla 4D

- Duplicacion: cumple. Los textos nuevos remiten a la definicion de revision.md ("Regla 4D" de revision.md) en vez de repetirla. El test reutiliza `seccion`.
- Desviacion: cumple. Todos los cambios son de los caminos de 158a (roles, start, review, finish, doctor-deploy, revision.md).
- Diluvio: cumple. Una o dos frases por camino.
- Disfraz: cumple. Cada test nuevo cae al romper el texto que promete (M1 a M8 y M6 en los seis roles). Los MEN-1 y MEN-2 de la ronda 1 quedan corregidos: el test de review mira la linea concreta y el de brainstorm mira el apartado 4D de cada rol.

## Lecturas fuera del contexto permitido

- `src/commands/verificar-menores.ts` (cabecera y reparto de ficheros): para saber si `verificar-menores` valida la linea 4D y si la excepcion de `tareas/` cubre la anotacion en `tarea.md`. Motivo: MEN-NUEVO-1 y el paso MENORES.
- `src/core/autorrevision.ts` (lineas 20-50): para comprobar que la linea nueva `- 4D ronda K —` no rompe la comprobacion de constancia (`/^\s*[-*]\s*4D\s*(?:—|–|-|:)\s*\S/`). No la rompe: el patron exige que tras "4D" venga directamente el separador.
- `test/skills/tamanos.test.ts` (tope de revision.md, 15 KB): revision.md mide 15253 B y el test pasa. El MEN-3 de la ronda 1 no es objeto de esta ronda.

## Veredicto

aprobada-con-correcciones: IMP-1 e IMP-2 quedan corregidos y verificados por mutacion. Sin CRITICO ni IMPORTANTE abiertos. Queda un MENOR nuevo (MEN-NUEVO-1, orden ambiguo en el bloque MENORES) que puede corregirse en el backlog o aceptarse. Suite de skills en verde sobre 00aef24.
