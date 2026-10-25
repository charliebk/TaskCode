# Informe de revision — TASK-064 (ronda 1)

- Commit revisado: 4e6baf67120ec9df036510e707d2df5f05b9da84
- Revisor: code-quality-reviewer (agente general-purpose, modelo sonnet, independiente de la implementacion)
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | abierto | src/core/informe-revision.ts:215-216 (`leerHallazgos`, solo salta `(ej.`) y :528-534 (`resumirHallazgos`) | implementacion |
| IMP-2 | IMPORTANTE | abierto | src/core/informe-revision.ts:528-534 (`porClave.set` sustituye siempre por la ultima ronda) | especificacion |
| MEN-1 | MENOR | abierto | src/core/metricas.ts:699-702 (`sumaDesglose`) | implementacion |
| MEN-2 | MENOR | abierto | src/core/metricas.ts:699-709 y test/commands/metricas-tokens.test.ts | especificacion |
| MEN-3 | MENOR | abierto | src/core/informe-revision.ts:532 (clave `revisor + ID`) | especificacion |
| MEN-4 | MENOR | abierto | src/core/metricas.ts:774-780 y 802-823 (salida sin acotar), README.md:559-570 | plan |
| MEN-5 | MENOR | abierto | src/fs/rondas.ts:837, src/commands/metricas.ts:54 | implementacion |
| MEN-6 | MENOR | abierto | src/core/coste-registro.ts:361-363 y :408, tests | implementacion |
| MEN-7 | MENOR | abierto | src/core/informe-revision.ts:176-230 (tabla de informes antiguos) | implementacion |

Veredicto propuesto por el revisor: cambios-solicitados.

## Puerta y linea base

- Clon temporal en `%LOCALAPPDATA%\pruebas-claude\TaskCode\task-064-r1` (HEAD 7b4c76c = 4e6baf6 + peticion). `npm install` y build correctos; `tsc` sin errores (`npm run lint` = `tsc --noEmit`); `dist/` versionado coincide con la compilacion.
- Suite (`npm test`, una vez): 1386 tests, 1381 pasan, 5 fallan, los conocidos (2 de "contraprueba de descubrimiento" por README_MISSING; symlink EPERM; chmod NTFS; CRLF). Ninguno toca metricas.
- Mutacion sobre los 7 ficheros de test de metricas, informe y coste (67 tests en verde sin mutar): 20 de 22 detectados (clave sin revisor, clave por fichero, ID sin mayusculas, orden de rondas invertido, severidad sin mayusculas, sin tabla como cero, sin informes como cero, desconocida no contada, aviso suprimido, `manual` como repetida, umbral de repetida, nuevos sin escritura de cache, sin desglose recortado a 0, lecturas null a 0, avisos de negativo y total vacio suprimidos, `tareasSinCoste` sin filtro `terminada`, `0` como sin coste, mediana par, orden de `hall_origen`). Sobreviven 2: MEN-6.
- CLI real (`bin/taskctl metricas [--tokens] [--heuristica] [--escribir]`) con repos temporales y en solo lectura sobre OpenGisViewer: `git status --short` identico antes y despues. Exit 0 con avisos; `--escribir` no se bloquea y el bloque de `docs/METRICAS.md` no lleva `tok_nuevos`. CRLF, `Crítico` y `**Menor**` se leen bien.

## Reproduccion de cada hallazgo

### IMP-1 — la fila-marcador «sin hallazgos» cuenta como un hallazgo de severidad desconocida

El filtro solo descarta IDs que empiezan por `(ej.`. Un informe con la fila «sin hallazgos» (`| (ninguno) | — | sin hallazgos | — |`, que revision.md permite) da un hallazgo fantasma en `hall_origen` (`0/0/0/1`) y un aviso de severidad fuera de vocabulario. Repro en repo temporal:

```
[AVISO] TASK-002 revision/informe-revision-1.md: severidad fuera de vocabulario ... en (ninguno) ("—"); no cuenta en crit/imp/men.
| TASK-002 | ... | rondas 1 | crit 0 | imp 0 | men 0 | hall_origen 0/0/0/1 | ...
```

Real en OpenGisViewer: TASK-121 (ronda 2), TASK-133 (ronda 2) y TASK-140 (ronda 1). Correccion sugerida: descartar la fila si el ID es `(ninguno)`, el Estado `sin hallazgos`, o ID y severidad estan en blanco o son «—»; test con ese informe.

### IMP-2 — gana la ultima ronda aunque su severidad u origen no se reconozca

`porClave.set(...)` sustituye el hallazgo entero por el de la ultima ronda; si la ronda 2 relista uno con la severidad anotada o sin Origen, se pierde el dato reconocido de la ronda 1. Repro: ronda 1 `IMP-1 | IMPORTANTE | abierto | plan`; ronda 2 `IMP-1 | IMPORTANTE (ronda 1) | corregido | (vacio)` → `imp = 0` (esperado 1) y `hall_origen = 0/1/0/1`. Real en OpenGisViewer TASK-026 (`informe-revision-2-angular-vue-reviewer.md`: VUE-1 «IMPORTANTE (ronda 1)», VUE-2 «MENOR (ronda 1)»). Origen especificacion: la decision dice «la de la ultima ronda» pero no preve que no se reconozca. Propuesta: ultima ronda con valor reconocido, o aceptar `IMPORTANTE (…)` por prefijo.

### MEN-1 — `tok_sin_desglose` suma fases con signo y el negativo queda enmascarado

Diseno +1000, implementacion 0, revision −270 muestra `730`. El aviso por fase sale, pero la columna no alerta sola. Alternativa: marcar la celda o separar incoherencias.

### MEN-2 — `## Coste` con solo filas `manual` muestra `tok_nuevos`/`tok_cache_lect` en 0, no «—»

Repro: `--tokens 500` y `--tokens 300` en diseno → `tok_nuevos 0 | tok_cache_lect 0 | tok_sin_desglose 800`. Nada se midio; la nota del comando dice que «—» = sin dato. El test de `metricas-tokens.test.ts` fija `'0','0','5000'`. Candidato a `null` cuando ninguna fila tenga desglose.

### MEN-3 — el mismo hallazgo cuenta dos veces si cambia el sufijo del informe

Clave `revisor + ID` con `''` para `informe-revision-N.md`: CRI-1 en `informe-revision-1.md` y otra vez en `informe-revision-2-code-quality-reviewer.md` da `crit = 2`. Consecuencia directa de la decision 1; documentar para TASK-065. En los tres repos las repeticiones entre revisores distintos (59 en OGV, 32 en ToolsaWeb) son legitimas.

### MEN-4 — salida demasiado larga con historia, y README sin actualizar

En OpenGisViewer «Terminadas sin coste en alguna fase: 76 de 76» imprime las 76. El criterio lo pide asi, pero se podria acotar (recuento + N mas recientes). El README (`taskctl metricas`, ~559-570) no menciona las columnas nuevas ni los avisos; el plan lo difiere a TASK-065.

### MEN-5 — duplicacion de la regex de nombres de informe y dependencia entre comandos

`rondaYRevisorDeInforme` (rondas.ts:837) repite `INFORME_REVISION_RE` con un grupo de captura: si cambia el patron, pueden divergir. `commands/metricas.ts` importa `PETICION_REVISION_RE` de `commands/review.js`; mejor en `fs/rondas.ts`.

### MEN-6 — dos mutantes sin test que los detecte

- Sin el `new Set(idsDeFuente(...))`: 67/67 verde (defensa en profundidad que nada ejercita; `registrar-coste` ya deduplica en una llamada).
- `conDesglose` sin exigir `salida !== null`: 67/67 verde; falta un test de fila a medias.

Conviene un test unitario de `resumirCostes` para cada uno.

### MEN-7 — informes antiguos con tablas de otro formato generan avisos de ruido

OpenGisViewer TASK-030 (`informe-revision-2.md`): primera tabla `ID | Revisor | Estado` sin Severidad e IDs con texto; salen cuatro «(vacia)» y se ignora la segunda tabla. Viene de que `leerHallazgos` lee solo la primera tabla (TASK-036/063); los avisos ahora lo hacen visible. Aceptable para informes antiguos.

## Notas sin hallazgo

- Alcance respetado: sin `--repo`, `--evolucion`, `--grupos` ni `--json`. `proyecto`, `tipo`, `criterios` y `kbPeticionPorRonda` van en la fila sin mostrarse, como anuncia el plan.
- `metricas` es solo lectura (salvo `docs/METRICAS.md` con `--escribir`).
- Los tests cambiados de expectativa solo anaden columnas y reubican indices; la unica expectativa de fondo es el `'0','0'` de MEN-2.
- Tests nuevos con repos Git temporales reales (`withRepo`) y CLI real.
- No probado: un `informe-revision-N.md` que sea directorio (EISDIR), no realista.

Carpeta temporal borrada; sin commits ni push; repo original sin tocar.
