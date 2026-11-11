# Peticion de brainstorm — TASK-096, rol riesgos (ronda 1)

- Tarea: TASK-096 — Verificacion proporcional B: con codigo parcial se verifica solo lo afectado
- Tipo: feature · Complejidad declarada: alta
- Ronda: 1
- Fecha: 2026-11-11
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
Troceada el 2026-11-10 (decision de Carlos): la parte A, una tarea de solo documentacion no corre la suite de tests, es TASK-100. Esta tarea queda con la parte B (nivel 2: con codigo parcial, verificar solo lo afectado) y no se empieza hasta que TASK-100 lleve un tiempo en uso y se mida cuanto queda por ganar. El enunciado original sigue debajo como contexto.

Objetivo principal: aumentar la agilidad sin perder calidad. Que el coste de verificar crezca con lo que la tarea cambia, no con el tamano del proyecto: los tests son necesarios, pero no en todos los momentos ni en todas las tareas. A medida que un proyecto crece, crecen sus tests, y hoy se pagan enteros aunque la tarea no los toque. Medido el 2026-11-10 (docs/auditoria/INVENTARIO-AGILIDAD-2026-11-10.md): finish exige la completa en toda tarea (en ToolsaWeb unos 28 min, 18 de cargo test, tambien en tareas de solo documentacion); el freno Stop verifica al final de cada turno; 5 de las 7 tareas de ToolsaWeb en 0.11 eran estudios sin codigo, y las 10 de OpenDockTrading son documentos con un script de comprobacion. Tres niveles segun el diff de la tarea frente a la base, en los tres momentos (fin de turno, ronda de revision y finish): (1) solo documentacion: no se corre la suite de tests, solo las comprobaciones de documentacion si el proyecto las tiene; (2) una parte del codigo: los tests de lo afectado; (3) codigo transversal o sin clasificar: la suite completa. Se conserva la garantia de la 0.8/0.9 de no integrar nada roto: lo que no se pueda clasificar con seguridad va a la completa. El proyecto ya sabe clasificar su diff (la selectiva de ToolsaWeb lo hace); TaskCode no deberia duplicar ese conocimiento. La forma concreta (que el comando del proyecto decida que correr a partir del diff, o que TaskCode distinga rutas) se decide en el plan, revisando de forma explicita la decision de TASK-091 de exigir la completa antes de integrar. No se retira ningun freno: se ajusta su coste.
````

### Criterios de aceptacion

````
En un repo temporal cuya tarea cambia una parte del codigo que el proyecto clasifica, finish ejecuta solo la verificacion de lo afectado y lo dice en su salida; con codigo transversal o sin clasificar ejecuta la completa (un test por caso)
El freno Stop y taskctl review aplican el mismo nivel al mismo diff: un turno o una ronda que solo tocan documentacion no corren la suite de tests (test por cada uno)
El guardian de merges aplica la misma decision que finish para el mismo diff: no bloquea el merge de una tarea sin codigo con verde de su verificacion y si bloquea el de una con codigo sin verde de la completa; un test por caso
Un proyecto sin la configuracion nueva se comporta exactamente como en 0.13 (test de regresion de finish y del guardian)
El plan deja escrita la decision sobre TASK-091 y lo que se retira; el codigo que quede sin uso se borra y los tests que cambian de expectativa llevan su motivo en Resultado
skills/task-workflow (verificacion-selectiva.md), README y CHANGELOG explican el principio de coste proporcional al cambio y como lo declara un proyecto
La suite completa de TaskCode pasa en verde (npm test) sin debilitar ningun test
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
