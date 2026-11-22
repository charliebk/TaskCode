# Disfraz en tests: los patrones tipicos

Un test disfrazado sigue en verde con el codigo roto: aparenta proteger algo
y no lo protege. Es la D de disfraz de la Regla 4D (`revision.md`) y cuenta
como IMPORTANTE. Repasa cada test nuevo con esta lista antes de pedir
revision, y el revisor con ella al mutar.

- **El nombre promete y nada lo comprueba.** «Sin efectos secundarios»,
  «deja el workspace limpio», «antes de tocar el disco», «error claro»: si
  el cuerpo solo mira la clase del error, falta la asercion sobre el estado
  (`git status`, el fichero que no debe existir, el texto del mensaje).
- **Datos que no distinguen el comportamiento.** Ordenar por numero con
  `001, 002, 010` (sale igual en orden alfabetico), un solo elemento donde
  importa cual se elige, nombres que no comparten prefijo, rondas por debajo
  de 10, un fichero que ya esta ignorado. Elige datos con los que la
  implementacion equivocada daria otro resultado.
- **`rejects`/`throws` sin matcher.** Cualquier error lo pone en verde,
  tambien uno que no es el que se probaba. Exige la clase Y el mensaje.
- **Un `skip` que esconde el fallo.** Saltar cuando tarda demasiado o en un
  sistema concreto convierte el fallo en un aviso: si el CI corre en ese
  sistema, el test no lo protege nunca. Separa «no aplica» de «fallo».
- **La asercion mira lo que se escribe, no lo que se lee.** Comprobar que el
  programa imprime algo no prueba que use el valor; un `echo` de los
  argumentos une los que llegaban separados.
- **Bucles que no cubren el caso nuevo.** «Cualquier comando» que recorre
  una lista escrita a mano se queda corto cuando se anade uno: deriva la
  lista de la fuente (o compara las dos).

La prueba es la mutacion: rompe a proposito la linea que el test dice
proteger, ejecuta solo ese test y mira que se pone rojo. Anota en
`## Autorrevision` cuantos tests mutaste.
