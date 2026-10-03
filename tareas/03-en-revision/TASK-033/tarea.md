---
id: TASK-033
titulo: "Comando de sincronización tras cada transición y guía de criterios post-cierre (v0.1.1)"
tipo: fix
sprint: 0
etiquetas: [plugin, config, skill, correccion]
complejidad: media
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: fix/task-033-comando-de-sincronizacion-tras-cada-tran
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-10-03
actualizado: 2026-10-03
dependencias: []
---
## Objetivo

Corregir dos huecos que ha destapado el primer proyecto externo que usa el
plugin (OpenGisViewer, TASK-003), y publicarlos como versión de corrección
**0.1.1**.

### 1. Los artefactos derivados del estado de las tareas se desincronizan en cada transición

OpenGisViewer genera la sección de seguimiento de su `PLANIFICACION.md`
(«§12») a partir del frontmatter de `tareas/**/tarea.md` con su propio
script (`node scripts/sync-plan.mjs`), y el CI lo vigila con
`pnpm check:plan`. Los commits automáticos de `approve`, `start`, `review` y
`finish` mueven la tarea pero no pueden saber que existe ese fichero, así
que **después de cada transición el plan queda desincronizado** y hay que
hacer un commit manual `docs(plan): sincronizar §12 ...`. En TASK-003 fueron
tres, uno detrás de cada paso.

**El arreglo natural desde el proyecto no funciona, y es por culpa del
plugin.** Un hook de pre-commit que ejecute el script y haga `git add` del
fichero sí mete el fichero en el commit. Pero como `autoCommit` commitea en
modo `--only` (`git commit -m <msg> -- <rutas>`), el `git add` del hook va a
parar al índice temporal y **el índice real se queda con el contenido
antiguo**. Reproducido en un repo temporal: después del commit, `HEAD` y el
árbol tienen el valor nuevo, el índice el viejo, y `git status` marca `MM`.
Ese workspace sucio hace que el **siguiente** comando de `taskctl` aborte en
el guard de la §8.3. Además, `autoCommit` avisa de «ficheros intrusos» en
cada transición.

Arreglo decidido (2026-10-03): dos claves opcionales nuevas en
`.taskcode/config.yml`:

- un **comando de sincronización** que cada comando que mueve o reescribe
  una tarea ejecuta después de escribir sus ficheros y antes de su
  auto-commit;
- la **lista de rutas** que ese comando reescribe, que entran en el mismo
  commit que las de la tarea (la regla 1 de `git-commit.ts` sigue en pie:
  solo se commitean rutas declaradas, nunca un `add -A` global).

Sin claves, el comportamiento es idéntico al de hoy (regla 1 de
`config.ts`). Los nombres exactos de las claves, la semántica de fallo del
comando (¿se aborta o se commitea la tarea y se avisa?), cómo se invoca en
Windows (`shell`) y qué comandos lo disparan los decide el brainstorm.

### 2. No hay sitio para los criterios que solo se verifican después de `finish`

Algunos criterios de aceptación solo se pueden demostrar después de que
`taskctl finish` fusione en `develop`: un CI en verde en un push a
`develop`, publicar `main` adelantándolo a `develop` y ver su ejecución. La
skill exige criterios marcados antes de cerrar, y TASK-003 tuvo que
improvisarlo como «divergencia de orden» en su `tarea.md`.

Arreglo decidido (2026-10-03): **solo guía en `skills/task-workflow/SKILL.md`**,
sin tocar `src/` (`finish` no comprueba las casillas en código). Debe cubrir
cómo declarar un criterio post-cierre en `tarea.md`, cuándo y por quién se
verifica, y dónde queda la evidencia. Como la skill viaja a otros proyectos,
no puede mencionar TaskCode, sus rutas ni el nombre del proyecto externo.

### 3. Versión de corrección

`package.json` y `.claude-plugin/plugin.json` del plugin pasan de `0.1.0` a
`0.1.1`, y la entrada del marketplace también si declara la versión. Ojo: el
tag `v0.1.0` y `main` no reflejan lo que hay hoy en `develop` (`main` es solo
el commit inicial). Cómo se publica 0.1.1 —tag sobre `develop` o release a
`main`— se decide en el plan.

## Criterios de aceptacion
- [ ] Con las claves nuevas configuradas, `approve`, `start`, `review` y `finish` ejecutan el comando de sincronización y las rutas declaradas entran en **su mismo** commit automático. Test contra un repo Git real con un script que reescribe un fichero a partir de `tareas/`.
- [ ] Después de cada una de esas transiciones, `git status --porcelain` sale vacío: no queda el `MM` del hook de pre-commit y el siguiente comando no aborta en el guard de la §8.3. Test que encadena `approve → start → review` sin commits manuales en medio.
- [ ] Sin las claves, el comportamiento es idéntico al de hoy: la suite existente pasa sin tocar sus expectativas.
- [ ] Un comando de sincronización que falla (exit ≠ 0) o que toca rutas no declaradas no se traga en silencio. La semántica exacta sale del plan y tiene test de contraprueba.
- [ ] Una clave mal escrita o con un valor inválido aborta con la lista de claves válidas, igual que las tres que ya existen (fallo cerrado).
- [ ] `SKILL.md` documenta las dos claves nuevas y la guía de criterios post-cierre. Los tests de «no mencionar el proyecto» siguen en verde.
- [ ] Versión 0.1.1 en `package.json` y `plugin.json` (y en el marketplace si la declara). Entrada en `CHANGELOG.md`.
- [ ] Verificación de extremo a extremo en OpenGisViewer (o en un clon desechable suyo): con las claves configuradas, una transición deja `pnpm check:plan` en verde sin commit manual.
