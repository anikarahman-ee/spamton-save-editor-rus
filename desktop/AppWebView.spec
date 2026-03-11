# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller spec для app_webview.py
Собирает .exe который запускает веб-интерфейс через pywebview.
Весь фронтенд (html, js, css, images, fonts, defaultSaves) пакуется в 'web/'
"""

import os

# Корень проекта (parent of desktop/)
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(SPECPATH)))

# Собираем список datas: (source, dest_in_bundle)
web_datas = []

# HTML-страницы в корне проекта
for f in [
    'deltarune1.html', 'deltarune1Demo.html',
    'deltarune2.html', 'deltarune2Demo.html',
    'deltarune3.html', 'deltarune4.html',
    'index.html', 'collections.html', 'library.html',
    'manifest.json', 'serviceWorker.js', 'favicon.ico',
]:
    src = os.path.join(PROJECT_ROOT, f)
    if os.path.exists(src):
        web_datas.append((src, 'web'))

# Папки целиком
for folder in ['js', 'css', 'images', 'fonts', 'defaultSaves']:
    src = os.path.join(PROJECT_ROOT, folder)
    if os.path.isdir(src):
        web_datas.append((src, os.path.join('web', folder)))


a = Analysis(
    ['app_webview.py'],
    pathex=[SPECPATH],
    binaries=[],
    datas=web_datas,
    hiddenimports=[
        'webview',
        'webview.platforms.edgechromium',
        'clr_loader',
        'clr_loader.ffi',
        'pythonnet',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='DeltaruneSaveEditor',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=os.path.join(SPECPATH, 'icon.ico') if os.path.exists(os.path.join(SPECPATH, 'icon.ico')) else None,
)
