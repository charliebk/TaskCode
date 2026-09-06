# Informe de revision — TASK-024 (ronda 1)

- Commit revisado: 6c57ccc
- Revisor: agente independiente (general-purpose), clon propio en temporal
- Veredicto: aprobada

Veredicto original del revisor: APROBADO CON CORRECCIONES. Se marca como
aprobada una vez aplicadas las correcciones que pedia.

## Metodo

Tres clones (rama, develop de referencia y uno para E2E), suite
reproducida (359 tests, los 3 fallos conocidos), ataques de punta a punta
con dos identidades distintas, auditoria de los 24 asignado_a del arbol y
5 mutaciones del codigo fuente, las 5 muertas con margen.

## Hallazgos

### CRITICO — la identidad Git no pasaba por ninguna validacion

El flag --asignado-a rechaza saltos de linea desde B6, con el comentario
explicito de que romperian el frontmatter. La identidad Git entraba por
otra puerta y no pasaba por ahi. Reproducido: un
`git config user.email "ana@x.com\nestado: terminada # "` produce un
tarea.md con una clave INYECTADA que pisa "estado". La tarea queda
fisicamente en 01-en-diseno pero declarandose terminada, sale bajo
"Terminadas" en el board, y queda LADRILLADA: ni plan ni start aceptan ya
ese estado. Exit 0 y sin un solo aviso.

CORREGIDO: la regla se extrajo a motivoValorInvalido() y la identidad pasa
ahora por identidadUsable(), que aplica exactamente las mismas
comprobaciones. Una identidad invalida NO aborta el comando (quien ejecuta
no ha pedido nada raro): se ignora y se avisa por stderr. Verificado
reproduciendo el caso: el estado queda intacto y sale el aviso.

### IMPORTANTE — el tope de 64 caracteres se saltaba por la identidad

La misma cadena de 92 caracteres: rechazada por el flag, aceptada por la
identidad. Un correo corporativo largo no es un caso de borde, y el tope
existe porque el valor acaba como columna de docs/BOARD.md, versionado.
CORREGIDO por la misma via que el critico.

### IMPORTANTE — docs/BOARD.md no se habia regenerado

El commit migraba 10 tareas y dejaba el tablero con las filas viejas, pese
a que el plan-final se comprometia a regenerarlo. Reabria justo la
divergencia que cerro el item B5. CORREGIDO con taskctl board --escribir.

### IMPORTANTE — plan marcaba al planificador y start no avisaba

Si Carlos planifica y Ana ejecuta start, la tarea queda a nombre de Carlos
y el limite de WIP se comprueba contra Carlos. La regla es deliberada (no
robar tareas ajenas), pero callarselo no. CORREGIDO: start emite un aviso
nombrando a las dos personas y diciendo como quedarsela.

### IMPORTANTE — el mensaje que explicaba como desasignar ya era falso

PISTA_VACIO_ESCRITURA recomendaba editar "asignado_a: null" a mano; con
esta tarea, el siguiente plan o start lo vuelve a rellenar. CORREGIDO: el
mensaje dice ahora la verdad, incluido que hoy no hay forma de desasignar
desde el CLI.

### MENOR — dos comentarios que habian dejado de ser ciertos

El de start.ts afirmaba que el valor se escribe "tal cual" cuando
resolverAsignado lo recorta; el de gitUserEmail culpaba a "no hay Git" de
un GitLaunchError cuya causa habitual es un cwd inexistente. CORREGIDOS.

### MENOR — la migracion dejaba el historico incoherente

TASK-015 se migraba y TASK-013 y TASK-014, del mismo autor y la misma
carpeta, se quedaban en null. CORREGIDO migrando tambien esas dos: 13
tareas con la identidad, 11 sin asignar.

## Lo mas valioso del informe: lo que esta tarea NO arregla

El revisor confirmo con evidencia que TASK-024 deja el fallo del limite de
WIP exactamente igual, y que el plan-final afirmaba lo contrario. Rellenar
asignado_a es condicion NECESARIA pero NO SUFICIENTE: el limite sigue sin
dispararse en el flujo real porque mira el arbol de la rama activa.
CORREGIDO en la redaccion: el test que se llamaba "el limite de WIP ya NO
es opt-in" pasa a decir lo que de verdad demuestra, con un comentario que
explica por que en produccion no protege. Sin eso, el test habria servido
de coartada para dar por hecho un arreglo que no existe.

## Frentes atacados que aguantaron

- Honestidad de los dos tests que cambiaron de expectativa: comparados con
  git show develop y confirmados como adaptacion honesta, no maquillaje.
- Robo de tarea por plan, por start y por re-planificacion: sin fisuras.
- Los 24 asignado_a del arbol, releidos por taskctl board sin un aviso.
- Casos borde de gitUserEmail: repo sin commits, cwd sin repo, valor
  duplicado con --add, solo espacios, mayusculas, y un "Nombre <a@x.com>".
- board --asignado-a filtra bien por el correo, y por el alias tambien.
- new e import siguen creando con null, como declara el plan.

Nota de entorno aportada por el revisor: los 3 fallos conocidos tienen
ademas un cuarto intermitente (EBUSY al borrar repos temporales en
Windows), que aparecio 2 de 8 veces en develop y 1 de 8 en la rama. Es
flakiness preexistente, no una regresion.
