# Plan — TASK-067: Doctor-deploy B: puntos de juicio, tareas TASK-9999 y aviso en release

(Consolidado a partir de 2 roles lanzados en paralelo, arquitectura y riesgos: complejidad media declarada y heurística. Los desacuerdos se señalan, no se promedian. «Certificado» en los criterios = «informe» (D2 de TASK-066, decisión de la persona). Este plan no vale hasta que una persona lo apruebe con `taskctl approve`.)

## Enfoque
- (arquitectura) `taskctl doctor-deploy` es el único punto de entrada; `--resultado <json>` repite el análisis sobre HEAD y mezcla los veredictos con `core/doctor-deploy-veredictos.ts` (puro); el informe JSON pasa a v2 con `origen: sonda|agente` y `--escribir` deja también `<fecha>.json`.
- (arquitectura) `--crear-tareas` reutiliza las piezas de `new` (`crearTareaEn`), con un solo `ensureBaseBranchReady` y un solo `autoCommit`; `finish` de release solo lee informes (`core/aviso-release.ts`), nunca ejecuta sondas.
- Orden (arquitectura): 1 rango reservado en `task-id.ts` → 2 MEN-12 + mutantes N8/N9/N12/N14/N17 → 3 veredictos + `--resultado` + JSON v2 → 4 `--crear-tareas` + aviso en `finish` → 5 skill, agente `revisor-seguridad-deploy`, README, CHANGELOG.

## Desacuerdos resueltos
- Veredicto atado a un commit — arquitectura: lo deja abierto (validar `fichero:linea` contra el árbol actual «quizá baste») / riesgos: el resultado lleva su commit y se rechaza si no es HEAD — gana riesgos — arquitectura no defiende la alternativa y un JSON de otro commit es justo el «OK fuera de contexto» que riesgos mide.
- Validación de la evidencia — arquitectura: id conocido y de juicio, fichero existe y tiene esa línea / riesgos: además fichero versionado, rechazo de `..` y rutas absolutas, y el agente no puede pisar un punto determinista — gana riesgos (es un superconjunto) — cada caso que añade es un camino a OK inventado.
- Texto del veredicto — arquitectura: no lo acota (cita `fichero:linea` + motivo) / riesgos: evidencia sin fragmentos de código, `motivo` con longitud acotada y pasado por `ocultarSecretos` — gana riesgos — un secreto subido en `docs/doctor-deploy/` es punto sin retorno (rotar y reescribir historia).
- Siguiente ID reservado — arquitectura: `nextReservedTaskId(ids)` = mínimo reservado − 1 mirando solo tareas / riesgos: mirar tareas **y ramas**, con suelo del rango y aborto si cruza la numeración normal — gana riesgos — las ramas no se borran (política IECA): si se borra la carpeta TASK-9999, la versión de arquitectura reutiliza 9999 con `feature/task-9999-*` viva.
- Orden dentro de `--escribir --crear-tareas` — arquitectura: no fija orden (escribe `.md`+`.json` y luego crea) / riesgos: crear tareas antes de escribir el informe — gana riesgos — `ensureBaseBranchReady` aborta con ficheros sin trackear, incluido el informe recién escrito.
- Coincidencias previstas como desacuerdo y que no lo fueron: ambos dicen que `finish` no ejecuta doctor-deploy, que el JSON del agente va fuera del repo y que «del commit que se cierra» no se cumple al pie de la letra. Ese acuerdo pleno en lo más delicado es una alarma leve: los dos partían del mismo Resultado de TASK-066.

## Riesgos aceptados
- `--crear-tareas` desde una rama release deja al usuario en la base (checkout de `ensureBaseBranchReady`) — riesgos — se acepta como en `new`; el comando lo dice en su salida.
- Corte a mitad de `--crear-tareas` — riesgos — un único `autoCommit` (arquitectura) + dedup idempotente por id de punto (riesgos) hacen que relanzar repare.
- `finish` puede reventar por `.taskcode/doctor-deploy.yml` roto o informe ilegible — riesgos — todo el aviso en try/catch que degrada a aviso; nunca bloquea.
- MEN-12 cambia resultados ya emitidos (OK → NO VERIFICADO/FALLA en monorepos >10 carpetas, salida 1 en CI) — riesgos — se anota en el CHANGELOG como cambio de comportamiento.
- Un compañero con el plugin viejo crea TASK-10000 — riesgos — no se contiene en código; solo documentación en README/CHANGELOG.
- Un informe `.md` editado a mano engaña al aviso — riesgos (descartado a propósito) — `finish` solo avisa, no es control de seguridad.

## Plan de pruebas
- Con TASK-065 y TASK-9999, `taskctl new` crea TASK-066 e `import` hereda el filtro — repo Git temporal — criterio + arquitectura/riesgos.
- Descendente salta un número cuya rama `feature/task-NNNN-*` sigue viva tras borrar la carpeta — repo Git temporal — riesgos.
- `--resultado` rechaza con motivo: punto desconocido, punto determinista, sin evidencia, línea fuera de rango, `..`/absoluta, fichero no versionado, commit ≠ HEAD; y un secreto en `motivo` sale enmascarado — fichero JSON fuera del repo — riesgos.
- `--escribir --crear-tareas` dos veces: la segunda reutiliza la tarea abierta y lo dice; una tarea terminada con el punto de nuevo en FALLA crea otra — repo temporal — criterio + riesgos.
- `finish` de release avisa sin bloquear: sin informe, informe con FALLA crítica, informe de un commit anterior con solo `docs/doctor-deploy/` cambiado (no avisa), y config rota — repo temporal — riesgos + arquitectura.
- `gitignore-cubre-env` con más de 10 carpetas y tests que maten N8/N9/N12/N14/N17 — repo temporal — criterio (MEN-12/13); ningún rol detalló los casos.

## Sin cubrir
- Qué es «FALLA crítica» en el aviso — ningún rol lo definió; el catálogo de TASK-066 tiene `severidad` por punto: se usa `severidad: critica`, y se confirma en la aprobación.
- Avisar de tareas reservadas cuyo punto ya da OK o ya no existe — solo lo propone riesgos y no lo pide el enunciado: queda fuera de 067 salvo que la persona lo quiera.
- Dominio y testing no se lanzaron (2 roles por complejidad media): la forma del veredicto `{punto, estado, fichero, linea, motivo}` y el plan de pruebas de arriba son derivados de las mitigaciones, no de un rol de testing.

## Salidas que faltaron
- ninguna (llegaron las 2 lanzadas; dominio y testing no se lanzaron, ver «Sin cubrir»).

## Suposiciones no verificadas
- Las regex `TASK-\d{3,}` aceptan TASK-9999 y `board`/`metricas` ordenan y cuentan bien con 4 cifras (`metricas.ts:414`) — arquitectura y riesgos — mirar `task-store.ts:27`, `wip-scan.ts:37`, `task.ts:132`, `metricas.ts:191/414` y los scripts de Git-Flow.
- El test de contenido expuesto y el de enumeración de skills/agentes recogen solos los ficheros nuevos — arquitectura — leer esos tests.
- La skill puede lanzar el agente del plugin por nombre con prefijo — arquitectura — probarlo en una instalación real.
- `finish` de release exige árbol limpio — riesgos — leer `commands/finish.ts`.
- Forma del veredicto `{punto, estado, fichero, linea, motivo}` — riesgos — fijarla en la skill y en el agente.

## Decision humana pendiente — decisiones para la persona
- Qué commit vale para el aviso de release — los dos roles coinciden en que «del commit que se cierra» es imposible al pie de la letra (el informe se commitea después). Recomendación: vale si `informe.commit` es la punta o un ancestro y entre ambos solo cambian rutas de `docs/doctor-deploy/`; si no, aviso. Es reinterpretar un criterio de aceptación: no lo decide un agente.
- Segundo eje de tipo (web/API/móvil/CLI/librería) y sondas deterministas extra (D6 de 066) — solo arquitectura lo trata (cambia el contrato `TipoApp`/`detectarTipos`); riesgos calla. Recomendación: tarea nueva TASK-068; mientras, el agente las cubre como `juicio`. Es alcance.
- Clave de deduplicación — arquitectura: etiqueta `doctor-deploy:<id-punto>` (no toca `core/task.ts`); riesgos: «id del punto + estado», neutral entre etiqueta y campo. Recomendación: etiqueta; borrarla a mano rompe la dedup y se documenta. Cambiar luego a campo de frontmatter es caro (migrar tareas ya creadas).
- Aprobación del plan entero con `taskctl approve`, incluida la definición de «FALLA crítica» como `severidad: critica` — nadie puede empezar a implementar antes.

## Decisiones de la persona (2026-10-27)

- Aviso de release: vale el informe cuyo `commit` es la punta, o un ancestro con solo `docs/doctor-deploy/` cambiado entre ambos; en cualquier otro caso, o si el informe tiene alguna FALLA de `severidad: critica` del catalogo, se avisa sin bloquear.
- El segundo eje de tipo de aplicacion (web/API/movil/CLI/libreria) y las sondas deterministas extra van a TASK-068; mientras, el agente de esta tarea los cubre como `juicio`.
- Deduplicacion por la etiqueta `doctor-deploy:<id-punto>` (sin campo nuevo en el frontmatter); el README documenta que borrarla a mano rompe la deduplicacion.
- «Certificado» en los criterios se lee como «informe» (D2 de TASK-066).
- Plan aprobado entero, con «FALLA critica» = punto con `severidad: critica` en el catalogo.

## Decisiones de la persona tras la ronda 1 de revision (2026-10-27)

- MEN-1: el aviso de release tambien acepta un informe de un ancestro si entre ambos solo cambiaron `docs/doctor-deploy/` o `tareas/` (review, veredictos y costes commitean en `tareas/` despues del informe sin tocar el codigo). Se corrigen tambien MEN-2, MEN-3 y MEN-4 en la ronda 2.
