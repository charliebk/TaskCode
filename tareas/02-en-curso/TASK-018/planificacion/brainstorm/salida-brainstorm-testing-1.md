## Comprobabilidad del enfoque
Sin enfoque previo (`planificacion/plan-final.md` esta vacio). `review.ts` ya es
determinista (no invoca LLM, comentario propio del fichero): clasificar el
diff y escribir 1 peticion por dominio con solo su subconjunto, o 1 generica
con el diff completo por debajo/encima del umbral, es observable leyendo los
ficheros que `taskctl review` deja en `revision/`, sin abrir ningun agente.

## Pruebas que hacen falta
- Diff que toca 1 dominio (solo `.java` bajo `src/main/java`) genera 1 peticion con agente=`java-spring-reviewer` y el diff integro — repo Git temporal real (patron de `review.test.ts`) — mutacion: seguir usando `task.agente_revisor` del frontmatter en vez del dominio detectado; el agente esperado dejaria de ser `java-spring-reviewer`.
- Diff que toca 2 dominios (java + angular, bajo el umbral 3) genera 2 peticiones y CADA UNA trae solo los hunks de su propio fichero — mismo repo, un commit que toca un `.java` y un `.component.ts` — mutacion: pasar `diffRange` completo (sin filtrar por dominio) a cada peticion; la de java pasaria a contener tambien el fichero Angular.
- Diff que toca EXACTAMENTE 3 dominios (java+angular+csharp) sigue fragmentando en 3 peticiones, no cae al generico — repo con 3 ficheros de dominios distintos — mutacion: cortar con `>=` en vez de `>` contra `umbral_dominios`; con 3 exactos caeria al generico.
- Diff que toca 4 dominios (por encima del umbral) genera 1 sola peticion, agente=`code-quality-reviewer`, diff COMPLETO sin fragmentar — repo con 4 ficheros de dominios distintos — mutacion: seguir fragmentando por encima del umbral; habria 4 peticiones en vez de 1.
- Diff que no casa con ningun patron (solo un `.md`) genera 1 peticion generica con el diff completo, igual que hoy — repo tocando solo `README.md` — mutacion: tratar "0 coincidencias" como excepcion en vez de fallback; el comando fallaria donde hoy no fallaba.
- Una ruta de ecosistema vecino ya congelada como ajena en `RUTAS_AJENAS` de `revisores.test.ts` (p. ej. `src/users/users.module.ts`, NestJS) sigue cayendo al generico — mismo repo, esa ruta exacta — mutacion: ensanchar sin querer un patron de `angular-vue-reviewer` (el fallo que documenta `docs/contexto/HALLAZGOS.md`: un patron de mas sustituye al generico, no anade un revisor).

## Lo que se rompe de lo existente
- `review.test.ts` (camino feliz y las 8 pruebas hermanas) asume UN par peticion+informe por ronda (`RONDA_FILE_RE` sin dominio, `ReviewCommandResult.peticionPath/informePath` singulares) — cambia a "N pares, o 1 par con N secciones" segun decida arquitectura — legitimo solo si esa forma se documenta aqui, no si se cuela en silencio.
- Las aserciones de "el diff INTEGRO va en la peticion" (vallas de backticks, ENOBUFS, `doesNotMatch(/cambio-develop/)`) pasan a valer solo para la peticion generica; para una de dominio cambian a "solo el subconjunto de su dominio", y esos 3 tests hay que reescribirlos contra el recorte, no contra el diff entero.
- `siguienteRonda()`/`RONDA_FILE_RE` (`peticion-revision-(\d+)\.md`) deja de bastar si el nombre incorpora el dominio — mismo problema que ya resolvio `peticion-brainstorm-<rol>-<ronda>.md` en TASK-016; reutilizar ese patron en vez de inventar uno.

## No cubierto a proposito
- Si el agente asignado revisa BIEN su dominio (calidad del juicio del LLM) no es comprobable con tests deterministas; solo se cubre la clasificacion y el contenido de la peticion.
- El coste/latencia de N agentes en paralelo frente a 1 no se cubre aqui (el CLI no lanza ninguno): es rendimiento, del rol de arquitectura.
- Que dos revisores de dominio no compartan un patron identico ya lo cubre el test 6 de `revisores.test.ts`; no se repite aqui.

## Coste de mantenimiento
Si el router no relee `patrones_archivo` de `skills/*/SKILL.md` en cada ejecucion (los carga una vez y los copia), una skill nueva o un patron editado diverge en silencio de lo que aqui se prueba — ya paso dos veces con angular-vue (`HALLAZGOS.md`) y sin relectura volveria a pasar sin que ningun test lo viera.

## Desacuerdos previstos
- Con arquitectura: si "una peticion por dominio" son N ficheros nuevos (reusa el patron ya probado de `peticion-brainstorm-<rol>`, pero obliga a reescribir `RONDA_FILE_RE` y el contrato de `ReviewCommandResult`) o N secciones dentro del mismo fichero de siempre (no rompe naming, pero es una forma sin precedente en el repo); sostengo que ficheros separados es mas barato de probar por aislamiento, aunque rompa mas tests de golpe.
- Con riesgos: si hace falta un fallback adicional para "ningun patron de ningun dominio Y el generico tampoco declara ninguno" (hoy imposible, `code-quality-reviewer` no compite por patron); sostengo que no hace falta cubrirlo con una prueba mientras esa skill siga con `patrones_archivo: []`.

## Suposiciones no verificadas
- Que "hasta el umbral" corta en "mas de 3 dominios" (asi lo dice `skills/code-quality-reviewer/SKILL.md`), o sea 3 SI fragmenta y 4 cae al generico — es la unica lectura escrita en disco, pero nadie la ha confirmado contra el criterio de aceptacion.
- Que "un agente por dominio" implica un fichero de peticion por dominio y no una unica peticion con N secciones — no hay precedente de N revisores en un mismo ciclo de `review`, solo N roles de `brainstorm` (comando distinto).
- Que hace falta filtrar el diff POR FICHERO (no solo clasificar nombres) — no he visto en `src/fs/git.ts` ninguna funcion de diff acotado a rutas ni de nombre-only sobre un rango; solo `diffRange` sobre el rango completo.
- Que las 4 skills de `skills/` son la unica fuente de `patrones_archivo` a leer, y que `cargarCatalogoSkills` (TASK-017, otro caso de uso) no aporta revisores de dominio adicionales.
