# Informe de revision — TASK-143c (ronda 2)

- Commit revisado: e8650f72eb51ca08d2194e5f59770d4004d391f8
- Revisor: code-quality-reviewer
- Veredicto: aprobada

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| HAL-1 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/test/commands/finish-merge.test.ts:142 | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Debajo, la reproduccion de cada hallazgo, o "sin hallazgos" explicito.

Sin hallazgos nuevos (ni CRITICO ni introducido por la correccion).

### HAL-1 — verificado
El test nuevo lanza finish de hotfix con una copia de los scripts cuyo merge-hotfix-to-main.sh anota sus argumentos y espera [hotfix/task-704-argumentos, --develop, develop, --main, main]. Mutante en dist/src/commands/finish.js (la llamada a argumentosScriptMerge sustituida por los argumentos antiguos): rojo, con actual [hotfix/..., --develop, develop]. Restaurado.

Comprobado ademas: HAL-3 (mutante `resultado.finally` directo: rojo); HAL-4 (resolveMainBranch con una consulta; remoteBranchExists sin usos; los 6 casos de git.test y el de origin muerto en verde; `endsWith('refs/heads/main')` no casa con refs/heads/feature/main).

Nota (no abre ronda): el test de HAL-4 con limite de 2,8 s depende del tiempo y bajo carga podria dar falso rojo.

## Regla 4D

- Duplicacion: sin nueva; los ls-remote de resolveMainBranch pasan por lsRemoto y desaparece remoteBranchExists.
- Desviacion: ninguna.
- Diluvio: ninguno.
- Disfraz: ninguno; los mutantes de HAL-1 y HAL-3 pasan a rojo.

## Evidencia

Clon en %LOCALAPPDATA%/pruebas-claude/taskcode/task-143c-r2 (borrado). npm install y npx tsc sin errores. finish-merge, git, paridad-operacion y verificar-impacto: 54/54.

## Lecturas fuera del contexto permitido

finish.ts (argumentosScriptMerge y su llamada, para el mutante), git.ts (isRemoteAvailable y lsRemoto), nombres de casos de test/fs/git.test.ts y grep de remoteBranchExists y resolveMainBranch.
