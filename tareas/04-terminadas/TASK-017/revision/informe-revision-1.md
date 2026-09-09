# Informe de revisión — TASK-017 (ronda 1)

- Rama revisada: `feature/task-017-catalogo-de-skills-determinista-con-sele`
- Commit revisado: `07dbf09` (implementación en `ffa36cf`, rama base `develop`)
- Revisor: agente revisor independiente (no autor; sin acceso a la conversación de implementación)
- Fecha: 2026-09-09
- Veredicto: **cambios-solicitados**

---

## 1. Qué se reprodujo

Todo se ejecutó sobre un *worktree* aislado en `C:\Users\nullcad2025\AppData\Local\Temp\rev-task017`
(creado con `git worktree add --detach ... 07dbf09`), sin tocar el repositorio original.
El *worktree* ya se ha eliminado; los sandboxes de prueba end-to-end también.

### 1.1 Suite completa

```
cd <worktree>/taskcode-marketplace/plugins/taskcode-plugin
npm install     # added 3 packages, 0 vulnerabilities
npm test        # tsc + node --test --experimental-test-coverage "dist/test/**/*.test.js"
```

Resultado:

```
# tests   815
# pass    812
# fail      3
# skipped   0
```

Los **tres** fallos son exactamente los conocidos de Windows nativo que documenta `CLAUDE.md`,
verificados uno a uno por su mensaje de error, no por su nombre:

| # | Test | Error real | Causa conocida |
|---|------|-----------|----------------|
| 118 | `approve: propaga cualquier error de stat que NO sea ENOENT` | `EPERM: operation not permitted, symlink` | truco del symlink |
| 268 | `plan: propaga cualquier error de escritura que NO sea EEXIST` | `Missing expected rejection` | `chmod` sobre directorio, no-op en NTFS |
| 274 | `plan: la rama base real tiene la tarea en un estado distinto…` | `'…develop\r\n' !== '…develop\n'` | finales de línea CRLF |

**No hay ningún cuarto rojo. Sin regresiones en la suite.**

Cobertura de los módulos nuevos (del mismo run):

```
catalogo-skills.js        97.80 % líneas | 94.00 % ramas
plan-desempate-skill.js  100.00 %        | 100.00 %
plugin-instalado.js      100.00 %        |  94.12 %
plan.js                   97.22 %        |  92.86 %
task.js                   97.75 %        |  95.56 %
```

### 1.2 Lectura de código

Se leyeron íntegros (no el diff): `src/core/catalogo-skills.ts`, `src/core/plan-desempate-skill.ts`,
`src/core/plugin-instalado.ts`, `src/commands/plan.ts`, `src/core/task.ts`, `src/cli.ts`,
`scripts/catalogo-skills.yml`, `test/core/plugin-instalado.test.ts` y el bloque modificado de
`test/commands/plan-brainstorm.test.ts`.

### 1.3 Pruebas propias, fuera de la suite

Repositorio Git real temporal (`git init -b develop`), tareas creadas con `taskctl new` y
planificadas con `taskctl plan` de verdad, más sondas directas contra `dist/`:

1. `seleccionarSkill` contra el catálogo real: etiquetas vacías, sin solape, solape único,
   empate en solape resuelto por prioridad, y empate en solape + prioridad.
2. `taskctl plan` end-to-end sobre una tarea con `etiquetas: [java, angular]` (empate real
   entre `angular-vue-reviewer` y `java-spring-reviewer`), en cuatro vueltas del bucle B9→B5.
3. Catálogo mal formado (14 mutaciones: `total_skills` ausente/negativo/no entero/descuadrado,
   `id` repetido, `prioridad` negativa, `rol` fuera del enum, `etiquetas: []`, etiquetas
   repetidas, `marketplace` en una entrada `taskcode-plugin`, `externo` sin `marketplace`,
   clave repetida, clave desconocida, `skill_0_*`), más CRLF, BOM y valores con espacios.
4. `interpretarResultadoPluginList` con 18 formas de salida distintas, incluidas trampas de
   tipo y de `__proto__`.
5. **`claude plugin list --json` real**, ejecutado tres veces en esta máquina, para contrastar
   el formato que el propio módulo declara "sin verificar".
6. `taskctl plan` end-to-end con una entrada `origen: externo` apuntando a un plugin que **sí**
   está instalado en esta máquina (`figma@claude-plugins-official`), vía `CLAUDE_PLUGIN_ROOT`.
7. Compatibilidad hacia atrás: un `tarea.md` sin el campo `regla_seleccion_skill`.
8. Mutaciones sobre el test de arquitectura para comprobar la excepción añadida.

---

## 2. Hallazgos

### CRÍTICO

**Sin hallazgos críticos.** No se encontró ninguna pérdida de datos, ni corrupción de la
máquina de estados, ni ninguna ruta que instale nada de forma automática.

### IMPORTANTE

---

#### IMP-1 — `comprobarSkillInstalado` no puede devolver `'instalado'` nunca: el campo `marketplace` no existe en la salida real de `claude plugin list --json`

`plugin-instalado.ts` documenta que el formato "quedó sin verificar a mano" y asume
"un array de objetos con un campo `marketplace`". **Lo he verificado y la asunción es falsa.**

Salida real en esta máquina (`claude plugin list --json`, status 0, tres ejecuciones idénticas):

```json
[
  {
    "id": "figma@claude-plugins-official",
    "version": "2.2.90",
    "scope": "user",
    "enabled": true,
    "installPath": "C:\\Users\\...\\cache\\claude-plugins-official\\figma\\2.2.90",
    "installedAt": "...",
    "lastUpdated": "..."
  }
]
```

Claves de cada entrada: `id`, `version`, `scope`, `enabled`, `installPath`, `installedAt`,
`lastUpdated`. **No hay ningún `marketplace`**: el marketplace va codificado dentro de `id`,
con la forma `plugin@marketplace`.

Consecuencia directa: `lista.some(e => e.marketplace === marketplace)` es siempre `false`,
así que todo skill `origen: externo` se reporta como no instalado, esté o no.

Reproducción end-to-end (catálogo de prueba con una entrada `externo` apuntando a
`claude-plugins-official`, que **sí** está instalado):

```
$ CLAUDE_PLUGIN_ROOT=<fake> taskctl plan TASK-003
Skill recomendado: "figma" (regla: solape).
Esta tarea se beneficiaria del skill "figma" (marketplace "claude-plugins-official")
-- no esta instalado. Instalalo con "/plugin install figma@claude-plugins-official"
antes de arrancar, o continua sin el.
```

El plugin está instalado. El comando afirma lo contrario.

Y el fallo cerrado que debería taparlo **no se dispara**: la comprobación de forma se
detiene en `Array.isArray(lista)`, sin mirar los elementos. Verificado con sondas:

| stdout | resultado | esperado según el docblock |
|--------|-----------|----------------------------|
| `[1,2,3]` | `no-instalado` | `no-verificable` |
| `["figma"]` | `no-instalado` | `no-verificable` |
| `[null,null]` | `no-instalado` | `no-verificable` |
| `[[{"marketplace":"figma"}]]` | `no-instalado` | `no-verificable` |
| `[{"id":"figma@claude-plugins-official",...}]` (**la real**) | `no-instalado` | `no-verificable` |

El propio encabezado de `test/core/plugin-instalado.test.ts` dice: *"cualquier forma de
`claude plugin list --json` que no encaje con lo esperado, tiene que colapsar a
`'no-verificable'`, y NUNCA a `'no-instalado'`"* — y sin embargo sus tests de las líneas
100–114 afirman justo lo contrario, y el de la 108 (`[{ "nombre": "algun-plugin" }]`, una
entrada sin campo `marketplace`) congela el error como comportamiento esperado. Los tests se
escribieron contra el código, no contra el contrato.

Por qué **no** lo clasifico CRÍTICO: hoy es inalcanzable, porque las 5 entradas del
`catalogo-skills.yml` que se distribuye son `origen: taskcode-plugin`. Pasa a CRÍTICO en
cuanto alguien añada una sola entrada `externo`, que es exactamente lo que el fichero invita
a hacer ("añadir una es tan barato como sumarle un bloque más").

Sugerencia: leer `id` y partir por `@` (`id.split('@').at(-1) === marketplace`), y devolver
`'no-verificable'` si ningún elemento del array tiene la forma esperada (objeto con `id` de
tipo string), en vez de `'no-instalado'`.

---

#### IMP-2 — El aviso de desempate imprime rutas de la carpeta de ORIGEN, que ya no existe tras mover la tarea

`avisoSkillDesempatePendiente` y `PlanCommandResult.peticionDesempateSkill` se construyen con
`planificacionDir`, calculado sobre `path.dirname(filePath)` **antes** del `moveTareaFile`.
Nunca se recalculan contra la carpeta de destino.

Reproducción (primer `taskctl plan` sobre una tarea con `etiquetas: [java, angular]`):

```
Tarea TASK-001 en diseno: movida a ...\tareas\01-en-diseno\TASK-001\tarea.md.
...
2 skills empatan en solape y prioridad para TASK-001: responde
"...\tareas\00-planificadas\TASK-001\planificacion\peticion-desempate-skill-1.md" en
"...\tareas\00-planificadas\TASK-001\planificacion\salida-desempate-skill-1.md" ...
```

```
$ ls tareas/00-planificadas
(vacio)
$ find tareas -name "*desempate*"
tareas/01-en-diseno/TASK-001/planificacion/peticion-desempate-skill-1.md
tareas/01-en-diseno/TASK-001/planificacion/salida-desempate-skill-1.md
```

Es decir: en el mismo mensaje en que el CLI dice que la tarea se movió a `01-en-diseno`, te
manda abrir dos ficheros en `00-planificadas`, un directorio que acaba de dejar de existir.

Esto contradice una convención **ya establecida y comentada** en el mismo fichero, para el
paquete de brainstorm (`src/commands/plan.ts:893-897`):

> Las rutas del brainstorm se recalculan contra la carpeta de DESTINO: se escribieron en la
> de origen y el rename se las llevó, así que las de arriba ya no apuntan a nada. **Devolver
> rutas muertas sería peor que no devolverlas** — el CLI las imprime para que la persona las abra.

El comportamiento se conocía: el test añadido en `plan.test.ts` lo documenta
(*"`result.peticionDesempateSkill` se calcula sobre la carpeta de ORIGEN antes del rename, y no
se reescribe tras el move -- esa ruta ya no existe en disco"*) y lo esquiva reconstruyendo la
ruta a mano en el propio test, en vez de arreglarlo. El test verde no protege de nada aquí.

Sugerencia: mismo tratamiento que `brainstormDirFinal` — construir las rutas del aviso y del
resultado sobre `path.dirname(newFilePath)` después del `moveTareaFile`. Nota: solo afecta a
la primera vuelta (cuando hay movimiento de carpeta); en las re-planificaciones las rutas ya
salen bien, lo que hace el fallo más fácil de pasar por alto.

---

#### IMP-3 — Un `catalogo-skills.yml` mal formado aborta `plan` **después** de escribir el scaffold, y deja el workspace sucio bloqueando el reintento

`cargarCatalogoSkills()` está en `plan.ts:539`, es decir **después** del `mkdir` de
`planificacion/` (472) y del `writeFile` de `plan-final.md` (500). `cargarHeuristica()`, en
cambio, está en la 410, antes de cualquier escritura, siguiendo la doctrina que el propio
fichero declara ("todo lo que puede abortar tiene que abortar con la tarea intacta").

Reproducción:

```
$ CLAUDE_PLUGIN_ROOT=<fake> taskctl plan TASK-002      # catalogo con una clave desconocida
[ERROR] ...\catalogo-skills.yml:160: clave desconocida "skill_1_color".
        Quiza quisiste decir "skill_1_rol".
        ...
$ echo $?
1
$ git status --short
?? tareas/00-planificadas/TASK-002/planificacion/      # <-- residuo del abort
```

Hasta aquí, correcto: mensaje accionable y la tarea no se ha movido. El problema es el
reintento, **incluso con el catálogo ya arreglado**:

```
$ taskctl plan TASK-002
[ERROR] Hay cambios sin guardar en "develop". Guardalos ("taskctl pause") o comitealos
        antes de continuar.
```

El guard de §8.3 bloquea el comando con un mensaje que no tiene nada que ver con la causa
real, y hace falta intervención manual de Git para salir. Un error de configuración en un
fichero que, por diseño, "lo mantiene el equipo a mano" acaba en un callejón sin salida.

Sugerencia: subir `cargarCatalogoSkills()` junto a `cargarHeuristica()` (línea ~410). El
`seleccionarSkill` y el resto del bloque pueden quedarse donde están.

---

#### IMP-4 — Responder el desempate debajo del encabezado del scaffold se ignora en silencio, con el mismo aviso repetido y sin ninguna pista

`taskctl plan` escribe este scaffold:

```markdown
# Salida del desempate de skill — TASK-001

(pendiente de completar)
```

y `leerGanadorDesempate` solo mira **la primera línea no vacía**. O sea: el fichero que el
propio comando genera tiene garantizada una primera línea inválida, y la instrucción de
sobrescribirla ("una unica linea con el `id` EXACTO") vive en el *otro* fichero, el de
petición. El scaffold no dice nada de reemplazar el encabezado.

Reproducción, escribiendo la respuesta debajo (que es lo que sugiere la forma del scaffold, y
lo que hace el brainstorm con sus `salida-brainstorm-*.md`):

```markdown
# Salida del desempate de skill — TASK-001

java-spring-reviewer

Porque el nucleo es backend.
```

```
$ taskctl plan TASK-001
2 skills empatan en solape y prioridad para TASK-001: responde "..." en "..." y vuelve a
lanzar "taskctl plan" para dejarlo resuelto. Por ahora se deja sin "skills_recomendados".
```

Mensaje **byte a byte idéntico** al de la vuelta anterior. Nada indica que la salida se leyó y
se descartó, ni por qué. Con el `id` a pelo en la primera línea sí funciona:

```
$ printf 'java-spring-reviewer\n\nPorque el nucleo es backend.\n' > salida-desempate-skill-1.md
$ taskctl plan TASK-001
Skill recomendado: "java-spring-reviewer" (regla: llm).
$ grep regla_seleccion tareas/01-en-diseno/TASK-001/tarea.md
regla_seleccion_skill: llm
```

El fallo cerrado en sí es correcto y deseable (no elige al azar). Lo que falla es que el
rechazo es mudo, en el único paso interactivo de toda la funcionalidad.

Sugerencias (cualquiera basta): que `leerGanadorDesempate` salte líneas que empiecen por `#`;
o que el scaffold no lleve encabezado; o —la más barata y la más útil— distinguir en el aviso
el caso "la salida sigue con el texto de plantilla" del caso "la salida tiene contenido pero
su primera línea, `<X>`, no es el id de ninguno de los candidatos".

### MENOR

- **MEN-1 — Margen de timeout muy fino.** `TIMEOUT_MS = 5000`, y `claude plugin list --json`
  tardó en esta máquina 3452 / 3772 / 3573 ms en tres medidas limpias, y 4457 ms dentro de una
  sonda con más carga. Bajo carga real se pasará del límite y colapsará a `'no-verificable'` de
  forma intermitente. Además son ~4 s de `spawnSync` **síncronos** añadidos a cada `taskctl plan`
  cuyo ganador sea externo.

- **MEN-2 — El aviso afirma un hecho que no ha comprobado.** Con `'no-verificable'` el texto
  emitido es igualmente `-- no esta instalado`. Que se avise en ambos casos es una decisión
  documentada y la comparto; lo que chirría es la redacción, que asevera algo que el código
  acaba de declararse incapaz de verificar. Basta un "no se ha podido comprobar si está
  instalado" para el estado `'no-verificable'`.

- **MEN-3 — `total_skills` sin cota superior.** `construirClavesValidas()` materializa un
  `Set` de `total_skills × 8` claves. Con `total_skills: 5000000` el comando se queda 19,8 s
  colgado y sale con un `RangeError: Set maximum size exceeded` crudo — no un
  `CatalogoSkillsError` —, que `cli.ts` no reconoce y `bin/taskctl` presenta como
  "taskctl no pudo arrancar: Set maximum size exceeded". Es el mismo antipatrón ("ni cierto ni
  accionable") que el propio `plan.ts` documenta haber corregido en TASK-027. Una cota de
  cordura (p. ej. 1000) con mensaje propio lo cierra.

- **MEN-4 — Artefactos rancios cuando el empate desaparece.** La petición se regenera "siempre"
  solo mientras el empate persiste. Si las etiquetas de la tarea cambian y ya no hay empate,
  `peticion-desempate-skill-1.md` y `salida-desempate-skill-1.md` se quedan en `planificacion/`
  —y se commitean— listando candidatos que ya no aplican, contradiciendo el frontmatter.
  Verificado: tras cambiar `etiquetas` a `[zzz-inexistente]`, el frontmatter queda
  `skills_recomendados: []` y la petición en disco sigue diciendo "Estos 2 skills del catalogo
  empatan…". Es justo el escenario que el docblock de `plan-desempate-skill.ts` describe como
  "peor que no tener ninguna".

- **MEN-5 — La excepción del test de arquitectura está bien acotada, pero es de fichero, no de
  uso.** Comprobado por mutación: un `fetch("http://x")` añadido a `plugin-instalado.ts` sigue
  poniendo el test en rojo, y un `const y = 'claude'` en `plan-desempate-skill.ts` también. La
  acotación por `patron.source` y por ruta relativa funciona. Lo que queda abierto es que
  *cualquier* aparición de `'claude'` dentro de `plugin-instalado.ts` pasa: un futuro
  `spawnSync('claude', ['-p', ...])` en ese mismo fichero cruzaría el guard sin pena. Sugerencia:
  además de la excepción, una aserción positiva de que el único argv con `'claude'` en ese
  fichero es `['plugin', 'list', '--json']`.

- **MEN-6 — `total_skills: 0` se acepta en silencio.** Un catálogo vacío es legal y deja a toda
  tarea sin candidato. Coherente con "el catálogo no es exhaustivo", pero indistinguible de un
  fichero truncado.

- **MEN-7 — Un `skills_recomendados` puesto a mano se descarta sin decirlo.** El campo es
  derivado por diseño y así está documentado, de acuerdo. Pero cuando pasa de `[X]` a `[]` el
  único mensaje es el genérico "ningún skill comparte etiquetas", que no menciona que había un
  valor previo y se ha borrado.

---

## 3. Áreas revisadas **sin hallazgos**

Se comprobaron a propósito y salieron limpias. No hay nada que arreglar en ellas:

- **"Cero candidatos" nunca aborta el comando.** Verificado unitariamente
  (`{ganador:null, regla:null, candidatosEmpatados:[]}` con etiquetas vacías y con etiquetas
  sin solape) y end-to-end: `taskctl plan` sale 0, imprime el aviso, deja
  `skills_recomendados: []` / `regla_seleccion_skill: null` y mueve la tarea con normalidad.

- **Los cuatro pasos de `seleccionarSkill`.** Solape único → `regla: solape`; empate en solape
  roto por prioridad (`[java, calidad]` → `java-spring-reviewer`, `regla: prioridad`); empate en
  solape y prioridad (`[java, angular]` → `ganador: null` + los dos candidatos). No filtra por
  `rol`, tal y como se documenta. Correcto.

- **Fallo cerrado del parseo del catálogo.** 14 mutaciones distintas, todas abortan con
  `CatalogoSkillsError`, exit 1, tarea sin mover y mensaje que dice qué hacer (incluida una
  sugerencia por distancia de edición: `skill_1_color` → *"Quiza quisiste decir skill_1_rol"*).
  Tolera CRLF, BOM y espacios sobrantes sin romperse. Es un parser sólido.

- **¿Puede un JSON válido con `marketplace` de tipo raro colarse como `'instalado'`? No.**
  Probados `[{"marketplace":5}]`, `[{"marketplace":{"name":"figma"}}]`,
  `[{"marketplace":["figma"]}]`, `[[{"marketplace":"figma"}]]`, `[{"__proto__":{"marketplace":"figma"}}]`
  y `[null,null]`: **ninguno** devuelve `'instalado'`. La comparación `===` contra un `string` es
  estrictamente correcta. (El problema del módulo es el contrario, y está en IMP-1.)

- **`comprobarSkillInstalado` no instala nada.** `spawnSync` con argv fijo
  `['plugin','list','--json']`, sin `shell: true`, y el `marketplace` **no llega al subproceso**
  (solo se usa para comparar en memoria) → no hay superficie de inyección de argumentos ni de
  shell. Ejecutado de verdad contra el binario `claude` real varias veces: `plugin list` no
  modifica nada. Sin hallazgos de seguridad.

- **`skillsRecomendadosCambiado` compara bien.** Longitud + comparación posicional; y por
  construcción el array final tiene 0 o 1 elemento, así que no hay ventana para un falso
  positivo por orden. Idempotencia verificada end-to-end: la segunda invocación consecutiva con
  el mismo resultado no repite el aviso.

- **Ficheros de desempate tras el movimiento de carpeta.** Los ficheros en sí viajan
  correctamente con el `rename` de `moveTareaFile` a `01-en-diseno/…/planificacion/`, y el
  segundo `plan` los relee bien. Lo único roto son las *rutas impresas* (IMP-2), no los datos.

- **Compatibilidad hacia atrás.** Un `tarea.md` anterior a TASK-017 (sin
  `regla_seleccion_skill`) valida sin tocar nada — `requireNullableEnum` trata `undefined` como
  `null` — aparece en `taskctl board` y `taskctl plan` lo actualiza al formato nuevo.

- **Excepción del test de arquitectura.** Sigue atrapando `fetch(` dentro del fichero exceptuado
  y `'claude'` fuera de él (ambos verificados por mutación, y suite restaurada a verde después).
  La rendija que abre es estrecha; la salvedad va en MEN-5.

---

## 4. Conclusión

**No está lista para `taskctl finish`.**

La suite está en verde según el criterio de este repositorio (815 tests, 812 pasan, y los 3
rojos son exactamente los conocidos de Windows), la cobertura de los tres módulos nuevos está
muy por encima del 80 % y el parser del catálogo es de la misma calidad que el de la heurística.
El diseño en dos pasos, el reparto "el CLI no invoca modelos" y el fallo cerrado del desempate
están bien resueltos.

Lo que impide cerrarla son cuatro cosas, y las cuatro se reprodujeron ejecutando el comando:

1. **IMP-1** — la comprobación de instalación no funciona contra el CLI real: el campo
   `marketplace` no existe en la salida de `claude plugin list --json`, y el fallo cerrado que
   debía taparlo no cubre el contenido del array. Es, además, la justificación entera de la
   excepción añadida al test de arquitectura, así que conviene que el subproceso al menos sirva
   para algo.
2. **IMP-2** — el aviso de desempate manda a la persona a rutas que el propio comando acaba de
   dejar inexistentes, rompiendo una convención ya escrita doce líneas más abajo en el mismo
   fichero.
3. **IMP-3** — un catálogo mal formado deja el workspace sucio y bloquea el reintento con un
   error que no menciona la causa.
4. **IMP-4** — la respuesta del desempate se descarta en silencio si se escribe debajo del
   encabezado que el propio scaffold genera.

Ninguna es de arquitectura: las cuatro son locales y de arreglo barato (mover una llamada de
sitio, recalcular dos rutas, leer `id` en vez de `marketplace`, y un mensaje que distinga).
Los siete MENOR quedan a criterio del autor; recomiendo atender al menos MEN-2 y MEN-3, que son
mensajes que mienten o que no dicen qué hacer, algo que este repositorio trata como defecto.
