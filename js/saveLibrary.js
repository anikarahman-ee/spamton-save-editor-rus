/**
 * Save Library Module
 * Spamton Save Editor — публичная библиотека сохранений
 *
 * Зависимости: supabaseConfig.js (SupabaseConfig), auth.js
 * Таблицы: public_saves, save_likes
 */

var SaveLibrary = (function () {

    var PAGE_SIZE = 12;
    var currentPage = 0;
    var currentChapter = '';
    var currentSearch = '';
    var currentSort = 'newest';
    var totalCount = 0;

    // ─── Публикация сохранения ────────────────────

    /**
     * Опубликовать сохранение в публичную библиотеку
     * @param {Object} opts — { chapter, save_name, save_data, description }
     * @returns {Promise}
     */
    function publishSave(opts) {
        var user = Auth.getUser();
        if (!user) return Promise.reject(new Error('Необходимо войти в аккаунт'));
        var sb = SupabaseConfig.getClient();
        if (!sb) return Promise.reject(new Error('Supabase не настроен'));

        var email = user.email || 'Аноним';
        var authorName = email.split('@')[0];

        var profilePromise = (typeof UserProfile !== 'undefined')
            ? UserProfile.getProfile(user.id).catch(function () { return null; })
            : Promise.resolve(null);

        return profilePromise.then(function (profile) {
            if (profile && profile.display_name) authorName = profile.display_name;
            var isSupporter = !!(profile && profile.is_supporter);

            return sb.from('public_saves')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .then(function (res) {
                    if (res.error) throw new Error(res.error.message);
                    if ((res.count || 0) >= 30) {
                        throw new Error('Превышен лимит публикаций (максимум 30)');
                    }
                    return sb.from('public_saves').insert({
                        user_id: user.id,
                        author_name: authorName,
                        is_supporter: isSupporter,
                        chapter: opts.chapter,
                        save_name: opts.save_name,
                        description: opts.description || '',
                        save_data: opts.save_data,
                        downloads: 0,
                        likes: 0,
                        published_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    });
                }).then(function (res) {
                    if (res.error) throw new Error(res.error.message);
                    return res.data;
                });
        });
    }

    /**
     * Удалить свою публикацию
     */
    function unpublishSave(saveId) {
        var user = Auth.getUser();
        if (!user) return Promise.reject(new Error('Необходимо войти в аккаунт'));
        var sb = SupabaseConfig.getClient();
        if (!sb) return Promise.reject(new Error('Supabase не настроен'));

        return sb.from('public_saves')
            .delete()
            .eq('id', saveId)
            .eq('user_id', user.id)
            .then(function (res) {
                if (res.error) throw new Error(res.error.message);
                return true;
            });
    }

    // ─── Лайки ────────────────────────────────────

    var _likedSet = {}; // кэш лайков текущего пользователя { saveId: true }

    /**
     * Переключить лайк на сохранении
     */
    function toggleLike(saveId) {
        var user = Auth.getUser();
        if (!user) return Promise.reject(new Error('Необходимо войти в аккаунт'));
        var sb = SupabaseConfig.getClient();
        if (!sb) return Promise.reject(new Error('Supabase не настроен'));

        if (_likedSet[saveId]) {
            // Убираем лайк
            return sb.from('save_likes')
                .delete()
                .eq('user_id', user.id)
                .eq('save_id', saveId)
                .then(function (res) {
                    if (res.error) throw new Error(res.error.message);
                    // Уменьшаем счётчик
                    return sb.rpc('decrement_likes', { save_id: saveId });
                }).then(function () {
                    delete _likedSet[saveId];
                    return { liked: false };
                });
        } else {
            // Ставим лайк
            return sb.from('save_likes')
                .insert({ user_id: user.id, save_id: saveId })
                .then(function (res) {
                    if (res.error) throw new Error(res.error.message);
                    return sb.rpc('increment_likes', { save_id: saveId });
                }).then(function () {
                    _likedSet[saveId] = true;
                    return { liked: true };
                });
        }
    }

    /**
     * Загрузить кэш лайков текущего пользователя
     */
    function loadMyLikes() {
        var user = Auth.getUser();
        if (!user) { _likedSet = {}; return Promise.resolve(); }
        var sb = SupabaseConfig.getClient();
        if (!sb) return Promise.resolve();

        return sb.from('save_likes')
            .select('save_id')
            .eq('user_id', user.id)
            .then(function (res) {
                _likedSet = {};
                if (res.data) {
                    res.data.forEach(function (r) { _likedSet[r.save_id] = true; });
                }
            }).catch(function () { _likedSet = {}; });
    }

    function isLiked(saveId) {
        return !!_likedSet[saveId];
    }

    // ─── Загрузка списка ─────────────────────────

    /**
     * Получить список публичных сохранений
     */
    function listPublicSaves(opts) {
        var sb = SupabaseConfig.getClient();
        if (!sb) return Promise.reject(new Error('Supabase не настроен'));

        var from = (opts.page || 0) * PAGE_SIZE;
        var to = from + PAGE_SIZE - 1;

        // Сначала счёт (count-only), потом данные
        var countQuery = sb.from('public_saves')
            .select('id', { count: 'exact', head: true });

        var dataQuery = sb.from('public_saves')
            .select('id, user_id, author_name, is_supporter, chapter, save_name, description, downloads, likes, published_at')
            .range(from, to);

        if (opts.chapter) {
            countQuery = countQuery.eq('chapter', opts.chapter);
            dataQuery = dataQuery.eq('chapter', opts.chapter);
        }
        if (opts.search) {
            var like = '%' + opts.search + '%';
            countQuery = countQuery.ilike('save_name', like);
            dataQuery = dataQuery.ilike('save_name', like);
        }

        switch (opts.sort) {
            case 'oldest':    dataQuery = dataQuery.order('published_at', { ascending: true }); break;
            case 'downloads': dataQuery = dataQuery.order('downloads', { ascending: false }); break;
            case 'likes':     dataQuery = dataQuery.order('likes', { ascending: false }); break;
            default:          dataQuery = dataQuery.order('published_at', { ascending: false }); break;
        }

        return Promise.all([countQuery, dataQuery]).then(function (results) {
            var countRes = results[0];
            var dataRes  = results[1];
            if (countRes.error) throw new Error(countRes.error.message);
            if (dataRes.error)  throw new Error(dataRes.error.message);
            totalCount = countRes.count || 0;
            return {
                saves: (dataRes.data || []).map(function (doc) {
                    return {
                        id: doc.id,
                        user_id: doc.user_id,
                        author_name: doc.author_name || 'Аноним',
                        is_supporter: !!doc.is_supporter,
                        chapter: doc.chapter,
                        save_name: doc.save_name,
                        description: doc.description || '',
                        downloads: doc.downloads || 0,
                        likes: doc.likes || 0,
                        published_at: doc.published_at
                    };
                }),
                total: totalCount,
                page: opts.page || 0,
                totalPages: Math.ceil(totalCount / PAGE_SIZE)
            };
        });
    }

    /**
     * Загрузить публичное сохранение (для скачивания/загрузки в редактор)
     */
    function getPublicSave(saveId) {
        var sb = SupabaseConfig.getClient();
        if (!sb) return Promise.reject(new Error('Supabase не настроен'));

        return sb.from('public_saves')
            .select('*')
            .eq('id', saveId)
            .single()
            .then(function (res) {
                if (res.error) throw new Error('Сохранение не найдено');
                var doc = res.data;
                // Увеличиваем счётчик скачиваний асинхронно
                sb.from('public_saves')
                    .update({ downloads: (doc.downloads || 0) + 1 })
                    .eq('id', saveId)
                    .then(function () {})
                    .catch(function () {});
                return {
                    id: doc.id,
                    user_id: doc.user_id,
                    author_name: doc.author_name || 'Аноним',
                    chapter: doc.chapter,
                    save_name: doc.save_name,
                    description: doc.description || '',
                    save_data: doc.save_data,
                    downloads: (doc.downloads || 0) + 1,
                    published_at: doc.published_at
                };
            });
    }

    // ─── UI: Диалог публикации ───────────────────

    /**
     * Показать диалог публикации из облачного сохранения
     * @param {string} saveId — ID облачного сохранения
     */
    function showPublishFromCloudDialog(saveId) {
        var user = Auth.getUser();
        if (!user) { Auth.showModal('login'); return; }

        // Загружаем сохранение из личного облака
        CloudSaves.loadSave(saveId).then(function (save) {
            showPublishDialog({
                chapter: save.chapter,
                save_name: save.save_name,
                save_data: save.save_data
            });
        }).catch(function (err) {
            alert('Ошибка: ' + err.message);
        });
    }

    /**
     * Показать диалог публикации (общий)
     * @param {Object} opts — { chapter, save_name, save_data }
     */
    function showPublishDialog(opts) {
        var user = Auth.getUser();
        if (!user) { Auth.showModal('login'); return; }

        var modal = document.getElementById('authModal');
        var content = document.getElementById('authModalContent');
        content.innerHTML =
            '<h2 class="auth-title">Опубликовать сохранение</h2>' +
            '<div id="authError" class="auth-error"></div>' +
            '<form id="publishSaveForm">' +
                '<label class="auth-label">Название' +
                    '<input type="text" id="publishName" class="auth-input" ' +
                        'value="' + escapeHtml(opts.save_name) + '" required maxlength="100">' +
                '</label>' +
                '<label class="auth-label">Глава' +
                    '<input type="text" class="auth-input" value="' + escapeHtml(getChapterLabel(opts.chapter)) + '" disabled>' +
                '</label>' +
                '<label class="auth-label">Описание (необязательно)' +
                    '<textarea id="publishDesc" class="auth-input auth-textarea" rows="3" ' +
                        'maxlength="500" placeholder="Расскажите о сохранении..."></textarea>' +
                '</label>' +
                '<p class="publish-notice">Сохранение станет доступно всем пользователям в библиотеке.</p>' +
                '<button type="submit" class="auth-btn auth-btn-full">Опубликовать</button>' +
            '</form>';

        modal.style.display = 'flex';

        document.getElementById('publishSaveForm').addEventListener('submit', function (e) {
            e.preventDefault();
            var name = document.getElementById('publishName').value.trim();
            var desc = document.getElementById('publishDesc').value.trim();
            var btn = this.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.textContent = 'Публикация...';

            publishSave({
                chapter: opts.chapter,
                save_name: name,
                save_data: opts.save_data,
                description: desc
            }).then(function () {
                Auth.hideModal();
                showToast('Сохранение опубликовано!');
            }).catch(function (err) {
                btn.disabled = false;
                btn.textContent = 'Опубликовать';
                var errEl = document.getElementById('authError');
                if (errEl) {
                    errEl.textContent = 'Ошибка: ' + err.message;
                    errEl.style.display = 'block';
                }
            });
        });
    }

    /**
     * Показать диалог публикации из текущего редактора
     */
    function showPublishFromEditor() {
        var user = Auth.getUser();
        if (!user) { Auth.showModal('login'); return; }

        if (typeof EditorCore === 'undefined' || !EditorCore.getCurrentSaveText) {
            alert('Сначала загрузите файл сохранения в редактор.');
            return;
        }

        var saveData = EditorCore.getCurrentSaveText();
        if (!saveData) {
            alert('Сначала загрузите файл сохранения в редактор.');
            return;
        }

        var chapter = EditorCore.getChapterKey ? EditorCore.getChapterKey() : CloudSaves.getCurrentChapter();
        if (!chapter) {
            alert('Не удалось определить главу.');
            return;
        }

        showPublishDialog({
            chapter: chapter,
            save_name: chapter + ' — ' + new Date().toLocaleString('ru-RU'),
            save_data: saveData
        });
    }

    // ─── UI: Страница библиотеки ─────────────────

    /**
     * Инициализация страницы библиотеки (library.html)
     */
    function initLibraryPage() {
        currentPage = 0;
        currentChapter = '';
        currentSearch = '';
        currentSort = 'newest';

        wireLibraryControls();

        // Check for ?save= parameter (direct link to save)
        var urlParams = new URLSearchParams(window.location.search);
        var directSaveId = urlParams.get('save');
        if (directSaveId) {
            showSaveDetailModal(directSaveId);
        }

        // Load likes cache then load page
        loadMyLikes().then(function () {
            loadLibraryPage();
        });
    }

    function wireLibraryControls() {
        // Фильтры по главам
        document.querySelectorAll('.lib-filter-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                document.querySelectorAll('.lib-filter-btn').forEach(function (b) { b.classList.remove('active'); });
                this.classList.add('active');
                currentChapter = this.getAttribute('data-chapter') || '';
                currentPage = 0;
                loadLibraryPage();
            });
        });

        // Сортировка
        var sortSelect = document.getElementById('libSortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', function () {
                currentSort = this.value;
                currentPage = 0;
                loadLibraryPage();
            });
        }

        // Поиск
        var searchInput = document.getElementById('libSearchInput');
        var searchBtn = document.getElementById('libSearchBtn');
        var searchTimeout = null;

        if (searchInput) {
            searchInput.addEventListener('input', function () {
                clearTimeout(searchTimeout);
                var val = this.value;
                searchTimeout = setTimeout(function () {
                    currentSearch = val.trim();
                    currentPage = 0;
                    loadLibraryPage();
                }, 400);
            });
            searchInput.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    clearTimeout(searchTimeout);
                    currentSearch = this.value.trim();
                    currentPage = 0;
                    loadLibraryPage();
                }
            });
        }

        if (searchBtn) {
            searchBtn.addEventListener('click', function () {
                clearTimeout(searchTimeout);
                currentSearch = (searchInput ? searchInput.value.trim() : '');
                currentPage = 0;
                loadLibraryPage();
            });
        }
    }

    function loadLibraryPage() {
        var grid = document.getElementById('libGrid');
        var pag = document.getElementById('libPagination');
        var countEl = document.getElementById('libCount');
        if (!grid) return;

        grid.innerHTML = '<div class="lib-loading">Загрузка...</div>';
        if (pag) pag.innerHTML = '';

        listPublicSaves({
            chapter: currentChapter,
            search: currentSearch,
            sort: currentSort,
            page: currentPage
        }).then(function (result) {
            if (countEl) {
                countEl.textContent = 'Найдено: ' + result.total;
            }

            if (result.saves.length === 0) {
                grid.innerHTML = '<div class="lib-empty">Нет опубликованных сохранений</div>';
                return;
            }

            var user = Auth.getUser();
            var html = '';
            result.saves.forEach(function (save) {
                var date = new Date(save.published_at).toLocaleDateString('ru-RU');
                var chLabel = getChapterLabel(save.chapter);
                var isOwner = user && save.user_id === user.id;
                var supporterBadge = save.is_supporter ? ' <span class="supporter-badge" title="Supporter">★</span>' : '';
                var authorClass = save.is_supporter ? 'lib-card-author lib-card-author-supporter' : 'lib-card-author';
                html +=
                    '<div class="lib-card' + (save.is_supporter ? ' lib-card-supporter' : '') + '">' +
                        '<div class="lib-card-header">' +
                            '<span class="lib-card-chapter">' + chLabel + '</span>' +
                            (isOwner ? '<span class="lib-card-own">Моё</span>' : '') +
                        '</div>' +
                        '<div class="lib-card-name">' + escapeHtml(save.save_name) + '</div>' +
                        (save.description
                            ? '<div class="lib-card-desc">' + escapeHtml(save.description) + '</div>'
                            : '') +
                        '<div class="lib-card-meta">' +
                            '<span class="' + authorClass + '">' + escapeHtml(save.author_name) + supporterBadge + '</span>' +
                            '<span class="lib-card-date">' + date + '</span>' +
                        '</div>' +
                        '<div class="lib-card-stats">' +
                            '<span>Скачали: ' + save.downloads + '</span>' +
                            '<span class="lib-likes-count" data-id="' + save.id + '">♥ ' + save.likes + '</span>' +
                        '</div>' +
                        '<div class="lib-card-actions">' +
                            '<button class="lib-action-btn lib-like-btn' + (isLiked(save.id) ? ' lib-liked' : '') + '" data-id="' + save.id + '" title="Нравится">♥</button>' +
                            '<button class="lib-action-btn lib-download-btn" data-id="' + save.id + '" title="Скачать файл">Скачать</button>' +
                            '<button class="lib-action-btn lib-load-btn" data-id="' + save.id + '" data-chapter="' + save.chapter + '" title="Открыть в редакторе">Открыть</button>' +
                            '<button class="lib-action-btn lib-comment-btn" data-id="' + save.id + '" title="Комментарии">Комм.</button>' +
                            '<button class="lib-action-btn lib-collect-btn" data-id="' + save.id + '" title="В коллекцию">Колл.</button>' +
                            '<button class="lib-action-btn lib-share-btn" data-id="' + save.id + '" title="Поделиться ссылкой">Ссылка</button>' +
                            (user && !isOwner ? '<button class="lib-action-btn lib-report-btn" data-id="' + save.id + '" title="Пожаловаться">!</button>' : '') +
                            (isOwner ? '<button class="lib-action-btn lib-delete-btn" data-id="' + save.id + '" title="Удалить публикацию">Удалить</button>' : '') +
                            (typeof Admin !== 'undefined' && Admin.isAdmin() && !isOwner ? '<button class="lib-action-btn lib-admin-delete-btn" data-id="' + save.id + '" title="Удалить (админ)">Удалить</button>' : '') +
                        '</div>' +
                    '</div>';
            });
            grid.innerHTML = html;

            // Events
            grid.querySelectorAll('.lib-download-btn').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    onDownloadPublic(this.getAttribute('data-id'));
                });
            });
            grid.querySelectorAll('.lib-load-btn').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    onLoadPublic(this.getAttribute('data-id'), this.getAttribute('data-chapter'));
                });
            });
            grid.querySelectorAll('.lib-delete-btn').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    onDeletePublic(this.getAttribute('data-id'));
                });
            });
            grid.querySelectorAll('.lib-comment-btn').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var saveId = this.getAttribute('data-id');
                    showCommentsModal(saveId);
                });
            });
            grid.querySelectorAll('.lib-collect-btn').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var saveId = this.getAttribute('data-id');
                    if (typeof SaveCollections !== 'undefined') {
                        SaveCollections.showAddToCollectionModal(saveId);
                    }
                });
            });

            // Like buttons
            grid.querySelectorAll('.lib-like-btn').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var saveId = this.getAttribute('data-id');
                    var self = this;
                    var user = Auth.getUser();
                    if (!user) { Auth.showModal('login'); return; }
                    toggleLike(saveId).then(function (res) {
                        self.classList.toggle('lib-liked', res.liked);
                        var countEl = grid.querySelector('.lib-likes-count[data-id="' + saveId + '"]');
                        if (countEl) {
                            var cur = parseInt(countEl.textContent.replace(/\D/g, '')) || 0;
                            countEl.textContent = '♥ ' + (res.liked ? cur + 1 : Math.max(0, cur - 1));
                        }
                    });
                });
            });

            // Share buttons
            grid.querySelectorAll('.lib-share-btn').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var saveId = this.getAttribute('data-id');
                    var url = window.location.origin + window.location.pathname + '?save=' + saveId;
                    if (navigator.clipboard) {
                        navigator.clipboard.writeText(url).then(function () {
                            showToast('Ссылка скопирована!');
                        });
                    } else {
                        // Fallback
                        var ta = document.createElement('textarea');
                        ta.value = url;
                        document.body.appendChild(ta);
                        ta.select();
                        document.execCommand('copy');
                        document.body.removeChild(ta);
                        showToast('Ссылка скопирована!');
                    }
                });
            });

            // Report buttons
            grid.querySelectorAll('.lib-report-btn').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var saveId = this.getAttribute('data-id');
                    if (typeof Admin !== 'undefined') {
                        Admin.showReportModal(saveId);
                    }
                });
            });

            // Admin delete buttons
            grid.querySelectorAll('.lib-admin-delete-btn').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var saveId = this.getAttribute('data-id');
                    if (!confirm('Удалить это сохранение как администратор?')) return;
                    if (typeof Admin !== 'undefined') {
                        Admin.adminDeleteSave(saveId).then(function () {
                            showToast('Сохранение удалено (админ)');
                            loadLibraryPage();
                        }).catch(function (err) {
                            alert('Ошибка: ' + (err.message || String(err)));
                        });
                    }
                });
            });

            // Пагинация
            renderPagination(result.page, result.totalPages);

            // Load comment counts and update badges
            if (typeof Comments !== 'undefined' && Comments.getCommentCounts) {
                var saveIds = result.saves.map(function (s) { return s.id; });
                Comments.getCommentCounts(saveIds).then(function (counts) {
                    grid.querySelectorAll('.lib-comment-btn').forEach(function (btn) {
                        var id = btn.getAttribute('data-id');
                        var c = counts[id] || 0;
                        if (c > 0) {
                            btn.textContent = 'Комм. ' + c;
                            btn.title = 'Комментарии (' + c + ')';
                        }
                    });
                });
            }
        }).catch(function (err) {
            grid.innerHTML = '<div class="lib-error">Ошибка: ' + escapeHtml(err.message) + '</div>';
        });
    }

    function renderPagination(page, totalPages) {
        var pag = document.getElementById('libPagination');
        if (!pag || totalPages <= 1) return;

        var html = '';
        if (page > 0) {
            html += '<button class="lib-page-btn" data-page="' + (page - 1) + '">← Назад</button>';
        }
        // Show max 5 page numbers around current page
        var start = Math.max(0, page - 2);
        var end = Math.min(totalPages, start + 5);
        if (end - start < 5) start = Math.max(0, end - 5);

        for (var i = start; i < end; i++) {
            html += '<button class="lib-page-btn' + (i === page ? ' active' : '') + '" data-page="' + i + '">' + (i + 1) + '</button>';
        }
        if (page < totalPages - 1) {
            html += '<button class="lib-page-btn" data-page="' + (page + 1) + '">Далее →</button>';
        }

        pag.innerHTML = html;
        pag.querySelectorAll('.lib-page-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                currentPage = parseInt(this.getAttribute('data-page'));
                loadLibraryPage();
                // Scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });
    }

    // ─── Действия на странице библиотеки ─────────

    function onDownloadPublic(saveId) {
        getPublicSave(saveId).then(function (save) {
            var filename = 'filech' + save.chapter.replace('ch', '').replace('Demo', '_demo') + '_0';
            saveAs(new Blob([save.save_data], { type: 'application/octet-stream' }), filename);
        }).catch(function (err) {
            alert('Ошибка: ' + err.message);
        });
    }

    function onLoadPublic(saveId, chapter) {
        var pageMap = {
            'ch1': 'deltarune1.html',
            'ch2': 'deltarune2.html',
            'ch3': 'deltarune3.html',
            'ch4': 'deltarune4.html',
            'ch1Demo': 'deltarune1Demo.html',
            'ch2Demo': 'deltarune2Demo.html'
        };

        // Сохраняем ID в sessionStorage и перенаправляем на нужную страницу
        sessionStorage.setItem('pendingPublicSave', saveId);
        if (pageMap[chapter]) {
            window.location.href = pageMap[chapter];
        } else {
            alert('Неизвестная глава: ' + chapter);
        }
    }

    function onDeletePublic(saveId) {
        if (!confirm('Удалить эту публикацию из библиотеки?')) return;
        unpublishSave(saveId).then(function () {
            showToast('Публикация удалена');
            loadLibraryPage();
        }).catch(function (err) {
            alert('Ошибка: ' + err.message);
        });
    }

    /**
     * Проверка и загрузка публичного сохранения после перехода на страницу редактора
     */
    function checkPendingPublicSave() {
        var pendingId = sessionStorage.getItem('pendingPublicSave');
        if (!pendingId) return;
        sessionStorage.removeItem('pendingPublicSave');

        // Ждём инициализации Auth, но работает и без авторизации (аноним)
        var tryLoad = function () {
            getPublicSave(pendingId).then(function (save) {
                if (typeof EditorCore !== 'undefined' && EditorCore.loadFromText) {
                    EditorCore.loadFromText(save.save_data, save.save_name);
                    showToast('Загружено из библиотеки: ' + save.save_name);
                }
            }).catch(function (err) {
                console.error('Не удалось загрузить из библиотеки:', err);
            });
        };

        // Нужна авторизация для доступа к MongoDB
        if (Auth.getUser()) {
            tryLoad();
        } else {
            Auth.onAuthChange(function (user) {
                if (user) tryLoad();
            });
        }
    }

    // ─── UI: «Мои публикации» (вкладка в saves) ─

    function showMyPublications() {
        var user = Auth.getUser();
        if (!user) { Auth.showModal('login'); return; }

        var modal = document.getElementById('authModal');
        var content = document.getElementById('authModalContent');
        content.innerHTML =
            '<h2 class="auth-title">Мои публикации</h2>' +
            '<div id="myPubList" class="saves-list"><div class="saves-loading">Загрузка...</div></div>';

        modal.style.display = 'flex';

        var sb = SupabaseConfig.getClient();
        if (!sb) return;

        sb.from('public_saves')
            .select('id, chapter, save_name, description, downloads, likes, published_at')
            .eq('user_id', user.id)
            .order('published_at', { ascending: false })
            .then(function (res) {
            var listDiv = document.getElementById('myPubList');
            if (!listDiv) return;
            if (res.error || !res.data || res.data.length === 0) {
                listDiv.innerHTML = '<div class="saves-empty">' + (res.error ? 'Ошибка загрузки' : 'У вас нет публикаций') + '</div>';
                return;
            }

            var html = '';
            res.data.forEach(function (doc) {
                var date = new Date(doc.published_at).toLocaleString('ru-RU');
                var chLabel = getChapterLabel(doc.chapter);
                html +=
                    '<div class="save-item" data-save-id="' + doc.id + '">' +
                        '<div class="save-item-info">' +
                            '<div class="save-item-name">' + escapeHtml(doc.save_name) + '</div>' +
                            '<div class="save-item-meta">' + chLabel + ' · ' + date + ' · Скачали: ' + (doc.downloads || 0) + '</div>' +
                        '</div>' +
                        '<div class="save-item-actions">' +
                            '<button class="save-action-btn save-delete-btn" data-id="' + doc.id + '" title="Удалить публикацию">✕</button>' +
                        '</div>' +
                    '</div>';
            });
            listDiv.innerHTML = html;

            listDiv.querySelectorAll('.save-delete-btn').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var id = this.getAttribute('data-id');
                    if (!confirm('Удалить эту публикацию из библиотеки?')) return;
                    unpublishSave(id).then(function () {
                        showMyPublications();
                    }).catch(function (err) {
                        alert('Ошибка: ' + err.message);
                    });
                });
            });
            }).catch(function (err) {
            var listDiv = document.getElementById('myPubList');
            if (listDiv) listDiv.innerHTML = '<div class="saves-error">Ошибка: ' + escapeHtml(err.message) + '</div>';
        });
    }

    // ─── UI: Просмотр сохранения по прямой ссылке ─

    function showSaveDetailModal(saveId) {
        var overlay = document.getElementById('saveDetailModal');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'saveDetailModal';
            overlay.className = 'auth-modal-overlay';
            overlay.innerHTML =
                '<div class="auth-modal" style="max-width:500px">' +
                    '<button class="auth-modal-close" id="saveDetailClose">&times;</button>' +
                    '<div id="saveDetailContent"><p style="color:#888;text-align:center">Загрузка...</p></div>' +
                '</div>';
            document.body.appendChild(overlay);
            overlay.addEventListener('click', function (e) {
                if (e.target === overlay) {
                    overlay.style.display = 'none';
                    // Clean URL
                    if (window.history.replaceState) {
                        window.history.replaceState({}, '', window.location.pathname);
                    }
                }
            });
            document.getElementById('saveDetailClose').addEventListener('click', function () {
                overlay.style.display = 'none';
                if (window.history.replaceState) {
                    window.history.replaceState({}, '', window.location.pathname);
                }
            });
        }
        overlay.style.display = 'flex';
        var content = document.getElementById('saveDetailContent');
        content.innerHTML = '<p style="color:#888;text-align:center">Загрузка...</p>';

        var sb = SupabaseConfig.getClient();
        if (!sb) { content.innerHTML = '<p style="color:#ff4444">Supabase не настроен</p>'; return; }

        sb.from('public_saves')
            .select('id, user_id, author_name, chapter, save_name, description, downloads, likes, published_at')
            .eq('id', saveId)
            .single()
            .then(function (res) {
            if (res.error || !res.data) {
                content.innerHTML = '<p style="color:#ff4444;text-align:center">Сохранение не найдено</p>';
                return;
            }
            var doc = res.data;
            var date = '';
            try { date = new Date(doc.published_at).toLocaleString('ru-RU'); } catch(e) {}
            var chLabel = getChapterLabel(doc.chapter);
            content.innerHTML =
                '<h2 class="auth-title">' + escapeHtml(doc.save_name || 'Без имени') + '</h2>' +
                '<div style="margin-bottom:12px">' +
                    '<span class="lib-card-chapter" style="display:inline-block;margin-right:8px">' + chLabel + '</span>' +
                    '<span style="color:#888;font-size:13px">от ' + escapeHtml(doc.author_name || 'Аноним') + '</span>' +
                '</div>' +
                (doc.description ? '<p style="color:#aaa;font-size:14px;margin-bottom:12px">' + escapeHtml(doc.description) + '</p>' : '') +
                '<div style="color:#666;font-size:13px;margin-bottom:16px">' +
                    date + ' · Скачали: ' + (doc.downloads || 0) + ' · ♥ ' + (doc.likes || 0) +
                '</div>' +
                '<div style="display:flex;gap:8px">' +
                    '<button class="auth-btn auth-btn-full" id="saveDetailDownload">Скачать</button>' +
                    '<button class="auth-btn auth-btn-outline auth-btn-full" id="saveDetailLoad">Открыть в редакторе</button>' +
                '</div>';
            document.getElementById('saveDetailDownload').addEventListener('click', function () {
                onDownloadPublic(saveId);
            });
            document.getElementById('saveDetailLoad').addEventListener('click', function () {
                onLoadPublic(saveId, doc.chapter);
            });
        }).catch(function () {
            content.innerHTML = '<p style="color:#ff4444;text-align:center">Ошибка загрузки</p>';
        });
    }

    // ─── UI: Комментарии к сохранению ──────────

    function showCommentsModal(saveId) {
        var overlay = document.getElementById('commentsModal');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'commentsModal';
            overlay.className = 'auth-modal-overlay';
            overlay.innerHTML =
                '<div class="auth-modal comments-modal">' +
                    '<button class="auth-modal-close" id="commentsModalClose">&times;</button>' +
                    '<div id="commentsModalContent"></div>' +
                '</div>';
            document.body.appendChild(overlay);
            overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.style.display = 'none'; });
            document.getElementById('commentsModalClose').addEventListener('click', function () { overlay.style.display = 'none'; });
        }

        overlay.style.display = 'flex';
        var content = document.getElementById('commentsModalContent');
        if (typeof Comments !== 'undefined') {
            Comments.renderCommentsSection(saveId, content);
        } else {
            content.innerHTML = '<p style="color:#888;text-align:center;">Комментарии недоступны</p>';
        }
    }

    // ─── Helpers ─────────────────────────────────

    function getChapterLabel(ch) {
        var labels = {
            'ch1': 'Глава 1',
            'ch2': 'Глава 2',
            'ch3': 'Глава 3',
            'ch4': 'Глава 4',
            'ch1Demo': 'Демо Гл.1',
            'ch2Demo': 'Демо Гл.2'
        };
        return labels[ch] || ch;
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function showToast(message) {
        var toast = document.createElement('div');
        toast.className = 'cloud-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(function () { toast.classList.add('show'); }, 10);
        setTimeout(function () {
            toast.classList.remove('show');
            setTimeout(function () { toast.remove(); }, 300);
        }, 3000);
    }

    return {
        publishSave: publishSave,
        unpublishSave: unpublishSave,
        listPublicSaves: listPublicSaves,
        getPublicSave: getPublicSave,
        toggleLike: toggleLike,
        isLiked: isLiked,
        loadMyLikes: loadMyLikes,
        showPublishDialog: showPublishDialog,
        showPublishFromCloudDialog: showPublishFromCloudDialog,
        showPublishFromEditor: showPublishFromEditor,
        showMyPublications: showMyPublications,
        showSaveDetailModal: showSaveDetailModal,
        initLibraryPage: initLibraryPage,
        checkPendingPublicSave: checkPendingPublicSave
    };
})();
