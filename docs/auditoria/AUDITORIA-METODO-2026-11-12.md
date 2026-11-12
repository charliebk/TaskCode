# Auditoría independiente del método TaskCode — 2026-11-12

Auditoría **fuera del flujo de tareas**: no sale de ninguna TASK-NNN, no la
pidió ninguna fase ni la revisa ningún revisor del propio método. Juzga el
método (proceso + plugin), no una tarea concreta.

> El detalle paso a paso, con métricas de ToolsaWeb y OpenDockTrading, está en
> [`PASOS-PLUGIN-2026-11-12.md`](PASOS-PLUGIN-2026-11-12.md).

## 1. Alcance, datos y limitaciones

**Datos usados** (todo ejecutado, nada supuesto):

- `taskctl metricas --tokens` sobre este repo: 92 tareas con al menos una
  ronda de revisión (TASK-013 a TASK-109).
- La tabla `## Coste` de cada `tarea.md` (tokens por ronda) y los informes de
  revisión de TASK-095 a TASK-108 (veredicto y tabla de hallazgos por ronda).
- `git log` de las ramas de TASK-100 a TASK-108 (commits por tipo).
- `taskctl doctor` sobre el repo, tamaño de skills/agentes/código/tests.
- Las auditorías previas (`AUDITORIA-2026-10-03.md`,
  `INVENTARIO-AGILIDAD-2026-11-10.md`) como contexto, no como conclusión.

**Limitaciones, dichas de entrada:**

- La hace el mismo tipo de agente que construyó el método. Es independiente
  del flujo, no de la familia de modelos: un sesgo a favor de «más
  verificación» es posible y conviene contrastarlo con la persona.
- Solo datos de este repo. ToolsaWeb y OpenDockTrading entran a través del
  inventario del 2026-11-10, no se han vuelto a medir.
- Los tiempos son de reloj e incluyen esperas no registradas con `taskctl
  pausa` (TASK-109 marca 7 h 30 min «en curso» siendo `simple`).
- No hay registro de defectos escapados a producción: la calidad se mide por
  lo que la revisión caza, no por lo que se le escapa.

## 2. Veredicto ejecutivo

El método **funciona y caza fallos reales**: en TASK-100 a 108 la revisión
paró **6 CRÍTICOS y 4 IMPORTANTES** antes de integrar, y en TASK-101 y
TASK-103 la ronda 2 encontró **CRÍTICOS nuevos introducidos por la propia
corrección**. Eso justifica la revisión independiente y la ronda de
verificación tras corregir algo grave.

Pero hoy **paga una prima fija alta por cada tarea y por cada ronda**, y esa
prima ya no compra calidad en varios sitios medibles:

1. Rondas 2 abiertas **solo por MENORES**: 5 de las 9 tareas recientes con dos
   rondas; **ninguna** de esas rondas encontró nada nuevo; 22,6 M tokens.
2. La ronda «acotada» **no está acotada en coste**: en TASK-108 la ronda 2
   costó 13,5 M tokens frente a 4,9 M de la ronda 1.
3. La regla de una hora **trocea en tareas con sobrecoste fijo**: la
   verificación proporcional (TASK-096 + TASK-100 a 109) son 11 tareas,
   ~25 h y ~210 M tokens; ~90 % de sus commits son de proceso, no de código.
4. El propio repo **no usa los frenos que construye**: sin
   `comando_verificacion`, el freno `Stop`, la puerta de `finish` y el
   guardián de merges no actúan aquí.

Balance: **asertividad alta, agilidad mejorable sin tocar la asertividad**. La
mayoría de arreglos propuestos quitan coste donde los datos dicen que no hay
retorno, y dejan intacto lo que caza CRÍTICOS.

## 3. Lo que dicen los datos

Medianas por tramo de tareas (tiempo de punta a punta en minutos; tokens de
revisión y totales por tarea; `rev/total` = proporción de tokens que se va en
revisión):

| tramo | n | rondas | punta a punta | revisión (min) | CRIT | IMP | MEN | aprobadas a la 1.ª | tok revisión | tok total | rev/total |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 013–033 | 19 | 2 | 216 | 159 | — | — | — | 6/19 | 8,7 M | 30,9 M | 28 % |
| 034–060 | 27 | 1 | 31 | 16 | 2 | 20 | 130 | 18/27 | 14,6 M | 47,5 M | 31 % |
| 061–089 | 29 | 2 | 91 | 55 | 0 | 26 | 135 | 8/29 | 5,0 M | 7,2 M | 46 % |
| 090–099 | 7 | 2 | 70 | 40 | 0 | 7 | 18 | 2/7 | 5,3 M | 15,5 M | 28 % |
| 100–108 | 9 | 2 | 83 | 51 | 6 | 4 | 27 | 2/9 | 7,4 M | 20,6 M | 50 % |

(013–033: hallazgos sin tabla estructurada en la mayoría de informes; los
tokens tienen huecos en todos los tramos antiguos.)

**Tokens de revisión por ronda (TASK-095 a 108):**

| tarea | ronda 1 | ronda 2 | ronda 3 | qué abrió la ronda 2 | ¿halló algo nuevo la ronda 2? |
|---|---|---|---|---|---|
| 095 | 9,4 M | 2,0 M | | solo MENORES | no |
| 096 | 2,0 M | 3,3 M | | solo MENORES | no |
| 097 | 6,7 M | 1,1 M | | IMPORTANTES | — |
| 100 | 4,7 M | 1,4 M | | IMPORTANTE | — |
| 101 | 4,5 M | 0,9 M | 2,0 M | CRÍTICOS | **sí: 2 CRÍTICOS nuevos** |
| 102 | 17,0 M | 2,9 M | | solo MENORES | no |
| 103 | 5,5 M | 4,9 M | 3,3 M | IMPORTANTES | **sí: 2 CRÍTICOS nuevos** |
| 104 | 1,9 M | 0,9 M | | solo MENORES | no |
| 106 | 6,4 M | 6,1 M | | IMPORTANTE | no |
| 108 | 4,9 M | **13,5 M** | | solo MENORES | no |

Lectura: **la ronda 2 rinde cuando se corrigió un CRÍTICO o IMPORTANTE**
(2 de 4 casos con CRÍTICOS nuevos) y **no rinde cuando solo se corrigieron
MENORES** (0 de 5). La frontera que el método ya escribió en `revision.md` es
la correcta; el problema es que en la práctica no se aplica (ver M-1).

**Estimación de la regla de una hora** (estimada → real, min): 096 45→70,
100 75→64, 101 95→79, 102 55→120, 103 55→247, 104 50→56, 105 65→83,
106 70→178, 107 55→58, 108 55→131. **6 de 10 se pasan; 4 más del doble**
(TASK-103, ×4,5). La estimación sale casi siempre en 50-75 min: ancla en el
umbral de la propia regla en vez de medir.

**Proceso frente a código** (commits por tarea, TASK-100 a 108): 15-30
commits por tarea, de los que **1-3 son `feat`/`fix`/`test`**; el resto son
`chore`/`docs` del propio flujo (tarea creada, en diseño, coste, petición,
veredicto, autorrevisión, artefactos de cierre…). En Windows cada uno son
varios procesos `git` a ~0,15 s más los hooks.

## 4. Pros del método

1. **La revisión caza fallos reales y graves**, no estilo: 6 CRÍTICOS en
   TASK-100 a 108, todos en código de seguridad del flujo (guardián de
   merges, `comando-merge.ts`). Sin revisión independiente habrían llegado a
   `develop`.
2. **Cultura de evidencia de verdad**: repos Git reales, mutantes (20
   muertos en TASK-095), casos que rompen construidos antes de reportar,
   «sin hallazgos» explícito como respuesta válida.
3. **Trazabilidad completa y medible**: transiciones con instante UTC, coste
   por fase y ronda, informe por ronda con tabla estructurada. Esta auditoría
   se ha podido hacer en una sesión gracias a eso.
4. **Separación determinista / juicio**: el CLI hace estado, Git y gates; los
   agentes solo juzgan. Hace el flujo reproducible y barato de razonar.
5. **Se corrige a sí mismo con datos**: auditorías → fases de tareas → medir
   otra vez (0.1.2 a 0.14). Pocas metodologías tienen ese bucle cerrado.
6. **Ronda de verificación tras corregir lo grave**: los CRÍTICOS nuevos de
   TASK-101 y 103 nacieron de la corrección. Esa ronda vale lo que cuesta.
7. **Tope de rondas con decisión humana** tras la 3.ª: evita los bucles de 14
   rondas que se vieron en OpenDockTrading.
8. **Cero dependencias de runtime** y portabilidad Windows/Linux probada.

## 5. Contras y errores del método

Severidad con la misma escala del método, aplicada al proceso:
**CRÍTICO** = el método hace lo contrario de lo que dice o pierde garantías;
**IMPORTANTE** = coste o fallo real y recurrente; **MENOR** = el resto.

### M-1 (IMPORTANTE) — Dos reglas se contradicen y gana la cara

`revision.md`: «Los MENOR que se corrijan no abren ronda 2». Pero en modo
`automatico` rige «lo cerrado = lo revisado», y el orquestador convierte
cualquier MENOR corregido en `cambios-solicitados` (literal en
`TASK-108/revision/informe-revision-1.md`: el revisor propone
`aprobada-con-correcciones` y se registra `cambios-solicitados`).
Resultado: 5 de 9 rondas 2 recientes abiertas solo por MENORES, 0 hallazgos
nuevos, 22,6 M tokens. TASK-099 ya ataca esto, pero **espera «10 tareas
medidas con la 0.14.0» que ya existen**: TASK-100 a 108 son nueve con la
0.14.0 y la conclusión es inequívoca.

### M-2 (IMPORTANTE) — La ronda «acotada» tiene un suelo de coste fijo

Acotar el *diff* no acota el *coste*: el revisor clona, instala, compila y
corre la suite completa (~2030 tests, 10-25 min) en cada ronda. TASK-108:
ronda 2 = 2,8 × ronda 1; TASK-096 y 106: ronda 2 ≥ ronda 1. Mientras ese
suelo exista, cada ronda extra cuesta lo mismo que una completa.

### M-3 (IMPORTANTE) — El repo no usa sus propios frenos (dogfooding roto)

`taskctl doctor` en este repo: `[omitida] verificacion: sin
comando_verificacion: los frenos de verificacion no actuan`. La
`.taskcode/config.yml` solo declara `modo_flujo: automatico`. Las 11 tareas
de verificación proporcional (freno `Stop`, puerta de `finish`, guardián)
se construyeron sin que el propio flujo las ejerciera. Es el único proyecto
donde un fallo de esos frenos se vería antes que en ToolsaWeb.

### M-4 (IMPORTANTE) — La regla de una hora trocea con sobrecoste fijo

Cada fragmento paga entera la prima fija: alta, diseño con brainstorm
(0,4-1,4 M tokens, 3 agentes), ≥ 1 ronda de revisión con suelo fijo (M-2),
~20 commits de proceso, cierre con artefactos. TASK-096 → 11 tareas, ~25 h,
~210 M tokens para una funcionalidad («no correr la suite si solo cambia
documentación»). Y la estimación no protege: 6 de 10 fragmentos se pasan de
la hora, 4 más del doble. La regla reduce el tamaño del diff por revisión,
pero no hay dato de que reduzca el coste total; probablemente lo sube.

### M-5 (IMPORTANTE) — Punto caliente de CRÍTICOS por diseño frágil

Los 6 CRÍTICOS recientes caen en `src/core/comando-merge.ts` y el guardián
de merges: decidir si un comando de shell arbitrario «es un merge» a partir
de su texto. Es un problema abierto (alias, `git -c`, `&&`, subshells,
variables) y cada corrección abre otro hueco (los CRÍTICOS «NUE» de la
ronda 2). Más revisión no lo cierra; un mecanismo distinto sí podría (ver
S-5).

### M-6 (IMPORTANTE) — La documentación de arranque está desfasada

`CLAUDE.md` manda leer primero `ESTADO.md`, cuya cabecera dice «Última
actualización: 2026-10-05» (38 días y ~50 tareas atrás). Más deriva:
`CLAUDE.md` dice ~1290 tests (hay ~2030 `test(`/`it(`); `CONVENCIONES.md`
dice «hoy hay 11 ramas vivas» (hay 199) y su paso 10 sigue mandando editar
el ROADMAP a mano, que desde TASK-098 se genera. Un agente que arranca
obedeciendo `CLAUDE.md` empieza con un mapa falso.

### M-7 (MENOR) — `doctor` da ERROR en un repo sano

Git no versiona carpetas vacías: `tareas/01-en-diseno` no existe en el
repo y `doctor` responde `[ERROR] ... Corrige los errores antes de trabajar`.
Cualquier clon limpio lo verá. O es un aviso, o la carpeta lleva `.gitkeep`.

### M-8 (MENOR) — Ruido estructural que el tablero arrastra

TASK-001 a 012, TASK-019 (descartada) y TASK-021 siguen en
`00-planificadas/` con `estado: planificada`: el «item E4» de la paradoja de
bootstrapping nunca se cerró. Y 199 ramas vivas por la política IECA.

### M-9 (MENOR) — La complejidad declarada sigue sin predecir

TASK-103 `simple`: 4 h 07 min, 3 rondas, 2 CRÍTICOS. TASK-109 `simple`:
7 h 30 min en curso. Ya lo detectó la auditoría del 2026-10-03 y se
recalibró; sigue sin discriminar. La complejidad decide cuántos agentes de
diseño se lanzan, así que el error cuesta en los dos sentidos.

### M-10 (MENOR) — Burocracia en el historial

~90 % de commits de proceso por tarea. No rompe nada, pero encarece cada
transición en Windows, ensucia `git log` para quien audite y multiplica
los puntos donde el guard de workspace limpio puede saltar.

### M-11 (MENOR) — Métricas de tiempo contaminadas por esperas

Sin `taskctl pausa`, una noche cuenta como trabajo (TASK-109). Las medianas
lo amortiguan, pero las comparaciones entre versiones con pocas tareas
(0.13: n=2 en ToolsaWeb) no lo aguantan.

### M-12 (MENOR) — Peso de instrucciones por ronda

Una ronda carga `revision.md` (12,7 KB) + la skill revisora (14-22 KB) +
petición (10-18 KB) + contexto. Con dos revisores por ronda, ~60-80 KB de
instrucciones antes de leer una línea del diff.

## 6. Agilidad frente a asertividad

**Dónde está el valor de asertividad (no tocar):**

- La **ronda 1 independiente** con reproducción empírica.
- La **ronda de verificación tras corregir CRÍTICO o IMPORTANTE**: es donde
  aparecen los fallos introducidos por la corrección (TASK-101, 103).
- Los **revisores de dominio** (63 de 88 CRÍTICO/IMPORTANTE de dominio en
  ficheros que el genérico no marcó, inventario del 10-11).
- La **verificación completa antes de integrar código**.

**Dónde se pierde agilidad sin retorno medido (recortar):**

- Rondas 2 abiertas solo por MENORES (M-1): 0 de 5 con hallazgos.
- Suite completa en cada ronda de verificación (M-2): la completa ya la
  exige la puerta de `finish`.
- Prima fija repetida por fragmentar (M-4).
- Commits y artefactos de proceso por paso (M-10).

**Regla de equilibrio propuesta** (cabe en una línea de la skill):

> Se paga una ronda completa por tarea; se paga una ronda de verificación
> por cada CRÍTICO o IMPORTANTE corregido; los MENORES corregidos se
> verifican con la suite selectiva del implementador y se anotan, sin
> revisor; la suite completa se corre una vez, antes de integrar.

Con los datos de TASK-095 a 108 esa regla habría ahorrado ~22,6 M tokens
(rondas 2 por MENORES) más la parte fija de las rondas de verificación
restantes, **sin perder ninguno de los 6 CRÍTICOS** (todos salieron en
rondas que la regla conserva).

## 7. Sugerencias de mejora (estratégicas)

- **S-1. Cerrar TASK-099 ya, con los datos de este repo.** La condición de
  «10 tareas con la 0.14.0» está prácticamente cumplida (9 aquí, más
  OpenDockTrading TASK-067) y el resultado es unánime.
- **S-2. Ronda de verificación ligera de verdad.** Desde la ronda 2: sin
  clon nuevo si el anterior sigue en la carpeta de pruebas; verificación
  selectiva (`comando_verificacion_selectiva`) en vez de completa; lectura
  limitada al delta y a los hallazgos. Objetivo medible: ronda 2 ≤ 30 % de
  la ronda 1 en tokens.
- **S-3. Épica con plan único en vez de N tareas completas.** Cuando la
  regla de una hora trocea, que los fragmentos compartan un único plan y
  brainstorm (el de la épica), que cada fragmento sea un *incremento* con su
  ronda acotada y que haya un solo `finish`/integración al final, o uno por
  fragmento sin repetir diseño. Medir contra TASK-100 a 109.
- **S-4. Estimar desde datos, no desde el umbral.** Que `plan` proponga la
  estimación a partir de la mediana real de tareas parecidas (etiquetas,
  ficheros tocados, complejidad) y la muestre junto a su error histórico.
- **S-5. Replantear la detección de merges.** En vez de interpretar texto de
  shell, apoyarse en Git: hook `pre-merge-commit` para merges con commit,
  `reference-transaction` para movimientos de `develop`/`main` (cubre
  fast-forward), o comprobar al final del turno que la punta de la rama
  protegida solo se ha movido por `taskctl`. El parser de comandos quedaría
  como aviso temprano, no como garantía.
- **S-6. Agrupar los commits de proceso.** Un commit por transición de fase
  (o `--amend` del de metadatos dentro de la misma fase), no uno por
  artefacto. Menos procesos, historial legible.
- **S-7. Documentación de arranque generada.** Que las cifras de
  `ESTADO.md`/`CLAUDE.md` (tareas, tests, versión, ramas) las escriba
  `taskctl` como el ROADMAP, o que se quiten de los documentos a mano. Y un
  aviso de `doctor` cuando `ESTADO.md` tenga más de N días o N tareas de
  atraso.
- **S-8. Medir escapes, no solo capturas.** Etiquetar en cada `fix` si
  corrige algo que pasó una revisión aprobada (`escapado-de: TASK-NNN`). Sin
  eso, «la revisión es necesaria» y «la revisión sobra» no se pueden
  distinguir con datos.
- **S-9. Detectar esperas sin `pausa`.** Huecos sin commits ni transiciones
  de más de N minutos se descuentan (o se marcan) en las métricas.

## 8. Lista de arreglos

Prioridad: **P1** = esta semana, retorno claro; **P2** = siguiente versión;
**P3** = cuando toque. Tamaño: **S** < 2 h, **M** medio día, **L** > 1 día.

| # | Prio | Sev | Arreglo | Evidencia | Tamaño |
|---|---|---|---|---|---|
| F-1 | P1 | IMP | Que en `automatico` un MENOR corregido **no** convierta el veredicto en `cambios-solicitados`: se verifica con la selectiva del implementador y se anota (TASK-099, sin esperar más datos) | M-1; 5/5 rondas 2 por MENORES sin hallazgos, 22,6 M tokens | M |
| F-2 | P1 | IMP | Declarar `comando_verificacion` (y la selectiva) en `.taskcode/config.yml` de TaskCode | M-3; `doctor` lo marca omitido | S |
| F-3 | P1 | IMP | Actualizar `ESTADO.md` (o reducirlo a un puntero a ROADMAP/CHANGELOG), las cifras de `CLAUDE.md` y `CONVENCIONES.md` (ramas, paso 10 del ROADMAP generado) | M-6 | S |
| F-4 | P1 | MEN | `.gitkeep` en las cinco carpetas de estado, o `doctor` lo baja a aviso y los comandos crean la carpeta | M-7; `doctor` da ERROR hoy | S |
| F-5 | P2 | IMP | Ronda ≥ 2 con selectiva en vez de completa y reutilizando el clon; objetivo ronda 2 ≤ 30 % de la ronda 1 | M-2; TASK-108 r2 = 2,8 × r1 | M |
| F-6 | P2 | IMP | Rediseño del guardián de merges sobre hooks de Git / comprobación de punta de rama; el parser queda como aviso | M-5; 6 CRÍTICOS en el mismo módulo en 2 tareas | L |
| F-7 | P2 | IMP | «Épica con plan único»: fragmentos que heredan plan y brainstorm de la épica y no repiten diseño | M-4; 11 tareas, ~25 h, ~210 M tokens | L |
| F-8 | P2 | MEN | Estimación de `plan` basada en la mediana histórica de tareas parecidas, con su error | M-4/M-9; 6/10 estimaciones excedidas, 4 más del doble | M |
| F-9 | P2 | MEN | Un commit por transición de fase en vez de uno por artefacto | M-10; 1-3 de 15-30 commits son código | M |
| F-10 | P3 | MEN | Cerrar el item E4: mover TASK-001..012 y 021 a terminadas y TASK-019 a una carpeta o estado de descartadas | M-8 | S |
| F-11 | P3 | MEN | Archivar ramas mergeadas como `refs/archive/*` o tags (mantiene la auditoría IECA sin 199 ramas vivas) — **decisión de Carlos** | M-8 | S |
| F-12 | P3 | MEN | Etiqueta `escapado-de: TASK-NNN` en los `fix` y su columna en `metricas` | S-8 | S |
| F-13 | P3 | MEN | Descontar huecos largos sin actividad en las duraciones | M-11 | S |
| F-14 | P3 | MEN | Aviso de `doctor` por `ESTADO.md` desfasado | M-6/S-7 | S |
| F-15 | P3 | MEN | Recortar lo común repetido entre `revision.md` y las skills revisoras grandes (rust-wasm 22 KB, angular-vue 20 KB) | M-12 | M |

(F-16 a F-18 salen de TASK-109: ver la sección 11.)

**Orden recomendado:** F-16 (es un hueco de garantía, no de coste), F-2, F-4, F-3 (una hora entre las tres, quitan ruido
y riesgo inmediato) → F-1 (el mayor ahorro sin pérdida de calidad) → F-5 →
F-6 → F-7 y F-8 juntos → el resto.

## 9. Lo que no recomiendo cambiar

- La revisión independiente con reproducción empírica en la ronda 1.
- La ronda de verificación tras corregir CRÍTICO o IMPORTANTE.
- Los revisores de dominio.
- La verificación completa antes de integrar código.
- Tests contra recursos reales, sin mocks.
- El tope de rondas con decisión humana.
- El registro de transiciones y costes: es lo que hace auditable el método.

## 10. Decisiones que son de la persona

1. **F-1**: aceptar que un MENOR corregido se integre sin que lo vea un
   revisor (solo suite selectiva + nota). Es el mayor ahorro y el único
   punto donde «lo cerrado = lo revisado» se relaja.
2. **F-7**: cambiar la regla de una hora de «trocear en tareas» a «trocear
   en incrementos de una épica».
3. **F-11**: si la política IECA admite refs de archivo en lugar de ramas.

## 11. Las dos tareas abiertas: TASK-109 y TASK-099

### TASK-109 (en revisión, ronda 1 con `cambios-solicitados`)

Última parte de la épica TASK-096. Es una tarea de **documentación y
limpieza**, declarada `simple`, y es la **más cara de toda la épica**: 2,6 M
tokens de diseño, 17,0 M de implementación y 20,5 M en la ronda 1, unos 40 M
en total con la ronda 2 todavía por delante. Lleva 12 commits y 962 líneas
añadidas. Con ella, la épica pasa de unos 210 M a **unos 230 M tokens**.
Las 7 h 30 min «en curso» son una noche (de 01:07 a 08:38 UTC) sin
`taskctl pausa` (M-11).

Lo importante es lo que encontró la revisión. Al comparar la documentación con
el código salieron **dos huecos en la garantía de la propia épica**:

- **IMP-1:** con el nivel 2, la cobertura de una tarea que se integró con la
  selectiva **no se compara con el umbral en ningún sitio**. La completa del
  release solo mide lo que añade la rama de release, y el revisor lo
  reprodujo con el `dist` compilado. Su origen es `especificacion`.
- **IMP-2:** el arreglo documentado tras un conflicto en `finish` es
  resolverlo en `develop` y relanzar. Por ese camino se entra en la vía
  idempotente de `finish`, que **no ejecuta ninguna puerta de
  verificación**, y el guardián no ve el `git commit` que cierra el merge.
  Es decir: hay una manera documentada de integrar código sin verificar. El
  revisor lo leyó en el código pero no lo ejecutó de punta a punta.

IMP-2 ya está reproducido: ver «F-16 reproducido» más abajo.

Los dos se han «corregido» **cambiando el texto, no el código**. Para la
documentación es lo correcto. Pero la garantía «no se integra código sin
verificar» sigue con esos dos agujeros, y ninguna tarea los recoge.

**F-16 reproducido de punta a punta (2026-11-12).** Lo probé en un clon de
`develop` (`56cf96b`) en la carpeta de pruebas, con un test de repo temporal
que usa los mismos helpers que `finish-verificacion.test.ts`, los scripts de
Git-Flow reales y un `comando_verificacion` que cuenta sus ejecuciones:

- **Caso A, merge a mano fuera de `finish`.** Con la verificación en rojo,
  alguien hace `git checkout develop && git merge --no-ff <rama>` desde un
  terminal (donde el guardián no actúa) y luego `taskctl finish`. Resultado:
  `cierre = terminada`, **0 ejecuciones de la verificación**, tarea en
  `04-terminadas`.
- **Caso B, el camino documentado tras un conflicto.** El primer `finish`
  verifica la rama (1 ejecución, en verde), el merge choca en `comun.txt` y
  el repo queda en `develop` con `MERGE_HEAD`. El guardián, ante
  `git commit --no-edit`, `git add -A && git commit -m ...` y
  `git commit -am ...`, devuelve **código 0 en los tres**: deja pasar el
  commit que cierra el merge. Se resuelve con contenido roto y la
  verificación pasa a rojo. El segundo `finish` entra por la vía de
  reintento: `cierre = terminada` y **sigue habiendo 1 sola ejecución**. La
  resolución rota queda en `develop` y la tarea, cerrada.

Causa: en [finish.ts:535](../../taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts)
la rama `integradaEnDevelop && integradaEnMain` no llama a `puerta()`, y
el guardián reconoce los comandos `merge`, pero no el `commit` que termina
un merge en curso. **F-16 sube a CRÍTICO**: en el caso B el método hace lo
contrario de lo que dice («no se integra código sin verificación en
verde») por un camino que su propia documentación recomienda.

| # | Prio | Sev | Arreglo | Evidencia | Tamaño |
|---|---|---|---|---|---|
| F-16 | P1 | **CRIT** | (a) La vía de reintento de `finish` verifica el árbol de la rama de integración antes de cerrar, o aborta si no hay un verde de ese árbol. (b) El guardián trata como merge un `git commit` con `MERGE_HEAD` presente en `develop`/`main`. (c) La guía cambia el remedio: `taskctl abort-merge`, integrar la base en la rama de la tarea y relanzar `finish` desde ella. Los dos casos de arriba, convertidos en tests de regresión | Reproducido: casos A y B | M |
| F-17 | P2 | IMP | Medir de verdad la cobertura del código integrado con la selectiva (en el release, desde el tag anterior), o declarar que el nivel 2 no es compatible con `umbral_cobertura` | IMP-1 de TASK-109 | M |
| F-18 | P3 | MEN | Medir el límite de tamaño de `SKILL.md` sobre el fichero normalizado a LF, o subirlo con margen: hoy quedan 8 bytes (15352 de 15360 con CRLF) | MEN-4 de TASK-109 y el commit `adc87aa` | S |

Sobre la ronda 2 de TASK-109: está justificada, porque se corrigieron dos
IMPORTANTES y la regla de la sección 6 la mantiene. Además, F-16 es otro caso
de M-5: el guardián decide por el texto de los comandos y no por el estado
real de la rama.

### TASK-099 (planificada, sin empezar)

Ataca exactamente M-1/F-1 y sus criterios 2 a 4 encajan con la regla de la
sección 6. Tiene dos problemas de planteamiento:

- **Su criterio 1 la bloquea con datos de fuera.** Pide medir al menos 10
  tareas con la 0.14.0 «en ToolsaWeb y OpenDockTrading» y deja fuera los
  datos de TaskCode, donde TASK-100 a 108 (nueve tareas con la 0.14.0) ya
  dan el resultado: 5 de 5 rondas 2 abiertas solo por MENORES sin ningún
  hallazgo nuevo, 22,6 M tokens. Si esos proyectos tardan en cerrar diez
  tareas, el arreglo con más retorno de esta auditoría se queda parado.
  **Propuesta:** que el criterio 1 cuente también las tareas de TaskCode, y
  que la decisión de seguir o descartar se tome ya con esta tabla.
- **Su alcance se queda corto.** Habla de «tras aprobada-con-correcciones».
  El caso medido es más amplio: el revisor propone
  `aprobada-con-correcciones`, la sesión registra `cambios-solicitados` solo
  por MENORES (TASK-108, ronda 1) y se abre una ronda acotada cuyo coste no
  está acotado (M-2). El criterio 2 ya excluye la ronda acotada, que es lo
  correcto. Conviene añadir un test con ese caso exacto: veredicto propuesto
  frente a veredicto registrado.

Su complejidad `media` parece razonable. Por la regla de una hora y por M-4,
lo mejor es que no se trocee: es un cambio de reglas en `veredicto`/`review`
con sus tests, no una épica.
