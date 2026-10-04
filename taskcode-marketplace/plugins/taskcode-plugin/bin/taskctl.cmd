@echo off
rem Lanzador para cmd y PowerShell en Windows: ejecuta el CLI de esta
rem misma carpeta con node y devuelve su codigo de salida.
node "%~dp0taskctl" %*
exit /b %ERRORLEVEL%
