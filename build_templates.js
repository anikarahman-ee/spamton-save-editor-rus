const fs = require('fs');
const vm = require('vm');

const chapters = [
  { name: 'ch1', file: 'js/dataNames1.js' },
  { name: 'ch1Demo', file: 'js/dataNames1Demo.js' },
  { name: 'ch2', file: 'js/dataNames2.js' },
  { name: 'ch2Demo', file: 'js/dataNames2Demo.js' },
  { name: 'ch3', file: 'js/dataNames3.js' },
  { name: 'ch4', file: 'js/dataNames4.js' }
];

const arraysToExtract = [
  'rooms', 'roomsCh1', 'rooms_all',
  'weapons', 'weaponsCh1',
  'armor', 'armorCh1',
  'items', 'itemsCh1',
  'key_items', 'key_itemsCh1',
  'spells', 'spellsCh1',
  'lightworld_items', 'lightworld_itemsCh1',
  'lightworld_armor', 'lightworld_armorCh1',
  'lightworld_weapons', 'lightworld_weaponsCh1',
  'party_members', 'recruits',
  'thrasher_head_parts', 'thrasher_body_parts', 'thrasher_feet_parts',
  'goner_food', 'goner_blood', 'goner_color', 'goner_feel', 'goner_gift',
  'phone_numbers'
];

if (!fs.existsSync('js/translations/templates')) {
    fs.mkdirSync('js/translations/templates', { recursive: true });
}

chapters.forEach(ch => {
    let scriptContent = fs.readFileSync(ch.file, 'utf8');
    const context = {};
    vm.createContext(context);
    
    // We run the dataNames script but mock some things if needed, it's mostly var declarations
    try {
        vm.runInContext(scriptContent, context);
    } catch(e) {
        console.warn("Error running script " + ch.file + ": " + e);
    }

    let out = `window.Translations = window.Translations || {};\n`;
    out += `\n// Замените YOUR_TRANSLATOR_NAME на 'DumpyCats' или 'LazyDesman' (или добавьте своё в translationManager.js)\n`;
    out += `window.Translations['YOUR_TRANSLATOR_NAME'] = window.Translations['YOUR_TRANSLATOR_NAME'] || {};\n`;
    out += `window.Translations['YOUR_TRANSLATOR_NAME']['${ch.name}'] = {\n`;

    let commaAdded = false;

    arraysToExtract.forEach(arrName => {
        if (context[arrName] && Array.isArray(context[arrName])) {
            if (commaAdded) out += ",\n";
            out += `    '${arrName}': {\n`;
            let itemLines = [];
            context[arrName].forEach(item => {
                if (item && item.text) {
                    let escapedVal = String(item.value);
                    let escapedText = item.text.replace(/'/g, "\\'").replace(/\n/g, '\\n');
                    itemLines.push(`        '${escapedVal}': '${escapedText}'`);
                }
            });
            out += itemLines.join(",\n");
            out += `\n    }`;
            commaAdded = true;
        }
    });

    out += `\n};\n`;

    fs.writeFileSync(`js/translations/templates/translation_${ch.name}.js`, out, 'utf8');
});

console.log("Templates created!");
