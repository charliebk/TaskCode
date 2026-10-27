# Peticion de brainstorm — TASK-067, rol arquitectura (ronda 1)

- Tarea: TASK-067 — Doctor-deploy B: puntos de juicio, tareas TASK-9999 y aviso en release
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-10-27
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
Completa doctor-deploy (TASK-066). Los puntos que no se pueden medir con certeza (RLS, auth en servidor, restringir accesos, mass assignment, queries parametrizadas, validacion de inputs, uploads, cookies...) los revisa un agente de seguridad que tiene que citar evidencia; y cada punto que falla se convierte en una tarea para arreglarlo, numerada en un rango reservado descendente desde TASK-9999 para no chocar con las tareas normales. Ademas, cerrar una release avisa si no hay certificado reciente.
````

### Criterios de aceptacion

````
La skill /taskcode-plugin:doctor-deploy ejecuta el CLI y lanza un agente revisor de seguridad para los puntos de juicio que aplican; cada veredicto del agente cita fichero y linea, o el punto queda NO VERIFICADO
taskctl doctor-deploy --resultado <fichero json> incorpora los veredictos del agente al informe y al certificado; un veredicto sin evidencia o de un punto desconocido se rechaza con su motivo
Con --crear-tareas se crea una tarea por cada FALLA, numeradas hacia abajo desde TASK-9999 (9999, 9998...), con el arreglo como objetivo y como criterio que doctor-deploy de OK en ese punto
La numeracion normal ignora el rango reservado: con TASK-065 y TASK-9999 existentes, taskctl new crea TASK-066; con test
Repetir --crear-tareas no duplica: un punto con tarea ya abierta reutiliza la existente y lo dice
finish de una tarea release avisa sin bloquear si no hay certificado de doctor-deploy del commit que se cierra o si tiene alguna FALLA critica
Ni la skill, ni el agente, ni el catalogo mencionan TaskCode ni sus rutas internas (lo comprueba el test de contenido expuesto); README y CHANGELOG al dia
Pendientes de TASK-066 (MEN-12 y MEN-13): gitignore-cubre-env revisa todas las carpetas de proyecto (o sale NO VERIFICADO diciendo cuantas faltan) con test de mas de 10 carpetas; y tests que maten los mutantes N8, N9, N12, N14 y N17 de informe-revision-3.md de TASK-066
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
