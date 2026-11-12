# Peticion de revision — TASK-122 (ronda 1)

- Tarea: TASK-122 — Coste por tarea independiente del tamano del proyecto
- Rama revisada: feature/task-122-coste-por-tarea-independiente-del-tamano
- Rama base: develop
- Commit revisado (HEAD): dc5f692f8ef436c59b547276b3190196fabecd98
- Fecha: 2026-11-12
- Agente a lanzar: general-purpose (modelo sugerido: sonnet)
- Skill revisora a cargar: code-quality-reviewer
- Carpeta de la tarea: tareas/03-en-revision/TASK-122 (criterios de aceptacion y plan)
- Alcance: completa (motivo: primera ronda de revision)

## Instrucciones para el agente revisor

Eres un revisor INDEPENDIENTE del agente que implemento. Tu trabajo es
reproducir empiricamente, no leer el diff y opinar: clona el repo a un
directorio temporal, corre la suite tu mismo y construye el caso que
rompe el codigo antes de reportarlo. Clasifica cada hallazgo como
CRITICO (perdida de datos, corrupcion de estado, el comando hace lo
contrario de lo que dice), IMPORTANTE (comportamiento incorrecto en un
caso real, no de borde) o MENOR (todo lo demas). Un "sin hallazgos"
explicito tambien vale; inventar hallazgos, no. Vuelca tu salida en el
informe de esta ronda (informe-revision-1.md), sin borrar la
peticion.

## Contexto permitido

Lee solo esto: el enunciado y el plan de la tarea, y los ficheros de tu parte del diff.
Si necesitas algo mas, leelo y anotalo con su motivo en `## Lecturas fuera del
contexto permitido` de tu informe.

- tareas/03-en-revision/TASK-122/tarea.md
- tareas/03-en-revision/TASK-122/planificacion/
- .taskcode/config.yml
- CHANGELOG.md
- CLAUDE.md
- docs/auditoria/ESCALA-2026-11-12.md
- docs/auditoria/PERFIL-TESTS-2026-11-12.md
- docs/contexto/CONVENCIONES.md
- scripts/perfil-tests.mjs
- scripts/verificar-impacto.mjs
- taskcode-marketplace/plugins/taskcode-plugin/README.md
- taskcode-marketplace/plugins/taskcode-plugin/src/core/evolucion.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-agregados.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-tokens.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/core/evolucion.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/helpers/metricas-repos.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/scripts/perfil-tests.test.ts
- taskcode-marketplace/plugins/taskcode-plugin/test/scripts/verificar-impacto.test.ts

## Commits a revisar (git log develop..HEAD)

````
dc5f692 docs(TASK-122): autorrevision
5ce9211 docs(TASK-122): informes de escala y perfil, README y CHANGELOG
5c7d917 fix(TASK-122): el fixture con bash del perfil usa el bash de Git for Windows
59ac637 fix(TASK-122): verificar-impacto acotada y sin tocar el arbol
fed6514 build(TASK-122): dist regenerado
a9b72ba chore(TASK-122): verificacion desactivada hasta acotar verificar-impacto
5e40fe5 docs(TASK-122): regla de la piramide y verificacion por impacto
43e00cb fix(TASK-122): la tendencia del coste fijo compara tramos completos
beead31 feat(TASK-122): verificar-impacto corta en el enrutador src/cli.ts
16ba1d1 feat(TASK-122): perfil de la suite por fichero (duracion y procesos git)
136d29e feat(TASK-122): metricas --evolucion muestra el coste fijo por tarea
d108378 feat(TASK-122): verificacion por impacto en TaskCode
4cf5411 chore(TASK-122): tarea en curso
````

## Diff completo (git diff develop..HEAD)

````diff
diff --git a/.taskcode/config.yml b/.taskcode/config.yml
index e912cf9..6a18325 100644
--- a/.taskcode/config.yml
+++ b/.taskcode/config.yml
@@ -1,2 +1,10 @@
 # Configuracion de taskctl
 modo_flujo: automatico
+
+# TASK-122: cada tarea verifica por impacto; la suite completa, una vez por
+# version antes de publicar. Los comandos se ejecutan desde la raiz del repo.
+comando_verificacion: "npm --prefix taskcode-marketplace/plugins/taskcode-plugin test"
+timeout_verificacion: 1800
+comando_verificacion_selectiva: "node scripts/verificar-impacto.mjs"
+rutas_documentacion: [docs/**, "*.md"]
+rutas_verificacion_parcial: [taskcode-marketplace/plugins/taskcode-plugin/src/**, taskcode-marketplace/plugins/taskcode-plugin/test/**, taskcode-marketplace/plugins/taskcode-plugin/dist/src/**]
diff --git a/CHANGELOG.md b/CHANGELOG.md
index cdeff1a..ef4fb9c 100644
--- a/CHANGELOG.md
+++ b/CHANGELOG.md
@@ -160,6 +160,28 @@ anterior. El comando de verificacion recibe `TASKCTL_PROGRESO` (un fichero bajo
 `npm test` del propio plugin muestra `[x/N]` con un reporter sin dependencias
 junto al `spec`, con el total de la ejecucion anterior guardado bajo `.git/`.
 
+Coste por tarea independiente del tamano del proyecto (TASK-122).
+`taskctl metricas --evolucion` gana, por tramo, las tareas cerradas del
+proyecto al acabarlo (`cerradas`) y las medianas de minutos de punta a punta,
+de la fase de revision y del propio `finish` (de las tareas con hora), en
+columnas nuevas al final de la tabla y en el `--json` (`cerradasAcumuladas`,
+`minutosPuntaAPunta`, `minutosRevision`, `minutosFinish`). Una linea final
+compara el primer tramo con el ultimo (el ultimo completo si hay dos o mas) y
+dice si el coste fijo por tarea crece, baja o se mantiene (umbral 15 %). En el
+repo de TaskCode, fuera del plugin: `scripts/verificar-impacto.mjs` (los tests
+de lo que cambia la tarea, por el grafo de imports, mas los de `test:rapido`)
+es la verificacion selectiva y `.taskcode/config.yml` declara la completa,
+`rutas_documentacion` y `rutas_verificacion_parcial`, asi que `finish` verifica
+por impacto y la suite completa se corre una vez por version antes de
+publicar; `scripts/perfil-tests.mjs` lista por fichero de test su duracion y
+los procesos git que lanza. La selectiva no amplia por documentacion ni por la
+config del repo, se para en el enrutador `src/cli.ts` (mas alla solo los tests
+que nombran el comando afectado), con mas de 10 ficheros por impacto
+(`VERIFICAR_IMPACTO_TOPE`) corre solo los tests directos y lo dice, y devuelve
+`dist/src` tal cual tras compilar. Informes en `docs/auditoria/ESCALA-2026-11-12.md`
+y `PERFIL-TESTS-2026-11-12.md`; regla de la piramide en
+`docs/contexto/CONVENCIONES.md`.
+
 ## 0.14.0 — 2026-11-10
 
 ROADMAP de tareas generado por taskctl en todos los proyectos (TASK-098).
diff --git a/CLAUDE.md b/CLAUDE.md
index 99f63ba..c21f398 100644
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -27,12 +27,14 @@ procesan).
    clasifican CRÍTICO / IMPORTANTE / MENOR y se documentan en el `Resultado`
    de la tarea, incluidos los que se deciden no corregir.
 3. **Evidencia, no suposición.** Si no lo has ejecutado, no lo afirmes. Los
-   tests van contra recursos reales (repos Git temporales), nunca mocks.
+   tests de integración van contra recursos reales (repos Git temporales),
+   nunca mocks; la lógica, sin Git (pirámide: ver CONVENCIONES.md).
 4. **Al cerrar cualquier item**: marcar su casilla en
    `docs/contexto/CHECKLIST_TERMINACION.md`, actualizar los contadores de la
    tabla de cabecera, y **mostrar el checklist actualizado en la respuesta**.
-5. **Ritmo de tests.** Mientras se itera, `npm run test:rapido`; la suite
-   completa, una sola vez antes de pedir la revisión y no en cada ronda.
+5. **Ritmo de tests.** Mientras se itera, `npm run test:rapido`; para
+   verificar la tarea, `node scripts/verificar-impacto.mjs` (lo que cambia +
+   `test:rapido`). La suite completa, una vez por versión antes de publicar.
 6. **Cero dependencias de runtime.** El parser de YAML-frontmatter y el de
    argumentos están hechos a mano, a propósito. No añadas librerías sin una
    razón discutida.
diff --git a/docs/auditoria/ESCALA-2026-11-12.md b/docs/auditoria/ESCALA-2026-11-12.md
new file mode 100644
index 0000000..4e05b47
--- /dev/null
+++ b/docs/auditoria/ESCALA-2026-11-12.md
@@ -0,0 +1,160 @@
+# Coste de cada paso de una tarea frente al tamaño del proyecto — 2026-11-12
+
+TASK-122. Pregunta de Carlos: si cada tarea paga algo que crece con el
+proyecto, la tarea n cuesta del orden de n y el proyecto del orden de n². Regla
+buscada: **cada paso de una tarea cuesta en proporción a lo que cambia la
+tarea, nunca al tamaño del proyecto; lo que dependa del tamaño se paga una vez
+por versión.**
+
+Fuentes (todo ejecutado, nada supuesto): `AUDITORIA-METODO-2026-11-12.md` y
+`PASOS-PLUGIN-2026-11-12.md` (medianas por paso en ToolsaWeb, OpenDockTrading
+y TaskCode), `taskctl metricas --evolucion` en los tres proyectos (con las
+columnas nuevas de esta tarea), la suite y los documentos de contexto de
+TaskCode leídos de cada tag con `git grep` / `git ls-tree`, y
+`PERFIL-TESTS-2026-11-12.md` (duración y procesos git por fichero de test).
+
+## 1. Cómo ha crecido TaskCode
+
+Leído de cada tag (`git grep -cE "^\s*(test|it)\("` sobre
+`taskcode-marketplace/plugins/taskcode-plugin/test`; los KB, de
+`git ls-tree -l`; «terminadas» = `tareas/04-terminadas` en ese tag):
+
+| tag | fecha | tests | ficheros de test | módulos `src` | terminadas | `docs/contexto` | README plugin | skills | agentes |
+|---|---|---|---|---|---|---|---|---|---|
+| v0.1.0 | 09-05 | 220 | 18 | 18 | 0 | 0 KB | 13 KB | 0 KB | 0 KB |
+| v0.1.1 | 10-03 | 819 | 47 | 38 | 18 | 154 KB | 22 KB | 92 KB | 34 KB |
+| v0.3.0 | 10-04 | 901 | 58 | 43 | 31 | 157 KB | 22 KB | 95 KB | 34 KB |
+| v0.5.0 | 10-05 | 1040 | 88 | 51 | 44 | 161 KB | 27 KB | 113 KB | 34 KB |
+| v0.7.0 | 10-08 | 1245 | 105 | 59 | 48 | 164 KB | 37 KB | 124 KB | 34 KB |
+| v0.8.0 | 10-25 | 1322 | 115 | 62 | 51 | 166 KB | 42 KB | 126 KB | 34 KB |
+| v0.11.0 | 11-06 | 1766 | 143 | 101 | 66 | 178 KB | 73 KB | 161 KB | 48 KB |
+| v0.12.0 | 11-07 | 1915 | 162 | 116 | 76 | 186 KB | 81 KB | 167 KB | 48 KB |
+| v0.14.0 | 11-10 | 1974 | 169 | 121 | 81 | 190 KB | 90 KB | 180 KB | 48 KB |
+| HEAD (TASK-122) | 11-12 | 2167 | 192 | 128 | 93 | 195 KB | 102 KB | 189 KB | 48 KB |
+
+(La tarea cita 2289 tests: es el recuento de `node --test`, que cuenta también
+los subtests; este es el de llamadas `test(`/`it(` en el código. La curva es la
+misma.) `CLAUDE.md` se mantiene en 4-6 KB todo el tiempo.
+
+Lectura: de v0.1.1 a HEAD las tareas cerradas se multiplican por 5 y los tests
+por 2,6; el README del plugin por 4,6 y las skills por 2. Lo que paga cada
+tarea por correr la suite crece **en línea recta con los tests** (de ~11 a
+~25 min la completa); lo que paga por leer contexto crece con el README y las
+skills.
+
+## 2. El coste fijo por tarea, medido frente a las tareas cerradas
+
+`taskctl metricas --evolucion` (columnas nuevas: `cerradas`, medianas de
+`min punta a punta`, `min revision` y `min finish`; la línea final compara el
+primer tramo con el último completo):
+
+| proyecto | tramo | cerradas | punta a punta | revisión | finish |
+|---|---|---|---|---|---|
+| TaskCode (tramos de 20) | 1 | 20 | 60,7 min | 40,6 min | sin dato |
+| | 2 | 40 | 126,7 | 93 | sin dato |
+| | 3 | 60 | 121,9 | 63,2 | sin dato |
+| | 4 | 80 | 78,4 | 49,4 | sin dato |
+| ToolsaWeb (tramos de 30) | 1 | 30 | 50,8 | 19,6 | sin dato |
+| | 2 | 60 | 71,3 | 31,7 | sin dato |
+| | 3 | 90 | 152,2 | 70 | sin dato |
+| | 4 | 120 | 137,6 | 47,8 | sin dato |
+| | 5 | 150 | 120,8 | 64,8 | sin dato |
+| OpenDockTrading | 1 | 28 | 56,9 | 32,2 | sin dato |
+
+- **ToolsaWeb**: punta a punta ×2,4 y revisión ×3,3 del tramo 1 al 5:
+  **crece**. Es el proyecto que más ha crecido y el único que verifica en
+  `finish` (28 min por tarea que hasta P-1 no veía ninguna métrica, por eso la
+  columna `finish` sale sin dato en las tareas antiguas).
+- **TaskCode**: sube del tramo 1 al 2-3 y baja en el 4 (78 min), cuando
+  entraron el modo rápido y los recortes de la 0.13-0.14. Del 1 al 4,
+  **crece** (+29 % punta a punta, +22 % revisión), con el pico en medio.
+- **OpenDockTrading**: un solo tramo; todavía no hay curva.
+- `finish`: la línea `- Cierre (finish)` (P-1) es de la 0.14; solo una tarea
+  la tiene. A partir de ahora la columna medirá el cierre real.
+
+Desde esta tarea la pregunta «¿crece el coste fijo?» la responde
+`taskctl metricas --evolucion` en cualquier proyecto, sin informe a mano.
+
+## 3. Cada paso frente al tamaño del proyecto
+
+Medianas de la 0.14 (PASOS-PLUGIN, tres proyectos) y su relación con el tamaño.
+«Crece» = el coste del paso depende de lo grande que sea el proyecto (tests,
+ficheros, tareas cerradas), no de lo que cambia la tarea.
+
+| paso | medido (ToolsaWeb · ODT · TaskCode) | qué lo hace crecer | tendencia frente al tamaño |
+|---|---|---|---|
+| Diseño (`plan` → `approve`) | 12 · 16 · 11 min; 0,8-1,6 M tokens | 2 roles + unificador por tarea; leen el contexto del proyecto | **constante** en número de agentes; crece solo por el contexto que leen (fila «contexto») |
+| Implementación (`start` → 1.ª `review`) | 20 · 16 · 36 min; 7,5-17,9 M | la sesión entera: código + orquestación + skills | **constante** por tarea (depende del cambio); en ToolsaWeb bajó de 74 a 20 min en la 0.14 |
+| Verificación durante la tarea (freno `Stop`) | selectiva de ToolsaWeb 4,2 min por turno | si la selectiva corre de más (o la completa), crece con la suite | **crece** si no es por impacto; en TaskCode no actuaba (sin `comando_verificacion`) |
+| Ronda 1 de revisión | 17 · 15 · 27 min; 2,9-4,8 M | el revisor clona, instala, compila y **corre la suite completa** | **crece**: suelo fijo de 10-25 min en TaskCode y ~28 en ToolsaWeb, proporcional a los tests |
+| Rondas ≥ 2 | ronda 2 = 94 % de la ronda 1 en ToolsaWeb; 71 rondas por MENORES, 2 CRIT/IMP, 70 M tokens | el mismo suelo de suite completa por ronda; rondas por MENORES | **crece** (suelo de suite) y además se paga sin retorno |
+| Cierre (`finish`) | **28 min** en ToolsaWeb; 0,1 min donde no había verificación | la suite completa en cada `finish` | **crece** linealmente con la suite |
+| Commits de proceso | ~23 por tarea, 3-4 de código | pasos fijos del flujo | **constante** por tarea (no depende del tamaño) |
+| Petición de revisión | 116 · 86 · 46 KB de mediana | el diff de la tarea + `contexto_revision` | **constante** frente al tamaño (depende del diff); crece solo si `contexto_revision` crece |
+| Contexto que leen los agentes | `docs/contexto` 154 → 195 KB, README 22 → 102 KB, skills 92 → 189 KB; ~60-80 KB de instrucciones por ronda | documentos que solo crecen (CHECKLIST 83 KB, README 98 KB, ESTADO desfasado) | **crece** con la historia del proyecto |
+
+## 4. El arreglo de cada paso que crece
+
+Decidido con Carlos al aprobar el plan (2026-11-12): se aprueba entero; se
+acepta verificar por impacto en TaskCode y correr la completa solo antes de
+publicar; el contexto va en una tarea aparte.
+
+| paso que crece | arreglo | dónde |
+|---|---|---|
+| Verificación durante la tarea y en `finish` (TaskCode) | **hecho aquí**: `scripts/verificar-impacto.mjs` (tests de lo que cambia + `test:rapido`) como `comando_verificacion_selectiva`, con `rutas_verificacion_parcial` sobre `src/`, `test/` y `dist/src/` del plugin; la completa (`npm --prefix … test`) queda como `comando_verificacion`, que se corre una vez por versión antes de publicar | esta tarea; `.taskcode/config.yml` |
+| Verificación en `finish` (ToolsaWeb, 28 min) | el mismo mecanismo ya existe en el plugin (nivel 2, TASK-096..108): ToolsaWeb lo activa declarando `rutas_verificacion_parcial` y una selectiva por impacto | configuración de ToolsaWeb (no es código del plugin) |
+| Ronda 1 y rondas ≥ 2: suite completa del revisor | el revisor reutiliza la verificación de ronda (mismo commit, misma huella) y solo corre los tests de sus mutantes; desde la ronda 2 solo el revisor con pendientes | **TASK-112** (P-4) |
+| Rondas ≥ 2 abiertas solo por MENORES | MENORES corregidos sin ronda: selectiva del implementador y nota | **TASK-099** |
+| Prima fija repetida al trocear (regla de una hora) | troceo como pregunta, subtareas en la misma rama que no repiten diseño ni cierre | **TASK-121** |
+| Diseño: 3 agentes por tarea | un rol sin unificador | **modo rápido** (ya vigente; esta misma tarea se diseñó así) |
+| Contexto que leen los agentes | **tarea aparte: contexto con tamaño máximo** (CHECKLIST, README del plugin y ESTADO con tope de KB; lo histórico, a un archivo que no se carga) | decisión 3 de Carlos; no se da de alta aquí |
+| Suite cuyo coste crece con Git real en cada test | regla de la pirámide en `docs/contexto/CONVENCIONES.md` (lógica sin Git; Git real solo en la capa fina de integración) y los 10 ficheros más lentos clasificados | esta tarea; `PERFIL-TESTS-2026-11-12.md` |
+
+Lo que **no** se toca, porque es donde está la calidad: la ronda 1
+independiente con reproducción empírica, la ronda de verificación tras
+corregir un CRÍTICO o IMPORTANTE (TASK-101 y 103 encontraron CRÍTICOS nuevos
+ahí) y la suite completa antes de publicar cada versión.
+
+## 5. La verificación por impacto, medida
+
+Medido en Windows (12 núcleos), con la suite de 192 ficheros y 2167 tests.
+
+| caso | qué eligió | tests | tiempo |
+|---|---|---|---|
+| Clon, un cambio en `src/core/evolucion.ts`, 1.ª versión del selector (sin corte en `src/cli.ts`) | 9 ficheros por impacto (arrastraba `finish-merge-request` y `doctor-deploy` por el enrutador) + core/cli | 930 | **271 s** |
+| Misma rama, versión final (corte en el enrutador + tope de 10) | 12 por impacto > tope → solo los directos: ninguno fuera de core/cli | 748 | **14 s** |
+| Esta rama (TASK-122: 35 ficheros cambiados, `evolucion.ts`, helpers, tests y scripts) | 14 por impacto > tope → 6 directos (los tests cambiados, los que importan `helpers/metricas-repos.ts` y los de los dos scripts) + core/cli | 788 | **48-49 s**, árbol sin cambios |
+| Esta rama sin tope (los 14) | 14 + core/cli | 822 | 166-192 s |
+
+**Criterio 3 cumplido: una tarea que toca un solo módulo verifica en 14 s con
+más de 2000 tests en la suite.**
+
+Lo que aprendimos al medir (y corrigió el selector):
+
+- **El nombre de un fichero no es una dependencia.** `.taskcode/config.yml`
+  arrastraba 162 ficheros porque `config.yml` sale en sus helpers, y el
+  `README.md` del plugin, 120. Ahora la config del repo y los `.md` de la raíz
+  del plugin no amplían la selección.
+- **El enrutador de comandos lo conecta todo.** Casi todos los tests de un
+  comando importan `src/cli.ts` o lanzan `bin/taskctl`. Sin cortar ahí,
+  cualquier módulo elegía casi la suite entera.
+- **Los módulos que usa todo el mundo** (`core/progreso.ts`, `core/config.ts`,
+  `fs/git.ts`) eligen entre 108 y 111 de 192 ficheros, y es verdad que afectan
+  a todo. El tope de 10 los reduce a los tests directos y lo dice en la salida.
+  Lo que queda fuera lo cubre la completa antes de publicar (riesgo aceptado
+  por Carlos). Lo que de verdad lo abarata es la pirámide.
+- **Una sola tarea puede costar minutos por culpa de un único fichero que
+  recorre el ciclo por CLI.** En Windows, `metricas-tokens.test.ts` tardaba
+  107 s solo, porque repetía el ciclo entero en cada test. Montado una vez por
+  fichero, baja a 33 s.
+- **La verificación no puede tocar el árbol.** `npm run build` reescribe
+  `dist/src` (versionado), y el freno lo detectaba como un cambio. Ahora
+  `dist/src` se guarda antes y se devuelve tal cual.
+
+## 6. Limitaciones
+
+- ToolsaWeb y OpenDockTrading no tienen tags de versión de su propia suite en
+  este repo: su curva sale de `metricas --evolucion`, no del tamaño de su suite.
+- La mediana por tramo mezcla tareas de complejidad distinta; la columna
+  `cerradas` es el eje del tamaño, no una variable controlada.
+- Los tiempos de reloj incluyen esperas no registradas con `taskctl pausa`.
diff --git a/docs/auditoria/PERFIL-TESTS-2026-11-12.md b/docs/auditoria/PERFIL-TESTS-2026-11-12.md
new file mode 100644
index 0000000..c3de686
--- /dev/null
+++ b/docs/auditoria/PERFIL-TESTS-2026-11-12.md
@@ -0,0 +1,248 @@
+# Perfil de la suite por fichero: duración y procesos git — 2026-11-12
+
+TASK-122. Lo genera `scripts/perfil-tests.mjs` (reproducible, sin dependencias):
+
+```bash
+node scripts/perfil-tests.mjs --concurrencia 4 --salida docs/auditoria/PERFIL-TESTS-<fecha>.md
+```
+
+Corre cada `dist/test/**/*.test.js` en su propio `node --test` con un `git` de
+recuento delante en el PATH (y, en Windows, un `--require` que cuenta los `git`
+lanzados desde node). Ejecutado sobre la suite entera de la rama de TASK-122
+(192 ficheros), con concurrencia 4 en Windows: las duraciones están infladas
+por la concurrencia y la carga de la máquina, pero el orden y el recuento de
+`git` no dependen de eso.
+
+## Resumen
+
+- **192 ficheros, 1803 tests de primer nivel, 86,8 min de suma de duraciones,
+  24 084 procesos `git`.**
+- **121 ficheros no lanzan ni un `git`**: 886 tests en 273 s de suma (4,5 min).
+  Los 71 restantes, con 917 tests, se llevan 82 min y todos los procesos `git`.
+- **Los 10 más lentos suman 39 min (el 45 % del total)** con 77 tests de
+  primer nivel.
+- Fallos: `commands/approve.test.ts` (1, el `EPERM` de symlink conocido de
+  Windows) y `scripts/perfil-tests.test.ts` (1, un artefacto de medir el
+  perfil dentro del propio perfil: el `--require` de fuera y el de dentro
+  cuentan cada `git` dos veces; aislado pasa).
+
+## Los 10 más lentos, clasificados
+
+| # | fichero | s | tests | git | ¿necesita Git real? | motivo |
+|---|---|---|---|---|---|---|
+| 1 | empaquetado/distribucion.test.ts | 568 | 9 | 189 | **sí** (capa de integración) | prueba lo que recibe quien clona: exporta el árbol de HEAD con git y arranca `taskctl` sin compilar. Es de publicar, no de cada tarea: candidato a correr solo en la completa |
+| 2 | commands/metricas-tokens.test.ts | 507 | 8 | 1167 | **no** | `metricas` solo lee `tarea.md`; el ciclo por CLI solo fabricaba el escenario. Ya montado una vez por fichero en esta tarea (107 → 33 s aislado); lo siguiente es escribir las tareas como hace `helpers/metricas-repos.ts` |
+| 3 | commands/finish-merge-request.test.ts | 237 | 32 | 1527 | **en parte** | el push a un `origin` bare y la rama remota sí; construir los argumentos de `gh`/`glab`, el título y el cuerpo es puro y no necesita 32 repos |
+| 4 | commands/finish-merge-request-instancia.test.ts | 200 | 34 | 1222 | **no** en su mayoría | resolver host, instancia GitLab y `-R` a partir de la URL del remoto es una función de texto; Git real solo para un caso de extremo a extremo |
+| 5 | commands/metricas.test.ts | 196 | 5 | 460 | **no** | igual que el 2: lectura de `tarea.md` e informes |
+| 6 | gitflow/merge-to-main.test.ts | 146 | 10 | 230 | **sí** | prueba el script de Git-Flow en bash: el merge real es lo probado |
+| 7 | gitflow/origin-guard.test.ts | 127 | 14 | 210 | **sí** | el guard del script compara con un `origin` de verdad |
+| 8 | commands/doctor-deploy.test.ts | 125 | 58 | 1681 | **no** en su mayoría | las reglas (secretos, lockfile, `.env`, …) leen ficheros del árbol; basta un directorio con ficheros, sin repo por test |
+| 9 | fs/git.test.ts | 125 | 37 | 419 | **sí** | es el adaptador de Git: su razón de ser es hablar con Git real |
+| 10 | commands/finish-parcial.test.ts | 124 | 16 | 906 | **en parte** | la decisión de nivel 2 ya es pura (`core/verificacion-proporcional`); aquí basta un caso de integración por puerta, no 16 repos |
+
+Lectura: de los 10, **3 necesitan Git real de verdad** (6, 7 y 9), uno es de
+publicación (1) y **6 prueban lógica que se puede probar sin Git** (2, 3, 4, 5,
+8 y 10). Es lo que dice la regla de la pirámide escrita en
+`docs/contexto/CONVENCIONES.md`: lógica sin Git, Git real solo en una capa fina
+de integración.
+
+## Tabla completa
+
+Ficheros: 192. Tests: 1803. Suma de duraciones: 86.8 min. Procesos git: 24084.
+Medido con node v22.23.4 en win32, concurrencia 4.
+
+| # | fichero | s | tests | git | git/test | fallos |
+|---|---|---|---|---|---|---|
+| 1 | test/empaquetado/distribucion.test.ts | 568.2 | 9 | 189 | 21.0 | 0 |
+| 2 | test/commands/metricas-tokens.test.ts | 506.8 | 8 | 1167 | 145.9 | 0 |
+| 3 | test/commands/finish-merge-request.test.ts | 236.7 | 32 | 1527 | 47.7 | 0 |
+| 4 | test/commands/finish-merge-request-instancia.test.ts | 199.8 | 34 | 1222 | 35.9 | 0 |
+| 5 | test/commands/metricas.test.ts | 195.8 | 5 | 460 | 92.0 | 0 |
+| 6 | test/gitflow/merge-to-main.test.ts | 146.1 | 10 | 230 | 23.0 | 0 |
+| 7 | test/gitflow/origin-guard.test.ts | 126.9 | 14 | 210 | 15.0 | 0 |
+| 8 | test/commands/doctor-deploy.test.ts | 124.9 | 58 | 1681 | 29.0 | 0 |
+| 9 | test/fs/git.test.ts | 124.5 | 37 | 419 | 11.3 | 0 |
+| 10 | test/commands/finish-parcial.test.ts | 124 | 16 | 906 | 56.6 | 0 |
+| 11 | test/commands/cobertura-cambios.test.ts | 118.7 | 23 | 818 | 35.6 | 0 |
+| 12 | test/gitflow/abort-merge.test.ts | 118.3 | 13 | 222 | 17.1 | 0 |
+| 13 | test/commands/finish-tag.test.ts | 113.7 | 17 | 875 | 51.5 | 0 |
+| 14 | test/hooks/freno-stop-documentacion.test.ts | 105.5 | 12 | 300 | 25.0 | 0 |
+| 15 | test/commands/doctor.test.ts | 105.1 | 61 | 613 | 10.0 | 0 |
+| 16 | test/gitflow/merge-to-main-tag.test.ts | 102.6 | 8 | 212 | 26.5 | 0 |
+| 17 | test/agents/brainstorm-roles.test.ts | 101.1 | 88 | 0 | 0.0 | 0 |
+| 18 | test/commands/finish-aviso-release.test.ts | 100.8 | 10 | 734 | 73.4 | 0 |
+| 19 | test/commands/finish-heldout.test.ts | 88.4 | 21 | 600 | 28.6 | 0 |
+| 20 | test/hooks/guardia-documentacion.test.ts | 84.8 | 18 | 670 | 37.2 | 0 |
+| 21 | test/commands/finish-documentacion.test.ts | 76.5 | 10 | 545 | 54.5 | 0 |
+| 22 | test/commands/coste-automatico.test.ts | 71.5 | 6 | 461 | 76.8 | 0 |
+| 23 | test/hooks/freno-stop.test.ts | 66.4 | 18 | 193 | 10.7 | 0 |
+| 24 | test/hooks/guardia-merge.test.ts | 64.6 | 24 | 583 | 24.3 | 0 |
+| 25 | test/commands/cadena.test.ts | 63.4 | 13 | 215 | 16.5 | 0 |
+| 26 | test/commands/doctor-deploy-resultado.test.ts | 63.3 | 21 | 950 | 45.2 | 0 |
+| 27 | test/gitflow/origin-deteccion.test.ts | 60.2 | 5 | 88 | 17.6 | 0 |
+| 28 | test/fs/git-commit.test.ts | 58.3 | 13 | 151 | 11.6 | 0 |
+| 29 | test/fs/wip-scan.test.ts | 56.4 | 13 | 209 | 16.1 | 0 |
+| 30 | test/commands/metricas-fila.test.ts | 55.2 | 2 | 312 | 156.0 | 0 |
+| 31 | test/commands/doctor-deploy-aplicaciones.test.ts | 51.6 | 27 | 685 | 25.4 | 0 |
+| 32 | test/commands/doctor-deploy-config.test.ts | 50.4 | 18 | 664 | 36.9 | 0 |
+| 33 | test/integracion/cli-main.test.ts | 48.9 | 12 | 470 | 39.2 | 0 |
+| 34 | test/commands/automatico-guardas.test.ts | 48.3 | 4 | 341 | 85.3 | 0 |
+| 35 | test/commands/duracion-estimada.test.ts | 48 | 5 | 278 | 55.6 | 0 |
+| 36 | test/fs/decision-parcial.test.ts | 46.9 | 9 | 187 | 20.8 | 0 |
+| 37 | test/commands/automatico-guarda-finish.test.ts | 45.9 | 3 | 326 | 108.7 | 0 |
+| 38 | test/commands/doctor-deploy-tareas.test.ts | 41.7 | 14 | 480 | 34.3 | 0 |
+| 39 | test/commands/automatico-ciclo.test.ts | 41.2 | 2 | 266 | 133.0 | 0 |
+| 40 | test/commands/automatico-rondas.test.ts | 39.5 | 2 | 269 | 134.5 | 0 |
+| 41 | test/commands/finish-verificacion.test.ts | 32.5 | 9 | 248 | 27.6 | 0 |
+| 42 | test/commands/auto-commit.test.ts | 29.7 | 10 | 268 | 26.8 | 0 |
+| 43 | test/scripts/verificar-impacto.test.ts | 29.1 | 9 | 109 | 12.1 | 0 |
+| 44 | test/commands/metricas-agregados.test.ts | 28.8 | 10 | 83 | 8.3 | 0 |
+| 45 | test/commands/finish-merge.test.ts | 28.4 | 6 | 176 | 29.3 | 0 |
+| 46 | test/commands/approve.test.ts | 27.6 | 19 | 277 | 14.6 | 1 |
+| 47 | test/commands/finish-guardas.test.ts | 26.5 | 6 | 171 | 28.5 | 0 |
+| 48 | test/hooks/guardia-heldout.test.ts | 26.2 | 11 | 93 | 8.5 | 0 |
+| 49 | test/skills/revisores.test.ts | 24.5 | 27 | 0 | 0.0 | 0 |
+| 50 | test/commands/doctor-status-line.test.ts | 23.9 | 13 | 84 | 6.5 | 0 |
+| 51 | test/skills/task-workflow.test.ts | 23.6 | 25 | 0 | 0.0 | 0 |
+| 52 | test/commands/doctor-hooks-subagente.test.ts | 23.3 | 14 | 134 | 9.6 | 0 |
+| 53 | test/commands/finish-duracion-real.test.ts | 22.1 | 3 | 122 | 40.7 | 0 |
+| 54 | test/commands/import.test.ts | 21.8 | 22 | 206 | 9.4 | 0 |
+| 55 | test/integracion/config.test.ts | 19.7 | 38 | 172 | 4.5 | 0 |
+| 56 | test/commands/finish-instante-final.test.ts | 19.3 | 3 | 111 | 37.0 | 0 |
+| 57 | test/commands/finish-cierre.test.ts | 19.1 | 5 | 127 | 25.4 | 0 |
+| 58 | test/integracion/cli-flags-desconocidos.test.ts | 18.3 | 22 | 174 | 7.9 | 0 |
+| 59 | test/commands/doctor-deploy-men.test.ts | 18.2 | 9 | 221 | 24.6 | 0 |
+| 60 | test/commands/finish-linaje.test.ts | 16.6 | 3 | 116 | 38.7 | 0 |
+| 61 | test/commands/metricas-repo.test.ts | 16.4 | 6 | 47 | 7.8 | 0 |
+| 62 | test/commands/codex-review.test.ts | 15.9 | 11 | 141 | 12.8 | 0 |
+| 63 | test/fs/sonda-bash.test.ts | 14.3 | 2 | 0 | 0.0 | 0 |
+| 64 | test/gitflow/logging.test.ts | 12.5 | 3 | 8 | 2.7 | 0 |
+| 65 | test/commands/metricas-version.test.ts | 11 | 4 | 32 | 8.0 | 0 |
+| 66 | test/commands/doctor-correcciones.test.ts | 10.8 | 6 | 55 | 9.2 | 0 |
+| 67 | test/commands/flags-repetidos.test.ts | 8.6 | 1 | 36 | 36.0 | 0 |
+| 68 | test/fs/gitflow-runner.test.ts | 7.9 | 7 | 1 | 0.1 | 0 |
+| 69 | test/commands/doctor-version-plugin.test.ts | 7 | 5 | 38 | 7.6 | 0 |
+| 70 | test/commands/estado.test.ts | 6.3 | 7 | 28 | 4.0 | 0 |
+| 71 | test/core/verificacion-proporcional.test.ts | 6.2 | 14 | 23 | 1.6 | 0 |
+| 72 | test/integracion/plugin-instalado.test.ts | 6 | 1 | 0 | 0.0 | 0 |
+| 73 | test/hooks/registro-coste.test.ts | 5.9 | 6 | 44 | 7.3 | 0 |
+| 74 | test/fs/task-store.test.ts | 4.1 | 12 | 0 | 0.0 | 0 |
+| 75 | test/commands/estado-seguir.test.ts | 3.8 | 2 | 0 | 0.0 | 0 |
+| 76 | test/fs/sonda-version-plugin.test.ts | 3.8 | 9 | 0 | 0.0 | 0 |
+| 77 | test/fs/deteccion-tests.test.ts | 3.7 | 5 | 0 | 0.0 | 0 |
+| 78 | test/fs/git-identidad.test.ts | 3.4 | 3 | 9 | 3.0 | 0 |
+| 79 | test/core/tareas-reales.test.ts | 3.2 | 1 | 0 | 0.0 | 0 |
+| 80 | test/fs/task-store-wip.test.ts | 3.2 | 8 | 0 | 0.0 | 0 |
+| 81 | test/core/metricas.test.ts | 2.8 | 35 | 0 | 0.0 | 0 |
+| 82 | test/helpers/repo-plantilla.test.ts | 2.6 | 5 | 0 | 0.0 | 0 |
+| 83 | test/core/metricas-finish.test.ts | 2.5 | 5 | 0 | 0.0 | 0 |
+| 84 | test/core/revisores.test.ts | 2.4 | 17 | 0 | 0.0 | 0 |
+| 85 | test/fs/task-store-reintento.test.ts | 2.4 | 4 | 0 | 0.0 | 0 |
+| 86 | test/fs/rondas-aprobada.test.ts | 2.2 | 5 | 0 | 0.0 | 0 |
+| 87 | test/core/plataforma-remota.test.ts | 1.8 | 10 | 0 | 0.0 | 0 |
+| 88 | test/empaquetado/sin-literales-secretos.test.ts | 1.8 | 4 | 1 | 0.3 | 0 |
+| 89 | test/scripts/perfil-tests.test.ts | 1.8 | 1 | 1 | 1.0 | 1 |
+| 90 | test/core/remoto-declarado.test.ts | 1.7 | 13 | 0 | 0.0 | 0 |
+| 91 | test/empaquetado/metadatos.test.ts | 1.7 | 5 | 0 | 0.0 | 0 |
+| 92 | test/core/plan-desempate-skill.test.ts | 1.5 | 20 | 0 | 0.0 | 0 |
+| 93 | test/core/plugin-instalado.test.ts | 1.5 | 13 | 0 | 0.0 | 0 |
+| 94 | test/core/progreso.test.ts | 1.5 | 7 | 0 | 0.0 | 0 |
+| 95 | test/core/doctor.test.ts | 1.4 | 5 | 0 | 0.0 | 0 |
+| 96 | test/core/duracion-estimada.test.ts | 1.4 | 5 | 0 | 0.0 | 0 |
+| 97 | test/core/metricas-fila.test.ts | 1.4 | 21 | 0 | 0.0 | 0 |
+| 98 | test/core/roles-brainstorm.test.ts | 1.4 | 19 | 0 | 0.0 | 0 |
+| 99 | test/core/state-machine.test.ts | 1.4 | 28 | 0 | 0.0 | 0 |
+| 100 | test/core/tarea-file.test.ts | 1.4 | 6 | 0 | 0.0 | 0 |
+| 101 | test/core/doctor-deploy-referencias.test.ts | 1.3 | 5 | 0 | 0.0 | 0 |
+| 102 | test/core/heuristica.test.ts | 1.3 | 47 | 0 | 0.0 | 0 |
+| 103 | test/core/informe-revision-origen.test.ts | 1.3 | 4 | 0 | 0.0 | 0 |
+| 104 | test/core/metricas-agregados.test.ts | 1.3 | 2 | 0 | 0.0 | 0 |
+| 105 | test/core/reporter-progreso.test.ts | 1.3 | 2 | 0 | 0.0 | 0 |
+| 106 | test/core/roadmap.test.ts | 1.3 | 12 | 0 | 0.0 | 0 |
+| 107 | test/core/task-id.test.ts | 1.3 | 13 | 0 | 0.0 | 0 |
+| 108 | test/core/doctor-deploy-catalogo.test.ts | 1.2 | 22 | 0 | 0.0 | 0 |
+| 109 | test/core/evolucion.test.ts | 1.2 | 7 | 0 | 0.0 | 0 |
+| 110 | test/core/import-parser.test.ts | 1.2 | 17 | 0 | 0.0 | 0 |
+| 111 | test/core/task.test.ts | 1.2 | 17 | 0 | 0.0 | 0 |
+| 112 | test/core/transiciones.test.ts | 1.2 | 29 | 0 | 0.0 | 0 |
+| 113 | test/fs/transcripciones.test.ts | 1.2 | 2 | 0 | 0.0 | 0 |
+| 114 | test/core/doctor-deploy-aplicaciones.test.ts | 1.1 | 16 | 0 | 0.0 | 0 |
+| 115 | test/core/doctor-deploy-reglas.test.ts | 1.1 | 29 | 0 | 0.0 | 0 |
+| 116 | test/core/hooks-subagente.test.ts | 1.1 | 7 | 0 | 0.0 | 0 |
+| 117 | test/core/secretos.test.ts | 1.1 | 9 | 0 | 0.0 | 0 |
+| 118 | test/core/siguiente.test.ts | 1.1 | 4 | 0 | 0.0 | 0 |
+| 119 | test/core/tarea-body-subtitulos.test.ts | 1.1 | 8 | 0 | 0.0 | 0 |
+| 120 | test/core/doctor-deploy-auditoria.test.ts | 1 | 9 | 0 | 0.0 | 0 |
+| 121 | test/core/doctor-deploy.test.ts | 1 | 3 | 0 | 0.0 | 0 |
+| 122 | test/core/frontmatter.test.ts | 1 | 12 | 0 | 0.0 | 0 |
+| 123 | test/core/grupos-metricas.test.ts | 1 | 4 | 0 | 0.0 | 0 |
+| 124 | test/core/heuristica-complejidad.test.ts | 1 | 13 | 0 | 0.0 | 0 |
+| 125 | test/core/coste-transcripcion.test.ts | 0.9 | 9 | 0 | 0.0 | 0 |
+| 126 | test/core/validacion-tarea.test.ts | 0.9 | 10 | 0 | 0.0 | 0 |
+| 127 | test/commands/board.test.ts | 0.8 | 27 | 0 | 0.0 | 0 |
+| 128 | test/core/coste-revision.test.ts | 0.8 | 9 | 0 | 0.0 | 0 |
+| 129 | test/core/versiones-metricas.test.ts | 0.8 | 4 | 0 | 0.0 | 0 |
+| 130 | test/core/wip.test.ts | 0.8 | 24 | 0 | 0.0 | 0 |
+| 131 | test/skills/finish-cierre.test.ts | 0.7 | 4 | 0 | 0.0 | 0 |
+| 132 | test/cli/estado.test.ts | 0.5 | 8 | 0 | 0.0 | 0 |
+| 133 | test/core/config-verificacion.test.ts | 0.5 | 8 | 0 | 0.0 | 0 |
+| 134 | test/core/coste-automatico.test.ts | 0.5 | 10 | 0 | 0.0 | 0 |
+| 135 | test/skills/lo-que-lees.test.ts | 0.5 | 5 | 0 | 0.0 | 0 |
+| 136 | test/core/coste-registro.test.ts | 0.4 | 8 | 0 | 0.0 | 0 |
+| 137 | test/skills/autorrevision.test.ts | 0.4 | 5 | 0 | 0.0 | 0 |
+| 138 | test/skills/doctor-deploy.test.ts | 0.4 | 12 | 0 | 0.0 | 0 |
+| 139 | test/skills/fases.test.ts | 0.4 | 10 | 0 | 0.0 | 0 |
+| 140 | test/cli/args.test.ts | 0.3 | 11 | 0 | 0.0 | 0 |
+| 141 | test/cli/asignado.test.ts | 0.3 | 19 | 0 | 0.0 | 0 |
+| 142 | test/commands/rama-base.test.ts | 0.3 | 0 | 0 | — | 0 |
+| 143 | test/commands/rango-reservado.test.ts | 0.3 | 0 | 0 | — | 0 |
+| 144 | test/commands/review-alcance.test.ts | 0.3 | 0 | 0 | — | 0 |
+| 145 | test/commands/review-autorrevision.test.ts | 0.3 | 0 | 0 | — | 0 |
+| 146 | test/core/board-format.test.ts | 0.3 | 0 | 0 | — | 0 |
+| 147 | test/skills/validador-claude.test.ts | 0.3 | 7 | 0 | 0.0 | 0 |
+| 148 | test/commands/new-contenido.test.ts | 0.2 | 0 | 0 | — | 0 |
+| 149 | test/commands/new.test.ts | 0.2 | 0 | 0 | — | 0 |
+| 150 | test/commands/particion.test.ts | 0.2 | 0 | 0 | — | 0 |
+| 151 | test/commands/plan-brainstorm.test.ts | 0.2 | 0 | 0 | — | 0 |
+| 152 | test/commands/plan.test.ts | 0.2 | 0 | 0 | — | 0 |
+| 153 | test/commands/progreso-comandos.test.ts | 0.2 | 0 | 0 | — | 0 |
+| 154 | test/commands/progreso-verificacion.test.ts | 0.2 | 0 | 0 | — | 0 |
+| 155 | test/commands/registrar-coste-agente.test.ts | 0.2 | 0 | 0 | — | 0 |
+| 156 | test/commands/registrar-coste.test.ts | 0.2 | 0 | 0 | — | 0 |
+| 157 | test/commands/reporter-progreso.test.ts | 0.2 | 0 | 0 | — | 0 |
+| 158 | test/commands/review-camino.test.ts | 0.2 | 0 | 0 | — | 0 |
+| 159 | test/commands/review-contexto.test.ts | 0.2 | 0 | 0 | — | 0 |
+| 160 | test/commands/review-documentacion.test.ts | 0.2 | 0 | 0 | — | 0 |
+| 161 | test/commands/review-dominios.test.ts | 0.2 | 0 | 0 | — | 0 |
+| 162 | test/commands/review-exclusion.test.ts | 0.2 | 0 | 0 | — | 0 |
+| 163 | test/commands/review-guardas.test.ts | 0.2 | 0 | 0 | — | 0 |
+| 164 | test/commands/review-incremental.test.ts | 0.2 | 0 | 0 | — | 0 |
+| 165 | test/commands/review-modelo.test.ts | 0.2 | 0 | 0 | — | 0 |
+| 166 | test/commands/review-rutas.test.ts | 0.2 | 0 | 0 | — | 0 |
+| 167 | test/commands/revision-lecturas.test.ts | 0.2 | 0 | 0 | — | 0 |
+| 168 | test/commands/roadmap-ajenos.test.ts | 0.2 | 0 | 0 | — | 0 |
+| 169 | test/commands/roadmap-transiciones.test.ts | 0.2 | 0 | 0 | — | 0 |
+| 170 | test/commands/semiautomatico.test.ts | 0.2 | 0 | 0 | — | 0 |
+| 171 | test/commands/siguiente.test.ts | 0.2 | 0 | 0 | — | 0 |
+| 172 | test/commands/sincronizacion-ciclo.test.ts | 0.2 | 0 | 0 | — | 0 |
+| 173 | test/commands/sincronizacion-raiz-tareas.test.ts | 0.2 | 0 | 0 | — | 0 |
+| 174 | test/commands/sincronizacion-revision.test.ts | 0.2 | 0 | 0 | — | 0 |
+| 175 | test/commands/sincronizacion-scripts.test.ts | 0.2 | 0 | 0 | — | 0 |
+| 176 | test/commands/start-asignacion.test.ts | 0.2 | 0 | 0 | — | 0 |
+| 177 | test/commands/start-basico.test.ts | 0.2 | 0 | 0 | — | 0 |
+| 178 | test/commands/start-identidad.test.ts | 0.2 | 0 | 0 | — | 0 |
+| 179 | test/commands/start-wip-ramas.test.ts | 0.2 | 0 | 0 | — | 0 |
+| 180 | test/commands/start-wip.test.ts | 0.2 | 0 | 0 | — | 0 |
+| 181 | test/commands/validacion-puertas.test.ts | 0.2 | 0 | 0 | — | 0 |
+| 182 | test/commands/veredicto.test.ts | 0.2 | 0 | 0 | — | 0 |
+| 183 | test/commands/verificacion-selectiva.test.ts | 0.2 | 0 | 0 | — | 0 |
+| 184 | test/commands/verificacion-tres-puertas.test.ts | 0.2 | 0 | 0 | — | 0 |
+| 185 | test/commands/wrappers.test.ts | 0.2 | 0 | 0 | — | 0 |
+| 186 | test/core/autorrevision.test.ts | 0.2 | 0 | 0 | — | 0 |
+| 187 | test/core/aviso-release.test.ts | 0.2 | 0 | 0 | — | 0 |
+| 188 | test/core/catalogo-skills.test.ts | 0.2 | 0 | 0 | — | 0 |
+| 189 | test/core/cierre.test.ts | 0.2 | 0 | 0 | — | 0 |
+| 190 | test/core/cobertura.test.ts | 0.2 | 0 | 0 | — | 0 |
+| 191 | test/core/comando-tests.test.ts | 0.2 | 0 | 0 | — | 0 |
+| 192 | test/core/config-sincronizacion.test.ts | 0.2 | 0 | 0 | — | 0 |
diff --git a/docs/contexto/CONVENCIONES.md b/docs/contexto/CONVENCIONES.md
index c44c825..c42eea2 100644
--- a/docs/contexto/CONVENCIONES.md
+++ b/docs/contexto/CONVENCIONES.md
@@ -66,9 +66,21 @@ vale; lo que no vale es inventar hallazgos para tener algo que reportar.
 ## Tests
 
 - `node:test` nativo, cero frameworks.
-- **Siempre contra recursos reales**: repos Git temporales de verdad, incluido
-  un segundo repo temporal haciendo de `origin` cuando hace falta. Nunca mocks
-  de Git ni del filesystem.
+- **Pirámide (TASK-122)**: la lógica se prueba **sin Git**, como función pura
+  sobre datos (rutas, texto de `tarea.md`, salida ya leída de Git), en
+  `test/core` y `test/cli`; Git real solo en una **capa fina de integración**
+  por comando (el camino feliz, el fallo que solo da Git de verdad y la
+  vuelta atrás). Cada caso nuevo de una regla va a la capa pura; no se monta
+  otro repo temporal para probar una variante de la misma decisión. Motivo:
+  el coste de la suite debe crecer con la lógica, no con procesos `git`
+  (`docs/auditoria/PERFIL-TESTS-2026-11-12.md`).
+- **En la capa de integración, siempre contra recursos reales**: repos Git
+  temporales de verdad, incluido un segundo repo temporal haciendo de `origin`
+  cuando hace falta. Nunca mocks de Git ni del filesystem. (Lo que la capa pura
+  recibe son datos, no un Git simulado.)
+- Verificación de una tarea **por impacto** (`node scripts/verificar-impacto.mjs`:
+  tests de lo que cambia + `test:rapido`); la suite completa, una vez por
+  versión antes de publicar.
 - Los ficheros de fixture que un comando vaya a leer se escriben **fuera del
   repo bajo prueba** (si no, ensucian su workspace y disparan el guard de §8.3).
 - Un test que no falla si el comportamiento cambia no es un test.
diff --git a/scripts/perfil-tests.mjs b/scripts/perfil-tests.mjs
new file mode 100644
index 0000000..7da1410
--- /dev/null
+++ b/scripts/perfil-tests.mjs
@@ -0,0 +1,215 @@
+#!/usr/bin/env node
+/**
+ * Perfil de la suite de tests — TASK-122.
+ *
+ * Corre cada fichero de test compilado (`dist/test/**\/*.test.js`) en su propio
+ * `node --test` y anota cuanto tarda, cuantos tests tiene y cuantos procesos
+ * `git` lanza. Sirve para ver que ficheros pagan Git real y cuales podrian
+ * probarse sin el (regla de la piramide de docs/contexto/CONVENCIONES.md).
+ *
+ * Como se cuentan los `git`: solo en esta ejecucion de medida (la suite no lo
+ * ve), un directorio temporal va delante en el PATH con un envoltorio `git`
+ * (script de shell) que anota cada llamada y ejecuta el git real. En Linux eso
+ * lo ve todo. En Windows `spawnSync('git')` sin shell solo busca `git.exe`, asi
+ * que ademas se precarga (NODE_OPTIONS --require) un modulo que anota las
+ * llamadas a `git` desde node; el envoltorio de shell cubre las que hacen los
+ * scripts de bash (Git-Flow). Ninguna llamada se cuenta dos veces.
+ *
+ * Uso (desde la raiz del repo):
+ *   node scripts/perfil-tests.mjs [--dir <plugin>] [--filtro test/commands]
+ *        [--concurrencia N] [--sin-build] [--json] [--salida informe.md]
+ *
+ * Con --concurrencia > 1 los ficheros corren a la vez: las duraciones se
+ * inflan, pero el orden relativo y el recuento de git no cambian.
+ * Cero dependencias: node >= 22.
+ */
+import { spawn, spawnSync } from 'node:child_process';
+import { chmodSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+
+const PLUGIN = 'taskcode-marketplace/plugins/taskcode-plugin';
+const WIN = process.platform === 'win32';
+
+function opciones(argv) {
+  const o = { dir: null, filtro: null, concurrencia: 1, sinBuild: false, json: false, salida: null };
+  for (let i = 0; i < argv.length; i++) {
+    const a = argv[i];
+    if (a === '--dir') o.dir = argv[++i];
+    else if (a === '--filtro') o.filtro = argv[++i];
+    else if (a === '--concurrencia') o.concurrencia = Math.max(1, Number(argv[++i]) || 1);
+    else if (a === '--sin-build') o.sinBuild = true;
+    else if (a === '--json') o.json = true;
+    else if (a === '--salida') o.salida = argv[++i];
+    else throw new Error(`argumento desconocido: ${a}`);
+  }
+  return o;
+}
+
+function gitReal() {
+  const r = WIN
+    ? spawnSync('where', ['git'], { encoding: 'utf8' })
+    : spawnSync('sh', ['-c', 'command -v git'], { encoding: 'utf8' });
+  const ruta = (r.stdout ?? '').split(/\r?\n/).map((l) => l.trim()).find((l) => l !== '' && (!WIN || /\.exe$/i.test(l)));
+  if (ruta === undefined) throw new Error('no encuentro el git real en el PATH');
+  return ruta;
+}
+
+const HOOK_NODE = `
+const cp = require('node:child_process');
+const fs = require('node:fs');
+const path = require('node:path');
+const log = process.env.PERFIL_GIT_LOG;
+const esGit = (c, shell) => {
+  if (typeof c !== 'string') return false;
+  if (shell) return /^\\s*"?git(\\.exe)?"?(\\s|$)/i.test(c);
+  return /^git(\\.exe)?$/i.test(path.basename(c));
+};
+const anotar = () => { try { fs.appendFileSync(log, 'node\\n'); } catch {} };
+for (const nombre of ['spawn', 'spawnSync', 'execFile', 'execFileSync']) {
+  const orig = cp[nombre];
+  cp[nombre] = function (c, a, o) {
+    const opts = Array.isArray(a) ? o : a;
+    if (esGit(c, opts && typeof opts === 'object' && opts.shell)) anotar();
+    return orig.apply(this, arguments);
+  };
+}
+for (const nombre of ['exec', 'execSync']) {
+  const orig = cp[nombre];
+  cp[nombre] = function (c) { if (esGit(c, true)) anotar(); return orig.apply(this, arguments); };
+}
+require('node:module').syncBuiltinESMExports();
+`;
+
+/** Prepara el directorio del envoltorio y devuelve el entorno de medida. */
+function entornoDeMedida(dirTmp) {
+  const real = gitReal().replace(/\\/g, '/');
+  const envoltorio = path.join(dirTmp, 'git');
+  writeFileSync(envoltorio, `#!/bin/sh\necho sh >> "$PERFIL_GIT_LOG"\nexec "${real}" "$@"\n`);
+  chmodSync(envoltorio, 0o755);
+  const env = { ...process.env };
+  delete env.NODE_TEST_CONTEXT;
+  const clavePath = Object.keys(env).find((k) => k.toUpperCase() === 'PATH') ?? 'PATH';
+  env[clavePath] = `${dirTmp}${path.delimiter}${env[clavePath] ?? ''}`;
+  if (WIN) {
+    const hook = path.join(dirTmp, 'contar-git.cjs');
+    writeFileSync(hook, HOOK_NODE);
+    env.NODE_OPTIONS = `${env.NODE_OPTIONS ?? ''} --require "${hook.replace(/\\/g, '/')}"`.trim();
+  }
+  return env;
+}
+
+function ficherosDeTest(dirPlugin, filtro) {
+  const base = path.join(dirPlugin, 'dist', 'test');
+  const sub = filtro === null ? base : path.join(dirPlugin, 'dist', filtro);
+  const salida = [];
+  const recorrer = (d) => {
+    if (!existsSync(d)) return;
+    for (const n of readdirSync(d)) {
+      const abs = path.join(d, n);
+      if (statSync(abs).isDirectory()) recorrer(abs);
+      else if (n.endsWith('.test.js')) salida.push(abs);
+    }
+  };
+  recorrer(sub);
+  return salida.sort();
+}
+
+function correrFichero(dirPlugin, fichero, env, dirTmp, indice) {
+  const log = path.join(dirTmp, `git-${String(indice)}.log`);
+  writeFileSync(log, '');
+  const inicio = Date.now();
+  return new Promise((resolve) => {
+    const hijo = spawn(process.execPath, ['--test', '--test-reporter=tap', fichero], {
+      cwd: dirPlugin,
+      env: { ...env, PERFIL_GIT_LOG: log },
+      windowsHide: true,
+    });
+    let salida = '';
+    hijo.stdout.on('data', (d) => (salida += d));
+    hijo.stderr.on('data', () => {});
+    hijo.on('close', (codigo) => {
+      const num = (clave) => Number(new RegExp(`^# ${clave} (\\d+)`, 'm').exec(salida)?.[1] ?? 0);
+      const lineas = readFileSync(log, 'utf8').split('\n').filter(Boolean);
+      resolve({
+        fichero: path.relative(dirPlugin, fichero).replace(/\\/g, '/').replace(/^dist\//, '').replace(/\.js$/, '.ts'),
+        segundos: Math.round((Date.now() - inicio) / 100) / 10,
+        tests: num('tests'),
+        fallos: num('fail'),
+        git: lineas.length,
+        codigo,
+      });
+    });
+  });
+}
+
+export function formatearInforme(filas, contexto) {
+  const total = filas.reduce((s, f) => s + f.segundos, 0);
+  const git = filas.reduce((s, f) => s + f.git, 0);
+  const cab = [
+    `Ficheros: ${String(filas.length)}. Tests: ${String(filas.reduce((s, f) => s + f.tests, 0))}. ` +
+      `Suma de duraciones: ${(total / 60).toFixed(1)} min. Procesos git: ${String(git)}.`,
+    contexto,
+    '',
+    '| # | fichero | s | tests | git | git/test | fallos |',
+    '|---|---|---|---|---|---|---|',
+  ];
+  const cuerpo = [...filas]
+    .sort((a, b) => b.segundos - a.segundos)
+    .map(
+      (f, i) =>
+        `| ${String(i + 1)} | ${f.fichero} | ${String(f.segundos)} | ${String(f.tests)} | ${String(f.git)} | ` +
+        `${f.tests === 0 ? '—' : (f.git / f.tests).toFixed(1)} | ${String(f.fallos)} |`
+    );
+  return [...cab, ...cuerpo, ''].join('\n');
+}
+
+async function main(argv) {
+  const o = opciones(argv);
+  const raiz = (spawnSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).stdout ?? '').trim();
+  const dirPlugin = path.resolve(o.dir ?? path.join(raiz, ...PLUGIN.split('/')));
+  if (!o.sinBuild) {
+    const b = spawnSync('npm run limpiar:test && npm run build', { cwd: dirPlugin, shell: true, stdio: 'inherit' });
+    if (b.status !== 0) return 1;
+  }
+  const ficheros = ficherosDeTest(dirPlugin, o.filtro);
+  const dirTmp = mkdtempSync(path.join(tmpdir(), 'perfil-tests-'));
+  try {
+    const env = entornoDeMedida(dirTmp);
+    const filas = [];
+    let siguiente = 0;
+    const trabajador = async () => {
+      while (siguiente < ficheros.length) {
+        const i = siguiente++;
+        const fila = await correrFichero(dirPlugin, ficheros[i], env, dirTmp, i);
+        filas.push(fila);
+        if (!o.json) process.stderr.write(`[perfil] ${String(filas.length)}/${String(ficheros.length)} ${fila.fichero}: ${String(fila.segundos)} s, git ${String(fila.git)}\n`);
+      }
+    };
+    await Promise.all(Array.from({ length: o.concurrencia }, trabajador));
+    filas.sort((a, b) => a.fichero.localeCompare(b.fichero));
+    const contexto =
+      `Medido con node ${process.version} en ${process.platform}, concurrencia ${String(o.concurrencia)}` +
+      (o.filtro === null ? '' : `, solo ${o.filtro}`) + '.';
+    if (o.json) console.log(JSON.stringify({ contexto, filas }, null, 2));
+    else {
+      const informe = formatearInforme(filas, contexto);
+      if (o.salida !== null) writeFileSync(o.salida, informe);
+      console.log(informe);
+    }
+    return filas.some((f) => f.codigo !== 0) ? 1 : 0;
+  } finally {
+    rmSync(dirTmp, { recursive: true, force: true });
+  }
+}
+
+if (process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
+  main(process.argv.slice(2)).then(
+    (c) => (process.exitCode = c),
+    (e) => {
+      console.error(`[ERROR] perfil-tests: ${e.message}`);
+      process.exitCode = 2;
+    }
+  );
+}
diff --git a/scripts/verificar-impacto.mjs b/scripts/verificar-impacto.mjs
new file mode 100644
index 0000000..8c034e2
--- /dev/null
+++ b/scripts/verificar-impacto.mjs
@@ -0,0 +1,356 @@
+#!/usr/bin/env node
+/**
+ * Verificacion por impacto de TaskCode — TASK-122.
+ *
+ * Es la `comando_verificacion_selectiva` de este repo: la que corren `finish`
+ * (nivel 2 de la verificacion proporcional), el freno Stop y las rondas de
+ * `review`. La suite completa (`comando_verificacion`) queda para antes de
+ * publicar cada version. Regla de la tarea: cada paso de una tarea cuesta en
+ * proporcion a lo que cambia, nunca al tamano del proyecto.
+ *
+ * Que hace, desde la raiz del repo (es donde lo lanza taskctl):
+ * 1. Saca los ficheros cambiados: `git diff --name-only <base>...HEAD` (la base
+ *    llega en RAMA_BASE; sin ella, `develop`) mas lo no commiteado.
+ * 2. Elige los ficheros de test del plugin:
+ *    - un `test/**\/*.test.ts` cambiado se corre;
+ *    - un `.ts` de `src/` o `test/` cambiado: los tests que lo importan, directa
+ *      o transitivamente (grafo de imports relativos leido con una expresion
+ *      regular, sin compilar). La busqueda se para en `src/cli.ts`, el
+ *      enrutador de comandos: mas alla solo entran los tests que nombran un
+ *      comando por el que el cambio llego a el (ver `testsQueDependenDe`);
+ *    - un fichero que los tests usan sin importarlo: `bin/taskctl` cuenta como
+ *      importado por quien lo lanza (marcador `'bin', 'taskctl'`), igual que
+ *      `scripts/gitflow/**` (marcador `'scripts', 'gitflow'`); cualquier otro
+ *      fichero que no es documentacion, por los tests que mencionan su nombre;
+ *      si nadie lo menciona, la suite entera (ante la duda, todo);
+ *    - `package.json`, `package-lock.json` y `tsconfig.json`: la suite entera;
+ *    - documentacion y config del repo (`docs/**`, `tareas/**`, `.taskcode/**`,
+ *      `.github/**`, `.claude/**`, los `.md` de la raiz) y
+ *      `dist/src/**` (generado): nada.
+ * 3. Siempre suma los tests de `test/core` y `test/cli` (lo de
+ *    `npm run test:rapido`, ~10 s): red barata de toda la logica sin Git.
+ * 4. Compila una vez (`npm run build`) y corre `node --test` con lo elegido.
+ *    Imprime que eligio y por que, y sale con el codigo de `node --test`.
+ *
+ * `--listar` solo imprime la seleccion en JSON (sin compilar ni ejecutar).
+ * Cero dependencias: node >= 22.
+ */
+import { spawnSync } from 'node:child_process';
+import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+
+export const PLUGIN = 'taskcode-marketplace/plugins/taskcode-plugin';
+const RAPIDO = ['test/core', 'test/cli'];
+const TODO_EL_PROYECTO = new Set(['package.json', 'package-lock.json', 'tsconfig.json']);
+const MARCADORES = [
+  { patron: /['"]bin['"]\s*,\s*['"]taskctl['"]|bin\/taskctl/, dependeDe: (f) => f === 'bin/taskctl' || f === 'bin/taskctl.cmd' },
+  { patron: /['"]scripts['"]\s*,\s*['"]gitflow['"]|scripts\/gitflow/, dependeDe: (f) => f.startsWith('scripts/gitflow/') },
+];
+/** El enrutador de comandos (ver testsQueDependenDe); es lo que carga `bin/taskctl`. */
+export const ENRUTADOR = 'src/cli.ts';
+const LANZA_TASKCTL = MARCADORES[0].patron;
+const IMPORT_RE = /(?:\bfrom\s*|\bimport\s*\(?\s*)['"](\.{1,2}\/[^'"]+)['"]/g;
+
+function git(args, cwd) {
+  const r = spawnSync('git', args, { cwd, encoding: 'utf8', windowsHide: true });
+  return r.status === 0 ? r.stdout : null;
+}
+
+function lineas(s) {
+  return (s ?? '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
+}
+
+/** Rutas (relativas a la raiz del repo) cambiadas frente a la base, o null si la base no existe. */
+export function rutasCambiadas(raiz, base) {
+  if (git(['rev-parse', '--verify', '--quiet', `${base}^{commit}`], raiz) === null) return null;
+  const commiteado = git(['diff', '--name-only', '--no-renames', `${base}...HEAD`], raiz);
+  if (commiteado === null) return null;
+  const sinCommitear = git(['diff', '--name-only', '--no-renames', 'HEAD'], raiz) ?? '';
+  const nuevos = git(['ls-files', '--others', '--exclude-standard'], raiz) ?? '';
+  return [...new Set([...lineas(commiteado), ...lineas(sinCommitear), ...lineas(nuevos)])].sort();
+}
+
+function recorrer(dir, base, salida) {
+  if (!existsSync(dir)) return;
+  for (const nombre of readdirSync(dir)) {
+    const abs = path.join(dir, nombre);
+    const rel = `${base}/${nombre}`;
+    if (statSync(abs).isDirectory()) recorrer(abs, rel, salida);
+    else if (nombre.endsWith('.ts')) salida.push(rel);
+  }
+}
+
+function resolverImport(desde, especificador, existentes) {
+  const unido = path.posix.normalize(path.posix.join(path.posix.dirname(desde), especificador));
+  const candidatos = [unido.replace(/\.js$/, '.ts'), unido, `${unido}.ts`, `${unido}/index.ts`];
+  return candidatos.find((c) => existentes.has(c)) ?? null;
+}
+
+/** Grafo del plugin: por fichero `.ts` (relativo al plugin), su texto y lo que importa. */
+export function grafoDelPlugin(dirPlugin) {
+  const ficheros = [];
+  recorrer(path.join(dirPlugin, 'src'), 'src', ficheros);
+  recorrer(path.join(dirPlugin, 'test'), 'test', ficheros);
+  const existentes = new Set(ficheros);
+  const nodos = new Map();
+  for (const f of ficheros) {
+    const texto = readFileSync(path.join(dirPlugin, f), 'utf8');
+    const importa = new Set();
+    for (const m of texto.matchAll(IMPORT_RE)) {
+      const destino = resolverImport(f, m[1], existentes);
+      if (destino !== null) importa.add(destino);
+    }
+    // Quien lanza bin/taskctl ejecuta src/cli.ts (o la via rapida de estado) sin importarlo.
+    if (LANZA_TASKCTL.test(texto)) {
+      for (const d of [ENRUTADOR, 'src/commands/estado.ts']) if (existentes.has(d)) importa.add(d);
+    }
+    nodos.set(f, { texto, importa });
+  }
+  return nodos;
+}
+
+const esTest = (f) => f.startsWith('test/') && f.endsWith('.test.ts');
+const enRapido = (f) => RAPIDO.some((d) => f.startsWith(`${d}/`));
+
+/** Nombres con los que se invoca por CLI el comando de `src/commands/<x>.ts` (`finish-verificacion` -> finish). */
+function nombresDeComando(fichero) {
+  const x = path.posix.basename(fichero, '.ts');
+  return [...new Set([x, x.split('-')[0]])];
+}
+
+/**
+ * Tests que dependen (directa o transitivamente) de alguno de `origenes`.
+ *
+ * `src/cli.ts` es el enrutador de todos los comandos: casi todo test de un
+ * comando lo importa (o lanza `bin/taskctl`) para ejecutar SU comando, no los
+ * demas. Pasar por el sin filtro elegiria casi la suite entera para cualquier
+ * cambio. Asi que la busqueda se para en el y, mas alla, solo entran los tests
+ * que nombran entre comillas (en su texto o en el de un helper que importan)
+ * alguno de los comandos por los que el cambio llego al enrutador. Si el cambio
+ * es el propio enrutador, o llega a el sin pasar por ningun comando, entran
+ * todos los que dependen de el.
+ */
+function testsQueDependenDe(nodos, origenes) {
+  const inverso = new Map();
+  for (const [f, n] of nodos) {
+    for (const d of n.importa) {
+      if (!inverso.has(d)) inverso.set(d, new Set());
+      inverso.get(d).add(f);
+    }
+  }
+  const buscar = (inicio, parar) => {
+    const vistos = new Set(inicio);
+    const cola = [...inicio];
+    while (cola.length > 0) {
+      const actual = cola.shift();
+      if (parar.has(actual) && !inicio.includes(actual)) continue;
+      for (const quien of inverso.get(actual) ?? []) {
+        if (!vistos.has(quien)) {
+          vistos.add(quien);
+          cola.push(quien);
+        }
+      }
+    }
+    return vistos;
+  };
+  const vistos = buscar(origenes, new Set([ENRUTADOR]));
+  const tests = new Set([...vistos].filter(esTest));
+  if (vistos.has(ENRUTADOR) && !origenes.includes(ENRUTADOR)) {
+    const comandos = [...vistos].filter((f) => f.startsWith('src/commands/')).flatMap(nombresDeComando);
+    const nombra = (t) => {
+      const propios = [t, ...[...(nodos.get(t)?.importa ?? [])].filter((d) => d.startsWith('test/'))];
+      const textos = propios.map((f) => nodos.get(f)?.texto ?? '');
+      return comandos.some((c) => textos.some((x) => x.includes(`'${c}'`) || x.includes(`"${c}"`)));
+    };
+    for (const t of buscar([ENRUTADOR], new Set())) {
+      if (esTest(t) && (comandos.length === 0 || nombra(t))) tests.add(t);
+    }
+  }
+  return [...tests];
+}
+
+/**
+ * Lo que no amplia la seleccion: documentacion, estado de las tareas y
+ * configuracion del propio repo (`.taskcode/`, `.github/`, `.claude/`). La
+ * config de taskctl la leen los comandos en uso, no la suite del plugin: por su
+ * nombre (`config.yml`) arrastraba 162 ficheros de test.
+ */
+function esDocumentacion(ruta) {
+  return (
+    ruta.startsWith('docs/') ||
+    ruta.startsWith('tareas/') ||
+    ruta.startsWith('.taskcode/') ||
+    ruta.startsWith('.github/') ||
+    ruta.startsWith('.claude/') ||
+    (!ruta.includes('/') && ruta.endsWith('.md')) ||
+    // Los .md de la raiz del plugin (README): su nombre lo cita media suite.
+    (ruta.startsWith(`${PLUGIN}/`) && !ruta.slice(PLUGIN.length + 1).includes('/') && ruta.endsWith('.md'))
+  );
+}
+
+/**
+ * Tope de ficheros de test por impacto (fuera de los de test:rapido). Por
+ * encima, la seleccion ya no es proporcional al cambio (un modulo comun como
+ * `core/config.ts` arrastra 110 de 192): se corren test:rapido mas los tests
+ * DIRECTOS de lo cambiado y se dice. Lo demas lo cubre la completa antes de
+ * publicar. Se cambia con VERIFICAR_IMPACTO_TOPE. Por que 10: en Windows,
+ * cada fichero que recorre el ciclo por CLI tarda 50-60 s con la suite en
+ * paralelo; con 14 de ellos la verificacion de TASK-122 tardo 178 s y con el
+ * tope en 10 (6 directos), 64 s.
+ */
+export const TOPE_POR_DEFECTO = 10;
+
+/**
+ * Decide que tests corren. Devuelve { todo, motivo?, tests, recorte? }: `tests`
+ * son [{ fichero, motivo }] relativos al plugin (`test/...test.ts`); `todo` =
+ * haria falta la suite entera; `recorte` (texto) = la seleccion pasaba del tope
+ * o pedia la suite entera y `tests` son solo los directos.
+ */
+export function seleccionar(cambiadas, nodos, tope = TOPE_POR_DEFECTO) {
+  const elegidos = new Map();
+  const directos = new Map();
+  const anotar = (mapa, fichero, motivo) => {
+    if (!mapa.has(fichero)) mapa.set(fichero, motivo);
+  };
+  let todo = null;
+  for (const ruta of cambiadas) {
+    if (esDocumentacion(ruta)) continue;
+    const enPlugin = ruta.startsWith(`${PLUGIN}/`);
+    const rel = enPlugin ? ruta.slice(PLUGIN.length + 1) : ruta;
+    if (enPlugin && rel.startsWith('dist/')) continue;
+    if (enPlugin && TODO_EL_PROYECTO.has(rel)) {
+      todo ??= `cambia ${ruta}, que afecta a toda la suite`;
+      continue;
+    }
+    if (enPlugin && rel.endsWith('.ts') && (rel.startsWith('src/') || rel.startsWith('test/'))) {
+      if (esTest(rel) && nodos.has(rel)) {
+        anotar(elegidos, rel, 'test cambiado');
+        anotar(directos, rel, 'test cambiado');
+      }
+      if (!nodos.has(rel)) continue; // borrado: quien lo importaba tambien cambia
+      for (const t of testsQueDependenDe(nodos, [rel])) anotar(elegidos, t, `importa ${rel}`);
+      for (const [f, n] of nodos) if (esTest(f) && n.importa.has(rel)) anotar(directos, f, `importa ${rel}`);
+      continue;
+    }
+    // Ficheros que los tests usan sin importarlos.
+    const marcados = [...nodos].filter(([, n]) => MARCADORES.some((m) => enPlugin && m.dependeDe(rel) && m.patron.test(n.texto)));
+    const nombre = path.posix.basename(ruta);
+    const mencionan = marcados.length > 0 ? marcados : [...nodos].filter(([, n]) => n.texto.includes(nombre));
+    if (mencionan.length === 0) {
+      todo ??= `ningun test referencia ${ruta}: ante la duda, la suite entera`;
+      continue;
+    }
+    for (const t of testsQueDependenDe(nodos, mencionan.map(([f]) => f))) anotar(elegidos, t, `usa ${ruta}`);
+    for (const [f] of mencionan) if (esTest(f)) anotar(directos, f, `usa ${ruta}`);
+  }
+  const lista = (mapa) => [...mapa].map(([fichero, motivo]) => ({ fichero, motivo })).sort((a, b) => a.fichero.localeCompare(b.fichero));
+  const contar = (mapa) => [...mapa.keys()].filter((f) => !enRapido(f)).length;
+  // Si ni los directos caben en el tope, solo los tests cambiados (siempre pocos).
+  const recortados = () => {
+    if (contar(directos) <= tope) return { tests: lista(directos), que: 'solo los tests directos' };
+    const cambiados = new Map([...directos].filter(([, m]) => m === 'test cambiado'));
+    return { tests: lista(cambiados), que: `solo los tests cambiados (${String(contar(directos))} directos pasan tambien del tope)` };
+  };
+  if (todo !== null) {
+    const r = recortados();
+    return { todo: true, motivo: todo, tests: r.tests, recorte: `${todo}; se corren ${r.que}` };
+  }
+  const fuera = contar(elegidos);
+  if (fuera > tope) {
+    const r = recortados();
+    return {
+      todo: false,
+      tests: r.tests,
+      recorte: `${String(fuera)} ficheros por impacto pasan del tope de ${String(tope)}; se corren ${r.que}`,
+    };
+  }
+  return { todo: false, tests: lista(elegidos) };
+}
+
+/** VERIFICAR_IMPACTO_TOPE si es un entero >= 0; si no, el de por defecto. */
+function leerTope(valor) {
+  const n = Number(valor);
+  return valor !== undefined && valor.trim() !== '' && Number.isInteger(n) && n >= 0 ? n : TOPE_POR_DEFECTO;
+}
+
+function aDist(fichero) {
+  return `dist/${fichero.replace(/\.ts$/, '.js')}`;
+}
+
+function npm(script, dirPlugin) {
+  const r = spawnSync(`npm run ${script}`, { cwd: dirPlugin, stdio: 'inherit', shell: true, windowsHide: true });
+  return r.status ?? 1;
+}
+
+function main(argv) {
+  const listar = argv.includes('--listar');
+  const raiz = lineas(git(['rev-parse', '--show-toplevel'], process.cwd()))[0];
+  if (raiz === undefined) {
+    console.error('[ERROR] verificar-impacto: no estoy dentro de un repositorio Git.');
+    return 2;
+  }
+  const dirPlugin = path.join(raiz, ...PLUGIN.split('/'));
+  const base = process.env.RAMA_BASE || 'develop';
+  const cambiadas = rutasCambiadas(raiz, base);
+  const nodos = grafoDelPlugin(dirPlugin);
+  const seleccion =
+    cambiadas === null
+      ? { todo: true, motivo: `no existe la rama base "${base}": ante la duda, la suite entera`, tests: [] }
+      : seleccionar(cambiadas, nodos, leerTope(process.env.VERIFICAR_IMPACTO_TOPE));
+  const rapido = RAPIDO.filter((d) => existsSync(path.join(dirPlugin, d)));
+  const fuera = seleccion.tests.filter((t) => !enRapido(t.fichero));
+
+  if (listar) {
+    console.log(JSON.stringify({ base, cambiadas, ...seleccion, rapido }, null, 2));
+    return 0;
+  }
+
+  console.log(`[verificar-impacto] Base: ${base}. Ficheros cambiados: ${String(cambiadas?.length ?? 0)}.`);
+  console.log(`[verificar-impacto] Siempre: ${rapido.join(', ')} (lo de test:rapido).`);
+  if (seleccion.recorte !== undefined) {
+    console.log(`[verificar-impacto] Seleccion recortada: ${seleccion.recorte}. La suite completa queda para antes de publicar.`);
+  }
+  console.log(`[verificar-impacto] Por impacto: ${String(fuera.length)} fichero(s) de test.`);
+  for (const t of fuera) console.log(`  - ${t.fichero} (${t.motivo})`);
+
+  const objetivos = [...rapido.map((d) => `dist/${d}/**/*.test.js`), ...fuera.map((t) => aDist(t.fichero))];
+  if (objetivos.length === 0) {
+    console.log('[verificar-impacto] No hay tests que correr.');
+    return 0;
+  }
+  // La verificacion no puede cambiar el arbol: `npm run build` reescribe
+  // dist/src (versionado). Se guarda antes y se devuelve tal cual al acabar.
+  const distSrc = path.join(dirPlugin, 'dist', 'src');
+  const copia = mkdtempSync(path.join(tmpdir(), 'verificar-impacto-'));
+  const habiaDist = existsSync(distSrc);
+  if (habiaDist) cpSync(distSrc, path.join(copia, 'src'), { recursive: true });
+  try {
+    if (existsSync(path.join(dirPlugin, 'package.json'))) {
+      const scripts = JSON.parse(readFileSync(path.join(dirPlugin, 'package.json'), 'utf8')).scripts ?? {};
+      if (scripts['limpiar:test'] && npm('limpiar:test', dirPlugin) !== 0) return 1;
+      if (scripts.build && npm('build', dirPlugin) !== 0) return 1;
+    }
+    const inicio = Date.now();
+    // Sin NODE_TEST_CONTEXT: si quien lanza esto corre bajo node --test, el hijo
+    // se tomaria por un subtest y no imprimiria su informe.
+    const env = { ...process.env };
+    delete env.NODE_TEST_CONTEXT;
+    const r = spawnSync(process.execPath, ['--test', '--test-reporter=spec', ...objetivos], {
+      cwd: dirPlugin,
+      env,
+      stdio: 'inherit',
+      windowsHide: true,
+    });
+    console.log(`[verificar-impacto] node --test termino con ${String(r.status)} en ${((Date.now() - inicio) / 1000).toFixed(1)} s.`);
+    return r.status ?? 1;
+  } finally {
+    rmSync(distSrc, { recursive: true, force: true });
+    if (habiaDist) cpSync(path.join(copia, 'src'), distSrc, { recursive: true });
+    rmSync(copia, { recursive: true, force: true });
+  }
+}
+
+const invocadoDirecto = process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
+if (invocadoDirecto) process.exitCode = main(process.argv.slice(2));
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/README.md b/taskcode-marketplace/plugins/taskcode-plugin/README.md
index 4a1c027..a4f41ad 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/README.md
+++ b/taskcode-marketplace/plugins/taskcode-plugin/README.md
@@ -1579,7 +1579,14 @@ marcas; las de solo día se cuentan en «solo dia»), rondas medias, hallazgos
 IMPORTANTE por tarea, tokens de revisión medios y KB medios de la petición de
 revisión por ronda. Cada cifra lleva su `n` (las tareas que tienen ese dato);
 «— (n=0)» es que ninguna lo tiene. Dice cuántas terminadas quedan fuera por no
-tener fecha de cierre (por proyecto con varios repos).
+tener fecha de cierre (por proyecto con varios repos). Al final de cada fila,
+el coste fijo por tarea frente al tamaño del proyecto: `cerradas` (tareas
+cerradas al acabar el tramo) y las medianas de minutos de punta a punta, de la
+fase de revisión y del propio `finish` (de las tareas con hora). Una línea
+final compara el primer tramo con el último (el último completo, si hay dos o
+más) y dice si ese coste **crece**, **baja** o **se mantiene** (cambio de
+menos del 15 %): si crece con las tareas cerradas, algún paso de cada tarea
+está pagando el tamaño del proyecto.
 
 **`--grupos`** sustituye la tabla por grupos de tareas terminadas: por tipo, por
 complejidad declarada, por número de criterios (0-4, 5-6, 7 o más), por KB de
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/src/core/evolucion.ts b/taskcode-marketplace/plugins/taskcode-plugin/src/core/evolucion.ts
index 5d1e983..438d4f1 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/src/core/evolucion.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/src/core/evolucion.ts
@@ -25,11 +25,22 @@
  *  - tokens de revision: media de `tokens_revision` registrado.
  *  - KB de peticion de revision: media, por tarea, de los KB de su peticion
  *    en cada ronda (`kbPorTarea`), y media de eso en el tramo.
+ *
+ * TASK-122 (coste fijo frente al tamano del proyecto): por tramo, ademas, la
+ * mediana de minutos de punta a punta (start -> finish sin pausas), de la fase
+ * de revision (primer review -> ultimo finish) y del propio `finish` (P-1),
+ * solo de las tareas con precision de segundo, y cuantas tareas llevaba
+ * cerradas el proyecto al acabar el tramo. `tendenciaCosteFijo` compara el
+ * primer tramo con el ultimo: crece o baja si la mediana cambia mas de un
+ * `UMBRAL_TENDENCIA`; si no, se mantiene.
  */
-import { media, mediana, tablaDeTexto, type FilaMetricas } from './metricas.js';
+import { media, mediana, tablaDeTexto, type Duracion, type FilaMetricas } from './metricas.js';
 
 export const TRAMO_POR_DEFECTO = 20;
 
+/** TASK-122: cambio relativo (0.15 = 15 %) por debajo del cual el coste fijo «se mantiene». */
+export const UMBRAL_TENDENCIA = 0.15;
+
 /** Una cifra agregada y de cuantas tareas sale; `valor` null solo con `n` 0. */
 export interface Cifra {
   valor: number | null;
@@ -49,6 +60,12 @@ export interface TramoEvolucion {
   importantesPorTarea: Cifra;
   tokensRevision: Cifra;
   kbPeticionPorRonda: Cifra;
+  /** TASK-122: tareas cerradas del proyecto al acabar este tramo (las de este y las anteriores). */
+  cerradasAcumuladas: number;
+  /** TASK-122: medianas de minutos (solo precision de segundo) de punta a punta, revision y finish. */
+  minutosPuntaAPunta: Cifra;
+  minutosRevision: Cifra;
+  minutosFinish: Cifra;
 }
 
 export interface Evolucion {
@@ -92,7 +109,16 @@ function cifra(valores: readonly number[], decimales = 2): Cifra {
   return { valor: media(valores, decimales), n: valores.length };
 }
 
-function tramoDe(numero: number, filas: readonly FilaMetricas[]): TramoEvolucion {
+/** Mediana de minutos (un decimal) de las duraciones con precision de segundo. */
+function medianaMinutos(duraciones: readonly (Duracion | null)[]): Cifra {
+  const minutos = duraciones
+    .filter((d): d is Duracion => d !== null && d.precision === 'segundo')
+    .map((d) => d.valor / 60_000);
+  const m = mediana(minutos);
+  return { valor: m === null ? null : Math.round(m * 10) / 10, n: minutos.length };
+}
+
+function tramoDe(numero: number, filas: readonly FilaMetricas[], acumuladas: number): TramoEvolucion {
   const minutos = filas
     .filter((f) => f.total !== null && f.total.precision === 'segundo')
     .map((f) => (f.total as { valor: number }).valor / 60_000);
@@ -116,6 +142,10 @@ function tramoDe(numero: number, filas: readonly FilaMetricas[]): TramoEvolucion
       0
     ),
     kbPeticionPorRonda: cifra(filas.map(kbPorTarea).filter((v): v is number => v !== null), 1),
+    cerradasAcumuladas: acumuladas,
+    minutosPuntaAPunta: medianaMinutos(filas.map((f) => f.puntaAPunta)),
+    minutosRevision: medianaMinutos(filas.map((f) => f.revision)),
+    minutosFinish: medianaMinutos(filas.map((f) => f.finish)),
   };
 }
 
@@ -129,7 +159,8 @@ export function calcularEvolucion(filas: readonly FilaMetricas[], tamano = TRAMO
   }
   const tramos: TramoEvolucion[] = [];
   for (let i = 0; i < conCierre.length; i += tamano) {
-    tramos.push(tramoDe(tramos.length + 1, conCierre.slice(i, i + tamano)));
+    const trozo = conCierre.slice(i, i + tamano);
+    tramos.push(tramoDe(tramos.length + 1, trozo, i + trozo.length));
   }
   return {
     tamanoTramo: tamano,
@@ -140,6 +171,45 @@ export function calcularEvolucion(filas: readonly FilaMetricas[], tamano = TRAMO
   };
 }
 
+export type Tendencia = 'crece' | 'baja' | 'se mantiene' | 'sin datos';
+
+/** TASK-122: tendencia de una cifra del primer al ultimo tramo. */
+export function tendencia(primera: Cifra, ultima: Cifra): Tendencia {
+  if (primera.valor === null || ultima.valor === null) return 'sin datos';
+  if (primera.valor === 0) return ultima.valor === 0 ? 'se mantiene' : 'crece';
+  const cambio = (ultima.valor - primera.valor) / primera.valor;
+  if (cambio > UMBRAL_TENDENCIA) return 'crece';
+  if (cambio < -UMBRAL_TENDENCIA) return 'baja';
+  return 'se mantiene';
+}
+
+/**
+ * TASK-122: linea que compara el coste fijo por tarea (punta a punta, revision
+ * y finish) del primer tramo con el del ultimo; null con menos de dos tramos.
+ * Si hay al menos dos tramos completos, compara solo completos: un ultimo
+ * tramo de dos tareas no decide la tendencia (medido en ToolsaWeb: 2 tareas
+ * de 354 min contra 30 de 51).
+ */
+export function tendenciaCosteFijo(e: Evolucion): string | null {
+  if (e.tramos.length < 2) return null;
+  const completos = e.tramos.filter((t) => t.n === e.tamanoTramo);
+  const base = completos.length >= 2 ? completos : e.tramos;
+  const a = base[0] as TramoEvolucion;
+  const b = base[base.length - 1] as TramoEvolucion;
+  const parte = (nombre: string, x: Cifra, y: Cifra): string =>
+    `${nombre} ${x.valor === null ? '—' : String(x.valor)} -> ${y.valor === null ? '—' : String(y.valor)} min (${tendencia(x, y)})`;
+  return (
+    `Coste fijo por tarea, del tramo 1 (${String(a.cerradasAcumuladas)} cerradas) al ${String(b.tramo)} ` +
+    `(${String(b.cerradasAcumuladas)} cerradas): ` +
+    [
+      parte('punta a punta', a.minutosPuntaAPunta, b.minutosPuntaAPunta),
+      parte('revision', a.minutosRevision, b.minutosRevision),
+      parte('finish', a.minutosFinish, b.minutosFinish),
+    ].join('; ') +
+    `. Umbral: ${String(Math.round(UMBRAL_TENDENCIA * 100))} %.`
+  );
+}
+
 /** `valor (n=N)`, o `— (n=0)`. */
 export function celdaCifra(c: Cifra, sufijo = ''): string {
   return c.valor === null ? `— (n=0)` : `${String(c.valor)}${sufijo} (n=${String(c.n)})`;
@@ -152,7 +222,8 @@ export const NOTA_EVOLUCION =
   'dos marcas (las de solo dia van en «solo dia»); rondas = ultima ronda con informe; IMP/tarea = ' +
   'hallazgos IMPORTANTE una vez por tarea (revisor + ID), de las tareas con tabla de hallazgos; ' +
   'tok revision = media de tokens_revision registrado; KB/ronda = media por tarea de los KB de su ' +
-  'peticion de revision en cada ronda.';
+  'peticion de revision en cada ronda. cerradas = tareas cerradas del proyecto al acabar el tramo; ' +
+  'min punta a punta, min revision y min finish = medianas de las tareas con hora (coste fijo por tarea).';
 
 /** Texto de la evolucion: tabla de tramos y lo que quedo fuera. */
 export function formatearEvolucion(e: Evolucion, varios: boolean): string {
@@ -171,7 +242,22 @@ export function formatearEvolucion(e: Evolucion, varios: boolean): string {
     `${String(e.enTramos)} en tramos; fuera por no tener fecha de cierre: ${fuera}.`;
   if (e.tramos.length === 0) return [cabecera, '', NOTA_EVOLUCION].join('\n');
   const tabla = tablaDeTexto(
-    ['tramo', 'tareas', 'cierres', 'min plan->finish', 'solo dia', 'rondas', 'IMP/tarea', 'tok revision', 'KB/ronda'],
+    [
+      'tramo',
+      'tareas',
+      'cierres',
+      'min plan->finish',
+      'solo dia',
+      'rondas',
+      'IMP/tarea',
+      'tok revision',
+      'KB/ronda',
+      // TASK-122: coste fijo por tarea frente a las tareas cerradas (al final: no mueve las de antes).
+      'cerradas',
+      'min punta a punta',
+      'min revision',
+      'min finish',
+    ],
     e.tramos.map((t) => [
       String(t.tramo),
       String(t.n),
@@ -182,7 +268,12 @@ export function formatearEvolucion(e: Evolucion, varios: boolean): string {
       celdaCifra(t.importantesPorTarea),
       celdaCifra(t.tokensRevision),
       celdaCifra(t.kbPeticionPorRonda),
+      String(t.cerradasAcumuladas),
+      celdaCifra(t.minutosPuntaAPunta),
+      celdaCifra(t.minutosRevision),
+      celdaCifra(t.minutosFinish),
     ])
   );
-  return [cabecera, '', tabla, '', NOTA_EVOLUCION].join('\n');
+  const linea = tendenciaCosteFijo(e);
+  return [cabecera, '', tabla, ...(linea === null ? [] : ['', linea]), '', NOTA_EVOLUCION].join('\n');
 }
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-agregados.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-agregados.test.ts
index 70e7051..767939f 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-agregados.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-agregados.test.ts
@@ -231,3 +231,48 @@ test('--evolucion --grupos juntos: las dos secciones, en ese orden', async () =>
     assert.match(metricas(alfa, ['--grupos', '--tokens']).stderr, /--grupos no se combina con --tokens/);
   });
 });
+
+/** TASK-122: tarea con punta a punta, revision y finish medidos (minutos), cerrada el dia `dia`. */
+function conCoste(id: string, dia: string, punta: number, revision: number, finishMin: number): TareaFixture {
+  const fin = Date.parse(`${dia}T18:00:00Z`);
+  const iso = (ms: number) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z');
+  return {
+    id,
+    plan: iso(fin - (punta + 10) * 60_000),
+    start: iso(fin - punta * 60_000),
+    review: iso(fin - revision * 60_000),
+    finish: iso(fin),
+    cierreSegundos: finishMin * 60,
+  };
+}
+
+test('--evolucion (TASK-122): coste fijo por tramo frente a las cerradas, y la linea de tendencia', async () => {
+  await conRepos(async (crear) => {
+    const repo = await crear('gamma');
+    await escribirTareas(repo, [
+      conCoste('TASK-001', '2026-10-01', 60, 20, 5),
+      conCoste('TASK-002', '2026-10-02', 60, 20, 5),
+      conCoste('TASK-003', '2026-10-03', 90, 30, 5),
+      conCoste('TASK-004', '2026-10-04', 90, 30, 5),
+      conCoste('TASK-005', '2026-10-05', 120, 40, 5),
+      conCoste('TASK-006', '2026-10-06', 120, 10, 5),
+    ]);
+    const r = metricas(repo, ['--evolucion', '--tramo', '2']);
+    assert.equal(r.status, 0, r.stderr);
+    const t = filasTramo(r.stdout);
+    // Columnas nuevas al final: cerradas, min punta a punta, min revision, min finish.
+    assert.deepEqual(t.map((c) => c.slice(9)), [
+      ['2', '60 (n=2)', '20 (n=2)', '5 (n=2)'],
+      ['4', '90 (n=2)', '30 (n=2)', '5 (n=2)'],
+      ['6', '120 (n=2)', '25 (n=2)', '5 (n=2)'],
+    ]);
+    assert.match(
+      r.stdout,
+      /Coste fijo por tarea, del tramo 1 \(2 cerradas\) al 3 \(6 cerradas\): punta a punta 60 -> 120 min \(crece\); revision 20 -> 25 min \(crece\); finish 5 -> 5 min \(se mantiene\)\./
+    );
+    const j = metricas(repo, ['--evolucion', '--tramo', '3', '--json']);
+    assert.equal(j.status, 0, j.stderr);
+    const tramos = (JSON.parse(j.stdout) as { evolucion: { tramos: { cerradasAcumuladas: number; minutosRevision: { valor: number } }[] } }).evolucion.tramos;
+    assert.deepEqual(tramos.map((x) => [x.cerradasAcumuladas, x.minutosRevision.valor]), [[3, 20], [6, 30]]);
+  });
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-tokens.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-tokens.test.ts
index e5835d6..1d6cdbe 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-tokens.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/commands/metricas-tokens.test.ts
@@ -11,6 +11,7 @@ import { readFile, writeFile, mkdir, mkdtemp, rm, stat } from 'node:fs/promises'
 import { tmpdir } from 'node:os';
 import path from 'node:path';
 import { readTareaFile } from '../../src/fs/task-store.js';
+import { plantillaRepo } from '../helpers/repo-plantilla.js';
 import {
   MARCADOR_FIN_TOKENS,
   MARCADOR_INICIO_TOKENS,
@@ -22,7 +23,6 @@ import {
   commitAll,
   cli,
   cliOk,
-  withRepo,
   dirRevision,
   hastaCodigo,
   nueva,
@@ -54,11 +54,27 @@ async function escenario(repoRoot: string, tareasRoot: string): Promise<void> {
   assert.equal((await readTareaFile(tareasRoot, ID2))?.task.tokens_diseno, null);
 }
 
+/**
+ * TASK-122 (piramide): el escenario recorre el ciclo entero por CLI (~150
+ * procesos git). Se monta UNA vez por fichero y cada test recibe una copia; antes
+ * se repetia en los siete tests (107 s el fichero, 1167 procesos git).
+ */
+const conEscenario = plantillaRepo('taskctl-metricas-tokens-', async (repoRoot) => {
+  git(['init', '-q', '-b', 'main'], repoRoot);
+  git(['config', 'user.email', 'test@example.com'], repoRoot);
+  git(['config', 'user.name', 'Test'], repoRoot);
+  await mkdir(path.join(repoRoot, '.taskcode'), { recursive: true });
+  await writeFile(path.join(repoRoot, '.taskcode', 'config.yml'), CONFIG_AUTO, 'utf8');
+  await writeFile(path.join(repoRoot, 'app.txt'), 'inicial\n', 'utf8');
+  commitAll(repoRoot, 'inicial');
+  git(['checkout', '-q', '-b', 'develop'], repoRoot);
+  await escenario(repoRoot, path.join(repoRoot, 'tareas'));
+});
+
 const METRICAS_MD = (repoRoot: string): string => path.join(repoRoot, 'docs', 'METRICAS.md');
 
 test('metricas --tokens: columnas por fase y total, la tarea sin datos en la tabla y fuera del resumen, y no escribe nada', async () => {
-  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
-    await escenario(repoRoot, tareasRoot);
+  await conEscenario(async (repoRoot, tareasRoot) => {
 
     const sin = cliOk(repoRoot, ['metricas']);
     assert.doesNotMatch(sin.stdout, /tok_/, 'sin --tokens la salida es la de siempre');
@@ -90,8 +106,7 @@ test('metricas --tokens: columnas por fase y total, la tarea sin datos en la tab
 });
 
 test('metricas --tokens --heuristica: ambas familias de columnas, y el resumen de tokens sobre la muestra', async () => {
-  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
-    await escenario(repoRoot, tareasRoot);
+  await conEscenario(async (repoRoot, tareasRoot) => {
     const r = cliOk(repoRoot, ['metricas', '--tokens', '--heuristica']);
     const cab = r.stdout.split('\n').find((l) => l.startsWith('| id ')) as string;
     assert.match(cab, /\| tok_sin_desglose +\| puntos +\| nivel_heuristico +\|$/);
@@ -105,8 +120,7 @@ test('metricas --tokens --heuristica: ambas familias de columnas, y el resumen d
 });
 
 test('metricas: combinaciones de flags invalidas se rechazan antes de escribir nada', async () => {
-  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
-    await escenario(repoRoot, tareasRoot);
+  await conEscenario(async (repoRoot, tareasRoot) => {
     const casos: [string[], RegExp][] = [
       [['--escribir'], /--escribir solo se admite con --tokens/],
       [['--tokens', '--escribir', '--heuristica'], /--escribir no se puede combinar con --heuristica/],
@@ -126,8 +140,7 @@ test('metricas: combinaciones de flags invalidas se rechazan antes de escribir n
 });
 
 test('metricas --tokens --escribir: crea el fichero si no existe, y la segunda vez no cambia ni un byte', async () => {
-  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
-    await escenario(repoRoot, tareasRoot);
+  await conEscenario(async (repoRoot, tareasRoot) => {
     const a = cliOk(repoRoot, ['metricas', '--tokens', '--escribir']);
     assert.match(a.stdout, /Regenerado el bloque de tokens de .*METRICAS\.md \(recuerda commitearlo\)/);
     const primero = await readFile(METRICAS_MD(repoRoot));
@@ -149,8 +162,7 @@ test('metricas --tokens --escribir: crea el fichero si no existe, y la segunda v
 });
 
 test('metricas --tokens --escribir: solo cambia el bloque; el resto (CRLF, acentos, lo de despues) queda byte a byte', async () => {
-  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
-    await escenario(repoRoot, tareasRoot);
+  await conEscenario(async (repoRoot, tareasRoot) => {
     const antes = '# Métricas\r\n\r\nUna sección con acentos — y CRLF.\r\n\r\n';
     const despues = '\r\n## 12. Lo escrito a mano\r\n\r\nNo tocar.\r\n\r\n```\r\nbloque de codigo\r\n```';
     await mkdir(path.dirname(METRICAS_MD(repoRoot)), { recursive: true });
@@ -185,8 +197,7 @@ test('metricas --tokens --escribir: solo cambia el bloque; el resto (CRLF, acent
 });
 
 test('metricas --tokens --escribir: sin marcadores anade el bloque al final y deja lo anterior intacto', async () => {
-  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
-    await escenario(repoRoot, tareasRoot);
+  await conEscenario(async (repoRoot, tareasRoot) => {
     const previo = '# Métricas\n\nTexto escrito a mano.\n';
     await mkdir(path.dirname(METRICAS_MD(repoRoot)), { recursive: true });
     await writeFile(METRICAS_MD(repoRoot), previo, 'utf8');
@@ -198,8 +209,7 @@ test('metricas --tokens --escribir: sin marcadores anade el bloque al final y de
 });
 
 test('metricas --tokens --escribir: marcadores rotos o una tarea.md invalida abortan sin tocar el fichero', async () => {
-  await withRepo(CONFIG_AUTO, async (repoRoot, tareasRoot) => {
-    await escenario(repoRoot, tareasRoot);
+  await conEscenario(async (repoRoot, tareasRoot) => {
     const roto = `# M\n\n${MARCADOR_INICIO_TOKENS}\nsin cierre\n`;
     await mkdir(path.dirname(METRICAS_MD(repoRoot)), { recursive: true });
     await writeFile(METRICAS_MD(repoRoot), roto, 'utf8');
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/core/evolucion.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/core/evolucion.test.ts
index 045fe2a..048633e 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/core/evolucion.test.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/core/evolucion.test.ts
@@ -6,7 +6,7 @@
 import { test } from 'node:test';
 import assert from 'node:assert/strict';
 import { calcularFila, type FilaMetricas } from '../../src/core/metricas.js';
-import { calcularEvolucion, formatearEvolucion, ordenarPorCierre, numeroDeId } from '../../src/core/evolucion.js';
+import { calcularEvolucion, formatearEvolucion, ordenarPorCierre, numeroDeId, tendencia, tendenciaCosteFijo } from '../../src/core/evolucion.js';
 import { tarea } from '../helpers/tarea-ejemplo.js';
 
 function fila(o: Partial<FilaMetricas> & { id: string }): FilaMetricas {
@@ -86,3 +86,38 @@ test('sin tareas: cero tramos, y el texto lo dice', () => {
   assert.deepEqual(e, { tamanoTramo: 20, terminadas: 0, enTramos: 0, sinCierre: { total: 0, porProyecto: {} }, tramos: [] });
   assert.match(formatearEvolucion(e, false), /0 tareas terminadas, 0 en tramos; fuera por no tener fecha de cierre: ninguna\./);
 });
+
+test('TASK-122: tendencia del coste fijo con umbral del 15 % y sin datos; menos de dos tramos, sin linea', () => {
+  const c = (valor: number | null) => ({ valor, n: valor === null ? 0 : 1 });
+  assert.equal(tendencia(c(100), c(115)), 'se mantiene');
+  assert.equal(tendencia(c(100), c(116)), 'crece');
+  assert.equal(tendencia(c(100), c(85)), 'se mantiene');
+  assert.equal(tendencia(c(100), c(84)), 'baja');
+  assert.equal(tendencia(c(null), c(84)), 'sin datos');
+  assert.equal(tendencia(c(0), c(0)), 'se mantiene');
+  assert.equal(tendencia(c(0), c(3)), 'crece');
+  const una = calcularEvolucion([fila({ id: 'TASK-001' })], 20);
+  assert.equal(tendenciaCosteFijo(una), null);
+  assert.doesNotMatch(formatearEvolucion(una, false), /Coste fijo/);
+  const seg = (min: number) => ({ valor: min * 60_000, precision: 'segundo' as const });
+  const dos = calcularEvolucion(
+    [
+      fila({ id: 'TASK-001', cierre: '2026-10-01', puntaAPunta: seg(10), finish: { valor: 2, precision: 'dia' } }),
+      fila({ id: 'TASK-002', cierre: '2026-10-02', puntaAPunta: seg(5), revision: seg(4), finish: seg(1) }),
+    ],
+    1
+  );
+  assert.deepEqual(dos.tramos.map((t) => [t.cerradasAcumuladas, t.minutosPuntaAPunta.valor, t.minutosFinish.n]), [[1, 10, 0], [2, 5, 1]]);
+  assert.match(tendenciaCosteFijo(dos) ?? '', /punta a punta 10 -> 5 min \(baja\); revision — -> 4 min \(sin datos\); finish — -> 1 min \(sin datos\)/);
+});
+
+test('TASK-122: con dos tramos completos o mas, un ultimo tramo parcial no decide la tendencia', () => {
+  const seg = (min: number) => ({ valor: min * 60_000, precision: 'segundo' as const });
+  const f = (n: number, min: number) => fila({ id: `TASK-00${String(n)}`, cierre: `2026-10-0${String(n)}`, puntaAPunta: seg(min) });
+  const e = calcularEvolucion([f(1, 10), f(2, 10), f(3, 10), f(4, 10), f(5, 99)], 2);
+  assert.deepEqual(e.tramos.map((t) => t.n), [2, 2, 1]);
+  assert.match(tendenciaCosteFijo(e) ?? '', /del tramo 1 \(2 cerradas\) al 2 \(4 cerradas\): punta a punta 10 -> 10 min \(se mantiene\)/);
+  // Con un solo tramo completo, el parcial si cuenta (no hay otra cosa con que comparar).
+  const corto = calcularEvolucion([f(1, 10), f(2, 10), f(3, 99)], 2);
+  assert.match(tendenciaCosteFijo(corto) ?? '', /al 2 \(3 cerradas\): punta a punta 10 -> 99 min \(crece\)/);
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/metricas-repos.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/metricas-repos.ts
index 0c61a3b..f67cd9c 100644
--- a/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/metricas-repos.ts
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/helpers/metricas-repos.ts
@@ -14,6 +14,7 @@ import { spawnSync } from 'node:child_process';
 import { serializeTareaFile } from '../../src/core/tarea-file.js';
 import { STATE_FOLDER, type Task, type TaskComplexity, type TaskState, type TaskType } from '../../src/core/task.js';
 import { TASKCTL } from './automatico-fixtures.js';
+import { lineaCierre } from '../../src/core/cierre.js';
 
 export interface RondaFixture {
   /** Linea `- Veredicto:` del informe. */
@@ -44,6 +45,12 @@ export interface TareaFixture {
   version?: string;
   /** TASK-084: filas de 5 celdas que se anaden tal cual tras las demas. */
   filasExtra?: string[];
+  /** TASK-122: instante del `start` (fila entre plan y finish); sin el, no hay fila. */
+  start?: string;
+  /** TASK-122: instante del primer `review`; sin el, no hay fila. */
+  review?: string;
+  /** TASK-122: segundos del propio finish (linea `- Cierre (finish)` de `## Duracion`). */
+  cierreSegundos?: number;
 }
 
 function git(args: string[], cwd: string): string {
@@ -86,9 +93,15 @@ function cuerpo(t: TareaFixture): string {
   const v = cinco ? ` ${t.version ?? ''} |` : '';
   const plan = t.plan === undefined ? '2026-10-01T10:00:00Z' : t.plan;
   if (plan !== null) filas.push(`| ${plan} | plan | manual | persona |${v}`);
+  if (t.start !== undefined) filas.push(`| ${t.start} | start | manual | persona |${v}`);
+  if (t.review !== undefined) filas.push(`| ${t.review} | review | manual | persona |${v}`);
   const fin = t.finish === undefined ? null : t.finish;
   if (fin !== null) filas.push(`| ${fin} | finish | manual | persona |${v}`);
   filas.push(...(t.filasExtra ?? []));
+  const duracion =
+    t.cierreSegundos === undefined || fin === null
+      ? []
+      : ['## Duracion', '', lineaCierre(new Date(Date.parse(fin) - t.cierreSegundos * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z'), fin), ''];
   return [
     '## Objetivo',
     '',
@@ -103,6 +116,7 @@ function cuerpo(t: TareaFixture): string {
     cinco ? '|---|---|---|---|---|' : '|---|---|---|---|',
     ...filas,
     '',
+    ...duracion,
   ].join('\n');
 }
 
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/scripts/perfil-tests.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/scripts/perfil-tests.test.ts
new file mode 100644
index 0000000..d42126b
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/scripts/perfil-tests.test.ts
@@ -0,0 +1,97 @@
+/**
+ * Tests de scripts/perfil-tests.mjs (TASK-122): el listado por fichero de
+ * duracion y procesos git. Se lanza por ruta sobre un "plugin" minimo con
+ * tres ficheros de test ya compilados: uno que lanza git desde node, otro que
+ * lo lanza desde bash (como los scripts de Git-Flow) y otro que no lo lanza.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { spawnSync } from 'node:child_process';
+import { existsSync } from 'node:fs';
+import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
+import { tmpdir } from 'node:os';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+
+const HERE = path.dirname(fileURLToPath(import.meta.url));
+const SCRIPT = path.join(HERE, '..', '..', '..', '..', '..', '..', 'scripts', 'perfil-tests.mjs');
+
+/**
+ * El bash de los scripts de Git-Flow. En Windows el primer `bash` del PATH
+ * puede ser el de WSL (System32, desde PowerShell o un hook), que no ve el
+ * git de Windows: se usa el de Git for Windows, junto al git real.
+ */
+function bashDeGit(): string {
+  if (process.platform !== 'win32') return 'bash';
+  const exec = spawnSync('git', ['--exec-path'], { encoding: 'utf8' }).stdout.trim();
+  const raiz = path.resolve(exec, '..', '..', '..');
+  // usr/bin primero: bin/bash.exe es un lanzador que antepone su propio git al PATH.
+  const candidato = [path.join(raiz, 'usr', 'bin', 'bash.exe'), path.join(raiz, 'bin', 'bash.exe')].find((p) => existsSync(p));
+  assert.ok(candidato, `no encuentro el bash de Git for Windows junto a ${exec}`);
+  return candidato;
+}
+const ENV = { ...process.env, BASH_PRUEBA: bashDeGit() };
+
+const CON_GIT = `import { test } from 'node:test';
+import { spawnSync } from 'node:child_process';
+import { existsSync } from 'node:fs';
+test('git dos veces', () => {
+  for (let i = 0; i < 2; i++) {
+    const r = spawnSync('git', ['--version'], { encoding: 'utf8' });
+    if (r.status !== 0) throw new Error('git no arranco');
+  }
+});
+`;
+const CON_BASH = `import { test } from 'node:test';
+import { spawnSync } from 'node:child_process';
+import { existsSync } from 'node:fs';
+test('git desde bash', () => {
+  const r = spawnSync(process.env.BASH_PRUEBA || 'bash', ['-c', 'git --version'], { encoding: 'utf8' });
+  if (r.status !== 0) throw new Error('bash o git no arrancaron: ' + r.stderr);
+});
+`;
+const SIN_GIT = `import { test } from 'node:test';
+test('uno', () => {});
+test('dos', () => {});
+`;
+
+interface Fila {
+  fichero: string;
+  tests: number;
+  git: number;
+  fallos: number;
+  segundos: number;
+}
+
+test('cuenta por fichero los tests y los procesos git (desde node y desde bash), y la duracion', async () => {
+  const dir = await mkdtemp(path.join(tmpdir(), 'perfil-tests-'));
+  try {
+    await mkdir(path.join(dir, 'dist', 'test', 'sub'), { recursive: true });
+    await writeFile(path.join(dir, 'package.json'), '{"type":"module"}\n');
+    await writeFile(path.join(dir, 'dist', 'test', 'con-git.test.js'), CON_GIT);
+    await writeFile(path.join(dir, 'dist', 'test', 'sub', 'con-bash.test.js'), CON_BASH);
+    await writeFile(path.join(dir, 'dist', 'test', 'sin-git.test.js'), SIN_GIT);
+    const r = spawnSync(process.execPath, [SCRIPT, '--dir', dir, '--sin-build', '--json', '--concurrencia', '2'], { encoding: 'utf8', env: ENV });
+    assert.equal(r.status, 0, r.stdout + r.stderr);
+    const filas = (JSON.parse(r.stdout) as { filas: Fila[] }).filas;
+    assert.deepEqual(
+      filas.map((f) => [f.fichero, f.tests, f.git, f.fallos]),
+      [
+        ['test/con-git.test.ts', 1, 2, 0],
+        ['test/sin-git.test.ts', 2, 0, 0],
+        ['test/sub/con-bash.test.ts', 1, 1, 0],
+      ]
+    );
+    assert.ok(filas.every((f) => f.segundos > 0));
+
+    // --filtro limita a una carpeta; sin --json escribe la tabla en --salida.
+    const salida = path.join(dir, 'informe.md');
+    const t = spawnSync(process.execPath, [SCRIPT, '--dir', dir, '--sin-build', '--filtro', 'test/sub', '--salida', salida], { encoding: 'utf8', env: ENV });
+    assert.equal(t.status, 0, t.stderr);
+    assert.match(t.stdout, /Ficheros: 1\. Tests: 1\./);
+    assert.match(t.stdout, /\| 1 \| test\/sub\/con-bash\.test\.ts \| [\d.]+ \| 1 \| 1 \| 1\.0 \| 0 \|/);
+    assert.match(t.stdout, /solo test\/sub/);
+  } finally {
+    await rm(dir, { recursive: true, force: true });
+  }
+});
diff --git a/taskcode-marketplace/plugins/taskcode-plugin/test/scripts/verificar-impacto.test.ts b/taskcode-marketplace/plugins/taskcode-plugin/test/scripts/verificar-impacto.test.ts
new file mode 100644
index 0000000..47e90ca
--- /dev/null
+++ b/taskcode-marketplace/plugins/taskcode-plugin/test/scripts/verificar-impacto.test.ts
@@ -0,0 +1,244 @@
+/**
+ * Tests de scripts/verificar-impacto.mjs (TASK-122): la verificacion por
+ * impacto de este repo. El script vive en la raiz del repo (no se publica con
+ * el plugin), asi que se lanza por ruta contra un repo Git temporal real que
+ * reproduce la estructura del plugin en miniatura.
+ */
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+import { spawnSync } from 'node:child_process';
+import { mkdir, writeFile } from 'node:fs/promises';
+import path from 'node:path';
+import { fileURLToPath } from 'node:url';
+import { plantillaRepo } from '../helpers/repo-plantilla.js';
+
+const HERE = path.dirname(fileURLToPath(import.meta.url));
+const SCRIPT = path.join(HERE, '..', '..', '..', '..', '..', '..', 'scripts', 'verificar-impacto.mjs');
+const PLUGIN = 'taskcode-marketplace/plugins/taskcode-plugin';
+
+function git(args: string[], cwd: string): string {
+  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
+  assert.equal(r.status, 0, `git ${args.join(' ')}: ${r.stderr}`);
+  return r.stdout;
+}
+
+async function escribir(raiz: string, rel: string, contenido: string): Promise<void> {
+  const abs = path.join(raiz, ...rel.split('/'));
+  await mkdir(path.dirname(abs), { recursive: true });
+  await writeFile(abs, contenido);
+}
+
+const PASA = "import { test } from 'node:test';\ntest('ok', () => {});\n";
+const FALLA = "import { test } from 'node:test';\ntest('rojo', () => { throw new Error('rojo'); });\n";
+
+const FICHEROS: Record<string, string> = {
+  'docs/guia.md': '# guia\n',
+  [`${PLUGIN}/package.json`]: JSON.stringify({ type: 'module', scripts: { build: 'node -e 0', 'limpiar:test': 'node -e 0' } }),
+  [`${PLUGIN}/tsconfig.json`]: '{}\n',
+  [`${PLUGIN}/bin/taskctl`]: '#!/usr/bin/env node\n',
+  [`${PLUGIN}/scripts/gitflow/start.sh`]: 'echo hola\n',
+  [`${PLUGIN}/plantilla.yml`]: 'clave: 1\n',
+  [`${PLUGIN}/huerfano.yml`]: 'clave: 2\n',
+  [`${PLUGIN}/src/a.ts`]: 'export const a = 1;\n',
+  [`${PLUGIN}/src/b.ts`]: "import { a } from './a.js';\nexport const b = a + 1;\n",
+  [`${PLUGIN}/src/c.ts`]: 'export const c = 3;\n',
+  [`${PLUGIN}/test/b.test.ts`]: "import { b } from '../src/b.js';\nvoid b;\n",
+  [`${PLUGIN}/test/c.test.ts`]: "import { c } from '../src/c.js';\nvoid c;\n",
+  [`${PLUGIN}/test/helpers/h.ts`]: "export const RAIZ = 'x';\nexport const BIN = ['bin', 'taskctl'];\n",
+  [`${PLUGIN}/test/lanza.test.ts`]: "import { BIN } from './helpers/h.js';\nvoid BIN;\n",
+  [`${PLUGIN}/test/flujo.test.ts`]: "const S = ['scripts', 'gitflow'];\nconst Y = 'plantilla.yml';\nvoid S; void Y;\n",
+  [`${PLUGIN}/test/core/x.test.ts`]: "import { c } from '../../src/c.js';\nvoid c;\n",
+  // El enrutador de comandos: quien lo importa solo depende de los comandos que nombra.
+  [`${PLUGIN}/src/cli.ts`]: "import { alfa } from './commands/alfa.js';\nimport { beta } from './commands/beta.js';\nexport const main = [alfa, beta];\n",
+  [`${PLUGIN}/src/commands/alfa.ts`]: "import { x } from '../core/x.js';\nexport const alfa = x;\n",
+  [`${PLUGIN}/src/commands/beta.ts`]: 'export const beta = 2;\n',
+  [`${PLUGIN}/src/core/x.ts`]: 'export const x = 1;\n',
+  [`${PLUGIN}/test/alfa.test.ts`]: "import { main } from '../src/cli.js';\nvoid main; const ARGS = ['alfa'];\nvoid ARGS;\n",
+  [`${PLUGIN}/test/beta.test.ts`]: "import { main } from '../src/cli.js';\nvoid main; const ARGS = ['beta'];\nvoid ARGS;\n",
+  // Lo "compilado" que corre node --test (el build del repo miniatura no hace nada).
+  [`${PLUGIN}/dist/test/core/x.test.js`]: PASA,
+  [`${PLUGIN}/dist/test/b.test.js`]: PASA,
+  [`${PLUGIN}/dist/test/c.test.js`]: FALLA,
+};
+
+const conRepo = plantillaRepo('verificar-impacto-', async (dir) => {
+  git(['init', '-q', '-b', 'develop'], dir);
+  git(['config', 'user.email', 't@t'], dir);
+  git(['config', 'user.name', 't'], dir);
+  git(['config', 'core.autocrlf', 'false'], dir);
+  for (const [rel, contenido] of Object.entries(FICHEROS)) await escribir(dir, rel, contenido);
+  git(['add', '-A'], dir);
+  git(['commit', '-q', '-m', 'base'], dir);
+  git(['checkout', '-q', '-b', 'feature/x'], dir);
+});
+
+interface Seleccion {
+  todo: boolean;
+  motivo?: string;
+  recorte?: string;
+  tests: { fichero: string; motivo: string }[];
+}
+
+function listar(raiz: string, base = 'develop', tope?: number): Seleccion {
+  const env: NodeJS.ProcessEnv = { ...process.env, RAMA_BASE: base };
+  if (tope === undefined) delete env['VERIFICAR_IMPACTO_TOPE'];
+  else env['VERIFICAR_IMPACTO_TOPE'] = String(tope);
+  const r = spawnSync(process.execPath, [SCRIPT, '--listar'], { cwd: raiz, encoding: 'utf8', env });
+  assert.equal(r.status, 0, r.stderr);
+  return JSON.parse(r.stdout) as Seleccion;
+}
+
+async function cambiarYCommitear(raiz: string, rel: string, contenido = '// cambio\n'): Promise<void> {
+  await escribir(raiz, rel, contenido);
+  git(['add', '-A'], raiz);
+  git(['commit', '-q', '-m', 'cambio'], raiz);
+}
+
+const ficheros = (s: Seleccion) => s.tests.map((t) => t.fichero);
+
+test('un test cambiado se corre solo el', async () => {
+  await conRepo(async (raiz) => {
+    await cambiarYCommitear(raiz, `${PLUGIN}/test/c.test.ts`, "import { c } from '../src/c.js';\nvoid c; // cambio\n");
+    const s = listar(raiz);
+    assert.equal(s.todo, false);
+    assert.deepEqual(ficheros(s), ['test/c.test.ts']);
+  });
+});
+
+test('un modulo de src elige los tests que lo importan, tambien transitivamente, y no otros', async () => {
+  await conRepo(async (raiz) => {
+    await cambiarYCommitear(raiz, `${PLUGIN}/src/a.ts`, 'export const a = 2;\n');
+    const s = listar(raiz);
+    assert.equal(s.todo, false);
+    assert.deepEqual(ficheros(s), ['test/b.test.ts']);
+    assert.match(s.tests[0]!.motivo, /src\/a\.ts/);
+  });
+});
+
+test('el enrutador (src/cli.ts) corta: mas alla solo entran los tests que nombran el comando afectado', async () => {
+  await conRepo(async (raiz) => {
+    await cambiarYCommitear(raiz, `${PLUGIN}/src/core/x.ts`, 'export const x = 5;\n');
+    // alfa.test nombra 'alfa'; beta.test y lanza.test (bin/taskctl via su helper) no.
+    assert.deepEqual(ficheros(listar(raiz)), ['test/alfa.test.ts']);
+  });
+  await conRepo(async (raiz) => {
+    await cambiarYCommitear(raiz, `${PLUGIN}/src/cli.ts`, "export const main = [];\n");
+    assert.deepEqual(ficheros(listar(raiz)), ['test/alfa.test.ts', 'test/beta.test.ts', 'test/lanza.test.ts']);
+  });
+});
+
+test('un cambio sin commitear tambien cuenta', async () => {
+  await conRepo(async (raiz) => {
+    await escribir(raiz, `${PLUGIN}/src/c.ts`, 'export const c = 4;\n');
+    assert.deepEqual(ficheros(listar(raiz)), ['test/c.test.ts', 'test/core/x.test.ts']);
+  });
+});
+
+test('un helper de test elige los tests que lo importan', async () => {
+  await conRepo(async (raiz) => {
+    await cambiarYCommitear(raiz, `${PLUGIN}/test/helpers/h.ts`, "export const BIN = ['bin', 'taskctl'];\n");
+    assert.deepEqual(ficheros(listar(raiz)), ['test/lanza.test.ts']);
+  });
+});
+
+test('bin/taskctl y scripts/gitflow eligen a quien los lanza; otro fichero, a quien lo menciona', async () => {
+  await conRepo(async (raiz) => {
+    await cambiarYCommitear(raiz, `${PLUGIN}/bin/taskctl`);
+    assert.deepEqual(ficheros(listar(raiz)), ['test/lanza.test.ts']);
+  });
+  await conRepo(async (raiz) => {
+    await cambiarYCommitear(raiz, `${PLUGIN}/scripts/gitflow/start.sh`);
+    assert.deepEqual(ficheros(listar(raiz)), ['test/flujo.test.ts']);
+  });
+  await conRepo(async (raiz) => {
+    await cambiarYCommitear(raiz, `${PLUGIN}/plantilla.yml`, 'clave: 3\n');
+    assert.deepEqual(ficheros(listar(raiz)), ['test/flujo.test.ts']);
+  });
+});
+
+test('ante la duda, la suite entera: transversales, ficheros sin test y base inexistente', async () => {
+  await conRepo(async (raiz) => {
+    await cambiarYCommitear(raiz, `${PLUGIN}/package.json`, '{"type":"module"}\n');
+    const s = listar(raiz);
+    assert.equal(s.todo, true);
+    assert.match(s.motivo ?? '', /package\.json/);
+  });
+  await conRepo(async (raiz) => {
+    await cambiarYCommitear(raiz, `${PLUGIN}/huerfano.yml`, 'clave: 9\n');
+    assert.equal(listar(raiz).todo, true);
+  });
+  await conRepo(async (raiz) => {
+    const s = listar(raiz, 'no-existe');
+    assert.equal(s.todo, true);
+    assert.match(s.motivo ?? '', /no-existe/);
+  });
+});
+
+test('solo documentacion y tareas: ningun test por impacto (solo los rapidos)', async () => {
+  await conRepo(async (raiz) => {
+    await cambiarYCommitear(raiz, 'docs/guia.md', '# otra\n');
+    await cambiarYCommitear(raiz, 'tareas/02-en-curso/TASK-001/tarea.md', 'x\n');
+    await cambiarYCommitear(raiz, 'CHANGELOG.md', 'x\n');
+    await cambiarYCommitear(raiz, '.taskcode/config.yml', 'modo_flujo: automatico\n');
+    await cambiarYCommitear(raiz, `${PLUGIN}/README.md`, '# x\n');
+    const s = listar(raiz);
+    assert.equal(s.todo, false);
+    assert.deepEqual(s.tests, []);
+  });
+});
+
+test('ejecuta lo elegido mas los rapidos y sale con el codigo de node --test', async () => {
+  await conRepo(async (raiz) => {
+    await cambiarYCommitear(raiz, 'docs/guia.md', '# otra\n');
+    const verde = spawnSync(process.execPath, [SCRIPT], { cwd: raiz, encoding: 'utf8', env: { ...process.env, RAMA_BASE: 'develop' } });
+    assert.equal(verde.status, 0, verde.stdout + verde.stderr);
+    assert.match(verde.stdout, /Por impacto: 0 fichero/);
+    assert.match(verde.stdout, /pass 1\b/);
+  });
+  await conRepo(async (raiz) => {
+    await cambiarYCommitear(raiz, `${PLUGIN}/test/c.test.ts`, "import { c } from '../src/c.js';\nvoid c; // cambio\n");
+    const rojo = spawnSync(process.execPath, [SCRIPT], { cwd: raiz, encoding: 'utf8', env: { ...process.env, RAMA_BASE: 'develop' } });
+    assert.notEqual(rojo.status, 0);
+    assert.match(rojo.stdout, /test\/c\.test\.ts \(test cambiado\)/);
+    assert.match(rojo.stdout, /fail 1\b/);
+  });
+});
+
+test('tope: si la seleccion pasa de VERIFICAR_IMPACTO_TOPE, solo los tests directos (y lo dice)', async () => {
+  await conRepo(async (raiz) => {
+    // a.ts lo importa b.ts, y b.test.ts a b.ts: por impacto entra b.test, pero no es directo.
+    await cambiarYCommitear(raiz, `${PLUGIN}/src/a.ts`, 'export const a = 9;\n');
+    await cambiarYCommitear(raiz, `${PLUGIN}/src/c.ts`, 'export const c = 9;\n');
+    assert.deepEqual(ficheros(listar(raiz, 'develop', 5)), ['test/b.test.ts', 'test/c.test.ts', 'test/core/x.test.ts']);
+    const s = listar(raiz, 'develop', 1);
+    assert.match(s.recorte ?? '', /2 ficheros por impacto pasan del tope de 1; se corren solo los tests directos/);
+    assert.deepEqual(ficheros(s), ['test/c.test.ts', 'test/core/x.test.ts']);
+    // Si ni los directos caben, solo los tests cambiados.
+    const cero = listar(raiz, 'develop', 0);
+    assert.match(cero.recorte ?? '', /solo los tests cambiados/);
+    assert.deepEqual(ficheros(cero), []);
+  });
+  await conRepo(async (raiz) => {
+    // La suite entera tambien se recorta a los directos.
+    await cambiarYCommitear(raiz, `${PLUGIN}/package.json`, '{"type":"module"}\n');
+    const s = listar(raiz);
+    assert.equal(s.todo, true);
+    assert.match(s.recorte ?? '', /package\.json.*se corren solo los tests directos/);
+  });
+});
+
+test('la verificacion no cambia el arbol: dist/src vuelve tal cual tras compilar', async () => {
+  await conRepo(async (raiz) => {
+    await escribir(raiz, `${PLUGIN}/dist/src/x.js`, 'export const x = 1;\n');
+    // Un build que reescribe un fichero versionado de dist/src.
+    const pkg = { type: 'module', scripts: { build: 'node -e "require(\'fs\').writeFileSync(\'dist/src/x.js\',\'cambiado\')"' } };
+    await escribir(raiz, `${PLUGIN}/package.json`, JSON.stringify(pkg));
+    git(['add', '-A'], raiz);
+    git(['commit', '-q', '-m', 'dist'], raiz);
+    await cambiarYCommitear(raiz, 'docs/guia.md', '# otra\n');
+    const r = spawnSync(process.execPath, [SCRIPT], { cwd: raiz, encoding: 'utf8', env: { ...process.env, RAMA_BASE: 'develop' } });
+    assert.equal(r.status, 0, r.stdout + r.stderr);
+    assert.equal(git(['status', '--porcelain'], raiz), '');
+    assert.match(r.stdout, /Seleccion recortada/);
+  });
+});
````

## Excluido del diff (10 fichero(s))

Su diff no se embebe: es codigo generado, lockfiles o la propia carpeta de
tareas (clave `excluir_de_revision` de `.taskcode/config.yml`). Si lo
necesitas, pidelo con:

````
git diff develop..HEAD -- ":(glob)**/dist/**" ":(glob)**/*.lock" ":(glob)**/*-lock.*" ":(glob)tareas/**" ":(glob)tareas/*/TASK-*/aceptacion/**"
````

````
tareas/{01-en-diseno => 02-en-curso}/TASK-122/planificacion/brainstorm/peticion-brainstorm-arquitectura-1.md |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-122/planificacion/brainstorm/peticion-brainstorm-riesgos-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-122/planificacion/brainstorm/peticion-brainstorm-testing-1.md      |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-122/planificacion/brainstorm/peticion-unificador-1.md              |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-122/planificacion/brainstorm/salida-brainstorm-arquitectura-1.md   |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-122/planificacion/brainstorm/salida-brainstorm-riesgos-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-122/planificacion/brainstorm/salida-brainstorm-testing-1.md        |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-122/planificacion/plan-final.md                                    |  0
 tareas/{01-en-diseno => 02-en-curso}/TASK-122/tarea.md                                                       |  7 ++++++-
 taskcode-marketplace/plugins/taskcode-plugin/dist/src/core/evolucion.js                                      | 91 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++-----
 10 files changed, 92 insertions(+), 6 deletions(-)
````

## Verificacion de esta ronda

- Tipo: selectiva (por impacto respecto a `develop`, que recibe en la variable RAMA_BASE). No sustituye a la completa: el cierre la exige sobre el commit que se integra.
- Comando: `node scripts/verificar-impacto.mjs`
- Resultado: salio con codigo 0
- Duracion: 47.1 s

Final de la salida (truncada: 72759 bytes en total):

````
✔ tareasQueBloquean: una tarea en revision SI bloquea (la rama sigue abierta) (0.22ms)
✔ tareasQueBloquean: la comparacion de persona es exacta y sensible a mayusculas (0.3761ms)
✔ tareasQueBloquean: devuelve las bloqueantes ordenadas por ID (27.0858ms)
✔ mensajeWipExcedido: nombra la tarea que bloquea, su carpeta y su rama (1.15ms)
✔ mensajeWipExcedido: dice QUE HACER, no solo que ha fallado (0.9783ms)
✔ mensajeWipExcedido: con varias bloqueantes las lista todas, no solo la primera (0.4844ms)
✔ mensajeWipIndeterminado: nombra los ficheros ilegibles y dice que arreglarlos (0.331ms)
✔ personaDeTarea: null, cadena vacia y solo-espacios son sin asignar (0.2386ms)
✔ personaDeTarea: recorta los espacios de alrededor (0.1985ms)
✔ tareasQueBloquean: un asignado_a con espacios SI bloquea (se compara recortado) (0.2169ms)
✔ tareasQueBloquean: asignado_a vacio no bloquea, ni siquiera a otro vacio (0.2113ms)
✔ mensajeWipExcedido: nombra la carpeta REAL, no la que declara el frontmatter (0.2308ms)
✔ mensajeWipExcedido: no promete un taskctl finish que todavia fallaria (0.2129ms)
✔ resolverAsignado: el flag manda sobre todo lo demas (0.2528ms)
✔ resolverAsignado: sin flag gana el asignado previo, NO la identidad Git (0.382ms)
✔ resolverAsignado: sin flag ni previo, entra la identidad Git (0.1709ms)
✔ resolverAsignado: sin nada de lo tres, null (comportamiento anterior a TASK-024) (0.1117ms)
✔ resolverAsignado: un previo vacio o en blanco no cuenta y deja pasar la identidad (0.1043ms)
✔ resolverAsignado: recorta los tres escalones (0.1ms)
✔ cuenta por fichero los tests y los procesos git (desde node y desde bash), y la duracion (2653.3937ms)
✔ un test cambiado se corre solo el (3171.4223ms)
✔ un modulo de src elige los tests que lo importan, tambien transitivamente, y no otros (1600.2358ms)
✔ el enrutador (src/cli.ts) corta: mas alla solo entran los tests que nombran el comando afectado (3356.7352ms)
✔ un cambio sin commitear tambien cuenta (1156.1521ms)
✔ un helper de test elige los tests que lo importan (1458.3732ms)
✔ bin/taskctl y scripts/gitflow eligen a quien los lanza; otro fichero, a quien lo menciona (4063.348ms)
✔ ante la duda, la suite entera: transversales, ficheros sin test y base inexistente (3446.9858ms)
✔ solo documentacion y tareas: ningun test por impacto (solo los rapidos) (2380.879ms)
✔ ejecuta lo elegido mas los rapidos y sale con el codigo de node --test (5940.9808ms)
✔ tope: si la seleccion pasa de VERIFICAR_IMPACTO_TOPE, solo los tests directos (y lo dice) (3732.6284ms)
✔ la verificacion no cambia el arbol: dist/src vuelve tal cual tras compilar (2806.5955ms)
ℹ tests 788
ℹ suites 0
ℹ pass 788
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 36599.5618
[verificar-impacto] node --test termino con 0 en 36.7 s.
````
