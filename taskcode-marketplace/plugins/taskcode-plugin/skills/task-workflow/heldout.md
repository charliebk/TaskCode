# Tests held-out (`aceptacion/`)

Son tests de aceptacion que escribe la persona a partir de los criterios de la
tarea y que el agente que la implementa no debe ver.

## Cuando y donde se escriben

- En la carpeta `aceptacion/` de la tarea.
- **En la rama base y durante el diseno, antes de `start`**: la rama de la
  tarea nace con ellos y no aparecen en su diff. Commitealos en la rama base.
- Se ejecutan con `comando_heldout` de `.taskcode/config.yml`, que recibe la
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

## Revision

El revisor por pares no los lee: nunca van en el diff de la peticion de
revision, aunque se cambie `excluir_de_revision`, y solo cuenta su resultado
en `finish`.
