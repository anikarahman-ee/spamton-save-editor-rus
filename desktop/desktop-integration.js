// Интеграция редактора с десктопным приложением
// Подключите этот скрипт к страницам редактора глав для работы в десктопном режиме

(function() {
    // Проверяем, запущены ли мы в iframe десктопного приложения
    const isDesktopMode = window.parent !== window && window.electronAPI !== undefined;
    
    if (!isDesktopMode) return;

    console.log('[Desktop Integration] Режим десктопного приложения активирован');

    let currentSaveData = null;
    let currentFilePath = null;
    let currentFileName = null;

    // Слушаем сообщения от родительского окна
    window.addEventListener('message', function(event) {
        if (event.data.type === 'LOAD_SAVE_DATA') {
            handleLoadSaveData(event.data);
        }
    });

    // Обработка загрузки данных сейва
    function handleLoadSaveData(data) {
        currentSaveData = data.data;
        currentFilePath = data.filePath;
        currentFileName = data.fileName;

        console.log('[Desktop Integration] Получены данные сейва:', currentFileName);

        // Автоматически загружаем сейв в редактор
        if (typeof EditorCore !== 'undefined') {
            try {
                // Эмулируем загрузку файла
                const lines = currentSaveData.split('\n');
                
                // Вызываем функцию загрузки редактора
                if (EditorCore.loadFromLines) {
                    EditorCore.loadFromLines(lines, currentFileName);
                } else {
                    // Альтернативный метод через File API
                    const blob = new Blob([currentSaveData], { type: 'text/plain' });
                    const file = new File([blob], currentFileName, { type: 'text/plain' });
                    
                    // Программно устанавливаем файл
                    const fileInput = document.getElementById('saveFile');
                    if (fileInput) {
                        const dataTransfer = new DataTransfer();
                        dataTransfer.items.add(file);
                        fileInput.files = dataTransfer.files;
                        
                        // Триггерим событие change
                        const event = new Event('change', { bubbles: true });
                        fileInput.dispatchEvent(event);
                        
                        // Автоматически переходим к редактору
                        setTimeout(() => {
                            const loadBtn = document.getElementById('toEditor');
                            if (loadBtn) {
                                loadBtn.click();
                            }
                        }, 100);
                    }
                }
                
                console.log('[Desktop Integration] Сейв загружен в редактор');
            } catch (err) {
                console.error('[Desktop Integration] Ошибка загрузки:', err);
            }
        }
    }

    // Перехватываем функцию сохранения
    const originalDownload = window.downloadSave;
    window.downloadSave = function(data, filename) {
        // В десктопном режиме сохраняем напрямую через Electron
        if (currentFilePath) {
            // Отправляем данные родительскому окну для сохранения
            window.parent.postMessage({
                type: 'SAVE_FILE',
                data: data,
                fileName: filename || currentFileName
            }, '*');
            
            console.log('[Desktop Integration] Отправлен запрос на сохранение');
        } else {
            // Если пути нет, используем стандартный способ
            if (originalDownload) {
                originalDownload(data, filename);
            }
        }
    };

    // Добавляем кнопку прямого сохранения
    function addDirectSaveButton() {
        const downloadBtn = document.querySelector('button[onclick*="downloadSave"]');
        if (!downloadBtn) return;

        const directSaveBtn = document.createElement('button');
        directSaveBtn.textContent = '💾 Сохранить изменения';
        directSaveBtn.className = downloadBtn.className;
        directSaveBtn.style.background = '#4CAF50';
        directSaveBtn.style.marginRight = '10px';
        
        directSaveBtn.onclick = function() {
            if (typeof EditorCore !== 'undefined' && EditorCore.exportSave) {
                const saveData = EditorCore.exportSave();
                window.parent.postMessage({
                    type: 'SAVE_FILE',
                    data: saveData,
                    fileName: currentFileName
                }, '*');
            }
        };

        downloadBtn.parentNode.insertBefore(directSaveBtn, downloadBtn);
    }

    // Скрываем элементы, не нужные в десктопном режиме
    function hideUnnecessaryElements() {
        // Скрываем облачные функции
        const cloudElements = document.querySelectorAll('[data-cloud], .auth-section, .library-section');
        cloudElements.forEach(el => {
            if (el) el.style.display = 'none';
        });

        // Скрываем навигацию
        const nav = document.querySelector('nav');
        if (nav) nav.style.display = 'none';

        // Скрываем footer
        const footer = document.querySelector('footer');
        if (footer) footer.style.display = 'none';
    }

    // Инициализация при загрузке страницы
    window.addEventListener('DOMContentLoaded', function() {
        setTimeout(() => {
            addDirectSaveButton();
            hideUnnecessaryElements();
        }, 500);
    });

    // Уведомляем родительское окно о готовности
    window.parent.postMessage({ type: 'EDITOR_READY' }, '*');
})();
