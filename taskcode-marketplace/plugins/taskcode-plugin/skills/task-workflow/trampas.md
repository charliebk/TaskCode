# Trampas que cuestan tiempo

Se lee cuando un comando de `taskctl` o un script de Git-Flow falla de forma
rara (se cuelga, sale 0 sin hacer nada, se queja del workspace o de la rama),
y antes de trabajar en un clon nuevo o en Windows.

**Los scripts de Git-Flow se invocan como `bash script.sh`, nunca por ruta
directa.** El bit de ejecucion no viaja por Git en todas las configuraciones.
En Windows hay una segunda capa: `bash` desde PowerShell puede resolver al de
WSL y reventar; hace falta el `bash` de Git con su directorio de utilidades en
el PATH, o se queda sin las herramientas que los scripts usan.

**Los scripts escriben un registro de cada ejecucion** dentro del directorio
de Git, en `taskcode/gitflow/gitflow-FECHA.log`. La ruta exacta la da
`git rev-parse --git-path taskcode/gitflow`, y preguntarla es mejor que
componerla: en un repo normal sale bajo `.git/`, pero en un **worktree
enlazado** el directorio de Git es otro y el registro vive ahi. Va fuera del
arbol de trabajo a proposito: durante
mucho tiempo lo escribian dentro del repo, nada mas arrancar y antes de mirar
si el workspace estaba limpio, asi que **se ensuciaban el workspace ellos
mismos** y el comando de reanudar quedaba inservible en cualquier repo que no
ignorara esa ruta. No hace falta anadir nada al `.gitignore`.

**La herramienta commitea solo lo que escribe** (mas las rutas de
sincronizacion, si las hay): nunca un `git add` global. Los ficheros que se le
pasen a `import` tienen que vivir **fuera** del repo: dentro, ensucian el
workspace y abortan el propio import.

**Los comandos que escriben en `tareas/` exigen estar en la rama base.** Son
`new`, `import`, `plan` y `approve`. Si el workspace esta limpio **cambian de
rama solos y lo dicen despues**; si esta sucio, abortan. `start`, `review` y
`finish` solo exigen workspace limpio. Los ficheros sin trackear cuentan como
sucio.

**Sin terminal, stdin se ignora.** Los comandos que envuelven scripts
interactivos heredan stdin solo si hay TTY. Sin el, el script recibe EOF y
toma su valor por defecto — que a veces es "no hacer nada" y salir 0. Heredar
siempre no es la alternativa segura: una tuberia abierta que nadie cierra
cuelga el comando **para siempre**, y eso lo produce cualquier arnes de agente
y tambien el runner de tests.

**Un clon nuevo no hereda nada.** Ni dependencias, ni binarios compilados, ni
identidad de Git. Instalar y compilar siempre, **y otra vez tras cada cambio
de rama dentro del mismo clon**. Sin `user.email` y `user.name` configurados,
cualquier commit falla.

**Un fix de errno validado en una sola plataforma no esta validado.** Codigos
distintos describen el mismo hecho segun el sistema operativo. Lo caro no es
el bug: es que el test escrito para cerrarlo hereda el mismo punto ciego, pasa
en local y cae en el CI de la otra plataforma.
