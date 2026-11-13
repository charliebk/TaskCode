# Peticion de brainstorm — TASK-126, rol arquitectura (ronda 1)

- Tarea: TASK-126 — Verificacion por tipo de rama: los tests pesados solo en la puerta de release
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-11-13
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
Medido en ToolsaWeb (taskctl metricas, 2026-11-12): la verificacion completa tarda unos 45 min y 29 de ellos son el paso de cargo test con los pesados --ignored; el cierre de TASK-306, con un solo test cambiado, espero 44 min 52 s. Hoy comando_verificacion es uno solo para cualquier finish y para el guardian de merges, sea feature, fix o release. Se busca una verificacion por tipo de rama de Git-Flow: los tests pesados (rendimiento, escala, --ignored) solo se exigen en la puerta de las ramas release/* (y hotfix/* si el proyecto lo declara), y las feature/* y fix/* se cierran con la completa sin pesados. Relacion con TASK-115 (completa por lote): ambas tocan finish-verificacion.ts y el guardian de merges, asi que va despues de ella. Modo rapido: el cierre no exige la suite completa, basta con los tests afectados y npm run test:rapido.
````

### Criterios de aceptacion

````
Una clave nueva comando_verificacion_pesada se ejecuta, ademas de comando_verificacion, solo en el finish y el guardian de merges de ramas release/*; finish de feature/* y fix/* no la ejecuta (test con repo temporal y una rama de cada tipo)
Una clave verificacion_pesada_en lista los tipos de rama que la exigen (release por defecto; hotfix opcional) y un tipo desconocido es error de config (test)
El guardian de merges no deja integrar una release sin una verificacion pesada en verde del commit que entra, y no la pide para feature ni fix (test)
Sin la clave, finish y el guardian se comportan como hoy (test de regresion) y taskctl doctor dice que puerta corre los pesados (test)
README, CHANGELOG y la skill finish explican como separar los pesados del comando de verificacion, con el ejemplo de cargo test --ignored
Los tests afectados y npm run test:rapido pasan sin debilitar ningun test
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
