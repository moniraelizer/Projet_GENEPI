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


/////////////////// fetch ///////////////////

function getColor(p) {
    return p > 1.73 ? '#005a32' :
    p > 1.1 ? '#238b45' :
        p > 0.75 ? '#41ab5d' :
            p > 0.47 ? '#74c476' :
                p > 0.27 ? '#a1d99b' :
                    p > 0.13? '#c7e9c0' :
                        '#edf8e9';
}

function style(features) {
    return {
        fillColor: getColor(features.properties.dens_mvt),
        weight: 0.5,
        opacity: 0.4,
        color: 'white',
        dashArray: '10',
        fillOpacity: 1
    };
}

fetch('mvtterrain', { credentials: 'include' })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        mvt(data);
    });

function mvt(donnees) {
    var mvtterra = L.geoJson(donnees, {
        style: style,
        onEachFeature: function (feature, mvtt) {
            mvtt.bindTooltip(feature.properties.nom_com + '<br>' +
             "Densité d'évènement (km²) : " + feature.properties.dens_mvt.substring(0,4)+ "<br>" + 
            "Nombre de signalement : " + feature.properties.count);
        }
    });
 //   mvtterra.addTo(map);

/////// heatmap///////


    fetch('mvtterrainpt', { credentials: 'include' })
        .then(response => response.json())
        .then(datapt => {
            console.log(datapt);
            mvtpt(datapt);
        });

    function mvtpt(datamvt) {
        var mvtpt = datamvt
        var raw = [];

        for (var i = 0; i < mvtpt.features.length; i++) {
            var tmp = [];
            tmp[0] = mvtpt.features[i].geometry.coordinates[1];
            tmp[1] = mvtpt.features[i].geometry.coordinates[0];
            tmp[2] = mvtpt.features[i].properties.count;
            //console.log(tmp);
            raw.push(tmp);
        }
        var heat_map = L.heatLayer((raw), {
            minOpacity: 0.6,
            maxZoom: 12,
            max: 10.0,
            radius: 14,
            blur: 16
        });
      //  map.addLayer(heat_map);

//////////// timeline ///////////////

        fetch('mvtterrainpt', { credentials: 'include' })
            .then(response => response.json())
            .then(datatim => {
                console.log(datatim);
                mvttime(datatim);
            });
        function mvttime(mvttimedat) {

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

            var mvt_timeline = L.timeline(mvttimedat, {
                getInterval: getInterval,
                pointToLayer: function (mvt_pt, latlng) {
                    //console.log("ok");
                    //var hue_min = 120;
                    //var hue_max = 0;
                    //var hue =
                    //(feux_pt.properties.surf_brulee_m2 / 10) * (hue_max - hue_min) + hue_min;
                    return L.circleMarker(latlng, {
                        radius: mvt_pt.properties.dens_mvt * 10,
                        color: 'brown', //"hsl(" + hue + ", 100%, 50%)",
                        fillColor: 'brown', //"hsl(" + hue + ", 100%, 50%)",
                        weight: 0.9
                    }).bindPopup(
                        mvt_pt.properties.nom_com + ' ' +
                        mvt_pt.properties.yr_mn.substring(5,7)+ '/' +
                        mvt_pt.properties.yr_mn.substring(0,4)  +
                        '<br>'+ "Nbre moyen par km² : " + Number(mvt_pt.properties.dens_mvt).toFixed(2)
                        //'<a href="' + feux_pt.properties["NOM_COM"] + '">click for more info</a>'
                        );
                },
            }).addTo(map);

            slider.addTimelines(mvt_timeline);

////////// departement /////////////

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

                var baseMaps = {
                    "Satellite": ign,
                    "Open Street Map": osm,
                    "Terrain": stamen_terrain
                }
                var overlayLayers = {
                    "Département": depart,
                    "Densité communale": mvtterra,
                    "Densité d'évènement": heat_map,
                    "Frise chronologique": mvt_timeline,

                };
                L.control.layers(baseMaps, overlayLayers, { collapsed: false }).addTo(map);
            }
        }
    }
}

//////////////// panneau de contrôle ////////////////
////// zoom //////

L.control.zoom({
    position: 'topright'
}).addTo(map);


///// géocoder/////
L.Control.geocoder().addTo(map);

/// position ////
L.geolet({ position: 'topright' }).addTo(map);


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

//////// echelle //////////

L.control.scale({ position: "topright" }).addTo(map);

/////sidebar/////

var sidebar = L.control.sidebar('sidebar').addTo(map);
