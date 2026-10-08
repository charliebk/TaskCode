# Peticion de brainstorm — TASK-062, rol riesgos (ronda 1)

- Tarea: TASK-062 — taskctl doctor: comprobar que un proyecto esta listo antes de trabajar
- Tipo: feature · Complejidad declarada: media
- Ronda: 1
- Fecha: 2026-10-08
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
Con el plugin publico, cualquiera lo instala en su proyecto y necesita saber, antes de empezar, si todo lo que el flujo necesita esta en su sitio (Carlos, 2026-10-08). `taskctl doctor` lo comprueba en un solo paso: entorno (Node, Git, bash utilizable para los scripts de Git-Flow), repositorio (estructura `tareas/`, ramas base, origin, workspace), configuracion (`.taskcode/config.yml` valida) y lo necesario para las opciones elegidas (`gh`/`glab` y su sesion si hay merge request por defecto o plataforma declarada). Solo lee y nunca toca nada: para cada fallo dice el comando exacto que lo arregla. Se llama `doctor` porque `status` se confunde con el estado de una tarea y `diagnose` ya existe (diagnostico de Git-Flow).
````

### Criterios de aceptacion

````
`taskctl doctor` imprime una linea por comprobacion con su resultado (ok, aviso o error) y, para cada aviso o error, el comando o paso concreto que lo arregla.
Sale con codigo 0 si no hay errores (los avisos no cuentan) y con codigo 1 si hay alguno; `taskctl doctor --json` da lo mismo en JSON para que una skill lo lea.
Comprueba el entorno: version de Node soportada, `git` disponible y un `bash` que pueda ejecutar los scripts de Git-Flow (en Windows, el de Git y no el de WSL).
Comprueba el repositorio: que es un repo Git, las cinco carpetas `tareas/00-planificadas` a `tareas/04-terminadas`, la rama `develop` y la principal (`main` o `master`), si hay `origin` y si el workspace esta limpio.
Comprueba `.taskcode/config.yml` con el mismo validador que el resto de comandos y lista las claves desconocidas como aviso.
Comprueba la coherencia de las tareas: cada `tarea.md` valida y con `estado` igual a la carpeta donde esta; las incoherencias salen como error con el ID.
Si la config pide merge request por defecto o declara plataforma, comprueba que `gh` o `glab` estan instalados y con sesion (sin subir nada); si no, esa comprobacion sale como omitida.
No escribe, no hace commits, no cambia de rama ni llama a la red salvo la comprobacion de sesion de la plataforma, y no imprime URLs con credenciales.
La skill `task-workflow` dice que se ejecute `taskctl doctor` al empezar en un proyecto, y se elimina `status` de la lista de comandos que no existen solo si hace falta para no confundir; README y CHANGELOG lo documentan.
Tests contra repos Git temporales reales: proyecto completo (todo ok), sin `tareas/`, sin `develop`, config invalida, tarea en carpeta equivocada, workspace sucio, y la salida `--json`; con el doble de `gh`/`glab` para la comprobacion de sesion.
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
- Trabajan en paralelo contigo, sin verte: **arquitectura**. No cubras lo suyo — si lo haces, el unificador recibira el mismo punto de vista repetido y lo leera como confirmacion.
