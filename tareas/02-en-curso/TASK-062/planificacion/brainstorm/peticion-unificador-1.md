# Peticion al unificador — TASK-062 (ronda 1)

- Tarea: TASK-062 — taskctl doctor: comprobar que un proyecto esta listo antes de trabajar
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-10-08
- Rol: `brainstorm-unificador` — lanzalo con el agente de ese mismo nombre
- Vuelca el resultado en: `../plan-final.md`

## Salidas que tienes que consolidar

- `salida-brainstorm-arquitectura-1.md` — rol arquitectura
- `salida-brainstorm-riesgos-1.md` — rol riesgos

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **media**
- Heuristica (1 puntos): **simple**
- Senales encontradas:
  - criterios_aceptacion: 10 criterios (umbral: 5) (+1)

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
Con el plugin publico, cualquiera lo instala en su proyecto y necesita saber, antes de empezar, si todo lo que el flujo necesita esta en su sitio (Carlos, 2026-10-08). `taskctl doctor` lo comprueba en un solo paso: entorno (Node, Git, bash utilizable para los scripts de Git-Flow), repositorio (estructura `tareas/`, ramas base, origin, workspace), configuracion (`.taskcode/config.yml` valida) y lo necesario para las opciones elegidas (`gh`/`glab` y su sesion si hay merge request por defecto o plataforma declarada). Solo lee y nunca toca nada: para cada fallo dice el comando exacto que lo arregla. Se llama `doctor` porque `status` se confunde con el estado de una tarea y `diagnose` ya existe (diagnostico de Git-Flow).
````

### Criterios de aceptacion

````
`taskctl doctor` imprime una linea por comprobacion con su resultado (ok, aviso o error) y, para cada aviso o error, el comando o paso concreto que lo arregla.
Sale con codigo 0 si no hay errores (los avisos no cuentan) y con codigo 1 si hay alguno; `taskctl doctor --json` da lo mismo en JSON para que una skill lo lea.
Comprueba el entorno: version de Node soportada, `git` disponible y un `bash` que pueda ejecutar los scripts de Git-Flow (en Windows, el de Git y no el de WSL).
Comprueba el repositorio: que es un repo Git, las cinco carpetas `tareas/00-planificadas` a `tareas/04-terminadas`, la rama `develop` y la principal (`main` o `master`), si hay `origin` y si el workspace esta limpio.
Comprueba `.taskcode/config.yml` con el mismo validador que el resto de comandos y lista las claves desconocidas como aviso.
Comprueba la coherencia de las tareas: cada `tarea.md` valida y con `estado` igual a la carpeta donde esta; las incoherencias salen como error con el ID.
Si la config pide merge request por defecto o declara plataforma, comprueba que `gh` o `glab` estan instalados y con sesion (sin subir nada); si no, esa comprobacion sale como omitida.
No escribe, no hace commits, no cambia de rama ni llama a la red salvo la comprobacion de sesion de la plataforma, y no imprime URLs con credenciales.
La skill `task-workflow` dice que se ejecute `taskctl doctor` al empezar en un proyecto, y se elimina `status` de la lista de comandos que no existen solo si hace falta para no confundir; README y CHANGELOG lo documentan.
Tests contra repos Git temporales reales: proyecto completo (todo ok), sin `tareas/`, sin `develop`, config invalida, tarea en carpeta equivocada, workspace sucio, y la salida `--json`; con el doble de `gh`/`glab` para la comprobacion de sesion.
````
