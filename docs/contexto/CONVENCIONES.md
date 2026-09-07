# Convenciones de trabajo

Lo que en este proyecto se da por supuesto. No son preferencias estéticas:
casi todas salieron de algo que salió mal una vez.

## Git

- **Una rama por tarea**, creada por `taskctl start` (que a su vez invoca
  `scripts/gitflow/create-<tipo>.sh`). Nunca a mano.
- **Merge a `develop` con `--no-ff`**, siempre, para que el historial conserve
  la forma de cada tarea.
- **Las ramas no se borran** tras el merge. Política IECA: quedan para
  auditoría. Hoy hay 11 ramas vivas y así debe seguir.
- `main` solo recibe releases y hotfixes.
- Los mensajes de commit van **en español y sin tildes** (los scripts de
  Git-Flow procesan texto de commits).
- **Si `git status` te marca ficheros modificados sin que hayas tocado nada**,
  y `git diff` sale vacío: es el `.gitattributes` con `eol=lf` que llegó en
  TASK-031. Git no rematerializa lo que ya tenías, así que esos ficheros
  siguen en CRLF en disco. Se arregla con un `git add --renormalize .`, que no
  crea ningún commit — pero **prepara todo lo tracked**, así que revisa el
  índice después si tenías trabajo a medias. `git update-index
  --really-refresh` no sirve para esto.
  *(Cuándo aparece exactamente no está cerrado: la revisión de TASK-031 lo
  reprodujo por un camino y no por otros dos. Si te pasa, ya sabes qué es.)*
- Atribución al final de cada commit:
  ```
  Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
  ```

## Ciclo de una tarea de verdad

1. La tarea existe como carpeta en `tareas/00-planificadas/TASK-NNN/`.
2. Rama de trabajo creada con Git-Flow.
3. Implementación + tests reales.
4. `npm test` en verde **antes** de commitear.
5. Smoke test manual de punta a punta cuando la tarea toca el CLI o Git.
6. Commit de implementación.
7. **Revisión por pares con un agente independiente** (ver abajo).
8. Aplicar los hallazgos: CRÍTICO e IMPORTANTE siempre; MENOR si sale barato,
   y si no, documentarlo explícitamente sin corregir.
9. Actualizar el `tarea.md`: criterios marcados + sección `## Resultado`.
10. Actualizar `docs/PLAN_SPRINTS.md` (fila de métricas) y
    `docs/contexto/CHECKLIST_TERMINACION.md` (casilla + contadores).
11. Merge a `develop` con `--no-ff` y verificar que los tests siguen verdes.

## Revisión por pares

No es una lectura del diff. El revisor es un agente **independiente** del que
implementó, y su trabajo es **reproducir empíricamente**: clonar el repo a un
directorio temporal, correr la suite él mismo, y construir el caso que rompe
el código antes de reportarlo.

Clasificación: **CRÍTICO** (pérdida de datos, corrupción de estado, el comando
hace lo contrario de lo que dice) / **IMPORTANTE** (comportamiento incorrecto
en un caso real, no de borde) / **MENOR** (todo lo demás).

Todos los hallazgos se documentan en el `Resultado` de la tarea, **incluidos
los que se decide no corregir y por qué**. Un "sin hallazgos" explícito también
vale; lo que no vale es inventar hallazgos para tener algo que reportar.

## Tests

- `node:test` nativo, cero frameworks.
- **Siempre contra recursos reales**: repos Git temporales de verdad, incluido
  un segundo repo temporal haciendo de `origin` cuando hace falta. Nunca mocks
  de Git ni del filesystem.
- Los ficheros de fixture que un comando vaya a leer se escriben **fuera del
  repo bajo prueba** (si no, ensucian su workspace y disparan el guard de §8.3).
- Un test que no falla si el comportamiento cambia no es un test.

## Smoke test manual

Cuando la tarea toca el CLI empaquetado o Git, además de la suite:

```bash
git clone <repo> /tmp/smoke-NNN && cd /tmp/smoke-NNN
git config user.email "smoke@example.com" && git config user.name "Smoke"
git checkout <rama>
cd taskcode-marketplace/plugins/taskcode-plugin
npm install && npm run build     # node_modules/ y dist/test/ no se heredan de un clon
```

Y **rebuild otra vez** si cambias de rama dentro del mismo clon: cada rama
compila un `cli.ts` distinto.

## Código

- TypeScript estricto. Cero dependencias de runtime, a propósito.
- Reutilizar las abstracciones que ya existen (`moveTareaFile`, `isEexist` /
  `isEnoent`, `printCliError`) en vez de duplicar lógica.
- Diffs de lógica mínimos: acotados a lo que motiva la tarea, salvo que un
  criterio de aceptación exija corregir una precondición real.
- Los mensajes de error se dirigen a la persona y dicen **qué hacer**, no solo
  qué falló. Mismo estilo que `log_error` de los scripts de Git-Flow.

## Documentación

- `docs/PROPUESTA_METODOLOGIA.md` está **congelado** (v15). Si algo lo
  contradice, se documenta la divergencia; no se reescribe la metodología sin
  decisión explícita de Carlos.
- Cuando una tarea descubre algo que contradice el plan, se anota en el propio
  documento, no se calla.
- Nada se marca como hecho sin haberlo ejecutado.

## La paradoja de bootstrapping

Las 12 tareas ya terminadas (TASK-001 a TASK-012) siguen con
`estado: planificada` en su frontmatter y viven en `00-planificadas/`. No es un
error: no podían pasar por su propio comando hasta que ese comando existiera y
estuviera mergeado, y moverlas a mano contradiría el principio del sistema. El
trabajo real vive en las ramas y commits de Git. Qué hacer con ellas al final
es el item **E4** del checklist.
