# Informe de revision — TASK-090 (ronda 1)

- Commit revisado: ea19af99efc36bbd47e79c3245e94d7bd4d66a5e
- Revisor: code-quality-reviewer (agente general-purpose independiente, modelo sonnet)
- Veredicto: PENDIENTE (escribelo con: taskctl veredicto TASK-090 aprobada | aprobada-con-correcciones | cambios-solicitados)

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | aceptado | taskcode-marketplace/plugins/taskcode-plugin/test/empaquetado/sin-literales-secretos.test.ts (escanear/permitido) | implementacion |
| MEN-2 | MENOR | aceptado | taskcode-marketplace/plugins/taskcode-plugin/test/empaquetado/sin-literales-secretos.test.ts (PERMITIDOS_EN_CUALQUIER_FICHERO) | plan |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Sin hallazgos CRITICO ni IMPORTANTE.

### MEN-1: una excepcion vale para cualquier numero de apariciones en su fichero

Reproduccion: `STRIPE_TEST_EJEMPLO` anadido tres veces mas a `TASK-089/planificacion/plan-final.md`:
verde. Coherente con el diseno (fichero+valor, no recuento). Riesgo bajo: son ficheros cerrados en
`04-terminadas` y la excepcion no cubre otro fichero ni otro valor. Cerrarlo del todo pediria
contar apariciones o un hash del fichero.

### MEN-2: `AWS_EJEMPLO` sigue tolerado en cualquier fichero

El motivo («GitHub no lo marco») es observado y no verificable desde el repo; si GitHub cambiara,
reabriria el hueco para ese valor. El plan lo decidio asi con argumento defendible; anotado.

## Evidencia ejecutada

Clon de la rama en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-090-r1`, `npm install`,
`npm run build` sin errores, `node --test dist/test/empaquetado/sin-literales-secretos.test.js`:
4 tests, 4 pasan. La suite completa no se repitio (ya corrida por quien implemento: 2059 tests,
solo los 3 rojos conocidos de Windows).

Mutantes (valores armados en ejecucion; ninguno escrito entero en el repo original):

| # | Mutante | Esperado | Real |
|---|---|---|---|
| 1 | `STRIPE_TEST_EJEMPLO` en un fichero nuevo versionado | rojo | rojo |
| 2 | `SLACK` en un fichero nuevo versionado | rojo | rojo |
| 3 | `SLACK` anadido al plan de TASK-089 (pareja no declarada) | rojo | rojo |
| 4 | `GITHUB_TOKEN` en un fichero historico con excepciones | rojo | rojo |
| 5 | Pareja extra con ruta inexistente | rojo por excepcion muerta | rojo («excepcion historica muerta ... quitala») |
| 6 | Ruta de la pareja del plan de TASK-089 cambiada a una inexistente | rojo | rojo (literal sin amparo y excepcion muerta) |
| 7 | Quitar la pareja peticion de TASK-089 + `SLACK` | rojo | rojo |
| 8 | `STRIPE_TEST_EJEMPLO` movido a `PERMITIDOS_EN_CUALQUIER_FICHERO` | contraprueba en rojo | rojo (test 1 por excepciones muertas y test 2, la contraprueba) |

- Rutas con barras de Windows: razonado, no ejecutado. `git ls-files` da `/` tambien en Windows
  (la corrida base en verde lo confirma); una pareja con `\` no casaria y daria rojo por literal sin
  amparo y por excepcion muerta: falla hacia el lado seguro.
- Contraprueba nueva: cubre Stripe y Slack, exige fichero y linea exactos y que el valor crudo no salga.
- Alcance: solo el test del guardian; las expectativas cambiadas (Stripe y Slack fuera de la
  contraprueba negativa) son correctas.

Carpeta de pruebas borrada tras comprobar que no habia nada que conservar.
