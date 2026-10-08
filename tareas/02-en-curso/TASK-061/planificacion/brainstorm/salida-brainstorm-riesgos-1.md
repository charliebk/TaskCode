# Brainstorm — TASK-061, rol riesgos (ronda 1)

- Rol: `brainstorm-riesgos`
- Agente: taskcode-plugin:brainstorm-riesgos (sonnet)

## Riesgos, de mayor a menor dano

### 1. MR duplicado o cierre falso por un proyecto mal deducido

- **Cuando:** el estado y la creacion usan `-R` con distinta base, o la base
  declarada no es prefijo exacto de origin: barra final, mayusculas, `.git`,
  puerto, http frente a https, o ssh con puerto.
- **Que pasa:**
  - si `-R` no existe, da «desconocido», que es seguro;
  - si apunta a OTRO proyecto valido (un fork, o el mismo nombre en otro
    grupo), «ninguno» lleva a crear el MR en el proyecto equivocado, e
    «integrado» cierra la tarea con el estado de otro repo;
  - `interpretarListado` solo filtra por `source_branch`.
- **Mitigacion:**
  - deduccion estricta: host y prefijo de ruta normalizados; si la base no es
    prefijo exacto, abortar antes de subir nada;
  - un unico punto que produzca `-R`, usado tanto en el estado como en la
    creacion.

### 2. `GITLAB_HOST` heredado o pisado

- **Cuando:** `lanzar` hereda `process.env`, asi que un `GITLAB_HOST`,
  `GITLAB_TOKEN` o `GL_HOST` del usuario convive con el nuestro.
- **Que pasa:** glab habla con otra instancia y el MR se abre en un servidor
  que no es el del remoto.
- **Mitigacion:** fijar `GITLAB_HOST` explicitamente en cada llamada,
  tambien en `comprobarCli`, y no heredar ninguna variable de host de glab.

### 3. Preflight de autenticacion que no vale con subpath

- **Cuando:** `comprobarCli` usa `auth status --hostname <host>`, y con
  subpath el «host» ya no es solo el host.
- **Que pasa:** o un falso «sin autenticar», o un falso OK que falla despues
  de haber subido la rama.
- **Mitigacion:** probar con glab real. Si `auth status` no sirve, hacer el
  preflight con `glab api user` bajo `GITLAB_HOST`.

### 4. Fuga de credenciales

- **Cuando:** origin es `https://usuario:token@host/ruta`.
  `ocultarCredenciales` solo limpia `esquema://...@`, asi que el scp y las
  URLs sin esquema escapan.
- **Mitigacion:**
  - la deduccion devuelve solo la ruta del proyecto;
  - la base declarada se valida sin userinfo: un `@` se rechaza;
  - el token, solo por entorno.

### 5. La base declarada contradice a origin

- **Cuando:** se declara `gitlab` pero origin es github.com, o se cambia de
  remoto despues.
- **Mitigacion:**
  - una precedencia unica y documentada: manda la config;
  - si la base no encaja con ningun host de las URLs de origin, abortar con
    un mensaje que nombre la clave.

### 6. El segundo `finish` lee otra config

- **Cuando:** el MR se abre con la config de la rama de la tarea y se cierra
  desde develop, porque `config.yml` se lee del arbol activo.
- **Que pasa:** «host desconocido» con el MR ya abierto.
- **Mitigacion:**
  - un aviso en la skill: la config tiene que estar commiteada en las dos
    ramas;
  - el segundo `finish` resuelve igual, o aborta sin tocar nada con un
    mensaje que lo explique.

### 7. glab fuerza https

- **Cuando:** instancias solo http, certificados autofirmados o una CA
  interna.
- **Que pasa:** todo cae en «desconocido», sin que el mensaje diga por que.
- **Mitigacion:** documentar el limite (solo https; los certificados propios
  van por la configuracion del sistema o de glab).

## Puntos sin retorno

- **Subir la rama y crear el MR.** Un MR creado no se deshace desde taskctl.
- **Publicar la clave nueva.** `config.ts` aborta ante claves desconocidas,
  asi que una version anterior deja de poder usar taskctl entero.

## Descartado a proposito

- **Dos `finish --merge-request` a la vez:** la regla de no duplicar ya lo
  cubre.
- **Rutas con caracteres raros:** GitLab limita los slugs, y la deduccion
  estricta lo cubre.
- **API REST con token propio:** glab basta.

## Desacuerdos previstos

- **Con arquitectura, sobre la API REST como camino principal:** no la
  quiere; como mucho, de plan B.
- **Con arquitectura, sobre dos claves libres:** permiten estados
  incoherentes. Prefiere validarlas juntas en `config.ts` y abortar si faltan
  o chocan.
- **Con arquitectura y dominio, sobre la clave nueva:** es una ruptura hacia
  adelante que el CHANGELOG debe decir con todas las letras. La premisa de
  «todo el equipo con la misma version» ya no cubre un repo publico con
  usuarios ajenos.

## Suposiciones no verificadas

- **`glab mr create` y `auth status` con subpath:** sin probar.
  *(El orquestador probo despues `auth status` y `mr create` con glab real.
  Ver la segunda prueba en `evidencia-glab-subpath.md`: `auth status` ignora
  `GITLAB_TOKEN`.)*
- **Linux y macOS:** que `GITLAB_HOST` con subpath funcione igual que en
  Windows.
- **URL de creacion:** que la que imprime `mr create` incluya el subpath.
- **Otros consumidores:** que ninguno de `RemotoPlataforma` o
  `detectarPlataforma` se rompa.
- **URLs de origin:** cual de las de `urlsDeOrigin` (fetch o push) debe usar
  la deduccion.
