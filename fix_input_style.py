import io

f='js/generateInput.js'
with io.open(f, 'r', encoding='utf-8') as file:
    c = file.read()

# Removing inline style logic
c = c.replace(' ${(checked ? `` : `style="color:${disabledColor}"`)}>', '>')

with io.open(f, 'w', encoding='utf-8') as file:
    file.write(c)

print('Input style fixed')
