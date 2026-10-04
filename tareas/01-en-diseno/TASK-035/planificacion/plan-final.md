# Plan — TASK-035: Politica de rondas y una sola suite por ronda en las skills

**Desviacion documentada:** `plan` pidio 1 rol (heuristica `simple` frente a
`trivial` declarada, y manda el maximo). No se lanza: el contenido ya esta
decidido en A3 y A4 (auditoria del 2026-10-03, aprobadas por Carlos) y no hay
diseno que explorar. Lo redacta el orquestador.

## Enfoque propuesto

- `skills/task-workflow/SKILL.md`, parrafo **Rondas**: sustituir «dos rondas es
  normal» por A3. Una ronda sin CRITICO ni IMPORTANTE abiertos cierra la
  tarea; los MENOR corregidos no abren ronda 2 (basta suite en verde y commit
  de correccion, anotado en el Resultado); la ronda 2 solo se pide si se
  corrigio un CRITICO o IMPORTANTE, y revisa el delta y esos hallazgos.
- Las 4 revisoras: la puerta de la suite y la linea base son **la misma**
  ejecucion de la suite completa, una por ronda; los mutantes se ejecutan con
  `node --test <fichero de test concreto>` (o el equivalente del lenguaje: el
  test o la clase de test concretos). Con varios revisores en paralelo sobre
  la misma maquina, concurrencia de la suite reducida.
- En `angular-vue` y `java-spring`, el parrafo «dos rondas es lo normal» pasa a
  remitir a la misma politica.
- Diff minimo: cambiar frases, no reestructurar (eso es TASK-048).

## Riesgos aceptados y que los contiene

- Una ronda cierra mas tareas con MENOR sin revisar su correccion: lo contiene
  que la correccion pase la suite y quede anotada en el Resultado.
- Las skills viajan a otros proyectos: los tests de «no mencionar el proyecto»
  lo vigilan; los ejemplos de mutante no nombran ficheros de este repo.

## Plan de pruebas

- `node --test dist/test/skills/*.test.js` en verde (estructura, tamano, marcas
  prohibidas).
- `grep` de «Dos rondas es lo normal» y «suite entera» en las 5 skills: sin
  restos contradictorios.

## Lo que necesita decision de una persona

Nada: A3 y A4 ya estan decididas.
