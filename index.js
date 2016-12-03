// var sass = require('node-sass');
var express = require('express');
var app = express();
var MobileDetect = require('mobile-detect');


app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// app.get('/', function(request, response) {
//   response.render('pages/index');
// });



var getTouchscreen = function(request) {
  md = new MobileDetect(request.headers['user-agent']);
  if (md.mobile() == null && md.tablet() == null) {
    return false;
  } else {
    return true;
  }
}

app.get('/', function(request, response) {
  var touchscreen = getTouchscreen(request);

  response.render('pages/demo', { touchscreen : touchscreen, defaultSource : process.env.SOURCE, initialCardType: null , initialCardID: null });
});

app.get('/:type/:cardID', function(request, response) {
  var touchscreen = getTouchscreen(request);

  response.render('pages/demo', { touchscreen : touchscreen, defaultSource : process.env.SOURCE, initialCardType: request.params.type , initialCardID: request.params.cardID });
});


app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
