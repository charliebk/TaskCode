# Brainstorm — TASK-083, rol arquitectura (ronda 1)

- Rol: `brainstorm-arquitectura`
- Agente: taskcode-plugin:brainstorm-arquitectura

## Enfoque propuesto, con rutas y nombres concretos

**El punto de partida ya existe.** La ronda 2 de TASK-040 ya trae el diff de las correcciones. `runReviewCommand` (`src/commands/review.ts`), con la tarea `en-revision` y la ronda anterior en `cambios-solicitados`:
- toma `desde` del `- Commit revisado (HEAD):` de la peticion N (`commitRevisadoDe`);
- no ejecuta el update de Git-Flow;
- lista en `seccionPrevia` los hallazgos abiertos (`hallazgosNoCerrados`).

Lo que encarece la ronda 2 no es el diff. Son tres cosas:
1. **Las instrucciones** de `peticionTemplate`, que son las de una revision completa: clonar, correr la suite completa y buscar el caso que rompe.
2. **La fragmentacion por dominio**, que se recalcula sobre el delta. En ToolsaWeb las rondas fragmentadas lanzan dos agentes tambien en la ronda 2 (p. ej. TASK-004, 005, 007, 013, 018…023, 032, 035, 042, 073, 084, 086, 088, 107, 135 y 148 tienen `informe-revision-2-angular-vue-reviewer.md` y `-code-quality-reviewer.md`).
3. **El contexto permitido** por grupo.

Asi que la «verificacion acotada» no es un modo nuevo de diff. Es otro alcance de la ronda N+1, que se decide en el mismo sitio donde TASK-081 ya decide `modeloRonda`.

**Por que hay rondas 2 con solo MENORES.** La politica escrita ya dice que una ronda sin CRITICO ni IMPORTANTE cierra (`skills/task-workflow/revision.md` §Rondas, lineas 77-80; `case 'review'` de `src/core/state-machine.ts`, lineas 217-229: `aprobada` no abre otra ronda). Las rondas 2 «solo MENORES» existen porque el revisor escribe `cambios-solicitados` con una tabla que solo tiene MENOR. Visto en ToolsaWeb TASK-017, TASK-070, TASK-071 y TASK-098.

**Propuesta, en cuatro piezas:**

1. **Regla pura en `src/core/informe-revision.ts`.**
   ```ts
   export type AlcanceRonda = { acotada: boolean; modeloBarato: boolean };
   export function alcanceRondaSiguiente(informes: readonly string[]): AlcanceRonda;
   ```
   - Sobre `leerHallazgos`, el unico parser de la tabla.
   - Fail-closed: sin tabla, severidad fuera del vocabulario (`severidadReconocida === null`), plantilla sin rellenar o algun CRITICO/IMPORTANTE abierto → `acotada: false`.
   - `modeloBaratoPermitido` (hoy en `review.ts`, lineas 305-318) se muda aqui y pasa a ser el campo `modeloBarato`. `review.ts` la reexporta para no romper sus tests.

2. **`review.ts`: el alcance entra en `RondaPrevia` y se calcula en `leerRondaPrevia`.**
   - `RondaPrevia` anade `alcance: AlcanceRonda` (desaparece el booleano suelto `modeloBaratoPermitido`).
   - Con `acotada` y sin `--completa`:
     - (a) no se llama a `clasificarPorDominio`: un unico grupo `{ revisor: <generico>, ficheros: paraRevision.incluidos }`, sin sufijo (`peticion-revision-N.md` / `informe-revision-N.md`);
     - (b) `peticionTemplate` recibe `extras.verificacionAcotada: true` y sustituye el bloque «Instrucciones para el agente revisor» por uno de verificacion: comprobar cada hallazgo de `seccionPrevia` contra el delta y que la correccion no abre otro fallo;
     - (c) la cabecera lleva `- Alcance: verificacion acotada al diff de las correcciones`.
   - Todo lo demas no se toca: `desde`, exclusion, cobertura, rollback de `escritos`, autocommit.

3. **Contrato del CLI.**
   - `FLAGS_REVIEW` gana `--completa` (salida de emergencia; la acotada se activa sola cuando se cumple la regla).
   - `ReviewCommandResult` gana `alcance: 'completa' | 'acotada'`.
   - `src/cli.ts` lo imprime junto a `modeloRonda`.

4. **Medida (criterio 1), sin comando nuevo.**
   - Script de un solo uso en el scratchpad que importa `leerHallazgos` y `veredictoDeRonda` de `dist/core/informe-revision.js` y recorre `tareas/04-terminadas/*/revision/` de los dos repos.
   - Cuenta las tareas con ronda 2 cuya ronda 1 (todos sus fragmentos) tiene 0 CRITICOS y 0 IMPORTANTES abiertos.
   - Resultado, metodo y lo que no cuenta (informes sin tabla = sin dato) a una seccion nueva «13. Rondas 2 con solo MENORES (TASK-083)» de `docs/METRICAS.md`, fuera de los marcadores `<!-- taskctl metricas --tokens -->`.

Volumen orientativo (no es la medida): 39 tareas de TaskCode con `informe-revision-2*.md` y unos 100 directorios de ToolsaWeb (140 ficheros contando fragmentos).

## Que se extiende y que se crea

**Se extiende:** `src/core/informe-revision.ts` (`alcanceRondaSiguiente` + regla de TASK-081 mudada); `src/commands/review.ts` (`RondaPrevia.alcance`, `ExtrasPeticion.verificacionAcotada`, bloque de instrucciones alternativo, rama de un solo grupo, `--completa`, `ReviewCommandResult.alcance`); `src/cli.ts`; `skills/task-workflow/revision.md` §Rondas (sin nombrar TaskCode); `docs/METRICAS.md` §13 y README del plugin.

**Se crea:** solo el script de medida, temporal y fuera del repo.

**No se toca:** `state-machine.ts`, `commands/veredicto.ts`, `fs/rondas.ts` (los nombres de fichero no cambian: `finish`, `metricas` y `registrar-coste` siguen leyendo igual), `core/modelo-revision.ts`.

## Limites que cruza

- **Formato de `peticion-revision-N.md`:** linea nueva `- Alcance:` y otro bloque de instrucciones. `- Commit revisado (HEAD):` no cambia (la ronda N+2 depende de ella).
- **Nombres:** la ronda acotada nunca lleva sufijo de dominio. Efecto conocido: en `resumirHallazgos` el mismo ID en `informe-revision-1-<skill>.md` y en `informe-revision-2.md` cuenta dos veces (MEN-3 aceptado en TASK-064), ahora mas a menudo.
- **CLI:** flag nuevo y campo nuevo; afecta a `rechazarFlagsDesconocidos` y a la ayuda.
- **Contenido instalado en otros proyectos:** la skill `revision.md`.
- **Frontera `review.ts` ↔ `core/informe-revision.ts`:** la decision de alcance pasa al modulo puro.

## La decision de diseño que mas te preocupa (UNA sola)

**Que haya dos reglas distintas sobre la misma tabla de la ronda anterior.** TASK-081 permite modelo barato con «ningun CRITICO en ningun estado; un IMPORTANTE corregido vale»; TASK-083 acotaria con «ningun CRITICO ni IMPORTANTE abierto». Como dos funciones separadas saldran combinaciones incoherentes (acotada con modelo caro, completa con barato) y cada cambio del parser habra que hacerlo dos veces.

Posicion: **una sola funcion pura**, `alcanceRondaSiguiente`, que devuelve las dos decisiones con sus condiciones una al lado de la otra. La diferencia exacta entre «abierto» y «en cualquier estado» para IMPORTANTE la tiene que fijar dominio o la persona: el enunciado es ambiguo y TASK-081 eligio «existentes» para CRITICO.

### Alternativa descartada

Bloquear en `taskctl veredicto` el `cambios-solicitados` cuando la tabla solo tiene MENOR. Seria lo mas barato y aplicaria la politica escrita, pero deja sin verificar las correcciones de MENORES (el objetivo pide verificarlas) y cambia el contrato de `veredicto` (TASK-036). Queda como mejora complementaria, quiza como aviso.

### Desacuerdo previsto

Con riesgos, sobre la activacion automatica: automatica cuando se cumple la regla fail-closed, con `--completa` para salir. Si es opcional, en los modos semi y auto nadie la pide y el ahorro no llega.

### Suposiciones no verificadas

- Generalidad de los casos con solo MENOR: leidos solo 4 informes de ToolsaWeb.
- Nombre del revisor generico (`code-quality-reviewer`) sin leer `src/core/revisores.ts`.
- La seccion de cobertura (TASK-074) encaja igual con un solo grupo, pasando `undefined`.
