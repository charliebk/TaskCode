# Peticion de brainstorm — TASK-095, rol arquitectura (ronda 1)

- Tarea: TASK-095 — Revision que converge: desde la ronda 2 solo se verifican las correcciones
- Tipo: feature · Complejidad declarada: alta
- Ronda: 1
- Fecha: 2026-11-10
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
Objetivo principal: aumentar la agilidad sin perder calidad. Que la revision por pares converja en vez de reabrirse en cada ronda, conservando todos los revisores que tiene hoy. Medido el 2026-11-10 (docs/auditoria/INVENTARIO-AGILIDAD-2026-11-10.md): en ToolsaWeb las rondas medias pasan de 2,3 (0.8) a 3,8 (0.12), el tramo revision-cierre de 56 a 97 min y los tokens de revision por ronda de 2,6 a 6,4 M; los hallazgos por ronda no bajan (11, 17, 16; 13, 19, 19, 14, 17; un ADR con 14 rondas de unos 11 cada una). La causa esta en la regla de TASK-083 (0.12): un solo IMPORTANTE de cualquier revisor hace la ronda siguiente completa desde la base con todos los revisores, que encuentran otra tanda; la acotada salto en 1 de 42 rondas en OpenDockTrading. Las rondas tardias apenas aportan calidad nueva (2 CRITICOS nuevos en unas 77 rondas 3.a o posteriores), mientras que los revisores de dominio si aportan calidad propia (63 de 88 CRITICO/IMPORTANTE en ficheros que el generico no marco): se mantienen. Esta tarea corrige la regla de alcance de TASK-083; no anade otro mecanismo encima ni retira revisores.
````

### Criterios de aceptacion

````
Desde la ronda 2, la peticion de taskctl review lleva siempre 'Alcance: verificacion acotada' (aunque la ronda anterior tenga CRITICO o IMPORTANTE) y su diff va desde el ultimo commit revisado; tests en test/commands que lo comprueban con IMPORTANTE abierto, con CRITICO abierto y con merges entre rondas
La peticion acotada indica al revisor que verifique cada hallazgo abierto y el diff de la correccion, y que solo abra un hallazgo nuevo si es CRITICO o lo introduce la propia correccion; test que comprueba ese texto en la peticion de la ronda 2
En la ronda acotada, cada revisor de dominio que dejo hallazgos abiertos recibe su propia peticion para verificarlos (no los verifica el generico en su lugar); test con un diff de Rust y un IMPORTANTE de rust-wasm-reviewer abierto
Tras la ronda 3 con hallazgos abiertos, taskctl siguiente devuelve accion preguntar en cualquier modo, y lo abierto se acepta documentado en Resultado o pasa a una tarea nueva; test de integracion en un repo temporal
taskctl review --completa sigue forzando una ronda completa desde la base (test de regresion)
El codigo de la regla antigua de alcance que deje de usarse se borra, y sus tests cambian de expectativa con el motivo escrito en Resultado; ningun test se borra sin sustituto
skills/review, skills/task-workflow, README y CHANGELOG describen la regla nueva y el principio de coste proporcional a la correccion
La suite completa de TaskCode pasa en verde (npm test) sin debilitar ningun test
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
- Trabajan en paralelo contigo, sin verte: **riesgos**, **testing**. No cubras lo suyo — si lo haces, el unificador recibira el mismo punto de vista repetido y lo leera como confirmacion.
