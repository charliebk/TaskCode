# Peticion de brainstorm — TASK-022, rol arquitectura (ronda 1)

- Tarea: TASK-022 — Documentación de equipo e incorporación de colaboradores
- Tipo: feature · Complejidad declarada: simple
- Ronda: 1
- Fecha: 2026-09-13
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
El repo (`charliebk/TaskCode`, privado) hoy solo tiene un colaborador: el
propio dueño. La sección 14, punto 8 de la metodología queda "resuelta" en
la distribución (marketplace privado en GitHub, sección 7.10) pero deja
pendiente "el nombre exacto del repo y a quién se invita como colaborador".
El nombre del repo ya está fijado (`TaskCode`); falta a quién invitar —
confirmado con Carlos (2026-09-13): **a nadie por ahora**, no hay
colaboradores reales que incorporar todavía. Esta tarea se centra en dejar
lista la guía de incorporación (para cuando haga falta) y en documentar
esa decisión, en vez de ejecutar invitaciones que no hacen falta hoy.
````

### Criterios de aceptacion

````
Guía de incorporación que un integrante nuevo pueda seguir sin ayuda: instalar el plugin, entender el ciclo de vida y hacer su primera tarea.
Sin colaboradores que invitar por ahora (decisión de Carlos, 2026-09-13); la guía queda lista para cuando se incorpore alguien, sin ejecutar ninguna invitación real.
Deja resuelto el punto 8 de la sección 14 en lo que respecta a a quién se invita: documentado que, a día de hoy, no hay nadie que invitar.
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
