# Informe de revision — TASK-013 (ronda 1)

- Commit revisado: 4e6422fecdb97b76266b384e3bb65bab13db8f82
- Revisor: agente independiente (general-purpose), protocolo completo de
  CONVENCIONES.md: clon temporal, suite propia, 9 repos Git adversariales
  invocando el CLI real.
- Veredicto: aprobada (los cambios solicitados en la ronda se aplicaron en 484a946, ver Resolucion)

## Suite ejecutada por el revisor

244 tests: 241 pass, 3 fail — los 3 fallos son exactamente los
preexistentes de entorno local (2 EPERM de symlink, 1 CRLF), documentados en
HALLAZGOS.md; pasan en CI. Los 8 tests de review.test.js pasan.

## Hallazgos

### IMPORTANTE-1: diff mayor de 1 MB revienta el comando con ENOBUFS tras consumar el merge

runGit usaba spawnSync sin maxBuffer (default 1 MB). Un diff real grande
(2,7 MB medido) mataba a git DESPUES de que el update creara su merge
commit: la tarea no se movia (fail-closed) pero reintentar reproducia el
error para siempre, con mensaje engañoso del catch-all.

### IMPORTANTE-2: fallo de escritura entre moveTareaFile y los writeFile deja en-revision sin peticion

La tarea se movia ANTES de escribir peticion e informe. Un EEXIST (colision
case-insensitive en NTFS con restos en mayusculas), permisos o disco lleno
dejaban estado en-revision sin artefactos y sin ruta de reintento —
callejon sin salida de la maquina de estados hasta arreglo manual.

### MENOR-1: los errores Git del camino review no se capturaban en cli.ts

GitLaunchError y GitCommandError caian al catch-all del binario con el
prefijo falso de que taskctl no pudo arrancar.

### MENOR-2: la valla de 4 backticks de la peticion se rompe con lineas de contexto

Una linea de CONTEXTO del diff (prefijo espacio) con 4 o mas backticks a
columna 0 cierra la valla antes de tiempo (CommonMark tolera 3 espacios de
sangria en el cierre). Las propias peticiones commiteadas por dogfooding
contienen vallas de 4, asi que un diff futuro que las muestre como contexto
lo dispararia.

### MENOR-3: si task.rama no existe, el script deja al usuario en develop sin decirlo

Comportamiento del script update de Git-Flow (cambia a develop antes de
comprobar el target). Mensajes correctos, exit 1, nada movido — solo la
rama activa cambia en silencio.

## Sin hallazgos (probado y correcto)

Doble review rechazado limpio; invocacion desde otra rama parada por la
lectura preliminar o por la lectura fresca mas TaskFolderConflictError
(limitacion del merge previo documentada en plan-final.md, alcance de
TASK-014); hotfix sin origin con base main completo; numeracion de rondas
sensata ante nombres raros y rondas a medias; ultimo_commit_revisado
intacto conforme a la seccion 16.3; criterio 4 implementado como peticion
mas scaffold segun decision registrada.

## Resolucion (2026-09-05)

- IMPORTANTE-1 → corregido: maxBuffer de 64 MB en runGit + test con diff de
  1,8 MB.
- IMPORTANTE-2 → corregido: peticion e informe se escriben ANTES de mover
  (el rename se lleva la carpeta revision entera), EEXIST mapeado a error
  con instruccion + test que fuerza el fallo del rename.
- MENOR-1 → corregido: el catch de review captura tambien los errores Git.
- MENOR-2 → corregido: valla calculada dinamicamente por encima del maximo
  del contenido + test con vallas en lineas de contexto reales.
- MENOR-3 → documentado sin corregir: es deuda de los scripts update de
  Git-Flow (misma familia que C6), fuera del diff de esta tarea.