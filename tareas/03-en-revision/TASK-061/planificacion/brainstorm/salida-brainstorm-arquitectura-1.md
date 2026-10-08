# Brainstorm — TASK-061, rol arquitectura (ronda 1)

- Rol: `brainstorm-arquitectura`
- Agente: taskcode-plugin:brainstorm-arquitectura (sonnet)

## Enfoque propuesto, con rutas y nombres concretos

En `.taskcode/config.yml` se declaran dos claves opcionales:

- `plataforma_remota`: `github` | `gitlab`.
- `url_base_remoto`: la URL de la instancia.

Un unico punto resuelve el `RemotoPlataforma` de origin: `detectarPlataforma`
en `src/core/plataforma-remota.ts`. Recibe lo declarado y, si no hay nada,
aplica la regla de host de la 0.6.0 sin cambios. `RemotoPlataforma` se amplia
con `base` y `proyecto`, ambos opcionales.

Con glab declarado, `src/fs/merge-request.ts` lanza con `GITLAB_HOST=<base>` y
`-R <proyecto>`, como demuestra `evidencia-glab-subpath.md`. No hay API REST,
ni token propio, ni doble HTTP.

## Que se extiende y que se crea

- **`src/core/config.ts`** (se extiende).
  - Las 2 claves van en `CLAVES_CONFIG`, en `TaskcodeConfig` y en
    `CONFIG_DEFAULTS` (con valor null), con un validador del patron de
    `validarCierrePorDefecto`.
  - Sin las claves, el comportamiento es identico.
  - Hay que reescribir la regla 5 y la tabla de cabecera, que dicen «ninguna
    clave mas».
- **`src/core/plataforma-remota.ts`** (se extiende).
  - `detectarPlataforma(url, declarado?)`.
  - Funcion pura nueva `proyectoDeRemoto(urlOrigin, base)`: quita la base a
    origin (https, ssh y scp) y el `.git` final, y nunca devuelve
    credenciales.
- **`src/commands/finish-opciones.ts`** (se extiende): `preflightMergeRequest`,
  lineas 258-287.
  - Es el unico sitio que une origin con la plataforma.
  - Lee `resolverConfig(cwd)` y le pasa lo declarado.
  - El mensaje de «host desconocido» nombra las claves que hay que
    configurar.
- **`src/fs/merge-request.ts`** (se extiende).
  - `lanzar` acepta un `env` extra.
  - `comprobarCli`, `estadoMergeRequest` y `abrirMergeRequest` anaden `-R` y
    `GITLAB_HOST` solo si `remoto.base` esta definido.
  - Todo sale de un unico `argsBase(remoto)`.
- **`src/commands/finish.ts`**: NO se toca. Solo pasa `RemotoPlataforma` de un
  sitio a otro.
- **`skills/finish/SKILL.md`, `README.md` del plugin y `CHANGELOG.md`** (se
  extienden): una seccion de GitLab autoalojado, sin mencionar el proyecto.

Orden de construccion:

1. `plataforma-remota.ts`, puro.
2. `config.ts`.
3. `merge-request.ts`.
4. `preflightMergeRequest`.
5. Skill, README y CHANGELOG, con el aviso de compatibilidad.

Alternativas descartadas:

- **API REST propia con `fetch` y un token.** glab ya respeta el subpath con
  `GITLAB_HOST` mas `-R`. La API duplicaria la lectura de estado, el manejo
  del token y el doble HTTP.
- **URL completa en `-R`.** Segun la evidencia, glab pierde el subpath.
- **Ampliar la heuristica «contiene gitlab».** No resuelve `git.empresa.com`.

## Limites que cruza

- La config.
- La deteccion de la plataforma.
- El lanzamiento de glab.
- La skill `finish`.

`finish.ts` no se toca.

## La decision de diseño que mas te preocupa (UNA sola)

**Dos claves frente a una.**

- `plataforma_remota` sola cubre un GitLab en `git.empresa.com` sin subpath.
  En ese caso la base es `https://<host de origin>`.
- Con solo la base habria que adivinar si es GitHub o GitLab. Por eso
  `url_base_remoto` sin `plataforma_remota` debe abortar.
- Declarar solo la plataforma activa ya `-R` y `GITLAB_HOST`, para que haya
  un unico camino de glab.

### Desacuerdos previstos

- **Con riesgos:** dos claves o una sola.
- **Con testing:** el doble de gh/glab debe registrar `GITLAB_HOST` y `-R`.
  Ademas, se retira el criterio del servidor HTTP local, porque no hay REST.

### Suposiciones no verificadas

- **`glab auth status --hostname <host>`:** no se ha probado con subpath. La
  alternativa es usar `GITLAB_HOST` sin `--hostname`.
- **`glab mr create -R` en subpath:** no se ha probado, ni que
  `urlDeSalidaDeCreacion` entienda la URL que imprime.
- **Token:** sale de `GITLAB_TOKEN` o de `glab auth login`. No se ha
  verificado si `auth status` cubre el caso «sin token».
- **`urlsDeOrigin` (`git.ts`):** no se ha leido. Hay que comprobar si las
  URLs de fetch y de push pasan las dos por `proyectoDeRemoto`.
