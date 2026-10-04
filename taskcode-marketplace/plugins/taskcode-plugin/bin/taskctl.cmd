@echo off
rem Lanzador para cmd en Windows (argumentos entre comillas dobles). Desde
rem PowerShell no: le pasa sin comillas los argumentos sin espacios y cmd.exe
rem interpretaria & | < >; alli se usa la funcion de perfil del README.
rem node es la ultima orden, asi que su codigo de salida es el del .cmd.
node "%~dp0taskctl" %*
