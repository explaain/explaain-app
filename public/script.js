var state = {};

var cards = {}; // object with key ids
var cardLists = []; cardLists[0] = [];
var focusPosition = [];
var tempCards;
var waitingForDoctop = true;
var ongoingKeyCounter = 0;
state.layers = 0;
var temp;


if (touchscreen != true) {
  $('body').addClass('desktop');
}
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
  json.key = key;
  json.title = json.name;
  json.body = parseMarkdown(json.description);
  if (json.moreDetail) {
    json.moreDetail = parseMarkdown(json.moreDetail);
  }
  cards[key] = json;
}

var importCards = function(url) { //Always returns an array
  url = getDataUrl(url); //Possibly unnecessary as it already happens in openLayer()
  var deferred = Q.defer();
  $.ajax({
     url: url
  }).done(function(json) {
    if (!Array.isArray(json)) { //If not already an array, then converts into an array of one item
      json = [json];
    }
    for (var i in json) {
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
  url = url.replace('app.explaain.com', 'api.explaain.com')
  url = url.replace('app.dev.explaain.com', 'api.dev.explaain.com')
  url = url.replace(/http:\/\/localhost:[0-9]+/, defaultSource)
  url = url.replace('/cards/', '/Detail/');
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
  $('.card[data-uri="' + uri + '"]').find('h2').html(json.title);
  $('.card[data-uri="' + uri + '"]').find('.body-content').html(json.body);
  if (json.moreDetail) {
    $('.card[data-uri="' + uri + '"]').find('.more-detail').html(json.moreDetail).prepend('<p class="label">More Detail</p>');
  }
  $('.card[data-uri="' + uri + '"]').closest('.card-carousel.layer').slick('setPosition'); //Forces Slick to refresh UI after potential card size change (e.g. after Loading)
}



var defaultSource = state.source || defaultSource || 'http://api.explaain.com'; //This now seems only to be used for the initial card
var initialUrl = state.cardUrl || state.searchUrl; // Not sure whether we still need the following: || defaultSource + '/' + initialCardType + '/' + initialCardID;

if (!initialUrl && state.embedType != 'overlay') {
  initialUrl = defaultSource + '/Person/search?name=may';
}

if (initialUrl) {
  importCards(initialUrl)
  .then(function(json) {
    openLayer(0, [json[0]['@id']], 0, -1);
  });
}



var cardTemplate = function (key, title, body, moreDetail, image, topic, showHeaderImage, standalone) {
  if (!image) {
    image = '//placekitten.com/300/200';
  }
  var standaloneClass = standalone ? ' standalone' : '';
  var template =  '<div class="card opening' + standaloneClass + '" data-uri="' + key + '" style="height: auto;">'
  +                 '<div class="card-visible">';
    // +                   '<div class="card-grey"><div></div></div>';
  if (showHeaderImage) {
    template +=         '<div class="header-image">'
                +         '<img src="' + image + '">'
                +         '<h3>'
                +           topic
                +         '</h3>'
                +       '</div>';
  } else {
    template +=         '<div class="close"><i class="fa fa-times" aria-hidden="true"></i></div>'
                +       '<h2>'
                +         title
                +       '</h2>'
  };
  template +=           '<div class="body-content">'
                +         '<p>'
                +           body.replace(/\s/g,' ')
                +         '</p>'
                +       '</div>';
  if (moreDetail) {
    template +=         '<div class="more-detail">'
                +         '<p class="label">More Detail</p>'
                +         '<p>'
                +           moreDetail.replace(/\s/g,' ')
                +         '</p>'
                +       '</div>'
  };
  template +=         '</div>'
                +     '<button class="edit-button"><i class="fa fa-pencil" aria-hidden="true"></i></button>'
                // +     '<div class="card-spacer"></div>'
                +   '</div>';
  return template;
};


var openLayer = function(layer, keys, slide, slideFrom) {
  $('.layer a').removeClass('active');
  var template = '';
  $.each(keys, function(i, key) {
    key = getDataUrl(key); //Should we maybe call this "url" from here onwards?
    var card = cards[key];
    if (!card) {
      card = {
        key: key,
        title: '',
        body: 'Loading...'
      };
      updateCard(key);
    }
    template = template + cardTemplate(card.key, card.title, card.body, card.moreDetail, card.coverImage, card.topic, card.headline);
  });
  var slideFromAttr = slideFrom!=-1 ? 'slide-from="' + slideFrom + '"' : '';
  template = '<div class="card-carousel layer layer-id-' + ongoingKeyCounter + '" id="layer-' + layer + '"' + slideFromAttr + '>' + template + '</div>';

  cardDOM = $(template).appendTo('.cards');

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
$("html").on("click", function(event){
  if( !$(event.target).is(".cards") ) {
    hideOverlay();
  }
});
$(".cards").on("click", "a", function(event){
  event.preventDefault();
  event.stopPropagation();
  if (state.embedLinkRoute) {
    window.parent.postMessage({ frameId: state.frameId, action: 'explaain-open', url:  $(this).attr('href')}, "*");
  } else {
    var slide = $(this).index();
    var slideFrom = $(this).closest('.card').index();//.slick('slickCurrentSlide');
    temp = $(this).closest('.layer > div');
    var layer = getLayerNumber($(this));
    var allKeys = [];
    $.each($(this).closest('.body-content').find('a'), function(i, link) {
      allKeys.push($(link).attr('href'));//.substring(1));
    });
    layer++;
    if (layer == state.layers) {
      openLayer(layer, allKeys, slide, slideFrom, -1);
    } else {
      layerGoToSlide(layer, slide);
    }
  }
});
$(".cards").on("click", "div.close", function(){
  event.stopPropagation();
  // var card = $(this).closest('.card');
  layer = getLayerNumber($(this));
  closeLayer(layer, true);
});
$(".cards").on("click", ".card", function(){
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
$(".cards").on("click", ".card .edit-button", function(){
  event.stopPropagation();
  var key = $(this).closest('.card').attr('data-uri');
  window.parent.postMessage({action: 'edit', id: key}, "*");
});


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
      case "open": //Does exactly the same as 'preview' but the card id variable is called 'key' not 'id'
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


var parseMarkdown = function(text) {
  return markdown.toHTML(text);
}
