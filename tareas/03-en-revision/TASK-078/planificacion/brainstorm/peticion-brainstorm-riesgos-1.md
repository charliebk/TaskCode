# Peticion de brainstorm — TASK-078, rol riesgos (ronda 1)

- Tarea: TASK-078 — Hook que impide leer y editar los held-out de la tarea en curso
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-11-05
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
Segunda mitad de TASK-073 (depende de ella): que el agente que implementa una tarea no pueda leer ni editar sus tests held-out (carpeta aceptacion/) mientras trabaja en su rama, con un hook PreToolUse sobre herramientas de fichero y Bash/PowerShell.
````

### Criterios de aceptacion

````
Hook PreToolUse con matcher Read|Edit|Write|MultiEdit|NotebookEdit|Grep|Glob que sale 2 ante una ruta tareas/*/TASK-NNN/aceptacion/ de una tarea cuya rama es la actual, y 0 ante rutas hermanas (tarea.md, aceptacionX/)
El guardian de Bash/PowerShell bloquea comandos cuyo texto nombra esa ruta (cat, Get-Content, git show rama:ruta)
En otra rama (develop, durante el diseno) no bloquea: la persona puede escribirlos con Claude
Rutas con mayusculas, barras invertidas, relativas o con .. se normalizan antes de comparar; Agent/Task fuera del matcher
Tests contra el dist real por stdin y repos temporales; smoke con claude -p --plugin-dir con el exit 2 del hook visible
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
