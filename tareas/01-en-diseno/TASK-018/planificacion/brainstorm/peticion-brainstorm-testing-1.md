# Peticion de brainstorm — TASK-018, rol testing (ronda 1)

- Tarea: TASK-018 — Enrutado de revisor por diff real, fragmentado por dominio
- Tipo: feature · Complejidad declarada: alta
- Ronda: 1
- Fecha: 2026-09-12
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
Hoy `taskctl review` siempre invoca al mismo agente revisor declarado en
`tarea.md` (`agente_revisor`), sin mirar qué toca de verdad el diff de la
rama. TASK-032 (D6/D7) ya dejó redactadas cuatro skills revisoras por dominio
(java-spring, angular-vue, csharp-autocad-ifc, code-quality) con sus
`patrones_archivo` declarados y probados en las dos direcciones
(`path.matchesGlob`), y `code-quality-reviewer` ya se marca `fallback: true`
con el umbral de dominios fijado en 3 (decisión #16). Falta la pieza que los
conecta con el ciclo real: que `taskctl review` clasifique el diff real de la
rama por esos patrones, lance un revisor por cada dominio detectado hasta el
umbral, y caiga al revisor genérico por encima de él o cuando ningún patrón
case.
````

### Criterios de aceptacion

````
Clasifica el diff real de la rama por dominio en vez de por el tipo declarado de la tarea.
Fragmenta la revisión en un agente por dominio hasta el umbral que fije el punto 16 de la sección 14, y por encima de ese umbral cae a un único revisor genérico.
Cada revisor recibe solo el subconjunto del diff de su dominio.
Tests con diffs sintéticos que cubren un dominio, varios por debajo del umbral y varios por encima.
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
