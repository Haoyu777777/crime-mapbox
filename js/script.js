// Haoyu Li

// This will let you use the .remove() function later on (always put it here first)
if (!("remove" in Element.prototype)) {
    Element.prototype.remove = function () {
        if (this.parentNode) {
            this.parentNode.removeChild(this);
        }
    };
}

mapboxgl.accessToken =
    "pk.eyJ1IjoiaHloeWh5bCIsImEiOiJjanJpNWJ3OHMwNzNnM3lta2F2aXZ6ZGE1In0.FkWAjG7JohC1g2g5liqxdA";

// set the map property, can change
let map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/mapbox/streets-v11",
    center: [-78.4773, 38.0297],
    zoom: 13,
    maxZoom: 20
});

// load data from a local json file
let data = (function () {
    let json = null;
    $.ajax({
        async: false,
        url: "src/crime_data.json",
        dataType: "json",
        success: function (data) {
            json = data;
        },
        error: function (e) {
            // callback if there's an error
            alert(e.statusText);
        }
    });
    return json;
})();

// the code should run once the data request is complete
$.when(data).done(function () {
    // load the data source and build the map, can change each display property
    map.on("load", function () {
        // add the data source to the app, can change the max zoom level
        map.addSource("crime_data", {
            type: "geojson",
            data: data,
            cluster: true,
            clusterMaxZoom: 25,
            clusterRadius: 50
        });

        // same data, for counting points, change based on filters
        map.addSource("crime_data_count", {
            type: "geojson",
            data: data
        });

        // source for neighborhood geometry of the city
        map.addSource("neighbor", {
            type: "geojson",
            data: "https://opendata.arcgis.com/datasets/c371ad0b81024822bad1147ff6bb24c4_51.geojson",
            generateId: true // to generate unique feature id for hover
        });

        // array ordered by date features of data point, easier for later use
        let dataList = data.features.sort(function (a, b) {
            let d1 = new Date(a.properties.DateReported);
            let d2 = new Date(b.properties.DateReported);
            return d2 - d1;
        });

        // build cluster layer on the map
        buildLayer(dataList);

        // build the default list in the sidebar
        buildList(dataList);

        // build the newer list based on keyword input
        filterList(dataList);
    });
});

// jquery autocomplete for user keyword input
$(function () {
    // types of crime from open data
    let crimeType = [
        "Accident - w/out Injuries",
        "Accident Private Property",
        "Accident Property Damage",
        "Accident w/Injuries",
        "Alarm - Intentional",
        "Alarm - Malfunction",
        "Alarm - True",
        "Alarm - Accidental",
        "All Other Offense",
        "Animal - Bite",
        "Animal Complaint",
        "Arson",
        "Assault Aggravated",
        "Assault Intimidation",
        "Assault Simple",
        "Assist",
        "Assist Agency - Arrest/warrant",
        "Assist Agency - Backup/Assist",
        "Assist Agency - Other",
        "Assist Citizen - Medical",
        "Assist Citizen - Mental/TDO/ECO",
        "Assist Citizen - Misc",
        "Assist Citizen - Welfare Check",
        "Assisted on Prev Reported",
        "Attemped Suicide",
        "Bad Check",
        "Bomb Threat",
        "Burglary",
        "Child Ab - Contr to Delinquency",
        "Child Abuse",
        "Civil Problem",
        "Comm Relations Initiative - CRI",
        "Computer Crime",
        "Crime Prevent Initiative - CPI",
        "Crisis Assessment",
        "Curfew/Loitering/Vagrancy",
        "Death Investigation - DOA",
        "Disorderly Conduct",
        "Disturbance - Non Domestic",
        "Domestic Disturbance",
        "Driving Under the Influence",
        "Drug Equipment Violation",
        "Drug Investigation",
        "Drug/Narcotics Violation",
        "Drunkeness DIP",
        "Embezzelment",
        "Extortion/Blackmail",
        "False Report of Crime",
        "Family Offense - Non-Violent",
        "Field Interview",
        "Fire Alarm - No Fire",
        "Fires Not Arson",
        "Fireworks Violation",
        "Forgery/Counterfeiting",
        "Found/Recovered Property",
        "Fraud-credit card",
        "Fraud-false pretense",
        "Fraud-impersonation",
        "Fraud-welfare",
        "Fraud-wire fraud",
        "Harassment",
        "Hit and Run",
        "Identity Theft",
        "Impersonating a Police Officer",
        "Juvenile Investigation",
        "Kidnap/Abduction",
        "Larceny - All Other",
        "Larceny - From Coin Oper Device",
        "Larceny - From Motor Vehicle",
        "Larceny - Of Veh Parts/Access",
        "Larceny - Pocket Picking",
        "Larceny - Purse Snatching",
        "Larceny - Shoplifitng",
        "Larceny - Theft from Building",
        "Liquor Law Violation",
        "Littering/Illegal Dumping",
        "Lost/FoundProperty",
        "Misc - Criminal Call",
        "Misc - Non-Criminal Call",
        "Missing Person-adult",
        "Missing Person-juvenile",
        "Motor Vehicle Theft",
        "Narcotics",
        "Noise Complaint",
        "Offense",
        "Open Door/Window",
        "Phone Calls - Annoying",
        "Phone Calls - Threat or Obscene",
        "Pornography",
        "Problem Solving Project - PSP",
        "Prostitution",
        "Prostitution-assisting/promoting",
        "Prowler - Peeping  Tom",
        "Robbery - Armed",
        "Robbery - Strong Arm",
        "Robbery/Conversion",
        "Runaway",
        "Shots Fired/Illegal Hunting",
        "Solicitation illegal w/o permit",
        "Stalking",
        "Stolen Property Offenses",
        "Stop w/o Search/Frisk",
        "Stop w/Search/Frisk",
        "Suicide Investigation",
        "Suspicious Activity",
        "Suspicious Person",
        "Suspicious Vehicle",
        "Tactical Crime Initiative - TCI",
        "Towed Vehicle",
        "Traffic - Traffic Hazard",
        "Traffic Stops",
        "Trespass",
        "Unauthorized Use of Motor Veh",
        "Vandalism",
        "Warrant Service",
        "Weapons Violations"
    ];

    // autocomplete
    $("#crimeType").autocomplete({
        source: crimeType,
        autoFocus: true
    });
});

// format time to yyyy-MM-dd
function formatDate(date) {
    let d = new Date(date),
        month = "" + (d.getMonth() + 1),
        day = "" + d.getDate(),
        year = d.getFullYear();
    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;
    return [year, month, day].join("-");
}

// initialize jquery time slider to select time range, from 2014-01-01 (earliest record) to current date
$(function () {
    $("#timeSelector").slider({
        range: true,
        animate: "fast",
        min: new Date("2014-01-01").getTime(),
        max: new Date().getTime(),
        values: [new Date("2014-01-01").getTime(), new Date().getTime()],
        slide: function (event, ui) {
            let start = formatDate(new Date(ui.values[0]));
            let end = formatDate(new Date(ui.values[1]));
            $("#start").val(start);
            $("#end").val(end);
        }
    });

    // initialize the date input
    $("#start").val(formatDate(new Date($("#timeSelector").slider("values", 0))));
    $("#end").val(formatDate(new Date($("#timeSelector").slider("values", 1))));
});

// change the slider when start date changes
$("#start").change(function () {
    let startTime = new Date($(this).val());
    $("#timeSelector").slider("values", 0, startTime);
});

// change the slider when end date changes
$("#end").change(function () {
    let endTime = new Date($(this).val());
    $("#timeSelector").slider("values", 1, endTime);
});

// change map style and rebuild the map as setStyle reset every layer
$("#menu").change(function () {
    // add layers to this new chosen map style
    swapStyle($("input[name='style_option']:checked").val());
});

// layers on the map
let layers = [
    "neighbor-fill",
    "neighbor-count",
    "unclustered-point",
    "clusters",
    "cluster-count"
];

// display or hide neighborhood and corresponding layers, need to show certain info
$("#neighborhood").click(function () {
    displayNeighbor();
});

// helper function to display/hide neighbor depending on checkbox
function displayNeighbor() {
    if ($("#neighborhood").is(":checked")) {
        // hide all other layers
        for (let i = 0; i < layers.length; i++) {
            map.setLayoutProperty(layers[i], "visibility", "none");
        }
        // show the neighbor-fill and neighbor count layer
        map.setLayoutProperty("neighbor-fill", "visibility", "visible");
        map.setLayoutProperty("neighbor-count", "visibility", "visible");
    } else {
        // remove the current popup if exists
        let popUps = document.getElementsByClassName("mapboxgl-popup");
        if (popUps[0]) popUps[0].remove();

        // show all layers
        for (let j = 0; j < layers.length; j++) {
            map.setLayoutProperty(layers[j], "visibility", "visible");
        }
        // hide the neighbor-fill and count layer
        map.setLayoutProperty("neighbor-fill", "visibility", "none");
        map.setLayoutProperty("neighbor-count", "visibility", "none");
    }
}

// initialize clusterize list
let clusterize = new Clusterize({
    scrollId: "scrollArea",
    contentId: "listings"
});

// map features

// add geocoder to top right
map.addControl(
    new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        zoom: 14,
        marker: {
            color: "orange"
        },
        mapboxgl: mapboxgl,
        proximity: {
            longitude: -78.49,
            latitude: 38.35
        }
    })
);

// add locator to bottom right
map.addControl(new mapboxgl.GeolocateControl(), "bottom-right");

// Add zoom and rotation controls to bottom right, above the locator
map.addControl(new mapboxgl.NavigationControl(), "bottom-right");

// show crime count when clicked the neighbor-fill layer, using turf to count
map.on("click", "neighbor-fill", function (e) {
    // neighborhood boundary
    let polygon = turf.polygon(e.features[0].geometry.coordinates);

    // array of all points available
    let pointFeatures = map.getSource("crime_data_count")._data;

    // get points within a polygon
    let ptsWithin = turf.pointsWithinPolygon(pointFeatures, polygon);

    // get point count
    let count = ptsWithin.features.length;

    // get the date range for crime count
    let startDate = formatDate(
        new Date(new Date($("#start").val()).getTime() + 86400000)
    );
    let endDate = formatDate(
        new Date(new Date($("#end").val()).getTime() + 86400000)
    );
    let dateRange = startDate + " -- " + endDate;

    new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(
            "<h3>Neighbor: " +
            e.features[0].properties.NAME +
            "</h3><p>Crime record: " +
            count +
            " </p><p>Date range: " +
            dateRange +
            "</p>"
        )
        .addTo(map);
});

// for hover effect
let hoveredStateId = null;

// update the feature the hove over the neighbor-fill layer
map.on("mousemove", "neighbor-fill", function (e) {
    if (e.features.length > 0) {
        if (hoveredStateId) {
            map.setFeatureState({
                source: "neighbor",
                id: hoveredStateId
            }, {
                hover: false
            });
        }
        hoveredStateId = e.features[0].id; // access the neighborhood id
        map.setFeatureState({
            source: "neighbor",
            id: hoveredStateId
        }, {
            hover: true
        });
    }
});

// When the mouse leaves the state-fill layer, update the feature state of the previously hovered feature
map.on("mouseleave", "neighbor-fill", function () {
    if (hoveredStateId != null) {
        map.setFeatureState({
            source: "neighbor",
            id: hoveredStateId
        }, {
            hover: false
        });
    }
    hoveredStateId = null;
});

// fly to individual points when clicked to see detailed info
map.on("click", "unclustered-point", function (e) {
    // get individual feature
    let features = map.queryRenderedFeatures(e.point, {
        layers: ["unclustered-point"]
    });
    let feature = features[0];

    // func to run when clicked
    flyToPoint(feature);
    createPopUp(feature);
});

// different sets of popup (for hover specifically)
let hoverPopup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false
});

// Change the cursor to a pointer and show offence when the mouse is over the unclustered-point layer
map.on("mouseenter", "unclustered-point", function (e) {
    map.getCanvas().style.cursor = "pointer";

    // create popup
    let feature = e.features[0];
    hoverPopup
        .setLngLat(feature.geometry.coordinates)
        .setText(feature.properties.Offense)
        .addTo(map);
});

// Change it back to a pointer and remove popup when it leaves
map.on("mouseleave", "unclustered-point", function () {
    map.getCanvas().style.cursor = "";

    // remove popups when left
    hoverPopup.remove();
});

// inspect and zoom in to a cluster on click, err when changed to heat map
map.on("click", "clusters", function (e) {
    let features = map.queryRenderedFeatures(e.point, {
        layers: ["clusters"]
    });
    let clusterId = features[0].properties.cluster_id;

    map
        .getSource("crime_data")
        .getClusterExpansionZoom(clusterId, function (err, zoom) {
            if (err) return;

            map.easeTo({
                center: features[0].geometry.coordinates,
                zoom: zoom
            });
        });
});

// Change the cursor for cluster layer.
map.on("mouseenter", "clusters", function () {
    map.getCanvas().style.cursor = "pointer";
});

map.on("mouseleave", "clusters", function () {
    map.getCanvas().style.cursor = "";
});

// extra feature function

// fly to and center the point, can change the zoom level
function flyToPoint(currentFeature) {
    let zoom = map.getZoom();
    zoom++; // zoom in one step
    let zoomLevel = Math.max(zoom, 16);
    map.flyTo({
        center: currentFeature.geometry.coordinates,
        zoom: zoomLevel
    });
}

// create a popup with detailed info for such point
function createPopUp(currentFeature) {
    let popUps = document.getElementsByClassName("mapboxgl-popup");

    // remove the current popup if exists
    if (popUps[0]) popUps[0].remove();

    // get local time string
    let dateString = new Date(currentFeature.properties.DateReported);
    let localTimeString = dateString.toLocaleString();

    // add diplay info on the popup
    let popup = new mapboxgl.Popup({
            closeOnClick: false
        })
        .setLngLat(currentFeature.geometry.coordinates)
        .setHTML(
            "<h3>Offense: " +
            currentFeature.properties.Offense +
            "</h3><p>ID: " +
            currentFeature.properties.IncidentID +
            " </p><p>Location: " +
            currentFeature.properties.FullAddress +
            "</p><p>Time: " +
            localTimeString +
            "</p>"
        )
        .addTo(map);
}

// build cluster layer based on the modified datalist
function buildLayer(dataList) {
    // create a correct geojson format to store data
    let modifiedSource = new Object({});
    modifiedSource.features = dataList;

    // set the new data source
    map.getSource("crime_data").setData(modifiedSource);

    // add the neighbor-fill layer to the map at the bot, and hide the layer first
    map.addLayer({
            id: "neighbor-fill",
            type: "fill",
            source: "neighbor",
            layout: {
                visibility: "none"
            },
            paint: {
                "fill-color": "rgba(200, 100, 240, 0.4)",
                "fill-outline-color": "rgba(200, 100, 240, 1)",
                "fill-opacity": [
                    "case",
                    ["boolean", ["feature-state", "hover"], false],
                    1,
                    0.5
                ]
            }
        },
        "settlement-label"
    ); // Place polygon under these labels

    // add the layer for no. of records in each neighborhood
    map.addLayer({
        id: "neighbor-count",
        type: "symbol",
        source: "crime_data_count",
        layout: {
            visibility: "none",
            "text-field": "{point_count}",
            "text-size": 15
        }
    });

    // layer for unclustered-point, i.e. single element
    map.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: "crime_data",
        filter: ["!", ["has", "point_count"]],
        paint: {
            "circle-color": "#11b4da",
            "circle-radius": 5,
            "circle-stroke-width": 1,
            "circle-stroke-color": "#fff"
        }
    });

    // add a layer for clusters
    map.addLayer({
        id: "clusters",
        type: "circle",
        source: "crime_data",
        filter: ["has", "point_count"],
        paint: {
            // Use expressions (https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-step)
            "circle-color": [
                "interpolate-hcl",
                ["linear"],
                ["get", "point_count"],
                1,
                "yellow",
                1000,
                "red"
            ],
            "circle-radius": [
                "interpolate",
                ["linear"],
                ["get", "point_count"],
                1,
                20,
                10,
                25,
                100,
                35,
                1000,
                45,
                10000,
                60
            ],
            "circle-opacity": ["interpolate", ["linear"],
                ["zoom"], 13, 1, 17, 0.5
            ]
        }
    });

    // add the layer for no. of elememys in the cluster: cluster-count
    map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "crime_data",
        filter: ["has", "point_count"],
        layout: {
            "text-field": "{point_count_abbreviated}",
            "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
            "text-size": 15
        }
    });

    // display/hide neighbor depending on checkbox
    displayNeighbor();
}

// create list for the data points based on the data
// possible imporvement: not reload the list but to hide the unnecessary info
function buildList(dataList) {
    // clear the existing datalist
    document.getElementById("listings").innerHTML = "";

    if (dataList.length) {
        // access each data point
        for (i = 0; i < dataList.length; i++) {
            let currentFeature = dataList[i];
            let prop = currentFeature.properties;

            // create html elem for each list
            let listings = document.getElementById("listings");
            let listing = listings.appendChild(document.createElement("div"));
            listing.className = "item";
            listing.id = "listing-" + i;

            // set attribute for each list
            let link = listing.appendChild(document.createElement("a"));
            link.href = "#";
            link.className = "title";
            link.dataPosition = i;
            link.innerHTML = prop.Offense;

            let details = listing.appendChild(document.createElement("div"));
            details.innerHTML =
                prop.FullAddress + " on " + new Date(prop.DateReported).toDateString();

            // href from the list to the point
            link.addEventListener("click", function (e) {
                // Update the currentFeature to the store associated with the clicked link
                let clickedListing = dataList[this.dataPosition];
                // set the value in input box
                $("#crimeType").val(clickedListing.properties.Offense);

                // 1. Fly to the point
                flyToPoint(clickedListing);
                // 2. Close all other popups and display popup for clicked store
                createPopUp(clickedListing);
                // 3. Highlight listing in sidebar (and remove highlight for all other listings)
                let activeItem = document.getElementsByClassName("active");

                if (activeItem[0]) {
                    activeItem[0].classList.remove("active");
                }
                this.parentNode.classList.add("active");
            });
        }
    }

    // refresh the list whenever its content has changed
    clusterize.refresh();
}

// correct input keyword format
function normalize(string) {
    return string.trim().toLowerCase();
}

// filter side list by user input given the list of data
function filterList(dataList) {
    // filter data list when sliding the time slider, kind of slow
    $("#timeSelector").on("slidestop", function (event, ui) {
        filterHelper(dataList);
    });

    // typewatch plugin: call the filter function after user stoped inputting
    // source https://github.com/dennyferra/TypeWatch
    $("#crimeType, #start, #end").typeWatch({
        callback: function (e) {
            filterHelper(dataList);
        },
        wait: 1000,
        highlight: true
    });
}

// helper function for filter data list
function filterHelper(dataList) {
    // get the date range for filter
    let startDate = new Date(new Date($("#start").val()).getTime() + 86400000); // lower bound is one day after the start date
    let endDate = new Date(new Date($("#end").val()).getTime() + 86400000); // upper bound is also one day after the end date
    // get the input text
    let value = normalize($("#crimeType").val());

    // filter the list according to the inputs
    let filtered = dataList.filter(function (feature) {
        let date = new Date(feature.properties.DateReported);
        let offense = normalize(feature.properties.Offense);

        // when input is found and date is within the provided range
        return startDate <= date && date <= endDate && offense.indexOf(value) > -1;
    });

    // set the ncrime_data_count source based on filtered data list
    let filteredObj = {
        type: "FeatureCollection",
        features: filtered
    };
    map.getSource("crime_data_count").setData(filteredObj);

    // populate sidebar with filtered result
    buildList(filtered);

    // remove all older layer and add the newer ones
    for (let i = 0; i < layers.length; i++) {
        map.removeLayer(layers[i]);
    }

    buildLayer(filtered);
}

// helper function to swap map style while keeping every layer, from https://github.com/mapbox/mapbox-gl-js/issues/4006
function swapStyle(styleID) {
    let currentStyle = map.getStyle();
    d3.json(
        `https://api.mapbox.com/styles/v1/mapbox/${styleID}?access_token=${
      mapboxgl.accessToken
    }`,
        newStyle => {
            newStyle.sources = Object.assign({},
                currentStyle.sources,
                newStyle.sources
            ); // ensure any sources from the current style are copied across to the new style
            let labelIndex = newStyle.layers.findIndex(el => {
                // find the index of where to insert our layers to retain in the new style
                return el.id == "waterway-label";
            });
            let appLayers = currentStyle.layers.filter(el => {
                // app layers are the layers to retain, and these are any layers which have a different source set
                return (
                    el.source &&
                    el.source != "mapbox://mapbox.satellite" &&
                    el.source != "composite"
                );
            });
            appLayers.reverse(); // reverse to retain the correct layer order
            appLayers.forEach(layer => {
                newStyle.layers.splice(labelIndex, 0, layer); // inset these layers to retain into the new style
            });
            map.setStyle(newStyle); // now setStyle
        }
    );
}