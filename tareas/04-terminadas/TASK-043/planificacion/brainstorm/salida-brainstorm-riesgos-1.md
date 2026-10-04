# Brainstorm — TASK-043, rol riesgos (ronda 1)

- Rol: `brainstorm-riesgos`

## Riesgos, de mayor a menor dano
1. **La regla «cada criterio cita algo» rechaza la mitad del historial**:
   medido sobre las 27 tareas de `04-terminadas`, con anclas = comillas
   invertidas, digito, ruta o test, caen >= 21 de ~180 criterios en 13 de 27
   tareas (017, 018, 020, 022, 025, 027, 028, 029, 030, 033, 035, 040, 041). No
   son vagos: son de comportamiento («Sin nada que commitear no se crea commit
   vacio») o de proceso («Revision por pares independiente»). Mitigacion:
   bloquear solo criterios vacios o con palabra vaga SIN ancla; los que no
   tienen ancla, aviso con la lista.
2. **La lista de palabras vagas no tiene ni un caso real**: `mejorar`,
   `robusto`, `correctamente` no aparecen en ningun criterio real. Calibrar
   con casos construidos y declararlos como tales.
3. **El ancla «un numero» se cuela con todo**: «AC1», «item C6», «TASK-018»,
   «§8.3». No contar como ancla los digitos de IDs, siglas o secciones.
4. **El tope de 8 tumba 6 de 27** (026: 10, 027: 9, 028: 10, 029: 17, 030: 18,
   032: 13); las tres caras son 029, 030 y 032. Bloquear por encima de 12 y
   avisar entre 9 y 12 (coherente con TASK-044, que tambien usa 12).
5. **El aborto no deja el workspace como estaba**: `ensureBaseBranchReady`
   puede cambiar de rama antes de la puerta; el error debe decir en que rama
   editar y que hay que commitear.
6. **`approve` puede rechazar planes validos o aceptar el esqueleto**
   (`planTemplate` tiene tres variantes y un parrafo «(Lo consolida...)»).
   Rechazar solo si, quitando cabeceras y el parrafo de origen, no queda nada.
7. **`finish` solo avisa**, y si el aviso sale despues del merge ya no sirve:
   que salga antes de invocar el script.

## Puntos sin retorno
Ninguno: son puertas de lectura.

## Desacuerdos previstos
- Tope: 12 bloquea, 8 avisa (no «mas de 8» del criterio).
- Calibrar sobre las 27 cerradas, no 17.
- Con arquitectura: validar tambien la lectura preliminar para rechazar sin
  cambiar de rama, sin quitar la de la lectura fresca.

## Suposiciones no verificadas
`tarea-body.ts` cambia con TASK-046 (calibrar despues); continuaciones
sangradas de 027/028/031/032; reutilizacion de brainstorm al re-planificar;
puerta incondicional del objetivo con 0 roles.
