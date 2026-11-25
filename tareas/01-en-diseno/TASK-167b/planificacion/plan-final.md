# Plan — TASK-167b: detector de duplicados por cuerpo en el diff

(Modo rapido: el plan lo redacta el coordinador. Decisiones de Carlos del
2026-11-25 en el plan de TASK-167: avisa y no bloquea; lenguajes de
candidatos-4d; tokens normalizados sin parser por lenguaje.)

## Enfoque propuesto

Duracion estimada: 70 min (de la rama abierta al cierre con merge; senales: 2 ficheros de codigo —un modulo nuevo `src/core/duplicados-cuerpo.ts` y su uso en `src/commands/review.ts`—, 2 capas, 2 criterios)

1. `core/duplicados-cuerpo.ts`, puro: extrae el cuerpo de una definicion a
   partir de su linea (llaves equilibradas; en Python, por sangria; tope de
   lineas), lo normaliza (sin comentarios con `sinComentariosC`, cadenas,
   numeros e identificadores genericos; palabras clave y signos se quedan),
   lo convierte en tejas de 4 tokens y compara por Jaccard. Da los pares
   nueva-existente y nueva-nueva por encima de un umbral (0.85) con un
   minimo de tokens (30), sin comparar una definicion consigo misma (mismo
   fichero y nombre: es la misma funcion cambiada).
2. `review.ts`: con las definiciones nuevas del diff (`definicionesNuevas`)
   y las existentes de la rama base (`definicionesDeGrep`), lee los cuerpos
   (lo nuevo del arbol; lo existente con `git show <base>:<fichero>`, una
   vez por fichero y solo de las extensiones que trae el diff, con tope de
   ficheros), y si hay pares: un aviso antes de abrir la ronda y una lista en
   `## Candidatos 4D` de la peticion. Nunca lanza: si falla, lo dice y sigue.

## Reutilizacion (Regla 4D)

- `definicionesNuevas`, `definicionesDeGrep`, `EXTENSIONES_CODIGO`, `seccionCandidatos4D` y `SECCION_CANDIDATOS_4D` de `core/candidatos-4d.ts`; `definicionesEnRef` y `seccionCandidatosDeRonda` de `review.ts` — el detector se engancha ahi, no en un camino paralelo.
- `sinComentariosC` de `core/doctor-deploy-reglas.ts` — quitar comentarios respetando cadenas (el mismo que usa TASK-168).
- Repo temporal y helpers de `test/commands/review-candidatos-4d.test.ts` — el test del comando va ahi.
- Nuevo: el modulo de parecido por cuerpo (nada compara cuerpos hoy).

## Riesgos aceptados y que los contiene

- Falsos positivos (envoltorios triviales) — minimo de tokens y umbral alto; es un aviso.
- Coste en repos grandes — solo ficheros de las extensiones del diff, tope de ficheros e indice por numero de tokens.
- Extraccion aproximada del cuerpo (llaves en cadenas, lenguajes sin llaves) — `sinComentariosC` y cadenas normalizadas antes de contar; tope de lineas.

## Plan de pruebas

Tests nuevos por criterio (presupuesto de 1 a 3 por criterio; si se pasa, el motivo):

- Criterio 1: 1 test del comando (`review` en un repo temporal: una funcion existente copiada con otro nombre da el aviso y la entrada en la peticion; sin copia, nada).
- Criterio 2: 2 tests del core (copia renombrada y con identificadores cambiados si; dos funciones distintas no; cuerpo por debajo del minimo no; Python por sangria). Sin pesados.

## Lo que necesita decision de una persona

Resuelto (decisiones de Carlos del 2026-11-25).
