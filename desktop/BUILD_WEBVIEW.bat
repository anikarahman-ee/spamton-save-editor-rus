@echo off
chcp 65001 >nul
echo.
echo ========================================
echo  Deltarune Save Editor — Desktop (Web)
echo  Сборка .exe через PyInstaller
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Проверка зависимостей...
python -c "import webview; print('pywebview:', webview.__version__)" 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo pywebview не найден, устанавливаю...
    pip install pywebview
)
python -c "import PyInstaller; print('PyInstaller:', PyInstaller.__version__)" 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo PyInstaller не найден, устанавливаю...
    pip install pyinstaller
)
echo ✓ Зависимости готовы
echo.

echo [2/3] Сборка .exe ...
echo Это может занять несколько минут...
echo.

pyinstaller --clean --noconfirm AppWebView.spec

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Ошибка сборки!
    echo Проверьте вывод выше.
    pause
    exit /b 1
)

echo.
echo [3/3] Готово!
echo.
echo ========================================
echo  ✓ Сборка завершена!
echo  Файл: dist\DeltaruneSaveEditor.exe
echo ========================================
echo.

explorer dist

pause
