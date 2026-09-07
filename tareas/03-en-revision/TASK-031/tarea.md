---
id: TASK-031
titulo: "Distribucion del CLI: un clon debe traer un taskctl que arranque"
tipo: fix
sprint: 0
etiquetas: [empaquetado, distribucion, cli]
complejidad: media
modelo_sugerido: sonnet
estado: en-revision
plan_aprobado: true
rama: fix/task-031-distribucion-del-cli-un-clon-debe-traer
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
ultimo_commit_revisado: null
revision_codex: false
creado: 2026-09-07
actualizado: 2026-09-07
dependencias: []
---
## Objetivo

Item **E6** del checklist de terminacion. En un clon recien hecho el plugin
no traia un `taskctl` que arrancase: `dist/` estaba en `.gitignore` y
`bin/taskctl` importa `../dist/src/cli.js`, asi que el CLI moria con
`Cannot find module ...dist/src/cli.js` y codigo 1. Va antes que toda la
Fase D porque esa fase construye encima de una herramienta que hoy, quien
clone el repo, no puede ejecutar.

## Criterios de aceptacion

Transcritos del plan aprobado (`planificacion/plan-final.md`), porque
`taskctl new` deja esta seccion vacia.

- [ ] **AC1** — En un clon recien hecho, **sin `npm install` ni `npm run
      build`**, `node bin/taskctl --version` imprime la version y sale con 0.
      Hoy sale 1.
- [ ] **AC2** — Existe un test automatizado que reproduce AC1 contra un clon
      real (no un mock) y se pone rojo si `dist/src/` deja de estar versionado.
- [ ] **AC3** — El build es reproducible entre plataformas: recompilar no
      produce diff, aseverado por un step de CI que corre **en Linux y en
      Windows**.
- [ ] **AC4** — Se versiona `dist/src/` y **solo** eso: `dist/test/` sigue
      ignorado y no entra ni un fichero de test compilado.
- [ ] **AC5** — `npm test` sigue en verde: los tests actuales mas los nuevos,
      con los 3 rojos conocidos de este entorno Windows y ningun cuarto.
- [ ] **AC6** — El README del plugin describe el arranque real tras el cambio,
      y `skills/task-workflow/SKILL.md` dice en una linea como se pone
      `taskctl` disponible.
- [ ] **AC7** — Verificado a mano en esta sesion nativa: `/plugin marketplace
      add` y `/plugin install` reales, con `taskctl` resolviendo como comando
      suelto dentro de la sesion. Se documenta la salida real, sea cual sea el
      resultado.
- [ ] **AC8** — Documentada la restriccion de `bin/` de nivel superior para
      distribucion por organization settings de claude.ai, con su consecuencia
      para E1.

## Resultado

(pendiente de la revision por pares)
