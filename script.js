/**
 *  TEST PROGRAM for StreetSmarts.
 */

let map;
let panorama;
let svs;
const coords = [];

let totalScore = 0;
let totalRounds = 0;

const LAT_EQUATOR = 68.703;
const LNG_EQUATOR = 69.172;
const LAT_POLE = 69.407;
const LNG_POLE = 0;
const RADIUS = 30;
const TOTAL_POINTS = 5000;

/**
 *  figure out a way to calculate the majority of random coordinates
 *  where the majority of available locations are present on Street View
 *  (& using the dataset of world cities provided)
 */
var latCut = [-55, 82];
var lngCut = [-180, 179];
const LAT_CUT_RANGE = latCut[1] - latCut[0];
const LNG_CUT_RANGE = lngCut[1] - lngCut[0];

let newLat = parseFloat((Math.random() * LAT_CUT_RANGE + latCut[0]).toFixed(6));
let newLng = parseFloat((Math.random() * LNG_CUT_RANGE + lngCut[0]).toFixed(6));
console.log(`{${newLat}, ${newLng}}`);

const viewLatLng = {lat: 30, lng: -30 };
Object.freeze(viewLatLng);

//const baseLatLng = {lat: 41.3718629, lng: -77.6680427 };  // test for unknown location :-)
const baseLatLng = { lat: 39.9549714, lng: -75.1631286 };

function calculateDistance(baseLocation, estimateLocation) {
    var x1 = baseLocation.lng, x2 = estimateLocation.lng;
    var y1 = baseLocation.lat, y2 = estimateLocation.lat;
    return Math.sqrt(Math.pow((x2 - x1), 2) + Math.pow((y2 - y1), 2));
}

function applyPoints(dist) {
    var temp = TOTAL_POINTS * ((RADIUS - dist) / RADIUS);
    return (temp < 0) ? 0 : Number(temp.toFixed());
}

function displayLocationElevation(location, elevator) {
    elevator.getElevationForLocations({
        locations: [location],
    }).then((response) => {
        if (response.results[0]) {
            const elev = response.results[0].elevation;
            if (elev === null) return;
            $('#elevation-type').html("Elevation: " + elev.toFixed(2) + " meters.");
        }
    }).catch((e) => console.error("Error: " + e));
}

function geocodeLatLng(geocoder, latlng) {
    geocoder.geocode({ location: latlng })
        .then((response) => {
            if (response.results[0]) {
                const res = response.results[0];
                console.log(res.address_components);
                $('#coor-guess-place').html("You picked: " + res.formatted_address);
            } else {
                console.error("Error");
            }
        }
        ).catch((e) => console.error("Error: " + e));
}

function processSVS({data}) {
    panorama.setPano(data.location.pano);
    panorama.setPov({
        heading: 0,
        pitch: 0
    });
    panorama.setVisible(true);
}

function initMap() {
    const elevator = new google.maps.ElevationService();
    const geocoder = new google.maps.Geocoder();

    map = new google.maps.Map(document.getElementById('new-map'), {
        center: viewLatLng,
        zoom: 3,
        disableDefaultUI: true,
        fullScreenControl: false,
        scrollWheel: false,
        zoomControl: true,
    });

    panorama = new google.maps.StreetViewPanorama(
        document.getElementById('pano-handler'), {
            position: baseLatLng,
            disableDefaultUI: true
        }
    );

    map.addListener('click', (mapsMouseEvent) => {
        var post = mapsMouseEvent.latLng;
        const userMarker = new google.maps.Marker({
            position: post,
            map,
            draggable: false,
            animation: google.maps.Animation.DROP,
        });
        var post_object = post.toJSON();
        coords.unshift(post_object);
        setTimeout(function () {
            userMarker.setMap(null);
            delete userMarker;
        }, 5000);
        $('#coor-text').html(`Coordinates: ${coords[0].lat}, ${coords[0].lng}`);
        geocodeLatLng(geocoder, post);
        displayLocationElevation(post, elevator);

        var distance = calculateDistance(baseLatLng, post_object);
        $('#distance-from-home').html("Distance from home: " + distance.toFixed(2) + " units <not yet done>.");

        $('#submit-button').click(function() {
            var points = applyPoints(distance);
            console.log("RESULT: " + points);
            totalScore += points;
            totalRounds++;
            $('#avg-points').html("Average points so far: " + (totalScore / totalRounds).toFixed(2) + " (out of " + totalRounds + " games played).");
        });
    });
    
    svs = new google.maps.StreetViewService();
    svs.getPanoramaByLocation({
            location: new google.maps.LatLng(baseLatLng),
            radius: 2000,
            preference: new google.maps.StreetViewPreference.NEAREST,
            source: new google.maps.StreetViewSource.OUTDOOR,
        }).then(processSVS).catch((e) => console.error("Street View not found! Error: " + e)
    );
}