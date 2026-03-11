const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 900,
        backgroundColor: '#0b0b12',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, 'icon.png')
    });

    // Загружаем главный HTML из папки desktop
    mainWindow.loadFile(path.join(__dirname, 'desktop-index.html'));
    
    // Открыть DevTools в режиме разработки
    // mainWindow.webContents.openDevTools();

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
    if (mainWindow === null) createWindow();
});

// IPC Handlers

// Автопоиск сейвов Deltarune
ipcMain.handle('find-saves', async () => {
    const saves = [];
    
    // Windows: %LOCALAPPDATA%\DELTARUNE
    const deltarunePath = path.join(process.env.LOCALAPPDATA || '', 'DELTARUNE');
    
    if (fs.existsSync(deltarunePath)) {
        try {
            const files = fs.readdirSync(deltarunePath);
            files.forEach(file => {
                if (file.startsWith('filech') || file.startsWith('mus_')) {
                    const fullPath = path.join(deltarunePath, file);
                    const stats = fs.statSync(fullPath);
                    
                    saves.push({
                        name: file,
                        path: fullPath,
                        size: stats.size,
                        modified: stats.mtime.toLocaleString('ru-RU')
                    });
                }
            });
        } catch (err) {
            console.error('Ошибка чтения директории:', err);
        }
    }
    
    return saves;
});

// Чтение файла сохранения
ipcMain.handle('read-save', async (event, filePath) => {
    try {
        const data = fs.readFileSync(filePath, 'utf-8');
        return {
            success: true,
            data: data,
            name: path.basename(filePath)
        };
    } catch (err) {
        return {
            success: false,
            error: err.message
        };
    }
});

// Запись файла сохранения
ipcMain.handle('write-save', async (event, filePath, data) => {
    try {
        // Создаем резервную копию
        const backupPath = filePath + '.backup';
        if (fs.existsSync(filePath)) {
            fs.copyFileSync(filePath, backupPath);
        }
        
        fs.writeFileSync(filePath, data, 'utf-8');
        
        return {
            success: true,
            message: 'Файл успешно сохранен!'
        };
    } catch (err) {
        return {
            success: false,
            error: err.message
        };
    }
});

// Создание резервной копии
ipcMain.handle('backup-save', async (event, filePath) => {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = filePath + `.backup_${timestamp}`;
        fs.copyFileSync(filePath, backupPath);
        
        return {
            success: true,
            path: backupPath
        };
    } catch (err) {
        return {
            success: false,
            error: err.message
        };
    }
});

// Открыть папку с сохранениями в проводнике
ipcMain.handle('open-saves-folder', async () => {
    const deltarunePath = path.join(process.env.LOCALAPPDATA || '', 'DELTARUNE');
    
    if (fs.existsSync(deltarunePath)) {
        const { shell } = require('electron');
        shell.openPath(deltarunePath);
        return { success: true };
    } else {
        return { 
            success: false, 
            error: 'Папка с сохранениями не найдена' 
        };
    }
});

// Диалог выбора файла
ipcMain.handle('select-file', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
            { name: 'Файлы сохранений', extensions: ['*'] },
            { name: 'Все файлы', extensions: ['*'] }
        ]
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
        return {
            success: true,
            path: result.filePaths[0]
        };
    }
    
    return { success: false };
});

// Диалог сохранения файла
ipcMain.handle('save-file-dialog', async (event, defaultName) => {
    const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: defaultName,
        filters: [
            { name: 'Файлы сохранений', extensions: ['*'] },
            { name: 'Все файлы', extensions: ['*'] }
        ]
    });
    
    if (!result.canceled && result.filePath) {
        return {
            success: true,
            path: result.filePath
        };
    }
    
    return { success: false };
});
