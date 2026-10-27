# Brainstorm — TASK-066, rol testing (ronda 1)

- Rol: `brainstorm-testing`
- Agente: a9c25c2a34e058983

## Qué es observable sin llamar a ningún agente
Todo lo que piden los criterios se ve desde fuera: stdout, `--json` (pasa `JSON.parse`), código de salida 0/1, `docs/doctor-deploy/<fecha>.md` y el estado del repo temporal antes y después. Pruebas contra repos git temporales reales con `main()`/binario, como `test/integracion/cli-flags-desconocidos.test.ts`.

## Plan de pruebas, cada una con su mutación
- **Secreto plantado solo en el historial** (`.env` con `AKIA…`/`sk_live_…` commiteado y borrado después): FALLA en el punto de secretos de git, evidencia con hash del commit, el valor no aparece en stdout ni JSON. Mutación: limitar la búsqueda al árbol.
- **Enmascarado**: ninguna subcadena de 8+ caracteres del secreto en stdout, JSON y certificado. Mutación: imprimir la línea coincidente sin máscara.
- **Repo limpio por tipo (Node, Rust, Python)**: tipo detectado visible, cero FALLA, salida 0, puntos de juicio NO VERIFICADO (no OK). Mutación: punto de juicio OK por defecto, o saltarse `Cargo.toml`/`pyproject.toml`.
- **NO APLICA con motivo**: en Rust, `npm audit` NO APLICA con motivo no vacío. Mutación: no filtrar por tipos.
- **Ningún OK sin evidencia, como propiedad sobre el JSON**; todo NO VERIFICADO dice qué falta. Mutación: OK en lockfile sin evidencia.
- **Catálogo y override**: `scripts/doctor-deploy.yml` real se parsea, contiene los 20 ids y los añadidos con sus campos, no menciona TaskCode y es ASCII (patrón de `heuristica-complejidad.test.ts`). Desactivar sin motivo aborta; con motivo, el punto sale marcado. Mutación: quitar la comprobación de `motivo` o borrar un id.
- **`--escribir`**: fichero con hash de `HEAD`, rama y tipos; tabla con tantas filas como puntos del JSON. Mutación: HEAD fijo o rama vacía.
- **Herramientas ausentes**: PATH sin `gitleaks`/`cargo audit` → NO VERIFICADO «falta gitleaks», nunca OK ni FALLA. Mutación: tratar ENOENT como «sin hallazgos».

## Aserciones trampa que hay que evitar en esta tarea concreta
- Enmascarado probado solo con `!stdout.includes(secretoCompleto)`.
- Aseverar «hay alguna FALLA» y salida 1 sin decir qué punto.
- Repo «limpio» que pasa porque no hay herramientas (todo NO VERIFICADO): aseverar OK en los deterministas propios.
- Certificado dependiente de la fecha del sistema: inyectarla o buscar por patrón.
- Resultados que dependen de herramientas instaladas en la máquina: controlar el PATH.
- `npm audit`/`cargo audit` reales tiran de red: fuera de la suite obligatoria.

## Qué pruebas existentes cambian de expectativa
- `test/integracion/cli-flags-desconocidos.test.ts` («los 13 comandos por main()») pasa a 14: añadir a `COMANDOS`, no relajar el recuento.
- Tests de ayuda en `cli-main.test.ts` (posiblemente listan comandos; no verificado).
- `test/empaquetado/distribucion.test.ts`: recompilar y commitear `dist`.
- `doctor.test.ts` no debería cambiar.

## Cómo envejece
- Propiedades globales sobre el JSON escalan; aserciones por id o snapshots de la tabla no.
- Cada patrón de secreto nuevo necesita su par «detecta / no da falso positivo».
- Parsers de herramientas externas sin cubrir contra la herramienta real: asumirlo por escrito.
- Un fixture por tipo reutilizado en solo lectura para no alargar la suite.

## No cubierto a propósito
- Ejecución real de `npm/cargo/pip-audit`, `dotnet`, `govulncheck` (red, inestable): solo la ausencia.
- Java, .NET, Go, PHP, Ruby, Docker: test tabular de marcadores.

## Desacuerdos previstos
- Con riesgos: cubrir el mecanismo con 2-3 patrones y la ausencia de herramientas, no todos.
- Con arquitectura: si las herramientas se invocan sin poder sustituir PATH o `cwd`, NO VERIFICADO no se prueba de forma determinista.

## Suposiciones no verificadas
- Que `cli-main.test.ts` enumera los comandos.
- Que el parser plano soporta listas por punto (ver `heuristica-complejidad.test.ts:254`).
- Que el CI de Linux no tiene `gitleaks`.
- Que en Windows `git log -p` sobre fixtures no mete CRLF que rompa números de línea.
