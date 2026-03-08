/**
 * Comments Module
 * Spamton Save Editor — комментарии к публичным сохранениям
 *
 * Зависимости: supabaseConfig.js, auth.js, profile.js
 * Таблица: comments
 */

var Comments = (function () {

    // ─── CRUD ────────────────────────────────────

    function addComment(saveId, text) {
        var user = Auth.getUser();
        if (!user) return Promise.reject('Необходима авторизация');
        if (!text || !text.trim()) return Promise.reject('Комментарий пуст');
        var sb = SupabaseConfig.getClient();
        if (!sb) return Promise.reject('Сервис недоступен');

        return UserProfile.getMyProfile().then(function (profile) {
            var p = profile || {};
            var doc = {
                save_id: saveId,
                user_id: user.id,
                author_name: p.display_name || user.email || 'Аноним',
                author_avatar: p.avatar || '',
                is_supporter: !!p.is_supporter,
                text: text.trim().substring(0, 1000),
                created_at: new Date().toISOString()
            };
            return sb.from('comments').insert(doc).select().single()
                .then(function (res) {
                    if (res.error) throw new Error(res.error.message);
                    return res.data;
                });
        });
    }

    function getComments(saveId, page, perPage) {
        page = page || 1;
        perPage = perPage || 20;
        var sb = SupabaseConfig.getClient();
        if (!sb) return Promise.resolve([]);

        var from = (page - 1) * perPage;
        var to   = from + perPage - 1;

        return sb.from('comments')
            .select('*')
            .eq('save_id', saveId)
            .order('created_at', { ascending: false })
            .range(from, to)
            .then(function (res) {
                return res.data || [];
            });
    }

    function getCommentCount(saveId) {
        var sb = SupabaseConfig.getClient();
        if (!sb) return Promise.resolve(0);
        return sb.from('comments')
            .select('id', { count: 'exact', head: true })
            .eq('save_id', saveId)
            .then(function (res) { return res.count || 0; });
    }

    function getCommentCounts(saveIds) {
        if (!saveIds || saveIds.length === 0) return Promise.resolve({});
        var sb = SupabaseConfig.getClient();
        if (!sb) return Promise.resolve({});

        return sb.from('comments')
            .select('save_id')
            .in('save_id', saveIds)
            .then(function (res) {
                var map = {};
                (res.data || []).forEach(function (r) {
                    map[r.save_id] = (map[r.save_id] || 0) + 1;
                });
                return map;
            }).catch(function () { return {}; });
    }

    function deleteComment(commentId, asAdmin) {
        var user = Auth.getUser();
        if (!user) return Promise.reject('Необходима авторизация');
        var sb = SupabaseConfig.getClient();
        if (!sb) return Promise.reject('Сервис недоступен');

        var query = sb.from('comments').delete().eq('id', commentId);
        if (!asAdmin) query = query.eq('user_id', user.id);
        return query.then(function (res) {
            if (res.error) throw new Error(res.error.message);
            return true;
        });
    }

    // ─── UI ──────────────────────────────────────

    function renderCommentsSection(saveId, container) {
        container.innerHTML =
            '<div class="comments-section">' +
                '<h3 class="comments-title">💬 Комментарии</h3>' +
                '<div id="commentsList-' + saveId + '" class="comments-list">' +
                    '<p class="comments-loading">Загрузка...</p>' +
                '</div>' +
                '<div id="commentsForm-' + saveId + '" class="comments-form-wrap"></div>' +
            '</div>';

        loadComments(saveId);
        renderCommentForm(saveId);
    }

    function loadComments(saveId) {
        var listEl = document.getElementById('commentsList-' + saveId);
        if (!listEl) return;

        getComments(saveId).then(function (comments) {
            if (!comments || comments.length === 0) {
                listEl.innerHTML = '<p class="comments-empty">Пока нет комментариев</p>';
                return;
            }
            var userId = Auth.getUser() ? Auth.getUser().id : null;
            var html = '';
            comments.forEach(function (c) {
                html += renderComment(c, userId);
            });
            listEl.innerHTML = html;

            // Wire delete buttons
            listEl.querySelectorAll('.comment-delete').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var cid = this.dataset.id;
                    var asAdmin = this.dataset.admin === '1';
                    if (!cid) return;
                    deleteComment(cid, asAdmin).then(function () {
                        loadComments(saveId);
                    }).catch(function (err) {
                        console.error('Delete comment error:', err);
                    });
                });
            });
        }).catch(function () {
            listEl.innerHTML = '<p class="comments-empty">Ошибка загрузки</p>';
        });
    }

    function renderComment(c, currentUserId) {
        var profile = { avatar: c.author_avatar, display_name: c.author_name, is_supporter: c.is_supporter };
        var dateStr = '';
        try {
            var d = c.created_at instanceof Date ? c.created_at : new Date(c.created_at);
            dateStr = d.toLocaleDateString('ru-RU') + ' ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        } catch (e) { dateStr = ''; }

        var deleteBtn = '';
        var canDelete = (currentUserId && c.user_id === currentUserId);
        var isAdminUser = (typeof Admin !== 'undefined' && Admin.isAdmin());
        if (canDelete || isAdminUser) {
            var idStr = c.id ? String(c.id) : '';
            var adminLabel = (!canDelete && isAdminUser) ? ' data-admin="1"' : '';
            deleteBtn = '<button class="comment-delete" data-id="' + idStr + '"' + adminLabel + ' title="Удалить">✕</button>';
        }

        var supporterBadge = (typeof UserProfile !== 'undefined') ? UserProfile.renderSupporterBadge(profile) : '';

        return '<div class="comment-item">' +
            '<div class="comment-avatar">' + UserProfile.renderAvatar(profile, 32) + '</div>' +
            '<div class="comment-body">' +
                '<div class="comment-header">' +
                    '<span class="comment-author' + (c.is_supporter ? ' comment-author-supporter' : '') + '">' +
                        UserProfile.escapeHtml(c.author_name || 'Аноним') +
                    '</span>' +
                    supporterBadge +
                    '<span class="comment-date">' + dateStr + '</span>' +
                    deleteBtn +
                '</div>' +
                '<div class="comment-text">' + UserProfile.escapeHtml(c.text) + '</div>' +
            '</div>' +
        '</div>';
    }

    function renderCommentForm(saveId) {
        var formWrap = document.getElementById('commentsForm-' + saveId);
        if (!formWrap) return;

        var user = Auth.getUser();
        if (!user) {
            formWrap.innerHTML = '<p class="comments-login-hint">Войдите, чтобы оставить комментарий</p>';
            return;
        }

        formWrap.innerHTML =
            '<form class="comment-form" id="commentForm-' + saveId + '">' +
                '<textarea class="comment-input" id="commentInput-' + saveId + '" placeholder="Написать комментарий..." maxlength="1000" rows="2"></textarea>' +
                '<button type="submit" class="auth-btn auth-btn-small comment-submit">Отправить</button>' +
            '</form>';

        document.getElementById('commentForm-' + saveId).addEventListener('submit', function (e) {
            e.preventDefault();
            var input = document.getElementById('commentInput-' + saveId);
            var text = input.value.trim();
            if (!text) return;

            var btn = this.querySelector('.comment-submit');
            btn.disabled = true;
            btn.textContent = '...';

            addComment(saveId, text).then(function () {
                input.value = '';
                btn.disabled = false;
                btn.textContent = 'Отправить';
                loadComments(saveId);
            }).catch(function (err) {
                btn.disabled = false;
                btn.textContent = 'Отправить';
                alert(typeof err === 'string' ? err : 'Ошибка');
            });
        });
    }

    // ─── Public API ──────────────────────────────

    return {
        addComment: addComment,
        getComments: getComments,
        getCommentCount: getCommentCount,
        getCommentCounts: getCommentCounts,
        deleteComment: deleteComment,
        renderCommentsSection: renderCommentsSection,
        loadComments: loadComments
    };
})();
