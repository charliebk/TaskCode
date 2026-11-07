# Plan — TASK-088: taskctl doctor avisa si falta comando_verificacion con tests detectables

(Es la respuesta del unico rol de brainstorm, arquitectura,
volcada aqui por quien orquesta.
Con un solo rol no hay unificador ni desacuerdos que resolver; en su lugar,
el plan senala lo que ese rol no cubrio.)

## Enfoque propuesto

Se amplía la comprobación que ya existe, `verificacion`, sin crear otra. Cuando falta `comando_verificacion`, doctor mira los manifiestos de la **raíz** del proyecto. Si encuentra tests, la comprobación pasa a `aviso` con el comando propuesto en `arreglo`. Si no los encuentra, devuelve la misma `omitida` de hoy, con el mismo texto.

- La comprobación está en `src/commands/doctor.ts:402-412` (`comprobarVerificacion(cfg)`) y se llama una sola vez, en `doctor.ts:674`, dentro de `envolver`. Ningún test la importa directamente.
- Ya existen los niveles `aviso(id, mensaje, arreglo)` y `omitida`, en `src/core/doctor.ts:30,42`. Un aviso no cambia el código de salida (`core/doctor.ts:45-47`). El texto y el JSON ya muestran `arreglo` (`core/doctor.ts:71-75,93`), así que **no hace falta tocar `core/doctor.ts`**.

Piezas, en orden de construcción:

1. **Nueva, pura: `src/core/comando-tests.ts`.** Exporta `proponerComandosTests(entrada: { ficherosRaiz: readonly string[]; packageJson: string | null }): { comando: string; motivo: string }[]`. Reglas en orden fijo (lista final según las decisiones de abajo):
   - `package.json` con `scripts.test` (que no sea el por defecto de `npm init`) → `npm test`.
   - `Cargo.toml` → `cargo test`.
   - `pom.xml` → `mvn test`.
   - `*.csproj` o `*.sln` → `dotnet test`.

   No toca el disco. Sigue el reparto del proyecto: lo puro en `core/` y la lectura en `fs/` (precedente: `core/doctor.ts`, cabecera «No toca disco», y la pareja `core/doctor-deploy.ts` / `fs/deteccion-app.ts`).
2. **Nueva, fina: `src/fs/deteccion-tests.ts`.** Exporta `detectarComandosTests(cwd)`: `readdirSync(cwd)` de la raíz, sin recursión, y lee `package.json` solo si existe y ocupa como mucho 1 MiB (mismo tope que `MAX_BYTES_MARCADOR_APLICACION`, `fs/deteccion-app.ts:94`). Si algo no se puede leer, lista vacía → `omitida`.
3. **Se extiende: `comprobarVerificacion(cfg, detectar: () => ComandoTests[])`** en `doctor.ts:402`.
   - La detección se pasa como función: solo se lee el disco cuando falta la clave.
   - Las ramas `cfg === null` (línea 403) y `ok` (línea 411) quedan intactas.
   - En el aviso, `mensaje` dice qué se detectó y por qué; `arreglo` lleva la línea exacta: `Declara en .taskcode/config.yml: comando_verificacion: "npm test"`. Si se detecta más de una cosa, se propone la primera y se nombran las demás.
4. **Se reescribe el comentario de `doctor.ts:396-401`**, que hoy afirma la decisión de TASK-070 («sin la clave es `omitida` y no `aviso`»). Esta tarea la matiza a propósito: `omitida` si no hay tests, `aviso` si los hay.
5. **Documentación:** `README.md:652-655` del plugin (viñeta «Verificación») describe los dos casos y la lista de manifiestos.

Dependencias `commands → fs → core`, sin ciclos. Coste: una lectura de un directorio y como mucho un fichero de 1 MiB, solo cuando falta la clave.

**Alternativas descartadas:**
- Reutilizar `fs/deteccion-app.ts` y el catálogo `scripts/doctor-deploy.yml`: ata `doctor` al catálogo de despliegue, usa `git ls-files` con profundidad 3 (propondría comandos de subcarpetas que no funcionan desde la raíz) y exigiría que el proyecto fuera un repo.
- Meter las reglas dentro de `doctor.ts`: mezcla reglas con disco en un fichero de más de 690 líneas y no se pueden reutilizar.

## Lo que el rol no cubrio

- **Criterio 1:** la forma está cubierta; qué manifiestos entran y qué comando corresponde es regla de dominio no validada por el rol (se decide abajo).
- **Criterio 2:** cubierto por diseño (se conserva el texto de `doctor.ts:405-409`). Casos límite no mirados por un rol de riesgos: `test` por defecto de `npm init`, `package.json` roto, monorepo con manifiestos solo en subcarpetas.
- **Criterios 3 y 4:** el plan de pruebas es propuesta de arquitectura, no de un rol de testing.
- No revisados: modos de fallo en Windows (mayúsculas en `*.CSPROJ`, enlaces simbólicos en la raíz).

## Riesgos aceptados y que los contiene

- **Monorepo con manifiestos solo en subcarpetas no se detecta:** sale `omitida` como hoy; sin regresión.
- **El comando propuesto puede no ser el correcto:** es solo propuesta; doctor no la ejecuta ni escribe (`doctor.ts:8`, «SOLO LEE») y el aviso no cambia el código de salida.
- **`package.json` ilegible o enorme:** tope de 1 MiB, lista vacía → `omitida`, y `envolver` (`doctor.ts:95-110`) convierte cualquier excepción en `error` de esa comprobación.
- **El caso «hay tests» cambia de nivel:** un proyecto que daba 0 avisos pasa a tener 1. Intencionado; salida 0.

## Plan de pruebas

Con repos temporales reales, sin mocks:

- **`test/core/comando-tests.test.ts`** (sin disco): `package.json` con `scripts.test`; sin `test` o con el por defecto de npm (no cuenta); JSON roto (vacío); `Cargo.toml`, `pom.xml`, `App.csproj`, `X.sln`; orden con varios.
- **`test/commands/doctor.test.ts`**, junto a los de TASK-070 (líneas 306-339), con `conRepo`, `config()` y `por()`:
  - Uno por tipo de proyecto: manifiesto en la raíz → `verificacion` = `aviso`, `arreglo` contiene `comando_verificacion: "<comando>"`, `r.codigo === 0`.
  - `sub/Cargo.toml` no cuenta → `omitida`.
  - Clave declarada y manifiesto presente → `ok`.
  - Config rota y manifiesto presente → `omitida`.
- El test existente de la línea 306 no cambia (demuestra el criterio 2).
- Uno por CLI con `--json` (helper `cli()`, línea 79) que comprueba el aviso con su `arreglo`.
- Cierre: `npm test` completo; solo los tres rojos conocidos de Windows y los `EBUSY` de teardown.

## Lo que necesita decision de una persona

Decidido por Carlos el 2026-11-07 (respuestas anotadas; mandan sobre el enfoque de arriba donde difieran):

1. **Manifiestos:** los cuatro del criterio (`package.json` con `test`, `Cargo.toml`, `pom.xml`, `*.csproj`/`*.sln`) **más** `build.gradle`/`build.gradle.kts` (→ gradle), `go.mod` (→ `go test ./...`) y `pyproject.toml` (→ `pytest`).
2. **Comando según el proyecto:** `pnpm test` si hay `pnpm-lock.yaml`, `yarn test` si hay `yarn.lock`, si no `npm test`. Maven: `./mvnw test` si existe el wrapper (en Windows, la forma que funcione en `cmd.exe`, `mvnw.cmd`), si no `mvn test`; gradle igual con `gradlew`/`gradle`. `dotnet test` con `.csproj` o `.sln`.
3. **Varios manifiestos a la vez:** se encadenan con `&&` en el orden fijo (p. ej. `npm test && cargo test`), no se propone solo el primero. Sustituye la última viñeta del punto 3 del enfoque.
4. **Matizar TASK-070:** sí. `omitida` si no hay tests detectables; `aviso` si los hay.
5. Checkpoint obligatorio: `taskctl approve TASK-088`.
