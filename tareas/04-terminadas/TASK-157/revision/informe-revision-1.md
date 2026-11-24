# Informe de revision — TASK-157 (ronda 1)

- Commit revisado: 6f3b08b92a9156420817f8523e8c2f835a75bb67
- Revisor: code-quality-reviewer (general-purpose, sonnet)
- Veredicto: aprobada

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | aceptado | taskcode-marketplace/plugins/taskcode-plugin/test/integracion/plugin-instalado.test.ts:23 | implementacion |

### MEN-1 — el test 1 con el claude real ahora cuesta 16-25 s

Reproduccion (Windows nativo, claude.exe real instalado): `node --test dist/test/integracion/plugin-instalado.test.js` sobre 6f3b08b da 5 de 5 en verde en 24.8 s; el test 1 («un plugin inventado nunca sale como instalado») tarda 16.2 s (20.6 s en la verificacion de la peticion). Antes se cortaba a 5 s. Efecto ya declarado en la peticion; el test sigue aseverando lo correcto. Lentitud de la suite sin consecuencia funcional.

Aceptado (coordinador): es justo el comportamiento que pide la tarea (esperar al claude real hasta 30 s); el test solo existe en la capa de integracion, que no entra en test:rapido, y en maquinas sin claude sigue siendo instantaneo.

Verificaciones empiricas (no son hallazgos):

- Preparacion: `git archive 6f3b08b` del paquete `taskcode-plugin` a `%LOCALAPPDATA%\pruebas-claude\taskcode\task-157-r1` (el clon local tardaba mas de 10 min por la carga de la maquina); arbol exacto del commit revisado. `npm install` y `npm run build` sin errores.
- Fichero de tests: 5 de 5 en verde; el test nuevo (doble de 6 s) tarda 7.0 s y da `instalado`.
- Mutante 1 (`TIMEOUT_MS` de vuelta a 5000 en el JS compilado): el test 5 en rojo, los otros 4 verdes. El test nuevo discrimina.
- Cota ante un claude colgado: un `claude.cmd` con `ping -n 41` (~40 s) da `no-verificable` a los 30.1 s. La espera de `plan` sigue acotada.
- `npm run test:rapido`: 696 tests, 695 pass, 0 fail, 1 omitido, 36.3 s. La verificacion de la peticion (`verificar-impacto`, 701 pass) es sobre el commit revisado.
- Portabilidad del doble lento: en Windows, `"%SystemRoot%\System32\PING.EXE"` con ruta absoluta funciona con el PATH solo-`dir` (comprobado). En Linux, `PATH=/usr/bin:/bin sleep N` es correcto por inspeccion, **no verificado** (sin Linux); el caso a mirar en el CI es el test 5 (`instalado` en ~6 s).
- Observacion sin accion: con un `claude.cmd`, el kill por timeout mata `cmd.exe` pero deja vivo el `ping` hijo hasta que termina. Previo al cambio y solo afecta al doble; el `claude.exe` real se lanza directo.
- Comentario de `TIMEOUT_MS` cierto y razonado; diff acotado a la tarea.
- Carpeta de pruebas borrada; worktree original sin tocar.

## Lecturas fuera del contexto permitido

ninguna
