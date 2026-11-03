# Brainstorm — TASK-068, rol testing (ronda 1)

- Rol: `brainstorm-testing`
- Agente: taskcode-plugin:brainstorm-testing (aaf1a81ad7ac6e846)

## Que es observable sin llamar a ningun agente

- Sin enfoque previo: todo lo que piden los criterios sale en `taskctl doctor-deploy --json` (`tipos`, `puntos[].estado/metodo/motivo/referencia`) sobre un repo Git temporal. Lo leen `ejecutar()` y `punto()` de `test/helpers/deploy-fixtures.ts`. El único criterio que no se puede afirmar desde fuera es «verificada contra la fuente oficial».
- Que «el agente ya no los recibe» también es observable sin agente. La skill filtra `metodo: juicio` con estado distinto de `no-aplica` (SKILL.md, pasos 2-3), y `doctor-deploy-veredictos.ts:237` rechaza veredictos de puntos que no son de juicio. Basta un `--resultado` con un veredicto para `reglas-firebase-abiertas` y comprobar que se rechaza.

## Plan de pruebas, cada una con su mutacion

- Tipo de aplicación, una fixture por tipo (web, API, Android, iOS, Flutter, React Native, CLI, librería) con la estructura real de carpetas, y en cada una aserción sobre `tipos` en el JSON. Mutación: borrar un marcador del yml. Ojo: `PROFUNDIDAD_MARCADORES = 3` (deteccion-app.ts:18), y en RN el manifiesto está en `android/app/src/main/AndroidManifest.xml`, que es profundidad 4. Una fixture aplanada lo esconde.
- Negativo por tipo: un Node de librería pura (el `NODE` de fixtures) no sale React Native ni web. Si RN, CLI o librería dependen del contenido (`react-native` en dependencias, `bin` en package.json), el negativo es un package.json sin esa clave. Mutación: detectar RN solo por `package.json`.
- NO APLICA por tipo: en librería y en CLI, `https-obligatorio`, `cookies-seguras`, `security-headers`, `rate-limits`, `backups-y-migraciones` y `health-check` salen `no-aplica` y el motivo nombra el tipo. El mismo test sobre una fixture web los da como aplicables. Mutación: quitar la comprobación del eje de aplicación en `evaluarPunto` (commands/doctor-deploy.ts:136-148).
- Sin tipo de aplicación detectado (fixture `README.md` + `.gitignore`, test de la línea 210): esos seis puntos siguen aplicando. Mutación: tratar «desconocido» como librería. Es la que vale más de todas.
- Por cada sonda, un par detecta / no da falso positivo con el nombre de su punto. Firebase `if true` frente a `if request.auth != null`. Una migración con `create table` sin RLS frente a una con el RLS activado **en una migración posterior** (otro fichero). `.npmrc` con token literal frente a `${NPM_TOKEN}`. `settings.xml` con `<password>` frente a `${env.X}`. Compose con `POSTGRES_PASSWORD: x` frente a `${...}` o `_FILE`. `pull_request_target` con checkout de `head.sha` frente al mismo evento sin checkout del PR. `@v3` frente a `@<40hex>` y frente a `./.github/actions/x`. Dockerfile sin `USER`, o con `USER` solo en la etapa builder, frente a `USER app` en la etapa final; y `ADD https://` frente a `ADD ./x`. Mutación: invertir o vaciar la regex de cada sonda; el par se pone rojo por un lado o por el otro.
- Variantes en funciones puras exportadas (como `requirementsFijado` o `motivoFicheroSecreto`) y un único test de integración con repo real por sonda. Mutación: no registrar la sonda en `SONDAS`, y el de integración sale `no-verificado`.
- Enmascarado: ampliar el test de la línea 325 con la contraseña del compose y el token del `.npmrc`; ninguna ventana de 8 o más caracteres puede aparecer en stdout, JSON ni informe. Mutación: poner la línea cruda en `muestra`.
- Conversión de juicio a sonda: lista explícita de los 7 ids (`punto_37..43`) con `metodo === 'determinista'`, y un `--resultado` que les da veredicto rechazado. Mutación: dejar `punto_37_metodo: juicio`.
- Referencias: cada `referencia` cumple la forma de la versión fijada y ninguna contiene `2021` (hoy las 42 dicen «OWASP Top 10 2021»). Mutación: dejar una sin cambiar.

## Aserciones trampa que hay que evitar en esta tarea concreta

- Probar el `.npmrc` con un token `npm_` de 36 caracteres. `secretos-arbol` ya lo caza (secretos.ts:86), así que una aserción sobre `resumen.falla` o `codigo` pasa con la sonda nueva rota. Hay que aseverar sobre el id del punto y usar un `_authToken` que los patrones genéricos no cazan.
- Comprobar solo que en una librería sale NO APLICA. Eso pasa con una implementación que pone `no-aplica` a todo lo que no es web. Hace falta el par web/desconocido.
- Contar puntos en vez de nombrarlos (`=== 6`, `=== 13`). Pasa aunque se haya convertido el punto equivocado.
- Una fixture Dockerfile con una sola etapa. No distingue «hay un USER en algún sitio» de «hay un USER en la etapa final».
- Dar por buena la referencia porque el formato cuadra. El formato no prueba que la categoría esté bien asignada (2025 renumera; SSRF ya no es A10).

## Que pruebas existentes cambian de expectativa

- `doctor-deploy-catalogo.test.ts:97` («las mismas seis») y `:104` («solo seis deterministas»). Suben a 13 (o 12 si Dockerfile es una sola sonda). Es legítimo, pero conviene cambiarlas por la lista explícita de ids, no por otro número.
- `doctor-deploy-catalogo.test.ts:116`. «Tipo» hoy significa lenguaje (node, rust, docker…) y el eje nuevo necesita su propio test de ids; el actual sigue valiendo como red.
- `commands/doctor-deploy.test.ts:155` (repo limpio): `DETERMINISTAS_PROPIOS` y el bucle de juicio NO VERIFICADO cambian. Qué estado sale en un Node sin workflows ni Dockerfile (OK con «0 revisados», NO VERIFICADO o NO APLICA) lo tiene que decidir alguien. Hoy la convención es `revisados === 0`, que da NO VERIFICADO (sondas-deploy.ts:255, 313, 525). `dockerfile-sin-user` sigue saliendo NO APLICA en las líneas 178-181. Si deja de hacerlo, es una regresión.
- Siguen valiendo como red sin tocarse: `skills/doctor-deploy.test.ts:241` (`rls-activo` sigue siendo de juicio, distinto de `migraciones-sin-rls`), el invariante «juicio nunca OK» (línea 134), «OK sin evidencia» y los tests de enmascarado y de silencios.

## Como envejece

- Añadir una sonda obliga hoy a tocar cuatro sitios a mano: `SONDAS_REGISTRADAS`, `SONDAS`, el yml y los conteos de los tests. Con siete más, el que se olvide de uno solo se entera por un número. Hay que nombrar los ids.
- Dos ejes con el mismo nombre (`tipos` = lenguaje, `TipoApp` = lenguaje) y un eje nuevo para la aplicación. Dentro de seis meses alguien pondrá `cli` en `punto_N_tipos`. El parser debe abortar con un tipo de aplicación desconocido (test como el de la línea 177), y la regla de aplicabilidad que combina los dos ejes necesita su propio test de intersección.
- No queda cubierto a propósito: «verificada contra la fuente oficial» no se puede comprobar con un test. Se queda en evidencia manual en el Resultado. Los «secretos impresos» en CI aparecen en el Objetivo pero no en los criterios: sin sonda ni test, salvo que se decida otra cosa.
- Desacuerdo previsto con dominio y arquitectura: el estado de una sonda sin ficheros que revisar. Postura: NO APLICA con motivo si el fichero no existe, para no inflar «N de M sin verificar» en cada repo limpio. Lo que no acepta es OK sin evidencia.
- Suposiciones no verificadas: no ha leído los nombres de los tests de `doctor-deploy-resultado.test.ts` (el rechazo de veredictos a puntos no de juicio puede estar ya cubierto); tampoco ha comprobado si `punto_35` sin `referencia` debe tenerla (un test de «todas con referencia» fallaría ahí).
