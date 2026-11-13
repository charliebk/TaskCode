# Plan — TASK-129: Freno al crecimiento de la suite: presupuesto de tests por criterio, pesados marcados y aviso de crecimiento

(Modo rapido: el plan lo redacta el coordinador sin lanzar los roles de
brainstorm ni el unificador. Decision de Carlos del 2026-11-12.)

## Enfoque propuesto

Duracion estimada: 85 min (de la rama abierta al cierre con merge; senales: 5 ficheros de codigo, 3 de tests, 4 skills, docs y CHANGELOG, 5 criterios)

No se trocea: decision de Carlos del 2026-11-13.

1. **Presupuesto de tests por criterio.**
   - Plantilla de `plan-final.md` (`commands/plan.ts`): bajo `## Plan de
     pruebas`, la linea «Tests nuevos por criterio (presupuesto 1 a 3; si se
     pasa, el motivo):». Solo se anade una linea, como TASK-097 (el detector de
     esqueleto compara por lineas).
   - Skill `plan`: por cada criterio, cuantos tests nuevos y el motivo si pasa
     de 3. Skill `review`: un test que duplica a otro ya existente es MENOR.
2. **Tests pesados marcados.** Anexo nuevo `skills/task-workflow/tests-pesados.md`
   (con su tope en `tamanos.test.ts`): como marcar un test de rendimiento o
   escala como pesado en Node (`node --test` sobre un directorio o glob aparte),
   Rust (`#[ignore]` y `cargo test -- --ignored`), Java (tag/categoria de JUnit
   excluida) y .NET (`[Trait]` y filtro), y que solo corre con
   `comando_verificacion_pesada`. La skill `plan` y el SKILL.md de task-workflow
   lo enlazan.
3. **Numero de tests de la completa.** `core/conteo-tests.ts` (puro): el
   numero de tests de la salida de la completa para los runners comunes
   (node --test «ℹ tests N»/«# tests N», cargo «test result: … N passed; M
   failed», Jest «Tests: … N total», Maven/Gradle «Tests run: N», dotnet
   «Total tests: N», pytest «N passed, M failed in»); null si no se reconoce.
   `finish` (completa) y `verificar-lote` anotan una linea `suite` en el
   registro de puertas: modo = numero de tests (o `-`), duracion = la de la
   completa, resultado.
4. **Metricas por version.** `metricas --por-version` anade a la tabla
   general dos columnas: `tests` (el mayor numero visto en las tareas de esa
   version) y `completa` (mediana de la duracion de la completa en verde); `—`
   sin dato.
5. **Aviso de crecimiento en doctor.** Clave `umbral_crecimiento_suite`
   (porcentaje entero, 20 por defecto). `doctor` calcula lo mismo por version
   (tareas terminadas + registro de puertas) y, entre las dos ultimas versiones
   con dato, avisa si los tests o la duracion de la completa crecieron mas que
   el umbral. Sin datos (o con una sola version), `ok`/nada: ni avisa ni falla.
6. CHANGELOG y docs/configuracion.md (la clave) y docs/comandos.md (columnas).

## Lo que el rol no cubrio

No se lanzaron roles.

## Riesgos aceptados y que los contiene

- El numero de tests sale de la salida del runner: un formato no reconocido
  da `—` (sin dato), nunca un numero inventado.
- El registro es por worktree (como el resto de puertas).

## Plan de pruebas

Tests nuevos por criterio (presupuesto 1 a 3; si se pasa, el motivo):
- Criterio 1: 2 (plantilla con la linea; skills plan y review con el texto).
- Criterio 2: 1 (el anexo explica los cuatro lenguajes y la clave).
- Criterio 3: 3 (`contarTests` por runner; metricas por version con dato y
  `—`; doctor avisa por encima del umbral en repo temporal).
- Criterio 4: 1 (sin datos ni una sola version, ni aviso ni fallo).
- `verificar-impacto` y `test:rapido`.

## Lo que necesita decision de una persona

Nada.
