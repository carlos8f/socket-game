(function() {

  var routes = {
    '/': 'home'
  };

  var app = {};

  var lastURI;
  
  var highlightSquares = app.highlightSquares = false;

  var squares = app.squares = [];

  var tempo = 90;

  var playInterval = 0;

  var playPos = 0;

  var song = [];

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
    if (note.sound) {
      var sound = $('#sound-' + note.id).get(0);
      if (!sound.paused) {
        sound.currentTime = 0.0;
      }
      else {
        sound.play();
      }
    }
    squares[note.id].attr({fill: '#030'}).animate({fill: note.color}, 200, '<');
  }
  
  var tempoToMs = app.tempoToMs = function(tempo) {
    var beatsPerSecond = tempo / 60;
    var secondsPerBeat = 1 / beatsPerSecond;
    var msPerBeat = secondsPerBeat * 1000;
    var stepsPerBeat = 4;
    
    return msPerBeat / stepsPerBeat;
  };

  var play = app.play = function() {
    playInterval = setInterval(function() {
      // Play notes for this position.
      var col = [8 + playPos, 16 + playPos, 24 + playPos, 32 + playPos];
      _.each(col, function(pos) {
        if (song[pos]) {
          playNote(squares[pos].note);
        }
      });

      // Animate playhead.
      var note = {id: playPos, color: '#010'};
      playNote(note);

      // Advance the position.
      playPos += playPos == 7 ? -7 : 1;
    }, tempoToMs(tempo));
  }

  var noteOn = function(id) {
    song[id] = true;
    squares[id].attr({fill: squares[id].note.color});
  }

  var noteOff = function(id) {
    delete song[id];
    squares[id].attr({fill: '#000'});
  }

  var controller = app.controller = {
    home: function() {
      $('#page').append(render('stage')).append(render('sounds'));
      var socket = io.connect();

      var paper = Raphael('stage', 805, 505);

      for (var row = 0; row < 5; row++) {
        for (var col = 0; col < 8; col++) {
          var c = paper.rect(col * 100 + 5, row * 100 + 5, 100, 100).attr({fill: '#000', stroke: '#0e0', 'stroke-dasharray': '. ', 'stroke-width': 1});
          if (c.id > 7) {
            c.note = {id: c.id};
            if (c.id < 16) {
              c.note.sound = 'clap';
              c.note.color = '#300';
            }
            else if (c.id < 24) {
              c.note.sound = 'hihat';
              c.note.color = '#330';
            }
            else if (c.id < 32) {
              c.note.sound = 'snare';
              c.note.color = '#033';
            }
            else {
              c.note.sound = 'bass';
              c.note.color = '#303';
            }
            c.click(function() {
              if (song[this.id]) {
                noteOff(this.id);
                socket.emit('note off', this.id);
              }
              else {
                noteOn(this.id);
                socket.emit('note', this.note);
              }
            });
          }
          squares[c.id] = c;
        }
      }

      socket.on('song', function(serverSong) {
        for (id in serverSong) {
          if (serverSong[id]) {
            noteOn(id);
          }
        }
      });
      socket.on('note', function (note) {
        noteOn(note.id);
      });
      socket.on('note off', function (id) {
        noteOff(id);
      });

      play();
    }
  };

  $(function() {
    initialize();
  });

  window.app = app;

})();
