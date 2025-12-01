@echo off
echo ================================================
echo SUBIR CAMBIOS FINALES AL REPOSITORIO
echo ================================================
echo.
echo Este script subira:
echo - Servidor de correos actualizado
echo - README con documentacion completa
echo - Instrucciones para el equipo
echo.
echo IMPORTANTE: El archivo .env NO se subira (contiene credenciales)
echo.
pause
echo.

cd C:\Users\diego\Downloads\KueniKueniApp17-11-2.0-1

echo [1/4] Verificando estado...
git status
echo.

echo [2/4] Agregando archivos...
git add email-server/README.md
git add LEEME-EQUIPO.md
git add email-server/email-server.js
git add javaScript/registro.js
git add javaScript/login.js
git add javaScript/socio-donar.js
echo.

echo [3/4] Creando commit...
git commit -m "✅ Sistema de correos funcionando - Documentacion completa para el equipo"
echo.

echo [4/4] Subiendo a GitHub...
git push origin main
echo.

echo ================================================
echo LISTO! Cambios subidos exitosamente
echo ================================================
echo.
echo Tus companeros ahora pueden:
echo 1. Hacer git pull para obtener los cambios
echo 2. Leer LEEME-EQUIPO.md para instrucciones
echo 3. Leer email-server/README.md para documentacion tecnica
echo.
echo RECUERDA: Las credenciales se comparten por otro canal (NO por GitHub)
echo.
pause
