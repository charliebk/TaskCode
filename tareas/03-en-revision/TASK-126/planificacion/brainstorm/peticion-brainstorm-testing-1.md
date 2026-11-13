# Peticion de brainstorm — TASK-126, rol testing (ronda 1)

- Tarea: TASK-126 — Verificacion por tipo de rama: los tests pesados solo en la puerta de release
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-11-13
- Rol: `brainstorm-testing` — lanzalo con el agente de ese mismo nombre
- Vuelca tu respuesta en: `salida-brainstorm-testing-1.md`

## Tu pregunta

> ¿Como se demuestra que esto funciona, y como envejece?

## Que miras

- Que es observable desde fuera, y contra que recurso real se comprueba.
- Para cada prueba propuesta, LA MUTACION DEL CODIGO FUENTE QUE LA PONDRIA ROJA. Si no sabes decirla, esa prueba no vale.
- Que pruebas ya existentes cambian de expectativa y cuales siguen valiendo de red de regresion.
- Como envejece: que se rompe dentro de seis meses cuando alguien extienda esto.

## Que NO miras

No es una lista de cortesia. Si la ignoras y lo cubres todo "por si acaso", el acotado de contexto se deshace sin que se note y esta tarea deja de tener varios puntos de vista:

- Donde encaja el cambio (es del rol de arquitectura).
- Por donde se rompe en produccion (es del rol de riesgos).
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

Escribe en `salida-brainstorm-testing-1.md`, con estas secciones y en este orden:

- Que es observable sin llamar a ningun agente
- Plan de pruebas, cada una con su mutacion
- Aserciones trampa que hay que evitar en esta tarea concreta
- Que pruebas existentes cambian de expectativa
- Como envejece

## Reglas

- **Propones enfoque; no implementas.** No escribas codigo de produccion ni modifiques ficheros del repo: tu salida es un documento.
- Evidencia, no suposicion: si afirmas que algo se comporta de cierta manera, es porque lo has mirado. Di de donde lo sacas.
- Prefiere lo concreto: rutas, nombres y casos reales por encima de recomendaciones genericas.
- Trabajan en paralelo contigo, sin verte: **arquitectura**, **riesgos**. No cubras lo suyo — si lo haces, el unificador recibira el mismo punto de vista repetido y lo leera como confirmacion.
