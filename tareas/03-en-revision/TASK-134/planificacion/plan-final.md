# Plan — TASK-134: En Windows taskctl lanza el bash de Git, no el primero del PATH

(Modo rapido: el plan lo redacta el coordinador, sin roles.)

## Enfoque propuesto

Duracion estimada: 45 min (de la rama abierta al cierre con merge; senales: 2 ficheros de codigo + 1 nuevo, 2 capas, 4 criterios)

1. `src/core/resolver-bash.ts` (nuevo, logica pura): `resolverBash({ plataforma,
   path, existe })` devuelve `{ comando, origen: 'git' | 'path' }`.
   - Fuera de `win32`: `bash` del PATH, sin mirar nada (Linux y macOS igual).
   - En `win32`: recorre el PATH (separador `;`, entradas vacias o
     entrecomilladas toleradas) buscando `git.exe`; de su carpeta sube uno y
     dos niveles (`cmd\`, `bin\` y `mingw64\bin`, `ucrt64\bin`...) y en cada
     raiz prueba `usr\bin\bash.exe` y luego `bin\bash.exe`. El primero que
     exista gana (`origen: 'git'`). Si no hay ninguno, `bash` del PATH
     (`origen: 'path'`), como hasta ahora.
2. `src/fs/gitflow-runner.ts`: `lanzarBash` sigue siendo el unico sitio que
   lanza bash; resuelve con `resolverBash` (PATH real y `existsSync`) y lanza
   ese ejecutable. Se exporta `bashDeTaskctl()` para que la sonda lo informe.
   `GitflowScriptLaunchError` nombra el bash que intento lanzar.
3. `sondearBash` devuelve tambien el bash resuelto; `taskctl doctor`
   (comprobacion `bash`) dice cual usa y, en Windows con `origen: 'path'`,
   que no encontro el bash de Git junto a `git.exe` y usa el del PATH.

## Riesgos aceptados y que los contiene

- Un PATH con un `git.exe` de otra distribucion (p. ej. el de Cygwin o MSYS2
  sin Git for Windows) cuya raiz tenga `usr\bin\bash.exe`: es tambien un bash
  MSYS que abre el script; vale igual.
- Los tests de la sonda que montan un PATH sin `mktemp`: en Windows, si
  `git.exe` del PATH montado lleva a la instalacion real, el bash es el real
  pero el PATH sigue sin `mktemp`, asi que la sonda debe seguir fallando. Se
  comprueba corriendolos.

## Plan de pruebas

Tests nuevos por criterio (presupuesto de 1 a 3 por criterio; si se pasa, el motivo):
- Criterio 1: 1 de integracion en `test/fs/gitflow-runner.test.ts`: PATH con
  un `bash` falso delante; en Windows la sonda sale OK (usa el de Git); en
  POSIX sale el fallo del falso (no cambia nada). Mas una comprobacion
  empirica a mano desde PowerShell con System32 delante (`taskctl diagnose`).
- Criterio 2: 0 nuevos (grep: un solo `spawnSync` de bash; la sonda ya pasa
  por `lanzarBash`).
- Criterio 3: tests puros en `test/core/resolver-bash.test.ts` (respaldo al
  PATH, Linux y macOS) y el mensaje de doctor.
- Criterio 4: los de `resolver-bash.test.ts` (7, por casos de forma del PATH:
  se pasa del presupuesto porque cada forma de instalacion es un caso) y el de
  integracion.

## Lo que necesita decision de una persona

Nada.
