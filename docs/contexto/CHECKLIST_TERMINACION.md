# Checklist de terminación — TaskCode

> Documento vivo. Se marca cada casilla al cerrar el trabajo real (mergeado
> a `develop`, tests en verde), no al empezarlo. Derivado de
> `INVENTARIO_PENDIENTE.md`; las tareas `TASK-0NN` son las de
> `PLAN_SPRINTS.md`, el resto son huecos detectados en el inventario que no
> tenían tarea asignada.
>
> **Convención**: al cerrar un item se marca su casilla, se actualizan los
> contadores de la tabla de abajo, y se muestra el checklist actualizado en la
> respuesta. Ver `CONVENCIONES.md`.

**Progreso global: 148 / 162 items terminados (91%)** · última actualización: 2026-11-22

Desde el 2026-10-04 se suma la fase G (urgente, pedida por Carlos): el
plugin conduce el ciclo con fases invocables y modos manual, semiautomatico y
automatico (plan de referencia en TASK-055). Y la fase F: el plan de solución de la auditoría del
2026-10-03 (`docs/auditoria/PLAN-SOLUCION-2026-10-03.md`), más TASK-033, TASK-053
y TASK-054.

El total baja de 43 a 42: **D4 se descarta** (ver su entrada). Y sube en 3 lo
hecho: D6, D7 y el propio D4, que cuenta como resuelto porque la decisión está
tomada y documentada, no aplazada.

| Fase | Items | Hechos | Estimación |
|---|---|---|---|
| ✅ Ya terminado (Sprint 0 + 1) | 12 | 12 | — |
| ✅ A — Desbloquear | 3 | **3** | ~6h |
| ✅ B — Cerrar el ciclo de vida | 7 | **7** | ~18h |
| ✅ C — Tapar huecos | 8 | **8** | ~25h |
| ✅ D — Inteligencia del proceso | 6 | **6** | ~35h |
| ✅ E — Cierre | 6 | **6** | ~9h |
| ✅ F — Auditoría 2026-10-03 | 22 | **22** | — |
| ✅ G — Flujo guiado por fases | 5 | **5** | — |
| ✅ H — Peticiones tras el plan | 3 | **3** | — |
| ✅ I — Métricas v2 | 3 | **3** | — |
| ✅ J — Doctor-deploy | 3 | **3** | — |
| ✅ K — Frenos de verificación con hooks | 8 | **8** | — |
| ✅ L — Mantenimiento | 2 | **2** | — |
| ✅ M — Revisores y roles de dominio | 2 | **2** | — |
| ✅ N — Mejoras tras las métricas de la 0.8 | 10 | **10** | — |
| ✅ O — Verificación selectiva por impacto | 1 | **1** | — |
| ✅ P — Agilidad sin perder calidad | 45 | **45** | — |
| Q — Correcciones de la auditoría 4D | 16 | **2** | ~32h |
| **Total pendiente** | **14** | — | — |


Las fases cerradas (Sprint 0 y 1, A a P), las decisiones ya resueltas (#1 a
#17, ninguna abierta) y el «Corte mínimo defendible» viven en
[`archivo/CHECKLIST-fases-cerradas.md`](archivo/CHECKLIST-fases-cerradas.md),
movidas tal cual el 2026-11-12. Aquí queda solo lo que tiene casillas
abiertas. Tope de este fichero: 20 480 B (ver `CONVENCIONES.md`).

## Decisiones que dependen de ti

Ninguna abierta. Las resueltas, con su razonamiento, en el archivo.

---

## Q — Correcciones de la auditoría 4D (2/16)

Plan en [`docs/plan-correccion-4d.md`](../plan-correccion-4d.md); casos en [`docs/auditoria-4d-completa.md`](../auditoria-4d-completa.md).

- [x] TASK-142 — Regla 4D: disfraz en los scripts de Git-Flow — cerrada el 2026-11-22
      *resume-work aplica el stash exacto (SCR-01, CRITICO), pause --push sin origin avisa, push-back aditivo FALLIDO si el destino rechaza, mirror dice lo que copia. 6 tests en rojo antes del arreglo. Una ronda aprobada con correcciones (MEN-1..2). finish --sin-verificacion autorizado (2 rojos conocidos de Windows + tope de este fichero).*
- [x] TASK-154 — plan.test.ts en verde en Windows nativo — cerrada el 2026-11-22
      *El test de EACCES se omite con motivo solo si chmod no impide escribir (NTFS); el de CRLF compara sin finales de linea. Sin rojos esperados en Windows: finish vuelve a verificar de verdad (completa en verde). Una ronda aprobada con correcciones (MEN-1).*
