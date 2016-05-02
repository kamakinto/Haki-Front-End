/**
 * Created by everettrobinson on 5/1/16.
 */
/*****************/
/*  GOOGLE MAPS  */
/*****************/
var radiusInKm = 0.5;
var map;
var uuid = "";
var user = {};
var destination = {};
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

function initMap(){
//set Map Style & Options
    var styledMap = new google.maps.StyledMapType(styles1, {name:"Blizzard Haki"});
   // var fireStyledMap = new google.maps.StyledMapType(styles2, {name:"Fire Haki"});

    var mapOptions = {
        zoom: 13,
         center: new google.maps.LatLng(48.864716, 2.349014),
       // center: LatLng, //should be firebase longLat
        mapTypeControlOptions: {
            mapTypeIds: [google.maps.MapTypeId.ROADMAP, 'blizzard_style']
           // mapTypeIds: [google.maps.MapTypeId.ROADMAP, 'blizzard_style', 'fire_style']
        }
    };
  map = new google.maps.Map(document.getElementById('wmbMap'), mapOptions);

    //Associate the styled map with the map type id
    map.mapTypes.set('blizzard_style', styledMap);
   // map.mapTypes.set('fire_style', fireStyledMap);
    map.setMapTypeId('blizzard_style');


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

}

/*************************/
/*        Firebase */
/*************************/

//Reference to Firebase for Haki
var HakiFirebaseRef = new Firebase("https://red-haki.firebaseio.com/");


// app logic

//check for a uuid. if there is an id, set it to a global variable and
//begin execution of tracking. if not, do nothing

(function (){
    if (isWatchMyBackClient()) {
        //set new globals
        uuid = getClientUuid();
        WMBHakiFirebaseRef = HakiFirebaseRef.child("WMB").child(uuid);

        WMBHakiFirebaseRef.once("value", function(userdata){
        if(userdata.val() !== null){
            user = userdata.val();

            user.marker = setUserMarker(userdata.val());
            destination.marker = setDestinationMarker(userdata.val());
        } else {
            console.log("Could not get user data")
        }

       });

        //get user values from firebase based on the uuid
        WMBHakiFirebaseRef.on("value", function(dataSnapshot) {
            //set javascript object to Firebase values

            if(dataSnapshot.val() !== null){
                user = dataSnapshot.val();
                console.log("pulsing data to set: " + dataSnapshot.val());
                //place user marker function
                updateUserMarker(user);
                //place destination marker function
                updateDestinationMarker(user);
                //move marker

            } else {
                console.log("unknown reference point")
            }


        }, function (errorObject){
            console.log("The read failed: " + errorObject.code);





        });
        //set javascript object values based on firebase




    }








})();






/**********************/
/*  HELPER FUNCTIONS  */
/**********************/

function getClientUuid(){
    var uuid = "";
    var queryUrl =  window.location.search;

    //decript the URL string to get the user's uuid
    uuid = queryUrl.slice(1);


    return uuid;
}


function isWatchMyBackClient(){
    //check for a uuid in the header
    var query = window.location.search;

    if (query.indexOf("?") !== -1){
        return true;
    }
    return false;
}


function setUserMarker(userData){
 var marker = new google.maps.Marker({
     position: new google.maps.LatLng(user.latitude, user.longitude),
     optimized: true,
     title: "",
     map: map
 });
    return marker;
}

function setDestinationMarker(userData){
    var  marker = new google.maps.Marker({
        position: new google.maps.LatLng(userData.dest_latitude, userData.dest_longitude),
        optimized: true,
        title: "Destination",
        map: map
    });
    console.log("current lat: " + userData.dest_latitude + " ,  current long: " + userData.dest_longitude);
    return marker;
}

function updateUserMarker(userData){
    var newLocation = [userData.latitude, userData.longitude];
//animate user movements
    if(typeof user !== "undefined" && typeof user.marker !== "undefined" &&
    userData.latitude !== user.latitude && userData.longitude !== user.longitude) {
        user.marker.animatedMoveTo(newLocation);
    }

}

function updateDestinationMarker(userData){
if(userData.dest_longitude !== user.dest_longitude && userData.dest_latitude !== user.dest_latitude){
    //update the marker
    var newLocation = [userData.dest_latitude, userData.dest_longitude];
    destination.marker.animatedMoveTo(newLocation);
}

}

function clearMap(){
    //remove the markers from the map
    //close firebase listener

}

function setMarkers(userData){


}