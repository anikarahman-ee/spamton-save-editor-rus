/**
 * siteEnhancements.js — Улучшения для всех страниц сайта
 *
 * [F41]  ESC закрывает любую открытую модалку
 * [F42]  Прогресс-бар скролла (#scroll-progress)
 * [F43]  Анимированный счётчик stat-value (count-up)
 * [F44]  Section reveal по scroll (IntersectionObserver)
 * [F45]  Stagger анимации карточек
 * [F46]  Toast уведомления: success / error / info / warning
 * [F47]  Стек тостов (до 3 одновременно)
 * [F48]  ? / F1 → панель горячих клавиш
 * [F49]  Плавная прокрутка по якорным ссылкам
 * [F50]  Вернуться к редактору (breadcrumb)
 * [F51]  Онлайн / офлайн индикатор
 * [F52]  Пасхалка в консоли (Spamton ASCII)
 * [F53]  Управление размером шрифта (+/−)
 * [F54]  Запоминание позиции скrolла на странице
 * [F55]  Плавный переход между страницами (fade)
 * [F56]  Подсветка последней посещённой главы
 * [F57]  Бейдж «Недавно» на карточке главы
 * [F58]  Кнопка «Копировать ссылку»
 * [F59]  Кнопка «Поделиться» (navigator.share)
 * [F60]  Кнопка «Наверх»
 * [F61]  Секция Changelog (динамическая инъекция)
 * [F62]  Бейдж «NEW» на ch4 карточке
 * [F63]  Скелетон-лоадер на изображения
 * [F64]  Лоадинг-стейт для stats
 * [F65]  Горизонтальный скролл вкладок на мобайл (нет JS нужен)
 * [F66]  Показать/скрыть пароль в формах авторизации
 * [F67]  Предупреждение о CapsLock в auth формах
 * [F68]  Индикатор надёжности пароля
 * [F69]  Подтверждение совпадения паролей
 * [F70]  «Знаете ли вы?» ротация подсказок
 */

var SiteEnhance = (function () {

    /* ═══════════════════════════════════════════════════
       [F46/F47] Toast система
       ═══════════════════════════════════════════════════ */
    var _toastContainer = null;
    var _toastQueue = [];
    var MAX_TOASTS = 3;

    function getToastContainer() {
        if (_toastContainer) return _toastContainer;
        _toastContainer = document.getElementById('toast-container');
        if (_toastContainer) return _toastContainer;
        _toastContainer = document.createElement('div');
        _toastContainer.id = 'toast-container';
        document.body.appendChild(_toastContainer);
        return _toastContainer;
    }

    function toast(msg, type, duration) {
        type     = type     || 'info';
        duration = duration || 3000;
        var container = getToastContainer();

        // Ограничение стека
        var existing = container.querySelectorAll('.toast-item');
        if (existing.length >= MAX_TOASTS) {
            var oldest = existing[0];
            oldest.classList.remove('visible');
            setTimeout(function () { oldest.remove(); }, 300);
        }

        var item = document.createElement('div');
        item.className = 'toast-item toast-' + type;
        var icons = { success: '✔', error: '✖', warning: '⚠', info: 'ℹ' };
        item.innerHTML =
            '<span class="toast-icon">' + (icons[type] || icons.info) + '</span>' +
            '<span class="toast-msg">' + msg + '</span>' +
            '<button class="toast-close">×</button>';

        container.appendChild(item);

        item.querySelector('.toast-close').addEventListener('click', function () {
            dismissToast(item);
        });

        // Animate in
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                item.classList.add('visible');
            });
        });

        var timer = setTimeout(function () { dismissToast(item); }, duration);
        item.addEventListener('mouseenter', function () { clearTimeout(timer); });
        item.addEventListener('mouseleave', function () {
            timer = setTimeout(function () { dismissToast(item); }, 1500);
        });
    }

    function dismissToast(item) {
        item.classList.remove('visible');
        setTimeout(function () { item.remove(); }, 350);
    }

    /* ═══════════════════════════════════════════════════
       [F41] ESC закрывает модалки
       ═══════════════════════════════════════════════════ */
    function initEscClose() {
        document.addEventListener('keydown', function (e) {
            if (e.key !== 'Escape') return;
            // Auth overlays
            document.querySelectorAll('.auth-modal-overlay, #shortcuts-overlay, #changed-summary-modal').forEach(function (el) {
                if (el.classList.contains('open') || el.classList.contains('active') || el.style.display === 'flex') {
                    el.classList.remove('open','active');
                    el.style.display = 'none';
                }
            });
            // JSON modal
            var jm = document.getElementById('json-modal');
            if (jm) jm.style.display = 'none';
        });
    }

    /* ═══════════════════════════════════════════════════
       [F42] Scroll progress bar
       ═══════════════════════════════════════════════════ */
    function initScrollProgress() {
        var bar = document.getElementById('scroll-progress');
        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'scroll-progress';
            document.body.appendChild(bar);
        }

        window.addEventListener('scroll', function () {
            var scrollTop  = window.scrollY;
            var docH = document.documentElement.scrollHeight - window.innerHeight;
            var pct  = docH > 0 ? (scrollTop / docH * 100) : 0;
            bar.style.width = Math.min(100, pct) + '%';
        }, { passive: true });
    }

    /* ═══════════════════════════════════════════════════
       [F43] Count-up анимация stat-value
       ═══════════════════════════════════════════════════ */
    function initCountUp() {
        var targets = document.querySelectorAll('.stat-value[data-target]');
        if (!targets.length) return;

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                var el    = entry.target;
                var end   = parseFloat(el.getAttribute('data-target')) || 0;
                var dur   = 1200;
                var start = 0;
                var startTime = null;
                var isFloat = !Number.isInteger(end);

                function step(ts) {
                    if (!startTime) startTime = ts;
                    var p = Math.min((ts - startTime) / dur, 1);
                    var ease = 1 - Math.pow(1 - p, 3);
                    var val  = start + (end - start) * ease;
                    el.textContent = isFloat ? val.toFixed(1) : Math.round(val);
                    if (p < 1) requestAnimationFrame(step);
                }
                requestAnimationFrame(step);
                observer.unobserve(el);
            });
        }, { threshold: 0.3 });

        targets.forEach(function (t) { observer.observe(t); });
    }

    /* ═══════════════════════════════════════════════════
       [F44] Section reveal
       ═══════════════════════════════════════════════════ */
    function initReveal() {
        var items = document.querySelectorAll('.reveal-section');
        if (!items.length) return;
        var obs = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) {
                    e.target.classList.add('revealed');
                    obs.unobserve(e.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
        items.forEach(function (el) { obs.observe(el); });
    }

    /* ═══════════════════════════════════════════════════
       [F48] Keyboard shortcuts overlay (? / F1)
       ═══════════════════════════════════════════════════ */
    var SHORTCUTS = [
        ['Ctrl + S',        'Скачать сохранение'],
        ['Ctrl + Z',        'Отменить изменение'],
        ['Ctrl + Y',        'Повторить изменение'],
        ['Ctrl + G',        'Перейти к первому изменению'],
        ['?  /  F1',        'Показать это окно'],
        ['ESC',             'Закрыть модальное окно'],
        ['Клик на заголовок блока', 'Свернуть / развернуть блок'],
    ];

    function buildShortcutsOverlay() {
        var overlay = document.getElementById('shortcuts-overlay');
        if (overlay) return;

        overlay = document.createElement('div');
        overlay.id = 'shortcuts-overlay';
        overlay.innerHTML =
            '<div class="shortcuts-box">' +
            '<div class="shortcuts-header">' +
            '<span>⌨ Горячие клавиши</span>' +
            '<button id="shortcutsClose">×</button>' +
            '</div>' +
            '<div class="shortcuts-grid">' +
            SHORTCUTS.map(function (row) {
                return '<div class="shortcut-row">' +
                    '<span class="kbd">' + row[0] + '</span>' +
                    '<span class="shortcut-desc">' + row[1] + '</span>' +
                '</div>';
            }).join('') +
            '</div></div>';

        document.body.appendChild(overlay);

        document.getElementById('shortcutsClose').addEventListener('click', function () {
            overlay.classList.remove('open');
        });
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) overlay.classList.remove('open');
        });
    }

    function initShortcutsKey() {
        buildShortcutsOverlay();
        document.addEventListener('keydown', function (e) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
            if (e.key === '?' || e.key === 'F1') {
                e.preventDefault();
                var ov = document.getElementById('shortcuts-overlay');
                if (ov) ov.classList.toggle('open');
            }
        });
    }

    /* ═══════════════════════════════════════════════════
       [F49] Smooth scroll по якорям
       ═══════════════════════════════════════════════════ */
    function initSmoothAnchors() {
        document.querySelectorAll('a[href^="#"]').forEach(function (a) {
            a.addEventListener('click', function (e) {
                var id = a.getAttribute('href').slice(1);
                var target = document.getElementById(id);
                if (!target) return;
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });
    }

    /* ═══════════════════════════════════════════════════
       [F51] Online / Offline индикатор
       ═══════════════════════════════════════════════════ */
    function initOnlineIndicator() {
        var dot = document.getElementById('online-indicator');
        if (!dot) {
            dot = document.createElement('div');
            dot.id = 'online-indicator';
            document.body.appendChild(dot);
        }

        function update(isOnline) {
            dot.className = isOnline ? 'online' : 'offline';
            dot.title     = isOnline ? 'Онлайн' : 'Нет соединения';
        }

        update(navigator.onLine);
        window.addEventListener('offline', function () {
            update(false);
            toast('Нет соединения с интернетом', 'warning');
        });
        window.addEventListener('online', function () {
            update(true);
            toast('Соединение восстановлено', 'success', 2000);
        });
    }

    /* ═══════════════════════════════════════════════════
       [F52] Console easter egg
       ═══════════════════════════════════════════════════ */
    function initConsoleEgg() {
        var art = [
            '%c',
            '  ██████ ██████  █████  ███    ███ ████████  ██████  ███    ██ ',
            ' ██      ██   ██ ██  ███████  ██    ██    ██    ██  ████   ██ ',
            ' ██████  ██████  ████████ ████  ██    ██    ██    ██  ██ ██  ██ ',
            '      ██ ██      ██   ██ ██  ████    ██    ██    ██  ██  ██ ██ ',
            ' ██████  ██      ██   ██ ██   ███    ██    ██ ██████  ██   ████ ',
            '',
            '  [ SPAMTON SAVE EDITOR ]  — всё для вашего прохождения!',
            '  BIG SHOT 💊 НЕ ОСТАНАВЛИВАЙТЕСЬ!!',
            '',
        ].join('\n');
        console.log(art, 'color: #9b59f4; font-family: monospace; font-size: 11px;');
        console.log('%c  Редактор сохранений Deltarune | spamton-save-editor',
            'color: #c471ed; font-weight: bold;');
    }

    /* ═══════════════════════════════════════════════════
       [F53] Font size controls
       ═══════════════════════════════════════════════════ */
    var _fontSize = 16;

    function initFontControls() {
        try {
            var saved = localStorage.getItem('uiFontSize');
            if (saved) { _fontSize = parseInt(saved); applyFontSize(); }
        } catch(e) {}

        var ctrl = document.getElementById('font-controls');
        if (!ctrl) {
            ctrl = document.createElement('div');
            ctrl.className = 'font-controls';
            ctrl.innerHTML =
                '<button class="font-controls-btn" id="fontDecrease" title="Уменьшить шрифт">A−</button>' +
                '<button class="font-controls-btn" id="fontReset"    title="Сбросить">A</button>' +
                '<button class="font-controls-btn" id="fontIncrease" title="Увеличить шрифт">A+</button>';
            document.body.appendChild(ctrl);
        }

        document.getElementById('fontDecrease').addEventListener('click', function () {
            _fontSize = Math.max(12, _fontSize - 1); applyFontSize();
        });
        document.getElementById('fontReset').addEventListener('click', function () {
            _fontSize = 16; applyFontSize();
        });
        document.getElementById('fontIncrease').addEventListener('click', function () {
            _fontSize = Math.min(22, _fontSize + 1); applyFontSize();
        });
    }

    function applyFontSize() {
        document.documentElement.style.fontSize = _fontSize + 'px';
        try { localStorage.setItem('uiFontSize', _fontSize); } catch(e) {}
    }

    /* ═══════════════════════════════════════════════════
       [F54] Запоминание позиции scroll
       ═══════════════════════════════════════════════════ */
    function initScrollMemory() {
        var key = 'scrollPos_' + window.location.pathname;
        try {
            var y = parseInt(localStorage.getItem(key));
            if (y) window.scrollTo(0, y);
        } catch(e) {}

        window.addEventListener('beforeunload', function () {
            try { localStorage.setItem(key, window.scrollY); } catch(e) {}
        });
    }

    /* ═══════════════════════════════════════════════════
       [F55] Page transition fade
       ═══════════════════════════════════════════════════ */
    function initPageTransition() {
        document.querySelectorAll('a[href]:not([target="_blank"]):not([href^="#"]):not([href^="javascript"])').forEach(function (a) {
            a.addEventListener('click', function (e) {
                var href = a.getAttribute('href');
                if (!href || href.startsWith('http') || href.startsWith('mailto')) return;
                e.preventDefault();
                document.body.style.opacity = '0';
                setTimeout(function () { window.location.href = href; }, 250);
            });
        });
    }

    /* ═══════════════════════════════════════════════════
       [F56/F57] Последние посещённые главы
       ═══════════════════════════════════════════════════ */
    var CHAPTER_PAGES = {
        'deltarune1.html':      'ch1',
        'deltarune1Demo.html':  'ch1d',
        'deltarune2.html':      'ch2',
        'deltarune2Demo.html':  'ch2d',
        'deltarune3.html':      'ch3',
        'deltarune4.html':      'ch4',
    };

    function initRecentChapters() {
        // Записать текущую
        var page = window.location.pathname.split('/').pop();
        if (CHAPTER_PAGES[page]) {
            try {
                var arr = JSON.parse(localStorage.getItem('recentChapters') || '[]');
                arr = arr.filter(function (p) { return p !== page; });
                arr.unshift(page);
                arr = arr.slice(0, 3);
                localStorage.setItem('recentChapters', JSON.stringify(arr));
            } catch(e) {}
        }

        // Добавить бейджи на index.html картах
        var cards = document.querySelectorAll('.chapter-card[data-chapter]');
        if (!cards.length) return;
        var recent;
        try { recent = JSON.parse(localStorage.getItem('recentChapters') || '[]'); } catch(e) { return; }

        cards.forEach(function (card) {
            var ch = card.getAttribute('data-chapter');
            if (recent.indexOf(ch) >= 0) {
                card.classList.add('recently-visited');
                var badge = document.createElement('span');
                badge.className = 'recently-visited-badge';
                badge.textContent = 'Недавно';
                card.appendChild(badge);
            }
        });
    }

    /* ═══════════════════════════════════════════════════
       [F58] Копировать ссылку
       ═══════════════════════════════════════════════════ */
    function initCopyURL() {
        var btn = document.getElementById('copyUrlBtn');
        if (!btn) return;
        btn.addEventListener('click', function () {
            navigator.clipboard && navigator.clipboard.writeText(window.location.href)
                .then(function () { toast('Ссылка скопирована', 'success', 2000); })
                .catch(function ()  { toast('Не удалось скопировать', 'error'); });
        });
    }

    /* ═══════════════════════════════════════════════════
       [F59] Share API
       ═══════════════════════════════════════════════════ */
    function initShare() {
        var btn = document.getElementById('shareBtn');
        if (!btn) return;
        if (!navigator.share) { btn.style.display = 'none'; return; }
        btn.addEventListener('click', function () {
            navigator.share({
                title: document.title,
                url:   window.location.href,
            }).catch(function () {});
        });
    }

    /* ═══════════════════════════════════════════════════
       [F60] Кнопка «Наверх»
       ═══════════════════════════════════════════════════ */
    function initScrollTopBtn() {
        var btn = document.getElementById('scrollTopBtn');
        if (!btn) {
            btn = document.createElement('button');
            btn.id = 'scrollTopBtn';
            btn.className = 'scroll-top-btn';
            btn.title = 'Наверх';
            btn.innerHTML = '↑';
            document.body.appendChild(btn);
        }

        window.addEventListener('scroll', function () {
            btn.classList.toggle('visible', window.scrollY > 400);
        }, { passive: true });

        btn.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    /* ═══════════════════════════════════════════════════
       [F62] NEW badge на ch4
       ═══════════════════════════════════════════════════ */
    function initNewBadge() {
        // Работает по CSS через [data-new="true"]::after (см. enhancements.css)
        // JS-вставка для accessibility и тех браузеров без ::after
        document.querySelectorAll('[data-new="true"], [data-chapter="ch4"], [data-chapter="4"]').forEach(function (el) {
            if (!el.querySelector('.chapter-new-badge')) {
                var b = document.createElement('span');
                b.className = 'chapter-new-badge';
                b.textContent = 'NEW';
                b.setAttribute('aria-label', 'Новая глава');
                el.appendChild(b);
            }
        });
    }

    /* ═══════════════════════════════════════════════════
       [F63] Skeleton/lazy images
       ═══════════════════════════════════════════════════ */
    function initImageSkeletons() {
        document.querySelectorAll('img[data-src]').forEach(function (img) {
            img.classList.add('img-skeleton');
            var temp = new Image();
            temp.onload = function () {
                img.src = img.getAttribute('data-src');
                img.classList.remove('img-skeleton');
            };
            temp.src = img.getAttribute('data-src');
        });
    }

    /* ═══════════════════════════════════════════════════
       [F66] Показать/скрыть пароль
       ═══════════════════════════════════════════════════ */
    function initPasswordToggle() {
        document.querySelectorAll('.auth-password-wrap').forEach(function (wrap) {
            var inp = wrap.querySelector('input[type=password], input[type=text]');
            var toggle = wrap.querySelector('.auth-password-toggle');
            if (!inp || !toggle) return;
            toggle.addEventListener('click', function () {
                var show = inp.type === 'password';
                inp.type  = show ? 'text' : 'password';
                toggle.textContent = show ? '🙈' : '👁';
                toggle.title       = show ? 'Скрыть пароль' : 'Показать пароль';
            });
        });
    }

    /* ═══════════════════════════════════════════════════
       [F67] CapsLock предупреждение
       ═══════════════════════════════════════════════════ */
    function initCapsLockWarning() {
        document.querySelectorAll('input[type=password]').forEach(function (inp) {
            var warning = inp.closest('.auth-password-wrap')
                ? inp.closest('.auth-password-wrap').nextElementSibling
                : null;
            if (!warning || !warning.classList.contains('caps-lock-warning')) {
                warning = document.createElement('div');
                warning.className = 'caps-lock-warning';
                warning.textContent = '⚠ CapsLock включён';
                warning.style.display = 'none';
                inp.insertAdjacentElement('afterend', warning);
            }
            inp.addEventListener('keyup', function (e) {
                if (e.getModifierState) {
                    warning.style.display = e.getModifierState('CapsLock') ? '' : 'none';
                }
            });
        });
    }

    /* ═══════════════════════════════════════════════════
       [F68] Password strength meter
       ═══════════════════════════════════════════════════ */
    function getPasswordStrength(pw) {
        var score = 0;
        if (pw.length >= 8)  score++;
        if (pw.length >= 12) score++;
        if (/[A-Z]/.test(pw)) score++;
        if (/[0-9]/.test(pw)) score++;
        if (/[^A-Za-z0-9]/.test(pw)) score++;
        return score; // 0-5
    }

    function initPasswordStrength() {
        var newPassInput = document.getElementById('newPasswordInput') ||
                           document.querySelector('input[name=password]:not([name$=confirm])');
        if (!newPassInput) return;

        var container = document.createElement('div');
        container.className = 'password-strength-bar';
        var fill = document.createElement('div');
        fill.className = 'password-strength-fill';
        container.appendChild(fill);
        newPassInput.insertAdjacentElement('afterend', container);

        newPassInput.addEventListener('input', function () {
            var score  = getPasswordStrength(newPassInput.value);
            var levels = ['', 'strength-weak', 'strength-weak', 'strength-fair', 'strength-good', 'strength-strong'];
            fill.className = 'password-strength-fill ' + (levels[score] || '');
            fill.style.width = (score / 5 * 100) + '%';
        });
    }

    /* ═══════════════════════════════════════════════════
       [F69] Confirm password match
       ═══════════════════════════════════════════════════ */
    function initPasswordMatch() {
        var pw1 = document.querySelector('input[name=password]:not([name$=confirm])');
        var pw2 = document.querySelector('input[name$=confirm], input[id$=confirm], input[placeholder*=подтверд]');
        if (!pw1 || !pw2) return;

        var hint = document.createElement('div');
        hint.className = 'password-match-hint';
        pw2.insertAdjacentElement('afterend', hint);

        function check() {
            if (!pw2.value) { hint.textContent = ''; return; }
            var match = pw1.value === pw2.value;
            hint.className = 'password-match-hint ' + (match ? 'match' : 'no-match');
            hint.textContent = match ? '✓ Пароли совпадают' : '✗ Пароли не совпадают';
        }

        pw1.addEventListener('input', check);
        pw2.addEventListener('input', check);
    }

    /* ═══════════════════════════════════════════════════
       [F70] «Знаете ли вы?» ротация
       ═══════════════════════════════════════════════════ */
    var TIPS = [
        'Нажмите Ctrl+S чтобы сохранить файл не открывая меню.',
        'Используйте Ctrl+Z для отмены последнего изменения.',
        'Вы можете экспортировать изменения в JSON и поделиться.',
        'Нажмите ? чтобы увидеть все горячие клавиши.',
        'Компактный режим поможет видеть больше полей на экране.',
        'Автосохранение работает каждые 30 секунд автоматически.',
        'Нажмите ⧉ рядом с полем чтобы скопировать его значение.',
        'Deltarune сохраняет данные построчно. Каждая строка — параметр.',
    ];

    function initDYKTip() {
        var el = document.getElementById('dyk-tip');
        if (!el) return;
        var idx = Math.floor(Math.random() * TIPS.length);

        function showTip() {
            el.style.opacity = '0';
            setTimeout(function () {
                el.querySelector('.dyk-text').textContent = TIPS[idx];
                el.style.opacity = '1';
                idx = (idx + 1) % TIPS.length;
            }, 300);
        }

        showTip();
        setInterval(showTip, 8000);
    }

    /* ═══════════════════════════════════════════════════
       PWA Install button [F91]
       ═══════════════════════════════════════════════════ */
    var _installPrompt = null;

    function initInstallPrompt() {
        window.addEventListener('beforeinstallprompt', function (e) {
            e.preventDefault();
            _installPrompt = e;
            var btn = document.getElementById('pwa-install-btn');
            if (btn) btn.style.display = '';
        });

        var btn = document.getElementById('pwa-install-btn');
        if (!btn) return;
        btn.style.display = 'none';
        btn.addEventListener('click', function () {
            if (!_installPrompt) return;
            _installPrompt.prompt();
            _installPrompt.userChoice.then(function (res) {
                if (res.outcome === 'accepted') {
                    toast('Приложение установлено!', 'success');
                    btn.style.display = 'none';
                }
                _installPrompt = null;
            });
        });
    }

    /* ═══════════════════════════════════════════════════
       Service Worker registration
       ═══════════════════════════════════════════════════ */
    function initServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/serviceWorker.js')
                .then(function () {}) // silent
                .catch(function () {});
        }
    }

    /* ═══════════════════════════════════════════════════
       ГЛАВНЫЙ ИНИТ
       ═══════════════════════════════════════════════════ */
    function init() {
        initEscClose();
        initScrollProgress();
        initReveal();
        initShortcutsKey();
        initSmoothAnchors();
        initOnlineIndicator();
        initScrollTopBtn();
        initFontControls();
        initScrollMemory();
        initImageSkeletons();
        initPasswordToggle();
        initCapsLockWarning();
        initPasswordStrength();
        initPasswordMatch();
        initRecentChapters();
        initCopyURL();
        initShare();
        initNewBadge();
        initDYKTip();
        initInstallPrompt();
        initServiceWorker();

        // Count-up и transitions запускаем с небольшой задержкой
        setTimeout(initCountUp, 200);
        setTimeout(initPageTransition, 0);

        // Console easter egg всегда
        initConsoleEgg();
    }

    return {
        init:  init,
        toast: toast,
    };
})();

// Авто-инициализация
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', SiteEnhance.init);
} else {
    SiteEnhance.init();
}
