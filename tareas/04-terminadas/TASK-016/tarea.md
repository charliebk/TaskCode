---
id: TASK-016
titulo: "Brainstorm paralelo por roles con agente unificador"
tipo: feature
sprint: 3
etiquetas: []
complejidad: alta
modelo_sugerido: opus
estado: terminada
plan_aprobado: true
rama: feature/task-016-brainstorm-paralelo-por-roles-con-agente
asignado_a: charlie.bk@gmail.com
agente_revisor: typescript-reviewer
skills_recomendados: []
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-09-05
actualizado: 2026-09-08
dependencias: [TASK-010]
---
## Objetivo

Convertir `taskctl plan` de un scaffold de un solo fichero en el orquestador
determinista de la fase de diseño que describe la sección 6 de la metodología:
resolver sin LLM cuántos agentes de brainstorm entran y con qué rol, escribir
una petición por rol con el contexto ACOTADO A ESE ROL (sección 16.2), y la
petición del agente unificador que consolida las salidas en `plan-final.md`
señalando los desacuerdos en vez de promediarlos.

El CLI sigue sin invocar ningún modelo: hace lo determinista y deja las
peticiones escritas para que las dispare quien orquesta — exactamente el mismo
reparto que TASK-013 estableció en `taskctl review`. El número de agentes sale
del lookup de `scripts/heuristica-complejidad.yml` (D7), que hasta hoy no lee
nadie desde `src/`, y los roles, de los cuatro `agents/` que ese mismo item
redactó.

## Criterios de aceptacion
- [x] Lanza N agentes en paralelo, uno por rol (arquitectura, riesgos, testing, dominio), con el contexto acotado por rol de la sección 16.2 en vez de pasarles el repo entero.
- [x] Un agente unificador consolida las salidas en un único `plan-final.md`, señalando los desacuerdos entre roles en vez de promediarlos.
- [x] Sustituye al `plan` mínimo de TASK-010 sin romper su interfaz de línea de comandos ni la máquina de estados.
- [x] El número de agentes y la obligatoriedad del checkpoint humano salen de los puntos 1 y 2 de la sección 14.
- [x] Tests que no dependen de llamadas reales a agentes para el camino determinista (validación de estado, escritura de ficheros, límite de roles).

## Resultado

`taskctl plan` deja de escribir un scaffold y pasa a orquestar el brainstorm de
la fase de diseño. Resuelve **sin LLM** cuántos roles entran y cuáles, y escribe
en `planificacion/brainstorm/` una petición por rol con su contexto acotado, un
scaffold de salida por rol, y la petición del agente unificador. El CLI sigue sin
invocar ningún modelo: hace lo determinista y deja las peticiones escritas para
que las dispare quien orquesta — el mismo reparto que TASK-013 fijó para
`review`, y por el mismo motivo (un CLI que llama a un agente no se puede probar
sin uno).

Estrena `scripts/heuristica-complejidad.yml`, que desde D7 no leía nadie desde
`src/`, y añade el quinto agente del plugin (`brainstorm-unificador`), que los
artefactos mandaban lanzar y no existía.

**Suite: 630 → 747 tests** (744 verdes; los 3 rojos son los conocidos de Windows:
symlink EPERM, `chmod` sobre directorio en NTFS y CRLF).

### Decisiones tomadas con Carlos el 2026-09-08

1. **El número de roles es `max(declarado, heurístico)`**, topado por `hotfix`.
   Diverge de la §5 del YML, que manda consultar a un modelo barato cuando la
   distancia supera `tolerancia_niveles`: el CLI no puede llamar a ninguno.
   Documentado en la cabecera de `heuristica.ts`, junto con el hecho de que
   `tolerancia_niveles`, `tolerancia_extra_si_heuristica_menor` y
   `modelo_consulta_discrepancia` **se validan pero hoy no las lee nadie**.
2. **Checkpoint humano obligatorio para las cinco complejidades** (decisión #1 de
   la §14, que estaba tomada y sin aplicar). `TRIVIAL_SIN_APROBACION` se vacía —
   no se borra, para que reabrirlo cueste una línea. Lo sostiene un dato: de las
   4 tareas `simple` cerradas, **una escondía un CRÍTICO**.

### Puerta nueva

`plan` aborta si el `## Objetivo` está vacío y hay al menos un rol que lanzar.
Sin objetivo, N agentes devuelven N invenciones que el unificador consolida en un
plan **con autoridad** indistinguible de uno fundado. Con 0 roles el
comportamiento es idéntico al anterior, así que el cambio es no-breaking.
`taskctl new` avisa ahora de la precondición al crear, en vez de dejar que se
descubra al fallar.

No es hipotético: le pasó a esta misma tarea, cuyo objetivo estaba vacío — y de
paso hundió su puntuación heurística a `simple` frente al `alta` declarado.

### La revisión por pares: 5 rondas, 6 revisores, 8 CRÍTICOS

La más dura del proyecto. Todos los CRÍTICOS e IMPORTANTES corregidos y
verificados ejecutando el binario sobre clones limpios.

| Ronda | Revisores | Hallazgos |
|---|---|---|
| 1 | 3 en paralelo | 2 críticos, 6 importantes, 9 menores |
| 2 | 1 | 2 críticos, 1 importante, 3 menores |
| 3 | 1 | 1 crítico, 1 importante, 1 menor |
| 4 | 1 | 3 críticos, 1 importante, 1 menor |
| 5 | 1 | 2 críticos, 1 importante, 2 menores + 5 defectos de calidad |

**Lo que de verdad se lleva esta tarea no son los bugs, es el patrón**, y está en
`HALLAZGOS.md`: el mismo CRÍTICO —una planificación que acaba sin brainstorm, con
exit 0 y sin salida por ningún comando— se arregló **cuatro veces**, y las cuatro
el arreglo era correcto para el caso que tenía delante. Ninguno fue un descuido
de escritura: los cuatro salieron de un **modelo mental incompleto del estado que
puede tener una carpeta**. Lo que rompió la racha no fue un parche mejor sino
dejar de parchear: enumerar qué preguntas necesita responder la lógica, ver que
se estaban respondiendo todas desde una sola variable, y separarlas.

Dos reglas concretas que quedan escritas en el código:

- **La existencia de un nombre de fichero no es evidencia de que algo se
  completara.** `flag: 'wx'` crea el fichero *antes* de volcar el contenido.
- **La naturaleza del artefacto decide cómo se escribe.** Petición de rol y del
  unificador: derivadas, se regeneran. Scaffold de salida: puede llevar la
  respuesta de un agente, se tolera y nunca se pisa.

Y una sobre el método: **ninguno de los ocho CRÍTICOS se encontró leyendo el
diff.** Los ocho salieron de montar el estado a mano y ejecutar el binario. Un
revisor que solo lea el diff habría aprobado la ronda 1.

### Hallazgos MENORES documentados y NO corregidos

- `extraerSecciones` trunca el Objetivo en la primera cabecera `###` y ante un
  `##` dentro de un bloque de código. Verificado por dos revisores que **ninguna
  de las 32 tareas del repo lo dispara hoy**; el arreglo pide llevar la cuenta de
  las vallas de código al trocear, que es más parser del que esta tarea justifica.
- `##Objetivo` sin espacio, setext y `# Objetivo` (H1) dan objetivo vacío, y el
  mensaje dice que está vacío cuando la persona lo ve escrito.
- El YML acepta configuraciones que contradicen lo que él mismo declara
  (`umbral_criterios_aceptacion: 0`, un `agentes_brainstorm_hotfix` que vuelve
  inerte su propio tope, una serie no monótona).
- Dos rutas de error del parseo salen sin número de línea ni instrucción, porque
  vienen de `parseBloqueClaveValor`. Heredado de TASK-030; se nota más aquí
  porque este YML tiene ~200 líneas.
- Un testigo con otro *case* en un filesystem case-insensitive es invisible al
  contador pero bloquea la escritura, así que el CLI afirma haber escrito un
  fichero que no tocó. Exige un renombrado manual.
- Al relanzar por subida de roles, una salida ya respondida de la ronda anterior
  queda huérfana y nadie avisa.

### Datos medidos, que valen más que los hallazgos

Ejecutando la heurística contra las 32 tareas reales:

- Declarado y heurístico **coinciden en 7 de 32**; la heurística solo **cambia el
  número de roles en 4**.
- **Cero tareas disparan una palabra de alto riesgo.** La señal más cara del YML
  no se activa nunca.
- **Ninguna tarea acaba con 0 roles** (reparto 14/14/4), así que el "0 en
  trivial" del YML es prácticamente inalcanzable con la regla del máximo.
- **TASK-017 a TASK-023 tienen el `## Objetivo` vacío**, así que la puerta nueva
  las bloquea hasta que se redacte. Es un muro que aparece el lunes.

### Lo que esta tarea NO cierra

El troceado de contexto que pide la §16.2 sigue pendiente de D2: hoy los cuatro
roles reciben el enunciado íntegro y lo que los diferencia son su pregunta, sus
listas de "qué miras / qué NO miras" y sus entregables. Un revisor lo midió: dos
peticiones son **85% idénticas carácter a carácter**, y lo que de verdad las
separa son los entregables, que fuerzan salidas estructuralmente distintas. Es
suficiente por ahora, pero el `contexto.md` que la §16.2 quiere trocear todavía
no existe.

**La última tanda de correcciones (ronda 5) no tiene revisión independiente.**
Decisión consciente de Carlos con el coste delante.
