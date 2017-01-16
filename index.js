// var sass = require('node-sass');
var express = require('express');
var app = express();
var MobileDetect = require('mobile-detect');
var mongoose = require('mongoose');
var serialize = require('./lib/serialize-json');

// Handler for DB Connection Errors
mongoose.connection.on('error', function(err) {
  console.error("MongoDB error", err);
});

// Connect to the Mongo DB (mLab on Heroku uses MONGOLAB_URI)
mongoose.connect( process.env.MONGODB || process.env.MONGOLAB_URI || 'mongodb://localhost/structured-data' );

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

app.get('/cards/:id', function(req, res) {
  if (req.params.id === null) {
    if (req.xhr) {
      return res.status(400).json({ error: "Card ID required" });
    } else {
      return res.redirect("/")
    }
  }
  
  // Is JSON request then get card directly form the database
  mongoose.connection.db
  .collection('entities')
  .findOne({_id: mongoose.Types.ObjectId(req.params.id)}, function(err, entity) {
    if (err) return res.status(500).json({ error: "Unable to fetch card" });

    if (!entity)
      return res.status(404).json({ error: "Card ID not valid" });

    var card = serialize.toJSON(entity)

    if (req.xhr) {
      return res.json( card );
    } else {
      var touchscreen = getTouchscreen(req);
      return res.render('pages/demo', { touchscreen : touchscreen, defaultSource : process.env.SOURCE, card: card, initialCardType: card['@type'] , initialCardID: entity._id });
    }
  });

});

app.get('/:type/:cardID', function(request, response) {
  var touchscreen = getTouchscreen(request);
  response.render('pages/demo', { touchscreen : touchscreen, defaultSource : process.env.SOURCE, initialCardType: request.params.type , initialCardID: request.params.cardID });
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
