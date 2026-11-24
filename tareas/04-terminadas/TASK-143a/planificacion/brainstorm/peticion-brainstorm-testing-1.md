# Peticion de brainstorm — TASK-143, rol testing (ronda 1)

- Tarea: TASK-143 — Regla 4D: duplicacion en Git-Flow (bash y TS)
- Tipo: fix · Complejidad declarada: alta
- Ronda: 1
- Fecha: 2026-11-24
- Rol: `brainstorm-testing` — lanzalo con el agente de ese mismo nombre
- Vuelca tu respuesta en: `salida-brainstorm-testing-1.md`

## Tu pregunta

> ¿Como se demuestra que esto funciona, y como envejece?

## Que miras

- Que es observable desde fuera, y contra que recurso real se comprueba.
- Para cada prueba propuesta, LA MUTACION DEL CODIGO FUENTE QUE LA PONDRIA ROJA. Si no sabes decirla, esa prueba no vale.
- Que pruebas ya existentes cambian de expectativa y cuales siguen valiendo de red de regresion.
- Como envejece: que se rompe dentro de seis meses cuando alguien extienda esto.

## Que NO miras

No es una lista de cortesia. Si la ignoras y lo cubres todo "por si acaso", el acotado de contexto se deshace sin que se note y esta tarea deja de tener varios puntos de vista:

- Donde encaja el cambio (es del rol de arquitectura).
- Por donde se rompe en produccion (es del rol de riesgos).
- Las reglas de negocio (son del rol de dominio).

## Enunciado de la tarea

### Objetivo

````
Unificar la logica de Git-Flow copiada entre scripts y entre bash y TypeScript (auditoria 4D completa, docs/auditoria-4d-completa.md, casos SCR-02 a SCR-08, SCR-12, SCR-13 y SCR-15).
````

### Criterios de aceptacion

````
update-feature/fix/release/hotfix y create-release/create-hotfix usan una funcion comun de _gitflow-common.sh, con el mismo fetch previo; merge-hotfix-to-main y merge-release-to-main comparten el cuerpo
El backmerge a develop de los merge a main hace pull --ff-only antes de mergear, como invoke_merge_work_branch_to_develop, con test que lo distingue
La lectura de argumentos y assert_valid_branch_name vienen de un helper comun en los 13 scripts; diagnose-repo usa detect_origin_available
La deteccion de operacion en curso (abort-merge, diagnose-repo, git.ts) tiene test de paridad, y los ls-remote de git.ts llevan GIT_TERMINAL_PROMPT=0 y limite de tiempo; finish pasa --main al script
perfil-tests.mjs reutiliza la compilacion protegida de verificar-impacto (copia de dist/src y cerrojo) o lo documenta
````

## Como entregas

Escribe en `salida-brainstorm-testing-1.md`, con estas secciones y en este orden:

- Que es observable sin llamar a ningun agente
- Plan de pruebas, cada una con su mutacion
- Aserciones trampa que hay que evitar en esta tarea concreta
- Que pruebas existentes cambian de expectativa
- Como envejece

## Reglas

- **Propones enfoque; no implementas.** No escribas codigo de produccion ni modifiques ficheros del repo: tu salida es un documento.
- Evidencia, no suposicion: si afirmas que algo se comporta de cierta manera, es porque lo has mirado. Di de donde lo sacas.
- Prefiere lo concreto: rutas, nombres y casos reales por encima de recomendaciones genericas.
- Trabajan en paralelo contigo, sin verte: **arquitectura**, **riesgos**. No cubras lo suyo — si lo haces, el unificador recibira el mismo punto de vista repetido y lo leera como confirmacion.
