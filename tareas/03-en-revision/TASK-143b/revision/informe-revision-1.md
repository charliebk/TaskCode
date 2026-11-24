# Informe de revision — TASK-143b (ronda 1)

- Commit revisado: f06802ca957056764c0804a643304f1a76f39972
- Revisor: code-quality-reviewer
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/push-back-to-remote.sh:249 | implementacion |
| MEN-1 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/_gitflow-common.sh:337 | implementacion |
| MEN-2 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/push-back-to-remote.sh:244 | implementacion |
| MEN-3 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/diagnose-repo.sh:86 | plan |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Debajo, la reproduccion de cada hallazgo, o "sin hallazgos" explicito.

### IMP-1 — `--prune` y `--force` del mirror sin test que los proteja
Con `--mirror` el borrado de lo exclusivo del destino y la sobrescritura de las divergentes venian dados por Git; ahora los garantizan dos flags escritos a mano. Mutantes sobre push-back-to-remote.sh con argumentos-comunes, disfraz-gitflow y origin-deteccion: sin `--prune`, 15 pass; sin `--force`, 15 pass; sin el refspec de tags, rojo. A mano, el comportamiento es correcto (`+ diverge (forced update)`, `- [deleted] solo-destino`, refs/notes del destino intacta). Sugerencia: ampliar el test con una rama exclusiva del destino que desaparece y una divergente que acaba con el SHA local.

### MEN-1 — recorte de espacios y `--main` sin test
Sobreviven los mutantes «sin recorte en normalize_branch_name» y «--main sin consumir su valor». A mano funcionan (`"  1001-login  "` crea feature/1001-login; `create-hotfix.sh x1 --main` crea hotfix/x1 desde main).

### MEN-2 — textos que siguen prometiendo «espejo exacto» de todo local
Lineas 72, 155, 244 y 295: ahora es un espejo de ramas y tags.

### MEN-3 — ruido en diagnose-repo y nombre repetido
detect_origin_available imprime un [WARN]/[OK] antes del informe, y la linea queda «Develop: develop: ...» en el caso por defecto. Ningun consumidor la parsea.

## Regla 4D

- Duplicacion: cumple (14 copias de la lectura y 12 del recorte, en un solo sitio; backup en una variable).
- Desviacion: cumple.
- Diluvio: cumple.
- Disfraz: IMP-1 y MEN-1 (mutantes que sobreviven).

## Evidencia

Clon temporal en %LOCALAPPDATA%/pruebas-claude/taskcode/task-143b-r1 (borrado). npx tsc sin errores; gitflow + wrappers + rama-base + guardia-merge: 107/109, los dos rojos de origin-deteccion (timeouts bajo carga) pasan aislados 5/5. Casos sin regresion: --main al final sin valor, espacios en los extremos y en medio, pregunta interactiva, prefijo ya puesto, -p antes del nombre, --develop, --tag, mirror con rama exclusiva y divergente.

## Lecturas fuera del contexto permitido

skills/task-workflow/revision.md y skills/code-quality-reviewer/SKILL.md (los pide la skill), push-back-to-remote.sh lineas 90-200 (vista previa y fetch previo) y busquedas por grep de textos y consumidores.
