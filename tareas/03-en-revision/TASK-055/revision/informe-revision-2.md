# Informe de revision — TASK-055 (ronda 2)

- Commit revisado: b87c0be8bdf033901cd9e394c0201d717d17625b
- Revisor: agente general-purpose independiente con la skill code-quality-reviewer
- Veredicto: PENDIENTE (escribelo con: taskctl veredicto TASK-055 aprobada | aprobada-con-correcciones | cambios-solicitados)

## Hallazgos

| ID | Severidad | Estado | Fichero |
|---|---|---|---|
| CRIT-1 | CRITICO | corregido | README.md («Usar `taskctl` fuera de Claude Code»), test/empaquetado/distribucion.test.ts |
| MEN-1 | MENOR | corregido | test/empaquetado/distribucion.test.ts (13 argumentos) |
| MEN-2 | MENOR | corregido | bin/taskctl.cmd:5, README.md |
| MEN-3 | MENOR | aceptado | bin/taskctl.cmd:5 |
| MEN-4 | MENOR | corregido | README.md (funcion de perfil) |
| MEN-5 | MENOR | corregido (documentado) | README.md (funcion de perfil, PowerShell 5.1) |
| MEN-6 | MENOR | corregido | bin/taskctl.cmd:2 |
| MEN-7 | MENOR | corregido | README.md y test de la cache sin version valida |
| MEN-8 | MENOR | corregido | README.md (funcion de perfil) |

### Puerta determinista

Clon nuevo, `npm install && npm test` una vez: 983 tests, 980 verdes, los 3
rojos conocidos de Windows. Los tests nuevos en verde. Eol: `bin/taskctl` LF,
`bin/taskctl.cmd` CRLF.

### CRIT-1 — cerrado, verificado

La funcion de perfil, copiada literal del README y apuntada a una cache falsa
en una ruta con espacios, parentesis y `&`, en powershell.exe 5.1.26100:
`new --titulo` con `'I+D&QA'`, `'foo->notas.txt'`, `'a|b'`, `'%PATH%'`,
`'a^b'`, `"sin'simple"`, `'x<notas.txt'`, `'!foo!'`, `'$(whoami)'`,
`` '`echo' `` y `'a;b'`: exit 0, titulo literal, `notas.txt` intacto y
workspace limpio. Cadena vacia: PowerShell la descarta y taskctl falla
cerrado. Mas de 9 argumentos con metacaracteres, intactos. El README ya no
empuja al `.cmd` desde PowerShell. En Claude Code, el `bin` del plugin esta
en el PATH del Bash tool y no en el del PowerShell tool.

Mutantes (commits temporales del clon): la funcion vuelve a llamar al `.cmd`
(rojo); `$taskcodeBase` renombrado en el README (rojo: la extraccion falla
cerrada); `%1..%9` (rojo); quitar el `Where-Object` (sobrevive, MEN-7).
Teardown con junction: `rm` no entra en el destino del junction; el destino
es un arbol exportado, nunca el working tree.

### MEN-5 — PowerShell 5.1 no escapa las comillas dobles internas

Por la funcion de perfil: `'con "comillas" internas'` llega sin comillas;
`'Mi tarea" --criterio "inyectado'` se parte e inyecta un criterio; una `\`
final antes de la comilla se altera. Fallo de fidelidad, no de seguridad. Es
el paso de argumentos a ejecutables nativos de PowerShell 5.1.

### MEN-6 — Comentario del `.cmd` desactualizado

Decia «Lanzador para cmd y PowerShell», justo lo que el README desaconseja.

### MEN-7 — El `Where-Object` no tenia test que lo matase

`Sort-Object { $_.Name -as [version] }` ya ordena primero lo que no es
version; el filtro solo importa si no hay ninguna version valida, caso sin
test.

### MEN-8 — Sin plugin o sin version X.Y.Z, error criptico

«No se puede enlazar el argumento al parametro 'Path' porque es nulo», con
`$LASTEXITCODE` sin tocar.

## Correcciones (orquestador)

- MEN-5: documentado en el README (evitar comillas dobles internas en 5.1;
  usar comillas simples dentro del texto o PowerShell 7.3+). No se escapa en
  la funcion: el escape correcto de `"` y `\` para la linea de comandos de
  Windows es facil de hacer a medias, y el caso es de fidelidad.
- MEN-6: el comentario dice que es para cmd y por que no para PowerShell.
- MEN-7 y MEN-8: la funcion lanza «taskcode-plugin no esta instalado en
  <ruta>» si no queda ninguna version; test nuevo con una cache que solo trae
  `0.4.0-beta`, que exige salida distinta de 0 y ese mensaje. Quitar el
  `Where-Object` lo pone rojo.
