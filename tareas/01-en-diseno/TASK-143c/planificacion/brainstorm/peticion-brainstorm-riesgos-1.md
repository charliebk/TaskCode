# Peticion de brainstorm — TASK-143c, rol riesgos (ronda 1)

- Tarea: TASK-143c — paridad bash y TS, ls-remote y perfil-tests (parte c de TASK-143)
- Tipo: fix · Complejidad declarada: alta
- Ronda: 1
- Fecha: 2026-11-24
- Rol: `brainstorm-riesgos` — lanzalo con el agente de ese mismo nombre
- Vuelca tu respuesta en: `salida-brainstorm-riesgos-1.md`

## Tu pregunta

> ¿Por donde se rompe esto?

## Que miras

- Bordes y estados intermedios: que queda a medias si el proceso muere a mitad.
- Fallos parciales y concurrencia: dos ejecuciones, un recurso ocupado, un permiso denegado.
- Compatibilidad hacia atras con los datos y ficheros que YA existen.
- La vuelta atras: si esto sale mal, como se deshace y que queda inservible.

## Que NO miras

No es una lista de cortesia. Si la ignoras y lo cubres todo "por si acaso", el acotado de contexto se deshace sin que se note y esta tarea deja de tener varios puntos de vista:

- Donde encaja el cambio (es del rol de arquitectura).
- Que aserciones escribir (es del rol de testing).
- Las reglas de negocio (son del rol de dominio).

## Enunciado de la tarea

### Objetivo

````
Parte c del troceo de TASK-143 (Regla 4D: duplicacion en Git-Flow (bash y TS)), partes TASK-143a, TASK-143b, TASK-143c en la rama fix/task-143-regla-4d-duplicacion-en-git-flow-bash-y.

detect_operation_in_progress comun con test de paridad frente a git.ts, ls-remote de git.ts con entorno y limite, finish con --main, y perfil-tests con la compilacion protegida.
````

### Criterios de aceptacion

````
La deteccion de operacion en curso (abort-merge, diagnose-repo, git.ts) tiene test de paridad, y los ls-remote de git.ts llevan GIT_TERMINAL_PROMPT=0 y limite de tiempo; finish pasa --main al script
perfil-tests.mjs reutiliza la compilacion protegida de verificar-impacto (copia de dist/src y cerrojo) o lo documenta
````

## Como entregas

Escribe en `salida-brainstorm-riesgos-1.md`, con estas secciones y en este orden:

- Modos de fallo, ordenados por gravedad, con el escenario concreto de cada uno
- Estados intermedios y fallos parciales
- Compatibilidad hacia atras
- Vuelta atras
- El riesgo que mas te preocupa (UNO solo)

## Reglas

- **Propones enfoque; no implementas.** No escribas codigo de produccion ni modifiques ficheros del repo: tu salida es un documento.
- Evidencia, no suposicion: si afirmas que algo se comporta de cierta manera, es porque lo has mirado. Di de donde lo sacas.
- Prefiere lo concreto: rutas, nombres y casos reales por encima de recomendaciones genericas.
- Trabajan en paralelo contigo, sin verte: **arquitectura**, **testing**. No cubras lo suyo — si lo haces, el unificador recibira el mismo punto de vista repetido y lo leera como confirmacion.
