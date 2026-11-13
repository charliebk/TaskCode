# Plan — TASK-132: Ayudante caso() de los tests fusionados en un unico helper compartido

(Modo rapido: el plan lo redacta el coordinador, sin roles.)

## Enfoque propuesto

Duracion estimada: 20 min (de la rama abierta al cierre con merge; senales: 0 ficheros de codigo, 11 de tests, 2 criterios)

1. `test/helpers/caso.ts`: la funcion `caso(nombre, fn)` tal como esta en los
   diez ficheros, con el tipo mas amplio de los dos que hay (`fn: () => unknown`,
   que incluye `() => Promise<void>`): ejecuta `fn`, y si lanza un Error le
   antepone `[nombre]` al mensaje y lo relanza.
2. Los diez ficheros que la definen la importan de ahi y borran su copia. Ninguna
   asercion ni ningun caso cambian.

## Riesgos aceptados y que los contiene

- Ninguno de comportamiento: la funcion es identica; solo cambia donde vive.

## Plan de pruebas

Tests nuevos por criterio (presupuesto de 1 a 3 por criterio; si se pasa, el motivo):
- Criterio 1: 0 (grep: una sola definicion).
- Criterio 2: 0 (los diez ficheros en verde).

## Lo que necesita decision de una persona

Nada.
