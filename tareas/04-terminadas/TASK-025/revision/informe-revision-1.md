# Informe de revision — TASK-025 (ronda 1)

- Commit revisado: 189fc1b (mas el fix del clon sin main)
- Revisor: agente independiente (general-purpose), clon propio en temporal
- Veredicto: aprobada

Veredicto original del revisor: RECHAZADO. Se marca como aprobada una vez
corregido el CRITICO y los dos IMPORTANTES que lo motivaban.

## Metodo

Clon propio, suite completa, 12 escenarios construidos a mano contra repos
Git reales, medicion de tiempos, y 5 mutaciones del codigo fuente. Todos
los hallazgos vienen con su script de reproduccion.

## Lo primero: el arreglo funciona

El revisor verifico que el fallo de B7 esta realmente cerrado, y en el
flujo REAL, no en el comodo: new, plan, start de la primera, commit en su
rama, checkout a develop, start de la segunda. En develop la carpeta
02-en-curso ni existe y aun asi bloquea. Tambien verifico el camino
contrario (rama mergeada y no borrada: no bloquea), que las ramas de otras
personas no molestan (50 a la vez), que los worktrees no son un agujero, y
que las 5 mutaciones mueren.

## Hallazgos

### CRITICO — el hotfix quedaba bloqueado por tareas ya cerradas

Las referencias contra las que se decidia "mergeada" dependian del tipo de
la tarea. Para un hotfix la base es main y la principal tambien, asi que
develop desaparecia del conjunto. Como entre release y release ninguna
rama de tarea es antepasado de main, TODAS pasaban por abiertas.

El revisor lo demostro EN EL REPO REAL: ramasDeTrabajoAbiertas con base
main devolvia 18 ramas (incluida develop) frente a 1 con base develop. Y
reprodujo el efecto completo: start de un hotfix abortaba nombrando una
tarea terminada, afirmando que su rama "sigue abierta y sin mergear"
cuando estaba mergeada, y proponiendo un taskctl finish que responde "ya
esta terminada". El camino urgente, inutilizable.

Encaja en la definicion de CRITICO del proyecto: el comando hace lo
contrario de lo que dice. Y es la misma clase de error que esta tarea vino
a arreglar — preguntar bien contra la referencia equivocada.

CORREGIDO: referenciasDeCierre() ya no depende del tipo. Siempre la base,
mas develop, main y master, deduplicadas y filtradas por existencia local.
Verificado en el repo real: 1 rama abierta con las dos bases.

### IMPORTANTE — el fail-closed paso a cubrir el historial de todas las ramas

En B7 el fail-closed por tarea.md ilegible cubria el working tree: el
fichero estaba delante de ti. Al escanear ramas paso a cubrir el historial
de todas las locales sin mergear (18 en este repo, muchas de auditoria que
nadie va a tocar por politica). Un solo fichero corrupto en cualquiera de
ellas dejaba a TODO el mundo sin poder arrancar nada, y el remedio que
proponia era inaplicable: hay que hacer checkout de esa rama, corregir y
commitear alli. El coste de la duda lo pagaba quien no la creo.

CORREGIDO: los del arbol activo siguen bloqueando (son fixables); los de
otras ramas avisan, con la rama delante para poder llegar al fichero.

### IMPORTANTE — 2,3 segundos de red en cada start, para nada

resolveMainBranch hace hasta dos git ls-remote. Medido por el revisor:
~2,3 s por invocacion, contra un start completo de 1,6 s en un repo sin
remoto. Y el valor se descartaba si main no era local. Ademas contradecia
de frente la razon escrita para no mirar ramas remotas: no meter la red en
un comando que funciona sin conexion.

CORREGIDO: la principal se resuelve solo desde refs locales.

### MENOR — cuatro, todos corregidos

1. Una rama llamada "-x" (Git la permite via update-ref aunque git branch
   la rechace) se parseaba como opcion y tumbaba el comando con un error
   que ademas culpaba a tareasRoot. Ahora --end-of-options.
2. El deduplicado hacia ganar la copia del arbol, que puede estar
   obsoleta, sobre la fresca de la rama — y esa copia decide de QUIEN es
   la tarea. El revisor lo reprodujo con una tarea reasignada dentro de su
   rama, bloqueando a la persona equivocada. Ahora gana la rama.
3. El catch se tragaba tambien los errores de Git y los disfrazaba de
   "arregla el frontmatter". El show sale del try.
4. Sin ninguna referencia local, toda rama pasaba por abierta. Ahora no se
   escanea ninguna: un falso negativo rarisimo es mejor que falsos
   positivos en masa que no se pueden arreglar cerrando nada.

## Anotado sin corregir

El coste crece con el numero de ramas abiertas: 2 ramas dan un start de
1,6 s; 52 ramas, 50 de ellas abiertas y con tarea en curso, dan 8 s. En
este repo la politica de no borrar ramas no lo empeora, porque las
mergeadas se filtran antes de leerlas. Queda anotado en HALLAZGOS.

## Frentes atacados que aguantaron

Flujo real de punta a punta y camino negativo; 50 ramas de otra persona;
worktrees; HEAD detached; tarea.md binario de 90 MB; nombres de rama con
espacios, comillas y simbolos; repo sin commits; clon sin main local; y
mutation testing en los 3 puntos pedidos mas 2 extra, todas muertas.
