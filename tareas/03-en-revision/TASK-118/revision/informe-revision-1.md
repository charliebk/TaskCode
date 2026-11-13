# Informe de revision — TASK-118 (ronda 1)

- Commit revisado: 946b85a5f07392b5d0a87c1ac4bb92929b0e6593
- Revisor: code-quality-reviewer
- Veredicto: aprobada

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | aceptado | taskcode-marketplace/plugins/taskcode-plugin/scripts/gitflow/_gitflow-common.sh:90-112 | implementacion |

### MEN-1 — Una terminacion por SIGTERM deja `ABORTADO` aunque el proceso salga con 143

Reproduccion (bash 5.3.15 de Git for Windows, repo temporal real):
`bash -c "source _gitflow-common.sh; initialize_gitflow_log op; sleep 30" &` y `kill -TERM` a los 2 s.
El proceso sale con 143 pero el registro termina en
`FIN: op | resultado: ABORTADO | duracion: 2s`, no en `ERROR (codigo 143)`.
Dentro del trap, `$?` vale 0 en una senal fatal, asi que `_gf_fin` toma la rama
`ABORTADO`. El comentario de `_gf_fin` dice "ABORTADO si salio 0 sin resumen".
Consecuencia: ninguna practica (la linea FIN si se escribe y la etiqueta `ABORTADO`
describe bien lo ocurrido), solo una pequena incoherencia entre el comentario y el
caso de la senal. No bloquea. SIGKILL no escribe FIN (inevitable) y queda
`INICIO` como ultima linea.

### Casos borde construidos sin hallazgo

- `exit` dentro de funcion (`f(){ exit 7; }`): FIN `ERROR (codigo 7)`, codigo 7 intacto.
- `exit` en subshell `( exit 5 )` y en `$(exit 5)`: el padre sigue y la FIN solo sale una vez, al final (el trap no se hereda en subshells).
- `set -e` con `false`: FIN `ERROR (codigo 1)`, salida 1.
- `exit 0` sin resumen: `ABORTADO`; con `log_summary COMPLETADO` y despues `false`: `ERROR (codigo 1)`. El codigo de salida nunca cambia (el trap hace `return 0` y el valor lo conserva bash).
- La linea FIN no sale por pantalla (`log_summary | grep -c FIN` da 0).
- Doble `initialize_gitflow_log` en el mismo proceso: una sola FIN (la ultima operacion). Ningun script lo hace.
- Ningun script llama a otro script de Git-Flow ni usa `exec` ni otro `trap` (grep sobre `scripts/gitflow`); por tanto no hay doble FIN ni FIN del hijo en el registro del padre. Con `exec` no habria FIN (el trap desaparece), limitacion inherente y no usada hoy.
- Fuera de un repo: `initialize_gitflow_log` + `exit 2` sale con 2, no crea ficheros y `_do_log` tolera `GF_LOG_FILE` vacio.
- `GF_FORZAR_DATE=1` (ruta de compatibilidad con bash 3.2 sin `printf %()T`): FIN con duracion 3 s correcta. Bash 3.2 real no disponible aqui; solo se ejercito la rama forzada.
- SIGINT: en un `bash -c` en segundo plano la senal se ignora, asi que no se pudo ejercitar de forma significativa (no verificado); el comportamiento de bash ante SIGINT/SIGTERM fatal es el mismo (ejecuta el trap de EXIT), y SIGTERM si se verifico.

## Tests ejecutados

- `npm run build`: sin errores.
- `node --test dist/test/gitflow/linea-fin.test.js dist/test/gitflow/logging.test.js dist/test/gitflow/abort-merge.test.js`: 40 tests, 40 pasan, 0 fallan (39 s).
- No se ejecuto la suite completa ni `verificar-impacto` (modo rapido). No se hizo mutacion: el test por script exige la linea FIN como ultima del registro, de modo que quitar el `trap` lo pondria rojo en los 23 scripts (por lectura, no ejecutado).

## Lecturas fuera del contexto permitido

- `scripts/gitflow/*.sh` (solo grep de `trap`, `exec`, `source` y llamadas entre scripts) para confirmar que ningun otro script pisa el trap ni invoca a otro. Motivo: casos borde pedidos en el encargo.
