# Informe de revision — TASK-145b (ronda 1)

- Commit revisado: 260cda7a2c942cf6b18382e52469871740926e27
- Revisor: code-quality-reviewer
- Veredicto: aprobada con correcciones

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/commands/approve.ts:70 | implementacion |
| MEN-2 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts:739 | plan |
| MEN-3 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts:789 | plan |
| MEN-4 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish.ts:566 | implementacion |

No hay CRITICOS ni IMPORTANTES.

### Hallazgos

**MEN-1.** El bloque «Acepta el plan en CUALQUIERA de sus dos ubicaciones… Con los DOS a la vez rechaza…» quedo sobre `planQueCuenta`, que no rechaza nada: devuelve `'ambiguo'`. Su primera parte es de `planFinalExisteEn` y la segunda, de `assertPlanNoAmbiguo`. Los demas comentarios movidos si quedaron sobre su funcion.

**MEN-2.** Mutante vivo: el mensaje de conflicto con `ramaIntegracion` en vez de `ramaBaseTarea`. Ningun test comprueba que base nombra el mensaje de un hotfix. El hueco ya existia antes del diff.

**MEN-3.** Mutante vivo: `if (false)` en la comprobacion del tag del script. Ningun test cubre «el script termino bien pero el tag no esta sobre el merge». El hueco ya existia antes del diff.

**MEN-4.** La expresion `tipo === 'hotfix' && mainBranch !== null` sigue repetida en el `ramaDiseno` de la puerta de held-out.

### Verificaciones pedidas

- **La rama eliminada del tag es inalcanzable.** Con merge request aborta antes, y en el reintento `comprobarTagDeReintento` ya lanza el mismo error antes de cambiar de rama. En el camino del script, `tagLoPusoElScript` vale `nombreTag !== null && mainBranch !== null`.
- **`ramaBaseTarea` vale lo mismo en todos los sitios.** Con el mutante `ramaBaseTarea = ramaIntegracion` caen cuatro tests.
- `yaIntegradaEn`, `conAviso`, `conTimeout` y la retirada de `_today` no cambian el comportamiento.

### Reproduccion

Se compilo en un clon. Los tests de finish-tag, finish-reintento, finish-merge, codex-review y approve dan 58 en verde y 1 omitido. La peticion trae la selectiva en verde. Se aplicaron 3 mutantes.

### Correcciones (coordinador)

- **MEN-1, corregido.** «Acepta…» vuelve sobre `planFinalExisteEn`, «Con los DOS a la vez rechaza…» pasa a `assertPlanNoAmbiguo` y sobre `planQueCuenta` queda solo TASK-144c.
- **MEN-4, corregido.** La constante `esHotfixConPrincipal` decide la base y el `ramaDiseno`.
- **MEN-2 y MEN-3, no se corrigen aqui.** Son huecos de test anteriores al diff y necesitan montar un conflicto de hotfix y un script que deje mal el tag. Quedan en menores-pendientes.

## Regla 4D

- Duplicacion: cumple. MEN-4 queda corregido.
- Desviacion: cumple.
- Diluvio: cumple.
- Disfraz: MEN-2 y MEN-3 son asserts que faltaban antes del diff.

## Lecturas fuera del contexto permitido

- finish-heldout.test.ts y finish-parcial.test.ts (solo ejecutados), y finish.ts 480-530 y 640-810.
