const { contextBridge, ipcRenderer } = require('electron');

// Безопасный API для рендерера
contextBridge.exposeInMainWorld('electronAPI', {
    // Поиск сохранений
    findSaves: () => ipcRenderer.invoke('find-saves'),
    
    // Чтение файла
    readSave: (filePath) => ipcRenderer.invoke('read-save', filePath),
    
    // Запись файла
    writeSave: (filePath, data) => ipcRenderer.invoke('write-save', filePath, data),
    
    // Создание бэкапа
    backupSave: (filePath) => ipcRenderer.invoke('backup-save', filePath),
    
    // Открыть папку с сохранениями
    openSavesFolder: () => ipcRenderer.invoke('open-saves-folder'),
    
    // Диалог выбора файла
    selectFile: () => ipcRenderer.invoke('select-file'),
    
    // Диалог сохранения файла
    saveFileDialog: (defaultName) => ipcRenderer.invoke('save-file-dialog', defaultName)
});
