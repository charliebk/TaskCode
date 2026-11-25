# Peticion de brainstorm — TASK-158b, rol riesgos (ronda 1)

- Tarea: TASK-158b — taskctl comprueba la autorrevision 4D por ronda y en los MENORES (parte b de TASK-158)
- Tipo: feature · Complejidad declarada: alta
- Ronda: 1
- Fecha: 2026-11-25
- Rol: `brainstorm-riesgos` — lanzalo con el agente de ese mismo nombre
- Vuelca tu respuesta en: `salida-brainstorm-riesgos-1.md`

## Tu pregunta

> ¿Por donde se rompe esto?

## Que miras

- Bordes y estados intermedios: que queda a medias si el proceso muere a mitad.
- Fallos parciales y concurrencia: dos ejecuciones, un recurso ocupado, un permiso denegado.
- Compatibilidad hacia atras con los datos y ficheros que YA existen.
- La vuelta atras: si esto sale mal, como se deshace y que queda inservible.

## Que NO miras

No es una lista de cortesia. Si la ignoras y lo cubres todo "por si acaso", el acotado de contexto se deshace sin que se note y esta tarea deja de tener varios puntos de vista:

- Donde encaja el cambio (es del rol de arquitectura).
- Que aserciones escribir (es del rol de testing).
- Las reglas de negocio (son del rol de dominio).

## Enunciado de la tarea

### Objetivo

````
Parte b del troceo de TASK-158 (Regla 4D preventiva en todos los procesos que crean o actualizan codigo), partes TASK-158a, TASK-158b, TASK-158c en la rama feature/task-158-regla-4d-preventiva-en-todos-los-proceso.

`review` avisa al abrir la ronda K+1 si `## Autorrevision` no trae
`- 4D ronda K — <commit>: ...`; `verificar-menores` avisa si no trae
`- 4D menores — <commit>: ...`. Avisos, no bloqueos (como el de TASK-153:
las tareas viejas no se atascan).
````

### Criterios de aceptacion

````
Las correcciones de una ronda de revision y los MENORES corregidos pasan por la misma exigencia 4D que la implementacion (autorrevision 4D por ronda y por correccion)
Un test por comando (review en ronda 2, verificar-menores) falla si deja de avisar
````

## Como entregas

Escribe en `salida-brainstorm-riesgos-1.md`, con estas secciones y en este orden:

- Modos de fallo, ordenados por gravedad, con el escenario concreto de cada uno
- Estados intermedios y fallos parciales
- Compatibilidad hacia atras
- Vuelta atras
- El riesgo que mas te preocupa (UNO solo)

## Reglas

- **Propones enfoque; no implementas.** No escribas codigo de produccion ni modifiques ficheros del repo: tu salida es un documento.
- Evidencia, no suposicion: si afirmas que algo se comporta de cierta manera, es porque lo has mirado. Di de donde lo sacas.
- Prefiere lo concreto: rutas, nombres y casos reales por encima de recomendaciones genericas.
- Trabajan en paralelo contigo, sin verte: **arquitectura**, **testing**. No cubras lo suyo — si lo haces, el unificador recibira el mismo punto de vista repetido y lo leera como confirmacion.
