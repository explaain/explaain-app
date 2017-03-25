var state = {};

var cards = {}; // object with key ids
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
  initialUrl = defaultSource + '/Person/search?name=hammond';
}

if (initialUrl) {
  importCards(initialUrl)
  .then(function(json) {
    // openLayer(0, [json[0]['@id']], 0, -1);
    showCard(json[0]['@id'], 'open');
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


//This should be called immediately from click and should handle all situations, e.g. card loaded/not loaded; layer loaded/not loaded etc
var showCard = function(triggerTarget, triggerType) {
  var toPos, toDOM, fromPos, fromDOM, fromURI, toLayerKeys;

  switch (triggerType) {
    case 'open':
      toURI = getTargetURI(triggerTarget, 'card');
      fromPos = [-1, -1];
      toPos = [0, 0];
      toLayerKeys = [toURI];
      break;

    case 'link':
      toURI = getTargetURI(triggerTarget, 'link');
      fromPos = getCardPosition(triggerTarget);
      fromDOM = getCardDOM(triggerTarget);
      toLayerKeys = getCardLinks(fromDOM);
      toPos = getSelectedCardPos(fromPos, toURI, toLayerKeys);
      break;

    case 'select':
      toPos = getCardPosition(triggerTarget);
      fromPos = [ toPos[0]-1, 0 ];
      fromDOM = getCardDOM(fromPos);
      toLayerKeys = getCardLinks(fromDOM);
      break;

    case 'close':
      closePos = getCardPosition(triggerTarget);
      toURI = getTargetURI([ closePos[0]-1, 0 ], 'card');
      fromPos = [ closePos[0]-2, 0 ];
      fromDOM = getCardDOM(fromPos);
      toLayerKeys = getCardLinks(fromDOM);
      toPos = getSelectedCardPos(fromPos, toURI, toLayerKeys);
      break;
  }

  console.log(toURI, toPos, toDOM, fromPos, fromDOM, toLayerKeys);

  var layerManipPromises = [];

  console.log(toPos[0]);
  console.log(state.layers);
  console.log(toPos[0] + 1 - state.layers);

  switch ( Math.sign(toPos[0] + 1 - state.layers) ) {
    case (+1):
      //Opening on a new layer
      layerManipPromises[0] = openLayer(toPos[0], toLayerKeys, toPos[1], fromPos[1]);
      console.log(toPos[0], toLayerKeys, toPos[1], fromPos[1]);
      break;

    case (0):
      //Opening on current layer
      layerManipPromises[0] = resolvedPromise();
      break;

    case (-1):
      //Opening on a previous layer (meaning we also close existing layers)
      for(i = toPos[0] + 1; i < state.layers; i++) {
        layerManipPromises[i - toPos[0] - 1] = closeLayer(i, true);
      }
      break;
  }

  Q.allSettled(layerManipPromises)
  .then(function() {
    state.layers = toPos[0] + 1;
    layerGoToSlide(fromPos, toPos);
  });

}

var resolvedPromise = function() {
    var deferred = Q.defer();
    deferred.resolve();
    return deferred.promise;
}

var getSelectedCardPos = function(fromPos, toURI, toLayerKeys) {
   return [ fromPos[0]+1, $.inArray(toURI, toLayerKeys) ];
}

// Whether target is a URI, Position or a DOM element, this returns the relevant card DOM element
var getTargetType = function(target) {
  if (Array.isArray(target)) {
    return 'position';
  } else {
    try {
      if ($(target)) {
        return 'DOM';
      }
    } catch(e) {
      return 'URI';
    }
  }
}

// Whether target is a URI, Position or DOM element, this returns the relevant card URI or 'a' element's href attribute
var getTargetURI = function(target, type) {
  console.log(target, type, getTargetType(target));
  var uri;
  switch (getTargetType(target)) {
    case 'URI':
      uri = target;
      break;
    case 'position':
      uri = $($('#layer-' + target[0] + ' .card.slick-slide:not(.removed)')[target[1]]).attr('data-uri');
      break;
    case 'DOM':
      switch (type) {
        case 'link':
          uri = $(target).attr('href');
          break;

        case 'card':
          uri = $(target).closest('.card').attr('data-uri');
          break;
      }
      break;
  }

  if (!uri || !uri.length) {
    uri = -1;
  }

  console.log(uri);
  return uri;
}

// Whether target is a URI, Position or a DOM element, this returns the relevant card DOM element
var getCardDOM = function(target) {
  var cardDOM;
  switch (getTargetType(target)) {
    case 'URI':
      cardDOM = $('.card.slick-slide[data-uri="' + target + '"]');
      break;
    case 'position':
      cardDOM = $($('#layer-' + target[0] + ' .card.slick-slide:not(.removed)')[target[1]]);
      break;
    case 'DOM':
      cardDOM = $(target).closest('.card');
      break;
  }

  if (!cardDOM || !cardDOM.length) {
    cardDOM = -1;
  }

  return cardDOM;
}

//Returns an array of [layer #, card #], both starting at 0. 'target' can be cardDOM, URI or [layer, URI]
var getCardPosition = function(target) {
  var cardPos = [];
  switch (getTargetType(target)) {
    case 'URI':
      cardPos[0] = $('.card.slick-slide[data-uri="' + target + '"]').closest('.card-carousel.layer').index();
      cardPos[1] = $('.card.slick-slide[data-uri="' + target + '"]').index();
      break;
    case 'position':
      cardPos = target;
      break;
    case 'DOM':
      cardPos[0] = $(target).closest('.card-carousel.layer').index();
      cardPos[1] = $(target).closest('.card.slick-slide').index();
      break;
  }

  if (!cardPos || !cardPos.length) {
    cardPos = -1;
  }

  return cardPos;




  targetDOM = getCardDOM(target);

  var layerPos = $(targetDOM).closest('.card-carousel.layer').index();
  var cardPos = $(targetDOM).closest('.card.slick-slide').index();

  return [layerPos, cardPos];
}

var getCardLinks = function(target) {
  var allKeys = [];
  $.each($(target).find('.body-content').find('a'), function(i, link) {
    allKeys.push($(link).attr('href'));
  });
  return allKeys;
}

var checkHideOverlay = function() {
  if (state.layers == 0) {
    hideOverlay();
  }
}

var openLayer = function(layer, keys, slide, slideFrom) {
  var deferred = Q.defer();

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

      ongoingKeyCounter++;

      $('.card').removeClass('opening');
      setTimeout(function() { //This makes sure the iframe resizes after th 0.5s transition in the CSS
        updateFrameSize();
      }, 600)
      focusLayer(layer);

      deferred.resolve();
    });
  });

  return deferred.promise;
}

var closeLayer = function(layer, allowHideOverlay) {
  var deferred = Q.defer();

  $('#layer-' + layer).find('.card').addClass('removed');
  $('#layer-' + layer).fadeOut(500, function() { $(this).remove(); });

  if (state.layers == 0 && allowHideOverlay) {
    hideOverlay();
  }

  deferred.resolve();

  return deferred.promise;
}

var closeAllLayers = function(thenHideOverlay) {
  for (i=state.layers-1; i>=0; i--) {
    closeLayer(i, thenHideOverlay);
  }
  state.layers = 0;
}

var focusLayer = function(layer) {
  // highlightLink(layer, slide);
  scrollToLayer(layer);
  var slideFrom = $('#layer-' + layer).attr('slide-from');
  var slideFromN = parseInt(slideFrom) + 1;
  if (layer > 1) {
    console.log(slideFromN);
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

var layerGoToSlide = function(fromPos, toPos) {
  $('#layer-' + toPos[0]).slick('slickGoTo', toPos[1]);
  focusLayer(toPos[0]);
  fromPos[1] = 0;
  highlightLink(fromPos, toPos);
  checkHideOverlay();
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

var scrollToLayer = function(layer) {
  var layerDOM = $('#layer-' + layer);
  try {
    var scrollPos = layerDOM.offset().top + layerDOM.height() - document.body.clientHeight + 30;
  } catch(e) {

  }
  $('html,body').stop().animate({scrollTop: scrollPos},'medium');
}

//This also un-highlights every single other link in all cards on all layers
var highlightLink = function(fromPos, toPos) {
  if (Array.isArray(fromPos)) {
    var slideN = parseInt(fromPos[1]) + 1;
    $('.card-carousel.layer').find('.body-content a').removeClass('active');
    $($('.card-carousel.layer#layer-' + fromPos[0]).find('.card:not(.removed)')[fromPos[1]]).find('.body-content a:nth-child(' + (toPos[1]+1) + ')').addClass('active');
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
      showCard($(this), 'link');
    }
  }
});
$(".cards").on("click", "div.close", function(event){
  event.stopPropagation();
  layer = getLayerNumber($(this));
  showCard($(this), 'close');
});
$(".cards").on("click", ".card", function(event){
  event.stopPropagation();
  showCard($(this), 'select');
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
  highlightLink( [layer-1, 0], [layer, nextSlide] );
  scrollToLayer(layer);
});


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
    // var keyData = cardLists[0][i]; // cardLists no longer exists!
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
        console.log(event);
        // openLayer(0, [event.data.key], 0, 0);
        showCard(event.data.key, 'open');
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


//Modified version from use.explaain.com - not yet fully tested and should probably merge the two somehow!
checkExplaainLink = function(target) {
  var href = target;
  if ( target.tagName === 'A' || ( target.parentNode && target.parentNode.tagName === 'A' ) ) {
    href = target.getAttribute('href') || target.parentNode.getAttribute('href');
  }

  var acceptableDomains = ['api.explaain.com\/.+', 'app.explaain.com\/.+', 'api.dev.explaain.com\/.+', 'app.dev.explaain.com\/.+']
  if (new RegExp(RegExp.escape(acceptableDomains.join("|")).replace(/\\\|/g,'|').replace(/\\\.\\\+/g,'.+')).test(href)) {
    return href;
  } else {
    return false
  }
}

RegExp.escape = function(str) {
  return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
};
