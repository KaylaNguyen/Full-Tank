window.onload  = GetMap;
var map = null;
var searchManager = null;
var currInfobox = null;
var directionsManager;
var directionsErrorEventObj;
var directionsUpdatedEventObj; 

function getDataPackage(){
  var query = window.location.search;
  if (query.substring(0, 1) == '?') {
    query = query.substring(1);
  }
  var data = query.split(','); 
  for (i = 0; (i < data.length); i++) {
    data[i] = unescape(data[i]);
  }
  return data;
}

function setSourceValue(){
  var data = getDataPackage();
  $("#source").val(data[0]);
}

function setDestinationValue(){
  var data = getDataPackage();
  $("#destination").val(data[1]);
}


function createDirectionsManager()
      {
          var displayMessage;
          if (!directionsManager) 
          {
              directionsManager = new Microsoft.Maps.Directions.DirectionsManager(map);
              displayMessage = 'Directions Module loaded\n';
              displayMessage += 'Directions Manager loaded';
          }
          console.log(displayMessage);
          directionsManager.resetDirections();
          directionsErrorEventObj = Microsoft.Maps.Events.addHandler(directionsManager, 'directionsError', function(arg) { console.log(arg.message) });
          directionsUpdatedEventObj = Microsoft.Maps.Events.addHandler(directionsManager, 'directionsUpdated', function() { console.log('Directions updated') });
      }
      
      function createDrivingRoute()
      {
        if (!directionsManager) { createDirectionsManager(); }
        directionsManager.resetDirections();
        // Set Route Mode to driving 
        directionsManager.setRequestOptions({ routeMode: Microsoft.Maps.Directions.RouteMode.driving });
        var seattleWaypoint = new Microsoft.Maps.Directions.Waypoint({ address: getDataPackage()[0] });
        directionsManager.addWaypoint(seattleWaypoint);
        var tacomaWaypoint = new Microsoft.Maps.Directions.Waypoint({ address: getDataPackage()[1] });
        directionsManager.addWaypoint(tacomaWaypoint);
        //directionsManager.addWaypoint(new Microsoft.Maps.Directions.Waypoint({ address: '<gas station chosen', location: new Microsoft.Maps.Location(47.530094, -122.033798) }), 1);
        // Set the element in which the itinerary will be rendered
        directionsManager.setRenderOptions({ itineraryContainer: document.getElementById('directionsItinerary') });
        console.log('Calculating directions...');
        directionsManager.calculateDirections();
      }

            function createDirections() {
        if (!directionsManager)
        {
          Microsoft.Maps.loadModule('Microsoft.Maps.Directions', { callback: createDrivingRoute });
        }
        else
        {
          createDrivingRoute();
        }
       }

function GetMap(){
   Microsoft.Maps.loadModule('Microsoft.Maps.Themes.BingTheme', { callback: function() 
       {
           map = new Microsoft.Maps.Map(document.getElementById('divMap'), 
           { 
              credentials: "AoKQtG7b2nMnuDnHJSSKWh4UsN2ElHfqQaVhW75bMy6O9HEw-mSPm6yh18EY_6mM",
              mapTypeId:  Microsoft.Maps.MapTypeId.road,
              enableClickableLogo: false,
              enableSearchLogo: false,
              center: new  Microsoft.Maps.Location(47.603561, -122.329437),
              zoom: 10,
              theme: new  Microsoft.Maps.Themes.BingTheme()
           }); 
       }
    });
}
   
function createSearchManager() {
   map.addComponent('searchManager', new  Microsoft.Maps.Search.SearchManager(map));
   searchManager = map.getComponent('searchManager');
}

function LoadSearchModule() {
   Microsoft.Maps.loadModule('Microsoft.Maps.Search', {  callback: searchRequest })
}

function searchRequest() {
   createSearchManager();
   var query = document.getElementById('txtSearch').value;
   var request =
       {
           query: query,
           count: 20,
           startIndex: 0,
           bounds: map.getBounds(),
           callback: search_onSearchSuccess,
           errorCallback:  search_onSearchFailure
       };
   searchManager.search(request);
 }

function search_onSearchSuccess(result, userData) {
   map.entities.clear();
   var searchResults = result && result.searchResults;
   if (searchResults) {
       for (var i = 0; i < searchResults.length; i++) {
           search_createMapPin(searchResults[i]);
       }
       if (result.searchRegion &&  result.searchRegion.mapBounds) {
           map.setView({ bounds:  result.searchRegion.mapBounds.locationRect });
       }
       else {
           alert('No results');
       }
    }
}

function search_createMapPin(result) {
   if (result) {
       var pin = new Microsoft.Maps.Pushpin(result.location, null);
       Microsoft.Maps.Events.addHandler(pin, 'click', function () {  
  search_showInfoBox(result) });
       map.entities.push(pin);
   }
}

function search_showInfoBox(result) {
   if (currInfobox) {
   currInfobox.setOptions({ visible: true });
   map.entities.remove(currInfobox);
   }
   currInfobox = new Microsoft.Maps.Infobox(
       result.location,
       {
           title: result.name,
           description: [result.address,  result.city, result.state, 
             result.country,  result.phone].join(' '),
           showPointer: true,
           titleAction: null,
           titleClickHandler: null 
       });
   currInfobox.setOptions({ visible: true });
   map.entities.push(currInfobox);
}

function search_onSearchFailure(result, userData) {
   alert('Search  failed');
}