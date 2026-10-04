# Peticion de brainstorm — TASK-040, rol arquitectura (ronda 1)

- Tarea: TASK-040 — F3-T1 taskctl review para la ronda 2 y siguientes
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-10-04
- Rol: `brainstorm-arquitectura` — lanzalo con el agente de ese mismo nombre
- Vuelca tu respuesta en: `salida-brainstorm-arquitectura-1.md`

## Tu pregunta

> Dado lo que ya existe, ¿donde encaja este cambio y que forma tiene?

## Que miras

- Los modulos y ficheros que ya resuelven algo parecido, para extenderlos en vez de duplicarlos.
- Que se crea nuevo, que se extiende y en que orden se construye.
- Los limites que el cambio cruza: contratos publicos, formatos de fichero, esquemas.
- El precedente interno mas cercano: como se resolvio la ultima vez un problema de esta forma.

## Que NO miras

No es una lista de cortesia. Si la ignoras y lo cubres todo "por si acaso", el acotado de contexto se deshace sin que se note y esta tarea deja de tener varios puntos de vista:

- Como se prueba (es del rol de testing).
- Por donde se rompe (es del rol de riesgos).
- Las reglas de negocio (son del rol de dominio).

## Enunciado de la tarea

### Objetivo

````
Que la ronda 2 y siguientes de una revision las genere `taskctl review` y no
un agente a mano (auditoria del 2026-10-03, A2 y D3). Hoy `review` solo existe
desde `en-curso`: con la tarea en `en-revision` los errores mandan a `start`,
que manda a `plan`, en circulo; y las peticiones de ronda N de TASK-017, 018,
020, 022, 033 y 038 se escribieron a mano. La ronda N+1 debe embeber solo el
diff desde el commit revisado en la ronda anterior (con las exclusiones de
`excluir_de_revision`) y listar los hallazgos no cerrados de la tabla del
informe anterior (`| ID | Severidad | Estado | Fichero |`, TASK-036).

Conflicto a resolver en el diseno: la §16.3 dice que `ultimo_commit_revisado`
se actualiza cuando una revision TERMINA aprobada, no al pedirla, y el
criterio 2 pide escribirlo en cada ronda. El commit revisado de cada ronda ya
consta en su informe (`- Commit revisado:`).
````

### Criterios de aceptacion

````
Transicion `en-revision -> en-revision` permitida solo si el ultimo informe dice `cambios-solicitados` o `aprobada con correcciones`
`review` escribe `ultimo_commit_revisado` en cada ronda y la ronda N+1 embebe `ultimo_commit_revisado..HEAD` con las exclusiones de F1-T1
La peticion lista los hallazgos no cerrados de la tabla del informe anterior
Los mensajes de error dejan de mandar de `start` a `plan` en circulo
Test que encadena ronda 1, cambios y ronda 2 contra un repo real
````

## Como entregas

Escribe en `salida-brainstorm-arquitectura-1.md`, con estas secciones y en este orden:

- Enfoque propuesto, con rutas y nombres concretos
- Que se extiende y que se crea
- Limites que cruza
- La decision de diseño que mas te preocupa (UNA sola)

## Reglas

- **Propones enfoque; no implementas.** No escribas codigo de produccion ni modifiques ficheros del repo: tu salida es un documento.
- Evidencia, no suposicion: si afirmas que algo se comporta de cierta manera, es porque lo has mirado. Di de donde lo sacas.
- Prefiere lo concreto: rutas, nombres y casos reales por encima de recomendaciones genericas.
- Trabajan en paralelo contigo, sin verte: **riesgos**. No cubras lo suyo — si lo haces, el unificador recibira el mismo punto de vista repetido y lo leera como confirmacion.
