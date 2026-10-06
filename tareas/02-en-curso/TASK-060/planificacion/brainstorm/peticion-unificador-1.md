# Peticion al unificador — TASK-060 (ronda 1)

- Tarea: TASK-060 — Opciones de cierre en finish: merge normal, merge request y tag
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-10-06
- Rol: `brainstorm-unificador` — lanzalo con el agente de ese mismo nombre
- Vuelca el resultado en: `../plan-final.md`

## Salidas que tienes que consolidar

- `salida-brainstorm-arquitectura-1.md` — rol arquitectura
- `salida-brainstorm-riesgos-1.md` — rol riesgos

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **media**
- Heuristica (1 puntos): **simple**
- Senales encontradas:
  - criterios_aceptacion: 11 criterios (umbral: 5) (+1)

Los dos niveles NO coinciden. Se lanzan 2 roles, que es el mayor de los dos numeros: infraestimar sale caro y sobreestimar es barato. La discrepancia se te senala aqui a proposito — puede significar que el enunciado de la tarea no refleja lo que de verdad cuesta.

## Como consolidas

1. Lee las salidas de arriba. **Si alguna falta o esta sin rellenar, sigue adelante con las que haya y escribe en el plan cual falto**: un plan con un punto de vista menos, dicho, vale mas que un plan que finge estar completo.
2. **No promedies.** Donde dos roles discrepen, el plan dice quien propone que, cual gana y por que. Un desacuerdo resuelto con una frase intermedia que no defiende nadie es la peor salida posible de este paso.
3. **Si no discrepan en nada, eso es la alarma, no la nota de calidad**: significa que los roles recibieron el mismo contexto o que alguno no hizo su trabajo. Dilo en el plan.
4. Cada afirmacion del plan que venga de un rol se atribuye a ese rol.

## Que tiene que traer el plan final

- Enfoque propuesto, concreto: que se crea, que se extiende, en que orden.
- Los desacuerdos entre roles y como se resuelve cada uno.
- Riesgos aceptados y que los contiene.
- Plan de pruebas.
- Lo que necesita decision de una persona antes de implementar. **El checkpoint humano es obligatorio**: este plan no vale hasta que alguien lo apruebe con `taskctl approve`.

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
