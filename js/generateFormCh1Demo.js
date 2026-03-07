





  function generateForm(data){
    var formString = "";

    //File Data
    formString += `<div id='tab_main' class='tab'>`;

    formString += "<div id='main_box'>";
    formString += "Основное<br>";
    formString += generateTextInput(`_1`,"Имя файла",data[`_1`],[{length:10}],'filename');
    formString += generateNumberInput(`_11`,"D$",data[`_11`],{min:0,max:99999},'flag');
    formString += generateSelectCh1(`_10317`,"Комната",data[`_10317`],roomsCh1,'room_id');
    formString += `<label class='lineItem'><input type="checkbox" name="show_all_rooms" noinput="true">Показать все комнаты</label><br>`

    formString += generateNumberInput(`_10316`,"Флаг сюжета",data[`_10316`],{min:0,max:205},'flag');

    formString += generateTextboxInput(`_16`,`Флаг Тёмного мира`,data[`_16`],{min:0,max:1},``);


    formString += "</div>";








    //Lightworld Kris stats
    formString += "<div id='lightworld_box'>";
    formString += `<img src='images/KrisLight.png'>Светлый мир "Крис"<br>`;
    formString += generateNumberInput(`_294`,"$",data[`_294`],{min:0,max:99999},'flag');
    formString += "<br>";
    formString += generateNumberInput(`_295`,"HP",data[`_295`],{min:-99999,max:99999},'character_hp');
    formString += " / ";
    formString += generateNumberInput(`_296`,"",data[`_296`],{min:-99999,max:99999},'character_hp');
    formString += "<br>";

    formString += `<div class='stats_block'>`

    formString += generateNumberInput(`_293`,"LV<br>",data[`_293`],{min:-99999,max:99999},'stat');
    formString += generateNumberInput(`_292`,"EXP<br>",data[`_292`],{min:-99999,max:99999},'stat');


    formString += generateNumberInput(`_297`,"AT<br>",data[`_297`],{min:-99999,max:99999},'stat');
    formString += generateNumberInput(`_298`,"DF<br>",data[`_298`],{min:-99999,max:99999},'stat');


    formString += `</div>`


    formString += generateSelectCh1(`_290`,"ОРУЖИЕ: ",data[`_290`],lightworld_weaponsCh1,'grey_disable');
    formString += "<br>";
    formString += generateSelectCh1(`_291`,"БРОНЯ: ",data[`_291`],lightworld_armorCh1,'grey_disable');

    formString += "</div>";




      formString += `</div>`;
      formString += `<div id='tab_party' class='tab'>`;


      //Party Box
      formString += "<div id='party_box'>";
      formString += `Команда<br>`;
      formString += `<div id='party_display'></div>`



      formString += generateSelectCh1(`_8`,"Участник 1: ",data[`_8`],party_members,'party_member_1 grey_disable');
      formString += "<br>";
      formString += generateSelectCh1(`_9`,"Участник 2: ",data[`_9`],party_members,'party_member_2 grey_disable');
      formString += "<br>";
      formString += generateSelectCh1(`_10`,"Участник 3: ",data[`_10`],party_members,'party_member_3 grey_disable');
      formString += "<br>";

      formString += `<label class='lineItem'><input type="checkbox" name="allow_broken_party" noinput="true">Разрешить неверную команду</label><br>`
      formString += "</div>";




      formString += "<div id='character_wrapper'>";
      //Kris stats
      formString += "<div class='character_box'>";
      formString += "<div class='character_name'><img src='images/Kris.png'> Kris</div><div id='status_kris'></div><br>";

      formString += generateNumberInput(`_71`,"HP",data[`_71`],{min:-99999,max:99999},'character_hp');
      formString += " / ";
      formString += generateNumberInput(`_72`,"",data[`_72`],{min:-99999,max:99999},'character_hp');
      formString += "<br>";

      formString += `<div class='stats_block'>`

      formString += generateNumberInput(`_73`,"ATK<br>",data[`_73`],{min:-99999,max:99999},'stat');
      formString += generateNumberInput(`_74`,"DEF<br>",data[`_74`],{min:-99999,max:99999},'stat');
      formString += generateNumberInput(`_75`,"MAG<br>",data[`_75`],{min:-99999,max:99999},'stat');


      formString += `</div>`


      formString += generateSelectCh1(`_77`,"<img src='images/Sword.png'>",data[`_77`],weaponsCh1,'grey_disable');
      formString += "<br>";
      formString += generateSelectCh1(`_78`,"<img src='images/Armor1.png'>",data[`_78`],armorCh1,'grey_disable');
      formString += "<br>";
      formString += generateSelectCh1(`_79`,"<img src='images/Armor2.png'>",data[`_79`],armorCh1,'grey_disable');
      formString += "<br><hr>";
      formString += "<div class='spells_title'><center>v Заклинания v</center></div>";

      formString += "<div class='spell_wrapper'>"
      for(var i = 0; i < 6; i++){
        formString += generateSelectCh1(`_${i+113}`,`Spell ${i+1} `,data[`_${i+113}`],spellsCh1,'spell_slot grey_disable');
      }

      formString += "</div>";
      formString += "</div>";





      //Susie stats
      formString += "<div class='character_box'>";
      formString += "<div class='character_name'><img src='images/Susie.png'> Susie</div><div id='status_susie'></div><br>";
      formString += generateNumberInput(`_125`,"HP",data[`_125`],{min:-99999,max:99999},'character_hp');
      formString += " / ";
      formString += generateNumberInput(`_126`,"",data[`_126`],{min:-99999,max:99999},'character_hp');
      formString += "<br>";

      formString += `<div class='stats_block'>`

      formString += generateNumberInput(`_127`,"ATK<br>",data[`_127`],{min:-99999,max:99999},'stat');
      formString += generateNumberInput(`_128`,"DEF<br>",data[`_128`],{min:-99999,max:99999},'stat');
      formString += generateNumberInput(`_129`,"MAG<br>",data[`_129`],{min:-99999,max:99999},'stat');


      formString += `</div>`


      formString += generateSelectCh1(`_131`,"<img src='images/Axe.png'>",data[`_131`],weaponsCh1,'grey_disable');
      formString += "<br>";
      formString += generateSelectCh1(`_132`,"<img src='images/Armor1.png'>",data[`_132`],armorCh1,'grey_disable');
      formString += "<br>";
      formString += generateSelectCh1(`_133`,"<img src='images/Armor2.png'>",data[`_133`],armorCh1,'grey_disable');
      formString += "<br><hr>";
      formString += "<div class='spells_title'><center>v Заклинания v</center></div>";

      formString += "<div class='spell_wrapper'>"
      for(var i = 0; i < 6; i++){
        formString += generateSelectCh1(`_${i+167}`,`Spell ${i+1} `,data[`_${i+167}`],spellsCh1,'spell_slot grey_disable');
      }

      formString += "</div>";
      formString += "</div>";




      //Ralsei stats
      formString += "<div class='character_box'>";
      formString += "<div class='character_name'><img src='images/Ralsei.png'> Ralsei</div><div id='status_ralsei'></div><br>";
      formString += generateNumberInput(`_179`,"HP",data[`_179`],{min:-99999,max:99999},'character_hp');
      formString += " / ";
      formString += generateNumberInput(`_180`,"",data[`_180`],{min:-99999,max:99999},'character_hp');
      formString += "<br>";

      formString += `<div class='stats_block'>`

      formString += generateNumberInput(`_181`,"ATK<br>",data[`_181`],{min:-99999,max:99999},'stat');
      formString += generateNumberInput(`_182`,"DEF<br>",data[`_182`],{min:-99999,max:99999},'stat');
      formString += generateNumberInput(`_183`,"MAG<br>",data[`_183`],{min:-99999,max:99999},'stat');


      formString += `</div>`


      formString += generateSelectCh1(`_185`,"<img src='images/Scarf.png'>",data[`_185`],weaponsCh1,'grey_disable');
      formString += "<br>";
      formString += generateSelectCh1(`_186`,"<img src='images/Armor1.png'>",data[`_186`],armorCh1,'grey_disable');
      formString += "<br>";
      formString += generateSelectCh1(`_187`,"<img src='images/Armor2.png'>",data[`_187`],armorCh1,'grey_disable');
      formString += "<br><hr>";
      formString += "<div class='spells_title'><center>v Заклинания v</center></div>";

      formString += "<div class='spell_wrapper'>"
      for(var i = 0; i < 6; i++){
        formString += generateSelectCh1(`_${i+221}`,`Spell ${i+1} `,data[`_${i+221}`],spellsCh1,'spell_slot grey_disable');
      }

      formString += "</div>";
      formString += "</div>";





      formString += "</div>";




      formString += `</div>`;
      formString += `<div id='tab_items' class='tab'>`;



      formString += "<div id='item_box_wrapper'>";

      //Items
      formString += "<div class='item_box'>";
      formString += "Предметы<br>";
      formString += "<div id='item_wrapper'>";

      for(var i = 0; i < 12; i++){
        formString += generateSelectCh1(`_${(i*4)+236}`,`Slot ${i+1}<br>`,data[`_${(i*4)+236}`],itemsCh1,'item_slot grey_disable');
      }
      formString += "</div>";
      formString += "</div>";


      //Key Items
      formString += "<div class='item_box'>";
      formString += "Ключ. предметы<br>";
      formString += "<div id='item_wrapper'>";
      for(var i = 0; i < 12; i++){
        formString += generateSelectCh1(`_${(i*4)+237}`,`Slot ${i+1}<br>`,data[`_${(i*4)+237}`],key_itemsCh1,'item_slot grey_disable');
      }
      formString += "</div>";
      formString += "</div>";





      //Weapon Slots
      formString += "<div class='item_box'>";
      formString += "Оружие<br>";
      formString += "<div id='item_wrapper'>";
      for(var i = 0; i < 12; i++){
        formString += generateSelectCh1(`_${(i*4)+238}`,`Slot ${i+1}<br>`,data[`_${(i*4)+238}`],weaponsCh1,'item_slot grey_disable');
      }
      formString += "</div>";
      formString += "</div>";


      //Armor Slots
      formString += "<div class='item_box'>";
      formString += "Броня<br>";
      formString += "<div id='item_wrapper'>";
      for(var i = 0; i < 12; i++){
        formString += generateSelectCh1(`_${(i*4)+239}`,`Slot ${i+1}<br>`,data[`_${(i*4)+239}`],armorCh1,'item_slot grey_disable');
      }
      formString += "</div>";
      formString += "</div>";



      //Lightworld Items
      formString += "<div class='item_box'>";
      formString += "Светлый мир - Предметы<br>";
      formString += "<div id='item_wrapper'>";
      for(var i = 0; i < 8; i++){
        formString += generateSelectCh1(`_${(i*2)+301}`,`Слот ${i+1}<br>`,data[`_${(i*2)+301}`],lightworld_itemsCh1,'item_slot grey_disable');
      }
      formString += "</div>";
      formString += "</div>";


      

      //Phone Numbers
      formString += "<div class='item_box'>";
      formString += "Телефон<br>";
      formString += "<div id='item_wrapper'>";
      for(var i = 0; i < 8; i++){
        formString += generateSelectCh1(`_${(i*2)+302}`,`Slot ${i+1}<br>`,data[`_${(i*2)+302}`],phone_numbers,'item_slot grey_disable');
      }
      formString += "</div>";
      formString += "</div>";



      formString += "</div>";

      formString += `</div>`;
      formString += `<div id='tab_creations' class='tab'>`




      //Thrash your own ass




      formString += `<div id='thrash_box'>`;

      formString += `<center>Машина Лансера</center><br><br>`;
      formString += `<div id='thrash_flex'>`;
      formString += `<div id='thrash_left'>`;


      formString += `<div id='thrash_wrapper'>`;
      formString += `<div id='thrash_head_c' style="width:50px;height:50px;background-color:rgb(${_col1[0]},${_col1[1]},${_col1[2]});"></div>`;
      formString += `<div id='thrash_body_c' style="width:50px;height:50px;background-color:rgb(${_col2[0]},${_col2[1]},${_col2[2]});"></div>`;
      formString += `<div id='thrash_feet_c' style="width:50px;height:50px;background-color:rgb(${_col3[0]},${_col3[1]},${_col3[2]});"></div>`;
      formString += `<div id='thrash_head'></div>`;
      formString += `<div id='thrash_body'></div>`;
      formString += `<div id='thrash_feet'></div>`;
      formString += `<div id='thrash_feet2'></div>`;
      formString += `</div>`;
      formString += `</div>`;

      formString += `<div id='thrash_right'>`;


      formString += generateSelectCh1(`_537`,"Голова:",data[`_537`],thrasher_head_parts,'thrasher_select');
      formString += generateSelectCh1(`_538`,"Тело:",data[`_538`],thrasher_body_parts,'thrasher_select');
      formString += generateSelectCh1(`_539`,"Ноги:",data[`_539`],thrasher_feet_parts,'thrasher_select');


      formString += generateRangeInput(`_540`,"Цвет головы:",data[`_540`],{min:0,max:31},'hidden');
      formString += generateRangeInput(`_541`,"B C",data[`_541`],{min:0,max:31},'hidden');
      formString += generateRangeInput(`_542`,"F C",data[`_542`],{min:0,max:31},'hidden');

      formString += `</div>`;

      formString += `</div>`;

      formString += `<div id='thrash_head_c_slider'></div>`;
      formString += `<div id='thrash_body_c_slider'></div>`;
      formString += `<div id='thrash_feet_c_slider'></div>`;

      formString += `</div>`;




        //Goner
        formString += `<div id='goner_box'>`;

        formString += `<div id='goner_flex'>`;
        formString += `<div id='goner_left'>`;

        formString += `<center>Название сосуда</center>`;
        formString += generateTextInput(`_2`,"",data[`_2`],[{length:10}],'filename');
        formString += `<div id='goner_wrapper'>`;
        formString += `<div id='goner_head'></div>`;
        formString += `<div id='goner_body'></div>`;
        formString += `<div id='goner_legs'></div>`;

        formString += `</div>`;

        formString += `<div id='goner_vessel_input'>`;
        formString += generateNumberInput(`_1217`,"ГОЛОВА ",data[`_1217`],{min:0,max:7},'flag');
        formString += generateNumberInput(`_1218`,"ТЕЛО ",data[`_1218`],{min:0,max:5},'flag');
        formString += generateNumberInput(`_1219`,"НОГИ ",data[`_1219`],{min:0,max:4},'flag');
        formString += `</div>`;
        formString += `</div>`;

        formString += `<div id='goner_right'>`;


        formString += generateSelectCh1(`_1220`,"Какая его любимая еда?<br>",data[`_1220`],goner_food);
        formString += generateSelectCh1(`_1221`,"Ваша любимая группа крови?<br>",data[`_1222`],goner_blood);
        formString += generateSelectCh1(`_1222`,"Какой цвет ему нравится больше?<br>",data[`_1222`],goner_color);
        formString += generateSelectCh1(`_1226`,"Пожалуйста, дайте ему подарок.<br>",data[`_1226`],goner_gift);
        formString += generateSelectCh1(`_1223`,"Что вы думаете о своём творении? (оно не услышит)<br>",data[`_1223`],goner_feel);


        formString += generateSelectCh1(`_1224`,"Вы ответили честно?<br>",data[`_1224`],[{value:0,text:`ДА`},{value:1,text:`НЕТ`}]);
        formString += generateSelectCh1(`_1225`,"Вы признаёте возможность боли и судорог.<br>",data[`_1225`],[{value:0,text:`ДА`},{value:1,text:`НЕТ`}]);

        formString += `</div>`;
        formString += `</div>`;
        formString += `</div>`;


        formString += `</div>`;
        
        
        
        formString += `<div id="tab_hometown" class='tab'>`;
        //chapter 1 hometown flags
        formString += "<div id='flags_box'>";
        formString += "Разговоры с персонажами<br>";
        formString += generateSelectCh1(`_573`,"Разговаривал с Бёрдли",data[`_573`],[{value:0,text:`Нет`},{value:1,text:`Да`}],'');
        formString += generateSelectCh1(`_582`,"Разговаривал с Кэтти",data[`_582`],[{value:0,text:`Нет`},{value:1,text:`Да`}],'');
        formString += generateSelectCh1(`_587`,"Разговаривал с Андайн",data[`_587`],[{value:0,text:`Нет`},{value:1,text:`Да`}],'');
        formString += generateSelectCh1(`_588`,"Разговаривал с Бургерпэнцем",data[`_588`],[{value:0,text:`Нет`},{value:1,text:`Да`},{value:2,text:`Видел диалог`}],'');
        formString += generateSelectCh1(`_590`,"Разговаривал с Сансом",data[`_590`],[{value:0,text:`Нет`},{value:1,text:`Да`},{value:2,text:`Говорил о своём брате`}],'');
        formString += generateSelectCh1(`_592`,"Раковина в палате Руди",data[`_592`],[{value:0,text:`Не взаимодействовал`},{value:1,text:`Взаимодействовал`}],'');
        formString += generateSelectCh1(`_593`,"Разговаривал с Ноэль",data[`_593`],[{value:0,text:`Нет`},{value:1,text:`Да`},{value:2,text:`Говорила о Сьюзи`}],'');
        formString += "</div>";
        
        
        
        formString += "<div id='flags_box'>";
        formString += "Катсцены<br>";
        formString += generateSelectCh1(`_572`,"Катсцена в больнице (Ноэль)",data[`_572`],[{value:0,text:`Не видел`},{value:1,text:`Видел катсцену`},{value:2,text:`Поговорил с Руди`}],'');
        formString += generateSelectCh1(`_579`,"Катсцена с цветами Азгора",data[`_579`],[{value:0,text:`Не видел`},{value:1,text:`Зашёл в цветочный`},{value:2,text:`Получил букет`},{value:3,text:`Отдал букет Ториэль`},{value:4,text:`Ториэль выбросила букет`}],'');
        formString += generateSelectCh1(`_586`,"Катсцена Альфис в переулке",data[`_586`],[{value:0,text:`Не видел`},{value:1,text:`Видел катсцену`}],'');

        formString += "</div>";
        
        
        
        formString += "<div id='flags_box'>";
        formString += "Онион<br>";
        formString += generateSelectCh1(`_575`,"Разговаривал с Онионом",data[`_575`],[{value:0,text:`Нет`},{value:1,text:`Да`},{value:2,text:`Стали друзьями`},{value:3,text:`Отказался дружить`}],'');
        formString += generateSelectCh1(`_576`,"Ваше имя",data[`_576`],[{value:0,text:`Нет`},{value:1,text:`Крис`},{value:2,text:`Гиппопотам`}],'grey_disable');
        formString += generateSelectCh1(`_577`,"Имя Ониона",data[`_577`],[{value:0,text:`Нет`},{value:1,text:`Онион`},{value:2,text:`Красотка`},{value:3,text:`Азриэль II`},{value:4,text:`Отвратительно`}],'grey_disable');
        formString += "</div>";
        
        
        
        formString += "<div id='flags_box'>";
        formString += "Прочее<br>";
        formString += generateSelectCh1(`_574`,"Засунул пальцы в скамейку",data[`_574`],[{value:0,text:`Нет`},{value:1,text:`Да`}],'');
        formString += generateSelectCh1(`_578`,"Бесплатный горячий шоколад",data[`_578`],[{value:0,text:`Не забрано`},{value:1,text:`Забрано`}],'');
        formString += generateSelectCh1(`_589`,"Звонок Ториэль",data[`_589`],[{value:0,text:`Нет`},{value:1,text:`Да`}],'');
        formString += generateSelectCh1(`_591`,"Получил номер Санса",data[`_591`],[{value:0,text:`Нет`},{value:1,text:`Да`},{value:1,text:`Позвонил`}],'');
        formString += generateNumberInput(`_594`,"Раз заходил в дом",data[`_594`],{min:0,max:8},'flag');


        formString += "</div>";
        
        
        
        formString += `</div>`;
        
        
        
        
        
        formString += `<div id="tab_other" class='tab'>`;

        //Misc chapter 1 flags

        formString += "<div class='flags_box'>";
        formString += "Прочие флаги<br>";
        formString += generateSelectCh1(`_423`,"Съел мох в тюрьме",data[`_423`],[{value:0,text:`Нет`},{value:1,text:`Да`}],'');
        formString += generateNumberInput(`_558`,"Квест Джевила (?)",data[`_558`],{min:0,max:7},'flag');
        formString += generateSelectCh1(`_571`,"The Original Starwalker",data[`_571`],[{value:0,text:`Нет`},{value:1,text:`Да`}],'');
        formString += generateNumberInput(`_1228`,"Яйца главы 1",data[`_1228`],{min:-99999,max:99999},'flag');
        formString += generateSelectCh1(`_569`,"Крис осмотрел кровати",data[`_569`],[{value:0,text:`Нет`},{value:1,text:`Да`}],'');
        formString += generateSelectCh1(`_570`,"Получен Спин-Кейк",data[`_570`],[{value:0,text:`Нет`},{value:1,text:`Да`}],'');
        formString += generateSelectCh2(`_524`,"Выбросил инструкцию",data[`_524`],[{value:0,text:`Нет`},{value:1,text:`Уронил раз`},{value:2,text:`Выброшена`}],'');
        formString += "</div>";




        formString += `</div>`;





    return window.localizeGeneratedForm ? window.localizeGeneratedForm('ch1Demo', formString) : formString;
  }
