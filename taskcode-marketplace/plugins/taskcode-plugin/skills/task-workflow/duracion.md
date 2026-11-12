# Regla de una hora: estimar y trocear

Una tarea prevista de **mas de una hora de punta a punta** (de la rama abierta
al cierre con merge, revision y verificacion incluidas) se parte en varias.
Las tareas grandes alargan las rondas de revision y la verificacion; las
pequenas cierran antes y se revisan mejor.

## Cuando y quien

- **Al planificar** se estima. `plan-final.md` lleva la linea
  `Duracion estimada: N min` bajo «Enfoque propuesto», con sus senales.
- **En approve** decide una persona. Con mas de 60 min, o con una cifra que
  no se entiende (`1h30`, `~90`, `90-120`), `taskctl siguiente` devuelve
  `preguntar` en cualquier modo y `taskctl approve --decidido-por automatico`
  se rechaza. La persona elige: trocear, o aprobar entera con el motivo
  escrito en el plan. Sin la linea, `approve` solo avisa.
- **En finish** se mide. `tarea.md` gana `## Duracion` con la estimada y la
  real de punta a punta (de `start` a `finish`, sin pausas). `taskctl
  metricas` las muestra (`estimada`, `punta_a_punta`), para calibrar la
  estimacion con datos y no a ojo.
  La fila `finish` marca el **fin** del cierre (tras la verificacion completa
  y el merge), asi que la medida incluye lo que tarda la verificacion;
  `## Duracion` anota ademas `- Cierre (finish): <s> s, de <inicio> a <fin>`
  y `metricas` la columna `finish` (`—` sin dato). Las tareas cerradas con
  versiones anteriores llevan en esa fila el arranque del comando.

## Como estimar: las senales

La mejor senal medida es el **numero de ficheros de codigo** que la tarea va
a tocar (en dos proyectos reales: con 1 a 10 ficheros de codigo, la mitad de
las tareas cerro en una hora; con 11 o mas, solo una de cada seis). Despues,
el numero de capas que toca (datos, backend, frontend, herramientas) y, con
menos peso, el de criterios de aceptacion. Si hay que investigar algo antes
de saber como hacerlo, eso va primero en su propia tarea corta.

## Como trocear

- **Una porcion vertical pequena**, mejor que dos mitades que no se prueban
  solas: un comportamiento completo pero minimo, que cruza las capas que
  necesite.
- **Por capas solo si cada parte se verifica sola**: la migracion con su
  test, y despues el backend que la usa. Anadir un campo y mapearlo (dos o
  tres ficheros) no se parte.
- Cada tarea nueva lleva sus propios criterios comprobables y sus
  dependencias (`dependencias` en el frontmatter), para que el orden quede
  claro.

## Limites de la medida

- La cifra es un **entero de minutos** (`Duracion estimada: 90 min`). «2 horas»,
  «1 h 30» o «90-120» no se adivinan: cuentan como no entendidas y se pregunta.
- La duracion real descuenta solo las pausas registradas con `taskctl pausa`.
  Los wrappers `pause` y `resume` de Git-Flow no escriben fila: una noche de
  pausa hecha con ellos cuenta como trabajo y sesga la calibracion. Para parar
  una tarea, usa `taskctl pausa`.
