# Peticion de redaccion del plan — TASK-103 (ronda 1)

- Tarea: TASK-103 — Guardian de merges: config invalida bloquea y merges que hoy no detecta
- Tipo: fix · Complejidad declarada: simple
- Ronda: 1
- Fecha: 2026-11-11
- Rol: `brainstorm-arquitectura` — lanzalo con el agente de ese mismo nombre
- Quien orquesta vuelca tu respuesta en: `../plan-final.md`

**Esta tarea se planifica con un solo rol y no hay unificador**: tu respuesta ES el plan final. Redactala con las secciones de abajo; quien orquesta la vuelca tal cual en `plan-final.md` (tu no escribes ficheros), sin salida intermedia que consolidar.

## Tu pregunta

> Dado lo que ya existe, ¿donde encaja este cambio y que forma tiene?

## Que miras

- Los modulos y ficheros que ya resuelven algo parecido, para extenderlos en vez de duplicarlos.
- Que se crea nuevo, que se extiende y en que orden se construye.
- Los limites que el cambio cruza: contratos publicos, formatos de fichero, esquemas.
- El precedente interno mas cercano: como se resolvio la ultima vez un problema de esta forma.

## Que NO miras

Que lo mires solo tu no te autoriza a cubrirlo todo: lo que queda fuera de tu pregunta no se mira, pero se DICE. Anota en el plan lo que no cubres, para que quien lo apruebe sepa que ese lado no se ha revisado:

- Como se prueba (es del rol de testing).
- Por donde se rompe (es del rol de riesgos).
- Las reglas de negocio (son del rol de dominio).

## Complejidad: declarada frente a heuristica

- Declarada en la tarea: **simple**
- Heuristica (3 puntos): **simple**
- Senales encontradas:
  - etiquetas_adicionales: 2 etiquetas (1 mas alla de la primera) (+1)
  - dependencias: 1 dependencias (TASK-101) (+1)
  - criterios_aceptacion: 8 criterios (umbral: 5) (+1)

Los dos niveles coinciden. Se lanzan 1 rol.

## Que tiene que traer el plan final

- Enfoque propuesto, concreto: que se crea, que se extiende, en que orden.
- Lo que el rol no cubrio, contrastado contra los criterios de aceptacion.
- Riesgos aceptados y que los contiene.
- Plan de pruebas.
- Lo que necesita decision de una persona antes de implementar. **El checkpoint humano es obligatorio**: este plan no vale hasta que alguien lo apruebe con `taskctl approve`.

## Reglas

- **Propones enfoque; no implementas.** No escribas codigo de produccion ni modifiques ficheros del repo: tu salida es el plan.
- Evidencia, no suposicion: si afirmas que algo se comporta de cierta manera, es porque lo has mirado. Di de donde lo sacas.

## Enunciado de la tarea

### Objetivo

````
Sale de TASK-101 (troceada por la regla de una hora, decision de Carlos 2026-11-10) y de MEN-5 de la revision de TASK-100. Hoy, si .taskcode/config.yml no se puede leer (cualquier clave invalida, nueva o antigua), el guardian de merges hace continue en el paso 3 (guardia-merge.ts) y deja pasar el merge: una config mal escrita lo desactiva. Decision de Carlos: bloquear siempre hacia develop, main o master (lista fija, porque sin config no se sabe rama_base) con un mensaje que diga que arreglar; cambia el comportamiento de la 0.14.0 y va al CHANGELOG. Sin fichero de config, sigue dejando pasar como hoy. Una config del destino invalida lleva a la verificacion completa, nunca a desactivarse.
````

### Criterios de aceptacion

````
Con .taskcode/config.yml invalido (una clave antigua y una nueva, un caso cada una), un merge hacia develop, main o master queda bloqueado con un mensaje que nombra el error y como arreglarlo (test en repo temporal)
Sin fichero de config, o con config valida, el guardian se comporta exactamente como antes (test de regresion)
Un merge hacia una rama que no es develop, main ni master con config invalida deja pasar, como hoy (test)
De la revision de TASK-101 (MEN-2, anterior a ella): `git merge -m --abort rama` (y --quit, --continue, --skip como valor de una opcion) se detecta como merge y el guardian lo evalua (test)
De la revision de TASK-101 (ronda 3, huecos que el guardian ya tenia desde TASK-072): `{ git merge x; }`, `time git merge x` y `eval git merge x` se detectan como merge, y `git checkout <fichero> && git merge x` no toma el fichero como rama destino (un test por caso, con el hook real)
De la revision de TASK-101 (NUE-3): los tests de comandoSoloIntegra con barra invertida llevan una barra real (`-\\B`, `-\\C`, `C:\\repo` en el .ts)
README y CHANGELOG explican el cambio de comportamiento
La suite completa pasa en verde (npm test) sin debilitar ningun test
````
