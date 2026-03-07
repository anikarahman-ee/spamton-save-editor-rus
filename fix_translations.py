import os
import re

chapters = ['1', '1Demo', '2', '2Demo', '3', '4']

for ch in chapters:
    filename = f'deltarune{ch}.html'
    if not os.path.exists(filename): continue
    
    with open(filename, 'r', encoding='utf-8') as f:
        c = f.read()
    
    script_tags = f"""
    <script src="js/translations/DumpyCats/translation_ch{ch}.js"></script>
    <script src="js/translations/LazyDesman/translation_ch{ch}.js"></script>
    <script src="js/translations/CozyInn/translation_ch{ch}.js"></script>
    <script src="js/translations/translationManager.js"></script>
"""
    c = re.sub(r'<script src="js/translations/translationManager.js"></script>\s*', '', c)
    c = c.replace('<script src="js/editorCore.js"></script>', script_tags.strip() + '\n    <script src="js/editorCore.js"></script>')
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(c)

print('Translation scripts injected.')
