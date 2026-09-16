# Peticion de revision — TASK-022 (ronda 3)

- Tarea: TASK-022 — Documentación de equipo e incorporación de colaboradores
- Rama revisada: feature/task-022-documentacion-de-equipo-e-incorporacion
- Rama base: develop
- Commit revisado (HEAD): 7767716
- Fecha: 2026-09-16
- Agente revisor sugerido: code-quality-reviewer (independiente de las dos
  rondas anteriores)
- Rondas anteriores: `informe-revision-1.md` (cambios-solicitados, 3
  importantes/3 menores) → corregido en `c66a3d8` → `informe-revision-2.md`
  (cambios-solicitados, 1 importante corregido a medias + 3 menores) →
  corregido en `7767716`.

## Instrucciones para el agente revisor

Eres un revisor INDEPENDIENTE, sin contexto de las rondas anteriores más
allá de lo que leas aquí. Verifica tú mismo, no confíes en que "ya se
corrigió". Reproduce: resuelve rutas a mano, contrasta cada afirmación
fáctica contra su fuente citada. Clasifica CRÍTICO/IMPORTANTE/MENOR, o "sin
hallazgos".

## Qué cambió en esta ronda

Commit `7767716` corrige N1 (importante, ronda 2), N2 y N3 (menores, ronda
2) sobre `docs/contexto/INCORPORACION.md:46-59` (párrafo "Probado /
Pendiente de confirmar" sobre `taskctl` por PATH) y `README.md` (ficha del
documento en la tabla de índice). El texto nuevo es:

> **Probado**: en Windows nativo, con el directorio `bin/` del CLI en el
> PATH, `taskctl` resuelve como comando suelto — job `windows-latest` del
> CI, step que hace `export PATH="$(pwd)/bin:$PATH"` sobre el checkout
> (item E3 del checklist de terminación). **Pendiente de confirmar**: que
> instalar el plugin deje ese `bin/` en el PATH de forma utilizable. Lo
> único confirmado es que el mecanismo existe (aparecen los `bin/` de otros
> plugins cacheados en el PATH de una sesión); `taskctl` como comando
> suelto todavía no se ha visto funcionar (item E6/AC7 del checklist;
> también señalado en `HALLAZGOS.md`). Ese PATH lo compone Claude Code para
> su Bash tool (`SKILL.md`), así que no cuentes con `taskctl` en una
> consola del sistema: si en la **sesión siguiente** a la instalación
> `--version` da `command not found`, reinicia la sesión y, si persiste,
> sigue el resto del orden de diagnóstico de `SKILL.md`.

## Qué comprobar

1. Contrasta ese párrafo, frase por frase, contra `docs/contexto/
   CHECKLIST_TERMINACION.md` (items E3, E6/AC7), `docs/contexto/
   HALLAZGOS.md` y `skills/task-workflow/SKILL.md` — ¿alguna afirmación
   sigue sin sostenerse, o el texto ahora es preciso?
2. Busca hallazgos nuevos que la propia reescritura pueda haber introducido
   (no te limites a los 3 puntos de la ronda 2) — coherencia con el resto
   del documento, tono, alguna referencia que ya no cuadre.
3. Verifica que los 7 enlaces relativos de `docs/contexto/INCORPORACION.md`
   siguen resolviendo tras esta edición.
4. Verifica que `README.md:69` (ficha del documento) ya describe los cuatro
   pasos reales del documento.
5. Confirma que `docs/PROPUESTA_METODOLOGIA.md` sigue intacto:
   `git diff develop..HEAD -- docs/PROPUESTA_METODOLOGIA.md` vacío.
6. Relee los 3 criterios de aceptación en
   `tareas/03-en-revision/TASK-022/tarea.md` y decide si se sostienen ya
   **sin reservas**.

## Vuelca tu informe en

`tareas/03-en-revision/TASK-022/revision/informe-revision-3.md`, sin borrar
nada de las rondas anteriores.

## Formato del veredicto

Exactamente una de estas dos líneas al final (se parsea por regex,
fail-closed): `- Veredicto: aprobada` (o `aprobada con...`) o
`- Veredicto: cambios-solicitados`.
