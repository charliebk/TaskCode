---
id: TASK-088
titulo: "taskctl doctor avisa si falta comando_verificacion con tests detectables"
tipo: feature
sprint: 0
etiquetas: [doctor, verificacion]
complejidad: simple
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: feature/task-088-taskctl-doctor-avisa-si-falta-comando-ve
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 380039
tokens_implementacion: null
tokens_revision: 4089249
creado: 2026-11-07
actualizado: 2026-11-07
dependencias: []
---
## Objetivo

Sin comando_verificacion no funcionan los frenos de la 0.11 (hook Stop, puerta de finish, guardian de merges), y ToolsaWeb no lo tenia. doctor detecta los tests del proyecto y propone el comando.

## Criterios de aceptacion
- [x] taskctl doctor da AVISO si falta comando_verificacion y detecta tests (package.json con test, Cargo.toml, pom.xml, .csproj...), y propone el comando detectado
- [x] Si el proyecto no tiene tests detectables sigue saliendo omitida como hoy
- [x] Lo cubren tests con proyectos temporales de cada tipo
- [x] npm test en verde (salvo los tres rojos conocidos de Windows)

## Resultado

**Implementado.** La comprobacion `verificacion` de `taskctl doctor` ya no es siempre
`omitida` sin `comando_verificacion`: si la raiz del proyecto tiene tests detectables
pasa a `aviso`, con el comando listo para pegar en `.taskcode/config.yml` como arreglo;
si no los tiene, sigue en `omitida` con el mismo texto (matiza a proposito la decision
de TASK-070; decidido por Carlos en el plan).

- `src/core/comando-tests.ts` (puro): reglas manifiesto → comando. `package.json` con
  `scripts.test` propio (el de `npm init` no cuenta; `pnpm`/`yarn`/`npm` segun el
  fichero de bloqueo), `Cargo.toml`, `pom.xml` y `build.gradle(.kts)` (con
  `mvnw`/`gradlew` si existen, en la forma de la plataforma), `*.csproj`/`*.sln`,
  `go.mod`, `pyproject.toml` con pytest. Varios se encadenan con `&&`.
- `src/fs/deteccion-tests.ts`: lista solo la raiz y lee `package.json`/`pyproject.toml`
  con tope de 1 MiB y sin BOM; si algo no se lee, no detecta nada (→ `omitida`).
- `comprobarVerificacion(cfg, detectar)`: la deteccion solo se ejecuta si falta la clave.
- README del plugin, viñeta «Verificacion», actualizada.

**Evidencia.** Tests: `test/core/comando-tests.test.ts`, `test/fs/deteccion-tests.test.ts`
y 17 casos en `test/commands/doctor.test.ts` (uno por tipo de proyecto con repo temporal,
subcarpeta que no cuenta, clave declarada, config rota y CLI `--json`). Suite completa
tras las correcciones: 2055 tests, 2051 pasan, 3 fallan (los tres conocidos de Windows:
symlink `EPERM`, `chmod` en NTFS, CRLF), 1 saltado (enlaces simbolicos, EPERM en Windows).
En la primera pasada fallo ademas «freno: respeta el timeout»: test de tiempos bajo
carga, ajeno a esta tarea; aislado paso 3 de 3.

**Revision por pares.** Ronda 1 (general-purpose / sonnet / code-quality-reviewer):
15 mutantes, 14 muertos; tres MENOR, todos corregidos en la ronda 2:
- MEN-1: un `package.json`/`pyproject.toml` con BOM no se detectaba → se quita el BOM al leer.
- MEN-2: el motivo del mensaje no tenia tests (mutante superviviente) → cada caso lo comprueba.
- MEN-3: caminos de `deteccion-tests.ts` sin cubrir → test nuevo con tope de tamaño,
  directorio inexistente, directorio con nombre de manifiesto y enlaces.
Ronda 2: aprobada, sin hallazgos nuevos; todos los mutantes de las correcciones mueren.

**Decidido no corregir / aceptado.**
- `Cargo.toml`, `go.mod`, `pom.xml` y `.csproj`/`.sln` proponen comando sin comprobar
  que haya tests reales: el aviso es informativo y es lo que pide el criterio.
- Nombres sin distinguir mayusculas (por NTFS): en Linux propondria `cargo test` para un
  `CARGO.TOML` que cargo no reconoce. Borde documentado en el codigo.
- Monorepo con manifiestos solo en subcarpetas: no se detecta y sale `omitida`, como antes.
- La rama de enlaces simbolicos solo se prueba en el CI de Linux (EPERM en Windows).

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-11-07T17:56:07Z | plan | automatico | persona |
| 2026-11-07T18:02:53Z | approve | automatico | persona |
| 2026-11-07T18:03:06Z | start | automatico | persona |
| 2026-11-07T18:28:14Z | review | automatico | persona |
| 2026-11-07T19:24:42Z | review | automatico | persona |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |
|---|---|---|---|---|---|---|---|---|
| 2026-11-07T18:01:59Z | diseno | agente:a8affc352f2ef1cc3 | 18 | 56486 | 314760 | 8775 | 16 | 380039 |
| 2026-11-07T19:03:47Z | revision | agente:a460db242356fd7d1 | 52 | 118392 | 2712468 | 13091 | 4 | 2844003 |
| 2026-11-07T19:34:13Z | revision | agente:a94a8607b57b52ce7 | 26 | 102283 | 1136544 | 6393 | 2 | 1245246 |
