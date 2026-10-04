# Configuracion de sincronizacion (`.taskcode/config.yml`)


Los artefactos derivados del estado de las tareas (un plan generado, un
tablero sintetizado) se pueden regenerar automaticamente despues de cada
transicion de tarea. Para eso, el proyecto declara en `.taskcode/config.yml`
un comando que reescribe esos ficheros y la lista de rutas que modifica.

**Tres claves opcionales, en `.taskcode/config.yml`:**

- **`comando_sincronizacion`**: el comando que el proyecto ejecuta para
  regenerar sus ficheros derivados. Ejemplo: `"node scripts/sincronizar-plan.mjs"`.
- **`rutas_sincronizacion`**: lista de ficheros que ese comando reescribe,
  en sintaxis flow (entre corchetes): `[docs/PLAN.md, docs/BOARD.md]`. Rutas
  relativas a la raiz del repo, siempre ficheros, nunca carpetas ni la raiz
  del repo. No pueden estar bajo `tareas/` ni bajo `.taskcode/`.
- **`timeout_sincronizacion`**: numero de segundos (entero ≥ 1) para esperar
  al comando. Opcional; por defecto, 60 segundos. Solo es valida si estan las
  otras dos claves.

**Reglas de declaracion:**

- Las dos primeras claves van juntas o no van: si una existe, la otra debe
  existir tambien. La tercera es opcional.
- Una clave mal escrita o un valor invalido aborta **todos** los comandos de
  `taskctl` que lean config, con un error que enumera las claves validas.

**Como funciona:**

Los ocho comandos que hacen un commit automatico (`new`, `import`, `plan`,
`approve`, `start`, `review`, `finish`, `codex-review`) siguen este flujo:

1. Escriben sus cambios en `tareas/`.
2. **Ejecutan el comando de sincronizacion** (si esta declarado).
3. Incluyen las rutas sincronizadas en el mismo commit (`git commit -m <msg> -- <rutas de tarea> <rutas sincronizadas>`).
4. Terminan la transicion.

**Ejecucion del comando:**

- Se lanza con el shell del sistema (`cmd.exe` en Windows, `/bin/sh` en
  POSIX), desde la raiz del repo, sin stdin (`'ignore'`).
- Forma portable recomendada: `node <script>` en lugar de, por ejemplo,
  `VAR=1 comando` o comillas simples. Los scripts con estos patrones no
  funcionan igual en todos los shells.
- Si el comando contiene ` #`, entrecomillarlo entero en `config.yml`: sin
  comillas, el propio fichero de configuracion toma lo que sigue como
  comentario y el comando llega truncado.

**Cuando el comando falla o toca ficheros no declarados:**

La transicion de la tarea **nunca se aborta** por la sincronizacion. Hay tres
casos en que no se aplica:

1. **Una ruta declarada ya tenia cambios sin commitear** antes del comando:
   se salta la ejecucion para no meter trabajo ajeno en el commit. La tarea se
   commitea igual.
2. **El comando falla** (`exit ≠ 0`) **o supera el timeout**: las rutas
   declaradas se dejan como en `HEAD` (sin aplicar sus cambios). La tarea se
   commitea igual.
3. **El comando modifico ficheros no declarados** en `rutas_sincronizacion`:
   esos ficheros no se commitean ni se tocan, y se nombran en el aviso. Las
   rutas declaradas si entran en el commit.

En los tres casos, `taskctl` avisa por stderr y sale con **codigo 3** (no 1):
la transicion se hizo, pero la sincronizacion no. Un 1 sigue significando que
el comando de `taskctl` fallo. El aviso
dice explicitamente que la transicion **ya se hizo**, que no se reintente el
comando de `taskctl`, y qué hacer a continuacion (regenerar a mano, limpiar el
workspace, o actualizar el config).

**Tres trampas:**

- **No usar un hook de pre-commit en su lugar.** Los commits automaticos son
  de rutas concretas; en ese modo, el `git add` de un hook entra en el commit
  pero el indice real se queda con el contenido viejo (`MM` en `git status`), y
  el siguiente comando aborta por workspace sucio. Para eso existen estas
  claves.
- **Conflictos en lineas de recuento.** Si el fichero derivado tiene lineas de
  recuento (por ejemplo, "5 tareas pendientes"), los merges de `review` o
  `finish` pueden chocar en ellas cuando hay mas de una tarea viva. Se resuelve
  regenerando el fichero derivado con el comando a mano, despues haciendo `git
  add <ruta>` y continuando el merge: `git merge --continue`.
- **Seguridad: el comando sale del config de tu repo.** Una rama que cambie
  `.taskcode/config.yml` decide que comando se ejecuta en tu maquina cuando
  alguien hace `finish` o `review`. Revisa los cambios a `config.yml` en la
  revision por pares como si fueran codigo de confianza: potencialmente lo es.

**Otra clave opcional, `excluir_de_revision`:** patrones (semantica de
`git :(glob)`) cuyo diff no se embebe en la peticion de revision; aparecen en
un `--stat` con la orden para pedirlos. Por defecto
`[**/dist/**, **/*.lock, **/*-lock.*, tareas/**]`; definirla **sustituye** esa
lista (incluye `tareas/**` si la quieres mantener) y `[]` no excluye nada.

**Compatibilidad con versiones anteriores del plugin:**

Un plugin anterior a 0.1.1 no conoce estas claves y aborta todos sus comandos
al leerlas. **Todo el equipo actualiza el plugin ANTES de anadirlas.**
