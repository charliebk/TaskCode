# Brainstorm — TASK-062, rol riesgos (ronda 1)

- Rol: `brainstorm-riesgos`
- Agente: taskcode-plugin:brainstorm-riesgos (sonnet)

## Modos de fallo, ordenados por gravedad, con el escenario concreto de cada uno

### 1. OK falso sobre bash

- **Cuando:** doctor corre en un Node lanzado desde PowerShell o desde un IDE,
  y `spawnSync('bash', ['--version'])` resuelve al bash de WSL (System32) o a
  un bash de Git sin `usr\bin` en el PATH (HALLAZGOS.md l.587-594).
- **Que pasa:** doctor dice «ok», y despues `start`/`finish` revientan con
  «execvpe failed» o sin coreutils.
- **Mitigacion:** ejecutar un script real minimo que use `mktemp`, `dirname` y
  `grep`, con el mismo mecanismo de lanzamiento que `runGitflowScript`
  (gitflow-runner.ts l.95). Ni una sonda `--version` ni `where`.

### 2. El «solo lee» se contradice

- **Cuando:** `git status --porcelain` (git.ts l.68, `isWorkspaceClean`)
  refresca `.git/index` y toma `index.lock`, y doctor se lanza a la vez que
  otro `taskctl` o un IDE.
- **Que pasa:** «index.lock exists» en un lado o en el otro.
- **Mitigacion:** `GIT_OPTIONAL_LOCKS=0` (o `--no-optional-locks`), y tratar
  un fallo por lock como aviso.

### 3. El validador de config aborta en el primer fallo

- **Cuando:** `parsearConfig` lanza `ConfigError` en la primera clave mala, y
  hoy tambien en las desconocidas (config.ts l.314).
- **Que pasa:** doctor muestra un solo error, y los avisos de claves
  desconocidas son imposibles con el parser actual.
- **Mitigacion:** depende de que TASK-061 entre antes. `ConfigError` se
  captura como un resultado mas, y no debe llegar al catch-all de
  `bin/taskctl`.

### 4. El lector reutilizado oculta incoherencias

- **Cuando:** `listTareasEnEstados` salta un ID ya visto en otra carpeta
  (task-store.ts l.94) y mete los frontmatter rotos en `ilegibles` sin motivo.
  Pasa, por ejemplo, con el mismo ID en `02-en-curso` y `03-en-revision` tras
  un `moveTareaFile` interrumpido.
- **Que pasa:** doctor dice «todo coherente» justo en el estado a medias que
  tenia que detectar.
- **Mitigacion:** doctor hace su propio recorrido. Un ID duplicado es error;
  un ilegible sale con ruta y causa; y se senala tambien una carpeta con ID
  sin `tarea.md`.

### 5. Preflight de sesion que se cuelga o filtra

- **Cuando:** `lanzar` lleva un timeout de 120 s, y `glab api user` toca la
  red. VPN caida o host que no responde.
- **Que pasa:** 2 minutos por comprobacion, y `detalle()` puede incluir una
  URL o un token.
- **Mitigacion:**
  - un timeout corto propio (unos 10 s) que da «aviso, no se pudo
    verificar»;
  - `ocultarCredenciales` tambien en `--json`.

### 6. Codigo de salida y `--json` fragiles

- **Cuando:** un `throw` sin capturar (sin git, `GitLaunchError`; readdir con
  EACCES) sale por el catch-all.
- **Que pasa:** una skill recibe texto que no es JSON, con un codigo 1 que no
  se distingue de «hay errores».
- **Mitigacion:** envolver cada comprobacion para que una excepcion sea un
  resultado `error`. En `--json`, stdout lleva solo el JSON.

### 7. Falsos errores en repos legitimos

- **Cuando:** rama principal ausente en un repo sin commits, proyecto solo
  local sin `origin`, worktrees (`.git` como fichero) o CRLF.
- **Que pasa:** el primer uso del plugin publico acaba en rojo, y la persona
  deja de fiarse.
- **Mitigacion:** severidad por comprobacion.
  - Sin `origin` es aviso, y solo error si la config exige merge request.
  - Sin commits tiene su propio mensaje.

## Estados intermedios y fallos parciales

Los de los puntos 3, 4 y 6: config con varios fallos, tareas a medio mover y
excepciones a mitad de la comprobacion. Cada comprobacion es independiente y
una excepcion se convierte en un resultado.

## Compatibilidad hacia atras

- Comando nuevo, sin efecto en los existentes.
- Depende de la API de config de TASK-061. Hay dos salidas: secuenciar 062
  despues de 061, o leer las claves con `parseBloqueClaveValor` y
  `CLAVES_CONFIG` sin tocar `parsearConfig`.

## Vuelta atras

No hay puntos sin retorno: doctor solo lee. El unico efecto lateral es el
refresco del indice, ya cubierto en el punto 2. Basta con borrar el comando y
su documentacion.

Descartado a proposito:

- **Dos doctor simultaneos:** solo roza el index.lock, ya listado.
- **Version exacta de gh/glab:** lo que falla en la practica es la sesion.
- **Estado en mayusculas:** ya lo cubre `parseTareaFile`.

Desacuerdos previstos:

- **Con arquitectura, sobre las claves desconocidas.** Tocar `parsearConfig`
  en paralelo con 061 es un conflicto seguro. Se lee aparte, o se secuencia
  despues de 061.
- **Con arquitectura y dominio, sobre «no se pudo comprobar».** Una sesion
  que no se puede verificar (timeout o red) es aviso; solo «no instalado» o
  «no autenticado confirmado» es error. Asi un corte de red no da codigo 1.
- **Con arquitectura, sobre reutilizar `listTareasEnEstados` e
  `isWorkspaceClean`.** No sirven tal cual (puntos 2 y 4).

Suposiciones no verificadas:

- **Lock de `git status`:** que refresque el indice y tome el lock. No se
  ha reproducido.
- **bash de WSL:** que el PATH lo devuelva antes que el de Git desde un IDE.
  Lo dice HALLAZGOS.md, pero no se ha reproducido.
- **API de 061:** que tenga una API reutilizable para los avisos.
- **ID duplicado:** que sea alcanzable a traves de `moveTareaFile`.
- **Doble de gh/glab:** que permita simular un timeout o la falta de sesion.

## El riesgo que mas te preocupa (UNO solo)

El OK falso sobre bash (punto 1): un doctor que dice «todo bien» y luego
`start` falla es peor que no tener doctor.
