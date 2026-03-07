
var thrasher_head = [
  {width:100,height:52,image:'spr_thrashweapon_laser_0.png'},
  {width:108,height:56,image:'spr_thrashweapon_sword_0.png'},
  {width:104,height:52,image:'spr_thrashweapon_flame_0.png'},
  {width:92,height:84,image:'spr_thrashweapon_duck_0.png'},
]


var thrasher_body = [
  {width:168,height:100,image:'spr_thrashbody_b_0.png'},
  {width:168,height:100,image:'spr_thrashbody_b_1.png'},
  {width:168,height:100,image:'spr_thrashbody_b_2.png'},
  {width:168,height:100,image:'spr_thrashbody_b_3.png'},
]


var thrasher_feet = [
  {width:136,height:44,image:'spr_thrashfoot_ch1_0.png'},
  {width:136,height:44,image:'spr_thrashfoot_ch1_1.png'},
  {width:136,height:44,image:'spr_thrashfoot_ch1_2.png'},
  {width:136,height:44,image:'spr_thrashfoot_ch1_3.png'},
]

  function _renderPart(selector, part, color) {
    var el = document.querySelector(selector);
    if (!el) return;
    el.style.width = part.width + 'px';
    el.style.height = part.height + 'px';

    var canvas = el.querySelector('canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.style.display = 'block';
      el.appendChild(canvas);
    }
    canvas.width = part.width;
    canvas.height = part.height;

    var ctx = canvas.getContext('2d');
    var img = new Image();
    img.onload = function () {
      ctx.clearRect(0, 0, part.width, part.height);
      ctx.drawImage(img, 0, 0, part.width, part.height);
      ctx.globalCompositeOperation = 'source-in';
      ctx.fillStyle = 'rgb(' + Math.round(color[0]) + ',' + Math.round(color[1]) + ',' + Math.round(color[2]) + ')';
      ctx.fillRect(0, 0, part.width, part.height);
      ctx.globalCompositeOperation = 'source-over';
    };
    img.src = 'images/thrash/transparent/' + part.image;
  }

  function GenerateThrasher(_head, _body, _feet, _c1, _c2, _c3) {
    _renderPart('#thrash_head', thrasher_head[_head], _c1);
    _renderPart('#thrash_body', thrasher_body[_body], _c2);
    _renderPart('#thrash_feet', thrasher_feet[_feet], _c3);
    _renderPart('#thrash_feet2', thrasher_feet[_feet], _c3);

    var feet2 = document.querySelector('#thrash_feet2');
    if (feet2) feet2.style.display = (_feet == 2 ? 'none' : 'inherit');
  }
