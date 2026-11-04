# Peticion de brainstorm — TASK-071, rol arquitectura (ronda 1)

- Tarea: TASK-071 — Hook Stop: una tarea no se da por hecha con la verificacion en rojo
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-11-04
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
Freno 12 de brakes: si hay una tarea en curso, el agente no puede terminar su turno mientras comando_verificacion falle.
````

### Criterios de aceptacion

````
hooks/hooks.json del plugin declara un Stop hook en Node sin dependencias de runtime
El hook solo actua si existe una tarea en 02-en-curso/ en la rama actual y comando_verificacion esta definido; en cualquier otro caso sale 0 sin coste
Con la verificacion en rojo devuelve exit 2 y por stderr el comando, el codigo de salida, la duracion y la cola de la salida, acotada en tamano
Respeta stop_hook_active para no entrar en bucle y respeta timeout_verificacion
Tests contra un repo temporal real: verde deja parar, rojo bloquea, sin tarea no hace nada, timeout
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
