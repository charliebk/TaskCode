# Peticion de brainstorm — TASK-144, rol arquitectura (ronda 1)

- Tarea: TASK-144 — Regla 4D: ciclo de vida, cadena y flags en commands
- Tipo: fix · Complejidad declarada: alta
- Ronda: 1
- Fecha: 2026-11-23
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
Cerrar las decisiones del ciclo de vida y de los flags escritas en varios comandos con reglas distintas (auditoria 4D completa, docs/auditoria-4d-completa.md, casos CMD1-01, CMD1-09, CMD1-10, CMD1-11, CMD2-01 a CMD2-05, CMD2-09, CMD2-14 y FS-01).
````

### Criterios de aceptacion

````
GUARDADOS_POR_CADENA se deriva de los comandos que escriben o cambian de rama (trocear, verificar-menores, verificar-lote y doctor-deploy incluidos) y un test falla si un comando con autoCommit queda fuera
siguiente, verificar-menores y finish comparten una sola definicion de codigo cambiado tras el Commit revisado y del Commit revisado de la ultima ronda; un test con comando_sincronizacion da finish sin pregunta en modo automatico
Los flags con valor se leen con extraerRepetible (veredicto, verificar-menores, approve, cadena, finish, doctor-deploy, new) y los booleanos estan todos en FLAGS_SIN_VALOR: --flag=valor se comporta igual en todos los comandos
El patron de ficheros de ronda y el de peticiones de rol vienen de rondas.ts y plan-brainstorm.ts; la regla de la tarea vive en su rama y la de que plan cuenta estan en un solo sitio
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
- Trabajan en paralelo contigo, sin verte: **riesgos**, **testing**. No cubras lo suyo — si lo haces, el unificador recibira el mismo punto de vista repetido y lo leera como confirmacion.
