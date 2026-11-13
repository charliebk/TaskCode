# Informe de revision — TASK-126 (ronda 2)

- Commit revisado: 78d61018752f8c76618ffcdc94add5734fb542b2
- Revisor: code-quality-reviewer
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts | implementacion |
| MEN-1 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/test/commands/verificacion-pesada.test.ts | implementacion |
| IMP-2 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

### IMP-1 — corregido

La llamada a `puertaPesada` en el camino idempotente de `finish` (`src/commands/finish.ts`, tras
`puertaReintento`) existe y el test de IMP-1 la ejerce: con los pesados en rojo, `finish` ya no cierra la
release integrada a mano. Mutante M1 (ver Verificacion): el test se pone rojo.

### MEN-1 — corregido

El test del guardian con hotfix (`verificacion-pesada.test.ts`, "guardian (TASK-126, MEN-1)") cubre los dos
casos: sin lista no exige pesados, con `verificacion_pesada_en: [release, hotfix]` exige el 2 y el mensaje.
Mutante M2 (el guardian deja de reconocer `hotfix/`): el test se pone rojo.

### IMP-2 — el mensaje de los pesados en rojo miente en el camino idempotente (abierto)

`puertaPesada` (`src/commands/finish-verificacion.ts`, lineas 168-172) usa un unico mensaje para dos
situaciones. En el camino normal es cierto: el merge no se ha hecho. En el camino idempotente, que es
justo el que IMP-1 añade, el merge YA esta consumado (la persona lo hizo a mano en la principal y en
la de integracion). El mensaje sigue diciendo "no se mergea" y "no se ha tocado nada", y el unico remedio
que ofrece es `--sin-verificacion`. Quien lee eso cree que la principal no tiene la release y no sabe que
hay que corregir hacia delante. La correccion del diff abre el fallo: antes de 78d6101 este camino no
mostraba ningun aviso de pesados.

Lo que el codigo hace es correcto: no cierra la tarea, deja el memo de `pesada` en rojo para el guardian
y devuelve a la rama de partida. Solo el texto es falso en ese caso. Correccion esperada: que el mensaje
del camino idempotente diga que el merge ya esta en la principal y en la rama de integracion, y que se
arregla hacia delante en la rama de integracion (o se cierra con `--sin-verificacion`). El camino normal
debe conservar el texto actual.

Comprobado y sin hallazgo: en el reintento, `puertaReintento` devuelve `que: 'selectiva'` o
`'documentacion'` cuando corresponde, y la condicion `que === 'completa'` coincide con la puerta normal
(`puerta()` solo llama a `puertaPesada` cuando `r.resultado.tipo === 'verde'`, y la selectiva o la
documentacion no devuelven `verde`). Con `--sin-verificacion` el reintento devuelve `omitida` y los
pesados no corren, como se espera.

## Verificacion hecha

- Clon limpio de la rama en `C:\Users\nullcad2025\AppData\Local\pruebas-claude\taskcode\task-126-r2`
  (HEAD `b76e852`; respecto a `78d6101` solo cambian ficheros de `tareas/`, el codigo es identico).
  `npm install` y `npm run build` sin errores.
- `node --test dist/test/commands/verificacion-pesada.test.js dist/test/commands/finish-verificacion.test.js`:
  20 de 20 en verde.
- Suite completa: no se repitio. La peticion trae la verificacion selectiva (`verificar-impacto`) sobre
  `78d6101`, con 959 tests, 0 fallos y salida 0; vale para esta revision.
- Mutantes sobre `dist/` (cada uno restaurado despues):
  - M1: en `dist/src/commands/finish.js` se anula la llamada a `puertaPesada` del camino idempotente:
    rojo (`not ok 19`, IMP-1), 19 de 20.
  - M2: en `dist/src/hooks/guardia-merge.js` el guardian deja de reconocer `hotfix/`
    (`const tipo = integ.release ? 'release' : null;`): rojo (`not ok 20`, MEN-1), 19 de 20.
- Sonda: copia del test de IMP-1 que imprime el mensaje de error (solo en el clon, borrada despues).

## Reproduccion

IMP-2: en el clon, el test de IMP-1 con el mensaje impreso devuelve:

```
[ERROR] TASK-850: no se mergea con los tests pesados en rojo (comando_verificacion_pesada, que exigen las ramas release). La completa salio en verde; no se ha tocado nada.
```

El escenario es: release integrada a mano en `main` y en `develop`, `comando_verificacion_pesada` en
`ko`, `runFinishCommand`. La release ya esta en `main` cuando sale el error.

IMP-1 y MEN-1: los mutantes M1 y M2 de la seccion Verificacion, con el test fallando como se indica.

## Notas (fuera de la tabla)

- El test nuevo de IMP-1 solo cubre el desenlace `ko` de los pesados. El camino idempotente con los
  pesados en verde (y el cierre posterior) no tiene test propio. No lo he reproducido como fallo.

## Lecturas fuera del contexto permitido

- `taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts` (`puertaPesada`,
  `puertaReintento` y `puertaVerificacion`): para ver el mensaje de IMP-2 y el retorno de cada via de la puerta.
- `taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts` (`TIPOS_RAMA_PESADA`): para confirmar
  que los tipos de `verificacion_pesada_en` son `release` y `hotfix`.
- `taskcode-marketplace/plugins/taskcode-plugin/dist/src/hooks/guardia-merge.js` (linea 259): solo para
  localizar la linea del mutante M2.
- `tareas/03-en-revision/TASK-126/revision/informe-revision-1.md`: para comparar con la ronda anterior.
