@echo off
rem Lanzador para cmd y PowerShell en Windows: ejecuta con node el CLI de
rem esta misma carpeta. Es la ultima orden, asi que su codigo de salida es
rem el del .cmd.
node "%~dp0taskctl" %*
