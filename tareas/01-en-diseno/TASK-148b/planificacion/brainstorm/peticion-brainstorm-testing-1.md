# Peticion de brainstorm — TASK-148b, rol testing (ronda 1)

- Tarea: TASK-148b — validacion de config (parte b de TASK-148)
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
Parte b del troceo de TASK-148 (Regla 4D: catalogos, config y utilidades en core), partes TASK-148a, TASK-148b, TASK-148c, TASK-148d en la rama fix/task-148-regla-4d-catalogos-config-y-utilidades-e.

masParecida, validadores de entero y de enumerado, CLAVES_CONFIG atada al switch, una ruta relativa (CORE1-06, CORE1-07, CORE1-08, CORE1-10).
````

### Criterios de aceptacion

````
config usa masParecida para sugerir, un validador de entero en rango y otro de lista de enumerado; un test falla si CLAVES_CONFIG y el switch de claves no coinciden; SKILL_KEY_RE se deriva de los campos
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
