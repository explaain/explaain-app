var cards = {}; // object with key ids
var cardLists = []; cardLists[0] = [];
var focusPosition = [];
var tempCards;
var waitingForDoctop = true;
var ongoingKeyCounter = 0;
var layers = 0;
var temp;
var frameId;


if (touchscreen != true) {
  $('body').addClass('desktop');
}
if (getParameterByName('frameId')) {
  frameId = getParameterByName('frameId');
}
if (getParameterByName('embed') == 'true' && getParameterByName('embedType') != 'overlay') {

  // Tell the page to resize the iframe after content has loaded into it
  window.parent.postMessage({ frameId: frameId, action: 'explaain-resize', height: $('body').outerHeight(), width: $('body').outerWidth() }, "*");

  // Tell the page to resize the iframe if the page has been reized
  $(window).resize(function() {
    window.parent.postMessage({ frameId: frameId, action: 'explaain-resize', height: $('body').outerHeight(), width: $('body').outerWidth() }, "*");
  });
}

var hideOverlay = function() {
  closeAllLayers();
  if (getParameterByName('embedType') == 'overlay') {
    window.parent.postMessage({ frameId: frameId, action: 'explaain-hide-overlay' }, "*");
  }
}



var importCardsByType = function(source, type, openFirstCard) {
  source = source.replace(/\/$/, "");
  $.ajax({
     url: source + '/' + type + "/search"
   }).done(function(json) {
    //  cards = json;
     for (var i in json) {
       var key = json[i]['@id'];
       cards[key] = json[i];
       cards[key].key = cards[key]['@id'];
       cards[key].title = cards[key].name;
       cards[key].body = parseMarkdown(cards[key].description);
       if (cards[key].moreDetail) {
         cards[key].moreDetail = parseMarkdown(cards[key].moreDetail);
       }
     }
     if (openFirstCard) {
       openLayer(0, [json[0]['@id']], 0, -1);
     }
   });
}

var importCardByUrl= function(url) {
  $.ajax({
     url: url
   }).done(function(json) {
     var key = json['@id'];
     cards[key] = json;
     cards[key].key = cards[key]['@id'];
     cards[key].title = cards[key].name;
     cards[key].body = parseMarkdown(cards[key].description);
     openLayer(0, [json['@id']], 0, -1);
   });
}

var importCardsBySearch = function(url) {
  $.ajax({
     url: url
   }).done(function(json) {
    //  cards = json;
     for (var i in json) {
       var key = json[i]['@id'];
       cards[key] = json[i];
       cards[key].key = cards[key]['@id'];
       cards[key].title = cards[key].name;
       cards[key].body = parseMarkdown(cards[key].description);
     }
     openLayer(0, [json[0]['@id']], 0, -1);
   });
}

var dataSource = getParameterByName('source') || defaultSource || 'http://api.explaain.com';
var initialCardUrl = getParameterByName('cardUrl');
var initialSearchUrl = getParameterByName('searchUrl');
if (!initialCardUrl && initialCardType && initialCardID) {
  initialCardUrl = dataSource + '/' + initialCardType + '/' + initialCardID;
}
if (initialCardUrl) {
  importCardByUrl(initialCardUrl);
} else if (initialSearchUrl) {
  importCardsBySearch(initialSearchUrl);
} else {

  if ( dataSource != 'googledoc' ) {
    var importInitialCard = false;
    if (getParameterByName('embedType') != 'overlay') {
      importInitialCard = true;
      importCardsBySearch(dataSource + '/Person/search?name=may');
    }

    // importCardsByType(dataSource, 'Detail', false);
    // importCardsByType(dataSource, 'Event', false);
    // importCardsByType(dataSource, 'Headline', false);
    // importCardsByType(dataSource, 'Organization', false);
    // importCardsByType(dataSource, 'Person', importInitialCard);
    // importCardsByType(dataSource, 'Place', false);

  } else {

    $.doctop({
      url: '//docs.google.com/document/d/1L_yGS9DQeCCY49MIVVpuB4Vaiz6o7P3BnEbcYqox10A/pub',
      archieml: true,
      callback: function(d){
        if (waitingForDoctop) {
          waitingForDoctop = false;
          console.dir(d);
          tempCards = d.copy.archie.cards;
          for (i=0; i<tempCards.length; i++) {
            if (tempCards[i].id != "") {
              cards[tempCards[i].id] = tempCards[i];
            }
          }
          openLayer(0, [0], 0, -1);
        }
      }
    });

    window.setTimeout(function() {
      // if (waitingForDoctop) {
        waitingForDoctop = false;
        console.log('Doctop not loaded - using backup data...');
    }, 300);
  }
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
    template +=         '<i class="fa fa-times close" aria-hidden="true"></i>'
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
  $('.layer i.close').hide();
  $('.layer a').removeClass('active');
  var template = '';
  $.each(keys, function(i, key) {
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

  // template = '<div class="card-carousel">'
  //     + '<div style="background:blue; height: auto; width: 300px;">Hello</div>'
  //     + '<div style="background:blue; height: auto; width: 300px;">Hello<br>Hello</div>'
  //     + '<div style="background:blue; height: auto; width: 300px;">Hello</div>'
  //     + '</div>';

  cardDOM = $(template).appendTo('.cards');

  // $('#' + (ongoingKeyCounter-1)).slick('unslick');
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


  layers++;
  ongoingKeyCounter++;

  $('.card').removeClass('opening');
  focusLayer(layer);
}

var closeLayer = function(layer) {
  $('#layer-' + layer).find('.card').addClass('removed');
  $('#layer-' + layer).fadeOut(500, function() { $(this).remove(); });
  layers--;
  var prevLayer = layer - 1;
  $('#layer-' + prevLayer).find('a').removeClass('active');
  $('#layer-' + prevLayer).find('i.close').show();
  focusLayer(prevLayer);
}

var closeAllLayers = function() {
  for (i=layers-1; i>=0; i--) {
    closeLayer(i);
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

var scrollToCard = function(layer, slide) {
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
    if (getParameterByName('embedType') == 'overlay') {
      window.parent.postMessage({ frameId: frameId, action: 'explaain-hide-overlay' }, "*");
    }
  }
});
$(".cards").on("click", "a", function(event){
  event.preventDefault();
  event.stopPropagation();
  if (getParameterByName('embedLinkRoute') == 'true') {
    window.parent.postMessage({ frameId: frameId, action: 'explaain-open', url:  $(this).attr('href')}, "*");
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
    if (layer ==  layers) {
      openLayer(layer, allKeys, slide, slideFrom, -1);
    } else {
      layerGoToSlide(layer, slide);
    }
  }
});
$(".cards").on("click", "i.close", function(){
  event.stopPropagation();
  // var card = $(this).closest('.card');
  layer = getLayerNumber($(this));
  closeLayer(layer);
});
$(".cards").on("click", ".card", function(){
  event.stopPropagation();
  var layer = getLayerNumber($(this));
  var targetLayer = layer + 1;
  if(!$(event.target).is("a") && !$(event.target).is("i.close") && !$(event.target).is(".edit-button") && !$(event.target).is(".edit-button i") ) {
    targetLayer--;
    if (layer == layers-1) {
      var slide = $(this).closest('.card').index();
      layerGoToSlide(layer, slide);
    }
  }
  if (targetLayer < layers - 1) {
    for (i = layers - 1; i > targetLayer; i--) {
      closeLayer(i);
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


if (getParameterByName('editing') == 'true') {
  addStyleString('.card:hover .edit-button { display: block; }');
  window.addEventListener('message', function(event) {
       switch (event.data.action) {
          case "update":
            updateCard(event.data.id);
            break;
          case "preview":
            closeAllLayers();
            openLayer(0, [event.data.id], 0, 0);
            break;
          }
     }, false);
}

window.addEventListener('message', function(event) {
   switch (event.data.action) {
      case "open": //Does exactly the same as 'preview' but the card id variable is called 'key' not 'id'
        closeAllLayers();
        openLayer(0, [event.data.key], 0, 0);
        break;
      }
 }, false);


function updateCard(uri) {
  $.ajax({
    url: uri
  }).done(function(json) {
    cards[uri] = json;
    cards[uri].key = json['@id'];
    cards[uri].title = json.name;
    cards[uri].body = parseMarkdown(json.description);
    if (json.moreDetail) {
      cards[uri].moreDetail = parseMarkdown(json.moreDetail);
    }
    updateCardDOM(uri, json);
  }).fail(function() {
    var failJson = {
      image: '',
      name: '',
      description: 'Card not found',
    }
    updateCardDOM(uri, failJson);
  });
}

function updateCardDOM(uri, json) {
  $('.card[data-uri="' + uri + '"]').find('.header-image img').html(json.image);
  $('.card[data-uri="' + uri + '"]').find('.header-image h3').html(json.name);
  $('.card[data-uri="' + uri + '"]').find('h2').html(json.name);
  $('.card[data-uri="' + uri + '"]').find('.body-content').html(parseMarkdown(json.description));
  if (json.moreDetail) {
    $('.card[data-uri="' + uri + '"]').find('.more-detail').html(json.moreDetail).prepend('<p class="label">More Detail</p>');
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

//This is probably now unnecessary
var insertMarkdownLinks = function(text, links) {
  var i = 0;
  text = text.replace(/\[(.+?)\]/g, function($1) {
    var linkText = $1.replace(/[\[\]]/g, '');
    var href = (links && links[i]) ? links[i] : '';
    var link = '<a href="#'+href+'">'+linkText+'</a>';
    i++;
    return link;
  });
  return text;
}


var parseMarkdown = function(text) {
  return markdown.toHTML(text);
}
