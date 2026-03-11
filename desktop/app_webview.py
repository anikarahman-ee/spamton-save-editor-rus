#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Deltarune Save Editor — Десктопная версия (WebView)
Тот же веб-интерфейс, но с автопоиском и прямой записью сейвов.
"""

import webview
import os
import sys
import json
import shutil
import datetime
import threading
from http.server import HTTPServer, SimpleHTTPRequestHandler
import urllib.parse
import mimetypes

# ─── Пути ─────────────────────────────────────────────
def get_web_root():
    """Корень проекта (где лежат deltarune*.html, js/, css/ и т.д.)"""
    if getattr(sys, 'frozen', False):
        # Запущен как .exe — ресурсы лежат рядом с exe
        return os.path.join(sys._MEIPASS, 'web')
    else:
        # Запущен как .py — ресурсы в родительской папке
        return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SAVE_DIR = os.path.join(os.environ.get("LOCALAPPDATA", ""), "DELTARUNE")
WEB_ROOT = get_web_root()

# ─── Локальный HTTP-сервер ─────────────────────────────
class LocalHandler(SimpleHTTPRequestHandler):
    """Подаёт файлы из WEB_ROOT, плюс API-эндпоинты для работы с сейвами."""

    _launcher_html = None  # будет установлен после запуска сервера

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WEB_ROOT, **kwargs)

    def log_message(self, format, *args):
        pass  # Без логов, не спамить в консоль

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        # ─── Главная страница launcher ───
        if path in ("/desktop-launcher.html", "/"):
            data = self.__class__._launcher_html.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", len(data))
            self.end_headers()
            self.wfile.write(data)
            return

        # ─── API: список сейвов ───
        if path == "/api/saves":
            self._api_list_saves()
            return

        # ─── API: прочитать сейв ───
        if path.startswith("/api/read/"):
            fname = urllib.parse.unquote(path[len("/api/read/"):])
            self._api_read_save(fname)
            return

        # Обычный файл-сервинг
        super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        # ─── API: записать сейв ───
        if path.startswith("/api/write/"):
            fname = urllib.parse.unquote(path[len("/api/write/"):])
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length).decode("utf-8")
            self._api_write_save(fname, body)
            return

        # ─── API: бэкап ───
        if path.startswith("/api/backup/"):
            fname = urllib.parse.unquote(path[len("/api/backup/"):])
            self._api_backup(fname)
            return

        self.send_error(404)

    # ─── API handlers ─────────────────────────────────────

    def _api_list_saves(self):
        saves = []
        if os.path.isdir(SAVE_DIR):
            for f in sorted(os.listdir(SAVE_DIR)):
                fp = os.path.join(SAVE_DIR, f)
                if not os.path.isfile(fp):
                    continue
                if not f.startswith("file"):
                    continue
                try:
                    st = os.stat(fp)
                    saves.append({
                        "name": f,
                        "path": fp,
                        "size": st.st_size,
                        "modified": datetime.datetime.fromtimestamp(st.st_mtime)
                                           .strftime("%d.%m.%Y %H:%M"),
                    })
                except OSError:
                    pass
        self._json_response(saves)

    def _api_read_save(self, fname):
        fp = os.path.join(SAVE_DIR, os.path.basename(fname))
        if not os.path.isfile(fp):
            self._json_response({"error": "Файл не найден"}, 404)
            return
        try:
            with open(fp, "r", encoding="utf-8", errors="replace") as f:
                data = f.read()
            self._json_response({"name": os.path.basename(fp), "data": data, "path": fp})
        except Exception as e:
            self._json_response({"error": str(e)}, 500)

    def _api_write_save(self, fname, body):
        fp = os.path.join(SAVE_DIR, os.path.basename(fname))
        try:
            # Автобэкап
            if os.path.isfile(fp):
                ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
                shutil.copy2(fp, fp + f".backup_{ts}")

            with open(fp, "w", encoding="utf-8", newline="") as f:
                f.write(body)
            self._json_response({"ok": True, "message": "Сохранено!"})
        except Exception as e:
            self._json_response({"error": str(e)}, 500)

    def _api_backup(self, fname):
        fp = os.path.join(SAVE_DIR, os.path.basename(fname))
        if not os.path.isfile(fp):
            self._json_response({"error": "Файл не найден"}, 404)
            return
        try:
            ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            bp = fp + f".backup_{ts}"
            shutil.copy2(fp, bp)
            self._json_response({"ok": True, "backup": bp})
        except Exception as e:
            self._json_response({"error": str(e)}, 500)

    def _json_response(self, obj, code=200):
        data = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", len(data))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(data)


def start_server():
    """Запустить HTTP-сервер в фоновом потоке и вернуть порт."""
    server = HTTPServer(("127.0.0.1", 0), LocalHandler)
    port = server.server_address[1]
    # Устанавливаем HTML лаунчера с актуальным портом
    LocalHandler._launcher_html = build_main_html(port)
    t = threading.Thread(target=server.serve_forever, daemon=True)
    t.start()
    return port


# ─── Главная HTML-страница (обёртка) ──────────────────────
def build_main_html(port):
    """
    Главная страница: index с боковой панелью автопоиска,
    а при выборе сейва — загружает нужную страницу главы в iframe,
    автоматически инжектируя данные сейва.
    """
    base = f"http://127.0.0.1:{port}"
    return f"""<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<title>Deltarune Save Editor — Desktop</title>
<link href="https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;500;700&display=swap" rel="stylesheet">
<style>
:root {{
    --bg: #0b0b12;
    --bg2: #16213e;
    --bg3: #1a1a2e;
    --accent: #9b59f4;
    --accent-dark: #7a3fd4;
    --text: #fff;
    --text-dim: #aaa;
    --border: rgba(155,89,244,.25);
    --gradient: linear-gradient(135deg, #9b59f4, #6c2bd9);
}}

* {{ box-sizing: border-box; margin: 0; padding: 0; }}

body {{
    background: var(--bg);
    color: var(--text);
    font-family: 'Ubuntu', sans-serif;
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}}

/* Header */
.header {{
    background: var(--bg2);
    border-bottom: 2px solid var(--accent);
    padding: 14px 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    flex-shrink: 0;
}}
.header-logo {{
    font-size: 26px;
    font-weight: 700;
    letter-spacing: 2px;
}}
.header-bracket {{
    background: var(--gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}}
.header-sub {{
    font-size: 13px;
    color: var(--text-dim);
}}

/* Layout */
.main-layout {{
    display: flex;
    flex: 1;
    overflow: hidden;
}}

/* Sidebar */
.sidebar {{
    width: 310px;
    min-width: 260px;
    background: var(--bg2);
    border-right: 2px solid var(--accent);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    overflow: hidden;
}}
.sidebar-section {{
    padding: 14px 16px 10px;
}}
.sidebar-title {{
    font-size: 14px;
    font-weight: 700;
    color: var(--accent);
    margin-bottom: 10px;
    text-transform: uppercase;
    letter-spacing: 1px;
}}
.btn {{
    width: 100%;
    padding: 10px 14px;
    margin-bottom: 6px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;
    color: var(--text);
    transition: all .2s;
}}
.btn-primary {{ background: var(--accent); }}
.btn-primary:hover {{ background: var(--accent-dark); box-shadow: 0 0 16px rgba(155,89,244,.4); }}
.btn-secondary {{ background: var(--bg3); }}
.btn-secondary:hover {{ background: #2a2a4e; }}

/* Save list */
.save-list-wrap {{
    flex: 1;
    overflow-y: auto;
    padding: 0 16px 12px;
}}
.save-item {{
    background: var(--bg3);
    border: 2px solid transparent;
    border-radius: 6px;
    padding: 10px 12px;
    margin-bottom: 6px;
    cursor: pointer;
    transition: all .2s;
}}
.save-item:hover {{ border-color: var(--accent); box-shadow: 0 0 10px rgba(155,89,244,.25); }}
.save-item.active {{ border-color: var(--accent); background: #2a2a5e; }}
.save-name {{ font-weight: 600; font-size: 14px; }}
.save-info {{ font-size: 11px; color: var(--text-dim); margin-top: 2px; }}
.no-saves {{ color: var(--text-dim); text-align: center; padding: 24px 8px; font-size: 13px; }}

/* Editor area */
.editor-area {{
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
}}
.editor-toolbar {{
    background: var(--bg3);
    padding: 8px 16px;
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
    border-bottom: 1px solid var(--border);
}}
.toolbar-file {{ font-weight: 700; color: var(--accent); font-size: 14px; flex: 1; }}
.toolbar-btn {{
    padding: 7px 14px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    color: white;
    transition: all .2s;
}}
.toolbar-save {{ background: #4CAF50; }}
.toolbar-save:hover {{ background: #388E3C; }}
.toolbar-export {{ background: var(--accent); }}
.toolbar-export:hover {{ background: var(--accent-dark); }}
.toolbar-backup {{ background: #555; }}
.toolbar-backup:hover {{ background: #777; }}

.editor-frame {{
    flex: 1;
    border: none;
    width: 100%;
    background: #000;
}}

/* Welcome */
.welcome {{
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 40px;
}}
.welcome h2 {{ font-size: 32px; color: var(--accent); margin-bottom: 12px; }}
.welcome p {{ color: var(--text-dim); font-size: 15px; max-width: 500px; line-height: 1.6; }}

/* Status bar */
.statusbar {{
    background: var(--bg3);
    border-top: 1px solid var(--border);
    padding: 6px 16px;
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: var(--text-dim);
    flex-shrink: 0;
}}

/* Notification */
.notification {{
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 14px 22px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 14px;
    z-index: 9999;
    animation: slideIn .3s ease;
    box-shadow: 0 4px 20px rgba(0,0,0,.4);
}}
.notification.success {{ background: #4CAF50; color: white; }}
.notification.error {{ background: #e74c3c; color: white; }}
@keyframes slideIn {{
    from {{ transform: translateX(100px); opacity: 0; }}
    to {{ transform: translateX(0); opacity: 1; }}
}}
</style>
</head>
<body>

<div class="header">
    <div class="header-logo">
        <span class="header-bracket">[</span>SPAMTON<span class="header-bracket">]</span>
        SAVE EDITOR
    </div>
    <div class="header-sub">Десктопная версия — автопоиск и прямое сохранение</div>
</div>

<div class="main-layout">
    <!-- Sidebar -->
    <div class="sidebar">
        <div class="sidebar-section">
            <div class="sidebar-title">Действия</div>
            <button class="btn btn-primary" onclick="refreshSaves()">🔄 Обновить список</button>
            <button class="btn btn-secondary" onclick="openFolder()">📁 Открыть папку сейвов</button>
        </div>
        <div class="sidebar-section">
            <div class="sidebar-title">Найденные сохранения</div>
        </div>
        <div class="save-list-wrap" id="saveList">
            <div class="no-saves">Загрузка…</div>
        </div>
    </div>

    <!-- Editor area -->
    <div class="editor-area">
        <div class="editor-toolbar" id="toolbar" style="display:none">
            <div class="toolbar-file" id="toolbarFile"></div>
            <button class="toolbar-btn toolbar-backup" onclick="doBackup()">🛡 Бэкап</button>
            <button class="toolbar-btn toolbar-save" onclick="doSave()">💾 Сохранить в файл</button>
        </div>

        <div class="welcome" id="welcome">
            <h2>Добро пожаловать!</h2>
            <p>Выберите сохранение слева.<br>Редактор загрузит его автоматически — с тем же интерфейсом как на сайте.</p>
            <p style="margin-top:20px;font-size:13px;color:#666">
                Изменения сохраняются напрямую в файл Deltarune.<br>Автоматический бэкап создаётся при каждом сохранении.
            </p>
        </div>

        <iframe id="editorFrame" class="editor-frame" style="display:none"></iframe>
    </div>
</div>

<div class="statusbar">
    <div id="statusText">Готов</div>
    <div id="statusPath"></div>
</div>

<script>
const API = "{base}";
let currentSave = null;
let saves = [];

// ─── Инициализация ──────────────────────────────
window.addEventListener("DOMContentLoaded", () => refreshSaves());

// ─── Обновить список ────────────────────────────
async function refreshSaves() {{
    setStatus("Поиск сохранений…");
    try {{
        const res = await fetch(API + "/api/saves");
        saves = await res.json();
        renderSaves();
        setStatus(saves.length ? "Найдено: " + saves.length : "Сохранения не найдены");
    }} catch (e) {{
        setStatus("Ошибка: " + e.message);
    }}
}}

function renderSaves() {{
    const list = document.getElementById("saveList");
    if (!saves.length) {{
        list.innerHTML = '<div class="no-saves">Сохранения не найдены.<br>Убедитесь что Deltarune установлена.</div>';
        return;
    }}
    list.innerHTML = saves.map((s, i) =>
        '<div class="save-item' + (currentSave && currentSave.name === s.name ? ' active' : '') + '" onclick="selectSave(' + i + ')">' +
            '<div class="save-name">' + s.name + '</div>' +
            '<div class="save-info">' + (s.size / 1024).toFixed(1) + ' KB • ' + s.modified + '</div>' +
        '</div>'
    ).join("");
}}

// ─── Определить главу по имени файла ────────────
function detectChapter(name) {{
    name = name.toLowerCase();
    if (name.includes("ch1") && name.includes("demo")) return {{ key: "ch1Demo", page: "deltarune1Demo.html" }};
    if (name.includes("ch2") && name.includes("demo")) return {{ key: "ch2Demo", page: "deltarune2Demo.html" }};
    if (name.includes("ch1") || name === "filech1_0") return {{ key: "ch1", page: "deltarune1.html" }};
    if (name.includes("ch2") || name === "filech2_0") return {{ key: "ch2", page: "deltarune2.html" }};
    if (name.includes("ch3") || name === "filech3_0") return {{ key: "ch3", page: "deltarune3.html" }};
    if (name.includes("ch4") || name === "filech4_0") return {{ key: "ch4", page: "deltarune4.html" }};
    // Fallback
    return {{ key: "ch2", page: "deltarune2.html" }};
}}

// ─── Выбрать сейв ───────────────────────────────
async function selectSave(index) {{
    const save = saves[index];
    currentSave = save;
    renderSaves();

    setStatus("Загрузка " + save.name + "…");
    document.getElementById("statusPath").textContent = save.path;

    try {{
        const res = await fetch(API + "/api/read/" + encodeURIComponent(save.name));
        const result = await res.json();
        if (result.error) throw new Error(result.error);

        const chapter = detectChapter(save.name);
        loadEditor(chapter, result.data, save.name);
    }} catch (e) {{
        setStatus("Ошибка: " + e.message);
        notify("Ошибка загрузки: " + e.message, "error");
    }}
}}

// ─── Загрузить редактор в iframe ────────────────
function loadEditor(chapter, saveData, fileName) {{
    document.getElementById("welcome").style.display = "none";
    document.getElementById("toolbar").style.display = "flex";
    document.getElementById("toolbarFile").textContent = fileName + " — " + chapter.key.toUpperCase();

    const frame = document.getElementById("editorFrame");
    frame.style.display = "block";
    frame.src = API + "/" + chapter.page;

    frame.onload = function() {{
        // Ждём инициализации EditorCore, затем загружаем данные
        const win = frame.contentWindow;

        function tryLoad() {{
            if (win.EditorCore && win.EditorCore.loadFromText) {{
                win.EditorCore.loadFromText(saveData, fileName);
                setStatus("Редактирование: " + fileName);

                // Подменяем downloadSave чтобы перехватывать сохранение
                patchDownloadButton(win);
            }} else {{
                setTimeout(tryLoad, 200);
            }}
        }}
        setTimeout(tryLoad, 500);
    }};
}}

// ─── Патч кнопки скачивания ─────────────────────
function patchDownloadButton(win) {{
    const btn = win.document.getElementById("downloadSave");
    if (!btn) return;

    // Клонируем кнопку чтобы убрать старые обработчики
    const newBtn = btn.cloneNode(true);
    newBtn.textContent = "💾 Сохранить изменения в файл";
    newBtn.style.background = "#4CAF50";
    newBtn.style.color = "white";
    newBtn.style.border = "2px solid #4CAF50";
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener("click", () => {{
        if (!currentSave) {{ notify("Нет выбранного файла", "error"); return; }}
        const text = win.EditorCore.getCurrentSaveText();
        if (!text) {{ notify("Нет данных для сохранения", "error"); return; }}
        doSaveData(text);
    }});

    // Скрыть облачные кнопки
    ["cloudSaveBtn","cloudLoadBtn","cloudPublishBtn"].forEach(id => {{
        const el = win.document.getElementById(id);
        if (el) el.style.display = "none";
    }});
}}

// ─── Сохранить данные ───────────────────────────
async function doSave() {{
    if (!currentSave) {{ notify("Сначала выберите файл", "error"); return; }}
    const frame = document.getElementById("editorFrame");
    const win = frame.contentWindow;
    if (!win || !win.EditorCore) {{ notify("Редактор не загружен", "error"); return; }}

    const text = win.EditorCore.getCurrentSaveText();
    if (!text) {{ notify("Нет данных", "error"); return; }}
    await doSaveData(text);
}}

async function doSaveData(text) {{
    setStatus("Сохранение…");
    try {{
        const res = await fetch(API + "/api/write/" + encodeURIComponent(currentSave.name), {{
            method: "POST",
            headers: {{ "Content-Type": "text/plain" }},
            body: text
        }});
        const result = await res.json();
        if (result.error) throw new Error(result.error);

        setStatus("✓ Сохранено: " + currentSave.name);
        notify("Сохранено! Бэкап создан автоматически.", "success");
        refreshSaves();
    }} catch (e) {{
        setStatus("Ошибка: " + e.message);
        notify("Ошибка сохранения: " + e.message, "error");
    }}
}}

// ─── Бэкап ──────────────────────────────────────
async function doBackup() {{
    if (!currentSave) return;
    try {{
        const res = await fetch(API + "/api/backup/" + encodeURIComponent(currentSave.name), {{method:"POST"}});
        const result = await res.json();
        if (result.error) throw new Error(result.error);
        notify("Бэкап создан!", "success");
    }} catch (e) {{
        notify("Ошибка: " + e.message, "error");
    }}
}}

// ─── Открыть папку ──────────────────────────────
function openFolder() {{
    // pywebview expose
    if (window.pywebview && window.pywebview.api) {{
        window.pywebview.api.open_save_folder();
    }} else {{
        notify("Не удалось открыть папку", "error");
    }}
}}

// ─── Утилиты ────────────────────────────────────
function setStatus(text) {{
    document.getElementById("statusText").textContent = text;
}}

function notify(msg, type) {{
    const div = document.createElement("div");
    div.className = "notification " + type;
    div.textContent = msg;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}}
</script>
</body>
</html>"""


# ─── PyWebView API ─────────────────────────────────────
class Api:
    def open_save_folder(self):
        if os.path.isdir(SAVE_DIR):
            os.startfile(SAVE_DIR)


# ─── Запуск ────────────────────────────────────────────
def main():
    port = start_server()
    print(f"[Desktop Editor] HTTP server on http://127.0.0.1:{port}")
    print(f"[Desktop Editor] Web root: {WEB_ROOT}")
    print(f"[Desktop Editor] Save dir: {SAVE_DIR}")

    api = Api()

    # Создаём окно pywebview
    window = webview.create_window(
        "Deltarune Save Editor",
        url=f"http://127.0.0.1:{port}/desktop-launcher.html",
        js_api=api,
        width=1300,
        height=850,
        min_size=(900, 600),
        background_color="#0b0b12",
    )

    webview.start(debug=False)


if __name__ == "__main__":
    main()
