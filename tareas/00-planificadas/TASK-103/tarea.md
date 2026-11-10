---
id: TASK-103
titulo: "Guardian de merges con config invalida: bloquea hacia rama protegida en vez de desactivarse"
tipo: fix
sprint: 0
etiquetas: [verificacion, guardian]
complejidad: simple
modelo_sugerido: sonnet
estado: planificada
plan_aprobado: false
rama: fix/task-103-guardian-de-merges-con-config-invalida-b
asignado_a: null
agente_revisor: general-purpose
skills_recomendados: []
regla_seleccion_skill: null
ultimo_commit_revisado: null
revision_codex: false
tokens_diseno: null
tokens_implementacion: null
tokens_revision: null
creado: 2026-11-10
actualizado: 2026-11-10
dependencias: [TASK-101]
---
## Objetivo

Sale de TASK-101 (troceada por la regla de una hora, decision de Carlos 2026-11-10) y de MEN-5 de la revision de TASK-100. Hoy, si .taskcode/config.yml no se puede leer (cualquier clave invalida, nueva o antigua), el guardian de merges hace continue en el paso 3 (guardia-merge.ts) y deja pasar el merge: una config mal escrita lo desactiva. Decision de Carlos: bloquear siempre hacia develop, main o master (lista fija, porque sin config no se sabe rama_base) con un mensaje que diga que arreglar; cambia el comportamiento de la 0.14.0 y va al CHANGELOG. Sin fichero de config, sigue dejando pasar como hoy. Una config del destino invalida lleva a la verificacion completa, nunca a desactivarse.

## Criterios de aceptacion
- [ ] Con .taskcode/config.yml invalido (una clave antigua y una nueva, un caso cada una), un merge hacia develop, main o master queda bloqueado con un mensaje que nombra el error y como arreglarlo (test en repo temporal)
- [ ] Sin fichero de config, o con config valida, el guardian se comporta exactamente como antes (test de regresion)
- [ ] Un merge hacia una rama que no es develop, main ni master con config invalida deja pasar, como hoy (test)
- [ ] README y CHANGELOG explican el cambio de comportamiento
- [ ] La suite completa pasa en verde (npm test) sin debilitar ningun test
