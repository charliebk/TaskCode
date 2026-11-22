# Plan — TASK-154: plan.test.ts en verde en Windows nativo

Redactado por el coordinador (modo rapido: dos tests concretos con la causa ya diagnosticada).

## Enfoque propuesto

Duracion estimada: 30 min (1 fichero de test, 1 documento; 3 criterios)

1. «propaga cualquier error de escritura que NO sea EEXIST»: tras el `chmod 0o555` de `planificacion/`, se prueba a escribir un fichero; si se puede (NTFS ignora el modo), el test se omite con `t.skip` y el motivo. Donde chmod funciona (Linux, CI) sigue igual.
2. «la rama base real tiene la tarea en un estado distinto»: el contenido del plan se compara normalizando `\r\n` a `\n` (git lo convierte con core.autocrlf al hacer checkout).
3. CLAUDE.md: deja de describir esos dos rojos como esperados en Windows.

## Reutilizacion (Regla 4D)

Lo que ya existe y se usa (helpers, funciones, fixtures, tests), buscado en el repo antes de disenar; y lo que se crea nuevo, con el motivo de no reutilizar:

- El patron de `t.skip` con motivo cuando no hay privilegio de symlink (TASK-120, approve.test.ts): mismo criterio, «no aplica» separado de «fallo».
- Nada nuevo.

## Riesgos aceptados y que los contiene

- En Windows el caso de EACCES deja de probarse: ya no se probaba (fallaba siempre); el CI de Linux lo sigue cubriendo.

## Plan de pruebas

Tests nuevos por criterio (presupuesto de 1 a 3 por criterio; si se pasa, el motivo): 0. Se corrigen dos tests existentes; la comprobacion es `npm test` sin rojos de plan.test.ts en Windows. Mutacion: quitar la normalizacion CRLF vuelve a dar rojo en Windows.

## Lo que necesita decision de una persona

Nada abierto.
