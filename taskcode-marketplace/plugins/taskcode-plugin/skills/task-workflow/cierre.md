# Cerrar una tarea

Se lee antes de lanzar `taskctl finish`, y otra vez justo despues si la tarea
tiene criterios que solo se verifican tras el merge.

## Al cerrar una tarea

1. Suite en verde **antes** de commitear.
2. Smoke test manual de punta a punta si la tarea toca el CLI o Git. Ha
   encontrado fallos **antes** que la revision mas de una vez, porque ejercita
   el flujo real en vez del orden mas comodo.
3. Criterios de aceptacion marcados en `tarea.md`, y seccion `## Resultado`
   con que se implemento, que encontro la revision, que se corrigio y que se
   dejo sin corregir. Es el unico sitio donde queda la experiencia: el diff no
   la cuenta. (Nota: si existen criterios bajo "Tras el cierre", se verifican
   despues de `finish` — ver "Criterios verificables tras el cierre
   (post-finish)", mas abajo.)
4. Actualizar el registro de progreso que use el proyecto.
5. `taskctl finish`.

Commits: mensajes en el idioma del proyecto, una rama por tarea, merge sin
fast-forward. Si el repo tiene activada la politica de conservar ramas, no se
borran tras el merge.

## Criterios verificables tras el cierre (post-finish)

Algunos criterios de aceptacion solo se pueden demostrar despues de que
`taskctl finish` fusione la rama en la rama base: un CI que pase en verde tras
el merge, una publicacion en produccion desde esa rama, o una ejecucion en vivo
que dependa del merge realizado. Esos criterios **no se pueden marcar antes de
cerrar la tarea**.

**Como declararlos en `tarea.md`:**

Dentro de la seccion `## Criterios de aceptacion`, añade una subseccion
`### Tras el cierre` para los que solo se verifican despues de `finish`:

```markdown
## Criterios de aceptacion

(Criterios normales que se verifican antes de finish)
- [ ] El parser acepta ficheros UTF-8 con BOM.
- [ ] La sintaxis de error da consejos especificos.

### Tras el cierre

(Se verifican despues de finish, en la rama base)
- [ ] La rama base pasa el CI a verde.
- [ ] La documentacion se publica automaticamente en main.
```

**Reglas:**

- Los criterios normales **deben estar todos marcados antes de `finish`**.
  `finish` no lee las casillas: lo comprueba quien cierra y el revisor.
- Los de "Tras el cierre" no cuentan para cerrar.
- Despues de cerrar, quien lanzo `finish` verifica esos criterios en la rama
  base mientras se resuelven los detalles de publicacion o despliegue.
- La evidencia de que pasaron se registra en **un commit posterior**, en la
  seccion `## Resultado` de la tarea en su carpeta de terminadas (o en el
  registro de progreso del proyecto si la estructura es distinta).

**Si un criterio post-cierre falla:**

No se reabre la tarea ya cerrada. En su lugar:

1. Documenta el fallo en el `## Resultado` de la tarea cerrada: qué
   criterio fallo, por que, y que evidencia se recopilo.
2. Abre una tarea **nueva de tipo `fix`** (en `00-planificadas/`) que corrija
   el problema. Referencia la tarea original en su descripcion.
3. Sigue el flujo normal: `plan`, `approve`, `start`, revision, `finish`.
