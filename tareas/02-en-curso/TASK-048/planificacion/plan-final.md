# Plan — TASK-048: F6-T3 Skill de flujo mas ligera

(Es la respuesta del unico rol de brainstorm, arquitectura,
volcada aqui por quien orquesta, con las decisiones que el rol dejo
abiertas tomadas por quien orquesta: ver la ultima seccion.)

## Enfoque propuesto

Se amplia el patron que ya existe con `sincronizacion.md` y `avance.md`:
`task-workflow/SKILL.md` se queda con un indice y, por cada fichero de
referencia hermano, una linea que dice **cuando** leerlo.

1. **Salen de `task-workflow/SKILL.md`** (~24 KB → <15 KB, medido con
   `wc -c` al implementar):
   - `prerrequisitos.md`: `taskctl --version`, `$CLAUDE_PLUGIN_ROOT`, rama
     `develop`. Indice: «si `taskctl` no responde o no hay `develop`».
   - `cierre.md`: «Criterios verificables tras el cierre» y «Al cerrar una
     tarea» (se leen en el mismo momento, antes y despues de `finish`).
   - `trampas.md`: «Trampas que cuestan tiempo» (sin moverlo no se baja de
     15 KB).
   - `revision.md`: «La revision por pares» con su tabla del veredicto.
   Se quedan: ciclo de vida, comandos, fases y modos, reglas, config (con el
   puntero a `sincronizacion.md`) y el brainstorm (los tests 15-17 de
   `task-workflow.test.ts` los leen en el cuerpo).
2. **Contenido generico de las 4 revisoras en un solo sitio**:
   `task-workflow/revision.md` recoge tambien los bloques comunes de
   `*-reviewer/SKILL.md` («una sola ejecucion por ronda», plantilla de
   hallazgos CRITICO-1/IMPORTANTE-1/MENOR-1, tabla del veredicto, rondas,
   «sin hallazgos es valido», la puerta determinista, lo que el revisor no
   hace). Cada revisora conserva frontmatter, sus pasos de reproduccion de
   dominio, «Que se revisa», las definiciones de severidad con ejemplos de
   dominio y la cabecera del informe, y enlaza
   `../task-workflow/revision.md`.
3. **Tabla del veredicto corregida de paso**: las 4 revisoras dicen que
   `**aprobada**` no aprueba, y desde TASK-036 si aprueba (el enfasis se
   recorta). Al quedar una sola tabla, se escribe la correcta (la de
   `task-workflow`) y un test pasa cada fila por `veredictoAprobado`.
4. **Descripciones de las 5 skills por debajo de 300 caracteres**
   (`task-workflow` y las 4 revisoras), con los textos propuestos por el rol
   (conservan extensiones, nombres de tecnologia y los verbos de disparo).
   Test: `description.length <= 300` para todas las skills del plugin.

## Lo que el rol no cubrio

- Riesgos y testing no se lanzaron (tarea simple). La resolucion de
  `../task-workflow/revision.md` desde la carpeta de una revisora se
  comprueba en disco (la ruta relativa existe dentro del plugin instalado)
  y con `claude plugin validate`; no hay forma de probar en este entorno
  que el modelo lo lea en una sesion real.
- Los tamanos y longitudes del rol eran estimados: se miden al implementar.

## Riesgos aceptados y que los contiene

- **Las revisoras dejan de ser autonomas** (necesitan `task-workflow`): se
  distribuyen en el mismo plugin; aceptado porque el criterio exige un solo
  sitio y las 4 copias ya divergieron (tabla del veredicto obsoleta).
- **Que el modelo no lea una referencia cuando la necesita**: cada linea
  del indice nombra la condicion de lectura.
- **Fugas de nombres internos en los ficheros nuevos**: los tests de
  marcas internas se amplian a todos los `.md` de `task-workflow/` y a
  `revision.md` con la lista estricta de las revisoras.

## Plan de pruebas

- Test de tamano: `task-workflow/SKILL.md` < 15360 bytes.
- Test de descripciones: <= 300 caracteres en las 5 skills.
- Test de enlaces: todo fichero `.md` enlazado desde un SKILL.md existe.
- Test de veredicto: cada fila de la tabla de `revision.md` concuerda con
  `veredictoAprobado`.
- Ajuste de `revisores.test.ts` (tests 8, 11, 12) para leer revisora +
  `revision.md`; la copia del test 12 incluye `task-workflow`.
- `claude plugin validate` limpio; suite completa con los 3 rojos conocidos.

## Lo que necesita decision de una persona

Nada pendiente. Decidido por quien orquesta (backlog en continuo): las
revisoras dependen de `revision.md`; `trampas.md` sale; la tabla del
veredicto se corrige en esta tarea; textos de descripcion los del rol,
ajustados si al medir pasan de 300.
