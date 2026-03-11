// Десктопное приложение - главный скрипт интерфейса
(function() {
    let currentSaves = [];
    let selectedSave = null;
    let selectedChapter = null;
    let editorWindow = null;

    // Инициализация
    function init() {
        setupButtons();
        setupChapterSelector();
        autoRefreshSaves();
    }

    function setupButtons() {
        document.getElementById('btnRefreshSaves').addEventListener('click', refreshSaves);
        document.getElementById('btnOpenFolder').addEventListener('click', openSavesFolder);
        document.getElementById('btnSelectFile').addEventListener('click', selectFileManually);
    }

    function setupChapterSelector() {
        const chapterBtns = document.querySelectorAll('.chapter-btn');
        chapterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const chapter = btn.dataset.chapter;
                selectChapter(chapter);
            });
        });
    }

    // Автоматическое обновление при запуске
    function autoRefreshSaves() {
        setStatus('Поиск сохранений...');
        refreshSaves();
    }

    // Обновить список сейвов
    async function refreshSaves() {
        setStatus('Поиск сохранений Deltarune...');
        
        try {
            const saves = await window.electronAPI.findSaves();
            currentSaves = saves;
            
            displaySaves(saves);
            
            if (saves.length > 0) {
                setStatus(`Найдено сохранений: ${saves.length}`);
            } else {
                setStatus('Сохранения не найдены. Убедитесь что Deltarune установлена.');
            }
        } catch (err) {
            setStatus('Ошибка при поиске сохранений: ' + err.message);
            console.error(err);
        }
    }

    // Отобразить список сейвов
    function displaySaves(saves) {
        const saveList = document.getElementById('saveList');
        saveList.innerHTML = '';

        if (saves.length === 0) {
            saveList.innerHTML = '<li class="no-saves-message">Сохранения не найдены</li>';
            return;
        }

        saves.forEach(save => {
            const li = document.createElement('li');
            li.className = 'save-item';
            li.innerHTML = `
                <div class="save-name">${save.name}</div>
                <div class="save-info">
                    ${(save.size / 1024).toFixed(1)} KB • ${save.modified}
                </div>
            `;
            
            li.addEventListener('click', () => {
                selectSave(save, li);
            });
            
            saveList.appendChild(li);
        });
    }

    // Выбрать сейв
    function selectSave(save, element) {
        // Убрать активный класс со всех
        document.querySelectorAll('.save-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Добавить активный класс
        if (element) {
            element.classList.add('active');
        }
        
        selectedSave = save;
        updateStatusPath(save.path);
        
        // Если глава уже выбрана, загрузить сейв
        if (selectedChapter) {
            loadSaveInEditor();
        } else {
            setStatus('Выберите главу для редактирования');
        }
    }

    // Выбрать главу
    function selectChapter(chapter) {
        // Убрать активный класс со всех глав
        document.querySelectorAll('.chapter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Добавить активный класс
        event.target.closest('.chapter-btn').classList.add('active');
        
        selectedChapter = chapter;
        
        // Если сейв уже выбран, загрузить его
        if (selectedSave) {
            loadSaveInEditor();
        } else {
            setStatus('Выберите сохранение для редактирования');
        }
    }

    // Загрузить сейв в редактор
    async function loadSaveInEditor() {
        if (!selectedSave || !selectedChapter) return;
        
        setStatus('Загрузка сохранения...');
        
        try {
            const result = await window.electronAPI.readSave(selectedSave.path);
            
            if (!result.success) {
                throw new Error(result.error);
            }
            
            // Определить HTML файл главы
            const chapterFile = `deltarune${selectedChapter}.html`;
            
            // Скрыть приветственное сообщение
            document.getElementById('welcomeMessage').style.display = 'none';
            
            // Показать фрейм редактора
            const frame = document.getElementById('editorFrame');
            frame.style.display = 'block';
            
            // Загрузить страницу редактора
            frame.src = chapterFile;
            
            // Дождаться загрузки и передать данные
            frame.onload = function() {
                try {
                    // Передать данные сейва в iframe
                    frame.contentWindow.postMessage({
                        type: 'LOAD_SAVE_DATA',
                        data: result.data,
                        fileName: result.name,
                        filePath: selectedSave.path
                    }, '*');
                    
                    setStatus(`Редактирование: ${selectedSave.name} (Глава ${selectedChapter})`);
                } catch (err) {
                    console.error('Ошибка передачи данных в iframe:', err);
                    setStatus('Ошибка загрузки редактора');
                }
            };
            
        } catch (err) {
            setStatus('Ошибка загрузки: ' + err.message);
            console.error(err);
        }
    }

    // Открыть папку с сейвами
    async function openSavesFolder() {
        try {
            await window.electronAPI.openSavesFolder();
            setStatus('Открыта папка с сохранениями');
        } catch (err) {
            setStatus('Ошибка: ' + err.message);
        }
    }

    // Выбрать файл вручную
    async function selectFileManually() {
        try {
            const result = await window.electronAPI.selectFile();
            
            if (result.success) {
                const fileName = result.path.split('\\').pop();
                const stats = await getFileStats(result.path);
                
                const manualSave = {
                    name: fileName,
                    path: result.path,
                    size: stats.size || 0,
                    modified: stats.modified || 'Неизвестно'
                };
                
                selectSave(manualSave, null);
                setStatus('Выбран файл: ' + fileName);
            }
        } catch (err) {
            setStatus('Ошибка: ' + err.message);
        }
    }

    async function getFileStats(filePath) {
        // В реальности это должно быть через API
        return { size: 0, modified: new Date().toLocaleString('ru-RU') };
    }

    // Сохранить изменения (вызывается из iframe)
    window.saveSaveFile = async function(data) {
        if (!selectedSave) {
            alert('Не выбран файл для сохранения');
            return;
        }
        
        setStatus('Сохранение изменений...');
        
        try {
            // Создать бэкап
            const backupResult = await window.electronAPI.backupSave(selectedSave.path);
            
            if (backupResult.success) {
                console.log('Создана резервная копия:', backupResult.path);
            }
            
            // Сохранить файл
            const result = await window.electronAPI.writeSave(selectedSave.path, data);
            
            if (result.success) {
                setStatus('✓ Сохранено успешно!');
                setTimeout(() => {
                    setStatus(`Редактирование: ${selectedSave.name}`);
                }, 2000);
            } else {
                throw new Error(result.error);
            }
        } catch (err) {
            setStatus('Ошибка сохранения: ' + err.message);
            alert('Ошибка при сохранении файла:\n' + err.message);
        }
    };

    // Экспорт сейва (вызывается из iframe)
    window.exportSaveFile = async function(data, defaultName) {
        try {
            const result = await window.electronAPI.saveFileDialog(defaultName);
            
            if (result.success) {
                const writeResult = await window.electronAPI.writeSave(result.path, data);
                
                if (writeResult.success) {
                    setStatus('✓ Файл экспортирован: ' + result.path);
                } else {
                    throw new Error(writeResult.error);
                }
            }
        } catch (err) {
            alert('Ошибка экспорта: ' + err.message);
        }
    };

    // Установить текст статуса
    function setStatus(text) {
        document.getElementById('statusText').textContent = text;
    }

    // Обновить путь к файлу
    function updateStatusPath(path) {
        document.getElementById('currentSavePath').textContent = path || '';
    }

    // Слушать сообщения от iframe
    window.addEventListener('message', function(event) {
        if (event.data.type === 'SAVE_FILE') {
            window.saveSaveFile(event.data.data);
        } else if (event.data.type === 'EXPORT_FILE') {
            window.exportSaveFile(event.data.data, event.data.fileName);
        }
    });

    // Запуск при загрузке
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
