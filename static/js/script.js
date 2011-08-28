(function() {

  var routes = {
    '/': 'home'
  };

  var app = {};

  var lastURI;
  
  var highlightSquares = app.highlightSquares = false;

  var squares = app.squares = [];

  var initialize = app.initialize = function() {
    // Navigate according to the current hash.
    navigate();

    // Listen for hash changes.
    window.addEventListener('hashchange', function() {
      app.navigate();
    }, false);
  };

  var getURI = app.getURI = function() {
    var uri = window.location.hash;
    if (uri[0] === '#') uri = uri.substr(1);
    if (uri[0] != '/') uri = '/' + uri;
    return uri;
  };

  var navigate = app.navigate = function(uri) {
    var m, regex;
    uri = uri || getURI();
    if (uri === lastURI) {
      return;
    }
    for (var path in routes) {
      regex = new RegExp('^'+path.replace(':id', '([^/]+)').replace(/\//g, '\\/') + "$", 'gi');
      m = regex.exec(uri);
      if (m) {
        var id = m[1] || null;
        lastURI = uri;
        $('#page').empty();
        controller[routes[path]].apply(app, [id]);
        break;
      }
    }
  };

  var render = app.render = function(name, context) {
    return _.template($('#template-' + name).text(), context || app);
  };

  var playNote = app.playNote = function(note) {
    var sound = $('#sound-' + note.sound).get(0);
    if (!sound.paused) {
      sound.pause();
      sound.currentTime = 0.0;
    }
    sound.play();
    var color = note.server ? '#300' : '#030';
    squares[note.id].attr({fill: color}).animate({fill: '#000'}, 200, '<');
  }

  var controller = app.controller = {
    home: function() {
      $('#page').append(render('stage')).append(render('sounds'));
      var socket = io.connect();
      socket.on('note', function (note) {
        playNote(note);
      });

      var paper = Raphael('stage', 805, 505);
      for (var row = 0; row < 5; row++) {
        for (var col = 0; col < 8; col++) {
          var note = {sound: 'clap'};
          var c = paper.rect(col * 100 + 5, row * 100 + 5, 100, 100)
            .attr({fill: '#000', stroke: '#0e0', 'stroke-dasharray': '. ', 'stroke-width': 1})
            .click(function() {
              note.id = this.id;
              playNote(note);
              socket.emit('note', note);
            });
          squares[c.id] = c;
        }
      }
    }
  };

  $(function() {
    initialize();
  });

  window.app = app;

})();
