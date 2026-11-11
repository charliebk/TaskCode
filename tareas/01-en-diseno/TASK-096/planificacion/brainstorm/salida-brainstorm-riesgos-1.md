# Salida de brainstorm — TASK-096, rol riesgos (ronda 1)

Agente: brainstorm-riesgos

Fuentes leídas: `tareas/04-terminadas/TASK-091`, `TASK-100`, `TASK-101`, `TASK-102`, `TASK-103` y `TASK-104` (sus `tarea.md`), `src/hooks/guardia-merge.ts`, `src/fs/verificacion.ts`, `src/commands/finish-cobertura.ts` y `skills/task-workflow/verificacion-selectiva.md`. Lo no comprobado va marcado «[supuesto]».

## Modos de fallo, ordenados por gravedad, con el escenario concreto de cada uno

1. **Un clasificador que se aprueba a sí mismo deja entrar código roto en develop.**
   - Escenario: la tarea cambia `src/x.rs` y a la vez el script selectivo o su tabla. `finish` ejecuta el comando que hay en el árbol de la rama, es decir, la versión ya cambiada. Esa versión no selecciona los tests rotos, sale con 0 y `finish` integra.
   - Hoy la guía (`verificacion-selectiva.md`, «el propio clasificador o su tabla») le pide al proyecto que lo detecte él mismo. TaskCode no sabe qué ficheros usa el comando, porque es una cadena de texto.
   - TASK-100 cerró este mismo hueco en el nivel 1 leyendo las rutas de la rama BASE y mandando a la completa cualquier cambio en `.taskcode/config.yml`. El nivel 2 no tiene un equivalente.
   - Mitigación: la decisión de nivel 2 se toma con lo que hay en la base. Si el diff toca algo que la base declara como «del clasificador», va a la completa.

2. **Hasta hoy, salir con 0 sin haber corrido nada no podía colar como verde de integración.**
   - Un clasificador que falla y sale con 0 solo afectaba a Stop y a las rondas; `finish` lo tapaba con la completa (TASK-091).
   - Si TaskCode delega en el comando, no puede saber qué nivel corrió: el criterio 1 («lo dice en su salida») solo repetiría lo que el script dice de sí mismo.
   - Mitigación: el comando declara qué corrió con un contrato verificable; si no lo declara, TaskCode lo trata como completa no hecha.

3. **El guardián, al relajarse para código, multiplica el daño de su punto débil.**
   - En TASK-101 salieron CRI-1, CRI-2, NUE-1 y NUE-2, todos de comandos que metían código en la rama evaluada antes del merge. La exención solo cubría documentación y aun así hicieron falta 3 rondas.
   - Si el paso 6b acepta el verde selectivo para código, cada hueco futuro de `comandoSoloIntegra` deja integrar código sin la completa.
   - Mitigación: el guardián nunca relaja el código. Desacuerdo con arquitectura si propone que el guardián acepte el verde selectivo.

4. **Los criterios 1 y 3 se contradicen en el nivel 2.**
   - El criterio 1 dice que `finish` integra con el verde selectivo; el 3, que el guardián bloquea código sin verde de la completa y a la vez aplica «la misma decisión que finish».
   - Escenario: `finish` verifica en modo selectivo, falla el merge por conflicto y el agente lo resuelve con un `git merge` a mano: el guardián lo bloquea.
   - Incoherencia aceptable (lado seguro), pero el plan tiene que escribirla como decisión.

5. **La puerta de cobertura bloquea siempre, o mide un informe parcial.**
   - `finish-cobertura.ts` exige un informe fresco por mtime frente al arranque de la verificación.
   - Si la selectiva no escribe el lcov: «Sin datos fiables no se cierra» en toda tarea de nivel 2 con `umbral_cobertura`. Si lo escribe parcial: rojos falsos. Además la guía de la selectiva le prohíbe regenerar ese informe.
   - Mitigación: decidir qué hace la puerta en el nivel 2, como se hizo con `omitida` en el nivel 1.

6. **`tareas/**` deja la función inerte.**
   - Toda tarea cambia su carpeta. Un clasificador escrito según la guía («un fichero que no cae en ninguna capa → corre todo») ve `tareas/TASK-NNN/tarea.md` y corre todo.
   - Además, el commit de anotación previo al merge cambia HEAD y la huella, e invalida el memo justo antes de integrar.

7. **El nivel 3 se ejecuta con el timeout del selectivo.**
   - Si es el comando del proyecto el que decide correr todo, corre con `timeout_verificacion_selectiva` (600 s por defecto); en ToolsaWeb la completa tarda ~28 min: rojo por timeout en cada tarea transversal.

## Estados intermedios y fallos parciales
- **Orden seguro del troceo:** `finish` → Stop/review → guardián (si cambia) → documentación. Si el guardián se relajara antes que `finish`, habría un camino a mano más laxo que el oficial.
- **`finish` selectivo antes de tocar el guardián:** los reintentos a mano tras un fallo a mitad de merge quedan bloqueados (punto 4). Seguro pero molesto: avisarlo en el CHANGELOG.
- **Una parte intermedia publicada:** documentación, Stop y review dirían cosas distintas. Mitigación: no publicar versión hasta cerrar todas las partes, o no documentar la clave hasta la última. [supuesto] Nada impide hoy publicar en mitad del troceo.
- **La clave cambia de significado entre partes:** fijar nombre y semántica en la parte 1, de forma definitiva.
- **Proceso que muere entre la anotación y el merge:** la sección nueva de `tarea.md` necesita la misma idempotencia que TASK-100 dio a la de documentación.
- **Memo selectivo ligado al commit de la base:** si develop avanza entre `finish` y el merge a mano, la huella no casa; va al bloqueo (seguro) pero necesita un mensaje que lo explique.

## Compatibilidad hacia atrás
- **Reutilizar `comando_verificacion_selectiva` como disparador del nivel 2 en `finish` rompe el criterio 4.** ToolsaWeb ya la declara y su clasificador se escribió dando por hecho que la completa era la puerta. Hace falta una clave nueva y explícita. Desacuerdo con arquitectura si propone inferirlo de la clave existente.
- **No mezclar los memos.** El guardián (paso 6) acepta cualquier verde de `freno-verificacion.json` con la huella del commit y el `comando_verificacion`. Si el nivel 2 escribe ahí, un verde selectivo contaría como completa, también para un hotfix a main. Mitigación: tipo de memo propio, sin subir `VERSION_MEMO`.
- **`release` y hotfix:** TASK-100 fuerza la completa en release; el nivel 2 lo hereda. En hotfix el criterio debería ser el más estricto. [supuesto] Ninguna tarea anterior decidió nada sobre hotfix en `finish`.
- **Tests que cambian de expectativa:** los de «la completa obligatoria en finish»; cada uno con su motivo en Resultado, que es donde un debilitamiento puede pasar sin verse.

## Vuelta atrás
- Código y configuración reversibles: quitar la clave devuelve la 0.14.0, siempre que los memos estén separados.
- Punto sin retorno: lo integrado en develop con solo el verde selectivo y publicado con push. Se deshace con revert más una completa; un release sacado entre medias ya está fuera.
- Detección tardía: el fallo aparece en la completa de la siguiente tarea transversal. Mitigación: completa en el release (como ya se hace) y anotar en la tarea qué nivel corrió, para atribuir el fallo.

## El riesgo que más me preocupa (UNO solo)
**La garantía de la 0.8/0.9 («no integrar nada roto») deja de estar en manos de TaskCode.** Pasa a depender de un script del proyecto que se ejecuta desde la propia rama que verifica y que puede salir con 0 sin haber corrido nada (puntos 1 y 2). Antes de escribir código, el plan tiene que dejar escritas tres cosas: qué parte de la decisión se lee de la base, cómo sabe TaskCode qué nivel corrió de verdad y qué pasa si el comando no lo dice.

No comprobado: si ToolsaWeb declara `umbral_cobertura` (si sí, el punto 5 le bloquea `finish` desde el primer día) y si su selectivo ya trata `tareas/**` como documentación. Se confirma mirando su `.taskcode/config.yml` y su script selectivo.
