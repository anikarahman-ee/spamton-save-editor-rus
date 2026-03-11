// Автоматическое добавление интеграции десктопного режима
// Запуск: node add-integration.js

const fs = require('fs');
const path = require('path');

const files = [
    'deltarune1.html',
    'deltarune2.html', 
    'deltarune3.html',
    'deltarune4.html',
    'deltarune1Demo.html',
    'deltarune2Demo.html'
];

const scriptTag = '    <script src="desktop/desktop-integration.js"></script>\n';

console.log('========================================');
console.log('  Добавление десктопной интеграции');
console.log('========================================\n');

let modified = 0;
let skipped = 0;
let errors = 0;

files.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    
    try {
        // Проверяем существование файла
        if (!fs.existsSync(filePath)) {
            console.log(`⚠ ${file} - файл не найден, пропущен`);
            skipped++;
            return;
        }
        
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Проверяем, не добавлен ли уже
        if (content.includes('desktop-integration.js')) {
            console.log(`✓ ${file} - уже содержит интеграцию`);
            skipped++;
            return;
        }
        
        // Добавляем после открывающего тега <head>
        if (content.includes('<head>')) {
            content = content.replace(/<head>/i, '<head>\n' + scriptTag);
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✓ ${file} - интеграция добавлена`);
            modified++;
        } else {
            console.log(`✗ ${file} - тег <head> не найден`);
            errors++;
        }
        
    } catch (err) {
        console.log(`✗ ${file} - ошибка: ${err.message}`);
        errors++;
    }
});

console.log('\n========================================');
console.log(`  Готово!`);
console.log(`  Изменено: ${modified}`);
console.log(`  Пропущено: ${skipped}`);
console.log(`  Ошибок: ${errors}`);
console.log('========================================\n');

if (modified > 0) {
    console.log('✓ Десктопная интеграция успешно добавлена!');
    console.log('  Теперь можно запускать приложение через START.bat\n');
}
