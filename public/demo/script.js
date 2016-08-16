var cards = {}; // object with key ids
var cardLists = []; cardLists[0] = [];
var focusPosition = [];
var tempCards;
var waitingForDoctop = true;
var ongoingKeyCounter = 0;
var layers = 0;
var temp;


var importCardsByType = function(type, openFirstCard) {
  $.ajax({
     url: "//explaain-api-develop.herokuapp.com/" + type + "/search"
   }).done(function(json) {
    //  cards = json;
     for (var i in json) {
       var key = json[i]['@id'];
       cards[key] = json[i];
       cards[key].key = cards[key]['@id'];
       cards[key].title = cards[key].name;
      //  cards[key].body = insertMarkdownLinks(cards[key].description, cards[key].links);
        console.log(key);
       cards[key].body = parseMarkdown(cards[key].description);
     }
     console.log(json);
     console.log(cards);
     if (openFirstCard) {
       openLayer(0, [json[0]['@id']], 0, -1);
     }
   });
}


if (getParameterByName('db') == 'true') {
  importCardsByType('Detail', false);
  importCardsByType('Event', false);
  importCardsByType('Headline', false);
  importCardsByType('Organization', false);
  importCardsByType('Person', true);
  importCardsByType('Place', false);

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
      // cards = {"0":{"id":"0","topic":"Heathrow Drone","title":"Drone hits Heathrow plane","body":"<a href=\"#1\">A British Airways flight from Geneva</a> is <a href=\"#2\">believed to have hit a drone</a> before <a href=\"#8\">landing safely at Heathrow</a> airport, raising <a href=\"#3\">concerns over aviation safety</a>.","headline":"true","coverImage":"https://pixabay.com/static/uploads/photo/2015/12/29/13/13/drone-1112752_960_720.jpg","draftOrAuthor":"yukiko"},"1":{"id":"1","topic":"Heathrow Drone","title":"A British Airways flight","body":"The flight BA727 from Geneva to Heathrow was carrying 132 passengers and 5 crew. <a href=\"#5\">The Airbus A320</a> plane <a href=\"#7\">was cleared to take off the next flight after being examined</a>.","draftOrAuthor":"yukiko"},"2":{"id":"2","topic":"Heathrow Drone","title":"Believed to have hit a drone","body":"The pilot reported an object that is believed to be a drone struck the front of <a href=\"#1\">the flight</a>, and it would be the first incident of its kind in the UK if confirmed. \n        <a href=\"#6\">The investigation is underway</a>.","draftOrAuthor":"yukiko"},"3":{"id":"3","topic":"Drone and aviation safety","title":"Concerns over aviation safety and drone","body":"<a href=\"#10\">Pilots have called for an investigation</a> into the likely effects of <a href=\"#9\">a drone strike on an aircraft</a> last month, following <a href=\"#4\">a report on their near-misses</a>.","draftOrAuthor":"yukiko"},"4":{"id":"4","topic":"Drone and aviation safety","title":"Report by the UK Airpox Board","body":"There were 23 near-misses between drones and aircraft in the 6 months between April and October last year.","draftOrAuthor":"yukiko"},"5":{"id":"5","topic":"Heathrow Drone","title":"Airbus A320 family","body":"The A320 manufactured by Airbus typically seats 150 passengers in a two-class cabin, and is commonly used by commercial flights.","draftOrAuthor":"yukiko"},"6":{"id":"6","topic":"Heathrow Drone","title":"Investigation on ‘drone’ claim","body":"Police says no arrests have been made. \n        The British Airline will give the police “every assistance with their investigation”.","draftOrAuthor":"yukiko"},"7":{"id":"7","topic":"Heathrow Drone","title":"Quote","body":"A British Airways spokesperson said: \n        “Our aircraft landed safely, was fully examined by our engineers and it was cleared to operate its next flight”.","draftOrAuthor":"yukiko"},"8":{"id":"8","topic":"Heathrow Drone","title":"Landing safely at Heathrow airport","body":"Despite a hit by an object, believed to be a drone, the flight with 132 passengers and 5 crew <a href=\"#7\">landed safely without damage to the aircraft</a>.","draftOrAuthor":"yukiko"},"9":{"id":"9","topic":"Drone and aviation safety","title":"Drone strike on aircraft","body":"<a href=\"#11\">People who fly drones</a> close to planes could be convicted of endangering aviation safety, which has a maximum prison sentence of five years, according to the Civil Aviation Authority.","draftOrAuthor":"yukiko"},"10":{"id":"10","topic":"Drone and aviation safety","title":"Pilots have called for an investigation","body":"The British Airline Pilots Association wants the Department for Transport and the Civil Aviation Authority to investigate into the effects of <a href=\"#9\">a drone strike on an aircraft</a>.","draftOrAuthor":"yukiko"},"11":{"id":"11","topic":"Drone and aviation safety","title":"People flying drones","body":"<a href=\"#12\">The Civil Aviation Authority is focusing on educating people</a> who use drones, fearing that many of them are not familiar with the legal issues.","draftOrAuthor":"yukiko"},"12":{"id":"12","topic":"Drone and aviation safety","title":"CAA and “dronecode”","body":"The Civil Aviation Authority launched Dronecode to simplify the rules over drones.","draftOrAuthor":"yukiko"}};
      // cards = $.parseJSON('{"0":{"id":"0","topic":"Trump Backs Brexit","title":"","body":"<a href=\"#1\">Donald Trump</a> has <a href=\"#2\">backed Brexit</a> ahead of <a href=\"#3\">next month`s referendum</a>, <a href=\"#4\">blaming the migration crisis on the EU</a>.","headline":"true","coverImage":"https://assets.donaldjtrump.com/site/hero_image_main_2.jpg","draftOrAuthor":""},"1":{"id":"1","topic":"","title":"Donald Trump","body":"A <a href=\"#5\">controversial</a> <a href=\"#6\">businessman and celebrity</a>, now <a href=\"#7\">the Republican presumptive nominee</a> for <a href=\"#8\">the US presidential elections</a>.","draftOrAuthor":"draft"},"2":{"id":"2","topic":"","title":"","body":"<a href=\"#1\">Trump</a> said <a href=\"#11\">the UK is \"better off\" without the EU</a>, though <a href=\"#10\">stating it wasn’t a recommendation</a>, and <a href=\"#12\">criticised Obama for backing the Remain Campaign</a>.","draftOrAuthor":"draft"},"3":{"id":"3","topic":"","title":"EU Referendum","body":"<a href=\"#18\">Britain will hold a referendum in June</a> on <a href=\"#19\">whether to leave</a> the <a href=\"#21\">European Union</a>, a debate that <a href=\"#20\">is increasingly dividing national opinion</a>.","draftOrAuthor":"draft"},"4":{"id":"4","topic":"","title":"","body":"<a href=\"#1\">Trump</a> said <a href=\"#17\">the migration crisis was \"a horrible thing for Europe\" and \"pushed by the EU\"</a>, following <a href=\"#14\">previous controversial comments on immigration</a>.","draftOrAuthor":"draft"},"5":{"id":"5","topic":"","title":"","body":"<a href=\"#1\">Trump</a> has made controversial remarks on topics including Mexican immigration, Muslims, 9/11, women’s rights and well-known figures including John McCain and Megyn Kelly.","draftOrAuthor":"draft"},"6":{"id":"6","topic":"","title":"","body":"<a href=\"#1\">Trump</a> is known for several businesses including casinos, golf courses, hotels and real estate, along with TV appearances like <a href=\"#22\">The Apprentice</a> and WWE.","draftOrAuthor":"draft"},"7":{"id":"7","topic":"","title":"","body":"<a href=\"#1\">Trump</a> became the presumptive nominee for the <a href=\"#24\">Republican party</a> after <a href=\"#23\">Ted Cruz</a> announced he was dropping out of the presidential race.","draftOrAuthor":"draft"},"8":{"id":"8","topic":"","title":"2016 US Presidential Elections","body":"<a href=\"#1\">Donald Trump</a> and <a href=\"#25\">Hillary Clinton</a> are set to be the candidates in an unconventional Presidential race.","draftOrAuthor":"draft"},"9":{"id":"9","topic":"","title":"","body":"","draftOrAuthor":"draft"},"10":{"id":"10","topic":"","title":"","body":"<a href=\"#1\">Trump</a> said his opinion over <a href=\"#19\">Brexit</a> was just <a href=\"#26\">\"his feeling\"</a> and he wouldn`t make any formal recommendations.","draftOrAuthor":"draft"},"11":{"id":"11","topic":"","title":"UK “better off” without the EU","body":"\\\"I would say [the UK] are better off without [the EU], personally, but I`m not making that as a recommendation, just my feeling.\\” – <a href=\"#1\">Donald Trump</a>","draftOrAuthor":"draft"},"12":{"id":"12","topic":"","title":"","body":"Barack Obama officially supported David Cameron`s campaign to remain in the EU, saying leaving it would affect trade between UK and the US.","draftOrAuthor":"draft"},"13":{"id":"13","topic":"","title":"Migration crisis","body":"Text","draftOrAuthor":"draft"},"14":{"id":"14","topic":"","title":"","body":"<a href=\"#1\">Trump</a> called <a href=\"#15\">for a temporary ban on Muslims entering the US</a>, prompting <a href=\"#16\">a debate over his access to the UK</a>.","draftOrAuthor":"draft"},"15":{"id":"15","topic":"","title":"","body":"<a href=\"#1\">Trump</a>’s proposal was announced last December after the attack in San Bernardino, California, which was inspired by terrorist group Isis.","draftOrAuthor":"draft"},"16":{"id":"16","topic":"","title":"","body":"Half a million people signed a petition asking for Trump to be barred from entering the UK because of his remarks over Muslims.","draftOrAuthor":"draft"},"17":{"id":"17","topic":"","title":"","body":"”I think the migration has been a horrible thing for Europe, a lot of that was pushed by the EU.”  – <a href=\"#1\">Donald Trump</a>","draftOrAuthor":"draft"},"18":{"id":"18","topic":"","title":"","body":"The EU Referendum will be held on 23 June, with the question: ‘Should the UK remain a member of the EU or leave the EU?’. It will be Britain’s second EU referendum.","draftOrAuthor":"draft"},"19":{"id":"19","topic":"","title":"The Brexit debate","body":"The main issues relate to economics, borders, sovereignty and how Britain’s relationship with Europe would change.","draftOrAuthor":"draft"},"20":{"id":"20","topic":"","title":"","body":"The ‘Brexit’ debate has divided the country into Eurosceptics who wish to leave, and Pro-EU backers who wish to remain. The main campaigns are Remain to stay in, and Vote Leave and Leave.EU to exit.","draftOrAuthor":"draft"},"21":{"id":"21","topic":"","title":"European Union","body":"The EU is the politico-economic union of 28 member states that are located primarily in Europe, originally created after WWII.","draftOrAuthor":"draft"},"22":{"id":"22","topic":"","title":"The Apprentice","body":"The Apprentice is an American reality game show that judges the business skills of a group of contestants, and was hosted for many years by <a href=\"#1\">Donald Trump</a>.","draftOrAuthor":"draft"},"23":{"id":"23","topic":"","title":"Ted Cruz","body":"American attorney and politician, who has been a Texas Senator since 2012 and a <a href=\"#24\">Republican</a> candidate in the 2016 US Election Primaries.","draftOrAuthor":"draft"},"24":{"id":"24","topic":"","title":"Republican Party","body":"One of the two major political parties in the United States, the other being its historic rival, the Democratic Party.","draftOrAuthor":"draft"},"25":{"id":"25","topic":"","title":"Hillary Clinton","body":"US politician and candidate for the Democratic presidential nomination in the 2016 election.","draftOrAuthor":"draft"},"26":{"id":"26","topic":"","title":"“Just my feeling”","body":"”I`m not making that as a recommendation, just my feeling” – <a href=\"#1\">Donald Trump</a>","draftOrAuthor":"draft"}}');

      // openLayer(0, [0], 0, -1);
      // var card = cards[0];
      // var tempTemplate = cardTemplate(card.id, card.title, card.body, card.coverImage, card.topic, card.headline, true);
      // tempTemplate = '<div class="layer" id="layer-0">' + tempTemplate + '</div>';
      // cardDOM = $(tempTemplate).appendTo('.cards');
      // window.setTimeout(function() {
      //   $('.card').removeClass('opening');
      // }, 300);
    // }
  }, 300);
}


var cardTemplate = function (key, title, body, image, topic, showHeaderImage, standalone) {
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
                +       '</div>'
                +     '</div>'
                +     '<button class="edit-button"><i class="fa fa-pencil" aria-hidden="true"></i></button>'
                // +     '<div class="card-spacer"></div>'
                +   '</div>';
  return template;
};

var openLayer = function(layer, keys, slide, slideFrom) {
  console.log(keys);
  $('.layer i.close').hide();
  $('.layer a').removeClass('active');
  var template = '';
  $.each(keys, function(i, key) {
    var card = cards[key];
    if (!card) {
      card = {
        key: key,
        title: 'Card not found!',
        body: ''
      };
    }
    template = template + cardTemplate(card.key, card.title, card.body, card.coverImage, card.topic, card.headline);
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
$(".cards").on("click", "a", function(event){
  event.preventDefault();
  var slide = $(this).index();
  var slideFrom = $(this).closest('.card').index();//.slick('slickCurrentSlide');
  temp = $(this).closest('.layer > div');
  var layer = getLayerNumber($(this));
  var allKeys = [];
  $.each($(this).closest('.body-content').find('a'), function(i, link) {
    allKeys.push($(link).attr('href'));//.substring(1));
  });
  console.log(allKeys);
  layer++;
  if (layer ==  layers) {
    openLayer(layer, allKeys, slide, slideFrom, -1);
  } else {
    layerGoToSlide(layer, slide);
  }
});
$(".cards").on("click", "i.close", function(){
  // var card = $(this).closest('.card');
  layer = getLayerNumber($(this));
  closeLayer(layer);
});
$(".cards").on("click", ".card", function(){
  var layer = getLayerNumber($(this));
  var targetLayer = layer + 1;
  if(!$(event.target).is("a") && !$(event.target).is("i.close") && !$(event.target).is(".edit-button") && !$(event.target).is(".edit-button i") ) {
    targetLayer--;
    if (layer == layers-1) {
      var slide = $(this).closest('.card').index();
      layerGoToSlide(layer, slide);
    }
  }
  console.log(targetLayer, layers);
  if (targetLayer < layers - 1) {
    for (i = layers - 1; i > targetLayer; i--) {
      console.log(targetLayer, layers);
      closeLayer(i);
    }
  }
});
$(".cards").on("click", ".card .edit-button", function(){
  var key = $(this).closest('.card').attr('data-uri');
  console.log(key);
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


function updateCard(uri) {
  $.ajax({
    url: uri
  }).done(function(json) {
    console.log(json);
    $('.card[data-uri="' + uri + '"]').find('.header-image img').html(json.image);
    $('.card[data-uri="' + uri + '"]').find('.header-image h3').html(json.name);
    $('.card[data-uri="' + uri + '"]').find('h2').html(json.name);
    console.log(json.description);
    $('.card[data-uri="' + uri + '"]').find('.body-content').html(parseMarkdown(json.description));
  });
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
  console.log(text);
  return markdown.toHTML(text);
}


if (getParameterByName('touchscreen') != 'true') {
  console.log('h');
  $('body').addClass('desktop');
}
