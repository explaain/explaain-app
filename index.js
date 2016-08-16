require('newrelic');
var cool = require('cool-ascii-faces');
// var sass = require('node-sass');
var express = require('express');
var app = express();


app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  response.render('pages/index');
});


/* Temporary? */
app.get('/demo', function(request, response) {
  var MobileDetect = require('mobile-detect'),
      md = new MobileDetect(request.headers['user-agent']);
      if (md.mobile() == null && md.tablet() == null) {
        var touchscreen = false;
      } else {
        var touchscreen = true;
      }

  response.render('pages/demo', { touchscreen : touchscreen });
});

app.get('/hello.html', function(request, response) {
  response.writeHead(301, {
    'Location': '/'
  });
  response.end();
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

// sass.render({
//   file: 'views/scss.main.scss',
//   [, options..]
// }, function(err, result) { /*...*/ });
// OR
// var result = sass.renderSync({
//   file: 'views/scss.main.scss',
//   outFile: 'public/main1.css'
// });
