@echo off
chcp 65001 >nul
echo.
echo ========================================
echo  Deltarune Save Editor - Desktop
echo  Быстрый запуск
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Проверка Node.js...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Node.js не найден!
    echo.
    echo Пожалуйста, установите Node.js:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo ✓ Node.js установлен

echo.
echo [2/3] Проверка зависимостей...
if not exist "node_modules" (
    echo Установка зависимостей...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo ❌ Ошибка установки зависимостей
        pause
        exit /b 1
    )
) else (
    echo ✓ Зависимости установлены
)

echo.
echo [3/3] Запуск приложения...
echo.
echo ========================================
echo  Приложение запускается...
echo  Закройте это окно для остановки
echo ========================================
echo.

call npm start

pause
