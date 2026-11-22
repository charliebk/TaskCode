# Peticion de brainstorm — TASK-142, rol riesgos (ronda 1)

- Tarea: TASK-142 — Regla 4D: disfraz en los scripts de Git-Flow
- Tipo: fix · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-11-22
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
Corregir los scripts de Git-Flow que aparentan hacer algo que no hacen (auditoria 4D completa, docs/auditoria-4d-completa.md, casos SCR-01, SCR-09, SCR-10, SCR-11 y SCR-14). SCR-01 es CRITICO: resume-work aplica el stash equivocado.
````

### Criterios de aceptacion

````
resume-work.sh aplica el stash de la rama exacta (stash_ref, sin casar prefijos); un test con dos stashes pause: feature/a y pause: feature/ab falla con el codigo actual y pasa con el arreglo
pause-work.sh --push sin origin no aborta: usa detect_origin_available y _gf_hora como el resto de scripts, con test
push-back-to-remote.sh y mirror-to-remote.sh no dan por COMPLETADO un push rechazado (exit distinto de 0 o resumen con lo fallido) y su cabecera y avisos dicen lo que de verdad copian
El README de gitflow y los textos que hablan de 19 scripts reflejan los 24 scripts actuales y los cambios hechos sobre el zip original
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
- Trabajan en paralelo contigo, sin verte: **arquitectura**. No cubras lo suyo — si lo haces, el unificador recibira el mismo punto de vista repetido y lo leera como confirmacion.
