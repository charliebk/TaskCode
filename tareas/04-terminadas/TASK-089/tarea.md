---
id: TASK-089
titulo: "Evitar literales con forma de secreto en el repo y tags de version que faltan"
tipo: feature
sprint: 0
etiquetas: [seguridad, distribucion, tests]
complejidad: simple
modelo_sugerido: sonnet
estado: terminada
plan_aprobado: true
rama: feature/task-089-evitar-literales-con-forma-de-secreto-en
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: 505513
tokens_implementacion: null
tokens_revision: 3056873
creado: 2026-11-07
actualizado: 2026-11-07
dependencias: []
---
## Objetivo

La proteccion de GitHub bloqueo el push de 0.11.0 por una clave de Stripe falsa de un test y hubo que reescribir el historial local. Evitar que vuelva a pasar y crear los tags v0.9.0 y v0.10.0 que nunca se crearon.

## Criterios de aceptacion
- [x] Un test de la suite falla si algun fichero versionado contiene un literal que case con los patrones de clave de GitHub (Stripe, AWS, GitHub...) sin trocear
- [x] Los fixtures de doctor-deploy construyen sus claves troceadas y siguen detectandose; sus tests en verde
- [x] Existen los tags anotados v0.9.0 y v0.10.0 en los commits de esas versiones y estan en origin
- [x] npm test en verde (salvo los tres rojos conocidos de Windows)

## Resultado

**Implementado.** Ningun fichero versionado lleva ya una clave con forma real, y un test lo vigila.

- `test/helpers/claves-falsas.ts` (nuevo, sin imports): todas las claves falsas de los tests,
  armadas por concatenacion. `deploy-fixtures.ts` las reexporta; `secretos.test.ts` y
  `doctor-deploy.test.ts` dejan sus copias y sus literales enteros (`sk_live_Nueva0...`, el
  ejemplo de Stripe, el de AWS, la cabecera PEM y el token de Slack). Las aserciones no cambian.
- `test/empaquetado/sin-literales-secretos.test.ts` (nuevo): un `git ls-files -z` y lectura de
  cada fichero de texto; patrones propios con la forma de los de push protection (Stripe live/test,
  AWS, GitHub ghp/pat, Slack, GitLab, npm, SendGrid y clave privada PEM con cuerpo). El fallo da
  fichero, linea y patron con el valor enmascarado. Lista blanca de tres valores exactos con motivo
  (ejemplo de AWS, ejemplo publico de Stripe y el token corto de Slack, los tres en origin desde
  TASK-066 en informes historicos que no se editan). Contrapruebas positiva y negativa.
- Desviacion del plan, a mejor: los patrones van **sin `\b` delante**. Con el, una clave
  pegada a un `\n` escrito como texto no casaba (asi se escapaba el token de Slack de TASK-066);
  la contraprueba cubre ese caso.

**Evidencia.** Mutante a mano: una `sk_live_` entera en `LICENSE` → rojo con
`LICENSE:23 stripe-live sk_l**** (36 caracteres)`. Suite completa: 2058 tests, 2053 pasan, 4 fallan
(los tres conocidos de Windows y «freno (MEN-1)», test de tiempos bajo carga ajeno a esta tarea:
aislado pasa 18 de 18), 1 saltado. En la suite del revisor fallaron solo los tres conocidos.

**Revision por pares.** Ronda 1 (general-purpose / sonnet / code-quality-reviewer): aprobada. Sus
mutantes (clave entera, clave tras `\n`, `ASIA` en JSON minificado, quitar cada entrada de la lista
blanca, quitar un patron, volver a poner `\b`) dan rojo; solo escapan el fichero sin `git add` y las
codificaciones UTF-16/URL. Dos MENOR, aceptados sin corregir:
- MEN-1: el guardian solo mira lo rastreado (`git ls-files`); un fichero nuevo sin `git add` no
  se mira. Se acepta: GitHub solo bloquea lo commiteado y el fichero se anade antes del commit.
- MEN-2: los patrones son un subconjunto de los de GitHub (faltan Anthropic, OpenAI, Shopify, Hugging
  Face...). Se acepta: hoy no hay ninguno en el repo y la lista es local y facil de ampliar.

**Tags.** v0.9.0 (`df59da2`) y v0.10.0 (`b85f37e`), anotados sobre el commit del cambio de
version como v0.8.0 y v0.11.0; creados y empujados tras el merge. `git cat-file -t` da `tag` en los dos, y
`git ls-remote --tags origin` lista `v0.9.0^{}` → `df59da2` y `v0.10.0^{}` → `b85f37e`.

## Transiciones

| fecha | fase | modo | decidido_por |
|---|---|---|---|
| 2026-11-07T19:37:59Z | plan | automatico | persona |
| 2026-11-07T19:45:01Z | approve | automatico | persona |
| 2026-11-07T19:45:16Z | start | automatico | persona |
| 2026-11-07T20:12:32Z | review | automatico | persona |
| 2026-11-07T20:35:33Z | finish | automatico | persona |

## Coste

| fecha | fase | fuente | entrada | cache_escritura | cache_lectura | salida | lecturas | total |
|---|---|---|---|---|---|---|---|---|
| 2026-11-07T19:43:18Z | diseno | agente:adfbb640fa14fb660 | 30 | 45623 | 446261 | 13599 | 25 | 505513 |
| 2026-11-07T20:34:28Z | revision | agente:ab271b90c99f51954 | 56 | 119161 | 2925602 | 12054 | 6 | 3056873 |
