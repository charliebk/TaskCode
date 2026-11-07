# Brainstorm — TASK-083, rol riesgos (ronda 1)

- Rol: `brainstorm-riesgos`
- Agente: taskcode-plugin:brainstorm-riesgos

Fuentes: `src/commands/review.ts` (ronda incremental de TASK-040 y `modeloBaratoPermitido` de TASK-081), `src/core/informe-revision.ts`, `src/commands/veredicto.ts`, `src/core/metricas.ts`, y los informes de `ToolsaWeb/tareas/04-terminadas/*/revision/` y `TaskCode/tareas/04-terminadas/*/revision/`.

**Contexto que condiciona todo lo demas (leido en el codigo).** La ronda N+1 ya va acotada al diff de las correcciones: `review.ts:530-557` usa `desde = commit revisado en la ronda N` cuando sigue siendo antepasado de HEAD. TASK-081 ya abarata el modelo de esa ronda con una regla estricta: ningun CRITICO en ningun estado, ninguna severidad desconocida, y el informe no puede seguir siendo la plantilla. Por tanto, lo que TASK-083 anada solo puede ser **recortar el metodo**: no clonar, no reproducir, no mutar. Ahi esta el riesgo, no en el diff.

## Modos de fallo, ordenados por gravedad, con el escenario concreto de cada uno

1. **Una correccion de un MENOR mete un IMPORTANTE nuevo y la verificacion acotada no lo ve.**
   - Caso real: en ToolsaWeb TASK-013, el `code-quality-reviewer` solo dejo MENORES en la ronda 1 (`MENOR-1`, `MENOR-2`). En la ronda 2 encontro **IMP-R2-1** (`Armazon.vue:191`, `vistas.ts:100-103`), justo en los ficheros que tocaban esas correcciones. Lo encontro reproduciendo: clon nuevo, vitest, mutantes, segun `informe-revision-2-code-quality-reviewer.md:20-26`.
   - Una verificacion que solo comprueba si «cada MENOR esta corregido» lo habria aprobado.
   - Mitigacion: aunque el metodo sea ligero, la peticion acotada sigue exigiendo ejecutar los tests sobre el diff y buscar fallos nuevos, no solo cerrar la lista. Si el diff toca ficheros que no aparecen en la columna `Fichero` de ningun hallazgo abierto, la ronda pasa a ser completa.

2. **El elegible se calcula por informe y no por ronda (ronda fragmentada).**
   - En esa misma TASK-013, el informe `angular-vue` de la ronda 1 tenia `IMP-1` y el de `code-quality` solo MENORES.
   - Si la decision se toma por fragmento, un revisor recibe una ronda ligera mientras la ronda en conjunto tiene un IMPORTANTE abierto. Eso incumple el criterio 3.
   - Mitigacion: decidir sobre todos los informes de `informesDeUltimaRonda`, como ya hace `modeloBaratoPermitido`.

3. **Un IMPORTANTE «cerrado» a mano en la tabla de la ronda 1 habilita la via ligera.**
   - `hallazgosNoCerrados` (`informe-revision.ts:257-266`) da por cerrado `corregido` y tambien `aceptado`.
   - En los datos reales, la ronda 1 escribe siempre `abierto` (TASK-002, 003, 004, 005, 007, 008 de ToolsaWeb). Pero nada impide que el implementador edite la tabla antes de lanzar `review`.
   - Si el criterio 3 se lee literalmente («abierto»), un IMPORTANTE marcado `corregido` sin verificar obtiene una ronda ligera: es la correccion que mas falta hace verificar.
   - Mitigacion: igual que TASK-081, cualquier CRITICO o IMPORTANTE **en cualquier estado** obliga a la ronda completa.

4. **Fallo silencioso hacia lo permisivo en los datos que no se pueden leer.** La ronda tiene que ser completa en todos estos casos:
   - informe sin tabla (`tabla:false`);
   - severidad fuera del vocabulario (`Alta`, `Major`, celda vacia);
   - plantilla sin rellenar;
   - veredicto `pendiente` o `desconocido`.

   La logica nueva no debe reutilizar `hallazgosNoCerrados` a secas, porque devuelve `abiertos:[]` cuando no hay tabla. «0 abiertos» y «sin dato» tienen que ser distintos: el propio codigo ya lo advierte en `review.ts:354`.

5. **No hay diff de correcciones y aun asi se ofrece la via ligera.**
   - Si el commit de la ronda anterior ya no es antepasado (rebase, amend) o ninguna peticion lo recoge, `review.ts:540-547` cae al diff completo desde la rama base, solo con un aviso.
   - Una verificacion «acotada» sobre el diff completo deja de ser acotada sin que nadie lo note.
   - Lo mismo pasa si el implementador mergea `develop` en la rama: el delta trae codigo ajeno que nadie ha revisado nunca.
   - Mitigacion: si `desde === baseBranch`, o si entre `desde` y HEAD hay un commit de merge, la ronda es completa.

6. **Una ronda ligera seguida de una «completa» no es completa.**
   - Si la ronda 2 ligera encuentra un IMPORTANTE, la ronda 3 tiene que ser completa. Pero, por TASK-040, su diff empieza en el commit de la ronda 2.
   - Hay que fijar si «ronda completa» significa el metodo completo sobre el delta o el diff completo desde la base. Si no se fija, el criterio 3 tiene un test que pasa y una garantia que no se cumple.

## Estados intermedios y fallos parciales

- **El modo se decide antes de escribir nada.** Debe depender solo de ficheros commiteados en `revision/`. `review` ya escribe con `'wx'` y borra lo de su invocacion si falla (`review.ts:650-656`). Mientras el modo sea una funcion pura de esos ficheros, relanzar `review` tras una muerte del proceso vuelve a dar el mismo modo.
- **Riesgo de editar a mano.** Si se edita el informe de la ronda 1 entre dos intentos de `review`, el modo puede cambiar. Es aceptable si la peticion escribe el modo y su porque.
- **El modo tiene que quedar escrito y ser legible por maquina.** Propuesta: una linea del tipo `- Modo de revision: verificacion acotada (motivo: ...)` en la peticion.
  - Sin ella, `finish` cierra con un `aprobada` ligero que no se distingue de uno completo: el gate solo mira la linea `- Veredicto:` (`veredicto.ts`, `veredictoAprobado`).
  - Tampoco podria reconstruirse a posteriori que tareas se cerraron asi.
- **Concurrencia.** Dos `review` a la vez ya chocan por `'wx'` sobre el mismo `peticion-revision-N`. El cambio no la empeora.

## Compatibilidad hacia atras

- **Informes antiguos sin tabla** (anteriores a TASK-036): tienen que dar ronda completa (punto 4).
- **Vocabulario historico que el parser ya reconoce por la primera palabra:**
  - severidades: `IMPORTANTE (no verificado por ejecucion)` (ToolsaWeb TASK-004, IMP-6), `**Menor** (ronda 1)`;
  - identificadores: `H-1`, `MENOR-1`, `IMP-R2-1`, `IMPORTANTE-1 (ronda 1)`;
  - estados: `resuelto` (ToolsaWeb TASK-042) **no** es `corregido`, asi que cuenta como abierto. Para medir no importa, pero no debe confundirse con «MENOR abierto».
- **Metricas.**
  - `metricas.ts:224` clasifica los commits por una regex cerrada (`peticion de revision ronda \d+`). Un mensaje de chore nuevo para la ronda ligera quedaria sin fase. Hay que reutilizar el mensaje existente.
  - `kbPeticionPorRonda` y los terciles de `grupos-metricas.ts` mezclarian peticiones ligeras y completas: los terciles se mueven sin que cambie nada real.
- **Plugin instalado en otros proyectos** (p. ej. ToolsaWeb): la skill de revision tiene que saber que hacer con una peticion ligera. Si la peticion la marca y la skill no lo sabe, el revisor hace la revision completa igualmente: se pierde el ahorro, no la seguridad. Ese es el orden de fallo correcto; el inverso (skill ligera con peticion completa) seria el peligroso.

## Vuelta atras

- **Desactivar es reversible:** basta volver a generar siempre la ronda completa. Mientras la decision dependa solo de lo que hay en disco, no queda ningun dato en formato nuevo que rompa a otros consumidores.
- **Las tareas ya cerradas no se pueden deshacer.** Las que se cierren con una ronda ligera aprobada quedan con una garantia menor y no se reabren solas. Si no queda escrito el modo de la ronda, ni siquiera se puede listar cuales volver a revisar. Por eso la linea de modo en la peticion no es opcional.
- **La medicion de `docs/METRICAS.md` no tiene riesgo de vuelta atras.** Es documentacion (ver abajo el denominador).

## El riesgo que mas te preocupa (UNO solo)

**El punto 1. Una verificacion acotada a «comprobar que cada MENOR se ha corregido» aprueba IMPORTANTES nuevos que meten las propias correcciones.** TASK-013 de ToolsaWeb es un caso real: ronda 1 de `code-quality` solo con MENORES, ronda 2 con IMP-R2-1 en los ficheros corregidos. Lo encontro reproduciendo y mutando, no leyendo el diff.

Por eso la medicion del criterio 1 no puede contar solo cuantas rondas 2 tenian MENORES abiertos tras la ronda 1. Tiene que contar tambien **cuantas de esas rondas 2 encontraron un CRITICO o IMPORTANTE nuevo**. Si ese numero no es cero, el ahorro tiene un precio medido, y quien decide «si la medida lo justifica» tiene que verlo.

Hay que excluir del denominador las tareas cerradas en la ronda 1 con `aprobada con correcciones`, que nunca tuvieron ronda 2. No verificado si TASK-056, 057, 058, 066, 073 y 074 de TaskCode (rondas 2 con IMPORTANTE abierto) partian de una ronda 1 con solo MENORES: hay que mirarlo en la medicion.
