# Informe de revision — TASK-035 (ronda 1)

- Commit revisado: 07aba35bdeabed109d8b7bbcf1b233cc50a9df98 (HEAD de la rama: 274029e, solo la peticion)
- Revisor: agente revisor independiente (general-purpose, metodo code-quality-reviewer)
- Veredicto: aprobada

## Resumen

Tarea solo de documentacion (5 SKILL.md, nada en `src/`). La politica escrita
coincide con A3 de `docs/auditoria/PLAN-SOLUCION-2026-10-03.md` y con A4
(una suite por ronda, mutantes con el test concreto, concurrencia reducida en
paralelo). No queda ninguna frase contradictoria en las 5 skills. Un solo
hallazgo MENOR, que no exige correccion.

| ID | Severidad | Estado | Fichero |
|---|---|---|---|
| M1 | MENOR | no se corrige (aceptado) | skills/code-quality-reviewer/SKILL.md, skills/csharp-autocad-ifc-reviewer/SKILL.md |

## Hallazgos

**M1 — MENOR. Dos revisoras no dicen el alcance de la ronda 2.**
`angular-vue-reviewer` y `java-spring-reviewer` llevan el parrafo nuevo
(«La ronda 2 solo se pide si se corrigio algun CRITICO o IMPORTANTE, y
entonces revisa el delta...»). `code-quality-reviewer` y
`csharp-autocad-ifc-reviewer` no tenian parrafo de rondas y siguen sin
tenerlo, asi que un revisor cargado solo con una de ellas no sabe por la
skill que en ronda 2 se limita al delta. No contradice nada (no habia «dos
rondas» que quitar, y el criterio de aceptacion solo pedia A3 en
`task-workflow`), y la autoridad de la politica es `task-workflow`; la
peticion de ronda 2 ya acota el diff. Se documenta; no bloquea.

### Comprobaciones sin hallazgo

- **Coherencia.** `grep -i -E "dos rondas|ronda 2|segunda ronda|suite (entera|completa)|dos veces|otra vez|rondas"`
  sobre las 5 skills: ningun «dos rondas» ni «ronda 2 obligatoria». Las
  apariciones de «suite entera» son el paso «Correr la suite entera...»
  inmediatamente matizado por el bloque «Una sola ejecucion por ronda», y
  «con la suite entera» dentro de ese mismo bloque (en negativo). «otra vez»
  solo aparece en «instalar y compilar otra vez tras cada cambio de rama»,
  que no es correr la suite. «tercera ronda» (code-quality, csharp) es la
  lista de «No aprueba por...», compatible.
- **A3.** Texto de la auditoria: sin CRITICO ni IMPORTANTE abiertos una
  ronda cierra; solo MENOR corregidos, sin ronda 2 (suite en verde y
  commit); ronda 2 solo revisa delta y hallazgos corregidos. `task-workflow`
  (parrafo **Rondas**) lo recoge punto por punto y anade la nota en
  `## Resultado`, coherente con la regla de documentar todos los hallazgos.
  A4: «El revisor corre la suite completa una vez; los mutantes, con el
  fichero de test concreto» esta en `task-workflow` y en las 4 revisoras
  (en forma generica «fichero o clase de test», correcto para skills que
  viajan a proyectos Java/C#/Angular).
- **Sin menciones al proyecto.** `grep -i -E "taskcode|opengis|docs/contexto|docs/auditoria|HALLAZGOS|ESTADO.md"`:
  solo aparecen `.taskcode/config.yml` y `taskcode/gitflow` (preexistentes,
  son nombres del propio plugin que el proyecto destino usa) y la palabra
  comun «hallazgos». El diff no anade ninguna. El test de marcas prohibidas
  pasa.
- **Parrafo eliminado de sincronizacion** («los ficheros derivados entran en
  el mismo commit que la tarea, asi que `git show HEAD` muestra...»): el paso
  3 de la lista que queda justo encima ya dice «Incluyen las rutas
  sincronizadas en el mismo commit (`git commit -m <msg> -- <rutas de tarea>
  <rutas sincronizadas>`)». La consecuencia sobre `git show HEAD` se deduce
  de ello. No se pierde informacion.
- **Tamano.** `task-workflow/SKILL.md` pasa de 502 a 503 lineas de fichero;
  el test 8 mide el cuerpo (sin frontmatter) contra 500 y pasa.

## Reproduccion

```
git clone -b feature/task-035-f1-t2-politica-de-rondas-y-una-sola-suit <repo> <tmp>/rev035
cd taskcode-marketplace/plugins/taskcode-plugin
npm install && npm run build          # build=0
timeout 600 node --test dist/test/skills/*.test.js
# tests 40, pass 40, fail 0 (21 s)
```

Mas los `grep` citados arriba sobre `skills/*/SKILL.md` del clon, y
`git show origin/develop:.../task-workflow/SKILL.md` para comparar el
parrafo eliminado. Suite completa no ejecutada, a proposito (tarea solo de
documentacion; politica A3/A4).
