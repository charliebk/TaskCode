# Informe de revision — TASK-055 (ronda 1)

- Commit revisado: 0da1627c54d66ba2720d8ba69be1021f59754b73
- Revisor: agente general-purpose independiente con la skill code-quality-reviewer
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero |
|---|---|---|---|
| CRIT-1 | CRITICO | abierto | bin/taskctl.cmd:5 y README.md («Usar `taskctl` fuera de Claude Code») |
| MEN-1 | MENOR | abierto | test/empaquetado/distribucion.test.ts (argumentos) |
| MEN-2 | MENOR | abierto | bin/taskctl.cmd:5 |
| MEN-3 | MENOR | abierto (se propone aceptar) | bin/taskctl.cmd:5 |
| MEN-4 | MENOR | abierto (se propone aceptar) | README.md (funcion de perfil de PowerShell) |

### Puerta determinista

Clon nuevo, `npm install && npm test` una vez: 983 tests, 980 verdes; los 3
rojos conocidos de Windows. Los tres tests nuevos en verde. En el clon,
`bin/taskctl.cmd` sale `i/lf w/crlf attr/text eol=crlf` y `bin/taskctl` sigue
en LF.

### CRIT-1 — Desde PowerShell, un argumento sin espacios con `&`, `|`, `<` o `>` lo interpreta cmd.exe

`node "%~dp0taskctl" %*`. PowerShell 5.1 solo entrecomilla los argumentos con
espacios: `'Q&A'` llega sin comillas a la linea de `cmd /c` y cmd.exe
interpreta `&`, `|`, `<` y `>`. El README empuja a este caso al recomendar
anadir `bin` al PATH (en PowerShell `taskctl` resuelve a `taskctl.cmd`). El
test solo probaba `Acción con espacios & más`, que PowerShell entrecomilla.

Reproduccion (PowerShell 5.1.26100, lanzador en una ruta con espacios):

1. Con un `bin/taskctl` falso que imprime su argv: `'a&b'` da `["a"]` y
   `"b" no se reconoce como un comando`; `'a|b'` canaliza a `b`;
   `'x>victima.txt'` crea `victima.txt` en el cwd.
2. Con el taskctl real en un repo temporal: `new --titulo 'I+D&QA'` commitea
   una tarea con `titulo: I+D` e intenta ejecutar `QA`; con `notas.txt`
   versionado, `--titulo 'foo->notas.txt'` deja `notas.txt` vacio (cmd abre la
   redireccion antes de node). Con un fichero sin versionar, perdida de datos.

Desde cmd.exe con comillas no ocurre. Con la funcion de perfil del README
(llama a node sin pasar por cmd) `'I+D&QA'` llega entero. Sin verificar en
PowerShell 7 (no instalado).

### MEN-1 — `%*` por `%1 .. %6` sobrevive

Ningun test pasa mas de 5 argumentos; `new` con varios `--criterio` supera 9
sin esfuerzo. Anadir un caso con mas de 9.

### MEN-2 — Doble interpretacion de `%*`: caret y `%VAR%`

Desde cmd, `a^&b` (escape con caret) se rompe; desde PowerShell `'a^b'` llega
`ab` y `'%PATH%'` se expande. Con comillas desde cmd, todo intacto. Misma
raiz que CRIT-1.

### MEN-3 — `%~dp0` falla si el lanzador se invoca entrecomillado por el PATH

`cmd /d /s /c ""taskctl" uno"` desde otra carpeta: `Cannot find module
'<cwd>\taskctl'`. Fallo conocido de cmd.exe. Se propone aceptar.

### MEN-4 — La funcion de perfil emite un error con una version no X.Y.Z

Con `0.11.0-rc.1` en la cache: error de conversion a `[version]` y despues
elige `0.10.0`. Hoy todas las instaladas son X.Y.Z. Se propone aceptar.

### Lo que salio bien

`--version` y codigos de salida (0, 1, 7, 5 por el PATH) correctos desde cmd
y PowerShell con el lanzador en una ruta con espacios, parentesis y `&`;
espacios, tildes, `ñ`, `100%`, `hola!` intactos; los cuatro fragmentos del
README contra la instalacion real. Mutantes muertos: `exit /b 0` al final,
`%* & exit /b 0`, sin `%~dp0`, sin `@echo off`, regla CRLF antes de `bin/*`,
`bin/*.cmd eol=lf`. Sobrevive `%1..%6` (MEN-1).
