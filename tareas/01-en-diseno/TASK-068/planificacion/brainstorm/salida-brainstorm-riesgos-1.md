# Brainstorm — TASK-068, rol riesgos (ronda 1)

- Rol: `brainstorm-riesgos`
- Agente: taskcode-plugin:brainstorm-riesgos (af05c341271d76ed0)

Cada afirmación lleva **[V]** si se ha comprobado en el código (con su ruta) o **[S]** si es una suposición.

## Modos de fallo, ordenados por gravedad, con el escenario concreto de cada uno

- **El valor de un secreto acaba en un informe versionado.** Una sonda nueva (contraseña de `docker-compose`, `_authToken` de `.npmrc`, `<password>` de `settings.xml`) pone en la evidencia la línea entera. `--escribir` la guarda en `docs/doctor-deploy/` y `doctor-deploy-tareas` la copia en el «Por qué falla» de la tarea, porque el motivo de una sonda se copia sin filtrar [V: `core/doctor-deploy-tareas.ts:84`]. Lo que se sube ya no se puede borrar. Mitigación: las sondas nuevas pasan por la misma máscara que `buscarSecretos`; nunca línea cruda ni valor en el `motivo`.
- **Una web sale como librería o CLI y se apagan puntos de seguridad sin avisar.** Los marcadores solo comparan el nombre del fichero, nunca el contenido [V: `fs/deteccion-app.ts:57-62`]. Así no se distingue una librería Node de una API Node, porque ambas tienen solo `package.json`, ni un `bin` de un servidor. Si «librería» se deduce porque no aparece ningún marcador web, HTTPS, cookies, headers, rate limits, backups y health check salen NO APLICA. Entonces el agente deja de recibirlos, porque la skill filtra los `no-aplica` [V: `skills/doctor-deploy/SKILL.md:29-30`], y las tareas de arreglo abiertas salen como huérfanas «ya no aplica» [V: `doctor-deploy-tareas.ts:114`]. Es fallo en abierto. Mitigación: solo hay NO APLICA por tipo cuando hay un marcador positivo de librería o CLI y ninguno de web o API; si hay duda, el punto aplica. El informe dice qué marcador decidió el tipo.
- **Desacuerdo con arquitectura si mete los tipos de app en la misma lista `tipos`.** Hoy un punto aplica si coincide con cualquier tipo detectado (`some`) [V: `commands/doctor-deploy.ts:136-138`]. Con `https-obligatorio: [node, ..., web]`, una CLI de Node casa con `node` y el punto sigue aplicando, así que el criterio 2 no se cumple nunca. Hace falta un segundo eje que se combine con Y.
- **Las sondas de reglas y migraciones dan OK falsos, que es peor que NO VERIFICADO.**
  - Firebase: `allow read, write;` sin `if` también está abierta; puede haber `read` y `write` en reglas separadas, regla en varias líneas o `database.rules.json` con `".read": true`.
  - RLS: un `create table` en una migración y el `enable row level security` en otra posterior; nombres `public."Users"` con mayúsculas, comillas o esquema; esquemas privados.
  - Mitigación: si no se encuentra el fichero, NO APLICA o NO VERIFICADO, nunca OK; un fichero mayor que `maxBytesFichero` también es NO VERIFICADO [V: patrón de `sondas-deploy.ts:262`].
- **Falsos positivos masivos que acaban con el punto desactivado entero.**
  - `actions/checkout@v4` está en casi todos los repos.
  - Migraciones SQL de Flyway o Prisma, que no son Supabase y donde RLS no se pide.
  - Imágenes distroless `:nonroot` sin `USER`.
  - `${NPM_TOKEN}` y `POSTGRES_PASSWORD: ${X}`, que son legítimos.
  - Mitigación: excluir `./` local, `docker://` e interpolaciones; RLS solo en `supabase/migrations/`; un silencio por hallazgo como en las sondas de secretos [V: `buscarSilencio`].
- **YAML y Dockerfile leídos línea a línea, sin parser.** No hay dependencias [V: CLAUDE.md]. Se escapan `on: [pull_request_target]` en sintaxis de flujo, `uses:` en un `action.yml` compuesto, `\` de continuación, `user app` en minúsculas, el `USER` puesto solo en la etapa de build de un multietapa y el `\r` del CRLF (ya hay un rojo de Windows por finales de línea) [V: CLAUDE.md].
- **Doble FALLA del mismo token.** `secretos-arbol` ya escanea `.npmrc` [V: `paraEscanear`] y la sonda nueva lo vuelve a contar. Salen dos tareas, y quien ya silenció ese token en `secretos-arbol` ve otra vez FALLA en el punto 39.

## Estados intermedios y fallos parciales

- Las sondas solo leen [V: `sondas-deploy.ts:7`] y no añaden estado; la escritura del informe usa temporales con `.` delante, que el lector ignora [V: `informes-deploy.ts:62`]. Repetir la ejecución es seguro, y dos a la vez también [S: no se ha leído la escritura atómica].
- Una excepción dentro de una sonda nueva se queda en NO VERIFICADO de ese punto y no tumba el comando [V: `commands/doctor-deploy.ts:163-169`]. Tampoco puede nunca convertir un FALLA en OK.
- Un fichero ilegible o borrado entre `ls-files` y la lectura se salta en silencio con `continue` [V: `sondas-deploy.ts:204`]. Si las sondas nuevas lo copian, un `firestore.rules` ilegible daría OK.

## Compatibilidad hacia atras

- **Código de salida.** Hoy los puntos 37 a 43 son de juicio y salen NO VERIFICADO, que no afecta a la salida [V: yml y `core/doctor-deploy.ts:108`]. Al pasar a sonda pueden dar FALLA, y un CI que use `doctor-deploy` como puerta se pone rojo tras actualizar el plugin sin que el proyecto haya cambiado. Hay que avisarlo en el CHANGELOG.
- **Capa del proyecto.** Un `punto_N_tipos` que nombre un tipo renombrado o retirado (p. ej. `frontend` → `web`) aborta todo el comando [V: `doctor-deploy-catalogo.ts:279-285`]. Los ids de tipo existentes no se tocan.
- **Ids de punto.** Si se renombran los puntos 37 a 43, su `desactivar_N_id` solo avisa y se ignora, con lo que el punto se reactiva [V: `:527-531`]. Además sus tareas `doctor-deploy:<id>` salen huérfanas «ya no existe» [V: `doctor-deploy-tareas.ts:112`]. Los ids se mantienen.
- **Veredictos del agente.** Uno ya emitido para un punto que ahora es sonda se rechaza por entrada, sin abortar [V: `doctor-deploy-veredictos.ts:237`].
- **Informes antiguos.** El lector solo exige `id`, `estado` y `severidad` [V: `informes-deploy.ts:27`], así que añadir campos no lo rompe.

## Vuelta atras

- Volver a la versión anterior del plugin restaura el catálogo y las sondas: es reversible.
- Las tareas creadas por los FALLA nuevos se quedan en `tareas/` y hay que cerrarlas a mano.
- Las tareas cerradas por una mala detección del tipo se pueden reabrir, pero nadie sabrá cuáles fueron.
- **Sin retorno:** un secreto que ya se haya escrito en `docs/doctor-deploy/` o en una tarea y se haya subido. Hay que rotarlo; revertir no sirve.
- **Referencias OWASP.** En la versión 2025 del Top 10 las categorías cambian de número [S: hay que verificarlo en owasp.org]. Sustituir «2021» por «2025» a mano deja el A02 de criptografía apuntando a otra categoría, y nadie lo nota. ASVS 5.0 renumera todos los capítulos frente a 4.0.3 [S]. La referencia se rehace una a una por significado, no por número.

## El riesgo que mas te preocupa (UNO solo)

La detección en abierto del tipo de aplicación. Si una API se clasifica como librería, seis puntos de seguridad pasan a NO APLICA, el agente deja de verlos y sus tareas abiertas salen como huérfanas para cerrar. Todo eso con el resumen más limpio que antes, sin un solo rojo que lo delate. Ante la duda, el punto tiene que aplicar.

Lo que no cubre esta salida: dónde encaja el cambio (arquitectura), qué aserciones escribir (testing) y si cada punto debe aplicar a móvil o qué severidad merece (dominio).
