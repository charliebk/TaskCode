# Peticion de brainstorm — TASK-038, rol arquitectura (ronda 1)

- Tarea: TASK-038 — F2-T2 Una sola deteccion de origin por invocacion, con timeout
- Tipo: feature · Complejidad declarada: simple
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
Que cada invocacion de un script de Git-Flow pregunte a `origin` una sola vez
y nunca espere mas de unos segundos (auditoria del 2026-10-03, B2 y D9). Hoy
`detect_origin_available` esta reimplementada en linea en 7 scripts, cada
`git ls-remote` espera lo que tarde la red (con la VPN caida, del orden de
30 s) y puede quedarse esperando credenciales, y `resolve_main_branch` hace
dos consultas mas. Ademas, `merge-feature-to-develop.sh` no distingue «origin
configurado pero caido» de «sin origin».
````

### Criterios de aceptacion

````
`detect_origin_available` cachea su resultado por invocacion; `update-feature.sh` deja de reimplementarla
`git ls-remote` con limite de 5 s, portatil en Git Bash y Linux
`merge-feature-to-develop.sh` aplica la guarda de origin configurado pero caido
Test con un origin inalcanzable: el comando responde en menos de 10 s
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
- Eres el unico rol que se lanza en esta tarea.
