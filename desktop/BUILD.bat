@echo off
chcp 65001 >nul
echo.
echo ========================================
echo  Deltarune Save Editor - Desktop
echo  Сборка приложения
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] Проверка Node.js...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Node.js не найден!
    echo Установите с https://nodejs.org/
    pause
    exit /b 1
)
echo ✓ Node.js найден

echo.
echo [2/4] Установка зависимостей...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Ошибка установки
    pause
    exit /b 1
)
echo ✓ Зависимости установлены

echo.
echo [3/4] Сборка приложения...
echo Это может занять несколько минут...
echo.
call npm run build-win
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Ошибка сборки
    pause
    exit /b 1
)

echo.
echo [4/4] Готово!
echo.
echo ========================================
echo  ✓ Сборка завершена успешно!
echo ========================================
echo.
echo Файлы находятся в папке: build\
echo.
echo Доступные файлы:
echo - Установщик: Deltarune Save Editor Setup.exe
echo - Портативная версия: папка win-unpacked\
echo.

explorer build

pause
