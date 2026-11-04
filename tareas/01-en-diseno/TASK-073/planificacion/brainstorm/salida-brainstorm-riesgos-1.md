# Brainstorm — TASK-073, rol riesgos (ronda 1)

- Rol: `brainstorm-riesgos`
- Agente: taskcode-plugin:brainstorm-riesgos (a1b0b31a52a58d137)

## Riesgos, de mayor a menor daño

- **Deny solo sobre Read/Edit mientras el agente lee por otras vias (el que mas preocupa)** — `Bash`/`PowerShell` (`cat`, `Get-Content`, `grep`, `Select-String`, `node -e`), `git show develop:tareas/.../aceptacion/x`, `git log -p`, `git diff develop...`, `Grep`/`Glob` (nombres), o un subagente por `Task` — fuga silenciosa e irreversible; un test de «deny efectivo» que solo prueba Read da por bueno un freno que no frena — cubrir con PreToolUse todas las herramientas que leen o escriben y Bash/PowerShell por ruta normalizada, y escribir que es contra despistes, no contra un agente hostil (como TASK-072).
- **Es el propio plugin el que filtra los tests** — `review.ts:477-478` mete en `peticion-revision-N.md` el diff entero menos `excluir_de_revision`: si `aceptacion/` esta en la rama, su contenido acaba en `revision/`, que el implementador lee en la ronda 2. Igual el informe rojo de `finish` (`formatearVerificacionRoja` incluye las aserciones) y el hook Stop si el glob de tests del proyecto alcanza `tareas/**` — fuga por un canal que el deny no ve — dejar `aceptacion/` fuera del diff de revision siempre, y que en rojo `finish` muestre solo nombres y recuento.
- **Verde sin haber ejecutado nada** — sin `comando_heldout`, sin carpeta, 0 tests ejecutados, el agente editando `config.yml` (`comando_heldout: "true"`), `--sin-verificacion` reutilizado, o un plugin antiguo que ignora la clave desconocida — `finish` mergea creyendo que hubo freno — anotar en `tarea.md` si se ejecutaron, con que comando, cuantos y que huella de `aceptacion/`; abortar si se declararon held-out y no se ejecuto ninguno.
- **El implementador edita o borra los held-out** — `sed -i`, `rm`, `git checkout`, `git mv`, o rebajar aserciones antes de `finish` — verde a medida — guardar la huella de `aceptacion/` cuando la persona los fija y que `finish` aborte si no coincide.
- **No estan en el arbol donde corre finish** — `finish-verificacion.ts:81-88` exige la rama de la tarea; si la persona los escribe en `develop` tras crear la rama, la rama no los tiene; si los commitea en la rama, el implementador los ve en el historial — verde vacio o fuga — fijar un unico punto canonico donde se escriben y commitean, y comprobar al ejecutar que estan.
- **El patron de ruta se rompe al cambiar de estado la carpeta** — de `00-planificadas` a `04-terminadas`; en Windows mayusculas, `\` frente a `/`, absoluta o relativa, `..`, nombres 8.3 (`NULLCA~1` existe aqui), junctions — el deny no casa — casar sin mayusculas el segmento `aceptacion` bajo `tareas/*/TASK-*/` tras resolver la ruta real.
- **PreToolUse con matcher Agent/Task para frenar subagentes** — es lo que provoca el «Auto-Mode Bypass» de TASK-076 y tumba plan y review en todos los proyectos; ademas un hook roto deja pasar — no poner Agent/Task en el matcher; el subagente se cubre con los hooks que ya alcanzan sus llamadas.

## Puntos sin retorno

- El implementador lee un held-out: no se puede «des-leer»; esos tests quedan quemados y hay que reescribirlos.
- Mergear `aceptacion/` a `develop`: queda en la historia para siempre (las ramas no se borran, politica IECA); tareas posteriores pueden leerlos con `git show`.

## Descartado a proposito

- Agente hostil que ofusca (base64, alias, scripts generados): mismo limite aceptado en TASK-072; la red es la huella de integridad en `finish`.
- Que `Glob` deje ver los nombres: filtra poco.
- Leer held-out de tareas ya terminadas: ya cumplieron su funcion.

## Desacuerdos previstos

- Arquitectura — `permissions.deny` en settings como barrera: en contra de que sea la unica; el criterio literal («deny de Read y Edit») no basta, y vale para toda la sesion (bloquea tambien a la persona y al revisor).
- Testing — «deny efectivo»: un test del patron no lo demuestra; hace falta smoke con Claude Code real que intente leer por Bash, por git y desde un subagente.
- Dominio/skill — si el revisor puede leerlos: si los cita en `informe-revision-N.md`, el informe se lo pasa al implementador. Posicion: que los ejecute, sin citarlos.

## Suposiciones no verificadas

- Un plugin no puede publicar `permissions.deny` (documentacion de plugins).
- La entrada del hook trae `agent_id`/`agent_type` para distinguir implementador y revisor (`hooks/sonda-hooks.mjs`).
- Las reglas deny de Read se aplican a Grep/Glob pero no a Bash (documentacion de permisos).
- Como recibe `comando_heldout` la ruta de la carpeta (placeholder, variable de entorno o ruta fija): condiciona el riesgo de la ruta que se mueve.
- Quien escribe los held-out, en que rama y en que fase: condiciona los riesgos 2 y 5.

Rutas: src/commands/finish-verificacion.ts, src/commands/review.ts, hooks/hooks.json, tareas/00-planificadas/TASK-076/tarea.md.

## El riesgo que mas te preocupa (UNO solo)

El deny solo sobre Read/Edit: el agente lee los held-out por Bash, git o un subagente sin que nada lo note, y el test «deny efectivo» lo da por bueno.
