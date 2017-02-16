var state = {};

var cards = {}; // object with key ids
var cardLists = []; cardLists[0] = [];
var focusPosition = [];
var tempCards;
var waitingForDoctop = true;
var ongoingKeyCounter = 0;
state.layers = 0;
var CardTemplates = {};

var Count = 0;


if (touchscreen != true) {
  $('body').addClass('desktop');
}
state.controlGroup = getParameterByName('controlGroup') || false;
state.frameParent = getParameterByName('frameParent') || null;
state.frameParentRoot = urlDomain(state.frameParent)
state.frameId = getParameterByName('frameId');
state.embed = getParameterByName('embed') == "true";
state.embedType = getParameterByName('embedType');
state.source = getParameterByName('source');
state.cardUrl = getParameterByName('cardUrl');
state.searchUrl = getParameterByName('searchUrl');
state.embedLinkRoute = getParameterByName('embedLinkRoute') == "true";
state.editing = getParameterByName('editing') == "true";


if (state.embed) {
  // Tell the page to resize the iframe after content has loaded into it
  updateFrameSize();

  // Tell the page to resize the iframe if the page has been reized
  $(window).resize(function() {
    updateFrameSize();
  });
}

var hideOverlay = function() {
  if (state.embedType == 'overlay') {
    closeAllLayers(false);
    window.parent.postMessage({ frameId: state.frameId, action: 'explaain-hide-overlay' }, "*");
  }
}

var publishCard = function(json) {
  var key = json['@id'];
  cards[key] = json;
}

var getCards = function(key) {
  var deferred = Q.defer();

  var card = cards[key];
  if (card) {
    deferred.resolve([card]);
  } else {
    importCards(key)
    .then(function(returnedCards) {
      deferred.resolve(returnedCards);
    })
  }

  return deferred.promise;
}

var importCards = function(url) { //Always returns an array
  var deferred = Q.defer();

  url = getDataUrl(url); //Possibly unnecessary as it already happens in openLayer()
  $.ajax({
     url: url
  }).done(function(json) {
    if (!Array.isArray(json)) { //If not already an array, then converts into an array of one item
      json = [json];
    }
    for (var i in json) {
      json[i] = parseCard(json[i]);
      publishCard(json[i]);
    }
    deferred.resolve(json);
  }).fail(function(){
    deferred.resolve([]);
  });

  return deferred.promise;
}

var getDataUrl = function(key) {
  var url = key;
  url = url.replace('app.explaain.com', 'api.explaain.com');
  url = url.replace('app.dev.explaain.com', 'api.dev.explaain.com');
  url = url.replace(/http:\/\/localhost:[0-9]+/, defaultSource);
  url = url.replace('/cards/', '/Detail/');
  if (window.location.protocol == 'https:') {
    url = url.replace('http://api.explaain.com', 'https://explaain-api.herokuapp.com');
    url = url.replace('http://api.dev.explaain.com', 'https://explaain-api-dev.herokuapp.com');
  }
  return url;
}


var importCardsByType = function(source, type) { //Quite possibly no longer needed
  source = source.replace(/\/$/, "");
  var url = source + '/' + type + "/search";
  importCards(url);
}



function updateCard(uri) {
  importCards(uri)
  .then(function(json) {
    updateCardDOM(uri, json[0]);
  });
}

function updateCardDOM(uri, json) {
  if (!json) {
    json = {
      title: '',
      body: 'Card not found',
    }
  }

  getCardFormatTemplate(json)
  .then(function(template) {
    $('.card[data-uri="' + uri + '"]').find('.content').html(template);

    $('.card[data-uri="' + uri + '"]').closest('.card-carousel.layer').slick('setPosition'); //Forces Slick to refresh UI after potential card size change (e.g. after Loading)

    $( '.card[data-uri="' + uri + '"] .card-image img' ).load(function() { //Forces another Slick refresh after image load (should be cleaned up using Q promises!)
      $('.card[data-uri="' + uri + '"]').closest('.card-carousel.layer').slick('setPosition');
    });
  });
}



var defaultSource = state.source || defaultSource || 'http://api.explaain.com'; //This now seems only to be used for the initial card
var initialUrl = state.cardUrl || state.searchUrl; // Not sure whether we still need the following: || defaultSource + '/' + initialCardType + '/' + initialCardID;

if (initialCardType && initialCardID) {
  initialUrl = defaultSource + '/' + initialCardType + '/' + initialCardID;
}

if (!initialUrl && state.embedType != 'overlay') {
  initialUrl = defaultSource + '/Person/search?name=may';
}

if (initialUrl) {
  importCards(initialUrl)
  .then(function(json) {
    openLayer(0, [json[0]['@id']], 0, -1);
  });
}

var getCardType = function(card) {
  return card['@type'] ? /[^/]*$/.exec(card['@type'])[0] : 'card';
}

var getIfNecessary = function(path, necessaryObject, necessaryProperty) {
  var deferred = Q.defer();

  if (necessaryObject[necessaryProperty]) {
    deferred.resolve();
  } else {
    $.get(path, function(result) {
      necessaryObject[necessaryProperty] = result;
      deferred.resolve();
    });
  }

  return deferred.promise;
}

var getTemplate = function(type) {
  var deferred = Q.defer();

  getIfNecessary('/cards/' + type + '.mst', CardTemplates, type)
  .then(function() {
    deferred.resolve();
  });

  return deferred.promise;
}

var getCardFormatTemplate = function(card) {
  var deferred = Q.defer();

  var type = getCardType(card);
  getTemplate(type)
  .then(function() {
    var rendered = Mustache.render(CardTemplates[type], card);
    deferred.resolve(rendered);
  })

  return deferred.promise;
}

var getCardTemplate = function(card) {
  var deferred = Q.defer();

  getCardFormatTemplate(card)
  .then(function(formatTemplate) {
    getTemplate('card')
    .then(function() {
      var type = getCardType(card);
      var data = {uri: card['@id'], type: type, content: formatTemplate};
      var rendered = Mustache.render(CardTemplates['card'], data);
      deferred.resolve(rendered);
    });
  });

  return deferred.promise;
}



var openLayer = function(layer, keys, slide, slideFrom) {
  $('.layer a').removeClass('active');
  var template = '';
  var getCardPromises = [];
  var templatePromises = [];
  $.each(keys, function(i, key) {
    var key = getDataUrl(key); //Should we maybe call this "url" from here onwards?
    getCardPromises[i] = getCards(key)
    .then(function(returnedCards) {
      var card = returnedCards[0];
      templatePromises[i] = getCardTemplate(card, false);
    })
  });

  Q.allSettled(getCardPromises)
  .then(function(results) {
    Q.allSettled(templatePromises)
    .then(function(results) {
      results.forEach(function (resultTemplate) {
        template += resultTemplate.value;
      });

      var slideFromAttr = slideFrom!=-1 ? 'slide-from="' + slideFrom + '"' : '';
      template = '<div class="card-carousel layer layer-id-' + ongoingKeyCounter + '" id="layer-' + layer + '"' + slideFromAttr + '>' + template + '</div>';

      cardDOM = $(template).appendTo('.cards');

      $.each(keys, function(j, key) {
        var key = getDataUrl(key);
        $( '.card[data-uri="' + key + '"] .card-image img' ).load(function() { //Forces another Slick refresh after image load (should be cleaned up using Q promises!)
          $('.card[data-uri="' + key + '"]').closest('.card-carousel.layer').slick('setPosition');
        });
      });

      $('.layer-id-' + ongoingKeyCounter).slick({
        dots: false,
        infinite: false,
        adaptiveHeight: true,
        centerMode: true,
        centerPadding: '15px',
        slidesToShow: 1,
        arrows: false,
        initialSlide: slide
      });

      state.layers++;
      ongoingKeyCounter++;

      $('.card').removeClass('opening');
      setTimeout(function() { //This makes sure the iframe resizes after th 0.5s transition in the CSS
        updateFrameSize();
      }, 600)
      focusLayer(layer);
    });
  });

}

var closeLayer = function(layer, allowHideOverlay) {
  $('#layer-' + layer).find('.card').addClass('removed');
  $('#layer-' + layer).fadeOut(500, function() { $(this).remove(); });
  state.layers--;
  if(state.layers > 0) {
    var prevLayer = layer - 1;
    $('#layer-' + prevLayer).find('a').removeClass('active');
    if (prevLayer > 0) {
      // $('#layer-' + prevLayer).find('div.close').show();
    }
    focusLayer(prevLayer);
  } else if (allowHideOverlay) {
    hideOverlay();
  }
}

var closeAllLayers = function(thenHideOverlay) {
    for (i=state.layers-1; i>=0; i--) {
    closeLayer(i, thenHideOverlay);
  }
}

var focusLayer = function(layer) {
  var slide = getLayerCurrentCard(layer);
  highlightLink(layer, slide);
  scrollToCard(layer, slide);
  var slideFrom = $('#layer-' + layer).attr('slide-from');
  var slideFromN = parseInt(slideFrom) + 1;
  if (layer > 1) {
    var prevLayer = layer - 1;
    $('#layer-' + prevLayer).find('.card').addClass('removed');
    $('#layer-' + prevLayer).find('.card:nth-child(' + slideFromN + ')').removeClass('removed');
    $('#layer-' + prevLayer).slick('slickSetOption', 'swipe', false);
    // $('#layer-' + prevLayer).slick('slickSetOption', 'dots', false);
  }
  $('#layer-' + layer).find('.card').removeClass('removed');
  $('#layer-' + layer).slick('slickSetOption', 'swipe', true);
  // $('#layer-' + layer).slick('slickSetOption', 'dots', true);
}

var layerGoToSlide = function(layer, slide) {
  $('#layer-' + layer).slick('slickGoTo', slide);
}


var getLayerNumber = function(layerDOM) {
  var layer = parseInt(layerDOM.closest('.layer').attr('id').split('-')[1]);
  return layer;
}

var getLayerCurrentCard = function(layer) {
  var slide = 0
  if (layer > 0) {
    slide = $('#layer-' + layer).slick('slickCurrentSlide');
  }
  return slide;
}

var scrollToCard = function(layer, slide) { //Not sure whether this is working?
  if (layer > 0) {
    var slideN = parseInt(slide) + 1;
    var cardDOM = $('#layer-' + layer).find('.card:nth-child(' + slideN + ')');
    var scrollPos = cardDOM.offset().top + cardDOM.height() - document.body.clientHeight + 30;
    $('html,body').stop().animate({scrollTop: scrollPos},'medium');
  }
}




//UI Interaction
$("body > .body-double").on("click", function(event){
  if( !$(event.target).is(".cards") ) {
    hideOverlay();
  }
});
$(".cards").on("click", "a", function(event){
  if ($(this).attr('href') != "http://explaain.com") { //Probably need a better way of doing this!
    event.preventDefault();
    event.stopPropagation();
    if (state.embedLinkRoute) {
      window.parent.postMessage({ frameId: state.frameId, action: 'explaain-open', url:  $(this).attr('href')}, "*");
    } else {
      var slide = $(this).index();
      var slideFrom = $(this).closest('.card').index();//.slick('slickCurrentSlide');
      var layer = getLayerNumber($(this));
      var allKeys = [];
      $.each($(this).closest('.body-content').find('a'), function(i, link) {
        allKeys.push($(link).attr('href'));//.substring(1));
      });
      layer++;
      if (layer == state.layers) {
        openLayer(layer, allKeys, slide, slideFrom, -1);
      } else if (slide == $('#layer-' + layer).slick('slickCurrentSlide')) {
        closeLayer(state.layers-1, true);
      } else {
        layerGoToSlide(layer, slide);
      }
    }
  }
});
$(".cards").on("click", "div.close", function(event){
  event.stopPropagation();
  // var card = $(this).closest('.card');
  layer = getLayerNumber($(this));
  closeLayer(layer, true);
});
$(".cards").on("click", ".card", function(event){
  event.stopPropagation();
  var layer = getLayerNumber($(this));
  var targetLayer = layer + 1;
  if(!$(event.target).is("a") && !$(event.target).is("div.close") && !$(event.target).is(".edit-button") && !$(event.target).is(".edit-button i") ) {
    targetLayer--;
    if (layer == state.layers-1) {
      var slide = $(this).closest('.card').index();
      layerGoToSlide(layer, slide);
    }
  }
  if (targetLayer < state.layers - 1) {
    for (i = state.layers - 1; i > targetLayer; i--) {
      closeLayer(i, true);
    }
  }
});
$(".cards").on("click", ".card .edit-button", function(event){
  event.stopPropagation();
  var key = $(this).closest('.card').attr('data-uri');
  window.parent.postMessage({action: 'edit', id: key}, "*");
});


// BEGIN QUIZ

$(".cards").on("click", ".card .content.Question .answers:not(.answered) .answer p", function(event){
  event.stopPropagation();
  if (!$(this).closest('.content').hasClass('answered')) {
    $(this).closest('.content').addClass('answered');
    $(this).closest('.answer').addClass('selected');
    var key = $(this).closest('.card').attr('data-uri');
    $(this).closest('.answers').find('.answer:nth-child(' + cards[key].correctAnswer + ')').addClass('correct');
    var correct = parseInt(cards[key].correctAnswer) == $(this).closest('.answer').index() + 1;
    window.parent.postMessage({ frameId: state.frameId, action: 'explaain-answer', correct: correct}, "*");
  }
});

// END QUIZ





// On before slide change
$('.cards').on('beforeChange', '.card-carousel', function(event, slick, currentSlide, nextSlide){
  var layer = getLayerNumber($(this));
  highlightLink(layer, nextSlide);

  scrollToCard(layer, nextSlide);
  // var scrollPos = cardDOM.offset().top + cardDOM.find('.card').height() - document.body.clientHeight + 20;
  // $('html,body').stop().animate({scrollTop: scrollPos},'medium');
});

var highlightLink = function(layer, slide) {
  layer--;
  var slideN = parseInt(slide) + 1;
  $('#layer-' + layer).find('.body-content a').removeClass('active');
  $('#layer-' + layer).find('.body-content a:nth-child(' + slideN + ')').addClass('active');
}


$(document).keydown(function(e) {
    switch(e.which) {
        case 37: // left
        break;

        case 38: // up
        focusCard(0, focusPosition[0]-1);
        break;

        case 39: // right
        break;

        case 40: // down
        focusCard(0, focusPosition[0]+1);
        break;

        default: return; // exit this handler for other keys
    }
    e.preventDefault(); // prevent the default action (scroll / move caret)
});

var reDrawIfOutOfSync = function() {
  window.setTimeout(function() {
    if (!checkSync()) {
      reDrawCards();
    }
  }, 500);
}
var checkSync = function() {
  var inSync = true;
  $('.card:not(.removed)').each(function(i, card) {
    var focusedDOM = !$(card).hasClass('faded');
    var focusedData = i == focusPosition[0];
    var keyDOM = getKeyFromCardDOM(0,i);
    var keyData = cardLists[0][i];
    if (focusedDOM != focusedData || keyDOM != keyData) {
      inSync = false;
    }
  });
  return inSync;
}
var reDrawCards = function() { // If DOM cards don't match card data then run this to sort everything out (currently just refocuses correctly)
  console.log('Something got out of sync so we\'re redrawing the cards in the DOM');
  focusCard(0,focusPosition[0]);
}


$('.cards').on("click", function() {
  // printCards();
});



var printCards = function() {
  window.setTimeout(function() {
    $.each(cardLists[0], function(i, key) {
      var focused = i == focusPosition[0] ? '*' : '';
      console.log(focused + i + ' - ' + key + ': ' + cards[key].title);
    });
    console.log('---------------');
    $('.card:not(.removed)').each(function(i, card) {
      var focused = !$(card).hasClass('faded') ? '*' : '';
      var key = getKeyFromCardDOM(0,i);
      console.log(focused + i + ' - ' + key + ': ' + cards[key].title);
    });
    console.log('===============');
  }, 100);
}

$( window ).resize(function() {
  $('.card').each(function() {
    $(this).find('.card-visible').css({ 'width': $(this).find('.card-spacer').css('width') });
  });
});


if (state.editing) {
  addStyleString('.card:hover .edit-button { display: block; }');
  window.addEventListener('message', function(event) {
       switch (event.data.action) {
          case "update":
            updateCard(event.data.key);
            break;
          }
     }, false);
}

window.addEventListener('message', function(event) {
   switch (event.data.action) {
      case "open":
        closeAllLayers(false);
        openLayer(0, [event.data.key], 0, 0);
        break;
      }
 }, false);


function updateFrameSize() {
  if (state.embed && state.embedType != 'overlay') { // Probably need to make this work for overlays too
    window.parent.postMessage({ frameId: state.frameId, action: 'explaain-resize', height: $('body').outerHeight(), width: $('body').outerWidth() }, "*");
  }
}






function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function addStyleString(str) {
    var node = document.createElement('style');
    node.innerHTML = str;
    document.body.appendChild(node);
}

var parseCard = function(card) {
  card = parseCardEncodes(card);
  card = parseCardMarkdown(card);
  return card;
}

var parseCardEncodes = function(card) {
  var eligibleFields = [
    'embedCode'
  ]
  eligibleFields.forEach(function(field) {
    if (card[field]) {
      card[field] = decodeURIComponent(card[field]).replace(/&quot;/g, '"');;
    }
  })
  return card;
}

var parseCardMarkdown = function(card) {
  var eligibleFields = [
    'description',
    'body',
    'moreDetail',
    'caption',
    'question',
    'answer1',
    'answer2',
    'answer3',
    'answer4',
  ]
  eligibleFields.forEach(function(field) {
    if (card[field]) {
      card[field] = parseMarkdown(card[field]);
    }
  })
  return card;
}

var parseMarkdown = function(text) {
  return markdown.toHTML(text);
}


function urlDomain(data) {
  var    a      = document.createElement('a');
         a.href = data;
  return data ? a.hostname : null;
}
