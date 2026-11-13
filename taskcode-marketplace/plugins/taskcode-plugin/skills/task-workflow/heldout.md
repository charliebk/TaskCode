# Tests held-out (`aceptacion/`)

Son tests de aceptacion que escribe la persona a partir de los criterios de la
tarea y que el agente que la implementa no debe ver.

## Cuando y donde se escriben

- En la carpeta `aceptacion/` de la tarea (en minusculas: `Aceptacion/` aborta).
- **En la rama base y durante el diseno, antes de `start`**: la rama de la
  tarea nace con ellos y no aparecen en su diff. Commitealos en la rama base
  (la principal en un hotfix, que nace de ella).
- Si la persona los corrige despues de `start`, `finish` pide integrar la rama
  base en la de la tarea (`git merge <base>`).
- Se ejecutan con `comando_heldout` de `.taskcode/config.yml` de la rama base
  (la rama de la tarea no puede cambiarlo), que recibe la
  ruta absoluta de la carpeta en `HELDOUT_DIR` (cwd en la raiz del repo, tope
  `timeout_verificacion`).
- Deben quedar fuera de `comando_verificacion` (que el glob de tests del
  proyecto no alcance `tareas/`): si no, el freno de fin de turno los
  ejecutaria y mostraria su salida.

## Si implementas la tarea

No los leas ni los edites. `finish` aborta, sin mergear:

- si no salen en verde (solo muestra comando, codigo y duracion);
- si la rama los ha editado, anadido o borrado respecto a la rama base;
- si la tarea los tiene y falta `comando_heldout`.

Arregla el codigo, nunca los tests. Si crees que un held-out esta mal, dilo:
cambiarlo lo hace la persona en la rama base. `--sin-verificacion` no los salta.

Si `finish` aborta porque la rama los ha tocado, **para y pasale el mensaje a
la persona**: el remedio que imprime lo ejecuta ella en su terminal (tu tienes
bloqueadas esas ordenes; reintentarlas es un bucle).

## El guardian (hook `PreToolUse`)

En la rama de una tarea (`<tipo>/task-NNN-...`), el hook bloquea (exit 2)
Read, Edit, Write, MultiEdit, NotebookEdit, Grep y Glob sobre
`tareas/*/TASK-NNN/aceptacion/` de ESA tarea, y los comandos de Bash o
PowerShell cuyo texto nombra esa ruta (`cat`, `Get-Content`,
`git show rama:ruta`). Normaliza mayusculas, barras invertidas, `..` y rutas
relativas al cwd. En cualquier otra rama (la base, durante el diseno) no
bloquea: la persona puede escribirlos con ayuda. Solo actua si
`.taskcode/config.yml` declara `comando_heldout`: sin la clave no hay held-out
que proteger y el hook sale sin lanzar git.

Es un freno contra despistes, no un cierre. **No ve**, y se acepta asi:

- una busqueda que no nombra la carpeta (Grep sobre la raiz del repo entra en
  `aceptacion/` y devuelve su contenido) ni un indice de codigo por MCP;
- cambiar de rama para leerlos (`git switch` a la base, leer, volver);
- un comando que llega a la ruta sin escribirla (`cd` previo y ruta relativa,
  concatenaciones o escapes del shell, `git cat-file` por hash);
- formas de ruta que Windows resuelve a la misma carpeta (espacio o punto
  final, nombre corto `ACEPTA~1`);
- la ruta absoluta de otro checkout o worktree: la rama que cuenta es la del
  cwd, no la del repo que contiene la ruta.

Al reves, bloquea cualquier comando cuyo texto nombre la ruta aunque no la
lea (un `git commit -m` o un `echo` que la cite): no la escribas en mensajes
ni comandos; nombra la tarea o la carpeta `aceptacion/` sin la ruta completa.

Un held-out leido no se deshace: esa tarea queda gastada y solo lo arregla que
la persona los reescriba. El cierre de la edicion es la huella de `finish`.

## Revision

El revisor por pares no los lee: nunca van en el diff de la peticion de
revision, aunque se cambie `excluir_de_revision`, y solo cuenta su resultado
en `finish`.
