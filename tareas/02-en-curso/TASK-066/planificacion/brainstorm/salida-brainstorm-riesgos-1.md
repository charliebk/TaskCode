# Brainstorm — TASK-066, rol riesgos (ronda 1)

- Rol: `brainstorm-riesgos`
- Agente: a553e222406f83752

## Riesgos, de mayor a menor daño
- Un secreto real acaba en la salida o en el certificado commiteado — el enmascarado se aplica a la línea de stdout pero no al JSON, a `--escribir` (`docs/doctor-deploy/<fecha>.md`), al stderr de `gitleaks` o `npm audit` que se reenvía tal cual, ni a un diff de `git log -p` citado como evidencia — el secreto se versiona en un fichero nuevo, justo lo que el comando debía impedir — un único punto de salida que enmascara antes de que nada se escriba en stdout, JSON o disco; la evidencia es fichero:línea o commit, nunca el contenido de la línea.
- OK falso: un punto sale OK sin haber mirado de verdad — la herramienta externa no arranca (en Windows `npm`, `pnpm` y `yarn` son `.cmd`: `spawnSync` sin `shell` falla con ENOENT, ya pasó con `codex`, `src/fs/git.ts:446`), sale con código distinto de 0 por un error de red o del registry, o el escaneo del historial se corta por tamaño — se certifica limpio un proyecto que no lo está — ENOENT, timeout, código de salida no previsto o salida que no se puede parsear dan siempre NO VERIFICADO con el motivo, nunca OK; OK solo con una evidencia positiva parseada.
- El escaneo del historial revienta o se cuelga en repos grandes — `git log -p --all` supera el `maxBuffer` de 64 MB (`GIT_MAX_BUFFER`, `src/fs/git.ts:47`), hay binarios o LFS, el clon es superficial (`--depth 1` en CI), o hay ramas y stashes inalcanzables — excepción sin capturar o cobertura parcial que se presenta como completa — lectura en streaming o por commits; un clon superficial da NO VERIFICADO («historial truncado»); declarar qué refs se miraron.
- Falsos positivos en masa que vuelven el código de salida inútil — los patrones casan con fixtures, `.env.example`, `node_modules/`, `vendor/`, `target/`, lockfiles con hashes de integridad o los tests del plugin con secretos plantados — siempre sale 1, la gente desactiva puntos con un motivo de relleno — excluir directorios de dependencias y build, distinguir `.env.example`/`.env.sample`, y que la desactivación por punto (con motivo) sea la única válvula, sin opción global.
- El `.taskcode/doctor-deploy.yml` del proyecto rompe o neutraliza el catálogo — id inexistente, id duplicado del catálogo base, desactivar sin motivo, YAML que el parser hecho a mano no soporta — o aborta todo, o pisa en silencio un punto base — id desconocido avisa (política de `config.yml`), duplicado aborta, desactivar sin motivo aborta; añadir no puede redefinir un id base.
- `--escribir` deja el repo sucio o choca consigo mismo — dos ejecuciones el mismo día, proceso muerto a mitad de escritura, o el certificado sin trackear hace abortar el guard de workspace limpio de `start`/`finish` — escritura atómica (tmp + rename), nombre con hora o sufijo si ya existe, y documentar que hay que commitearlo.
- La detección de tipo falla en monorepos y en bordes — `package.json` en `docs/` o `examples/`, workspaces, repo sin marcadores, varios lockfiles — puntos NO APLICA que sí aplican — fijar profundidad de búsqueda; si no se detecta ningún tipo, que se vea y no salga «todo NO APLICA, código 0».

## Puntos sin retorno
- `--escribir` + commit de un certificado con un secreto sin enmascarar — queda en el historial y en los remotos; hay que rotar la clave.
- Por lo demás el comando es de solo lectura; si nunca ejecuta herramientas en modo «fix» (`npm audit fix`), todo es reversible.

## Descartado a propósito
- Dos `doctor-deploy` concurrentes sin `--escribir` — solo leen.
- Cambios de formato de salida de herramientas viejas — basta con que «no se puede parsear» dé NO VERIFICADO.
- Rendimiento del escaneo en repos medianos — es cosa de arquitectura.

## Desacuerdos previstos
- Con dominio — «herramienta no instalada» nunca da OK en el scan de dependencias; por defecto NO VERIFICADO sale con código 0; si se quiere que bloquee, decidirlo explícitamente.
- Con arquitectura — escanear el historial dentro de `GIT_MAX_BUFFER` solo si el desbordamiento da NO VERIFICADO, nunca excepción ni OK.
- Con testing — el secreto plantado exige comprobar la ausencia del valor en stdout, JSON y certificado.

## Suposiciones no verificadas
- Que se reutilice `src/fs/git.ts` (spawnSync, buffer de 64 MB) para `git log`.
- Que `npm`/`pnpm`/`yarn` en Windows se lancen como `codex` (shell condicional).
- Que el parser YAML a mano no soporte listas de objetos anidadas — revisar sus límites en `src/core`.
- Que el guard de workspace limpio de `start`/`finish` se dispare con un certificado sin trackear.
