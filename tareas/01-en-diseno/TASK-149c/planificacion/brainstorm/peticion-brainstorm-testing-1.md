# Peticion de brainstorm — TASK-149c, rol testing (ronda 1)

- Tarea: TASK-149c — utilidades de fs (parte c de TASK-149)
- Tipo: fix · Complejidad declarada: alta
- Ronda: 1
- Fecha: 2026-11-23
- Rol: `brainstorm-testing` — lanzalo con el agente de ese mismo nombre
- Vuelca tu respuesta en: `salida-brainstorm-testing-1.md`

## Tu pregunta

> ¿Como se demuestra que esto funciona, y como envejece?

## Que miras

- Que es observable desde fuera, y contra que recurso real se comprueba.
- Para cada prueba propuesta, LA MUTACION DEL CODIGO FUENTE QUE LA PONDRIA ROJA. Si no sabes decirla, esa prueba no vale.
- Que pruebas ya existentes cambian de expectativa y cuales siguen valiendo de red de regresion.
- Como envejece: que se rompe dentro de seis meses cuando alguien extienda esto.

## Que NO miras

No es una lista de cortesia. Si la ignoras y lo cubres todo "por si acaso", el acotado de contexto se deshace sin que se note y esta tarea deja de tener varios puntos de vista:

- Donde encaja el cambio (es del rol de arquitectura).
- Por donde se rompe en produccion (es del rol de riesgos).
- Las reglas de negocio (son del rol de dominio).

## Enunciado de la tarea

### Objetivo

````
Parte c del troceo de TASK-149 (Regla 4D: duplicacion en fs, hooks y cli), partes TASK-149a, TASK-149b, TASK-149c en la rama fix/task-149-regla-4d-duplicacion-en-fs-hooks-y-cli.

Lockfiles, binarios, cola, PATH, JSON con BOM y nombreBase con una implementacion (FS-10 a FS-14, FS-16).
````

### Criterios de aceptacion

````
Lockfiles, deteccion de binarios, lectura de cola, busqueda en PATH, JSON con BOM y nombreBase tienen una sola implementacion; los mensajes de evidencia nombran DIRS_EXCLUIDOS
````

## Como entregas

Escribe en `salida-brainstorm-testing-1.md`, con estas secciones y en este orden:

- Que es observable sin llamar a ningun agente
- Plan de pruebas, cada una con su mutacion
- Aserciones trampa que hay que evitar en esta tarea concreta
- Que pruebas existentes cambian de expectativa
- Como envejece

## Reglas

- **Propones enfoque; no implementas.** No escribas codigo de produccion ni modifiques ficheros del repo: tu salida es un documento.
- Evidencia, no suposicion: si afirmas que algo se comporta de cierta manera, es porque lo has mirado. Di de donde lo sacas.
- Prefiere lo concreto: rutas, nombres y casos reales por encima de recomendaciones genericas.
- Trabajan en paralelo contigo, sin verte: **arquitectura**, **riesgos**. No cubras lo suyo — si lo haces, el unificador recibira el mismo punto de vista repetido y lo leera como confirmacion.
