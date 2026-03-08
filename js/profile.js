/**
 * UserProfile Module
 * Spamton Save Editor — профиль пользователя (аватарка, описание)
 *
 * Зависимости: supabaseConfig.js, auth.js
 * Таблица: user_profiles
 */

var UserProfile = (function () {

    var cachedProfiles = {};

    // ─── CRUD ────────────────────────────────────

    function getProfile(userId) {
        if (cachedProfiles[userId]) {
            return Promise.resolve(cachedProfiles[userId]);
        }
        var sb = SupabaseConfig.getClient();
        if (!sb) return Promise.resolve(null);
        return sb.from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle()
            .then(function (res) {
                var doc = res.data || null;
                if (doc) cachedProfiles[userId] = doc;
                return doc;
            });
    }

    function getMyProfile() {
        var user = Auth.getUser();
        if (!user) return Promise.resolve(null);
        return getProfile(user.id);
    }

    function updateProfile(data) {
        var user = Auth.getUser();
        if (!user) return Promise.reject('Необходима авторизация');
        var sb = SupabaseConfig.getClient();
        if (!sb) return Promise.reject('Сервис недоступен');

        var update = {
            user_id: user.id,
            display_name: data.display_name || '',
            bio: data.bio || '',
            avatar: data.avatar || '',
            updated_at: new Date().toISOString()
        };

        delete cachedProfiles[user.id];

        return sb.from('user_profiles')
            .upsert(update, { onConflict: 'user_id' })
            .then(function (res) {
                if (res.error) throw new Error(res.error.message);
                cachedProfiles[user.id] = update;
                return update;
            });
    }

    // ─── Avatar helpers ──────────────────────────

    function readFileAsDataURL(file) {
        return new Promise(function (resolve, reject) {
            if (file.size > 512 * 1024) {
                reject('Файл слишком большой (макс. 512 КБ)');
                return;
            }
            var reader = new FileReader();
            reader.onload = function () { resolve(reader.result); };
            reader.onerror = function () { reject('Ошибка чтения файла'); };
            reader.readAsDataURL(file);
        });
    }

    function renderAvatar(profile, size) {
        size = size || 40;
        var supporterClass = (profile && profile.is_supporter) ? ' supporter-avatar' : '';
        if (profile && profile.avatar) {
            return '<img class="user-avatar' + supporterClass + '" src="' + escapeAttr(profile.avatar) +
                '" width="' + size + '" height="' + size + '" alt="avatar">';
        }
        var letter = '?';
        if (profile && profile.display_name) {
            letter = profile.display_name.charAt(0).toUpperCase();
        }
        return '<div class="user-avatar user-avatar-letter' + supporterClass + '" style="width:' + size +
            'px;height:' + size + 'px;font-size:' + Math.round(size * 0.5) +
            'px;line-height:' + size + 'px;">' + letter + '</div>';
    }

    function renderSupporterBadge(profile) {
        if (!profile || !profile.is_supporter) return '';
        return '<span class="supporter-badge" title="Supporter">★ Supporter</span>';
    }

    function isSupporter(profile) {
        return !!(profile && profile.is_supporter);
    }

    function escapeAttr(s) {
        return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    function escapeHtml(s) {
        return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    // ─── Profile Modal ───────────────────────────

    function showProfileModal(userId) {
        var targetId = userId;
        if (!targetId) {
            var user = Auth.getUser();
            if (!user) return;
            targetId = user.id;
        }
        var isOwn = Auth.getUser() && targetId === Auth.getUser().id;

        var overlay = document.getElementById('profileModal');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'profileModal';
            overlay.className = 'auth-modal-overlay';
            overlay.innerHTML = '<div class="auth-modal profile-modal"><button class="auth-modal-close" id="profileModalClose">&times;</button><div id="profileModalContent"></div></div>';
            document.body.appendChild(overlay);
            overlay.addEventListener('click', function (e) { if (e.target === overlay) hideProfileModal(); });
            document.getElementById('profileModalClose').addEventListener('click', hideProfileModal);
        }

        var content = document.getElementById('profileModalContent');
        content.innerHTML = '<p style="text-align:center;color:#888">Загрузка...</p>';
        overlay.style.display = 'flex';

        getProfile(targetId).then(function (profile) {
            if (isOwn) {
                renderProfileEditor(content, profile);
            } else {
                renderProfileView(content, profile, targetId);
            }
        }).catch(function () {
            content.innerHTML = '<p style="text-align:center;color:#ff4444">Ошибка загрузки профиля</p>';
        });
    }

    function hideProfileModal() {
        var overlay = document.getElementById('profileModal');
        if (overlay) overlay.style.display = 'none';
    }

    // ─── Profile View (чужой профиль) ────────────

    function renderProfileView(container, profile, userId) {
        var p = profile || {};
        var html =
            '<div class="profile-header">' +
                renderAvatar(p, 80) +
                '<div class="profile-info">' +
                    '<h2 class="profile-name">' + escapeHtml(p.display_name || 'Аноним') + ' ' + renderSupporterBadge(p) + '</h2>' +
                    '<div class="profile-bio">' + escapeHtml(p.bio || 'Нет описания') + '</div>' +
                '</div>' +
            '</div>';
        container.innerHTML = html;
    }

    // ─── Profile Editor (свой профиль) ───────────

    function renderProfileEditor(container, profile) {
        var p = profile || {};
        var supporterSection = p.is_supporter
            ? '<div class="supporter-status-bar"><span class="supporter-badge">★ Supporter</span> Спасибо за поддержку!</div>'
            : '<div class="supporter-promo"><a href="https://boosty.to/spamton" target="_blank" class="supporter-promo-link">★ Стать Supporter на Boosty</a></div>';
        var html =
            '<h2 class="auth-title">Мой профиль</h2>' +
            supporterSection +
            '<div id="profileError" class="auth-error"></div>' +
            '<div class="profile-header">' +
                '<div class="profile-avatar-wrap" id="avatarWrap">' +
                    renderAvatar(p, 80) +
                    '<label class="profile-avatar-edit" title="Изменить аватарку">' +
                        '<input type="file" accept="image/*" id="avatarFileInput" style="display:none">' +
                        '<span>✎</span>' +
                    '</label>' +
                '</div>' +
            '</div>' +
            '<form id="profileEditForm">' +
                '<input type="hidden" id="profileAvatar" value="' + escapeAttr(p.avatar || '') + '">' +
                '<label class="auth-label">Отображаемое имя' +
                    '<input type="text" id="profileDisplayName" class="auth-input" maxlength="30" value="' + escapeAttr(p.display_name || '') + '">' +
                '</label>' +
                '<label class="auth-label">О себе' +
                    '<textarea id="profileBio" class="auth-input profile-bio-input" maxlength="300" rows="4">' + escapeHtml(p.bio || '') + '</textarea>' +
                '</label>' +
                '<button type="submit" class="auth-btn auth-btn-full">Сохранить</button>' +
            '</form>';
        container.innerHTML = html;

        // Wire avatar file input
        document.getElementById('avatarFileInput').addEventListener('change', function (e) {
            var file = e.target.files[0];
            if (!file) return;
            readFileAsDataURL(file).then(function (dataUrl) {
                document.getElementById('profileAvatar').value = dataUrl;
                var wrap = document.getElementById('avatarWrap');
                wrap.querySelector('.user-avatar').outerHTML =
                    '<img class="user-avatar" src="' + dataUrl + '" width="80" height="80" alt="avatar">';
            }).catch(function (err) {
                showProfileError(err);
            });
        });

        // Wire form
        document.getElementById('profileEditForm').addEventListener('submit', function (e) {
            e.preventDefault();
            showProfileError('');
            var data = {
                display_name: document.getElementById('profileDisplayName').value.trim(),
                bio: document.getElementById('profileBio').value.trim(),
                avatar: document.getElementById('profileAvatar').value
            };
            var btn = this.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.textContent = 'Сохранение...';

            updateProfile(data).then(function () {
                btn.disabled = false;
                btn.textContent = 'Сохранено ✓';
                setTimeout(function () { btn.textContent = 'Сохранить'; }, 2000);
                // Update auth bar avatar
                updateAuthBarAvatar(data);
            }).catch(function (err) {
                btn.disabled = false;
                btn.textContent = 'Сохранить';
                showProfileError(typeof err === 'string' ? err : 'Ошибка сохранения');
            });
        });
    }

    function showProfileError(msg) {
        var el = document.getElementById('profileError');
        if (el) {
            el.textContent = msg;
            el.style.display = msg ? 'block' : 'none';
        }
    }

    function updateAuthBarAvatar(profileData) {
        var avatarEl = document.getElementById('authBarAvatar');
        if (avatarEl) {
            avatarEl.outerHTML = renderAvatar(profileData, 28);
            // Re-assign id and click handler
            var newAvatar = document.querySelector('#authBar-user .user-avatar');
            if (newAvatar) {
                newAvatar.id = 'authBarAvatar';
                newAvatar.style.cursor = 'pointer';
                newAvatar.addEventListener('click', function () {
                    showProfileModal();
                });
            }
        }
        var nameEl = document.getElementById('authUserEmail');
        if (nameEl && profileData.display_name) {
            nameEl.textContent = profileData.display_name;
        }
    }

    // ─── Public API ──────────────────────────────

    return {
        getProfile: getProfile,
        getMyProfile: getMyProfile,
        updateProfile: updateProfile,
        renderAvatar: renderAvatar,
        renderSupporterBadge: renderSupporterBadge,
        isSupporter: isSupporter,
        showProfileModal: showProfileModal,
        hideProfileModal: hideProfileModal,
        escapeHtml: escapeHtml
    };
})();
