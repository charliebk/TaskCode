# Informe de revision — TASK-089 (ronda 1)

- Commit revisado: 66a5624532ed868bfeda6670fc8c1b089058eada
- Revisor: code-quality-reviewer (agente general-purpose independiente, modelo sonnet)
- Veredicto: PENDIENTE (escribelo con: taskctl veredicto TASK-089 aprobada | aprobada-con-correcciones | cambios-solicitados)

## Hallazgos

| ID | Severidad | Estado | Fichero | Origen |
|---|---|---|---|---|
| MEN-1 | MENOR | aceptado | taskcode-marketplace/plugins/taskcode-plugin/test/empaquetado/sin-literales-secretos.test.ts:~105 (ficherosVersionados) | implementacion |
| MEN-2 | MENOR | aceptado | taskcode-marketplace/plugins/taskcode-plugin/test/empaquetado/sin-literales-secretos.test.ts:~56 (PATRONES) | plan |

Origen, uno por hallazgo: `implementacion` si el codigo no hace lo que el plan pedia; `plan` si el
plan era ambiguo o equivocado y el codigo lo siguio; `especificacion` si el fallo esta en el
enunciado o en los criterios de aceptacion de la tarea.

Sin hallazgos CRITICO ni IMPORTANTE.

### MEN-1: el guardian solo mira ficheros ya rastreados (`git ls-files`)

Reproduccion: en el clon, `nuevo.txt` con una `sk_live_` entera SIN `git add`: guardian en verde
(3/3). Tras `git add nuevo.txt`: rojo con `nuevo.txt:1 stripe-live sk_l**** (32 caracteres)`.
Impacto bajo: GitHub solo bloquea lo commiteado, y el fichero ya estaria anadido antes del commit.
Ademas lee el working tree, no el indice. Aceptable; se podria usar
`git ls-files -co --exclude-standard` para avisar antes.

### MEN-2: la lista de patrones es un subconjunto de lo que bloquea GitHub

Cubre Stripe live/test, AWS (AKIA/ASIA), GitHub (ghp/pat), Slack, GitLab, npm, SendGrid y PEM con
cuerpo. No cubre otros que GitHub tambien detecta (Anthropic `sk-ant-`, OpenAI, `whsec_`, Shopify
`shpat_`, Hugging Face `hf_`...). `git grep` confirma que hoy no hay ninguno en el repo. El plan
acota a la familia de CA1; riesgo residual aceptado. UTF-16 o URL-encoding esquivan el guardian
(tambien a GitHub; no se pide).

## Evidencia ejecutada

Clon en `%LOCALAPPDATA%\pruebas-claude\taskcode\task-089-r1`, `npm install` + `npm run build` OK.

- Guardian + secretos + doctor-deploy: 70 tests, 70 pass. El guardian tarda ~0,4 s.
- Suite completa `npm test` (una vez): 2058 tests, 2054 pass, 3 fail: los tres conocidos de
  Windows (symlink EPERM en approve, chmod en directorios en plan, CRLF en plan rama base). Sin el
  intermitente de freno-stop.
- Mutantes (revertidos):
  - `sk_live_` entera en un fichero versionado: rojo, `fichero:linea patron sk_l**** (32 caracteres)`, sin el valor.
  - Clave pegada a un `\n` escrito como texto: rojo (confirma que quitar el `\b` era necesario).
  - `ASIA...` dentro de un JSON minificado: rojo.
  - Quitar cada una de las tres entradas de la lista blanca: rojo en cada caso (TASK-066 y TASK-089); lista minima y por valor exacto.
  - Eliminar el patron `stripe-live`: rojo (la contraprueba lo detecta).
  - Volver a poner `\b` delante de Slack, Stripe live, GitHub y GitLab: rojo en los cuatro (la contraprueba distingue).
  - Untracked: ver MEN-1. UTF-16 y URL-encoded: no detectados (MEN-2).
- Falsos positivos: ninguno en el repo; la contraprueba negativa cubre PEM sin cuerpo, `BEGIN PUBLIC KEY`, `sk_live_corta` y el literal de la propia regex.
- Duplicacion: un solo helper (`test/helpers/claves-falsas.ts`, sin imports) reexportado por `deploy-fixtures.ts`; las expectativas de los tests existentes no cambian de significado.
- CA3: `df59da2` es el bump 0.9.0 y `b85f37e` el 0.10.0. Correctos; los tags se crean tras el merge segun el plan.
- CA1, CA2 y CA4 cumplidos; CA3 pendiente por diseno (paso 4 del plan, tras el merge).

Carpeta de pruebas borrada tras comprobar que no habia nada que conservar.
