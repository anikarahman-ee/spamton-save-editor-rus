/**
 * Admin Module
 * Spamton Save Editor — административная панель
 *
 * Зависимости: supabaseConfig.js, auth.js, profile.js
 * Функции: управление ролями, удаление сейвов, жалобы, удаление комментариев
 */

var Admin = (function () {

    // ─── Конфигурация администраторов ─────────────
    // Список display_name администраторов (сверяется с профилем)
    var ADMIN_NAMES = ['SpaceAndrey'];

    var _isAdmin = false;
    var _adminChecked = false;

    // ─── Проверка прав ───────────────────────────

    /**
     * Проверить, является ли текущий пользователь админом
     * Сначала проверяет кэш, затем profile.role === 'admin' или display_name в ADMIN_NAMES
     */
    function isAdmin() {
        return _isAdmin;
    }

    function checkAdmin() {
        var user = Auth.getUser();
        if (!user) {
            _isAdmin = false;
            _adminChecked = true;
            return Promise.resolve(false);
        }
        if (_adminChecked) return Promise.resolve(_isAdmin);

        return UserProfile.getProfile(user.id).then(function (profile) {
            if (profile && profile.role === 'admin') {
                _isAdmin = true;
            } else if (profile && ADMIN_NAMES.indexOf(profile.display_name) >= 0) {
                _isAdmin = true;
                // Автоматически устанавливаем роль admin
                var sb = SupabaseConfig.getClient();
                if (sb) {
                    sb.from('user_profiles')
                        .update({ role: 'admin' })
                        .eq('user_id', user.id)
                        .then(function () {}).catch(function () {});
                }
            } else {
                _isAdmin = false;
            }
            _adminChecked = true;
            return _isAdmin;
        }).catch(function () {
            _isAdmin = false;
            _adminChecked = true;
            return false;
        });
    }

    function resetAdminCache() {
        _isAdmin = false;
        _adminChecked = false;
    }

    // ─── Управление ролями ───────────────────────

    /**
     * Установить роль пользователю
     * @param {string} userId
     * @param {string} role — 'admin', 'moderator', 'supporter', '' (обычный)
     */
    function setUserRole(userId, role) {
        if (!_isAdmin) return Promise.reject('Нет прав администратора');
        var sb = SupabaseConfig.getClient();
        if (!sb) return Promise.reject('Сервис недоступен');

        var update = { role: role };
        if (role === 'supporter') update.is_supporter = true;
        return sb.from('user_profiles')
            .update(update)
            .eq('user_id', userId)
            .then(function (res) {
                if (res.error) throw new Error(res.error.message);
                return true;
            });
    }

    /**
     * Снять supporter статус
     */
    function removeSupporter(userId) {
        if (!_isAdmin) return Promise.reject('Нет прав администратора');
        var sb = SupabaseConfig.getClient();
        if (!sb) return Promise.reject('Сервис недоступен');
        return sb.from('user_profiles')
            .update({ is_supporter: false, role: null })
            .eq('user_id', userId)
            .then(function (res) {
                if (res.error) throw new Error(res.error.message);
                return true;
            });
    }

    /**
     * Получить список всех пользователей
     */
    function getAllUsers() {
        if (!_isAdmin) return Promise.reject('Нет прав администратора');
        var sb = SupabaseConfig.getClient();
        if (!sb) return Promise.reject('Сервис недоступен');
        return sb.from('user_profiles')
            .select('*')
            .order('created_at', { ascending: false })
            .then(function (res) {
                if (res.error) throw new Error(res.error.message);
                return res.data || [];
            });
    }

    // ─── Удаление сейвов (админ) ─────────────────

    /**
     * Удалить любой публичный сейв (без проверки user_id)
     */
    function adminDeleteSave(saveId) {
        if (!_isAdmin) return Promise.reject('Нет прав администратора');
        var sb = SupabaseConfig.getClient();
        if (!sb) return Promise.reject('Сервис недоступен');
        return sb.from('public_saves')
            .delete()
            .eq('id', saveId)
            .then(function (res) {
                if (res.error) throw new Error(res.error.message);
                return true;
            });
    }

    // ─── Удаление комментариев (админ) ───────────

    /**
     * Удалить любой комментарий (без проверки user_id)
     */
    function adminDeleteComment(commentId) {
        if (!_isAdmin) return Promise.reject('Нет прав администратора');
        var sb = SupabaseConfig.getClient();
        if (!sb) return Promise.reject('Сервис недоступен');
        return sb.from('comments')
            .delete()
            .eq('id', commentId)
            .then(function (res) {
                if (res.error) throw new Error(res.error.message);
                return true;
            });
    }

    // ─── Жалобы / Репорты ────────────────────────

    /**
     * Отправить жалобу на сохранение
     */
    function reportSave(saveId, reason) {
        var user = Auth.getUser();
        if (!user) return Promise.reject('Необходима авторизация');
        if (!reason || !reason.trim()) return Promise.reject('Укажите причину жалобы');
        var sb = SupabaseConfig.getClient();
        if (!sb) return Promise.reject('Сервис недоступен');

        return sb.from('reports').insert({
            type: 'save',
            target_id: saveId,
            reporter_id: user.id,
            reason: reason.trim().substring(0, 500),
            status: 'pending',
            created_at: new Date().toISOString()
        }).then(function (res) {
            if (res.error) throw new Error(res.error.message);
            return true;
        });
    }

    /**
     * Получить все жалобы (для админа)
     */
    function getReports(statusFilter) {
        if (!_isAdmin) return Promise.reject('Нет прав администратора');
        var sb = SupabaseConfig.getClient();
        if (!sb) return Promise.reject('Сервис недоступен');

        var query = sb.from('reports').select('*').order('created_at', { ascending: false });
        if (statusFilter) query = query.eq('status', statusFilter);
        return query.then(function (res) {
            if (res.error) throw new Error(res.error.message);
            return res.data || [];
        });
    }

    /**
     * Обработать жалобу (изменить статус)
     */
    function resolveReport(reportId, status) {
        if (!_isAdmin) return Promise.reject('Нет прав администратора');
        var sb = SupabaseConfig.getClient();
        if (!sb) return Promise.reject('Сервис недоступен');
        return sb.from('reports')
            .update({ status: status, resolved_at: new Date().toISOString() })
            .eq('id', reportId)
            .then(function (res) {
                if (res.error) throw new Error(res.error.message);
                return true;
            });
    }

    /**
     * Удалить жалобу
     */
    function deleteReport(reportId) {
        if (!_isAdmin) return Promise.reject('Нет прав администратора');
        var sb = SupabaseConfig.getClient();
        if (!sb) return Promise.reject('Сервис недоступен');
        return sb.from('reports').delete().eq('id', reportId)
            .then(function (res) {
                if (res.error) throw new Error(res.error.message);
                return true;
            });
    }

    // ─── Предложения ─────────────────────────────

    /**
     * Получить все предложения (для админа)
     */
    function getSuggestions(statusFilter) {
        if (!_isAdmin) return Promise.reject('Нет прав администратора');
        var sb = SupabaseConfig.getClient();
        if (!sb) return Promise.reject('Сервис недоступен');

        var query = sb.from('suggestions').select('*').order('created_at', { ascending: false });
        if (statusFilter) query = query.eq('status', statusFilter);
        return query.then(function (res) {
            if (res.error) throw new Error(res.error.message);
            return res.data || [];
        });
    }

    /**
     * Обработать предложение
     */
    function resolveSuggestion(suggestionId, status, response) {
        if (!_isAdmin) return Promise.reject('Нет прав администратора');
        var sb = SupabaseConfig.getClient();
        if (!sb) return Promise.reject('Сервис недоступен');
        var updateData = { status: status, resolved_at: new Date().toISOString() };
        if (response) updateData.admin_response = response;
        return sb.from('suggestions').update(updateData).eq('id', suggestionId)
            .then(function (res) {
                if (res.error) throw new Error(res.error.message);
                return true;
            });
    }

    /**
     * Удалить предложение
     */
    function deleteSuggestion(suggestionId) {
        if (!_isAdmin) return Promise.reject('Нет прав администратора');
        var sb = SupabaseConfig.getClient();
        if (!sb) return Promise.reject('Сервис недоступен');
        return sb.from('suggestions').delete().eq('id', suggestionId)
            .then(function (res) {
                if (res.error) throw new Error(res.error.message);
                return true;
            });
    }

    // ─── UI: Диалог жалобы ───────────────────────

    function showReportModal(saveId) {
        var user = Auth.getUser();
        if (!user) { Auth.showModal('login'); return; }

        var modal = document.getElementById('authModal');
        var content = document.getElementById('authModalContent');
        content.innerHTML =
            '<h2 class="auth-title">Пожаловаться</h2>' +
            '<div id="authError" class="auth-error"></div>' +
            '<form id="reportForm">' +
                '<label class="auth-label">Причина жалобы' +
                    '<select id="reportReason" class="auth-input" required>' +
                        '<option value="">Выберите причину</option>' +
                        '<option value="spam">Спам</option>' +
                        '<option value="inappropriate">Неприемлемый контент</option>' +
                        '<option value="broken">Нерабочий файл</option>' +
                        '<option value="duplicate">Дубликат</option>' +
                        '<option value="other">Другое</option>' +
                    '</select>' +
                '</label>' +
                '<label class="auth-label">Комментарий (необязательно)' +
                    '<textarea id="reportComment" class="auth-input auth-textarea" rows="3" maxlength="500" ' +
                        'placeholder="Добавьте подробности..."></textarea>' +
                '</label>' +
                '<button type="submit" class="auth-btn auth-btn-full" style="background:#ff4444">Отправить жалобу</button>' +
            '</form>';

        modal.style.display = 'flex';

        document.getElementById('reportForm').addEventListener('submit', function (e) {
            e.preventDefault();
            var reason = document.getElementById('reportReason').value;
            var comment = document.getElementById('reportComment').value.trim();
            if (!reason) {
                showReportError('Выберите причину жалобы');
                return;
            }
            var fullReason = reason + (comment ? ': ' + comment : '');
            var btn = this.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.textContent = 'Отправка...';

            reportSave(saveId, fullReason).then(function () {
                Auth.hideModal();
                showToast('Жалоба отправлена. Спасибо!');
            }).catch(function (err) {
                btn.disabled = false;
                btn.textContent = 'Отправить жалобу';
                showReportError(typeof err === 'string' ? err : err.message || 'Ошибка');
            });
        });
    }

    function showReportError(msg) {
        var el = document.getElementById('authError');
        if (el) {
            el.textContent = msg;
            el.style.display = msg ? 'block' : 'none';
        }
    }

    // ─── UI: Диалог предложения ──────────────────

    function showSuggestionModal() {
        var user = Auth.getUser();
        if (!user) { Auth.showModal('login'); return; }

        var modal = document.getElementById('authModal');
        var content = document.getElementById('authModalContent');
        content.innerHTML =
            '<h2 class="auth-title">Предложить идею</h2>' +
            '<div id="authError" class="auth-error"></div>' +
            '<form id="suggestionForm">' +
                '<label class="auth-label">Категория' +
                    '<select id="suggestionCategory" class="auth-input" required>' +
                        '<option value="">Выберите категорию</option>' +
                        '<option value="feature">Новая функция</option>' +
                        '<option value="improvement">Улучшение</option>' +
                        '<option value="bugfix">Исправление ошибки</option>' +
                        '<option value="design">Дизайн / UI</option>' +
                        '<option value="other">Другое</option>' +
                    '</select>' +
                '</label>' +
                '<label class="auth-label">Заголовок' +
                    '<input type="text" id="suggestionTitle" class="auth-input" required maxlength="100" ' +
                        'placeholder="Кратко опишите идею">' +
                '</label>' +
                '<label class="auth-label">Описание' +
                    '<textarea id="suggestionDesc" class="auth-input auth-textarea" rows="5" maxlength="2000" required ' +
                        'placeholder="Подробно опишите ваше предложение..."></textarea>' +
                '</label>' +
                '<button type="submit" class="auth-btn auth-btn-full">Отправить предложение</button>' +
            '</form>';

        modal.style.display = 'flex';

        document.getElementById('suggestionForm').addEventListener('submit', function (e) {
            e.preventDefault();
            var category = document.getElementById('suggestionCategory').value;
            var title = document.getElementById('suggestionTitle').value.trim();
            var desc = document.getElementById('suggestionDesc').value.trim();

            if (!category) { showReportError('Выберите категорию'); return; }
            if (!title) { showReportError('Введите заголовок'); return; }
            if (!desc) { showReportError('Введите описание'); return; }

            var btn = this.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.textContent = 'Отправка...';

            submitSuggestion(category, title, desc).then(function () {
                Auth.hideModal();
                showToast('Предложение отправлено! Спасибо!');
            }).catch(function (err) {
                btn.disabled = false;
                btn.textContent = 'Отправить предложение';
                showReportError(typeof err === 'string' ? err : err.message || 'Ошибка');
            });
        });
    }

    function submitSuggestion(category, title, description) {
        var user = Auth.getUser();
        if (!user) return Promise.reject('Необходима авторизация');
        var sb = SupabaseConfig.getClient();
        if (!sb) return Promise.reject('Сервис недоступен');

        return UserProfile.getMyProfile().then(function (profile) {
            var p = profile || {};
            return sb.from('suggestions').insert({
                user_id: user.id,
                author_name: p.display_name || user.email || 'Аноним',
                category: category,
                title: title,
                description: description,
                status: 'pending',
                created_at: new Date().toISOString()
            }).then(function (res) {
                if (res.error) throw new Error(res.error.message);
                return true;
            });
        });
    }

    // ─── Helpers ─────────────────────────────────

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

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ─── Public API ──────────────────────────────

    return {
        isAdmin: isAdmin,
        checkAdmin: checkAdmin,
        resetAdminCache: resetAdminCache,
        setUserRole: setUserRole,
        removeSupporter: removeSupporter,
        getAllUsers: getAllUsers,
        adminDeleteSave: adminDeleteSave,
        adminDeleteComment: adminDeleteComment,
        reportSave: reportSave,
        getReports: getReports,
        resolveReport: resolveReport,
        deleteReport: deleteReport,
        getSuggestions: getSuggestions,
        resolveSuggestion: resolveSuggestion,
        deleteSuggestion: deleteSuggestion,
        showReportModal: showReportModal,
        showSuggestionModal: showSuggestionModal,
        submitSuggestion: submitSuggestion,
        escapeHtml: escapeHtml
    };
})();
