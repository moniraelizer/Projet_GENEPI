var map = L.map('map', {
    minZoom: 2, zoomControl: false
});
var osmUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
var osmAttrib = 'Map data © OpenStreetMap contributors';
var osm = new L.TileLayer(osmUrl, { attribution: osmAttrib }).addTo(map);
map.setView([45.5, 4.5], 7);

var ign = L.tileLayer('https://wxs.ign.fr/choisirgeoportail/geoportail/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/jpeg&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}');
ign.addTo(map);

var stamen_terrain = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.{ext}', {
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    subdomains: 'abcd',
    minZoom: 0,
    maxZoom: 18,
    ext: 'png'
});


///////////////////pour les couches geoserver ////////////////:
////dep////

function styleDEP_ARA(feature) {
    return {
        fillColor: 'white',
        weight: 1,
        opacity: 0.5,
        color: 'black',
        dashArray: '3',
        fillOpacity: 0.1
    }
};
fetch('dep', { credentials: 'include' })
    .then(response => response.json())
    .then(dat => {
        console.log(dat);
        departement(dat);
    });

function departement(depdo) {
    var depart = L.geoJson(depdo, {
        style: styleDEP_ARA,
        //   onEachFeature: function (feature, gaspaa) {
        //    gaspaa.bindTooltip(feature.properties.nombre_cat);
    });
    depart.addTo(map);

    ////////// densite ////////
    function getColor(p) {
        return p > 25 ? '#a63603' :
            p > 15 ? '#b55427' :
                p > 10 ? '#c4734c' :
                    p > 7 ? '#d29270' :
                        p > 4 ? '#e1b095' :
                            p > 2 ? '#f0cfba' :
                                '#feedde';
    }

    function style(features) {
        return {
            fillColor: getColor(features.properties.nb_catnat),
            weight: 0.5,
            opacity: 0.4,
            color: 'white',
            dashArray: '10',
            fillOpacity: 1
        };
    }

    fetch('gaspdensi', { credentials: 'include' })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            gasp(data);
        });

    function gasp(donnees) {
        var gaspdat = L.geoJson(donnees, {
            style: style,
            onEachFeature: function (feature, gaspa) {
                gaspa.bindTooltip(feature.properties.nom_com + "<br>"
                    + "Nombre d'arrêtés Cat Nat : " + String(feature.properties.nb_catnat));
            }
        });


        //////////// timeline ///////////////
        function getColor(p) {
            return p == 6 ? '#e31a1c' :
                p == 5 ? '#fb9a99' :
                    p == 4 ? '#33a02c' :
                        p == 3 ? '#b2df8a' :
                            p == 2 ? '#a6cee3' :
                                p == 1 ? '#1f78b4' :
                                    '#fdbf6f';
        }

        function styletime(features) {
            return {
                fillColor: getColor(features.properties.categorie_),
                weight: 0.5,
                opacity: 0.4,
                color: 'white',
                dashArray: '10',
                fillOpacity: 1
            };
        }
        fetch('gasptemp', { credentials: 'include' })
            .then(response => response.json())
            .then(datatim => {
                console.log(datatim);
                gastempo(datatim);
            });

        function gastempo(gastime) {
            var getInterval = function (alea) {
                var start_list = alea.properties.start.split('-');
                var start = new Date(start_list[0], start_list[1]); //,start_list[2]
                var end_list = alea.properties.end.split('-');
                var end = new Date(end_list[0], end_list[1]); //,end_list[2]+1
                return {
                    start: start.setMonth(start.getMonth() - 1),
                    end: end.setMonth(end.getMonth() + 1)
                };
            };

            var slider = L.timelineSliderControl({
                duration: 100000,
                showTicks: true,
                formatOutput: function (date) {
                    return moment(date).format("MM-YYYY"); //format de date de l'affichage
                },
            });
            map.addControl(slider);

            var gasp_timeline = L.timeline(gastime, {
                getInterval: getInterval,
                style: styletime,
                onEachFeature: function (feature, layer) {
                    layer.bindPopup(feature.properties.libel)
                }
            }).addTo(map);


            slider.addTimelines(gasp_timeline);

            /////////// gestion des couches /////////////

            var baseMaps = {
                "Satellite": ign,
                "Open Street Map": osm,
                "Terrain": stamen_terrain,
            }

            var overlayLayers = {
                "Départements": depart,
                "Densité communale": gaspdat,
                "Frise chronologique": gasp_timeline,

            };
            L.control.layers(baseMaps, overlayLayers, { collapsed: false }).addTo(map);

        }
    }
}


/////////////////////////////////////////////////////
//////////////// panneau de contrôle ////////////////
//////

/////// zoom /// 

L.control.zoom({
    position: 'topright'
}).addTo(map);


///// géocoder///////////
L.Control.geocoder().addTo(map);

/// position ////
L.geolet({ position: 'topright' }).addTo(map);

/*
/// printer /// 

var printer = L.easyPrint({
    tileLayer: ign,
    position: 'topright',
    sizeModes: ['Current', 'A4Landscape', 'A4Portrait'],
    filename: 'myMap',
    exportOnly: true,
    hideControlContainer: true
}).addTo(map);

function manualPrint() {
    printer.printMap('CurrentSize', 'MyManualPrint')
};
*/
//////// echelle //////////

L.control.scale({ position: "topright" }).addTo(map);

/////sidebar

var sidebar = L.control.sidebar('sidebar').addTo(map);
