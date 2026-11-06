# Brainstorm — TASK-080, rol testing (ronda 1)

- Rol: `brainstorm-testing`
- Agente: taskcode-plugin:brainstorm-testing. Sin enfoque previo: razona sobre lo que piden los criterios. Todo lo citado, leido en el repo.

## Que es observable sin llamar a ningun agente

- **Criterio 4** (unico con logica en `src/`): la lista de ficheros de `planificacion/brainstorm/` tras `runPlanCommand` sobre un repo Git temporal, como `REPARTO` en `test/commands/plan-brainstorm.test.ts:139-176`. `deepEqual` sobre la lista ordenada, no `>=`.
- **Efecto colateral visible**: `planEsPlantilla` (`src/commands/approve.ts:236`) solo compara con las plantillas de los **prefijos** `seleccionarRoles(0..N)`, y `planTemplate` (`plan.ts:247-248`) escribe los titulos de los roles. Un plan con "arquitectura, riesgos, rendimiento" no casa con ningun prefijo: `approve` daria por redactado un plan que sigue siendo la plantilla vacia.
- **Criterios 1, 2, 3 y 5**: prosa en `.md`; observable solo el contenido, con la asercion anclada a su seccion. Que el agente se comporte mejor no es demostrable con un test.
- **Unificador**: `peticion-unificador-N.md` lista `salida-brainstorm-rendimiento-N.md` con titulo "rol rendimiento", no "rol ya no declarado en el plugin" (`plan.ts:947-952`).

## Plan de pruebas, cada una con su mutacion

1. **Lanzamiento por etiqueta**: un caso por etiqueta (`rendimiento`, `wasm`, `workers`, `3d`) con complejidad `media`; en disco exactamente `peticion-/salida-brainstorm-rendimiento-1.md` mas los de los 2 roles. Repo temporal real. Mutacion: quitar `workers` del conjunto -> rojo ese caso; `some` por `every` -> rojos los cuatro.
2. **Sin etiqueta o con una parecida no se lanza**: `etiquetas: []` (el `REPARTO` actual), `['web-workers']`, `['wasmtime']`. La regla de coincidencia la fija dominio; esto la clava. Mutacion: lanzarlo siempre, o `includes` sobre las etiquetas unidas en cadena -> rojo.
3. **Encaje con el presupuesto**: `trivial`+`wasm`, `simple`+`wasm` (hoy modo redaccion con 1 rol: fijar si pasa a unificador), `critica`+`wasm` (¿5 peticiones?). Ids a mano. Mutacion: meter rendimiento dentro de `seleccionarRoles` (gasta puesto) cambia la lista de `critica` y `simple`.
4. **`approve` rechaza la plantilla de un plan con rendimiento**: `media`+`wasm`, `taskctl plan` y `plan-final.md` sin tocar -> `approve` aborta. Repo temporal real. Mutacion: el codigo actual de `approve.ts:236` (solo prefijos) ya lo pone rojo; es la regresion a cerrar.
5. **El unificador consolida rendimiento**: la peticion nombra la salida con "rol rendimiento". Etiqueta anadida entre rondas -> se relanza el brainstorm; quitada -> la salida existente se sigue consolidando. Copiar los casos "si suben los roles..." y "bajar los roles...". Mutacion: sacar rendimiento de la busqueda de `plan.ts:947` deja "ya no declarado".
6. **Contenido de los `.md` anclado a seccion**:
   - `brainstorm-rendimiento.md`: los seis temas dentro de "Que miras".
   - `brainstorm-arquitectura.md`: limites, direccion de dependencias, acoplamiento y ADR dentro de "Que miras", con `doesNotMatch` en "Que NO miras".
   - `angular-vue-reviewer`: "WCAG 2.2" y los criterios (1.4.3, 2.4.3, 2.4.7, 2.4.11, 2.1.2, 4.1.2) dentro del bloque de accesibilidad.
   - Mutaciones: borrar la vineta de copias JS-WASM; mover ADR a "Que NO miras"; "2.2" por "2.1" o borrar 2.4.11. Cada una pone rojo su caso.

## Aserciones trampa que hay que evitar en esta tarea concreta

- **El 13b se vuelve vacio**: `test/agents/brainstorm-roles.test.ts:853-857` exige `/rendimiento/` y `\b${dueno}\b` en la misma frase; si el dueno se llama "rendimiento", cualquier frase que nombre al rol lo cumple. Medir la cesion con otra palabra (escalabilidad, coste algoritmico).
- **`includes('accesibilidad')`, `'foco'` o `'aria'` ya dan verde hoy** en angular-vue (SKILL.md lineas 3, 177, 214-219); `/WCAG 2/` aceptaria "WCAG 2.1".
- **Esperados derivados de la constante**: `ROLES_BRAINSTORM.slice(...)` en `plan-brainstorm.test.ts:168` mueve medida y codigo a la vez. Ids nuevos a mano, como `ESPERADO_POR_N`.
- **Ampliar `ESPERADO_POR_N` con n=5** (`test/core/roles-brainstorm.test.ts:95`) validaria que rendimiento entra en la escalera, lo que el criterio 4 niega.
- **Meter rendimiento en `ROLES` de `brainstorm-roles.test.ts:55`** rompe el 14b (`FICHEROS.length`=5, ningun nivel con 5). Tentacion: "arreglarlo" con `length-1`. Separar roles de presupuesto y condicionales en el test.
- **Scripts de mutacion sobre CRLF**: abortar si el md5 no cambia (`docs/contexto/HALLAZGOS.md:683-690`).

## Que pruebas existentes cambian de expectativa

- `brainstorm-roles.test.ts` test 1 (lista cerrada `AGENTES`) y `test/skills/doctor-deploy.test.ts:104` ("los cinco del brainstorm"): uno mas; legitimo, renombrar el titulo.
- **`roles-brainstorm.test.ts` 1 y 9**: el 1 exige el mismo conjunto constante/`agents/`; el 9, que cada `noMira` nombre a los otros. Si rendimiento entra en `ROLES_BRAINSTORM`, los cuatro `noMira` deben nombrarlo; si queda fuera, el 1 necesita un filtro explicito como el del unificador. Decision de arquitectura, explicita.
- **13b del reparto del rendimiento**: hoy lo reclama arquitectura (`agents/brainstorm-arquitectura.md:35`) y lo ceden riesgos, testing y dominio. Reescribir los cinco ficheros y la asercion, incluido "Rendimiento y escalabilidad los lleva el rol de arquitectura" de `brainstorm-testing.md`.
- **Siguen valiendo de red**: `REPARTO` (sin etiquetas no se lanza), `heuristica-complejidad.test.ts:328` ("critica son 4 agentes"), 6c/6d de `revisores.test.ts` (red de `patrones_archivo`) y `total_skills: 6`.

## Como envejece

- La lista de etiquetas vivira en `src/`, agente, README y unificador: una sola constante en `src/`, con el test comparando contra lista a mano.
- El proximo rol condicional (seguridad, datos...) volvera a chocar con la suposicion de prefijos de `approve.ts:236` y `seleccionarRoles`: resolverlo en general, no solo para rendimiento.
- Las frases con numero ("cuatro roles", "los otros tres") en tests y docs se quedan rancias con cada rol; no escribir el numero a mano en mensajes y titulos.
- Si WCAG cambia (3.0), los criterios aseverados cambian: es lo deseado.
