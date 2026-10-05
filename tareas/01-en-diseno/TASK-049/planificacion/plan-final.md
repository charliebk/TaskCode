# Plan — TASK-049: F6-T4 Metadatos del plugin y modelo de los agentes

(Es la respuesta del unico rol de brainstorm, arquitectura, volcada aqui por
quien orquesta. El rol no tenia acceso web: quien orquesta comprobo la
documentacion despues, y la licencia la decidio Carlos.)

## Documentacion comprobada (2026-10-05, Claude Code 2.1.288)

- `https://code.claude.com/docs/en/plugins-reference`: `displayName`
  (string, nombre en la UI), `repository` (string, no validado), `license`
  (string, «SPDX identifier such as MIT»), `keywords` (array de strings).
  `claude plugin validate ./ruta` es la comprobacion de referencia.
- `https://code.claude.com/docs/en/sub-agents`: `model` admite `sonnet`,
  `opus`, `haiku`, `fable`, un ID completo (p. ej. `claude-opus-5-5`) o
  `inherit`. Sin el campo, el orden es: parametro `model` de la invocacion →
  frontmatter → `CLAUDE_CODE_SUBAGENT_MODEL` → modelo de la conversacion.
- `https://code.claude.com/docs/en/discover-plugins`, «Keep plugins updated»:
  la sesion en marcha conserva lo que ya cargo; tras actualizar hay que
  recargar (`/reload-plugins`) o reiniciar.

## Enfoque propuesto

1. **`plugin.json`**: se anaden `displayName: "TaskCode"`, `repository:
   "https://github.com/charliebk/TaskCode"`, `license: "MIT"` y `keywords`
   (la misma lista que la entrada del plugin en `.claude-plugin/marketplace.json`,
   que es el precedente: no se inventan valores).
2. **`LICENSE`** (MIT, a nombre de charlie.bk, 2026) en la raiz del repo y en
   la carpeta del plugin (lo que se instala es la carpeta del plugin).
3. **README raiz**, «Instalar el plugin»: forma CLI equivalente
   (`claude plugin marketplace add`, `claude plugin install`) y una
   subseccion «Actualizar»: `claude plugin marketplace update
   taskcode-marketplace`, `claude plugin update
   taskcode-plugin@taskcode-marketplace` y reiniciar Claude Code (o
   `/reload-plugins`). Los nombres de subcomando se confirman con
   `claude plugin --help` al implementar. El README del plugin solo remite al
   raiz al principio de «Instalacion local» (su bloque de PowerShell lo
   extrae `distribucion.test.ts`).
4. **`model:` en los agentes de brainstorm: no se pone.** Decision:
   - Un alias fijo barato contradice §16.6 de la metodologia (el modelo
     depende de la complejidad de cada tarea, `modelo_sugerido`) y obliga a
     publicar version para cambiarlo.
   - `inherit` explicito anularia `CLAUDE_CODE_SUBAGENT_MODEL`, que es la
     palanca de coste que tiene quien instala el plugin.
   - Sin el campo, manda el parametro `model` de cada lanzamiento, que es
     donde quien orquesta pone `modelo_sugerido` (la salida de `review` ya
     lo nombra).
   La decision, con los valores admitidos y la URL, va en una seccion corta
   del README del plugin («Modelo de los agentes»).

## Lo que el rol no cubrio

Riesgos, testing y dominio no se lanzaron (tarea simple). Que `keywords` en
espanol ayuden a encontrar el plugin no se ha evaluado; se copian las del
marketplace.

## Riesgos aceptados y que los contiene

- **Metadatos duplicados entre `plugin.json` y `marketplace.json`**: test de
  igualdad de `displayName`, `repository` y `keywords`.
- **Consumidores que no reciben el cambio**: la version sube al cerrar la
  fase 6 (release de fase), no en esta tarea.

## Plan de pruebas

- `claude plugin validate` sobre el plugin y sobre el marketplace: exit 0 y
  sin avisos; salida al Resultado.
- Test nuevo: los cuatro campos presentes, `license` igual a `MIT`, LICENSE
  existe en el plugin, y coincidencia con la entrada del marketplace.
- Test: ningun agente de `agents/` declara `model:` (fija la decision).
- Suite completa: los 3 rojos conocidos de Windows.

## Lo que necesita decision de una persona

Decidido: licencia MIT (Carlos, 2026-10-05). Nada mas pendiente.
