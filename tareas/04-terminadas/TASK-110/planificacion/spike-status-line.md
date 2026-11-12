# Paso S de TASK-110: la status line se ve en la app de escritorio y por Remote Control

- Fecha: 2026-11-12.
- Prueba: clave `statusLine` en el `settings.json` de usuario con
  `{"type": "command", "command": "echo TASK-110 · prueba de status line"}`.
- Resultado (comprobado por Carlos): el texto se ve en la app de escritorio de
  Claude (pestaña Code) y por Remote Control.
- Consecuencia: el diseño sigue adelante sin reabrirse. La status line de
  prueba se queda en el `settings.json` de usuario hasta que el paso D
  instale la definitiva con `taskctl doctor`.
