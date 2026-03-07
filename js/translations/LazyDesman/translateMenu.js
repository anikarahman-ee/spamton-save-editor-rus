/**
 * UI Translation Menu for Russian translations
 * Переводы интерфейса, этикеток полей и других элементов UI
 * Общий для русских переводчиков: LazyDesman, DumpyCats
 */

window.UITranslations = window.UITranslations || {};

// Общие переводы для LazyDesman
window.UITranslations['LazyDesman'] = {
    // Общие элементы интерфейса
    'ui_strings': {
        'Filename': 'Имя файла',
        'Room ID': 'ID комнаты',
        'Story Flag': 'Флаг истории',
        'D$': 'D$',
        '$': 'Д$',
        'HP': 'ХП',
        'LV': 'УР',
        'EXP': 'ОПЫ',
        'AT': 'АТК',
        'DF': 'ОСл',
        'WEAPON': 'ОРУЖИЕ',
        'ARMOR': 'БРОНЯ',
        'Spells': 'Заклинания',
        'Spell': 'Заклинание',
        'Member': 'Персонаж',
        'Show all rooms': 'Показать все комнаты',
        'Allow broken party': 'Разрешить неверную команду'
    },
    
    // Ярлыки для вкладок
    'tab_labels': {
        'main': 'Основное',
        'party': 'Команда',
        'items': 'Предметы',
        'creations': 'Творения',
        'hometown': 'Город',
        'other': 'Прочее',
        'recruits': 'Жители королевства',
        'chapter1': 'Глава 1',
        'chapter2': 'Глава 2',
        'chapter3': 'Глава 3',
        'all': 'Всё'
    },
    
    // Сообщения и диалоги
    'messages': {
        'Please select a save file first': 'Пожалуйста, сначала выберите файл сохранения.',
        'Invalid save file': 'Неверное сохранение',
        'Expected': 'ожидалось',
        'lines received': 'строк, получено',
        'Drag to upload': 'Перетащите для загрузки',
        'Click or drag save file here': 'Нажмите или перетащите сюда файл сохранения'
    },
    
    // Русификация полей для каждой главы
    'ch1': {
        'lightworld': 'Светлый мир "Крис"'
    },
    
    'ch2': {
        'lightworld': 'Светлый мир "Крис"'
    },
    
    'ch3': {
        'rank': 'Ранг'
    },
    
    'ch4': {
        'rank': 'Ранг',
        'round1_rank': 'Раунд 1 Ранг',
        'round2_rank': 'Раунд 2 Ранг'
    }
};

/**
 * Функция для получения переводов UI
 * @param {string} category - категория переводов (ui_strings, tab_labels, messages и т.д.)
 * @param {string} key - ключ для перевода
 * @param {string} fallback - значение по умолчанию, если перевод не найден
 * @returns {string} переведённый текст или исходный текст
 */
window.getUITranslation = function(category, key, fallback) {
    // Попытаемся получить текущего переводчика из TranslationManager
    var translator = 'LazyDesman';
    
    if (window.TranslationManager && window.TranslationManager.getCurrentTranslator) {
        var current = window.TranslationManager.getCurrentTranslator();
        if (current) {
            translator = current;
        }
    }
    
    if (window.UITranslations && 
        window.UITranslations[translator] && 
        window.UITranslations[translator][category] && 
        window.UITranslations[translator][category][key]) {
        return window.UITranslations[translator][category][key];
    }
    
    return fallback || key;
};

// Копируем полный UI перевод для DumpyCats
window.UITranslations['DumpyCats'] = window.UITranslations['LazyDesman'];
