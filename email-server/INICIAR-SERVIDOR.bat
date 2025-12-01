@echo off
echo.
echo ╔═══════════════════════════════════════╗
echo ║  🚀 INICIANDO SERVIDOR DE CORREOS    ║
echo ║     Kueni Kueni Email Service        ║
echo ╚═══════════════════════════════════════╝
echo.

REM Verificar si existe node_modules
if not exist "node_modules\" (
    echo ⚠️  No se encontró node_modules
    echo 📦 Instalando dependencias...
    echo.
    call npm install
    echo.
    echo ✅ Dependencias instaladas
    echo.
)

REM Verificar si existe .env
if not exist ".env" (
    echo.
    echo ❌ ERROR: No se encontró el archivo .env
    echo.
    echo Por favor:
    echo 1. Renombra .env.example a .env
    echo 2. Edita .env con tus credenciales de Gmail
    echo 3. Vuelve a ejecutar este archivo
    echo.
    pause
    exit
)

echo ✅ Archivo .env encontrado
echo.
echo 🚀 Iniciando servidor...
echo.
echo ⚠️  IMPORTANTE: No cierres esta ventana
echo    El servidor debe estar corriendo para enviar correos
echo.
echo 🌐 Accede a: http://localhost:3000
echo.

REM Iniciar el servidor
npm start

pause
