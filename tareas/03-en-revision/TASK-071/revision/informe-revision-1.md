# Informe de revision — TASK-071 (ronda 1)

- Commit revisado: 0d3db851465d9dc230ba15139e7ce1667ddc4f57
- Revisor: code-quality-reviewer (agente general-purpose, modelo sonnet)
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | abierto | test/hooks/freno-stop.test.ts (test de memo) | implementacion |
| IMP-2 | IMPORTANTE | abierto | src/hooks/freno-stop.ts (cota del timeout) | implementacion |
| MEN-1 | MENOR | abierto | src/fs/verificacion.ts (bytesTotales en `cortada`) | implementacion |
| MEN-2 | MENOR | abierto | src/hooks/freno-stop.ts (tareas ilegibles) | implementacion |
| MEN-3 | MENOR | abierto | CHANGELOG.md («sin credenciales») | plan |
| MEN-4 | MENOR | abierto | README.md (ignorados no invalidan el memo) | implementacion |
| MEN-5 | MENOR | abierto | src/core/informe-verificacion.ts (`codigo null` en `roja`) | implementacion |
| MEN-6 | MENOR | abierto | CHANGELOG.md («sin cambio de comportamiento») | implementacion |
| MEN-7 | MENOR | abierto | test/hooks/freno-stop.test.ts (UTF-8, version del memo, aviso de arbol) | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

El revisor propuso `aprobada-con-correcciones`; con IMPORTANTE abiertos la regla del metodo
es `cambios-solicitados`, y en modo automatico el codigo que se mergea tiene que ser el revisado.

### Lo reproducido

- Clon limpio en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-071-r1`; `npm install && npm run build`
  deja `dist/src` igual a lo versionado (solo cambia `package-lock.json`, por `npm install`).
- `freno-stop.test.js` 12/12; sincronizacion 25/25 (ciclo 5, revision 7, scripts 4, config 9).
  Suite completa no relanzada.
- Smoke del punto de entrada por stdin: rojo → 2 con el informe; mismo arbol no reejecuta; cambio
  si; `stop_hook_active` e interruptor → 0 sin ejecutar; HEAD desacoplado y sin config → 0; config
  invalida → 2; clave desconocida avisa y ejecuta; `cwd` en subdirectorio resuelve la raiz;
  `timeout_verificacion: 99999` se recorta a 3540 y avisa; stdin vacio, no JSON, `[]`, `{"cwd":5}`
  o `cwd` inexistente → 0 sin escribir. Nunca exit 1.
- Timeout con nieto vivo (node que lanza node de 120 s, tope 3 s): corta en 3,6 s, exit 2, sin la
  marca interna y sin huerfanos (`Get-CimInstance`).
- Textos instalados: ninguno nombra el producto.

### Mutantes (sobre `dist/src`, con `freno-stop.test.js`)

Muertos: sin `stop_hook_active`, sin interruptor, sin `ramas.has(rama)`, bloqueo con exit 1 (6
rojos), sin strip ANSI, sin `ocultarCredenciales`, ruta del memo rota. Sobreviven: sin
`Math.min(..., techo)`, `MARGEN_HOOK_S = 0`, huella sin contenido de los sucios, huella sin
`comando`/`timeoutS` (equivalentes en la practica), sin comprobacion de `version` del memo, sin el
salto de continuacion UTF-8, sin el aviso de arbol cambiado, `codigo: 2` → `0` en el catch generico.

### IMP-1

Ningun test se pone rojo si la huella pierde el contenido de los ficheros sucios: el test de memo
solo invalida anadiendo un fichero nuevo. Mutante `h.update(ruta)` → `# fail 0`. El codigo real si
lo hace bien (reescribir un no trackeado provoca otra ejecucion). Propuesta: editar un fichero que
ya estaba sucio, misma ruta y distinto contenido, y asertar que `ejecuciones()` sube.

### IMP-2

La cota `min(timeout_verificacion, 3540)` no tiene test que la discrimine: el de «por encima del
tope» solo mira el aviso. Es lo que evita que Claude Code descarte el informe al agotar los 3600 s
(fallo abierto). Mutantes sin `Math.min` y con `MARGEN_HOOK_S = 0` → `# fail 0`. Propuesta: funcion
pura `timeoutEfectivoS` probada con 99999, 3540 y 600.

### MEN-1

Una verificacion cortada con salida no vacia se rotula «truncada: N bytes en total» sin truncar:
`bytesTotales` incluye los bytes de la marca de timeout que ya se quitaron de la cola.

### MEN-2

Una tarea en `02-en-curso` con `tarea.md` ilegible apaga el freno en silencio (`ilegibles` se
ignoran). Propuesta: avisar por stderr con exit 0, o documentarlo.

### MEN-3

`ocultarCredenciales` solo limpia credenciales en URLs; el README lo dice asi, pero el CHANGELOG
dice «sin ANSI ni credenciales» a secas. Alinear el CHANGELOG.

### MEN-4

La huella no cubre ficheros ignorados por `.gitignore`: un rojo memorizado no se reintenta si solo
cambia un ignorado. Documentarlo en el README.

### MEN-5

Muerte por senal (`status === null`) da `roja` con `codigo: null` y el informe dice «salio con
codigo null». Casi inalcanzable (el envoltorio convierte senales en exit 1). Usar `r.error`.

### MEN-6

La extraccion anade `removeAllListeners('data')` al cortar: inocuo, pero el CHANGELOG dice «sin
cambio de comportamiento». Matizarlo.

### MEN-7

Huecos de test confirmados por mutacion: salto de continuacion UTF-8 de `recortarCola`, version del
memo, aviso de arbol cambiado.

### Limitaciones de la revision

Solo Windows (sin camino POSIX `detached`/`kill(-pid)` ni `readFileSync(0)` con tuberia en Linux);
sin suite completa. Carpeta de pruebas borrada.
