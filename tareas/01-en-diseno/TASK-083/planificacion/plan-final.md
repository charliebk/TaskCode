# Plan — TASK-083: Cierre sin ronda 2 completa cuando solo quedan MENORES

(Lo consolida el agente unificador a partir de 2 roles de brainstorm
lanzados en paralelo: arquitectura, riesgos.
Los desacuerdos entre roles se señalan, no se promedian.)

Se lanzaron 2 roles porque la complejidad declarada (media) y la heurística
(simple, 2 puntos) no coinciden y se toma la mayor. No se lanzó el rol de
dominio; arquitectura le delegaba expresamente una decisión (ver desacuerdo 1).
Llegaron las dos salidas, completas. **Este plan no vale hasta que una persona
lo apruebe con `taskctl approve`.**

## Enfoque propuesto

Hecho de partida (los dos roles, leído en el código): la ronda N+1 ya va
acotada al diff de las correcciones desde TASK-040 (`desde` = commit revisado
en la ronda N). Lo que TASK-083 recorta es el **método y la fragmentación**, no
el diff (arquitectura; riesgos: «solo puede ser recortar el método»).

Orden, con la implementación del criterio 2 **condicionada a la medida**:

1. **Medida (criterio 1), primero y sola.** Script de un solo uso en el
   scratchpad, fuera del repo, que importa `leerHallazgos` y `veredictoDeRonda`
   de `dist/core/informe-revision.js` y recorre `tareas/04-terminadas/*/revision/`
   de ToolsaWeb y TaskCode (arquitectura). Cuenta, por tarea y sobre **todos
   los fragmentos** de la ronda 1:
   - cuántas rondas 2 partían de una ronda 1 sin CRÍTICO ni IMPORTANTE (arquitectura);
   - **de esas, cuántas encontraron un CRÍTICO o IMPORTANTE nuevo en la ronda 2**
     (riesgos; caso real ToolsaWeb TASK-013, IMP-R2-1);
   - excluye del denominador las tareas cerradas en ronda 1 sin ronda 2, y cuenta
     aparte los informes sin tabla como «sin dato» (riesgos y arquitectura).
   Resultado, método y exclusiones a una sección nueva «13. Rondas 2 con solo
   MENORES (TASK-083)» de `docs/METRICAS.md`, fuera de los marcadores
   `<!-- taskctl metricas --tokens -->` (arquitectura).
2. **Checkpoint sobre la medida.** Si la medida no justifica el modo (decisión
   humana, ver abajo), se documenta en METRICAS.md y en el `Resultado` de la
   tarea, **el criterio 2 se da por no aplicable y no se implementa nada más**.
   Los criterios 3 y 4 solo aplican si se implementa.
3. **Si se implementa — regla pura** en `src/core/informe-revision.ts`:
   `alcanceRondaSiguiente(informes): { acotada, modeloBarato }`, sobre
   `leerHallazgos`, con `modeloBaratoPermitido` (TASK-081) mudado aquí y
   reexportado desde `review.ts` (arquitectura). Decide sobre todos los informes
   de `informesDeUltimaRonda`, nunca por fragmento (riesgos, punto 2).
4. **`review.ts`:** `RondaPrevia.alcance`; con `acotada` y sin `--completa`, un
   único grupo con el revisor genérico, sin `clasificarPorDominio` y sin sufijo
   de fichero; bloque de instrucciones de verificación en `peticionTemplate`;
   línea de alcance en la cabecera (arquitectura). Nombres de fichero, mensaje
   del chore de commit y `- Commit revisado (HEAD):` no cambian (arquitectura y
   riesgos: `metricas.ts:224` clasifica por regex cerrada).
5. **CLI:** `--completa` en `FLAGS_REVIEW`, `ReviewCommandResult.alcance`,
   impreso en `src/cli.ts` junto a `modeloRonda` (arquitectura).
6. **Skill** `skills/task-workflow/revision.md` §Rondas (sin nombrar TaskCode)
   y README del plugin (arquitectura).

### Puntos fijados en este plan

- **(1) IMPORTANTE en cualquier estado.** Cualquier CRÍTICO o IMPORTANTE en la
  tabla de la ronda anterior, sea `abierto`, `corregido`, `aceptado` o
  `resuelto`, obliga a la ronda completa. Ver desacuerdo 1.
- **(2) Qué exige la verificación acotada.** No es «comprobar la lista de
  MENORES». La petición acotada sigue exigiendo **ejecutar los tests** y
  **buscar fallos nuevos en el delta**, además de verificar cada hallazgo de
  `seccionPrevia` (riesgos, punto 1, caso ToolsaWeb TASK-013). Lo que se
  ahorra es la fragmentación por dominio y el resto del método de la revisión
  completa (arquitectura). Ver desacuerdo 2.
- **(3) «Ronda completa» tras una ronda acotada** = método completo **y** diff
  completo desde la rama base, no desde el commit de la ronda acotada. Ver
  desacuerdo 4.
- **(4) La medida cuenta también las rondas 2 que encontraron CRÍTICO o
  IMPORTANTE nuevo**, y el criterio 2 depende de ella (paso 2).

## Desacuerdos entre roles, y como se resuelven

1. **IMPORTANTE «abierto» frente a «en cualquier estado».** Arquitectura:
   escribe la regla como «ningún CRÍTICO ni IMPORTANTE abierto», pero deja la
   diferencia a dominio o a la persona porque el enunciado es ambiguo. Riesgos:
   «en cualquier estado», porque `hallazgosNoCerrados` da por cerrado
   `corregido` y `aceptado`, y un IMPORTANTE marcado `corregido` a mano sin
   verificar obtendría la ronda ligera, «la corrección que más falta hace
   verificar». **Gana riesgos:** es fail-closed, coincide con lo que TASK-081
   ya hace con CRÍTICO, y arquitectura no defiende «abierto», solo lo deja
   abierto. Efecto: el criterio 3 se cumple en su lectura más estricta.
2. **Contenido de las instrucciones acotadas.** Arquitectura: «comprobar cada
   hallazgo de `seccionPrevia` contra el delta y que la corrección no abre otro
   fallo», sin exigir ejecución. Riesgos: ejecutar los tests sobre el diff y
   buscar fallos nuevos; TASK-013 se encontró «reproduciendo y mutando, no
   leyendo el diff». **Gana riesgos:** el único caso real que trae cualquiera
   de los dos roles es justo el fallo que la versión de arquitectura no ve.
3. **Línea de modo en la petición.** Arquitectura: `- Alcance: verificación
   acotada al diff de las correcciones`, informativa. Riesgos: `- Modo de
   revisión: ... (motivo: ...)`, legible por máquina y **no opcional**, porque
   sin ella `finish` no distingue un `aprobada` ligero de uno completo y no se
   puede listar qué tareas revisar si se desactiva. **Gana riesgos en el
   contenido** (motivo incluido, obligatoria, parseable; además la necesita el
   punto 3 para saber que la ronda anterior fue acotada). El nombre de la clave
   es cosmético: se usa `- Alcance:` de arquitectura.
4. **Qué es «ronda completa» tras una acotada.** Riesgos plantea las dos
   lecturas (método completo sobre el delta, o diff completo desde la base) y
   exige fijarla; arquitectura no lo trata. **Se elige diff completo desde la
   base:** el delta de la ronda acotada nunca tuvo revisión completa, y
   empezar en su commit (TASK-040) dejaría ese tramo sin ella; es la lectura
   fail-closed que riesgos señala como la que cumple la garantía. Coste:
   la ronda 3 de esas tareas es más grande.
5. **Condiciones extra que fuerzan la ronda completa.** Riesgos: también si
   `desde === baseBranch` (commit reescrito, sin diff de correcciones) o si
   entre `desde` y HEAD hay un merge (código ajeno sin revisar). Arquitectura:
   decide solo por los informes y «todo lo demás no se toca: `desde`…».
   **Gana riesgos** en estas dos: una «acotada» sobre el diff completo deja de
   ser acotada sin que nadie lo note. La tercera condición de riesgos (el diff
   toca ficheros fuera de la columna `Fichero`) **no se decide aquí**: sube a
   decisión humana.
6. **Activación automática.** Arquitectura preveía un desacuerdo con riesgos
   (automática con `--completa` de salida). No se materializó: riesgos no la
   discute. Queda automática; ver riesgos aceptados.

## Riesgos aceptados y que los contiene

- **IMPORTANTE nuevo introducido por la corrección de un MENOR** (riesgos,
  el que más le preocupa). Lo contiene: instrucciones que exigen tests y
  búsqueda de fallos nuevos (desacuerdo 2) y la medida, que pone precio a este
  riesgo antes de decidir (paso 1).
- **Tareas cerradas con un `aprobada` ligero tienen una garantía menor y no se
  reabren solas** (riesgos). Lo contiene: la línea de alcance obligatoria, que
  permite listarlas.
- **Doble cuenta en `resumirHallazgos`** del mismo ID en `informe-revision-1-<skill>.md`
  e `informe-revision-2.md`, ahora más frecuente (arquitectura; MEN-3 aceptado
  en TASK-064). Lo contiene: nada nuevo; se acepta como ya estaba.
- **Terciles de `kbPeticionPorRonda` mezclan peticiones ligeras y completas**
  (riesgos). Lo contiene: nada; queda anotado en METRICAS.md.
- **Plugin instalado con skill antigua y petición nueva** (riesgos): el revisor
  hace la revisión completa; se pierde el ahorro, no la seguridad.
- **El modo cambia si se edita a mano el informe entre dos `review`** (riesgos).
  Lo contiene: el modo es función pura de ficheros commiteados y queda escrito
  con su motivo.

## Plan de pruebas

Todas con repos Git temporales salvo la regla pura; sin mocks.

- `alcanceRondaSiguiente`: sin tabla, severidad desconocida, plantilla sin
  rellenar, veredicto `pendiente`/`desconocido`, IMPORTANTE `corregido`/`aceptado`,
  CRÍTICO, fragmentos mezclados (forma de TASK-013) → completa; solo MENOR →
  acotada; `modeloBarato` sin cambio respecto a TASK-081 — arquitectura y riesgos.
- `review` tras ronda 1 solo con MENOR → petición 2 con un solo grupo, sin
  sufijo, línea de alcance con motivo e instrucciones que exigen tests (criterio 2)
  — arquitectura y riesgos.
- `review` con un IMPORTANTE en cualquier estado, incluido `corregido` a mano
  → ronda completa (criterio 3) — riesgos.
- `desde === baseBranch` (amend/rebase) y merge de `develop` en el delta →
  ronda completa — riesgos.
- Ronda 3 tras una acotada que encontró IMPORTANTE → método completo con diff
  desde la base (punto 3) — riesgos.
- `--completa` fuerza la ronda completa; flag desconocido rechazado;
  `result.alcance`; el chore de commit sigue clasificándose en `metricas` —
  arquitectura y riesgos.
- `npm test` en verde salvo los tres rojos conocidos de Windows (criterio 4):
  ningún rol lo trató; es del enunciado.

### Sin cubrir

- Umbral de «la medida lo justifica»: ningún rol lo propone. Va a decisión humana.
- Rol de dominio no lanzado: la semántica de severidades/estados la fijó riesgos
  por analogía con TASK-081, no un análisis de dominio.

### Suposiciones no verificadas

- Que los casos «solo MENOR» sean generales: arquitectura leyó 4 informes de
  ToolsaWeb (TASK-017, 070, 071, 098). Lo confirma la medida.
- Que la ronda 1 escribe siempre `abierto` (riesgos, visto en 6 tareas de ToolsaWeb).
- Si TASK-056, 057, 058, 066, 073 y 074 de TaskCode partían de ronda 1 solo con
  MENORES (riesgos). Lo resuelve la medida.
- Nombre del revisor genérico (`code-quality-reviewer`) sin leer
  `src/core/revisores.ts`, y que la sección de cobertura de TASK-074 encaje con
  un solo grupo pasando `undefined` (arquitectura).
- Volumen orientativo: 39 tareas de TaskCode y ~100 de ToolsaWeb con ronda 2
  (arquitectura; no es la medida).

## Lo que necesita decision de una persona

- **Si la medida justifica implementar el criterio 2**, y con qué umbral, a la
  vista de las dos cifras (rondas 2 solo-MENOR y cuántas de ellas encontraron
  CRÍTICO/IMPORTANTE nuevo). Ningún rol fijó umbral; es un juicio coste/garantía.
- **Si el diff que toca ficheros fuera de la columna `Fichero` fuerza la ronda
  completa** — riesgos: sí, como salvaguarda frente a TASK-013 / arquitectura:
  no la contempla. Ninguno midió cuánto ahorro anula ni si la columna es fiable
  (formatos como `Armazon.vue:191`).
- **Si se añade el aviso en `taskctl veredicto`** para `cambios-solicitados`
  con solo MENOR (alternativa descartada por arquitectura como sustituto, pero
  propuesta como complemento). Cambia el contrato de TASK-036: fuera de alcance
  salvo que se decida.
- **La aprobación del plan entero** con `taskctl approve`, incluidas las
  elecciones de los desacuerdos 1, 4 y 5.

## Decisiones de la persona (2026-11-07, Carlos)

- **Umbral**: el modo acotado se implementa si al menos el **20 %** de las
  rondas 2 medidas partian de una ronda 1 sin CRITICO ni IMPORTANTE y, de esas,
  **como mucho el 10 %** encontro un CRITICO o IMPORTANTE nuevo. Si no se
  cumple, se documenta y el criterio 2 queda no aplicable.
- **Ficheros fuera de la columna `Fichero`**: si el diff de las correcciones
  toca algun fichero que no aparece en la columna `Fichero` de ningun hallazgo
  de la ronda anterior, la ronda es **completa** (gana riesgos).
- **Aviso en `taskctl veredicto`**: se anade un **aviso, sin bloqueo**, al
  registrar `cambios-solicitados` con una tabla que solo tiene MENORES. No
  cambia el contrato de TASK-036.
- Desacuerdos 1, 4 y 5: se aceptan como los resuelve el plan.
