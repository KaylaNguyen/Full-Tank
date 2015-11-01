window.onload  = GetMap;
var map = null;
var searchManager = null;
var currInfobox = null;
var directionsManager;
var directionsErrorEventObj;
var directionsUpdatedEventObj; 

var latitude = null;
var longitude = null;

var listOfGasStations = null;

function calculateDistanceThreshold(){
  var data = getDataPackage();

  var mileage = data[2];                    // Miles per gallon
  var capacity = data[3];                   // Gallons
  var gasRemaining = $('#gas-remaining');   // Percentage 

  // 50% of a 20 gal tank = 10,   * 15 mi/hr = 150 mi until completely empty,   *0.9 => Distance threshol = 135 mi 
  return (.5*capacity*mileage)*0.90;
}

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


function createDirectionsManager(){
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
	  
function createDrivingRoute(){
  if (!directionsManager) { createDirectionsManager(); }
  directionsManager.resetDirections();
  // Set Route Mode to driving 
  directionsManager.setRequestOptions({ routeMode: Microsoft.Maps.Directions.RouteMode.driving });
  var seattleWaypoint = new Microsoft.Maps.Directions.Waypoint({ address: getDataPackage()[0] });
  directionsManager.addWaypoint(seattleWaypoint);
  var tacomaWaypoint = new Microsoft.Maps.Directions.Waypoint({ address: getDataPackage()[1] });
  directionsManager.addWaypoint(tacomaWaypoint);

  //directionsManager.addWaypoint(new Microsoft.Maps.Directions.Waypoint({ address: 'Issaquah, WA', location: new Microsoft.Maps.Location(47.530094, -122.033798) }), 1);

  // Set the element in which the itinerary will be rendered
  directionsManager.setRenderOptions({ itineraryContainer: document.getElementById('directionsItinerary') });
  console.log('Calculating directions...');
  directionsManager.calculateDirections();


  // Specify a handler for when the directions are calculated
  //Microsoft.Maps.Events.addHandler(directionsManager, 'directionsUpdated', displayMessage);
  Microsoft.Maps.Events.addHandler(directionsManager, 'directionsError', displayError);       
}

function getTotalDistance(route){
  	var distanceToDestination = 0;
	for(var i = 0; i < route.length; i++){
		var currRoute = route[i];
		for(var j = 0; j < currRoute.routeLegs.length; j++){
			var routeLeg = currRoute.routeLegs[j];
			for(var k = 0; k < routeLeg.itineraryItems.length; k++){
			    var step = routeLeg.itineraryItems[k];
			   	distanceToDestination += parseFloat(step.distance);
		  	}
		}
  	}
  	return distanceToDestination;
}

function doGasStuff() {      
	console.log(directionsManager.getRouteResult());
	var routes = directionsManager.getRouteResult();

	var distanceThreshold = calculateDistanceThreshold();
	var distanceToDestination = getTotalDistance(routes);

	var betweemStationsTraveled = 0;
	var totalSumTraveled = 0;

	for(var i = 0; i < routes.length; i++){
		var route = routes[i];
		if(betweemStationsTraveled >= distanceThreshold || totalSumTraveled >= distanceToDestination){ break; }

		for(var j = 0; j < route.routeLegs.length; j++){
		  var routeLeg = route.routeLegs[j];
		  if(betweemStationsTraveled >= distanceThreshold || totalSumTraveled >= distanceToDestination){ break; }

		  	for(var k = 0; k < routeLeg.itineraryItems.length; k++){
				var step = routeLeg.itineraryItems[k];
				betweemStationsTraveled += parseFloat(step.distance);
				totalSumTraveled += parseFloat(step.distance);

				// Once we have traveled d miles, look for a gas station 
				if(betweemStationsTraveled >= distanceThreshold && totalSumTraveled < distanceToDestination){
				  	betweemStationsTraveled = 0;
				  	distanceThreshold = getDataPackage()[3]*getDataPackage()[2]*.9;
				  	console.log(distanceThreshold);
				  	//Look for gas station.
				  	latitude = step.coordinate.latitude;
				  	longitude = step.coordinate.longitude;

				  	LoadSearchModule();

				  	//Set new waypoint of (lat,lon) in between source and dest
				  	setTimeout(function(){
						var gasAddress = listOfGasStations[0].address;
						var gas = new Microsoft.Maps.Directions.Waypoint({ address: gasAddress });
						directionsManager.addWaypoint(gas, directionsManager.getAllWaypoints().length-1);
				
						console.log(directionsManager.getAllWaypoints());
						directionsManager.calculateDirections();
				  	}, 2000);
				  	break;
				}

			} 
		}
	 }
	 console.log("total trip distance: " + totalSumTraveled);
}

function displayError(e){
  console.log("An error has occurred calculating the directions.");
}

function createDirections() {
  if (!directionsManager){
	Microsoft.Maps.loadModule('Microsoft.Maps.Directions', { callback: createDrivingRoute });
  }
  else {
	createDrivingRoute();
  }
}

function GetMap(){
  Microsoft.Maps.loadModule('Microsoft.Maps.Themes.BingTheme', { callback: function() {
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

// ------------------------------- SEARCH -------------------------------

function createSearchManager() {
   map.addComponent('searchManager', new  Microsoft.Maps.Search.SearchManager(map));
   searchManager = map.getComponent('searchManager');
}

function LoadSearchModule() {
   Microsoft.Maps.loadModule('Microsoft.Maps.Search', {  callback: searchRequest })
}

function searchRequest() { 
  createSearchManager(); 
  var what = 'gas stations'; 
  var where = "near (" + latitude + "," + longitude + ")"; 
  var request = 
	  { 
		  what: what, 
		  where: where, 
		  count: 10, 
		  startIndex: 0, 
		  bounds: map.getBounds(), 
		  callback: search_onSearchSuccess, 
		  errorCallback: search_onSearchFailure, 
	  };
  searchManager.search(request);
} 


function search_onSearchSuccess(result, userData) {
   map.entities.clear();
   var searchResults = result && result.searchResults;
   if (searchResults) {
	   for (var i = 0; i < searchResults.length; i++) {
		   //search_createMapPin(searchResults[i]);
	   }
	   if (result.searchRegion &&  result.searchRegion.mapBounds) {
		   map.setView({ bounds:  result.searchRegion.mapBounds.locationRect });
	   }
	   else {
		   console.log('No results');
	   }
	}
	console.log("im in search");
	console.log(searchResults);
	listOfGasStations = searchResults;
}

function search_createMapPin(result) {
   if (result) {
	   var pin = new Microsoft.Maps.Pushpin(result.location, null);
	   Microsoft.Maps.Events.addHandler(pin, 'click', function () {  
  search_showInfoBox(result) });
	   //map.entities.push(pin);
   }
}

function search_showInfoBox(result) {
   if (currInfobox) {
   currInfobox.setOptions({ visible: true });
   map.entities.remove(currInfobox);
   }
   var currInfobox = new Microsoft.Maps.Infobox(
	   result.location,
	   {
		   title: result.name,
		   description: [result.address,  result.city, result.state, 
			 result.country,  result.phone].join(' '),
		   showPointer: false,
		   titleAction: null,
		   titleClickHandler: null 
	   });
   currInfobox.setOptions({ visible: true });
   map.entities.push(currInfobox);
}

function search_onSearchFailure(result, userData) {
  console.log('Search failed');
}