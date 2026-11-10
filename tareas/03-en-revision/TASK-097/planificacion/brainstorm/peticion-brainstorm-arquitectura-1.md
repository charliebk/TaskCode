# Peticion de brainstorm — TASK-097, rol arquitectura (ronda 1)

- Tarea: TASK-097 — Regla de una hora: plan estima la duracion de punta a punta y propone trocear
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-11-10
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
Ley de agilidad (decision de Carlos, 2026-11-10): una tarea prevista de mas de 1 hora de punta a punta (de la rama abierta al cierre con merge) se parte en varias. Medido en 147 tareas: el mejor predictor de la duracion son los ficheros de codigo (correlacion 0,40; capas 0,28; criterios 0,23); con 1-10 ficheros de codigo la mitad cierra en una hora, con 11 o mas solo el 16 %. Se estima al planificar, el plan lo deja escrito, la persona decide en approve y finish mide el tiempo real para calibrar. Partir por capas solo si cada parte se verifica sola; si no, una porcion vertical pequena.
````

### Criterios de aceptacion

````
plan-final.md lleva la linea 'Duracion estimada: N min' con sus senales (ficheros de codigo previstos, capas, criterios); taskctl approve avisa si falta (test)
Si la estimacion supera 60 min, taskctl siguiente en la fase approve devuelve preguntar en cualquier modo y su motivo propone trocear; con 60 o menos, nada cambia (test por cada caso)
taskctl finish anota en tarea.md los minutos reales de punta a punta (de start a finish, sin pausas) junto a la estimacion, y taskctl metricas los muestra (test en un repo temporal)
skills/plan y skills/task-workflow explican la regla, las senales y como trocear (porcion vertical frente a capas); README y CHANGELOG la anotan
La suite completa de TaskCode pasa en verde (npm test) sin debilitar ningun test
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
