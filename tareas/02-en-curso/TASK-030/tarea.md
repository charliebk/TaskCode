---
id: TASK-030
titulo: "Auto-commit de taskctl y .taskcode/config.yml (items C2 y C4)"
tipo: feature
sprint: 0
etiquetas: []
complejidad: media
modelo_sugerido: sonnet
estado: en-curso
plan_aprobado: true
rama: feature/task-030-auto-commit-de-taskctl-y-taskcode-config
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


## Criterios de aceptacion

Transcritos del plan aprobado (`planificacion/plan-final.md`), porque
`taskctl new` deja esta seccion vacia — a diferencia de `import`, que los
extrae del fichero de entrada.

**C4 — `.taskcode/config.yml`**
- [ ] Tres claves opcionales: `rama_base`, `agente_revisor_por_defecto`, `limite_wip`. Ninguna otra se declara.
- [ ] Sin fichero, el comportamiento es identico al de hoy y los 472 tests existentes pasan **sin tocar ninguno**.
- [ ] Cada clave surte efecto de verdad (no solo se lee): `rama_base: integration` cambia la rama que devuelve `resolveBaseBranchForTipo`.
- [ ] Valor invalido o clave desconocida **abortan** enumerando las claves validas. Nunca caida al default en silencio.
- [ ] Un solo parser: el bucle `clave: valor` de `frontmatter.ts` se extrae y se comparte. No hay un segundo parser YAML.
- [ ] Un solo punto de resolucion (`resolverConfig`); ningun comando lee el fichero por su cuenta.
- [ ] Desaparece la duplicacion de `DEFAULT_AGENTE_REVISOR` entre `new.ts` e `import.ts`.

**C2 — auto-commit**
- [ ] `taskctl` commitea las rutas que escribe, **una a una**. En ningun sitio hay un `git add -A`.
- [ ] Un fichero sucio de la persona **no** entra en el commit de `taskctl` y sigue sucio en el arbol despues.
- [ ] Sin nada que commitear no se crea commit vacio.
- [ ] Un commit que falla (hook, firma) se reporta; no se traga.
- [ ] `--push` sube la rama actual; sin remoto avisa y sale 0.
- [ ] `taskctl import` se puede ejecutar dos veces seguidas sin commitear en medio.
- [ ] Mensajes deterministas, estilo del repo y **sin tildes**.

**Transversal**
- [ ] Divergencia con la §8.3 (que pide tambien subir) documentada, no callada.
- [ ] Suite en verde: los 3 rojos conocidos de Windows y ninguno mas. Si al cablear el auto-commit **no se cae ningun test existente**, se investiga por que antes de darlo por bueno.
- [ ] Revision por pares independiente, con hallazgos clasificados y documentados incluidos los no corregidos.
- [ ] Checklist, contadores y estimaciones de C2 y C4 actualizados.
