# Informe de revision — TASK-136 (ronda 1)

- Commit revisado: c28556de1354dddae973ac191a1e5148947d7b6a
- Revisor: general-purpose (sonnet) + code-quality-reviewer
- Veredicto: aprobada con correcciones

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | corregido (4c3199e) | scripts/verificar-impacto.mjs:164-177 (`tomarCerrojo`, rama de cerrojo muerto o ilegible) | implementacion |
| MEN-2 | MENOR | corregido (4c3199e) | scripts/verificar-impacto.mjs:~548-558 (`devolver`) y test/scripts/verificar-impacto.test.ts | plan |

### MEN-1 — Carrera al tomar un cerrojo muerto

`tomarCerrojo` lee el pid muerto, comprueba `procesoVivo`, avisa y hace `rmSync(cerrojo)` por ruta, no por contenido. Con un cerrojo muerto y dos ejecuciones a la vez: A lee el pid muerto; B lee el mismo, borra y crea el suyo con `wx`; A borra el cerrojo nuevo de B y crea el suyo. Las dos creen tenerlo (el escenario original). Requiere ejecucion cortada previa mas solape exacto; la barrera de `devolver` evita perder `dist/src` entero. Intentado con un cerrojo muerto y 4 ejecuciones simultaneas, 9 rondas: siempre codigo 0, arbol limpio, sin cerrojo restante. Sale de leer el codigo, no verificado empiricamente. Arreglo posible: retirar el cerrojo muerto de forma atomica (rename a nombre unico) o aceptar el riesgo.

### MEN-2 — La barrera de `devolver` (criterio 3) no tiene test que se ponga rojo

Sustituir su condicion por `if (false)` deja los 18 tests en verde. C1 no la cubre desde que existe el cerrojo. Anular `tomarCerrojo` si pone rojos los tres tests nuevos (15 pass, 3 fail). Arreglo posible: un build que borre `<copia>/src` y comprobar el aviso y que `dist/src` sobrevive, o exportar `devolver` y probarla.

## Casos comprobados sin hallazgo

- Ejecucion que muere con el cerrojo tomado (build de 6 s, `taskkill /F /T` a los 2,5 s): la siguiente avisa del cerrojo muerto y de la copia huerfana, restaura, sale con 0, arbol limpio, cerrojo borrado.
- Cerrojo vacio (a medio escribir): un reintento, lo toma con aviso, sale con 0, arbol limpio.
- Cerrojo de otro pid vivo: `soltarCerrojo` no lo borra (test 3 y lectura).
- Excepcion entre tomar el cerrojo y el `try` principal: el `catch` lo suelta y relanza.
- Espera agotada (`return 1`): no toca `dist/src` (test 3).

## Que ejecute y resultado

- Verificacion selectiva ya en verde en la peticion (653 pass, 0 fail); sin suite completa.
- Clon en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-136-r1`, checkout del commit, `npm install`, `npm run build`.
- `node --test dist/test/scripts/verificar-impacto.test.js`: 18 pass, 0 fail (105 s).
- Mutaciones: barrera de `devolver` anulada, 18 pass (MEN-2); `tomarCerrojo` anulado, 15 pass y 3 fail.
- A mano sobre repos propios: cerrojo muerto con 4 ejecuciones simultaneas (9 rondas), taskkill y cerrojo vacio.

Limpieza: borrados el clon y sus tres cerrojos de `%TEMP%`; nada en el repo real ni en `C:\`.

## Lecturas fuera del contexto permitido

ninguna
