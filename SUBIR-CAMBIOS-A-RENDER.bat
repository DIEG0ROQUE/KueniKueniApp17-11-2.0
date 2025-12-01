@echo off
echo ====================================
echo SUBIENDO CAMBIOS A GITHUB Y RENDER
echo ====================================
echo.

cd C:\Users\diego\Downloads\KueniKueniApp17-11-2.0-1

echo [1/3] Agregando archivos...
git add .

echo [2/3] Haciendo commit...
git commit -m "Fix: Cambiar a puerto 465 de Gmail para Render"

echo [3/3] Subiendo a GitHub...
git push origin main

echo.
echo ====================================
echo LISTO! Cambios subidos a GitHub
echo ====================================
echo.
echo Render detectara los cambios automaticamente y redesplegar en 2-3 minutos.
echo.
echo Ve a tu dashboard de Render para ver el progreso:
echo https://dashboard.render.com
echo.
pause
