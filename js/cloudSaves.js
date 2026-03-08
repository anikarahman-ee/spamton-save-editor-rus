/**
 * Cloud Saves Module
 * Spamton Save Editor — облачное хранение сохранений
 *
 * Зависимости: supabaseConfig.js (SupabaseConfig), auth.js
 * Бэкенд: Supabase
 *
 * Таблица: user_saves
 */

var CloudSaves = (function () {

    var MAX_SAVES_PER_USER = 50;

    // ─── Сохранение в облако ─────────────────────

    /**
     * Сохранить текущий файл в облако
     * @param {string} chapter  — 'ch1', 'ch2', 'ch3', 'ch4', 'ch1Demo', 'ch2Demo'
     * @param {string} saveData — полный текст файла сохранения
     * @param {string} [saveName] — пользовательское имя (опционально)
     * @returns {Promise}
     */
    function saveToDB(chapter, saveData, saveName) {
        var user = Auth.getUser();
        if (!user) return Promise.reject(new Error('Необходимо войти в аккаунт'));
        var sb = SupabaseConfig.getClient();
        if (!sb) return Promise.reject(new Error('Supabase не настроен'));

        var name = saveName || (chapter + ' — ' + new Date().toLocaleString('ru-RU'));

        return sb.from('user_saves')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .then(function (res) {
                if (res.error) throw new Error(res.error.message);
                var count = res.count || 0;
                if (count >= MAX_SAVES_PER_USER) {
                    throw new Error('Превышен лимит сохранений (максимум ' + MAX_SAVES_PER_USER + ')');
                }
                return sb.from('user_saves').insert({
                    user_id: user.id,
                    chapter: chapter,
                    save_name: name,
                    save_data: saveData,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }).select().single();
            }).then(function (res) {
                if (res.error) throw new Error(res.error.message);
                return { id: res.data.id, chapter: chapter, save_name: name };
            });
    }

    /**
     * Обновить существующее сохранение
     */
    function updateSave(saveId, saveData, saveName) {
        var user = Auth.getUser();
        if (!user) return Promise.reject(new Error('Необходимо войти в аккаунт'));
        var sb = SupabaseConfig.getClient();
        if (!sb) return Promise.reject(new Error('Supabase не настроен'));

        var updateObj = { save_data: saveData, updated_at: new Date().toISOString() };
        if (saveName) updateObj.save_name = saveName;

        return sb.from('user_saves')
            .update(updateObj)
            .eq('id', saveId)
            .eq('user_id', user.id)
            .then(function (res) {
                if (res.error) throw new Error(res.error.message);
                return true;
            });
    }

    // ─── Загрузка из облака ──────────────────────

    /**
     * Получить все сохранения текущего пользователя
     * @param {string} [chapter] — фильтр по главе (опционально)
     * @returns {Promise<Array>}
     */
    function listSaves(chapter) {
        var user = Auth.getUser();
        if (!user) return Promise.reject(new Error('Необходимо войти в аккаунт'));
        var sb = SupabaseConfig.getClient();
        if (!sb) return Promise.reject(new Error('Supabase не настроен'));

        var query = sb.from('user_saves')
            .select('id, chapter, save_name, created_at, updated_at')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false });

        if (chapter) query = query.eq('chapter', chapter);

        return query.then(function (res) {
            if (res.error) throw new Error(res.error.message);
            return (res.data || []).map(function (doc) {
                return {
                    id: doc.id,
                    chapter: doc.chapter,
                    save_name: doc.save_name,
                    created_at: doc.created_at,
                    updated_at: doc.updated_at
                };
            });
        });
    }

    /**
     * Загрузить конкретное сохранение
     * @param {string} saveId
     * @returns {Promise<Object>}
     */
    function loadSave(saveId) {
        var user = Auth.getUser();
        if (!user) return Promise.reject(new Error('Необходимо войти в аккаунт'));
        var sb = SupabaseConfig.getClient();
        if (!sb) return Promise.reject(new Error('Supabase не настроен'));

        return sb.from('user_saves')
            .select('*')
            .eq('id', saveId)
            .eq('user_id', user.id)
            .single()
            .then(function (res) {
                if (res.error) throw new Error('Сохранение не найдено');
                var doc = res.data;
                return {
                    id: doc.id,
                    chapter: doc.chapter,
                    save_name: doc.save_name,
                    save_data: doc.save_data,
                    created_at: doc.created_at,
                    updated_at: doc.updated_at
                };
            });
    }

    /**
     * Удалить сохранение
     */
    function deleteSave(saveId) {
        var user = Auth.getUser();
        if (!user) return Promise.reject(new Error('Необходимо войти в аккаунт'));
        var sb = SupabaseConfig.getClient();
        if (!sb) return Promise.reject(new Error('Supabase не настроен'));

        return sb.from('user_saves')
            .delete()
            .eq('id', saveId)
            .eq('user_id', user.id)
            .then(function (res) {
                if (res.error) throw new Error(res.error.message);
                return true;
            });
    }

    /**
     * Переименовать сохранение
     */
    function renameSave(saveId, newName) {
        var user = Auth.getUser();
        if (!user) return Promise.reject(new Error('Необходимо войти в аккаунт'));
        var sb = SupabaseConfig.getClient();
        if (!sb) return Promise.reject(new Error('Supabase не настроен'));

        return sb.from('user_saves')
            .update({ save_name: newName, updated_at: new Date().toISOString() })
            .eq('id', saveId)
            .eq('user_id', user.id)
            .then(function (res) {
                if (res.error) throw new Error(res.error.message);
                return true;
            });
    }

    // ─── UI: Модальное окно сохранений ───────────

    function showSavesModal(chapterFilter) {
        var user = Auth.getUser();
        if (!user) {
            Auth.showModal('login');
            return;
        }

        var modal = document.getElementById('authModal');
        var content = document.getElementById('authModalContent');
        content.innerHTML =
            '<h2 class="auth-title">Мои сохранения</h2>' +
            '<div id="savesFilterBar">' +
                '<button class="saves-filter-btn' + (!chapterFilter ? ' active' : '') + '" data-chapter="">Все</button>' +
                '<button class="saves-filter-btn' + (chapterFilter === 'ch1' ? ' active' : '') + '" data-chapter="ch1">Гл.1</button>' +
                '<button class="saves-filter-btn' + (chapterFilter === 'ch2' ? ' active' : '') + '" data-chapter="ch2">Гл.2</button>' +
                '<button class="saves-filter-btn' + (chapterFilter === 'ch3' ? ' active' : '') + '" data-chapter="ch3">Гл.3</button>' +
                '<button class="saves-filter-btn' + (chapterFilter === 'ch4' ? ' active' : '') + '" data-chapter="ch4">Гл.4</button>' +
            '</div>' +
            '<div id="savesList" class="saves-list"><div class="saves-loading">Загрузка...</div></div>';

        modal.style.display = 'flex';

        // Фильтры
        content.querySelectorAll('.saves-filter-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                content.querySelectorAll('.saves-filter-btn').forEach(function (b) { b.classList.remove('active'); });
                this.classList.add('active');
                loadSavesList(this.getAttribute('data-chapter') || null);
            });
        });

        loadSavesList(chapterFilter || null);
    }

    function loadSavesList(chapterFilter) {
        var listDiv = document.getElementById('savesList');
        if (!listDiv) return;
        listDiv.innerHTML = '<div class="saves-loading">Загрузка...</div>';

        listSaves(chapterFilter).then(function (saves) {
            if (saves.length === 0) {
                listDiv.innerHTML = '<div class="saves-empty">Нет сохранений</div>';
                return;
            }

            var html = '';
            saves.forEach(function (save) {
                var chapterLabel = getChapterLabel(save.chapter);
                var date = new Date(save.updated_at || save.created_at).toLocaleString('ru-RU');
                html +=
                    '<div class="save-item" data-save-id="' + save.id + '">' +
                        '<div class="save-item-info">' +
                            '<div class="save-item-name">' + escapeHtml(save.save_name) + '</div>' +
                            '<div class="save-item-meta">' + chapterLabel + ' · ' + date + '</div>' +
                        '</div>' +
                        '<div class="save-item-actions">' +
                            '<button class="save-action-btn save-load-btn" data-id="' + save.id + '" data-chapter="' + save.chapter + '" title="Загрузить в редактор">▶</button>' +
                            '<button class="save-action-btn save-download-btn" data-id="' + save.id + '" title="Скачать файл">⬇</button>' +
                            '<button class="save-action-btn save-publish-btn" data-id="' + save.id + '" title="Опубликовать в библиотеку">📢</button>' +
                            '<button class="save-action-btn save-rename-btn" data-id="' + save.id + '" title="Переименовать">✏</button>' +
                            '<button class="save-action-btn save-delete-btn" data-id="' + save.id + '" title="Удалить">✕</button>' +
                        '</div>' +
                    '</div>';
            });
            listDiv.innerHTML = html;

            // events
            listDiv.querySelectorAll('.save-load-btn').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var id = this.getAttribute('data-id');
                    var chapter = this.getAttribute('data-chapter');
                    onLoadCloudSave(id, chapter);
                });
            });
            listDiv.querySelectorAll('.save-download-btn').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    onDownloadCloudSave(this.getAttribute('data-id'));
                });
            });
            listDiv.querySelectorAll('.save-rename-btn').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    onRenameCloudSave(this.getAttribute('data-id'));
                });
            });
            listDiv.querySelectorAll('.save-publish-btn').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    if (typeof SaveLibrary !== 'undefined') {
                        SaveLibrary.showPublishFromCloudDialog(this.getAttribute('data-id'));
                    }
                });
            });
            listDiv.querySelectorAll('.save-delete-btn').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    onDeleteCloudSave(this.getAttribute('data-id'));
                });
            });
        }).catch(function (err) {
            listDiv.innerHTML = '<div class="saves-error">Ошибка: ' + escapeHtml(err.message) + '</div>';
        });
    }

    // ─── Действия с сохранениями ─────────────────

    function onLoadCloudSave(saveId, chapter) {
        var currentChapter = getCurrentChapter();
        if (currentChapter && currentChapter !== chapter) {
            var pageMap = {
                'ch1': 'deltarune1.html',
                'ch2': 'deltarune2.html',
                'ch3': 'deltarune3.html',
                'ch4': 'deltarune4.html',
                'ch1Demo': 'deltarune1Demo.html',
                'ch2Demo': 'deltarune2Demo.html'
            };
            if (pageMap[chapter]) {
                sessionStorage.setItem('pendingCloudSave', saveId);
                window.location.href = pageMap[chapter];
                return;
            }
        }

        loadSave(saveId).then(function (save) {
            Auth.hideModal();
            if (typeof EditorCore !== 'undefined' && EditorCore.loadFromText) {
                EditorCore.loadFromText(save.save_data, save.save_name);
            } else {
                alert('Откройте редактор нужной главы для загрузки сохранения.');
            }
        }).catch(function (err) {
            alert('Ошибка загрузки: ' + err.message);
        });
    }

    function onDownloadCloudSave(saveId) {
        loadSave(saveId).then(function (save) {
            var filename = 'filech' + save.chapter.replace('ch', '').replace('Demo', '_demo') + '_0';
            saveAs(new Blob([save.save_data], { type: 'application/octet-stream' }), filename);
        }).catch(function (err) {
            alert('Ошибка: ' + err.message);
        });
    }

    function onRenameCloudSave(saveId) {
        var newName = prompt('Новое имя сохранения:');
        if (!newName) return;
        renameSave(saveId, newName.trim()).then(function () {
            var activeFilter = document.querySelector('.saves-filter-btn.active');
            var chapter = activeFilter ? activeFilter.getAttribute('data-chapter') : null;
            loadSavesList(chapter || null);
        }).catch(function (err) {
            alert('Ошибка: ' + err.message);
        });
    }

    function onDeleteCloudSave(saveId) {
        if (!confirm('Удалить это сохранение?')) return;
        deleteSave(saveId).then(function () {
            var activeFilter = document.querySelector('.saves-filter-btn.active');
            var chapter = activeFilter ? activeFilter.getAttribute('data-chapter') : null;
            loadSavesList(chapter || null);
        }).catch(function (err) {
            alert('Ошибка: ' + err.message);
        });
    }

    // ─── UI: Кнопка "Сохранить в облако" ─────────

    function showSaveDialog(chapter, saveData) {
        var user = Auth.getUser();
        if (!user) {
            Auth.showModal('login');
            return;
        }

        var modal = document.getElementById('authModal');
        var content = document.getElementById('authModalContent');
        content.innerHTML =
            '<h2 class="auth-title">Сохранить в облако</h2>' +
            '<div id="authError" class="auth-error"></div>' +
            '<form id="cloudSaveForm">' +
                '<label class="auth-label">Название сохранения' +
                    '<input type="text" id="cloudSaveName" class="auth-input" ' +
                        'value="' + escapeHtml(chapter + ' — ' + new Date().toLocaleString('ru-RU')) + '" required>' +
                '</label>' +
                '<button type="submit" class="auth-btn auth-btn-full">Сохранить</button>' +
            '</form>';

        modal.style.display = 'flex';

        document.getElementById('cloudSaveForm').addEventListener('submit', function (e) {
            e.preventDefault();
            var name = document.getElementById('cloudSaveName').value.trim();
            var btn = this.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.textContent = 'Сохранение...';

            saveToDB(chapter, saveData, name).then(function () {
                Auth.hideModal();
                showToast('Сохранено в облако!');
            }).catch(function (err) {
                btn.disabled = false;
                btn.textContent = 'Сохранить';
                var errEl = document.getElementById('authError');
                if (errEl) {
                    errEl.textContent = 'Ошибка: ' + err.message;
                    errEl.style.display = 'block';
                }
            });
        });
    }

    // ─── Helpers ─────────────────────────────────

    function getCurrentChapter() {
        var path = window.location.pathname;
        if (path.indexOf('deltarune1Demo') >= 0) return 'ch1Demo';
        if (path.indexOf('deltarune2Demo') >= 0) return 'ch2Demo';
        if (path.indexOf('deltarune1') >= 0) return 'ch1';
        if (path.indexOf('deltarune2') >= 0) return 'ch2';
        if (path.indexOf('deltarune3') >= 0) return 'ch3';
        if (path.indexOf('deltarune4') >= 0) return 'ch4';
        return null;
    }

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

    function checkPendingSave() {
        var pendingId = sessionStorage.getItem('pendingCloudSave');
        if (pendingId) {
            sessionStorage.removeItem('pendingCloudSave');
            Auth.onAuthChange(function (user) {
                if (user) {
                    loadSave(pendingId).then(function (save) {
                        if (typeof EditorCore !== 'undefined' && EditorCore.loadFromText) {
                            EditorCore.loadFromText(save.save_data, save.save_name);
                        }
                    }).catch(function (err) {
                        console.error('Не удалось загрузить облачное сохранение:', err);
                    });
                }
            });
        }
    }

    return {
        saveToDB: saveToDB,
        updateSave: updateSave,
        listSaves: listSaves,
        loadSave: loadSave,
        deleteSave: deleteSave,
        renameSave: renameSave,
        showSavesModal: showSavesModal,
        showSaveDialog: showSaveDialog,
        checkPendingSave: checkPendingSave,
        getCurrentChapter: getCurrentChapter
    };
})();
