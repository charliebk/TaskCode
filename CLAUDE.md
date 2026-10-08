# TaskCode — contexto para Claude Code

Metodología de tareas por sprints, revisión por pares de agentes y Git-Flow
determinista, empaquetada como plugin de Claude Code. Este repo es a la vez el
marketplace público que distribuye el plugin y el proyecto que lo construye
usándose a sí mismo (dogfooding).

**Antes de tocar nada, lee [`docs/contexto/`](docs/contexto/)** — sobre todo
`ESTADO.md` (dónde estamos), `CONVENCIONES.md` (cómo se trabaja aquí) y
`HALLAZGOS.md` (las trampas que ya nos han costado tiempo).

## Idioma

Todo el código, la documentación, los mensajes de commit y las respuestas van
en **español**. Los mensajes de commit sin tildes (los scripts de Git-Flow los
procesan).

## Cómo se trabaja aquí — lo mínimo imprescindible

1. **Rama por tarea, siempre.** Nada se commitea directo en `develop` salvo
   documentación suelta. Merge con `--no-ff`. Las ramas **no se borran** tras
   el merge (política IECA: quedan para auditoría).
2. **Revisión por pares obligatoria.** Cada tarea la implementa un agente y la
   revisa otro *independiente* antes de darse por cerrada. El revisor
   reproduce empíricamente, no lee el diff y opina. Sus hallazgos se
   clasifican CRÍTICO / IMPORTANTE / MENOR y se documentan en el `Resultado`
   de la tarea, incluidos los que se deciden no corregir.
3. **Evidencia, no suposición.** Si no lo has ejecutado, no lo afirmes. Los
   tests van contra recursos reales (repos Git temporales), nunca mocks.
4. **Al cerrar cualquier item**: marcar su casilla en
   `docs/contexto/CHECKLIST_TERMINACION.md`, actualizar los contadores de la
   tabla de cabecera, y **mostrar el checklist actualizado en la respuesta**.
5. **Cero dependencias de runtime.** El parser de YAML-frontmatter y el de
   argumentos están hechos a mano, a propósito. No añadas librerías sin una
   razón discutida.

## Comandos

```bash
cd taskcode-marketplace/plugins/taskcode-plugin
npm install
npm test             # compila y corre la suite completa (~1090 tests, ~8 min) con cobertura
npm run test:rapido  # core y cli sin procesos (~360 tests, ~10 s): para iterar, no para cerrar
```

El CLI: `taskctl new | import | board | metricas [--tokens [--escribir]] | plan |
approve | start | review | finish [--tag <nombre>] [--merge-request] [--push] | registrar-coste TASK-NNN --fase <f> (--agente <id>... | --tokens N)`, más los cinco wrappers de Git-Flow: `diagnose | pause | resume |
recover | abort-merge`. El ciclo de vida está completo: Fases A, B y C
cerradas.

El plugin además **expone contenido a Claude Code**: cinco skills
(`task-workflow` y los cuatro revisores por dominio) y cuatro agentes (los
roles del brainstorm), más `scripts/heuristica-complejidad.yml`. Todo eso se
instala en proyectos que **no son este**, así que ninguno de esos ficheros
puede mencionar TaskCode, sus rutas ni sus documentos internos — hay tests
que lo comprueban.

## Trampas que ya nos han mordido

- Los scripts de Git-Flow se invocan **siempre** como `bash script.sh`, nunca
  por ruta directa (`core.fileMode` está en `false` en este repo).
- Los ficheros que le pases a `taskctl import` deben vivir **fuera del repo**:
  si no, ensucian el workspace y el guard de §8.3 aborta el propio import.
- `taskctl import` no se puede ejecutar dos veces seguidas sin commitear en
  medio, por lo mismo.
- Los tests de `finish --merge-request` no tienen GitHub ni GitLab: usan un
  `gh`/`glab` de prueba en el PATH (`test/helpers/plataforma-doble.ts`) que lee y
  escribe un fichero de estado; es el único doble de la suite. En Windows es un
  `.exe` (enlace a `node.exe` + `--require` en `NODE_OPTIONS`) porque
  `spawnSync` sin shell no ejecuta un `.cmd`. Una máquina con `gh`/`glab`
  reales instalados no los usa: el doble va delante en el PATH.
- El glob de `npm test` va entrecomillado a propósito: lo expande Node, no el
  shell. Sin comillas, la suite entera falla en `cmd.exe`.
- En Windows nativo **fallan 3 tests y no son regresiones**: uno por el truco
  del symlink (`EPERM`), uno porque `chmod` sobre directorios no hace nada en
  NTFS, y uno por finales de línea (CRLF). En el CI de Linux pasan. Aquí
  «suite en verde» significa que fallan solo esos tres. Ojo: bajo carga
  aparecen además rojos intermitentes de `EBUSY ... rmdir` al limpiar los
  repos temporales; fallan en el *teardown*, no en la aserción, y no son
  tuyos. Cualquier otro cuarto rojo sí lo es.

El resto, en `docs/contexto/HALLAZGOS.md`.
