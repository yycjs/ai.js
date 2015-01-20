exports.drawLine = function (ctx, x1, y1, x2, y2, color) {
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
};

exports.randomColor = function () {
  var r = 255 * Math.random() | 0;
  var g = 255 * Math.random() | 0;
  var b = 255 * Math.random() | 0;
  return 'rgb(' + [r, g, b].join(',') + ')';
};

exports.eventToPoint = function (e) {
  return {
    x: e.pageX,
    y: e.pageY
  }
};

exports.normalize = function (data) {
  data = data.slice(0);

  if (data.length > 100) {
    data = data.slice(0, 100);
  } else {
    var remaining = 100 - data.length;
    for (var c = 0; c < remaining; c++) {
      data.push(0);
    }
  }

  return data;
};

exports.classify = function() {

}
