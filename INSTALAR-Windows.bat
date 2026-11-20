@echo off
chcp 65001 >NUL
title Instalar la oficina de video
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0pipeline\instalar_windows.ps1" %*
echo.
pause
