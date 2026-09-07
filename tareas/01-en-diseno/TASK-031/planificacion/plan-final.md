# Plan — TASK-031: Distribucion del CLI: un clon debe traer un taskctl que arranque

Corresponde al item **E6** del checklist de terminacion. Va antes que toda la
Fase D por decision de Carlos del 2026-09-07: la Fase D construye encima de una
herramienta que hoy, en un clon recien hecho, no arranca.

## El fallo, reproducido antes de planificar

```
$ git clone --branch develop . /tmp/e6-repro
$ cd /tmp/e6-repro/taskcode-marketplace/plugins/taskcode-plugin
$ node bin/taskctl --help
[ERROR] taskctl no pudo arrancar: Cannot find module '...\dist\src\cli.js'
EXIT=1
```

**El enunciado del item se equivoca en un punto y hay que corregirlo**:
`package.json` **si** declara `bin: {"taskctl": "bin/taskctl"}`. Y que
`plugin.json` no lo declare **es correcto**: el mecanismo de PATH es por
convencion de directorio (`bin/` en la raiz del plugin), no por campo de
manifiesto. Verificado contra `plugins-reference`, tabla "File locations":
*"Executables added to the Bash tool PATH and invokable as bare commands
while the plugin is enabled"*. La causa unica es que **`dist/` no existe en un
clon** porque esta en `.gitignore`.

## Hechos medidos que condicionan el enfoque

1. **Claude Code si instala las dependencias npm del plugin** al cachearlo:
   `npm ci --ignore-scripts`, disparado por tener `package.json` +
   `package-lock.json` (los dos existen). Verificado ademas que `npm ci` deja
   `typescript` instalado, por ser devDependency sin `--omit=dev`.
2. **`--ignore-scripts` cierra la via de compilar en `postinstall`/`prepare`.**
   La referencia lo dice literalmente: *"No lifecycle scripts"*. Esa opcion
   esta descartada por la plataforma, no por criterio.
3. **El build es reproducible byte a byte en la misma plataforma**: el hash
   agregado de `dist/src` del repo y el de un clon limpio recien compilado
   coinciden (`f28ab625...`).
4. **Pero NO entre plataformas.** `tsc` emite CRLF en Windows (`file
   dist/src/cli.js` devuelve *"with CRLF, LF line terminators"*) y este repo
   tiene `core.autocrlf=true`. Sin fijarlo, un `dist/` versionado daria diff
   falso en cada checkout y el guard de CI no probaria nada.
5. **`bin/` de nivel superior queda prohibido** si algun dia se distribuye por
   organization settings de claude.ai (*"Plugin contains a top-level bin/
   directory"*). No aplica al marketplace git privado de hoy; condiciona el
   futuro y por tanto a E1.

## Enfoque propuesto

Versionar el build de produccion, hacerlo reproducible entre plataformas, y
poner un guard que impida que se desincronice. Decidido con Carlos el
2026-09-07.

1. **`tsconfig.json`**: anadir `"newLine": "lf"`. Sin esto, el mismo `src/`
   compila distinto en Windows y en Linux y nada de lo demas se sostiene.
2. **`.gitattributes`** nuevo, **dentro del plugin** (no en la raiz, para
   acotar su alcance al directorio generado): `dist/** text eol=lf`. Se
   descarta `-text`: marcaria los ficheros como binarios y haria los diffs
   ilegibles sin ganar nada, porque son texto.
3. **`.gitignore` del plugin**: `dist/` pasa a `dist/test/`. Se versiona
   `dist/src/` (26 ficheros, 297K); los tests compilados siguen fuera.
4. **Commitear `dist/src/`** ya recompilado con `newLine: lf`.
5. **Guard en CI**: step que recompila y ejecuta `git diff --exit-code --
   dist/src`. **Tiene que correr en Linux y en Windows**: el modo de fallo
   concreto es cross-plataforma, asi que un guard que solo corra en uno no
   discrimina.
6. **Test automatizado del arranque en frio**: clona el repo a un temporal,
   y **sin `npm install` ni `npm run build`** ejecuta `node bin/taskctl
   --version`. Es la contraprueba del fallo reproducido arriba: hoy sale 1 y
   tras el cambio tiene que salir 0. Falla solo si `dist/src/` deja de estar
   versionado, que es exactamente la regresion que se quiere impedir.
7. **README del plugin**: reescribir la seccion de instalacion. Hoy dice que
   hay que compilar; tras el cambio un clon ya trae `taskctl` listo y
   `npm install` queda solo para desarrollar y correr la suite.
8. **Skill `task-workflow`**: una linea sobre como se pone `taskctl`
   disponible. Lo pide expresamente el enunciado de E6.
9. **Verificacion manual del install real** (`/plugin marketplace add` +
   `/plugin install`), que TASK-021 dejo pendiente por no haber CLI nativo.
   Ahora lo hay.

## Alternativas consideradas

- **Compilar en `postinstall`/`prepare`** — descartada por la plataforma:
  Claude Code instala con `--ignore-scripts` (hecho medido #2). No es una
  preferencia.
- **Compilar bajo demanda desde `bin/taskctl`** (si falta `dist/src/cli.js`,
  invocar `tsc`). Tecnicamente viable, porque `typescript` si queda instalado
  en la cache (hecho medido #1). Descartada por tres motivos: no cubre el clon
  manual sin `npm install`, escribe en el directorio cacheado del plugin (que
  no hay garantia de que sea escribible) y convierte un lanzador de 10 lineas
  en algo con carrera entre procesos concurrentes.
- **Solo documentar en el README** — no arregla nada del camino que importa:
  quien llega por `/plugin install` nunca lee ese README y su `taskctl` sigue
  roto. Ademas E1 (invitar colaboradores) heredaria el problema entero.
- **Bundle de un solo fichero con esbuild/rollup** — contradice la politica de
  cero dependencias, y `tsc` ya produce algo distribuible sin anadir nada.

## Criterios de aceptacion

- [ ] **AC1** — En un clon recien hecho, **sin `npm install` ni `npm run
      build`**, `node bin/taskctl --version` imprime la version y sale con 0.
      Hoy sale 1.
- [ ] **AC2** — Existe un test automatizado que reproduce AC1 contra un clon
      real (no un mock) y se pone rojo si `dist/src/` deja de estar versionado.
- [ ] **AC3** — El build es reproducible entre plataformas: recompilar no
      produce diff, aseverado por un step de CI que corre **en Linux y en
      Windows**.
- [ ] **AC4** — Se versiona `dist/src/` y **solo** eso: `dist/test/` sigue
      ignorado y no entra ni un fichero de test compilado.
- [ ] **AC5** — `npm test` sigue en verde: los 472 tests actuales mas los
      nuevos, con los 3 rojos conocidos de este entorno Windows y ningun
      cuarto.
- [ ] **AC6** — El README del plugin describe el arranque real tras el cambio,
      y `skills/task-workflow/SKILL.md` dice en una linea como se pone
      `taskctl` disponible.
- [ ] **AC7** — Verificado a mano en esta sesion nativa: `/plugin marketplace
      add` y `/plugin install` reales, con `taskctl` resolviendo como comando
      suelto dentro de la sesion. Se documenta la salida real, sea cual sea el
      resultado.
- [ ] **AC8** — Documentada la restriccion de `bin/` de nivel superior para
      distribucion por organization settings de claude.ai, con su consecuencia
      para E1.

## Riesgos o preguntas abiertas

- **Desincronizacion `dist/src` vs `src`** — es el riesgo estructural de esta
  opcion. Mitigado por el guard del punto 5, pero **el guard solo vale si corre
  en las dos plataformas**: si se deja solo en Linux, el modo de fallo real
  (CRLF de Windows) pasa por debajo.
- **Cada commit que toque `src/` arrastra su `dist/`.** Coste aceptado a
  cambio de que el plugin se distribuya funcionando. Conviene que el commit
  de implementacion y el de `dist/` vayan juntos, no separados.
- **El `.gitattributes` podria renormalizar ficheros ajenos** si se escribiera
  con un patron amplio. Se acota a `dist/**` y se pone dentro del plugin.
- **Pregunta que solo AC7 puede contestar**: que `bin/` acabe en el PATH esta
  documentado, pero este proyecto nunca lo ha visto ocurrir en una sesion real
  — el CI lo simula poniendo `bin/` en el PATH a mano, que no es lo mismo. Si
  AC7 sale negativo, el hallazgo es mas valioso que el propio arreglo y hay que
  registrarlo aunque obligue a abrir item nuevo.
- **Los 3 rojos conocidos de Windows**: uno de ellos es por finales de linea.
  Hay que confirmar que el `.gitattributes` nuevo no lo mueve de sitio ni
  enmascara otro.
