# Informe de revision — TASK-145a (ronda 1)

- Commit revisado: 4df4a98d2c7f0aba0de97109a02141d487caf113
- Revisor: code-quality-reviewer
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts:254 | implementacion |
| MEN-1 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts:185 | implementacion |
| MEN-2 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/src/commands/finish-verificacion.ts:267 | implementacion |

### Reproduccion

**IMP-1.** Nada comprueba que `anotarSuite` corra solo en la completa (`ejecutarPuerta`, linea 254). El mutante que la ejecuta siempre deja en verde verificacion-tres-puertas y finish-documentacion. Si eso pasara, la pesada y la puerta de documentacion falsearian el aviso de crecimiento de la suite (TASK-129). El plan pedia expresamente que solo la anotara la completa.

**MEN-1.** Con `errorArbolSucio`, el mensaje de la pesada dice «los tests pesados salio en verde», sin concordancia.

**MEN-2.** El literal «No se ha mergeado nada.» sigue en `finish-verificacion.ts`, en tres sitios: el valor por defecto de `errorArbolSucio` (linea 267) y las lineas 391 y 423. Fuera de alcance, `verificar-lote.ts:63` conserva un `spawnSync('git')` propio. No bloquea.

**Comprobaciones sin hallazgo:**
- El memo se guarda con el tipo correcto: el mutante sin tipo cae en rojo.
- El orden de los pasos se conserva.
- La precedencia nueva de `opcionesEjecucion` no cambia ningun caso.
- doctor, ahora sobre `gitCrudo`, mantiene el entorno, el stdin cerrado y el timeout.
- `gitLinea` conserva la semantica en held-out y en el reintento.
- `cerrarIgualmente` da exactamente el texto anterior.
- Solo queda una copia de la regex de `[ERROR]`.

**Tests.** Pasan 131 tests de finish, doctor y git-crudo-comun (131/131). La peticion trae la selectiva en verde (789/789).

### Correcciones (coordinador)

- **IMP-1:** la release de verificacion-pesada exige una sola linea `suite`, y el cierre solo de documentacion exige ninguna. Con el mutante `if (true) anotarSuite`, los dos tests caen en rojo.
- **MEN-1:** `errorArbolSucio` recibe el sujeto con sus verbos, para que cada puerta concuerde: «los tests pesados salieron en verde, pero han dejado», «la verificacion salio en verde, pero ha dejado».
- **MEN-2:**
  - El valor por defecto y la linea 423 usan `CIERRE_SIN_MERGE`.
  - La linea 391 es otra frase («No se ha mergeado nada; solo se ha commiteado...») y se queda como esta.
  - `verificar-lote` queda fuera de alcance.

## Regla 4D

- Duplicacion: cumple. MEN-2 queda corregido.
- Desviacion: cumple.
- Diluvio: cumple.
- Disfraz: IMP-1, corregido con test.

## Lecturas fuera del contexto permitido

- fs/verificacion.ts, verificar-lote.ts, start.ts (grep) y los tests de commands (grep de mensajes).
