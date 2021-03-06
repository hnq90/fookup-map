var map;
var infowindow = null;
var gmarkers = [];
var highestZIndex = 0;
var agent = "default";
var zoomControl = true;
var markers = [];

var FoodCtrl = function($scope, $http) {
  $scope.restaurants = [];
  $scope.types = [
    {id: 'inexpensive', title: 'Inexpensive'},
    {id: 'moderate', title: 'Moderate'},
    {id: 'hiend', title: 'Hi-end'}
  ];
  $scope.markerTitles = [];

  $scope.restaurantCount = function(type) {
    // TODO: Can be replaced into functional programming (reduce)
    var count = 0;
    $.each($scope.restaurants, function (i, r) {
      if (r.type == type) count++;
    });
    return count;
  }

  // initialize map
  $scope.init  = function() {
    // set map options
    var myOptions = {
      zoom: 12,
      //minZoom: 10,
      center: new google.maps.LatLng(defaultLat, defaultLng),
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      streetViewControl: false,
      mapTypeControl: false,
      panControl: false,
      zoomControl: zoomControl,
      styles: mapStyles,
      zoomControlOptions: {
        style: google.maps.ZoomControlStyle.SMALL,
        position: google.maps.ControlPosition.LEFT_CENTER
      }
    };
    map = new google.maps.Map(document.getElementById('map_canvas'), myOptions);
    zoomLevel = map.getZoom();

    // prepare infowindow
    infowindow = new google.maps.InfoWindow({
      content: "holding..."
    });

    // only show marker labels if zoomed in
    google.maps.event.addListener(map, 'zoom_changed', function () {
      zoomLevel = map.getZoom();
      if (zoomLevel <= 15) {
        $(".marker_label").css("display", "none");
      } else {
        $(".marker_label").css("display", "inline");
      }
    });

    $http.get('./restaurants.csv').success(function (response) {
      var data = CSVToArray(response);
      // 233 Quan An Vietnam,Singapore 427491 ,233 Joo Chiat Road Singapore,1.31101,103.901287,hiend
      // title, postal_coe, addr, lat, lng, type
      $.each(data, function (i, r) {
        console.log(r);
        var place = {
          id: i,
          type: r[5],
          title: r[0],
          addr: r[2],
          lat: r[3],
          lng: r[4]
        };
        $scope.restaurants.push(place);
        $scope.markerTitles.push(place.title);
      });

      $scope.processMarkers($scope.restaurants);
    });
  }

  $scope.processMarkers = function(markers) {
    // add markers
    $.each(markers, function (i, val) {
      infowindow = new google.maps.InfoWindow({
        content: ""
      });

      // offset latlong ever so slightly to prevent marker overlap
      rand_x = Math.random();
      rand_y = Math.random();
      val.lat = parseFloat(val.lat) + parseFloat(parseFloat(rand_x) / 6000);
      val.lng = parseFloat(val.lng) + parseFloat(parseFloat(rand_y) / 6000);

      // show smaller marker icons on mobile
      if (agent == "iphone") {
        var iconSize = new google.maps.Size(16, 19);
      } else {
        iconSize = null;
      }

      // build this marker
      var markerImage = new google.maps.MarkerImage("./images/icons/" + val.type + ".png", null, null, null, iconSize);
      var marker = new google.maps.Marker({
        position: new google.maps.LatLng(val.lat, val.lng),
        map: map,
        title: '',
        clickable: true,
        infoWindowHtml: '',
        zIndex: 10 + i,
        icon: markerImage
      });
      marker.type = val.type;
      gmarkers.push(marker);

      // add marker hover events (if not viewing on mobile)
      if (agent == "default") {
        google.maps.event.addListener(marker, "mouseover", function () {
          this.old_ZIndex = this.getZIndex();
          this.setZIndex(9999);
          $("#marker" + i).css("display", "inline");
          $("#marker" + i).css("z-index", "99999");
        });
        google.maps.event.addListener(marker, "mouseout", function () {
          if (this.old_ZIndex && zoomLevel <= 15) {
            this.setZIndex(this.old_ZIndex);
            $("#marker" + i).css("display", "none");
          }
        });
      }

      // format marker URI for display and linking
      var markerURI = val.uri || '';
      if (markerURI.substr(0, 7) != "http://") {
        markerURI = "http://" + markerURI;
      }
      var markerURI_short = markerURI.replace("http://", "");
      var markerURI_short = markerURI_short.replace("www.", "");

      // add marker click effects (open infowindow)
      google.maps.event.addListener(marker, 'click', function () {
        infowindow.setContent(
          "<div class='marker_title'>" + val.title + "</div>" +
            "<div class='marker_uri'><a target='_blank' href='" + markerURI + "'>" + markerURI_short +
            "</a></div>" + "<div class='marker_desc'>" + val.description + "</div>" + "<div class='marker_address'>"+ val.description + " </div>"
        )
        ;
        infowindow.open(map, this);
      });

  // add marker label
      var latLng = new google.maps.LatLng(val.lat, val.lng);
      var label = new Label({
        map: map,
        id: i
      });
      label.bindTo('position', marker);
      label.set("text", val.title);
      label.bindTo('visible', marker);
      label.bindTo('clickable', marker);
      label.bindTo('zIndex', marker);
    });


  // zoom to marker if selected in search typeahead list
    $('#search').typeahead({
      source: $scope.markerTitles,
      onselect: function (obj) {
        marker_id = jQuery.inArray(obj, $scope.markerTitles);
        if (marker_id > -1) {
          map.panTo(gmarkers[marker_id].getPosition());
          map.setZoom(15);
          google.maps.event.trigger(gmarkers[marker_id], 'click');
        }
        $("#search").val("");
      }
    });
  }

}

// detect browser agent
$(document).ready(function () {
  if (navigator.userAgent.toLowerCase().indexOf("iphone") > -1 || navigator.userAgent.toLowerCase().indexOf("ipod") > -1) {
    agent = "iphone";
    zoomControl = false;
  }
  if (navigator.userAgent.toLowerCase().indexOf("ipad") > -1) {
    agent = "ipad";
    zoomControl = false;
  }
});

// resize marker list onload/resize
$(document).ready(function () {
  resizeList()
});
$(window).resize(function () {
  resizeList();
});

// resize marker list to fit window
function resizeList() {
  newHeight = $('html').height() - $('#topbar').height();
  $('#list').css('height', newHeight + "px");
  $('#menu').css('margin-top', $('#topbar').height());
}

// set map styles
var mapStyles = [
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [
      { hue: "#8800ff" },
      { lightness: 50 }
    ]
  },
  {
    featureType: "road",
    stylers: [
      { visibility: "on" },
      { hue: "#91ff00" },
      { saturation: -62 },
      { gamma: 1.98 },
      { lightness: 10 }
    ]
  },
  {
    featureType: "water",
    stylers: [
      { hue: "#005eff" },
      { gamma: 0.72 },
      { lightness: 42 }
    ]
  },
  {
    featureType: "transit.line",
    stylers: [
      { visibility: "off" }
    ]
  },
  {
    featureType: "administrative.locality",
    stylers: [
      { visibility: "on" }
    ]
  },
  {
    featureType: "administrative.neighborhood",
    elementType: "geometry",
    stylers: [
      { visibility: "simplified" }
    ]
  },
  {
    featureType: "landscape",
    stylers: [
      { visibility: "on" },
      { gamma: 0.41 },
      { lightness: 46 }
    ]
  },
  {
    featureType: "administrative.neighborhood",
    elementType: "labels.text",
    stylers: [
      { visibility: "on" },
      { saturation: 33 },
      { lightness: 20 }
    ]
  }
];


// zoom to specific marker
function goToMarker(marker_id) {
  if (marker_id) {
    map.panTo(gmarkers[marker_id].getPosition());
    map.setZoom(15);
    google.maps.event.trigger(gmarkers[marker_id], 'click');
  }
}

// toggle (hide/show) markers of a given type (on the map)
function toggle(type) {
  if ($('#filter_' + type).is('.inactive')) {
    show(type);
  } else {
    hide(type);
  }
}

// hide all markers of a given type
function hide(type) {
  for (var i = 0; i < gmarkers.length; i++) {
    if (gmarkers[i].type == type) {
      gmarkers[i].setVisible(false);
    }
  }
  $("#filter_" + type).addClass("inactive");
}

// show all markers of a given type
function show(type) {
  for (var i = 0; i < gmarkers.length; i++) {
    if (gmarkers[i].type == type) {
      gmarkers[i].setVisible(true);
    }
  }
  $("#filter_" + type).removeClass("inactive");
}

// toggle (hide/show) marker list of a given type
function toggleList(type) {
  $("#list .list-" + type).toggle();
}


// hover on list item
function markerListMouseOver(marker_id) {
  $("#marker" + marker_id).css("display", "inline");
}
function markerListMouseOut(marker_id) {
  $("#marker" + marker_id).css("display", "none");
}
