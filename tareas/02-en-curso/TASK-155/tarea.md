---
id: TASK-155
titulo: "comprobarSkillInstalado verificable en Windows (claude.cmd)"
tipo: fix
sprint: 0
etiquetas: []
complejidad: simple
modelo_sugerido: sonnet
estado: en-curso
plan_aprobado: true
rama: fix/task-155-comprobarskillinstalado-verificable-en-w
asignado_a: charlie.bk@gmail.com
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-24
actualizado: 2026-11-24
dependencias: []
---
## Objetivo

En Windows claude es un .cmd y spawnSync sin shell no lo ejecuta, asi que comprobarSkillInstalado devuelve siempre no-verificable y plan sugiere instalar skills que ya estan. Resolver el ejecutable en el PATH con PATHEXT (candidatosEnPath) y lanzar un .cmd/.bat de forma segura, para que el estado real (instalado / no-instalado) se pueda verificar.

## Criterios de aceptacion
- [ ] comprobarSkillInstalado localiza claude en el PATH con candidatosEnPath y, en Windows, lanza un .cmd o .bat a traves del shell con la ruta citada; sin claude en el PATH sigue siendo no-verificable sin lanzar nada
- [ ] Un test de integracion pone un claude.cmd (Windows) o un claude ejecutable (resto) de prueba en un PATH temporal que imprime el JSON de plugin list y comprueba instalado y no-instalado; antes del cambio da no-verificable en Windows
- [ ] La verificacion por impacto queda en verde

## Transiciones

| fecha | fase | modo | decidido_por | version |
|---|---|---|---|---|
| 2026-11-24T09:44:26Z | plan | automatico | persona | 0.16.1 |
| 2026-11-24T09:45:19Z | approve | automatico | persona | 0.16.1 |
| 2026-11-24T09:45:21Z | start | automatico | persona | 0.16.1 |
