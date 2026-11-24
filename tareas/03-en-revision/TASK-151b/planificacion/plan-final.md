# Plan — TASK-151b: commands, hooks y cli (parte b de TASK-151)

Redactado por el coordinador (modo rapido: cada caso tiene fichero y linea en docs/auditoria-4d-completa.md, y la tabla de mutaciones trae el mutante que dejo cada test en verde).

## Enfoque propuesto

Duracion estimada: 55 min (parte b del troceo de TASK-151; senales: 0 ficheros de produccion previstos, unos 9 ficheros de test en commands, hooks y cli, 2 criterios)

Cada test sospechoso de disfraz pasa a fallar cuando se rompe lo que dice probar. Por cada uno: se aplica el mutante de la auditoria (o el obvio si no lo hay), se comprueba que el test sigue en verde, se endurece el test y se comprueba que el mutante lo pone en rojo. Solo se tocan tests, salvo que el endurecimiento destape un fallo real del codigo.

1. doctor-deploy (M6, TCMD-02): el caso de DIRS_EXCLUIDOS usa carpetas versionadas de verdad (commiteadas, sin .gitignore), para que quitar una de la lista cambie el resultado.
2. review-incremental (M7, M8, TCMD-04): el caso de escritura fallida provoca el fallo de una forma que tambien funcione en Linux (sin depender de bloqueos de Windows) y el `rejects` lleva matcher sobre el error propio.
3. salida-temprana (M9, TRES-08): un caso en el que `integra` sea falso y el hook no deba bloquear/actuar, para que `integra = true` lo ponga en rojo.
4. cli/estado (M10, TRES-12): un flag desconocido sale con 1 y lo dice en stderr.
5. doctor-correcciones (TCMD-01): sin `t.skip` por tiempo; si el doctor no responde dentro del limite, el test falla.
6. approve, plan y start (TCMD-03, TCMD-05): los que prometen «sin efectos» o «workspace limpio» comprueban `git status --porcelain` vacio (y HEAD sin mover); los que prometen «error claro» miran el texto del mensaje.
7. guardia-documentacion (TRES-07): `ejecutadoAlguno` (o los casos que lo usan) comprueba tambien `cuenta-sel`.

## Reutilizacion (Regla 4D)

Lo que ya existe y se usa (helpers, funciones, fixtures, tests), buscado en el repo antes de disenar; y lo que se crea nuevo, con el motivo de no reutilizar:

- Los helpers de test existentes (repo-plantilla, `git` de finish-fixtures, tarea-ejemplo, el ejecutor del CLI de test/cli) y la guia skills/task-workflow/disfraz-tests.md; el script de mutacion del coordinador.
- Nuevo: nada de produccion; solo aserciones y casos en los tests. Si hace falta un helper de «workspace limpio» que se repita en tres ficheros, se pone en test/helpers en vez de copiarlo.

## Desacuerdos entre roles, y como se resuelven

Modo rapido: no se lanzan roles.

## Riesgos aceptados y que los contiene

- Provocar el fallo de escritura en Linux puede necesitar otra tecnica (un directorio en lugar del fichero destino, o permisos). Se elige una que no dependa del sistema operativo; si no la hay, se documenta en el test.
- Endurecer un test puede destapar un fallo real del codigo: si pasa, se corrige en esta tarea si es pequeno, o se abre tarea aparte.

## Plan de pruebas

Tests nuevos por criterio (presupuesto de 1 a 3 por criterio; si se pasa, el motivo):

- Criterio 1 (M6-M10 y doctor-correcciones): sobre todo aserciones nuevas en tests existentes; 1 caso nuevo en salida-temprana y 1 en cli/estado.
- Criterio 2 (git status, mensaje y cuenta-sel): aserciones en tests existentes, sin casos nuevos.

La prueba es el propio mutante: cada test endurecido se ejecuta con su mutante (rojo) y sin el (verde), y se anota en la autorrevision. Ninguno es pesado.

## Lo que necesita decision de una persona

Nada abierto. Troceo autorizado de antemano por Carlos para el plan de correcciones 4D.
