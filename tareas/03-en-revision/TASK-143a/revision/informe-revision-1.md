# Informe de revision — TASK-143a (ronda 1)

- Commit revisado: 84d3207ea756aee0bbd0c5ab15b3ab4943f1bf4c
- Revisor: code-quality-reviewer
- Veredicto: aprobada con correcciones

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| H-1 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/_gitflow-common.sh:601 | implementacion |
| H-2 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/test/gitflow/flujo-comun.test.ts:100 | implementacion |
| H-3 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/_gitflow-common.sh:434 | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Debajo, la reproduccion de cada hallazgo, o "sin hallazgos" explicito.

### H-1 — develop divergida deja el backmerge a medias sin decirlo
El pull --ff-only del backmerge va despues del punto sin retorno (main mergeada, tag creado y subido). Con develop local y origin divergidos, el script aborta con «No se pudo actualizar develop desde origin», con main y el tag ya en origin y sin backmerge, y el mensaje no lo dice. No es regresion: antes el push de develop se rechazaba con el mismo estado. Reproducido comparando los scripts de origin/develop con los de HEAD (merge-release-develop-diverge). Sugerencia: sincronizar develop antes de mergear a main, para abortar sin haber tocado nada.

### H-2 — hotfix sin red en los datos que ahora son parametros
El test nuevo solo cubre release. Siguen en verde los mutantes 4 (etiqueta del tag fija a «Release»), 6 (mensaje del backmerge con release fijo) y 8 (mensaje update(feature) fijo para todos los tipos). Sugerencia: parametrizar el test de merge a main sobre release y hotfix, y comprobar update(<tipo>) por tipo.

### H-3 — ningun test comprueba que create sincroniza la base
Quitar `_gf_sync_branch "$base_branch"` de invoke_create_work_branch no pone nada en rojo (mutante 9). Sugerencia: create-release con develop local atrasada; la rama nueva nace de la punta de origin.

## Regla 4D

- Duplicacion: cumple. Los helpers nuevos sustituyen copias reales y los usan todos los scripts afectados; no se reimplementa nada que ya existiera.
- Desviacion: cumple. El diff se limita a gitflow, su README y un test.
- Diluvio: cumple. invoke_merge_to_main tiene 8 parametros posicionales; reemplaza dos copias casi identicas.
- Disfraz: H-2 y H-3 (los tests nuevos fallan sin el cambio, pero no distinguen esos datos).

## Evidencia

Clon temporal en %LOCALAPPDATA%\pruebas-claude	askcode	ask-143a-r1 (borrado al terminar). npx tsc sin errores; gitflow + rama-base + guardia-merge: 94/94. Mutantes 0-12 sobre _gitflow-common.sh: rojo salvo 4, 6, 8 y 9. Comparacion de comportamiento entre los scripts de origin/develop y HEAD: iguales salvo texto de log en create, push, sin origin, rama solo remota, --tag, --main/--develop y origin caido; develop atrasada y update-release/update-hotfix con rama solo remota fallaban antes y ahora funcionan; develop divergida, H-1.

## Lecturas fuera del contexto permitido

skills/task-workflow/revision.md (plantilla de hallazgos) y las versiones de develop de update-release.sh y update-hotfix.sh, para comparar el comportamiento anterior.
