var utils = require('./utils');
var Rx = require('rx');
var brain = require('brain');

var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var width = canvas.width;
var height = canvas.height;

var socket = io.connect();
var color = utils.randomColor();

// var hasTouch = 'ontouchstart' in document.documentElement;
var downs = Rx.Observable.fromEvent(canvas, "mousedown").map(utils.eventToPoint);
var moves = Rx.Observable.fromEvent(canvas, "mousemove").map(utils.eventToPoint);
var ends = Rx.Observable.fromEvent(canvas, "mouseup").map(utils.eventToPoint);
var drags = downs.map(function () {
  return moves.takeUntil(ends);
});
var data = [];
var net = new brain.NeuralNetwork();
var loadNetwork = function() {
  socket.emit('classify::find', {}, function(error, data) {
    console.log('Initialized network from server');
    net.fromJSON(data);
  });
};

loadNetwork();

socket.on('trainings created', loadNetwork);

drags.subscribe(function (drag) {
  var diffs = Rx.Observable.zip(drag, drag.skip(1), function (p1, p2) {
    return [p1, p2];
  });

  diffs.subscribe(function (points) {
    var p1 = points[0];
    var p2 = points[1];
    utils.drawLine(ctx, p1.x, p1.y, p2.x, p2.y, color);
  });
});

drags.subscribe(function (drag) {
  var trainingData = Rx.Observable.zip(drag, function (point) {
    return [ point.x / width, point.y / height ];
  });

  trainingData.subscribe(function (points) {
    data.push.apply(data, points);
  });
});

$('.modal').modal({ show: false });

var training = false;
var processResult = function(data) {
  $('.modal').modal('show');
  console.log(data);

  var html = 'I have no idea. What were you trying to teach me?';

  if(data) {
    var current = 0;
    var result = '';
    Object.keys(data).forEach(function(name) {
      if(data[name] > current) {
        current = data[name];
        result = name;
      }
    });
    if(result) {
      html = 'I think you meant <strong>' + result + '</strong>. Is that correct?';
    }
    $('[name="letter"]').val(result)
  }

  $('#description').html(html);
};
var toggleTraining = function(flag) {
  training = flag;
  var button = $('#record');
  if(training) {
    button.html('Stop recording');
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    data = [];
  } else {
    processResult(net.run(data));
    button.html('Record gesture');
  }
};

$('#train').click(function() {
  var name = $('[name="letter"]').val().toUpperCase();
  var output = {};

  if(!name) {
    return;
  }

  output[name] = 1;

  socket.emit('trainings::create', {
    input: utils.normalize(data),
    output: output
  }, {}, function(error, data) {
    console.log('Added training', data);
    $('.modal').modal('hide');
  });
});

$('#record').click(function() {
  toggleTraining(!training);
});

$(window).on('resize', function() {
  var radius = 10;

  width = canvas.width = $(canvas).width();
  height = canvas.height = $(canvas).height();

  ctx.lineWidth = 2 * radius;
  ctx.lineCap = 'round';
}).trigger('resize');

$(canvas).mousedown(function() {
  if(!training) {
    toggleTraining(true);
  }
});
