# Brainstorm — TASK-080, rol riesgos (ronda 1)

- Rol: `brainstorm-riesgos`
- Agente: taskcode-plugin:brainstorm-riesgos. [V] = leido en el codigo. [S] = suposicion sin verificar.
- Formato: secciones de la peticion; desacuerdos y suposiciones van dentro de cada vineta.

## Modos de fallo, ordenados por gravedad, con el escenario concreto de cada uno

- **El checkpoint humano se salta con un plan sin rellenar.** [V] `planEsPlantilla` (`src/commands/approve.ts:235`) solo compara contra `planTemplate(task, seleccionarRoles(k))` para k=0..N, es decir, prefijos del orden fijo; `planTemplate` (`plan.ts:225`) mete el numero y los titulos de los roles. Escenario: tarea `media` con `wasm` -> plantilla "3 roles: arquitectura, riesgos, rendimiento", que no casa con ningun prefijo: `approve` y `taskctl siguiente` la dan por redactada y en modo auto se avanza con un plan vacio. Mitigacion: generar las candidatas con el mismo juego de roles que resuelve `plan` para la tarea, etiquetas incluidas.
- **Meter rendimiento en `ROLES_BRAINSTORM` rompe prioridad y guarda de rango.** [V] `seleccionarRoles` hace `slice(0,n)` y solo falla si `n > length`; con 5 en la lista, rendimiento solo entra con n=5 (no existe) y un `agentes_brainstorm_*: 5` mal puesto pasaria sin gritar. Si queda fuera, [V] `rolesDeLaRonda` (`plan.ts:917`) y el titulo de salidas (`plan.ts:947`) filtran contra `ROLES_BRAINSTORM`: sin scaffold asegurado y su salida como "rol ya no declarado en el plugin". Ambas opciones rompen algo; desacuerdo previsto con arquitectura: elegir una y pagar su coste explicitamente.
- **El recuento de roles decide el modo.** [S] Si rendimiento suma por encima del presupuesto, una `simple` (1 rol) pasa a 2 y el modo cambia de `redaccion` a `unificador` (`plan.ts:833`), sin peticion de redaccion. Una `trivial` (0) con `3d` dejaria a rendimiento como autor unico del plan, y ese rol no propone la forma del cambio. El tope de `hotfix` (1 agente, `heuristica-complejidad.yml:205`) tambien se romperia. Mitigacion: fijar por escrito si suma o sustituye, y que pasa en 0, en 1 y en hotfix.
- **La etiqueta no dispara el rol y nadie se entera.** [V] Etiquetas por igualdad exacta (`catalogo-skills.ts:487`); [S] `requireStringArray` no normaliza. `WASM`, `3D`, `web-workers`, `worker`, `performance` no lanzarian el rol, sin aviso. Mitigacion: normalizar a minusculas y decir en la salida de `plan` que rol condicional entra y por que etiqueta.
- **El brainstorm se relanza entero al cambiar una etiqueta entre vueltas.** [V] `rolesLanzadosEn` (`plan.ts:805`) exige la peticion de TODOS los roles de hoy; anadir/quitar `wasm` en una ronda 2 da `rondaRoles=null` y relanza todos, cuando la ronda 2 debia ser incremental. Mismo tipo que las cuatro rondas de TASK-016 (HALLAZGOS).
- **Se rompe la convencion de un unico dueno del rendimiento.** [V] El test 13b exige que un unico rol reclame "rendimiento" y los demas lo cedan nombrandolo; el test 1 cierra el conjunto `brainstorm-*`; el 14b deriva el tramo de `FICHEROS.length` y con 5 ningun nivel tiene "todos los roles". Hoy riesgos, testing y dominio ceden el rendimiento a arquitectura: si el rol nuevo solo se lanza a veces, sin el no lo mira nadie con criterio y con el lo miran dos. Desacuerdo con arquitectura: la propiedad del tema depende de si el rol se lanza, y debe decirse en los cuatro ficheros.
- **La accesibilidad bloquea por falsos positivos.** [S] El contraste no es verificable desde un diff si los colores vienen de variables CSS o tema; si el revisor lo marca CRITICO, `finish` se bloquea en toda tarea Angular/Vue. [V] angular-vue ya captura a proposito plantillas de Flask, Express y Electron (`revisores.test.ts:396-406`): el criterio les llega tambien. La severidad la decide dominio; el riesgo de bloqueo es de este rol.

## Estados intermedios y fallos parciales

- [V] La peticion del unificador se escribe la ultima y es testigo de ronda (`plan.ts:966`). Si rendimiento va por un camino aparte, despues del testigo, una muerte entre ambos deja una ronda aparentemente completa sin su peticion: debe ir dentro del bucle `relanzarRoles`.
- [V] Si `plan` muere tras las peticiones y antes del scaffold, `asegurarScaffold` lo recrea solo para `rolesDeLaRonda`: si rendimiento no esta en `ROLES_BRAINSTORM`, su scaffold no se recrea nunca.
- Si falta la salida de rendimiento, el unificador debe nombrarla en "Salidas que faltaron". [S] No se si su fichero sabe que la ausencia sin la etiqueta es lo normal.

## Compatibilidad hacia atras

- [V] TASK-080 lleva `rendimiento` y TASK-079 `wasm`: si en una ronda 2 de esta tarea se ejecuta `plan` con la dist nueva, cambia el juego de roles y se relanza el brainstorm (fallo 5 aplicado a esta tarea).
- [V] Salidas viejas de un rol que ya no esta se toleran como "rol ya no declarado" (`plan.ts:952`).
- [S] En proyectos de usuario `agents/` y CLI llegan juntos; no hay mezcla de versiones salvo instalacion a medias.
- [V] Los `patrones_archivo` de angular-vue no pueden cambiar (6d). Cubrir accesibilidad en `.tsx`/`.jsx` quitaria rutas al generico: fuera de alcance, y hay que decirlo.

## Vuelta atras

- Reversible con `git revert` del merge; el plugin publicado necesita release nueva.
- Tras revertir, las `peticion-`/`salida-brainstorm-rendimiento-N.md` que queden son inocuas [V]: `rolesLanzadosEn` las ignora y salen como "rol ya no declarado". Sin migracion.
- Un plan vacio aprobado por el fallo 1 no se deshace con revert: `plan_aprobado` ya esta commiteado; habria que buscar esas tareas a mano.

## El riesgo que mas te preocupa (UNO solo)

El fallo 1: `planEsPlantilla` (`src/commands/approve.ts:235`) supone juegos de roles prefijo de un orden fijo; un rol condicional rompe esa suposicion y `approve` y `taskctl siguiente` aceptan en silencio un `plan-final.md` sin rellenar, justo lo que el checkpoint humano existe para impedir.
