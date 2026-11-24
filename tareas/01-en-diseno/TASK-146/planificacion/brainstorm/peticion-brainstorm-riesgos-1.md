# Peticion de brainstorm — TASK-146, rol riesgos (ronda 1)

- Tarea: TASK-146 — Regla 4D: duplicacion en new, import, roadmap, verificar-lote y registrar-coste
- Tipo: fix · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-11-24
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
Quitar las reimplementaciones de helpers existentes en comandos sueltos (auditoria 4D completa, docs/auditoria-4d-completa.md, casos CMD2-06, CMD2-07, CMD2-10 a CMD2-13, CMD2-15, CMD2-16 y CMD1-08).
````

### Criterios de aceptacion

````
import valida y compone la tarea con lo mismo que new (componerCuerpo, defaults, propuesta de complejidad); el modelo por defecto esta en un solo sitio
roadmap --comparar decide con prepararRoadmap; verificar-lote usa headCommit y listTareasEnEstados y un fallo de git o de readdir no da un lote verde
registrar-coste suma con CAMPOS_COSTE; los readdir tolerantes y claveRuta tienen un solo helper; doctor-deploy usa diaLocal y la fecha de creado es la misma que la de new
Las cabeceras de registrar-coste, veredicto y review describen lo que hace el codigo y runPlan deja la historia de las rondas en el CHANGELOG
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
