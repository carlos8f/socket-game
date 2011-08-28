var express = require('express'),
    app = module.exports = express.createServer(),
    conf = require('./conf.js'),
    _ = require('underscore'),
    io = require('socket.io').listen(app),
    song = [];

app.configure(function() {
  app.use(app.router);
  app.use(express.static(__dirname + '/static'));
  app.enable('jsonp callback');
});
app.configure('development', function() {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});
app.configure('production', function() {
  app.use(express.errorHandler()); 
});
io.configure('development', function() {
  //io.set('transports', ['xhr-polling']);
});

app.get('/', function(req, res) {
  res.sendfile(__dirname + '/views/index.html');
});

io.sockets.on('connection', function (socket) {
  socket.emit('song', song);
  socket.on('note', function (note) {
    song[note.id] = true;
    socket.broadcast.emit('note', note);
  });
  socket.on('note off', function (id) {
    delete song[id];
    socket.broadcast.emit('note off', id);
  });
});

if (!module.parent) {
  app.listen(conf.port);
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
}
