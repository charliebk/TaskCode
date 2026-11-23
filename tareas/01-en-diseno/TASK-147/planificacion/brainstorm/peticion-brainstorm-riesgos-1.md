# Peticion de brainstorm — TASK-147, rol riesgos (ronda 1)

- Tarea: TASK-147 — Regla 4D: lectores de secciones e IDs en core
- Tipo: fix · Complejidad declarada: alta
- Ronda: 1
- Fecha: 2026-11-23
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
Que cada seccion de tarea.md y cada ID se lean con un solo lector (auditoria 4D completa, docs/auditoria-4d-completa.md, casos CORE1-01, CORE1-02, CORE2-01, CORE2-02, CORE2-04 a CORE2-07, CORE2-12 a CORE2-14, FS-04 y CMD2-08).
````

### Criterios de aceptacion

````
duracion, verificacion ligera, rondas extra, URL de merge request y troceo leen y escriben secciones con rangoDeSeccion y un helper comun para crear la seccion al final; un test con el encabezado dentro de un bloque de codigo lo distingue
casillasSinMarcar usa extraerSecciones (Tras el cierre en negrita y ### Criterios) y validacion-tarea usa normalizarTexto; citar() existe una vez
El ID de tarea se valida y se ordena con una sola regex y un solo lector de numero con letra (task-store, wip-scan, roadmap, trocear, evolucion, flujo); un test con TASK-121a y TASK-1000 ordena igual en roadmap, evolucion, board y wip
FaseMedida y FaseRegistrada son un solo tipo y fila a Marca se convierte una vez en metricas
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
