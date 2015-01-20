var utils = require('./utils');
var Rx = require('rx');
var brain = require('brain');

var canvas = document.getElementById('canvas');
var width = canvas.width = 800;
var height = canvas.height = 600;

var ctx = canvas.getContext('2d');
var radius = 10;
ctx.lineWidth = 2 * radius;
ctx.lineCap = 'round';

var socket = io.connect();
var color = utils.randomColor();
var downs = Rx.Observable.fromEvent(document.body, "mousedown").map(utils.eventToPoint);
var moves = Rx.Observable.fromEvent(document, "mousemove").map(utils.eventToPoint);
var ends = Rx.Observable.fromEvent(document, "mouseup").map(utils.eventToPoint);
var drags = downs.map(function () {
  return moves.takeUntil(ends);
});
var data = [];
var net = new brain.NeuralNetwork();

function loadNetwork() {
  socket.emit('classify::find', {}, function(error, data) {
    net.fromJSON(data);
    console.log('Initialized network from server');
  });
}

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

var training = false;
Rx.Observable.fromEvent(document.getElementById('training'), 'click').subscribe(function(ev) {
  training = !training;

  if(training) {
    data = [];
    ev.target.innerHTML = 'Finish training';
  } else {
    var output = {};
    output[document.getElementById('name').value] = 1;

    socket.emit('trainings::create', {
      input: utils.normalize(data),
      output: output
    }, {}, function(training) {
      console.log('Created training', training);
    });

    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    ev.target.innerHTML = 'Start training';
  }
});

var reading = false;
Rx.Observable.fromEvent(document.getElementById('run'), 'click').subscribe(function() {
  reading = !reading;

  if(!reading) {
    var padded = utils.normalize(data);
    console.log(net.run(padded));
  } else {
    ctx.clearRect(0, 0, width, height);
    data = [];
  }
});
