(function() {

  var routes = {
    '/': 'home'
  };

  var app = {};

  var lastURI;
  
  var highlightSquares = app.highlightSquares = false;

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

  var mouseCoords = app.mouseCoords = function(e) {
    var posx = 0;
    var posy = 0;
    if (!e) var e = window.event;
    if (e.pageX || e.pageY) 	{
      posx = e.pageX;
      posy = e.pageY;
    }
    else if (e.clientX || e.clientY) 	{
      posx = e.clientX + document.body.scrollLeft
        + document.documentElement.scrollLeft;
      posy = e.clientY + document.body.scrollTop
        + document.documentElement.scrollTop;
    }
    posx -= ($(document.body).width() / 2) - ($('#stage').width() / 2);
    posy -= 50;
    if (posx < 0) {
      posx = 0;
    }
    if (posx > 800) {
      posx = 800;
    }
    if (posy < 0) {
      posy = 0;
    }
    if (posy > 500) {
      posy = 500;
    }
    return [posx, posy];
  };

  var snapCoords = app.snapCoords = function(coords) {
    return [
      (Math.floor((coords[0] / $('#stage').width()) * 7) * 100) + 50,
      (Math.floor((coords[1] / $('#stage').height()) * 7) * 100) + 50
    ];
  };

  var controller = app.controller = {
    home: function() {
      $('#page').append(render('stage'));
      for (var i = 0; i < 8 * 5; i++) {
        $('#stage').append('<div class="square"></div>');
      }

      if (app.highlightSquares) {
        var delay = 0;

        $('.square').each(function() {
          var context = this;
          setTimeout(function() {
            $(context).addClass('ok');

            setTimeout(function() {
              $(context).removeClass('ok');
            }, 200);
          }, delay);
          delay += 40;
        });
      }

      var dotEl = document.createElement('div');
      $('#stage').append(dotEl);
      var $myDot = $(dotEl);
      $myDot.addClass('dot');
      $myDot.css('left', 38).css('top', 38);

      $('.square').mousedown(function(e) {
        var $square = $(e.currentTarget);
        if (app.highlightSquares) {
          $square.addClass('ok');
          setTimeout(function() {
            $square.removeClass('ok');
          }, 100);
        }
        var pos = $square.position();
        $myDot.animate({left: parseInt(pos.left) + 38, top: pos.top + 38}, 200, 'easeInOutCubic');
      });

      $('.square').eq(0).mousedown();
    }
  };

  $(function() {
    initialize();
  });

  window.app = app;

})();
