# Brainstorm — TASK-085, rol riesgos (ronda 1)

- Rol: `brainstorm-riesgos`
- Agente: aa5ddc57d52c649a3

## Modos de fallo, ordenados por gravedad, con el escenario concreto de cada uno

1. **Sobrecuenta silenciosa de implementación** — una sesión principal abarca varias tareas y fases (tareas consecutivas en una sesión por sprint; el diseño de la misma tarea en la misma sesión; vuelta de `en-revision` a `en-curso`). El primer Stop tras `start`, sin línea base, suma TODA la transcripción (tareas anteriores, diseño, orquestación de la revisión). El objetivo era corregir una infravaloración y se sustituye por una sobrevaloración que nadie ve (`metricas` solo avisa de filas repetidas y de un desglose negativo). → Fijar una base por sesión cada vez que la tarea ENTRA en `en-curso` y sumar solo el delta desde esa base.
2. **Estado atascado: tarea.md escrito pero sin commitear** — `writeFile` (registrar-coste.ts:536) va bien y `autoCommit` falla por `index.lock`: el agente o los subagentes paralelos hacen git en la misma rama, o varios `SubagentStop` llegan casi a la vez (brainstorm, implementadores en paralelo). A partir de ahí cada `registrar-coste` aborta con «tarea.md tiene cambios sin commitear» (registrar-coste.ts:466) y los guards de workspace limpio de `finish`/`import` abortan. → No dejar nunca escrito sin commitear (o no commitear desde el hook) y serializar con un cerrojo propio.
3. **Actualización perdida entre dos hooks simultáneos** — dos `SubagentStop` leen el mismo tarea.md, los dos escriben y el segundo pisa la fila del primero: `tokens_implementacion` y la tabla `## Coste` se descuadran, o se pierde un agente sin que nadie se entere. → Leer, modificar y escribir bajo cerrojo exclusivo, con reintento acotado y abandono silencioso.
4. **Rompe el memo del freno Stop** — `huellaDelArbol` mete HEAD y los ficheros sucios en la huella (fs/verificacion.ts:89-101); cada commit o escritura del hook la cambia, y los hooks del mismo Stop corren en paralelo. El siguiente Stop vuelve a ejecutar `comando_verificacion` entero (aquí `npm test`, unos 10 min) en cada turno, y sale el falso aviso «la propia verificación ha cambiado ficheros» (freno-stop.ts:187). → Que lo que escriba el hook no altere la huella del árbol, o coordinarlo con el freno.
5. **Cadena abierta** — `registrar-coste` está en `GUARDADOS_POR_CADENA` (cadena.ts:192) y exige `--cadena <testigo>`; el hook no lo tiene. En modo automático, justo donde nadie registra a mano, el hook aborta siempre; y si se salta la guarda, rompe el cerrojo entre sesiones que la cadena existe para dar. → Decidir de forma explícita cómo convive con la cadena; no heredarlo sin mirarlo.
6. **El hook bloquea o pesa** — una salida 2 en Stop bloquea al agente; `autoCommit` lanza el `comando_sincronizacion` del proyecto (git-commit.ts:208) en cada turno; si vence el timeout del hook, mata el proceso a mitad del `writeFile` (que no es atómico): tarea.md truncado, tarea ilegible para board y freno, o un comando del usuario ejecutado en cada turno. → Salir siempre con 0, escritura atómica (temporal + rename), sin sincronización y con un interruptor de entorno como `FRENO_VERIFICACION`.
7. **Doble cuenta con las skills actuales** — start/SKILL.md:29-34 sigue mandando `registrar-coste --fase implementacion --agente <id>`, y `yaAnotado` es por fase (registrar-coste.ts:213). Si el hook ya registró ese agente, la llamada manual aborta con «no ha crecido» y el agente se confunde; un agente que el hook apuntó a implementación y después se registra en revisión cuenta dos veces. → Actualizar las skills en el mismo cambio y comprobar el id en todas las fases antes de sumarlo.

## Estados intermedios y fallos parciales

Cubiertos en los modos 2, 3 y 6: escritura sin commit, actualización perdida por concurrencia y proceso muerto por timeout a mitad de escritura.

## Compatibilidad hacia atras

- Plugins anteriores que lean filas nuevas (una fuente de sesión, porque un UUID con guiones no pasa `esAgentIdValido`, `/^[0-9a-f]{6,64}$/`): `leerCostes` acepta cualquier fuente no vacía; como mucho `resumirCostes` avisa de «repetidas». Avisa, no corrompe. Descartado a propósito como riesgo.

### Descartado a propósito

- Rellenar a posteriori las 97 tareas de ToolsaWeb — fuera de los criterios: las transcripciones viejas no se pueden atribuir a una tarea con fiabilidad.
- El coste de recorrer `~/.claude/projects` en `buscarTranscripciones` en cada disparo — es rendimiento y le toca a arquitectura; aquí solo cuenta como disparador del timeout del riesgo 6.

## Vuelta atras

Puntos sin retorno:

- Los commits del hook en la rama de la tarea — el merge `--no-ff` los lleva a develop y las ramas no se borran (política IECA): ese ruido queda en el historial para siempre; revertir corrige totales, no historia.
- `tokens_implementacion` sobrecontado en tareas que ya se cerraron — una fila no dice qué parte de la sesión era de otra fase o de otra tarea, salvo que guarde su base y su rango; sin eso no se puede corregir con un script, solo a mano (y coste.md dice que la tabla no se edita a mano).
- Distribución por marketplace — los proyectos que actualicen ejecutan el hook en cada turno de TODOS sus repos hasta la siguiente versión; sin interruptor, desactivarlo exige otra versión publicada.

## El riesgo que mas te preocupa (UNO solo)

La sobrecuenta silenciosa (modo 1): sin una base por entrada en `en-curso`, la cifra no vale para nada.

### Desacuerdos previstos

- Arquitectura — reutilizar `runRegistrarCosteCommand` tal cual, con un commit por turno — en contra: choca a la vez con el freno (4), con la cadena (5), con `index.lock` (2) y con la sincronización (6). El hook no debería commitear en cada turno.
- Dominio — si lo que gasta el orquestador fuera de `en-curso` cuenta como implementación — que decida dominio.
- Arquitectura — una fila por turno en `## Coste` (cientos por tarea) — se rompe por volumen; preferible acumular y volcar en pocas filas.

### Suposiciones no verificadas

- Claude Code ejecuta en paralelo los hooks del mismo evento (los dos de Stop) — confirmarlo en la documentación de hooks o con una sonda como `hooks/sonda-hooks.mjs`.
- Stop trae `session_id` y `transcript_path`, y SubagentStop trae `agent_id`/`agent_transcript_path` solo en versiones recientes — spike al estilo de TASK-069 con la versión instalada.
- Al disparar Stop, la transcripción puede no tener aún el último mensaje del asistente, y el último turno antes de `review`/`finish` se perdería — comprobarlo con una sonda.
- `--resume` o `/compact` podrían crear otro fichero de sesión que copia el historial; en ese caso una base por sesión cuenta doble — mirar `~/.claude/projects/<proyecto>/` antes y después de reanudar.
- Las 97 tareas sin coste serían las implementadas sin subagentes (start/SKILL.md:34: «Sin subagentes, no registres nada») — no comprobado en ToolsaWeb; confirmarlo con `taskctl metricas --json`.
