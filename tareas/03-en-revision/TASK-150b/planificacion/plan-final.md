# Plan — TASK-150b: la plantilla del informe en un solo sitio

(Modo rapido, decision de Carlos del 2026-11-12: el plan lo redacta el
coordinador sin lanzar los tres roles ni el unificador.)

## Enfoque propuesto

Duracion estimada: 45 min (de la rama abierta al cierre con merge; senales: 6 ficheros `.md` —las cinco revisoras y revision.md—, 1 de test —`test/skills/revisores.test.ts`—, 1 capa, 2 criterios)

CONT-05: la cabecera del informe (titulo, `- Commit revisado:`, `- Revisor:`,
`- Veredicto:`, `## Hallazgos`) esta copiada en las cinco revisoras, y tres de
ellas aun piden «Contexto adicional pedido» (MEN-1 de TASK-150a). La fuente
es `informeTemplate` de `src/commands/review.ts`, que deja el esqueleto;
revision.md («El informe») lo describe. Cada revisora pasa a decir solo:
rellena el esqueleto que deja `taskctl review` (ver «El informe» de
revision.md) con su nombre en `- Revisor:`, y lista sus secciones propias,
que van despues de `## Hallazgos`, sin «Contexto adicional pedido» (lo leido
fuera va en `## Lecturas fuera del contexto permitido`, que ya trae el
esqueleto). revision.md deja de decir que la cabecera de cada revisor esta en
su skill.

El test 10c de `revisores.test.ts` exige hoy esa copia (para que no diverja);
se invierte: ninguna revisora copia la cabecera y todas remiten al esqueleto.
El 10b (el esqueleto derivado de `informeTemplate`) se queda.

## Reutilizacion (Regla 4D)

- `informeTemplate` — fuente unica del esqueleto (usos buscados: review.ts lo escribe; revisores.test.ts lo deriva; ninguna otra copia en src/).
- `ESQUELETO`, `TITULO_ANTES`, `CAMPOS_CABECERA` de `revisores.test.ts` — se reutilizan para el test invertido.
- Copias buscadas por titulo, `- Commit revisado: <sha>` y «Contexto adicional pedido» en skills/, agents/ y docs/: solo las cinco revisoras.
- Nuevo: nada.

## Desacuerdos entre roles, y como se resuelven

Sin roles (modo rapido).

## Riesgos aceptados y que los contiene

- Un revisor sin la cabecera delante podria escribir un informe mal formado — el esqueleto ya esta en el fichero que rellena, y `veredicto`/`finish` validan la cabecera.
- Los tests de cada revisora que miraban su bloque — se reescriben al formato nuevo en el mismo fichero.

## Plan de pruebas

Tests nuevos por criterio (presupuesto de 1 a 3 por criterio; si se pasa, el motivo):

- Criterio 1 y 2: el 10c reescrito (ninguna revisora copia titulo ni campos de cabecera; todas remiten a «El informe» de revision.md y nombran su skill en `- Revisor:`) y una asercion en `fuente-unica.test.ts` (nadie pide «Contexto adicional»). Sin pesados.

## Lo que necesita decision de una persona

Nada abierto.
