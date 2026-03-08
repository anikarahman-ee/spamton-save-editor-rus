/**
 * SaveCollections Module
 * Spamton Save Editor — коллекции (подборки) сохранений
 *
 * Зависимости: supabaseConfig.js, auth.js, profile.js
 * Таблица: save_collections
 */

var SaveCollections = (function () {

    // ─── CRUD ────────────────────────────────────

    function createCollection(name, description) {
        var user = Auth.getUser();
        if (!user) return Promise.reject('Необходима авторизация');
        if (!name || !name.trim()) return Promise.reject('Введите название');
        var sb = SupabaseConfig.getClient();
        if (!sb) return Promise.reject('Сервис недоступен');

        return UserProfile.getMyProfile().then(function (profile) {
            var p = profile || {};
            var doc = {
                user_id: user.id,
                author_name: p.display_name || user.email || 'Аноним',
                name: name.trim().substring(0, 60),
                description: (description || '').trim().substring(0, 300),
                save_ids: [],
                is_public: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            return sb.from('save_collections').insert(doc).select().single()
                .then(function (res) {
                    if (res.error) throw new Error(res.error.message);
                    return res.data;
                });
        });
    }

    function addToCollection(collectionId, saveId) {
        var user = Auth.getUser();
        if (!user) return Promise.reject('Необходима авторизация');
        var sb = SupabaseConfig.getClient();
        if (!sb) return Promise.reject('Сервис недоступен');

        // Читаем, потом добавляем ID в массив
        return sb.from('save_collections').select('save_ids').eq('id', collectionId).eq('user_id', user.id).single()
            .then(function (res) {
                if (res.error) throw new Error(res.error.message);
                var ids = res.data.save_ids || [];
                if (ids.indexOf(saveId) < 0) ids = ids.concat([saveId]);
                return sb.from('save_collections')
                    .update({ save_ids: ids, updated_at: new Date().toISOString() })
                    .eq('id', collectionId).eq('user_id', user.id);
            }).then(function (res) {
                if (res.error) throw new Error(res.error.message);
                return true;
            });
    }

    function removeFromCollection(collectionId, saveId) {
        var user = Auth.getUser();
        if (!user) return Promise.reject('Необходима авторизация');
        var sb = SupabaseConfig.getClient();
        if (!sb) return Promise.reject('Сервис недоступен');

        return sb.from('save_collections').select('save_ids').eq('id', collectionId).eq('user_id', user.id).single()
            .then(function (res) {
                if (res.error) throw new Error(res.error.message);
                var ids = (res.data.save_ids || []).filter(function (id) { return id !== saveId; });
                return sb.from('save_collections')
                    .update({ save_ids: ids, updated_at: new Date().toISOString() })
                    .eq('id', collectionId).eq('user_id', user.id);
            }).then(function (res) {
                if (res.error) throw new Error(res.error.message);
                return true;
            });
    }

    function deleteCollection(collectionId) {
        var user = Auth.getUser();
        if (!user) return Promise.reject('Необходима авторизация');
        var sb = SupabaseConfig.getClient();
        if (!sb) return Promise.reject('Сервис недоступен');
        return sb.from('save_collections').delete()
            .eq('id', collectionId).eq('user_id', user.id)
            .then(function (res) {
                if (res.error) throw new Error(res.error.message);
                return true;
            });
    }

    function getMyCollections() {
        var user = Auth.getUser();
        if (!user) return Promise.resolve([]);
        var sb = SupabaseConfig.getClient();
        if (!sb) return Promise.resolve([]);
        return sb.from('save_collections').select('*')
            .eq('user_id', user.id).order('updated_at', { ascending: false })
            .then(function (res) { return res.data || []; });
    }

    function getPublicCollections(page, perPage) {
        page = page || 1;
        perPage = perPage || 12;
        var sb = SupabaseConfig.getClient();
        if (!sb) return Promise.resolve([]);
        var from = (page - 1) * perPage;
        return sb.from('save_collections').select('*')
            .eq('is_public', true)
            .order('updated_at', { ascending: false })
            .range(from, from + perPage - 1)
            .then(function (res) { return res.data || []; });
    }

    function getCollectionById(collectionId) {
        var sb = SupabaseConfig.getClient();
        if (!sb) return Promise.resolve(null);
        return sb.from('save_collections').select('*').eq('id', collectionId).maybeSingle()
            .then(function (res) { return res.data || null; });
    }

    // ─── UI: Модальное окно создания ─────────────

    function showCreateModal(onCreated) {
        var overlay = document.getElementById('colCreateModal');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'colCreateModal';
            overlay.className = 'auth-modal-overlay';
            overlay.innerHTML =
                '<div class="auth-modal">' +
                    '<button class="auth-modal-close" id="colCreateClose">&times;</button>' +
                    '<div id="colCreateContent"></div>' +
                '</div>';
            document.body.appendChild(overlay);
            overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.style.display = 'none'; });
            document.getElementById('colCreateClose').addEventListener('click', function () { overlay.style.display = 'none'; });
        }

        var content = document.getElementById('colCreateContent');
        content.innerHTML =
            '<h2 class="auth-title">Создать коллекцию</h2>' +
            '<div id="colCreateError" class="auth-error"></div>' +
            '<form id="colCreateForm">' +
                '<label class="auth-label">Название' +
                    '<input type="text" id="colName" class="auth-input" maxlength="60" required>' +
                '</label>' +
                '<label class="auth-label">Описание' +
                    '<textarea id="colDesc" class="auth-input" maxlength="300" rows="3"></textarea>' +
                '</label>' +
                '<button type="submit" class="auth-btn auth-btn-full">Создать</button>' +
            '</form>';
        overlay.style.display = 'flex';

        // Use fresh reference to avoid stale/duplicate handlers
        var form = document.getElementById('colCreateForm');
        var formClone = form.cloneNode(true);
        form.parentNode.replaceChild(formClone, form);
        formClone.addEventListener('submit', function (e) {
            e.preventDefault();
            var name = document.getElementById('colName').value.trim();
            var desc = document.getElementById('colDesc').value.trim();
            var errEl = document.getElementById('colCreateError');
            if (!name) { errEl.textContent = 'Введите название'; errEl.style.display = 'block'; return; }

            var btn = this.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.textContent = 'Создание...';

            createCollection(name, desc).then(function (doc) {
                overlay.style.display = 'none';
                if (typeof onCreated === 'function') onCreated(doc);
            }).catch(function (err) {
                btn.disabled = false;
                btn.textContent = 'Создать';
                errEl.textContent = typeof err === 'string' ? err : 'Ошибка';
                errEl.style.display = 'block';
            });
        });
    }

    // ─── UI: Добавить в коллекцию ────────────────

    function showAddToCollectionModal(saveId) {
        var user = Auth.getUser();
        if (!user) {
            Auth.showModal('login');
            return;
        }

        var overlay = document.getElementById('colAddModal');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'colAddModal';
            overlay.className = 'auth-modal-overlay';
            overlay.innerHTML =
                '<div class="auth-modal">' +
                    '<button class="auth-modal-close" id="colAddClose">&times;</button>' +
                    '<div id="colAddContent"></div>' +
                '</div>';
            document.body.appendChild(overlay);
            overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.style.display = 'none'; });
            document.getElementById('colAddClose').addEventListener('click', function () { overlay.style.display = 'none'; });
        }

        var content = document.getElementById('colAddContent');
        content.innerHTML =
            '<h2 class="auth-title">Добавить в коллекцию</h2>' +
            '<div id="colAddList" class="col-add-list"><p style="color:#888">Загрузка...</p></div>' +
            '<button class="auth-btn auth-btn-outline auth-btn-full" id="colAddNew" style="margin-top:12px">+ Создать новую</button>';
        overlay.style.display = 'flex';

        document.getElementById('colAddNew').addEventListener('click', function () {
            overlay.style.display = 'none';
            showCreateModal(function (newCol) {
                // After creating, add save to it and reshow
                addToCollection(newCol.id, saveId).then(function () {
                    showToast('Добавлено в «' + newCol.name + '»');
                });
            });
        });

        loadCollectionsList(saveId);
    }

    function loadCollectionsList(saveId) {
        var listEl = document.getElementById('colAddList');
        if (!listEl) return;

        getMyCollections().then(function (collections) {
            if (!collections || collections.length === 0) {
                listEl.innerHTML = '<p class="comments-empty">У вас пока нет коллекций</p>';
                return;
            }
            var html = '';
            collections.forEach(function (c) {
                var hasSave = c.save_ids && c.save_ids.indexOf(saveId) >= 0;
                var idStr = c.id ? String(c.id) : '';
                html += '<div class="col-add-item' + (hasSave ? ' col-add-item-active' : '') + '" data-id="' + idStr + '">' +
                        '<span class="col-add-icon">' + (hasSave ? '✓' : '📁') + '</span>' +
                        '<span class="col-add-name">' + escapeHtml(c.name) + '</span>' +
                        '<span class="col-add-count">' + (c.save_ids ? c.save_ids.length : 0) + ' сохр.</span>' +
                    '</div>';
            });
            listEl.innerHTML = html;

            listEl.querySelectorAll('.col-add-item').forEach(function (item) {
                item.addEventListener('click', function () {
                    var cid = this.dataset.id;
                    if (!cid) return;
                    var isActive = this.classList.contains('col-add-item-active');
                    var self = this;

                    if (isActive) {
                        removeFromCollection(cid, saveId).then(function () {
                            self.classList.remove('col-add-item-active');
                            self.querySelector('.col-add-icon').textContent = '📁';
                            showToast('Удалено из коллекции');
                        });
                    } else {
                        addToCollection(cid, saveId).then(function () {
                            self.classList.add('col-add-item-active');
                            self.querySelector('.col-add-icon').textContent = '✓';
                            showToast('Добавлено в коллекцию');
                        });
                    }
                });
            });
        }).catch(function () {
            listEl.innerHTML = '<p class="comments-empty">Ошибка загрузки</p>';
        });
    }

    // ─── Collections Page ────────────────────────

    var _pageInitialized = false;

    function initCollectionsPage() {
        loadPublicCollections();

        if (_pageInitialized) return;
        _pageInitialized = true;

        var createBtn = document.getElementById('colCreateBtn');
        if (createBtn) {
            createBtn.addEventListener('click', function () {
                var user = Auth.getUser();
                if (!user) { Auth.showModal('login'); return; }
                showCreateModal(function () { loadPublicCollections(); });
            });
        }

        var myBtn = document.getElementById('colMyBtn');
        if (myBtn) {
            myBtn.addEventListener('click', function () {
                var user = Auth.getUser();
                if (!user) { Auth.showModal('login'); return; }
                loadMyCollections();
            });
        }

        var allBtn = document.getElementById('colAllBtn');
        if (allBtn) {
            allBtn.addEventListener('click', function () { loadPublicCollections(); });
        }
    }

    function loadPublicCollections(page) {
        var grid = document.getElementById('colGrid');
        if (!grid) return;
        grid.innerHTML = '<p style="text-align:center;color:#888;">Загрузка...</p>';

        getPublicCollections(page || 1).then(function (cols) {
            renderCollectionsGrid(grid, cols);
        }).catch(function () {
            grid.innerHTML = '<p style="text-align:center;color:#ff4444;">Ошибка загрузки</p>';
        });
    }

    function loadMyCollections() {
        var grid = document.getElementById('colGrid');
        if (!grid) return;
        grid.innerHTML = '<p style="text-align:center;color:#888;">Загрузка...</p>';

        getMyCollections().then(function (cols) {
            renderCollectionsGrid(grid, cols, true);
        }).catch(function () {
            grid.innerHTML = '<p style="text-align:center;color:#ff4444;">Ошибка загрузки</p>';
        });
    }

    function renderCollectionsGrid(grid, collections, isOwn) {
        if (!collections || collections.length === 0) {
            grid.innerHTML = '<p class="comments-empty">Нет коллекций</p>';
            return;
        }
        var html = '';
        var userId = Auth.getUser() ? Auth.getUser().id : null;
        collections.forEach(function (c) {
            var idStr = c.id ? String(c.id) : '';
            var count = c.save_ids ? c.save_ids.length : 0;
            var canDelete = isOwn || (userId && c.user_id === userId);
            var dateStr = '';
            try {
                var d = c.updated_at instanceof Date ? c.updated_at : new Date(c.updated_at);
                dateStr = d.toLocaleDateString('ru-RU');
            } catch (e) {}

            html +=
                '<div class="col-card" data-id="' + idStr + '">' +
                    '<div class="col-card-header">' +
                        '<span class="col-card-icon">📁</span>' +
                        '<span class="col-card-name">' + escapeHtml(c.name) + '</span>' +
                    '</div>' +
                    (c.description ? '<div class="col-card-desc">' + escapeHtml(c.description) + '</div>' : '') +
                    '<div class="col-card-meta">' +
                        '<span>' + count + ' сохранений</span>' +
                        '<span>от ' + escapeHtml(c.author_name || 'Аноним') + '</span>' +
                        (dateStr ? '<span>' + dateStr + '</span>' : '') +
                    '</div>' +
                    '<div class="col-card-actions">' +
                        '<button class="auth-btn auth-btn-small col-view-btn" data-id="' + idStr + '">Открыть</button>' +
                        (canDelete ? '<button class="auth-btn auth-btn-small auth-btn-outline col-delete-btn" data-id="' + idStr + '">Удалить</button>' : '') +
                    '</div>' +
                '</div>';
        });
        grid.innerHTML = html;

        // Wire view buttons
        grid.querySelectorAll('.col-view-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var cid = this.dataset.id;
                showCollectionDetail(cid);
            });
        });

        // Wire delete buttons
        grid.querySelectorAll('.col-delete-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var cid = this.dataset.id;
                if (!confirm('Удалить коллекцию?')) return;
                deleteCollection(cid).then(function () {
                    showToast('Коллекция удалена');
                    if (isOwn) loadMyCollections();
                    else loadPublicCollections();
                }).catch(function () {
                    showToast('Ошибка удаления');
                });
            });
        });
    }

    // ─── Collection Detail View ──────────────────

    function showCollectionDetail(collectionIdStr) {
        var grid = document.getElementById('colGrid');
        if (!grid) return;
        grid.innerHTML = '<p style="text-align:center;color:#888;">Загрузка...</p>';

        getCollectionById(collectionIdStr).then(function (col) {
            if (!col) {
                grid.innerHTML = '<p style="text-align:center;color:#ff4444;">Коллекция не найдена</p>';
                return;
            }

            var headerHtml =
                '<div class="col-detail-header">' +
                    '<button class="auth-btn auth-btn-small auth-btn-outline col-back-btn">← Назад</button>' +
                    '<h3 class="col-detail-title">' + escapeHtml(col.name) + '</h3>' +
                    (col.description ? '<p class="col-detail-desc">' + escapeHtml(col.description) + '</p>' : '') +
                    '<p class="col-detail-meta">от ' + escapeHtml(col.author_name || 'Аноним') + ' · ' + (col.save_ids ? col.save_ids.length : 0) + ' сохранений</p>' +
                '</div>' +
                '<div id="colDetailSaves" class="col-detail-saves"><p style="color:#888">Загрузка сохранений...</p></div>';
            grid.innerHTML = headerHtml;

            grid.querySelector('.col-back-btn').addEventListener('click', function () {
                loadPublicCollections();
            });

            // Load saves from public_saves that match save_ids
            if (!col.save_ids || col.save_ids.length === 0) {
                document.getElementById('colDetailSaves').innerHTML = '<p class="comments-empty">Коллекция пуста</p>';
                return;
            }

            var sb2 = SupabaseConfig.getClient();
            if (!sb2) return;

            sb2.from('public_saves').select('id, chapter, save_name, author_name, description, downloads, likes').in('id', col.save_ids).then(function (res) {
                var saves = res.data || [];
                var savesEl = document.getElementById('colDetailSaves');
                if (!saves || saves.length === 0) {
                    savesEl.innerHTML = '<p class="comments-empty">Сохранения не найдены</p>';
                    return;
                }
                var html = '';
                saves.forEach(function (s) {
                    var chLabel = getChapterLabel(s.chapter);
                    html +=
                        '<div class="col-save-item">' +
                            (chLabel ? '<span class="col-save-ch">' + chLabel + '</span>' : '') +
                            '<span class="col-save-name">' + escapeHtml(s.save_name || s.name || 'Без имени') + '</span>' +
                            '<span class="col-save-author">от ' + escapeHtml(s.author_name || 'Аноним') + '</span>' +
                        '</div>';
                });
                savesEl.innerHTML = html;
            }).catch(function () {
                document.getElementById('colDetailSaves').innerHTML = '<p class="comments-empty">Ошибка загрузки сохранений</p>';
            });

        }).catch(function () {
            grid.innerHTML = '<p style="text-align:center;color:#ff4444;">Ошибка загрузки</p>';
        });
    }

    // ─── Helpers ─────────────────────────────────

    function getChapterLabel(ch) {
        var labels = {
            'ch1': 'Глава 1', 'ch2': 'Глава 2', 'ch3': 'Глава 3', 'ch4': 'Глава 4',
            'ch1Demo': 'Демо Гл.1', 'ch2Demo': 'Демо Гл.2'
        };
        return labels[ch] || ch || '';
    }

    function escapeHtml(s) {
        return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    function showToast(msg) {
        var toast = document.createElement('div');
        toast.className = 'cloud-toast';
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(function () { toast.classList.add('show'); }, 10);
        setTimeout(function () {
            toast.classList.remove('show');
            setTimeout(function () { toast.remove(); }, 300);
        }, 2500);
    }

    // ─── Public API ──────────────────────────────

    return {
        createCollection: createCollection,
        addToCollection: addToCollection,
        removeFromCollection: removeFromCollection,
        deleteCollection: deleteCollection,
        getMyCollections: getMyCollections,
        getPublicCollections: getPublicCollections,
        getCollectionById: getCollectionById,
        showCreateModal: showCreateModal,
        showAddToCollectionModal: showAddToCollectionModal,
        initCollectionsPage: initCollectionsPage
    };
})();
