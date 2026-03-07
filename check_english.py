import re, os

# Find remaining English text in generateForm files
pattern = re.compile(r'formString \+= "([A-Z][a-z]+(?:\s+[A-Za-z]+)+)')
for fn in sorted(os.listdir('js')):
    if fn.startswith('generateForm') and fn.endswith('.js'):
        with open(f'js/{fn}', encoding='utf-8') as f:
            for i, line in enumerate(f, 1):
                m = pattern.search(line)
                if m:
                    print(f'{fn}:{i}: {m.group(1)[:60]}')

# Also check for English in label parameters of generate* functions  
pattern2 = re.compile(r'generate(?:Select|Range|Number|Text|Textbox)\w+\([^,]+,"([A-Z][a-z]+(?:\s+[A-Za-z]*)*)')
for fn in sorted(os.listdir('js')):
    if fn.startswith('generateForm') and fn.endswith('.js'):
        with open(f'js/{fn}', encoding='utf-8') as f:
            for i, line in enumerate(f, 1):
                m = pattern2.search(line)
                if m:
                    text = m.group(1).strip()
                    # Skip game stat abbreviations
                    if text in ('HP', 'ATK', 'DEF', 'MAG', 'LV', 'EXP', 'AT', 'DF', 'PTs', 'Kris', 'Susie', 'Ralsei', 'Noelle', 'The Original Starwalker'):
                        continue
                    print(f'{fn}:{i}: LABEL "{text}"')

# Check for English in select option texts
pattern3 = re.compile(r"text:`([A-Z][a-z]+(?:\s+[A-Za-z]+)+)`")
for fn in sorted(os.listdir('js')):
    if fn.startswith('generateForm') and fn.endswith('.js'):
        with open(f'js/{fn}', encoding='utf-8') as f:
            for i, line in enumerate(f, 1):
                for m in pattern3.finditer(line):
                    text = m.group(1)
                    if text in ('The Original Starwalker',):
                        continue
                    print(f'{fn}:{i}: OPTION "{text}"')
