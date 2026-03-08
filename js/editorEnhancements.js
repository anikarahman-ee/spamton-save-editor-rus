/**
 * editorEnhancements.js — Пакет улучшений редактора
 *
 * Вызывать EditorEnhance.init() ПОСЛЕ EditorCore.init()
 *
 * Список фич:
 * [F1]  Ctrl+S  → скачать сохранение
 * [F2]  Undo стек  (история изменений)
 * [F3]  Redo стек
 * [F4]  Ctrl+Z → undo последнего поля
 * [F5]  Ctrl+Y / Ctrl+Shift+Z → redo
 * [F6]  Автосохранение в localStorage каждые 30 сек
 * [F7]  Восстановление из localStorage при загрузке
 * [F8]  Баннер «восстановить автосохранение»
 * [F9]  Кнопка «Сбросить все изменения» (с подтверждением)
 * [F10] Кнопка сброса отдельного поля (× на изменённых)
 * [F11] Поиск/фильтр полей по тексту лейбла
 * [F12] Счётчик изменений на каждой вкладке (badge)
 * [F13] Счётчик изменённых полей в тулбаре
 * [F14] Прыжок к первому изменённому полю (Ctrl+G)
 * [F15] Модалка «Что изменилось» перед скачиванием
 * [F16] Экспорт в JSON
 * [F17] Импорт из JSON (с file picker)
 * [F18] Кнопка «Копировать значение поля»
 * [F19] Запоминание последней вкладки per-chapter
 * [F20] Восстановление вкладки при возврате
 * [F21] Stepper +/- кнопки рядом с number input
 * [F22] Clamp значений при вводе (min/max из data-атрибутов)
 * [F23] «Развернуть всё» (заклинания, etc.)
 * [F24] «Свернуть всё»
 * [F25] Заголовок страницы «● 5 изменений» при наличии diff
 * [F26] Предупреждение перед уходом со страницы (unsaved changes)
 * [F27] «Пометить как сохранено» после скачивания
 * [F28] Toolbar быстрых действий (экспорт, сброс, поиск)
 * [F29] Paste via textarea (Alt+V fallback)
 * [F30] Отображение размера файла и кол-ва строк
 * [F31] Collapse/expand блоков редактора по клику на заголовок
 * [F32] Compact mode переключатель в toolbar
 * [F33] Автоматический выбор текста числового поля при фокусе
 * [F34] «Сбросить изменения этой вкладки»
 * [F35] Клавиша F1 / ? → шорткаты overlay (см. siteEnhancements)
 * [F36] Визуальный прогресс при скачивании (кнопка)
 * [F37] Ripple на кнопках
 * [F38] Улучшенный drag-and-drop (highlight зоны загрузки)
 * [F39] Проверка файла перед открытием (магическое число / размер)
 * [F40] Compact-режим: сохранение в localStorage
 */

var EditorEnhance = (function () {

    /* ─── Состояние ───────────────────────────────────── */
    var _chapterKey = '';
    var _undoStack  = [];   // { name, oldValue, newValue, isCheckbox }
    var _redoStack  = [];
    var _autoSaveTimer = null;
    var _isDownloaded = false;
    var _originalTitle = document.title;
    var _changedCount = 0;
    var _trackUndo = true; // предотвращает двойное пушение при redo

    /* ─── Утилиты ─────────────────────────────────────── */
    function getSaveDiv() {
        return document.getElementById('saveData');
    }

    function showToast(msg, type, duration) {
        if (typeof SiteEnhance !== 'undefined' && SiteEnhance.toast) {
            SiteEnhance.toast(msg, type, duration);
        } else {
            // fallback: старый cloud-toast
            var t = document.querySelector('.cloud-toast');
            if (t) { t.textContent = msg; t.classList.add('show'); setTimeout(function () { t.classList.remove('show'); }, duration || 2500); }
        }
    }

    /* ─── [F37] Ripple ─────────────────────────────────── */
    function addRipple(el) {
        el.addEventListener('click', function (e) {
            var rect = el.getBoundingClientRect();
            var r = document.createElement('span');
            var d = Math.max(rect.width, rect.height);
            r.className = 'ripple';
            r.style.width = r.style.height = d + 'px';
            r.style.left  = (e.clientX - rect.left - d / 2) + 'px';
            r.style.top   = (e.clientY - rect.top  - d / 2) + 'px';
            el.appendChild(r);
            r.addEventListener('animationend', function () { r.remove(); });
        });
    }

    function initRipples() {
        var sel = '.submitButton, .auth-btn, .tab_click, .cloud-save-btn, .cloud-load-btn, .cloud-publish-btn, .editor-toolbar-btn';
        document.querySelectorAll(sel).forEach(addRipple);
    }

    /* ─── [F38] Drag-and-drop улучшение ────────────────── */
    function initDragAndDrop() {
        var label = document.getElementById('saveFileLabel');
        if (!label) return;
        label.addEventListener('dragover',  function () { label.classList.add('drag-active'); });
        label.addEventListener('dragleave', function () { label.classList.remove('drag-active'); });
        label.addEventListener('drop',      function () { label.classList.remove('drag-active'); });
    }

    /* ─── [F33] Auto-select на числах ─────────────────── */
    function initAutoSelectNumbers() {
        document.addEventListener('focusin', function (e) {
            if (e.target && e.target.type === 'number') {
                e.target.select();
            }
        });
    }

    /* ─── [F21] Number steppers ────────────────────────── */
    function initSteppers() {
        var div = getSaveDiv();
        if (!div) return;
        div.querySelectorAll('input[type=number]').forEach(function (inp) {
            if (inp.parentElement.classList.contains('number-stepper-wrap')) return;
            var wrap = document.createElement('span');
            wrap.className = 'number-stepper-wrap';
            inp.parentNode.insertBefore(wrap, inp);
            wrap.appendChild(inp);

            var minus = document.createElement('button');
            minus.type = 'button';
            minus.className = 'step-btn';
            minus.textContent = '−';
            minus.title = 'Уменьшить';

            var plus = document.createElement('button');
            plus.type  = 'button';
            plus.className = 'step-btn';
            plus.textContent = '+';
            plus.title = 'Увеличить';

            wrap.insertBefore(minus, inp);
            wrap.appendChild(plus);

            minus.addEventListener('click', function () { changeStep(inp, -1); });
            plus.addEventListener('click',  function () { changeStep(inp,  1); });

            addRipple(minus);
            addRipple(plus);
        });
    }

    function changeStep(inp, delta) {
        var val = parseFloat(inp.value) || 0;
        var step = parseFloat(inp.step) || 1;
        var min  = inp.min !== '' ? parseFloat(inp.min) : -Infinity;
        var max  = inp.max !== '' ? parseFloat(inp.max) : Infinity;
        var newVal = Math.min(max, Math.max(min, val + delta * step));
        inp.value = newVal;
        inp.dispatchEvent(new Event('input',  { bubbles: true }));
        inp.dispatchEvent(new Event('change', { bubbles: true }));
    }

    /* ─── [F22] Clamp на input ──────────────────────────── */
    function initClamp() {
        var div = getSaveDiv();
        if (!div) return;
        div.addEventListener('change', function (e) {
            var el = e.target;
            if (el.type !== 'number') return;
            var v = parseFloat(el.value);
            if (el.min !== '' && v < parseFloat(el.min)) el.value = el.min;
            if (el.max !== '' && v > parseFloat(el.max)) el.value = el.max;
        });
    }

    /* ─── [F2/F3/F4/F5] Undo/Redo ─────────────────────── */
    function initUndoRedo() {
        var div = getSaveDiv();
        if (!div) return;
        div.addEventListener('change', function (e) {
            var el = e.target;
            if (!el.name || !_trackUndo) return;
            var oldVal = el.getAttribute('data-original');
            var newVal = el.type === 'checkbox' ? String(el.checked) : el.value;
            if (oldVal === null || oldVal === undefined) return;
            _undoStack.push({ name: el.name, old: oldVal, new: newVal, isCheck: el.type === 'checkbox' });
            _redoStack = [];
            if (_undoStack.length > 80) _undoStack.shift();
        });
    }

    function doUndo() {
        if (!_undoStack.length) { showToast('Нечего отменять', 'info'); return; }
        var entry = _undoStack.pop();
        _redoStack.push(entry);
        applyHistoryEntry(entry, 'old');
        showToast('Отменено: ' + entry.name, 'info', 1500);
    }

    function doRedo() {
        if (!_redoStack.length) { showToast('Нечего повторять', 'info'); return; }
        var entry = _redoStack.pop();
        _undoStack.push(entry);
        applyHistoryEntry(entry, 'new');
        showToast('Повторено: ' + entry.name, 'info', 1500);
    }

    function applyHistoryEntry(entry, which) {
        var el = document.querySelector('[name="' + entry.name + '"]');
        if (!el) return;
        _trackUndo = false;
        if (entry.isCheck) {
            el.checked = (entry[which] === 'true');
        } else {
            el.value = entry[which];
        }
        el.dispatchEvent(new Event('input',  { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        _trackUndo = true;
    }

    /* ─── [F6] Автосохранение ──────────────────────────── */
    function autoSaveKey() {
        return 'autosave_' + _chapterKey;
    }

    function doAutoSave() {
        if (typeof EditorCore === 'undefined') return;
        var text = EditorCore.getCurrentSaveText();
        if (!text) return;
        try {
            localStorage.setItem(autoSaveKey(), JSON.stringify({
                text: text,
                time: Date.now()
            }));
        } catch(e) {}
    }

    /* ─── [F7/F8] Восстановление автосохранения ────────── */
    function checkAutoSave() {
        var key = autoSaveKey();
        var raw;
        try { raw = localStorage.getItem(key); } catch(e) { return; }
        if (!raw) return;
        var data;
        try { data = JSON.parse(raw); } catch(e) { return; }
        if (!data || !data.text) return;

        var ageMin = Math.round((Date.now() - (data.time || 0)) / 60000);
        var banner = document.getElementById('autosave-banner');
        if (!banner) return;
        var txt = banner.querySelector('.autosave-banner-text');
        if (txt) txt.textContent = '⏱ Найдено автосохранение (' + ageMin + ' мин назад). Восстановить?';
        banner.classList.remove('hidden');

        banner.querySelector('.autosave-restore-btn').addEventListener('click', function () {
            if (typeof EditorCore !== 'undefined') {
                EditorCore.loadFromText(data.text, 'autosave');
                afterEditorReady();
            }
            banner.classList.add('hidden');
            showToast('Автосохранение восстановлено', 'success');
        });

        banner.querySelector('.autosave-dismiss-btn').addEventListener('click', function () {
            banner.classList.add('hidden');
            try { localStorage.removeItem(key); } catch(e) {}
        });
    }

    /* ─── [F9] Сброс всех изменений ─────────────────────── */
    function resetAllChanges() {
        var div = getSaveDiv();
        if (!div) return;
        var changed = div.querySelectorAll('.val-changed');
        if (!changed.length) { showToast('Нет изменённых полей', 'info'); return; }
        if (!confirm('Сбросить все ' + changed.length + ' изменений?')) return;

        div.querySelectorAll('select, input').forEach(function (el) {
            var orig = el.getAttribute('data-original');
            if (orig === null) return;
            _trackUndo = false;
            if (el.type === 'checkbox') {
                el.checked = (orig === 'true');
            } else {
                el.value = orig;
            }
            el.dispatchEvent(new Event('input',  { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
            _trackUndo = true;
        });
        _undoStack = []; _redoStack = [];
        showToast('Все изменения сброшены', 'success');
    }

    /* ─── [F34] Сброс текущей вкладки ─────────────────── */
    function resetCurrentTab() {
        var active = document.querySelector('.tab_click.tab_selected');
        if (!active) return;
        var tabId = active.getAttribute('tab');
        var tabEl = document.getElementById(tabId);
        if (!tabEl) return;
        var fields = tabEl.querySelectorAll('.val-changed');
        if (!fields.length) { showToast('Изменений на вкладке нет', 'info'); return; }
        if (!confirm('Сбросить изменения текущей вкладки (' + fields.length + ' полей)?')) return;
        tabEl.querySelectorAll('select, input').forEach(function (el) {
            var orig = el.getAttribute('data-original');
            if (orig === null) return;
            _trackUndo = false;
            if (el.type === 'checkbox') { el.checked = (orig === 'true'); }
            else { el.value = orig; }
            el.dispatchEvent(new Event('input',  { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
            _trackUndo = true;
        });
        showToast('Вкладка сброшена', 'success');
    }

    /* ─── [F10] Reset одного поля ────────────────────────── */
    function addResetButtons() {
        var div = getSaveDiv();
        if (!div) return;
        div.querySelectorAll('select, input:not([type=checkbox])').forEach(function (el) {
            if (!el.getAttribute('data-original') || el.parentElement.querySelector('.field-reset-btn')) return;
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'field-copy-btn field-reset-btn';
            btn.title = 'Сбросить поле';
            btn.textContent = '↺';
            btn.style.display = 'none';
            el.parentNode.insertBefore(btn, el.nextSibling);

            btn.addEventListener('click', function () {
                var orig = el.getAttribute('data-original');
                if (orig === null) return;
                el.value = orig;
                el.dispatchEvent(new Event('input',  { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
                showToast('Поле сброшено', 'info', 1200);
            });
        });

        // Показывать кнопку только на изменённых полях
        div.addEventListener('input',  updateResetBtns);
        div.addEventListener('change', updateResetBtns);
    }

    function updateResetBtns() {
        var div = getSaveDiv();
        if (!div) return;
        div.querySelectorAll('.field-reset-btn').forEach(function (btn) {
            var inp = btn.previousElementSibling || btn.parentElement.querySelector('input, select');
            if (!inp) return;
            btn.style.display = inp.classList.contains('val-changed') ? '' : 'none';
        });
    }

    /* ─── [F18] Копировать значение поля ────────────────── */
    function addCopyButtons() {
        var div = getSaveDiv();
        if (!div) return;
        div.querySelectorAll('select, input:not([type=checkbox])').forEach(function (el) {
            if (el.parentElement.querySelector('.field-copy-btn')) return;
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'field-copy-btn';
            btn.title = 'Копировать значение';
            btn.textContent = '⧉';
            el.parentNode.insertBefore(btn, el.nextSibling);
            btn.addEventListener('click', function () {
                navigator.clipboard && navigator.clipboard.writeText(el.value)
                    .then(function () { showToast('Скопировано: ' + el.value, 'info', 1200); })
                    .catch(function () {});
            });
        });
    }

    /* ─── [F11] Поиск полей ─────────────────────────────── */
    function initSearch() {
        var bar = document.getElementById('editorSearchBar');
        if (!bar) return;
        var inp  = bar.querySelector('.editor-search-input');
        var clr  = bar.querySelector('.editor-search-clear');
        var noRes = document.getElementById('searchNoResults');
        if (!inp) return;

        inp.addEventListener('input', function () {
            var q = inp.value.trim().toLowerCase();
            filterFields(q);
        });

        if (clr) clr.addEventListener('click', function () {
            inp.value = ''; filterFields('');
        });
    }

    function filterFields(q) {
        var div = getSaveDiv();
        if (!div) return;
        var items = div.querySelectorAll('.lineItem');
        var visible = 0;
        items.forEach(function (item) {
            if (!q) { item.style.display = ''; visible++; return; }
            var text = item.textContent.toLowerCase();
            if (text.indexOf(q) >= 0) { item.style.display = ''; visible++; }
            else { item.style.display = 'none'; }
        });
        var noRes = document.getElementById('searchNoResults');
        if (noRes) noRes.style.display = (visible === 0 && q) ? '' : 'none';
    }

    /* ─── [F12] Tab badges ──────────────────────────────── */
    function updateTabBadges() {
        var div = getSaveDiv();
        if (!div) return;

        document.querySelectorAll('.tab_click').forEach(function (btn) {
            var tabId = btn.getAttribute('tab');
            var tabEl = document.getElementById(tabId);
            var count = 0;
            if (tabEl) count = tabEl.querySelectorAll('.val-changed:not(.lineItem)').length;

            var badge = btn.querySelector('.tab-badge');
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'tab-badge';
                btn.appendChild(badge);
            }
            badge.textContent = count;
            badge.classList.toggle('zero', count === 0);
        });

        updateChangedCount();
    }

    /* ─── [F13] Общий счётчик ────────────────────────────── */
    function updateChangedCount() {
        var div = getSaveDiv();
        if (!div) return;
        var all  = div.querySelectorAll('input.val-changed, select.val-changed').length;
        _changedCount = all;

        var el = document.getElementById('editor-changed-count');
        if (el) {
            el.innerHTML = all > 0
                ? 'Изменено: <span>' + all + '</span>'
                : '<span style="color:var(--text-3)">Без изменений</span>';
        }

        // [F25] Заголовок
        document.title = all > 0
            ? '● [' + all + '] ' + _originalTitle
            : _originalTitle;

        updateTabBadges_refresh = false;
    }
    var updateTabBadges_refresh = false;

    /* ─── [F14] Прыжок к первому изменённому ────────────── */
    function jumpToFirstChanged() {
        var el = document.querySelector('#saveData .val-changed:not(.lineItem)');
        if (!el) { showToast('Нет изменённых полей', 'info'); return; }
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
        showToast('Перешёл к первому изменению', 'info', 1000);
    }

    /* ─── [F15] Сводка изменений ─────────────────────────── */
    function showChangedSummary(callback) {
        var div = getSaveDiv();
        if (!div) { if (callback) callback(); return; }
        var changed = div.querySelectorAll('input.val-changed, select.val-changed');
        if (!changed.length) { if (callback) callback(); return; }

        var modal = document.getElementById('changed-summary-modal');
        if (!modal) { if (callback) callback(); return; }

        var list = modal.querySelector('.changed-summary-list');
        var html = '';
        changed.forEach(function (el) {
            var label = '';
            // Ищем лейбл ближайший
            var li = el.closest('.lineItem');
            if (li) {
                var spans = li.querySelectorAll('.selectTitle, label');
                spans.forEach(function (s) {
                    if (!label && s.textContent.trim()) label = s.textContent.trim();
                });
            }
            if (!label) label = el.name;
            var orig = el.getAttribute('data-original') || '—';
            var cur  = el.type === 'checkbox' ? String(el.checked) : el.value;
            html += '<li>'
                + '<span class="csl-name">' + escapeHtml(label.substring(0, 40)) + '</span>'
                + '<span style="display:flex;gap:8px;align-items:center;">'
                + '<span class="csl-old">' + escapeHtml(orig) + '</span>'
                + '<span style="color:var(--text-3)">→</span>'
                + '<span class="csl-new">' + escapeHtml(cur) + '</span>'
                + '</span></li>';
        });
        list.innerHTML = html || '<li><span style="color:var(--text-3)">Нет изменений</span></li>';

        modal.classList.add('open');

        var cancelBtn = modal.querySelector('.csm-cancel');
        var confirmBtn = modal.querySelector('.csm-confirm');

        function close() {
            modal.classList.remove('open');
            if (cancelBtn) cancelBtn.removeEventListener('click', onCancel);
            if (confirmBtn) confirmBtn.removeEventListener('click', onConfirm);
        }

        function onCancel() { close(); }
        function onConfirm() { close(); if (callback) callback(); }

        if (cancelBtn)  cancelBtn.addEventListener('click',  onCancel);
        if (confirmBtn) confirmBtn.addEventListener('click', onConfirm);
        modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
    }

    function escapeHtml(s) {
        return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    /* ─── [F16] Экспорт JSON ─────────────────────────────── */
    function exportJSON() {
        var div = getSaveDiv();
        if (!div) return;
        var data = {};
        div.querySelectorAll('select, input').forEach(function (el) {
            if (!el.name) return;
            data[el.name] = el.type === 'checkbox'
                ? (el.checked ? el.getAttribute('on') || '1' : el.getAttribute('off') || '0')
                : el.value;
        });
        var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'save_' + _chapterKey + '.json';
        a.click();
        URL.revokeObjectURL(a.href);
        showToast('JSON экспортирован', 'success');
    }

    /* ─── [F17] Импорт JSON ─────────────────────────────── */
    function importJSON() {
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.addEventListener('change', function () {
            var file = input.files[0];
            if (!file) return;
            var reader = new FileReader();
            reader.onload = function (ev) {
                var data;
                try { data = JSON.parse(ev.target.result); } catch (e) {
                    showToast('Неверный JSON файл', 'error'); return;
                }
                var div = getSaveDiv();
                if (!div) return;
                var applied = 0;
                div.querySelectorAll('select, input').forEach(function (el) {
                    if (!el.name || !(el.name in data)) return;
                    if (el.type === 'checkbox') {
                        el.checked = (data[el.name] === '1' || data[el.name] === true || data[el.name] === 'true');
                    } else {
                        el.value = data[el.name];
                    }
                    el.dispatchEvent(new Event('input',  { bubbles: true }));
                    el.dispatchEvent(new Event('change', { bubbles: true }));
                    applied++;
                });
                showToast('Импортировано ' + applied + ' полей', 'success');
            };
            reader.readAsText(file);
        });
        input.click();
    }

    /* ─── [F19/F20] Запомнить / восстановить вкладку ────── */
    function saveLastTab(tabId) {
        try { localStorage.setItem('lastTab_' + _chapterKey, tabId); } catch(e) {}
    }

    function restoreLastTab() {
        var tabId;
        try { tabId = localStorage.getItem('lastTab_' + _chapterKey); } catch(e) {}
        if (!tabId) return;
        var btn = document.querySelector('.tab_click[tab="' + tabId + '"]');
        if (btn) btn.click();
    }

    /* ─── [F23/F24] Expand/Collapse all ─────────────────── */
    function expandAll() {
        document.querySelectorAll('.spell_wrapper').forEach(function (w) {
            w.style.display = 'flex';
        });
        document.querySelectorAll('.spells_title').forEach(function (t) {
            t.innerHTML = '<center>^ Заклинания ^</center>';
        });
        document.querySelectorAll('.box-collapsible').forEach(function (b) {
            b.classList.remove('collapsed');
        });
    }

    function collapseAll() {
        document.querySelectorAll('.spell_wrapper').forEach(function (w) {
            w.style.display = 'none';
        });
        document.querySelectorAll('.spells_title').forEach(function (t) {
            t.innerHTML = '<center>v Заклинания v</center>';
        });
        document.querySelectorAll('.box-collapsible').forEach(function (b) {
            b.classList.add('collapsed');
        });
    }

    /* ─── [F31] Box collapse headers ────────────────────── */
    function initBoxCollapse() {
        var boxes = document.querySelectorAll(
            '#main_box, #goner_box, #thrash_box, #lightworld_box, #party_box, #flags_box, .flags_box, .character_box, .item_box, #recruit_box, #recruit_cafe_box'
        );
        boxes.forEach(function (box) {
            if (box.querySelector('.box-header')) return;
            box.classList.add('box-collapsible');

            var header = document.createElement('div');
            header.className = 'box-header';

            var titleText = box.querySelector('h2, h3, .box-title');
            var label = titleText ? titleText.textContent.trim() : (box.id || '').replace(/_/g,' ').toUpperCase() || 'БЛОК';

            header.innerHTML = '<span>' + label + '</span><span class="box-collapse-arrow">▼</span>';

            var body = document.createElement('div');
            body.className = 'box-body';

            // Move children into body
            while (box.firstChild) body.appendChild(box.firstChild);
            box.appendChild(header);
            box.appendChild(body);

            header.addEventListener('click', function () {
                box.classList.toggle('collapsed');
            });
        });
    }

    /* ─── [F30] Файл инфо (строки / размер) ─────────────── */
    function showFileInfo(text, name) {
        var el = document.getElementById('fileInfoBar');
        if (!el) return;
        var lines = text.split(/\r?\n/).length;
        var kb    = (new Blob([text]).size / 1024).toFixed(1);
        el.textContent = name + ' · ' + lines + ' строк · ' + kb + ' КБ';
        el.style.display = '';
    }

    /* ─── [F26] Предупреждение о несохранённых ────────────── */
    function initBeforeUnload() {
        window.addEventListener('beforeunload', function (e) {
            if (_changedCount > 0 && !_isDownloaded) {
                var msg = 'Есть несохранённые изменения (' + _changedCount + ' полей). Покинуть страницу?';
                e.preventDefault();
                e.returnValue = msg;
                return msg;
            }
        });
    }

    /* ─── [F27] Пометить как сохранено ─────────────────── */
    function markAsSaved() {
        _isDownloaded = true;
        document.title = _originalTitle;
        _changedCount = 0;
        var el = document.getElementById('editor-changed-count');
        if (el) el.innerHTML = '<span style="color:var(--success)">✓ Сохранено</span>';
        setTimeout(function () { updateChangedCount(); }, 3000);
        // Очистить автосохранение после скачивания
        try { localStorage.removeItem(autoSaveKey()); } catch(e) {}
        showToast('Сохранение скачано', 'success');
    }

    /* ─── [F36] Download кнопка — progress ─────────────── */
    function initDownloadBtn() {
        var btn = document.getElementById('downloadSave');
        if (!btn) return;
        btn.addEventListener('click', function () {
            btn.classList.add('downloading');
            setTimeout(function () {
                btn.classList.remove('downloading');
                markAsSaved();
            }, 600);
        }, true); // capture перед основным обработчиком
    }

    /* ─── [F32] Compact mode ────────────────────────────── */
    function initCompactMode() {
        var isCompact = false;
        try { isCompact = localStorage.getItem('compactMode') === 'true'; } catch(e) {}
        if (isCompact) document.body.classList.add('compact-mode');

        var btn = document.getElementById('toggleCompact');
        if (!btn) return;
        btn.addEventListener('click', function () {
            document.body.classList.toggle('compact-mode');
            var on = document.body.classList.contains('compact-mode');
            try { localStorage.setItem('compactMode', on); } catch(e) {}
            btn.textContent = on ? '⊟ Стандартный вид' : '⊟ Компактный вид';
            showToast(on ? 'Компактный режим включён' : 'Компактный режим выключен', 'info', 1500);
        });
    }

    /* ─── [F39] Проверка файла ──────────────────────────── */
    function initFileValidation() {
        var fileInput = document.getElementById('saveFile');
        if (!fileInput) return;
        fileInput.addEventListener('change', function () {
            var f = this.files[0];
            if (!f) return;
            // Проверка размера (разумно: 1–500 КБ)
            if (f.size < 500) {
                showToast('Файл слишком маленький — возможно, не тот файл', 'warning');
            }
            if (f.size > 600 * 1024) {
                showToast('Файл слишком большой для сохранения Deltarune', 'warning');
            }
        });
    }

    /* ─── Инициализация тулбара ────────────────────────── */
    function buildToolbar() {
        var editorView = document.getElementById('editorView');
        if (!editorView) return;

        // Автосохранение баннер
        var banner = document.createElement('div');
        banner.id = 'autosave-banner';
        banner.className = 'hidden';
        banner.innerHTML =
            '<span class="autosave-banner-text"></span>' +
            '<span class="autosave-banner-actions">' +
            '<button class="autosave-restore-btn">Восстановить</button>' +
            '<button class="autosave-dismiss-btn">Закрыть</button>' +
            '</span>';
        editorView.insertBefore(banner, editorView.firstChild);

        // File info
        var fileInfo = document.createElement('div');
        fileInfo.id = 'fileInfoBar';
        fileInfo.style.cssText = 'font-size:0.55em;color:var(--text-3);padding:4px 0 2px;display:none;';
        editorView.insertBefore(fileInfo, editorView.firstChild);

        // Тулбар
        var tb = document.createElement('div');
        tb.className = 'editor-toolbar';
        tb.innerHTML =
            '<button class="editor-toolbar-btn" id="btnUndo" title="Ctrl+Z">↩ Отменить</button>' +
            '<button class="editor-toolbar-btn" id="btnRedo" title="Ctrl+Y">↪ Повторить</button>' +
            '<span class="editor-toolbar-sep"></span>' +
            '<button class="editor-toolbar-btn danger" id="btnResetAll">✕ Сброс всего</button>' +
            '<button class="editor-toolbar-btn" id="btnResetTab">↺ Сброс вкладки</button>' +
            '<span class="editor-toolbar-sep"></span>' +
            '<button class="editor-toolbar-btn" id="btnExpandAll">︽ Развернуть</button>' +
            '<button class="editor-toolbar-btn" id="btnCollapseAll">︾ Свернуть</button>' +
            '<span class="editor-toolbar-sep"></span>' +
            '<button class="editor-toolbar-btn" id="btnExportJSON">⬇ JSON</button>' +
            '<button class="editor-toolbar-btn" id="btnImportJSON">⬆ Импорт</button>' +
            '<button class="editor-toolbar-btn" id="btnJumpChanged" title="Ctrl+G">⌖ Первое изменение</button>' +
            '<span class="editor-toolbar-sep"></span>' +
            '<button class="editor-toolbar-btn" id="toggleCompact">⊟ Компактный вид</button>' +
            '<div id="editor-changed-count"></div>';

        editorView.insertBefore(tb, editorView.firstChild);

        // Search bar
        var searchBar = document.createElement('div');
        searchBar.id = 'editorSearchBar';
        searchBar.className = 'editor-search-bar';
        searchBar.innerHTML =
            '<input type="search" class="editor-search-input" placeholder="Поиск по полям редактора…" autocomplete="off">' +
            '<button type="button" class="editor-search-clear">Очистить</button>';
        editorView.insertBefore(searchBar, editorView.getElementsByTagName('div')[0].nextSibling);

        var noRes = document.createElement('div');
        noRes.id = 'searchNoResults';
        noRes.className = 'search-no-results';
        noRes.style.display = 'none';
        noRes.textContent = 'Ничего не найдено';
        editorView.querySelector('#saveData').insertAdjacentElement('afterend', noRes);

        // Changed summary modal
        var csm = document.createElement('div');
        csm.id = 'changed-summary-modal';
        csm.innerHTML =
            '<div class="changed-summary-box">' +
            '<div class="changed-summary-title">📋 Изменённые поля</div>' +
            '<ul class="changed-summary-list"></ul>' +
            '<div class="changed-summary-actions">' +
            '<button class="editor-toolbar-btn csm-cancel">Отмена</button>' +
            '<button class="editor-toolbar-btn primary csm-confirm">⬇ Скачать</button>' +
            '</div></div>';
        document.body.appendChild(csm);

        // JSON modal
        var jsonModal = document.createElement('div');
        jsonModal.id = 'json-modal';
        jsonModal.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:25001;align-items:center;justify-content:center;';
        jsonModal.innerHTML =
            '<div style="background:var(--surface);border:1px solid var(--border-strong);border-top:2px solid var(--accent);border-radius:var(--radius-lg);padding:20px;width:90%;max-width:500px;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">' +
            '<strong style="color:var(--text)">Импорт JSON</strong>' +
            '<button id="jsonModalClose" style="background:none;border:none;color:var(--text-2);font-size:20px;cursor:pointer;font-family:inherit;">×</button>' +
            '</div>' +
            '<textarea class="json-modal-content" id="jsonPasteArea" placeholder=\'{"_1": "0", "_2": "0", ...}\'></textarea>' +
            '<div style="display:flex;gap:8px;margin-top:12px;justify-content:flex-end;">' +
            '<button class="editor-toolbar-btn" id="jsonApplyBtn">Применить</button>' +
            '</div></div>';
        document.body.appendChild(jsonModal);

        wireToolbarEvents();
    }

    function wireToolbarEvents() {
        var d = function (id, fn) {
            var el = document.getElementById(id);
            if (el) { el.addEventListener('click', fn); addRipple(el); }
        };
        d('btnUndo',        doUndo);
        d('btnRedo',        doRedo);
        d('btnResetAll',    resetAllChanges);
        d('btnResetTab',    resetCurrentTab);
        d('btnExpandAll',   expandAll);
        d('btnCollapseAll', collapseAll);
        d('btnExportJSON',  exportJSON);
        d('btnImportJSON',  importJSON);
        d('btnJumpChanged', jumpToFirstChanged);

        d('jsonModalClose', function () {
            document.getElementById('json-modal').style.display = 'none';
        });
        d('jsonApplyBtn', function () {
            var raw = document.getElementById('jsonPasteArea').value;
            var data;
            try { data = JSON.parse(raw); } catch (e) { showToast('Неверный JSON', 'error'); return; }
            var div = getSaveDiv();
            if (!div) return;
            var applied = 0;
            div.querySelectorAll('select, input').forEach(function (el) {
                if (!el.name || !(el.name in data)) return;
                if (el.type === 'checkbox') { el.checked = (data[el.name] === '1' || data[el.name] === true || data[el.name] === 'true'); }
                else { el.value = data[el.name]; }
                el.dispatchEvent(new Event('input',  { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
                applied++;
            });
            document.getElementById('json-modal').style.display = 'none';
            showToast('Применено ' + applied + ' полей', 'success');
        });
    }

    /* ─── [F1] Ctrl+S / [F4/F5] Ctrl+Z/Y / [F14] Ctrl+G ── */
    function initKeyboardShortcuts() {
        document.addEventListener('keydown', function (e) {
            var div = getSaveDiv();
            if (!div) return;
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                var btn = document.getElementById('downloadSave');
                if (btn) btn.click();
            }
            if (e.ctrlKey && !e.shiftKey && e.key === 'z') {
                e.preventDefault(); doUndo();
            }
            if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
                e.preventDefault(); doRedo();
            }
            if (e.ctrlKey && e.key === 'g') {
                e.preventDefault(); jumpToFirstChanged();
            }
        });
    }

    /* ─── Слушать изменения для обновления всего ──────────── */
    function initChangeListener() {
        var div = getSaveDiv();
        if (!div) return;
        div.addEventListener('input',  debounce(updateTabBadges, 100));
        div.addEventListener('change', debounce(updateTabBadges, 100));
    }

    function debounce(fn, ms) {
        var t;
        return function () {
            clearTimeout(t);
            t = setTimeout(fn, ms);
        };
    }

    /* ─── [F19] Tab change listener ─────────────────────── */
    function initTabListener() {
        document.addEventListener('click', function (e) {
            if (e.target && e.target.classList.contains('tab_click')) {
                var tabId = e.target.getAttribute('tab');
                if (tabId) saveLastTab(tabId);
            }
        });
    }

    /* ════════════════════════════════════════════════════════
       [Entry points]
       ════════════════════════════════════════════════════════ */

    /**
     * Вызвать один раз сразу при init страницы редактора
     */
    function initPage(chapterKey) {
        _chapterKey = chapterKey || '';
        initFileValidation();
        initDragAndDrop();
        initBeforeUnload();
        initKeyboardShortcuts();
        initCompactMode();
        initAutoSelectNumbers();

        // Восстановить compact-mode из localStorage
        try {
            if (localStorage.getItem('compactMode') === 'true') {
                document.body.classList.add('compact-mode');
            }
        } catch(e) {}
    }

    /**
     * Вызвать ПОСЛЕ того как EditorCore.openEditor() построил форму
     * (патчим EditorCore.loadFromText или вызываем из HTML после IntersectionObserver)
     */
    function afterEditorReady() {
        buildToolbar();
        initSearch();
        initUndoRedo();
        initSteppers();
        initClamp();
        addResetButtons();
        addCopyButtons();
        initBoxCollapse();
        initChangeListener();
        initTabListener();
        initDownloadBtn();
        initRipples();
        updateTabBadges();

        // Restore last tab
        setTimeout(restoreLastTab, 0);

        // Запуск автосохранения
        clearInterval(_autoSaveTimer);
        _autoSaveTimer = setInterval(function () {
            doAutoSave();
        }, 30000);

        // Добавить file info в заголовок просмотра
        (function () {
            if (typeof EditorCore !== 'undefined') {
                var text = EditorCore.getCurrentSaveText();
                var nameEl = document.getElementById('saveFileText');
                if (text && nameEl) showFileInfo(text, nameEl.textContent || 'save');
            }
        })();

        checkAutoSave();
    }

    /* Патч для перехвата loadFromText без изменения editorCore */
    function patchEditorCore() {
        if (typeof EditorCore === 'undefined') return;
        var origLoad = EditorCore.loadFromText;
        EditorCore.loadFromText = function (text, name) {
            origLoad.call(EditorCore, text, name);
            // Дать DOM обновиться
            setTimeout(afterEditorReady, 0);
        };
    }

    return {
        initPage:         initPage,
        afterEditorReady: afterEditorReady,
        patchEditorCore:  patchEditorCore,
        showChangedSummary: showChangedSummary,
        doAutoSave:       doAutoSave,
        exportJSON:       exportJSON,
        importJSON:       importJSON
    };
})();
