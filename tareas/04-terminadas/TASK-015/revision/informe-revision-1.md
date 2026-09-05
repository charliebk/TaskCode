# Informe de revision — TASK-015 (ronda 1)

- Commit revisado: 809d9183b75b76e0a0dd30082a9a2ceb2018db1b
- Revisor: agente independiente (general-purpose), clon propio en temporal
- Veredicto: aprobada

Veredicto original del revisor: APROBADO CON CORRECCIONES. Se marca como
aprobada una vez aplicadas las correcciones que pedia (ver abajo).

## Metodo

Clon independiente, npm install y build desde cero, suite reproducida
(337 tests, 334 pass, exactamente los 3 fallos conocidos del entorno
local). 16 casos de ataque contra el CLI real y contra la API, mas un
banco de 8 mutaciones del codigo fuente.

Mutation testing: las 8 mutaciones murieron, y cada una la mato
exactamente el test que dice cubrirla (estados que ocupan hueco, orden
por ID, exclusion de la propia tarea, comparacion sensible a mayusculas,
persona nueva frente a anterior, fail-closed de ilegibles, deduplicado
por ID, y acotacion a dos carpetas). Ningun test superviviente.

## Hallazgos

### IMPORTANTE — la divergencia con la 8.2 no estaba documentada

El plan-final y el propio tarea.md prometian documentarla en
HALLAZGOS.md y el commit no lo hacia. No es burocracia: es la mayor
divergencia del proyecto (un limite entero de la metodologia que no se
implementa), y sin la entrada el siguiente lector concluye que hay un bug
donde hay una decision. CORREGIDO.

### MENOR — un error de disco escapaba como "taskctl no pudo arrancar"

Reproducido con tareas/02-en-curso creado como fichero en vez de carpeta:
el ENOTDIR salia como Error crudo al catch-all de bin/taskctl. Misma
clase de bug ya corregida en TASK-010 y TASK-014. CORREGIDO: se envuelve
en StartCommandError con un mensaje que dice que revisar.

### MENOR — el mensaje nombraba una carpeta donde la tarea no esta

Con una tarea fisicamente en 02-en-curso pero con "estado: terminada" en
su frontmatter, el error mandaba al usuario a 04-terminadas, donde no hay
nada, y le proponia cerrar una tarea ya declarada terminada. Se
seleccionaba por carpeta y se describia por estado declarado. CORREGIDO:
listTareasEnEstados devuelve TareaUbicada (tarea + carpeta real) y el
mensaje usa la carpeta.

### MENOR — el limite se burlaba con un asignado_a entrecomillado

Un `asignado_a: "carlos "` escrito a mano no era igual a `carlos`, asi que
la misma persona podia abrir una segunda rama. El flag recorta, pero el
frontmatter solo recorta lo NO entrecomillado. CORREGIDO: personaDeTarea
recorta los dos lados, solo para comparar (no reformatea lo que escribe).

### MENOR — asignado_a vacio se trataba como una persona

Dos tareas con `asignado_a: ""` se bloqueaban entre si, y el mensaje salia
sin nombre, mientras que dos con null no. Dos representaciones de "sin
asignar" con semantica opuesta. CORREGIDO en personaDeTarea.

### MENOR — el comando propuesto fallaba en el caso mas habitual

El mensaje decia "Cierra TASK-NNN con taskctl finish TASK-NNN", pero
finish falla mientras la tarea no haya pasado revision aprobada, que es
justo el caso que el plan considera mas doloroso. CORREGIDO: el consejo
ahora dice "su revision y despues taskctl finish".

### MENOR — el limite es opt-in, y hay dos grafias para la misma persona

DOCUMENTADO SIN CORREGIR (HALLAZGOS.md). El limite solo actua sobre tareas
con asignado_a no vacio, y new/import las crean con null: mas de la mitad
de las tareas de este repo caen hoy en el camino que no comprueba nada.
Ademas "carlos" y "charlie.bk" son la misma persona con dos grafias.
Corregirlo exige decidir antes que es una persona en este sistema, que es
material del item C4 (.taskcode/config.yml), no de esta tarea.

## Frentes atacados que aguantaron

- Alias --asignado_a y espacios en el flag: bloquean igual, sin bypass.
- No se consiguio que comprobara a una persona y escribiera a otra.
- Orden de guardas: workspace sucio gana sobre el limite; el limite gana
  sobre el nombre de rama invalido. En ningun caso quedo el repo a medias.
- hotfix con tolerateMissingSource: bloquea antes de tocar Git, asi que el
  borrado del working tree no llega a entrar en juego.
- Fail-closed acotado: tarea.md vacio o incompleto abortan; una rota en
  00-planificadas no bloquea a nadie.
- taskctl plan no comprueba nada, como fija la decision 13.
- Mensaje plural: con dos bloqueantes las lista todas, con carpeta y rama.
- Reutilizar StartCommandError: cli.ts lo captura y no duplica el prefijo.
- En ninguno de los 16 casos de bloqueo quedo una rama huerfana.
