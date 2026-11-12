# Perfil de la suite por fichero: duración y procesos git — 2026-11-12

TASK-122. Lo genera `scripts/perfil-tests.mjs` (reproducible, sin dependencias):

```bash
node scripts/perfil-tests.mjs --concurrencia 4 --salida docs/auditoria/PERFIL-TESTS-<fecha>.md
```

Corre cada `dist/test/**/*.test.js` en su propio `node --test` con un `git` de
recuento delante en el PATH (y, en Windows, un `--require` que cuenta los `git`
lanzados desde node). Ejecutado sobre la suite entera de la rama de TASK-122
(192 ficheros), con concurrencia 4 en Windows: las duraciones están infladas
por la concurrencia y la carga de la máquina, pero el orden y el recuento de
`git` no dependen de eso.

## Resumen

- **192 ficheros, 1803 tests de primer nivel, 86,8 min de suma de duraciones,
  24 084 procesos `git`.**
- **121 ficheros no lanzan ni un `git`**: 886 tests en 273 s de suma (4,5 min).
  Los 71 restantes, con 917 tests, se llevan 82 min y todos los procesos `git`.
- **Los 10 más lentos suman 39 min (el 45 % del total)** con 77 tests de
  primer nivel.
- Fallos: `commands/approve.test.ts` (1, el `EPERM` de symlink conocido de
  Windows) y `scripts/perfil-tests.test.ts` (1, un artefacto de medir el
  perfil dentro del propio perfil: el `--require` de fuera y el de dentro
  cuentan cada `git` dos veces; aislado pasa).

## Los 10 más lentos, clasificados

| # | fichero | s | tests | git | ¿necesita Git real? | motivo |
|---|---|---|---|---|---|---|
| 1 | empaquetado/distribucion.test.ts | 568 | 9 | 189 | **sí** (capa de integración) | prueba lo que recibe quien clona: exporta el árbol de HEAD con git y arranca `taskctl` sin compilar. Es de publicar, no de cada tarea: candidato a correr solo en la completa |
| 2 | commands/metricas-tokens.test.ts | 507 | 8 | 1167 | **no** | `metricas` solo lee `tarea.md`; el ciclo por CLI solo fabricaba el escenario. Ya montado una vez por fichero en esta tarea (107 → 33 s aislado); lo siguiente es escribir las tareas como hace `helpers/metricas-repos.ts` |
| 3 | commands/finish-merge-request.test.ts | 237 | 32 | 1527 | **en parte** | el push a un `origin` bare y la rama remota sí; construir los argumentos de `gh`/`glab`, el título y el cuerpo es puro y no necesita 32 repos |
| 4 | commands/finish-merge-request-instancia.test.ts | 200 | 34 | 1222 | **no** en su mayoría | resolver host, instancia GitLab y `-R` a partir de la URL del remoto es una función de texto; Git real solo para un caso de extremo a extremo |
| 5 | commands/metricas.test.ts | 196 | 5 | 460 | **no** | igual que el 2: lectura de `tarea.md` e informes |
| 6 | gitflow/merge-to-main.test.ts | 146 | 10 | 230 | **sí** | prueba el script de Git-Flow en bash: el merge real es lo probado |
| 7 | gitflow/origin-guard.test.ts | 127 | 14 | 210 | **sí** | el guard del script compara con un `origin` de verdad |
| 8 | commands/doctor-deploy.test.ts | 125 | 58 | 1681 | **no** en su mayoría | las reglas (secretos, lockfile, `.env`, …) leen ficheros del árbol; basta un directorio con ficheros, sin repo por test |
| 9 | fs/git.test.ts | 125 | 37 | 419 | **sí** | es el adaptador de Git: su razón de ser es hablar con Git real |
| 10 | commands/finish-parcial.test.ts | 124 | 16 | 906 | **en parte** | la decisión de nivel 2 ya es pura (`core/verificacion-proporcional`); aquí basta un caso de integración por puerta, no 16 repos |

Lectura: de los 10, **3 necesitan Git real de verdad** (6, 7 y 9), uno es de
publicación (1) y **6 prueban lógica que se puede probar sin Git** (2, 3, 4, 5,
8 y 10). Es lo que dice la regla de la pirámide escrita en
`docs/contexto/CONVENCIONES.md`: lógica sin Git, Git real solo en una capa fina
de integración.

## Tabla completa

Ficheros: 192. Tests: 1803. Suma de duraciones: 86.8 min. Procesos git: 24084.
Medido con node v22.23.4 en win32, concurrencia 4.

| # | fichero | s | tests | git | git/test | fallos |
|---|---|---|---|---|---|---|
| 1 | test/empaquetado/distribucion.test.ts | 568.2 | 9 | 189 | 21.0 | 0 |
| 2 | test/commands/metricas-tokens.test.ts | 506.8 | 8 | 1167 | 145.9 | 0 |
| 3 | test/commands/finish-merge-request.test.ts | 236.7 | 32 | 1527 | 47.7 | 0 |
| 4 | test/commands/finish-merge-request-instancia.test.ts | 199.8 | 34 | 1222 | 35.9 | 0 |
| 5 | test/commands/metricas.test.ts | 195.8 | 5 | 460 | 92.0 | 0 |
| 6 | test/gitflow/merge-to-main.test.ts | 146.1 | 10 | 230 | 23.0 | 0 |
| 7 | test/gitflow/origin-guard.test.ts | 126.9 | 14 | 210 | 15.0 | 0 |
| 8 | test/commands/doctor-deploy.test.ts | 124.9 | 58 | 1681 | 29.0 | 0 |
| 9 | test/fs/git.test.ts | 124.5 | 37 | 419 | 11.3 | 0 |
| 10 | test/commands/finish-parcial.test.ts | 124 | 16 | 906 | 56.6 | 0 |
| 11 | test/commands/cobertura-cambios.test.ts | 118.7 | 23 | 818 | 35.6 | 0 |
| 12 | test/gitflow/abort-merge.test.ts | 118.3 | 13 | 222 | 17.1 | 0 |
| 13 | test/commands/finish-tag.test.ts | 113.7 | 17 | 875 | 51.5 | 0 |
| 14 | test/hooks/freno-stop-documentacion.test.ts | 105.5 | 12 | 300 | 25.0 | 0 |
| 15 | test/commands/doctor.test.ts | 105.1 | 61 | 613 | 10.0 | 0 |
| 16 | test/gitflow/merge-to-main-tag.test.ts | 102.6 | 8 | 212 | 26.5 | 0 |
| 17 | test/agents/brainstorm-roles.test.ts | 101.1 | 88 | 0 | 0.0 | 0 |
| 18 | test/commands/finish-aviso-release.test.ts | 100.8 | 10 | 734 | 73.4 | 0 |
| 19 | test/commands/finish-heldout.test.ts | 88.4 | 21 | 600 | 28.6 | 0 |
| 20 | test/hooks/guardia-documentacion.test.ts | 84.8 | 18 | 670 | 37.2 | 0 |
| 21 | test/commands/finish-documentacion.test.ts | 76.5 | 10 | 545 | 54.5 | 0 |
| 22 | test/commands/coste-automatico.test.ts | 71.5 | 6 | 461 | 76.8 | 0 |
| 23 | test/hooks/freno-stop.test.ts | 66.4 | 18 | 193 | 10.7 | 0 |
| 24 | test/hooks/guardia-merge.test.ts | 64.6 | 24 | 583 | 24.3 | 0 |
| 25 | test/commands/cadena.test.ts | 63.4 | 13 | 215 | 16.5 | 0 |
| 26 | test/commands/doctor-deploy-resultado.test.ts | 63.3 | 21 | 950 | 45.2 | 0 |
| 27 | test/gitflow/origin-deteccion.test.ts | 60.2 | 5 | 88 | 17.6 | 0 |
| 28 | test/fs/git-commit.test.ts | 58.3 | 13 | 151 | 11.6 | 0 |
| 29 | test/fs/wip-scan.test.ts | 56.4 | 13 | 209 | 16.1 | 0 |
| 30 | test/commands/metricas-fila.test.ts | 55.2 | 2 | 312 | 156.0 | 0 |
| 31 | test/commands/doctor-deploy-aplicaciones.test.ts | 51.6 | 27 | 685 | 25.4 | 0 |
| 32 | test/commands/doctor-deploy-config.test.ts | 50.4 | 18 | 664 | 36.9 | 0 |
| 33 | test/integracion/cli-main.test.ts | 48.9 | 12 | 470 | 39.2 | 0 |
| 34 | test/commands/automatico-guardas.test.ts | 48.3 | 4 | 341 | 85.3 | 0 |
| 35 | test/commands/duracion-estimada.test.ts | 48 | 5 | 278 | 55.6 | 0 |
| 36 | test/fs/decision-parcial.test.ts | 46.9 | 9 | 187 | 20.8 | 0 |
| 37 | test/commands/automatico-guarda-finish.test.ts | 45.9 | 3 | 326 | 108.7 | 0 |
| 38 | test/commands/doctor-deploy-tareas.test.ts | 41.7 | 14 | 480 | 34.3 | 0 |
| 39 | test/commands/automatico-ciclo.test.ts | 41.2 | 2 | 266 | 133.0 | 0 |
| 40 | test/commands/automatico-rondas.test.ts | 39.5 | 2 | 269 | 134.5 | 0 |
| 41 | test/commands/finish-verificacion.test.ts | 32.5 | 9 | 248 | 27.6 | 0 |
| 42 | test/commands/auto-commit.test.ts | 29.7 | 10 | 268 | 26.8 | 0 |
| 43 | test/scripts/verificar-impacto.test.ts | 29.1 | 9 | 109 | 12.1 | 0 |
| 44 | test/commands/metricas-agregados.test.ts | 28.8 | 10 | 83 | 8.3 | 0 |
| 45 | test/commands/finish-merge.test.ts | 28.4 | 6 | 176 | 29.3 | 0 |
| 46 | test/commands/approve.test.ts | 27.6 | 19 | 277 | 14.6 | 1 |
| 47 | test/commands/finish-guardas.test.ts | 26.5 | 6 | 171 | 28.5 | 0 |
| 48 | test/hooks/guardia-heldout.test.ts | 26.2 | 11 | 93 | 8.5 | 0 |
| 49 | test/skills/revisores.test.ts | 24.5 | 27 | 0 | 0.0 | 0 |
| 50 | test/commands/doctor-status-line.test.ts | 23.9 | 13 | 84 | 6.5 | 0 |
| 51 | test/skills/task-workflow.test.ts | 23.6 | 25 | 0 | 0.0 | 0 |
| 52 | test/commands/doctor-hooks-subagente.test.ts | 23.3 | 14 | 134 | 9.6 | 0 |
| 53 | test/commands/finish-duracion-real.test.ts | 22.1 | 3 | 122 | 40.7 | 0 |
| 54 | test/commands/import.test.ts | 21.8 | 22 | 206 | 9.4 | 0 |
| 55 | test/integracion/config.test.ts | 19.7 | 38 | 172 | 4.5 | 0 |
| 56 | test/commands/finish-instante-final.test.ts | 19.3 | 3 | 111 | 37.0 | 0 |
| 57 | test/commands/finish-cierre.test.ts | 19.1 | 5 | 127 | 25.4 | 0 |
| 58 | test/integracion/cli-flags-desconocidos.test.ts | 18.3 | 22 | 174 | 7.9 | 0 |
| 59 | test/commands/doctor-deploy-men.test.ts | 18.2 | 9 | 221 | 24.6 | 0 |
| 60 | test/commands/finish-linaje.test.ts | 16.6 | 3 | 116 | 38.7 | 0 |
| 61 | test/commands/metricas-repo.test.ts | 16.4 | 6 | 47 | 7.8 | 0 |
| 62 | test/commands/codex-review.test.ts | 15.9 | 11 | 141 | 12.8 | 0 |
| 63 | test/fs/sonda-bash.test.ts | 14.3 | 2 | 0 | 0.0 | 0 |
| 64 | test/gitflow/logging.test.ts | 12.5 | 3 | 8 | 2.7 | 0 |
| 65 | test/commands/metricas-version.test.ts | 11 | 4 | 32 | 8.0 | 0 |
| 66 | test/commands/doctor-correcciones.test.ts | 10.8 | 6 | 55 | 9.2 | 0 |
| 67 | test/commands/flags-repetidos.test.ts | 8.6 | 1 | 36 | 36.0 | 0 |
| 68 | test/fs/gitflow-runner.test.ts | 7.9 | 7 | 1 | 0.1 | 0 |
| 69 | test/commands/doctor-version-plugin.test.ts | 7 | 5 | 38 | 7.6 | 0 |
| 70 | test/commands/estado.test.ts | 6.3 | 7 | 28 | 4.0 | 0 |
| 71 | test/core/verificacion-proporcional.test.ts | 6.2 | 14 | 23 | 1.6 | 0 |
| 72 | test/integracion/plugin-instalado.test.ts | 6 | 1 | 0 | 0.0 | 0 |
| 73 | test/hooks/registro-coste.test.ts | 5.9 | 6 | 44 | 7.3 | 0 |
| 74 | test/fs/task-store.test.ts | 4.1 | 12 | 0 | 0.0 | 0 |
| 75 | test/commands/estado-seguir.test.ts | 3.8 | 2 | 0 | 0.0 | 0 |
| 76 | test/fs/sonda-version-plugin.test.ts | 3.8 | 9 | 0 | 0.0 | 0 |
| 77 | test/fs/deteccion-tests.test.ts | 3.7 | 5 | 0 | 0.0 | 0 |
| 78 | test/fs/git-identidad.test.ts | 3.4 | 3 | 9 | 3.0 | 0 |
| 79 | test/core/tareas-reales.test.ts | 3.2 | 1 | 0 | 0.0 | 0 |
| 80 | test/fs/task-store-wip.test.ts | 3.2 | 8 | 0 | 0.0 | 0 |
| 81 | test/core/metricas.test.ts | 2.8 | 35 | 0 | 0.0 | 0 |
| 82 | test/helpers/repo-plantilla.test.ts | 2.6 | 5 | 0 | 0.0 | 0 |
| 83 | test/core/metricas-finish.test.ts | 2.5 | 5 | 0 | 0.0 | 0 |
| 84 | test/core/revisores.test.ts | 2.4 | 17 | 0 | 0.0 | 0 |
| 85 | test/fs/task-store-reintento.test.ts | 2.4 | 4 | 0 | 0.0 | 0 |
| 86 | test/fs/rondas-aprobada.test.ts | 2.2 | 5 | 0 | 0.0 | 0 |
| 87 | test/core/plataforma-remota.test.ts | 1.8 | 10 | 0 | 0.0 | 0 |
| 88 | test/empaquetado/sin-literales-secretos.test.ts | 1.8 | 4 | 1 | 0.3 | 0 |
| 89 | test/scripts/perfil-tests.test.ts | 1.8 | 1 | 1 | 1.0 | 1 |
| 90 | test/core/remoto-declarado.test.ts | 1.7 | 13 | 0 | 0.0 | 0 |
| 91 | test/empaquetado/metadatos.test.ts | 1.7 | 5 | 0 | 0.0 | 0 |
| 92 | test/core/plan-desempate-skill.test.ts | 1.5 | 20 | 0 | 0.0 | 0 |
| 93 | test/core/plugin-instalado.test.ts | 1.5 | 13 | 0 | 0.0 | 0 |
| 94 | test/core/progreso.test.ts | 1.5 | 7 | 0 | 0.0 | 0 |
| 95 | test/core/doctor.test.ts | 1.4 | 5 | 0 | 0.0 | 0 |
| 96 | test/core/duracion-estimada.test.ts | 1.4 | 5 | 0 | 0.0 | 0 |
| 97 | test/core/metricas-fila.test.ts | 1.4 | 21 | 0 | 0.0 | 0 |
| 98 | test/core/roles-brainstorm.test.ts | 1.4 | 19 | 0 | 0.0 | 0 |
| 99 | test/core/state-machine.test.ts | 1.4 | 28 | 0 | 0.0 | 0 |
| 100 | test/core/tarea-file.test.ts | 1.4 | 6 | 0 | 0.0 | 0 |
| 101 | test/core/doctor-deploy-referencias.test.ts | 1.3 | 5 | 0 | 0.0 | 0 |
| 102 | test/core/heuristica.test.ts | 1.3 | 47 | 0 | 0.0 | 0 |
| 103 | test/core/informe-revision-origen.test.ts | 1.3 | 4 | 0 | 0.0 | 0 |
| 104 | test/core/metricas-agregados.test.ts | 1.3 | 2 | 0 | 0.0 | 0 |
| 105 | test/core/reporter-progreso.test.ts | 1.3 | 2 | 0 | 0.0 | 0 |
| 106 | test/core/roadmap.test.ts | 1.3 | 12 | 0 | 0.0 | 0 |
| 107 | test/core/task-id.test.ts | 1.3 | 13 | 0 | 0.0 | 0 |
| 108 | test/core/doctor-deploy-catalogo.test.ts | 1.2 | 22 | 0 | 0.0 | 0 |
| 109 | test/core/evolucion.test.ts | 1.2 | 7 | 0 | 0.0 | 0 |
| 110 | test/core/import-parser.test.ts | 1.2 | 17 | 0 | 0.0 | 0 |
| 111 | test/core/task.test.ts | 1.2 | 17 | 0 | 0.0 | 0 |
| 112 | test/core/transiciones.test.ts | 1.2 | 29 | 0 | 0.0 | 0 |
| 113 | test/fs/transcripciones.test.ts | 1.2 | 2 | 0 | 0.0 | 0 |
| 114 | test/core/doctor-deploy-aplicaciones.test.ts | 1.1 | 16 | 0 | 0.0 | 0 |
| 115 | test/core/doctor-deploy-reglas.test.ts | 1.1 | 29 | 0 | 0.0 | 0 |
| 116 | test/core/hooks-subagente.test.ts | 1.1 | 7 | 0 | 0.0 | 0 |
| 117 | test/core/secretos.test.ts | 1.1 | 9 | 0 | 0.0 | 0 |
| 118 | test/core/siguiente.test.ts | 1.1 | 4 | 0 | 0.0 | 0 |
| 119 | test/core/tarea-body-subtitulos.test.ts | 1.1 | 8 | 0 | 0.0 | 0 |
| 120 | test/core/doctor-deploy-auditoria.test.ts | 1 | 9 | 0 | 0.0 | 0 |
| 121 | test/core/doctor-deploy.test.ts | 1 | 3 | 0 | 0.0 | 0 |
| 122 | test/core/frontmatter.test.ts | 1 | 12 | 0 | 0.0 | 0 |
| 123 | test/core/grupos-metricas.test.ts | 1 | 4 | 0 | 0.0 | 0 |
| 124 | test/core/heuristica-complejidad.test.ts | 1 | 13 | 0 | 0.0 | 0 |
| 125 | test/core/coste-transcripcion.test.ts | 0.9 | 9 | 0 | 0.0 | 0 |
| 126 | test/core/validacion-tarea.test.ts | 0.9 | 10 | 0 | 0.0 | 0 |
| 127 | test/commands/board.test.ts | 0.8 | 27 | 0 | 0.0 | 0 |
| 128 | test/core/coste-revision.test.ts | 0.8 | 9 | 0 | 0.0 | 0 |
| 129 | test/core/versiones-metricas.test.ts | 0.8 | 4 | 0 | 0.0 | 0 |
| 130 | test/core/wip.test.ts | 0.8 | 24 | 0 | 0.0 | 0 |
| 131 | test/skills/finish-cierre.test.ts | 0.7 | 4 | 0 | 0.0 | 0 |
| 132 | test/cli/estado.test.ts | 0.5 | 8 | 0 | 0.0 | 0 |
| 133 | test/core/config-verificacion.test.ts | 0.5 | 8 | 0 | 0.0 | 0 |
| 134 | test/core/coste-automatico.test.ts | 0.5 | 10 | 0 | 0.0 | 0 |
| 135 | test/skills/lo-que-lees.test.ts | 0.5 | 5 | 0 | 0.0 | 0 |
| 136 | test/core/coste-registro.test.ts | 0.4 | 8 | 0 | 0.0 | 0 |
| 137 | test/skills/autorrevision.test.ts | 0.4 | 5 | 0 | 0.0 | 0 |
| 138 | test/skills/doctor-deploy.test.ts | 0.4 | 12 | 0 | 0.0 | 0 |
| 139 | test/skills/fases.test.ts | 0.4 | 10 | 0 | 0.0 | 0 |
| 140 | test/cli/args.test.ts | 0.3 | 11 | 0 | 0.0 | 0 |
| 141 | test/cli/asignado.test.ts | 0.3 | 19 | 0 | 0.0 | 0 |
| 142 | test/commands/rama-base.test.ts | 0.3 | 0 | 0 | — | 0 |
| 143 | test/commands/rango-reservado.test.ts | 0.3 | 0 | 0 | — | 0 |
| 144 | test/commands/review-alcance.test.ts | 0.3 | 0 | 0 | — | 0 |
| 145 | test/commands/review-autorrevision.test.ts | 0.3 | 0 | 0 | — | 0 |
| 146 | test/core/board-format.test.ts | 0.3 | 0 | 0 | — | 0 |
| 147 | test/skills/validador-claude.test.ts | 0.3 | 7 | 0 | 0.0 | 0 |
| 148 | test/commands/new-contenido.test.ts | 0.2 | 0 | 0 | — | 0 |
| 149 | test/commands/new.test.ts | 0.2 | 0 | 0 | — | 0 |
| 150 | test/commands/particion.test.ts | 0.2 | 0 | 0 | — | 0 |
| 151 | test/commands/plan-brainstorm.test.ts | 0.2 | 0 | 0 | — | 0 |
| 152 | test/commands/plan.test.ts | 0.2 | 0 | 0 | — | 0 |
| 153 | test/commands/progreso-comandos.test.ts | 0.2 | 0 | 0 | — | 0 |
| 154 | test/commands/progreso-verificacion.test.ts | 0.2 | 0 | 0 | — | 0 |
| 155 | test/commands/registrar-coste-agente.test.ts | 0.2 | 0 | 0 | — | 0 |
| 156 | test/commands/registrar-coste.test.ts | 0.2 | 0 | 0 | — | 0 |
| 157 | test/commands/reporter-progreso.test.ts | 0.2 | 0 | 0 | — | 0 |
| 158 | test/commands/review-camino.test.ts | 0.2 | 0 | 0 | — | 0 |
| 159 | test/commands/review-contexto.test.ts | 0.2 | 0 | 0 | — | 0 |
| 160 | test/commands/review-documentacion.test.ts | 0.2 | 0 | 0 | — | 0 |
| 161 | test/commands/review-dominios.test.ts | 0.2 | 0 | 0 | — | 0 |
| 162 | test/commands/review-exclusion.test.ts | 0.2 | 0 | 0 | — | 0 |
| 163 | test/commands/review-guardas.test.ts | 0.2 | 0 | 0 | — | 0 |
| 164 | test/commands/review-incremental.test.ts | 0.2 | 0 | 0 | — | 0 |
| 165 | test/commands/review-modelo.test.ts | 0.2 | 0 | 0 | — | 0 |
| 166 | test/commands/review-rutas.test.ts | 0.2 | 0 | 0 | — | 0 |
| 167 | test/commands/revision-lecturas.test.ts | 0.2 | 0 | 0 | — | 0 |
| 168 | test/commands/roadmap-ajenos.test.ts | 0.2 | 0 | 0 | — | 0 |
| 169 | test/commands/roadmap-transiciones.test.ts | 0.2 | 0 | 0 | — | 0 |
| 170 | test/commands/semiautomatico.test.ts | 0.2 | 0 | 0 | — | 0 |
| 171 | test/commands/siguiente.test.ts | 0.2 | 0 | 0 | — | 0 |
| 172 | test/commands/sincronizacion-ciclo.test.ts | 0.2 | 0 | 0 | — | 0 |
| 173 | test/commands/sincronizacion-raiz-tareas.test.ts | 0.2 | 0 | 0 | — | 0 |
| 174 | test/commands/sincronizacion-revision.test.ts | 0.2 | 0 | 0 | — | 0 |
| 175 | test/commands/sincronizacion-scripts.test.ts | 0.2 | 0 | 0 | — | 0 |
| 176 | test/commands/start-asignacion.test.ts | 0.2 | 0 | 0 | — | 0 |
| 177 | test/commands/start-basico.test.ts | 0.2 | 0 | 0 | — | 0 |
| 178 | test/commands/start-identidad.test.ts | 0.2 | 0 | 0 | — | 0 |
| 179 | test/commands/start-wip-ramas.test.ts | 0.2 | 0 | 0 | — | 0 |
| 180 | test/commands/start-wip.test.ts | 0.2 | 0 | 0 | — | 0 |
| 181 | test/commands/validacion-puertas.test.ts | 0.2 | 0 | 0 | — | 0 |
| 182 | test/commands/veredicto.test.ts | 0.2 | 0 | 0 | — | 0 |
| 183 | test/commands/verificacion-selectiva.test.ts | 0.2 | 0 | 0 | — | 0 |
| 184 | test/commands/verificacion-tres-puertas.test.ts | 0.2 | 0 | 0 | — | 0 |
| 185 | test/commands/wrappers.test.ts | 0.2 | 0 | 0 | — | 0 |
| 186 | test/core/autorrevision.test.ts | 0.2 | 0 | 0 | — | 0 |
| 187 | test/core/aviso-release.test.ts | 0.2 | 0 | 0 | — | 0 |
| 188 | test/core/catalogo-skills.test.ts | 0.2 | 0 | 0 | — | 0 |
| 189 | test/core/cierre.test.ts | 0.2 | 0 | 0 | — | 0 |
| 190 | test/core/cobertura.test.ts | 0.2 | 0 | 0 | — | 0 |
| 191 | test/core/comando-tests.test.ts | 0.2 | 0 | 0 | — | 0 |
| 192 | test/core/config-sincronizacion.test.ts | 0.2 | 0 | 0 | — | 0 |
