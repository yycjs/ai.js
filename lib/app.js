var path = require('path');
var feathers = require('feathers');
var memory = require('feathers-memory');
var app = feathers();
var brain = require('brain');
var net = new brain.NeuralNetwork();

app.configure(feathers.rest())
  .configure(feathers.socketio())
  .use('/trainings', memory())
  .use('/classify', {
    find: function(params, callback) {
      callback(null, net.toJSON());
    }
  })
  .use(feathers.static(path.join(__dirname, '..', 'public')));

var trainings = app.service('trainings');

trainings.on('created', function() {
  trainings.find({}, function(error, data) {
    net = new brain.NeuralNetwork();

    var result = net.train(data);
    console.log('Re-trained network', result);
  });
});

app.listen(3030);
