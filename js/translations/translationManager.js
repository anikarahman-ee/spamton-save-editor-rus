/**
 * Translation Manager
 * Spamton Save Editor — система переводов
 *
 * Переводчики: DumpyCats | LazyDesman
 *
 * Использование:
 *   TranslationManager.init(chapter);  // 'ch1' | 'ch2' | 'ch3' | 'ch4'
 *   TranslationManager.apply('DumpyCats', chapter);  // применить вручную
 */

var TranslationManager = (function () {

    var currentTranslator = null;
    var originalData = {};

    // Все глобальные массивы, которые могут быть переведены
    var DATA_ARRAYS = [
        'rooms', 'roomsCh1', 'rooms_all',
        'weapons', 'weaponsCh1',
        'armor', 'armorCh1',
        'items', 'itemsCh1',
        'key_items', 'key_itemsCh1',
        'spells', 'spellsCh1',
        'lightworld_items', 'lightworld_itemsCh1',
        'lightworld_armor', 'lightworld_armorCh1',
        'lightworld_weapons', 'lightworld_weaponsCh1',
        'party_members', 'recruits',
        'thrasher_head_parts', 'thrasher_body_parts', 'thrasher_feet_parts',
        'goner_food', 'goner_blood', 'goner_color', 'goner_feel', 'goner_gift',
        'phone_numbers'
    ];

    var TRANSLATORS = ['DumpyCats', 'LazyDesman'];

    // Сохраняем оригинальные данные один раз при загрузке
    function backupOriginals() {
        DATA_ARRAYS.forEach(function (name) {
            if (window[name] && Array.isArray(window[name])) {
                originalData[name] = window[name].map(function (item) {
                    return { value: item.value, text: item.text };
                });
            }
        });
    }

    // Восстанавливаем оригинальные (английские) значения
    function restoreOriginals() {
        DATA_ARRAYS.forEach(function (name) {
            if (originalData[name] && window[name]) {
                for (var i = 0; i < window[name].length; i++) {
                    if (originalData[name][i] !== undefined) {
                        window[name][i].text = originalData[name][i].text;
                    }
                }
            }
        });
    }

    /**
     * Применить перевод: заменяет тексты в глобальных массивах.
    * @param {string|null} translatorName  'DumpyCats' | 'LazyDesman' | null (оригинал)
     * @param {string} chapter  'ch1' | 'ch2' | 'ch3' | 'ch4'
     */
    function applyTranslation(translatorName, chapter) {
        restoreOriginals();
        currentTranslator = translatorName;

        if (!translatorName) return;

        var pack = window.Translations &&
                   window.Translations[translatorName] &&
                   window.Translations[translatorName][chapter];

        if (!pack) {
            console.warn('[TranslationManager] Перевод не найден:', translatorName, chapter);
            return;
        }

        DATA_ARRAYS.forEach(function (arrayName) {
            if (!window[arrayName] || !pack[arrayName]) return;
            var patch = pack[arrayName];
            window[arrayName].forEach(function (item) {
                if (Object.prototype.hasOwnProperty.call(patch, item.value)) {
                    item.text = patch[item.value];
                }
            });
        });
    }

    /**
     * Создаёт и вставляет UI-панель выбора перевода перед #uploadView.
     * @param {string} chapter  'ch1' | 'ch2' | 'ch3' | 'ch4'
     */
    function createUI(chapter) {
        var wrap = document.createElement('div');
        wrap.id = 'translationPanel';
        wrap.style.cssText =
            'width:90%; margin:1em auto; padding:0.6em 0.8em;' +
            'border:1px solid #555; display:flex; flex-wrap:wrap;' +
            'align-items:center; gap:0.5em;';

        var label = document.createElement('span');
        label.textContent = 'Перевод:';
        label.style.marginRight = '0.4em';
        wrap.appendChild(label);

        // Кнопка «Оригинал»
        var btnsList = [{ key: '', label: 'Оригинал (EN)' }];
        TRANSLATORS.forEach(function (t) {
            btnsList.push({ key: t, label: t });
        });

        btnsList.forEach(function (btn) {
            var el = document.createElement('span');
            el.className = 'submitButton translatorBtn';
            el.setAttribute('data-translator', btn.key);
            el.textContent = btn.label;
            el.style.cssText =
                'padding:.25em .75em; margin-top:0; font-size:.82em; cursor:pointer;';

            if (btn.key === '' && !currentTranslator) {
                el.style.background = '#fff';
                el.style.color = '#000';
            }

            el.addEventListener('click', function () {
                applyTranslation(btn.key || null, chapter);

                document.querySelectorAll('.translatorBtn').forEach(function (b) {
                    b.style.background = '';
                    b.style.color = '';
                });
                el.style.background = '#fff';
                el.style.color = '#000';

                // Refresh editor form if already open
                var editorView = document.getElementById('editorView');
                if (editorView && editorView.style.display !== 'none') {
                    if (typeof EditorCore !== 'undefined' && EditorCore.refreshEditor) {
                        EditorCore.refreshEditor();
                    }
                }
            });

            wrap.appendChild(el);
        });

        var uploadView = document.getElementById('uploadView');
        if (uploadView && uploadView.parentNode) {
            uploadView.parentNode.insertBefore(wrap, uploadView);
        } else {
            document.body.insertAdjacentElement('afterbegin', wrap);
        }
    }

    /**
     * Инициализация: создаёт бэкап данных и рисует панель перевода.
     * Вызывать после загрузки страницы, до EditorCore.init().
     * @param {string} chapter  'ch1' | 'ch2' | 'ch3' | 'ch4'
     */
    function init(chapter) {
        backupOriginals();
        createUI(chapter);
    }

    return {
        init: init,
        apply: applyTranslation,
        translators: TRANSLATORS,
        backup: backupOriginals,
        restore: restoreOriginals,
        getCurrentTranslator: function() { return currentTranslator; }
    };

})();
