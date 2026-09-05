# Plan — TASK-014: Comando taskctl finish (merge, cierre y actualización del tablero)

## Enfoque propuesto

`taskctl finish TASK-NNN` cierra el ciclo de vida: mergea la rama de la
tarea, mueve la carpeta a `04-terminadas/` y renderiza los tres artefactos
de cierre desde el frontmatter (cero LLM, corrección de §16). Pasos:

1. **Validación** (criterio 1): lectura preliminar +
   `assertTransitionAllowed('finish')` — exige `en-revision`, revisión
   primaria aprobada y, si `revision_codex`, también la de Codex. La fuente
   de verdad de "aprobada" es determinista: la línea `Veredicto:` del
   `revision/informe-revision-<n>.md` de mayor n (y para Codex, de
   `informe-codex-<n>.md`, la convención que usará TASK-020). Regla
   fail-closed: PENDIENTE o cambios-solicitados o ausencia = no aprobada;
   solo un veredicto que diga aprobada (sin esas marcas) pasa.
2. **Workspace limpio** (mismo motivo que start/review).
3. **Colisión de IDs** (criterio 4, solo hotfix/release, ANTES de mergear):
   el backmerge llevará `tareas/` de la rama a `develop`. Con
   `git ls-tree -r develop` se busca el mismo ID en cualquier carpeta de
   estado de `develop`; si existe con **otro título**, es la colisión
   documentada en TASK-012 (dos tareas distintas con el mismo número,
   nacidas una de `main` y otra de `develop`) y se aborta con instrucción
   antes de tocar nada. Mismo título = misma tarea, no es colisión.
4. **Merge por tipo** (criterio 2): `merge-feature-to-develop.sh`,
   `merge-fix-to-develop.sh`, `merge-hotfix-to-main.sh` o
   `merge-release-to-main.sh` (los dos últimos con el guard de origin de
   B2, hacen además tag + backmerge a develop y terminan en develop).
5. **Evidencia, no suposición**: tras el script, la rama activa debe ser
   `develop` y `git merge-base --is-ancestor` debe confirmar la rama de la
   tarea integrada en `develop` (y también en `main` para hotfix/release).
   Un backmerge cancelado (exit 0 "PARCIAL" del script) lo detecta la
   ancestría, no el exit code.
6. **Lectura fresca en develop** (regla de la doble lectura) + revalidación
   con el contexto de aprobación recalculado, y `moveTareaFile` a
   `04-terminadas/` con `estado: terminada`.
7. **Renderizado de cierre** (criterio 3), plantillas desde el frontmatter:
   - `CHANGELOG.md` (raíz): crea con cabecera si no existe; añade bajo
     `## Sin publicar` una línea `TASK-NNN (tipo) — título (fecha)`.
   - `docs/INDEX.md`: crea con cabecera si no existe; añade la línea de la
     tarea terminada (ID, título, etiquetas, rama, fecha, ruta de carpeta)
     — es el índice de búsqueda por etiquetas de §6.1.
   - `docs/BOARD.md`: se REGENERA entero reutilizando `runBoardCommand`
     (mismo render que `taskctl board`); es la dirección que la tabla de
     §8 ya da por hecha ("regenera docs/BOARD.md"). B5 decidirá si el
     comando `board` también lo escribe; aquí no se toca `board`.
8. El commit del resultado queda en manos de la persona (el paso 5 de §8.3
   es la decisión #14/C2, sin implementar): el comando lo dice al terminar.

## Alternativas consideradas

- **Mover la tarea a 04-terminadas ANTES del merge (en la rama)**: dejaría
  el merge ya "cerrado", pero exigiría que finish committee en la rama —
  y el auto-commit es justo la decisión #14 pendiente. Se mueve después,
  sobre develop, como hacen plan/approve con sus escrituras.
- **Renumerar automáticamente el ID en colisión**: invasivo (tocaría rama,
  carpeta, frontmatter e historial) y sorprendente. Mejor abortar con
  instrucción clara; renumerar es decisión humana.
- **Verificar el tag del script como evidencia**: duplicaría la derivación
  del nombre del tag del script (frágil ante cambios); la ancestría en
  main + develop ya prueba que el flujo completo ocurrió. Los tests sí
  asertan el tag concreto (ellos conocen el nombre esperado).

## Riesgos o preguntas abiertas

- Para hotfix/release, `main` queda con la carpeta en `03-en-revision/`
  (el movimiento a 04 ocurre en develop, sin auto-commit no puede viajar
  en el merge). Divergencia conocida y acotada: el siguiente backmerge la
  arrastra; se documenta en el Resultado.
- `ultimo_commit_revisado` (§16.3) se actualizará "al terminar una
  revisión": finish es el cierre de la tarea entera, no de una ronda —
  se deja para cuando exista el bucle de re-revisión real (TASK-018/019).
