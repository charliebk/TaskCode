# Plan — TASK-061: Merge request en GitLab autoalojado, tambien en subpath

(Lo consolida el agente unificador a partir de 2 roles de brainstorm
lanzados en paralelo: arquitectura, riesgos. Llegaron los dos.
Los desacuerdos entre roles se senalan, no se promedian.
Este plan NO vale hasta que una persona lo apruebe con `taskctl approve`.)

## Enfoque propuesto

- Sin API REST ni token propio: se usa `glab` con `GITLAB_HOST=<base>` y `-R <ruta relativa a la base>` (arquitectura; respaldado por `evidencia-glab-subpath.md`, glab 1.102.0 en Windows).
- Orden (arquitectura): 1) `proyectoDeRemoto` puro y `detectarPlataforma(url, declarado?)` en `src/core/plataforma-remota.ts`; 2) claves en `src/core/config.ts`; 3) `src/fs/merge-request.ts` con un unico `argsBase(remoto)` y `env` extra en `lanzar`; 4) `preflightMergeRequest` en `src/commands/finish-opciones.ts`; 5) skill `finish`, README y CHANGELOG.
- `src/commands/finish.ts` no se toca (arquitectura). Sin claves declaradas, rige la deteccion por host de la 0.6.0 sin cambios.
- Deduccion estricta del proyecto (riesgos): host y prefijo normalizados; si la base no es prefijo exacto de origin, aborta antes de subir nada; nunca devuelve credenciales.

## Desacuerdos entre roles, y como se resuelve cada uno

- Forma de las claves — arquitectura: dos claves libres (`plataforma_remota`, `url_base_remoto`; solo la segunda aborta) / riesgos: validarlas juntas en `config.ts`, porque las libres permiten estados incoherentes; ademas, una sola clave no se discutio — NO RESUELTO: sube a Carlos (ver abajo), porque cambia la superficie publica de config y es caro de deshacer.
- `GITLAB_HOST` — arquitectura: ponerlo solo si `remoto.base` esta definido / riesgos: fijarlo siempre y no heredar `GITLAB_HOST`, `GITLAB_TOKEN` ni `GL_HOST` — gana riesgos cuando hay plataforma gitlab declarada (un host heredado abre el MR en otro servidor); sin declaracion rige la 0.6.0 tal cual, por el criterio 1 (decision del unificador entre las dos posturas, no aportada por un rol).
- API REST — arquitectura: descartada / riesgos: descartada como principal, "como mucho plan B" — no hay desacuerdo real; la evidencia empirica la hace innecesaria.
- Preflight de sesion — arquitectura: `auth status` (suposicion sin verificar) / riesgos: `glab api user` bajo `GITLAB_HOST` si `auth status` no sirve — la evidencia (segunda prueba) muestra que `auth status` ignora `GITLAB_TOKEN`; la eleccion final sube a Carlos.
- Servidor HTTP local del criterio 9 — arquitectura: retirarlo, no hay REST / riesgos: no se pronuncio — sube a Carlos, porque modifica un criterio de aceptacion.
- Clave nueva rompe versiones anteriores — riesgos: ruptura hacia adelante que el CHANGELOG debe decir con todas las letras / arquitectura: solo pide el aviso de compatibilidad — gana riesgos en el tono: el CHANGELOG lo dice explicito (`config.ts` aborta ante claves desconocidas).

## Riesgos aceptados y que los contiene

- MR duplicado o cierre falso por proyecto mal deducido (riesgos, el mayor dano) — deduccion estricta y un unico productor de `-R` para estado y creacion; `interpretarListado` solo filtra por `source_branch`, por lo que no contiene un `-R` valido pero equivocado: queda aceptado.
- `GITLAB_HOST` heredado o pisado (riesgos) — fijarlo en cada llamada, tambien en `comprobarCli`, cuando hay declaracion.
- Fuga de credenciales (riesgos) — la deduccion devuelve solo la ruta; base declarada sin userinfo (se rechaza `@`); token solo por entorno; `ocultarCredenciales` no cubre scp ni URLs sin esquema.
- Base declarada contradice a origin (riesgos) — manda la config; si no encaja con ningun host de las URLs de origin, aborta nombrando la clave.
- El segundo `finish` lee otra config (riesgos) — aviso en la skill: config commiteada en las dos ramas; aborta sin tocar nada si no resuelve igual.
- glab fuerza https (riesgos; confirmado en la evidencia) — se documenta el limite: solo https, certificados propios via sistema o glab.

## Plan de pruebas

- Sin configuracion nueva, la suite existente de finish-merge-request sigue en verde sin cambiar expectativas — repos Git temporales + doble `gh`/`glab` — criterio 1 del enunciado.
- `proyectoDeRemoto`: https, ssh y scp, `.git`, barra final, mayusculas, puerto, base no prefijo (aborta), credenciales no filtradas — funcion pura + repos temporales reales — riesgos.
- El doble `gh`/`glab` registra `GITLAB_HOST` y `-R` en estado, creacion y preflight; un `GITLAB_HOST` del entorno no se hereda — `test/helpers/plataforma-doble.ts` — arquitectura y riesgos.
- Claves de config: valor invalido, combinaciones incoherentes, tabla de cabecera/regla 5 de `config.ts` — repos temporales — arquitectura.
- Primer y segundo `finish` en subpath cierran o abortan con las reglas de la 0.6.0; sin token, sin CLI o instancia inalcanzable aborta antes de subir — remoto bare real — enunciado, criterios 4 y 6.
- Con glab real: `mr create` en subpath y URL que imprime (`urlDeSalidaDeCreacion`); aislar el fichero de recuperacion `%LOCALAPPDATA%/glab-cli/recover/...` que glab real crea y el doble no — evidencia, segunda prueba.

## Sin cubrir por ningun rol

- Criterio 7 (ni URL con credenciales ni token en `tarea.md` ni commits): solo se trata la salida; falta verificar `tarea.md` y commits — se anade una comprobacion.
- Criterio 8 (texto de skill y README sin mencionar el proyecto): ningun rol lo analizo mas alla de "una seccion"; hay tests de contenido en el plugin que lo vigilan.
- Linux y macOS: nadie probo `GITLAB_HOST` con subpath fuera de Windows (riesgos lo lista como suposicion).
- Roles no lanzados: dominio (citado por riesgos) y testing (citado por arquitectura) no llegaron; sus desacuerdos "previstos" son lo que el rol dijo esperar, no posturas reales. Complejidad: declarada media, heuristica simple, 2 roles.

## Suposiciones no verificadas

- `glab mr create -R` en subpath contra un servidor real y que `urlDeSalidaDeCreacion` entienda su URL (arquitectura, riesgos) — solo se probo fuera de un repo (falla con `not a git repository`).
- Cual de las URLs de `urlsDeOrigin` (fetch o push) debe usar la deduccion (arquitectura, riesgos) — leer `git.ts`.
- Que ningun otro consumidor de `RemotoPlataforma` o `detectarPlataforma` se rompa al ampliar el tipo (riesgos).
- `glab api user` como preflight valido con subpath (riesgos, no probado).

## Decisiones pendientes de Carlos

1. Forma de las claves.
   - A) dos claves libres, solo `url_base_remoto` sin plataforma aborta (arquitectura).
   - B) dos claves validadas juntas en `config.ts` (riesgos).
   - C) una sola clave: no la propuso ningun rol; se lista solo para que se vea que existe.
   - Recomendacion que se desprende: B, porque elimina estados incoherentes y la regla de ruptura ya obliga a validar; el coste es un poco mas de validacion.
2. Preflight de sesion.
   - A) `glab auth status` (arquitectura): la evidencia muestra que ignora `GITLAB_TOKEN`, asi que obliga a `glab auth login --hostname <host/subpath>`.
   - B) `glab api user` bajo `GITLAB_HOST` (riesgos): usa el token y es una llamada real.
   - Recomendacion que se desprende: B, apoyada por la segunda prueba; falta probarla con glab real.
3. Criterio 9 (servidor HTTP local de prueba). Retirarlo (arquitectura) o mantenerlo.
   - Recomendacion que se desprende: retirarlo, porque sin API REST no hay endpoints que imitar; el doble de `gh`/`glab` basta.
4. Aprobacion del plan entero con `taskctl approve`: ningun rol ni el unificador la da; incluye aceptar la ruptura hacia adelante de la clave nueva.
