# Peticion de brainstorm — TASK-060, rol riesgos (ronda 1)

- Tarea: TASK-060 — Opciones de cierre en finish: merge normal, merge request y tag
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-10-06
- Rol: `brainstorm-riesgos` — lanzalo con el agente de ese mismo nombre
- Vuelca tu respuesta en: `salida-brainstorm-riesgos-1.md`

## Tu pregunta

> ¿Por donde se rompe esto?

## Que miras

- Bordes y estados intermedios: que queda a medias si el proceso muere a mitad.
- Fallos parciales y concurrencia: dos ejecuciones, un recurso ocupado, un permiso denegado.
- Compatibilidad hacia atras con los datos y ficheros que YA existen.
- La vuelta atras: si esto sale mal, como se deshace y que queda inservible.

## Que NO miras

No es una lista de cortesia. Si la ignoras y lo cubres todo "por si acaso", el acotado de contexto se deshace sin que se note y esta tarea deja de tener varios puntos de vista:

- Donde encaja el cambio (es del rol de arquitectura).
- Que aserciones escribir (es del rol de testing).
- Las reglas de negocio (son del rol de dominio).

## Enunciado de la tarea

### Objetivo

````
`taskctl finish` hoy solo sabe hacer un merge local `--no-ff` con el script de Git-Flow del tipo, y solo hotfix y release llevan tag (obligatorio). Se quiere poder elegir, al cerrar, entre merge normal (por defecto), abrir un merge request en la plataforma del remoto, y poner un tag anotado sobre el merge. Todo opcional: sin flags, el comportamiento es el de hoy. Decisiones de Carlos (2026-10-06): GitHub y GitLab detectados por la URL de origin (`gh pr create` / `glab mr create`, tambien GitLab autoalojado); con merge request la tarea espera en revision y un segundo `finish` la cierra cuando el MR esta mergeado en el remoto; el tag es `--tag <nombre>`, anotado, sobre el commit de merge, y solo se sube con `--push`; pregunta la skill finish en modo manual y semiautomatico, y en automatico se usa el merge normal sin tag salvo que `.taskcode/config.yml` diga otra cosa.
````

### Criterios de aceptacion

````
[ ] `taskctl finish TASK-NNN` sin flags nuevos se comporta exactamente como hoy (la suite existente de finish sigue en verde sin cambiar expectativas).
[ ] `taskctl finish TASK-NNN --tag <nombre>` crea un tag anotado sobre el commit de merge con el titulo de la tarea como mensaje; si el tag ya existe o el nombre no es valido (`git check-ref-format`), aborta antes de mergear sin tocar nada.
[ ] El tag solo se sube con `--push`; sin `--push` queda local y la salida lo dice.
[ ] En hotfix y release, `--tag` sustituye el nombre del tag que pone el script en lugar de crear un segundo tag, o aborta con un mensaje claro si no es posible (decidir en el plan).
[ ] `taskctl finish TASK-NNN --merge-request` sube la rama, abre el PR (GitHub, `gh`) o MR (GitLab, `glab`) contra la rama base segun la URL de origin, anota la URL en `tarea.md` y deja la tarea en `en-revision`.
[ ] Sin el CLI de la plataforma, sin autenticar, con origin no reconocido o sin origin, `--merge-request` aborta antes de subir nada con un mensaje que dice que instalar o configurar.
[ ] Un segundo `taskctl finish TASK-NNN` sobre una tarea con MR abierto comprueba en el remoto si la rama esta integrada en la base: si lo esta, mueve la tarea a `terminada` y regenera CHANGELOG, INDEX y BOARD; si no, aborta diciendo que el MR sigue abierto, sin tocar nada.
[ ] `--tag` combinado con `--merge-request` pone el tag en el segundo `finish`, sobre el merge real traido del remoto.
[ ] `.taskcode/config.yml` acepta una clave para el cierre por defecto (merge normal o merge request) que usa el modo automatico; una clave o valor mal escrito aborta como el resto de claves.
[ ] La skill `finish` pregunta en modo manual y semiautomatico (merge normal por defecto, merge request, tag opcional) y en automatico no pregunta; la skill no menciona el proyecto ni rutas internas.
[ ] Tests contra repos Git temporales reales para merge normal con tag, tag duplicado, push del tag a un remoto bare, y el ciclo MR con un CLI de plataforma simulado por un ejecutable de prueba en el PATH (el unico doble admitido: no hay GitHub ni GitLab en el CI).
````

## Como entregas

Escribe en `salida-brainstorm-riesgos-1.md`, con estas secciones y en este orden:

- Modos de fallo, ordenados por gravedad, con el escenario concreto de cada uno
- Estados intermedios y fallos parciales
- Compatibilidad hacia atras
- Vuelta atras
- El riesgo que mas te preocupa (UNO solo)

## Reglas

- **Propones enfoque; no implementas.** No escribas codigo de produccion ni modifiques ficheros del repo: tu salida es un documento.
- Evidencia, no suposicion: si afirmas que algo se comporta de cierta manera, es porque lo has mirado. Di de donde lo sacas.
- Prefiere lo concreto: rutas, nombres y casos reales por encima de recomendaciones genericas.
- Trabajan en paralelo contigo, sin verte: **arquitectura**. No cubras lo suyo — si lo haces, el unificador recibira el mismo punto de vista repetido y lo leera como confirmacion.
