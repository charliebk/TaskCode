---
id: TASK-033
titulo: "Comando de sincronización tras cada transición y guía de criterios post-cierre (v0.1.1)"
tipo: fix
sprint: 0
etiquetas: [plugin, config, skill, correccion]
complejidad: media
modelo_sugerido: sonnet
estado: terminada
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
- [x] Con las claves nuevas configuradas, `approve`, `start`, `review` y `finish` ejecutan el comando de sincronización y las rutas declaradas entran en **su mismo** commit automático. Test contra un repo Git real con un script que reescribe un fichero a partir de `tareas/`.
- [x] Después de cada una de esas transiciones, `git status --porcelain` sale vacío: no queda el `MM` del hook de pre-commit y el siguiente comando no aborta en el guard de la §8.3. Test que encadena `approve → start → review` sin commits manuales en medio.
- [x] Sin las claves, el comportamiento es idéntico al de hoy: la suite existente pasa sin tocar sus expectativas.
- [x] Un comando de sincronización que falla (exit ≠ 0) o que toca rutas no declaradas no se traga en silencio. La semántica exacta sale del plan y tiene test de contraprueba.
- [x] Una clave mal escrita o con un valor inválido aborta con la lista de claves válidas, igual que las tres que ya existen (fallo cerrado).
- [x] `SKILL.md` documenta las dos claves nuevas y la guía de criterios post-cierre. Los tests de «no mencionar el proyecto» siguen en verde.
- [x] Versión 0.1.1 en `package.json` y `plugin.json` (y en el marketplace si la declara).
- [x] Verificación de extremo a extremo en OpenGisViewer (o en un clon desechable suyo): con las claves configuradas, una transición deja `pnpm check:plan` en verde sin commit manual.

### Tras el cierre

(Se verifican después de `taskctl finish`; la primera tarea que usa la guía nueva de la skill.)
- [x] Entrada `## 0.1.1` en `CHANGELOG.md` (la línea de la tarea la escribe `finish`). Commit 5d27867.
- [x] Tag anotado `v0.1.1` sobre el merge en `develop`, subido a origin junto con `develop`. Verificado: `claude plugin update` pasó la instalación de 0.1.0 a 0.1.1.
- [x] Aviso de actualización dejado en OpenGisViewer (su TASK-096), commit 04c3656 en su `develop` local, sin subir.

## Resultado

**Implementado.** Tres claves opcionales en `.taskcode/config.yml`
(`comando_sincronizacion`, `rutas_sincronizacion`, `timeout_sincronizacion`,
60 s por defecto), validadas al cargar con fallo cerrado. `autoCommit` ejecuta
el comando antes del primer `git add` y mete sus rutas en el mismo commit; así
los 8 comandos que commitean lo heredan desde un único punto
(`src/fs/sincronizacion.ts` + el gancho en `git-commit.ts`). La transición
nunca se aborta por la sincronización: en los tres desenlaces en que no se
aplica (ruta declarada con cambios previos; comando que falla, expira o deja
rutas que Git no puede commitear; comando que toca ficheros no declarados), la
tarea se commitea igual, se avisa y `taskctl` sale con **código 3**. Guía de
criterios post-cierre en la skill (`### Tras el cierre`), sin tocar `src/`.
Versión 0.1.1 en `package.json`, `plugin.json`, `marketplace.json` (las dos
entradas), `cli.ts` y README.

**Evidencia.** Suite completa final (tras la ronda 2): 893 tests, 890 en verde, solo los 3 rojos conocidos de Windows; cobertura total 98,3 %. Antes, una pasada intermedia dio 892 tests, 888 en verde: los 4 rojos eran los
3 conocidos de Windows más el test MEN-3, que fallaba solo bajo la carga de
la suite y se corrigió en 274529c (24/24 en verde en los ficheros de
sincronización). De extremo a extremo en un clon desechable de OpenGisViewer, con
`TASK-094`: `plan`, `approve` y `start` salen con 0, `PLANIFICACION.md` va en
el commit de cada transición, el árbol queda limpio y
`node scripts/sync-plan.mjs --check` sale en verde tras cada paso. El mismo
clon confirmó que el `develop` real de OpenGisViewer está hoy desincronizado.

**Lo que destapó la implementación, antes de la revisión.**
- El arreglo obvio desde el proyecto (hook de pre-commit) deja el índice en
  `MM`: reproducido en un repo temporal, es la razón de la tarea.
- `spawnSync` con `timeout` y `shell: true` en Windows mata `cmd.exe` pero deja
  vivo el `node` nieto (riesgo 6 del brainstorm, confirmado con un `EBUSY`).
  De ahí el envoltorio que mata el árbol.
- La sección de la skill redactada por el agente de documentación afirmaba
  cosas falsas (que `finish` comprueba las casillas, el mecanismo del hook al
  revés, el `#` atribuido al shell). Corregidas; y la trampa «la herramienta
  no commitea lo que genera», desfasada desde C2, reescrita.

**Revisión ronda 1: aprobada con correcciones** (1 importante, 2 menores; 6
mutantes, todos en rojo). Todos corregidos en c8ba509:
- IMP-1: una ruta declarada ignorada o con otras mayúsculas tumbaba la
  transición. Ahora se detecta antes (`check-ignore`, nombre real en disco) y
  hay una segunda barrera en `autoCommit`. Al corregirlo apareció un fallo
  nuevo **en la propia corrección**, cazado antes de commitear: restaurar por
  la ruta declarada habría **borrado** el fichero versionado en Windows. La
  restauración trabaja ahora con el nombre real.
- MEN-2: un script que sale con 124 ya no se describe como timeout (marca en
  stderr).
- MEN-3: test de que el timeout mata al nieto. **Al mutarlo, taskctl se colgó
  30 min**: con un kill fallido, los huérfanos retenían las tuberías heredadas.
  La salida del envoltorio va ahora a ficheros temporales, y el mutante cae en
  la aserción («el nieto sigue vivo»).

**Revisión ronda 2: aprobada con correcciones** (solo el delta; 0 críticos,
0 importantes, 4 menores). Corregidos en f9279cb:
- el chequeo (a) no veía trabajo sin commitear si la ruta declarada tenía
  otras mayúsculas: ahora mira también el nombre real en disco (con test);
- doble `closeSync` del mismo fd en `lanzarEnvoltorio`.
De paso, la skill seguía diciendo que `codex-review` no existe (falso desde
TASK-020, hallazgo B3 de la auditoría lanzada en paralelo): corregido.

Sin corregir, documentados:
- La segunda barrera de `autoCommit` (fallo al preparar una ruta que
  `motivoNoCommiteable` no prevé) no tiene test propio. El revisor la ejercitó
  a mano con una ruta dentro de un repo Git anidado: la transición no se
  aborta, pero `restaurarAHead` deja el repo interior con el fichero borrado y
  el aviso dice «como en HEAD». Es un caso muy raro y es mejor que antes, cuando
  la transición se abortaba entera.
- En POSIX, si el comando borra la ruta declarada y existe un fichero hermano
  que solo cambia en mayúsculas, se informaría un falso error de mayúsculas.
  Solo visto leyendo el código; muy improbable.

**Sin corregir, a propósito.** Los conflictos en las líneas de recuento del
fichero derivado en los merges de `review`/`finish` (riesgo 2): solo
documentados, decisión de Carlos al aprobar el plan.
