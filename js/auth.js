/**
 * Auth Module
 * Spamton Save Editor — регистрация, авторизация, управление аккаунтом
 *
 * Зависимости: supabaseConfig.js (SupabaseConfig), auth.css
 * Методы авторизации: Email + пароль, Google OAuth
 * Бэкенд: Supabase Auth
 */

var Auth = (function () {

    var currentUser = null;
    var onAuthChangeCallbacks = [];

    // ─── Инициализация ───────────────────────────

    function init() {
        var sb = SupabaseConfig.getClient();
        if (!sb) return;

        renderAuthBar();
        renderAuthModal();
        wireEvents();

        // Подписка на изменения сессии
        sb.auth.onAuthStateChange(function (event, session) {
            currentUser = session ? session.user : null;
            updateAuthUI();
            onAuthChangeCallbacks.forEach(function (cb) { cb(currentUser); });
        });

        // Проверяем текущую сессию
        sb.auth.getSession().then(function (res) {
            currentUser = (res.data && res.data.session) ? res.data.session.user : null;
            updateAuthUI();
            if (currentUser) {
                onAuthChangeCallbacks.forEach(function (cb) { cb(currentUser); });
            }
        });
    }

    // ─── Подписка на изменения авторизации ───────

    function onAuthChange(callback) {
        onAuthChangeCallbacks.push(callback);
        if (currentUser) callback(currentUser);
    }

    function getUser() {
        return currentUser;
    }

    // ─── Рендер UI ───────────────────────────────

    function renderAuthBar() {
        var bar = document.createElement('div');
        bar.id = 'authBar';
        bar.innerHTML =
            '<div id="authBar-inner">' +
                '<div id="authBar-guest">' +
                    '<button class="auth-btn" id="authLoginBtn">Войти</button>' +
                    '<button class="auth-btn auth-btn-outline" id="authRegisterBtn">Регистрация</button>' +
                '</div>' +
                '<div id="authBar-user" style="display:none">' +
                    '<div id="authBarAvatar" class="user-avatar user-avatar-letter" style="width:28px;height:28px;font-size:14px;line-height:28px;cursor:pointer;" title="Мой профиль">?</div>' +
                    '<span id="authUserEmail"></span>' +
                    '<button class="auth-btn auth-btn-small" id="authProfileBtn">Профиль</button>' +
                    '<a href="library.html" class="auth-btn auth-btn-small auth-btn-outline" id="authLibraryBtn">Библиотека</a>' +
                    '<button class="auth-btn auth-btn-small" id="authMySavesBtn">Мои сохранения</button>' +
                    '<a href="admin.html" class="auth-btn auth-btn-small auth-btn-outline" id="authAdminBtn" style="display:none;">Админ</a>' +
                    '<button class="auth-btn auth-btn-outline auth-btn-small" id="authLogoutBtn">Выйти</button>' +
                '</div>' +
            '</div>';
        document.body.insertBefore(bar, document.body.firstChild);
    }

    function renderAuthModal() {
        var modal = document.createElement('div');
        modal.id = 'authModal';
        modal.className = 'auth-modal-overlay';
        modal.style.display = 'none';
        modal.innerHTML =
            '<div class="auth-modal">' +
                '<button class="auth-modal-close" id="authModalClose">&times;</button>' +
                '<div id="authModalContent"></div>' +
            '</div>';
        document.body.appendChild(modal);
    }

    function wireEvents() {
        document.getElementById('authLoginBtn').addEventListener('click', function () {
            showModal('login');
        });
        document.getElementById('authRegisterBtn').addEventListener('click', function () {
            showModal('register');
        });
        document.getElementById('authLogoutBtn').addEventListener('click', logout);
        document.getElementById('authModalClose').addEventListener('click', hideModal);
        document.getElementById('authModal').addEventListener('click', function (e) {
            if (e.target === this) hideModal();
        });
        document.getElementById('authMySavesBtn').addEventListener('click', function () {
            if (typeof CloudSaves !== 'undefined') {
                CloudSaves.showSavesModal();
            }
        });
        document.getElementById('authProfileBtn').addEventListener('click', function () {
            if (typeof UserProfile !== 'undefined') {
                UserProfile.showProfileModal();
            }
        });
        document.getElementById('authBarAvatar').addEventListener('click', function () {
            if (typeof UserProfile !== 'undefined') {
                UserProfile.showProfileModal();
            }
        });
    }

    // ─── Модальное окно ──────────────────────────

    function showModal(mode) {
        var content = document.getElementById('authModalContent');
        if (mode === 'login') {
            content.innerHTML = renderLoginForm();
            wireLoginForm();
        } else if (mode === 'register') {
            content.innerHTML = renderRegisterForm();
            wireRegisterForm();
        }
        document.getElementById('authModal').style.display = 'flex';
    }

    function hideModal() {
        document.getElementById('authModal').style.display = 'none';
    }

    function renderLoginForm() {
        return '<h2 class="auth-title">Вход в аккаунт</h2>' +
            '<div id="authError" class="auth-error"></div>' +
            '<form id="authLoginForm">' +
                '<label class="auth-label">Email' +
                    '<input type="email" id="loginEmail" class="auth-input" required autocomplete="email">' +
                '</label>' +
                '<label class="auth-label">Пароль' +
                    '<input type="password" id="loginPassword" class="auth-input" required autocomplete="current-password">' +
                '</label>' +
                '<button type="submit" class="auth-btn auth-btn-full">Войти</button>' +
            '</form>' +
            '<div class="auth-divider"><span>или</span></div>' +
            '<button class="auth-btn auth-btn-google auth-btn-full" id="googleLoginBtn">' +
                '<svg width="18" height="18" viewBox="0 0 48 48" style="vertical-align:middle;margin-right:8px">' +
                    '<path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>' +
                    '<path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>' +
                    '<path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>' +
                    '<path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>' +
                '</svg>' +
                'Войти через Google' +
            '</button>' +
            '<p class="auth-switch">Нет аккаунта? <a href="#" id="switchToRegister">Зарегистрироваться</a></p>';
    }

    function renderRegisterForm() {
        return '<h2 class="auth-title">Регистрация</h2>' +
            '<div id="authError" class="auth-error"></div>' +
            '<form id="authRegisterForm">' +
                '<label class="auth-label">Email' +
                    '<input type="email" id="regEmail" class="auth-input" required autocomplete="email">' +
                '</label>' +
                '<label class="auth-label">Пароль (мин. 6 символов)' +
                    '<input type="password" id="regPassword" class="auth-input" required minlength="6" autocomplete="new-password">' +
                '</label>' +
                '<label class="auth-label">Повторите пароль' +
                    '<input type="password" id="regPasswordConfirm" class="auth-input" required minlength="6" autocomplete="new-password">' +
                '</label>' +
                '<button type="submit" class="auth-btn auth-btn-full">Зарегистрироваться</button>' +
            '</form>' +
            '<div class="auth-divider"><span>или</span></div>' +
            '<button class="auth-btn auth-btn-google auth-btn-full" id="googleRegBtn">' +
                '<svg width="18" height="18" viewBox="0 0 48 48" style="vertical-align:middle;margin-right:8px">' +
                    '<path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>' +
                    '<path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>' +
                    '<path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>' +
                    '<path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>' +
                '</svg>' +
                'Войти через Google' +
            '</button>' +
            '<p class="auth-switch">Уже есть аккаунт? <a href="#" id="switchToLogin">Войти</a></p>';
    }

    // ─── Привязка форм ───────────────────────────

    function wireLoginForm() {
        document.getElementById('authLoginForm').addEventListener('submit', function (e) {
            e.preventDefault();
            loginWithEmail(
                document.getElementById('loginEmail').value.trim(),
                document.getElementById('loginPassword').value
            );
        });
        document.getElementById('googleLoginBtn').addEventListener('click', loginWithGoogle);
        document.getElementById('switchToRegister').addEventListener('click', function (e) {
            e.preventDefault();
            showModal('register');
        });
    }

    function wireRegisterForm() {
        document.getElementById('authRegisterForm').addEventListener('submit', function (e) {
            e.preventDefault();
            var pass = document.getElementById('regPassword').value;
            var confirm = document.getElementById('regPasswordConfirm').value;
            if (pass !== confirm) {
                showError('Пароли не совпадают');
                return;
            }
            registerWithEmail(
                document.getElementById('regEmail').value.trim(),
                pass
            );
        });
        document.getElementById('googleRegBtn').addEventListener('click', loginWithGoogle);
        document.getElementById('switchToLogin').addEventListener('click', function (e) {
            e.preventDefault();
            showModal('login');
        });
    }

    // ─── Auth Actions ────────────────────────────

    function loginWithEmail(email, password) {
        var sb = SupabaseConfig.getClient();
        if (!sb) return;
        showError('');
        setLoading(true);

        sb.auth.signInWithPassword({ email: email, password: password })
            .then(function (res) {
                setLoading(false);
                if (res.error) {
                    showError(translateAuthError(res.error.message));
                    return;
                }
                // onAuthStateChange обновит currentUser и UI
                hideModal();
            })
            .catch(function (err) {
                setLoading(false);
                showError(translateAuthError(err.message || String(err)));
            });
    }

    function registerWithEmail(email, password) {
        var sb = SupabaseConfig.getClient();
        if (!sb) return;
        showError('');
        setLoading(true);

        sb.auth.signUp({ email: email, password: password })
            .then(function (res) {
                setLoading(false);
                if (res.error) {
                    showError(translateAuthError(res.error.message));
                    return;
                }
                // Если подтверждение email включено — сессии нет
                if (res.data && res.data.session) {
                    hideModal();
                } else {
                    showError('Письмо с подтверждением отправлено на ' + email + '. Проверьте почту.');
                }
            })
            .catch(function (err) {
                setLoading(false);
                showError(translateAuthError(err.message || String(err)));
            });
    }

    function loginWithGoogle() {
        var sb = SupabaseConfig.getClient();
        if (!sb) return;

        sb.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.href }
        }).catch(function (err) {
            console.error('Google OAuth error:', err);
        });
    }

    function logout() {
        var sb = SupabaseConfig.getClient();
        if (!sb) return;
        sb.auth.signOut().then(function () {
            currentUser = null;
            updateAuthUI();
            onAuthChangeCallbacks.forEach(function (cb) { cb(null); });
        });
    }

    // ─── Helpers ─────────────────────────────────

    function updateAuthUI() {
        var guestDiv = document.getElementById('authBar-guest');
        var userDiv = document.getElementById('authBar-user');
        var emailSpan = document.getElementById('authUserEmail');

        if (!guestDiv || !userDiv) return;

        if (currentUser) {
            guestDiv.style.display = 'none';
            userDiv.style.display = 'flex';
            emailSpan.textContent = currentUser.email || 'Пользователь';
            // Load profile and update avatar/name
            if (typeof UserProfile !== 'undefined') {
                UserProfile.getProfile(currentUser.id).then(function (profile) {
                    if (profile) {
                    if (profile.display_name) emailSpan.textContent = profile.display_name;
                    var avatarEl = document.getElementById('authBarAvatar');
                        if (avatarEl && profile.avatar) {
                            var safeAvatar = profile.avatar.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
                            var supporterCls = profile.is_supporter ? ' supporter-avatar' : '';
                            avatarEl.outerHTML = '<img id="authBarAvatar" class="user-avatar' + supporterCls + '" src="' + safeAvatar + '" width="28" height="28" alt="avatar" style="cursor:pointer;border-radius:50%;">';
                            document.getElementById('authBarAvatar').addEventListener('click', function () {
                                UserProfile.showProfileModal();
                            });
                        } else if (avatarEl && profile.display_name) {
                            avatarEl.textContent = profile.display_name.charAt(0).toUpperCase();
                            if (profile.is_supporter) avatarEl.classList.add('supporter-avatar');
                        }
                        // Show supporter badge next to name
                        if (profile.is_supporter && emailSpan) {
                            var existingBadge = document.querySelector('#authBar-user .supporter-badge');
                            if (!existingBadge) {
                                var badge = document.createElement('span');
                                badge.className = 'supporter-badge';
                                badge.title = 'Supporter';
                                badge.textContent = '★';
                                emailSpan.parentNode.insertBefore(badge, emailSpan.nextSibling);
                            }
                        }
                        // Show admin badge and button
                        if (profile.role === 'admin') {
                            var adminBtn = document.getElementById('authAdminBtn');
                            if (adminBtn) adminBtn.style.display = '';
                            var existingAdminBadge = document.querySelector('#authBar-user .admin-badge');
                            if (!existingAdminBadge && emailSpan) {
                                var abadge = document.createElement('span');
                                abadge.className = 'admin-badge';
                                abadge.title = 'Администратор';
                                abadge.textContent = 'ADM';
                                emailSpan.parentNode.insertBefore(abadge, emailSpan.nextSibling);
                            }
                        }
                    }
                }).catch(function () {});
            }
        } else {
            guestDiv.style.display = 'flex';
            userDiv.style.display = 'none';
        }
    }

    function showError(msg) {
        var el = document.getElementById('authError');
        if (el) {
            el.textContent = msg;
            el.style.display = msg ? 'block' : 'none';
        }
    }

    function setLoading(loading) {
        var btns = document.querySelectorAll('#authModalContent button[type="submit"]');
        btns.forEach(function (btn) {
            btn.disabled = loading;
            if (loading) {
                btn.dataset.originalText = btn.textContent;
                btn.textContent = 'Загрузка...';
            } else if (btn.dataset.originalText) {
                btn.textContent = btn.dataset.originalText;
            }
        });
    }

    function translateAuthError(msg) {
        var translations = {
            'invalid username/password': 'Неверный email или пароль',
            'invalid username': 'Неверный email или пароль',
            'invalid password': 'Неверный email или пароль',
            'name already in use': 'Пользователь с таким email уже зарегистрирован',
            'password must be between 6 and 128 characters': 'Пароль должен быть от 6 до 128 символов',
            'invalid email': 'Неверный формат email'
        };
        var lower = msg.toLowerCase();
        for (var key in translations) {
            if (lower.indexOf(key) >= 0) return translations[key];
        }
        return msg;
    }

    return {
        init: init,
        getUser: getUser,
        onAuthChange: onAuthChange,
        showModal: showModal,
        hideModal: hideModal
    };
})();
