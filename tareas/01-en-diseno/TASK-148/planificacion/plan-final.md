# Plan — TASK-148: Regla 4D: catalogos, config y utilidades de core

Redactado por el coordinador (modo rapido: cada caso tiene fichero y linea en docs/auditoria-4d-completa.md).

## Enfoque propuesto

Duracion estimada: 210 min (se trocea en cuatro partes de una hora o menos)

1. Catalogos (parte a): `packageRoot` y `CLAUDE_PLUGIN_ROOT` en un modulo (CORE1-03, CORE2-08); un lector de bloques `prefijo_N_campo` y un `describirValor` para catalogo-skills, heuristica y doctor-deploy-catalogo (CORE1-04); `SKILL_KEY_RE` derivada de los campos (CORE1-05).
2. Config (parte b): `masParecida` para sugerir (CORE1-06), un validador de entero en rango y uno de lista de enumerado sin repetidos (CORE1-07), un test que ata `CLAVES_CONFIG` al switch de claves (CORE1-08), una validacion de ruta relativa (CORE1-10).
3. Utilidades (parte c): opciones globales de git una vez en comando-merge (CORE1-09), una validacion de fecha (CORE1-11), un solape de etiquetas (CORE1-12), un `esObjeto` y un `recortar` (CORE1-13, CORE2-17), un parser de la URL de origin (CORE2-09), un limpiador de ANSI (CORE2-10), una definicion de fichero de test (CORE2-15), un redactor de credenciales (CORE2-16).
4. Comentarios y E/S (parte d): comentarios de config y `dondeFalla` ciertos (CORE1-14); la cabecera y las claves de heuristica sin repetir (CORE2-18); `TRIVIAL_SIN_APROBACION` eliminado o justificado (CORE2-19); los formateadores null a «—» en uno (CORE2-20); la E/S de plugin-instalado, heuristica y revisores documentada o movida a fs (CORE2-21).

## Reutilizacion (Regla 4D)

Lo que ya existe y se usa (helpers, funciones, fixtures, tests), buscado en el repo antes de disenar; y lo que se crea nuevo, con el motivo de no reutilizar:

- masParecida (core/sugerencia.ts), esObjeto de fs/json-claude.ts, ocultarCredenciales y el parser de origin de plataforma-remota, diaDe de documento-estado, esRutaDeTest de menores, el lector de bloques mas estricto de los tres, el limpiador de ANSI de mayor cobertura.
- Nuevo: solo el modulo de la raiz del plugin y los validadores de config (entero en rango, lista de enumerado), porque hoy estan copiados en linea.

## Troceo

### Parte a: raiz del plugin y lector de catalogos
packageRoot en un modulo, un lector de bloques prefijo_N_campo con describirValor, SKILL_KEY_RE derivada (CORE1-03, CORE1-04, CORE1-05, CORE2-08).
Duracion estimada: 60 min
- [ ] packageRoot y CLAUDE_PLUGIN_ROOT se resuelven en un solo modulo; catalogo-skills, heuristica y doctor-deploy-catalogo comparten el lector de bloques prefijo_N_campo y describirValor

### Parte b: validacion de config
masParecida, validadores de entero y de enumerado, CLAVES_CONFIG atada al switch, una ruta relativa (CORE1-06, CORE1-07, CORE1-08, CORE1-10).
Duracion estimada: 50 min
- [ ] config usa masParecida para sugerir, un validador de entero en rango y otro de lista de enumerado; un test falla si CLAVES_CONFIG y el switch de claves no coinciden; SKILL_KEY_RE se deriva de los campos

### Parte c: utilidades de core
Opciones globales de git, fechas, solape de etiquetas, ANSI, credenciales, URL de origin, esObjeto, recortar y fichero de test con una implementacion (CORE1-09, CORE1-11 a CORE1-13, CORE2-09, CORE2-10, CORE2-15 a CORE2-17).
Duracion estimada: 60 min
- [ ] Rutas relativas, fechas, solape de etiquetas, ANSI, redaccion de credenciales, URL de origin, esObjeto y recortar tienen una sola implementacion cada uno

### Parte d: comentarios, diluvio y E/S en core
Comentarios ciertos, heuristica sin repeticion, TRIVIAL_SIN_APROBACION, formateadores de «—» y la E/S de core (CORE1-14, CORE2-18 a CORE2-21).
Duracion estimada: 45 min
- [ ] Comentarios de config y dondeFalla ciertos; la E/S de plugin-instalado, heuristica y revisores se documenta o se mueve a fs; TRIVIAL_SIN_APROBACION se elimina o se justifica en una linea

## Desacuerdos entre roles, y como se resuelven

No hubo roles.

## Riesgos aceptados y que los contiene

- Unificar copias que ya divergen elige un comportamiento (lista vacia y repetidos en los catalogos, `a/../b` en rutas, `2026-02-30` en fechas, mayusculas en etiquetas, puerto 99999 en la URL): se queda el mas estricto o el mas completo y un test fija el caso en que divergian.

## Plan de pruebas

Por parte, 1 o 2 tests del caso en que las copias divergian; en config, el test de paridad CLAVES_CONFIG/switch. Mutacion de cada uno. Correr a mano los tests de los modulos tocados.

## Lo que necesita decision de una persona

Nada abierto. Troceo autorizado de antemano por Carlos para el plan de correcciones 4D («trocear las de mas de 1 h sin preguntar»).
