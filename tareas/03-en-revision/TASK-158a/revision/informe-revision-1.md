# Informe de revision — TASK-158a (ronda 1)

- Commit revisado: d70549dc1f64f9fb322c7ca24eff686226044546
- Revisor: code-quality-reviewer
- Veredicto: cambios-solicitados

Alcance: pase generico completo (diff solo de textos instalables + 1 test). Sin dominio con revisor propio.

## Reproduccion

- Verificacion de la ronda: la peticion trae la selectiva en verde sobre este mismo commit (2065 tests, 0 fallos); vale. Yo corri solo lo afectado en un clon limpio: `npm install`, `npx tsc -p .` (sin errores) y `node --test "dist/test/skills/**/*.test.js"`: 112 pasan, 0 fallan.
- Mutacion de `test/skills/regla-4d.test.ts` (rompiendo el texto que comprueba, una mutacion por camino, restaurando tras cada una):
  - revision.md (quitar "Todos los usos" / quitar `- 4D menores — `): rojo el test 6.
  - start (quitar `usos buscados` y "todos los usos"): rojo el test 7.
  - review (quitar la frase "Regla 4D al corregir..."): rojo el test 8.
  - Los seis roles del brainstorm (quitar "Regla 4D" en cada uno): rojo el test 9 en los seis. Quitar solo "todos los usos/sitios/tests": rojo en los seis (arquitectura y dominio, con la frase partida en dos lineas, solo con una mutacion multilinea; la primera sed no tocaba nada y la descarte).
  - finish (hotfix pasa por `start`): rojo el test 10. doctor-deploy (quitar "No arregles el codigo aqui" y, aparte, "todos los usos"): rojo el test 10 las dos veces.
  - `tamanos.test.js`: 7/7 en verde.
- Los textos instalables añadidos no mencionan TaskCode, rutas internas ni IDs de tarea (grep del diff de `skills/` y `agents/`).
- Clon borrado al terminar.

## Hallazgos

| ID | Severidad | Fichero:linea | Hallazgo | Estado |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | skills/task-workflow/revision.md:98-99 | La frase añadida «Al corregir `- 4D ronda K — ` o `- 4D menores — ` en la autorrevision.» no tiene verbo: es un resto del recorte para caber en el tope (revision.md pesa 15359 B con CRLF; el tope es 15360). Es el unico sitio del plugin que dice que existen esas dos lineas de autorrevision, asi que quien corrige una ronda o los MENORES no puede deducir de ella que debe anotarlas ni con que formato. | corregido |
| IMP-2 | IMPORTANTE | skills/review/SKILL.md:90 | La unica instruccion del camino de correcciones y MENORES es «Regla 4D al corregir y en los MENORES: todos los usos.». Dice "todos los usos" pero no pide la autorrevision completa (helper, criterio, mutacion) ni nombra la linea `- 4D ronda K — ` / `- 4D menores — ` ni "antes de `verificar-menores`", que es lo que promete el inventario y el criterio 2. Quien solo lea review/SKILL.md (la fase que invoca la persona) no sabe donde anotarlo. Va ademas en medio del parrafo del paso 4, a mitad de la frase del modo automatico, lejos del bloque "MENORES tras aprobar" (~l.108-115) donde se corrigen los MENORES. | corregido |
| MEN-1 | MENOR | test/skills/regla-4d.test.ts:94-97 | El nombre del test promete «autorrevision 4D por ronda y antes de verificar-menores» y solo comprueba una frase corta de review. Un texto que dejara de pedir la linea por ronda o antes de `verificar-menores` seguiria en verde mientras esa frase exista (patron "nombre promete" de disfraz-tests.md). | corregido |
| MEN-2 | MENOR | test/skills/regla-4d.test.ts:104-105 | Las dos aserciones del test de brainstorm miran toda la seccion `## Qué miras`, no el apartado de Regla 4D de cada rol: una frase "todos los tests" o "todos los sitios" de otro punto bastaria para que el rol pase sin pedir buscar todos los usos en su apartado 4D. Hoy no pasa (comprobado), es fragilidad futura. El regex tambien acepta `tests` y `sitios` para cualquier rol. | corregido |
| MEN-3 | MENOR | skills/task-workflow/revision.md (tope 15 KB) | Margen de 1 byte bajo el tope en Windows; 158b y cualquier retoque posterior obligaran a subir el tope o a recortar otra vez (origen probable de IMP-1). Conviene subir el tope a 16 KB en `tamanos.test.ts` con su motivo en vez de seguir recortando frases. | corregido |
| MEN-4 | MENOR | tareas/03-en-revision/TASK-158a/tarea.md:62 | La autorrevision dice «7 tests mutados» y el commit añade 5 tests (regla-4d.test.ts:80, 88, 94, 99, 109). Cuenta distinta o texto inexacto; sin efecto en el codigo. | corregido |

## Inventario y caminos

- El inventario de la tarea cubre los caminos que crean o actualizan codigo: roles del brainstorm y unificador, plan/approve (sin cambios, justificado), implementacion tras `start` (feature, fix y hotfix), correcciones de ronda, MENORES, hotfix y release, doctor-deploy y revisor-seguridad-deploy, revisoras y `verificar-impacto` (158c). No encuentro un camino que se haya quedado fuera: `new`, `board`, `approve` y `plan` no escriben codigo; `revisor-seguridad-deploy` es solo lectura.
- Cada camino en alcance de 158a exige 4D y buscar todos los usos al escribir (salvo la debilidad de IMP-1/IMP-2 en correcciones y MENORES). Las revisoras no cambian en este diff: su remision a revision.md cubre "todos los usos" porque esa regla se añade alli; ningun test lo comprueba desde las revisoras (solo desde revision.md), aceptable.
- Un test por camino: si, y ninguno es disfraz salvo el matiz de MEN-1/MEN-2 (todos cayeron al romper el texto que prometen).
- Recortes de tamaño: unico defecto, la frase de IMP-1. El resto (start, finish, doctor-deploy, roles) se lee completo y sin ambiguedad.

## Regla 4D

- Duplicacion: cumple. Los tests reutilizan `seccion`/`faltanD`; los textos no repiten la definicion de revision.md, la remiten.
- Desviacion: cumple. Todo el diff es de 158a; lo de 158b/158c queda anotado en el inventario.
- Diluvio: cumple. Una a tres frases por camino.
- Disfraz: MEN-1 (nombre del test de review promete mas de lo que comprueba) y MEN-2 (aserciones demasiado amplias); el resto de aserciones, mutadas, caen.

## Lecturas fuera del contexto permitido

- `test/skills/tamanos.test.ts` y los tamaños con CRLF de los .md del plugin: pedidos por el encargo para comprobar los recortes.
- `skills/review/SKILL.md` (paso 4 y "MENORES tras aprobar") y `skills/task-workflow/*.md` por grep: para buscar caminos que creen codigo y valorar IMP-2.

## Veredicto

aprobada-con-correcciones: dos IMPORTANTES de redaccion (IMP-1 e IMP-2: frases que no dicen que anotar ni donde) y cuatro MENORES. Ninguna regresion de comportamiento; la suite afectada pasa y todas las mutaciones por camino se detectan. Se corrigen IMP-1 e IMP-2 (y MEN-3 si el recorte lo exige) antes de cerrar.
