@echo off
REM Script para manejar Docker Compose en Windows

if "%1"=="build" (
    echo [*] Construyendo imagen Docker...
    docker-compose build
    echo [✓] Imagen construida exitosamente
    goto :EOF
)

if "%1"=="up" (
    echo [*] Levantando contenedor...
    docker-compose up -d
    echo [✓] Contenedor en ejecución
    echo.
    echo Dashboard disponible en: http://localhost:2080
    echo.
    goto :EOF
)

if "%1"=="down" (
    echo [*] Deteniendo contenedor...
    docker-compose down
    echo [✓] Contenedor detenido
    goto :EOF
)

if "%1"=="logs" (
    docker-compose logs -f frontend
    goto :EOF
)

if "%1"=="rebuild" (
    echo [*] Reconstruyendo...
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    echo [✓] Reconstruido y levantado
    echo Dashboard disponible en: http://localhost:2080
    goto :EOF
)

if "%1"=="clean" (
    echo [*] Limpiando...
    docker-compose down
    docker image rm aygo-reporter-frontend
    echo [✓] Limpiado
    goto :EOF
)

echo.
echo Uso: docker-run.bat [comando]
echo.
echo Comandos disponibles:
echo   build     - Construir imagen Docker
echo   up        - Iniciar contenedor
echo   down      - Detener contenedor
echo   logs      - Ver logs en tiempo real
echo   rebuild   - Reconstruir todo desde cero
echo   clean     - Limpiar todo (images, containers)
echo.
echo Ejemplo:
echo   docker-run.bat build
echo   docker-run.bat up
echo.
