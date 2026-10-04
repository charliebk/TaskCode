# Informe de revision — TASK-036 (ronda 1)

- Commit revisado: f0df7dda2776105c368c6cd3094e3bef28f53f46
- Revisor: code-quality-reviewer (agente independiente; skill taskcode-plugin:code-quality-reviewer)
- Veredicto: aprobada con correcciones

## Hallazgos

| ID | Severidad | Estado | Fichero |
|---|---|---|---|
| MEN-1 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/commands/veredicto.ts:117 |
| MEN-2 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/src/commands/veredicto.ts:67 |
| MEN-3 | MENOR | abierto | taskcode-marketplace/plugins/taskcode-plugin/test/commands/veredicto.test.ts |

Sin CRITICO ni IMPORTANTE.

### Entorno

Clon temporal de `feature/task-036-f1-t3-veredicto-con-un-comando-e-informe`
(HEAD 3bedfa7, codigo en f0df7dd), `npm install && npm run build`. Los
experimentos con el CLI se hicieron en un segundo clon, con el binario del
primero; el arbol del repo no se toco salvo este informe.

### Suite completa (una vez)

`npm test` en el clon: 905 tests, 902 pass, 3 fail, 0 cancelled (554 s). Los
3 rojos son los conocidos de Windows: `approve` (EPERM del symlink, #119) y
dos de `plan` (#281, #287). No hubo EBUSY. Ningun cuarto rojo.

### MEN-1 — el valor del veredicto acepta claves de Object.prototype

La validacion usa `valor in VEREDICTOS`, que tambien es verdadero para las
claves heredadas. Reproducido en el clon de pruebas:

```
$ taskctl veredicto TASK-036 toString      -> rc=0
  linea escrita: "function toString() { [native code] }"
  commit:        chore(TASK-036): veredicto ronda 1 (toString)
$ taskctl veredicto TASK-036 __proto__     -> rc=0
  linea escrita: "[object Object]"
```

Igual con `constructor`, `hasOwnProperty`, etc. No afloja el gate (`finish`
rechaza esas lineas, fail-closed), pero el comando escribe y commitea basura en
vez de dar el error de uso. Correccion: `Object.hasOwn(VEREDICTOS, valor)`.
Nadie lo teclea por accidente; por eso MENOR.

### MEN-2 — borra en silencio cualquier linea citada que empiece por el prefijo

`sustituirVeredicto` quita toda linea cuyo texto recortado empiece por el
prefijo de veredicto (sin distinguir mayusculas). Eso incluye las lineas
dentro de un bloque de codigo y las que tienen sangria. Le anadi a un informe
una seccion de reproduccion con un bloque cercado que contenia una linea de
veredicto con `**no aprobada**`, y debajo otra con sangria. Tras
`taskctl veredicto TASK-036 aprobada` el bloque quedo vacio y la linea con
sangria habia desaparecido. La salida del comando no lo menciona.

Es coherente con el gate: `veredictoAprobado` tambien cuenta esas lineas, asi
que un informe que las contenga no cierra de todos modos, y la skill dice que
se sustituyen todas. Pero el texto del revisor, que aun no esta commiteado,
se pierde sin aviso. Esto es probable justo al revisar tareas sobre el propio
gate, como esta. Propuesta: avisar por stdout cuando se quite mas de una
linea, o al menos contarlas. MENOR porque es un caso de borde.

### MEN-3 — la guarda de `--informe` ajeno a la ronda no tiene test

Mutante: cambiar `if (!nombres.includes(informePedido))` por `if (false)` en
`dist/src/commands/veredicto.js` deja `veredicto.test.js` en 7/7 verde. La
guarda funciona (lo comprobe a mano, ver abajo), pero ningun test la fija, y es
lo que impide que `--informe ../tarea.md` lea o escriba fuera de `revision/`.

### Contraprueba con mutantes (`timeout 300 node --test ...`)

| Mutante | Resultado |
|---|---|
| `informesDeUltimaRonda` sin `nombres.push` en la misma ronda | rojo (2 fallos en veredicto.test) |
| `veredictoAprobado` sin el recorte del enfasis final | rojo (1 fallo, finish/veredicto: `_aprobada_`) |
| `informesDeUltimaRonda` sin absorber ENOTDIR | rojo (1 fallo) |
| `sustituirVeredicto` sin conservar el `\r` | rojo (test de CRLF) |
| sin la guarda `nombres.includes(informePedido)` | **sobrevive** (MEN-3) |

### Verificado y correcto (sin hallazgo)

- **Refactor de `informesDeUltimaRonda`.** Hice un test diferencial con 300
  directorios aleatorios, comparando la implementacion vieja (copiada de
  `finish`/`codex-review`) con la nueva. Use las dos regex (`INFORME_REVISION_RE`
  y la de Codex) y nombres que cubren ronda 0, 2 frente a 10, `02`, fragmentos
  con sufijo, `.MD` y `peticion-*`. Resultado: 0 diferencias en el conjunto
  devuelto; solo cambia el orden, que ahora sale ordenado. La unica diferencia
  de comportamiento es la ruta que es un fichero (ENOTDIR): antes lanzaba y
  ahora da "no aprobada". Es fail-closed y el plan la acepta. `finish` sigue
  exigiendo `length > 0 && every(...)`, asi que el gate no cambia.
- **Recorte del enfasis.** Tabla de verdad contra `dist/.../finish.js`:
  - Pasan: `**aprobada**`, `_aprobada_`, `__aprobada__`, `` `aprobada` ``,
    `**_aprobada_**`, `*aprobada con correcciones*` y `** aprobada` (enfasis
    sin cerrar; el valor es inequivoco).
  - Fallan: `*no* aprobada`, `**no aprobada**`, `no aprobada`, `**APROBADO**`,
    `**cambios-solicitados**`, `**aprobada** (cambios-solicitados)`,
    `**aprobada** pendiente`, `~~aprobada~~`, `aprobada_x`, `*` y la linea
    PENDIENTE nueva.
  - `aprobada**x` pasa, pero ya pasaba antes del cambio (`^aprobada\b`). No
    lo introduce esta tarea.
- **`--informe` con rutas.** Probe `../tarea.md` y `..\revision\informe-revision-1.md`:
  los dos se rechazan con "no es un informe de la ronda 1", porque solo se
  aceptan nombres que salen del `readdir`. `--informe` sin valor da error, y
  `--informe=x` se rechaza como argumento de mas.
- **Orden de argumentos.** `--push` antes del ID funciona; sin remoto avisa y
  commitea en local. `--informe <n>` antes del ID tambien funciona. Un flag
  desconocido da "Argumentos de mas". `APROBADA` en mayusculas se rechaza. Un
  ID invalido o inexistente da error sin commit.
- **Idempotencia.** Repetir el mismo veredicto da "Sin cambios que commitear",
  rc=0, y no crea un commit vacio.
- **CRLF.** Converti el informe a CRLF en disco (con node; `core.autocrlf=true`
  en el clon). Tras el comando, las 13 lineas conservan el `\r`, incluida la
  canonica.
- **Ronda fragmentada.** Sin `--informe`, aborta sin escribir y con el arbol
  limpio. Con `--informe informe-revision-1-java-spring-reviewer.md` el commit
  toca solo ese fichero.
- **Fidelidad de la skill.** La tabla del gate de `skills/task-workflow/SKILL.md`
  coincide con la tabla de verdad de arriba. La sinopsis omite `[--push]`, como
  la de `finish`; es coherente con el resto de la skill.
- Los tests existentes de `finish` y `codex-review` no se modificaron
  (`git diff --stat` solo muestra `veredicto.test.ts`).
