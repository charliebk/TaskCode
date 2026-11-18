---
id: TASK-135
titulo: "diffRangeForPaths por lotes: ENAMETOOLONG en la revision fragmentada"
tipo: fix
sprint: 0
etiquetas: [windows, review]
complejidad: simple
modelo_sugerido: sonnet
estado: en-diseno
plan_aprobado: false
rama: fix/task-135-diffrangeforpaths-por-lotes-enametoolong
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-18
actualizado: 2026-11-18
dependencias: []
---
## Objetivo

En la revision fragmentada por dominio, review pide el diff de cada grupo con diffRangeForPaths (src/fs/git.ts), que pasa una ruta por argumento sin trocear. Con un grupo de mas de mil ficheros (un volcado de 1218 en un proyecto real) la linea de comandos supera el limite de Windows y git no llega a lanzarse: spawnSync git ENAMETOOLONG. Reproducido con el dist 0.16.1 y 1300 rutas (unos 133.000 caracteres de pathspec): statDeFicheros, que ya va por lotes, pasa; diffRangeForPaths falla. Lo anoto la ronda 2 de TASK-113 como fuera de alcance. Se trocea igual que statDeFicheros y, de paso, se cierra el MENOR pendiente de TASK-113: los dos lotes se cortan tambien por bytes acumulados, no solo por numero de rutas. git-commit.ts y sincronizacion.ts no entran: solo reciben las carpetas de la tarea y las rutas declaradas.

## Criterios de aceptacion
- [ ] diffRangeForPaths parte la lista en lotes y concatena las salidas; con 1300 rutas largas devuelve el diff de todas sin ENAMETOOLONG en Windows
- [ ] El diff concatenado contiene exactamente los ficheros pedidos, en el mismo orden que una sola llamada con pocas rutas, y la lista vacia sigue sin llamar a Git
- [ ] statDeFicheros y diffRangeForPaths cortan cada lote por numero de rutas y por bytes acumulados del pathspec, lejos de 32.767 caracteres, aunque las rutas midan 300 caracteres
- [ ] Test de integracion contra un repo Git temporal: peticion fragmentada de review con un grupo de mas de 1000 ficheros que sin el arreglo falla con ENAMETOOLONG en Windows y con el arreglo genera la peticion con el diff del grupo
- [ ] Las rutas siguen pasando como :(literal), sin regresion del test de TASK-054 con pages/[id].vue y rutas no ASCII

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-18T13:29:13Z | plan | automatico | persona | 0.16.1 |
