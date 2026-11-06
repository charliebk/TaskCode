# Plan — TASK-080: Accesibilidad en angular-vue-reviewer y roles de arquitectura y rendimiento en plan

(Lo consolida el agente unificador a partir de 3 roles de brainstorm lanzados en paralelo: arquitectura, riesgos, testing.
Tres, no cuatro: complejidad declarada media, heurística alta (7 puntos); se lanzó el mayor. Dominio no se lanzó. Los desacuerdos se señalan, no se promedian.)

## Enfoque propuesto

- Accesibilidad: solo texto, subsección "Accesibilidad (WCAG 2.2)" en `## Que se revisa` de `skills/angular-vue-reviewer/SKILL.md`; `patrones_archivo` y `total_skills: 6` intactos (arquitectura, verificado por ese rol).
- Arquitectura: ampliar `## Qué miras` de `agents/brainstorm-arquitectura.md` (límites, dirección de dependencias, acoplamiento, ADR) con redacción genérica por el test 12 (arquitectura).
- Rendimiento: rol condicional fuera del presupuesto N: `ROLES_CONDICIONALES`, `seleccionarRolesDeTarea(n, etiquetas)` y `TODOS_LOS_ROLES` en `src/core/roles-brainstorm.ts`; migrar `plan.ts:477/917/947` y `approve.ts:235`; crear `agents/brainstorm-rendimiento.md` (arquitectura).
- Orden: núcleo y `approve` primero (cierra el fallo del checkpoint), luego agentes `.md`, unificador, docs/CHANGELOG (este orden lo aporta el unificador a partir de la prioridad que los tres roles dan al fallo de `approve`).

## Desacuerdos entre roles, y como se resuelven

- Dónde vive rendimiento — arquitectura: lista aparte fuera de N / riesgos: "ambas opciones rompen algo, elegir una y pagar su coste" — gana arquitectura — su migración a `TODOS_LOS_ROLES` paga los costes que riesgos señala en `plan.ts:917/947`, y testing apunta que meterlo en la escalera rompe el 14b y `ESPERADO_POR_N`.
- Dueño del tema "rendimiento" (test 13b) — arquitectura: lo reparte (arquitectura conserva la forma/escalabilidad, el rol nuevo el coste de ejecución) y solo el fichero nuevo cede / riesgos y testing: hay que reescribir los cuatro o cinco ficheros y la aserción — gana arquitectura en el reparto, riesgos y testing en que todos los ficheros lo dicen — el reparto es el único que deja el tema con dueño cuando el rol no se lanza; sin reescribir los ficheros, el 13b queda vacío (testing, `brainstorm-roles.test.ts:853-857`).
- Etiqueta cambiada entre rondas — riesgos: relanzar todo el brainstorm es un fallo, la ronda 2 debería ser incremental / testing: que se relance es lo que hay que probar, como ya pasa "si suben los roles" — gana testing — es lo que el código ya hace hoy cuando suben los roles, y ningún rol propuso un diseño incremental concreto.
- Etiquetas que disparan el rol — riesgos: `web-workers`, `worker`, `performance`, `WASM` sin disparar son un modo de fallo; normalizar y avisar / testing: `web-workers` y `wasmtime` no deben disparar / arquitectura: misma semántica exacta que `seleccionarSkill` — gana testing en el conjunto (el criterio enumera cuatro etiquetas); el aviso en la salida de `plan` de riesgos se acepta; las mayúsculas suben a decisión humana.

## Riesgos aceptados y que los contiene

- `approve`/`taskctl siguiente` dan por redactado un plan vacío con rendimiento (checkpoint saltado) — riesgos, arquitectura y testing — `planEsPlantilla` genera candidatas con `seleccionarRolesDeTarea(k, task.etiquetas)` y prueba 4.
- Etiquetas cambiadas entre `plan` y `approve` vuelven a romper la comparación de plantillas — arquitectura — sin contención propuesta; decisión humana.
- Relanzamiento del brainstorm entero al cambiar etiquetas; afecta a esta misma tarea (`rendimiento`) en una ronda 2 con la dist nueva — riesgos — se acepta como comportamiento probado (prueba 5).
- Falsos positivos de contraste marcados CRÍTICO bloquean `finish`, también en plantillas Flask/Express/Electron que angular-vue ya captura — riesgos — el texto debe fijar la severidad; nadie con criterio de dominio la fijó.
- Ronda aparentemente completa sin petición de rendimiento si `plan` muere — riesgos — escribirla dentro del bucle `relanzarRoles`, antes del testigo del unificador.
- Plan vacío ya aprobado no se deshace con `git revert` — riesgos — buscar esas tareas a mano.

## Plan de pruebas

- Cada etiqueta (`rendimiento`, `wasm`, `workers`, `3d`) con `media` lanza exactamente rendimiento + 2 roles, `deepEqual` e ids a mano — repo Git temporal, `plan-brainstorm.test.ts` — testing.
- Sin etiquetas, `web-workers` y `wasmtime` no lo lanzan — repo Git temporal — testing.
- `trivial`/`simple`/`critica` + `wasm` fijan el encaje con el presupuesto y el modo — repo Git temporal — testing, riesgos.
- `approve` aborta con `plan-final.md` sin tocar de una tarea `media`+`wasm` — repo Git temporal real — testing, riesgos.
- La petición del unificador titula "rol rendimiento"; etiqueta añadida relanza, quitada sigue consolidando — repo Git temporal — testing.
- Contenido de los `.md` anclado a sección (seis temas, ADR fuera de "Que NO miras", "WCAG 2.2" + 1.4.3/2.4.3/2.4.7/2.4.11/2.1.2/4.1.2) con mutación por caso — ficheros reales — testing.

## Sin cubrir

- Dominio no se lanzó: la regla de coincidencia de etiquetas y la severidad de accesibilidad, que testing y riesgos le dejan a dominio, no las fijó nadie — van a decisión humana.
- Ningún rol pidió prueba del texto de `agents/brainstorm-unificador.md` (criterio 5) ni de que una salida ausente sin la etiqueta es lo normal — lo cubre quien implemente, sin aserción propuesta.
- README, documentación de roles y CHANGELOG (criterio 5): solo los menciona arquitectura, sin detalle — se tratan como tarea de cierre.
- Accesibilidad en `.tsx`/`.jsx` fuera de alcance (riesgos) — se documenta como límite.

## Salidas que faltaron

- ninguna (las tres llegaron completas; dominio no se lanzó por presupuesto, no faltó).

## Suposiciones no verificadas

- `test/core/roles-brainstorm.test.ts` no fue leído por arquitectura (testing sí cita sus tests 1 y 9) — leerlo antes de tocar el registro.
- Otras partes de `plan.ts` (529-895) podrían iterar roles — arquitectura — grep de `ROLES_BRAINSTORM` en `src/`.
- `requireStringArray` no normaliza etiquetas — riesgos — leer su implementación.
- Rendimiento por encima del presupuesto cambia `simple` de modo `redaccion` a `unificador` (`plan.ts:833`) — riesgos — prueba 3.
- `doctor-deploy.test.ts` enumera agentes — arquitectura lo supone; testing lo cita en `:104` — confirmar al cambiar el título.

## Lo que necesita decision de una persona

Respondido por la persona (Carlos) el 2026-11-06, en la fase plan:

- **Rendimiento con N=0, N=1 y en `hotfix`**: solo se suma cuando la tarea ya lanza 2 o mas roles (hay unificador). En trivial, simple y hotfix no se lanza, y `taskctl plan` lo avisa en su salida (que etiqueta lo habria disparado y por que no entra). Nunca queda como autor unico del plan. Fuera del presupuesto N: con 2, 3 o 4 roles se suma (critica+wasm = 5 peticiones).
- **Coincidencia de etiquetas**: ignorando mayusculas (`WASM`, `3D` disparan); sigue siendo coincidencia de etiqueta completa (`web-workers`, `wasmtime`, `performance` no disparan).
- **Etiquetas cambiadas entre `plan` y `approve`**: `planEsPlantilla` deduce los roles de las peticiones de la ultima ronda que hay en `planificacion/brainstorm/`, no de las etiquetas actuales; asi la plantilla vacia se detecta siempre. Sin ronda en disco (0 roles), se compara con la plantilla sin roles.
- **Severidad de accesibilidad** (criterio por defecto del orquestador, no preguntado): un aviso de contraste que no se puede verificar desde el diff (colores por variable CSS o tema) no es CRITICO; CRITICO queda para fallos verificables que dejan inoperable un control (trampa de teclado, dialogo sin nombre ni foco gestionado).
- Skill recomendado para la implementacion: `angular-vue-reviewer` (regla: solape), anotado por `taskctl plan`.
- Aprobacion del plan entero con `taskctl approve`: este plan no vale ni se implementa hasta que una persona lo apruebe.
