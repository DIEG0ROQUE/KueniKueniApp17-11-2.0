@echo off
echo ====================================
echo AGREGANDO EXCEPCION DE FIREWALL
echo ====================================
echo.

REM Agregar regla para puerto 587 (salida)
netsh advfirewall firewall add rule name="Node.js SMTP 587 OUT" dir=out action=allow protocol=TCP localport=587 program="C:\Program Files\nodejs\node.exe"

REM Agregar regla para puerto 465 (salida)
netsh advfirewall firewall add rule name="Node.js SMTP 465 OUT" dir=out action=allow protocol=TCP localport=465 program="C:\Program Files\nodejs\node.exe"

REM Agregar regla genérica para Node.js
netsh advfirewall firewall add rule name="Node.js SMTP" dir=out action=allow program="C:\Program Files\nodejs\node.exe" enable=yes

echo.
echo ====================================
echo REGLAS AGREGADAS EXITOSAMENTE
echo ====================================
echo.
echo Ahora ejecuta: npm start
echo.
pause
