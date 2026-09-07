# Plan final — TASK-028 (item C5)

## Objetivo

Escribir la primera skill del plugin, `skills/task-workflow/SKILL.md`, que le
explique a un agente de Claude Code como se trabaja con esta metodologia: el
ciclo de vida de una tarea, los comandos reales de `taskctl` y las reglas de
proceso que no son negociables.

Hoy el plugin **no expone ninguna skill**: todo el discurso de la metodologia
sobre "el agente sabe que hacer" no esta respaldado por ningun artefacto.

## Las dos formas de fracasar, y como las cerramos

Esta tarea es corta en lineas y peligrosa en contenido.

1. **Que la skill mienta.** Un flag inventado o un estado mal ordenado
   convierte la skill en una fuente de errores *con autoridad*: el agente se
   la cree. La investigacion previa saco la superficie del CLI **del codigo**,
   no del README ni de la metodologia, y encontro tres divergencias que la
   skill NO debe heredar (ver D6).
2. **Que no cargue.** Si el frontmatter no cumple lo que Claude Code espera,
   la skill es un fichero muerto y nadie se entera: el fallo es *silencioso*
   — con el YAML roto la skill sigue invocandose a mano pero no auto-dispara
   nunca, porque no hay `description` que casar. Por eso el criterio de
   aceptacion no es "el fichero existe" sino "Claude Code la descubre",
   verificado ejecutando su propio validador.

## Decisiones tomadas (con su motivo)

### D1 — Ubicacion: `skills/task-workflow/SKILL.md` en la raiz del plugin

Es lo que documenta la referencia de plugins y lo que hacen 35 de 35 skills
instaladas en esta maquina. **No se declara en `plugin.json`**: el directorio
`skills/` se escanea siempre. Ojo a la trampa: los directorios de componentes
van en la raiz del plugin, **nunca** dentro de `.claude-plugin/`.

### D2 — Frontmatter minimo: solo `name` y `description`

Claude Code acepta una tabla larga de campos, pero el spec portable (el que
valida `quick_validate.py`, el camino de empaquetado) **rechaza con error
duro** cualquier campo fuera de `name, description, license, allowed-tools,
metadata, compatibility`. Nos quedamos en la interseccion: valida por los dos
caminos.

En particular **sin `version:`**, aunque los plugins de Anthropic lo usen: la
documentacion dice que ese campo no existe, Claude Code lo ignora, y rompe el
empaquetado portable. La version del plugin ya vive en `plugin.json`.

`name` coincidira con el nombre de la carpeta. No es obligatorio, pero en una
skill de plugin `name` es lo que fija el comando de invocacion, asi que si no
coinciden la carpeta dice una cosa y `/taskcode-plugin:task-workflow` otra.

### D3 — La `description` es el unico mecanismo de activacion

No participan ni el nombre del fichero ni el cuerpo. Llevara frases-gatillo
literales entrecomilladas ("crear una tarea", "revisar por pares", "cerrar una
tarea", TASK-NNN, taskctl), el caso de uso principal primero (el listado
trunca a 1.536 caracteres) y sin los signos de menor y mayor, que el spec
prohibe.

### D4 — Un solo fichero, sin `references/`, por debajo de 500 lineas

La recomendacion oficial son menos de 500 lineas y 1.500-2.000 palabras. El
cuerpo de una skill **persiste en contexto el resto de la conversacion**, asi
que ser breve no es estetico, es economico. Si al redactar no cabe, se parte a
`references/` — pero entonces cada enlace relativo tiene que apuntar a un
fichero que exista, y eso se comprueba con un test.

### D5 — Que viaja y que no

La skill se distribuye a proyectos que **no son este**. Se queda fuera todo lo
especifico de TaskCode: el checklist de 42 items, `docs/contexto/*`, la
paradoja de bootstrapping, "cero dependencias de runtime", los nombres de
helpers internos, `npm test`. Viaja la **regla**, no la instancia: en vez de
"marca la casilla en CHECKLIST_TERMINACION.md", "actualiza el registro de
progreso que use el proyecto".

Zona gris resuelta: la rama base **no se hardcodea** como `develop` (es
configurable, hay repos con `master`), y la politica de no borrar ramas se
presenta como "si tu repo la tiene activada", que es lo que es: un flag.

### D6 — Las divergencias codigo/metodologia se resuelven a favor del codigo

La skill documenta **lo que el CLI hace hoy**, no lo que la metodologia
prometio. Las tres que importan:

- **`taskctl codex-review` NO EXISTE.** Esta modelado en la maquina de
  estados, aparece en la tabla de la seccion 8 de la metodologia y `finish` ya
  lee `informe-codex-N.md`, pero `cli.ts` no lo despacha. La skill no lo
  menciona como comando, y **avisa** de que poner `revision_codex: true` deja
  la tarea imposible de cerrar: `finish` exigira un informe que ningun comando
  genera.
- **El guard de la seccion 8.3 solo lo aplican 4 comandos** (`new`, `import`,
  `plan`, `approve`). `start`, `review` y `finish` solo comprueban workspace
  limpio. Y con el workspace limpio **cambia de rama en silencio**, no da el
  error que muestra la metodologia.
- **`plan` no es multi-agente.** Ni brainstorm en paralelo, ni gatekeeper, ni
  seleccion de skills: mueve la tarea y escribe un scaffold vacio.

## Contenido del SKILL.md

1. **Cuando aplica** — como reconocer un proyecto que usa esta metodologia.
2. **El ciclo de vida**: tabla estado a comando a carpeta, con las
   precondiciones de cada transicion.
3. **Los comandos reales**, con su firma exacta y sus valores por defecto.
   Incluye la lista de **lo que no existe**, para que el agente no lo invente.
4. **Las reglas irrenunciables**, cada una con su porque. Una regla sin motivo
   se ignora.
5. **La revision por pares**: independencia, reproduccion empirica, mutacion,
   clasificacion CRITICO/IMPORTANTE/MENOR y que hacer con cada clase.
6. **La linea del veredicto, literal.** `finish` la parsea fail-closed: el
   valor debe *empezar* por `aprobada`, asi que `**APROBADO**` falla por los
   asteriscos y `aprobado` falla por la vocal. Ya costo un commit de
   normalizacion en TASK-026. La skill da la linea a copiar y dice que el
   matiz va en el cuerpo del informe.
7. **Las trampas** que cuestan tiempo real, generalizadas: `bash script.sh`,
   `logs/gitflow/` en el `.gitignore`, la herramienta no commitea lo que
   genera, stdin sin TTY, un clon no hereda `dist/` ni identidad Git.

## Tests

Cero dependencias: se reutiliza el parser de frontmatter que ya existe en el
proyecto.

**Estructurales (corren siempre, tambien en el CI de Linux):**

- El fichero existe en la ruta exacta, con ese nombre y esas mayusculas.
- Empieza **exactamente** por los tres guiones: sin BOM (primer byte distinto
  de 0xEF), sin linea en blanco delante. Si esa marca no esta en la primera
  linea, el frontmatter no se parsea y el fichero entero se trata como cuerpo
  — y es una trampa clasica en Windows.
- El frontmatter parsea a objeto y tiene `name` y `description`.
- `name` en kebab-case, maximo 64 caracteres, **y coincide con el directorio**.
- `description` no vacia, maximo 1024 caracteres, sin los signos de menor y
  mayor.
- Las claves del frontmatter son un subconjunto del spec portable — en
  particular **prohibe `version`**.
- Cuerpo no vacio y de 500 lineas como mucho.
- Sin rutas absolutas de maquina.
- Todo enlace relativo del cuerpo apunta a un fichero que existe.
- `plugin.json`: sin clave `bin`, y `commands`/`skills` nunca un objeto (la
  regresion de TASK-006, que impedia cargar el plugin entero).
- Ningun directorio de componentes dentro de `.claude-plugin/`.

**De integracion (evidencia empirica, se salta si `claude` no esta en PATH):**

- `claude plugin validate <plugin>` sale 0.
- Su salida contiene la linea que confirma que valido la skill. **Esta es la
  comprobacion de mas valor de toda la tarea**: es la unica que demuestra que
  Claude Code *descubre* la skill en la ruta elegida, en vez de suponerlo.

Los estructurales replican a proposito las reglas que el validador aplica, para
que la red de regresion exista tambien donde `claude` no esta instalado: un
test que solo se salta no protege de nada.

Cada test se verificara por **mutacion**: romper lo que dice cubrir y
comprobar que se pone rojo.

## Fuera de alcance

- Las otras 4 skills del catalogo (`java-spring-reviewer`, etc.) — Fase D.
- El catalogo determinista de skills (TASK-017) y `.taskcode/config.yml` (C4).
- Implementar `codex-review`.

## Trabajo adicional propuesto (decision de Carlos)

`CLAUDE.md` esta desfasado en dos puntos verificables: dice que `npm test`
corre **226 tests** (hoy 429) y que **`review` y `finish` todavia no existen**,
cuando se cerraron en TASK-013 y TASK-014. Importa aqui porque es la fuente
mas tentadora para redactar la skill. Son dos lineas; se propone corregirlas
en esta tarea. Si se prefiere no mezclarlo, se documenta y se abre item aparte.

## Riesgo asumido

La skill no se puede probar de verdad —que Claude Code la dispare sola ante la
frase adecuada— sin una sesion interactiva. Lo que si se prueba es que el
fichero es valido y que **el validador oficial la descubre**. La calidad de la
`description` como gatillo es un juicio, no un test, y asi se dira en el
Resultado.
