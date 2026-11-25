# Informe de revision — TASK-150a (ronda 1)

- Commit revisado: 1cf8900c8f0d7634a6b659f5b195351bb337a24a
- Revisor: code-quality-reviewer
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| IMP-1 | IMPORTANTE | corregido | taskcode-marketplace/plugins/taskcode-plugin/skills/rust-wasm-reviewer/SKILL.md:36 (y :102) | implementacion |
| MEN-1 | MENOR | aceptado | taskcode-marketplace/plugins/taskcode-plugin/skills/angular-vue-reviewer/SKILL.md:357 (java-spring-reviewer/SKILL.md:219, rust-wasm-reviewer/SKILL.md:379) | plan |
| MEN-2 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/skills/csharp-autocad-ifc-reviewer/SKILL.md:3 | implementacion |
| MEN-3 | MENOR | corregido | taskcode-marketplace/plugins/taskcode-plugin/skills/task-workflow/sincronizacion.md:34 | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

### Que se ejecuto

- Clon en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-150a-r1` en el commit revisado; `npm install` y `npx tsc -p .` sin errores (puerta de build). No hay linter ni formateador configurado en el plugin que cubra los `.md`: no se ejecuto ninguno.
- Suite: la peticion trae la verificacion selectiva en verde (2064 tests, 0 fallos) con `Commit verificado` igual al `Commit revisado`; se cita y no se repite. Solo se corrieron los ficheros de test de lo revisado: `fuente-unica`, `lo-que-lees`, `crecimiento-suite` (20 tests, 0 fallos), y `task-workflow` y `tamanos` (32 tests, 0 fallos; ahi esta el test de que los .md instalables no arrastran marcas de este repo).
- Contraste texto-codigo: `config.ts:101-109` (valor invalido aborta, clave desconocida avisa y se ignora) y `sincronizacion.md:36-38`, coinciden. `finish.ts:421-428` (`casillasSinMarcar`, `onAviso`, no bloquea) y `cierre.md:62-63`, coinciden. `git-commit.ts:210-227` (`autoCommit` sincroniza siempre que haya rutas del comando, y `fases_sincronizacion` solo filtra por fase): el texto «todo comando que hace un commit automatico» es cierto, hay 17 llamadores. `revisores.ts:150-190` (el reparto solo mira `patrones_archivo`): ya no hay «la tarea menciona» en ninguna descripcion.
- Busqueda de todos los sitios, por nombre y por patron, en `skills/`, `agents/`, `docs/` y README del plugin y raiz (`git grep`): clave mal escrita, «no lee las casillas», test duplicado MENOR, pedir/pedirlo/pidelo/pide, menciona, tres claves, ocho comandos, trampa de foco, numerales de claves y comandos. Resultado: solo queda lo de IMP-1 y MEN-1. El resto de menciones a una clave desconocida (`task-workflow/SKILL.md:190`, `finish/SKILL.md:127`, `docs/comandos.md:30`) ya decian lo correcto; `docs/cierre-y-release.md:31` habla de la plataforma remota, que si aborta, y es otra regla.
- Mutacion: 13 mutantes que devuelven la frase vieja (clave mal escrita aborta, «Tres claves», «ocho comandos», «no lee las casillas», test duplicado MENOR en `tests-pesados.md` y en `review/SKILL.md`, «pedirlo explicitamente» en angular-vue, quitar la remision a «Lo que lees» en java-spring, «pidelo si un hallazgo» en C#, «la tarea menciona» en la descripcion de C#, las dos severidades del dialogo en angular-vue, «pedirlo explicitamente» en rust-wasm, «lo pide para un hallazgo concreto» en `revision.md`). Los 13 ponen en rojo al menos un test (`fuente-unica` o `crecimiento-suite`). Restaurado cada fichero con `git checkout`. Nota para quien reproduzca: los ficheros del clon son CRLF; un mutante con `\n` literal no aplica y parece «verde»: normalizar finales de linea antes.
- Mutante que NO existe, por eso es el hallazgo IMP-1: la frase «pide siempre» de rust-wasm-reviewer sigue en el commit y todos los tests pasan con ella.

### IMPORTANTE-1 — rust-wasm-reviewer sigue mandando «pedir» contexto (CONT-04 a medias)
- Donde: skills/rust-wasm-reviewer/SKILL.md:36-41 y :102
- Que pasa: el commit reescribe el parrafo de la linea 28 («leelo y anotalo como dice "Lo que lees"»), pero la «Regla obligatoria del limite JS-WASM» dice, ocho lineas mas abajo, `**pide siempre** el llamador TypeScript o JavaScript ... y el .d.ts generado`, y «dejalo escrito en `## Alcance` del informe (que se pidio y que se encontro)». La linea 102 repite: «este revisor lo pide como contexto». Es la misma contradiccion que CONT-04: un subagente revisor no tiene a quien pedirle nada; `revision.md` («Lo que lees») dice que lee y anota bajo `## Lecturas fuera del contexto permitido`. Ademas la skill queda con dos instrucciones incompatibles sobre el mismo hecho (pedir y anotar en `## Alcance`, frente a leer y anotar en «Lecturas fuera del contexto permitido»).
- Reproduccion: `git grep -n -i -E "pide siempre|lo pide como contexto|se pidio" -- taskcode-marketplace/plugins/taskcode-plugin/skills` en el commit 1cf8900 devuelve `rust-wasm-reviewer/SKILL.md:36`, `:102` y `:40`. Con el commit tal cual, `node --test dist/test/skills/fuente-unica.test.js` sale 0: el test solo prohibe tres frases literales (`**pedirlo explicitamente**`, `pidelo si un`, `lo pide para un hallazgo`), asi que «pide siempre» no cae.
- Impacto: la correccion declara cerrado CONT-04 («las revisoras no piden contexto explicitamente», criterio 1) y no lo esta en la revisora donde el contexto es obligatorio, que es la que mas lo usa. Es Duplicacion de la Regla 4D («todos los usos, no solo los citados»): la autorrevision dice «usos buscados» y el patron «pide siempre» se le escapo. El test no detecta la vuelta de la frase, asi que el criterio 3 tampoco se cumple para esta variante.
- Sugerencia: en la regla del limite JS-WASM, cambiar «pide siempre» por «lee siempre» y el destino de la anotacion por `## Lecturas fuera del contexto permitido` (o remitir a «Lo que lees» de `revision.md` y dejar `## Alcance` solo para si el llamador no existe); linea 102, «este revisor lo lee como contexto». Ampliar el test a una expresion que cubra la familia (por ejemplo `\bpide siempre\b|lo pide como contexto|\bse pidio\b` ademas de las tres actuales) y comprobar por mutacion.

### MENOR-1 — La plantilla de informe de tres revisoras sigue con «Contexto adicional pedido»
- Donde: skills/angular-vue-reviewer/SKILL.md:357, skills/java-spring-reviewer/SKILL.md:219, skills/rust-wasm-reviewer/SKILL.md:379
- Que pasa: las plantillas de informe copiadas en esas skills traen `- Contexto adicional pedido: <ninguno, o que y por que>`, el vocabulario de «pedir» que la tarea acaba de quitar del texto; el informe real lleva `## Lecturas fuera del contexto permitido`.
- Reproduccion: `git grep -n "Contexto adicional pedido" -- taskcode-marketplace/plugins/taskcode-plugin/skills` en 1cf8900: tres lineas.
- Impacto: bajo; es la copia de la plantilla, que es el alcance de TASK-150b (CONT-05, «las revisoras remiten a revision.md en vez de copiarla»). Se anota aqui porque es el mismo concepto de CONT-04.
- Sugerencia: no corregirlo en 150a; dejarlo en TASK-150b, que elimina esas copias. Si 150b no se hace, `aceptado` con ese motivo.

### MENOR-2 — La descripcion de C# no lista todo lo que enruta
- Donde: skills/csharp-autocad-ifc-reviewer/SKILL.md:3 frente a `patrones_archivo` (linea 29 del mismo fichero)
- Que pasa: la descripcion dice «.cs, .csproj, .sln, .ifc o .ifcxml» y el patron tambien enruta `**/*.ifcjson`. Lo mismo pasa, menos grave, con las otras revisoras (java-spring lista `application*.yml`, el patron tambien `.properties` y `.yaml`). El test de la tarea solo comprueba que no diga «menciona» y que diga «Se usa si el diff toca», no que la lista de la descripcion sea un subconjunto o coincida con los patrones.
- Reproduccion: lectura de `SKILL.md:3` y del bloque `patrones_archivo`; mutar la descripcion para quitar `.ifcxml` deja el test en verde.
- Impacto: la descripcion es lo que lee Claude Code para decidir cuando cargar la skill; un diff solo de `.ifcjson` se enruta bien por el CLI pero la descripcion no lo promete. No hay comportamiento incorrecto.
- Sugerencia: anadir `.ifcjson` o escribir «ficheros C# e IFC (...)»; es MENOR y puede quedar `aceptado` con el motivo de que el reparto real lo hace el CLI.

### MENOR-3 — sincronizacion.md: «La tercera es opcional» con cuatro claves
- Donde: skills/task-workflow/sincronizacion.md:34-35
- Que pasa: tras corregir «Tres claves» a «Claves opcionales» (CONT-16), la regla de declaracion sigue diciendo «Las dos primeras claves van juntas ...; La tercera es opcional». Hay cuatro claves (`fases_sincronizacion` es la cuarta, `timeout_sincronizacion` solo vale con las otras dos); la frase deja fuera a `fases_sincronizacion`. No es falsa, es incompleta.
- Reproduccion: lectura de las lineas 9-35 del fichero.
- Impacto: ninguno comprobable; el lector deduce que la cuarta tambien lo es.
- Sugerencia: «Las dos primeras claves van juntas o no van; las otras dos son opcionales.»

(Cosmetico sin numerar: los parrafos reescritos en angular-vue:26, java-spring:25 y rust-wasm:28 dejan una primera linea mas larga que el resto del fichero; no rompe nada.)

## Regla 4D

- Duplicacion: IMP-1
- Desviacion: cumple
- Diluvio: cumple
- Disfraz: IMP-1

(Disfraz: la parte de IMP-1 que afecta al test; el criterio «un test por regla falla si vuelve la frase contradictoria» no se cumple para la variante «pide siempre». Desviacion: el diff se limita a los siete casos CONT; el cambio en `crecimiento-suite.test.ts` es el que exigia la regla vieja. Diluvio: 3 tests nuevos para 3 criterios, dentro del presupuesto del plan, y el recorte de textos no deja frases rotas; los textos instalables no mencionan TaskCode ni rutas internas, comprobado con `git diff` sobre `skills/` y con el test 21 de `task-workflow.test`.)


## Lecturas fuera del contexto permitido

- `docs/auditoria-4d-completa.md` (casos CONT-01, 02, 03, 04, 09, 16, 18): lo cita la peticion de este encargo, para saber que corrige cada caso.
- `taskcode-marketplace/plugins/taskcode-plugin/src/core/config.ts`, `src/core/revisores.ts`, `src/commands/finish.ts`, `src/fs/git-commit.ts`: pedidos expresamente por el encargo para contrastar texto y codigo.
- `taskcode-marketplace/plugins/taskcode-plugin/skills/code-quality-reviewer/SKILL.md`, `skills/task-workflow/SKILL.md`, `skills/finish/SKILL.md`, `skills/*/SKILL.md` restantes, `docs/` y README del plugin: la busqueda de todos los sitios de cada regla que pide la Regla 4D.
- `taskcode-marketplace/plugins/taskcode-plugin/test/skills/lo-que-lees.test.ts`: test vecino que ya cubre «Lo que lees» (TASK-081), para saber si cubria la frase de IMP-1 (no la cubre).

- MEN-1 aceptado: «Contexto adicional pedido» esta dentro de la plantilla de informe copiada en las revisoras; esa copia la quita TASK-150b (CONT-05), que remite a la plantilla unica.
