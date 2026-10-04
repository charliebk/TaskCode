# Peticion de brainstorm — TASK-043, rol riesgos (ronda 1)

- Tarea: TASK-043 — F4-T2 Validacion antes de plan y puertas de cierre
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-10-04
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
Que `plan` se niegue a planificar una tarea mal definida, y que `approve` y
`finish` no dejen pasar esqueletos vacios (auditoria del 2026-10-03, C2, C6 y
D5). Reproducido en la auditoria: una tarea entera se cerro con el Objetivo
vacio, un criterio `- [ ] ` vacio, el plan en esqueleto y sin Resultado, y
todos los comandos salieron con 0. Ademas, las tareas con muchos criterios o
criterios vagos («mejorar», «robusto») son las que mas rondas de revision
costaron: las tres con 13 o mas criterios tuvieron peticiones de 110-160 KB.

La validacion es determinista (sin modelo): objetivo no vacio, entre 1 y 8
criterios no vacios, y cada criterio cita algo comprobable (un comando, una
ruta, un numero, codigo entre comillas invertidas o un test). Se calibra
contra las tareas ya cerradas del repo para no rechazar lo razonable.

Fuera de alcance: proponer la particion de una tarea grande (TASK-044).
````

### Criterios de aceptacion

````
`plan` aborta sin mover la tarea si el objetivo esta vacio, hay 0 criterios o mas de 8, o alguno esta vacio
Lint de verificabilidad: cada criterio cita un comando, una ruta, un numero, codigo o un test; `mejorar`, `robusto` o `correctamente` solos se rechazan con el motivo
`approve` rechaza un `plan-final.md` con todas las secciones vacias
`finish` avisa de casillas sin marcar fuera de `### Tras el cierre`
Probado sobre las 17 tareas cerradas: se listan las que habrian sido rechazadas y por que
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
