
/*****************/
/*  GOOGLE MAPS  */
/*****************/
var radiusInKm = 0.5;
//TODO: style this map to fit the pages theme
var styles1 =
    [
        {
            "featureType": "administrative",
            "elementType": "labels.text.fill",
            "stylers": [
                {
                    "color": "#444444"
                }
            ]
        },
        {
            "featureType": "landscape",
            "elementType": "all",
            "stylers": [
                {
                    "color": "#f2f2f2"
                }
            ]
        },
        {
            "featureType": "landscape",
            "elementType": "labels.text",
            "stylers": [
                {
                    "visibility": "on"
                },
                {
                    "hue": "#ff0000"
                }
            ]
        },
        {
            "featureType": "poi",
            "elementType": "all",
            "stylers": [
                {
                    "visibility": "off"
                }
            ]
        },
        {
            "featureType": "road",
            "elementType": "all",
            "stylers": [
                {
                    "saturation": -100
                },
                {
                    "lightness": 45
                }
            ]
        },
        {
            "featureType": "road.highway",
            "elementType": "all",
            "stylers": [
                {
                    "visibility": "simplified"
                }
            ]
        },
        {
            "featureType": "road.arterial",
            "elementType": "labels.icon",
            "stylers": [
                {
                    "visibility": "off"
                }
            ]
        },
        {
            "featureType": "transit",
            "elementType": "all",
            "stylers": [
                {
                    "visibility": "off"
                }
            ]
        },
        {
            "featureType": "water",
            "elementType": "all",
            "stylers": [
                {
                    "color": "#10ade4"
                },
                {
                    "visibility": "on"
                }
            ]
        }
    ]

var map;
var userLocation;



function initMap() {
    //get users location
    if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(function (p){
           var LatLng = new google.maps.LatLng(p.coords.latitude, p.coords.longitude);
            userLocation = [p.coords.latitude, p.coords.longitude];

            var styledMap = new google.maps.StyledMapType(styles1, {name:"Style Map 1"});

            //Create a map object and include the map type id
            var mapOptions = {
                zoom: 13,
                // center: new google.maps.LatLng(48.864716, 2.349014),
                center: LatLng,
                mapTypeControlOptions: {
                    mapTypeIds: [google.maps.MapTypeId.ROADMAP, 'map_style']
                }
            };
            map = new google.maps.Map(document.getElementById('map'), mapOptions);

            //Associate the styled map with the map type id
            map.mapTypes.set('map_style', styledMap);
            map.setMapTypeId('map_style');
            var loc = LatLng;


            //create a draggable circle centered on the map
            //TODO: style this circle to fit the pages theme
            var circle = new google.maps.Circle({
                strokeColor: "#6D3099",
                strokeOpacity: 0.7,
                strokeWeight: 1,
                fillColor: "B650FF",
                fillOpacity: 0.35,
                map: map,
                center: loc,
                radius: ((radiusInKm) * 1000),
                draggable: true
            });

            //Update the query's criteria every time the circle is dragged
            var updateCriteria = _.debounce(function(){
                var latLng = circle.getCenter();
                geoQuery.updateCriteria({
                    center: [latLng.lat(), latLng.lng()],
                    radius: radiusInKm
                });

            }, 10);
            google.maps.event.addListener(circle, "drag", updateCriteria);


            // Set up Marker Animations

            google.maps.Marker.prototype.animatedMoveTo = function(newLocation) {
                var toLat = newLocation[0];
                var toLng = newLocation[1];

                var fromLat = this.getPosition().lat();
                var fromLng = this.getPosition().lng();

                if (!coordinatesAreEquivalent(fromLat, toLat) || !coordinatesAreEquivalent(fromLng, toLng)) {
                    var percent = 0;
                    var latDistance = toLat - fromLat;
                    var lngDistance = toLng - fromLng;
                    var interval = window.setInterval(function () {
                        percent += 0.01;
                        var curLat = fromLat + (percent * latDistance);
                        var curLng = fromLng + (percent * lngDistance);
                        var pos = new google.maps.LatLng(curLat, curLng);
                        this.setPosition(pos);
                        if (percent >= 1) {
                            window.clearInterval(interval);
                        }
                    }.bind(this), 50);
                }
            };

        });
    }else{
        alert("could not get geolocation data");
    }

}

/*************************/
/*  Geoquery + Firebase */
/*************************/

var locations = {
    "Paris": [48.864716, 2.349014],
    "Rome": [41.902783, 12.496366],
    "New York":[40.712784,-74.005941],
    "Cairo":[30.044420,31.235712]
};
 var center = locations["Paris"];

//Reference to Firebase for Haki
var HakiFirebaseRef = new Firebase("https://red-haki.firebaseio.com/");

//Reference to Geofire Instance
/*TODO: Set up 2 Geofire instances, depending on if this is for Admin view, or
 someone using Watch my Back
  */

var geoFire = new GeoFire(HakiFirebaseRef.child("user_locations"));
//var geoFire = new GeoFire(HakiFirebaseRef.child("WMB"));

//keep track of all users currently within the query
var usersInQuery = {};

//Create a new GeoQuery instance
var geoQuery = geoFire.query({
   center: center,
    radius: radiusInKm
});

/*Adds new user markers to the map when they enter the query
        USER ENTERED RANGE
 */
geoQuery.on("key_entered", function(userId, userLocation){
//get vehicle details
    userId = userId;
    usersInQuery[userId] = true;

    //look up the users data in firebase
    HakiFirebaseRef.child("statuses").child(userId).once("value", function(dataSnapshot){
        // get the user information from the firebase dataset
        user = dataSnapshot.val();

        //If the User has not already exited the query in the time it took to look up its data, add to map
        if(user !== null && usersInQuery[userId] == true){
            //add the user to the list of users in the query
            usersInQuery[userId] = user;

            //create a new marker for the user
            user.marker = createUserMarker(user)
        }

    });


});

/*
user moved
 */
geoQuery.on("key_moved", function(userId, userLocation){
    //get the user from the list of users in the query

    userId = userId;
    var user = usersInQuery[userId];

    //Animate the user's movement
    if(typeof user !== "undefined" && typeof user.marker !== "undefined") {
        user.marker.animatedMoveTo(userLocation);

    }
});

/*
User Left range
 */

geoQuery.on("key_exited", function(userId, userLocation){
    //Get the user from the list of users in the query
    userId = userId;
    var user = usersInQuery[userId];

    // If the user's data has already been loaded from Firebase, remove its marker from map
    if(user !== true){
        user.marker.setMap(null);
    }
    //Remove the vehicle from the list of users in the query
    delete usersInQuery[userId];

});


/**********************/
/*  HELPER FUNCTIONS  */
/**********************/

/*Adds a marker for the inputted user to the map */
function createUserMarker(user){
  var marker = new google.maps.Marker({
     //icon: "",
      position: new google.maps.LatLng(user.latitude, user.longitude),
      optimized: true,
      title: user.section + ": " + user.type,
      map: map
  });

    return marker;

}

/* Returns true if the two inputted coordinates are approximately equivalent */
function coordinatesAreEquivalent(coord1, coord2) {
    return (Math.abs(coord1 - coord2) < 0.000001);
}




