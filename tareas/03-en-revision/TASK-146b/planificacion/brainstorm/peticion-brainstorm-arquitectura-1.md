# Peticion de brainstorm — TASK-146b, rol arquitectura (ronda 1)

- Tarea: TASK-146b — registrar-coste, readdir, fecha y cabeceras (parte b de TASK-146)
- Tipo: fix · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-11-24
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
Parte b del troceo de TASK-146 (Regla 4D: duplicacion en new, import, roadmap, verificar-lote y registrar-coste), partes TASK-146a, TASK-146b en la rama fix/task-146-regla-4d-duplicacion-en-new-import-roadm.

registrar-coste suma con CAMPOS_COSTE, un helper de readdir tolerante y claveRuta en un sitio, diaLocal en doctor-deploy y creado con la regla de new, cabeceras fieles y la historia de runPlan fuera del codigo.
````

### Criterios de aceptacion

````
registrar-coste suma con CAMPOS_COSTE, los readdir tolerantes y claveRuta tienen un solo helper, y doctor-deploy usa diaLocal con la fecha de creado igual que new
Las cabeceras de registrar-coste, veredicto y review describen lo que hace el codigo, y runPlan deja la historia de las rondas en el CHANGELOG
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
