# Plan — TASK-089: Evitar literales con forma de secreto en el repo y tags de version que faltan

(Es la respuesta del unico rol de brainstorm, arquitectura,
volcada aqui por quien orquesta.
Con un solo rol no hay unificador ni desacuerdos que resolver; en su lugar,
el plan senala lo que ese rol no cubrio. El rol no tuvo shell: quien orquesta
ejecuto despues los `git` que faltaban y sus resultados estan en
«Comprobado por quien orquesta».)

## Enfoque propuesto

Tres piezas independientes: (1) un modulo unico de claves falsas troceadas
para los tests; (2) un test guardian de todo el repo sobre `git ls-files` con
su propia lista de patrones; (3) los tags anotados v0.9.0 y v0.10.0, que no
tocan ficheros.

**Estado de hoy** (rutas bajo `taskcode-marketplace/plugins/taskcode-plugin/`):

- Ya troceadas: `STRIPE = 'sk_live_' + '...'` y `AWS = 'AKIA' + '...'`, pero
  definidas tres veces: `test/helpers/deploy-fixtures.ts:14-15`,
  `test/commands/doctor-deploy.test.ts:31-32`, `test/core/secretos.test.ts:12-13`.
- Enteros todavia:
  - `doctor-deploy.test.ts:367` y `secretos.test.ts:28`:
    `sk_test_4eC39...` (ejemplo publico de Stripe) y `AKIAIOSFODNN7EXAMPLE`.
  - `doctor-deploy.test.ts:890` y `:1076`: `sk_live_Nueva0Clave1Dist`.
  - `secretos.test.ts:48`: cabecera `-----BEGIN RSA PRIVATE KEY-----` y
    `xoxb-1234567890-abcdefghij`.
- Fuera de los tests: `README.md:1001`, comentarios de `src/core/secretos.ts`
  (y `dist/src/core/secretos.js`, versionado) citan `AKIAIOSFODNN7EXAMPLE`.
  Los artefactos historicos de `tareas/04-terminadas/TASK-066/revision/` y
  `TASK-068/revision/` traen copias porque llevan el diff dentro.

**Piezas:**

1. **Se crea `test/helpers/claves-falsas.ts`**, sin imports. Exporta
   `STRIPE_LIVE`, `STRIPE_LIVE_OTRA`, `STRIPE_TEST_EJEMPLO`, `AWS`,
   `AWS_EJEMPLO`, `PEM_CABECERA`, `SLACK` y `GITHUB_TOKEN`, todas armadas por
   concatenacion. `deploy-fixtures.ts` las reexporta; `secretos.test.ts` (core,
   entra en `test:rapido`) las importa directamente para no arrastrar
   `src/commands/doctor-deploy.js`. Se quitan las copias locales.
2. **Se cambian** los literales enteros de `doctor-deploy.test.ts` y
   `secretos.test.ts` por esas constantes. Las aserciones no cambian.
3. **Se crea `test/empaquetado/sin-literales-secretos.test.ts`**, sobre el
   precedente de `test/empaquetado/distribucion.test.ts` (`REPO_ROOT` por
   `import.meta.url`, `hayRepo()` con `t.skip`, el mismo helper `git`).
   - Un solo `git ls-files -z` y `readFileSync` de cada ruta; se saltan los
     binarios (NUL en los primeros 8000 bytes) y las rutas que ya no estan en
     disco. Nada de un proceso por fichero.
   - Patrones locales al test, con la forma de los de push protection:
     `[sr]k_live_[0-9A-Za-z]{24,}`, `[sr]k_test_[0-9A-Za-z]{24,}`,
     `(AKIA|ASIA)[0-9A-Z]{16}`, `gh[pousr]_[A-Za-z0-9]{36,}`,
     `github_pat_[A-Za-z0-9_]{40,}`, `xox[abprs]-[0-9A-Za-z-]{10,}`,
     `glpat-[0-9A-Za-z_-]{20}`, `npm_[0-9A-Za-z]{36}`,
     `SG\.[\w-]{22}\.[\w-]{43}` y la clave privada PEM **con cuerpo**
     (`-----BEGIN [A-Z ]*PRIVATE KEY-----` seguido de al menos 64 caracteres
     base64). Una cabecera sola o con `xx` de cuerpo no es una clave: no la
     bloquea GitHub y no la marca el guardian.
   - Lista blanca de **valores exactos**, cada uno con su motivo:
     `AKIAIOSFODNN7EXAMPLE` (ejemplo de la documentacion de AWS) y
     `sk_test_4eC39HqLyjWDarjtT1zdp7dc` (ejemplo publico de Stripe, ya en
     `origin/develop` desde TASK-066 sin bloqueo). Nada de rutas ni prefijos.
   - El mensaje de fallo da ruta, linea e id del patron, nunca el valor
     (enmascarado con `enmascarar` de `src/core/secretos.ts`).
   - La funcion de escaneo se exporta (o queda en un helper) para la
     contraprueba; los textos de la contraprueba salen de `claves-falsas.ts`,
     asi el propio fichero no se marca a si mismo.
4. **Tags** (al final, fuera del merge, porque no cambian ficheros):
   `git tag -a v0.9.0 df59da2 -m "v0.9.0"`, `git tag -a v0.10.0 b85f37e -m
   "v0.10.0"`, `git push origin v0.9.0 v0.10.0`; verificar con
   `git ls-remote --tags origin` (debe salir la linea `^{}` de cada uno
   apuntando a su commit).

**Orden:** 1 → 2 → 3 (el guardian se pone en verde cuando 1 y 2 estan) →
`npm test` → 4.

**Alternativas descartadas:**
- Reutilizar `buscarSecretos` de `src/core/secretos.ts` como guardian: audita
  repos de usuario, trata `sk_test_` y `...EXAMPLE` como «ejemplo», no tiene
  la forma de lo que bloquea GitHub, y el guardian dependeria del codigo que
  vigila. Solo se comparte `enmascarar`.
- `git grep -E` en un proceso: ERE sin `\b` portable y lista blanca torpe; el
  coste de ls-files + lectura es equivalente.

## Comprobado por quien orquesta

- `v0.8.0` y `v0.11.0` son anotados (`git cat-file -t` = `tag`) y estan sobre
  el commit `chore: version X` (5f2fb53 y 51fdf34), ambos en `origin/develop`.
  No hay tags en commits de merge: el precedente es el commit del bump.
- El bump a 0.9.0 esta en `df59da2` (`fix(TASK-076): ... version 0.9.0`) y el
  de 0.10.0 en `b85f37e` (`feat(TASK-079): ... version 0.10.0`); `git show
  <c>:.../package.json` confirma `"version"` en cada uno y `git branch -r
  --contains` lista `origin/develop` para los dos. Empujar los tags no empuja
  commits nuevos.
- `git log origin/develop -S'sk_test_4eC39'` da 080a5c6, 700b0da y 8326430
  (TASK-066): ese literal lleva en origin desde entonces sin bloqueo.
- `git grep` de los patrones de arriba sobre el arbol actual: solo los
  literales listados en «Estado de hoy»; nada en `src/` salvo el comentario
  con `AKIAIOSFODNN7EXAMPLE`.

## Lo que el rol no cubrio

- La lista exacta de patrones frente a la real de push protection no se ha
  contrastado con la documentacion de GitHub (seria del rol de dominio). Se
  erra por exceso (`sk_test_` incluido) y la lista es local y facil de ampliar.
- Que literal concreto bloqueo el push de 0.11.0: la constante actual ya
  esta troceada (se troceo al reescribir el historial). No hace falta para la
  tarea: el guardian cubre la familia entera.
- Riesgos, pruebas en detalle y reglas de negocio no tuvieron rol propio
  (tarea `simple`).

## Riesgos aceptados y que los contiene

- **Patrones mas estrictos o mas laxos que los de GitHub.** Lo contiene la
  lista local, facil de ampliar, y errar por exceso.
- **Lista blanca.** Una entrada de mas tapa una clave real. La contienen
  valores exactos, dos y con motivo, ambos publicos.
- **Coste del guardian.** Crece con `tareas/`. Un proceso y lectura lineal;
  vive en `npm test`, no en `test:rapido`.
- **Tags.** Empujarlos no puede bloquearse por secretos: sus commits ya estan
  en origin (comprobado).

## Plan de pruebas

- Guardian en verde sobre el arbol actual una vez troceado.
- Contraprueba dentro del mismo fichero: la funcion de escaneo sobre textos
  armados con `claves-falsas.ts` detecta cada patron (con ruta y linea, sin el
  valor) y respeta la lista blanca; una cabecera PEM sin cuerpo no se marca.
  Sin esto, un verde no distingue «no hay literales» de «no mira nada».
- Mutante manual en la revision: pegar un `sk_live_...` entero en un fichero
  versionado → rojo con ruta y linea, sin mostrar el valor.
- `doctor-deploy.test.ts` y `secretos.test.ts` en verde con las constantes.
- `npm test` completo con solo los tres rojos conocidos de Windows.
- Tags: `git cat-file -t v0.9.0` = `tag`, `git rev-list -n1 v0.9.0` = df59da2,
  igual v0.10.0 = b85f37e, y `git ls-remote --tags origin` con los dos.

## Lo que necesita decision de una persona

Las dudas que dejo el rol quedan resueltas con lo comprobado; se someten a la
aprobacion del plan:

1. **Artefactos historicos de TASK-066/068**: no se editan (valor de
   auditoria). Se cubren con la lista blanca de dos valores exactos y con el
   patron PEM que exige cuerpo.
2. **Commit de cada tag**: el del bump (df59da2, b85f37e), como v0.8.0 y
   v0.11.0.
3. **v0.12.0**: fuera de esta tarea; se crea al publicarla.
