# Informe de revision — TASK-088 (ronda 1)

- Commit revisado: 62c408b9b346514cb074c6a521f2eea25ee50d5e
- Revisor: general-purpose / sonnet / code-quality-reviewer
- Veredicto: cambios-solicitados

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | abierto | src/fs/deteccion-tests.ts:35-42 | implementacion |
| MEN-2 | MENOR | abierto | test/commands/doctor.test.ts:347-358; src/commands/doctor.ts:~420 | implementacion |
| MEN-3 | MENOR | abierto | src/fs/deteccion-tests.ts:20-27, 42-43 | implementacion |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Propuesta del revisor: aprobada-con-correcciones. En modo automatico lo revisado es lo que se
mergea, asi que los tres MENOR (baratos) se piden como cambios-solicitados.

## Contexto de la ejecucion

- Clon en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-088-r1` (borrado al terminar). HEAD 2f55583 = 62c408b + peticion de revision. `npm install` y `npm run build` limpios; `tsc --noEmit` sin errores.
- Tests afectados (`comando-tests`, `doctor`): 67/67.
- Suite completa una vez: 2049 tests, 2046 pasan, 3 fallan: los tres conocidos de Windows (symlink `EPERM`, `chmod` en NTFS, CRLF). Ningun otro rojo.
- Cobertura: `comando-tests.js` 100/100/100; `deteccion-tests.js` 83,33 % (lineas 20-27 y 42-43 sin cubrir).

## Mutantes

| Mutante | Resultado |
|---|---|
| Quitar el filtro del `test` de `npm init` | muerto |
| Quitar la rama `yarn` / `pnpm` | muerto |
| Wrapper de Windows sin `.bat` | muerto |
| Gradle sin `build.gradle.kts` | muerto |
| `.csproj`/`.sln` con extension vacia (`>` a `>=`) | muerto |
| `pytest` siempre verdadero | muerto |
| `&&` cambiado por `;` | muerto |
| Nombres sin `toLowerCase` | muerto |
| Sin `.sln` / motivo `.sln` sustituido | muerto |
| Sin `trim()` del script | muerto |
| Rama `win32` desactivada | muerto |
| `doctor` sin aviso (`if (false)`) | muerto (13 rojos) |
| **`doctor` sin la lista de motivos en el mensaje** | **SOBREVIVE** (MEN-2) |

## Ejecucion real de `taskctl doctor`

| Proyecto | `verificacion` |
|---|---|
| `package.json` con `scripts.test: node --test` | AVISO, propone `npm test` |
| `package.json` con el `test` de `npm init` | omitida |
| `package.json` + lock + `Cargo.toml` + `go.mod` + `pyproject.toml` con pytest | AVISO, `npm test && cargo test && go test ./... && python -m pytest` |
| Repo vacio | omitida |
| Con `comando_verificacion: "npm test"` | ok |
| Directorio llamado `Cargo.toml` | omitida (correcto) |
| `package.json` con BOM UTF-8 y `test` valido | omitida (MEN-1) |

Los cuatro criterios de aceptacion se cumplen.

## Reproduccion de los hallazgos

### MEN-1 — `package.json` / `pyproject.toml` con BOM UTF-8 no se detectan

`leerAcotado` lee con `readFileSync(ruta, 'utf8')`, que conserva el BOM, y `JSON.parse` lo rechaza; `tieneScriptTest` devuelve `false`. Reproduccion: `printf '\xef\xbb\xbf{"scripts":{"test":"jest"}}' > package.json`, commit, `node bin/taskctl doctor` → `omitida` en vez de AVISO. Habitual en Windows (`Out-File` de PowerShell 5.1). Falla en cerrado, por eso MENOR. Arreglo: quitar el BOM inicial antes de parsear, con test.

### MEN-2 — la lista de motivos del mensaje no tiene red

Sustituir `detectados.map((d) => d.motivo).join(', ')` por `''` deja los 67 tests en verde: los tests de `doctor` solo comprueban el prefijo del mensaje y el `arreglo`. Arreglo: comprobar el motivo esperado entre parentesis en el test por tipo.

### MEN-3 — caminos de `deteccion-tests.ts` sin cubrir

Symlinks a fichero y enlaces rotos (20-27; no creables en Windows sin privilegios), el tope de 1 MiB de `package.json`/`pyproject.toml` (42-43, testeable en cualquier plataforma) y el `readdirSync` fallido. Caminos defensivos que fallan en cerrado hacia `omitida`.

## Otras comprobaciones, sin hallazgo

- Con la clave declarada, `detectar` no se invoca; con config invalida, `omitida` antes de detectar.
- El README describe lo implementado.
- No se tocan skills, agentes ni `scripts/` del plugin.
- Decision de plan, no hallazgo: `Cargo.toml`, `go.mod`, `pom.xml` y `.csproj`/`.sln` proponen comando sin verificar que haya tests reales; el aviso es informativo y el criterio pide eso.
- Borde no reportado: la comparacion sin mayusculas propone `cargo test` para `CARGO.TOML` aunque en Linux cargo no lo reconoceria; decision documentada (NTFS).
