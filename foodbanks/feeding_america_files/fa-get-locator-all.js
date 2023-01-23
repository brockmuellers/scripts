if (typeof FA == 'undefined') { // Make sure FA namespace is initialized
  var FA = {};
}

// Constants
FA.fbmap = {
  rendered: false
}

//globals
var FBMap;
var FBMapPoints = [];
var FBMapMarkers = [];
var FBMapAllOrgs = [];
var currentSearch = '';
var statesAbbrToFull = {
  "AL": "Alabama",
  "AK": "Alaska",
  "AS": "American Samoa",
  "AZ": "Arizona",
  "AR": "Arkansas",
  "CA": "California",
  "CO": "Colorado",
  "CT": "Connecticut",
  "DE": "Delaware",
  "DC": "District Of Columbia",
  "FM": "Federated States Of Micronesia",
  "FL": "Florida",
  "GA": "Georgia",
  "GU": "Guam",
  "HI": "Hawaii",
  "ID": "Idaho",
  "IL": "Illinois",
  "IN": "Indiana",
  "IA": "Iowa",
  "KS": "Kansas",
  "KY": "Kentucky",
  "LA": "Louisiana",
  "ME": "Maine",
  "MH": "Marshall Islands",
  "MD": "Maryland",
  "MA": "Massachusetts",
  "MI": "Michigan",
  "MN": "Minnesota",
  "MS": "Mississippi",
  "MO": "Missouri",
  "MT": "Montana",
  "NE": "Nebraska",
  "NV": "Nevada",
  "NH": "New Hampshire",
  "NJ": "New Jersey",
  "NM": "New Mexico",
  "NY": "New York",
  "NC": "North Carolina",
  "ND": "North Dakota",
  "MP": "Northern Mariana Islands",
  "OH": "Ohio",
  "OK": "Oklahoma",
  "OR": "Oregon",
  "PW": "Palau",
  "PA": "Pennsylvania",
  "PR": "Puerto Rico",
  "RI": "Rhode Island",
  "SC": "South Carolina",
  "SD": "South Dakota",
  "TN": "Tennessee",
  "TX": "Texas",
  "UT": "Utah",
  "VT": "Vermont",
  "VI": "Virgin Islands",
  "VA": "Virginia",
  "WA": "Washington",
  "WV": "West Virginia",
  "WI": "Wisconsin",
  "WY": "Wyoming"
};

(function($) {

  var orgProperties = {
    'OrganizationID': 1, 'FullName': 1, 'Phone': 1, 'URL': 1, 'AgencyURL': 1, 'VolunteerURL': 1,
    'MailAddress': { 'Latitude': 1, 'Longitude': 1, 'Address1': 1, 'Address2': 1, 'City': 1, 'State': 1, 'Zip': 1 },
    'SocialUrls': { 'DonateUrl': 1 },
    'LogoUrls': { 'FoodBankLocator': 1 },
    'ListPDOs': 'list_PDO',
    'list_PDO': { 'Title': 1, 'Address': 1, 'City': 1, 'State': 1, 'ZipCode': 1, 'Phone': 1, 'Website': 1 },
    'ListFipsCounty': 'list_LocalFindings',
    'list_LocalFindings': { 'CountyName': 1 },
  };

  var nodeValue = function(node) {
    var nv = '';
    switch (node.nodeType) {
      case 1 : // ELEMENT_NODE
      nv = node.textContent || node.innerText || node.text;
      break;
    }
    return nv;
  };

  function orgXmlListToJson(node, id) {
    var list = new Array(), data = FA.ws.getArrayOfChildren(node); attr = orgProperties[id];
    for (var i = 0 ; i < data.length ; i++) {
      var node = data[i];
      list.push(orgXmlToJson(node, attr));
    }
    return list;
  }

  function orgXmlToJson(node, attr) {
    var item = {}, data = FA.ws.getArrayOfChildren(node);
    for (var i = 0 ; i < data.length ; i++) {
      var node = data[i], nn = node.localName || node.nodeName, match = attr[nn];
      if (match) {
        if (match === 1) {
          item[nn] = nodeValue(node);
        } else if (typeof match == 'string' && match.substring(0, 5) == 'list_') {
          item[nn] = orgXmlListToJson(node, match);
        } else {
          item[nn] = orgXmlToJson(node, match);
        }
      }
    }
    return item;
  }

  function searchByZip(zip) {
    var resultsWrapper = $('#find-fb-search-results');

    resultsWrapper.find('.results-box[data-orgid]').hide();
    clearFBMap();
    hideResultBoxes();

    if (zip !== '') { // Do the request
      FA.ws.request('GetOrganizationsByZip', { zip : zip },
        'Organization',
        function(data) {
          FA.fbmap.rendered = false;
          centerOnSearch(data, zip, resultsWrapper, 'zip code');
          setTimeout(function() { FA.fbmap.rendered = true; }, 1500);
        },
      function(response) { // Error
        resultsWrapper.append('<p id="errorMessage">Our online search is not working at this time. To find your food bank, please call us at 800.771.2303.</p>');
        resultsWrapper.show();
      });
    }
  }

  function searchByState(state) {
    var resultsWrapper = $('#find-fb-search-results'),
    fullStateName = $("#find-fb-search-form-state option[value='" + state + "']").text();

    resultsWrapper.find('.results-box[data-orgid]').hide();
    clearFBMap();
    hideResultBoxes();

    if (state !== '') {
      if (state == 'US') {
        mapAllOrgs(null);
        return;
      }

      FA.ws.request('GetOrganizationsByState', { state : state },
        'Organization',
        function(data) {
          FA.fbmap.rendered = false;
          centerOnSearch(data, fullStateName, resultsWrapper, 'state');
          setTimeout(function() { FA.fbmap.rendered = true; }, 1500);
        },
            function(response) { // Error
              resultsWrapper.append('<p id="errorMessage">Our online search is not working at this time. To find your food bank, please call us at 800.771.2303.</p>');
              resultsWrapper.show();
            });
    }
  }

  function mapAllOrgs(execSearch) {
    var xml, resultsWrapper = $('#find-fb-search-results');
    if (FBMapPoints.length === 0) {
      resultsWrapper.empty();
      FA.ws.request('GetAllOrganizations', {}, null,
        function(data) {
          xml = FA.ws.getArrayOfChildren(data.documentElement);
          returnFAResults(xml, 'the United States', execSearch);
          // setTimeout(function() {
            $('#find-fb-search-and-map-loading').hide();
            if (execSearch == null) {
              FA.fbmap.rendered = true;
            }
          // }, 1500);
        },
        function(response) { // Error
          hideResultBoxes();
          resultsWrapper.append('<p id="errorMessage">Our online search is not working at this time. To find your food bank, please call us at 800.771.2303.</p>');
          resultsWrapper.show();
        });
    } else {
      if (FBMapMarkers.length) {
        FA.fbmap.rendered = false;
        for (var i = 0; i < FBMapMarkers.length; i++) {
          if (FBMapMarkers[i] !== undefined) {
            FBMapMarkers[i].setIcon({url:"/themes/custom/ts_feeding_america/images/fb-s-pin.png"});
            FBMapMarkers[i].setVisible(true);
          }
        }
        fitFBMapBounds();
        exposeMapPoints();
        buildFAOrgsSummaryBox(FBMapAllOrgs, $('#find-fb-search-results'), 'the United States');
        // setTimeout(function() {
          FA.fbmap.rendered = true;
        // }, 1500);
      }
    }
  }

  function displayStateOrgs(state, name) {
    var resultsWrapper = $('#find-fb-search-results');
    if (state !== '') {
      FA.ws.request('GetOrganizationsByState', { state : state },
        'Organization',
        function(data) {
          if (data !== null) {
            for (var key in data) { // build our HTML for each item
              var org = data[key];
              resultsWrapper.append(buildFAOrgResultBox(org));
            }
            buildFAOrgsSummaryBox(data, resultsWrapper, name);
          }
        }, function(response) {// Error
          resultsWrapper.append('<p id="errorMessage">There was an error processing your request</p>');
          resultsWrapper.show();
        });
    }
  }

  function centerOnSearch(data, searchString, resultsWrapper, entity) {
    if (data !== null) {
      if (FBMapMarkers.length) {
        var mapBounds = new google.maps.LatLngBounds();
      }

      for (var key in data) {
        var org = data[key],
        orgID = org.OrganizationID,
        lat = Number(org.MailAddress.Latitude).toFixed(5),
        lng = Number(org.MailAddress.Longitude).toFixed(5),
        markerLatlng = new google.maps.LatLng(lat, lng),
        pinIcon = { url : "/themes/custom/ts_feeding_america/images/fb-l-pin.png" };
        $('#find-fb-search-results .results-box[data-orgid="'+ orgID +'"]').show();

        if (FBMapMarkers.length) {
          mapBounds.extend(markerLatlng);
          if (FBMapMarkers[orgID] !== undefined) {
            FBMapMarkers[orgID].setVisible(true);
            FBMapMarkers[orgID].setIcon(pinIcon);
          }
        }
      }

      // create the summary box, handle plural/singular result
      buildFAOrgsSummaryBox(data, resultsWrapper, searchString);

      if (FBMapMarkers.length) {
        clearListenerBoundsChanged();
        FBMap.fitBounds(mapBounds);
        setTimeout(function() { addListenerBoundsChanged(); }, 750);
      }
    } else {
      searchNoResults(resultsWrapper, entity);
    }

	  google.maps.event.addListener(this.map, 'tilesloaded', function() {
		  var images = document.querySelectorAll('#fb-map-wrapper-inner img');
		  images.forEach(function(image) {
			  image.alt = "";
		  });
	  });
  }

  function searchNoResults(resultsWrapper, entity) {
    $('#fbSearchSummary').hide();
    resultsWrapper.append('<p id="errorMessage">This is an invalid ' + entity + '. Please try a valid U.S. ' + entity + '.</p>');
    resultsWrapper.show();
  }

  function fitFBMapBounds() {
    if (FBMapMarkers.length) {
      var mapBounds = new google.maps.LatLngBounds();
      for (var i = 0; i < FBMapMarkers.length; i++) {
        var marker = FBMapMarkers[i];
        if (marker !== undefined && marker.getVisible()) {
          mapBounds.extend(marker.getPosition());
        }
      }
      FBMap.fitBounds(mapBounds);
    }
  }

  function buildFAOrgResultBox(org) {
    var resultsBox = $('<div class="results-box" data-orgid="'+org.OrganizationID+'">'),
    profileUrlName = (org.FullName.replace(/ - /g, '-')).replace(/ /g, '-').toLowerCase(),
    profileUrl = '/find-your-local-foodbank/' + (profileUrlName.replace(/[&]/g, 'and')).replace(/[^a-zA-Z0-9-]/g, ''),
    orgImage = '<img width="230" height="" loading="lazy" border="0" alt="' + org.FullName + ' logo" src="' + org.LogoUrls.FoodBankLocator + '">',
    orgName = '<p class="name">' + org.FullName + '</p>',
    addressString = (org.MailAddress.Address2) ? org.MailAddress.Address1 + '<br>' + org.MailAddress.Address2 + '<br>' : org.MailAddress.Address1 + '<br>',
    orgAddress = '<p>' + addressString + org.MailAddress.City + ', ' + org.MailAddress.State + ' ' + org.MailAddress.Zip + '<br>' + '<a class="mobile-link" href="tel:+' + org.Phone + '">' + org.Phone + '</a>' + '</p>',
    orgUrl = '<p class="url"><a href="//' + org.URL + '">' + org.URL + '</a></p>',
    countyList = $('<br><p class="counties"><strong>Counties Served: </strong></p>'),
    orgAgencyButton = '', orgVolunteerURL = '', orgDonateUrl = '', drupalNodeId = '';

    // Checks all foodbanks to find matching orgIds, returns matching drupal node
    $('#block-views-block-foodbank-ids-finder .views-row').each(function() {
      var orgName = $(this).find('.fb-org-title').text().trim();
      var orgId = $(this).find('.fb-org-id').text().trim();
      var drupalId = $(this).find('.fb-id').text().trim();

      if (orgId == org.OrganizationID) {
        drupalNodeId = drupalId;
      }
    });

    var nodeUrl = '/node/' + drupalNodeId;

    resultsBox.append('<a aria-label="' + org.FullName + '" data-url="' + nodeUrl + '" href="' + profileUrl + '">' + orgImage + orgName + '</a>' + orgAddress + orgUrl);
    if (org.AgencyURL !== '' || org.VolunteerURL !== '') {
      if (org.AgencyURL !== '') { // TODO: temp style, put in CSStemp style, put in CSS
        orgAgencyButton = '<a href="'+org.AgencyURL+'" class="green button" style="padding: 11px 10px"> Find Food </a>&nbsp;&nbsp;';
      }
      if (org.VolunteerURL !== '') {
        orgVolunteerURL = '<a href="'+org.VolunteerURL+'" class="green button" style="padding: 11px 10px"> Volunteer </a>';
      }
      if (org.SocialUrls && org.SocialUrls.DonateUrl && org.SocialUrls.DonateUrl != '') {
        orgDonateUrl = '<a href="' + org.SocialUrls.DonateUrl + '" class="green button" style="padding: 11px 10px"> Give Locally </a>&nbsp;&nbsp;'
      }
      resultsBox.append('<div class="buttonWrapper">' + orgAgencyButton + orgVolunteerURL + orgDonateUrl + '</div>');

      if (org.ListFipsCounty !== '') {

        $.each(org.ListFipsCounty, function(key, county) {
          countyList.append(county.CountyName.toLowerCase());
          if (key !== org.ListFipsCounty.length-1) {
            countyList.append(', ');
          }
        });

        resultsBox.append(countyList);
      }
    }
    $(".results-box > a").once().click( function(e){
      e.preventDefault();
      window.location = $(this).data('url');
    });

    // if (org.ListPDOs !== '' && org.ListPDOs.length) {
    //   var listPDOs = org.ListPDOs, pdoWrapper = $('<div class="partner-orgs"/>'), pdoListWrapper = $('<ul />');
    //   pdoWrapper.append('Organizaciones de distribución de socios:');
    //   for (var i = 0 ; i < listPDOs.length ; i++) {
    //     var pdo = listPDOs[i];
    //     pdoListWrapper.append('<li>' + pdo.Title + '<br>' + pdo.Address + '<br>' + pdo.City + ', ' + pdo.State + ' ' + (pdo.ZipCode ? pdo.ZipCode : '') + '<br>' + pdo.Phone + '<br>' + (pdo.Website ? ('<a href="' + pdo.Website + '">' + pdo.Website + '</a>') : ''));
    //   }
    //   pdoWrapper.append(pdoListWrapper);
    //   resultsBox.append(pdoWrapper);
    // }

    return resultsBox;
  }

  function buildFAOrgsSummaryBox(data, resultsWrapper, searchString) {
    var headlineString = ' Feeding America Food Bank[s] that serve';

    if (data.length === 1) {
      headlineString = '1' + headlineString.replace('[s]', '') + 's ';
    } else {
      headlineString = data.length.toString() + headlineString.replace('[s]', 's') + ' ';
    }

    $('#fbSearchSummary').remove();
    resultsWrapper.prepend(
      '<div class="results-box" id="fbSearchSummary">' +
      '<div class="headline">' + headlineString + searchString.toString() + '</div>' +
      '<!--<p class="countstring"></p>-->' +
      '<p>Feeding America food banks serve large areas and will be able to find a feeding program in your local community.</p>' +
      '</div>'
      );

    if (searchString != "the United States") {
      resultsWrapper.show();
    }
  }

  function returnFAResults(data, searchString, execSearch) {
    var resultsWrapper = $('#find-fb-search-results'), mapPointInfoBoxes = [];

    if (data !== null) {
      FBMapAllOrgs = data;

      // Because of IE issues with long running js script,
      // we have to break it down into chunks of 25 records per batch
      var processFAResults = function(current, cycles, total) {
        var to = current + cycles; to = to > total ? total : to;

        for (var i = current ; i < to ; i++) {
          //build our HTML for each item
          // console.log( data[i] )
          var org = orgXmlToJson(data[i], orgProperties),
          resultsBox = buildFAOrgResultBox(org),
          profileUrlName = org.FullName.replace(/ /g, '-').toLowerCase(),
          profileUrl = '/find-your-local-foodbank/' + (profileUrlName.replace(/[&]/g, 'and')).replace(/[\.,']/g, '');

          //save map ponts
          FBMapPoints[org.OrganizationID] = [Number(org.MailAddress.Latitude),Number(org.MailAddress.Longitude)];

          //save infobox data
          mapPointInfoBoxes[org.OrganizationID] = {
            title: org.FullName,
            address: org.MailAddress.Address1,
            phone: org.Phone,
            url: org.URL,
            profileurl: profileUrl
          };

          resultsWrapper.append(resultsBox);
        }

        if (total > to) {
          setTimeout(function() { processFAResults(i, cycles, total) }, 1);
        } else {
          finalizeFAResults();
        }
      };

      var finalizeFAResults = function() {
        var extraSearch = (typeof(execSearch) == "function");

        //plot map points
        plotPoints(FBMapPoints, mapPointInfoBoxes, !extraSearch);

        //check if we need to execute search
        if (extraSearch) {
          execSearch();
          return;
        }

        //create the summary box, handle plural/singular result
        buildFAOrgsSummaryBox(data, resultsWrapper, searchString);
      };

      // Start the process
      processFAResults(0, 250, data.length);

    } else { // No results
      resultsWrapper.append('The search did not produce any results');
    }
    if (execSearch) {
      resultsWrapper.show();
    } else {
      resultsWrapper;
    }
  }

  function initFBMap() {
    var mapOptions = {
      center : new google.maps.LatLng(40.000, -100.000),
      mapTypeId : google.maps.MapTypeId.ROADMAP,
      disableDefaultUI : false,
      zoom : 3,
      maxZoom : 14
    };

    //find-fb-map fb-map-wrapper
    if (document.location.origin == "https://www.feedingamerica.org" ) {
      FBMap = new google.maps.Map(document.getElementById("fb-map-wrapper-inner"), mapOptions);
    }
  }

  function plotPoints(FBMapPoints, mapPointInfoBoxes, fitBounds) {
    var mapBounds = new google.maps.LatLngBounds();
    var infowindow = new google.maps.InfoWindow();
    $.each(FBMapPoints, function(point, geolocation) {
      if (geolocation !== undefined && geolocation[0] !== 0) {
        var lat = geolocation[0].toFixed(5), lng = geolocation[1].toFixed(5);
        var markerLatlng = new google.maps.LatLng(lat, lng);
        var infoBoxData = mapPointInfoBoxes[point];
        var infoBoxContent = '<div id="infoBox">'+
        '<p id="firstHeading" class="firstHeading"><a href="'+infoBoxData.profileurl+'">'+ infoBoxData.title +'</a></p>'+
        '<p class="address">' + infoBoxData.address + '<br>' + infoBoxData.phone + '<br><a href="//' + infoBoxData.url + '">' + infoBoxData.url + '</a></p></div>';
        if (point === 0) {
          FBMap.panTo(markerLatlng);
        }

        var marker = new google.maps.Marker({
          map : FBMap,
          position : markerLatlng,
          title : infoBoxData.title,
          animation : google.maps.Animation.DROP
        });
        //"http://chart.apis.google.com/chart?chst=d_map_pin_letter_withshadow&chld=%E2%80%A2|FE7569",
        /*
        var pinIcon = {
            url : "//chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|FE7569",
            scaledSize : new google.maps.Size(15, 25)
        };
        */
        pinIcon = {
          url : "/themes/custom/ts_feeding_america/images/fb-s-pin.png"
        };

        marker.set('fbid', point);
        marker.setIcon(pinIcon);
        FBMapMarkers[point] = marker;

        //create infobox
        google.maps.event.addListener(marker, 'click', function() {
          var foodbankId = marker.get('fbid');
          infowindow.setContent(infoBoxContent);
          infowindow.open(FBMap,this);
          //FBMap.panTo(marker.getPosition());
          //FBMap.setZoom(14);
          $('html, body').animate({
            scrollTop: $('.results-box[data-orgid="'+foodbankId+'"]').offset().top - 140
          }, 300);

          //$('.results-box[data-orgid]').not('[data-orgid="'+foodbankId+'"]').hide();
        });
        mapBounds.extend(markerLatlng);

      }
    });

    if (fitBounds.length) {
      FBMap.fitBounds(mapBounds);
      addListenerBoundsChanged();
    }
  }

  function addListenerBoundsChanged() {
    google.maps.event.addListener(FBMap, 'bounds_changed', function() {
      exposeMapPoints();
    });
  }

  function clearListenerBoundsChanged() {
    google.maps.event.clearListeners(FBMap, 'bounds_changed');
  }

  function exposeMapPoints() {
    for (var i = 0; i < FBMapMarkers.length; i++) {
      if (FBMapMarkers[i] !== undefined) {
        var FBID = FBMapMarkers[i].get('fbid');
        FBMapMarkers[i].setVisible(true);
        if (FBMap.getBounds().contains(FBMapMarkers[i].getPosition())) {
          $('.results-box[data-orgid="'+FBID+'"]').show();
        } else {
          $('.results-box[data-orgid="'+FBID+'"]').hide();
        }
      }
    }

    // Change summary message when map is scaled / moved
    if (FA.fbmap.rendered) {
      var fbSearchSummary = $('#fbSearchSummary > .headline');
      if (fbSearchSummary.length) {
        fbSearchSummary.text('Feeding America Food Banks that match your search');
      }
    }
  }

  function resetMap () {
    FBMap.setZoom(14);
    for (var i = 0; i < FBMapMarkers.length; i++) {
      if (FBMapMarkers[i] !== undefined) {
        FBMapMarkers[i].setVisible(true);
      }
    }
  }

  function clearFBMap() {
    var pinIcon = {
      url : "/themes/custom/ts_feeding_america/images/fb-s-pin.png"
    };
    for (var i = 0; i < FBMapMarkers.length; i++) {
      if (FBMapMarkers[i] !== undefined) {
        FBMapMarkers[i].setVisible(false);
        FBMapMarkers[i].setIcon(pinIcon);
      }
    }
    //reset search boxes
    $('#errorMessage').remove();
    $('#fbSearchSummary').hide();
    $('#find-fb-search-form-zip').val('');
    $('#find-fb-search-form-state').val('');
  }

  function hideResultBoxes() {
    $('#find-fb-search-results .results-box').hide();
    $('#fbSearchSummary').hide();
  }

  function initStickyMapWrapper(page) {
    var wrprId, sectionId;

    switch (page) {
      case 'fb-map' :
      wrprId = '#fb-map-wrapper';
      sectionId = '#find-fb-map';
      if ( $('body').hasClass('toolbar-fixed') ) {
        var topLoc = $(wrprId).offset().top - 130;
      } else {
        var topLoc = $(wrprId).offset().top - 50;
      }
      break;
      case 'fb-state' :
      wrprId = '#fb-state-wrapper';
      sectionId = '#state_ending';
      var topLoc = $(wrprId).offset().top - 30;
      break;
    }

    function moveRightSide() {
      var bottomLoc = $('#find-fb-search-and-map').position().top + $('#find-fb-search-and-map').outerHeight(true) - $('#find-fb-search-and-map .right ' + wrprId).outerHeight(true);
      var winWidth = $(window).width();
      // $(wrprId).removeAttr('style');
      if (winWidth > 991) {
        bottomLoc = bottomLoc - 131;
      } else {
        bottomLoc = bottomLoc - 91;
        if (winWidth > 767) {
          $(wrprId).css('width', (winWidth - (2 * 20) - 215 - 40 ).toString() + 'px');
        } else {
          $(wrprId).css('width', '100%');
        }
      }

      if (winWidth > 767) {
        if (topLoc >= $(window).scrollTop()) {
          if ($(wrprId).hasClass('fixed')) {
            $(wrprId + ', ' + sectionId).removeClass('fixed bottom');
          }
        } else {
          if (bottomLoc >= $(window).scrollTop()) {
            if (!$(wrprId).hasClass('fixed')) {
              $(wrprId).addClass('fixed');
              $(wrprId + ', ' + sectionId).removeClass('bottom');
            }
          } else {
            if ($(wrprId).hasClass('fixed')) {
              $(wrprId).removeClass('fixed');
              $(wrprId + ', ' + sectionId).addClass('bottom');
            }
          }
        }
      } else {
        $(wrprId + ', ' + sectionId).removeClass('fixed bottom');
      }
    }

    $(window).scroll(function() {
      moveRightSide();
    });
    $(window).bind('touchmove', function(e) {
      var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
      moveRightSide();
    });
    $(window).bind('orientationchange', function(e) {
      moveRightSide();
    });
  }

  function getRelatedStories(state, foodInsecurityCount) {
    var box = $('#profile-featured-story'),
    bank = {
      'id': box.data('bank_id'),
      'state': state
    },
    contentURL = '/assets/promos/wrpr/blended-list-fbp.html';

    box.children().hide();
    box.append('<div id="profile-featured-story-loader" class="loading" style="margin-top:100px;"></div>').show();

    var loadRelatedStories = function(box, contentURL, type, bank, callback) {
      var nextType = null, loadUrl = contentURL;
      switch (type) {
        case 'id' :
        nextType = 'state';
        loadUrl += '?food_bank=' + bank[type];
        break;
        case 'state' :
        loadUrl += '?state=' + bank[type];
        break;
        default :
        box.find('#profile-featured-story-loader').remove();
        box.children().show();
        return;
      }
      $.ajax({
        url: loadUrl, dataType: 'html', data: {}, cache: true,
        success: function (data) {
          var $bttns, $items = $('<div>' + data + '</div>').find('.list-items>.list-item');
          if ($items.length) {
            $items.tsort('span.date', {order: 'desc'});
            box.find('#profile-featured-story-loader').remove();
            $bttns = box.find('.profile-buttons').detach().show();
            box.html($($items[0]).children()).append($bttns).show();
            if (!foodInsecurityCount) {
              box.find('.profile-buttons a.button').css('margin-right','10px');
              box.find('#profile-story-area').css('position','relative').find('.thumbnail').css('top','0').css('left','0');
            }
            return;
          } else {
            callback(box, contentURL, nextType, bank, callback);
          }
        },
        error: function() {
          callback(box, contentURL, nextType, bank, callback);
        }
      });
    }
    loadRelatedStories(box, contentURL, 'id', bank, loadRelatedStories);
  }

  var localCache = {
    timeout: 86400,
    data: {},
    remove: function (url) {
      delete localCache.data[url];
    },
    exist: function (url) {
      return !!localCache.data[url] && ((new Date().getTime() - localCache.data[url]._) < localCache.timeout);
    },
    get: function (url) {
      console.log('Getting in cache for url' + url);
      return localCache.data[url].data;
    },
    set: function (url, cachedData, callback) {
      localCache.remove(url);
      localCache.data[url] = {
        _: new Date().getTime(),
        data: cachedData
      };
      if (jQuery.isFunction(callback)) callback(cachedData);
    }
  };

  jQuery.ajaxPrefilter(function (options, originalOptions, jqXHR) {
    if (options.cache) {
      var complete = originalOptions.complete || jQuery.noop,
      url = originalOptions.url;
          //remove jQuery cache as we have our own localCache
          options.cache = false;
          options.beforeSend = function () {
            if (localCache.exist(url)) {
              complete(localCache.get(url));
              return false;
            }
            return true;
          };
          options.complete = function (data, textStatus) {
            localCache.set(url, data, complete);
          };
        }
      });

  function buildProfilePageDisplay(data, orgId, resultsWrapper) {
    if (data !== null) {
      //build our HTML
      var org = data[0],
      mapString = '',
      stateName = statesAbbrToFull[org.MailAddress.State],
      profileElements = $('<div/>'),
      addressString = (org.MailAddress.Address2.length !== 0) ? org.MailAddress.Address1 + '<br>' + org.MailAddress.Address2 + '<br>' : org.MailAddress.Address1 + '<br>',
      chiefExec = (org.ED.FullName.length !== 0)? '<strong>Chief Executive:</strong> <span>'+(org.ED.FullName).replace(/_/g, ' ')+'</span><br>': '',
      mediaContact = (org.MediaContact.FullName.length !== 0)? '<strong>Media Contact:</strong> <span>'+(org.MediaContact.FullName).replace(/_/g, ' ')+'</span><br>': '',
      orgAgencyButton = '', orgDonateUrl = '', orgVolunteerURL = '', socialIcons = '', countyList = $('<span class="counties"/>'),
      foodInsecurityCount = FA.howweareending.rate(org.FI_AGGREGATE),
      foodInsecurityStat = '1 in ' + foodInsecurityCount.toString() + ' people',
      childFoodCount = FA.howweareending.rate(org.CHILD_FI_PCT),
      childFoodStat = '1 in ' + childFoodCount.toString();

      //google map
      switch (org.MailAddress.State) {
        case 'PR' :
        mapString = encodeURI('Puerto Rico');
        break;
        default :
        mapString = encodeURI((org.FullName).replace(/[&]/g, 'and') + ' ' + org.MailAddress.Address1 + ' ' + org.MailAddress.City + ' ' + org.MailAddress.State + ' ' + org.MailAddress.Zip);
      }
      $('#embmap iframe').attr('src', 'https://www.google.com/maps/embed/v1/place?q=' + mapString + '&key=AIzaSyAoZxu1I0X9Tr_LoOYA6C-JqJmaunlrMF4&zoom=11');

      //logo and title
      $('h1.page-title, #profile-pounds .name, #profile-counties .name, #profile-area-info .name, #profile-area-info .state').html(org.FullName);
      $('.profile-logo img').attr({
        src: org.LogoUrls.FoodBankLocator,
        alt: 'Logo: ' + org.FullName
      });

      //state name
      //$('#profile-area-info .state').html(stateName);
      //left column profile
      profileElements.append('<a class="profile-link" href="http://'+ org.URL+'">' + org.URL + '</a>');
      profileElements.append(
        '<p class="visible-desktop">' + addressString + org.MailAddress.City + ', ' + org.MailAddress.State + ' ' + org.MailAddress.Zip + '<br>' + org.Phone + '</p>' +
        '<p class="visible-mobile">' +
        '<a href="http://maps.google.com?q=' + mapString + '" target="_blank">' + addressString + org.MailAddress.City + ', ' + org.MailAddress.State + ' ' + org.MailAddress.Zip + '</a><br>' +
        '<a href="tel:+' + org.Phone + '">' + org.Phone + '</a>' +
        '</p>'
        );

      //exec contacts
      profileElements.append('<p>' + chiefExec + mediaContact + '</p>');

      //buttons
      if (org.SocialUrls && org.SocialUrls.DonateUrl && org.SocialUrls.DonateUrl != '') {
        orgDonateUrl = '<a href="' + org.SocialUrls.DonateUrl + '" class="green button" style="padding: 11px 10px"> Give Locally </a>&nbsp;&nbsp;'
      }
      if (org.AgencyURL !== '') { // TODO: temp style, put in CSS
        orgAgencyButton = '<a href="' + org.AgencyURL + '" class="green button" style="padding: 11px 10px"> Find Food </a>&nbsp;&nbsp;';
      }
      if (org.VolunteerURL !== '') {
        orgVolunteerURL = '<a href="' + org.VolunteerURL + '" class="green button" style="padding: 11px 10px"> Volunteer </a>';
      }
      profileElements.append('<div class="profile-buttons">' + orgDonateUrl + orgAgencyButton + orgVolunteerURL + '</div>');

      //social
      if (org.SocialUrls.Facebook !== '' || org.SocialUrls.Twitter !== '') {
        socialIconsWrapper = $('<div class="profile-social"/>'),
        socialIcons = $('<ul class="social_icons"/>');

        socialIconsWrapper.append('<span>Find us on:</span>');
        if (org.SocialUrls.Facebook !== '') {
          socialIcons.append('<li class="fbk"><a title="Facebook" href="'+org.SocialUrls.Facebook+'">facebook</a></li>');
        }

        if (org.SocialUrls.Twitter !== '') {
          socialIcons.append('<li class="twt"><a title="Twitter" href="https://twitter.com/'+org.SocialUrls.Twitter+'">twitter</a></li>');
        }
        socialIconsWrapper.append(socialIcons);
        profileElements.append(socialIconsWrapper);
      }

      var profileInfo = resultsWrapper.find('#food-bank-profile-info');
      profileInfo.empty();
      profileInfo.append(profileElements);

      //stat bar
      if (org.PoundageStats.ShowMeals && org.PoundageStats.ShowMeals == 'true') {
        $('#profile-pounds .right .number').html(commaSeparateNumber(org.PoundageStats.Meals));
        $('#profile-pounds .right .bottom-text').html('meals to people struggling with hunger');
      } else {
        $('#profile-pounds .right .number').html(commaSeparateNumber(org.PoundageStats.TotalPoundage));
      }
      if (org.ListFipsCounty !== '') {
        if (org.ListFipsCounty.LocalFindings.length === undefined) {
          org.ListFipsCounty.LocalFindings = [org.ListFipsCounty.LocalFindings];
        }
        $.each(org.ListFipsCounty.LocalFindings, function(key, county) {
          countyList.append(county.CountyName.toLowerCase() + ' ' + county.State);
          if (key !== org.ListFipsCounty.LocalFindings.length-1) {
            countyList.append(', ');
          }
        });
      }

      $('#profile-counties').append(countyList);
      $('#profile-area-info .people-stat .stat').html(foodInsecurityStat);
      $('#profile-area-info .children-stat .stat.green').html(childFoodStat);
      if (foodInsecurityCount) {
        var food_insecure_image = Math.min(14, foodInsecurityCount);
        food_insecure_image = Math.max(2, food_insecure_image);
        $('#profile-area-info .people-stat img').attr('src', ('/themes/custom/ts_feeding_america/images/profile_1in[count].png').replace('[count]', food_insecure_image)).attr('alt', foodInsecurityStat);
      } else {
        $('#profile-area-info').hide();
        $('#profile-featured-story').removeClass('right');
      }

      // related stories
      // getRelatedStories(org.MailAddress.State, foodInsecurityCount);

      if (org.ListPDOs !== '') {
        if (org.ListPDOs.PDO.length === undefined) {
          org.ListPDOs.PDO = [org.ListPDOs.PDO];
        }
        $.each(org.ListPDOs.PDO, function(key, pdo) {
          var pdoWrapper = $('<div class="partner-org"/>');
          pdoWrapper.append('<span class="name">' + pdo.Title + '</span>');
          pdoWrapper.append('<span>'+pdo.Address+'</span>');
          pdoWrapper.append('<span>'+ pdo.City + ', ' + pdo.State + ' ' + pdo.ZipCode + '</span>');
          pdoWrapper.append('<span>'+pdo.Phone+'</span>');
          pdo.Website ? pdoWrapper.append('<span><a href="' + pdo.Website + '">' + pdo.Website + '</a></span>') : '';

          $('#partner-orgs-boxes').prepend(pdoWrapper);
        });
      } else {
        $('#partner-distribution-orgs').hide();
      }

      resultsWrapper.show();
    }
  }

  function initFBStatePage() {
    var state = $('#fb-state-current').val(),
    name = $('#fb-state-current-name').val();

    if (state != '') {
      displayStateOrgs(state, name);
      stateHungerMeter(state);
      $('#homepage_ending_select').val(state);
    }
    $('#homepage_ending_select').change(function(e) {
      e.preventDefault();
      var name = $(this).find('option:selected').text();
      name = (name == 'The United States') ? '' : name;
      window.location = FA.howweareending.state.link + name.replace(/ /g, '-').toLowerCase();
    });
    initStickyMapWrapper('fb-state');
  }

  function initFBPage() {
    var execSearch = null,
    searchZipCode = getParameterByName('zip'),
    searchState = getParameterByName('state');

    if (searchZipCode != '' && searchZipCode.length < 10) {
      currentSearch = searchZipCode;
      execSearch = function() {
        searchByZip(searchZipCode);
      }
    } else if (searchState != '' && searchState.length == 2) {
      currentSearch = searchState;
      execSearch = function() {
        searchByState(searchState);
      }
    } else {
      var target = document.querySelector('#find-fb-search-and-map #find-fb-search-results');
      var observer = new MutationObserver(function(mutations) {
        $('#find-fb-search-formbox .loading-white.clicked').remove();
      });
      var config = { attributes: true, childList: true, characterData: true };
      observer.observe(target, config);
    }

    // Use image if time is > 12pm CT.
    var FAnow = new Date(new Date().getTime() - (21600 * 1000));
    // if (!isSmallScreen() && FAnow.getUTCHours() < 12) {
    if (!isSmallScreen()) {
      //initFBMap();
    }

    // Clear State if you add a zip, clear the Zip if you select a state.
    $('#find-fb-search-form #find-fb-search-form-zip').keyup(function() {
      $('#find-fb-search-form #find-fb-search-form-state').val('');
    });
    $('#find-fb-search-form #find-fb-search-form-state').on('change', function() {
      $('#find-fb-search-form #find-fb-search-form-zip').val('');
    });

    // map orgs
    mapAllOrgs(execSearch);

    //reworked reposition script
    initStickyMapWrapper('fb-map');

    //search button click event
    $('#find-fb-search-form button[type="submit"]').once().click(function(e) {
      var searchZipCode = $('#find-fb-search-form #find-fb-search-form-zip').val(),
      searchState = $('#find-fb-search-form #find-fb-search-form-state').val();

      e.preventDefault();

      if (searchZipCode.length > 0) {
        if (searchZipCode !== currentSearch) {
          var zip = searchZipCode.replace(/\D/g,'');
          if (searchZipCode.length == 5 && searchZipCode == zip) {
            currentSearch = searchZipCode;
            searchByZip(searchZipCode);
            $('#find-fb-search-form #find-fb-search-form-zip').val(searchZipCode);
          } else {
            clearFBMap();
            hideResultBoxes();
            searchNoResults($('#find-fb-search-results'), 'zip code');
          }
          $('html, body').animate({
            scrollTop: $("#find-fb-search-formbox").offset().top
          }, 2000);
        }
      } else if (searchState !== '' && searchState !== null) {
        if (searchState !== currentSearch) {
          currentSearch = searchState;
          searchByState(searchState);
          $('#find-fb-search-form #find-fb-search-form-state').val(searchState)
          $('html, body').animate({
            scrollTop: $("#find-fb-search-formbox").offset().top
          }, 2000);
        }
      }
    });
  }

  function initProfilePage() {
    var orgId = $('#fbid').text();
    if (orgId !== '') { // Do the request
      var resultsWrapper = $('#food-bank-profile-address-map');
      FA.ws.request('GetOrganizationsByOrgId', { a2horgid : orgId },
        'Organization',
        function(data) {
          buildProfilePageDisplay(data, orgId, resultsWrapper);
        },
        function(response) {// Error
          $('#profile-counties').remove();
          $('#partner-distribution-orgs').remove();
          resultsWrapper.find('#food-bank-profile-info').prepend('<p>Sorry, local information is not available at this time. <a href="/find-your-local-foodbank/">Please try again.</a></p>');
          resultsWrapper.show();
        });
    }
  }

  function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
    results = regex.exec(location.search);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
  }

  function commaSeparateNumber(val){
    while (/(\d+)(\d{3})/.test(val.toString())){
      val = val.toString().replace(/(\d+)(\d{3})/, '$1'+','+'$2');
    }
    return val;
  }

  function isSmallScreen() {
    return ($(window).width() < 768);
  }

  $(document).ready(function() {
    //locator scripts, check if locator exists
    if ($('#fb-map-wrapper-inner').length) {
      // If there's a blocklist, check that the referrer isn't in it.
      if (typeof feamRefList !== 'undefined') {
        if (!feamRefList.some(v => document.referrer.toLowerCase().includes(v))) {
          initFBPage();
        }
      } else {
        initFBPage();
      }
    } else if ($('#food-bank-profile-address-map').length) {
      initProfilePage();
    } else if ($('#fb-state-wrapper-inner').length) {
      initFBStatePage();
    }
  });
})(jQuery);
