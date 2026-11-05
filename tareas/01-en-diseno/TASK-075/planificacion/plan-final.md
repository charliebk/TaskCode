# Plan — TASK-075: Contrapruebas de descubrimiento rotas por el validador de Claude Code 2.1.316+

(Es la respuesta del unico rol de brainstorm, arquitectura,
volcada aqui por quien orquesta.
Con un solo rol no hay unificador ni desacuerdos que resolver; en su lugar,
el plan senala lo que ese rol no cubrio.)

## Enfoque propuesto

Evidencia (Claude Code 2.1.318, recogida por el orquestador): con la copia intacta sin README el validador sale 0 y termina `✔ Validation passed`, pero el bloque nuevo «Plugin directory checks» imprime `✘ ... README_MISSING`; con la mutacion de los tests (comilla sin cerrar en `description`) sale 1, el error va ANTES del bloque y termina `✘ Validation failed`. Existen `--json` (mismos codigos), `--strict` y `--profile directory`.

La busqueda de `✘` en toda la salida se sustituye por una condicion en tres partes que solo mira el resultado de la validacion, nunca el bloque del directorio:
1. `status === 0`;
2. la ultima linea no vacia contiene `Validation passed`;
3. no hay `✘` en el tramo **anterior** a la linea `Plugin directory checks` (si no aparece, versiones anteriores a 2.1.316, se mira toda la salida).

Se queda la salida de texto y se descarta `--json`: las contrapruebas ya comprueban el nombre del fichero roto sobre el texto (`Validating agent:` / `Validating skill:`), que en 2.1.318 sigue igual; con `--json` habria que reescribirlas contra `contents[].file` y no se sabe desde que version existe. `--json` queda documentado en HALLAZGOS como alternativa.

Piezas:
- Nuevo `test/helpers/validador-claude.ts` (hoy `validar()` y `claudeDisponible()` estan copiados en `task-workflow.test.ts`, `brainstorm-roles.test.ts` y `revisores.test.ts`): `validarPlugin(ruta)`, `claudeDisponible()` y `validacionLimpia(r): { ok, motivo }` (pura, la condicion de arriba).
- Tests 14 y 17: en el paso (a) la comprobacion de la cruz pasa a `validacionLimpia`; el paso (b) no cambia (exit ≠ 0, `Validating skill:`/`Validating agent:` y el nombre del fichero), asi la contraprueba sigue nombrando el fichero roto. La comprobacion del 17 de que la copia intacta no nombra agentes se mantiene.
- Tests 13 y 16 (gemelos sobre el plugin real): hoy pasan (el plugin real tiene README; el icono es solo `⚠`), pero hacen la misma comprobacion de la cruz y se romperian igual si el directorio añade otro error: pasan a `validacionLimpia`.

Orden: helper + test unitario; tests 13/14 y 16/17 usandolo (borrando sus copias de `validar`/`claudeDisponible`/`CRUZ`); entrada en `docs/contexto/HALLAZGOS.md` junto a «`claude plugin validate` comprueba mucho menos de lo que parece» (bloque del directorio desde 2.1.316 con `✘` aunque pase; la regla: codigo de salida y linea de resultado, nunca la cruz en toda la salida; `--json` separa `directory.findings` de `manifest.errors`/`contents[].errors`; `--profile directory`); suite completa.

## Lo que el rol no cubrio

- Riesgos y modos de fallo (sin rol de riesgos): solo se fija que la condicion falla en rojo, no en verde, si cambia el texto (sin linea de resultado, `ok` es false; sin marcador del bloque, se analiza toda la salida, mas estricto).
- Estrategia de pruebas detallada (sin rol de testing): la de abajo es minima.
- Criterio 1 en el CI de Linux: alli `claude` no esta y estos tests se saltan de forma visible; solo el test unitario del helper corre de verdad en CI.

## Riesgos aceptados y que los contiene

- La condicion depende de los literales en ingles `Validation passed` y `Plugin directory checks`: ante un texto desconocido da rojo; el test unitario fija los literales.
- Sin verificar que versiones anteriores a 2.1.316 terminen en `Validation passed`: si no, rojo, no falso verde.
- Una version futura con exit 0 y errores reales: lo contiene el tercer punto.

## Plan de pruebas

- Test unitario de `validacionLimpia`, sin `claude` (corre en CI), con textos fijos sacados de las salidas reales (sin rutas de la maquina): exit 0 con `✘` del directorio → ok; exit 1 con error YAML → no ok; sin bloque y sin `✘` → ok; sin linea de resultado → no ok; exit 0 con `✘` antes del bloque → no ok.
- Integracion con `claude` 2.1.316+ en Windows: 13, 14, 16 y 17 en verde; el 14 y el 17 con su mutacion siguen exigiendo exit ≠ 0 y el nombre del fichero (criterio 2).
- `npm test` completo: solo los 3 rojos conocidos de Windows (mas `EBUSY` de teardown si aparecen).

## Lo que necesita decision de una persona

Decisiones de Carlos (2026-11-05):
- **Condicion por texto** (codigo de salida + linea de resultado + sin `✘` antes del bloque del directorio), no `--json`.
- **Alcance: tests 13, 14, 16 y 17** pasan al helper; `revisores.test.ts` (test 12, no roto) queda fuera.
- Plan aprobado por Carlos.
