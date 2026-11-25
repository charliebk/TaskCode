# Plan — TASK-168: un cambio solo en md de skills o agentes se verifica con sus tests

(Modo rapido: el plan lo redacta el coordinador.)

## Enfoque propuesto

Duracion estimada: 50 min (de la rama abierta al cierre con merge; senales: 1 fichero de codigo —`scripts/verificar-impacto.mjs`— y su test, 1 capa, 3 criterios; toca `scripts/`, asi que finish corre la completa una vez)

Medido en el repo (2026-11-25): de los 25 tests que hoy "leen la carpeta
skills/", 7 solo la mencionan en un comentario (`test/skills/revisores.test.ts`
citado en `test/helpers/review-fixtures.ts`, `review-dominios`, `cli-main`,
`distribucion`...) por el patron `['"/]skills\/`, y uno de ellos es un helper
que importan 15 tests de comandos: de ahi los ~1800 tests y 25-30 min.

1. `CARPETAS_LEIDAS`: `skills` y `agents` casan solo con la forma real de leer
   la carpeta, la cadena entre comillas (`'skills'`, `"skills/..."`), no con
   cualquier `/skills/` (que tambien es `test/skills/` en un comentario).
2. Para un `.md` cuyo nombre es generico (`SKILL.md`), "lo nombra" exige
   tambien la carpeta de esa skill (`'plan'` o `plan/SKILL.md`), no cualquier
   mencion de `SKILL.md`.

## Reutilizacion (Regla 4D)

- `CARPETAS_LEIDAS`, `carpetaLeida` y el bucle de seleccion de `scripts/verificar-impacto.mjs` — se ajustan; nada nuevo en paralelo. Usos buscados: `CARPETAS_LEIDAS` solo ahi; `porNombre` solo en ese bucle.
- `conRepo`, `cambiarYCommitear`, `listar`, `ficheros` y la plantilla de repo de `test/scripts/verificar-impacto.test.ts` (TASK-156) — el test nuevo usa ese repo miniatura con dos ficheros mas.

## Riesgos aceptados y que los contiene

- Un test que leyera la carpeta con una ruta sin comillas (`${X}/skills/`) dejaria de elegirse — en el repo ninguno lo hace (comprobado con grep); la suite completa antes de publicar lo cubre.
- Una skill cuyo nombre de carpeta sea una palabra comun (`plan`, `review`) puede elegir algun test de mas — prefiere de mas a de menos.

## Plan de pruebas

Tests nuevos por criterio (presupuesto de 1 a 3 por criterio; si se pasa, el motivo):

- Criterios 1 a 3: 1 test en `test/scripts/verificar-impacto.test.ts` con el repo miniatura: un test de comandos que solo cita `test/skills/...` en un comentario no se elige; uno que nombra otra skill con `SKILL.md` tampoco; el que nombra esta skill y los lectores reales si. El test de TASK-156 sigue igual. Sin pesados.

## Lo que necesita decision de una persona

Nada abierto: decision de Carlos (2026-11-25, agilidad).
