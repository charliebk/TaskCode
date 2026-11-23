# Plan — TASK-148c: utilidades de core (parte c de TASK-148)

Redactado por el coordinador (modo rapido: cada caso tiene fichero y linea en docs/auditoria-4d-completa.md).

## Enfoque propuesto

Duracion estimada: 60 min (parte c del troceo aceptado de TASK-148)

Cada utilidad repetida en core queda una vez, con el comportamiento mas completo:

1. Opciones globales de git (CORE1-09): una funcion en comando-merge que salta las opciones globales y da el subcomando y el `-C`; la usan los dos recorridos.
2. Fecha (CORE1-11): `diaDe` (documento-estado) valida tambien las fechas del catalogo de deploy (`2026-02-30` deja de aceptarse).
3. Solape de etiquetas (CORE1-12): un solape que compara sin mayusculas para catalogo-skills y complejidad-similar.
4. `esObjeto` y `recortar` (CORE1-13, CORE2-17): una implementacion de cada uno.
5. URL de origin (CORE2-09): un parser en plataforma-remota (con el puerto 99999 dan hoy resultados distintos).
6. ANSI (CORE2-10): un limpiador, el de mayor cobertura, para informe-verificacion, progreso y crecimiento-suite.
7. Fichero de test (CORE2-15): una definicion para menores y fs/git (la divergencia documentada se resuelve en una regla).
8. Credenciales (CORE2-16): un redactor para secretos y plataforma-remota (un token usado como usuario queda hoy a la vista).

## Reutilizacion (Regla 4D)

Lo que ya existe y se usa (helpers, funciones, fixtures, tests), buscado en el repo antes de disenar; y lo que se crea nuevo, con el motivo de no reutilizar:

- diaDe (documento-estado), esObjeto (fs/json-claude), el parser de origin y ocultarCredenciales de plataforma-remota, el limpiador de ANSI mas completo de los tres, esRutaDeTest de menores.
- Nuevo: solo la funcion de opciones globales de git, porque hoy el bucle esta copiado en linea.

## Desacuerdos entre roles, y como se resuelven

No hubo roles.

## Riesgos aceptados y que los contiene

- Unificar copias que ya divergen elige un comportamiento (fecha imposible, mayusculas en etiquetas, puerto fuera de rango, token como usuario, ANSI no cubierto): se queda el mas estricto o completo y un test fija el caso en que divergian.

## Plan de pruebas

Un test por utilidad con el caso en que divergian las copias. Mutacion de cada uno. Correr a mano los tests de los modulos tocados.

## Lo que necesita decision de una persona

Nada abierto.
