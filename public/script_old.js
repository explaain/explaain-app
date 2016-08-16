var cards = {}; // object with key ids
var cardLists = []; cardLists[0] = [];
var focusPosition = [];
var tempCards;
var waitingForDoctop = true;

$.doctop({
  url: '//docs.google.com/document/d/1BgNrI3z6tnDtayH0L4mEJqu1C9PjJ8sscVw6vr41s_0/pub',
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
      // openCard(0, null);
    }
  }
});

window.setTimeout(function() {
  if (waitingForDoctop) {
    waitingForDoctop = false;
    console.log('Doctop not loaded - using backup data...');
    cards = {"0":{"id":"0","topic":"Heathrow Drone","title":"Drone hits Heathrow plane","body":"<a href=\"#1\">A British Airways flight from Geneva</a> is <a href=\"#2\">believed to have hit a drone</a> before <a href=\"#8\">landing safely at Heathrow</a> airport, raising <a href=\"#3\">concerns over aviation safety</a>.","headline":"true","coverImage":"https://pixabay.com/static/uploads/photo/2015/12/29/13/13/drone-1112752_960_720.jpg","draftOrAuthor":"yukiko"},"1":{"id":"1","topic":"Heathrow Drone","title":"A British Airways flight","body":"The flight BA727 from Geneva to Heathrow was carrying 132 passengers and 5 crew. <a href=\"#5\">The Airbus A320</a> plane <a href=\"#7\">was cleared to take off the next flight after being examined</a>.","draftOrAuthor":"yukiko"},"2":{"id":"2","topic":"Heathrow Drone","title":"Believed to have hit a drone","body":"The pilot reported an object that is believed to be a drone struck the front of <a href=\"#1\">the flight</a>, and it would be the first incident of its kind in the UK if confirmed. \n        <a href=\"#6\">The investigation is underway</a>.","draftOrAuthor":"yukiko"},"3":{"id":"3","topic":"Drone and aviation safety","title":"Concerns over aviation safety and drone","body":"<a href=\"#10\">Pilots have called for an investigation</a> into the likely effects of <a href=\"#9\">a drone strike on an aircraft</a> last month, following <a href=\"#4\">a report on their near-misses</a>.","draftOrAuthor":"yukiko"},"4":{"id":"4","topic":"Drone and aviation safety","title":"Report by the UK Airpox Board","body":"There were 23 near-misses between drones and aircraft in the 6 months between April and October last year.","draftOrAuthor":"yukiko"},"5":{"id":"5","topic":"Heathrow Drone","title":"Airbus A320 family","body":"The A320 manufactured by Airbus typically seats 150 passengers in a two-class cabin, and is commonly used by commercial flights.","draftOrAuthor":"yukiko"},"6":{"id":"6","topic":"Heathrow Drone","title":"Investigation on ‘drone’ claim","body":"Police says no arrests have been made. \n        The British Airline will give the police “every assistance with their investigation”.","draftOrAuthor":"yukiko"},"7":{"id":"7","topic":"Heathrow Drone","title":"Quote","body":"A British Airways spokesperson said: \n        “Our aircraft landed safely, was fully examined by our engineers and it was cleared to operate its next flight”.","draftOrAuthor":"yukiko"},"8":{"id":"8","topic":"Heathrow Drone","title":"Landing safely at Heathrow airport","body":"Despite a hit by an object, believed to be a drone, the flight with 132 passengers and 5 crew <a href=\"#7\">landed safely without damage to the aircraft</a>.","draftOrAuthor":"yukiko"},"9":{"id":"9","topic":"Drone and aviation safety","title":"Drone strike on aircraft","body":"<a href=\"#11\">People who fly drones</a> close to planes could be convicted of endangering aviation safety, which has a maximum prison sentence of five years, according to the Civil Aviation Authority.","draftOrAuthor":"yukiko"},"10":{"id":"10","topic":"Drone and aviation safety","title":"Pilots have called for an investigation","body":"The British Airline Pilots Association wants the Department for Transport and the Civil Aviation Authority to investigate into the effects of <a href=\"#9\">a drone strike on an aircraft</a>.","draftOrAuthor":"yukiko"},"11":{"id":"11","topic":"Drone and aviation safety","title":"People flying drones","body":"<a href=\"#12\">The Civil Aviation Authority is focusing on educating people</a> who use drones, fearing that many of them are not familiar with the legal issues.","draftOrAuthor":"yukiko"},"12":{"id":"12","topic":"Drone and aviation safety","title":"CAA and “dronecode”","body":"The Civil Aviation Authority launched Dronecode to simplify the rules over drones.","draftOrAuthor":"yukiko"}};
    openCard(0, null);
  }
}, 3000);

var cardCarouselTemplate = function (id, title, body, image, topic, showHeaderImage) {
  if (!image) {
    image = '//placekitten.com/300/200';
  }
  var template =  '<div class="card-carousel">'
    +               '<div class="card opening" id="card-' + id + '">'
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
                +       '</div>'
                +     '</div>'
                // +     '<div class="card-spacer"></div>'
                +   '</div>'
                +   '<div class="card"><div class="card-visible"><i class="fa fa-times close" aria-hidden="true"></i><div class="body-content"><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p></div></div></div>'
                +   '<div class="card"><div class="card-visible"><i class="fa fa-times close" aria-hidden="true"></i><div class="body-content"><p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p></div></div></div>'
                + '</div>';
  return template;
};

var cardTemplate = function (id, title, body, image, topic, showHeaderImage) {
  if (!image) {
    image = '//placekitten.com/300/200';
  }
  var template =  '<div class="card opening" id="card-' + id + '">'
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
                +       '</div>'
                +     '</div>'
                // +     '<div class="card-spacer"></div>'
                +   '</div>';
  return template;
};

// DOM Requests
var getKeyFromCardDOM = function(list, pos) { // Doesn't select list yet
  return $('.cards .card:not(.removed):eq(' + pos + ')').attr('id').split('-')[1];
}
var getPosition = function(cardDOM) {
  return $('.card:not(.removed)').index(cardDOM);
}


var openLayer = function(keys, index) {
  var template = '';
  $.each(keys, function(key, i) {
    var card = cards[key];
    template = template + cardTemplate(card.id, card.title, card.body, card.coverImage, card.topic, card.headline);
  });
  template = '<div class="card-carousel">' + template + '</div>';

  cardDOM = $(template).appendTo('.cards');

  $('.card-carousel').slick({
    dots: true,
    infinite: false,
    // adaptiveHeight: true,
    centerMode: true,
    centerPadding: '15px',
    slidesToShow: 1,
    arrows: false
  });

  $('.card').removeClass('opening');
}








// Manipulate Card DOM
var focusCardDOM = function(position) {
  // console.log('focusCardDOM', position);
  var cardDOM = $('.cards .card:not(.removed):eq(' + position + ')');
  var previousPosition = position==0 ? position : position-1;
  var previousCardDOM = $('.cards .card:not(.removed):eq(' + previousPosition + ')');
  $('.card').addClass('faded').removeClass('opening');
  cardDOM.removeClass('faded');
  $('.card .card-visible').each(function() {
    var newZIndex = parseInt($(this).css('z-index')) - 1;
    // $(this).css('z-index',newZIndex);
  });
  cardDOM.find('.card-visible').css({ 'width': cardDOM.find('.card-spacer').css('width') }); // Not sure why but this is still necessary! For when cards first load.
  console.log(cardDOM.offset().top);
  console.log(cardDOM.find('.card-visible').height());
  console.log(document.body.clientHeight);
  var scrollPos = cardDOM.offset().top + cardDOM.find('.card-visible').height() - document.body.clientHeight + 20;
  console.log(scrollPos);
  console.log('---------');
 //previousCardDOM.offset().top - 80
  $('html,body').stop().animate({scrollTop: scrollPos},'slow');
  setZValues();
  reDrawIfOutOfSync();
}
var addCardDOM = function(list, cardKey, position) {
  var card = cards[cardKey];
  var template = cardCarouselTemplate(card.id, card.title, card.body, card.coverImage, card.topic, card.headline);
  var cardDOM;
  if (position != -1 && $('.card:not(.removed)').length) { //Doesn't yet handle multiple lists
    var openerCard = $('.cards .card:not(.removed):eq(' + (position-1) + ')');
    cardDOM = $(template).insertAfter(openerCard);
  } else {
    cardDOM = $(template).appendTo('.cards');
  }
  window.setTimeout(function() {
    cardDOM.find('.card-spacer').css('height', cardDOM.find('.card-visible').height());
    // focusCard(0, position);
  }, 100);
  reDrawIfOutOfSync();
}
var removeCardDOM = function(list, position) {
  $('.cards .card:not(.removed):eq(' + (position) + ')').addClass('removed').fadeOut(500, function() { $(this).remove(); }); // Needs to change height gradually
  reDrawIfOutOfSync();
}
var moveCardDOM = function(list, moveFrom, moveTo) { // This should soon have a move animation instead of just removing then adding
  var key = getKeyFromCardDOM(list, moveFrom);
  addCardDOM(0, key, moveTo);
  var newMoveFrom = moveTo < moveFrom ? moveFrom+1 : moveFrom; //Reflects the fact that moveTo has been inserted and pushed subsquent elements forward
  removeCardDOM(0, newMoveFrom); // moveFrom has already been adjusted and passed here from moveCard function
  reDrawIfOutOfSync();
}
var setZValues = function() { // Doesn't yet handle multiple lists
  $('.card:not(.removed)').each(function(i, card) {
    var zValue = 1000 - Math.abs(i - focusPosition[0]);
    var zScale = 1 - Math.pow(0.6, Math.abs(i - focusPosition[0]));
    // $(card).find('.card-visible').css({'z-index': zValue, 'transform': 'scale(' + (1 - zScale/4) + ',' + (1 - zScale/4) + ')'});
    // $(card).find('.card-grey').css('background', 'rgba(221,221,221,' + zScale + ')');
  });
}

// Top-level commands (data manipulation which relies on Specific Card Functions)
var openCard = function(cardToOpen, positionFrom) {
  if (positionFrom == null || positionFrom < 0) {
    positionFrom = cardLists[0].length - 1;
  }
  var existingCardPos = cardLists[0].indexOf(cardToOpen);
  if (existingCardPos == -1) {
    addCard(0, cardToOpen, positionFrom + 1);
  } else {
    moveCard(0, existingCardPos, positionFrom + 1);
  }
    focusCard(0, positionFrom + 1);
}
var closeCard = function(list, cardPos) {
  removeCard(list, cardPos);
  if (focusPosition[list] == cardPos) {
    if (cardPos == cardLists[list].length) {
      focusCard(list, cardPos-1);
    } else {
      focusCard(list, cardPos);
    }
  }
}

// Specific Card Functions that trigger, and correspond to, DOM Functions
var focusCard = function(list, position) {
  if (position >= 0 && position < cardLists[list].length) {
    focusPosition[list] = position;
    window.setTimeout(function() {
      focusCardDOM(position);
      window.setTimeout(function() {
        $.each(cardLists[list], function(i, card) {
          if (i > position) {
            console.log('i: ' + i + ', position: ' + position);
            removeCard(list, i);
          }
        });
      }, 100);
    }, 10);
  }
}
var addCard = function(list, cardKeyToOpen, position) {
  insertCard(list, cardKeyToOpen, position);
  addCardDOM(0, cardKeyToOpen, position);
}
var removeCard = function(list, pos) {
  deleteCard(list, pos);
  removeCardDOM(list, pos);
}
var moveCard = function(list, moveFrom, moveTo) {
  var key = cardLists[list][moveFrom];
  insertCard(list, key, moveTo);
  var newMoveFrom = moveTo < moveFrom ? moveFrom+1 : moveFrom; //Reflects the fact that moveTo has been inserted and pushed subsquent elements forward
  deleteCard(list, newMoveFrom);
  moveCardDOM(0, moveFrom, moveTo);
}

// General Card Functions (used by Specific Card Functions)
var insertCard = function(list, cardKeyToOpen, position) {
  cardLists[list].splice(position, 0, cardKeyToOpen);
}
var deleteCard = function(list, pos) {
  cardLists[list].splice(pos, 1);
}



//UI Interaction
$(".cards").on("click", "a", function(){
  var cardToOpen = $(this).attr('href').substring(1); //Key of card to open
  var position = getPosition($(this).parents('.card')[0]);
  openCard(cardToOpen, position);
});
$(".cards").on("click", "i.close", function(){
  var card = $(this).closest('.card');
  closeCard(0, getPosition(card));
});
$(".cards").on("click", ".card", function(){
  if(!$(event.target).is("a") && !$(event.target).is("i.close") ) {
    focusCard(0, getPosition(this));
  }
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







var hammertime = new Hammer(document, []);
hammertime.get('swipe').set({ direction: Hammer.DIRECTION_VERTICAL });
hammertime.get('pan').set({ direction: Hammer.DIRECTION_VERTICAL });
hammertime.on('panend', function(ev) {
  console.log('panend');
	console.log(ev);
  focusCard(0, focusPosition[0]);
});
hammertime.on('swipeup', function(ev) {
  console.log('swipeup');
	console.log(ev);
  focusCard(0, focusPosition[0]+1);
});
hammertime.on('swipedown', function(ev) {
  console.log('swipedown');
	console.log(ev);
  focusCard(0, focusPosition[0]-1);
});




$(document).ready(function(){
  // $('.card-carousel').slick({
  //   // setting-name: setting-value
  // });
});
