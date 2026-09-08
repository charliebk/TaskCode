# Informe de revision — TASK-016 (ronda 1)

- Commit revisado: 154368d
- Revisores: tres agentes independientes, en paralelo, con angulos distintos
  (A: correccion y maquina de estados · B: la heuristica y sus datos ·
  C: el contenido generado y el contrato del plugin)
- Veredicto: cambios-solicitados

Los tres montaron su propio clon, ejecutaron la suite y construyeron el caso
que rompe el codigo antes de reportarlo. Los dos CRITICOS los encontraron **dos
revisores por separado**, cada uno por su camino.

Linea base coincidente en los tres: 712 tests, 709 pass, 3 fail — los tres
rojos conocidos de Windows (symlink EPERM en `approve`, `chmod` sobre
directorio en NTFS y CRLF, ambos en `plan`). Ningun cuarto rojo.

## CRITICO 1 — una ronda a medias desactivaba el brainstorm para siempre

**Quien:** revisor A. **Estado: corregido y verificado.**

`plan` escribe N peticiones + N scaffolds + la del unificador en serie. Si el
proceso muere entre dos escrituras (Ctrl+C, antivirus, disco lleno), queda un
resto. La ronda se deducia de **los tres tipos de fichero**, asi que ese resto
la subia a 2: la **primera** planificacion de la tarea se tomaba por
re-planificacion, no escribia ni una sola peticion de rol, movia la tarea a
`en-diseno`, commiteaba, salia con **exit 0** y anunciaba una re-planificacion
que nunca habia ocurrido. Cada `plan` posterior repetia el diagnostico, asi que
no se salia con ningun comando: habia que borrar la carpeta a mano.

Lo que hace grave el fallo es que el invariante **ya estaba escrito** en el
propio codigo — *"la peticion del unificador se escribe siempre la ultima; es el
testigo barato de que el brainstorm se escribio entero"* — y **nadie leia ese
testigo**. Un invariante documentado y no aplicado es peor que no tenerlo: se
lee, se cree, y no protege.

Segundo disparador, misma raiz: `siguienteRonda` comparaba nombres de `readdir`
sin comprobar que fueran ficheros, asi que un **directorio** llamado
`peticion-unificador-1.md` producia lo mismo.

Corregido: la ronda sale **solo** del fichero del unificador
(`RONDA_UNIFICADOR_RE`), y una ronda a medias se **reintenta** con el mismo
numero, tolerando lo ya escrito y sin pisarlo (`escribirSiNoEstaYa`). Fijado
con test y con la mutacion verificada a mano.

## CRITICO 2 — en re-planificacion el unificador apuntaba a salidas inexistentes

**Quien:** revisores A y C, por separado. **Estado: corregido y verificado.**

En ronda ≥2 los roles no se relanzan a proposito, asi que sus salidas siguen
llevando el numero de la ronda en que corrieron. La plantilla componia la lista
con la ronda **en curso**, de modo que `peticion-unificador-2.md` mandaba
consolidar `salida-<rol>-2.md`, que no existe ni existira.

El efecto no es un enlace roto: la propia peticion instruye al unificador a
*"seguir adelante con las que haya y escribir cual falto"*, asi que con los tres
punteros rotos concluye que **se perdio el brainstorm entero** y redacta el plan
sin el, teniendolo al lado sin leer. Y el CLI afirmaba por pantalla justo lo
contrario: *"reprocesa las salidas de la ronda anterior"*.

Como señalo el revisor C, el autor **habia detectado esta misma clase de error**
unas lineas mas abajo, para las rutas devueltas en `PlanCommandResult`, y no lo
aplico dentro de la plantilla.

Corregido separando dos conceptos que eran la misma variable: *ronda en curso* y
*ronda de las salidas a consolidar*. Test con la asercion que muerde — toda
salida que la peticion nombre tiene que existir en disco — y mutacion verificada.

## IMPORTANTES

1. **`ENOTDIR` sin absorber en `siguienteRonda`** (revisor A). Una ruta ocupada
   por un fichero salia como traza cruda de Node, sin `[ERROR]` y sin que el CLI
   la capturase. Reabria el fix que TASK-027 ya habia pagado, con el mismo
   razonamiento escrito tres modulos mas alla. **Corregido.**

2. **No existia `agents/brainstorm-unificador.md`** (revisor C) pese a que los
   artefactos generados mandan lanzar ese agente por su nombre, y a que el
   titulo de la tarea es *"con agente unificador"*. **Corregido**: escrito el
   quinto agente, y el test que vigila `agents/` pasa a distinguir "los cuatro
   roles" de "los cinco agentes" sin perder la deteccion de un rol no declarado.

3. **La peticion de ronda ≥2 era byte a byte la de la ronda 1** salvo el numero
   (revisor C): no mencionaba el plan ya redactado, ni donde estaba, ni que
   habia feedback que incorporar. La §16.3 pide exactamente eso, asi que el
   ahorro de no relanzar los roles no compraba nada: un unificador obediente
   rehacia el mismo plan. **Corregido** con un bloque propio de
   re-planificacion.

4. **Con un solo rol se pedian desacuerdos imposibles** (revisor C). Con N=1 no
   puede haber discrepancia, pero la peticion exigia señalarlas y ademas
   trataba la unanimidad como alarma. No es un borde: **14 de las 32 tareas del
   repo resuelven un solo rol**, asi que la alarma habria saltado en casi la
   mitad de los planes — y una alarma que salta siempre deja de significar nada,
   que es justo lo que arruinaria el criterio de aceptacion 2. **Corregido**:
   tres formas distintas de la peticion (0, 1 y varios roles), y con un rol se
   pide lo unico util, que es señalar **que quedo sin cubrir**.

5. **`skills/task-workflow/SKILL.md` desactualizada en dos puntos** (revisor C),
   y es lo unico que un agente lee en un proyecto que no es este: describia el
   `plan` anterior (sin brainstorm, sin la puerta del objetivo) y afirmaba una
   exencion de checkpoint para `trivial`/`simple` que esta misma tarea elimina.
   **Corregido**, con tests que atan la skill al codigo en vez de a su forma.

6. **Un agujero en los tests, no en el codigo** (revisor B). La mitad *"o en los
   criterios de aceptacion"* de la señal mas cara del YML no la cubria nadie:
   mutar el codigo para ignorar los criterios dejaba **la suite entera en
   verde**. El unico test que ponia una palabra de riesgo en los criterios la
   ponia tambien en el objetivo, asi que no distinguia "el dedup funciona" de
   "los criterios se ignoran del todo". Es el patron exacto que TASK-032 enseño
   a buscar. **Corregido** con un test con la palabra solo en los criterios, y
   la mutacion verificada.

## MENORES corregidos

- El regex de ronda dejaba de casar con ids de rol que llevaran guion o digito
  (`brainstorm-datos-externos`), rompiendo la numeracion en silencio (A).
- Gramatica de la salida generada: *"se lanzan 1, el mayor"*, *"Se lanzan 1
  roles"* (C). Es texto versionado y que lee un agente.
- No habia guard de fugas sobre las plantillas de `plan-brainstorm.ts`, cuando
  si lo hay para `skills/` y `agents/` (C). Estaban limpias; ahora hay un test
  que impide que dejen de estarlo.
- **Un dato falso, y era mio** (C): el comentario que justifica vaciar
  `TRIVIAL_SIN_APROBACION` afirmaba que *"no hay ni una sola tarea trivial"*.
  Hay una, TASK-005. El dato venia de `CHECKLIST_TERMINACION.md`, que **se
  contradecia a si mismo** — lo afirmaba en negrita y dos lineas mas abajo decia
  "1 `trivial` sin cerrar" — y era el argumento con el que se descarto D4. Lo
  correcto es "ninguna tarea `trivial` **cerrada**". Corregido en los dos
  sitios. La decision no cambia, porque la sostiene el CRITICO que escondia una
  de las 4 `simple`, pero un argumento falso no se hereda aunque lleve a la
  conclusion correcta.

## MENORES documentados y NO corregidos

- **`extraerSecciones` trunca el Objetivo en la primera cabecera `###`, y
  tambien ante un `##` dentro de un bloque de codigo** (A y B, por separado).
  Comprobado por ambos que **ninguna de las 32 tareas del repo lo dispara hoy**.
  Es deuda latente y el arreglo (llevar la cuenta de las vallas de codigo al
  trocear) es mas parser del que esta tarea justifica.
- **La puerta del objetivo no aplica con 0 roles** (A). Es la decision que hace
  el cambio no-breaking, y con la regla del `max` ninguna tarea real llega a 0.
- **`##Objetivo` sin espacio, setext y `# Objetivo` (H1) dan objetivo vacio** y
  el mensaje dice que esta vacio cuando la persona lo ve escrito (A). Las tres
  son formas validas de Markdown; la primera no lo es como cabecera ATX.
- **Configuraciones incoherentes que el YML acepta** (B):
  `umbral_criterios_aceptacion: 0` cobra a toda tarea, `agentes_brainstorm_hotfix: 9`
  vuelve inerte el tope, y una serie no monotona pasa la validacion. Son
  ficheros que contradicen lo que el propio YML declara; validarlos es apretar
  el contrato del fichero, no de esta tarea.
- **Dos rutas de error del parseo salen sin numero de linea ni instruccion** (B),
  porque vienen de `parseBloqueClaveValor`, que solo recibe el mensaje. Es
  heredado de TASK-030; se nota mas aqui porque este YML tiene ~200 lineas.
- **Reglas sin test** que sobreviven a su mutacion con 100% de cobertura de
  lineas (B): "si la cabecera sale dos veces manda la primera", y la
  normalizacion aplicada al lado de la lista de palabras. Buen recordatorio de
  que la cobertura no es la medida.
- **No hay forma documentada de relanzar un brainstorm** desde cero (A): hay que
  borrar la carpeta entera a mano. Tras corregir el CRITICO 1 ya no se llega
  ahi por accidente, pero sigue sin haber camino deliberado.

## Datos que la revision midio, y que valen mas que los hallazgos

- **Los tres numeros publicados sobre el `max` son ciertos** (B los reprodujo):
  declarado y heuristico coinciden en 7/32, **cero** tareas disparan una palabra
  de alto riesgo, y ninguna acaba con 0 roles (reparto 14/14/4).
- **La heuristica solo cambia el resultado en 4 de 32 tareas** (B). En 21 manda
  el nivel declarado por la persona y en 7 coinciden. Es la medida de cuanto
  trabajo hace hoy el YML: poco.
- **Las peticiones de dos roles son un 85% identicas caracter a caracter** (C).
  Lo que las diferencia de verdad no son las viñetas de "que miras" sino los
  **entregables**, que fuerzan salidas estructuralmente distintas. Su juicio:
  suficiente por ahora, pero el troceado de contexto que pide la §16.2 sigue
  pendiente de D2, porque el `contexto.md` que habria que trocear aun no existe.
- **7 tareas reales quedan bloqueadas por la puerta del objetivo** (A y C):
  TASK-017 a TASK-023 tienen el `## Objetivo` vacio. Es el comportamiento
  buscado y el error es accionable, pero es un muro que aparece el lunes.
- La suite mata **20 de las 23 mutaciones** que le lanzo B, y `heuristica.js`
  queda al 99,5% de cobertura.
