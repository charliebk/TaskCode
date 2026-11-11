# Informe de revision — TASK-096 (ronda 2)

- Commit revisado: 5a3838b8cf8577d766ab5054ef390c946d145fa8
- Revisor: code-quality-reviewer (agente independiente general-purpose/haiku, verificacion acotada)
- Veredicto: aprobada

Verificacion acotada (ver peticion-revision-2.md): diff de la correccion, MEN-1 a MEN-3 y busqueda del fallo que la correccion pueda abrir.

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|

Sin hallazgos nuevos. Ningun CRITICO, ni IMPORTANTE, ni MENOR introducido por la correccion.

## Verificacion de los hallazgos de la ronda 1

- **MEN-1 (corregido)**: `src/core/verificacion-proporcional.ts` (lineas 134-138) anade `if (!docs && diff.fueraDeDocs.length === 0) return completa`. Un diff solo de `tareas/**` sin `rutas_documentacion` ya no devuelve `selectiva`; el motivo dice «no declara rutas_documentacion». Sin la clave la rama no cambia nada (corta antes, linea 113). Test nuevo en `test/core/verificacion-proporcional.test.ts:189-196`. Mutante M6 (quitar `docs &&`) ahora muere. Resuelto.
- **MEN-2 (corregido)**: los errores de `rutas_verificacion_parcial` nombran su clave. Tests en las lineas 271 (`../fuera/**`) y 284 (`src` sin lista), con `doesNotMatch(/rutas_documentacion/)`. Mutante M2 ahora muere. Resuelto.
- **MEN-3 (corregido)**: `parcialDeclarada` exige rutas y selectiva; aserciones nuevas en las lineas 228 y 229. Mutante M11 ahora muere. Resuelto.

## Reproduccion

- Clon limpio en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-096-r2`, checkout de `5a3838b`. `npm install` y `npm run build` sin errores; tras el build, `dist` coincide con lo commiteado.
- `npm run test:rapido`: 710 tests, 710 pasan, 0 fallan.
- Suite completa `npm test` en el clon: 2181 tests, 1843 pasan, 335 fallan, 3 omitidos. No es verde en el entorno del revisor y no se certifica como regresion. Causas comprobadas en el log: 294 lineas `EBUSY ... rmdir` en el teardown; 275 lineas `execvpe(/bin/bash) failed` (el `bash` del PATH de PowerShell es el de WSL, sin instalar: los scripts de Git-Flow no arrancan); 6 `EPERM` por symlinks (caso conocido de Windows). Ninguno de `verificacion-proporcional` ni de `config`.
- Mutantes M2, M6 y M11 sobre el clon: los tres `# fail 1` (antes sobrevivian).
- Carpeta temporal borrada. El repo original no se modifico.

## Notas (fuera de la tabla, no abren ronda)

- `src/core/config.ts` (`validarPatronesExclusion`, lineas 884-886): el «Ejemplo» de un error de forma de `rutas_verificacion_parcial` sale de la rama de `excluir_de_revision` (`[**/dist/**, **/*.lock]`, «Para no excluir nada: []»), que no encaja con la clave nueva. MENOR, venia de la ronda 1 y la correccion no lo toca: anotado, no abre hallazgo.
- `package-lock.json` aparece modificado tras `npm install` en el clon: artefacto del entorno.

## Lecturas fuera del contexto permitido

- `revision/informe-revision-1.md`: el encargo pide verificar cada hallazgo de la ronda 1.
- `src/core/config.ts` lineas 760-930: para comprobar MEN-2 y la validacion cruzada, fuera del diff.
- `package.json` (scripts): para saber si `test:rapido` compila antes.
- `suite-completa.log` del clon: para clasificar los fallos de la suite completa.
