@echo off
chcp 65001 >NUL
title Oficina de video
cd /d "%~dp0"
where claude >NUL 2>&1 || (echo Falta Claude Code. Da doble clic a INSTALAR-Windows.bat primero. & pause & exit /b 1)
claude
