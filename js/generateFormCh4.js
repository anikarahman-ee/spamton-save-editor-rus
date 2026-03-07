
function generateForm(data){
  var formString = "";

  //File Data


  formString += `<div id='tab_main' class='tab'>`;

  formString += "<div id='main_box'>";
  formString += "Основное<br>";
  formString += generateTextInput(`_1`,"Имя файла",data[`_1`],[{length:10}],'filename');
  formString += generateNumberInput(`_11`,"D$",data[`_11`],{min:0,max:99999},'flag');
  formString += generateSelectCh2(`_3054`,"Комната",data[`_3054`],rooms,'room_id');
  formString += `<label class='lineItem'><input type="checkbox" name="show_all_rooms" noinput="true">Показать все комнаты</label><br>`

    formString += generateSelectCh2(`_1726`,"Раунд 1 Ранг",data[`_1726`],ch3_ranks,'rank');
  formString += generateSelectCh2(`_1727`,"Раунд 2 Ранг",data[`_1727`],ch3_ranks,'rank');
  formString += generateNumberInput(`_3053`,"Флаг сюжета",data[`_3053`],{min:0,max:211},'flag');

  formString += generateTextboxInput(`_16`,`Флаг Тёмного мира`,data[`_16`],{min:0,max:1},``);


  formString += "</div>";








  //Lightworld Kris stats
  formString += "<div id='lightworld_box'>";
  formString += `<img src='images/KrisLight.png'>Светлый мир "Крис"<br>`;
  formString += generateNumberInput(`_530`,"$",data[`_530`],{min:0,max:99999},'flag');
  formString += "<br>";
  formString += generateNumberInput(`_531`,"HP",data[`_531`],{min:-99999,max:99999},'character_hp');
  formString += " / ";
  formString += generateNumberInput(`_532`,"",data[`_532`],{min:-99999,max:99999},'character_hp');
  formString += "<br>";

  formString += `<div class='stats_block'>`

  formString += generateNumberInput(`_529`,"LV<br>",data[`_529`],{min:-99999,max:99999},'stat');
  formString += generateNumberInput(`_528`,"EXP<br>",data[`_528`],{min:-99999,max:99999},'stat');


  formString += generateNumberInput(`_533`,"AT<br>",data[`_533`],{min:-99999,max:99999},'stat');
  formString += generateNumberInput(`_534`,"DF<br>",data[`_534`],{min:-99999,max:99999},'stat');


  formString += `</div>`


  formString += generateSelectCh2(`_526`,"ОРУЖИЕ: ",data[`_526`],lightworld_weapons,'grey_disable');
  formString += "<br>";
  formString += generateSelectCh2(`_527`,"БРОНЯ: ",data[`_527`],lightworld_armor,'grey_disable');

  formString += "</div>";




    formString += `</div>`;
    formString += `<div id='tab_party' class='tab'>`;



    //Party Box
    formString += "<div id='party_box'>";
    formString += `Команда (не используется)<br>`;
    formString += `<div id='party_display'></div>`



    formString += generateSelectCh2(`_8`,"Участник 1: ",data[`_8`],party_members,'party_member_1 grey_disable');
    formString += "<br>";
    formString += generateSelectCh2(`_9`,"Участник 2: ",data[`_9`],party_members,'party_member_2 grey_disable');
    formString += "<br>";
    formString += generateSelectCh2(`_10`,"Участник 3: ",data[`_10`],party_members,'party_member_3 grey_disable');
    formString += "<br>";

    formString += `<label class='lineItem'><input type="checkbox" name="allow_broken_party" noinput="true">Разрешить неверную команду</label><br>`
    formString += "</div>";




    formString += "<div id='character_wrapper'>";
    //Kris stats
    formString += "<div class='character_box'>";
    formString += "<div class='character_name'><img src='images/Kris.png'> Kris</div><div id='status_kris'></div><br>";

    formString += generateNumberInput(`_79`,"HP",data[`_79`],{min:-99999,max:99999},'character_hp');
    formString += " / ";
    formString += generateNumberInput(`_80`,"",data[`_80`],{min:-99999,max:99999},'character_hp');
    formString += "<br>";

    formString += `<div class='stats_block'>`

    formString += generateNumberInput(`_81`,"ATK<br>",data[`_81`],{min:-99999,max:99999},'stat');
    formString += generateNumberInput(`_82`,"DEF<br>",data[`_82`],{min:-99999,max:99999},'stat');
    formString += generateNumberInput(`_83`,"MAG<br>",data[`_83`],{min:-99999,max:99999},'stat');


    formString += `</div>`


    formString += generateSelectCh2(`_85`,"<img src='images/Sword.png'>",data[`_85`],weapons,'grey_disable');
    formString += "<br>";
    formString += generateSelectCh2(`_86`,"<img src='images/Armor1.png'>",data[`_86`],armor,'grey_disable');
    formString += "<br>";
    formString += generateSelectCh2(`_87`,"<img src='images/Armor2.png'>",data[`_87`],armor,'grey_disable');
    formString += "<br><hr>";
    formString += "<div class='spells_title'><center>v Заклинания v</center></div>";

    formString += "<div class='spell_wrapper'>"
    for(var i = 0; i < 6; i++){
      formString += generateSelectCh2(`_${i+129}`,`Spell ${i+1} `,data[`_${i+129}`],spells,'spell_slot grey_disable');
    }

    formString += "</div>";
    formString += "</div>";





    //Susie stats
    formString += "<div class='character_box'>";
    formString += "<div class='character_name'><img src='images/Susie.png'> Susie</div><div id='status_susie'></div><br>";
    formString += generateNumberInput(`_141`,"HP",data[`_141`],{min:-99999,max:99999},'character_hp');
    formString += " / ";
    formString += generateNumberInput(`_142`,"",data[`_142`],{min:-99999,max:99999},'character_hp');
    formString += "<br>";

    formString += `<div class='stats_block'>`

    formString += generateNumberInput(`_143`,"ATK<br>",data[`_143`],{min:-99999,max:99999},'stat');
    formString += generateNumberInput(`_144`,"DEF<br>",data[`_144`],{min:-99999,max:99999},'stat');
    formString += generateNumberInput(`_145`,"MAG<br>",data[`_145`],{min:-99999,max:99999},'stat');


    formString += `</div>`


    formString += generateSelectCh2(`_147`,"<img src='images/Axe.png'>",data[`_147`],weapons,'grey_disable');
    formString += "<br>";
    formString += generateSelectCh2(`_148`,"<img src='images/Armor1.png'>",data[`_148`],armor,'grey_disable');
    formString += "<br>";
    formString += generateSelectCh2(`_149`,"<img src='images/Armor2.png'>",data[`_149`],armor,'grey_disable');
    formString += "<br><hr>";
    formString += "<div class='spells_title'><center>v Заклинания v</center></div>";

    formString += "<div class='spell_wrapper'>"
    for(var i = 0; i < 6; i++){
      formString += generateSelectCh2(`_${i+191}`,`Spell ${i+1} `,data[`_${i+191}`],spells,'spell_slot grey_disable');
    }

    formString += "</div>";
    formString += "</div>";




    //Ralsei stats
    formString += "<div class='character_box'>";
    formString += "<div class='character_name'><img src='images/Ralsei.png'> Ralsei</div><div id='status_ralsei'></div><br>";
    formString += generateNumberInput(`_203`,"HP",data[`_203`],{min:-99999,max:99999},'character_hp');
    formString += " / ";
    formString += generateNumberInput(`_204`,"",data[`_204`],{min:-99999,max:99999},'character_hp');
    formString += "<br>";

    formString += `<div class='stats_block'>`

    formString += generateNumberInput(`_205`,"ATK<br>",data[`_205`],{min:-99999,max:99999},'stat');
    formString += generateNumberInput(`_206`,"DEF<br>",data[`_206`],{min:-99999,max:99999},'stat');
    formString += generateNumberInput(`_207`,"MAG<br>",data[`_207`],{min:-99999,max:99999},'stat');


    formString += `</div>`


    formString += generateSelectCh2(`_209`,"<img src='images/Scarf.png'>",data[`_209`],weapons,'grey_disable');
    formString += "<br>";
    formString += generateSelectCh2(`_210`,"<img src='images/Armor1.png'>",data[`_210`],armor,'grey_disable');
    formString += "<br>";
    formString += generateSelectCh2(`_211`,"<img src='images/Armor2.png'>",data[`_211`],armor,'grey_disable');
    formString += "<br><hr>";
    formString += "<div class='spells_title'><center>v Заклинания v</center></div>";

    formString += "<div class='spell_wrapper'>"
    for(var i = 0; i < 6; i++){
      formString += generateSelectCh2(`_${i+253}`,`Spell ${i+1} `,data[`_${i+253}`],spells,'spell_slot grey_disable');
    }

    formString += "</div>";
    formString += "</div>";





    //Noelle stats
    formString += "<div class='character_box'>";
    formString += "<div class='character_name'><img src='images/Noelle.png'> Noelle</div><div id='status_noelle'></div><br>";
    formString += generateNumberInput(`_265`,"HP",data[`_265`],{min:-99999,max:99999},'character_hp');
    formString += " / ";
    formString += generateNumberInput(`_266`,"",data[`_266`],{min:-99999,max:99999},'character_hp');
    formString += "<br>";

    formString += `<div class='stats_block'>`

    formString += generateNumberInput(`_267`,"ATK<br>",data[`_267`],{min:-99999,max:99999},'stat');
    formString += generateNumberInput(`_268`,"DEF<br>",data[`_268`],{min:-99999,max:99999},'stat');
    formString += generateNumberInput(`_269`,"MAG<br>",data[`_269`],{min:-99999,max:99999},'stat');


    formString += `</div>`


    formString += generateSelectCh2(`_271`,"<img src='images/Ring.png'>",data[`_271`],weapons,'grey_disable');
    formString += "<br>";
    formString += generateSelectCh2(`_272`,"<img src='images/Armor1.png'>",data[`_272`],armor,'grey_disable');
    formString += "<br>";
    formString += generateSelectCh2(`_273`,"<img src='images/Armor2.png'>",data[`_273`],armor,'grey_disable');
    formString += "<br><hr>";
    formString += "<div class='spells_title'><center>v Заклинания v</center></div>";

    formString += "<div class='spell_wrapper'>"
    for(var i = 0; i < 6; i++){
      formString += generateSelectCh2(`_${i+315}`,`Spell ${i+1} `,data[`_${i+315}`],spells,'spell_slot grey_disable');
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
      formString += generateSelectCh2(`_${(i*2)+330}`,`Slot ${i+1}<br>`,data[`_${(i*2)+330}`],items,'item_slot grey_disable');
    }
    formString += "</div>";
    formString += "</div>";


    //Key Items
    formString += "<div class='item_box'>";
    formString += "Ключ. предметы<br>";
    formString += "<div id='item_wrapper'>";
    for(var i = 0; i < 12; i++){
      formString += generateSelectCh2(`_${(i*2)+331}`,`Slot ${i+1}<br>`,data[`_${(i*2)+331}`],key_items,'item_slot grey_disable');
    }
    formString += "</div>";
    formString += "</div>";





    //Weapon Slots
    formString += "<div class='item_box'>";
    formString += "Оружие<br>";
    formString += "<div id='item_wrapper'>";
    for(var i = 0; i < 48; i++){
      formString += generateSelectCh2(`_${(i*2)+356}`,`Slot ${i+1}<br>`,data[`_${(i*2)+356}`],weapons,'item_slot grey_disable');
    }
    formString += "</div>";
    formString += "</div>";


    //Armor Slots
    formString += "<div class='item_box'>";
    formString += "Броня<br>";
    formString += "<div id='item_wrapper'>";
    for(var i = 0; i < 48; i++){
      formString += generateSelectCh2(`_${(i*2)+357}`,`Slot ${i+1}<br>`,data[`_${(i*2)+357}`],armor,'item_slot grey_disable');
    }
    formString += "</div>";
    formString += "</div>";




    //Item Storage
    formString += "<div class='item_box'>";
    formString += "Хранилище предметов<br>";
    formString += "<div id='item_wrapper'>";
    for(var i = 0; i < 36; i++){
      formString += generateSelectCh2(`_${i+452}`,`Slot ${i+1}<br>`,data[`_${i+452}`],items,'item_slot grey_disable');
    }
    formString += "</div>";
    formString += "</div>";


    //Item Storage
    formString += "<div class='item_box'>";
    formString += "Хранилище предметов<br>";
    formString += "<div id='item_wrapper'>";
    for(var i = 0; i < 24; i++){
      formString += generateSelectCh2(`_${i+452}`,`Слот ${i+1}<br>`,data[`_${i+452}`],items,'item_slot grey_disable');
    }
    formString += "</div>";
    formString += "</div>";


    //Lightworld Items
    formString += "<div class='item_box'>";
    formString += "Светлый мир - Предметы<br>";
    formString += "<div id='item_wrapper'>";
    for(var i = 0; i < 8; i++){
      formString += generateSelectCh2(`_${(i*2)+537}`,`Слот ${i+1}<br>`,data[`_${(i*2)+537}`],lightworld_items,'item_slot grey_disable');
    }
    formString += "</div>";
    formString += "</div>";



    

    //Phone Numbers
    formString += "<div class='item_box'>";
    formString += "Телефон<br>";
    formString += "<div id='item_wrapper'>";
    for(var i = 0; i < 8; i++){
      formString += generateSelectCh1(`_${(i*2)+538}`,`Слот ${i+1}<br>`,data[`_${(i*2)+538}`],phone_numbers,'item_slot grey_disable');
    }
    formString += "</div>";
    formString += "</div>";




    formString += "</div>";

    formString += `</div>`;
    formString += `<div id='tab_recruits' class='tab'>`;





    //Recruits
    formString += "<div id='recruit_box'>";
    formString += "Новобранцы<br>";
    formString += `<label class='lineItem'><input type="checkbox" name="show_all_recruits" noinput="true"> Показать всех новобранцев</label><br>`
    formString += "<div id='recruit_wrapper'>";
    for(var i = 0; i < recruits.length; i++){

      var unused = false;
      for(var j = 0; j < unused_recruits.length; j++){
        if(i == unused_recruits[j]){
          unused = true;
        }
      }
      console.log(i + ": "+data[`_${i+1153}`]);

      var recruited = (data[`_${i+1153}`] == 1 ? 1 : 0);


      formString += generateTextboxInput(`_${i+1153}`,`${recruits[i].text}<br>`,recruited,{min:0,max:1},`recruit${(unused ? " unused_recruit" : "")}`);

    }
    formString += "</div>";
    formString += "</div>";

    //Recruits in the cafe
    formString += "<div id='recruit_cafe_box'>";
    formString += "Новобранцы в кафе<br>";
    formString += `<label class='lineItem'><input type="checkbox" name="show_all_recruits_cafe" noinput="true"> Показать всех новобранцев</label><br>`
    formString += "<div id='recruit_cafe_wrapper'>";
    for(var i = 0; i < 4; i++){
        formString += generateSelectCh2(`_${i+1353}`,`Recruit ${i+1}`,data[`_${i+1353}`],recruits,'recruit_cafe');
    }
    formString += "</div>";
    formString += "</div>";


    formString += `</div>`;
    
    
    
    
    
    
    
    
    
    formString += `<div id="tab_hometown" class='tab'>`;
    //chapter 1 hometown flags
    formString += "<div id='flags_box'>";
    formString += "Разговоры с персонажами<br>";
    formString += generateSelectCh2(`_890`,"Разговаривал с Элвином",data[`_890`],[{value:0,text:`Нет`},{value:1,text:`О Герсоне или Молоте`},{value:2,text:`О Герсоне и Молоте`},{value:3,text:`Услышал, как говорит сам с собой`}],'');
    formString += generateSelectCh2(`_975`,"Разговаривал с Меттатоном",data[`_975`],[{value:0,text:`Нет`},{value:1,text:`О развлечениях`}],'');
    formString += generateSelectCh2(`_1014`,"Раковина в палате Руди",data[`_1014`],[{value:0,text:`Не взаимодействовал`},{value:1,text:`Взаимодействовал`}],'');
    formString += "</div>";
    
    
    
    formString += "<div id='flags_box'>";
    formString += "Катсцены<br>";
    formString += generateSelectCh2(`_861`,"Катсцена Санса и Ториэль",data[`_861`],[{value:0,text:`Не видел`},{value:1,text:`Видел катсцену`}],'');
    formString += generateSelectCh2(`_868`,"Катсцена бункера",data[`_868`],[{value:0,text:`Не видел`},{value:1,text:`Видел катсцену`}],'');
    formString += generateSelectCh2(`_869`,"Катсцена в больнице (Ноэль)",data[`_869`],[{value:0,text:`Не видел`},{value:1,text:`Видел катсцену`}],'');
    formString += generateSelectCh2(`_870`,"Побег пса из тюрьмы",data[`_870`],[{value:0,text:`Не видел`},{value:1,text:`Видел катсцену`},{value:2,text:`Мелодии побега`}],'');
    formString += generateSelectCh2(`_894`,"Сьюзи отказывается зайти в закусочную",data[`_894`],[{value:0,text:`Не видел`},{value:1,text:`Видел катсцену`}],'');
    formString += generateSelectCh2(`_933`,"Позвонил домой",data[`_933`],[{value:0,text:`Не видел`},{value:1,text:`Видел катсцену`}],'');
    formString += "</div>";
    
    
    
    formString += "<div id='flags_box'>";
    formString += "Онион<br>";
    formString += generateSelectCh2(`_978`,"Скучали по Ониону?",data[`_978`],[{value:0,text:`Нет ответа`},{value:1,text:`Да`},{value:2,text:`Нет`}],'');
    formString += generateSelectCh2(`_977`,"Разговаривал с Онионом",data[`_977`],[{value:0,text:`Нет`},{value:1,text:`Да`}],'');
    formString += "</div>";
    
    
    
    formString += "<div id='flags_box'>";
    formString += "Прочее<br>";
    formString += generateSelectCh2(`_855`,"Клубок барахла",data[`_855`],[{value:0,text:`Не собран`},{value:1,text:`На голове`},{value:2,text:`В Тёмном мире`}],'');
    formString += generateSelectCh2(`_895`,"Квест коробки шоколада",data[`_895`],[{value:0,text:`Не получена`},{value:1,text:`Уничтожена`},{value:2,text:`Съели с Сьюзи`},{value:3,text:`Отдали Альфис`}],'');
    formString += generateSelectCh2(`_983`,"Украл деньги Азриэля",data[`_983`],[{value:0,text:`Нет`},{value:1,text:`Да`}],'');
    formString += generateSelectCh2(`_992`,"Обратная кража яйца",data[`_992`],[{value:0,text:`Нет`},{value:1,text:`Да`}],'');

    formString += "</div>";
    
    
    
    formString += `</div>`;
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    formString += `<div id='tab_chapter1' class='tab'>`




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


formString += generateSelectCh2(`_773`,"Голова:",data[`_773`],thrasher_head_parts,'thrasher_select');
  formString += generateSelectCh2(`_774`,"Тело:",data[`_774`],thrasher_body_parts,'thrasher_select');
  formString += generateSelectCh2(`_775`,"Ноги:",data[`_775`],thrasher_feet_parts,'thrasher_select');


  formString += generateRangeInput(`_776`,"Цвет головы:",data[`_776`],{min:0,max:31},'hidden');
  formString += generateRangeInput(`_777`,"Цвет тела:",data[`_777`],{min:0,max:31},'hidden');
  formString += generateRangeInput(`_778`,"Цвет ног:",data[`_778`],{min:0,max:31},'hidden');

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
      formString += generateNumberInput(`_1453`,"ГОЛОВА ",data[`_1453`],{min:0,max:7},'flag');
      formString += generateNumberInput(`_1454`,"ТЕЛО ",data[`_1454`],{min:0,max:5},'flag');
      formString += generateNumberInput(`_1455`,"НОГИ ",data[`_1455`],{min:0,max:4},'flag');
      formString += `</div>`;
      formString += `</div>`;

      formString += `<div id='goner_right'>`;


      formString += generateSelectCh2(`_1456`,"Какая его любимая еда?<br>",data[`_1456`],goner_food);
      formString += generateSelectCh2(`_1457`,"Ваша любимая группа крови?<br>",data[`_1457`],goner_blood);
      formString += generateSelectCh2(`_1458`,"Какой цвет ему нравится больше?<br>",data[`_1458`],goner_color);
      formString += generateSelectCh2(`_1462`,"Пожалуйста, дайте ему подарок.<br>",data[`_1462`],goner_gift);
      formString += generateSelectCh2(`_1459`,"Что вы думаете о своём творении? (оно не услышит)<br>",data[`_1459`],goner_feel);


      formString += generateSelectCh2(`_1460`,"Вы ответили честно?<br>",data[`_1460`],[{value:0,text:`ДА`},{value:1,text:`НЕТ`}]);
      formString += generateSelectCh2(`_1461`,"Вы признаёте возможность боли и судорог.<br>",data[`_1461`],[{value:0,text:`ДА`},{value:1,text:`НЕТ`}]);

      formString += `</div>`;
      formString += `</div>`;
      formString += `</div>`;




      //chapter 1 hometown flags
      formString += "<div id='flags_box'>";
      formString += "Город<br>";
      formString += generateSelectCh2(`_808`,"Катсцена в больнице (Ноэль)",data[`_808`],[{value:0,text:`Не видел`},{value:1,text:`Видел катсцену`},{value:2,text:`Поговорил с Руди`}],'');
      formString += generateSelectCh2(`_809`,"Разговаривал с Бёрдли",data[`_809`],[{value:0,text:`Нет`},{value:1,text:`Да`}],'');
      formString += generateSelectCh2(`_810`,"Засунул пальцы в скамейку",data[`_810`],[{value:0,text:`Нет`},{value:1,text:`Да`}],'');
      formString += generateSelectCh2(`_811`,"Разговаривал с Онионом",data[`_811`],[{value:0,text:`Нет`},{value:1,text:`Да`},{value:2,text:`Стали друзьями`},{value:3,text:`Отказался дружить`}],'');
      formString += generateSelectCh2(`_812`,"Ваше имя (Онион)",data[`_812`],[{value:0,text:`Нет`},{value:1,text:`Крис`},{value:2,text:`Гиппопотам`}],'grey_disable');
      formString += generateSelectCh2(`_813`,"Имя Ониона",data[`_813`],[{value:0,text:`Нет`},{value:1,text:`Онион`},{value:2,text:`Красотка`},{value:3,text:`Азриэль II`},{value:4,text:`Отвратительно`}],'grey_disable');
      formString += generateSelectCh2(`_814`,"Бесплатный горячий шоколад",data[`_814`],[{value:0,text:`Не забрано`},{value:1,text:`Забрано`}],'');
      formString += generateSelectCh2(`_815`,"Катсцена с цветами Азгора",data[`_815`],[{value:0,text:`Не видел`},{value:1,text:`Зашёл в цветочный`},{value:2,text:`Получил букет`},{value:3,text:`Отдал букет Ториэль`},{value:4,text:`Ториэль выбросила букет`}],'');
      formString += generateSelectCh2(`_818`,"Разговаривал с Кэтти",data[`_818`],[{value:0,text:`Нет`},{value:1,text:`Да`}],'');
      formString += generateSelectCh2(`_822`,"Катсцена Альфис в переулке",data[`_822`],[{value:0,text:`Не видел`},{value:1,text:`Видел катсцену`}],'');
      formString += generateSelectCh2(`_823`,"Разговаривал с Андайн",data[`_823`],[{value:0,text:`Нет`},{value:1,text:`Да`}],'');
      formString += generateSelectCh2(`_824`,"Разговаривал с Бургерпэнцем",data[`_824`],[{value:0,text:`Нет`},{value:1,text:`Да`},{value:2,text:`Видел диалог`}],'');
      formString += generateSelectCh2(`_825`,"Звонок Ториэль",data[`_825`],[{value:0,text:`Нет`},{value:1,text:`Да`}],'');
      formString += generateSelectCh2(`_826`,"Разговаривал с Сансом",data[`_826`],[{value:0,text:`Нет`},{value:1,text:`Да`},{value:2,text:`Говорил о своём брате`}],'');
      formString += generateSelectCh2(`_827`,"Получил номер Санса",data[`_827`],[{value:0,text:`Нет`},{value:1,text:`Да`},{value:1,text:`Позвонил`}],'');
      formString += generateSelectCh2(`_828`,"Раковина в палате Руди",data[`_828`],[{value:0,text:`Не взаимодействовал`},{value:1,text:`Взаимодействовал`}],'');
      formString += generateSelectCh2(`_829`,"Разговаривал с Ноэль",data[`_829`],[{value:0,text:`Нет`},{value:1,text:`Да`},{value:2,text:`Говорила о Сьюзи`}],'');
      formString += generateNumberInput(`_830`,"Раз заходил в дом",data[`_830`],{min:0,max:8},'flag');
      formString += "</div>";



      //Misc chapter 1 flags

      formString += "<div class='flags_box'>";
      formString += "Прочие флаги<br>";
      formString += generateSelectCh2(`_659`,"Съел мох в тюрьме",data[`_659`],[{value:0,text:`Нет`},{value:1,text:`Да`}],'');
      formString += generateNumberInput(`_794`,"Квест Джевила (?)",data[`_794`],{min:0,max:7},'flag');
      formString += generateSelectCh2(`_807`,"The Original Starwalker",data[`_807`],[{value:0,text:`Нет`},{value:1,text:`Да`}],'');
      formString += generateNumberInput(`_1464`,"Яйца главы 1",data[`_1464`],{min:-99999,max:99999},'flag');
      formString += generateSelectCh2(`_805`,"Крис осмотрел кровати",data[`_805`],[{value:0,text:`Нет`},{value:1,text:`Да`}],'');
      formString += generateSelectCh2(`_806`,"Получен Спин-Кейк",data[`_806`],[{value:0,text:`Нет`},{value:1,text:`Да`}],'');
      formString += generateSelectCh2(`_760`,"Выбросил инструкцию",data[`_760`],[{value:0,text:`Нет`},{value:1,text:`Уронил раз`},{value:2,text:`Выброшена`}],'');
      formString += "</div>";




      formString += `</div>`;








formString += `<div id="tab_chapter2" class='tab'>`;


    //Other Flags
    formString += "<div id='flags_box'>";
    formString += "Прочие флаги<br>";
    formString += generateSelectCh2(`_587`,"Участники могут ДЕЙСТ.",data[`_587`],[{value:1,text:`Нет`},{value:0,text:`Да`}],'');
    formString += generateNumberInput(`_862`,"Прогресс Спамтона",data[`_862`],{min:0,max:9},'flag');
    formString += generateNumberInput(`_1468`,"Прогресс СноуГрейва",data[`_1468`],{min:0,max:9},'flag');
    formString += generateNumberInput(`_1478`,"Заморожено монстров",data[`_1478`],{min:0,max:45},'flag');
    formString += generateNumberInput(`_1015`,"Убито машин",data[`_1015`],{min:0,max:99999},'flag');
    formString += generateNumberInput(`_1471`,"Яйца главы 2",data[`_1471`],{min:-99999,max:99999},'flag');
    formString += generateSelectCh2(`_1010`,"Рука Бёрдли",data[`_1010`],[{value:1,text:`Здорова`},{value:0,text:`Не очень хорошо`}],'flag');
    formString += generateSelectCh2(`_1473`,"Крис ел мох",data[`_1473`],[{value:0,text:`Нет`},{value:1,text:`Да`}],'');
    formString += generateSelectCh2(`_1475`,"Сьюзи ела мох",data[`_1475`],[{value:0,text:`Нет`},{value:1,text:`Да`}],'');
    formString += generateSelectCh2(`_1474`,"Ноэль видела поедание мха",data[`_1474`],[{value:0,text:`Нет`},{value:1,text:`Да`}],'');
    formString += generateSelectCh2(`_878`,"Фото Ралсея",data[`_878`],[{value:0,text:`Нет`},{value:1,text:`Обнял принца`},{value:2,text:`Принц позирует`},{value:3,text:`Грубый принц`},{value:4,text:`Пустой принц`}],'');
    formString += generateSelectCh1(`_910`,"Завербован хакер",data[`_910`],[{value:0,text:`Нет`},{value:1,text:`Да`}],'');
    formString += "</div>";
    



    formString += `</div>`;





  return window.localizeGeneratedForm ? window.localizeGeneratedForm('ch4', formString) : formString;
}
